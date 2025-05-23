import MsgUser from "./MsgUser.jsx";
import MsgAssistant from "./MsgAssistant.jsx";
import InputPrompt from "./InputPrompt.jsx";
import ImageGenerationPrompt from "./ImageGenerationPrompt.jsx";
import Alert from "./Alert.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import React, { useState, useEffect, useRef } from "react";

export default function Convo({
  convo,
  newPrompt,
  loading,
  result,
  streamingResult,
  apiKey,
  api,
  streamingAudio,
  streamingText,
  streamingResponse,
  context,
  chatError,
  imageError,
}) {
  const messagesEndRef = useRef(null);
  const [systemPrompt, setSystemPrompt] = useState("");

  // Find the system message in the conversation if it exists
  useEffect(() => {
    if (convo) {
      const systemMessage = convo.find((msg) => msg.role === "system");
      if (systemMessage) {
        setSystemPrompt(systemMessage.content);
      }
    }
  }, [convo]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convo, loading]);

  // Handle system prompt changes
  const handleSystemPromptChange = (newSystemPrompt) => {
    // Update system message in conversation
    const updatedSystemPrompt = newSystemPrompt.trim();
    setSystemPrompt(updatedSystemPrompt);

    // The newPrompt function expects a user message.
    // We'll use a special format to indicate this is a system message update.
    newPrompt(`__SYSTEM__${updatedSystemPrompt}`);
  };

  // Function to parse image data from message content
  const parseImageMessage = (message) => {
    if (!message.content.startsWith("__IMAGE__")) {
      return null;
    }

    try {
      const imageDataJson = message.content.replace("__IMAGE__", "");
      return JSON.parse(imageDataJson);
    } catch (error) {
      console.error("Error parsing image message:", error);
      return null;
    }
  };

  // Function to parse image results from assistant message
  const parseImageResults = (message) => {
    if (!message || !message.content || typeof message.content !== 'string') {
      console.error("Invalid message or content:", message);
      return null;
    }

    if (!message.content.startsWith("__IMAGE_RESULT__")) {
      return null;
    }

    try {
      const imageResultJson = message.content.replace("__IMAGE_RESULT__", "");
      console.log("Raw image result JSON length:", imageResultJson?.length || 0);

      // Validate JSON format before parsing
      if (!imageResultJson || imageResultJson.trim() === "") {
        console.error("Empty image result JSON");
        return { prompt: "Image generation", images: [] };
      }

      // Parse and verify structure
      // Parse the JSON with extra debugging
      console.log("Attempting to parse JSON of length:", imageResultJson.length);
      // Log a sample of the JSON for debugging
      const jsonSample = imageResultJson.substring(0, 100);
      console.log("JSON sample:", jsonSample + (jsonSample.length < imageResultJson.length ? "..." : ""));

      const result = JSON.parse(imageResultJson);
      console.log("Parsed image result type:", typeof result);

      // Log the structure details
      if (result) {
        console.log("Result has prompt:", !!result.prompt);
        console.log("Result has images:", !!result.images);
        if (result.images) {
          console.log("Images type:", typeof result.images);
          console.log("Images is array:", Array.isArray(result.images));
          console.log("Images length:", Array.isArray(result.images) ? result.images.length : "N/A");
        }
      }

      // Validate result structure
      if (!result) {
        console.error("Null result after parsing");
        return { prompt: "Image generation", images: [] };
      }

      // Ensure prompt exists
      const safePrompt = result.prompt || "Image generation";

      // Ensure images is an array
      if (!result.images) {
        console.error("No images array in result:", result);
        return { prompt: safePrompt, images: [] };
      }

      if (!Array.isArray(result.images)) {
        console.error("Invalid images property (not an array):", result.images);
        return { prompt: safePrompt, images: [] };
      }

      // Filter out any invalid images
      const validImages = result.images.filter(img => {
        if (img === null || img === undefined) {
          return false;
        }

        if (typeof img === 'string' && img.trim() !== '') {
          return true;
        }

        if (typeof img === 'object' && img.b64_json && typeof img.b64_json === 'string') {
          return true;
        }

        console.error("Filtering out invalid image:", img);
        return false;
      });

      console.log(`Filtered ${result.images.length} images to ${validImages.length} valid images`);

      // Log details about each valid image
      validImages.forEach((img, idx) => {
        if (typeof img === 'object' && img.b64_json) {
          // For base64 images, log a sample of the data
          const sampleLength = Math.min(20, img.b64_json.length);
          console.log(`Image ${idx}: Base64 data (first ${sampleLength} chars): ${img.b64_json.substring(0, sampleLength)}...`);
        } else if (typeof img === 'string') {
          console.log(`Image ${idx}: URL: ${img.substring(0, 30)}...`);
        }
      });

      return { prompt: safePrompt, images: validImages };
    } catch (error) {
      console.error("Error parsing image results:", error);
      // Log portion of the raw content for debugging
      const sampleLength = Math.min(100, message.content.length);
      console.error(`Raw content sample (${sampleLength} chars): ${message.content.substring(0, sampleLength)}...`);
      return { prompt: "Image generation", images: [] };
    }
  };

  return (
    <>
      <div className="flex h-[100vh] flex-col">
        {!apiKey && (
          <Alert type="warning" message="Please add an API key in Settings" />
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-300 text-sm leading-6 text-slate-900 shadow-md dark:bg-slate-800 dark:text-slate-300 sm:text-base sm:leading-7">
          {convo?.map((el, key) => {
            // Skip rendering system messages
            if (el.role === "system") {
              return null;
            }

            // Handle image generation prompts
            if (el.role === "user") {
              const imageData = parseImageMessage(el);
              if (imageData) {
                return (
                  <MsgUser
                    content={imageData.prompt}
                    key={key}
                  />
                );
              }
              return <MsgUser content={el.content} key={key} />;
            }

            // Handle assistant messages (including image results)
            if (el.role === "assistant") {
              // Check if this message contains image results
              if (el.content && typeof el.content === 'string' && el.content.startsWith("__IMAGE_RESULT__")) {
                console.log("Found image result message, length:", el.content.length);

                // Use a try/catch block around the entire image rendering process
                try {
                  const imageResults = parseImageResults(el);

                  if (!imageResults) {
                    console.error("parseImageResults returned null");
                    return <MsgAssistant content={"The image generation was successful, but there was an error processing the result."} key={key} isError={true} context={context} />;
                  }

                  console.log("Parsed image results, prompt:", imageResults.prompt);
                  console.log("Images array length:", imageResults.images?.length || 0);

                  // Ensure images is an array and has valid entries
                  const validImages = Array.isArray(imageResults.images)
                    ? imageResults.images.filter(img => img !== null && img !== undefined)
                    : [];

                  if (validImages.length > 0) {
                    console.log(`Rendering ${validImages.length} valid images`);
                    // Use MsgAssistant for image display with error boundary
                    return (
                      <ErrorBoundary key={key} showError={false}>
                        <MsgAssistant
                          content=""  // Empty content for images
                          images={validImages}
                          imagePrompt={imageResults.prompt}
                          context={context}
                        />
                      </ErrorBoundary>
                    );
                  } else {
                    // No valid images found
                    console.warn("No valid images found in results");
                    return (
                      <MsgAssistant
                        content={"The image generation was successful, but no valid images were found."}
                        key={key}
                        isError={true}
                        context={context}
                      />
                    );
                  }
                } catch (error) {
                  // Catch any unexpected errors during the entire process
                  console.error("Critical error in image result rendering:", error);
                  return (
                    <MsgAssistant
                      content={"Error displaying image results: " + (error.message || "Unknown error")}
                      key={key}
                      isError={true}
                      context={context}
                    />
                  );
                }
              }
              return <MsgAssistant content={el.content} key={key} context={context} />;
            }

            return null;
          })}

          {/* Only show streaming content when actively loading and we have content */}
          {loading && streamingResponse && streamingResult ? (
            <MsgAssistant content={streamingResult} isStreaming={true} context={context} />
          ) : loading && (!streamingResponse || !streamingResult) ? (
            <MsgAssistant content="..." context={context} />
          ) : null}
          {!loading && context === "chat" && chatError && (
            <MsgAssistant content={`**Error:** ${chatError}`} isError={true} context={context} />
          )}
          {!loading && context === "image" && imageError && (
            <MsgAssistant content={`**Error:** ${imageError}`} isError={true} context={context} />
          )}
          <div ref={messagesEndRef} />
        </div>

        {context === "image" ? (
          <ImageGenerationPrompt
            onNewPrompt={newPrompt}
            apiKey={apiKey}
            api={api}
            imageSettings={JSON.parse(
              localStorage.getItem("image-settings") || "{}"
            )}
            apiError={imageError}
          />
        ) : (
          <InputPrompt
            context="chat"
            onNewPrompt={newPrompt}
            apiKey={apiKey}
            api={api}
            streamingAudio={streamingAudio}
            streamingText={streamingText}
            streamingResponse={streamingResponse}
            systemPrompt={systemPrompt}
            onSystemPromptChange={handleSystemPromptChange}
            conversationHistory={convo}
          />
        )}
      </div>
    </>
  );
}
