import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send } from 'lucide-react';
import { useFilters } from '../context/FilterContext'; 

// 🌍 GLOBAL CONFIG: Backend URL
const API_BASE_URL = "https://ai-job-tracker-api-e85o.onrender.com";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I can help you find jobs or track applications. Try "Find me Python jobs"!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 1. Get Context Methods
  const { setFilters, refreshJobs } = useFilters();

  // Helper function to safely update filters
  const updateFilters = (newFilters) => {
    if (setFilters) {
      setFilters(prev => ({ ...prev, ...newFilters }));
    }
  };
  
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      // 👇 FIX: Use the Render URL here!
      const res = await axios.post(`${API_BASE_URL}/chat`, { message: userText });
      const { reply, action } = res.data;

      // 3. Handle Logic-based Actions from AI
      if (action) {
        console.log("⚡ Executing Action:", action);

        // CASE A: Refresh Feed (User asked to search/fetch jobs)
        if (action.type === 'REFRESH_FEED') {
          if (refreshJobs) await refreshJobs(); 
        } 
        
        // CASE B: Update Filter (User asked to filter results)
        if (action.type === 'UPDATE_FILTER') {
            
           // Sub-case: The AI sends "type" (we need to know if it's Remote or Job Type)
           if (action.filter === 'type') {
               if (action.value === 'Remote') {
                   // Update the boolean switch for Remote
                   updateFilters({ remote: true });
               } else {
                   // Update the dropdown for Job Type (Internship, Contract, etc.)
                   updateFilters({ jobType: action.value });
               }
           } 
           // Sub-case: Standard filters (Search, Location)
           else {
               updateFilters({ [action.filter]: action.value });
           }
        }
      }

      // 4. Show AI Response
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);

    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I had trouble connecting to the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-[350px] h-96 mb-4 rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2">
              <MessageCircle size={18} /> AI Assistant
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-sm shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full animate-pulse">
                  AI is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={sendMessage} className="p-3 bg-white border-t flex gap-2">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Ask for jobs..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={loading} 
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition-all hover:scale-105 flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default ChatWidget;