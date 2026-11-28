import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Heart, Package, Star, ArrowRight, TrendingUp, 
  ShieldCheck, Zap, MapPin, Navigation, Check, Search, X, 
  Plus, Minus, Clock, Eye, Sparkles, SlidersHorizontal, CheckCircle2,
  Truck, Leaf, RotateCcw, Award, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI, categoryAPI } from '../api/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE, getProductFallbackImage } from '../utils/imageUtils';
import Hero3DCanvas from '../components/Hero3DCanvas';
import ProductCard from '../components/ProductCard';
import { getDeliverySettings } from '../utils/settingsUtils';

const CATEGORY_ICONS = {
  'All': '🛒',
  'Vegetables': '🥬',
  'Fruits': '🍎',
  'Fruits & Vegetables': '🥑',
  'Dairy': '🥛',
  'Dairy & Bakery': '🧀',
  'Bakery': '🍞',
  'Snacks': '🍿',
  'Snacks & Beverages': '🍪',
  'Beverages': '🧃',
  'Rice, Atta & Pulses': '🌾',
  'Personal Care': '🧴',
  'Household Essentials': '🧼'
};

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [deliveryLocation, setDeliveryLocation] = useState('Select Location');
  const [detectingGps, setDetectingGps] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState(getDeliverySettings());

  useEffect(() => {
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
  
  // Interactive controls
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

  const { cart, addToCart, updateQuantity, openCart } = useCart();
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

  // Redirect admin to dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  // Fetch products and categories
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
          const catNames = ['All', ...res.data.categories.map(c => c.name)];
          setCategories(catNames);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesCat = activeCategory === 'All' || p.category?.toLowerCase() === activeCategory.toLowerCase();
        const matchesSearch = !searchQuery || 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStock = !onlyInStock || (p.stock === undefined || p.stock > 0);
        return matchesCat && matchesSearch && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0; // featured default
      });
  }, [products, activeCategory, searchQuery, onlyInStock, sortBy]);

  return (
    <div style={{ position: 'relative', overflowX: 'hidden' }}>
      
      {/* 1. CINEMATIC 3D HERO SECTION */}
      <section 
        style={{ 
          position: 'relative', 
          minHeight: '88vh', 
          display: 'flex', 
          alignItems: 'center', 
          background: 'linear-gradient(180deg, #f8fbf9 0%, #f0fdf4 50%, #ffffff 100%)',
          padding: '6rem 0 4rem',
          overflow: 'hidden'
        }}
      >
        {/* Procedural 3D Canvas Wave / Particle Background */}
        <Hero3DCanvas />

        <div className="container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
              gap: '3.5rem', 
              alignItems: 'center' 
            }}
          >
            {/* Left Column: Editorial Headline & Actions */}
            <div>
              {/* Delivery Status Pill */}
              <motion.div 
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  padding: '8px 16px', 
                  borderRadius: '30px', 
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  border: '1px solid rgba(22, 163, 74, 0.15)',
                  marginBottom: '1.8rem'
                }}
              >
                <span className="pulse-glow" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#15803d', letterSpacing: '0.02em' }}>
                  ⚡ {deliverySettings.deliveryTimeText || '15-Minute'} Express Delivery to Your Door
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{ 
                  fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', 
                  fontWeight: '900', 
                  letterSpacing: '-0.035em', 
                  lineHeight: '1.08',
                  color: '#0f172a',
                  marginBottom: '1.4rem'
                }}
              >
                Freshness Delivered. <br />
                <span className="text-gradient">Happiness Unpacked.</span>
              </motion.h1>

              {/* Supporting Subtext */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{ 
                  fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', 
                  color: '#475569', 
                  fontWeight: '500', 
                  lineHeight: '1.6', 
                  maxWidth: '540px',
                  marginBottom: '2.5rem'
                }}
              >
                Discover crisp farm produce, wholesome dairy, pantry staples, and everyday groceries hand-selected and delivered before your tea cools.
              </motion.p>

              {/* Call to Actions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex" 
                style={{ gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}
              >
                <a 
                  href="#products-section" 
                  className="btn-primary"
                  style={{ padding: '1rem 2rem', fontSize: '1.02rem', borderRadius: '16px' }}
                >
                  Start Shopping <ArrowRight size={18} />
                </a>

                <button 
                  onClick={() => setIsHowItWorksOpen(true)}
                  className="btn-secondary"
                  style={{ padding: '1rem 2rem', fontSize: '1.02rem', borderRadius: '16px' }}
                >
                  How It Works
                </button>
              </motion.div>

              {/* Live Search Input */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                style={{ 
                  background: 'white', 
                  borderRadius: '18px', 
                  padding: '6px 8px 6px 18px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  maxWidth: '540px'
                }}
              >
                <Search size={20} color="#16a34a" style={{ flexShrink: 0, marginRight: '10px' }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fresh milk, potatoes, apples, curd, bread..."
                  style={{ 
                    border: 'none', 
                    background: 'transparent', 
                    padding: '0.6rem 0', 
                    fontSize: '0.98rem',
                    boxShadow: 'none',
                    fontWeight: '500'
                  }}
                />
                {searchQuery ? (
                  <button 
                    onClick={() => setSearchQuery('')}
                    style={{ background: '#f1f5f9', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <a 
                    href="#products-section" 
                    className="btn-primary" 
                    style={{ padding: '0.65rem 1.4rem', borderRadius: '12px', fontSize: '0.9rem' }}
                  >
                    Search
                  </a>
                )}
              </motion.div>

              {/* Popular Search Chips */}
              <div className="flex" style={{ gap: '8px', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>Popular:</span>
                {['Milk', 'Potato', 'Apple', 'Tomato', 'Curd', 'Snacks'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    style={{
                      background: searchQuery === tag ? '#16a34a' : 'rgba(255, 255, 255, 0.8)',
                      color: searchQuery === tag ? 'white' : '#475569',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: 3D Cinematic Grocery Showcase Composition */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div 
                className="perspective-container" 
                style={{ 
                  position: 'relative', 
                  width: '100%', 
                  maxWidth: '520px', 
                  minHeight: '440px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Glowing Ambient Backdrop Aura */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    width: '380px', 
                    height: '380px', 
                    borderRadius: '50%', 
                    background: 'radial-gradient(circle, rgba(22, 163, 74, 0.18) 0%, rgba(245, 158, 11, 0.12) 50%, transparent 70%)',
                    filter: 'blur(35px)',
                    zIndex: 0
                  }}
                />

                {/* Central 3D Grocery Basket Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    borderRadius: '32px',
                    padding: '2rem',
                    boxShadow: '0 30px 60px -15px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(22, 163, 74, 0.1)',
                    width: '100%',
                    maxWidth: '420px',
                    textAlign: 'center'
                  }}
                >
                  {/* Hero Visual Imagery */}
                  <div style={{ position: 'relative', width: '100%', height: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80" 
                      alt="Farm Fresh Produce" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        borderRadius: '22px',
                        boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.15)'
                      }} 
                    />
                    {/* Live delivery indicator */}
                    <div 
                      style={{ 
                        position: 'absolute', 
                        bottom: '12px', 
                        left: '12px', 
                        background: 'rgba(15, 23, 42, 0.85)', 
                        backdropFilter: 'blur(8px)',
                        color: 'white', 
                        borderRadius: '20px', 
                        padding: '6px 14px', 
                        fontSize: '0.8rem', 
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Zap size={14} fill="#f59e0b" color="#f59e0b" /> In Delivery: 12 Mins
                    </div>
                  </div>

                  <div style={{ marginTop: '1.25rem', textAlign: 'left' }}>
                    <div className="flex-between">
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                          Farm Harvest Box
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>
                          12 Handpicked Organics • Freshly Harvested
                        </p>
                      </div>
                      <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#16a34a' }}>
                        ₹299
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Micro-Badge 1: Top Right */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="floating-element"
                  style={{
                    position: 'absolute',
                    top: '-15px',
                    right: '-10px',
                    zIndex: 3,
                    background: 'white',
                    borderRadius: '16px',
                    padding: '10px 16px',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                  }}
                >
                  <div style={{ background: '#fef3c7', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                    <Star size={18} fill="#d97706" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: '900', color: '#0f172a' }}>4.9 ★ Rating</p>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>25,000+ Happy Foodies</p>
                  </div>
                </motion.div>

                {/* Floating Micro-Badge 2: Bottom Left */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="floating-element-reverse"
                  style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: '-15px',
                    zIndex: 3,
                    background: 'white',
                    borderRadius: '16px',
                    padding: '10px 16px',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid rgba(22, 163, 74, 0.2)'
                  }}
                >
                  <div style={{ background: '#dcfce7', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                    <Leaf size={18} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: '900', color: '#0f172a' }}>100% Farm Fresh</p>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Direct Organic Growers</p>
                  </div>
                </motion.div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION STRIP */}
      <section style={{ background: '#ffffff', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '1.8rem 0' }}>
        <div className="container">
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '1.5rem',
              alignItems: 'center'
            }}
          >
            {[
              { icon: <Zap size={22} color="#16a34a" />, title: "15-30 Min Fast Delivery", desc: "Express delivery to your doorstep" },
              { icon: <Leaf size={22} color="#16a34a" />, title: "100% Farm Direct", desc: "No middleman, freshest quality" },
              { icon: <ShieldCheck size={22} color="#16a34a" />, title: "Best Quality Guarantee", desc: "Strict 4-stage quality check" },
              { icon: <RotateCcw size={22} color="#16a34a" />, title: "Instant Easy Returns", desc: "No questions asked doorstep refund" }
            ].map((feature, idx) => (
              <div key={idx} className="flex" style={{ gap: '14px' }}>
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '14px', flexShrink: 0 }}>
                  {feature.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>{feature.title}</h4>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES SECTION */}
      <section id="categories-section" style={{ padding: '4rem 0 2rem' }}>
        <div className="container">
          <div className="flex-between" style={{ marginBottom: '2rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#16a34a', letterSpacing: '0.05em' }}>
                Browse Departments
              </span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em' }}>
                Explore by Category
              </h2>
            </div>
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
              {categories.length - 1} Departments Available
            </span>
          </div>

          {/* Horizontal Category Slider with Icons */}
          <div 
            className="scroll-x" 
            style={{ 
              display: 'flex', 
              gap: '1rem', 
              paddingBottom: '1rem',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const icon = CATEGORY_ICONS[cat] || '🥗';

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    background: isActive ? '#16a34a' : 'white',
                    color: isActive ? 'white' : '#0f172a',
                    padding: '0.85rem 1.6rem',
                    borderRadius: '16px',
                    border: `1.5px solid ${isActive ? '#16a34a' : 'rgba(0, 0, 0, 0.06)'}`,
                    boxShadow: isActive ? '0 10px 25px rgba(22, 163, 74, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.03)',
                    fontWeight: '800',
                    fontSize: '0.92rem',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. PRODUCTS SHOWCASE SECTION */}
      <section id="products-section" style={{ padding: '2rem 0 6rem' }}>
        <div className="container">
          
          {/* Controls: Search result title + Sorting & In-Stock toggle */}
          <div 
            className="flex-between" 
            style={{ 
              marginBottom: '2rem', 
              flexWrap: 'wrap', 
              gap: '1rem',
              background: 'white',
              padding: '1.2rem 1.5rem',
              borderRadius: '20px',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>
                {activeCategory === 'All' ? 'All Products' : activeCategory}
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b', marginLeft: '8px' }}>
                  ({filteredProducts.length} items)
                </span>
              </h3>
            </div>

            <div className="flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
              {/* Only in stock toggle */}
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '0.85rem', 
                  fontWeight: '700', 
                  color: '#475569',
                  cursor: 'pointer' 
                }}
              >
                <input 
                  type="checkbox" 
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                />
                In Stock Only
              </label>

              {/* Sort By Dropdown */}
              <div style={{ minWidth: '170px' }}>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ 
                    padding: '0.55rem 1rem', 
                    fontSize: '0.85rem', 
                    borderRadius: '12px',
                    background: '#f8fafc' 
                  }}
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '6rem 0' }}>
              <div className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                Loading fresh harvest...
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div 
              style={{ 
                textAlign: 'center', 
                padding: '5rem 2rem', 
                background: 'white', 
                borderRadius: '24px',
                border: '1px solid #f1f5f9'
              }}
            >
              <Package size={56} style={{ color: '#94a3b8', margin: '0 auto 1.2rem' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
                No Products Found
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                We couldn't find anything matching "{searchQuery}". Try searching for another item or clear filters.
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); setOnlyInStock(false); }}
                className="btn-primary"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
                gap: '1.5rem' 
              }}
            >
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    quantity={getCartQuantity(product._id)}
                    isFavorite={favorites.includes(product._id)}
                    onToggleFavorite={toggleFavorite}
                    onAddToCart={(p) => {
                      addToCart(p);
                      openCart();
                    }}
                    onUpdateQuantity={updateQuantity}
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* 5. QUICK VIEW PRODUCT MODAL */}
      <AnimatePresence>
        {quickViewProduct && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.25rem',
              overflowY: 'auto'
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickViewProduct(null)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(6px)',
                cursor: 'pointer'
              }}
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '700px',
                maxHeight: '88vh',
                overflowY: 'auto',
                background: 'white',
                borderRadius: '28px',
                padding: '2rem',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
                margin: 'auto'
              }}
            >
              <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <span 
                  style={{ 
                    background: '#f0fdf4', 
                    color: '#15803d', 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem', 
                    fontWeight: '800' 
                  }}
                >
                  {quickViewProduct.category || 'Fresh Goods'}
                </span>
                <button 
                  onClick={() => setQuickViewProduct(null)}
                  style={{ background: '#f1f5f9', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', alignItems: 'center' }}>
                <div 
                  style={{ 
                    background: 'radial-gradient(circle, #f8fafc 0%, #f1f5f9 100%)', 
                    borderRadius: '20px', 
                    padding: '1.5rem', 
                    minHeight: '220px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <img 
                    src={getImageUrl(quickViewProduct.image, quickViewProduct.name, quickViewProduct.category)} 
                    alt={quickViewProduct.name}
                    style={{ maxWidth: '85%', maxHeight: '200px', objectFit: 'contain' }}
                  />
                </div>

                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    {quickViewProduct.name}
                  </h2>
                  <div className="flex" style={{ gap: '6px', color: '#f59e0b', fontSize: '0.9rem', fontWeight: '800', marginBottom: '1rem' }}>
                    <Star size={16} fill="#f59e0b" /> 4.8 Rating • 120+ Reviews
                  </div>

                  <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    100% natural, certified pesticide-safe produce sourced directly from contracted organic farms. Carefully packaged to retain maximum crispness and nutrients.
                  </p>

                  <div className="flex-between" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '16px' }}>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Price per pack</p>
                      <p style={{ fontSize: '1.6rem', fontWeight: '900', color: '#16a34a' }}>
                        ₹{quickViewProduct.price}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#15803d' }}>
                      ● In Stock Ready to Ship
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(quickViewProduct);
                      setQuickViewProduct(null);
                      openCart();
                    }}
                    className="btn-primary"
                    style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontSize: '1rem' }}
                  >
                    Add to Basket
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. "HOW IT WORKS" MODAL */}
      <AnimatePresence>
        {isHowItWorksOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.25rem',
              overflowY: 'auto'
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHowItWorksOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(6px)',
                cursor: 'pointer'
              }}
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '620px',
                maxHeight: '88vh',
                overflowY: 'auto',
                background: 'white',
                borderRadius: '28px',
                padding: '2.5rem',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
                margin: 'auto'
              }}
            >
              <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0f172a' }}>How FreshCart Works</h3>
                <button 
                  onClick={() => setIsHowItWorksOpen(false)}
                  style={{ background: '#f1f5f9', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid" style={{ gap: '1.5rem' }}>
                {[
                  { step: "01", title: "Select Your Daily Groceries", desc: "Choose from hand-harvested vegetables, fresh dairy, and pantry essentials." },
                  { step: "02", title: "Quality Check & Rapid Pack", desc: "Our local micro-fulfillment center carefully inspects and packs your items in insulated containers." },
                  { step: "03", title: "15-Minute Doorstep Delivery", desc: "Our delivery partner delivers right to your door with live status and contact support." }
                ].map((item, idx) => (
                  <div key={idx} className="flex" style={{ gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ background: '#16a34a', color: 'white', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0 }}>
                      {item.step}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>{item.title}</h4>
                      <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: '1.5' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setIsHowItWorksOpen(false)}
                className="btn-primary" 
                style={{ width: '100%', marginTop: '2rem', padding: '0.9rem', borderRadius: '14px' }}
              >
                Got It, Let's Shop
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Home;
