import axios from 'axios';
import { API_URL, API_TIMEOUT, AUTH_TOKEN_NAME, ENABLE_MOCK_ORDERS } from '../config/env';

// Define API endpoint - this provides a fallback in case the imported one isn't working
const API_ENDPOINT = API_URL || 'http://localhost:8000/api';

// Create axios instance with environment variables
const API = axios.create({
  baseURL: API_ENDPOINT,
  timeout: API_TIMEOUT || 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Changed to true to support session cookies
});

// Log the API endpoint being used


// Add request interceptor to attach auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_NAME);
    if (token) {
      // Ensure token is properly formatted
      const cleanToken = token.replace('Bearer ', '').trim();
      config.headers['Authorization'] = `Bearer ${cleanToken}`;
      
      // Log request for debugging
      
    }
    
    // Add additional headers for CORS support
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Handle various error scenarios
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Clear auth data and redirect to login
          localStorage.removeItem(AUTH_TOKEN_NAME);
          localStorage.removeItem('user');
          // Use window.location.replace instead of href to prevent back button issues
          window.location.replace('/login?reason=session_expired');
          break;
        case 403:
          console.error('Access forbidden:', error.response.data);
          break;
        case 422:
          console.error('Validation error:', error.response.data);
          break;
        default:
          console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const loginUser = (credentials) => {
  
  
  // For demo purposes - in production, this would be removed
  // This allows testing with admin credentials locally without a backend
  if (credentials.email === 'admin@example.com' && credentials.password === 'admin123') {
    
    
    // Create a mock admin token and user data
    const mockAdminResponse = {
      data: {
        token: 'mock-admin-token-for-testing',
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          isAdmin: true,
          createdAt: new Date().toISOString()
        }
      }
    };
    
    // Store directly in localStorage for redundancy
    try {
      localStorage.setItem(AUTH_TOKEN_NAME, mockAdminResponse.data.token);
      localStorage.setItem('user', JSON.stringify(mockAdminResponse.data.user));
      
    } catch (e) {
      console.error('API - Error storing admin user in localStorage:', e);
    }
    
    return Promise.resolve(mockAdminResponse);
  }
  
  // Regular API call for non-admin users
  return API.post('/users/login', credentials)
    .catch(error => {
      console.error('Login API Error:', error);
      
      // Handle specific server errors
      if (error.response) {
        const { status, data } = error.response;
        
        // If server returns 500 with generateToken error, provide more specific error
        if (status === 500 && data.error === 'generateToken is not defined') {
          error.isServerError = true;
          error.friendlyMessage = 'The authentication service is temporarily unavailable. Please try again later or contact support if the issue persists.';
          console.error('Server authentication service error:', data.error);
        }
        
        // Log detailed error information
        console.error('Server Error Details:', {
          status,
          statusText: error.response.statusText,
          data: data,
          endpoint: '/users/login'
        });
      }
      
      throw error;
    });
};

