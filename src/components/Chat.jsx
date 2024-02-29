import { useState, useEffect } from "react";

import UserMsg from "./UserMsg.jsx";
import AssistantMsg from "./AssistantMsg.jsx";
import PromptInput from "./PromptInput.jsx";
import useFetch from "../hooks/useFetch";

export default function Chat(props) {
  // const [convo, setConvo] = useState(props.convo || []);

  // const addNewPromptToConvo = (newPrompt) => {
  //   const updatedConvo = [...convo, { role: "user", content: newPrompt }];
  //   setConvo(updatedConvo);
  //   // fetchResponse(newPrompt);
  // };

  // const { loading, error, value } = useFetch(
  //   newPrompt ? `https://api.openai.com/v1/chat/completions` : null,
  //   {
  //     method: "POST",
  //     headers: {
  //       Authorization: "Bearer " + "props.openai_api_key",
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       model: "gpt-3.5-turbo",
  //       messages: [{ role: "user", content: newPrompt }],
  //       max_tokens: 256,
  //       temperature: 1,
  //       top_p: 1,
  //     }),
  //   },
  //   [newPrompt]
  // );

  return (
    // <!-- Prompt Messages Container - Modify the height according to your need -->
    <>
      <div className="flex h-[100vh] flex-col">
        {/* <!-- Messages --> */}
        <div className="flex-1 overflow-y-auto bg-slate-300 text-sm leading-6 text-slate-900 shadow-md dark:bg-slate-800 dark:text-slate-300 sm:text-base sm:leading-7">
          {props.convo.map((el, key) => {
            if (el.role === "user") {
              return <UserMsg content={el.content} key={key} />;
            }
            if (el.role === "assistant") {
              return (
                <AssistantMsg content={el.content} key={key} /> //.replace(/\n/g, "<br />")
              );
            }
          })}
        </div>
        {/* {window.scrollTo(0, document.body.scrollHeight)} */}
        <PromptInput context="chat" onNewPrompt={props.newPrompt} />
      </div>
    </>
  );
}
