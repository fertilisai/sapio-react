import React from 'react';

export default function ToggleSwitch({ id, label, checked, onChange, disabled = false }) {
  // Create a handler for clicking on the toggle
  const handleToggleClick = () => {
    if (!disabled && onChange) {
      onChange();
    }
  };

  return (
    <div 
      className={`flex items-center justify-between mb-4 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={disabled ? undefined : handleToggleClick}
    >
      <label 
        htmlFor={id} 
        className={`text-sm font-medium text-slate-700 dark:text-slate-300 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {label}
      </label>
      <div className={`relative inline-block w-10 align-middle select-none ${disabled ? 'opacity-60' : ''}`}>
        <input
          type="checkbox"
          name={id}
          id={id}
          checked={checked}
          onChange={(e) => {
            // Added to prevent the onChange event from being called twice
            e.stopPropagation();
            if (!disabled && onChange) {
              onChange();
            }
          }}
          disabled={disabled}
          className="sr-only"
        />
        <div 
          className={`block w-10 h-6 rounded-full ${
            checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
          } transition duration-200 ease-in ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleClick();
          }}
        ></div>
        <div 
          className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        ></div>
      </div>
    </div>
  );
}