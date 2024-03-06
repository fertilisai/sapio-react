import { useState } from "react";

import Menu from "./components/Menu.jsx";
import LeftSidebar from "./components/LeftSidebar.jsx";
import RightSidebar from "./components/RightSidebar.jsx";
import Chat from "./components/Chat.jsx";
import { useLocalStorage } from "./hooks/useStorage.js";
import { convoLists } from "./data/convoLists.js";
import today from "./utils/utils.js";

export default function App() {
  const [convoList, setConvoList, removeConvoList] = useLocalStorage(
    JSON.stringify(convoLists)
  );
  const [selectedConvo, setSelectedConvo] = useState(0);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

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
    const tab = selectedConvo;
    let convo = JSON.parse(convoList);
    let messages = convo[tab].messages;
    // Use first prompt as conversation title
    if (messages.length == 1) {
      convo[tab].title = prompt.slice(0, 56);
    }
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
        max_tokens: Number(localStorage.getItem("max-tokens")),
        temperature: Number(localStorage.getItem("temperature")),
        top_p: Number(localStorage.getItem("top-p")),
        // frequency_penalty: Number(localStorage.getItem("frequency_penalty")),
        // presence_penalty: Number(localStorage.getItem("presence_penalty")),
      }),
    })
      .then((res) => res.json())
      .then((res) => res.choices[0].message.content)
      .catch((error) => console.log(error));

    setResult(res);
    setLoading(false);
    setError(error);
  };

  return (
    <>
      <div className="container-fluid">
        <div className="left">
          <aside className="flex">
            <Menu />
            <LeftSidebar
              convoList={JSON.parse(convoList)}
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
