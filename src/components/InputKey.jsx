export default function InputKey(props) {
  const placeholder = props.placeholder || "sk-xxxxxxx";
  
  // Generate ID from label text when label is a string, or use a default ID when it's a React element
  const labelId = typeof props.label === 'string' 
    ? props.label.replace(/\W+/g, "-").toLowerCase()
    : `key-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full">
      <label
        htmlFor={labelId}
        className="mb-2 mt-4 block px-2 text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {props.label}
      </label>
      <input
        type="password"
        name={labelId}
        id={labelId}
        className="block w-full rounded-lg bg-slate-200 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-800 dark:placeholder-slate-400 dark:focus:ring-blue-600"
        placeholder={placeholder}
        value={props.value}
        onChange={props.onChange}
      />
    </div>
  );
}
