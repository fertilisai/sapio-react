export default function Alert(props) {
  const type = {
    success: "border-green-600",
    warning: "border-amber-600",
    error: "border-red-600",
  };

  return (
    <div
      role="alert"
      className="flex w-full max-w-md items-start justify-between rounded-r-xl border-l-4 border-red-600 bg-slate-50 p-4 text-slate-800 shadow-xl dark:bg-slate-800 dark:text-slate-50"
    >
      <div className="flex gap-4">
        <div className="flex-1">
          <strong className="block font-medium">{props.label}</strong>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {props.content}
          </p>
        </div>
      </div>
      <button className="text-slate-500 transition hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-500">
        <span className="sr-only">Dismiss popup</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
