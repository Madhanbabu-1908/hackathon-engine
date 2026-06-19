import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { getCredentials } from '../utils/credentials.js';
import { rgba, theme } from '../theme.js';

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi! I am your Hackathon Assistant. How can I help you today?' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const chatEndRef = useRef(null);

  // Fetch available models from your existing backend when opened
  useEffect(() => {
    if (isOpen && models.length === 0) {
      const creds = getCredentials();
      if (creds) {
        axios.post('/api/models/list', { base_url: creds.baseUrl, api_key: creds.apiKey })
          .then(res => {
            const fetchedModels = res.data.models.map(m => m.id);
            setModels(fetchedModels);
            if (fetchedModels.length > 0) setSelectedModel(fetchedModels[0]);
          })
          .catch(err => console.error('Failed to fetch models', err));
      }
    }
  }, [isOpen, models.length]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const creds = getCredentials();
      const res = await axios.post('/api/chat', {
        message: currentInput,
        model: selectedModel,
        base_url: creds?.baseUrl,
        api_key: creds?.apiKey
      });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply || 'Error getting response.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Failed to connect to server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl transition-transform hover:scale-110 z-50"
          style={{ background: `linear-gradient(135deg, ${rgba('teal', 0.8)}, ${rgba('purple', 0.8)})`, border: `2px solid ${rgba('teal', 1)}` }}
        >
          💬
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-white/10" style={{ background: theme.bgCard }}>
          <div className="p-4 flex justify-between items-center" style={{ background: `linear-gradient(135deg, ${rgba('teal', 0.2)}, ${rgba('purple', 0.2)})`, borderBottom: `1px solid ${rgba('teal', 0.3)}` }}>
            <span className="font-display font-bold text-lg text-white">Hackathon Assistant</span>
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white text-xl">✕</button>
          </div>

          <div className="p-2 border-b border-white/5" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
            >
              {models.length === 0 && <option value="">Loading models...</option>}
              {models.map(m => <option key={m} value={m} className="bg-gray-800">{m}</option>)}
            </select>
          </div>

          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`max-w-[80%] p-3 rounded-2xl text-sm font-body ${msg.role === 'user' ? 'self-end' : 'self-start'}`} 
                   style={{ 
                     background: msg.role === 'user' ? rgba('teal', 0.2) : 'rgba(255,255,255,0.05)', 
                     border: `1px solid ${msg.role === 'user' ? rgba('teal', 0.5) : 'rgba(255,255,255,0.1)'}`,
                     color: 'white'
                   }}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="self-start flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                {/* Anime/Avatar Animation */}
                <div className="text-2xl animate-bounce">🤖</div> 
                <span className="text-white/50 text-sm font-body">Thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-white/5 flex gap-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()} 
              placeholder="Type a message..." 
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-teal-500" 
            />
            <button onClick={sendMessage} disabled={isLoading} className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-50" style={{ background: rgba('teal', 0.8) }}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
