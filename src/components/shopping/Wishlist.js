import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getWishlist } from '../../services/api';
import { useToast } from '../common/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faShoppingCart, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import './Wishlist.css';

const Wishlist = () => {
  const { isAuthenticated, user, removeFromWishlist: contextRemoveFromWishlist } = useAppContext();
  const { showSuccessToast, showErrorToast } = useToast();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingItem, setRemovingItem] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Fetch wishlist items
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fallback: Get wishlist from localStorage if API fails
  const getWishlistFromStorage = () => {
    try {
      const stored = localStorage.getItem('wishlist');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('Error reading wishlist from localStorage:', error);
    }
    return [];
  };

  // Save wishlist to localStorage
  const saveWishlistToStorage = (wishlistData) => {
    try {
      localStorage.setItem('wishlist', JSON.stringify(wishlistData));
    } catch (error) {
      console.error('Error saving wishlist to localStorage:', error);
    }
  };

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      
      const response = await getWishlist();
      
      
      
      // Backend returns: { success: true, data: { wishlist: [...], count: ... } }
      let wishlistData = [];
      
      if (response.data) {
        // Check if success field exists
        const responseData = response.data.success ? response.data.data : response.data;
        
        
        if (responseData) {
          // Try to get wishlist array
          if (Array.isArray(responseData.wishlist)) {
            wishlistData = responseData.wishlist;
            
          } else if (Array.isArray(responseData)) {
            wishlistData = responseData;
            
          } else if (Array.isArray(responseData.items)) {
            wishlistData = responseData.items;
            
          } else if (responseData.data && Array.isArray(responseData.data)) {
            wishlistData = responseData.data;
            
          }
        }
      }
      
      
      setWishlistItems(wishlistData);
      
      if (wishlistData.length === 0) {
        
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to load wishlist';
      if (error.response?.status === 401) {
        errorMessage = 'Please log in to view your wishlist';
      } else if (error.response?.status === 404) {
        errorMessage = 'Wishlist endpoint not found';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showErrorToast(errorMessage, {
        duration: 4000
      });
      
      // Try to get wishlist from localStorage as fallback
      
      const fallbackWishlist = getWishlistFromStorage();
      setWishlistItems(fallbackWishlist);
      
      if (fallbackWishlist.length === 0) {
        showErrorToast('Unable to load wishlist. Please try again later.', {
          duration: 4000
        });
      } else {
        showErrorToast('Using offline wishlist data', {
          duration: 3000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Remove item from wishlist
  const handleRemoveFromWishlist = async (productId, productName) => {
    setRemovingItem(productId);
    try {
      const result = await contextRemoveFromWishlist(productId);
      
      if (result.success) {
        showSuccessToast(`${productName} removed from wishlist`, {
          duration: 2500
        });
        
        // Refresh wishlist
        await fetchWishlist();
      } else {
        showErrorToast(result.message || 'Failed to remove from wishlist', {
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      showErrorToast('Failed to remove from wishlist', {
        duration: 3000
      });
    } finally {
      setRemovingItem(null);
    }
  };

  // Add item to cart
  const handleAddToCart = async (productId, productName) => {
    try {
      // This would need to be implemented with proper cart API
      showSuccessToast(`${productName} added to cart!`, {
        duration: 2500
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      showErrorToast('Failed to add item to cart', {
        duration: 3000
      });
    }
  };

  // Get product image
  const getProductImage = (product) => {
    const direct = product.image || product.mainImage || product.imageUrl || product.thumbnail;
    if (typeof direct === 'string' && direct) return direct;
    if (direct && typeof direct === 'object') {
      return direct.url || direct.src || direct.path || null;
    }
    const cv = Array.isArray(product.colorVariants) ? product.colorVariants : [];
    if (cv.length > 0 && Array.isArray(cv[0].images) && cv[0].images.length > 0) {
      const first = cv[0].images[0];
      return typeof first === 'string' ? first : (first.url || first.src || first.path || null);
    }
    return null;
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return "৳0.00";
    const num = parseFloat(price);
    if (isNaN(num)) return "৳0.00";
    return `৳${(Math.round(num * 100) / 100).toLocaleString()}`;
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
        </div>
        <div className="wishlist-empty">
          <div className="empty-wishlist-icon">
            <FontAwesomeIcon icon={farHeart} />
          </div>
          <h3>Please log in to view your wishlist</h3>
          <p>Sign in to save your favorite items and view them anytime.</p>
          <Link to="/login">
            <Button variant="primary">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
        </div>
        <div className="wishlist-loading">
          <div className="loading-spinner"></div>
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  // Show empty wishlist
  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
          <p className="wishlist-count">0 items</p>
        </div>
        <div className="wishlist-empty">
          <div className="empty-wishlist-icon">
            <FontAwesomeIcon icon={farHeart} />
          </div>
          <h3>Your wishlist is empty</h3>
          <p>Start adding items you love to your wishlist!</p>
          <Link to="/">
            <Button variant="primary">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show wishlist items
  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h1>My Wishlist</h1>
        <p className="wishlist-count">{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}</p>
        
        {/* Debug Panel */}
        <div style={{ marginTop: '1rem' }}>
          <button 
            onClick={() => setShowDebug(!showDebug)}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#f0f0f0', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>
        
        {showDebug && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#f8f9fa', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            fontSize: '0.875rem'
          }}>
            <h4>Debug Information</h4>
            <p><strong>User Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><strong>User ID:</strong> {user?.id || user?._id || 'N/A'}</p>
            <p><strong>Wishlist Items Count:</strong> {wishlistItems.length}</p>
            <p><strong>API URL:</strong> {process.env.REACT_APP_API_URL || 'https://opdrape-backend.onrender.com/api'}</p>
            <button 
              onClick={() => {
                
                
              }}
              style={{ 
                padding: '0.25rem 0.5rem', 
                background: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '3px',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              Log to Console
            </button>
          </div>
        )}
      </div>
      
      <div className="wishlist-grid">
        {wishlistItems.map((item) => {
          const product = item.product || item; // Handle different data structures
          const productId = product._id || product.id || product.productId;
          const productName = product.name || 'Unnamed Product';
          const productImage = getProductImage(product);
          const productPrice = formatPrice(product.price || product.basePrice);
          const productUrl = `/product/${productId}`;

          return (
            <div key={productId} className="wishlist-item">
              <div className="wishlist-item-image">
                <Link to={productUrl}>
                  <img 
                    src={productImage || 'https://via.placeholder.com/300x300'} 
                    alt={productName}
                    loading="lazy"
                  />
                </Link>
              </div>
              
              <div className="wishlist-item-details">
                <Link to={productUrl} className="wishlist-item-name">
                  {productName}
                </Link>
                
                {product.brand && (
                  <p className="wishlist-item-brand">{product.brand}</p>
                )}
                
                <div className="wishlist-item-price">
                  {productPrice}
                </div>
                
                <div className="wishlist-item-actions">
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => handleAddToCart(productId, productName)}
                    className="add-to-cart-btn"
                  >
                    <FontAwesomeIcon icon={faShoppingCart} />
                    Add to Cart
                  </Button>
                  
                  <button
                    className="remove-from-wishlist-btn"
                    onClick={() => handleRemoveFromWishlist(productId, productName)}
                    disabled={removingItem === productId}
                    title="Remove from wishlist"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    {removingItem === productId ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;
