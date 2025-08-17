// src/components/Tabs/ChatTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';
import { chatModel, SYSTEM_PROMPT } from '../../config/gemini';
import { dbFunctions } from '../../utils/database';

const ChatTab = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [botName, setBotName] = useState('MindBot');
  const [showNameInput, setShowNameInput] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load saved bot name and messages on mount
  useEffect(() => {
    const savedBotName = localStorage.getItem(`botName_${user.uid}`);
    if (savedBotName) {
      setBotName(savedBotName);
      setShowNameInput(false);
      // Add initial greeting
      const greeting = {
        id: 'greeting',
        text: `Hello! I'm ${savedBotName}, your supportive companion. I'm here to listen, offer encouragement, and help you navigate your thoughts and feelings. How are you feeling today?`,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages([greeting]);
    }
    loadChatHistory();
  }, [user.uid]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const result = await dbFunctions.getUserDocuments('chats', user.uid);
      if (result.success && result.documents.length > 0) {
        // Don't override if we already have messages
        if (messages.length === 0) {
          setMessages(result.documents);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveBotName = () => {
    if (!botName.trim()) {
      alert('Please give your companion a name!');
      return;
    }
    localStorage.setItem(`botName_${user.uid}`, botName);
    setShowNameInput(false);
    
    // Add initial greeting
    const greeting = {
      id: Date.now(),
      text: `Hello! I'm ${botName}, your supportive companion. I'm here to listen, offer encouragement, and help you navigate your thoughts and feelings. How are you feeling today?`,
      sender: 'bot',
      timestamp: new Date().toISOString()
    };
    
    setMessages([greeting]);
    dbFunctions.add('chats', { ...greeting, userId: user.uid });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      userId: user.uid
    };
    
    setMessages(prev => [...prev, userMessage]);
    await dbFunctions.add('chats', userMessage);
    
    const userInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Create context from conversation history
      let conversationContext = SYSTEM_PROMPT + `\n\nYou are ${botName}, a caring AI companion.\n\n`;
      
      // Add last few messages for context (limit to prevent token overflow)
      const recentMessages = messages.slice(-6);
      recentMessages.forEach(msg => {
        if (msg.sender === 'user') {
          conversationContext += `User: ${msg.text}\n`;
        } else {
          conversationContext += `${botName}: ${msg.text}\n`;
        }
      });
      
      conversationContext += `User: ${userInput}\n${botName}: `;
      
      // Get AI response using generateContent (not startChat)
      const result = await chatModel.generateContent(conversationContext);
      const response = await result.response;
      const botText = response.text();
      
      // Add bot message
      const botMessage = {
        id: Date.now() + 1,
        text: botText,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        userId: user.uid
      };
      
      setMessages(prev => [...prev, botMessage]);
      await dbFunctions.add('chats', botMessage);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Specific error handling
      let errorText = "I'm having trouble connecting right now. ";
      
      if (error.message?.includes('API_KEY_INVALID')) {
        errorText = "There's an issue with the API configuration. Please check your API key.";
      } else if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
        errorText = "We've hit the rate limit. Please wait a moment before sending another message.";
      } else if (error.message?.includes('Cannot read properties of null')) {
        errorText = "Connection error. Please try again.";
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText + " Remember, I'm here to support you.",
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationStarter = (starter) => {
    setInputMessage(starter);
  };

  const conversationStarters = [
    "I'm feeling anxious today",
    "I need someone to talk to",
    "How can I manage stress better?",
    "I'm having trouble sleeping",
    "I want to practice mindfulness",
    "I'm feeling overwhelmed with life"
  ];

  const clearChat = async () => {
    if (!confirm('Are you sure you want to clear your chat history?')) return;
    
    try {
      // Delete all messages from Firebase
      for (const message of messages) {
        if (message.id && message.id !== 'greeting') {
          await dbFunctions.delete('chats', message.id);
        }
      }
      
      // Reset to just greeting
      const greeting = {
        id: 'greeting',
        text: `Hello! I'm ${botName}, your supportive companion. I'm here to listen, offer encouragement, and help you navigate your thoughts and feelings. How are you feeling today?`,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages([greeting]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bot Name Setup */}
      {showNameInput && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-rose-600 mb-4">Personalize Your Support Companion</h2>
          <p className="text-gray-600 mb-4">
            Give your AI companion a name that feels comfortable to you. This helps create a more personal connection.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="Give your companion a name"
              className="flex-1 px-4 py-2 border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400"
            />
            <button
              onClick={saveBotName}
              className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              Start Chat
            </button>
          </div>
        </div>
      )}

      {/* Conversation Starters */}
      {!showNameInput && messages.length <= 1 && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-rose-600 mb-4">How can {botName} help you today?</h3>
          <div className="grid grid-cols-2 gap-2">
            {conversationStarters.map((starter, index) => (
              <button
                key={index}
                onClick={() => handleConversationStarter(starter)}
                className="text-left p-3 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors text-sm"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {!showNameInput && (
        <div className="bg-white rounded-xl shadow-lg flex flex-col h-[500px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="text-rose-600" size={24} />
              <h2 className="text-lg font-semibold">{botName}</h2>
              <span className="text-xs text-gray-500">AI Support Companion</span>
            </div>
            <button
              onClick={clearChat}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Chat
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' ? 'bg-rose-500' : 'bg-gray-200'
                  }`}>
                    {message.sender === 'user' ? (
                      <User size={16} className="text-white" />
                    ) : (
                      <Bot size={16} className="text-gray-600" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-rose-200' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot size={16} className="text-gray-600" />
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-gray-100">
                    <Loader className="animate-spin" size={16} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                placeholder="Share what's on your mind..."
                className="flex-1 px-4 py-2 border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isLoading 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-rose-500 text-white hover:bg-rose-600'
                }`}
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {botName} is an AI companion. For serious mental health concerns, please consult a professional.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatTab;