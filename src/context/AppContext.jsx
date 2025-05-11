import { createContext, useContext, useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useStorage.js";
import { useSecureStorage } from "../utils/secureStorage.js";
import { convoLists } from "../data/convoLists.js";
import today from "../utils/utils.js";
import { sendRequest as apiSendRequest } from "../utils/api.js";
import { DEFAULT_SETTINGS, getProviderById } from "../app.config.js";

const AppContext = createContext(null);

export function useAppContext() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  // Menu state
  const icon = ["chat", "image", "audio", "video", "doc", "agent", "settings"];
  const [selectedIcon, setSelectedIcon] = useState(icon[0]);

  // Conversations state
  const [convoList, setConvoList] = useLocalStorage(
    "convo",
    JSON.stringify(convoLists)
  );
  const [selectedConvo, setSelectedConvo] = useState(0);
  
  // API interaction state
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Settings state - use default settings from config
  const [apiKeyStored, setApiKey] = useSecureStorage("api-key", undefined);
  const [modelStored, setModel] = useLocalStorage("model", DEFAULT_SETTINGS.model);
  const [maxTokensStored, setMaxTokens] = useLocalStorage("max-tokens", DEFAULT_SETTINGS.maxTokens);
  const [temperatureStored, setTemperature] = useLocalStorage("temperature", DEFAULT_SETTINGS.temperature);
  const [topPStored, setTopP] = useLocalStorage("top-p", DEFAULT_SETTINGS.topP);
  const [apiStored, setApi] = useLocalStorage("api", DEFAULT_SETTINGS.apiProvider);

  // Update conversation when result changes
  useEffect(() => {
    if (result) {
      saveConvo(result);
    }
  }, [result]);

  // Handle menu icon selection
  function handleSelectIcon(selectedButton) {
    setSelectedIcon(selectedButton);
  }

  // Handle conversation selection
  function handleSelect(selectedList) {
    setSelectedConvo(selectedList);
  }

  // Handle conversation deletion
  function handleDelete(selectedList) {
    let convo = JSON.parse(convoList);

    if (convo[selectedIcon].length - 1 == selectedList) {
      convo[selectedIcon].splice(selectedList, 1, {
        title: "New conversation",
        date: today(),
        messages: [{ role: "system", content: "You are a helpful assistant." }],
      });
    } else {
      convo[selectedIcon].splice(selectedList, 1);
    }

    setConvoList(JSON.stringify(convo));
    setResult("");
  }

  // Create new conversation
  function handleNew() {
    let convo = JSON.parse(convoList);
    convo[selectedIcon] = [
      {
        title: "New conversation",
        date: today(),
        messages: [{ role: "system", content: "You are a helpful assistant." }],
      },
      ...convo[selectedIcon],
    ];
    setConvoList(JSON.stringify(convo));
  }

  // Save conversation after receiving response
  function saveConvo(result) {
    const tab = selectedConvo;
    let convo = JSON.parse(convoList);
    let messages = convo[selectedIcon][tab].messages;
    messages = saveMsg(messages, "assistant", result);
    convo[selectedIcon][tab].messages = messages;
    setConvoList(JSON.stringify(convo));
    setResult("");
  }

  // Add message to conversation
  function saveMsg(messages, role, content) {
    messages = [...messages, { role, content }];
    return messages;
  }

  // Handle new user prompt
  function newPrompt(prompt) {
    const tab = selectedConvo;
    let convo = JSON.parse(convoList);
    let messages = convo[selectedIcon][tab].messages;
    
    // Use first prompt as conversation title
    if (messages.length == 1) {
      convo[selectedIcon][tab].title = prompt.slice(0, 50);
    }
    
    messages = [...messages, { role: "user", content: prompt }];
    convo[selectedIcon][tab].messages = messages;
    setConvoList(JSON.stringify(convo));
    
    sendRequest(messages);
  }

  // Send API request
  const sendRequest = async (messages) => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = getProviderById(apiStored);
      const providerName = provider ? provider.name : "Unknown Provider";
      
      const content = await apiSendRequest(messages, {
        apiProvider: apiStored,
        providerName: providerName,
        apiKey: apiKeyStored,
        model: modelStored,
        maxTokens: maxTokensStored,
        temperature: temperatureStored,
        topP: topPStored
      });
      
      setResult(content);
    } catch (err) {
      console.error("API Error:", err);
      setError(err.message || "Failed to get response");
    } finally {
      setLoading(false);
    }
  };

  // Save settings changes
  function saveSettings(settings) {
    const { apiProvider, apiKey, model, maxTokens, temperature, topP } = settings;
    setApi(apiProvider);
    setApiKey(apiKey);
    setModel(model);
    setMaxTokens(maxTokens);
    setTemperature(temperature);
    setTopP(topP);
  }

  const contextValue = {
    // Menu state
    selectedIcon,
    handleSelectIcon,
    
    // Conversation state
    convoList,
    selectedConvo,
    handleSelect,
    handleDelete,
    handleNew,
    
    // Conversation content
    newPrompt,
    result,
    loading,
    error,
    
    // Settings
    apiKeyStored,
    modelStored,
    maxTokensStored,
    temperatureStored,
    topPStored,
    apiStored,
    saveSettings,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}