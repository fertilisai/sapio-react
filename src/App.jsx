import { useState } from "react";

import Menu from "./components/Menu.jsx";
import LeftSidebar from "./components/LeftSidebar.jsx";
import RightSidebar from "./components/RightSidebar.jsx";
import Chat from "./components/Chat.jsx";

import { convoList } from "./data/convoList";

function App() {
  const [selectedConvo, setSelectedConvo] = useState(0);

  // Function to handle click
  function handleSelect(selectedList) {
    setSelectedConvo(selectedList);
  }

  return (
    <>
      <div className="container-fluid">
        <div className="left">
          <aside className="flex">
            <Menu />
            <LeftSidebar
              selectedConvo={selectedConvo}
              handleSelect={handleSelect}
            />
          </aside>
        </div>
        <div className="main">
          <Chat convo={convoList[selectedConvo].messages} />
        </div>
        <div className="right">
          <RightSidebar />
        </div>
      </div>
    </>
  );
}

export default App;
