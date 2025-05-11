import React, { memo } from "react";

function Button({ label, takeAction, buttonType = "primary", className = "" }) {
  const buttonStyles = {
    primary:
      "block w-full rounded-lg bg-slate-200 p-2.5 text-sm font-semibold hover:bg-blue-600 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 transition-colors duration-200",
    secondary:
      "block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors duration-200",
  };

  return (
    <div
      className={`text-slate-800 dark:border-slate-700 dark:text-slate-200 ${className}`}
    >
      <button
        type="button"
        className={buttonStyles[buttonType] || buttonStyles.primary}
        onClick={takeAction}
      >
        {label}
      </button>
    </div>
  );
}

// Memoize the button component to prevent unnecessary re-renders
export default memo(Button);
