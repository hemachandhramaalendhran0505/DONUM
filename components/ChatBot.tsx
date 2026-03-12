import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Loader2, MapPin } from 'lucide-react';
import { chatWithBot } from '../services/geminiService';

interface GroundingChunk {
    web?: { uri?: string; title?: string };
    maps?: { uri?: string; title?: string; placeAnswerSources?: any };
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  groundingChunks?: GroundingChunk[];
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'model', text: 'Hello! I am Nano Spark, your AI Assistant. How can I help you donate, request, or volunteer today?', timestamp: Date.now() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Get User Location for Grounding
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (err) => console.log("Loc unavailable for chat", err)
        );
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Convert internal message format to Gemini history format
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await chatWithBot(history, userMsg.text, userLocation);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: response.text || "I'm not sure how to respond to that, but I'm learning!",
      groundingChunks: response.groundingChunks,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-brand-500 hover:bg-brand-600 text-black p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center border-2 border-black"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border-2 border-black flex flex-col overflow-hidden animate-fade-in max-h-[550px]">
          {/* Header */}
          <div className="bg-black p-4 flex items-center space-x-3 text-yellow-400">
            <div className="bg-yellow-400 p-2 rounded-full text-black">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold">Nano Spark</h3>
              <p className="text-xs text-gray-400 flex items-center">
                <span className={`w-2 h-2 rounded-full mr-1 ${userLocation ? 'bg-green-500' : 'bg-gray-500'}`}></span> 
                {userLocation ? 'Location Active' : 'Online'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 h-80">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium ${
                    msg.role === 'user'
                      ? 'bg-brand-500 text-black rounded-tr-none border border-brand-600'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
                
                {/* Maps Grounding Links */}
                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="mt-2 ml-1 flex flex-wrap gap-2 max-w-[85%]">
                        {msg.groundingChunks.map((chunk, idx) => {
                            if (chunk.maps?.uri) {
                                return (
                                    <a 
                                        key={idx} 
                                        href={chunk.maps.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center text-xs bg-white border border-gray-200 text-blue-600 px-2 py-1 rounded-md hover:bg-gray-50 shadow-sm"
                                    >
                                        <MapPin size={12} className="mr-1 text-red-500" />
                                        {chunk.maps.title}
                                    </a>
                                );
                            }
                            return null;
                        })}
                    </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                  <Loader2 size={16} className="animate-spin text-brand-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for nearby places..."
              className="flex-1 p-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isTyping}
              className="p-2 bg-brand-500 text-black rounded-lg hover:bg-brand-600 disabled:opacity-50 font-bold"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;