import Button from "./Button.jsx";
import InputKey from "./InputKey.jsx";
import InputNum from "./InputNum.jsx";
import InputSelect from "./InputSelect.jsx";
import ToggleSwitch from "./ToggleSwitch.jsx";
import { useState, useEffect } from "react";
import {
  AI_PROVIDERS,
  getProviderById,
  getModelOptionsForProvider,
  getModelsByProviderId
} from "../app.config.js";

export default function RightSidebar({ 
  api, 
  apiKey, 
  model, 
  maxTokens, 
  temperature, 
  topP, 
  streamingAudio,
  streamingText,
  streamingResponse,
  saveSettings,
  darkMode,
  toggleDarkMode,
  // New props for context-aware settings
  context = "chat",
  imageSettings = {}
}) {
  // Local state for handling changes
  const [apiLocal, setApiLocal] = useState(api);
  const [apiKeyLocal, setApiKeyLocal] = useState(apiKey);
  const [modelLocal, setModelLocal] = useState(model);
  const [maxTokensLocal, setMaxTokensLocal] = useState(maxTokens === "256" ? "1024" : maxTokens);
  const [temperatureLocal, setTemperatureLocal] = useState(temperature);
  const [topPLocal, setTopPLocal] = useState(topP);
  const [streamingAudioLocal, setStreamingAudioLocal] = useState(streamingAudio);
  const [streamingTextLocal, setStreamingTextLocal] = useState(streamingText);
  const [streamingResponseLocal, setStreamingResponseLocal] = useState(streamingResponse);

  // Image generation settings
  const [imageSizeLocal, setImageSizeLocal] = useState(imageSettings.imageSize || "1024x1024");
  const [imageQualityLocal, setImageQualityLocal] = useState(imageSettings.imageQuality || "standard");
  const [imageStyleLocal, setImageStyleLocal] = useState(imageSettings.imageStyle || "vivid");
  const [numberOfImagesLocal, setNumberOfImagesLocal] = useState(imageSettings.numberOfImages || 1);
  const [imageModelLocal, setImageModelLocal] = useState(imageSettings.model || "gpt-image-1");
  
  // Available image model options
  const imageModels = [
    { value: "gpt-image-1", label: "GPT-Image-1 (Default)" },
    { value: "dall-e-3", label: "DALL-E 3" },
    { value: "dall-e-2", label: "DALL-E 2" }
  ];
  
  // Define size options for each model
  const gptImageSizes = [
    { value: "auto", label: "Auto (Default)" },
    { value: "1024x1024", label: "1024×1024 (Square)" },
    { value: "1536x1024", label: "1536×1024 (Landscape)" },
    { value: "1024x1536", label: "1024×1536 (Portrait)" }
  ];
  
  const dallE2Sizes = [
    { value: "256x256", label: "256×256 (Small)" },
    { value: "512x512", label: "512×512 (Medium)" },
    { value: "1024x1024", label: "1024×1024 (Large)" }
  ];
  
  const dallE3Sizes = [
    { value: "1024x1024", label: "1024×1024 (Square)" },
    { value: "1792x1024", label: "1792×1024 (Landscape)" },
    { value: "1024x1792", label: "1024×1792 (Portrait)" }
  ];
  
  // Define quality options for each model
  const gptImageQuality = [
    { value: "auto", label: "Auto (Default)" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" }
  ];
  
  const dallE3Quality = [
    { value: "standard", label: "Standard" },
    { value: "hd", label: "HD (Higher quality)" }
  ];
  
  const dallE2Quality = [
    { value: "standard", label: "Standard (Only option)" }
  ];
  
  const styleOptions = [
    { value: "vivid", label: "Vivid (Hyper-real and dramatic)" },
    { value: "natural", label: "Natural (More subtle and realistic)" }
  ];
  
  const imageCountOptions = Array.from({ length: 10 }, (_, i) => ({ 
    value: i + 1, 
    label: `${i + 1} ${i === 0 ? 'image' : 'images'}`
  }));

  // Get current provider object
  const currentProvider = getProviderById(apiLocal);
  
  // Get model options for current provider
  const modelOptions = getModelOptionsForProvider(apiLocal);

  // Update local state when props change
  useEffect(() => {
    setApiLocal(api);
    setApiKeyLocal(apiKey);
    setModelLocal(model);
    // Use 1024 as the default value if maxTokens is still at the system default of 256
    setMaxTokensLocal(maxTokens === "256" ? "1024" : maxTokens);
    setTemperatureLocal(temperature);
    setTopPLocal(topP);
    setStreamingAudioLocal(streamingAudio);
    setStreamingTextLocal(streamingText);
    setStreamingResponseLocal(streamingResponse);
    
    // Update image settings if provided
    if (imageSettings) {
      if (imageSettings.imageSize) setImageSizeLocal(imageSettings.imageSize);
      if (imageSettings.imageQuality) setImageQualityLocal(imageSettings.imageQuality);
      if (imageSettings.imageStyle) setImageStyleLocal(imageSettings.imageStyle);
      if (imageSettings.model) setImageModelLocal(imageSettings.model);
      
      // Only set numberOfImages if not using DALL-E 3 (which only supports n=1)
      if (imageSettings.numberOfImages && imageSettings.model !== "dall-e-3") {
        setNumberOfImagesLocal(imageSettings.numberOfImages);
      } else if (imageSettings.model === "dall-e-3") {
        setNumberOfImagesLocal(1); // Force to 1 for DALL-E 3
      }
    }
  }, [api, apiKey, model, maxTokens, temperature, topP, streamingAudio, streamingText, streamingResponse, imageSettings]);
  
  // Effect to handle model changes and model-specific settings
  useEffect(() => {
    // Force 1 image for DALL-E 3
    if (imageModelLocal === "dall-e-3" && numberOfImagesLocal !== 1) {
      setNumberOfImagesLocal(1);
    }
    
    // Set appropriate default size based on model
    const currentSize = imageSizeLocal;
    const currentQuality = imageQualityLocal;
    
    if (imageModelLocal === "gpt-image-1") {
      // Check if current size is valid for GPT-Image-1
      const validSizes = gptImageSizes.map(s => s.value);
      if (!validSizes.includes(currentSize)) {
        setImageSizeLocal("auto"); // Default for GPT-Image-1
      }
      
      // Check if current quality is valid for GPT-Image-1
      const validQualities = gptImageQuality.map(q => q.value);
      if (!validQualities.includes(currentQuality)) {
        setImageQualityLocal("auto"); // Default for GPT-Image-1
      }
    } else if (imageModelLocal === "dall-e-2") {
      // Check if current size is valid for DALL-E 2
      const validSizes = dallE2Sizes.map(s => s.value);
      if (!validSizes.includes(currentSize)) {
        setImageSizeLocal("1024x1024"); // Default for DALL-E 2
      }
      
      // Force standard quality for DALL-E 2
      if (currentQuality !== "standard") {
        setImageQualityLocal("standard");
      }
    } else if (imageModelLocal === "dall-e-3") {
      // Check if current size is valid for DALL-E 3
      const validSizes = dallE3Sizes.map(s => s.value);
      if (!validSizes.includes(currentSize)) {
        setImageSizeLocal("1024x1024"); // Default for DALL-E 3
      }
      
      // Check if current quality is valid for DALL-E 3
      const validQualities = dallE3Quality.map(q => q.value);
      if (!validQualities.includes(currentQuality)) {
        setImageQualityLocal("standard"); // Default for DALL-E 3
      }
    }
  }, [imageModelLocal, imageSizeLocal, imageQualityLocal, numberOfImagesLocal]);

  function handleSaveChanges() {
    const settings = {
      apiProvider: apiLocal,
      apiKey: apiKeyLocal,
      model: modelLocal,
      maxTokens: maxTokensLocal,
      temperature: temperatureLocal,
      topP: topPLocal,
      streamingAudio: streamingAudioLocal,
      streamingText: streamingTextLocal,
      streamingResponse: streamingResponseLocal
    };
    
    // Add image settings if we're in image context
    if (context === "image") {
      settings.imageSettings = {
        imageSize: imageSizeLocal,
        imageQuality: imageQualityLocal,
        imageStyle: imageStyleLocal,
        numberOfImages: imageModelLocal === "dall-e-3" ? 1 : numberOfImagesLocal,
        model: imageModelLocal
      };
    }
    
    saveSettings(settings);
  }

  function handleProviderChange(e) {
    const newProviderId = e.target.value;
    const newProvider = getProviderById(newProviderId);
    setApiLocal(newProviderId);
    
    // Reset model to appropriate default for the selected provider
    setModelLocal(newProvider.defaultModel);
    
    // Reset API key if switching providers
    if (apiKeyLocal && apiLocal !== newProviderId) {
      // Save the current key to temp variable associated with the provider
      localStorage.setItem(`${apiLocal}-key-temp`, apiKeyLocal);
      
      // Try to load previous key for the new provider
      const savedKey = localStorage.getItem(`${newProviderId}-key-temp`);
      setApiKeyLocal(savedKey || "");
    }
  }

  // Get provider options for dropdown
  const providerOptions = AI_PROVIDERS.map(provider => provider.id);

  // Helper function to get badge color class
  const getBadgeColorClass = (color) => {
    const colorMap = {
      green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      orange: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="flex flex-row-reverse w-full">
      {/* Sidebar */}
      <aside className="flex flex-none">
        <div className="relative h-screen w-[320px] overflow-y-auto border-l border-slate-300 bg-slate-50 py-8 dark:border-slate-700 dark:bg-slate-900 sm:w-60">
          <div className="mb-6 pt-2 relative text-center">
            <div className="absolute right-2 top-2">
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-slate-800 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-800 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
            <h2 className="text-xl font-medium text-slate-800 dark:text-slate-200 inline-block px-4 py-1 border-b-2 border-blue-500">Settings</h2>
          </div>

          {/* API */}
          <div className="px-4 py-4 text-slate-800 dark:text-slate-200">
            <InputSelect
              label="Provider"
              value={apiLocal}
              options={providerOptions}
              optionLabels={AI_PROVIDERS.map(provider => provider.name)}
              onChange={handleProviderChange}
            />
            <div className="relative mt-2">
              <InputKey
                label={
                  <div className="flex items-center">
                    API key
                    <span className={`ml-2 text-xs py-0.5 px-2 rounded ${getBadgeColorClass(currentProvider.badgeColor)}`}>
                      {currentProvider.name}
                    </span>
                  </div>
                }
                value={apiKeyLocal}
                placeholder={currentProvider.apiKeyPlaceholder}
                onChange={(e) => setApiKeyLocal(e.target.value)}
              />
            </div>
            <div className="px-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <p>Get your API key from <a href={currentProvider.apiConsoleUrl} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{currentProvider.apiConsoleName}</a></p>
            </div>

            {/* Model Selection */}
            <div className="mt-4">
              <InputSelect
                label={
                  <div className="flex items-center">
                    Model
                    <span className={`ml-2 text-xs py-0.5 px-2 rounded ${getBadgeColorClass(currentProvider.badgeColor)}`}>
                      {currentProvider.name}
                    </span>
                  </div>
                }
                value={modelLocal}
                options={modelOptions}
                optionLabels={getModelsByProviderId(apiLocal).map(model => model.name)}
                onChange={(e) => setModelLocal(e.target.value)}
              />
              {modelOptions.length > 0 && getModelsByProviderId(apiLocal).find(m => m.id === modelLocal)?.description && (
                <div className="px-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {getModelsByProviderId(apiLocal).find(m => m.id === modelLocal)?.description}
                </div>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="my-6 border-t border-slate-300 px-4 pt-6 pb-4 text-slate-800 dark:border-slate-700 dark:text-slate-200">
            <p className="text-center mb-4">
              <span className="px-3 py-1 text-sm uppercase text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-300 dark:border-slate-600">
                Advanced Settings
              </span>
            </p>

            
            {/* Text completion settings */}
            {context === "chat" && (
              <>
                <InputNum
                  label="Max tokens"
                  value={maxTokensLocal}
                  min="0"
                  max="4096"
                  step="128"
                  onChange={(e) => setMaxTokensLocal(e.target.value)}
                />
                <InputNum
                  label="Temperature"
                  value={temperatureLocal}
                  min="0"
                  max="2"
                  step="0.1"
                  onChange={(e) => setTemperatureLocal(e.target.value)}
                />
                <InputNum
                  label="Top P"
                  value={topPLocal}
                  min="0"
                  max="1"
                  step="0.1"
                  onChange={(e) => setTopPLocal(e.target.value)}
                />
              </>
            )}
            
            {/* Image generation settings */}
            {context === "image" && (
              <div className={apiLocal !== "openai" ? "opacity-50" : ""}>
                <div className="mb-4 mt-4 text-sm text-center">
                  {apiLocal !== "openai" && (
                    <div className="p-2 mb-3 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 rounded">
                      Image generation is only available with OpenAI
                    </div>
                  )}
                </div>
                
                <InputSelect
                  label="Image Model"
                  value={imageModelLocal}
                  options={imageModels.map(option => option.value)}
                  optionLabels={imageModels.map(option => option.label)}
                  onChange={(e) => setImageModelLocal(e.target.value)}
                  disabled={apiLocal !== "openai"}
                />
                
                <InputSelect
                  label="Image Size"
                  value={imageSizeLocal}
                  options={
                    imageModelLocal === "gpt-image-1" 
                      ? gptImageSizes.map(option => option.value) 
                      : imageModelLocal === "dall-e-2"
                        ? dallE2Sizes.map(option => option.value)
                        : dallE3Sizes.map(option => option.value)
                  }
                  optionLabels={
                    imageModelLocal === "gpt-image-1" 
                      ? gptImageSizes.map(option => option.label) 
                      : imageModelLocal === "dall-e-2"
                        ? dallE2Sizes.map(option => option.label)
                        : dallE3Sizes.map(option => option.label)
                  }
                  onChange={(e) => setImageSizeLocal(e.target.value)}
                  disabled={apiLocal !== "openai"}
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
                  Size options vary by model: 
                  {imageModelLocal === "gpt-image-1" && " auto, 1024×1024, 1536×1024, 1024×1536"}
                  {imageModelLocal === "dall-e-2" && " 256×256, 512×512, 1024×1024"}
                  {imageModelLocal === "dall-e-3" && " 1024×1024, 1792×1024, 1024×1792"}
                </div>
                
                <InputSelect
                  label="Image Quality"
                  value={imageQualityLocal}
                  options={
                    imageModelLocal === "gpt-image-1" 
                      ? gptImageQuality.map(option => option.value) 
                      : imageModelLocal === "dall-e-2"
                        ? dallE2Quality.map(option => option.value)
                        : dallE3Quality.map(option => option.value)
                  }
                  optionLabels={
                    imageModelLocal === "gpt-image-1" 
                      ? gptImageQuality.map(option => option.label) 
                      : imageModelLocal === "dall-e-2"
                        ? dallE2Quality.map(option => option.label)
                        : dallE3Quality.map(option => option.label)
                  }
                  onChange={(e) => setImageQualityLocal(e.target.value)}
                  disabled={apiLocal !== "openai" || imageModelLocal === "dall-e-2"}
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
                  Quality options vary by model: 
                  {imageModelLocal === "gpt-image-1" && " auto, high, medium, low"}
                  {imageModelLocal === "dall-e-2" && " standard (only)"}
                  {imageModelLocal === "dall-e-3" && " standard, hd"}
                </div>
                
                {imageModelLocal === "dall-e-3" && (
                  <>
                    <InputSelect
                      label="Image Style"
                      value={imageStyleLocal}
                      options={styleOptions.map(option => option.value)}
                      optionLabels={styleOptions.map(option => option.label)}
                      onChange={(e) => setImageStyleLocal(e.target.value)}
                      disabled={apiLocal !== "openai"}
                    />
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
                      Style parameter is only available for DALL-E 3 model
                    </div>
                  </>
                )}
                
                <InputSelect
                  label="Number of Images"
                  value={imageModelLocal === "dall-e-3" ? 1 : numberOfImagesLocal}
                  options={imageCountOptions.map(option => option.value)}
                  optionLabels={imageCountOptions.map(option => option.label)}
                  onChange={(e) => setNumberOfImagesLocal(Number(e.target.value))}
                  disabled={apiLocal !== "openai" || imageModelLocal === "dall-e-3"}
                />
                {imageModelLocal === "dall-e-3" && (
                  <div className="text-xs text-orange-500 dark:text-orange-400 mt-1 mb-3">
                    Note: DALL-E 3 only supports generating 1 image at a time
                  </div>
                )}
              </div>
            )}
            
            {/* Streaming options section - only for chat */}
            {context === "chat" && (
              <div className="mt-6 pt-4 border-t border-slate-300 dark:border-slate-700">
                <p className="text-center mb-4">
                  <span className="px-3 py-1 text-sm uppercase text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-300 dark:border-slate-600">
                    Streaming Options
                  </span>
                </p>
                
                {/* Provider-specific streaming options */}
                <div className={!["openai", "openrouter"].includes(apiLocal) ? "opacity-50" : ""}>
                  <ToggleSwitch
                    id="streamingAudio"
                    label={
                      <>
                        Voice Transcription
                        {!["openai", "openrouter"].includes(apiLocal) && (
                          <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                            (OpenAI/OpenRouter only)
                          </span>
                        )}
                      </>
                    }
                    checked={streamingAudioLocal}
                    onChange={() => {
                      if (["openai", "openrouter"].includes(apiLocal)) {
                        setStreamingAudioLocal(!streamingAudioLocal);
                      }
                    }}
                    disabled={!["openai", "openrouter"].includes(apiLocal)}
                  />

                  <ToggleSwitch
                    id="streamingText"
                    label={
                      <>
                        Streaming Audio Response
                        {!["openai", "openrouter"].includes(apiLocal) && (
                          <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                            (OpenAI/OpenRouter only)
                          </span>
                        )}
                      </>
                    }
                    checked={streamingTextLocal}
                    onChange={() => {
                      if (["openai", "openrouter"].includes(apiLocal)) {
                        setStreamingTextLocal(!streamingTextLocal);
                      }
                    }}
                    disabled={!["openai", "openrouter"].includes(apiLocal)}
                  />
                </div>
                
                {/* Streaming response option (available for supported providers) */}
                <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <ToggleSwitch
                    id="streamingResponse"
                    label={
                      <>
                        Streaming Text Response
                        {!currentProvider.supportsStreaming && (
                          <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                            (Not supported)
                          </span>
                        )}
                      </>
                    }
                    checked={streamingResponseLocal}
                    onChange={() => {
                      if (currentProvider.supportsStreaming) {
                        setStreamingResponseLocal(!streamingResponseLocal);
                      }
                    }}
                    disabled={!currentProvider.supportsStreaming}
                  />
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Button label="Save changes" takeAction={handleSaveChanges} />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
