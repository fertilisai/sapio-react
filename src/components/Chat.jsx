import UserMsg from "./UserMsg.jsx";
import AssistantMsg from "./AssistantMsg.jsx";
import PromptInput from "./PromptInput.jsx";

export default function Chat(props) {
  // {convoList[0].messages.role;}

  return (
    // <!-- Prompt Messages Container - Modify the height according to your need -->
    <>
      <div className="flex h-[100vh] flex-col">
        {/* <!-- Messages --> */}
        <div className="flex-1 overflow-y-auto bg-slate-300 text-sm leading-6 text-slate-900 shadow-md dark:bg-slate-800 dark:text-slate-300 sm:text-base sm:leading-7">
          {props.convo.map((el) => {
            if (el.role === "user") {
              return <UserMsg content={el.content} />;
            }
            if (el.role === "assistant") {
              return (
                <AssistantMsg content={el.content} /> //.replace(/\n/g, "<br />")
              );
            }
          })}
        </div>
        <PromptInput />
      </div>
    </>
  );
}
