import { useEffect, useState, useRef } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import hljs from "highlight.js";
import ErrorBoundary from "./ErrorBoundary.jsx";
// Use the github dark theme for better visibility
import "highlight.js/styles/github-dark.css";

export default function MsgAssistant({ content, isStreaming = false, isError = false, images = null, imagePrompt = null, context = "chat" }) {
  const [parsedContent, setParsedContent] = useState("");
  const [processedImages, setProcessedImages] = useState([]);
  const blobUrlsRef = useRef([]);
  
  // Reference to store all timeout IDs for cleanup
  const timeoutsRef = useRef([]);

  // Register a timeout for cleanup
  const registerTimeout = (timeoutId) => {
    timeoutsRef.current.push(timeoutId);
  };

  // Handle cleanup of blob URLs and timeouts when component unmounts
  useEffect(() => {
    return () => {
      // Clean up blob URLs
      blobUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Error revoking Blob URL:", error);
        }
      });
      blobUrlsRef.current = [];

      // Clean up all timeouts
      timeoutsRef.current.forEach(id => {
        try {
          clearTimeout(id);
        } catch (error) {
          console.error("Error clearing timeout:", error);
        }
      });
      timeoutsRef.current = [];
    };
  }, []);

  // Process base64 images when they arrive
  useEffect(() => {
    try {
      if (!images) {
        setProcessedImages([]);
        return;
      }

      // Ensure images is an array
      if (!Array.isArray(images)) {
        console.error("Images prop is not an array:", images);
        setProcessedImages([]);
        return;
      }

      const newProcessedImages = images.map((image, index) => {
        try {
          // For URL strings, just pass through directly
          if (typeof image === 'string') {
            return { type: 'url', data: image };
          }

          // For base64 objects, convert to Blob URL
          if (image && typeof image === 'object' && image.b64_json) {
            try {
              // Make sure b64_json is a string
              if (typeof image.b64_json !== 'string') {
                console.error(`Invalid b64_json type for image ${index}:`, typeof image.b64_json);
                return { type: 'error', error: new Error('Invalid base64 format') };
              }

              // Check if the base64 already has a data URI prefix
              if (image.b64_json.startsWith('data:')) {
                console.log(`Image ${index} already has data URI prefix`);
                return { type: 'url', data: image.b64_json };
              }

              // Log the start of the base64 to debug
              const b64Sample = image.b64_json.substring(0, 20);
              console.log(`Processing base64 image ${index}, sample: ${b64Sample}...`);

              try {
                // Convert base64 to Blob
                const byteString = atob(image.b64_json);
                const arrayBuffer = new ArrayBuffer(byteString.length);
                const uint8Array = new Uint8Array(arrayBuffer);

                for (let i = 0; i < byteString.length; i++) {
                  uint8Array[i] = byteString.charCodeAt(i);
                }

                const blob = new Blob([arrayBuffer], { type: 'image/png' });
                const blobUrl = URL.createObjectURL(blob);

                // Store the URL for cleanup
                blobUrlsRef.current.push(blobUrl);

                console.log(`Created blob URL for image ${index}`);
                return { type: 'blob', data: blobUrl };
              } catch (decodeError) {
                console.error(`Failed to decode base64 for image ${index}:`, decodeError);

                // Fallback to direct data URI
                console.log(`Falling back to direct data URI for image ${index}`);
                return {
                  type: 'url',
                  data: `data:image/png;base64,${image.b64_json}`
                };
              }
            } catch (error) {
              console.error(`Error processing base64 image ${index}:`, error);
              return { type: 'error', error };
            }
          }

          console.warn(`Unrecognized image format for image ${index}:`, image);
          return { type: 'invalid' };
        } catch (error) {
          console.error(`Error processing image ${index}:`, error);
          return { type: 'error', error };
        }
      });

      setProcessedImages(newProcessedImages);
    } catch (error) {
      console.error("Error in image processing effect:", error);
      setProcessedImages([]);
    }
  }, [images]);
  
  useEffect(() => {
    // Create a custom renderer for code blocks
    const renderer = new marked.Renderer();
    
    // Override the code block renderer to add a copy button
    renderer.code = function(code, language) {
      const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
      const highlightedCode = hljs.highlight(code, { language: validLanguage }).value;
      
      // Generate a unique ID for each code block
      const codeBlockId = 'code-block-' + Math.random().toString(36).substr(2, 9);
      
      // Create the HTML for the code block with a copy button
      return `
        <div class="code-block-wrapper relative group">
          <div class="code-copy-button absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 text-white hover:bg-slate-600 p-1 rounded cursor-pointer" 
               onclick="copyCodeBlock('${codeBlockId}')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z"></path>
              <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"></path>
            </svg>
          </div>
          <pre><code id="${codeBlockId}" class="hljs language-${validLanguage}">${highlightedCode}</code></pre>
        </div>
      `;
    };
    
    // Configure marked with our custom renderer and highlight.js
    marked.setOptions({
      renderer: renderer,
      highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: "hljs language-",
      gfm: true, // GitHub Flavored Markdown
      breaks: true // Convert line breaks to <br>
    });
    
    // Add a global function to copy code blocks
    window.copyCodeBlock = function(blockId) {
      const codeElement = document.getElementById(blockId);
      if (codeElement) {
        const code = codeElement.textContent;
        navigator.clipboard.writeText(code)
          .then(() => {
            // Show a temporary "Copied!" tooltip
            const button = codeElement.parentElement.previousElementSibling;
            const originalHTML = button.innerHTML;
            button.innerHTML = '<span class="text-xs">Copied!</span>';
            setTimeout(() => {
              button.innerHTML = originalHTML;
            }, 1500);
          })
          .catch(err => {
            console.error('Failed to copy code: ', err);
          });
      }
    };
    
    // Parse markdown content
    const parsed = marked.parse(content);
    
    // Configure DOMPurify to allow our custom attributes and onclick handlers
    const purifyConfig = {
      ADD_ATTR: ['onclick', 'target'],
      ADD_TAGS: ['use']
    };
    
    setParsedContent(DOMPurify.sanitize(parsed, purifyConfig));
  }, [content]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error("Failed to copy content to clipboard", err);
    }
  };

  return (
    <div className="flex bg-slate-100 px-4 py-8 dark:bg-slate-900 sm:px-6">
      <img
        className="mr-2 flex h-8 w-8 rounded-full sm:mr-4"
        src="https://dummyimage.com/256x256/354ea1/ffffff&text=A"
        alt="Assistant"
      />

      <div className="flex w-full flex-col items-start lg:flex-row lg:justify-between">
        <div className="max-w-3xl text-sm sm:text-base">
          {content === "..." ? (
            <div className="flex items-center space-x-2 prose prose-slate max-w-none dark:prose-invert py-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
          ) : (
            <div
              className={`markdown-content space-y-4 ${
                isStreaming ? 'border-l-4 border-blue-500 pl-2' : 
                isError ? 'border-l-4 border-red-500 pl-2 text-red-500' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          )}
          

          {/* Safe image rendering using processed images */}
          {processedImages.length > 0 && (
            <div className="mt-4">
              {imagePrompt && (
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">{imagePrompt}</p>
              )}

              <div className="grid grid-cols-1 gap-4">
                {processedImages.map((processedImage, index) => {

                  // Handle different image types
                  switch (processedImage.type) {
                    case 'url':
                      return (
                        <div key={index} className="border rounded overflow-hidden bg-white dark:bg-slate-800">
                          <div className="aspect-w-16 aspect-h-9 relative bg-slate-100 dark:bg-slate-700">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-slate-500 dark:text-slate-400">Loading image...</span>
                            </div>
                            <ErrorBoundary>
                              <img
                                src={processedImage.data}
                                alt="Generated image"
                                className="relative z-10 w-full h-auto object-contain min-h-[200px]"
                                loading="eager" /* Changed from lazy to eager */
                                onLoad={(e) => {
                                  console.log(`Assistant image URL ${index} loaded successfully`);
                                  // Clear any timeout when image loads successfully
                                  if (e.target.dataset.timeoutId) {
                                    clearTimeout(parseInt(e.target.dataset.timeoutId));
                                    delete e.target.dataset.timeoutId;
                                  }
                                }}
                                ref={(imgEl) => {
                                  if (imgEl) {
                                    console.log(`Assistant image URL ${index} element created`);
                                    // Set a timeout to handle stalled image loading
                                    const timeoutId = setTimeout(() => {
                                      console.warn(`Assistant image URL ${index} load timed out`);
                                      // Replace with error message if still loading after timeout
                                      if (!imgEl.complete) {
                                        const container = imgEl.parentNode;
                                        if (container) {
                                          container.innerHTML = '<div class="p-3 text-red-500">Image load timed out</div>';
                                        }
                                      }
                                    }, 10000); // 10 second timeout

                                    // Store the timeout ID both in the element and for component cleanup
                                    imgEl.dataset.timeoutId = timeoutId.toString();
                                    registerTimeout(timeoutId);
                                  }
                                }}
                                onError={(e) => {
                                  console.error(`Error loading assistant image URL ${index}:`, e);
                                  // Clear any timeout when error occurs
                                  if (e.target.dataset.timeoutId) {
                                    clearTimeout(parseInt(e.target.dataset.timeoutId));
                                    delete e.target.dataset.timeoutId;
                                  }
                                  e.target.parentNode.innerHTML = '<div class="p-3 text-red-500">Failed to load image</div>';
                                }}
                              />
                            </ErrorBoundary>
                          </div>
                        </div>
                      );

                    case 'blob':
                      return (
                        <div key={index} className="border rounded overflow-hidden bg-white dark:bg-slate-800">
                          <div className="aspect-w-16 aspect-h-9 relative bg-slate-100 dark:bg-slate-700">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-slate-500 dark:text-slate-400">Loading image...</span>
                            </div>
                            <ErrorBoundary>
                              <img
                                src={processedImage.data}
                                alt="Generated image from base64"
                                className="relative z-10 w-full h-auto object-contain min-h-[200px]"
                                loading="eager" /* Changed from lazy to eager */
                                onLoad={(e) => {
                                  console.log(`Assistant blob image ${index} loaded successfully`);
                                  // Clear any timeout when image loads successfully
                                  if (e.target.dataset.timeoutId) {
                                    clearTimeout(parseInt(e.target.dataset.timeoutId));
                                    delete e.target.dataset.timeoutId;
                                  }
                                }}
                                ref={(imgEl) => {
                                  if (imgEl) {
                                    console.log(`Assistant blob image ${index} element created`);
                                    // Set a timeout to handle stalled image loading
                                    const timeoutId = setTimeout(() => {
                                      console.warn(`Assistant blob image ${index} load timed out`);
                                      // Replace with error message if still loading after timeout
                                      if (!imgEl.complete) {
                                        const container = imgEl.parentNode;
                                        if (container) {
                                          container.innerHTML = '<div class="p-3 text-red-500">Image load timed out</div>';
                                        }
                                      }
                                    }, 10000); // 10 second timeout

                                    // Store the timeout ID both in the element and for component cleanup
                                    imgEl.dataset.timeoutId = timeoutId.toString();
                                    registerTimeout(timeoutId);
                                  }
                                }}
                                onError={(e) => {
                                  console.error(`Error loading assistant blob image ${index}:`, e);
                                  // Clear any timeout when error occurs
                                  if (e.target.dataset.timeoutId) {
                                    clearTimeout(parseInt(e.target.dataset.timeoutId));
                                    delete e.target.dataset.timeoutId;
                                  }
                                  e.target.parentNode.innerHTML = '<div class="p-3 text-red-500">Failed to load image</div>';
                                }}
                              />
                            </ErrorBoundary>
                          </div>
                        </div>
                      );

                    case 'error':
                      return (
                        <div key={index} className="p-3 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded text-red-500 dark:text-red-400">
                          Error processing image: {processedImage.error?.message || 'Unknown error'}
                        </div>
                      );

                    case 'invalid':
                    default:
                      return (
                        <div key={index} className="p-3 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded text-red-500 dark:text-red-400">
                          Invalid image format detected
                        </div>
                      );
                  }
                })}
              </div>
            </div>
          )}

          
          {isStreaming && (
            <div className="text-blue-600 text-xs mt-2 font-semibold animate-pulse">
              Streaming...
            </div>
          )}
        </div>
        
        {/* Only show copy button if not in image context */}
        {context !== "image" && (
          <div className="mt-4 flex flex-row justify-start gap-x-2 text-slate-500 lg:mt-0">
            <button
              className="hover:text-blue-600"
              type="button"
              onClick={copyToClipboard}
              title="Copy to clipboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z"></path>
                <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"></path>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
