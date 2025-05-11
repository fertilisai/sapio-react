export default function InputSelect(props) {
  // Generate ID from label text when label is a string, or use a default ID when it's a React element
  const labelId = typeof props.label === 'string' 
    ? props.label.replace(/\W+/g, "-").toLowerCase()
    : `select-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full">
      <label
        htmlFor={labelId}
        className="mb-2 mt-4 block px-2 text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {props.label}
      </label>
      <select
        name={labelId}
        id={labelId}
        className="block w-full cursor-pointer rounded-lg border-r-4 border-transparent bg-slate-200 py-3 pl-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-800 dark:placeholder-slate-400 dark:focus:ring-blue-600"
        value={props.value}
        onChange={props.onChange}
      >
        {props.options.map((o, key) => (
          <option key={key} value={o}>
            {props.optionLabels && props.optionLabels[key] ? props.optionLabels[key] : o}
          </option>
        ))}
      </select>
    </div>
  );
}
