import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faShoppingCart, faStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import { addToCart, getProductReviews } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../common/ToastContext';
import './ProductCard.css';

const getProductImageFromData = (product) => {
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

const ProductCard = ({ product, inWishlist = false }) => {
  const { 
    isAuthenticated, 
    updateCart, 
    toggleWishlist: contextToggleWishlist, 
    isInWishlist: contextIsInWishlist 
  } = useAppContext();
  const { showSuccessToast, showErrorToast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [wishlistLoading, setWishlistLoading] = React.useState(false);
  const [reviews, setReviews] = React.useState([]);

  // Fetch reviews
  React.useEffect(() => {
    if (!product) return; // skip if no product
    
    const fetchReviews = async () => {
      try {
        const productId = product._id || product.id;
        if (!productId) return;
        
        const response = await getProductReviews(productId);
        
        // Handle different response structures
        let reviewsData = [];
        if (Array.isArray(response.data)) {
          reviewsData = response.data;
        } else if (response.data && Array.isArray(response.data.reviews)) {
          reviewsData = response.data.reviews;
        }
        
        setReviews(reviewsData);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setReviews([]); // Set empty array on error
      }
    };
    
    fetchReviews();
  }, [product]);

  if (!product) return null;

  const {
    _id,
    id,
    slug,
    name = 'Unnamed Product',
    price,
    basePrice,
    discount = 0,
    brandName,
    isNew = false,
    outOfStock = false
  } = product;

  const productUrlId = _id || slug || id || `product-${Date.now()}`;
  const productImage = getProductImageFromData(product);
  const formattedOriginalPrice = formatPrice(price || basePrice);
  const formattedDiscountPrice = discount > 0 ? formatPrice((1 - discount/100) * (parseFloat(price) || parseFloat(basePrice) || 0)) : null;

  function formatPrice(value) {
    if (!value) return "0.00";
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00";
    return (Math.round(num * 100) / 100).toLocaleString();
  }

  const renderStars = (ratingValue) => {
    const stars = [];
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) stars.push(<FontAwesomeIcon key={`star-${i}`} icon={faStar} />);
    if (hasHalfStar) stars.push(<FontAwesomeIcon key="half-star" icon={faStarHalfAlt} />);
    return stars;
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || r.stars || 0), 0) / reviews.length).toFixed(1)
    : 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showErrorToast('Please log in to add items to cart', {
        duration: 3000
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await addToCart({ productId: _id || id, quantity: 1 });
      updateCart(response.data);
      
      // Show success toast notification
      showSuccessToast(`${name} added to cart!`, {
        duration: 2500
      });
    } catch (err) {
      console.error(err);
      
      // Show error toast notification
      showErrorToast('Failed to add product to cart', {
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  // Get product ID
  const productId = _id || id;
  
  // Get current wishlist status from context
  const isProductInWishlist = contextIsInWishlist(productId);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      showErrorToast('Please log in to manage wishlist', {
        duration: 3000
      });
      return;
    }
    
    setWishlistLoading(true);
    try {
      const result = await contextToggleWishlist(productId);
      
      if (result.success) {
        const wasAdded = !isProductInWishlist;
        showSuccessToast(
          wasAdded ? `${name} added to wishlist!` : `${name} removed from wishlist!`,
          { duration: 2500 }
        );
      } else {
        showErrorToast(result.message || 'Failed to update wishlist', {
          duration: 3000
        });
      }
    } catch (err) {
      console.error('Wishlist error:', err);
      showErrorToast('Failed to update wishlist. Please try again.', {
        duration: 3000
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  const getProductTag = () => {
    if (outOfStock) return <span className="product-tag out-of-stock">Out of Stock</span>;
    if (discount > 0) return <span className="product-tag sale">-{discount}%</span>;
    if (isNew) return <span className="product-tag new">New</span>;
    return null;
  };

  return (
    <div className="product-card">
      <div className="product-card-image">
        <Link to={`/product/${productUrlId}`}>
          <img 
            src={productImage || 'https://via.placeholder.com/300x300'} 
            alt={name} 
            loading="lazy"
          />
          <div className="overlay">
            <span className="view-product-text">View Product</span>
          </div>
        </Link>
        {getProductTag()}
        <button 
          className={`wishlist-button ${isProductInWishlist ? 'active' : ''}`}
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          title={isProductInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <FontAwesomeIcon icon={isProductInWishlist ? faHeart : farHeart} />
        </button>
      </div>

      <div className="product-card-content">
        {brandName && <span className="product-brand">{brandName}</span>}
        <h3 className="product-title">{name}</h3>
        <div className="product-rating">
          {reviews.length > 0 ? (
            <>
              {renderStars(avgRating)}
              <span className="rating-count">({avgRating}) - {reviews.length} review{reviews.length > 1 ? 's' : ''}</span>
            </>
          ) : (
            <span className="no-reviews">No reviews yet</span>
          )}
        </div>
        <div className="product-price">
          {discount > 0 ? (
            <>
              <span className="current-price">৳{formattedDiscountPrice}</span>
              <span className="original-price">৳{formattedOriginalPrice}</span>
            </>
          ) : <span className="current-price">৳{formattedOriginalPrice}</span>}
        </div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  inWishlist: PropTypes.bool
};

export default ProductCard;
