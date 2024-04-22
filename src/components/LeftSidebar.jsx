import Button from "./Button.jsx";
import ConvoList from "./ConvoList.jsx";

function capitalize(s) {
  return s && s[0].toUpperCase() + s.slice(1);
}

export default function LeftSidebar(props) {
  const unselected =
    "flex w-full flex-col gap-y-2 rounded-lg px-3 py-2 text-left transition-colors duration-200 hover:bg-slate-200 focus:outline-none dark:hover:bg-slate-800";
  const selected =
    "flex w-full flex-col gap-y-2 rounded-lg bg-slate-200 px-3 py-2 text-left transition-colors duration-200 focus:outline-none dark:bg-slate-800";

  return (
    <div className="h-screen w-52 overflow-y-auto bg-slate-50 py-8 dark:bg-slate-900 sm:w-60">
      <div className="flex items-start">
        <h2 className="inline px-5 text-lg font-medium text-slate-800 dark:text-slate-200">
          {capitalize(props.icon)}s
        </h2>
      </div>

      <div className="mx-2 mt-8 space-y-4">
        <Button label={"New " + props.icon} takeAction={props.handleNewChat} />

        {props.convoList.map((el, key) => {
          return (
            <ConvoList
              className={props.selectedConvo === key ? selected : unselected}
              title={el.title}
              date={el.date}
              key={key}
              onClick={() => props.handleSelect(key)}
              onDelete={() => props.handleDelete(key)}
            />
          );
        })}
      </div>
    </div>
  );
}
