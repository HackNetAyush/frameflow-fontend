
import { useState } from 'react';

export const useChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      content: "👋 Hi! I'm your AI video creator. Ask me to explain any topic and I'll generate a custom educational video for you!",
    }
  ]);

  const addMessage = (role, content, type = 'text', extra = {}) => {
    const newMessage = {
      id: Date.now().toString(),
      role,
      content,
      type,
      ...extra
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  return { messages, addMessage };
};
