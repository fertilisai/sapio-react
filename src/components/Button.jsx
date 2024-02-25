export default function Button(props) {
  return (
    <div className=" text-slate-800 dark:border-slate-700 dark:text-slate-200">
      <button
        type="button"
        className="mt-4 block w-full rounded-lg bg-slate-200 p-2.5 text-xs font-semibold hover:bg-blue-600 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600"
      >
        {props.label}
      </button>
    </div>
  );
}
