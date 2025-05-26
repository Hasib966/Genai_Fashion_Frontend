# Chat Product Cards Integration

## Overview
The AI chatbox now supports displaying product cards directly within chat messages. When the AI backend returns product information, these products are displayed as interactive, compact cards that users can view and interact with.

## Backend API Integration

### Endpoints Used

#### 1. Search Products
```
GET /api/ai/products/search?q=...&category=...&subCategory=...&limit=6
```

**Query Parameters:**
- `q` (optional): Search query string
- `category` (optional): Category filter (e.g., "women", "men")
- `subCategory` (optional): Sub-category filter (e.g., "shirts", "jeans")
- `limit` (optional): Number of results to return (default: 6)

#### 2. Get Product by ID
```
GET /api/ai/products/:id
```

**Path Parameters:**
- `id`: The product ID

### Response Format

Both endpoints return data in this format:

```json
{
  "success": true,
  "data": {
    "count": 2,
    "cards": [
      {
        "id": "68f506358cc30b2473c8c291",
        "name": "Ladies Shirt",
        "description": "FREE DELIVERY at TK.8000 purchase...",
        "category": "women",
        "subCategory": "shirts",
        "price": 1750,
        "basePrice": 1750,
        "salePrice": null,
        "averageRating": 5,
        "totalReviews": 1,
        "primaryImage": {
          "url": "https://res.cloudinary.com/.../image.jpg",
          "alt": "Ladies Shirt"
        },
        "images": [
          {
            "url": "https://res.cloudinary.com/.../image.jpg",
            "alt": "Ladies Shirt"
          }
        ],
        "colors": ["Light Blue"],
        "sizes": ["S", "M", "L", "XL"],
        "isBestSeller": false,
        "isNewArrival": true,
        "isSale": false
      }
    ]
  }
}
```

## Component Architecture

### New Components

#### ChatProductCard.js
A compact product card component specifically designed for the chat interface.

**Features:**
- Compact layout (100px x 100px image)
- Product name, rating, and price display
- Quick action buttons (Add to Cart, Add to Wishlist)
- Badge indicators (New, Sale, Best Seller)
- Click to view full product details
- Responsive design for mobile

**Props:**
```javascript
{
  product: {
    id: String,
    name: String,
    price: Number,
    salePrice: Number,
    primaryImage: {
      url: String,
      alt: String
    },
    averageRating: Number,
    totalReviews: Number,
    colors: Array,
    sizes: Array,
    isNewArrival: Boolean,
    isSale: Boolean,
    isBestSeller: Boolean
  }
}
```

### Modified Components

#### Message.js
Updated to detect and render product cards within AI messages.

**Changes:**
- Imports `ChatProductCard` component
- Checks for `message.products` array
- Renders product cards below the message text
- Shows product count header when multiple products

#### FloatingChat.js
Updated to handle product data in AI responses.

**Changes:**
- Stores `products` array in message objects
- Passes product data through to Message component

#### chatService.js
Updated to include product data from API responses.

**Changes:**
- Returns `products` field from API response
- Added `searchProducts()` function for direct product search
- Added `getProductById()` function for single product retrieval

## Data Flow

```
User Query
    ↓
FloatingChat (handleSendMessage)
    ↓
chatService.sendMessage()
    ↓
Backend AI API (/api/ai/chat)
    ↓
AI Response with Products Array
    ↓
FloatingChat (stores in message.products)
    ↓
MessageList → Message Component
    ↓
ChatProductCard (renders each product)
```

## Usage Example

### AI Response with Products

When the backend returns a response with products:

```javascript
{
  "success": true,
  "data": {
    "message": "Here are some ladies shirts I found for you:",
    "timestamp": "2024-10-20T12:00:00Z",
    "products": [
      {
        "id": "68f506358cc30b2473c8c291",
        "name": "Ladies Shirt",
        "price": 1750,
        // ... other product fields
      }
    ],
    "dataUsed": {
      "productsFound": 1,
      "categoriesFound": 1
    }
  }
}
```

The chat will display:
1. The AI message text
2. A products header (if multiple products)
3. Compact product cards for each product
4. Data usage indicator

## Styling

### ChatProductCard.css

**Key Features:**
- Horizontal layout (image + info side by side)
- 100px square image with rounded corners
- Compact typography for chat context
- Purple accent color matching chat design
- Hover effects for interactivity
- Responsive adjustments for mobile

**Color Palette:**
- Primary: #7c3aed (Purple)
- Hover: #6d28d9 (Darker Purple)
- Background: white
- Border: #e5e7eb (Light Gray)
- Text: #1f2937 (Dark Gray)

### Message.css Updates

**Changes:**
- Increased max-width for messages with products (85%)
- Added `.chat-product-cards-container` styles
- Proper spacing for product cards within messages

## User Interactions

### View Product
- **Action:** Click anywhere on product card
- **Result:** Navigate to product detail page

### Add to Cart
- **Action:** Click cart button
- **Result:** 
  - If authenticated: Add to cart with default color/size
  - If not authenticated: Redirect to login

### Add to Wishlist
- **Action:** Click heart button
- **Result:**
  - If authenticated: Add to wishlist
  - If not authenticated: Redirect to login

## Responsive Design

### Desktop (>480px)
- Image: 100px x 100px
- Font sizes optimized for readability
- Full button labels

### Mobile (≤480px)
- Image: 85px x 85px
- Reduced padding and font sizes
- Compact button styling
- Touch-friendly targets

