import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CartDrawer = () => {
  const { cart, closeModal, removeFromCart, updateQuantity, totalPrice, isCartOpen, closeCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Admin ko cart drawer nahi dikhana
  if (user?.role === 'admin') return null;

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
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 2000,
              cursor: 'pointer'
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '450px',
              background: 'white',
              boxShadow: '-20px 0 50px rgba(0,0,0,0.15)',
              zIndex: 2001,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div className="flex-between" style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9' }}>
              <div className="flex" style={{ gap: '12px' }}>
                <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                  <ShoppingCart size={24} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Your Basket</h2>
              </div>
              <button onClick={closeCart} style={{ background: '#f8fafc', color: 'var(--dark)', padding: '8px', borderRadius: '10px' }}>
                <X size={24} />
              </button>
            </div>

            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '5rem', opacity: 0.5 }}>
                  <Package size={80} style={{ marginBottom: '1.5rem', margin: '0 auto' }} strokeWidth={1} />
                  <p style={{ fontWeight: '700', fontSize: '1.2rem' }}>Your basket is empty</p>
                  <p style={{ fontSize: '0.9rem' }}>Fill it with some fresh items!</p>
                </div>
              ) : (
                <div className="grid" style={{ gap: '1.5rem' }}>
                  {cart.map((item) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={item._id}
                      className="premium-card"
                      style={{ padding: '1rem', border: '1px solid #f1f5f9' }}
                    >
                      <div className="flex-between" style={{ gap: '1rem' }}>
                        <div className="flex" style={{ gap: '1rem' }}>
                          <div style={{ background: '#f8fafc', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {item.image ? (
                              <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Package size={28} style={{ color: 'var(--primary)' }} />
                            )}
                          </div>
                          <div>
                            <h4 style={{ fontWeight: '800', fontSize: '1rem' }}>{item.name}</h4>
                            <p style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>₹{item.price.toFixed(2)} / unit</p>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item._id)} style={{ color: '#ef4444', background: 'none' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex-between" style={{ marginTop: '1rem' }}>
                        <div className="flex" style={{ background: '#f1f5f9', borderRadius: '30px', padding: '4px' }}>
                          <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ background: 'white', width: '28px', height: '28px', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}><Minus size={12} /></button>
                          <span style={{ padding: '0 15px', fontWeight: '800', fontSize: '0.9rem' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ background: 'white', width: '28px', height: '28px', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}><Plus size={12} /></button>
                        </div>
                        <span style={{ fontWeight: '800', color: 'var(--primary)' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div style={{ padding: '2rem', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontWeight: '700', color: 'var(--gray)' }}>Estimated Total</span>
                  <span style={{ fontWeight: '900', fontSize: '1.5rem', color: 'var(--primary)' }}>₹{totalPrice.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="btn-primary"
                  style={{ width: '100%', padding: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  Confirm & Checkout <ArrowRight size={20} />
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
