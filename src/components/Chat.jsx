import MsgUser from "./MsgUser.jsx";
import MsgAssistant from "./MsgAssistant.jsx";
import InputPrompt from "./InputPrompt.jsx";

export default function Chat(props) {
  // function saveMsg(convoList, tab, role, content) {
  //   let convo = JSON.parse(convoList);
  //   let messages = convo[tab].messages;
  //   messages = [...messages, { role: role, content: content }];
  //   convo[tab].messages = messages;
  //   props.setConvoList(JSON.stringify(convo));
  //   return messages;
  // }

  return (
    <>
      <div className="flex h-[100vh] flex-col">
        {/* <!-- Messages --> */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-300 text-sm leading-6 text-slate-900 shadow-md dark:bg-slate-800 dark:text-slate-300 sm:text-base sm:leading-7">
          {props.convo.map((el, key) => {
            // console.log(el);
            if (el.role === "user") {
              // console.log(props.convo);
              return <MsgUser content={el.content} key={key} />;
            }
            if (el.role === "assistant") {
              return (
                <MsgAssistant content={el.content} key={key} /> //.replace(/\n/g, "<br />")
              );
            }
          })}
          {
            props.loading ? (
              <MsgAssistant content="..." />
            ) : (
              props.result !== "" && <MsgAssistant content={props.result} /> &&
              props.saveConvo(props.result)
            )
            // saveMsg(props.convoList, props.tab, "assistant", props.result)
          }
        </div>
        {/* {window.scrollTo(0, document.body.scrollHeight)} */}
        <InputPrompt
          context="chat"
          onNewPrompt={props.newPrompt}
          handleFetch={props.handleFetch}
        />
      </div>
    </>
  );
}
