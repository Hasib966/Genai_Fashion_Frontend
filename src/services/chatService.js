import axios from 'axios';
import { API_URL, AUTH_TOKEN_NAME } from '../config/env';

/**
 * Chat Service - Handles AI chat interactions with real backend API
 * Integrates with the AI backend to provide real-time database access
 */

// Create axios instance for AI API calls
const createAIClient = () => {
  const client = axios.create({
    baseURL: `${API_URL}/ai`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // Add request interceptor to attach auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(AUTH_TOKEN_NAME);
      if (token) {
        const cleanToken = token.replace('Bearer ', '').trim();
        config.headers['Authorization'] = `Bearer ${cleanToken}`;
      }
      return config;
    },
    (error) => {
      console.error('AI API request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle errors
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('AI API Error:', error);
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            // Handle authentication error
            console.error('AI API authentication failed');
            break;
          case 429:
            // Handle rate limiting
            console.error('AI API rate limit exceeded');
            break;
          default:
            console.error('AI API server error:', error.response.data);
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

const aiClient = createAIClient();

/**
 * Send a message to the AI and get a response
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous conversation context
 * @returns {Promise<Object>} - The AI's response with metadata
 */
export const sendMessage = async (message, conversationHistory = []) => {
  try {
    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Message is required and cannot be empty');
    }

    if (message.length > 2000) {
      throw new Error('Message is too long. Please keep it under 2000 characters');
    }

    // Prepare request body
    const requestBody = {
      message: message.trim(),
      conversationHistory: conversationHistory
    };

    

    // Send request to AI backend
    const response = await aiClient.post('/chat', requestBody);
    
    if (response.data.success) {
      
      
      
      
      
      // Backend returns products in 'cards' or 'products' field
      const products = response.data.data.products || response.data.data.cards || null;
      
      if (products && products.length > 0) {
        
        
      } else {
        console.warn('⚠️ No products array found in response');
        
      }
      
      return {
        message: response.data.data.message,
        timestamp: response.data.data.timestamp,
        conversationId: response.data.data.conversationId,
        dataUsed: response.data.data.dataUsed,
        products: products
      };
    } else {
      throw new Error(response.data.message || 'Failed to get AI response');
    }
  } catch (error) {
    console.error('Error in chat service:', error);
    
    // Handle specific error cases
    if (error.response) {
      switch (error.response.status) {
        case 400:
          throw new Error(error.response.data.message || 'Invalid request');
        case 401:
          throw new Error('Authentication required. Please log in to use the chat feature.');
        case 429:
          throw new Error('AI service is temporarily unavailable due to high usage. Please try again later.');
        case 500:
          throw new Error('Failed to process your message. Please try again.');
        default:
          throw new Error(error.response.data.message || 'Failed to get AI response');
      }
    } else if (error.request) {
      throw new Error('Unable to connect to AI service. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to get AI response');
    }
  }
};

/**
 * Get AI suggestions for common queries
 * @returns {Promise<Array>} - Array of suggested questions
 */
export const getAISuggestions = async () => {
  try {
    
    
    const response = await aiClient.get('/suggestions');
    
    if (response.data.success) {
      
      return {
        suggestions: response.data.data.suggestions,
        timestamp: response.data.data.timestamp,
        dynamicData: response.data.data.dynamicData
      };
    } else {
      throw new Error(response.data.message || 'Failed to get suggestions');
    }
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    
    // Return fallback suggestions if API fails
    return {
      suggestions: [
        "What are your best-selling products?",
        "Show me new arrivals",
        "What categories do you have?",
        "How can I track my order?",
        "What is your return policy?",
        "Do you offer international shipping?"
      ],
      timestamp: new Date().toISOString(),
      dynamicData: {
        categoriesAvailable: 0,
        bestSellersAvailable: 0,
        newArrivalsAvailable: 0,
        userHasOrders: false
      }
    };
  }
};

/**
 * Check AI service health
 * @returns {Promise<Object>} - Service health status
 */
export const checkAIHealth = async () => {
  try {
    
    
    const response = await aiClient.get('/health');
    
    if (response.data.success) {
      return {
        status: response.data.data.status,
        timestamp: response.data.data.timestamp,
        apiKeyConfigured: response.data.data.apiKeyConfigured
      };
    } else {
      throw new Error(response.data.message || 'AI service health check failed');
    }
  } catch (error) {
    console.error('Error checking AI health:', error);
    return {
      status: 'AI service is not available',
      timestamp: new Date().toISOString(),
      apiKeyConfigured: false,
      error: error.message
    };
  }
};

/**
 * Get a welcome message for new users
 * @returns {string} - Welcome message
 */
export const getWelcomeMessage = () => {
  return "Welcome to OpDrape! I'm your AI assistant, here to help you with product questions, orders, and any other inquiries. How can I assist you today?";
};

/**
 * Get fallback quick actions when AI is unavailable
 * @returns {Array<string>} - Array of suggested actions
 */
export const getFallbackQuickActions = () => {
  return [
    "What are your best-selling products?",
    "Show me new arrivals",
    "Help with sizing",
    "Track my order",
    "Return policy",
    "Contact support"
  ];
};

/**
 * Format conversation history for API
 * @param {Array} messages - Array of message objects
 * @returns {Array} - Formatted conversation history
 */
export const formatConversationHistory = (messages) => {
  return messages
    .filter(msg => msg.sender === 'user' || msg.sender === 'ai')
    .map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }))
    .slice(-10); // Keep last 10 messages for context
};

/**
 * Search products via AI endpoint
 * @param {string} query - Search query
 * @param {string} category - Category filter
 * @param {string} subCategory - Sub-category filter
 * @param {number} limit - Number of results
 * @returns {Promise<Object>} - Product search results
 */
export const searchProducts = async (query = '', category = '', subCategory = '', limit = 6) => {
  try {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (category) params.append('category', category);
    if (subCategory) params.append('subCategory', subCategory);
    if (limit) params.append('limit', limit.toString());

    const response = await aiClient.get(`/products/search?${params.toString()}`);
    
    if (response.data.success) {
      
      // Return the data object which contains count and cards
      return {
        count: response.data.data.count,
        products: response.data.data.cards || response.data.data.products || []
      };
    } else {
      throw new Error(response.data.message || 'Failed to search products');
    }
  } catch (error) {
    console.error('Error searching products:', error);
    throw new Error(error.response?.data?.message || 'Failed to search products');
  }
};

/**
 * Get product by ID via AI endpoint
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} - Product details
 */
export const getProductById = async (productId) => {
  try {
    const response = await aiClient.get(`/products/${productId}`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to get product');
    }
  } catch (error) {
    console.error('Error getting product:', error);
    throw new Error(error.response?.data?.message || 'Failed to get product');
  }
};