export const convoLists = [
  {
    title: "Explain quantum computing",
    date: "12 Mar",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Explain quantum computing in simple terms" },
      {
        role: "assistant",
        content:
          "Certainly! Quantum computing is a new type of computing that relies on the principles of quantum physics. Traditional computers, like the one you might be using right now, use bits to store and process information. These bits can represent either a 0 or a 1. In contrast, quantum computers use quantum bits, or qubits. \n\nUnlike bits, qubits can represent not only a 0 or a 1 but also a superposition of both states simultaneously. This means that a qubit can be in multiple states at once, which allows quantum computers to perform certain calculations much faster and more efficiently.",
      },
      {
        role: "user",
        content: "What are three great applications of quantum computing?",
      },
      {
        role: "assistant",
        content:
          "Three great applications of quantum computing are: Optimization of complex problems, Drug Discovery and Cryptography.",
      },
    ],
  },
  {
    title: "Tailwind classes",
    date: "10 Feb",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Hello!" },
      { role: "assistant", content: "How can I help you?" },
    ],
  },
  {
    title: "How to create an ERP diagram",
    date: "22 Jan",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Hello!" },
      { role: "assistant", content: "How can I help you?" },
      { role: "user", content: "What is the height of the eiffel tower?" },
      { role: "assistant", content: "about 330m " },
    ],
  },
  {
    title: "API scalling strategies",
    date: "1 Jan",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Hello!" },
      { role: "assistant", content: "How can I help you?" },
      { role: "user", content: "What is the height of the eiffel tower?" },
      { role: "assistant", content: "about 330m " },
      { role: "user", content: "How many stairs to the top?" },
      { role: "assistant", content: "Fuck me right?" },
      { role: "user", content: "Hello!" },
      { role: "assistant", content: "How can I help you?" },
      { role: "user", content: "What is the height of the eiffel tower?" },
      { role: "assistant", content: "about 330m " },
      { role: "user", content: "How many stairs to the top?" },
      { role: "assistant", content: "Fuck me right?" },
    ],
  },
];
