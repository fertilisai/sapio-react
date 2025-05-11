/**
 * Text-to-speech utility for streaming audio responses
 */

// Function to convert text to speech using OpenAI's TTS API
export async function textToSpeech(text, apiKey, voice = 'nova') {
  if (!text || !apiKey) {
    throw new Error('Text and API key are required');
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `TTS API Error: ${response.status}`);
    }
    
    // Get the audio data as an ArrayBuffer
    const audioData = await response.arrayBuffer();
    return audioData;
  } catch (error) {
    console.error("TTS API Error:", error);
    throw error;
  }
}

// Audio player class for managing TTS playback
export class AudioPlayer {
  constructor() {
    this.audioContext = null;
    this.audioQueue = [];
    this.isPlaying = false;
    this.initialized = false;
  }
  
  // Initialize the audio context (must be called after user interaction)
  init() {
    if (!this.initialized) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    }
    return this;
  }
  
  // Add audio to the queue
  async addToQueue(audioData) {
    if (!this.initialized) {
      console.warn('Audio player not initialized');
      return;
    }
    
    try {
      // Decode the audio data
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);
      this.audioQueue.push(audioBuffer);
      
      // Start playing if not already playing
      if (!this.isPlaying) {
        this.playNextInQueue();
      }
    } catch (error) {
      console.error('Error decoding audio data:', error);
    }
  }
  
  // Play the next audio in the queue
  playNextInQueue() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }
    
    this.isPlaying = true;
    const audioBuffer = this.audioQueue.shift();
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    // When this audio finishes, play the next one
    source.onended = () => {
      this.playNextInQueue();
    };
    
    source.start(0);
  }
  
  // Clear the queue and stop current playback
  clearQueue() {
    this.audioQueue = [];
    this.isPlaying = false;
    if (this.audioContext && this.audioContext.state === 'running') {
      // Create a new context to immediately stop all sound
      this.audioContext.close();
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  
  // Pause playback
  pause() {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }
  
  // Resume playback
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// Create a singleton instance
export const audioPlayer = new AudioPlayer();