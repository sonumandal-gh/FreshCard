import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Trash2, Minus, Plus, CreditCard, ChevronRight, 
  Package, AlertCircle, MapPin, Navigation, CheckCircle2, Phone, 
  User as UserIcon, ShieldCheck, Truck, Sparkles, ArrowRight, Banknote
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, default as api } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE, getProductFallbackImage } from '../utils/imageUtils';
import { getDeliverySettings, syncDeliverySettings } from '../utils/settingsUtils';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); 

  // Delivery Address State
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    lat: null,
    lng: null
  });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState('');
  const [validationError, setValidationError] = useState('');

  // Dynamic store delivery settings
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

  const FREE_DELIVERY_THRESHOLD = deliverySettings.freeDeliveryThreshold;
  const isFreeDelivery = deliverySettings.isFreeDeliveryEnabled && totalPrice >= FREE_DELIVERY_THRESHOLD;
  const deliveryCharge = isFreeDelivery ? 0 : deliverySettings.standardDeliveryCharge;
  const grandTotal = totalPrice + deliveryCharge;
  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - totalPrice);
  const deliveryProgress = FREE_DELIVERY_THRESHOLD > 0 
    ? Math.min(100, Math.round((totalPrice / FREE_DELIVERY_THRESHOLD) * 100))
    : 100;

  // Load saved address or user profile address
  useEffect(() => {
    try {
      const saved = localStorage.getItem('freshcart_delivery_address');
      let parsed = {};
      if (saved) {
        try { parsed = JSON.parse(saved); } catch (err) {}
      }

      setDeliveryAddress(prev => ({
        ...prev,
        fullName: parsed.fullName || user?.name || prev.fullName || '',
        phone: parsed.phone || user?.phone || prev.phone || '',
        street: parsed.street || user?.address || prev.street || '',
        city: parsed.city || user?.city || prev.city || '',
        state: parsed.state || user?.state || prev.state || '',
        pincode: parsed.pincode || user?.pincode || prev.pincode || '',
        landmark: parsed.landmark || prev.landmark || '',
        lat: parsed.lat || prev.lat || null,
        lng: parsed.lng || prev.lng || null
      }));
    } catch (e) {
      console.warn("Failed to read saved address:", e);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  // GPS Current Location Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);
    setLocationSuccessMsg('');
    setValidationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const addr = data.address || {};

          const detectedStreet = [
            addr.road || addr.suburb || addr.neighbourhood || addr.residential || '',
            addr.suburb || ''
          ].filter(Boolean).join(', ');

          const detectedCity = addr.city || addr.town || addr.village || addr.county || addr.state_district || 'City';
          const detectedState = addr.state || '';
          const detectedPincode = addr.postcode || '';

          setDeliveryAddress(prev => {
            const updated = {
              ...prev,
              street: detectedStreet || prev.street || data.display_name?.split(',').slice(0, 2).join(',') || '',
              city: detectedCity || prev.city,
              state: detectedState || prev.state,
              pincode: detectedPincode || prev.pincode,
              lat: latitude,
              lng: longitude
            };
            try {
              localStorage.setItem('freshcart_delivery_address', JSON.stringify(updated));
              window.dispatchEvent(new Event('freshcart_address_updated'));
            } catch (err) {}
            return updated;
          });

          setLocationSuccessMsg(`Location detected: ${detectedCity} (${detectedPincode || 'GPS Tagged'})`);
          setTimeout(() => setLocationSuccessMsg(''), 4000);
        } catch (err) {
          console.warn("Reverse geocode failed, using coordinates:", err);
          setDeliveryAddress(prev => ({
            ...prev,
            lat: latitude,
            lng: longitude
          }));
          setLocationSuccessMsg("GPS Coordinates saved. Please type your street name & city.");
          setTimeout(() => setLocationSuccessMsg(''), 4000);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        console.error("Geolocation error:", error);
        alert("Could not access your location. Please check browser permissions or enter manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setDeliveryAddress(prev => {
      const updated = { ...prev, [name]: value };
      try {
        localStorage.setItem('freshcart_delivery_address', JSON.stringify(updated));
        window.dispatchEvent(new Event('freshcart_address_updated'));
      } catch (err) {}
      return updated;
    });
    if (validationError) setValidationError('');
  };

  const validateAddress = () => {
    if (!deliveryAddress.fullName.trim()) {
      setValidationError('Please provide the recipient’s full name.');
      return false;
    }
    if (!deliveryAddress.phone.trim() || deliveryAddress.phone.trim().length < 10) {
      setValidationError('Please enter a valid 10-digit mobile number for delivery updates.');
      return false;
    }
    if (!deliveryAddress.street.trim()) {
      setValidationError('Please enter your house/flat number and street address.');
      return false;
    }
    if (!deliveryAddress.city.trim()) {
      setValidationError('Please specify your delivery city.');
      return false;
    }
    if (!deliveryAddress.pincode.trim()) {
      setValidationError('Please provide your 6-digit postal pincode.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (cart.length === 0) return;

    if (!validateAddress()) {
      const el = document.getElementById('delivery-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === 'razorpay') {
        if (!window.Razorpay) {
          alert("Razorpay payment gateway failed to load. Please check your internet connection.");
          setLoading(false);
          return;
        }

        // Razorpay create order endpoint
        const res = await api.post('/payment/create-order', { amount: grandTotal });
        const { order, key } = res.data;

        const options = {
          key: key || import.meta.env.VITE_RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY_ID', 
          amount: order.amount,
          currency: order.currency,
          name: "FreshCart",
          description: "Grocery Order Delivery",
          order_id: order.id,
          handler: async (response) => {
            try {
              const orderData = {
                userId: user.id || user._id,
                products: cart.map(item => ({ productId: item._id, quantity: item.quantity })),
                totalPrice: grandTotal,
                paymentMethod: 'razorpay',
                paymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                deliveryAddress
              };
              
              await orderAPI.create(orderData);
              setSuccess(true);
              clearCart();
            } catch (err) {
              console.error("Order save error:", err);
              alert("Payment successful but order creation failed. Please contact support.");
            }
          },
          prefill: {
            name: deliveryAddress.fullName || user.name,
            email: user.email,
            contact: deliveryAddress.phone || ''
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
            }
          },
          theme: {
            color: "#16a34a",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
          alert("Payment Failed: " + response.error.description);
          setLoading(false);
        });
        rzp.open();
      } else {
        // Cash on Delivery
        const orderData = {
          userId: user.id || user._id,
          products: cart.map(item => ({ productId: item._id, quantity: item.quantity })),
          totalPrice: grandTotal,
          paymentMethod: 'cod',
          deliveryAddress
        };
        
        await orderAPI.create(orderData);
        setSuccess(true);
        clearCart();
      }

    } catch (err) {
      console.error("Checkout error:", err);
      alert(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      if (paymentMethod === 'cod') setLoading(false);
    }
  };

  // Success Confirmation Screen
  if (success) {
    return (
      <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem', background: '#f8fbf9' }}>
        <div 
          style={{ 
            maxWidth: '560px', 
            width: '100%', 
            background: 'white', 
            borderRadius: '28px', 
            padding: '3rem 2rem', 
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(22, 163, 74, 0.15)'
          }}
        >
          <div 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: '#dcfce7', 
              color: '#16a34a', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 25px rgba(22, 163, 74, 0.2)'
            }}
          >
            <CheckCircle2 size={44} />
          </div>

          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Order Confirmed
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em', marginTop: '4px', marginBottom: '1rem' }}>
            Freshness on the Way!
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            Your grocery harvest is being packed at our nearest micro-hub and will arrive at your doorstep in 15-30 minutes.
          </p>

          <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '18px', textAlign: 'left', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
              Delivering To
            </p>
            <p style={{ fontWeight: '800', color: '#0f172a', fontSize: '1rem', marginTop: '2px' }}>
              {deliveryAddress.street}, {deliveryAddress.city} - {deliveryAddress.pincode}
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
              Recipient: {deliveryAddress.fullName} • 📞 {deliveryAddress.phone}
            </p>
          </div>

          <div className="flex" style={{ gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/orders')} className="btn-primary" style={{ padding: '0.9rem 2rem', borderRadius: '14px' }}>
              Track My Order <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate('/')} className="btn-secondary" style={{ padding: '0.9rem 1.8rem', borderRadius: '14px' }}>
              Shop More
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty Cart Screen
  if (cart.length === 0) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem', background: '#f8fbf9' }}>
        <div style={{ textAlign: 'center', maxWidth: '440px' }}>
          <div style={{ background: '#f0fdf4', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#16a34a' }}>
            <ShoppingCart size={48} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Your Basket is Empty
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
            Explore our daily farm produce, dairy, bakery, and snacks to start filling your basket.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '0.9rem 2.2rem', borderRadius: '14px' }}>
            Explore Fresh Groceries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fbf9', padding: '6.5rem 0 5rem' }}>
      <div className="container">
        
        {/* Header Breadcrumb / Title */}
        <div className="flex-between mobile-stack" style={{ marginBottom: '2.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#16a34a', letterSpacing: '0.05em' }}>
              Checkout & Delivery
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em' }}>
              Review Your Basket
            </h1>
          </div>
          <button 
            onClick={clearCart} 
            style={{ 
              background: '#fee2e2', 
              color: '#dc2626', 
              padding: '8px 16px', 
              borderRadius: '12px', 
              fontSize: '0.85rem', 
              fontWeight: '700' 
            }}
          >
            Clear Entire Basket
          </button>
        </div>

        {/* Free Delivery Meter */}
        <div 
          style={{ 
            background: 'white', 
            borderRadius: '20px', 
            padding: '1.25rem 1.8rem', 
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)', 
            border: '1px solid rgba(0,0,0,0.05)',
            marginBottom: '2rem' 
          }}
        >
          <div className="flex-between" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} color="#16a34a" />
              {isFreeDelivery 
                ? '🎉 Congratulations! You have unlocked FREE Express Delivery!' 
                : `Add ₹${amountNeededForFreeDelivery.toFixed(0)} more to get FREE Delivery!`}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#16a34a' }}>
              {deliveryProgress}%
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${deliveryProgress}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #16a34a, #22c55e)', 
                borderRadius: '10px',
                transition: 'width 0.4s ease'
              }} 
            />
          </div>
        </div>

        {/* 2-Column Split: Left (Cart Items & Address) | Right (Bill Summary & Pay) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Items list + Delivery Address Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* 1. Basket Items Card */}
            <div style={{ background: 'white', borderRadius: '24px', padding: '1.8rem', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a', marginBottom: '1.2rem' }}>
                Basket Items ({cart.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cart.map((item) => (
                  <div 
                    key={item._id}
                    className="flex-between"
                    style={{ 
                      padding: '1rem', 
                      background: '#f8fafc', 
                      borderRadius: '16px', 
                      border: '1px solid #f1f5f9',
                      gap: '1rem'
                    }}
                  >
                    <div className="flex" style={{ gap: '12px', flex: 1 }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '4px' }}>
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
                        <h4 style={{ fontSize: '0.98rem', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                          {item.name}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                          ₹{item.price} / unit
                        </p>
                      </div>
                    </div>

                    {/* Stepper + Total */}
                    <div className="flex" style={{ gap: '1rem' }}>
                      <div className="flex" style={{ background: 'white', borderRadius: '12px', padding: '2px 4px', border: '1px solid #e2e8f0', gap: '6px' }}>
                        <button 
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem', minWidth: '18px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '60px' }}>
                        <span style={{ fontWeight: '900', fontSize: '1.05rem', color: '#0f172a' }}>
                          ₹{(item.price * item.quantity).toFixed(0)}
                        </span>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item._id)}
                        style={{ color: '#ef4444', background: 'none', padding: '4px' }}
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Delivery Address Card */}
            <div 
              id="delivery-section"
              style={{ 
                background: 'white', 
                borderRadius: '24px', 
                padding: '1.8rem', 
                border: '1px solid rgba(0,0,0,0.05)', 
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)' 
              }}
            >
              <div className="flex-between" style={{ marginBottom: '1.2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={20} color="#16a34a" /> Delivery Address
                </h3>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  style={{
                    background: '#f0fdf4',
                    color: '#16a34a',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid #bbf7d0'
                  }}
                >
                  <Navigation size={14} />
                  {detectingLocation ? 'Detecting GPS...' : 'Auto-Fill Location'}
                </button>
              </div>

              {locationSuccessMsg && (
                <div style={{ background: '#ecfdf5', color: '#065f46', padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem' }}>
                  {locationSuccessMsg}
                </div>
              )}

              {validationError && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {validationError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={deliveryAddress.fullName}
                    onChange={handleAddressChange}
                    placeholder="Full name"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={deliveryAddress.phone}
                    onChange={handleAddressChange}
                    placeholder="10-digit mobile number"
                    maxLength={13}
                    required
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    House / Flat No., Street, Area *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={deliveryAddress.street}
                    onChange={handleAddressChange}
                    placeholder="Flat 402, Green Meadows, 5th Main"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={deliveryAddress.city}
                    onChange={handleAddressChange}
                    placeholder="City"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Postal Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={deliveryAddress.pincode}
                    onChange={handleAddressChange}
                    placeholder="e.g. 560066"
                    maxLength={6}
                    required
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Landmark / Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={deliveryAddress.landmark}
                    onChange={handleAddressChange}
                    placeholder="Nearby metro, apartment gate, or landmark"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Payment Method & Order Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* 1. Payment Options Card */}
            <div style={{ background: 'white', borderRadius: '24px', padding: '1.8rem', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a', marginBottom: '1.2rem' }}>
                Payment Method
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Razorpay Option */}
                <label
                  onClick={() => setPaymentMethod('razorpay')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '1.2rem',
                    borderRadius: '16px',
                    border: `2px solid ${paymentMethod === 'razorpay' ? '#16a34a' : '#e2e8f0'}`,
                    background: paymentMethod === 'razorpay' ? '#f0fdf4' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div className="flex-between">
                      <span style={{ fontWeight: '800', fontSize: '0.98rem', color: '#0f172a' }}>
                        Razorpay Secure Checkout
                      </span>
                      <CreditCard size={20} color="#16a34a" />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      UPI (Google Pay, PhonePe, Paytm), Cards & Net Banking
                    </p>
                  </div>
                </label>

                {/* Cash on Delivery Option */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '1.2rem',
                    borderRadius: '16px',
                    border: `2px solid ${paymentMethod === 'cod' ? '#16a34a' : '#e2e8f0'}`,
                    background: paymentMethod === 'cod' ? '#f0fdf4' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div className="flex-between">
                      <span style={{ fontWeight: '800', fontSize: '0.98rem', color: '#0f172a' }}>
                        Cash on Delivery (COD)
                      </span>
                      <Banknote size={20} color="#16a34a" />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      Pay securely with cash or UPI at your door
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 2. Order Summary Card */}
            <div style={{ background: 'white', borderRadius: '24px', padding: '1.8rem', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a', marginBottom: '1.2rem' }}>
                Bill Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem' }}>
                <div className="flex-between" style={{ color: '#475569' }}>
                  <span>Item Total</span>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{totalPrice.toFixed(2)}</span>
                </div>

                <div className="flex-between" style={{ color: '#475569' }}>
                  <span>Delivery Charge</span>
                  <span style={{ fontWeight: '700', color: isFreeDelivery ? '#16a34a' : '#0f172a' }}>
                    {isFreeDelivery ? 'FREE' : `₹${deliveryCharge}`}
                  </span>
                </div>

                <div className="flex-between" style={{ color: '#475569' }}>
                  <span>Handling & Packaging</span>
                  <span style={{ fontWeight: '700', color: '#16a34a' }}>FREE</span>
                </div>

                <div style={{ height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }} />

                <div className="flex-between" style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>
                  <span>Grand Total</span>
                  <span style={{ color: '#16a34a' }}>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Promise */}
              <div 
                style={{ 
                  background: '#f8fafc', 
                  borderRadius: '14px', 
                  padding: '10px 14px', 
                  marginTop: '1.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '0.78rem', 
                  color: '#64748b', 
                  fontWeight: '600' 
                }}
              >
                <ShieldCheck size={18} color="#16a34a" />
                <span>100% Safe & Encrypted Payments • Freshness Guaranteed</span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                  padding: '1.1rem',
                  borderRadius: '16px',
                  fontSize: '1.05rem',
                  fontWeight: '800'
                }}
              >
                {loading ? 'Processing Order...' : `Place Order • ₹${grandTotal.toFixed(0)}`}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default CartPage;
