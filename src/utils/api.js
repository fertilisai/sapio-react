// API service for different LLM providers
import { getProviderById } from "../app.config.js";
import { textToSpeech, audioPlayer } from "./textToSpeech.js";

/**
 * Sends a request to the appropriate API based on the selected provider
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} config - Configuration for the API request
 * @returns {Promise<string>} - The generated content from the API
 */
export async function sendRequest(messages, config) {
  const { 
    apiProvider, 
    apiKey, 
    model, 
    maxTokens, 
    temperature, 
    topP,
    streamingText
  } = config;

  if (!apiKey) {
    throw new Error("API key is required");
  }

  const provider = getProviderById(apiProvider);
  
  if (!provider) {
    throw new Error(`Unknown API provider: ${apiProvider}`);
  }

  // Check if this is an image generation request
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === "user" && lastMessage.content.startsWith("__IMAGE__")) {
    // Only OpenAI supports image generation
    if (provider.id !== "openai") {
      throw new Error("Image generation is only supported with OpenAI");
    }
    
    try {
      // Parse the image generation parameters
      const imageDataJson = lastMessage.content.replace("__IMAGE__", "");
      const imageData = JSON.parse(imageDataJson);
      
      // Generate images
      const result = await generateImages(imageData, apiKey);
      
      // Format the response in a special format for the UI to recognize
      console.log("Image generation successful");
      console.log("Extracted images object:", result.images);
      
      // Log detailed information about each image
      result.images.forEach((img, idx) => {
        if (typeof img === 'object') {
          console.log(`Image ${idx} is an object with keys:`, Object.keys(img));
          if (img.b64_json) {
            console.log(`Image ${idx} b64_json length:`, img.b64_json.length);
            // Log first 20 chars to check format
            console.log(`Image ${idx} b64_json start:`, img.b64_json.substring(0, 20));
          }
        } else if (typeof img === 'string') {
          console.log(`Image ${idx} is a string (URL):`, img.substring(0, 50) + '...');
        } else {
          console.log(`Image ${idx} has unexpected type:`, typeof img);
        }
      });
      
      // Validate images before formatting response
      if (!Array.isArray(result.images)) {
        console.error("Result images is not an array:", result.images);
        throw new Error("Invalid image result format: images is not an array");
      }

      if (result.images.length === 0) {
        console.warn("No valid images were returned from the API");
      }

      // Format the response in a special format for the UI to recognize
      const responseData = {
        prompt: imageData.prompt,
        images: result.images
      };

      console.log("Response data structure:", JSON.stringify({
        hasPrompt: !!responseData.prompt,
        promptLength: responseData.prompt ? responseData.prompt.length : 0,
        hasImages: !!responseData.images,
        imagesLength: responseData.images ? responseData.images.length : 0,
        imagesIsArray: Array.isArray(responseData.images)
      }));

      // Serialize the response data
      const formattedResponse = `__IMAGE_RESULT__${JSON.stringify(responseData)}`;
      console.log("Formatted response length:", formattedResponse.length);

      // Validate the formatted response
      if (!formattedResponse.startsWith("__IMAGE_RESULT__") || formattedResponse.length <= 16) {
        console.error("Invalid formatted response");
        throw new Error("Failed to create valid image result");
      }

      return formattedResponse;
    } catch (error) {
      console.error("Image generation error:", error);
      throw error;
    }
  }

  // Regular text completion request
  let response;
  switch (provider.id) {
    case "openai":
      response = await sendOpenAIRequest(messages, config);
      break;
    case "openrouter":
      response = await sendOpenRouterRequest(messages, config);
      break;
    default:
      throw new Error(`Unsupported API provider: ${provider.name}`);
  }
  
  // If streamingText is enabled and we're using OpenAI, stream the response as audio
  if (streamingText && (provider.id === "openai" || provider.id === "openrouter") && audioPlayer.initialized) {
    try {
      // Try to split the text into sentences for better streaming
      const sentences = response.match(/[^.!?]+[.!?]+/g) || [response];
      
      for (const sentence of sentences) {
        if (sentence.trim()) {
          const audioData = await textToSpeech(sentence.trim(), apiKey);
          audioPlayer.addToQueue(audioData);
        }
      }
    } catch (error) {
      console.error("Error streaming text response:", error);
      // Continue even if TTS fails - the text response will still be shown
    }
  }
  
  return response;
}

/**
 * Generates images using OpenAI's DALL-E 3 API
 * @param {Object} params - Parameters for image generation
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<Object>} - The generated images URLs
 */
