import React, { memo, useState, useRef, useEffect } from "react";

function ConvoList({
  className,
  onClick,
  title,
  date,
  onDelete,
  onRename,
  id,
  draggable = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Update edited title when title prop changes
  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  // Prevent event bubbling on delete click
  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  };

  // Handle edit button click
  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  // Handle saving the edited title
  const handleSave = (e) => {
    e.preventDefault();
    if (editedTitle.trim()) {
      onRename(editedTitle.trim());
    } else {
      setEditedTitle(title); // Revert to original if empty
    }
    setIsEditing(false);
  };

  // Handle input change
  const handleChange = (e) => {
    setEditedTitle(e.target.value);
  };

  // Handle key press in input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave(e);
    } else if (e.key === "Escape") {
      setEditedTitle(title); // Revert to original
      setIsEditing(false);
    }
  };

  // Handle click outside to cancel editing
  const handleClickOutside = (e) => {
    if (isEditing && inputRef.current && !inputRef.current.contains(e.target)) {
      setEditedTitle(title);
      setIsEditing(false);
    }
  };

  // Set up click outside listener
  useEffect(() => {
    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, title]);

  // Simplified drag and drop handlers
  const handleDragStart = (e) => {
    // Make sure we have a valid ID to use
    if (id) {
      // Set the ID as a string to ensure consistency
      e.dataTransfer.setData("conversationId", String(id));
      console.log("Drag started, conversation ID:", id);
      e.dataTransfer.effectAllowed = "move";
      setIsDragging(true);

      // Add a class to the HTML element for visual feedback
      e.target.classList.add("opacity-50");

      // Store the dragged item's ID in a global variable for reference
      window.__DRAGGED_CONVO_ID = String(id);

      // Add a class to the body for styling instead of using data attributes
      document.body.classList.add("is-dragging");

      // Track mouse button being held down with a class instead
      document.body.classList.add("mouse-down");

      // Explicitly allow dotted borders ONLY during active drag operations
      document.querySelectorAll(".section-container").forEach((section) => {
        section.dataset.forceDotted = "true";
        section.classList.add("border-dashed"); // Add class for dotted borders
      });

      // Create a transparent element to handle releasing the drag
      const ghostTracker = document.createElement("div");
      ghostTracker.style.position = "fixed";
      ghostTracker.style.top = "0";
      ghostTracker.style.left = "0";
      ghostTracker.style.width = "100vw";
      ghostTracker.style.height = "100vh";
      ghostTracker.style.pointerEvents = "none";
      ghostTracker.style.opacity = "0";
      ghostTracker.id = "ghost-tracker";
      document.body.appendChild(ghostTracker);
    }
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);

    // Remove visual feedback class
    if (e && e.target) {
      e.target.classList.remove("opacity-50");
    }

    // Clear all dragging classes from all elements - very aggressive approach
    document.querySelectorAll(".opacity-50").forEach((el) => {
      el.classList.remove("opacity-50");
    });

    // IMMEDIATELY remove permission for dotted borders
    document.querySelectorAll("[data-force-dotted]").forEach((el) => {
      delete el.dataset.forceDotted;
    });

    // Force reset all section containers
    document.querySelectorAll(".section-container").forEach((section) => {
      section.classList.remove(
        "bg-slate-100",
        "dark:bg-slate-800",
        "border-blue-500",
        "border-2",
        "border-dashed",
        "rounded-md"
      );
      section.style.backgroundColor = "";
      section.style.borderColor = "";
      section.style.borderStyle = "solid";
      section.style.borderWidth = "";

      // Add and remove class to force a repaint
      section.classList.add("force-repaint");
      setTimeout(() => section.classList.remove("force-repaint"), 0);
    });

    // Reset global dragging state
    delete window.__DRAGGED_CONVO_ID;
    document.body.classList.remove("is-dragging");
    document.body.classList.remove("mouse-down");

    // Force reset all highlight states
    document.dispatchEvent(new CustomEvent("force-highlight-reset"));

    // Force a body repaint to clear any lingering styles
    document.body.style.display = "none";
    document.body.offsetHeight; // Force reflow
    document.body.style.display = "";

    // Remove ghost tracker element
    const ghostTracker = document.getElementById("ghost-tracker");
    if (ghostTracker) {
      ghostTracker.remove();
    }

    // Final sweep for any lingering dotted borders
    setTimeout(() => {
      document
        .querySelectorAll('.border-dashed, [style*="border-style: dashed"]')
        .forEach((el) => {
          el.classList.remove("border-dashed");
          el.style.borderStyle = "solid";
        });
    }, 10);
  };

  // Reset dragging state globally when any drag ends
  useEffect(() => {
    const resetDragState = () => {
      setIsDragging(false);
      // Can't access e.target here, so we'll remove the class from all draggable elements
      const draggables = document.querySelectorAll('[draggable="true"]');
      draggables.forEach((el) => el.classList.remove("opacity-50"));
    };

    // Also listen for the convo-moved event to clear drag state
    const handleConvoMoved = () => {
      setIsDragging(false);
      // Force clear all opacity classes on draggable elements
      const draggables = document.querySelectorAll('[draggable="true"]');
      draggables.forEach((el) => el.classList.remove("opacity-50"));
    };

    // Handle mouseup anywhere to clear dotted lines immediately
    const handleGlobalMouseUp = () => {
      // When mouse button is released, immediately clear dotted borders
      document.querySelectorAll(".section-container").forEach((section) => {
        delete section.dataset.forceDotted;
        section.style.borderStyle = "solid";
        section.classList.remove("border-dashed");
      });
      document.body.classList.remove("mouse-down");

      // Dispatch event to signal everyone to clear states
      document.dispatchEvent(new CustomEvent("force-highlight-reset"));
    };

    document.addEventListener("dragend", resetDragState);
    document.addEventListener("drop", resetDragState);
    document.addEventListener("convo-moved", handleConvoMoved);
    document.addEventListener("mouseup", handleGlobalMouseUp, true); // Capture phase

    return () => {
      document.removeEventListener("dragend", resetDragState);
      document.removeEventListener("drop", resetDragState);
      document.removeEventListener("convo-moved", handleConvoMoved);
      document.removeEventListener("mouseup", handleGlobalMouseUp, true);
    };
  }, []);

  return (
    <a
      href="#"
      className={`${className} ${isDragging ? "opacity-50" : ""}`}
      onClick={isEditing ? null : onClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseDown={() => document.body.classList.add("mouse-down")}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="w-full text-sm rounded-lg bg-slate-200 p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-600"
          value={editedTitle}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
        />
      ) : (
        <h1
          className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate w-full"
          title={title}
        >
          {title.length > 30 ? title.substring(0, 30) + "..." : title}
        </h1>
      )}
      <div className="flex w-full flex-col items-start lg:flex-row lg:justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">{date}</p>
        <div className="mt-4 flex flex-row justify-start gap-x-2 text-slate-500 lg:mt-0">
          <button
            className="hover:text-blue-600"
            type="button"
            onClick={handleEditClick}
            aria-label="Rename conversation"
          >
            <svg
              className="w-4 h-4"
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
                d="m14.3 4.8 2.9 2.9M7 7H4a1 1 0 0 0-1 1v10c0 .6.4 1 1 1h11c.6 0 1-.4 1-1v-4.5m2.4-10a2 2 0 0 1 0 3l-6.8 6.8L8 14l.7-3.6 6.9-6.8a2 2 0 0 1 2.8 0Z"
              />
            </svg>
          </button>
          <button
            className="hover:text-red-600"
            type="button"
            onClick={handleDeleteClick}
            aria-label="Delete conversation"
          >
            <svg
              className="w-4 h-4"
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
                d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
              />
            </svg>
          </button>
        </div>
      </div>
    </a>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(ConvoList);
