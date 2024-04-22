import { useState } from "react";
import { useEffect } from "react";

import Menu from "./components/Menu.jsx";
import LeftSidebar from "./components/LeftSidebar.jsx";
import RightSidebar from "./components/RightSidebar.jsx";
import Convo from "./components/Convo.jsx";
import { useLocalStorage } from "./hooks/useStorage.js";
import { convoLists } from "./data/convoLists.js";
import today from "./utils/utils.js";
// import sendRequest from "./utils/api.js";

export default function App() {
  const icon = ["chat", "image", "audio", "video", "doc", "agent", "settings"];
  const [selectedIcon, setSelectedIcon] = useState(icon[0]);

  // Function to handle icon selection
  function handleSelectIcon(selectedButton) {
    setSelectedIcon(selectedButton);
  }

  const [convoList, setConvoList, removeConvoList] = useLocalStorage(
    "convo",
    JSON.stringify(convoLists)
  );

  const [selectedConvo, setSelectedConvo] = useState(0);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  useEffect(() => {
    if (result) {
      saveConvo(result);
    }
  }, [result]);

  // Function to handle conversation selection
  function handleSelect(selectedList) {
    setSelectedConvo(selectedList);
  }
  // Function to handle conversation deletetion
  function handleDelete(selectedList) {
    let convo = JSON.parse(convoList);

    if (convo[selectedIcon].length - 1 == selectedList) {
      convo[selectedIcon].splice(selectedList, 1, {
        title: "New conversation",
        date: today(),
        messages: [{ role: "system", content: "You are a helpful assistant." }],
      });
      // } else if (convo.length - 1 == selectedList) {
      //   convo.splice(-1);
    } else {
      convo[selectedIcon].splice(selectedList, 1);
    }

    setConvoList(JSON.stringify(convo));
    setResult("");
  }

  function handleNew() {
    let convo = JSON.parse(convoList);
    convo[selectedIcon] = [
      {
        title: "New conversation",
        date: today(),
        messages: [{ role: "system", content: "You are a helpful assistant." }],
      },
      ...convo[selectedIcon],
    ];
    setConvoList(JSON.stringify(convo));
  }

  function saveConvo(result) {
    const tab = selectedConvo;
    let convo = JSON.parse(convoList);
    let messages = convo[selectedIcon][tab].messages;
    messages = saveMsg(messages, "assistant", result);
    convo[selectedIcon][tab].messages = messages;
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
    let messages = convo[selectedIcon][tab].messages;
    // Use first prompt as conversation title
    if (messages.length == 1) {
      convo[selectedIcon][tab].title = prompt.slice(0, 56);
    }
    messages = [...messages, { role: "user", content: prompt }];
    convo[selectedIcon][tab].messages = messages;
    setConvoList(JSON.stringify(convo));
    newAnswer(messages, tab);
  }

  // Function to handle new answers
  function newAnswer(messages, tab) {
    sendRequest(messages);
    if (result !== "") {
      messages = saveMsg(messages, "assistant", result);
      let convo = JSON.parse(convoList);
      convo[selectedIcon][tab].messages = messages;
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
        // model: localStorage.getItem("model"),
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
            <Menu
              handleSelectIcon={handleSelectIcon}
              selectedIcon={selectedIcon}
            />
            <LeftSidebar
              convoList={JSON.parse(convoList)[selectedIcon]}
              selectedConvo={selectedConvo}
              handleSelect={handleSelect}
              handleDelete={handleDelete}
              handleNewChat={handleNew}
              icon={selectedIcon}
            />
          </aside>
        </div>

        {/* {console.log(JSON.parse(convoList))} */}
        <div className="main">
          <Convo
            convo={JSON.parse(convoList)[selectedIcon][selectedConvo].messages}
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