export async function generateImages(params, apiKey) {
  const { prompt, size, quality, style, n, model } = params;
  
  if (!apiKey) {
    throw new Error("API key is required for image generation");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "gpt-image-1", // Use selected model or default to GPT-Image-1
        prompt,
        // DALL-E 3 only supports generating 1 image at a time
        n: model === "dall-e-3" ? 1 : (Number(n) || 1), 
        size: size || (model === "gpt-image-1" ? "auto" : "1024x1024"), // Model-specific size
        // Handle quality based on model
        ...(model === "gpt-image-1" ? { quality: quality || "auto" } : // auto, high, medium, low
           model === "dall-e-3" ? { quality: quality || "standard" } : // standard or hd
           {}), // no quality for dall-e-2
        // Style parameter is only for DALL-E 3
        ...(model === "dall-e-3" ? { style: style || "vivid" } : {}),
        // Only include response_format for dall-e-2 and dall-e-3 models, not for GPT-4 models
        ...(model !== "gpt-image-1" ? { response_format: "b64_json" } : {})
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || `Image generation failed with status ${response.status}`;
      
      if (errorData.error?.code === "content_policy_violation") {
        throw new Error("Your prompt was rejected due to safety policies. Please try a different prompt.");
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Log the raw data structure before processing
    console.log("Raw OpenAI images response data structure:", JSON.stringify({
      hasData: !!data.data,
      dataLength: data.data ? data.data.length : 0,
      dataType: data.data ? typeof data.data : 'undefined',
      isArray: data.data ? Array.isArray(data.data) : false,
      created: data.created
    }));

    if (data.data && data.data.length > 0) {
      console.log("First item keys:", Object.keys(data.data[0]));
      console.log("First item type:", typeof data.data[0]);
    }

    // Extract images from the response - handle both URL and b64_json formats with safer extraction
    const images = data.data.map((item, index) => {
      try {
        // Check what format we received
        console.log(`Image item ${index} format:`, typeof item);

        // Handle base64 encoded images
        if (item && item.b64_json) {
          console.log(`Image ${index}: Found b64_json data, length:`, item.b64_json.length);

          // Validate base64 format with a simple check (should start with valid base64 chars)
          if (typeof item.b64_json === 'string') {
            // Log a small sample of the base64
            const sample = item.b64_json.substring(0, 20);
            console.log(`Image ${index}: b64_json sample: ${sample}...`);

            // Check if the b64_json already has a data URL prefix, if so, return it directly
            if (item.b64_json.startsWith('data:')) {
              console.log(`Image ${index}: b64_json already has data URL prefix`);
              return { b64_json: item.b64_json };
            }

            // Try converting to verify if it's valid
            try {
              // Try decoding a small portion just to see if it's valid base64
              const testDecode = atob(item.b64_json.substring(0, 100));
              // If we get here, it's valid base64

              // Check if it starts with valid base64 pattern
              if (/^[A-Za-z0-9+/]/.test(item.b64_json)) {
                console.log(`Image ${index}: Valid base64 data confirmed`);
                // For better display, directly return as a data URL
                return { b64_json: `data:image/png;base64,${item.b64_json}` };
              } else {
                console.error(`Image ${index}: Invalid b64_json format, doesn't match base64 pattern`);
                return null;
              }
            } catch (error) {
              console.error(`Image ${index}: Failed to validate base64 data:`, error);
              return null;
            }
          } else {
            console.error(`Image ${index}: Invalid b64_json type:`, typeof item.b64_json);
            return null;
          }
        }
        // Handle URL format
        else if (item && item.url) {
          console.log(`Image ${index}: Found image URL:`, item.url.substring(0, 30) + '...');
          if (typeof item.url === 'string' && item.url.startsWith('http')) {
            return item.url;
          } else {
            console.error(`Image ${index}: Invalid URL format:`, item.url);
            return null;
          }
        }
        // Handle direct URL string (some API versions return this)
        else if (typeof item === 'string' && item.startsWith('http')) {
          console.log(`Image ${index}: Found direct URL string:`, item.substring(0, 30) + '...');
          return item;
        }

        // If we got here, we couldn't extract a valid image
        console.error(`Image ${index}: Could not extract valid image. Item keys:`, Object.keys(item || {}));
        return null;
      } catch (error) {
        console.error(`Image ${index}: Error processing image response:`, error);
        return null;
      }
    }).filter(Boolean); // Remove any null entries
    
    // Log the extracted images for debugging
    console.log(`Successfully extracted ${images.length} valid images from the response`);
    
    return {
      images,
      created: data.created
    };
  } catch (error) {
    console.error("Image generation API error:", error);
    throw error;
  }
}

/**
 * Sends a request to the OpenAI API
 * @param {Array} messages - Array of message objects
 * @param {Object} config - Configuration for the API request
 * @returns {Promise<string>} - The generated content
 */
async function sendOpenAIRequest(messages, config) {
  const { 
    apiKey, 
    model, 
    maxTokens, 
    temperature, 
    topP,
    streamingText
  } = config;

  try {
    // If streaming is enabled, use the streaming API
    if (streamingText) {
      return await streamOpenAIResponse(messages, config);
    }
    
    // Regular non-streaming request
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "gpt-4o",
        messages,
        max_tokens: Number(maxTokens) || 1024,
        temperature: Number(temperature) || 0.7,
        top_p: Number(topP) || 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

/**
 * Streams a response from the OpenAI API with updates to the UI
 * @param {Array} messages - Array of message objects
 * @param {Object} config - Configuration for the API request
 * @returns {Promise<string>} - The complete generated content after streaming
 */
async function streamOpenAIResponse(messages, config) {
  const { 
    apiKey, 
    model, 
    maxTokens, 
    temperature, 
    topP,
    onUpdate = () => {} // Optional callback for updating the UI
  } = config;
  
  let fullResponse = "";
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "gpt-4o",
        messages,
        max_tokens: Number(maxTokens) || 1024,
        temperature: Number(temperature) || 0.7,
        top_p: Number(topP) || 0.9,
        stream: true // Enable streaming
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    // Create a reader from the response body stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    
    // Create an event target for custom events
    const eventTarget = new EventTarget();
    document.dispatchEvent(new CustomEvent('openai-stream-start'));
    
    // Process the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Convert the chunk to text
      const chunk = decoder.decode(value);
      
      // Process each line - SSE format sends lines starting with "data: "
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            // Extract the JSON data
            const jsonData = JSON.parse(line.substring(6));
            if (jsonData.choices && jsonData.choices.length > 0) {
              const content = jsonData.choices[0].delta.content || "";
              fullResponse += content;
              
              // Dispatch update event with new content
              const updateEvent = new CustomEvent('openai-stream-update', { 
                detail: { content, fullResponse } 
              });
              document.dispatchEvent(updateEvent);
              
              // Call the onUpdate callback if provided
              if (typeof window.updateOpenAIResponse === 'function') {
                window.updateOpenAIResponse(fullResponse);
              }
            }
          } catch (e) {
            console.warn("Error parsing stream data:", e);
          }
        }
      }
    }
    
    // Signal stream completion
    document.dispatchEvent(new CustomEvent('openai-stream-end', { 
      detail: { fullResponse } 
    }));
    
    return fullResponse;
  } catch (error) {
    console.error("OpenAI Streaming Error:", error);
    throw error;
  }
}

