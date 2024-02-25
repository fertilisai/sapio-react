export default function ConvoList(props) {
  return (
    <button className={props.className} onClick={props.onClick}>
      <h1 className="text-sm font-medium capitalize text-slate-700 dark:text-slate-200">
        {props.title}
      </h1>
      <p className="text-xs text-slate-500 dark:text-slate-400">{props.date}</p>
    </button>
  );
}
