import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Search, Menu, Package, LayoutDashboard, Home as HomeIcon, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemVariants = {
    hover: { scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } },
    tap: { scale: 0.95 }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: scrolled ? '0.8rem 0' : '1.5rem 0',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        background: scrolled ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid transparent'
      }}
    >
      <div className="container flex-between">
        {/* Logo */}
        <Link to="/" className="flex" style={{ gap: '12px' }}>
          <motion.div
            whileHover={{ rotate: -10, scale: 1.1 }}
            style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '10px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 8px 16px -4px var(--primary-glow)'
            }}
          >
            <ShoppingCart size={24} />
          </motion.div>
          <span style={{
            fontSize: '1.6rem',
            fontWeight: '900',
            letterSpacing: '-0.03em',
            color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)')
          }}>
            Fresh<span style={{ color: 'var(--primary)' }}>Cart.</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="flex" style={{ gap: '2.5rem' }}>
          {/* Customer Navigation */}
          {(!user || user.role === 'user') && (
            <>
              <Link to="/" style={{ fontWeight: '700', fontSize: '0.95rem', color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'white'), display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} /> Shop
              </Link>
              {user && (
                <Link to="/orders" style={{ fontWeight: '700', fontSize: '0.95rem', color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)'), display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClipboardList size={18} /> My Orders
                </Link>
              )}
            </>
          )}

          {/* Admin Navigation */}
          {isAdmin && (
            <>
              <Link to="/admin" style={{ fontWeight: '700', fontSize: '0.95rem', color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)'), display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayoutDashboard size={18} /> Product Inventory
              </Link>
              <Link to="/admin/orders" style={{ fontWeight: '700', fontSize: '0.95rem', color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)'), display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={18} /> Manage Orders
              </Link>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex" style={{ gap: '1.5rem' }}>
          {user ? (
            <div className="flex" style={{ gap: '1rem' }}>
              {/* Cart Icon - Only for customers, NOT admin */}
              {!isAdmin && (
                <div
                  onClick={openCart}
                  style={{ cursor: 'pointer' }}
                >
                  <motion.div
                    variants={navItemVariants}
                    whileHover="hover"
                    whileTap="tap"
                    style={{
                      position: 'relative',
                      padding: '12px',
                      background: scrolled ? '#f1f5f9' : 'rgba(255,255,255,0.1)',
                      borderRadius: '14px',
                      color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)')
                    }}
                  >
                    <ShoppingCart size={22} />
                    <AnimatePresence>
                      {cart.length > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            minWidth: '20px',
                            height: '20px',
                            background: 'var(--primary)',
                            color: 'white',
                            fontSize: '0.7rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid white',
                            fontWeight: '800'
                          }}
                        >
                          {cart.length}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}

              {/* User Profile & Logout */}
              <div
                className="flex"
                style={{
                  background: scrolled ? 'white' : 'rgba(255,255,255,0.1)',
                  padding: '4px 16px 4px 4px',
                  borderRadius: '30px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
                  gap: '12px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem' }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)'),
                    fontWeight: '700',
                    fontSize: '0.9rem'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex" style={{ gap: '1rem' }}>
              <Link
                to="/login"
                style={{
                  fontWeight: '700',
                  color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)')
                }}
              >
                Login
              </Link>
              <Link to="/register" className="btn-primary" style={{ padding: '0.8rem 1.8rem', borderRadius: '14px' }}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
