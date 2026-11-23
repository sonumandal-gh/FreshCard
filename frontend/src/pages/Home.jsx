import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Heart, Package, Star, ArrowRight, TrendingUp, 
  ShieldCheck, Zap, MapPin, Navigation, Check, Search, X, 
  Plus, Minus, Clock, Eye, Sparkles, SlidersHorizontal, CheckCircle2
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
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="home-page" style={{ 
      paddingBottom: '5rem', 
      background: 'radial-gradient(ellipse at 50% 0%, #062b21 0%, #081726 40%, #030811 100%)', 
      minHeight: '100vh', 
      color: '#f8fafc' 
    }}>
      {/* Hero Section */}
      <section className="hero" style={{ 
        position: 'relative',
        background: 'transparent', 
        color: 'white', 
        padding: 'clamp(5rem, 11vw, 8rem) 0 clamp(4rem, 9vw, 6.5rem)', 
        overflow: 'hidden',
        marginBottom: '1rem'
      }}>
        {/* Ambient Botanical Glows */}
        <div style={{ 
          position: 'absolute', top: '-15%', right: '-5%', 
          width: '580px', height: '580px', 
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.24) 0%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none'
        }}></div>

        <div style={{ 
          position: 'absolute', bottom: '0%', left: '-8%', 
          width: '500px', height: '500px', 
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none'
        }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}
          >
            {/* Top Pill */}
            <motion.span 
              whileHover={{ scale: 1.05 }}
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(6, 78, 59, 0.3) 100%)',
                backdropFilter: 'blur(12px)',
                color: '#34d399',
                padding: '0.45rem 1.3rem',
                borderRadius: '2rem',
                fontWeight: '800',
                fontSize: '0.82rem',
                marginBottom: '1.5rem',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)'
              }}
            >
              <Sparkles size={14} color="#34d399" /> Fresh Arrivals Every Morning
            </motion.span>
            
            {/* Headline */}
            <h1 style={{ 
              fontSize: 'clamp(2.6rem, 6.5vw, 4.3rem)', 
              fontWeight: '900', 
              lineHeight: 1.1,
              marginBottom: '1.5rem',
              letterSpacing: '-0.03em',
              color: '#ffffff'
            }}>
              Freshness You Can{' '}
              <span style={{ 
                background: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                textShadow: '0 0 35px rgba(16, 185, 129, 0.35)'
              }}>
                Taste.
              </span>
            </h1>
            
            <p style={{ 
              fontSize: '1.15rem', 
              marginBottom: '2.5rem', 
              maxWidth: '580px', 
              margin: '0 auto 2.5rem', 
              fontWeight: '400', 
              color: 'rgba(226, 232, 240, 0.88)',
              lineHeight: 1.6
            }}>
              Premium ingredients from local farmers delivered to your doorstep in 15 minutes.
            </p>
            
            {/* Action Buttons */}
            <div className="flex hero-buttons" style={{ gap: '1rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: '0 15px 30px -5px rgba(16, 185, 129, 0.6)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ 
                  height: '54px', 
                  padding: '0 2.2rem', 
                  fontSize: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  borderRadius: '14px',
                  fontWeight: '800',
                  boxShadow: '0 10px 25px -4px rgba(16, 185, 129, 0.5)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Shop Now <ArrowRight size={18} />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.12)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsHowItWorksOpen(true)}
                style={{ 
                  height: '54px', 
                  padding: '0 1.8rem', 
                  background: 'rgba(255, 255, 255, 0.06)', 
                  color: '#ffffff', 
                  border: '1px solid rgba(255, 255, 255, 0.18)', 
                  borderRadius: '14px', 
                  fontWeight: '700', 
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)'
                }}
              >
                How It Works
              </motion.button>
            </div>

            {/* Seamless Interactive Search Bar */}
            <div style={{
              maxWidth: '580px',
              margin: '0 auto',
              position: 'relative'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(10, 22, 36, 0.75)',
                border: '1.5px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '16px',
                padding: '0.45rem 0.6rem 0.45rem 1.3rem',
                backdropFilter: 'blur(25px)',
                boxShadow: '0 18px 40px -10px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
                transition: 'border-color 0.3s ease'
              }}>
                <Search size={20} style={{ color: '#34d399', marginRight: '10px', flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fresh veggies, milk, fruits, snacks..."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    color: '#ffffff',
                    fontSize: '0.96rem',
                    fontWeight: '500',
                    width: '100%',
                    padding: '0.45rem 0'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      marginRight: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Compact Stats */}
        <div className="container hero-stats" style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', width: '100%', zIndex: 1 }}>
          <div className="flex" style={{ justifyContent: 'center', gap: '2.5rem', color: 'rgba(226, 232, 240, 0.65)', fontSize: '0.78rem', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
             <div className="flex" style={{ gap: '6px' }}><TrendingUp size={15} color="#34d399" /> Fast Delivery</div>
             <div className="flex" style={{ gap: '6px' }}><ShieldCheck size={15} color="#34d399" /> 100% Organic</div>
             <div className="flex" style={{ gap: '6px' }}><Zap size={15} color="#34d399" /> Instant Help</div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section id="products-grid" className="container" style={{ position: 'relative', marginTop: '-4rem', zIndex: 10 }}>
        {/* Prominent Quick-Delivery Location Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, rgba(15, 30, 48, 0.9) 0%, rgba(8, 18, 30, 0.96) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            borderRadius: '1.5rem',
            padding: '1.2rem 1.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem',
            boxShadow: '0 20px 45px -12px rgba(0, 0, 0, 0.65), 0 0 25px -8px rgba(16, 185, 129, 0.15)'
          }}
        >
          <div className="flex" style={{ gap: '14px', alignItems: 'center' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              color: 'white', 
              padding: '12px', 
              borderRadius: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 8px 20px -3px rgba(16, 185, 129, 0.5)' 
            }}>
              <MapPin size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                ⚡ Delivering in 15 Minutes To:
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>
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
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.28) 100%)',
              border: '1.5px solid #10b981',
              color: '#34d399',
              fontWeight: '800',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: detectingGps ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Navigation size={18} className={detectingGps ? 'animate-spin' : ''} />
            {detectingGps ? 'Detecting GPS...' : 'Detect GPS Location'}
          </button>
        </motion.div>

        {/* Category Navigation Bar */}
        <div 
          className="scroll-x category-bar"
          style={{ 
            background: 'linear-gradient(135deg, rgba(16, 32, 52, 0.75) 0%, rgba(9, 20, 34, 0.88) 100%)', 
            backdropFilter: 'blur(24px)',
            padding: '1rem 1.2rem', 
            borderRadius: '1.8rem', 
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '2.5rem',
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
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                    : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  boxShadow: isActive ? '0 10px 22px -4px rgba(16, 185, 129, 0.55)' : 'none',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.25s ease',
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
                  background: isActive ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontWeight: '800'
                }}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Toolbar: Result Info, Sort & In-Stock Filter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2.5rem',
          paddingBottom: '0.8rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#f8fafc' }}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Available
            </span>
            {searchQuery && (
              <span style={{
                fontSize: '0.8rem',
                background: 'rgba(16, 185, 129, 0.16)',
                color: '#34d399',
                padding: '3px 10px',
                borderRadius: '8px',
                fontWeight: '700',
                border: '1px solid rgba(16, 185, 129, 0.3)'
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
                fontSize: '0.8rem',
                fontWeight: '700',
                background: onlyInStock ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: onlyInStock ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                color: onlyInStock ? '#34d399' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <CheckCircle2 size={14} color={onlyInStock ? '#10b981' : 'rgba(255,255,255,0.4)'} />
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
                background: 'rgba(15, 28, 44, 0.85)',
                border: '1px solid rgba(52, 211, 153, 0.25)',
                color: '#f8fafc',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <option value="featured" style={{ background: '#0a1726', color: 'white' }}>Sort: Featured</option>
              <option value="price-low" style={{ background: '#0a1726', color: 'white' }}>Price: Low to High</option>
              <option value="price-high" style={{ background: '#0a1726', color: 'white' }}>Price: High to Low</option>
              <option value="name" style={{ background: '#0a1726', color: 'white' }}>Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '10rem 0' }}
            >
              <div className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800' }}>Cultivating Experience...</div>
            </motion.div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '6rem 2rem' }}
            >
              <Package size={48} color="rgba(255,255,255,0.3)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', marginBottom: '0.5rem' }}>No products found</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>Try clearing your search or selecting a different category.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); setOnlyInStock(false); }}
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.65rem 1.8rem',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
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
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', rowGap: '3rem', columnGap: '2rem' }}
            >
              {filteredProducts.map(product => {
                const qty = getCartQuantity(product._id);
                const isFav = favorites.includes(product._id);
                const isOutOfStock = product.stock <= 0;

                return (
                  <motion.div 
                    key={product._id} 
                    variants={itemVariants}
                    layout
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="premium-card" 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      padding: '0', 
                      overflow: 'hidden', 
                      background: 'linear-gradient(180deg, rgba(16, 30, 48, 0.75) 0%, rgba(9, 18, 30, 0.92) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderTop: '1px solid rgba(52, 211, 153, 0.3)',
                      borderRadius: '1.4rem', 
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.65), 0 0 20px -8px rgba(16, 185, 129, 0.1)',
                      position: 'relative'
                    }}
                  >
                    {/* Image Area with Price Tag, Wishlist & Quick View */}
                    <div style={{ 
                      position: 'relative', 
                      height: '190px', 
                      background: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.14) 0%, rgba(8, 16, 26, 0.6) 100%)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      overflow: 'hidden' 
                    }}>
                      {/* Price Tag */}
                      <div style={{ 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                        padding: '0.55rem 1rem', 
                        borderRadius: '1rem', 
                        position: 'absolute', 
                        top: '0.9rem', 
                        right: '0.9rem', 
                        boxShadow: '0 8px 18px -2px rgba(16, 185, 129, 0.5), inset 0 1px 1px rgba(255,255,255,0.4)',
                        fontWeight: '900',
                        color: 'white',
                        zIndex: 2,
                        fontSize: '0.9rem',
                        letterSpacing: '-0.01em'
                      }}>
                        ₹{product.price.toFixed(2)}
                      </div>

                      {/* Wishlist Heart Icon */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(product._id, e)}
                        title={isFav ? "Saved to Wishlist" : "Save to Wishlist"}
                        style={{
                          position: 'absolute',
                          top: '0.9rem',
                          left: '0.9rem',
                          zIndex: 2,
                          background: isFav ? 'rgba(239, 68, 68, 0.25)' : 'rgba(8, 16, 26, 0.65)',
                          backdropFilter: 'blur(10px)',
                          border: isFav ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '50%',
                          width: '34px',
                          height: '34px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Heart size={16} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : 'white'} />
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
                    <div style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <div className="flex-between" style={{ marginBottom: '0.8rem' }}>
                          <span style={{ 
                            background: 'rgba(16, 185, 129, 0.12)', 
                            color: '#34d399', 
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            padding: '3px 9px',
                            borderRadius: '20px',
                            fontWeight: '800', 
                            fontSize: '0.74rem', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.06em' 
                          }}>
                            {product.category}
                          </span>
                          <div className="flex" style={{ 
                            gap: '5px', 
                            background: 'rgba(251, 191, 36, 0.12)', 
                            border: '1px solid rgba(251, 191, 36, 0.25)',
                            padding: '3px 8px', 
                            borderRadius: '12px' 
                          }}>
                            <Star size={13} fill="#fbbf24" stroke="none" />
                            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fbbf24' }}>4.8</span>
                          </div>
                        </div>
                        
                        <h3 
                          onClick={() => setQuickViewProduct(product)}
                          style={{ 
                            fontSize: '1.35rem', 
                            fontWeight: '800', 
                            marginBottom: '1.4rem', 
                            color: '#ffffff', 
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                            lineHeight: 1.3
                          }}
                        >
                          {product.name}
                        </h3>
                      </div>
                      
                      <div className="flex-between">
                        <span style={{ color: '#94a3b8', fontSize: '0.86rem', fontWeight: '600' }}>
                          In stock: <span style={{ color: product.stock < 10 ? '#fbbf24' : '#34d399', fontWeight: '700' }}>{product.stock}</span>
                        </span>

                        {/* Interactive Quantity Stepper or Add Button */}
                        {isOutOfStock ? (
                          <span style={{ color: '#ef4444', fontWeight: '800', fontSize: '0.85rem' }}>
                            Out of stock
                          </span>
                        ) : qty === 0 ? (
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => addToCart(product)}
                            style={{ 
                              padding: '0.7rem 1.4rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              fontWeight: '800',
                              fontSize: '0.88rem',
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow: '0 8px 18px -3px rgba(16, 185, 129, 0.5)'
                            }}
                          >
                            <ShoppingCart size={16} /> Add
                          </motion.button>
                        ) : (
                          /* Interactive Stepper */
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            borderRadius: '12px',
                            boxShadow: '0 8px 18px -3px rgba(16, 185, 129, 0.5)',
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
      </section>

      {/* Interactive "How It Works" Modal */}
      <AnimatePresence>
        {isHowItWorksOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 8, 17, 0.8)',
            backdropFilter: 'blur(16px)',
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
                background: 'linear-gradient(145deg, #0e1e30 0%, #071320 100%)',
                border: '1.5px solid rgba(52, 211, 153, 0.25)',
                borderRadius: '2rem',
                maxWidth: '560px',
                width: '100%',
                padding: '2.5rem',
                boxShadow: '0 30px 60px rgba(0,0,0,0.85), 0 0 35px rgba(16, 185, 129, 0.15)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem' }}>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'white' }}>How FreshCart Works</h3>
                <button
                  onClick={() => setIsHowItWorksOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '10px', borderRadius: '12px' }}>
                    <Search size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '3px', color: 'white' }}>1. Choose Your Daily Fresh Items</h4>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(226, 232, 240, 0.75)', lineHeight: 1.5 }}>
                      Browse farm-fresh organic produce, dairy, fruits, and pantry essentials.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', padding: '10px', borderRadius: '12px' }}>
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '3px', color: 'white' }}>2. Cold-Chain Hygienic Packing</h4>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(226, 232, 240, 0.75)', lineHeight: 1.5 }}>
                      Orders are packed from your nearest local dark store under strict temperature controls.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '10px', borderRadius: '12px' }}>
                    <Zap size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '3px', color: 'white' }}>3. Delivered in 15 Minutes</h4>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(226, 232, 240, 0.75)', lineHeight: 1.5 }}>
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
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontWeight: '800',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px -3px rgba(16, 185, 129, 0.5)'
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
            background: 'rgba(3, 8, 17, 0.8)',
            backdropFilter: 'blur(16px)',
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
                background: 'linear-gradient(145deg, #0e1e30 0%, #071320 100%)',
                border: '1.5px solid rgba(52, 211, 153, 0.25)',
                borderRadius: '2rem',
                maxWidth: '640px',
                width: '100%',
                overflow: 'hidden',
                boxShadow: '0 30px 60px rgba(0,0,0,0.85), 0 0 35px rgba(16, 185, 129, 0.15)',
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
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
                <div style={{
                  borderRadius: '1.4rem',
                  overflow: 'hidden',
                  background: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.15) 0%, rgba(8, 16, 26, 0.8) 100%)',
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
                      background: 'rgba(16, 185, 129, 0.12)', 
                      color: '#34d399', 
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      padding: '3px 9px',
                      borderRadius: '20px',
                      fontSize: '0.75rem', 
                      fontWeight: '800', 
                      textTransform: 'uppercase' 
                    }}>
                      {quickViewProduct.category}
                    </span>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'white', marginTop: '8px', marginBottom: '0.8rem' }}>
                      {quickViewProduct.name}
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(226, 232, 240, 0.75)', lineHeight: 1.5, marginBottom: '1.2rem' }}>
                      {quickViewProduct.description || 'Farm-fresh premium quality ingredient sourced directly from certified organic growers. Delivered cold & crisp in 15 minutes.'}
                    </p>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.6)', marginBottom: '1rem' }}>
                      Stock Available: <span style={{ color: quickViewProduct.stock < 10 ? '#fbbf24' : '#34d399', fontWeight: '800' }}>{quickViewProduct.stock} units</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>
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
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        fontWeight: '800',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 8px 18px -2px rgba(16, 185, 129, 0.5)'
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
