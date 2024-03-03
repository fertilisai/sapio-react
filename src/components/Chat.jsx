import MsgUser from "./MsgUser.jsx";
import MsgAssistant from "./MsgAssistant.jsx";
import InputPrompt from "./InputPrompt.jsx";

export default function Chat(props) {
  return (
    <>
      <div className="flex h-[100vh] flex-col">
        {/* <!-- Messages --> */}
        <div className="flex-1 overflow-y-auto bg-slate-300 text-sm leading-6 text-slate-900 shadow-md dark:bg-slate-800 dark:text-slate-300 sm:text-base sm:leading-7">
          {props.convo.map((el, key) => {
            if (el.role === "user") {
              return <MsgUser content={el.content} key={key} />;
            }
            if (el.role === "assistant") {
              return (
                <MsgAssistant content={el.content} key={key} /> //.replace(/\n/g, "<br />")
              );
            }
          })}
        </div>
        {/* {window.scrollTo(0, document.body.scrollHeight)} */}
        <InputPrompt context="chat" onNewPrompt={props.newPrompt} />
      </div>
    </>
  );
}
