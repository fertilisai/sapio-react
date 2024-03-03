export default function InputSelect(props) {
  return (
    <>
      <label
        htmlFor={props.label.replace(/\W+/g, "-").toLowerCase()}
        className="mb-2 mt-4 block px-2 text-sm font-medium"
      >
        {props.label}
      </label>
      <select
        name={props.label.replace(/\W+/g, "-").toLowerCase()}
        id={props.label.replace(/\W+/g, "-").toLowerCase()}
        className="block w-full cursor-pointer rounded-lg border-r-4 border-transparent bg-slate-200 py-3 pl-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-800 dark:placeholder-slate-400 dark:focus:ring-blue-600"
        value={props.value}
        onChange={props.onChange}
      >
        {props.options.map((o, key) => {
          return (
            <option key={key} value={o.replace(/\W+/g, "-").toLowerCase()}>
              {o}
            </option>
          );
        })}
      </select>
    </>
  );
}
