import { useState } from "react";

import Menu from "./components/Menu.jsx";
import LeftSidebar from "./components/LeftSidebar.jsx";
import RightSidebar from "./components/RightSidebar.jsx";
import Chat from "./components/Chat.jsx";
import { useLocalStorage } from "./hooks/useStorage.js";
import { convoLists } from "./data/convoLists.js";
import today from "./utils/utils.js";

export default function App() {
  const [convoList, setConvoList, removeConvoList] = useLocalStorage();

  {
    convoList == undefined ? setConvoList(JSON.stringify(convoLists)) : [];
  }

  const [selectedConvo, setSelectedConvo] = useState(0);

  // Function to handle conversation selection
  function handleSelect(selectedList) {
    setSelectedConvo(selectedList);
  }

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
    return console.log(convo);
  }

  // Function to handle new answers
  function newAnswer(prompt) {
    // let answer = getAnwser(prompt)
    let convo = JSON.parse(convoList);
    let messages = convo[selectedConvo].messages;
    messages = [...messages, { role: "assistant", content: answer }];
    convo[selectedConvo].messages = messages;
    setConvoList(JSON.stringify(convo));
    // return console.log(convo);
  }

  // Function to handle new prompts
  function newPrompt(prompt) {
    let convo = JSON.parse(convoList);
    let messages = convo[selectedConvo].messages;
    messages = [...messages, { role: "user", content: prompt }];
    convo[selectedConvo].messages = messages;
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
