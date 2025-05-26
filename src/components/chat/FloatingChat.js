import React, { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes } from 'react-icons/fa';
import ChatWindow from './ChatWindow';
import { sendMessage, getAISuggestions, checkAIHealth, formatConversationHistory } from '../../services/chatService';
import { useAppContext } from '../../context/AppContext';
import './FloatingChat.css';

/**
 * FloatingChat - A floating chat widget for AI assistance
 * Features:
 * - Toggle between minimized and expanded states
 * - Real-time chat with AI
 * - Message history
 * - Smooth animations
 */
const FloatingChat = () => {
  const { isAuthenticated } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [aiHealth, setAIHealth] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load AI suggestions and check health when chat opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadSuggestions();
      checkHealth();
    }
  }, [isOpen, isAuthenticated]);

  // Load AI suggestions
  const loadSuggestions = async () => {
    try {
      const suggestionsData = await getAISuggestions();
      setSuggestions(suggestionsData.suggestions || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      // Keep empty suggestions array on error
    }
  };

  // Check AI service health
  const checkHealth = async () => {
    try {
      const healthData = await checkAIHealth();
      setAIHealth(healthData);
    } catch (error) {
      console.error('Failed to check AI health:', error);
      setAIHealth({ status: 'AI service is not available', apiKeyConfigured: false });
    }
  };

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Check authentication
    if (!isAuthenticated) {
      setError('Please log in to use the chat feature.');
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Format conversation history for API
      const conversationHistory = formatConversationHistory(messages);
      
      // Send message to AI API
      const aiResponse = await sendMessage(inputValue.trim(), conversationHistory);
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse.message,
        sender: 'ai',
        timestamp: new Date(aiResponse.timestamp),
        dataUsed: aiResponse.dataUsed,
        products: aiResponse.products || null, // Add products if available
      };
      
      // Debug logging
      if (aiResponse.products && aiResponse.products.length > 0) {
        
      }
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: error.message || "Sorry, I'm having trouble responding right now. Please try again later.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    // Clear suggestions after clicking
    setSuggestions([]);
    // Optionally auto-send the suggestion
    // handleSendMessage({ preventDefault: () => {} });
  };

  // Toggle chat window
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Handle close
  const handleClose = () => {
    setIsOpen(false);
  };

  // Handle refresh
  const handleRefresh = () => {
    // Reset chat to initial state
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your AI assistant. How can I help you today?",
        sender: 'ai',
        timestamp: new Date(),
      }
    ]);
    setInputValue('');
    setError(null);
    // setConversationId(null);
    // Reload suggestions
    if (isAuthenticated) {
      loadSuggestions();
    }
  };

  return (
    <div className="floating-chat">
      {/* Chat Toggle Button */}
      <button 
        className={`chat-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <FaTimes /> : <FaComments />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSendMessage={handleSendMessage}
          messagesEndRef={messagesEndRef}
          suggestions={suggestions}
          onSuggestionClick={handleSuggestionClick}
          aiHealth={aiHealth}
          error={error}
          isAuthenticated={isAuthenticated}
          onClose={handleClose}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default FloatingChat;