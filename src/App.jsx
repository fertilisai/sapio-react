import React, { useState, useEffect } from 'react';
import { useLocalStorage } from "./hooks/useStorage.js";
import { convoLists } from "./data/convoLists.js";
import today from "./utils/utils.js";

import Menu from "./components/Menu.jsx";
import LeftSidebar from "./components/LeftSidebar.jsx";
import RightSidebar from "./components/RightSidebar.jsx";
import Convo from "./components/Convo.jsx";
import Alert from "./components/Alert.jsx";

// Import the API service and provider utilities
import { sendRequest as apiSendRequest } from "./utils/api.js";
import { getProviderById } from "./app.config.js";

export default function App() {
  // Dark mode state
  const [darkMode, setDarkMode] = useLocalStorage("darkMode", true);
  
  // Sidebar collapse states
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useLocalStorage("leftSidebarCollapsed", false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useLocalStorage("rightSidebarCollapsed", false);
  
  // Track if this is the first load
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Track previous screen width to know if we're resizing smaller
  const [prevWidth, setPrevWidth] = useState(window.innerWidth);
  
  // Apply dark mode class to HTML element
  useEffect(() => {
    // Apply dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Handle responsive sidebar behavior - both initial load and resize events
  useEffect(() => {
    // Debounce function to improve performance
    const debounce = (func, delay) => {
      let timeoutId;
      return (...args) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          func(...args);
        }, delay);
      };
    };
    
    // Set initial sidebar states based on screen size
    const handleScreenSize = () => {
      const currentWidth = window.innerWidth;
      const isShrinking = currentWidth < prevWidth;
      
      if (isInitialLoad || isShrinking) {
        // Auto-collapse sidebars when screen shrinks or on initial load
        if (currentWidth <= 768) {
          // On mobile, collapse both sidebars
          setLeftSidebarCollapsed(true);
          setRightSidebarCollapsed(true);
        } else if (currentWidth <= 1200) {
          // On medium screens, only collapse right sidebar
          if (isShrinking || isInitialLoad) {
            setRightSidebarCollapsed(true);
          }
          
          // If going from mobile to tablet, we can restore left sidebar
          if (prevWidth <= 768 && currentWidth > 768) {
            setLeftSidebarCollapsed(false);
          }
        } else {
          // On larger screens, restore defaults if coming from smaller size
          if (prevWidth <= 1200 && currentWidth > 1200) {
            setRightSidebarCollapsed(false);
          }
        }
      }
      
      // Update previous width
      setPrevWidth(currentWidth);
      
      // Mark initial load as complete if it's the first run
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    };
    
    // Run on initial load immediately
    handleScreenSize();
    
    // Add resize event listener with debounce
    const debouncedHandleResize = debounce(handleScreenSize, 150);
    window.addEventListener('resize', debouncedHandleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', debouncedHandleResize);
  }, [isInitialLoad, prevWidth, setLeftSidebarCollapsed, setRightSidebarCollapsed]);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  // Toggle sidebar collapse functions
  const toggleLeftSidebar = () => {
    setLeftSidebarCollapsed(!leftSidebarCollapsed);
  };
  
  const toggleRightSidebar = () => {
    setRightSidebarCollapsed(!rightSidebarCollapsed);
  };
  
  // Menu state
  const icon = ["chat", "image", "audio", "video", "doc", "agent", "settings"];
  const [selectedIcon, setSelectedIcon] = useState(icon[0]);

  // Conversations state with enhanced structure for sections
  const defaultState = () => {
    // Transform the original convoLists to include IDs and support sections
    // IMPORTANT: Always use string IDs for consistency
    const enhanced = {};
    
    Object.keys(convoLists).forEach(iconType => {
      enhanced[iconType] = convoLists[iconType].map((convo, index) => ({
        ...convo,
        id: String(index), // Convert to string for consistency
        sectionId: null // Initially no conversation is in a section
      }));
    });
    
    return enhanced;
  };
  
  const [convoList, setConvoList] = useLocalStorage(
    "convo",
    JSON.stringify(defaultState())
  );
  
  // Sections state
  const [sections, setSections] = useLocalStorage(
    "sections",
    JSON.stringify({})
  );
  
  const [selectedConvo, setSelectedConvo] = useState(0);
  
  // API interaction state
  const [result, setResult] = useState("");
  const [streamingResult, setStreamingResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Context-specific error states
  const [chatError, setChatError] = useState(null);
  const [imageError, setImageError] = useState(null);

  // Settings state
  const [apiKey, setApiKey] = useLocalStorage("api-key", "");
  const [model, setModel] = useLocalStorage("model", "gpt-3.5-turbo");
  const [maxTokens, setMaxTokens] = useLocalStorage("max-tokens", "256");
  const [temperature, setTemperature] = useLocalStorage("temperature", "0.7");
  const [topP, setTopP] = useLocalStorage("top-p", "1");
  const [api, setApi] = useLocalStorage("api", "OpenAI");
  const [streamingAudio, setStreamingAudio] = useLocalStorage("streaming-audio", true);
  const [streamingText, setStreamingText] = useLocalStorage("streaming-text", false);
  const [streamingResponse, setStreamingResponse] = useLocalStorage("streaming-response", true);
  
  // Image generation settings
  const [imageSettings, setImageSettings] = useLocalStorage("image-settings", JSON.stringify({
    imageSize: "1024x1024",
    imageQuality: "standard", 
    imageStyle: "vivid",
    numberOfImages: 1,
    model: "gpt-image-1"  // Default to GPT-Image-1 model
  }));

  // Parse state safely
  let parsedConvoList;
  let parsedSections;
  
  try {
    parsedConvoList = JSON.parse(convoList);
    
    // Check if we need to update our data structure
    const firstConvo = parsedConvoList[icon[0]][0];
    if (firstConvo && !('id' in firstConvo)) {
      console.log('Updating data structure to include IDs and section support');
      parsedConvoList = defaultState();
      setConvoList(JSON.stringify(parsedConvoList));
    }
  } catch (error) {
    console.error("Error parsing convo list:", error);
    parsedConvoList = defaultState();
    setConvoList(JSON.stringify(parsedConvoList));
  }
  
  try {
    parsedSections = JSON.parse(sections);
  } catch (error) {
    console.error("Error parsing sections:", error);
    parsedSections = {};
    setSections(JSON.stringify(parsedSections));
  }
  
  // Initialize sections for each icon type if not present
  useEffect(() => {
    const sectionsData = JSON.parse(sections);
    let updated = false;
    
    icon.forEach(iconType => {
      if (!sectionsData[iconType]) {
        sectionsData[iconType] = [];
        updated = true;
      }
    });
    
    if (updated) {
      setSections(JSON.stringify(sectionsData));
    }
  }, []);

  // Update conversation when result changes
  useEffect(() => {
    if (result) {
      saveConvo(result);
    }
  }, [result]);

  // Generate a unique ID - ALWAYS returning a string
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };
  
  // Handle menu icon selection
  function handleSelectIcon(selectedButton) {
    setSelectedIcon(selectedButton);
    // Reset selected conversation when changing icon
    if (parsedConvoList[selectedButton] && parsedConvoList[selectedButton].length > 0) {
      setSelectedConvo(parsedConvoList[selectedButton][0].id);
    }
  }

  // Handle conversation selection
  function handleSelect(convoId) {
    setSelectedConvo(convoId);
  }

  // Handle conversation deletion
  function handleDelete(convoId) {
    let convo = JSON.parse(convoList);
    
    // Find the index of the conversation to delete
    const convoIndex = convo[selectedIcon].findIndex(c => c.id === convoId);
    
    if (convoIndex === -1) return;
    
    // Remove the conversation
    convo[selectedIcon].splice(convoIndex, 1);
    
    // If we deleted the last conversation, create a new empty one
    if (convo[selectedIcon].length === 0) {
      const newId = generateId();
      convo[selectedIcon].push({
        id: newId,
        title: "New conversation",
        date: today(),
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        sectionId: null
      });
      
      // Update selected conversation
      setSelectedConvo(newId);
    } else {
      // If we deleted the selected conversation, select the first available
      if (convoId === selectedConvo) {
        setSelectedConvo(convo[selectedIcon][0].id);
      }
    }
    
    setConvoList(JSON.stringify(convo));
    setResult("");
  }
  
  // Handle conversation rename
  function handleRename(convoId, newTitle) {
    let convo = JSON.parse(convoList);
    
    // Find the conversation
    const convoIndex = convo[selectedIcon].findIndex(c => c.id === convoId);
    
    if (convoIndex === -1) return;
    
    // Only update if the title actually changed
    if (convo[selectedIcon][convoIndex].title !== newTitle) {
      convo[selectedIcon][convoIndex].title = newTitle;
      setConvoList(JSON.stringify(convo));
    }
  }

  // Create new conversation
  function handleNewConversation() {
    let convo = JSON.parse(convoList);
    const newId = generateId();
    
    convo[selectedIcon] = [
      {
        id: newId, // This will be a string from generateId()
        title: "New conversation",
        date: today(),
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        sectionId: null
      },
      ...convo[selectedIcon],
    ];
    
    setConvoList(JSON.stringify(convo));
    setSelectedConvo(newId);
  }
  
  // Create new section
  function handleNewSection() {
    let sectionData = JSON.parse(sections);
    const newSectionId = generateId();
    
    if (!sectionData[selectedIcon]) {
      sectionData[selectedIcon] = [];
    }
    
    sectionData[selectedIcon] = [
      ...sectionData[selectedIcon],
      {
        id: newSectionId,
        title: "New section",
        collapsed: false
      }
    ];
    
    setSections(JSON.stringify(sectionData));
  }
  
  // Edit section
  function handleEditSection(sectionId, updatedSection) {
    try {
      let sectionData = JSON.parse(sections);
      
      // Find the section using string comparison for consistency
      const sectionIndex = sectionData[selectedIcon].findIndex(
        s => String(s.id) === String(sectionId)
      );
      
      if (sectionIndex === -1) {
        console.error(`Section with ID ${sectionId} not found`);
        return;
      }
      
      // Update the section with the new data
      sectionData[selectedIcon][sectionIndex] = updatedSection;
      
      // Save the updated sections
      setSections(JSON.stringify(sectionData));
    } catch (error) {
      console.error('Error in handleEditSection:', error);
    }
  }
  
  // Delete section and optionally its conversations
  function handleDeleteSection(sectionId) {
    let sectionData = JSON.parse(sections);
    let convo = JSON.parse(convoList);
    
    // Remove section
    sectionData[selectedIcon] = sectionData[selectedIcon].filter(s => s.id !== sectionId);
    
    // Find conversations in this section
    const conversationsInSection = convo[selectedIcon].filter(c => c.sectionId === sectionId);
    
    // Check if the user wants to delete the conversations as well
    if (conversationsInSection.length > 0) {
      const deletionChoice = window.confirm(
        `Do you want to delete the ${conversationsInSection.length} conversation${
          conversationsInSection.length !== 1 ? 's' : ''
        } in this section?\n\nClick OK to delete them or Cancel to keep them in the unsectioned area.`
      );
      
      if (deletionChoice) {
        // Delete conversations in this section
        convo[selectedIcon] = convo[selectedIcon].filter(c => c.sectionId !== sectionId);
        
        // If we deleted the selected conversation, select another one
        if (conversationsInSection.some(c => c.id === selectedConvo)) {
          const remainingConvos = convo[selectedIcon];
          if (remainingConvos.length > 0) {
            setSelectedConvo(remainingConvos[0].id);
          }
        }
      } else {
        // Keep conversations but move them to unsectioned area
        convo[selectedIcon] = convo[selectedIcon].map(c => {
          if (c.sectionId === sectionId) {
            return { ...c, sectionId: null };
          }
          return c;
        });
      }
    }
    
    setSections(JSON.stringify(sectionData));
    setConvoList(JSON.stringify(convo));
  }
  
  // Move conversation to section - simpler implementation
  function handleMoveConvo(convoId, sectionId) {
    console.log(`Moving conversation ${convoId} to section ${sectionId}`);
    
    try {
      // Deep clone the current state to avoid mutation issues
      const convos = JSON.parse(convoList);
      
      // Make sure convoId is a string for consistent comparison
      const convoIdString = String(convoId);
      
      // Find the conversation regardless of ID type (string or number)
      const conversation = convos[selectedIcon].find(c => 
        String(c.id) === convoIdString
      );
      
      if (!conversation) {
        console.error(`Conversation ${convoId} not found`);
        return; // Conversation not found
      }
      
      // Update section
      conversation.sectionId = sectionId; // sectionId can be null to remove from section
      console.log(`Updated conversation:`, conversation);
      
      // Save the updated state
      setConvoList(JSON.stringify(convos));
      console.log('Section update successful');
    } catch (error) {
      console.error('Error in handleMoveConvo:', error);
    }
  }
  
  // Reorder conversations - simpler implementation
  function handleReorderConvos(draggedId, targetId) {
    console.log(`Reordering: Dragged=${draggedId}, Target=${targetId}`);
    
    // Convert IDs to strings for consistent comparison
    const draggedIdString = String(draggedId);
    const targetIdString = String(targetId);
    
    // Don't do anything if trying to drop onto self
    if (draggedIdString === targetIdString) {
      console.log('Same item, ignoring reorder');
      return;
    }
    
    try {
      // Deep clone the current state to avoid mutation issues
      const convos = JSON.parse(convoList);
      
      // Find the conversations using string comparison
      const draggedConvo = convos[selectedIcon].find(c => 
        String(c.id) === draggedIdString
      );
      
      const targetConvo = convos[selectedIcon].find(c => 
        String(c.id) === targetIdString
      );
      
      if (!draggedConvo) {
        console.error(`Dragged conversation ${draggedId} not found`);
        return;
      }
      
      if (!targetConvo) {
        console.error(`Target conversation ${targetId} not found`);
        return;
      }
      
      console.log('Found dragged:', draggedConvo);
      console.log('Found target:', targetConvo);
      
      // Update the section of the dragged conversation to match the target
      draggedConvo.sectionId = targetConvo.sectionId;
      
      // Remove the dragged conversation from its current position
      const withoutDragged = convos[selectedIcon].filter(c => 
        String(c.id) !== draggedIdString
      );
      
      // Find the position of the target in the filtered array
      const targetIndex = withoutDragged.findIndex(c => 
        String(c.id) === targetIdString
      );
      
      console.log(`Target index: ${targetIndex}`);
      
      // Insert the dragged conversation after the target
      withoutDragged.splice(targetIndex + 1, 0, draggedConvo);
      
      // Update the main array
      convos[selectedIcon] = withoutDragged;
      
      // Save the updated state
      setConvoList(JSON.stringify(convos));
      console.log('Reorder successful');
    } catch (error) {
      console.error('Error in handleReorderConvos:', error);
    }
  }
  
  // Enhanced handleReorderSections with support for positioning among conversations
  function handleReorderSections(draggedId, targetPosition) {
    console.log(`⏱️ REORDER_ENHANCED: Starting with draggedId=${draggedId}, targetPosition=${targetPosition}`);
    
    // Force convert draggedId to string for consistent comparison
    const draggedIdString = String(draggedId);
    
    try {
      // Parse current sections
      const currentSections = JSON.parse(sections);
      
      // If selectedIcon section doesn't exist, create empty array
      if (!currentSections[selectedIcon]) {
        currentSections[selectedIcon] = [];
      }
      
      // Make a copy of the current sections array
      const sectionsArray = [...currentSections[selectedIcon]];
      console.log('⏱️ REORDER_ENHANCED: Current sections', sectionsArray.map(s => s.id));
      
      // Find the dragged section
      const draggedIndex = sectionsArray.findIndex(s => String(s.id) === draggedIdString);
      
      // Validate dragged section exists
      if (draggedIndex === -1) {
        console.error('⏱️ REORDER_ENHANCED: Dragged section not found, aborting');
        return;
      }
      
      // Make a copy of the dragged section
      const draggedSection = {...sectionsArray[draggedIndex]};
      
      // Remove the dragged section from the array
      const arrayWithoutDragged = [
        ...sectionsArray.slice(0, draggedIndex),
        ...sectionsArray.slice(draggedIndex + 1)
      ];
      
      // Handle special positions
      let newSectionsArray;
      
      if (targetPosition === 'top') {
        // Insert at the beginning of sections
        console.log('⏱️ REORDER_ENHANCED: Moving section to top position');
        newSectionsArray = [draggedSection, ...arrayWithoutDragged];
      } 
      else if (typeof targetPosition === 'string' && targetPosition.startsWith('after-')) {
        // Handle "after-{convoId}" format
        const convoId = targetPosition.replace('after-', '');
        console.log(`⏱️ REORDER_ENHANCED: Moving section after conversation ${convoId}`);
        
        // Find the index to insert after
        // For conversations, we'll need to find the position among sections
        // We'll insert at the beginning since this is after a conversation
        newSectionsArray = [draggedSection, ...arrayWithoutDragged];
      }
      else if (draggedIdString === targetPosition) {
        console.log('⚠️ REORDER_ENHANCED: Dropping onto self, ignoring');
        return;
      }
      else {
        // Regular section-to-section reordering
        const targetIndex = sectionsArray.findIndex(s => String(s.id) === String(targetPosition));
        
        if (targetIndex === -1) {
          console.error('⏱️ REORDER_ENHANCED: Target section not found, aborting');
          return;
        }
        
        // Adjust target index to account for removal
        const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
        
        // Insert at the target position
        newSectionsArray = [...arrayWithoutDragged];
        newSectionsArray.splice(adjustedTargetIndex, 0, draggedSection);
        console.log(`⏱️ REORDER_ENHANCED: Moving section to position ${adjustedTargetIndex}`);
      }
      
      console.log('⏱️ REORDER_ENHANCED: New sections array', newSectionsArray.map(s => s.id));
      
      // Update the current sections object with new array
      currentSections[selectedIcon] = newSectionsArray;
      
      // Convert back to JSON
      const newSectionsJson = JSON.stringify(currentSections);
      
      // Set the state
      console.log('⏱️ REORDER_ENHANCED: Setting state with new order');
      setSections(newSectionsJson);
    } catch (error) {
      console.error('⏱️ REORDER_ENHANCED: Error in reordering', error);
    }
    
  }

  // Save conversation after receiving response
  function saveConvo(result) {
    let convo = JSON.parse(convoList);

    // Find the selected conversation
    const convoIndex = convo[selectedIcon].findIndex(c => c.id === selectedConvo);

    if (convoIndex === -1) return;

    let messages = convo[selectedIcon][convoIndex].messages;
    messages = [...messages, { role: "assistant", content: result }];
    convo[selectedIcon][convoIndex].messages = messages;

    setConvoList(JSON.stringify(convo));

    // Clear all transient UI states
    setResult("");
    setStreamingResult("");
    setLoading(false);
  }

  // Handle new user prompt
  function newPrompt(prompt) {
    let convo = JSON.parse(convoList);
    
    // Find the selected conversation
    const convoIndex = convo[selectedIcon].findIndex(c => c.id === selectedConvo);
    
    if (convoIndex === -1) return;
    
    let messages = convo[selectedIcon][convoIndex].messages;
    
    // Check if this is a system message update
    if (prompt.startsWith("__SYSTEM__")) {
      const systemPrompt = prompt.replace("__SYSTEM__", "");
      
      // Find if there's already a system message
      const systemIndex = messages.findIndex(msg => msg.role === "system");
      
      if (systemIndex >= 0) {
        // Update existing system message
        messages[systemIndex].content = systemPrompt;
      } else if (systemPrompt.trim()) {
        // Add new system message at the beginning if not empty
        messages.unshift({ role: "system", content: systemPrompt });
      }
      
      // Save the updated messages without sending a request
      convo[selectedIcon][convoIndex].messages = messages;
      setConvoList(JSON.stringify(convo));
      return;
    }
    
    // Regular user prompt
    // Use first prompt as conversation title
    if (messages.length == 1 || (messages.length == 2 && messages[0].role === "system")) {
      // Special handling for image generation prompts
      if (prompt.startsWith("__IMAGE__")) {
        try {
          // Extract the actual prompt from the image command
          const imageDataJson = prompt.replace("__IMAGE__", "");
          const imageData = JSON.parse(imageDataJson);
          convo[selectedIcon][convoIndex].title = `Image: ${imageData.prompt.slice(0, 40)}`;
        } catch (error) {
          console.error("Error parsing image prompt for title:", error);
          convo[selectedIcon][convoIndex].title = "Image generation";
        }
      } else {
        convo[selectedIcon][convoIndex].title = prompt.slice(0, 50);
      }
    }
    
    messages = [...messages, { role: "user", content: prompt }];
    convo[selectedIcon][convoIndex].messages = messages;
    setConvoList(JSON.stringify(convo));
    
    sendRequest(messages);
  }

  // Set up streaming handlers when component mounts
  useEffect(() => {
    // Handler for streaming updates from OpenAI
    const handleStreamUpdate = (event) => {
      const { fullResponse } = event.detail;
      setStreamingResult(fullResponse);
    };
    
    // Handler for stream completion
    const handleStreamEnd = (event) => {
      const { fullResponse } = event.detail;
      setResult(fullResponse);
      setStreamingResult("");
      setLoading(false);
    };
    
    // Add event listeners
    document.addEventListener('openai-stream-update', handleStreamUpdate);
    document.addEventListener('openai-stream-end', handleStreamEnd);
    
    // Set up the global update function
    window.updateOpenAIResponse = (text) => {
      setStreamingResult(text);
    };
    
    // Clean up listeners on unmount
    return () => {
      document.removeEventListener('openai-stream-update', handleStreamUpdate);
      document.removeEventListener('openai-stream-end', handleStreamEnd);
      delete window.updateOpenAIResponse;
    };
  }, []);
  
  // Send API request
  const sendRequest = async (messages) => {
    setLoading(true);
    setError(null);
    setChatError(null);
    setImageError(null);
    setStreamingResult(""); // Reset streaming result
    
    try {
      // Get provider details
      const provider = getProviderById(api);
      const supportsStreaming = provider?.supportsStreaming || false;
      
      // Determine if we should use streaming
      const useStreaming = streamingResponse && supportsStreaming;
      
      // Check if this is an image generation request
      const isImageRequest = messages.length > 0 && 
                            messages[messages.length - 1].role === "user" && 
                            messages[messages.length - 1].content.startsWith("__IMAGE__");
      
      // Add update callback for streaming
      const content = await apiSendRequest(messages, {
        apiProvider: api,
        apiKey: apiKey,
        model: model,
        maxTokens: maxTokens,
        temperature: temperature,
        topP: topP,
        streamingText: useStreaming,
        onUpdate: (text) => {
          if (useStreaming) {
            setStreamingResult(text);
          }
        }
      });
      
      // Set the result and clear any streaming result
      setResult(content);
      setStreamingResult("");

      // Always reset loading state after receiving a result
      setLoading(false);
    } catch (err) {
      console.error("API Error:", err);
      const errorMessage = err.message || "Failed to get response";
      
      // Set error in the appropriate context
      if (selectedIcon === "image") {
        setImageError(errorMessage);
      } else {
        setChatError(errorMessage);
      }
      
      setError(errorMessage); // Also set the general error for backward compatibility
      setLoading(false);
    }
  };

  // Save settings changes
  function saveSettings(settings) {
    const { 
      apiProvider, 
      apiKey: newApiKey, 
      model: newModel, 
      maxTokens: newMaxTokens, 
      temperature: newTemperature, 
      topP: newTopP,
      streamingAudio: newStreamingAudio,
      streamingText: newStreamingText,
      streamingResponse: newStreamingResponse,
      imageSettings: newImageSettings
    } = settings;
    
    setApi(apiProvider);
    setApiKey(newApiKey);
    setModel(newModel);
    setMaxTokens(newMaxTokens);
    setTemperature(newTemperature);
    setTopP(newTopP);
    setStreamingAudio(newStreamingAudio);
    setStreamingText(newStreamingText);
    setStreamingResponse(newStreamingResponse);
    
    // Update image settings if provided
    if (newImageSettings) {
      setImageSettings(JSON.stringify(newImageSettings));
    }
  }
  
  // Find the selected conversation
  const getSelectedConversation = () => {
    if (!parsedConvoList[selectedIcon]) return null;
    
    return parsedConvoList[selectedIcon].find(c => c.id === selectedConvo) || parsedConvoList[selectedIcon][0];
  };
  
  const selectedConversation = getSelectedConversation();

  // Add a function to reset the UI in case of display issues
  const resetDisplay = () => {
    console.log("Emergency UI reset triggered");
    
    // Reset any body classes or attributes that might be causing issues
    document.body.className = "";
    document.body.removeAttribute("style");
    
    // Add the reset-display class to force visibility
    document.querySelector('.container-fluid').classList.add('reset-display');
    
    // Clean up all data attributes
    const allElements = document.querySelectorAll('*[data-drag-active], *[data-dragging], *[data-mouse-down], *[data-force-dotted]');
    allElements.forEach(el => {
      // Remove all data attributes
      Array.from(el.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .forEach(attr => el.removeAttribute(attr.name));
        
      // Remove any inline styles that might affect visibility
      el.style.opacity = "";
      el.style.visibility = "";
      el.style.display = "";
      el.style.backgroundColor = "";
    });
    
    // Clear any global variables
    delete window.__DRAGGED_SECTION_ID;
    delete window.__DRAGGED_CONVO_ID;
    delete window.__DRAG_ORIGIN_SECTION_ID;
    
    // Force redraw of entire page
    document.body.style.display = 'none';
    document.body.offsetHeight; // Force reflow
    document.body.style.display = '';
    
    // Reapply dark mode if needed
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <div className="container-fluid">
      {/* Left toggle button (only shows when collapsed) */}
      {leftSidebarCollapsed && (
        <button 
          onClick={toggleLeftSidebar}
          className="fixed left-0 top-4 z-50 rounded-r-lg bg-slate-200 p-2 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 shadow-md transition-opacity duration-300"
          aria-label="Expand left sidebar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
      
      
      {/* Left sidebar */}
      <div className={`left transition-all duration-300 ${leftSidebarCollapsed ? 'left-collapsed' : ''}`}>
        <aside className="flex relative flex-none">
          {/* Collapse button */}
          {!leftSidebarCollapsed && (
            <button 
              onClick={toggleLeftSidebar}
              className="absolute right-0 top-4 z-40 rounded-l-lg bg-slate-200 p-2 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 shadow-md"
              aria-label="Collapse left sidebar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <div className="flex flex-row">
            <Menu
              handleSelectIcon={handleSelectIcon}
              selectedIcon={selectedIcon}
            />
            <LeftSidebar
              convoList={parsedConvoList[selectedIcon] || []}
              sections={parsedSections[selectedIcon] || []}
              selectedConvo={selectedConvo}
              handleSelect={handleSelect}
              handleDelete={handleDelete}
              handleRename={handleRename}
              handleNewChat={handleNewConversation}
              handleNewSection={handleNewSection}
              handleEditSection={handleEditSection}
              handleDeleteSection={handleDeleteSection}
              handleMoveConvo={handleMoveConvo}
              handleReorderConvos={handleReorderConvos}
              handleReorderSections={handleReorderSections}
              icon={selectedIcon}
            />
          </div>
        </aside>
      </div>

      {/* Main content */}
      <div className={`main transition-all duration-300 ${leftSidebarCollapsed ? 'main-left-expanded' : ''} ${rightSidebarCollapsed ? 'main-right-expanded' : ''}`}>
        {selectedConversation && (
          <Convo
            convo={selectedConversation.messages}
            newPrompt={newPrompt}
            loading={loading}
            result={result}
            streamingResult={streamingResult}
            apiKey={apiKey}
            api={api}
            streamingAudio={streamingAudio}
            streamingText={streamingText}
            streamingResponse={streamingResponse}
            context={selectedIcon} // Pass the selected icon as context
            chatError={chatError}
            imageError={imageError}
          />
        )}
      </div>
      
      {/* Right toggle button (only shows when collapsed) */}
      {rightSidebarCollapsed && (
        <button 
          onClick={toggleRightSidebar}
          className="fixed right-0 top-4 z-50 rounded-l-lg bg-slate-200 p-2 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 shadow-md transition-opacity duration-300"
          aria-label="Expand right sidebar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5l-7 7 7 7" />
          </svg>
        </button>
      )}
      
      {/* Right sidebar */}
      <div className={`right transition-all duration-300 ${rightSidebarCollapsed ? 'right-collapsed' : ''}`}>
        <aside className="flex relative">
          {/* Collapse button */}
          {!rightSidebarCollapsed && (
            <button 
              onClick={toggleRightSidebar}
              className="absolute left-0 top-4 z-40 rounded-r-lg bg-slate-200 p-2 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 shadow-md"
              aria-label="Collapse right sidebar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l7-7-7-7" />
              </svg>
            </button>
          )}
          
          <RightSidebar 
            api={api}
            apiKey={apiKey}
            model={model}
            maxTokens={maxTokens}
            temperature={temperature}
            topP={topP}
            streamingAudio={streamingAudio}
            streamingText={streamingText}
            streamingResponse={streamingResponse}
            saveSettings={saveSettings}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            context={selectedIcon} // Pass the current context
            imageSettings={JSON.parse(imageSettings)} // Pass image settings
          />
        </aside>
      </div>
    </div>
  );
}