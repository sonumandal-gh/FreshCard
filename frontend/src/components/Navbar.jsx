import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Search, Menu, Package, LayoutDashboard, ClipboardList, Users, MapPin, Navigation, ChevronDown, X, Check } from 'lucide-react';
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

  // Delivery Location Modal state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Select Location');
  const [customCity, setCustomCity] = useState('');
  const [customPincode, setCustomPincode] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync location dynamically with user profile and localStorage
  const updateLocationFromStateOrStorage = () => {
    try {
      let city = '';
      let pincode = '';

      const saved = localStorage.getItem('freshcart_delivery_address');
      if (saved) {
        const parsed = JSON.parse(saved);
        city = parsed.city || '';
        pincode = parsed.pincode || '';
      }

      // If user profile has address details, prefer or complement
      if (user) {
        if (!city && (user.city || user.address)) {
          city = user.city || user.address;
        }
        if (!pincode && user.pincode) {
          pincode = user.pincode;
        }
      }

      if (city || pincode) {
        setCurrentLocation(`${city || 'Deliver'}${pincode ? ` (${pincode})` : ''}`);
      } else {
        setCurrentLocation('Select Location');
      }
    } catch (e) {
      setCurrentLocation('Select Location');
    }
  };

  useEffect(() => {
    updateLocationFromStateOrStorage();

    const handleAddressUpdate = () => {
      updateLocationFromStateOrStorage();
    };

    window.addEventListener('freshcart_address_updated', handleAddressUpdate);
    window.addEventListener('storage', handleAddressUpdate);

    return () => {
      window.removeEventListener('freshcart_address_updated', handleAddressUpdate);
      window.removeEventListener('storage', handleAddressUpdate);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.suburb || 'My Location';
          const pincode = addr.postcode || '';

          const locText = `${city}${pincode ? ` (${pincode})` : ''}`;
          setCurrentLocation(locText);

          // Update saved address
          const existing = JSON.parse(localStorage.getItem('freshcart_delivery_address') || '{}');
          localStorage.setItem('freshcart_delivery_address', JSON.stringify({
            ...existing,
            city,
            pincode,
            lat: latitude,
            lng: longitude
          }));

          window.dispatchEvent(new Event('freshcart_address_updated'));
          setIsLocationModalOpen(false);
        } catch (err) {
          setCurrentLocation(`Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
          setIsLocationModalOpen(false);
        } finally {
          setDetectingGps(false);
        }
      },
      () => {
        setDetectingGps(false);
        alert("Could not detect location. Please type your city/pincode below.");
      },
      { timeout: 8000 }
    );
  };

  const handleSaveManualLocation = (e) => {
    e.preventDefault();
    if (!customCity && !customPincode) return;

    const locText = `${customCity || 'Deliver'}${customPincode ? ` (${customPincode})` : ''}`;
    setCurrentLocation(locText);

    const existing = JSON.parse(localStorage.getItem('freshcart_delivery_address') || '{}');
    localStorage.setItem('freshcart_delivery_address', JSON.stringify({
      ...existing,
      city: customCity || existing.city || '',
      pincode: customPincode || existing.pincode || ''
    }));

    window.dispatchEvent(new Event('freshcart_address_updated'));
    setIsLocationModalOpen(false);
    setCustomCity('');
    setCustomPincode('');
  };

  const navItemVariants = {
    hover: { scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } },
    tap: { scale: 0.95 }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: scrolled ? '0.8rem 0' : '1.3rem 0',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          background: scrolled ? 'rgba(255, 255, 255, 0.85)' : (isMobileMenuOpen ? 'white' : 'transparent'),
          backdropFilter: scrolled || isMobileMenuOpen ? 'blur(20px)' : 'none',
          borderBottom: scrolled || isMobileMenuOpen ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid transparent'
        }}
      >
        <div className="container flex-between" style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Logo & Location */}
          <div className="flex" style={{ gap: '1.5rem', alignItems: 'center' }}>
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

            {/* Delivery Location Indicator Pill */}
            <div
              onClick={() => setIsLocationModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '24px',
                background: (location.pathname === '/' && !scrolled && !isMobileMenuOpen) ? 'rgba(255, 255, 255, 0.14)' : '#f1f5f9',
                border: (location.pathname === '/' && !scrolled && !isMobileMenuOpen) ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid #cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: (location.pathname === '/' && !scrolled && !isMobileMenuOpen) ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.04)'
              }}
              title="Click to set or change delivery location"
            >
              <div style={{
                background: (location.pathname === '/' && !scrolled && !isMobileMenuOpen) ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
                padding: '5px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MapPin size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <div style={{
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  color: (location.pathname === '/' && !scrolled && !isMobileMenuOpen) ? '#34d399' : '#059669',
                  letterSpacing: '0.04em'
                }}>
                  {isAdmin ? '⚡ Store Delivery Hub' : '⚡ 15 Mins Delivery'}
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  color: (location.pathname === '/' && !scrolled && !isMobileMenuOpen) ? '#ffffff' : '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '140px'
                }}>
                  {currentLocation}
                </div>
              </div>
              <ChevronDown size={14} style={{ opacity: 0.7, color: (location.pathname === '/' && !scrolled && !isMobileMenuOpen) ? '#ffffff' : '#475569' }} />
            </div>
          </div>

          {/* Desktop Links */}
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
                  <ClipboardList size={18} /> Orders & Location
                </Link>
                <Link to="/admin/users" style={{ fontWeight: '700', fontSize: '0.95rem', color: scrolled ? 'var(--dark)' : (location.pathname === '/' ? 'white' : 'var(--dark)'), display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} /> Users
                </Link>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex" style={{ gap: '1rem' }}>
            {/* Cart Icon */}
            {user && !isAdmin && (
              <div onClick={openCart} style={{ cursor: 'pointer' }}>
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
                  {/* Mobile Location button */}
                  <div
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsLocationModalOpen(true);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      fontWeight: '700',
                      color: 'var(--dark)',
                      cursor: 'pointer'
                    }}
                  >
                    <MapPin size={18} style={{ color: 'var(--primary)' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray)' }}>Deliver to:</div>
                      <div style={{ fontWeight: '800' }}>{currentLocation}</div>
                    </div>
                  </div>

                  {(!user || user.role === 'user') && (
                    <>
                      <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--dark)', width: '100%' }}>Shop</Link>
                      {user && (
                        <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--dark)', width: '100%' }}>My Orders</Link>
                      )}
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--dark)', width: '100%' }}>Inventory</Link>
                      <Link to="/admin/orders" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--dark)', width: '100%' }}>Manage Orders</Link>
                      <Link to="/admin/users" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--dark)', width: '100%' }}>Manage Users</Link>
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

      {/* Delivery Location Selection Modal */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ maxWidth: '440px', width: '100%', padding: '2rem', borderRadius: '1.5rem', background: 'white', position: 'relative' }}
            >
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={22} />
              </button>

              <div className="flex" style={{ gap: '12px', marginBottom: '1.5rem' }}>
                <div style={{ background: '#ecfdf5', color: '#059669', padding: '10px', borderRadius: '12px' }}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--dark)' }}>Delivery Location</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Where should we deliver your order?</p>
                </div>
              </div>

              {/* GPS Button */}
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={detectingGps}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  color: '#059669',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  marginBottom: '1.5rem',
                  fontSize: '0.95rem'
                }}
              >
                <Navigation size={18} className={detectingGps ? 'animate-spin' : ''} />
                {detectingGps ? 'Detecting Your GPS Location...' : 'Detect My Current Location (GPS)'}
              </button>

              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                OR ENTER AREA / PINCODE
              </div>

              <form onSubmit={handleSaveManualLocation} className="grid" style={{ gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>City or Locality</label>
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="e.g. Mumbai, Indore, Delhi, Bangalore"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>Postal Pincode</label>
                  <input
                    type="text"
                    value={customPincode}
                    onChange={(e) => setCustomPincode(e.target.value)}
                    placeholder="e.g. 400001"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.9rem', marginTop: '0.5rem', fontWeight: '800', borderRadius: '12px' }}
                >
                  Set Delivery Location
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
