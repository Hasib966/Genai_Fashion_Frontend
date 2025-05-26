# Debugging Chat Product Cards

## Issue: Products Not Displaying

If product cards are not showing in the chat, follow these debugging steps:

### Step 1: Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab for these messages:

#### Expected Console Logs:

1. **When sending a message:**
```
Sending message to AI API: { message: "...", conversationHistory: [...] }
```

2. **When receiving AI response:**
```
AI API response: { success: true, data: { message: "...", ... } }
```

3. **If products are found:**
```
Products found in AI response: 2
```

4. **When adding message with products:**
```
Adding message with products: [{ id: "...", name: "...", ... }]
```

5. **In Message component:**
```
Message component received products: [{ id: "...", name: "...", ... }]
```

### Step 2: Check Backend Response Format

The backend should return data in this format:

```json
{
  "success": true,
  "data": {
    "message": "Here are some products...",
    "timestamp": "2024-10-20T12:00:00Z",
    "cards": [
      {
        "id": "68f506358cc30b2473c8c291",
        "name": "Product Name",
        "price": 1750,
        "primaryImage": {
          "url": "https://...",
          "alt": "..."
        }
      }
    ]
  }
}
```

**Note:** Products can be in either `cards` or `products` field. The frontend handles both.

### Step 3: Check Network Tab

1. Open Developer Tools → Network tab
2. Send a message asking about products (e.g., "Show me shirts")
3. Look for the POST request to `/api/ai/chat`
4. Click on it and check the Response tab
5. Verify the response contains the `cards` or `products` array

### Step 4: Verify Backend Integration

Check if your backend AI endpoint is properly configured to return products.

#### Test Backend Endpoint Directly:

```bash
# Test chat endpoint
curl -X POST http://your-api-url/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Show me ladies shirts",
    "conversationHistory": []
  }'

# Test product search endpoint
curl http://your-api-url/api/ai/products/search?q=shirt&limit=3 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 5: Common Issues & Solutions

#### Issue 1: Backend Returns Products but Not Displayed

**Possible Causes:**
- Products field is named differently (not `cards` or `products`)
- Products data structure doesn't match expected format
- Missing required fields in product data

**Solution:**
Check the exact field name in console logs and update `chatService.js`:

```javascript
// In chatService.js, line ~97
const products = response.data.data.YOUR_FIELD_NAME || null;
```

#### Issue 2: Products Array is Empty

**Possible Causes:**
- Backend not finding matching products
- Query not being processed correctly
- Database connection issues

**Solution:**
- Test with a broad query (e.g., "show me products")
- Check backend logs for errors
- Verify database has products

#### Issue 3: Component Not Re-rendering

**Possible Causes:**
- State not updating correctly
- React keys missing/incorrect
- Message object immutability issue

**Solution:**
- Check React DevTools to see if message state includes products
- Verify message has unique id
- Check console for React warnings

#### Issue 4: Images Not Loading

**Possible Causes:**
- Invalid image URLs
- CORS issues
- Cloudinary configuration

**Solution:**
- Check Network tab for failed image requests
- Verify Cloudinary URLs are public
- Check image URL format

#### Issue 5: "cards" vs "products" Naming

**Current Mapping:**
```javascript
const products = response.data.data.products || response.data.data.cards || null;
```

This checks both `products` and `cards` fields. If your backend uses a different field name, update this line.

### Step 6: Test with Mock Data

To test the frontend independently, you can temporarily mock the response:

```javascript
// In FloatingChat.js, temporarily replace the sendMessage call:

// const aiResponse = await sendMessage(inputValue.trim(), conversationHistory);

// Use mock data instead:
const aiResponse = {
  message: "Here are some products I found:",
  timestamp: new Date().toISOString(),
  products: [
    {
      id: "test-1",
      name: "Test Product 1",
      price: 1000,
      primaryImage: {
        url: "https://via.placeholder.com/200",
        alt: "Test Product"
      },
      averageRating: 4.5,
      totalReviews: 10,
      colors: ["Red", "Blue"],
      sizes: ["S", "M", "L"],
      isNewArrival: true,
      isSale: false,
      isBestSeller: false
    }
  ]
};
```

If this displays products correctly, the issue is with the backend integration.

### Step 7: Check Component Imports

Verify all necessary components are imported:

```javascript
// In Message.js
import ChatProductCard from './ChatProductCard'; // Should be present

// In ChatProductCard.js
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
```

### Step 8: Verify CSS is Loaded

Check if `ChatProductCard.css` is being loaded:

1. Open Developer Tools → Elements/Inspector
2. Find a message element
3. Check if `.chat-product-card` styles are applied
4. If not, verify the CSS file is imported in `ChatProductCard.js`

### Step 9: Check Authentication

Product actions require authentication:

1. Verify you're logged in
2. Check if `isAuthenticated` is true in AppContext
3. Test both authenticated and unauthenticated states

### Step 10: Browser Console Errors

Look for these common errors:

- **"Cannot read property 'map' of undefined"** → Products array is null/undefined
- **"Maximum update depth exceeded"** → State update loop issue
- **"Warning: Each child in a list should have a unique 'key' prop"** → Missing/duplicate keys
- **CORS errors** → Backend CORS configuration issue
- **401 Unauthorized** → Authentication token issue

## Quick Debug Checklist

- [ ] Browser console shows no errors
- [ ] Network request to `/api/ai/chat` succeeds (status 200)
- [ ] Response contains `cards` or `products` array
- [ ] Console log shows "Products found in AI response: X"
- [ ] Console log shows "Message component received products: [...]"
- [ ] ChatProductCard.css is loaded
- [ ] User is authenticated
- [ ] Product images load correctly

## Getting Help

If products still don't display after following these steps:

1. **Copy the following information:**
   - Console logs from sending a message
   - Network response from `/api/ai/chat`
   - Any error messages
   - React DevTools state inspection

2. **Check these files:**
   - `src/services/chatService.js` (line ~97)
   - `src/components/chat/FloatingChat.js` (line ~109)
   - `src/components/chat/Message.js` (line ~166)

3. **Verify backend:**
   - Backend returns products in correct format
   - Field name matches frontend expectation
   - Products contain all required fields

## Required Product Fields

Each product must have these minimum fields:

```javascript
{
  id: String,              // Required - unique identifier
  name: String,            // Required - product name
  price: Number,           // Required - product price
  primaryImage: {          // Required - main image
    url: String,          // Required - image URL
    alt: String           // Optional - alt text
  },
  // Optional fields:
  salePrice: Number,       // Sale price if on sale
  averageRating: Number,   // Average rating (0-5)
  totalReviews: Number,    // Number of reviews
  colors: Array,           // Available colors
  sizes: Array,            // Available sizes
  isNewArrival: Boolean,   // New arrival badge
  isSale: Boolean,         // Sale badge
  isBestSeller: Boolean    // Best seller badge
}
```

## Success Indicators

When working correctly, you should see:

1. ✅ AI message text appears
2. ✅ Product cards appear below the message
3. ✅ Product images load
4. ✅ Badges show (New/Sale/Best if applicable)
5. ✅ Click on product navigates to detail page
6. ✅ Add to cart button works
7. ✅ Add to wishlist button works
8. ✅ No console errors

## Example Working Query

Try this query to test:
```
"Show me ladies shirts"
"What new products do you have?"
"Do you have any shoes?"
```

The AI should respond with a message and product cards.

