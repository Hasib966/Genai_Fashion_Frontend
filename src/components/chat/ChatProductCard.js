import React, { useState } from 'react';
import { FaStar, FaShoppingCart, FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import './ChatProductCard.css';

/**
 * ChatProductCard - Compact product card for chat display
 * Optimized to fit within chat window
 */
const ChatProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart, addToWishlist, isAuthenticated } = useAppContext();

  // Get image URL with fallback logic
  const getImageUrl = () => {
    // Try primaryImage.url first
    if (product.primaryImage?.url) {
      return product.primaryImage.url;
    }
    // Try first image in images array
    if (product.images && product.images.length > 0 && product.images[0]?.url) {
      return product.images[0].url;
    }
    // Try if primaryImage is just a string
    if (typeof product.primaryImage === 'string') {
      return product.primaryImage;
    }
    // No valid image found
    return null;
  };

  const imageUrl = getImageUrl();

  // Debug image loading

  const handleViewProduct = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.salePrice || product.price,
      image: product.primaryImage?.url,
      quantity: 1,
      selectedColor: product.colors?.[0] || null,
      selectedSize: product.sizes?.[0] || null,
    });
  };

  const handleAddToWishlist = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const result = await addToWishlist({
      productId: product.id,
      id: product.id,
      name: product.name,
      price: product.salePrice || product.price,
      image: product.primaryImage?.url,
    });
    
    if (result?.success) {
      
    } else {
      console.error('❌ Failed to add to wishlist:', result?.message);
    }
  };

  const [imageError, setImageError] = useState(false);
  
  const displayPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  const handleImageError = (e) => {
    console.error('❌ Image failed to load:', imageUrl);
    console.error('Product:', product.name);
    setImageError(true);
  };

  return (
    <div className="chat-product-card" onClick={handleViewProduct}>
      {/* Product Image */}
      <div className="chat-product-image">
        {imageUrl && !imageError ? (
          <img 
            src={imageUrl} 
            alt={product.primaryImage?.alt || product.name}
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="image-placeholder">
            <span>IMG</span>
          </div>
        )}
        {/* Badges */}
        <div className="chat-product-badges">

          {product.isSale && (
            <span className="badge badge-sale">Sale</span>
          )}
          {product.isBestSeller && (
            <span className="badge badge-bestseller">Best</span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="chat-product-info">
        <h4 className="chat-product-name">{product.name}</h4>
        
        {/* Rating */}
        {product.totalReviews > 0 && (
          <div className="chat-product-rating">
            <FaStar className="star-icon" />
            <span className="rating-value">{product.averageRating.toFixed(1)}</span>
            <span className="rating-count">({product.totalReviews})</span>
          </div>
        )}

        {/* Price */}
        <div className="chat-product-price">
          <span className="current-price">৳{displayPrice}</span>
          {hasDiscount && (
            <span className="original-price">৳{product.price}</span>
          )}
        </div>

        {/* Actions */}
        <div className="chat-product-actions">


        </div>
      </div>
    </div>
  );
};

export default ChatProductCard;

