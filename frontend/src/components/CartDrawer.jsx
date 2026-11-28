import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, Truck, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE, getProductFallbackImage } from '../utils/imageUtils';
import { getDeliverySettings, syncDeliverySettings } from '../utils/settingsUtils';

const CartDrawer = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice, isCartOpen, closeCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deliverySettings, setDeliverySettings] = useState(getDeliverySettings());

  useEffect(() => {
    syncDeliverySettings().then(s => {
      if (s) setDeliverySettings(s);
    });

    const handleSettingsUpdate = (e) => {
      if (e.detail) setDeliverySettings(e.detail);
      else setDeliverySettings(getDeliverySettings());
    };
    window.addEventListener('freshcart_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('freshcart_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  // Don't show cart drawer for admin
  if (user?.role === 'admin') return null;

  const FREE_DELIVERY_THRESHOLD = deliverySettings.freeDeliveryThreshold;
  const isFreeDelivery = deliverySettings.isFreeDeliveryEnabled && totalPrice >= FREE_DELIVERY_THRESHOLD;
  const amountNeeded = Math.max(0, FREE_DELIVERY_THRESHOLD - totalPrice);
  const progress = FREE_DELIVERY_THRESHOLD > 0
    ? Math.min(100, Math.round((totalPrice / FREE_DELIVERY_THRESHOLD) * 100))
    : 100;

  const handleCheckout = () => {
    closeCart();
    navigate('/cart');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(6px)',
              zIndex: 3000,
              cursor: 'pointer'
            }}
          />

          {/* Slide Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '440px',
              background: 'white',
              boxShadow: '-20px 0 50px rgba(0, 0, 0, 0.15)',
              zIndex: 3001,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div className="flex-between" style={{ padding: '1.5rem 1.8rem', borderBottom: '1px solid #f1f5f9' }}>
              <div className="flex" style={{ gap: '10px' }}>
                <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '8px', borderRadius: '12px' }}>
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
                    My Basket
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>
                    {cart.length} {cart.length === 1 ? 'item' : 'items'} selected
                  </p>
                </div>
              </div>

              <button 
                onClick={closeCart} 
                style={{ background: '#f8fafc', color: '#0f172a', padding: '8px', borderRadius: '10px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Free Delivery Meter */}
            {cart.length > 0 && (
              <div style={{ padding: '1rem 1.8rem', background: '#f8fbf9', borderBottom: '1px solid #f1f5f9' }}>
                <div className="flex-between" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={15} color="#16a34a" />
                    {isFreeDelivery ? 'FREE Delivery Unlocked!' : `Add ₹${amountNeeded.toFixed(0)} more for FREE Delivery`}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#16a34a' }}>
                    {progress}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: '#16a34a', borderRadius: '10px', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.8rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '6rem' }}>
                  <div style={{ background: '#f8fafc', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#94a3b8' }}>
                    <Package size={40} />
                  </div>
                  <h4 style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a', marginBottom: '6px' }}>
                    Your basket is empty
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                    Add fresh produce, snacks, and daily essentials to begin!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cart.map((item) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={item._id}
                      style={{
                        padding: '1rem',
                        borderRadius: '16px',
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div className="flex-between">
                        <div className="flex" style={{ gap: '10px', flex: 1 }}>
                          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '3px' }}>
                            <img 
                              src={getImageUrl(item.image, item.name, item.category)} 
                              alt={item.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getProductFallbackImage(item.name, item.category);
                              }}
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          </div>
                          <div>
                            <h4 style={{ fontWeight: '800', fontSize: '0.92rem', color: '#0f172a' }}>
                              {item.name}
                            </h4>
                            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              ₹{item.price} / unit
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={() => removeFromCart(item._id)}
                          style={{ color: '#ef4444', background: 'none' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex-between">
                        {/* Stepper */}
                        <div className="flex" style={{ background: 'white', borderRadius: '10px', padding: '2px 4px', border: '1px solid #e2e8f0', gap: '6px' }}>
                          <button 
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontWeight: '800', fontSize: '0.85rem', minWidth: '16px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <span style={{ fontWeight: '900', fontSize: '0.98rem', color: '#0f172a' }}>
                          ₹{(item.price * item.quantity).toFixed(0)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Checkout CTA */}
            {cart.length > 0 && (
              <div style={{ padding: '1.5rem 1.8rem', borderTop: '1px solid #f1f5f9', background: 'white' }}>
                <div className="flex-between" style={{ marginBottom: '1.2rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#64748b' }}>
                    Subtotal
                  </span>
                  <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#16a34a' }}>
                    ₹{totalPrice.toFixed(0)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '16px',
                    fontSize: '1rem',
                    fontWeight: '800'
                  }}
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
