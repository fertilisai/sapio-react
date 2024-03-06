export default function ConvoList(props) {
  return (
    <a href="#" className={props.className} onClick={props.onClick}>
      <h1 className="text-sm font-medium capitalize text-slate-700 dark:text-slate-200">
        {props.title}
      </h1>
      <div className="flex w-full flex-col items-start lg:flex-row lg:justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {props.date}
        </p>
        <div className="mt-4 flex flex-row justify-start gap-x-2 text-slate-500 lg:mt-0">
          <button
            className="hover:text-red-600"
            type="button"
            onClick={props.onDelete}
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