## Backend Integration Requirements

### Expected AI Response Format

The backend AI should return products in this structure:

```javascript
{
  "success": true,
  "data": {
    "message": "Your AI message here",
    "timestamp": "ISO timestamp",
    "products": [
      {
        "id": "product_id",
        "name": "Product Name",
        "price": 1000,
        "salePrice": 800, // optional
        "primaryImage": {
          "url": "image_url",
          "alt": "image_alt"
        },
        "averageRating": 4.5,
        "totalReviews": 10,
        "colors": ["Red", "Blue"],
        "sizes": ["S", "M", "L"],
        "isNewArrival": true,
        "isSale": false,
        "isBestSeller": false
      }
      // ... more products
    ],
    "dataUsed": {
      "productsFound": 2,
      "categoriesFound": 1
    }
  }
}
```

## Features

### Product Cards
- ✅ Compact layout optimized for chat
- ✅ Product image with badges
- ✅ Product name (truncated if long)
- ✅ Star rating and review count
- ✅ Price display with sale price
- ✅ Quick add to cart button
- ✅ Add to wishlist button
- ✅ Click to view product details

### Integration
- ✅ Seamless integration with existing chat
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states
- ✅ Authentication checks
- ✅ Navigation support

### Accessibility
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus indicators
- ✅ Alt text for images
- ✅ ARIA labels

## Testing Checklist

### Functional Tests
- [ ] Product cards display correctly with AI responses
- [ ] Click on product card navigates to product detail
- [ ] Add to cart works for authenticated users
- [ ] Add to wishlist works for authenticated users
- [ ] Redirect to login for unauthenticated users
- [ ] Multiple products display in grid
- [ ] Product badges show correctly (New, Sale, Best)
- [ ] Sale prices display with strikethrough on original price

### Visual Tests
- [ ] Product cards fit within chat window
- [ ] No horizontal overflow
- [ ] Images load properly
- [ ] Typography is readable
- [ ] Hover states work correctly
- [ ] Mobile responsive design works

### Edge Cases
- [ ] Handle missing product images (fallback)
- [ ] Handle products with no reviews
- [ ] Handle products with long names
- [ ] Handle empty products array
- [ ] Handle API errors gracefully

## Example User Flows

### Flow 1: Product Search
```
User: "Show me ladies shirts"
    ↓
AI: "Here are some ladies shirts I found for you:"
    + [Product Card 1]
    + [Product Card 2]
    + [Product Card 3]
    ↓
User clicks on Product Card 1
    ↓
Navigate to product detail page
```

### Flow 2: Add to Cart
```
User: "Show me new arrivals"
    ↓
AI: Response with product cards
    ↓
User clicks "Add" button on product
    ↓
If authenticated:
  - Product added to cart
  - Toast notification shown
If not authenticated:
  - Redirect to login page
```

### Flow 3: Multiple Products
```
User: "What shoes do you have?"
    ↓
AI: "I found 6 shoes for you:"
    + Header: "Found 6 products:"
    + [Product Card 1]
    + [Product Card 2]
    + [Product Card 3]
    + [Product Card 4]
    + [Product Card 5]
    + [Product Card 6]
```

## Performance Considerations

### Optimization
- Lazy loading for product images
- Efficient re-renders with React keys
- Minimal DOM manipulation
- CSS animations over JavaScript

### Best Practices
- Limit products per response (max 6)
- Use optimized image URLs from Cloudinary
- Implement error boundaries
- Handle loading states

## Future Enhancements

### Potential Features
1. **Product Carousel**: Horizontal scroll for many products
2. **Quick View Modal**: View product details without leaving chat
3. **Size/Color Selection**: Choose variants directly in chat
4. **Comparison View**: Compare multiple products
5. **Price Alerts**: Notify when product goes on sale
6. **Virtual Try-On**: AR features for clothing
7. **Product Reviews**: Show reviews in chat
8. **Recommendations**: AI-powered product suggestions

### Backend Integration
1. **Product Analytics**: Track which products are viewed from chat
2. **Personalization**: AI learns user preferences
3. **Inventory Check**: Real-time stock status
4. **Price Tracking**: Historical price data
5. **Similar Products**: Show alternatives

## Troubleshooting

### Products Not Displaying
1. Check backend API response format
2. Verify `products` array in message object
3. Check console for errors
4. Verify image URLs are accessible

### Styling Issues
1. Check ChatProductCard.css is imported
2. Verify no CSS conflicts
3. Check responsive breakpoints
4. Test in different browsers

### Navigation Issues
1. Verify React Router is configured
2. Check product ID format
3. Verify product detail route exists
4. Check authentication context

## Files Modified/Created

### New Files
1. `src/components/chat/ChatProductCard.js` - Product card component
2. `src/components/chat/ChatProductCard.css` - Product card styles
3. `CHAT_PRODUCT_CARDS.md` - This documentation

### Modified Files
1. `src/components/chat/Message.js` - Added product card rendering
2. `src/components/chat/Message.css` - Updated for product cards
3. `src/components/chat/FloatingChat.js` - Handle product data
4. `src/services/chatService.js` - Added product endpoints
5. `src/components/chat/index.js` - Export ChatProductCard

## API Documentation Reference

For detailed backend API documentation, refer to:
- Backend API endpoints documentation
- Product schema documentation
- AI chat integration guide

