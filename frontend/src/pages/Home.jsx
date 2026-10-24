import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Package, Star, ArrowRight, TrendingUp, ShieldCheck, Zap, MapPin, Navigation, Check } from 'lucide-react';
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
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Admin ko redirect karo admin dashboard pe
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    productAPI.getAll()
      .then(res => {
        setProducts(res.data.products);
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

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="home-page" style={{ paddingBottom: '5rem', background: 'linear-gradient(to bottom, #0f172a 0%, #020617 100%)', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section className="hero" style={{ 
        position: 'relative',
        background: 'transparent', 
        color: 'white', 
        padding: 'clamp(4rem, 10vw, 7rem) 0 clamp(4rem, 10vw, 7rem)', 
        overflow: 'hidden',
        marginBottom: '1rem'
      }}>
        {/* Background Gradients */}
        <div style={{ 
          position: 'absolute', top: '-20%', right: '-5%', 
          width: '500px', height: '500px', 
          background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 0.4
        }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}
          >
            <span style={{ 
              display: 'inline-block',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              color: 'var(--primary)',
              padding: '0.4rem 1.2rem',
              borderRadius: '2rem',
              fontWeight: '700',
              fontSize: '0.8rem',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}> ✨ Fresh Arrivals Every Morning</span>
            
            <h1 style={{ 
              fontSize: 'clamp(2.5rem, 6vw, 4rem)', 
              fontWeight: '900', 
              lineHeight: 1.1,
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, #fff 0%, #a5f3fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em'
            }}>
              Freshness You Can <span style={{ color: 'var(--primary)', WebkitTextFillColor: 'initial' }}>Taste.</span>
            </h1>
            
            <p style={{ fontSize: '1.1rem', marginBottom: '2.5rem', opacity: 0.7, maxWidth: '550px', margin: '0 auto 2.5rem', fontWeight: '400', color: 'rgba(255,255,255,0.8)' }}>
              Premium ingredients from local farmers delivered to your doorstep in 15 minutes.
            </p>
            
            <div className="flex hero-buttons" style={{ gap: '1rem', justifyContent: 'center' }}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary" 
                style={{ height: '54px', padding: '0 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Shop Now <ArrowRight size={18} />
              </motion.button>
              <button style={{ height: '54px', padding: '0 1.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontWeight: '600', fontSize: '0.95rem' }}>
                How It Works
              </button>
            </div>
          </motion.div>
        </div>

        {/* Compact Stats */}
        <div className="container hero-stats" style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', width: '100%', zIndex: 1 }}>
          <div className="flex" style={{ justifyContent: 'center', gap: '2rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
             <div className="flex" style={{ gap: '6px' }}><TrendingUp size={14} color="var(--primary)" /> Fast Delivery</div>
             <div className="flex" style={{ gap: '6px' }}><ShieldCheck size={14} color="var(--primary)" /> 100% Organic</div>
             <div className="flex" style={{ gap: '6px' }}><Zap size={14} color="var(--primary)" /> Instant Help</div>
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
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '1.5rem',
            padding: '1.2rem 1.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)'
          }}
        >
          <div className="flex" style={{ gap: '14px', alignItems: 'center' }}>
            <div style={{ background: '#10b981', color: 'white', padding: '12px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.5)' }}>
              <MapPin size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                ⚡ Delivering in 15 Minutes To:
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'white' }}>
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
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1.5px solid #10b981',
              color: '#34d399',
              fontWeight: '800',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Navigation size={18} className={detectingGps ? 'animate-spin' : ''} />
            {detectingGps ? 'Detecting GPS...' : 'Detect GPS Location'}
          </button>
        </motion.div>

        {/* Category Navigation */}
        <div 
          className="scroll-x category-bar"
          style={{ 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)', 
          backdropFilter: 'blur(20px)',
          padding: '1.2rem', 
          borderRadius: '2rem', 
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '4rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.8rem 2rem',
                borderRadius: '1.2rem',
                fontSize: '0.95rem',
                fontWeight: '700',
                background: activeCategory === cat ? 'linear-gradient(135deg, var(--primary), hsla(var(--primary-h), 80%, 40%, 1))' : 'transparent',
                color: activeCategory === cat ? 'white' : 'var(--gray)',
                boxShadow: activeCategory === cat ? '0 10px 20px -5px var(--primary-glow)' : 'none',
                border: activeCategory === cat ? 'none' : '1px solid #e2e8f0',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
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
          ) : (
            <motion.div 
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid" 
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', rowGap: '3rem', columnGap: '2rem' }}
            >
              {filteredProducts.map(product => (
                <motion.div 
                  key={product._id} 
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="premium-card" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    padding: '0', 
                    overflow: 'hidden', 
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderTop: '1px solid rgba(255,255,255,0.2)',
                    borderLeft: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '1.2rem', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), inset 0 -2px 10px rgba(0,0,0,0.2)' 
                  }}
                >
                  <div style={{ position: 'relative', height: '180px', background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1), transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                     <div style={{ 
                        background: 'linear-gradient(135deg, var(--primary), #10b981)', 
                        padding: '0.6rem 1rem', 
                        borderRadius: '1rem', 
                        position: 'absolute', 
                        top: '1rem', 
                        right: '1rem', 
                        boxShadow: '0 10px 20px rgba(16, 185, 129, 0.4), inset 0 1px 1px rgba(255,255,255,0.5)',
                        fontWeight: '900',
                        color: 'white',
                        zIndex: 2,
                        fontSize: '0.9rem',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                     }}>
                        ₹{product.price.toFixed(2)}
                     </div>
                     <motion.img 
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        src={getImageUrl(product.image, product.name, product.category)} 
                        alt={product.name} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getProductFallbackImage(product.name, product.category);
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} 
                     />
                  </div>

                  <div style={{ padding: '2rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.8rem' }}>
                       <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {product.category}
                       </span>
                       <div className="flex" style={{ gap: '6px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <Star size={14} fill="#fbbf24" stroke="none" />
                          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'white' }}>4.8</span>
                       </div>
                    </div>
                    
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.5rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{product.name}</h3>
                    
                    <div className="flex-between">
                       <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: '600' }}>In stock: <span style={{ color: product.stock < 10 ? 'var(--error)' : 'white' }}>{product.stock}</span></span>
                       <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => addToCart(product)}
                          className="btn-primary" 
                          style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <ShoppingCart size={18} /> Add
                       </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default Home;
