import React, { useState, useEffect } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

export default function SystemPromptModal({ isOpen, onClose, currentPrompt, onSave }) {
  const [systemPrompt, setSystemPrompt] = useState('');
  
  // Initialize system prompt when modal opens
  useEffect(() => {
    if (isOpen) {
      setSystemPrompt(currentPrompt || "You are a helpful assistant.");
    }
  }, [isOpen, currentPrompt]);
  
  const handleSave = () => {
    if (typeof onSave === 'function') {
      onSave(systemPrompt);
    } else {
      console.error("onSave is not a function", onSave);
    }
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="System Prompt">
      <div className="space-y-4">
        <p className="text-slate-700 dark:text-slate-300 mb-2">
          System prompts help set the behavior and capabilities of the AI model. Use this to provide context, instructions, or constraints for the conversation.
        </p>
        
        <div>
          <label 
            htmlFor="systemPrompt" 
            className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            System Prompt
          </label>
          <textarea
            id="systemPrompt"
            className="w-full h-40 rounded-md border border-slate-300 bg-slate-50 p-2 text-base text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-400 dark:focus:border-blue-600"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful assistant..."
          />
        </div>
        
        <div className="flex justify-between pt-4">
          <Button 
            label="Cancel" 
            takeAction={onClose} 
            buttonType="secondary"
          />
          <Button 
            label="Save" 
            takeAction={handleSave} 
          />
        </div>
      </div>
    </Modal>
  );
}