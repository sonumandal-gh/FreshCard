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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
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
        background: scrolled ? 'rgba(255, 255, 255, 0.7)' : (isMobileMenuOpen ? 'white' : 'transparent'),
        backdropFilter: scrolled || isMobileMenuOpen ? 'blur(20px)' : 'none',
        borderBottom: scrolled || isMobileMenuOpen ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid transparent'
      }}
    >
      <div className="container flex-between" style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Logo */}
        <Link to="/" className="flex" style={{ gap: '12px' }} onClick={() => setIsMobileMenuOpen(false)}>
          <motion.div
            whileHover={{ rotate: -10, scale: 1.1 }}
            style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 8px 16px -4px var(--primary-glow)'
            }}
          >
            <ShoppingCart size={20} />
          </motion.div>
          <span style={{
            fontSize: '1.4rem',
            fontWeight: '900',
            letterSpacing: '-0.03em',
            color: scrolled || isMobileMenuOpen ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)')
          }}>
            Fresh<span style={{ color: 'var(--primary)' }}>Cart.</span>
          </span>
        </Link>

        {/* Desktop Links - Hidden on Mobile */}
        <div className="navbar-desktop flex" style={{ gap: '2.5rem' }}>
          {(!user || user.role === 'user') && (
            <>
              <Link to="/" style={{ fontWeight: '700', fontSize: '0.95rem', color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)'), display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} /> Shop
              </Link>
              {user && (
                <Link to="/orders" style={{ fontWeight: '700', fontSize: '0.95rem', color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)'), display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClipboardList size={18} /> My Orders
                </Link>
              )}
            </>
          )}

          {isAdmin && (
            <>
              <Link to="/admin" style={{ fontWeight: '700', fontSize: '0.95rem', color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)'), display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayoutDashboard size={18} /> Inventory
              </Link>
              <Link to="/admin/orders" style={{ fontWeight: '700', fontSize: '0.95rem', color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)'), display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={18} /> Manage
              </Link>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex" style={{ gap: '1rem' }}>
          {/* Cart Icon - Desktop & Mobile */}
          {user && !isAdmin && (
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
                  padding: '10px',
                  background: scrolled || isMobileMenuOpen ? '#f1f5f9' : 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: scrolled || isMobileMenuOpen ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)')
                }}
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    minWidth: '18px', height: '18px',
                    background: 'var(--primary)', color: 'white',
                    fontSize: '0.65rem', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid white', fontWeight: '800'
                  }}>
                    {cart.length}
                  </span>
                )}
              </motion.div>
            </div>
          )}

          {/* Desktop Auth */}
          <div className="navbar-desktop">
            {user ? (
              <div
                className="flex"
                style={{
                  background: scrolled ? 'white' : 'rgba(255,255,255,0.1)',
                  padding: '4px 12px',
                  borderRadius: '30px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem' }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <button onClick={handleLogout} style={{ background: 'none', color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)'), fontWeight: '700', fontSize: '0.85rem' }}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex" style={{ gap: '1rem' }}>
                <Link to="/login" style={{ fontWeight: '700', color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)') }}>Login</Link>
                <Link to="/register" className="btn-primary" style={{ padding: '0.7rem 1.4rem', borderRadius: '12px', fontSize: '0.85rem' }}>Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div 
            className="mobile-toggle" 
            style={{ 
              display: 'none', 
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '10px',
              background: scrolled || isMobileMenuOpen ? '#f1f5f9' : 'rgba(255,255,255,0.1)',
              color: scrolled || isMobileMenuOpen ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)')
            }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={24} />
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'white',
              overflow: 'hidden',
              borderBottom: '1px solid #eee'
            }}
          >
            <div className="container" style={{ padding: '2rem 1.2rem' }}>
              <div className="flex" style={{ flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--dark)', width: '100%' }}>Shop</Link>
                {user && (
                  <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--dark)', width: '100%' }}>My Orders</Link>
                )}
                {isAdmin && (
                  <>
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--dark)', width: '100%' }}>Inventory</Link>
                    <Link to="/admin/orders" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--dark)', width: '100%' }}>Manage Orders</Link>
                  </>
                )}
                <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #eee' }} />
                {user ? (
                  <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', background: 'none', color: 'var(--error)', fontWeight: '700', fontSize: '1.1rem' }}>Logout</button>
                ) : (
                  <div className="flex" style={{ flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--dark)' }}>Login</Link>
                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary" style={{ textAlign: 'center' }}>Get Started</Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
