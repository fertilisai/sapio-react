import { useState } from "react";

import Menu from "./components/Menu.jsx";
import LeftSidebar from "./components/LeftSidebar.jsx";
import RightSidebar from "./components/RightSidebar.jsx";
import Chat from "./components/Chat.jsx";
import { useLocalStorage } from "./hooks/useStorage.js";
import { convoLists } from "./data/convoLists.js";
import today from "./utils/utils.js";
// import sendRequest from "./utils/api.js";

export default function App() {
  const [convoList, setConvoList, removeConvoList] = useLocalStorage(
    JSON.stringify(convoLists)
  );
  const [selectedConvo, setSelectedConvo] = useState(0);
  const [FetchCount, setFetchCount] = useState(0);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  function handleFetch() {
    setFetchCount((currentCount) => currentCount + 1);
  }

  // Function to handle conversation selection
  function handleSelect(selectedList) {
    setSelectedConvo(selectedList);
  }
  // Function to handle conversation deletetion
  function handleDelete(selectedList) {
    let convo = JSON.parse(convoList);

    if (convo.length - 1 == selectedList) {
      convo.splice(selectedList, 1, {
        title: "New conversation",
        date: today(),
        messages: [{ role: "system", content: "You are a helpful assistant." }],
      });
    } else {
      convo.splice(selectedList, 1);
    }
    setConvoList(JSON.stringify(convo));
    setResult("");
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
  }

  function saveConvo(result) {
    const tab = selectedConvo;
    let convo = JSON.parse(convoList);
    let messages = convo[tab].messages;
    messages = saveMsg(messages, "assistant", result);
    convo[tab].messages = messages;
    setConvoList(JSON.stringify(convo));
    setResult("");
  }

  function saveMsg(messages, role, content) {
    messages = [...messages, { role: role, content: content }];
    return messages;
  }

  // Function to handle new prompts
  function newPrompt(prompt) {
    // prevent printing to other convo
    const tab = selectedConvo;
    let convo = JSON.parse(convoList);
    let messages = convo[tab].messages;
    // // TODO: new title
    messages = [...messages, { role: "user", content: prompt }];
    convo[tab].messages = messages;
    setConvoList(JSON.stringify(convo));
    newAnswer(messages, tab);
  }

  // Function to handle new answers
  function newAnswer(messages, tab) {
    sendRequest(messages);
    if (result !== "") {
      messages = saveMsg(messages, "assistant", result);
      let convo = JSON.parse(convoList);
      convo[tab].messages = messages;
      setConvoList(JSON.stringify(convo));
    }
  }

  const apiKeyStored = JSON.parse(localStorage.getItem("api-key"));

  const sendRequest = async (messages) => {
    setLoading(true);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKeyStored,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 256,
        temperature: 0.7,
        top_p: 1,
        // frequency_penalty: frequence,
        // presence_penalty: presence,
      }),
    })
      .then((res) => res.json())
      .then((res) => res.choices[0].message.content)
      // .then((msg) => saveMsg(messages, "assistant", msg))
      // .then((log) => console.log(log))
      .catch((error) => console.log(error));

    setResult(res);
    setLoading(false);
    setError(error);
    // return res;
  };

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
            handleFetch={handleFetch}
            loading={loading}
            result={result}
            saveConvo={saveConvo}
          />
        </div>
        <div className="right">
          <RightSidebar />
        </div>
      </div>
    </>
  );
}
