import React, { useState } from 'react';

export default function AppSimple() {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are a helpful assistant.' }
  ]);
  const [input, setInput] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const newMessages = [
      ...messages,
      { role: 'user', content: input.trim() }
    ];
    
    setMessages(newMessages);
    setInput('');
    
    // Simulate assistant response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `I received your message: "${input.trim()}"` }
      ]);
    }, 1000);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Simple Chat App</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4 h-80 overflow-y-auto">
        {messages.filter(m => m.role !== 'system').map((message, index) => (
          <div key={index} className={`mb-3 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded-lg ${
              message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded"
          placeholder="Type a message..."
        />
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}