import { useState, useEffect, useRef } from "react";
import { audioPlayer, textToSpeech } from "../utils/textToSpeech.js";
import SystemPromptModal from "./SystemPromptModal.jsx";

export default function InputPrompt({ onNewPrompt, apiKey, api, streamingAudio, streamingText, streamingResponse, systemPrompt, onSystemPromptChange, conversationHistory }) {
  const [prompt, setPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1); // -1 means current input, not navigating history
  
  // Extract user prompts from conversation history for navigation
  const [promptHistory, setPromptHistory] = useState([]);
  const [savedCurrentPrompt, setSavedCurrentPrompt] = useState(""); // Store current prompt when navigating
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const silenceTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const inputRef = useRef(null);
  
  // Check if OpenAI API is being used
  const isOpenAI = api === "openai" && apiKey;
  
  // Check if audio recording should be available - only for OpenAI provider
  const showAudioRecording = isOpenAI && streamingAudio;
  
  // Extract user messages from conversation history and update promptHistory
  useEffect(() => {
    if (conversationHistory) {
      // Extract only user messages, not system or assistant ones
      const userMessages = conversationHistory
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content);
      
      // Keep only the last 10 messages
      const recentPrompts = userMessages.slice(-10);
      
      setPromptHistory(recentPrompts);
    }
  }, [conversationHistory]);
  
  // Handle keyboard navigation for history
  const handleKeyDown = (e) => {
    // Up arrow - navigate backward in history
    if (e.key === 'ArrowUp') {
      e.preventDefault(); // Prevent cursor from moving to start of input
      
      if (historyIndex === -1) {
        // First time pressing up, save current input
        setSavedCurrentPrompt(prompt);
      }
      
      if (historyIndex < promptHistory.length - 1) {
        // Move back in history (newer to older)
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setPrompt(promptHistory[promptHistory.length - 1 - newIndex]);
      }
    } 
    // Down arrow - navigate forward in history
    else if (e.key === 'ArrowDown') {
      e.preventDefault(); // Prevent cursor from moving to end of input
      
      if (historyIndex > 0) {
        // Move forward in history (older to newer)
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setPrompt(promptHistory[promptHistory.length - 1 - newIndex]);
      } 
      else if (historyIndex === 0) {
        // Reached the end of history, restore current input
        setHistoryIndex(-1);
        setPrompt(savedCurrentPrompt);
      }
    }
    // Escape - exit history navigation and restore current input
    else if (e.key === 'Escape' && historyIndex !== -1) {
      setHistoryIndex(-1);
      setPrompt(savedCurrentPrompt);
    }
  };
  
  // Reset history index when sending a message
  useEffect(() => {
    setHistoryIndex(-1);
  }, [conversationHistory?.length]);
  
  // Handle opening the system prompt modal
  const openSystemPromptModal = () => {
    setIsModalOpen(true);
  };

  // Initialize MediaRecorder and handle recording
  const startRecording = async () => {
    try {
      // Request audio with echo cancellation and noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Reset chunks
      chunksRef.current = [];
      
      // Create MediaRecorder instance with audio/webm MIME type 
      // and specify timeslice to get data periodically
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      // Listen for data available event
      mediaRecorder.ondataavailable = (event) => {
        console.log("Data available:", event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = async () => {
        console.log("MediaRecorder stopped, processing audio...");
        if (chunksRef.current.length === 0) {
          console.warn("No audio data recorded");
          return;
        }
        
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log("Audio blob created, size:", audioBlob.size);
        setAudioBlob(audioBlob);
        
        // Immediately process the audio with Whisper API
        await processAudioWithWhisper(audioBlob);
        
        // Clean up stream tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording with timeslice of 1000ms to get data periodically
      mediaRecorder.start(1000);
      console.log("Recording started");
      setIsRecording(true);
      
      // Setup silence detection
      setupSilenceDetection(stream);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Error accessing microphone. Please check your permissions.");
    }
  };
  
  // Set up silence detection
  const setupSilenceDetection = (stream) => {
    const audioContext = new AudioContext();
    const audioSource = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    audioSource.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    let silenceStart = null;
    const SILENCE_THRESHOLD = 5; // Lower threshold to better detect silence
    const SILENCE_DURATION = 2000; // 2 seconds of silence
    
    // Use a ref to track if we're still recording
    const isStillRecording = { current: true };
    
    const checkSilence = () => {
      // Check if still recording and the component hasn't unmounted
      if (!isStillRecording.current || !mediaRecorderRef.current) return;
      
      try {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        console.log("Audio level:", average); // Debug logging
        
        // Check if below threshold (silence)
        if (average < SILENCE_THRESHOLD) {
          if (!silenceStart) {
            console.log("Silence started");
            silenceStart = Date.now();
          } else if (Date.now() - silenceStart > SILENCE_DURATION) {
            console.log("Silence threshold reached, stopping recording");
            // Stop recording after silence duration
            isStillRecording.current = false;
            stopRecording();
            return;
          }
        } else {
          // Reset silence start time if there's sound
          silenceStart = null;
        }
        
        // Continue checking for silence
        silenceTimeoutRef.current = setTimeout(checkSilence, 100);
      } catch (error) {
        console.error("Error in silence detection:", error);
      }
    };
    
    // Add an event listener for the actual stop event
    mediaRecorderRef.current.addEventListener('stop', () => {
      isStillRecording.current = false;
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    });
    
    // Start checking for silence
    checkSilence();
    
    // As a fallback, automatically stop after 20 seconds
    setTimeout(() => {
      if (isStillRecording.current && mediaRecorderRef.current?.state === "recording") {
        console.log("Max recording time reached, stopping");
        stopRecording();
      }
    }, 20000);
  };
  
  // Stop recording
  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        console.log("Stopping recording...");
        mediaRecorderRef.current.stop();
        
        // Clear silence detection timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      }
      
      // Update recording state even if we failed to stop the recorder
      // This prevents UI from being stuck in recording state
      setIsRecording(false);
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
    }
  };
  
  // Toggle recording state
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Process audio with Whisper API
  const processAudioWithWhisper = async (audioBlob) => {
    if (!audioBlob || !apiKey) {
      console.warn("Missing audioBlob or API key");
      return;
    }
    
    if (audioBlob.size < 100) {
      console.warn("Audio blob too small, likely no audio recorded");
      alert("No audio detected. Please try again.");
      return;
    }
    
    try {
      console.log("Sending audio to Whisper API...");
      
      // Create form data with audio file
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      formData.append("model", "whisper-1");
      formData.append("language", "en"); // Specify language for better results
      formData.append("response_format", "json");
      
      // Send to OpenAI Whisper API
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API error: ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use the raw text
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Whisper API response:", data);
      
      if (data.text) {
        setPrompt(data.text.trim());
      } else {
        console.warn("No transcription returned");
        alert("No speech detected. Please try again.");
      }
    } catch (error) {
      console.error("Whisper API Error:", error);
      alert("Error processing audio: " + error.message);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  // Initialize audio player when streaming is enabled
  useEffect(() => {
    if (streamingText && isStreaming) {
      // Initialize audio player (needs to be done after user interaction)
      audioPlayer.init();
    }
    
    return () => {
      // Clean up audio when component unmounts
      if (audioPlayer && audioPlayer.initialized) {
        audioPlayer.clearQueue();
      }
    };
  }, [streamingText, isStreaming]);
  
  // Effect to handle streaming text mode changes
  useEffect(() => {
    // If streaming is turned off, clear the audio queue
    if (!isStreaming && audioPlayer.initialized) {
      audioPlayer.clearQueue();
    }
  }, [isStreaming]);
  
  // Handle text-to-speech streaming
  const streamText = async (text) => {
    // Only stream for OpenAI API
    if (!isStreaming || !streamingText || !apiKey || api !== "openai") {
      return;
    }
    
    try {
      // Split text into sentences for more natural streaming
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      
      for (const sentence of sentences) {
        if (sentence.trim()) {
          const audioData = await textToSpeech(sentence.trim(), apiKey);
          audioPlayer.addToQueue(audioData);
        }
      }
    } catch (error) {
      console.error("Error streaming text:", error);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt) {
      // Send prompt to parent component
      onNewPrompt(prompt);
      
      // Reset history navigation
      setHistoryIndex(-1);
      setSavedCurrentPrompt("");
      
      // Clear the prompt
      setPrompt("");
      
      // If streaming is enabled, initialize the audio player
      if (streamingText && isStreaming) {
        audioPlayer.init();
      }
      
      // Focus the input field after sending a message
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  return (
    <>
      <SystemPromptModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        currentPrompt={systemPrompt || "You are a helpful assistant."}
        onSave={(newPrompt) => {
          console.log("Saving system prompt:", newPrompt);
          if (typeof onSystemPromptChange === 'function') {
            onSystemPromptChange(newPrompt);
          } else {
            console.error("onSystemPromptChange is not a function");
          }
        }}
      />
      
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center border-t border-slate-300 bg-slate-200 p-2 dark:border-slate-700 dark:bg-slate-900"
      >
        <label htmlFor="chat-input" className="sr-only">
          Enter your prompt
        </label>
        <div>
          <button
            className="hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-600 sm:p-2"
            type="button"
            onClick={(e) => {
              e.preventDefault(); // Prevent form submission
              setIsModalOpen(true); // Directly set the modal state
              console.log("Opening system prompt modal"); // Debug log
            }}
            title="Set system prompt"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M12 5l0 14"></path>
              <path d="M5 12l14 0"></path>
            </svg>
            <span className="sr-only">Set system prompt</span>
          </button>
        </div>
        <input
          ref={inputRef}
          type="text"
          id="chat-input"
          rows="1"
          className="mx-2 flex min-h-full w-full rounded-md border border-slate-300 bg-slate-50 p-2 text-base text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-400 dark:focus:border-blue-600 dark:focus:ring-blue-600"
          placeholder="Enter your prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        
        {/* Always show the microphone button, but gray it out if unavailable */}
        <div>
          <button
            type="button"
            onClick={showAudioRecording ? toggleRecording : undefined}
            className={`mr-2 ${
              showAudioRecording 
                ? `${isRecording ? "text-red-600 dark:text-red-400" : "hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-600"}`
                : "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50"
            } sm:p-2`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            disabled={isStreaming || !showAudioRecording}
            title={!showAudioRecording ? "Voice recording requires OpenAI provider" : ""}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isRecording ? (
                // Stop icon
                <>
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                  <path d="M8 8h8v8h-8z"></path>
                </>
              ) : (
                // Microphone icon
                <>
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                  <path d="M9 2m0 3a3 3 0 0 1 3 -3h0a3 3 0 0 1 3 3v5a3 3 0 0 1 -3 3h0a3 3 0 0 1 -3 -3z"></path>
                  <path d="M5 10a7 7 0 0 0 14 0"></path>
                  <path d="M8 21l8 0"></path>
                  <path d="M12 17l0 4"></path>
                </>
              )}
            </svg>
            <span className="sr-only">
              {isRecording ? "Stop recording" : "Start recording"}
            </span>
          </button>
        </div>
        
        {/* Always show the speaker button, but gray it out if unavailable */}
        <div>
          <button
            type="button"
            onClick={showAudioRecording && streamingText ? () => setIsStreaming(!isStreaming) : undefined}
            className={`mr-2 ${
              showAudioRecording && streamingText
                ? `${isStreaming ? "text-blue-600 dark:text-blue-400" : "hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-600"}`
                : "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50"
            } sm:p-2`}
            aria-label={isStreaming ? "Stop streaming audio" : "Stream response as audio"}
            disabled={isRecording || !showAudioRecording || !streamingText}
            title={!showAudioRecording ? "Voice streaming requires OpenAI provider" : (!streamingText ? "Enable streaming text in settings" : "")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M15 8a5 5 0 0 1 0 8"></path>
              <path d="M17.7 5a9 9 0 0 1 0 14"></path>
              <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5"></path>
            </svg>
            <span className="sr-only">
              {isStreaming ? "Stop streaming audio" : "Stream response as audio"}
            </span>
          </button>
        </div>
        <div>
          <button
            className="inline-flex hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-600 sm:p-2"
            type="submit"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M10 14l11 -11"></path>
              <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"></path>
            </svg>
            <span className="sr-only">Send message</span>
          </button>
        </div>
      </form>
    </>
  );
}
