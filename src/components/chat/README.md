# Floating Chat Component

A modular floating chat widget with real AI backend integration for the OpDrape frontend application.

## Features

- **Floating Design**: Fixed position chat button that can be toggled
- **Modern UI**: Beautiful gradient design with smooth animations
- **Real AI Integration**: Connects to backend AI service with database access
- **Smart Suggestions**: Dynamic AI-powered suggestions based on available data
- **Authentication**: JWT-based authentication with user context
- **Conversation History**: Maintains conversation context for better responses
- **Data Usage Tracking**: Shows what database data was used in responses
- **Health Monitoring**: Real-time AI service status monitoring
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Responsive**: Works on desktop, tablet, and mobile devices
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Modular Architecture**: Separate components for easy maintenance

## Components

### FloatingChat
Main container component that manages the chat state and handles message sending.

### ChatWindow
The chat interface container with header, messages area, and input field.

### MessageList
Displays the list of messages with scrolling and loading indicators.

### Message
Individual message component for user and AI messages.

## Usage

The FloatingChat component is already mounted in the main Layout component and will appear on all pages.

```jsx
import { FloatingChat } from './components/chat';

// The component is already integrated in Layout.js
```

## Chat Service

The `chatService.js` provides:
- **Real AI API Integration**: Connects to `/api/ai/chat` endpoint
- **Authentication**: JWT token management for secure API calls
- **Smart Suggestions**: Dynamic suggestions from `/api/ai/suggestions`
- **Health Monitoring**: Service status checks via `/api/ai/health`
- **Conversation Context**: Maintains conversation history for better responses
- **Error Handling**: Comprehensive error handling for all API scenarios
- **Data Usage Tracking**: Shows database queries used in AI responses

### API Endpoints Used
- **POST /api/ai/chat**: Send messages and get AI responses
- **GET /api/ai/suggestions**: Get dynamic suggestions based on available data
- **GET /api/ai/health**: Check AI service operational status

### Features
- **Product Queries**: Real-time access to product database
- **Order Management**: User order history and tracking
- **Business Information**: Store policies, promotions, and support
- **Contextual Responses**: AI maintains conversation context
- **Data Transparency**: Shows what database data was used

## Styling

All components include comprehensive CSS with:
- Responsive design for all screen sizes
- Dark mode support
- High contrast mode support
- Reduced motion support for accessibility
- Modern gradient designs and animations

## Current Implementation

✅ **Completed Features:**
- Real AI backend integration with database access
- JWT authentication and user context
- Dynamic AI suggestions based on available data
- Conversation history management
- Data usage tracking and transparency
- Comprehensive error handling
- Health monitoring and status indicators
- Responsive design for all devices

## Future Enhancements

- Message persistence across sessions
- File upload support for images/documents
- Voice message support
- Multi-language support
- Admin chat monitoring dashboard
- Chat analytics and insights
- Integration with additional AI providers
- Real-time typing indicators
- Chat export functionality

## File Structure

```
src/components/chat/
├── FloatingChat.js          # Main chat component
├── FloatingChat.css         # Main chat styles
├── ChatWindow.js           # Chat window container
├── ChatWindow.css          # Chat window styles
├── MessageList.js          # Message list component
├── MessageList.css         # Message list styles
├── Message.js              # Individual message component
├── Message.css             # Message styles
├── index.js                # Component exports
└── README.md               # This documentation

src/services/
└── chatService.js          # AI chat service
```