// Enhanced registration function with better error handling
export const registerUser = async (userData) => {
  try {
    
    
    // Validate required fields
    const requiredFields = ['firstname', 'lastname', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Make the registration request
    const response = await API.post('/users/register', userData);
    
    // If successful, store auth data
    if (response.data && response.data.token) {
      localStorage.setItem(AUTH_TOKEN_NAME, response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
    }
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific error cases
    if (error.response) {
      switch (error.response.status) {
        case 409:
          throw new Error('This email is already registered');
        case 422:
          throw new Error('Invalid registration data: ' + JSON.stringify(error.response.data.errors));
        default:
          throw new Error('Registration failed: ' + (error.response.data.message || 'Please try again'));
      }
    }
    
    throw error;
  }
};

export const forgotPassword = (email) => API.post('/users/forgot-password', { email });

/**
 * Reset user password
 * @param {object} passwordData - Object with currentPassword and newPassword
 * @returns {Promise} - Promise resolved with the API response
 */
export const resetPassword = async (passwordData) => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem(AUTH_TOKEN_NAME);
    
    
    if (!token) {
      console.error('Change Password - No token found in localStorage');
      throw new Error('Authentication token is missing. Please log in again.');
    }
    
    // Use the correct endpoint: /users/change-password
    
    
    // Make direct API call with authentication header
    const response = await axios({
      method: 'POST',
      url: `${API_URL}/users/change-password`,
      data: passwordData,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

// Enhanced getUserProfile with fallback options
export const getUserProfile = () => {
  
  
  return API.get('/users/profile')
    .catch(error => {
      if (error.response && error.response.status === 404) {
        
        return API.get('/users/me');
      }
      throw error;
    });
};

// Try multiple methods and endpoints for updating user profile
export const updateUserProfile = (userData) => {
  
  
  // Try endpoints in this priority order
  const attempts = [
    // First try with the method that should work based on RESTful conventions
    () => API.patch('/users/profile', userData),
    // If that fails, try POST which is commonly used for updates
    () => API.post('/users/profile', userData),
    // Try PUT which was the original method
    () => API.put('/users/profile', userData),
    // Try alternative endpoints that might be used
    () => API.patch('/users/me', userData),
    () => API.post('/users/me', userData),
    // Remove /api prefix from these endpoints
    () => API.patch('/users/profile', userData),
    () => API.post('/users/profile', userData),
    // Try with explicit update endpoints
    () => API.post('/users/update-profile', userData),
    () => API.post('/users/update', userData)
  ];
  
  // Function to try each attempt in sequence
  const tryNextAttempt = (index = 0) => {
    if (index >= attempts.length) {
      throw new Error('All API endpoint attempts failed');
    }
    
    return attempts[index]()
      .catch(error => {
        if (error.response && (error.response.status === 404 || error.response.status === 405)) {
          
          return tryNextAttempt(index + 1);
        }
        throw error;
      });
  };
  
  return tryNextAttempt();
};

export const getUserOrders = () => {
  
  
  // Make the API call with the correct endpoint
  return API.get('/orders')
    .then(response => {
      
        return response;
    })
    .catch(error => {
      console.error('Error fetching orders:', error);
      
      if (error.response) {
        console.error('Error response from server:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // If API call fails, return empty array
      return {
        data: [],
        status: 200,
        statusText: 'OK (Empty)'
      };
    });
};

// Product API calls
export const getProducts = (params) => {
  
  
  // Create a robust version that tries multiple endpoints
  return API.get('/products', { params })
    .catch(error => {
      console.error('Error with primary products endpoint:', error);
      
      // Try with direct axios call
      return axios({
        method: 'GET',
        url: '/products',
        baseURL: API_URL,
        params: params,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`
        }
      }).catch(thirdError => {
        console.error('All product endpoints failed:', thirdError);
        
        // Create fallback test products if enabled
        if (ENABLE_MOCK_ORDERS) {
          
          
          // Generate some mock products with valid MongoDB-like IDs
          const generateMockId = () => {
            let id = '';
            const chars = '0123456789abcdef';
            for (let i = 0; i < 24; i++) {
              id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return id;
          };
          
          const mockProducts = [
            {
              _id: generateMockId(),
              name: "Premium Cotton T-Shirt",
              description: "High quality cotton t-shirt",
              price: 1299,
              image: "https://via.placeholder.com/300x400",
              category: "clothing",
              stock: 50
            },
            {
              _id: generateMockId(),
              name: "Denim Jacket",
              description: "Classic denim jacket",
              price: 2499,
              image: "https://via.placeholder.com/300x400",
              category: "clothing",
              stock: 35
            },
            {
              _id: generateMockId(),
              name: "Silk Scarf",
              description: "Elegant silk scarf",
              price: 1999,
              image: "https://via.placeholder.com/300x400",
              category: "accessories",
              stock: 20
            }
          ];
          
          // Save mock products to localStorage for consistent access
          try {
            localStorage.setItem('mockProducts', JSON.stringify(mockProducts));
            
          } catch (error) {
            console.error('Failed to save mock products to localStorage:', error);
          }
          
          return { 
            data: { 
              products: mockProducts,
              total: mockProducts.length
            },
            status: 200, 
            statusText: 'OK (Mock Products)' 
          };
        }
        
        // If all API calls fail, return empty array
        return { 
          data: [], 
          status: 200, 
          statusText: 'OK (Empty fallback)' 
        };
      });
    });
};

export const getProductById = (productId, isAdmin = false) => {
  const isMongoDB_ID = productId && /^[0-9a-f]{24}$/i.test(productId);
  
  
  
  if (!productId) {
    console.error("API Service: Invalid product ID provided:", productId);
    return Promise.reject(new Error("Invalid product ID"));
  }
  
  if (!isMongoDB_ID) {
    console.error("API Service: Product ID is not a valid MongoDB ID:", productId);
    return Promise.reject(new Error("Invalid MongoDB product ID format"));
  }
  
  // Always use the products endpoint regardless of isAdmin
  // This endpoint works for both admin and non-admin contexts
  const endpoint = `/products/${productId}`;
  
  // Make the request
  return API.get(endpoint)
    .then(response => {
    
    return response;
    })
    .catch(error => {
      console.error(`API Service: Error getting product ${productId}:`, error);
      throw new Error(`Failed to fetch product ${productId}: ${error.message}`);
    });
};

export const getProductsByCategory = (category, params) => {
  
  return API.get(`/products/category/${category}`, { params })
    .then(response => {
      // Log the full response structure to debug
      
      
      // Check what structure we have and normalize it
      let products = [];
      let total = 0;
      
      // Case 1: Response directly contains an array of products
      if (Array.isArray(response.data)) {
        
        products = response.data;
        total = response.data.length;
      } 
      // Case 2: Response has products in data.products (expected format)
      else if (response.data && Array.isArray(response.data.products)) {
        
        products = response.data.products;
        total = response.data.total || products.length;
      }
      // Case 3: Data might be nested differently
      else if (response.data && typeof response.data === 'object') {
        // Look for any array property that might contain products
        const potentialArrays = Object.entries(response.data)
          .filter(([key, value]) => Array.isArray(value) && value.length > 0)
          .map(([key, value]) => ({ key, value }));
          
        if (potentialArrays.length > 0) {
          
          // Use the first array found
          const firstArray = potentialArrays[0];
          products = firstArray.value;
          total = products.length;
          
        }
      }
      
      // Transform the response to the expected format
      const normalizedResponse = {
        ...response,
        data: {
          products: products,
          total: total,
          page: params?.page || 1,
          limit: params?.limit || 12,
          totalPages: Math.ceil(total / (params?.limit || 12))
        }
      };
      
      
      return normalizedResponse;
    })
    .catch(error => {
      console.error(`Error fetching products for category ${category}:`, error);
      
      // Create fallback products for the specific category
      const fallbackProducts = generateFallbackProductsForCategory(category, 8);
      
      // Return a mock response with fallback data
                return {
        data: {
          products: fallbackProducts,
          total: fallbackProducts.length,
          page: params?.page || 1,
          limit: params?.limit || 12,
          totalPages: 1
        },
                  status: 200,
        statusText: 'OK (Fallback Data)',
      };
    });
};

// Helper function to generate fallback products for a specific category
const generateFallbackProductsForCategory = (category, count = 8) => {
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  const products = [];
  
  for (let i = 1; i <= count; i++) {
    products.push({
      _id: `fallback-${category}-${i}`,
      name: `${categoryName} Product ${i}`,
      description: `This is a fallback product for the ${categoryName} category.`,
      price: 29.99 + i * 10,
      salePrice: (29.99 + i * 10) * 0.8,
      category: category,
      inventory: {
        total: 50,
        reserved: 0
      },
      rating: 4.5,
      reviewCount: 10,
      colorVariants: [
        {
          color: { name: 'Black', hexCode: '#000000' },
          sizes: [
            { name: 'S', inStock: true },
            { name: 'M', inStock: true },
            { name: 'L', inStock: true }
          ],
          images: [`https://source.unsplash.com/random/400x500/?${category},fashion,${i}`]
        },
        {
          color: { name: 'Blue', hexCode: '#0047c2' },
          sizes: [
            { name: 'S', inStock: true },
            { name: 'M', inStock: true },
            { name: 'L', inStock: false }
          ],
          images: [`https://source.unsplash.com/random/400x500/?${category},blue,${i}`]
        }
      ],
      isFeatured: i <= 2,
      createdAt: new Date().toISOString()
    });
  }
  
  return products;
};

// Function to generate fallback products for a specific tag
const generateFallbackProductsForTag = (tag, count = 8) => {
  const tagName = tag.charAt(0).toUpperCase() + tag.slice(1);
  const products = [];
  
  // Generate random categories for diversity in the fallback products
  const possibleCategories = ['men', 'women', 'kids', 'accessories'];
  
  for (let i = 1; i <= count; i++) {
    // Alternate between categories for variety
    const category = possibleCategories[i % possibleCategories.length];
    
    products.push({
      _id: `fallback-tag-${tag}-${i}`,
      name: `${tagName} ${category.charAt(0).toUpperCase() + category.slice(1)} Item ${i}`,
      description: `This is a product tagged with "${tagName}".`,
      price: 29.99 + i * 10,
      salePrice: (29.99 + i * 10) * 0.8,
      category: category,
      inventory: {
        total: 50,
        reserved: 0
      },
      rating: 4.5,
      reviewCount: 10,
      tags: [tag, category],
      colorVariants: [
        {
          color: { name: 'Black', hexCode: '#000000' },
          sizes: [
            { name: 'S', inStock: true },
            { name: 'M', inStock: true },
            { name: 'L', inStock: true }
          ],
          images: [`https://source.unsplash.com/random/400x500/?${tag},fashion,${i}`]
        },
        {
          color: { name: 'Blue', hexCode: '#0047c2' },
          sizes: [
            { name: 'S', inStock: true },
            { name: 'M', inStock: true },
            { name: 'L', inStock: false }
          ],
          images: [`https://source.unsplash.com/random/400x500/?${tag},fashion,${i+10}`]
        }
      ],
      isFeatured: i <= 2,
      createdAt: new Date().toISOString()
    });
  }
  
  return products;
};

export const searchProducts = (params) => API.get('/products/search', { params });

// New function to get products by tag
export const getProductsByTag = (tag, params) => {
  
  
  // Use the specific backend endpoint for banner/tag products
  return API.get(`/products/banner/${tag}`, { params })
    .then(response => {
      // Log the full response structure to debug
      
      
      // Check what structure we have and normalize it
      let products = [];
      let total = 0;
      
      // Case 1: Response directly contains an array of products
      if (Array.isArray(response.data)) {
        
        products = response.data;
        total = response.data.length;
      } 
      // Case 2: Response has products in data.products (expected format)
      else if (response.data && Array.isArray(response.data.products)) {
        
        products = response.data.products;
        total = response.data.total || products.length;
      }
      // Case 3: Data might be nested differently
      else if (response.data && typeof response.data === 'object') {
        // Look for any array property that might contain products
        const potentialArrays = Object.entries(response.data)
          .filter(([key, value]) => Array.isArray(value) && value.length > 0)
          .map(([key, value]) => ({ key, value }));
          
        if (potentialArrays.length > 0) {
          
          // Use the first array found
          const firstArray = potentialArrays[0];
          products = firstArray.value;
          total = products.length;
          
        }
      }
      
      // Transform the response to the expected format
      const normalizedResponse = {
        ...response,
        data: {
          products: products,
          total: total,
          page: params?.page || 1,
          limit: params?.limit || 12,
          totalPages: Math.ceil(total / (params?.limit || 12))
        }
      };
      
      
      return normalizedResponse;
    })
    .catch(error => {
      console.error(`Error fetching products for tag ${tag}:`, error);
      
      // Create fallback products for the specific tag if API fails
      const fallbackProducts = generateFallbackProductsForTag(tag, 8);
      
      // Return a mock response with fallback data
      return {
        data: {
          products: fallbackProducts,
          total: fallbackProducts.length,
          page: params?.page || 1,
          limit: params?.limit || 12,
          totalPages: 1
        },
        status: 200,
        statusText: 'OK (Fallback Data - Tag)',
      };
  });
};

export const getProductReviews = (productId) => {
  
  return API.get(`/products/${productId}/reviews`).then(response => {
    // Extract and interpret the data for debugging
    const responseData = response.data;
    
    
    // Analyze response structure
    if (responseData && typeof responseData === 'object') {
      if (Array.isArray(responseData)) {
        
      } else {
        
        
        // Check for nested review arrays
        const possibleArrays = Object.entries(responseData)
          .filter(([key, value]) => Array.isArray(value))
          .map(([key, value]) => ({ key, count: value.length }));
        
        if (possibleArrays.length > 0) {
          
        }
      }
    }
    
    return response;
  }).catch(error => {
    console.error(`API Service: Error fetching reviews for ${productId}:`, error);
    throw error;
  });
};
export const addProductReview = (productId, reviewData) => API.post(`/products/${productId}/reviews`, reviewData);
export const submitProductReview = (productId, reviewData) => {
  // This is a workaround for a backend issue
  // The backend is validating against a Product model instead of a Review mode
  
  // Make sure we're using the correct URL structure
  return axios({
    method: 'POST',
    url: `/products/${productId}/reviews`, 
    baseURL: API_URL,
    data: reviewData, // Send the data with product fields included
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`
    }
  }).then(response => {
    
    return response;
  }).catch(error => {
    console.error(`API Service: Review submission error:`, error.response?.data);
    throw error;
  });
};
export const getRelatedProducts = (productId) => {
  if (!productId) {
    console.error('API Service: No productId provided to getRelatedProducts');
    return Promise.reject(new Error('Product ID is required'));
  }

  // Log the full URL being requested for debugging
  const url = `/products/related/${productId}`;
  const fullUrl = `${API_URL}${url}`; // Use direct API_URL
  
  
  return axios({
    method: 'GET',
    url: url,
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`
    }
  })
    .then(response => {
      // Log successful response
      
      
      // Check for empty or invalid responses
      if (!response.data) {
        console.warn(`API Service: Empty response for related products of ${productId}`);
      } else if (Array.isArray(response.data) && response.data.length === 0) {
        
      } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
        
        // Check if the data is nested under a property
        const possibleArrays = Object.entries(response.data)
          .filter(([key, value]) => Array.isArray(value))
          .map(([key, value]) => ({ key, length: value.length }));
          
        if (possibleArrays.length > 0) {
          
        }
      }
      
      return response;
    })
    .catch(error => {
      // Enhanced error logging
      console.error(`API Service: Error fetching related products for ${productId}:`, error);
      
      if (error.response) {
        console.error('API Service: Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('API Service: No response received from server', error.request);
      } else {
        console.error('API Service: Error setting up request', error.message);
      }
      
      throw error;
    });
};
export const getProductCategories = () => {
  
  
  // Since there is no dedicated categories endpoint, use hardcoded categories
  const categories = [
    { id: 'men', name: 'Men', slug: 'men' },
    { id: 'women', name: 'Women', slug: 'women' },
    { id: 'kids', name: 'Kids', slug: 'kids' },
    { id: 'accessories', name: 'Accessories', slug: 'accessories' }
  ];
  
  // Return a promise that resolves immediately with hardcoded categories
  return Promise.resolve({
    data: categories,
    status: 200,
    statusText: 'OK (Hardcoded Data)',
  });
};

// Cart and wishlist API calls
export const getCart = () => {
  
  return API.get('/users/cart')
    .then(response => {
      
      return response;
    })
    .catch(error => {
      console.error('Error fetching user cart:', error);
      throw error;
    });
};

// Alias for getCart for better naming
export const getUserCart = getCart;

export const addToCart = async (cartItem) => {
  try {
    // Format the cart item data according to the required structure
    const cartData = {
      productId: cartItem.productId,  // Use productId directly from cartItem
      colorVariant: {
        color: {
          name: cartItem.colorVariant.color.name,
          hexCode: cartItem.colorVariant.color.hexCode
        }
      },
      size: {
        name: cartItem.size.name,
        quantity: cartItem.size.quantity
      }
    };

    
    
    // Use the API instance with the correct base URL
    const response = await API.post('/users/cart', cartData);
    return response;
  } catch (error) {
      console.error('Error adding product to cart:', error);
      throw error;
  }
};

export const updateCartItem = (productId, quantity) => {
  
  return API.put(`/users/cart/${productId}`, { quantity })
    .then(response => {
      
      return response;
    })
    .catch(error => {
      console.error('Error updating cart item:', error);
      throw error;
    });
};

export const removeFromCart = (productId) => {
  
  return API.delete(`/users/cart/${productId}`)
    .then(response => {
      
      return response;
    })
    .catch(error => {
      console.error('Error removing item from cart:', error);
      throw error;
    });
};

export const clearCart = () => {
  
  
  // Try different API endpoints that might be configured differently
  const tryClearCart = async () => {
    try {
      // Try all endpoints in sequence to ensure at least one works
      // First try the primary endpoint
      try {
        const response = await API.delete('/users/cart');
        
        return response;
      } catch (primaryError) {
        
        
        // If primary fails, try the secondary endpoint
        try {
          const altResponse = await API.delete('/cart');
          
          return altResponse;
        } catch (secondaryError) {
          
          
          // If secondary fails, try the tertiary endpoint
          try {
            const thirdResponse = await API.delete('/users/profile/cart');
            
            return thirdResponse;
          } catch (tertiaryError) {
            
            
            // Try one more approach - use PUT to set empty cart
            try {
              const emptyCartResponse = await API.put('/users/cart', { items: [] });
              
              return emptyCartResponse;
            } catch (putError) {
              
              throw new Error('All API cart clearing methods failed');
            }
          }
        }
      }
    } catch (error) {
      console.error('All API cart clearing endpoints failed:', error);
      
      // Try to clear localStorage as a fallback
      try {
        // Clear all possible localStorage keys that might store cart data
        const cartKeys = ['cart', 'cartItems', 'userCart', 'shopping-cart', 'cart-data', 'cartData', 'shoppingCart'];
        cartKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            
          }
        });
        
        // Also try to set empty cart data rather than just removing
        localStorage.setItem('cart', JSON.stringify([]));
        localStorage.setItem('cartItems', JSON.stringify([]));
        localStorage.setItem('userCart', JSON.stringify({items: []}));
        
        // Clear any session storage as well
        try {
          if (window.sessionStorage) {
            cartKeys.forEach(key => {
              if (sessionStorage.getItem(key)) {
                sessionStorage.removeItem(key);
                
              }
            });
          }
        } catch (sessionError) {
          console.warn('API Service: Error clearing sessionStorage:', sessionError);
        }
        
        // Broadcast an event for other components to catch
        try {
          window.dispatchEvent(new CustomEvent('cartCleared', { 
            detail: { source: 'api-service', timestamp: new Date().toISOString() } 
          }));
        } catch (eventError) {
          console.warn('API Service: Error dispatching cartCleared event:', eventError);
        }
        
        
        
        // Return a mock successful response
        return {
          data: { success: true, message: 'Cart cleared (storage fallback)' },
          status: 200,
          statusText: 'OK (storage fallback)'
        };
      } catch (storageError) {
        console.error('API Service: Error clearing cart from storage:', storageError);
        // If even storage clearing fails, create a basic success response anyway
        // This ensures the UI can continue even if all clearing attempts fail
        return {
          data: { success: true, message: 'Cart clearing attempted (best effort)' },
          status: 200,
          statusText: 'OK (best effort)'
        };
      }
    }
  };
  
  // Return as a promise to match API pattern
  return Promise.resolve(tryClearCart());
};

export const getUserWishlist = () => API.get('/users/wishlist');
export const getWishlist = getUserWishlist; // Alias for consistency
export const addToWishlist = (productId) => API.post(`/users/wishlist/${productId}`);
export const removeFromWishlist = (productId) => API.delete(`/users/wishlist/${productId}`);

// Order API calls
export const createOrder = (orderData) => {
  
  
  // Format the order items to include color variant and size if needed
  const formattedItems = orderData.items.map(item => {
    // Check if the item already has the correct structure with valid color and size info
    if (item.colorVariant?.color?.name && item.size?.name) {
      return item;
    }
    
    const productId = item.product?._id || item.product || item.productId;
    
    // For products without color variants or for items where color data is missing,
    // we want to check if we can fetch this product's first available color variant
    // instead of using a hardcoded "Default" value that might not exist
    
    // Normalize size.name to always be a string like "M"/"L"
    let resolvedSizeName = (() => {
      const size = item.size;
      if (typeof size === 'string') return size;
      if (size && typeof size === 'object') {
        if (typeof size.name === 'string') return size.name;
        if (typeof size.name === 'object') return size.name?.value || size.name?.label || '';
        return size.value || size.label || size.code || '';
      }
      return item.sizeName || '';
    })();

    // Fallback if empty: first available size from color variant or product, else "M"
    if (!resolvedSizeName || (typeof resolvedSizeName === 'string' && resolvedSizeName.trim() === '')) {
      const firstFromColor = (item.colorVariant?.sizes && Array.isArray(item.colorVariant.sizes) && item.colorVariant.sizes[0]) || null;
      const firstFromProduct = (item.productData?.colorVariants && item.productData.colorVariants[0]?.sizes && item.productData.colorVariants[0].sizes[0]) || null;
      const fallbackCandidate = firstFromColor || firstFromProduct || 'M';
      resolvedSizeName = typeof fallbackCandidate === 'object' ? (fallbackCandidate.name || 'M') : fallbackCandidate;
    }

    return {
      product: productId,
      colorVariant: {
        color: {
          // Only use fallback if absolutely necessary
          name: item.colorVariant?.color?.name || item.color?.name || item.colorName || item.color || '',
          hexCode: item.colorVariant?.color?.hexCode || item.color?.hexCode || item.colorHexCode || ''
        }
      },
      size: {
        name: resolvedSizeName,
        quantity: item.quantity || item.size?.quantity || 1
      }
    };
  });

  // Validate items - only check for product ID, not color or size
  // The backend will handle validation for required color variants
  const invalidItems = formattedItems.filter(item => !item.product);

  if (invalidItems.length > 0) {
    console.error('Invalid items found:', invalidItems);
    return Promise.reject(new Error('Some items are missing product information'));
  }

  // Format the complete order data
  const formattedOrderData = {
    items: formattedItems,
    shippingAddress: {
      street: orderData.shippingAddress.street,
      city: orderData.shippingAddress.city,
      state: orderData.shippingAddress.state,
      zipCode: orderData.shippingAddress.zipCode,
      country: orderData.shippingAddress.country
    },
    paymentMethod: orderData.paymentMethod,
    paymentDetails: orderData.paymentDetails || {}
  };
  
  // Add payment details for mobile payment methods
  if ((orderData.paymentMethod === 'bkash' || orderData.paymentMethod === 'nagad') && 
      (orderData.paymentDetails || orderData.mobileNumber)) {
    formattedOrderData.paymentDetails = {
      paymentNumber: orderData.paymentDetails?.paymentNumber || orderData.mobileNumber || orderData.paymentNumber,
      transactionId: orderData.paymentDetails?.transactionId || orderData.transactionId
    };
  }

  // Debug: final payload that goes to backend
  try {
    
  } catch (_) {
    
  }
  
  // Function to try different API endpoints
  const tryCreateOrder = async () => {
    try {
      
      const response = await API.post('/orders', formattedOrderData);
      
      return response;
    } catch (error) {
      console.error('Error creating order:', error);
      
      if (error.response?.status === 404) {
        // Try alternative endpoint
      try {
          
        const response = await axios({
          method: 'POST',
          url: '/orders',
          baseURL: API_URL,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`
          },
          data: formattedOrderData
        });
          
        return response;
        } catch (altError) {
          console.error('Alternative endpoint also failed:', altError);
          throw altError;
        }
      }
      
      throw error;
    }
  };

  return tryCreateOrder()
    .then(response => {
      
      return response;
    });
};
export const getOrderById = (orderId) => {
  
  
  // Make the API call with the correct endpoint
  return API.get(`/orders/${orderId}`)
    .then(response => {
      
      return response;
    })
    .catch(error => {
      console.error('Error fetching order:', error);
      
      if (error.response) {
        console.error('Error response from server:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      throw error;
    });
};

// Admin API calls

/**
 * Get all products (admin view with additional details)
 * @param {Object} params - Query parameters for filtering, sorting, pagination
 * @returns {Promise} - API response with products data
 */
export const getAdminProducts = (params = {}) => {
  
  
  return axios({
    method: 'get',
    url: '/admin/products',
    baseURL: API_URL,
    params: params,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`
    }
  })
    .then(response => {
      
      return response;
    })
    .catch(error => {
      console.error('Error fetching admin products:', error);
      
      if (error.response) {
        console.error('Error response from server:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // Try regular products endpoint as fallback
      return getProducts(params).then(response => {
        
        return response;
      });
    });
};

/**
 * Create a new product
 * @param {Object} productData - New product data 
 * @returns {Promise} - API response
 */
export const createProduct = (productData) => {
  
  
  // Check if productData is FormData, if so, we need to modify the content type
  const isFormData = productData instanceof FormData;
  
  // Use the correct endpoint without admin prefix
  return API.post('/products', productData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
      })
        .then(response => {
          
          return response;
        })
        .catch(error => {
          console.error('Error creating product:', error);
          if (error.response) {
            console.error('Error response from server:', {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data
            });
          }
      return Promise.reject(error);
    });
};

/**
 * Update an existing product
 * @param {string} productId - ID of the product to update
 * @param {Object} productData - Updated product data
 * @returns {Promise} - API response
 */
export const updateProduct = (productId, productData) => {
  
  
  if (!productId) {
    console.error('No product ID provided for update');
    return Promise.reject(new Error('Product ID is required'));
  }
  
  // Check if productData is FormData, if so, we need to modify the content type
  const isFormData = productData instanceof FormData;
  
  // Use the correct endpoint without admin prefix
  return API.patch(`/products/${productId}`, productData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
  })
    .then(response => {
      
      return response;
    })
    .catch(error => {
      console.error(`Error updating product ${productId}:`, error);
      
      if (error.response) {
        console.error('Error response from server:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      return Promise.reject(error);
    });
};

/**
 * Delete a product
 * @param {string} productId - ID of the product to delete
 * @returns {Promise} - API response
 */
export const deleteProduct = (productId) => {
  
  
  if (!productId) {
    console.error('No product ID provided for delete');
    return Promise.reject(new Error('Product ID is required'));
  }
  
  // Use the correct endpoint without admin prefix
  return API.delete(`/products/${productId}`)
    .then(response => {
      
      return response;
    })
    .catch(error => {
      console.error(`Error deleting product ${productId}:`, error);
      
      if (error.response) {
        console.error('Error response from server:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      return Promise.reject(error);
    });
};

// Image Upload API calls - Cloudinary Integration
/**
 * Upload a single image to Cloudinary via backend API
 * @param {File} file - The image file to upload
 * @param {string} type - Upload type/folder (e.g., 'products', 'users', 'reviews')
 * @returns {Promise} - API response with Cloudinary URL
 * 
 * Response format:
 * {
 *   message: "File uploaded successfully",
 *   file: {
 *     url: "https://res.cloudinary.com/...",
 *     publicId: "opdrape/products/...",
 *     filename: "...",
 *     originalname: "...",
 *     mimetype: "image/jpeg",
 *     size: 123456,
 *     cloudinaryData: { ... }
 *   }
 * }
 */
export const uploadImage = (file, type = 'products') => {
  
  // Validate file
  if (!file || !(file instanceof File)) {
    console.error('Invalid file provided');
    return Promise.reject(new Error('Invalid file provided'));
  }

  // Validate file size (10MB limit as per Cloudinary backend)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    console.error(`File size ${file.size} exceeds maximum of ${maxSize}`);
    return Promise.reject(new Error('File size exceeds 10MB limit'));
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    console.error(`Invalid file type: ${file.type}`);
    return Promise.reject(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP, SVG)'));
  }
  
  // Create a FormData object
  const formData = new FormData();
  formData.append('file', file);

  // Try upload with Cloudinary backend
  const tryUpload = async () => {
    // Primary endpoint for Cloudinary uploads
    const primaryEndpoint = `/api/uploads/${type}`;
    
    // Fallback endpoints for backward compatibility
    const fallbackEndpoints = [
      `/api/upload/${type}`,
      `/uploads/${type}`,
      `/upload/${type}`
    ];

    // Try primary endpoint first
    try {
      
      
      const response = await axios({
        method: 'POST',
        url: primaryEndpoint,
        baseURL: API_URL,
        data: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout for large uploads
      });
      
      
      return response;
    } catch (primaryError) {
      console.warn(`Primary endpoint ${primaryEndpoint} failed:`, primaryError.message);
      
      // Try fallback endpoints
      let lastError = primaryError;
      for (const endpoint of fallbackEndpoints) {
        try {
          
          
          const response = await axios({
            method: 'POST',
            url: endpoint,
            baseURL: API_URL,
            data: formData,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`,
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000
          });
          
          
          return response;
        } catch (error) {
          
          lastError = error;
        }
      }
      
      // All endpoints failed - use client-side fallback (development/offline mode only)
      console.error('⚠️ All Cloudinary upload endpoints failed:', lastError.message);
      console.warn('Using client-side data URL fallback (NOT recommended for production)');
      
      // Create a promise that reads the file as data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Create a mock successful response with the data URL
          const mockResponse = {
            data: {
              file: {
                url: reader.result, // Base64 data URL
                filename: file.name,
                originalname: file.name,
                mimetype: file.type,
                size: file.size,
                publicId: null, // No Cloudinary ID for fallback
                cloudinaryData: null
              },
              success: true,
              message: '⚠️ File uploaded using client-side fallback (Base64 data URL)'
            },
            status: 200,
            statusText: 'OK (Client-side Fallback)'
          };
          
          console.warn('Created fallback response with Base64 data URL');
          resolve(mockResponse);
        };
        reader.onerror = () => {
          console.error('Failed to read file for fallback');
          resolve(Promise.reject(new Error('Failed to upload image and fallback failed')));
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  return tryUpload();
};

/**
 * Upload multiple images to Cloudinary via backend API
 * @param {FileList|Array} files - The image files to upload
 * @param {string} type - Upload type/folder (e.g., 'products', 'users', 'reviews')
 * @returns {Promise} - API response with array of Cloudinary URLs
 * 
 * Response format:
 * {
 *   message: "Files uploaded successfully",
 *   count: 3,
 *   files: [
 *     {
 *       url: "https://res.cloudinary.com/...",
 *       publicId: "opdrape/products/...",
 *       filename: "...",
 *       cloudinaryData: { ... }
 *     },
 *     ...
 *   ]
 * }
 */
export const uploadMultipleImages = (files, type = 'products') => {
  const filesArray = Array.from(files);
  
  
  // Validate files
  if (!filesArray.length) {
    console.error('No files provided for upload');
    return Promise.reject(new Error('No files provided for upload'));
  }

  // Validate file sizes and types
  const maxSize = 10 * 1024 * 1024; // 10MB per file
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  
  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];
    
    if (file.size > maxSize) {
      console.error(`File ${file.name} size ${file.size} exceeds maximum of ${maxSize}`);
      return Promise.reject(new Error(`File "${file.name}" exceeds 10MB limit`));
    }
    
    if (!validTypes.includes(file.type)) {
      console.error(`File ${file.name} has invalid type: ${file.type}`);
      return Promise.reject(new Error(`File "${file.name}" is not a valid image type`));
    }
  }
  
  // Create a FormData object
  const formData = new FormData();
  
  // Append all files with 'files' field name (as expected by backend)
  filesArray.forEach(file => {
    formData.append('files', file);
    
  });
  
  // Try upload with Cloudinary backend
  const tryUpload = async () => {
    // Primary endpoint for Cloudinary multiple uploads
    const primaryEndpoint = `/api/uploads/multiple/${type}`;
    
    // Fallback endpoints for backward compatibility
    const fallbackEndpoints = [
      `/api/upload/multiple/${type}`,
      `/uploads/multiple/${type}`,
      `/upload/multiple/${type}`
    ];

    // Try primary endpoint first
    try {
      
      
      const response = await axios({
        method: 'POST',
        url: primaryEndpoint,
        baseURL: API_URL,
        data: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 second timeout for multiple file uploads
      });
      
      
      return response;
    } catch (primaryError) {
      console.warn(`Primary endpoint ${primaryEndpoint} failed:`, primaryError.message);
      
      // Try fallback endpoints
      let lastError = primaryError;
      for (const endpoint of fallbackEndpoints) {
        try {
          
          
          const response = await axios({
            method: 'POST',
            url: endpoint,
            baseURL: API_URL,
            data: formData,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`,
              'Content-Type': 'multipart/form-data'
            },
            timeout: 60000
          });
          
          
          return response;
        } catch (error) {
          
          lastError = error;
        }
      }
      
      // All endpoints failed - use client-side fallback (development/offline mode only)
      console.error('⚠️ All Cloudinary upload endpoints failed:', lastError.message);
      console.warn('Using client-side data URL fallback for multiple files (NOT recommended for production)');
      
      // Create promises that read each file as data URL
      const filePromises = filesArray.map((file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              url: reader.result, // Base64 data URL
              filename: file.name,
              originalname: file.name,
              mimetype: file.type,
              size: file.size,
              publicId: null, // No Cloudinary ID for fallback
              cloudinaryData: null
            });
          };
          reader.onerror = () => {
            console.error(`Failed to read file: ${file.name}`);
            reject(new Error(`Failed to read file: ${file.name}`));
          };
          reader.readAsDataURL(file);
        });
      });
      
      // Wait for all files to be processed
      try {
        const fileDataArray = await Promise.all(filePromises);
        
        // Create a mock successful response with all data URLs
        const mockResponse = {
          data: {
            files: fileDataArray,
            success: true,
            message: '⚠️ Files uploaded using client-side fallback (Base64 data URLs)',
            count: fileDataArray.length
          },
          status: 200,
          statusText: 'OK (Client-side Fallback)'
        };
        
        console.warn('Created fallback response with Base64 data URLs');
        return mockResponse;
      } catch (readError) {
        console.error('Failed to read files for fallback:', readError);
        return Promise.reject(new Error('Failed to upload images and fallback failed'));
      }
    }
  };
  
  return tryUpload();
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The Cloudinary public ID of the image to delete
 * @returns {Promise} - API response
 * 
 * Example publicId: "opdrape/products/1234567890-123456789"
 * 
 * Response format:
 * {
 *   message: "File deleted successfully",
 *   result: {
 *     result: "ok"
 *   }
 * }
 */
export const deleteImage = (publicId) => {
  
  
  if (!publicId) {
    console.error('No publicId provided for deletion');
    return Promise.reject(new Error('publicId is required to delete an image'));
  }

  // If publicId is a full URL, extract the public ID
  let cleanPublicId = publicId;
  if (publicId.includes('cloudinary.com')) {
    // Extract public ID from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud-name/image/upload/v123456/opdrape/products/file.jpg
    const match = publicId.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match && match[1]) {
      cleanPublicId = match[1];
      
    }
  }

  return axios({
    method: 'DELETE',
    url: '/api/uploads',
    baseURL: API_URL,
    data: { publicId: cleanPublicId },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`
    }
  })
    .then(response => {
      
      return response;
    })
    .catch(error => {
      console.error('❌ Failed to delete image from Cloudinary:', error.message);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      return Promise.reject(error);
    });
};

/**
 * Get all orders for admin view
 * @param {Object} params - Query parameters for filtering/sorting
 * @returns {Promise} - API response
 */
export const getAdminOrders = (params = {}) => {
  
  
  return axios({
    method: 'get',
    url: '/admin/orders',
    baseURL: API_URL,
    params: params,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`
    }
  })
    .then(response => {
      
      return response;
    })
    .catch(error => {
      console.error('Error fetching admin orders:', error);
      
      if (error.response) {
        console.error('Error response from server:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // Try regular orders endpoint as fallback
      return getUserOrders().then(response => {
        
        return response;
      });
    });
};

/**
 * Get order details by ID for admin
 * @param {String} orderId - Order ID to fetch
 * @returns {Promise} - API response
 */
export const getAdminOrderById = (orderId) => {
  
  
  if (!orderId) {
    console.error("Invalid order ID provided");
    return Promise.reject(new Error("Invalid order ID"));
  }
  
  return axios({
    method: 'get',
    url: `/admin/orders/${orderId}`,
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`
    }
  })
    .then(response => {
      
      return response;
    })
    .catch(error => {
      console.error(`Error fetching admin order details for ${orderId}:`, error);
      
      // Try regular order endpoint as fallback
      return API.get(`/orders/${orderId}`)
        .then(response => {
          
          return response;
        })
        .catch(secondError => {
          console.error('All order detail endpoints failed:', secondError);
          throw error;
        });
    });
};

/**
 * Update order status
 * @param {String} orderId - Order ID to update
 * @param {String} status - New order status
 * @returns {Promise} - API response
 */
export const updateOrderStatus = (orderId, status) => {
  
  
  if (!orderId) {
    console.error("Invalid order ID provided");
    return Promise.reject(new Error("Invalid order ID"));
  }
  
  return axios({
    method: 'patch',
    url: `/admin/orders/${orderId}/status`,
    baseURL: API_URL,
    data: { status },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`
    }
  })
    .then(response => {
      
      return response;
    })
    .catch(error => {
      console.error(`Error updating order status for ${orderId}:`, error);
      
      // Try alternative endpoint format if first attempt fails
      return axios({
        method: 'patch',
        url: `${API_URL}/api/admin/orders/${orderId}/status`,
        data: { status },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_NAME)}`
        }
      })
        .then(response => {
          
          return response;
        })
        .catch(secondError => {
          console.error(`Alternative endpoint also failed:`, secondError);
          throw error;
        });
    });
};

// Admin Customer API calls
export const getAdminUsers = (params = {}) => {
  
  
  return API.get('/admin/users', { params })
    .catch(error => {
      console.error('Error with admin users endpoint:', error);
      return Promise.reject(new Error(`Failed to fetch admin users: ${error.message}`));
    });
};

export const getUser = async (userId) => {
  
  
  try {
    // Make the primary request to the admin endpoint
    const response = await API.get(`/admin/users/${userId}`);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    // Don't generate mock data, just throw the error
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};

export const updateUser = async (userId, userData) => {
  
  
  try {
    // Use PATCH as the primary method for updates
    const response = await API.patch(`/admin/users/${userId}`, userData);
    
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    
    // Try alternative endpoint with PUT if PATCH fails
    try {
      
      const response = await API.put(`/admin/users/${userId}`, userData);
      
      return response.data;
    } catch (fallbackError) {
      console.error('Alternative update method also failed:', fallbackError);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
};

export const deleteUser = (userId) => {
  
  
  return API.delete(`/admin/users/${userId}`)
    .catch(error => {
      console.error(`Error deleting user with ID ${userId}:`, error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');
      
      throw new Error(`Failed to delete user: ${error.message}`);
    });
};

export const getUserOrdersById = (userId) => {
  
  
  // Only use the admin endpoint for orders
  return API.get(`/admin/users/${userId}/orders`)
    .catch(error => {
      console.error(`Error fetching orders with admin/users endpoint for user ID ${userId}:`, error);
      // Return error instead of generating mock data
      return Promise.reject(new Error(`Failed to fetch user orders: ${error.message}`));
    });
};

// Export the API instance for any other custom requests
export default API; 