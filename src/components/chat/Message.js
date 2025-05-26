import React from 'react';
import { FaUser, FaRobot, FaShoppingBag, FaBox, FaQuestionCircle, FaInfoCircle } from 'react-icons/fa';
import ChatProductCard from './ChatProductCard';
import './Message.css';

/**
 * Message - Individual message component
 * Displays user or AI messages with proper styling and formatted content
 */
const Message = ({ message, formatTime }) => {
  const isUser = message.sender === 'user';
  const isAI = message.sender === 'ai';
  
  // Debug logging for products
  if (isAI) {
    console.log('AI Message:', {
      hasProducts: !!message.products,
      productsType: typeof message.products,
      isArray: Array.isArray(message.products),
      length: message.products?.length,
      products: message.products
    });
  }

  // Format AI response text for better readability
  const formatAIResponse = (text) => {
    if (!text || typeof text !== 'string') return text;

    // Clean and normalize the text
    let cleanText = text
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines
      .replace(/\r\n/g, '\n') // Normalize line endings
      .trim();

    // Apply basic text formatting
    let formattedText = cleanText
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Italic text
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'); // Links

    // Split by double newlines to get paragraphs
    const paragraphs = formattedText.split(/\n\s*\n/);
    
    return paragraphs.map((paragraph, index) => {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) return null;

      // Check for product listings with prices (e.g., "Product Name - $29.99")
      const productPattern = /([A-Za-z\s\-\&]+(?:T-Shirt|Shirt|Dress|Jeans|Shoes|Jacket|Top|Bottom|Accessory|Bag|Hat|Sweater|Hoodie|Blouse|Skirt|Pants|Shorts)[A-Za-z\s\-\&]*)\s*[-–—]\s*\$?(\d+\.?\d*)/gi;
      const productMatches = [...trimmedParagraph.matchAll(productPattern)];
      
      if (productMatches.length > 0) {
        return (
          <div key={index} className="message-product-list">
            {productMatches.map((match, matchIndex) => (
              <div key={matchIndex} className="product-item">
                <span className="product-name">{match[1].trim()}</span>
                <span className="product-price">${match[2]}</span>
              </div>
            ))}
          </div>
        );
      }

      // Check if paragraph contains list-like content
      const lines = trimmedParagraph.split('\n');
      const hasListIndicators = lines.some(line => {
        const trimmedLine = line.trim();
        return /^[•\-\*]\s+/.test(trimmedLine) || 
               /^\d+\.\s+/.test(trimmedLine) ||
               /^(Here are|Our|Available|Options|Features|Benefits|Steps|Categories|Products|Items?):?\s*$/i.test(trimmedLine);
      });

      if (hasListIndicators && lines.length > 1) {
        return (
          <div key={index} className="message-list-container">
            {lines.map((line, lineIndex) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return null;

              // Check for bullet points
              if (/^[•\-\*]\s+/.test(trimmedLine)) {
                return (
                  <div key={lineIndex} className="message-list-item">
                    <span className="list-bullet">•</span>
                    <span dangerouslySetInnerHTML={{ __html: trimmedLine.replace(/^[•\-\*]\s+/, '') }} />
                  </div>
                );
              }

              // Check for numbered items
              if (/^\d+\.\s+/.test(trimmedLine)) {
                const number = trimmedLine.match(/^(\d+)\.\s+/)?.[1];
                return (
                  <div key={lineIndex} className="message-list-item numbered">
                    <span className="list-number">{number}.</span>
                    <span dangerouslySetInnerHTML={{ __html: trimmedLine.replace(/^\d+\.\s+/, '') }} />
                  </div>
                );
              }

              // Check for list headers
              if (/^(Here are|Our|Available|Options|Features|Benefits|Steps|Categories|Products|Items?):?\s*$/i.test(trimmedLine)) {
                return (
                  <div key={lineIndex} className="message-list-header">
                    <span dangerouslySetInnerHTML={{ __html: trimmedLine }} />
                  </div>
                );
              }

              // Regular line
              return (
                <div key={lineIndex} className="message-list-text">
                  <span dangerouslySetInnerHTML={{ __html: trimmedLine }} />
                </div>
              );
            })}
          </div>
        );
      }

      // Check if it's a short heading (no periods, starts with capital, short length)
      if (trimmedParagraph.length < 100 && 
          !trimmedParagraph.includes('.') && 
          !trimmedParagraph.includes('?') &&
          /^[A-Z]/.test(trimmedParagraph) &&
          !trimmedParagraph.includes('\n')) {
        return (
          <div key={index} className="message-heading">
            <span dangerouslySetInnerHTML={{ __html: trimmedParagraph }} />
          </div>
        );
      }

      // Regular paragraph
      return (
        <div key={index} className="message-paragraph">
          <span dangerouslySetInnerHTML={{ __html: trimmedParagraph.replace(/\n/g, '<br/>') }} />
        </div>
      );
    }).filter(Boolean);
  };

  // Get appropriate icon based on message content
  const getMessageIcon = (text) => {
    if (!text) return <FaRobot />;
    
    const lowerText = text.toLowerCase();
    if (lowerText.includes('product') || lowerText.includes('item') || lowerText.includes('clothing')) {
      return <FaShoppingBag />;
    }
    if (lowerText.includes('order') || lowerText.includes('track') || lowerText.includes('ship')) {
      return <FaBox />;
    }
    if (lowerText.includes('help') || lowerText.includes('support') || lowerText.includes('question')) {
      return <FaQuestionCircle />;
    }
    if (lowerText.includes('policy') || lowerText.includes('information') || lowerText.includes('about')) {
      return <FaInfoCircle />;
    }
    return <FaRobot />;
  };

  return (
    <div className={`message ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-avatar">
        {isUser ? <FaUser /> : getMessageIcon(message.text)}
      </div>
      
      <div className="message-content">
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
          <div className="message-text">
            {isUser ? message.text : formatAIResponse(message.text)}
          </div>
          
          {/* Product Cards for AI messages */}
          {isAI && message.products && Array.isArray(message.products) && message.products.length > 0 && (
            <div className="chat-product-cards-container">
              {message.products.length > 1 && (
                <div className="chat-products-header">
                  Found {message.products.length} product{message.products.length > 1 ? 's' : ''}:
                </div>
              )}
              {message.products.map((product) => (
                <ChatProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          {/* Data usage indicator for AI messages */}
          {isAI && message.dataUsed && (
            <div className="data-usage-indicator">
              <small>
                📊 Used {message.dataUsed.productsFound || 0} products, 
                {message.dataUsed.categoriesFound || 0} categories
                {message.dataUsed.userOrdersFound > 0 && `, ${message.dataUsed.userOrdersFound} orders`}
              </small>
            </div>
          )}
        </div>
        
        <div className="message-time">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default Message;