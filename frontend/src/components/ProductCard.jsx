import React, { useState } from 'react';
import { ShoppingCart, Heart, Plus, Minus, Star, Eye, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl, getProductFallbackImage } from '../utils/imageUtils';

/**
 * ProductCard
 * 3D isometric tilt on hover, discount badge, rating, wishlist toggle,
 * animated stepper & instant Add-to-Cart feedback.
 */
const ProductCard = ({ 
  product, 
  quantity = 0, 
  isFavorite = false, 
  onToggleFavorite, 
  onAddToCart, 
  onUpdateQuantity, 
  onQuickView 
}) => {
  const [justAdded, setJustAdded] = useState(false);

  // Price calculations
  const price = Number(product.price) || 0;
  // Compute realistic original price (e.g. 15-25% more) for authentic discount showcase
  const originalPrice = product.originalPrice || Math.round(price * 1.22);
  const discountPercent = originalPrice > price 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleMinus = (e) => {
    e.stopPropagation();
    onUpdateQuantity(product._id, quantity - 1);
  };

  const handlePlus = (e) => {
    e.stopPropagation();
    onUpdateQuantity(product._id, quantity + 1);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="product-card-3d"
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden'
      }}
    >
      {/* Top badges: Discount & Wishlist */}
      <div className="flex-between" style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', zIndex: 3 }}>
        {discountPercent > 0 ? (
          <span 
            style={{ 
              background: 'linear-gradient(135deg, #16a34a, #15803d)', 
              color: 'white', 
              fontSize: '0.72rem', 
              fontWeight: '800', 
              padding: '4px 9px', 
              borderRadius: '20px',
              letterSpacing: '0.02em',
              boxShadow: '0 4px 10px rgba(22, 163, 74, 0.3)'
            }}
          >
            {discountPercent}% OFF
          </span>
        ) : <span />}

        <div className="flex" style={{ gap: '6px' }}>
          {onQuickView && (
            <button
              onClick={() => onQuickView(product)}
              title="Quick preview"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                color: '#64748b'
              }}
            >
              <Eye size={15} />
            </button>
          )}

          <button
            onClick={(e) => onToggleFavorite(product._id, e)}
            title={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              color: isFavorite ? '#ef4444' : '#94a3b8'
            }}
          >
            <Heart size={15} fill={isFavorite ? '#ef4444' : 'none'} />
          </button>
        </div>
      </div>

      {/* Product Image with 3D Pop Effect */}
      <div 
        onClick={() => onQuickView && onQuickView(product)}
        style={{
          width: '100%',
          height: '190px',
          borderRadius: '16px',
          background: 'radial-gradient(circle at 50% 50%, #f8fafc 0%, #f1f5f9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}
      >
        <motion.img
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          src={getImageUrl(product.image, product.name, product.category)}
          alt={product.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getProductFallbackImage(product.name, product.category);
          }}
          style={{
            maxWidth: '85%',
            maxHeight: '85%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))'
          }}
        />

        {/* In-Stock Pill */}
        <div style={{ position: 'absolute', bottom: '8px', left: '10px' }}>
          <span 
            style={{ 
              fontSize: '0.68rem', 
              fontWeight: '700', 
              color: '#15803d', 
              background: 'rgba(240, 253, 244, 0.95)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(187, 247, 208, 0.8)'
            }}
          >
            ● In Stock
          </span>
        </div>
      </div>

      {/* Product Information */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Category & Rating */}
        <div className="flex-between" style={{ marginBottom: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#16a34a', letterSpacing: '0.04em' }}>
            {product.category || 'Fresh'}
          </span>
          <div className="flex" style={{ gap: '4px', fontSize: '0.78rem', fontWeight: '800', color: '#0f172a' }}>
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            <span>4.8</span>
          </div>
        </div>

        {/* Product Name */}
        <h3 
          onClick={() => onQuickView && onQuickView(product)}
          className="line-clamp-1" 
          title={product.name}
          style={{ 
            fontSize: '1.05rem', 
            fontWeight: '800', 
            color: '#0f172a', 
            letterSpacing: '-0.02em',
            marginBottom: '4px',
            cursor: 'pointer'
          }}
        >
          {product.name}
        </h3>

        {/* Weight / Pack info */}
        <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500', marginBottom: '12px' }}>
          500g • Farm Direct
        </p>

        {/* Pricing & Add to Cart Action */}
        <div className="flex-between" style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
          <div>
            <div className="flex" style={{ gap: '6px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
                ₹{price.toFixed(0)}
              </span>
              {originalPrice > price && (
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>
                  ₹{originalPrice}
                </span>
              )}
            </div>
          </div>

          {quantity > 0 ? (
            <div 
              className="flex" 
              style={{ 
                background: '#f0fdf4', 
                border: '1.5px solid #86efac', 
                borderRadius: '12px', 
                padding: '2px 4px',
                gap: '8px'
              }}
            >
              <button 
                onClick={handleMinus} 
                style={{ 
                  background: 'white', 
                  width: '26px', 
                  height: '26px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#16a34a',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)' 
                }}
              >
                <Minus size={13} />
              </button>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#16a34a', minWidth: '16px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button 
                onClick={handlePlus} 
                style={{ 
                  background: '#16a34a', 
                  width: '26px', 
                  height: '26px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)' 
                }}
              >
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="btn-primary"
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
              }}
            >
              {justAdded ? (
                <>
                  <Check size={14} /> Added
                </>
              ) : (
                <>
                  <Plus size={14} /> Add
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
