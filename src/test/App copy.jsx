import { useState } from "react";
// import { useEffect } from "react";
// import { useRef } from "react";

import Menu from "./components/Menu.jsx";
import LeftSidebar from "./components/LeftSidebar.jsx";
import RightSidebar from "./components/RightSidebar.jsx";
import Chat from "./components/Chat.jsx";
import { useLocalStorage } from "./hooks/useStorage.js";
import { convoLists } from "./data/convoLists.js";
// import useFetch from "./hooks/useFetch.js";
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

  // useEffect(() => {
  //   // This function will run whenever `convoList` changes.
  //   // window.location.reload();
  // }, [convoList]);

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

  function saveMsg(messages, role, content) {
    // let convo = JSON.parse(convoList);
    // let messages = convo[tab].messages;
    messages = [...messages, { role: role, content: content }];
    // convo[tab].messages = messages;
    // setConvoList(JSON.stringify(convo));
    // console.log(messages);
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
    // saveMsg(convoList, tab, "user", prompt);
    // console.log(messages);
    newAnswer(messages, tab);

    // console.log(messages);
    // return console.log(convo);
  }

  // const { loading, error, value } = useFetch(
  //   `https://api.openai.com/v1/chat/completions`,
  //   {
  //     body: JSON.stringify({
  //       model: "gpt-3.5-turbo",
  //       messages: JSON.parse(convoList)[selectedConvo].messages,
  //       max_tokens: Number(localStorage.getItem("max-tokens")),
  //       temperature: Number(localStorage.getItem("temperature")),
  //       top_p: Number(localStorage.getItem("top-p")),
  //       // frequency_penalty: frequence,
  //       // presence_penalty: presence,
  //     }),
  //   },
  //   [FetchCount]
  // );

  // console.log("FetchCount:" + FetchCount);
  // console.log("Loading:" + loading);
  // console.log("Error:" + error);
  // console.log(value.choices[0].message.content);
  // console.log(JSON.parse(localStorage.getItem("model")));
  const apiKeyStored = JSON.parse(localStorage.getItem("api-key"));

  const sendRequest = async (messages) => {
    // let messages = JSON.parse(convoList)[tab].messages;
    // console.log(messages);
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

  // const waitForResult = async (result) => {
  //   if (result !== "") {
  //     return result;
  //   } else {
  //     return await waitForResult(result);
  //   }
  // };

  // Function to handle new answers
  function newAnswer(messages, tab) {
    // console.log(messages);

    // let messages = convo[tab].messages;
    // let messages = JSON.parse(convoList)[selectedConvo].messages

    sendRequest(messages);
    if (result !== "") {
      messages = saveMsg(messages, "assistant", result);
      let convo = JSON.parse(convoList);
      convo[tab].messages = messages;
      setConvoList(JSON.stringify(convo));
    }
    // setResult(waitForResult(result));
    // console.log(result);
    // console.log(messages);
    // setTimeout(() => {}, 1000);

    // if (!loading && result !== "") {
    //   messages = [
    //     ...messages,
    //     { role: "assistant", content: result },
    //     // { role: "assistant", content: value.choices[0].message.content },
    //   ];
    //   convo[tab].messages = messages;
    //   setConvoList(JSON.stringify(convo));
    // }

    // console.log(value.choices[0].message.content);

    // setConvoList(
    //   JSON.stringify(
    //     (convo[tab].messages = [
    //       ...messages,
    //       { role: "assistant", content: loading ? result : "..." },
    //     ])
    //   )
    // );

    // console.log(convo);
    //  return console.log(convo);
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
            // convoList={convoList}
            // setConvoList={setConvoList}
            // tab={selectedConvo}
            newPrompt={newPrompt}
            handleFetch={handleFetch}
            loading={loading}
            result={result}
          />
        </div>
        <div className="right">
          <RightSidebar />
        </div>
      </div>
    </>
  );
}
