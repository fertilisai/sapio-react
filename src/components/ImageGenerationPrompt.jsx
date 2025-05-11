import { useState, useRef } from "react";

export default function ImageGenerationPrompt({ onNewPrompt, apiKey, api, imageSettings, apiError }) {
  const [prompt, setPrompt] = useState("");
  
  const inputRef = useRef(null);
  
  // Check if OpenAI API is being used
  const isOpenAI = api === "openai" && apiKey;
  
  // Get model first since other defaults depend on it
  const { model = "gpt-image-1" } = imageSettings || {};
  
  // Get image settings from props or use model-specific defaults
  const {
    imageStyle = "vivid",
    numberOfImages = 1,
    // Set default quality based on model
    imageQuality = model === "gpt-image-1" ? "auto" : 
                  model === "dall-e-2" ? "standard" : "standard"
  } = imageSettings || {};
  
  // Set default size based on model
  const {
    imageSize = model === "gpt-image-1" ? "auto" : 
               model === "dall-e-2" ? "1024x1024" : "1024x1024"
  } = imageSettings || {};
  
  // Local state for error handling
  const [error, setError] = useState("");

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError("");
    
    if (!prompt.trim()) {
      setError("Please enter a prompt for image generation.");
      return;
    }
    
    if (!isOpenAI) {
      setError("Image generation is only available with the OpenAI provider.");
      return;
    }
    
    // Format the special command for image generation with model-specific parameters
    const imageCommand = JSON.stringify({
      type: "image_generation",
      prompt: prompt.trim(),
      size: imageSize,
      // Quality parameter varies by model
      ...(model === "gpt-image-1" ? { quality: imageQuality } : // auto, high, medium, low
         model === "dall-e-3" ? { quality: imageQuality } : // standard or hd
         {}), // no quality for dall-e-2
      // Style parameter is only for DALL-E 3
      ...(model === "dall-e-3" ? { style: imageStyle } : {}),
      // DALL-E 3 only supports generating 1 image at a time
      n: model === "dall-e-3" ? 1 : numberOfImages,
      model: model
    });
    
    // Send the command to parent component
    onNewPrompt(`__IMAGE__${imageCommand}`);
    
    // Clear the prompt
    setPrompt("");
    
    // Focus the input field after sending
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };
  
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full border-t border-slate-300 bg-slate-200 p-2 dark:border-slate-700 dark:bg-slate-900"
    >
      {error && (
        <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded mb-2 shadow-sm">
          {error}
        </div>
      )}
      <div className="flex w-full items-center">
        <label htmlFor="image-prompt" className="sr-only">
          Describe the image to generate
        </label>

        <input
          ref={inputRef}
          type="text"
          id="image-prompt"
          className="mx-2 flex min-h-full w-full rounded-md border border-slate-300 bg-slate-50 p-2 text-base text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-400 dark:focus:border-blue-600 dark:focus:ring-blue-600"
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={!isOpenAI}
        />

        {/* Info text showing current settings */}
        <div className="hidden sm:flex sm:items-center text-xs text-slate-500 dark:text-slate-400 mx-2">
          {isOpenAI && (
            <span title="Current image settings">
              {model !== "gpt-image-1" && (
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-md mr-2">
                  {model}
                  {model === "dall-e-3" && ` (${imageStyle})`}
                </span>
              )}
              {model !== "dall-e-3" && numberOfImages > 1 ? `${numberOfImages}x ` : ''}
              {imageSize !== "auto" && imageSize.replace('x', '×')}
              {imageQuality !== "auto" && imageQuality !== "standard" && ` • ${imageQuality}`}
            </span>
          )}
        </div>

        {/* Submit button */}
        <div>
          <button
            className={`inline-flex ${
              isOpenAI
                ? "hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-600"
                : "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50"
            } sm:p-2`}
            type="submit"
            disabled={!isOpenAI || !prompt.trim()}
            title={!isOpenAI ? "Image generation requires OpenAI provider" : "Generate image"}
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
            <span className="sr-only">Generate image</span>
          </button>
        </div>
      </div>
      
      {/* Warning message if OpenAI is not selected */}
      {!isOpenAI && (
        <div className="absolute top-0 left-0 right-0 mt-2 text-center text-sm text-red-500 dark:text-red-400 bg-slate-200 dark:bg-slate-900 p-1">
          Note: Image generation requires the OpenAI provider and a valid API key.
        </div>
      )}
    </form>
  );
}