import React, { memo, useCallback, useMemo, useState, useEffect } from "react";
import Button from "./Button.jsx";
import ConvoList from "./ConvoList.jsx";
import Section from "./Section.jsx";

function capitalize(s) {
  return s && s[0].toUpperCase() + s.slice(1);
}

function LeftSidebar({
  icon,
  convoList,
  sections,
  selectedConvo,
  handleSelect,
  handleDelete,
  handleRename,
  handleNewChat: handleNewConversation,
  handleNewSection,
  handleEditSection,
  handleDeleteSection,
  handleMoveConvo,
  handleReorderConvos,
  handleReorderSections,
}) {
  // Set up global handlers for drag and drop
  useEffect(() => {
    // Make sure all dragover events get preventDefault to allow drops
    const handleGlobalDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };

    // Clear all drag states when drag ends or escapes
    const handleGlobalDragEnd = () => {
      // Reset all React states
      setDragOverConvoId(null);
      setIsUnsectionedDragOver(false);
      setDragOverSectionId(null);

      // Force reset all section highlights with clean removal of classes
      document.querySelectorAll(".section-container").forEach((sec) => {
        sec.dataset.dragActive = "false";
        sec.dataset.dragHighlight = "false";
        sec.classList.remove(
          "bg-slate-100",
          "dark:bg-slate-800",
          "border-blue-500",
          "border-2",
          "border-dashed"
        );

        // Reset any inline styles that might have been added
        sec.style.backgroundColor = "";
        sec.style.borderColor = "";
        sec.style.borderStyle = "solid";
        sec.style.borderWidth = "";

        // Clean up data attributes
        delete sec.dataset.forceDotted;
      });

      // Clean up any drag-related global state
      delete window.__DRAGGED_SECTION_ID;
      delete window.__DRAGGED_CONVO_ID;
      delete window.__DRAG_ORIGIN_SECTION_ID;

      // Notify all components to reset their drag states
      document.dispatchEvent(new CustomEvent("force-highlight-reset"));

      // CONSISTENT CLEANUP: Always use delete to remove data attributes
      delete document.body.dataset.dragActive;
      delete document.body.dataset.dragging;
      delete document.body.dataset.mouseDown;
      delete document.body.dataset.draggingSection;

      // Force UI redraw with a minimal opacity change - without redundant cleanup
      requestAnimationFrame(() => {
        document.body.style.opacity = "0.99";
        requestAnimationFrame(() => {
          document.body.style.opacity = "1";
        });
      });
    };

    // Special handler for the case when a drag operation ends outside any drop zone
    const handleWindowDragEnd = (e) => {
      console.log("Window drag end detected");

      // First reset any elements with opacity from drag operations
      document.querySelectorAll(".opacity-50").forEach((el) => {
        el.classList.remove("opacity-50");
      });

      // Clean up global variables that might be affecting component display
      delete window.__DRAGGED_SECTION_ID;
      delete window.__DRAGGED_CONVO_ID;
      delete window.__DRAG_ORIGIN_SECTION_ID;

      // Reset all section highlights
      document.querySelectorAll(".section-container").forEach((el) => {
        // Mark as needing cleanup
        el.dataset.dragInteraction = "true";

        // Remove all drag-related classes
        el.classList.remove(
          "bg-slate-100",
          "dark:bg-slate-800",
          "border-blue-500",
          "border-2",
          "border-dashed",
          "rounded-md",
          "drag-highlight",
          "drag-over"
        );

        // Reset inline styles
        el.style.backgroundColor = "";
        el.style.borderColor = "";
        el.style.borderStyle = "solid";
        el.style.borderWidth = el.classList.contains("section-container")
          ? "0 0 0 2px"
          : "";
        el.style.opacity = "";

        // Clear any data attributes
        delete el.dataset.forceDotted;
        delete el.dataset.dragActive;
      });

      // Clean up any conversation elements
      document.querySelectorAll(".drag-over").forEach((el) => {
        el.classList.remove(
          "drag-over",
          "border-dashed",
          "border-2",
          "border-blue-500"
        );
      });

      // Call the standard handler to reset React state
      handleGlobalDragEnd();

      // Force full page repaint
      document.documentElement.style.display = "none";
      // This triggers a reflow
      void document.documentElement.offsetHeight;
      document.documentElement.style.display = "";
    };

    document.addEventListener("dragover", handleGlobalDragOver);
    document.addEventListener("dragend", handleGlobalDragEnd);
    document.addEventListener("drop", handleGlobalDragEnd);
    window.addEventListener("dragend", handleWindowDragEnd, true); // Capture phase

    // Handle dragleave when the drag leaves the document
    const handleDocumentDragLeave = (e) => {
      if (
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        handleGlobalDragEnd();
      }
    };

    document.addEventListener("dragleave", handleDocumentDragLeave);

    return () => {
      document.removeEventListener("dragover", handleGlobalDragOver);
      document.removeEventListener("dragend", handleGlobalDragEnd);
      document.removeEventListener("drop", handleGlobalDragEnd);
      document.removeEventListener("dragleave", handleDocumentDragLeave);
      window.removeEventListener("dragend", handleWindowDragEnd, true);
    };
  }, []);

  const [dragOverConvoId, setDragOverConvoId] = useState(null);
  const [dragOverSectionId, setDragOverSectionId] = useState(null);

  // Helper function to get section ID from drag event
  function getSectionIdFromDragEvent(e) {
    try {
      // Check for the custom MIME type first
      if (e.dataTransfer.types.includes("application/x-section")) {
        return e.dataTransfer.getData("application/x-section");
      }

      // Next check for prefixed text/plain format
      const textData = e.dataTransfer.getData("text/plain");
      if (textData && textData.startsWith("section-")) {
        return textData.replace("section-", "");
      }

      // Finally, fall back to the global variable
      return window.__DRAGGED_SECTION_ID;
    } catch (error) {
      console.error("Error getting section ID from drag event:", error);
      return window.__DRAGGED_SECTION_ID;
    }
  }

  // Memoize class strings to prevent unnecessary recalculations
  const classNames = useMemo(
    () => ({
      unselected:
        "flex w-full flex-col gap-y-2 rounded-lg p-2.5 text-left transition-colors duration-200 hover:bg-slate-200 focus:outline-none dark:hover:bg-slate-800 whitespace-normal mb-4",
      selected:
        "flex w-full flex-col gap-y-2 rounded-lg bg-slate-200 p-2.5 text-left transition-colors duration-200 focus:outline-none dark:bg-slate-800 whitespace-normal mb-4",
      dragOver:
        "flex w-full flex-col gap-y-2 rounded-lg p-2.5 text-left transition-colors duration-200 focus:outline-none border-2 border-dashed border-blue-500 bg-slate-100 dark:bg-slate-700 whitespace-normal mb-4",
      sectionDragOver:
        "bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-blue-500 rounded-md transition-colors duration-200",
    }),
    []
  );

  // Memoize the button labels
  const buttonLabel = useMemo(() => {
    if (icon === "chat") {
      return "New Conversation";
    }
    return `New ${capitalize(icon)}`;
  }, [icon]);

  // Memoize the capitalized title
  const title = useMemo(() => {
    if (icon === "chat") {
      return "Conversations";
    }
    return `${capitalize(icon)}s`;
  }, [icon]);

  // Create memoized handlers for each item to prevent re-creation on each render
  const createSelectHandler = useCallback(
    (index) => {
      return () => handleSelect(index);
    },
    [handleSelect]
  );

  const createDeleteHandler = useCallback(
    (index) => {
      return () => handleDelete(index);
    },
    [handleDelete]
  );

  // Get unsectioned conversations
  const unsectionedConvos = useMemo(() => {
    return convoList.filter((convo) => !convo.sectionId);
  }, [convoList]);

  // Get conversations by section
  const getConversationsForSection = useCallback(
    (sectionId) => {
      return convoList.filter((convo) => convo.sectionId === sectionId);
    },
    [convoList]
  );

  // Simplified drag and drop handlers for conversation reordering
  const handleDragOver = useCallback((e, convoId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverConvoId(convoId);
  }, []);

  const handleDragLeave = useCallback((e) => {
    // Only reset if we're not entering a child element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverConvoId(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e, targetConvoId) => {
      e.preventDefault();
      // Always clear highlight state after drop
      setDragOverConvoId(null);
      setIsUnsectionedDragOver(false);

      const draggedConvoId = e.dataTransfer.getData("conversationId");
      console.log(
        "Drop to reorder. Dragged:",
        draggedConvoId,
        "Target:",
        targetConvoId
      );

      if (
        draggedConvoId &&
        targetConvoId &&
        draggedConvoId !== String(targetConvoId)
      ) {
        handleReorderConvos(draggedConvoId, targetConvoId);
      }
    },
    [handleReorderConvos]
  );

  // Helper to get the appropriate class name based on the conversation state
  const getConvoClassName = useCallback(
    (convo) => {
      if (dragOverConvoId === convo.id) {
        return classNames.dragOver;
      }
      return selectedConvo === convo.id
        ? classNames.selected
        : classNames.unselected;
    },
    [classNames, selectedConvo, dragOverConvoId]
  );

  // Add a drop area for removing from section
  const [isUnsectionedDragOver, setIsUnsectionedDragOver] = useState(false);

  // Listen for move events to reset unsectioned highlight state
  useEffect(() => {
    const handleConvoMoved = (e) => {
      const { toSectionId } = e.detail;

      // If moved to a section, we should clear the unsectioned highlight
      if (toSectionId !== null) {
        setIsUnsectionedDragOver(false);
      }
    };

    // Force reset handler
    const handleForceReset = () => {
      console.log("Force resetting highlights for unsectioned area");
      setIsUnsectionedDragOver(false);
      setDragOverConvoId(null);

      // Directly remove permission for dotted borders
      const unsectionedArea = document.querySelector(".unsectioned-area");
      if (unsectionedArea) {
        delete unsectionedArea.dataset.forceDotted;
        unsectionedArea.style.borderStyle = "solid";
      }
    };

    document.addEventListener("convo-moved", handleConvoMoved);
    document.addEventListener("force-highlight-reset", handleForceReset);

    return () => {
      document.removeEventListener("convo-moved", handleConvoMoved);
      document.removeEventListener("force-highlight-reset", handleForceReset);
    };
  }, []);

  const handleUnsectionedDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsUnsectionedDragOver(true);

    // Explicitly allow dotted borders during drag over
    const unsectionedArea = document.querySelector(".unsectioned-area");
    if (unsectionedArea) {
      unsectionedArea.dataset.forceDotted = "true";
    }
  };

  const handleUnsectionedDragLeave = (e) => {
    // Only set to false if we're not entering a child element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsUnsectionedDragOver(false);

      // Remove permission for dotted lines as soon as drag leaves
      const unsectionedArea = document.querySelector(".unsectioned-area");
      if (unsectionedArea) {
        delete unsectionedArea.dataset.forceDotted;
        unsectionedArea.style.borderStyle = "solid";
      }
    }
  };

  const handleUnsectionedDrop = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up
    setIsUnsectionedDragOver(false);

    // Direct access to the unsectioned area element
    const unsectionedArea = document.querySelector(".unsectioned-area");
    if (unsectionedArea) {
      unsectionedArea.classList.remove(
        "bg-slate-100",
        "dark:bg-slate-800",
        "border-blue-500",
        "border-2",
        "border-dashed",
        "rounded-md"
      );
      unsectionedArea.style.backgroundColor = "";
      unsectionedArea.style.borderColor = "";
      unsectionedArea.style.borderStyle = "solid";
      unsectionedArea.style.borderWidth = "0";

      // Explicitly remove permission for dotted borders
      delete unsectionedArea.dataset.forceDotted;
    }

    // Force clear all section highlights
    document.querySelectorAll(".section-container").forEach((sec) => {
      // Add a data attribute to force redraw and CSS reset
      sec.dataset.dragActive = "false";
      sec.classList.remove(
        "bg-slate-100",
        "dark:bg-slate-800",
        "border-blue-500",
        "border-2",
        "border-dashed",
        "rounded-md"
      );
      sec.style.borderStyle = "solid";
      setTimeout(() => {
        delete sec.dataset.dragActive;
      }, 10);
    });

    const draggedId = e.dataTransfer.getData("conversationId");
    const sectionId = getSectionIdFromDragEvent(e);

    if (sectionId) {
      // If a section was dragged to the top, reorder it to the beginning
      console.log("Section dropped on unsectioned area:", sectionId);
      if (handleReorderSections) {
        handleReorderSections(sectionId, "top");
      }
    } else if (draggedId) {
      // If a conversation was dragged, handle it normally
      console.log("Drop on unsectioned area. Conversation ID:", draggedId);

      // Pass null to remove from any section
      handleMoveConvo(draggedId, null);

      // Create and dispatch a custom event to notify other components
      const moveEvent = new CustomEvent("convo-moved", {
        detail: { convoId: draggedId, toSectionId: null },
      });
      document.dispatchEvent(moveEvent);
    }

    // Force the body to update - use delete for consistency
    delete document.body.dataset.dragging;

    // Dispatch the force reset event
    document.dispatchEvent(new CustomEvent("force-highlight-reset"));

    // Final extreme measure to clear dotted lines
    setTimeout(() => {
      document.querySelectorAll(".border-dashed").forEach((el) => {
        el.classList.remove("border-dashed");
        el.style.borderStyle = "solid";
      });
    }, 50);
  };

  // Section drag handlers
  const handleSectionDragOver = (e, sectionId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSectionId(sectionId);

    console.log("Section drag over:", sectionId);

    // Add visual feedback
    const sectionElement = document.querySelector(
      `[data-section-id="${sectionId}"]`
    );
    if (sectionElement) {
      sectionElement.classList.add(
        "bg-slate-100",
        "dark:bg-slate-800",
        "border-blue-500",
        "border-2",
        "border-dashed"
      );
      sectionElement.dataset.forceDotted = "true";
    }
  };

  const handleSectionDragLeave = (e) => {
    // Only reset if we're not entering a child element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverSectionId(null);

      // Remove highlights
      document.querySelectorAll(".section-container").forEach((sec) => {
        if (sec.dataset.forceDotted) {
          delete sec.dataset.forceDotted;
          sec.style.borderStyle = "solid";
        }
      });
    }
  };

  const handleSectionDrop = (e, targetSectionId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSectionId(null);

    // Get the dragged section ID
    const draggedSectionId = getSectionIdFromDragEvent(e);
    console.log(
      "Section drop. Dragged:",
      draggedSectionId,
      "Target:",
      targetSectionId
    );

    if (draggedSectionId && draggedSectionId !== targetSectionId) {
      // Reorder sections
      if (handleReorderSections) {
        handleReorderSections(draggedSectionId, targetSectionId);
      }
    }

    // Clean up any highlight styles
    document.querySelectorAll(".section-container").forEach((sec) => {
      sec.classList.remove(
        "bg-slate-100",
        "dark:bg-slate-800",
        "border-blue-500",
        "border-2",
        "border-dashed"
      );
      sec.style.backgroundColor = "";
      sec.style.borderColor = "";
      sec.style.borderStyle = "solid";
      sec.style.borderWidth = "0 0 0 2px"; // Left border only
      delete sec.dataset.forceDotted;
    });

    // Force reset
    document.dispatchEvent(new CustomEvent("force-highlight-reset"));
  };

  return (
    <div className="h-screen overflow-y-auto bg-slate-50 py-8 dark:bg-slate-900 w-[320px] sm:w-60">
      <div className="text-center mb-6 pt-2">
        <h2 className="text-xl font-medium text-slate-800 dark:text-slate-200 inline-block px-4 py-1 border-b-2 border-blue-500">
          {title}
        </h2>
      </div>

      <div
        className={`section-container unsectioned-area px-4 py-4 space-y-4 ${
          isUnsectionedDragOver
            ? "bg-slate-100 dark:bg-slate-800 border-2 border-blue-500 rounded-md transition-colors duration-200"
            : "transition-colors duration-200"
        }`}
        onDragOver={handleUnsectionedDragOver}
        onDragLeave={handleUnsectionedDragLeave}
        onDrop={handleUnsectionedDrop}
        data-section-id="unsectioned" // Add data attribute for easier selection
      >
        <Button label={buttonLabel} takeAction={handleNewConversation} />
        <Button
          label="New Section"
          takeAction={handleNewSection}
          className="mt-2"
        />

        {/* Unsectioned conversations with drop zones between them */}
        {unsectionedConvos.map((convo, index) => (
          <React.Fragment key={convo.id}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                handleDragOver(e, convo.id);
              }}
              onDragLeave={() => handleDragLeave()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Stop propagation to prevent unsectioned drop

                const draggedId = e.dataTransfer.getData("conversationId");
                const sectionId = getSectionIdFromDragEvent(e);

                if (sectionId) {
                  // This is a section being dropped on a conversation
                  console.log(
                    "Section dropped on conversation:",
                    sectionId,
                    "Target:",
                    convo.id
                  );
                  if (handleReorderSections) {
                    // Position after this conversation
                    handleReorderSections(sectionId, `after-${convo.id}`);
                  }
                } else if (draggedId && draggedId !== String(convo.id)) {
                  // If dropping a conversation on an unsectioned conversation, use reorder
                  handleReorderConvos(draggedId, convo.id);
                }
              }}
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
          </React.Fragment>
        ))}

        {/* Sections */}
        {sections.map((section) => (
          <Section
            key={section.id}
            section={section}
            conversations={getConversationsForSection(section.id)}
            selectedConvo={selectedConvo}
            handleSelect={handleSelect}
            handleDelete={handleDelete}
            handleRename={handleRename}
            onEditSection={handleEditSection}
            onDeleteSection={handleDeleteSection}
            onDrop={handleMoveConvo}
            handleReorderConvos={handleReorderConvos}
            dragOverConvoId={dragOverConvoId}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            isSectionDragOver={dragOverSectionId === section.id}
            onSectionDragOver={handleSectionDragOver}
            onSectionDragLeave={handleSectionDragLeave}
            onSectionDrop={handleSectionDrop}
          />
        ))}
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(LeftSidebar);
