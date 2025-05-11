import React, { useState, useCallback, memo, useEffect } from 'react';
import ConvoList from './ConvoList.jsx';

function Section({ 
  section, 
  conversations, 
  selectedConvo, 
  handleSelect, 
  handleDelete, 
  handleRename, 
  onEditSection, 
  onDeleteSection,
  onDrop,
  handleReorderConvos,
  dragOverConvoId,
  onDragOver,
  onDragLeave,
  isSectionDragOver,
  onSectionDragOver,
  onSectionDragLeave,
  onSectionDrop
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sectionTitle, setSectionTitle] = useState(section.title || 'Untitled Section');
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Update section title state when the section prop changes
  useEffect(() => {
    if (section.title && section.title !== sectionTitle && !isEditing) {
      setSectionTitle(section.title);
    }
  }, [section.title, isEditing]);

  // Toggle collapse state
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  // Section drag handlers
  const handleSectionDragStart = (e) => {
    // Don't allow drag when editing title
    if (isEditing) {
      e.preventDefault();
      return;
    }
    
    // Set data for drag operation
    e.dataTransfer.setData("application/x-section", String(section.id));
    e.dataTransfer.setData("text/plain", `section-${section.id}`);
    e.dataTransfer.effectAllowed = "move";
    
    // Add visual feedback but only to the section header
    if (e.target.classList.contains('section-container')) {
      // If the whole container is dragged, only add opacity to the header
      const header = e.target.querySelector(':scope > div');
      if (header) {
        header.classList.add('opacity-50');
      }
    } else {
      // Otherwise, apply opacity to just the target element
      e.target.classList.add('opacity-50');
    }
    
    // Store the dragged section's ID in a global variable for reference
    window.__DRAGGED_SECTION_ID = String(section.id);
    
    // Use classes instead of data attributes for styling
    document.body.classList.add('dragging-section');
    document.body.classList.add('is-dragging');
    document.body.classList.add('mouse-down');
    
    // Log for debugging
    console.log(`Section drag started: ${section.id}`);
  };
  
  const handleSectionDragEnd = (e) => {
    // Remove visual feedback from all potential elements
    document.querySelectorAll('.opacity-50').forEach(el => {
      el.classList.remove('opacity-50');
    });
    
    // Clean up global state
    delete window.__DRAGGED_SECTION_ID;
    
    // Remove classes instead of data attributes
    document.body.classList.remove('dragging-section');
    document.body.classList.remove('is-dragging');
    document.body.classList.remove('mouse-down');
    
    // Cleanup any section highlights
    document.querySelectorAll('.section-container').forEach(el => {
      el.style.opacity = '';
      el.style.backgroundColor = '';
      el.style.borderColor = '';
    });
    
    // Dispatch an event to reset any lingering highlight state
    document.dispatchEvent(new CustomEvent('force-highlight-reset'));
    
    // Log for debugging
    console.log(`Section drag ended: ${section.id}`);
  };

  // Create memoized handlers for each item to prevent re-creation on each render
  const createSelectHandler = useCallback((index) => {
    return () => handleSelect(index);
  }, [handleSelect]);

  const createDeleteHandler = useCallback((index) => {
    return () => handleDelete(index);
  }, [handleDelete]);

  // Handle section edit
  const handleEditStart = (e) => {
    e.stopPropagation();
    setSectionTitle(section.title); // Make sure we have the current title
    setIsEditing(true);
  };

  const handleEditSave = () => {
    if (sectionTitle.trim()) {
      // Pass the full section object with updated title
      onEditSection(section.id, {
        ...section,
        title: sectionTitle.trim()
      });
    } else {
      // If empty, revert to original title
      setSectionTitle(section.title);
    }
    setIsEditing(false);
  };

  // Handle section delete with confirmation
  const handleSectionDelete = (e) => {
    e.stopPropagation();
    
    // Count conversations in this section to warn the user
    const conversationCount = conversations.length;
    
    let confirmMessage = `Are you sure you want to delete the section "${section.title}"?`;
    
    // Add warning about conversations if any exist in this section
    if (conversationCount > 0) {
      confirmMessage += `\n\nThis section contains ${conversationCount} conversation${conversationCount !== 1 ? 's' : ''}.`;
      confirmMessage += `\n\nAfter deleting the section, you'll be asked if you want to delete these conversations or keep them.`;
    }
    
    // Show confirmation dialog
    if (window.confirm(confirmMessage)) {
      onDeleteSection(section.id);
    }
  };

  // Simplified drag-and-drop for the section
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
    
    // Ensure this section can show dotted lines while dragging is active
    const sectionElement = document.querySelector(`[data-section-id="${section.id}"]`);
    if (sectionElement) {
      sectionElement.dataset.forceDotted = "true";
    }
  };

  const handleDragLeave = (e) => {
    // Only set to false if we're not entering a child element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
      
      // Remove permission for dotted lines as soon as drag leaves
      const sectionElement = document.querySelector(`[data-section-id="${section.id}"]`);
      if (sectionElement) {
        delete sectionElement.dataset.forceDotted;
        sectionElement.style.borderStyle = 'solid';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up
    
    // Clear the drag highlight state aggressively
    setIsDragOver(false);
    
    // Super aggressive reset
    // Find the specific section first
    const thisSection = document.querySelector(`[data-section-id="${section.id}"]`);
    if (thisSection) {
      thisSection.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'border-blue-500', 'border-2', 'border-dashed', 'rounded-md');
      thisSection.style.backgroundColor = '';
      thisSection.style.borderColor = '';
      thisSection.style.borderStyle = 'solid';
      thisSection.style.borderWidth = '0 0 0 2px'; // Left border only
      
      // Immediately remove permission for dotted borders
      delete thisSection.dataset.forceDotted;
    }
    
    // Force clear all section highlights
    document.querySelectorAll('.section-container').forEach(sec => {
      // Add a data attribute to force redraw and CSS reset
      sec.dataset.dragActive = "false";
      sec.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'border-blue-500', 'border-2', 'border-dashed', 'rounded-md');
      setTimeout(() => {
        delete sec.dataset.dragActive;
      }, 10);
    });
    
    const convoId = e.dataTransfer.getData("conversationId");
    console.log("Drop on section. Conversation ID:", convoId, "Section ID:", section.id);
    
    if (convoId) {
      // Move conversation to this section
      onDrop(convoId, section.id);
      
      // Create and dispatch a custom event to notify other sections that a move occurred
      const moveEvent = new CustomEvent('convo-moved', { 
        detail: { convoId, toSectionId: section.id }
      });
      document.dispatchEvent(moveEvent);
      
      // Dispatch another DOM event to signal state changes
      document.dispatchEvent(new CustomEvent('force-highlight-reset'));
      
      // Force the body to update
      document.body.dataset.dragging = "false";
      
      // Final extreme measure to clear dotted lines
      setTimeout(() => {
        document.querySelectorAll('.border-dashed').forEach(el => {
          el.classList.remove('border-dashed');
          el.style.borderStyle = 'solid';
        });
      }, 50);
    }
  };
  
  // Add an effect to clear drag highlight state when drag ends
  useEffect(() => {
    // Add a global handler for dragstart to track if a convo from this section is being dragged
    const handleGlobalDragStart = (e) => {
      if (window.__DRAGGED_CONVO_ID) {
        // Check if the dragged convo belongs to this section
        const draggedConvoId = window.__DRAGGED_CONVO_ID;
        const belongsToThisSection = conversations.some(c => String(c.id) === draggedConvoId);
        
        if (belongsToThisSection) {
          // Mark this section as the origin
          window.__DRAG_ORIGIN_SECTION_ID = section.id;
          console.log(`Drag started from section ${section.id}`);
        }
      }
    };
    
    const clearDragStates = () => {
      setIsDragOver(false);
      
      // If this was the origin section, we need special handling when drag ends
      if (window.__DRAG_ORIGIN_SECTION_ID === section.id) {
        console.log(`Drag ended for origin section ${section.id}`);
        
        // Delete the origin section reference
        delete window.__DRAG_ORIGIN_SECTION_ID;
        
        // Force reset this section's highlight
        const sectionElement = document.querySelector(`[data-section-id="${section.id}"]`);
        if (sectionElement) {
          sectionElement.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'border-blue-500', 'border-2', 'border-dashed');
        }
      }
    };
    
    // Handle conversation moved events
    const handleConvoMoved = (e) => {
      const { convoId, toSectionId } = e.detail;
      
      // If the conversation was moved to this section, we're good
      // If it was moved to another section, we should ensure any highlights are cleared
      if (toSectionId !== section.id) {
        setIsDragOver(false);
      }
    };
    
    // Force reset on our custom event
    const handleForceReset = () => {
      console.log(`Force resetting highlights for section ${section.id}`);
      setIsDragOver(false);
      
      // Direct DOM manipulation for force-reset on this specific section
      const sectionElement = document.querySelector(`[data-section-id="${section.id}"]`);
      if (sectionElement) {
        sectionElement.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'border-blue-500', 'border-2', 'border-dashed');
        sectionElement.style.backgroundColor = '';
        sectionElement.style.borderColor = '';
        sectionElement.style.borderStyle = 'solid';
        
        // Always remove permission for dotted borders on reset
        delete sectionElement.dataset.forceDotted;
      }
    };
    
    document.addEventListener("dragstart", handleGlobalDragStart, true); // Use capture phase
    document.addEventListener("dragend", clearDragStates);
    document.addEventListener("drop", clearDragStates);
    document.addEventListener("convo-moved", handleConvoMoved);
    document.addEventListener("force-highlight-reset", handleForceReset);
    
    return () => {
      document.removeEventListener("dragstart", handleGlobalDragStart, true);
      document.removeEventListener("dragend", clearDragStates);
      document.removeEventListener("drop", clearDragStates);
      document.removeEventListener("convo-moved", handleConvoMoved);
      document.removeEventListener("force-highlight-reset", handleForceReset);
    };
  }, [section.id, conversations]);

  const classNames = {
    unselected: "flex w-full flex-col gap-y-2 rounded-lg p-2.5 text-left transition-colors duration-200 hover:bg-slate-200 focus:outline-none dark:hover:bg-slate-800 whitespace-normal mb-4",
    selected: "flex w-full flex-col gap-y-2 rounded-lg bg-slate-200 p-2.5 text-left transition-colors duration-200 focus:outline-none dark:bg-slate-800 whitespace-normal mb-4",
    dragOver: "flex w-full flex-col gap-y-2 rounded-lg p-2.5 text-left transition-colors duration-200 focus:outline-none border-2 border-dashed border-blue-500 bg-slate-100 dark:bg-slate-700 whitespace-normal mb-4"
  };
  
  // Helper function to get the appropriate class name for a conversation
  const getConvoClassName = (convo) => {
    if (dragOverConvoId === convo.id) {
      return classNames.dragOver;
    }
    return selectedConvo === convo.id ? classNames.selected : classNames.unselected;
  };

  
  return (
    <div 
      className={`section-container mb-4 border-l-2 border-slate-300 dark:border-slate-700 pl-2 ${isDragOver || isSectionDragOver ? 'bg-slate-100 dark:bg-slate-800 border-blue-500 border-2 border-dashed rounded-md transition-colors duration-200' : 'transition-colors duration-200'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-section-id={section.id} // Add data attribute for debugging
    >
      <div 
        className="flex items-center justify-between py-1.5 px-2 mb-2 bg-slate-100 dark:bg-slate-800 rounded-md cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
        onClick={isEditing ? null : toggleCollapse}
        draggable={!isEditing}
        onDragStart={handleSectionDragStart}
        onDragEnd={handleSectionDragEnd}
        onDragOver={(e) => onSectionDragOver && onSectionDragOver(e, section.id)}
        onDragLeave={(e) => onSectionDragLeave && onSectionDragLeave(e)}
        onDrop={(e) => onSectionDrop && onSectionDrop(e, section.id)}
      >
        <div className="flex items-center">
          <svg 
            className={`h-3.5 w-3.5 mr-1 transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          
          {isEditing ? (
            <input
              type="text"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
              className="w-40 text-sm bg-white dark:bg-slate-600 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="font-medium text-sm truncate max-w-[140px]" title={section.title}>
              {section.title.length > 13 ? section.title.substring(0, 13) + '...' : section.title}
            </span>
          )}
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={handleEditStart}
            className="p-0.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            aria-label="Edit section"
          >
            <svg 
              className="w-3.5 h-3.5" 
              aria-hidden="true" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <path 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="m14.3 4.8 2.9 2.9M7 7H4a1 1 0 0 0-1 1v10c0 .6.4 1 1 1h11c.6 0 1-.4 1-1v-4.5m2.4-10a2 2 0 0 1 0 3l-6.8 6.8L8 14l.7-3.6 6.9-6.8a2 2 0 0 1 2.8 0Z"
              />
            </svg>
          </button>
          <button
            onClick={handleSectionDelete}
            className="p-0.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            aria-label="Delete section"
          >
            <svg
              className="w-3.5 h-3.5"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
              />
            </svg>
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div 
          className="pl-2" 
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent propagation to parent
            // Use the section's own handler
            handleDragOver(e);
          }}
          onDragLeave={(e) => {
            e.stopPropagation(); // Prevent propagation to parent
            // Use the section's own handler
            handleDragLeave(e);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent propagation to parent
            handleDrop(e);
          }}
          onDragEnd={() => setIsDragOver(false)} // Clear highlight state
        >
          {conversations.length === 0 && (
            <div className="py-2 text-center text-xs text-slate-500 dark:text-slate-400 italic">
              Drop conversations here
            </div>
          )}
          {conversations.map((convo) => (
            <div 
              key={convo.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Stop event propagation
                e.dataTransfer.dropEffect = "move";
                // Call the parent onDragOver for conversation-specific handling
                if (onDragOver) {
                  onDragOver(e, convo.id);
                }
              }}
              onDragLeave={(e) => {
                e.stopPropagation(); // Stop event propagation
                // Call the parent onDragLeave for conversation-specific handling
                if (onDragLeave) {
                  onDragLeave();
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Stop propagation to prevent section drop
                
                const draggedId = e.dataTransfer.getData("conversationId");
                console.log("Drop on conversation:", draggedId, "Target:", convo.id);
                
                if (draggedId !== String(convo.id)) {
                  handleReorderConvos(draggedId, convo.id);
                  
                  // Also dispatch the move event to clear other highlights
                  const moveEvent = new CustomEvent('convo-moved', {
                    detail: { convoId: draggedId, toSectionId: section.id }
                  });
                  document.dispatchEvent(moveEvent);
                }
                
                // Always clear the section highlight state
                setIsDragOver(false);
              }}
              onDragEnd={() => setIsDragOver(false)} // Clear state on drag end
            >
              <ConvoList
                className={getConvoClassName(convo)}
                title={convo.title}
                date={convo.date}
                id={convo.id}
                onClick={createSelectHandler(convo.id)}
                onDelete={createDeleteHandler(convo.id)}
                onRename={(newTitle) => handleRename(convo.id, newTitle)}
                draggable={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(Section);