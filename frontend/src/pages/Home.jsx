import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Heart, Package, Star, ArrowRight, TrendingUp, 
  ShieldCheck, Zap, MapPin, Navigation, Check, Search, X, 
  Plus, Minus, Clock, Eye, Sparkles, SlidersHorizontal, CheckCircle2,
  Truck, Leaf, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI, categoryAPI } from '../api/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE, getProductFallbackImage } from '../utils/imageUtils';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [deliveryLocation, setDeliveryLocation] = useState('Select Location');
  const [detectingGps, setDetectingGps] = useState(false);
  
  // Interactive features: Search, Filter, Sort, Wishlist & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('freshcart_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { cart, addToCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleFavorite = (productId, e) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const updated = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      try {
        localStorage.setItem('freshcart_favorites', JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save favorites:", err);
      }
      return updated;
    });
  };

  const getCartQuantity = (productId) => {
    const item = cart.find(c => c._id === productId);
    return item ? item.quantity : 0;
  };

  // Dynamic location sync
  const refreshDeliveryLocation = () => {
    try {
      let city = '';
      let pincode = '';
      const saved = localStorage.getItem('freshcart_delivery_address');
      if (saved) {
        const parsed = JSON.parse(saved);
        city = parsed.city || '';
        pincode = parsed.pincode || '';
      }
      if (user) {
        if (!city && (user.city || user.address)) city = user.city || user.address;
        if (!pincode && user.pincode) pincode = user.pincode;
      }
      if (city || pincode) {
        setDeliveryLocation(`${city || 'Deliver'}${pincode ? ` (${pincode})` : ''}`);
      } else {
        setDeliveryLocation('Select Delivery Location');
      }
    } catch (e) {
      setDeliveryLocation('Select Delivery Location');
    }
  };

  useEffect(() => {
    refreshDeliveryLocation();
    const handleUpdate = () => refreshDeliveryLocation();
    window.addEventListener('freshcart_address_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('freshcart_address_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  const handleQuickGpsDetect = () => {
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
          setDeliveryLocation(locText);

          const existing = JSON.parse(localStorage.getItem('freshcart_delivery_address') || '{}');
          localStorage.setItem('freshcart_delivery_address', JSON.stringify({
            ...existing,
            city,
            pincode,
            lat: latitude,
            lng: longitude
          }));

          window.dispatchEvent(new Event('freshcart_address_updated'));
        } catch (err) {
          setDeliveryLocation(`Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
        } finally {
          setDetectingGps(false);
        }
      },
      () => {
        setDetectingGps(false);
        alert("Could not detect location. Please set location in Navbar.");
      },
      { timeout: 8000 }
    );
  };

  // Redirect admin to dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    productAPI.getAll()
      .then(res => {
        setProducts(res.data.products || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    categoryAPI.getAll()
      .then(res => {
        if (res.data.success && res.data.categories) {
          setCategories(['All', ...res.data.categories.map(c => c.name)]);
        }
      })
      .catch(err => {
        console.error("Error fetching categories:", err);
      });
  }, []);

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by Category
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Filter by Stock
    if (onlyInStock) {
      result = result.filter(p => p.stock > 0);
    }

    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, activeCategory, searchQuery, onlyInStock, sortBy]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="home-page" style={{ 
      paddingTop: '5rem',
      paddingBottom: '5rem', 
      background: 'radial-gradient(1200px 600px at 85% 10%, rgba(209, 250, 229, 0.55), transparent 60%), radial-gradient(800px 500px at 0% 100%, rgba(220, 252, 231, 0.45), transparent 60%), #f8fbf9', 
      minHeight: '100vh', 
      color: '#0f291e' 
    }}>
      {/* Hero Section */}
      <section className="hero" style={{ 
        position: 'relative',
        padding: 'clamp(2.5rem, 6vw, 4.5rem) 0 clamp(2.5rem, 5vw, 4rem)', 
        overflow: 'hidden'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            alignItems: 'center',
            gap: 'clamp(2.5rem, 5vw, 4.5rem)'
          }}>
            {/* Left Column: Text, Search, CTAs & Stats */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: 'left' }}
            >
              {/* Top Eyebrow Badge */}
              <motion.span 
                whileHover={{ scale: 1.05 }}
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#15803d',
                  padding: '0.45rem 1.3rem',
                  borderRadius: '999px',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  marginBottom: '1.2rem',
                  boxShadow: '0 4px 12px rgba(22, 101, 52, 0.08)'
                }}
              >
                <Sparkles size={14} color="#16a34a" /> ⚡ 15-Minute Express Delivery on All Orders
              </motion.span>
              
              {/* Headline */}
              <h1 style={{ 
                fontSize: 'clamp(2.5rem, 5.5vw, 4rem)', 
                fontWeight: '900', 
                lineHeight: 1.08,
                marginBottom: '1.2rem',
                letterSpacing: '-0.035em',
                color: '#0f291e'
              }}>
                Fresh groceries,<br />
                <span style={{ 
                  background: 'linear-gradient(135deg, #15803d 0%, #16a34a 60%, #22c55e 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}>
                  delivered
                </span> in minutes.
              </h1>
              
              <p style={{ 
                fontSize: '1.12rem', 
                marginBottom: '2rem', 
                maxWidth: '520px', 
                fontWeight: '400', 
                color: '#475569',
                lineHeight: 1.6
              }}>
                Farm-picked fruits, crisp vegetables, warm bread, and daily essentials — handpicked and at your door before the kettle boils.
              </p>

              {/* FreshMart Style Interactive Search Bar */}
              <div style={{ maxWidth: '540px', marginBottom: '1.8rem', position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#ffffff',
                  border: '2px solid #bbf7d0',
                  borderRadius: '999px',
                  padding: '0.45rem 0.6rem 0.45rem 1.3rem',
                  boxShadow: '0 12px 32px -8px rgba(22, 101, 52, 0.12)',
                  transition: 'border-color 0.2s ease'
                }}>
                  <Search size={22} style={{ color: '#16a34a', marginRight: '10px', flexShrink: 0 }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search fresh milk, potatoes, apples, bread..."
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                      color: '#0f291e',
                      fontSize: '0.98rem',
                      fontWeight: '600',
                      width: '100%',
                      padding: '0.45rem 0'
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        marginRight: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' })}
                    style={{
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '999px',
                      fontWeight: '800',
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      boxShadow: '0 6px 16px -2px rgba(22, 163, 74, 0.35)',
                      flexShrink: 0
                    }}
                  >
                    Search
                  </button>
                </div>

                {/* Popular Search Pills */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginTop: '0.9rem',
                  fontSize: '0.8rem',
                  color: '#64748b'
                }}>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>Popular:</span>
                  {['Milk', 'Potato', 'Apple', 'Tomato', 'Curd', 'Snacks'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSearchQuery(tag);
                        document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2ece5',
                        borderRadius: '999px',
                        padding: '0.22rem 0.75rem',
                        color: '#15803d',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#16a34a';
                        e.currentTarget.style.background = '#ecfdf5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2ece5';
                        e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex hero-buttons" style={{ gap: '1rem', marginBottom: '2.2rem' }}>
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: '0 15px 30px -5px rgba(22, 163, 74, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{ 
                    height: '52px', 
                    padding: '0 2rem', 
                    fontSize: '0.98rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: 'white',
                    borderRadius: '16px',
                    fontWeight: '800',
                    boxShadow: '0 10px 24px -4px rgba(22, 163, 74, 0.35)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Shop Now <ArrowRight size={18} />
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05, background: '#f0fdf4' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsHowItWorksOpen(true)}
                  style={{ 
                    height: '52px', 
                    padding: '0 1.8rem', 
                    background: '#ffffff', 
                    color: '#15803d', 
                    border: '1.5px solid #bbf7d0', 
                    borderRadius: '16px', 
                    fontWeight: '800', 
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  How It Works
                </motion.button>
              </div>

              {/* Hero Quick Stats Strip */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '1.8rem', 
                color: '#334155', 
                fontSize: '0.8rem', 
                fontWeight: '800', 
                letterSpacing: '0.04em', 
                textTransform: 'uppercase'
              }}>
                 <div className="flex" style={{ gap: '6px' }}><TrendingUp size={16} color="#16a34a" /> 15-30 Min Delivery</div>
                 <div className="flex" style={{ gap: '6px' }}><ShieldCheck size={16} color="#16a34a" /> 100% Farm Fresh</div>
                 <div className="flex" style={{ gap: '6px' }}><Zap size={16} color="#16a34a" /> Best Quality Guarantee</div>
              </div>
            </motion.div>

            {/* Right Column: Big Beautiful Hero Image with Floating Badges */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{ position: 'relative' }}
            >
              {/* Main Image Container */}
              <div style={{
                position: 'relative',
                borderRadius: '2.5rem',
                overflow: 'hidden',
                height: 'clamp(380px, 42vw, 500px)',
                boxShadow: '0 25px 60px -15px rgba(22, 101, 52, 0.22), 0 0 0 1px rgba(22, 101, 52, 0.06)',
                background: '#f0fdf4'
              }}>
                <img 
                  src="https://freshmart-marketplace.lovable.app/assets/hero-groceries-fdZkXQNg.jpg"
                  alt="Fresh groceries basket"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000&auto=format&fit=crop&q=80";
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                {/* Subtle soft gradient overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(15,41,30,0.3) 100%)',
                  pointerEvents: 'none'
                }} />
              </div>

              {/* Floating Badge 1: Top Left */}
              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '-15px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(16px)',
                  padding: '10px 16px',
                  borderRadius: '1.2rem',
                  boxShadow: '0 15px 35px -5px rgba(22, 48, 36, 0.15)',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  zIndex: 3
                }}
              >
                <div style={{
                  background: '#ecfdf5',
                  color: '#16a34a',
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  🍓
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#0f291e' }}>Fresh Harvest</div>
                  <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#16a34a' }}>100% Organically Grown</div>
                </div>
              </motion.div>

              {/* Floating Badge 2: Bottom Right */}
              <motion.div 
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                style={{
                  position: 'absolute',
                  bottom: '-15px',
                  right: '-10px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(16px)',
                  padding: '12px 18px',
                  borderRadius: '1.4rem',
                  boxShadow: '0 20px 40px -10px rgba(22, 48, 36, 0.18)',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  zIndex: 3
                }}
              >
                <div style={{
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white',
                  width: '42px',
                  height: '42px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 14px -2px rgba(22, 163, 74, 0.4)'
                }}>
                  <Zap size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#0f291e' }}>⚡ 15-Minute Drop</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>Packed cold & fresh</div>
                </div>
              </motion.div>

              {/* Floating Badge 3: Center Left Rating Pill */}
              <motion.div 
                animate={{ x: [0, -4, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  bottom: '80px',
                  left: '-20px',
                  background: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.12)',
                  border: '1px solid #e2ece5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 3
                }}
              >
                <Star size={16} fill="#f59e0b" stroke="none" />
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f291e' }}>4.9/5</span>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>• 12k+ Orders</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section id="products-grid" className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Prominent Quick-Delivery Location Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#ffffff',
            border: '1px solid #e2ece5',
            borderRadius: '1.5rem',
            padding: '1.2rem 1.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2.5rem',
            boxShadow: '0 8px 24px -6px rgba(22, 48, 36, 0.06)'
          }}
        >
          <div className="flex" style={{ gap: '14px', alignItems: 'center' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', 
              color: 'white', 
              padding: '12px', 
              borderRadius: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 6px 16px -2px rgba(22, 163, 74, 0.35)' 
            }}>
              <MapPin size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                ⚡ Delivering in 15 Minutes To:
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f291e', marginTop: '2px' }}>
                {deliveryLocation}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickGpsDetect}
            disabled={detectingGps}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              background: '#ecfdf5',
              border: '1.5px solid #16a34a',
              color: '#15803d',
              fontWeight: '800',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: detectingGps ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(22, 101, 52, 0.08)'
            }}
          >
            <Navigation size={18} className={detectingGps ? 'animate-spin' : ''} />
            {detectingGps ? 'Detecting GPS...' : 'Detect GPS Location'}
          </button>
        </motion.div>

        {/* Category Navigation Bar */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ marginBottom: '1.2rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Shop by Category
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f291e', letterSpacing: '-0.02em', marginTop: '2px' }}>
              Explore Our Fresh Picks
            </h2>
          </div>

          <div 
            className="scroll-x category-bar"
            style={{ 
              background: '#ffffff', 
              padding: '0.8rem 1rem', 
              borderRadius: '1.8rem', 
              boxShadow: '0 8px 24px -6px rgba(22, 48, 36, 0.05)',
              border: '1px solid #e2ece5',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.8rem'
            }}
          >
            {categories.map(cat => {
              const isActive = activeCategory === cat;
              const count = cat === 'All' 
                ? products.length 
                : products.filter(p => p.category?.toLowerCase() === cat.toLowerCase()).length;

              return (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '0.75rem 1.8rem',
                    borderRadius: '1.2rem',
                    fontSize: '0.92rem',
                    fontWeight: '800',
                    background: isActive 
                      ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' 
                      : '#f8faf9',
                    color: isActive ? '#ffffff' : '#334155',
                    boxShadow: isActive ? '0 8px 18px -3px rgba(22, 163, 74, 0.4)' : 'none',
                    border: isActive ? 'none' : '1px solid #e2ece5',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{cat}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(0, 0, 0, 0.25)' : '#e2ece5',
                    color: isActive ? '#ffffff' : '#475569',
                    fontWeight: '800'
                  }}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Toolbar: Result Info, Sort & In-Stock Filter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '0.8rem',
          borderBottom: '1px solid #e2ece5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f291e' }}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Available
            </span>
            {searchQuery && (
              <span style={{
                fontSize: '0.82rem',
                background: '#ecfdf5',
                color: '#15803d',
                padding: '3px 10px',
                borderRadius: '8px',
                fontWeight: '700',
                border: '1px solid #a7f3d0'
              }}>
                matching "{searchQuery}"
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Quick In-stock filter */}
            <button
              onClick={() => setOnlyInStock(!onlyInStock)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.45rem 0.9rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: '800',
                background: onlyInStock ? '#ecfdf5' : '#ffffff',
                border: onlyInStock ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                color: onlyInStock ? '#15803d' : '#475569',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <CheckCircle2 size={15} color={onlyInStock ? '#16a34a' : '#94a3b8'} />
              In Stock Only
            </button>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: 'auto',
                padding: '0.45rem 1.6rem 0.45rem 0.9rem',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f291e',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div 
              key="loader"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '2rem'
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div 
                  key={i} 
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2ece5',
                    borderRadius: '1.4rem',
                    padding: '1.2rem',
                    height: '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ width: '100%', height: '180px', background: '#f1f5f9', borderRadius: '1rem' }} />
                  <div>
                    <div style={{ width: '40%', height: '14px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ width: '80%', height: '22px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '12px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '35%', height: '24px', background: '#f1f5f9', borderRadius: '6px' }} />
                    <div style={{ width: '40%', height: '36px', background: '#f1f5f9', borderRadius: '12px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '6rem 2rem', background: '#ffffff', borderRadius: '1.5rem', border: '1px solid #e2ece5' }}
            >
              <Package size={52} color="#16a34a" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f291e', marginBottom: '0.5rem' }}>No products found</h3>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Try clearing your search or selecting a different category.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); setOnlyInStock(false); }}
                style={{ 
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 18px rgba(22, 163, 74, 0.3)'
                }}
              >
                Clear Search & Filters
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid" 
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', rowGap: '2.5rem', columnGap: '2rem' }}
            >
              {filteredProducts.map(product => {
                const qty = getCartQuantity(product._id);
                const isFav = favorites.includes(product._id);
                const isOutOfStock = product.stock <= 0;
                const mrp = Math.round(product.price * 1.25);

                return (
                  <motion.div 
                    key={product._id} 
                    variants={itemVariants}
                    layout
                    whileHover={{ y: -6 }}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      borderRadius: '1.4rem', 
                      background: '#ffffff',
                      border: '1px solid #e2ece5',
                      boxShadow: '0 4px 20px -2px rgba(22, 48, 36, 0.05)',
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    {/* Image Area with Price Tag, Wishlist & Quick View */}
                    <div style={{ 
                      position: 'relative', 
                      height: '190px', 
                      background: '#f4f8f5', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      overflow: 'hidden' 
                    }}>
                      {/* Delivery Speed / Discount Tag */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        zIndex: 2,
                        background: '#ecfdf5',
                        border: '1px solid #bbf7d0',
                        color: '#15803d',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Clock size={12} /> 15 MINS
                      </div>

                      {/* Wishlist Heart Icon */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(product._id, e)}
                        title={isFav ? "Saved to Wishlist" : "Save to Wishlist"}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          zIndex: 2,
                          background: '#ffffff',
                          border: isFav ? '1px solid #fecaca' : '1px solid #e2ece5',
                          borderRadius: '50%',
                          width: '34px',
                          height: '34px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Heart size={16} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : '#64748b'} />
                      </button>

                      {/* Product Image */}
                      <motion.img 
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.3 }}
                        src={getImageUrl(product.image, product.name, product.category)} 
                        alt={product.name} 
                        onClick={() => setQuickViewProduct(product)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getProductFallbackImage(product.name, product.category);
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} 
                      />
                    </div>

                    {/* Card Content Area */}
                    <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
                          <span style={{ 
                            background: '#ecfdf5', 
                            color: '#15803d', 
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontWeight: '800', 
                            fontSize: '0.74rem', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.04em' 
                          }}>
                            {product.category}
                          </span>
                          <div className="flex" style={{ 
                            gap: '4px', 
                            background: '#fffbeb', 
                            border: '1px solid #fef3c7',
                            padding: '2px 8px', 
                            borderRadius: '10px' 
                          }}>
                            <Star size={13} fill="#f59e0b" stroke="none" />
                            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#b45309' }}>4.8</span>
                          </div>
                        </div>
                        
                        <h3 
                          onClick={() => setQuickViewProduct(product)}
                          style={{ 
                            fontSize: '1.25rem', 
                            fontWeight: '800', 
                            marginBottom: '0.8rem', 
                            color: '#0f291e', 
                            cursor: 'pointer',
                            lineHeight: 1.3
                          }}
                        >
                          {product.name}
                        </h3>

                        {/* Stock status */}
                        <div style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
                          {isOutOfStock ? (
                            <span style={{ color: '#ef4444', fontWeight: '800' }}>● Out of stock</span>
                          ) : product.stock < 10 ? (
                            <span style={{ color: '#d97706', fontWeight: '800' }}>⚡ Only {product.stock} left in stock!</span>
                          ) : (
                            <span style={{ color: '#16a34a', fontWeight: '700' }}>● In Stock</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Price and Add button / Stepper */}
                      <div className="flex-between" style={{ paddingTop: '0.8rem', borderTop: '1px solid #f1f5f9' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f291e' }}>
                              ₹{product.price.toFixed(2)}
                            </span>
                            <span style={{ fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                              ₹{mrp}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '800' }}>
                            20% OFF
                          </span>
                        </div>

                        {/* Interactive Quantity Stepper or Add Button */}
                        {isOutOfStock ? (
                          <span style={{ color: '#ef4444', fontWeight: '800', fontSize: '0.85rem' }}>
                            Sold Out
                          </span>
                        ) : qty === 0 ? (
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => addToCart(product)}
                            style={{ 
                              padding: '0.65rem 1.4rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                              color: 'white',
                              fontWeight: '800',
                              fontSize: '0.88rem',
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow: '0 6px 16px -2px rgba(22, 163, 74, 0.35)'
                            }}
                          >
                            <ShoppingCart size={16} /> Add
                          </motion.button>
                        ) : (
                          /* Interactive Stepper */
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            borderRadius: '12px',
                            boxShadow: '0 6px 16px -2px rgba(22, 163, 74, 0.35)',
                            overflow: 'hidden'
                          }}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product._id, qty - 1)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                width: '32px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Minus size={15} />
                            </button>
                            <span style={{
                              fontWeight: '900',
                              fontSize: '0.92rem',
                              color: 'white',
                              padding: '0 8px',
                              minWidth: '22px',
                              textAlign: 'center'
                            }}>
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (qty < product.stock) {
                                  updateQuantity(product._id, qty + 1);
                                }
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                width: '32px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FreshMart Style Why Choose Us Section */}
        <div style={{
          marginTop: '6rem',
          padding: '3rem 2rem',
          borderRadius: '2rem',
          background: '#ffffff',
          border: '1px solid #e2ece5',
          boxShadow: '0 10px 30px -10px rgba(22, 48, 36, 0.06)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2rem'
        }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ background: '#ecfdf5', color: '#16a34a', padding: '12px', borderRadius: '14px' }}>
              <Truck size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f291e', marginBottom: '4px' }}>
                15-30 Min Express Drop
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                Directly dispatched from your neighborhood dark store for record-fast arrival.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ background: '#ecfdf5', color: '#16a34a', padding: '12px', borderRadius: '14px' }}>
              <Leaf size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f291e', marginBottom: '4px' }}>
                100% Organic & Farm-Fresh
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                Sourced at dawn every morning from certified organic growers and trusted dairies.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ background: '#ecfdf5', color: '#16a34a', padding: '12px', borderRadius: '14px' }}>
              <RotateCcw size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f291e', marginBottom: '4px' }}>
                No Questions Refund
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                Not 100% satisfied with freshness? Instant replacement or refund at your door.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ background: '#ecfdf5', color: '#16a34a', padding: '12px', borderRadius: '14px' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f291e', marginBottom: '4px' }}>
                100% Safe & Secure
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                UPI, Credit/Debit cards & Cash on Delivery supported with contactless delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive "How It Works" Modal */}
      <AnimatePresence>
        {isHowItWorksOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 41, 30, 0.5)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
          onClick={() => setIsHowItWorksOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                border: '1px solid #e2ece5',
                borderRadius: '2rem',
                maxWidth: '560px',
                width: '100%',
                padding: '2.5rem',
                boxShadow: '0 25px 50px -10px rgba(22, 48, 36, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem' }}>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0f291e' }}>How FreshCart Works</h3>
                <button
                  onClick={() => setIsHowItWorksOpen(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: '#ecfdf5', color: '#16a34a', padding: '10px', borderRadius: '12px' }}>
                    <Search size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '3px', color: '#0f291e' }}>1. Choose Your Daily Fresh Items</h4>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                      Browse farm-fresh organic produce, dairy, fruits, and pantry essentials.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: '#ecfdf5', color: '#16a34a', padding: '10px', borderRadius: '12px' }}>
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '3px', color: '#0f291e' }}>2. Cold-Chain Hygienic Packing</h4>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                      Orders are packed from your nearest local dark store under strict temperature controls.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: '#ecfdf5', color: '#16a34a', padding: '10px', borderRadius: '12px' }}>
                    <Zap size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '3px', color: '#0f291e' }}>3. Delivered in 15 Minutes</h4>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                      Our express delivery partners bring your package straight to your doorstep contact-free.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsHowItWorksOpen(false)}
                style={{ 
                  width: '100%', 
                  height: '50px', 
                  fontSize: '1rem', 
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: 'white',
                  fontWeight: '800',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px -3px rgba(22, 163, 74, 0.35)'
                }}
              >
                Got It! Start Shopping
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Quick-View Product Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 41, 30, 0.5)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
          onClick={() => setQuickViewProduct(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                border: '1px solid #e2ece5',
                borderRadius: '2rem',
                maxWidth: '640px',
                width: '100%',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -10px rgba(22, 48, 36, 0.25)',
                position: 'relative',
                padding: '2rem'
              }}
            >
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                style={{
                  position: 'absolute',
                  top: '1.2rem',
                  right: '1.2rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
                <div style={{
                  borderRadius: '1.4rem',
                  overflow: 'hidden',
                  background: '#f4f8f5',
                  height: '240px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={getImageUrl(quickViewProduct.image, quickViewProduct.name, quickViewProduct.category)}
                    alt={quickViewProduct.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getProductFallbackImage(quickViewProduct.name, quickViewProduct.category);
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ 
                      background: '#ecfdf5', 
                      color: '#15803d', 
                      padding: '3px 9px',
                      borderRadius: '999px',
                      fontSize: '0.75rem', 
                      fontWeight: '800', 
                      textTransform: 'uppercase' 
                    }}>
                      {quickViewProduct.category}
                    </span>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0f291e', marginTop: '8px', marginBottom: '0.8rem' }}>
                      {quickViewProduct.name}
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.2rem' }}>
                      {quickViewProduct.description || 'Farm-fresh premium quality ingredient sourced directly from certified organic growers. Delivered cold & crisp in 15 minutes.'}
                    </p>
                    <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem' }}>
                      Stock Available: <span style={{ color: quickViewProduct.stock < 10 ? '#d97706' : '#16a34a', fontWeight: '800' }}>{quickViewProduct.stock} units</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f291e' }}>
                      ₹{quickViewProduct.price.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(quickViewProduct);
                        setQuickViewProduct(null);
                      }}
                      style={{ 
                        padding: '0.75rem 1.6rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        color: 'white',
                        fontWeight: '800',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 6px 16px -2px rgba(22, 163, 74, 0.35)'
                      }}
                    >
                      <ShoppingCart size={17} /> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
