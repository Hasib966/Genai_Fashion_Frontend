import React from 'react';
import { FaPaperPlane, FaRobot, FaSync, FaTimes } from 'react-icons/fa';
import MessageList from './MessageList';
import './ChatWindow.css';

/**
 * ChatWindow - The main chat interface container
 * Contains message list, suggestions, and input area
 */
const ChatWindow = ({
  messages,
  isLoading,
  inputValue,
  setInputValue,
  handleSendMessage,
  messagesEndRef,
  suggestions,
  onSuggestionClick,
  aiHealth,
  error,
  isAuthenticated,
  onClose,
  onRefresh
}) => {
  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-content">
          <div className="chat-header-info">
            <h2>Abdul Farid- AI Assistant</h2>
          </div>
        </div>
        <div className="chat-header-actions">
          <button 
            className="header-action-btn" 
            onClick={onRefresh}
            aria-label="Refresh chat"
            title="Refresh"
          >
            <FaSync />
          </button>
          <button 
            className="header-action-btn" 
            onClick={onClose}
            aria-label="Close chat"
            title="Close"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        <MessageList 
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
          suggestions={suggestions}
          onSuggestionClick={onSuggestionClick}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Input Area */}
      <div className="chat-input-container">
        <form onSubmit={handleSendMessage} className="chat-input-form">
          <div className="input-wrapper">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isAuthenticated ? "Type your message..." : "Please log in to chat"}
              className="chat-input"
              disabled={isLoading || !isAuthenticated}
              maxLength={2000}
            />
            <button
              type="submit"
              className={`send-button ${isLoading ? 'loading' : ''}`}
              disabled={!inputValue.trim() || isLoading || !isAuthenticated}
              aria-label="Send message"
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <FaPaperPlane />
              )}
            </button>
          </div>
        </form>
        
        {/* Input Footer */}
        {error && (
          <div className="error-message">
            <small>{error}</small>
          </div>
        )}
        {!isAuthenticated && (
          <div className="auth-notice">
            <small>Please log in to use the chat feature</small>
          </div>
        )}
        
        {/* Powered by footer */}
        <div className="chat-footer">
          <small>Powered by AI Assistant</small>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;