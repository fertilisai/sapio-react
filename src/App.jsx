import { useState } from "react";

import Menu from "./components/Menu.jsx";
import LeftSidebar from "./components/LeftSidebar.jsx";
import RightSidebar from "./components/RightSidebar.jsx";
import Chat from "./components/Chat.jsx";
import { useLocalStorage } from "./hooks/useStorage.js";
import { convoLists } from "./data/convoLists.js";
import useFetch from "./hooks/useFetch.js";
import today from "./utils/utils.js";

export default function App() {
  const [convoList, setConvoList, removeConvoList] = useLocalStorage(
    JSON.stringify(convoLists)
  );

  // {
  //   convoList == undefined ? setConvoList(JSON.stringify(convoLists)) : [];
  // }

  const [selectedConvo, setSelectedConvo] = useState(0);

  // Function to handle conversation selection
  function handleSelect(selectedList) {
    setSelectedConvo(selectedList);
  }
  // Function to handle conversation deletetion
  function handleDelete(selectedList) {
    let convo = JSON.parse(convoList);
    convo.splice(selectedList, 1);
    setConvoList(JSON.stringify(convo));
    // return console.log(convo);
  }

  function handleNewChat() {
    let convo = JSON.parse(convoList);
    convo = [
      {
        title: "New conversation",
        date: today(),
        messages: [{ role: "system", content: "You are a helpful assistant." }],
      },
      ...convo,
    ];

    setConvoList(JSON.stringify(convo));
    // return console.log(convo);
  }

  // Function to handle new prompts
  function newPrompt(prompt) {
    // prevent printing to other convo
    const tab = selectedConvo;
    let convo = JSON.parse(convoList);
    let messages = convo[tab].messages;
    // TODO: new title
    messages = [...messages, { role: "user", content: prompt }];
    convo[tab].messages = messages;
    // newAnswer(messages, tab);
    // console.log(messages);
    setConvoList(JSON.stringify(convo));
    // return console.log(convo);
  }

  // const { loading, error, value } = useFetch(
  //   `https://api.openai.com/v1/chat/completions`,
  //   {
  //     body: JSON.stringify({
  //       model: "gpt-3.5-turbo",
  //       messages: messages,
  //       max_tokens: 256,
  //       temperature: 0.7,
  //       top_p: 1,
  //       // frequency_penalty: frequence,
  //       // presence_penalty: presence,
  //     }),
  //   },
  //   [sent]
  // );

  // Function to handle new answers
  function newAnswer(messages, tab) {
    // console.log(messages);
    let convo = JSON.parse(convoList);
    // let messages = convo[tab].messages;
    messages = [...messages, { role: "assistant", content: answer }];
    convo[tab].messages = messages;
    // console.log(messages);
    setConvoList(JSON.stringify(convo));
    // return console.log(convo);
  }

  return (
    <>
      <div className="container-fluid">
        <div className="left">
          <aside className="flex">
            <Menu />
            <LeftSidebar
              convoList={JSON.parse(convoList)}
              selectedConvo={selectedConvo}
              handleSelect={handleSelect}
              handleDelete={handleDelete}
              handleNewChat={handleNewChat}
            />
          </aside>
        </div>
        <div className="main">
          <Chat
            convo={JSON.parse(convoList)[selectedConvo].messages}
            newPrompt={newPrompt}
          />
        </div>
        <div className="right">
          <RightSidebar />
        </div>
      </div>
    </>
  );
}
