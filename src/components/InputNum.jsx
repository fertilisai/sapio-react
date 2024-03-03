export default function InputNum(props) {
  return (
    <>
      <label
        htmlFor={props.label.replace(/\W+/g, "-").toLowerCase()}
        className="mb-2 mt-4 block px-2 text-sm font-medium"
      >
        {props.label}
      </label>
      <input
        type="number"
        id={props.label.replace(/\W+/g, "-").toLowerCase()}
        name={props.label.replace(/\W+/g, "-").toLowerCase()}
        className="block w-full rounded-lg bg-slate-200 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-800 dark:placeholder-slate-400 dark:focus:ring-blue-600"
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step}
        onChange={props.onChange}
      />
    </>
  );
}
