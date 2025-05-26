import React from 'react';
import { FaRobot } from 'react-icons/fa';
import Message from './Message';
import './MessageList.css';

/**
 * MessageList - Displays the list of chat messages
 * Handles scrolling and message rendering
 */
const MessageList = ({ messages, isLoading, messagesEndRef, suggestions, onSuggestionClick, isAuthenticated }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;
    
    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toDateString();
      
      if (messageDate !== currentDate) {
        groups.push({
          type: 'date',
          date: message.timestamp
        });
        currentDate = messageDate;
      }
      
      groups.push({
        type: 'message',
        data: message
      });
    });
    
    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);
  const showSuggestions = suggestions && suggestions.length > 0 && messages.length <= 1;

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FaRobot />
          </div>
          <p>Hi! 👋 I'm your AI shopping assistant. How can I help you today?</p>
        </div>
      ) : (
        <div className="messages">
          {groupedMessages.map((item, index) => (
            item.type === 'date' ? (
              <div key={`date-${index}`} className="date-separator">
                <span>{formatDate(item.date)}</span>
              </div>
            ) : (
              <Message
                key={item.data.id}
                message={item.data}
                formatTime={formatTime}
              />
            )
          ))}
          
          {/* Quick reply suggestions after first message */}
          {showSuggestions && (
            <div className="quick-replies">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  className={`quick-reply-btn ${index === 2 ? 'primary' : 'secondary'}`}
                  onClick={() => onSuggestionClick(suggestion)}
                  disabled={isLoading || !isAuthenticated}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="message ai-message loading-message">
              <div className="message-avatar">
                <FaRobot />
              </div>
              <div className="message-content">
                <div className="message-bubble ai-bubble">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList;