import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, title, children }) {
  const modalRef = useRef(null);
  const modalRoot = document.getElementById('modal-root') || document.body;

  // Create a div for the modal
  useEffect(() => {
    // Create a div for the modal if it doesn't exist
    if (!document.getElementById('modal-root')) {
      const modalRootDiv = document.createElement('div');
      modalRootDiv.id = 'modal-root';
      // Style to ensure it's at the top of the DOM
      modalRootDiv.style.position = 'relative';
      modalRootDiv.style.zIndex = '99999';
      document.body.appendChild(modalRootDiv);
    }
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling on body when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Restore scrolling when modal is closed
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  // Use createPortal to render the modal outside the normal DOM hierarchy

  return createPortal(
    <div id="modal-overlay" className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, pointerEvents: 'auto' }}>
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[80vh] overflow-auto rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800"
        style={{ position: 'relative', zIndex: 99999 }}
      >
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3 dark:border-slate-700">
          <h3 className="text-xl font-medium text-slate-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg bg-transparent p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>,
    modalRoot
  );
}