// All provider-specific request handlers except OpenAI and OpenRouter have been removed

/**
 * Sends a request to the OpenRouter API
 * @param {Array} messages - Array of message objects
 * @param {Object} config - Configuration for the API request
 * @returns {Promise<string>} - The generated content
 */
async function sendOpenRouterRequest(messages, config) {
  const {
    apiKey,
    model,
    maxTokens,
    temperature,
    topP,
    streamingText
  } = config;

  try {
    // If streaming is enabled, use the streaming API
    if (streamingText) {
      return await streamOpenRouterResponse(messages, config);
    }

    // Regular non-streaming request
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.href, // OpenRouter requires this for attribution
        "X-Title": "Sapio Chat React UI"
      },
      body: JSON.stringify({
        model: model || "openai/gpt-4o", // Model format is provider/model
        messages,
        max_tokens: Number(maxTokens) || 1024,
        temperature: Number(temperature) || 0.7,
        top_p: Number(topP) || 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("OpenRouter API Error:", error);
    throw error;
  }
}

/**
 * Streams a response from the OpenRouter API with updates to the UI
 * @param {Array} messages - Array of message objects
 * @param {Object} config - Configuration for the API request
 * @returns {Promise<string>} - The complete generated content after streaming
 */
async function streamOpenRouterResponse(messages, config) {
  const {
    apiKey,
    model,
    maxTokens,
    temperature,
    topP,
    onUpdate = () => {} // Optional callback for updating the UI
  } = config;

  let fullResponse = "";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.href, // OpenRouter requires this for attribution
        "X-Title": "Sapio Chat React UI"
      },
      body: JSON.stringify({
        model: model || "openai/gpt-4o", // Model format is provider/model
        messages,
        max_tokens: Number(maxTokens) || 1024,
        temperature: Number(temperature) || 0.7,
        top_p: Number(topP) || 0.9,
        stream: true // Enable streaming
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    // Create a reader from the response body stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    // Create an event target for custom events
    const eventTarget = new EventTarget();
    document.dispatchEvent(new CustomEvent('openai-stream-start'));

    // Process the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Convert the chunk to text
      const chunk = decoder.decode(value);

      // Process each line - SSE format sends lines starting with "data: "
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            // Extract the JSON data
            const jsonData = JSON.parse(line.substring(6));
            if (jsonData.choices && jsonData.choices.length > 0) {
              const content = jsonData.choices[0].delta.content || "";
              fullResponse += content;

              // Dispatch update event with new content
              const updateEvent = new CustomEvent('openai-stream-update', {
                detail: { content, fullResponse }
              });
              document.dispatchEvent(updateEvent);

              // Call the onUpdate callback if provided
              if (typeof window.updateOpenAIResponse === 'function') {
                window.updateOpenAIResponse(fullResponse);
              }
            }
          } catch (e) {
            console.warn("Error parsing stream data:", e);
          }
        }
      }
    }

    // Signal stream completion
    document.dispatchEvent(new CustomEvent('openai-stream-end', {
      detail: { fullResponse }
    }));

    return fullResponse;
  } catch (error) {
    console.error("OpenRouter Streaming Error:", error);
    throw error;
  }
}

// Removed xAI/Grok API implementation