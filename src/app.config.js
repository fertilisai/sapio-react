/**
 * app.config.js
 * Central configuration file for AI providers and models
 * Last updated: May 2025
 */

// Define all available AI providers
export const AI_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    apiKeyPlaceholder: "sk-...",
    apiKeyPrefix: "sk-",
    apiConsoleUrl: "https://platform.openai.com/api-keys",
    apiConsoleName: "OpenAI dashboard",
    badgeColor: "green", // For UI color variations
    defaultModel: "gpt-4o",
    supportsStreaming: true, // Supports streaming responses
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    apiKeyPlaceholder: "sk-or-...",
    apiKeyPrefix: "sk-or-",
    apiConsoleUrl: "https://openrouter.ai/keys",
    apiConsoleName: "OpenRouter dashboard",
    badgeColor: "blue",
    defaultModel: "openai/gpt-4o",
    supportsStreaming: true, // Supports streaming via OpenAI-compatible API
  },
];

// Define all available models for each provider
export const AI_MODELS = {
  openai: [
    {
      id: "gpt-4.1",
      name: "GPT-4.1",
      description:
        "Latest flagship model with improved coding and long context capabilities",
    },
    {
      id: "gpt-4.1-mini",
      name: "GPT-4.1 Mini",
      description: "Smaller, faster version of GPT-4.1 with good performance",
    },
    {
      id: "gpt-4.1-nano",
      name: "GPT-4.1 Nano",
      description: "Smallest, fastest version of GPT-4.1 family",
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      description: "Multimodal model with vision capabilities",
    },
    {
      id: "o3",
      name: "o3",
      description: "Specialized reasoning model for complex problem-solving",
    },
    {
      id: "o1-pro",
      name: "o1-Pro",
      description: "Premium reasoning model for advanced tasks",
    },
  ],
  openrouter: [
    {
      id: "openai/gpt-4o",
      name: "OpenAI GPT-4o",
      description: "OpenAI's GPT-4o via OpenRouter",
    },
    {
      id: "anthropic/claude-3.7-sonnet",
      name: "Claude 3.7 Sonnet",
      description: "Anthropic's Claude 3.7 via OpenRouter",
    },
    {
      id: "deepseek/deepseek-r1:free",
      name: "DeepSeek-R1 (Free)",
      description: "DeepSeek's latest reasoning model via OpenRouter",
    },
    {
      id: "qwen/qwen3-30b-a3b:free",
      name: "Qwen 3 30B A3B",
      description: "Alibaba's Qwen 3 30B A3B model via OpenRouter",
    },
    {
      id: "meta-llama/llama-4-maverick:free",
      name: "Llama 4 Maverick (Free)",
      description: "Meta's Llama 4 via OpenRouter",
    },
    {
      id: "google/gemini-2.5-flash-preview",
      name: "Gemini 2.5 Flash Preview",
      description: "Google's Gemini 2.5 Flash via OpenRouter",
    },
    {
      id: "mistralai/mistral-nemo:free",
      name: "Mixtral Nemo (Free)",
      description: "MistralAI's Mixtral Nemo model via OpenRouter",
    },
    {
      id: "cohere/command-r",
      name: "Command-R",
      description: "Cohere's Command-R model via OpenRouter",
    },
  ],
};

// Define image generation models
export const IMAGE_MODELS = {
  openai: [
    {
      id: "dall-e-3",
      name: "DALL-E 3",
      description: "Latest DALL-E model with best quality and detail",
      sizes: ["1024x1024", "1024x1792", "1792x1024"],
      qualities: ["standard", "hd"],
      styles: ["vivid", "natural"],
      maxImages: 1
    },
    {
      id: "dall-e-2",
      name: "DALL-E 2",
      description: "Previous generation DALL-E model",
      sizes: ["256x256", "512x512", "1024x1024"],
      qualities: ["standard"],
      styles: [],
      maxImages: 10
    }
  ]
};

// Helper function to get provider object by ID
export const getProviderById = (providerId) => {
  return (
    AI_PROVIDERS.find((provider) => provider.id === providerId) ||
    AI_PROVIDERS[0]
  );
};

// Helper function to get models for a specific provider
export const getModelsByProviderId = (providerId) => {
  return AI_MODELS[providerId] || [];
};

// Helper function to get image models for a specific provider
export const getImageModelsByProviderId = (providerId) => {
  return IMAGE_MODELS[providerId] || [];
};

// Helper function to get model names for dropdown options
export const getModelOptionsForProvider = (providerId) => {
  return getModelsByProviderId(providerId).map((model) => model.id);
};

// Default settings
export const DEFAULT_SETTINGS = {
  apiProvider: AI_PROVIDERS[0].id,
  model: AI_PROVIDERS[0].defaultModel,
  maxTokens: "1024",
  temperature: "0.7",
  topP: "0.9",
  streamingAudio: false,
  streamingText: true,
  streamingResponse: true, // Enable streaming responses by default for supported providers
};

// Default image generation settings
export const DEFAULT_IMAGE_SETTINGS = {
  model: "dall-e-3",
  size: "1024x1024",
  quality: "standard",
  style: "vivid",
  numberOfImages: 1
};