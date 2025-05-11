import { memo, useState, useEffect, useRef } from 'react';
import ErrorBoundary from './ErrorBoundary.jsx';

function ImageMessage({ images, prompt, role }) {
  const [processedImages, setProcessedImages] = useState([]);

  // Reference to store all timeout IDs for cleanup
  const timeoutsRef = useRef([]);

  // Register a timeout for cleanup
  const registerTimeout = (timeoutId) => {
    timeoutsRef.current.push(timeoutId);
  };

  // Handle cleanup of timeouts when component unmounts
  useEffect(() => {
    return () => {
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

  // Avatar based on role (user or assistant)
  const avatar = role === 'user' ? (
    <svg
      className="h-6 w-6 text-slate-600 dark:text-slate-400"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0a9 9 0 0 0 5-1.5 4 4 0 0 0-4-3.5h-2a4 4 0 0 0-4 3.5 9 9 0 0 0 5 1.5Zm3-11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  ) : (
    <svg
      className="h-6 w-6 text-blue-600"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 18.5A2.5 2.5 0 0 1 7.5 20h0a2.5 2.5 0 0 1-2.4-3.2 3 3 0 0 1-.8-5.2 2.5 2.5 0 0 1 .9-3.2A2.5 2.5 0 0 1 7 5a2.5 2.5 0 0 1 5 .5m0 13v-13m0 13a2.5 2.5 0 0 0 4.5 1.5h0a2.5 2.5 0 0 0 2.4-3.2 3 3 0 0 0 .9-5.2 2.5 2.5 0 0 0-1-3.2A2.5 2.5 0 0 0 17 5a2.5 2.5 0 0 0-5 .5m-8 5a2.5 2.5 0 0 1 3.5-2.3m-.3 8.6a3 3 0 0 1-3-5.2M20 10.5a2.5 2.5 0 0 0-3.5-2.3m.3 8.6a3 3 0 0 0 3-5.2"
      />
    </svg>
  );

  // Process images safely
  useEffect(() => {
    try {
      if (!images || !Array.isArray(images)) {
        console.error("Images is not an array:", images);
        setProcessedImages([]);
        return;
      }

      console.log("Processing images array:", images);

      const processed = images.map((image, index) => {
        try {
          // For direct URL strings
          if (typeof image === 'string') {
            console.log(`Image ${index} is a URL string:`, image.substring(0, 30) + '...');
            return { index, imgSrc: image, valid: true, type: 'url' };
          }

          // For base64 data
          if (typeof image === 'object' && image.b64_json && typeof image.b64_json === 'string') {
            console.log(`Image ${index} is base64, length: ${image.b64_json.length}`);
            // Make sure we don't include the data: prefix if it's already there
            const base64Data = image.b64_json.startsWith('data:')
              ? image.b64_json
              : `data:image/png;base64,${image.b64_json}`;

            return { index, imgSrc: base64Data, valid: true, type: 'base64' };
          }

          // Handle other cases
          console.error(`Invalid image format for image ${index}:`, image);
          return { index, valid: false, error: new Error("Invalid image format") };
        } catch (error) {
          console.error(`Error processing image ${index}:`, error);
          return { index, valid: false, error };
        }
      });

      console.log(`Processed ${processed.length} images, valid count:`,
        processed.filter(img => img.valid).length);

      setProcessedImages(processed);
    } catch (error) {
      console.error("Error processing images array:", error);
      setProcessedImages([]);
    }
  }, [images]);

  return (
    <div className="border-b border-slate-300 py-6 dark:border-slate-700">
      <div className="container mx-auto max-w-5xl">
        <div className="flex">
          <div className="mr-4 flex-none py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-700">
              {avatar}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="space-y-4">
              <div className="font-medium text-slate-700 dark:text-slate-200">
                {role === 'user' ? 'You' : 'Assistant'}
              </div>
              {prompt && (
                <div className="prose prose-slate max-w-none dark:prose-invert mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">{prompt}</p>
                </div>
              )}

              <ErrorBoundary>

                {processedImages.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {processedImages.map(({ index, imgSrc, valid, error, type }) => {

                      if (!valid) {
                        return (
                          <div key={index} className="text-red-500 p-4 border border-red-300 rounded bg-red-50 dark:bg-red-900/20">
                            Error loading image: {error?.message || "Invalid format"}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={index}
                          className="overflow-hidden rounded-md border border-slate-300 dark:border-slate-700 hover:shadow-lg transition-shadow bg-white dark:bg-slate-800"
                        >
                          <ErrorBoundary>
                            <a
                              href={imgSrc}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <div className="relative">
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                                  <span className="text-slate-500 dark:text-slate-400">Loading...</span>
                                </div>
                                <img
                                  src={imgSrc}
                                  alt={`Generated image ${index + 1}: ${prompt || 'Generated image'}`}
                                  className="relative z-10 w-full h-auto object-cover min-h-[200px]"
                                  loading="eager" /* Changed from lazy to eager */
                                  onLoad={(e) => {
                                    console.log(`Image ${index} loaded successfully`);
                                    // Clear any timeout when image loads successfully
                                    if (e.target.dataset.timeoutId) {
                                      clearTimeout(parseInt(e.target.dataset.timeoutId));
                                      delete e.target.dataset.timeoutId;
                                    }
                                  }}
                                  ref={(imgEl) => {
                                    if (imgEl) {
                                      console.log(`Image ${index} element created`);
                                      // Set a timeout to handle stalled image loading
                                      const timeoutId = setTimeout(() => {
                                        console.warn(`Image ${index} load timed out`);
                                        // Replace with error image if still loading after timeout
                                        if (!imgEl.complete) {
                                          imgEl.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23f56565' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E";
                                        }
                                      }, 10000); // 10 second timeout

                                      // Store the timeout ID both in the element and for component cleanup
                                      imgEl.dataset.timeoutId = timeoutId.toString();
                                      registerTimeout(timeoutId);
                                    }
                                  }}
                                  onError={(e) => {
                                    console.error(`Error loading image ${index}:`, e);
                                    // Clear any timeout when error occurs
                                    if (e.target.dataset.timeoutId) {
                                      clearTimeout(parseInt(e.target.dataset.timeoutId));
                                      delete e.target.dataset.timeoutId;
                                    }
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23f56565' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E";
                                  }}
                                />
                              </div>
                            </a>
                          </ErrorBoundary>
                        </div>
                      );
                    })}
                  </div>
                )}

              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ImageMessage);