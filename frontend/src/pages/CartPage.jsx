import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Minus, Plus, CreditCard, ChevronRight, Package, AlertCircle, MapPin, Navigation, CheckCircle2, Phone, User as UserIcon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, default as api } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE, getProductFallbackImage } from '../utils/imageUtils';

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
          // Free OpenStreetMap reverse geocoding
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

    // Validate delivery destination
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

        // --- RAZORPAY FLOW ---
        const res = await api.post('/payment/create-order', { amount: totalPrice });
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
                totalPrice,
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
            color: "#10b981",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
          alert("Payment Failed: " + response.error.description);
          setLoading(false);
        });
        rzp.open();
      } else {
        // --- CASH ON DELIVERY FLOW ---
        const orderData = {
          userId: user.id || user._id,
          products: cart.map(item => ({ productId: item._id, quantity: item.quantity })),
          totalPrice,
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

  if (success) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '10rem', paddingBottom: '4rem' }}>
        <div style={{ background: 'var(--primary)', color: 'white', display: 'inline-flex', padding: '1.5rem', borderRadius: '50%', marginBottom: '2rem' }}>
          <Package size={64} />
        </div>
        <h2 className="heading-xl" style={{ fontSize: '3rem' }}>Order Placed Successfully!</h2>
        <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '1.5rem' }}>
          Your groceries are being packed and will be delivered to:
        </p>
        <div style={{ background: '#f8fafc', padding: '1.2rem 2rem', borderRadius: '16px', display: 'inline-block', marginBottom: '2.5rem', textAlign: 'left', border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: '800', color: 'var(--dark)' }}>📍 {deliveryAddress.street}, {deliveryAddress.city} - {deliveryAddress.pincode}</div>
          <div style={{ color: 'var(--gray)', fontSize: '0.9rem', marginTop: '4px' }}>Recipient: {deliveryAddress.fullName} • Phone: {deliveryAddress.phone}</div>
        </div>
        <br />
        <div className="flex" style={{ justifyContent: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/orders')} className="btn-primary" style={{ padding: '0.9rem 2.2rem' }}>Track My Order</button>
          <button onClick={() => navigate('/')} style={{ padding: '0.9rem 2.2rem', borderRadius: '12px', background: '#f1f5f9', fontWeight: '700' }}>Continue Shopping</button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '10rem', paddingBottom: '4rem' }}>
        <ShoppingCart size={100} style={{ color: '#cbd5e1', marginBottom: '2rem' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>Your cart is empty</h2>
        <p style={{ color: '#888', marginBottom: '2rem' }}>Looks like you haven't added anything yet.</p>
        <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '1rem 3rem' }}>Browse Products</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '7rem', paddingBottom: '4rem' }}>
      <div className="flex-between mobile-stack" style={{ marginBottom: '3rem' }}>
        <div>
          <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Checkout & Delivery</h2>
          <p style={{ color: '#888' }}>Review your items and set your delivery location</p>
        </div>
        <button onClick={clearCart} style={{ color: '#e74c3c', fontWeight: '700', background: 'none' }}>Empty Cart</button>
      </div>

      <div className="grid responsive-grid" style={{ gridTemplateColumns: '1.8fr 1.2fr', alignItems: 'start', gap: '2.5rem' }}>
        
        <div className="grid" style={{ gap: '2rem' }}>
          {/* Delivery Location Section */}
          <div id="delivery-section" className="card" style={{ padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '1.2rem', background: 'white' }}>
            <div className="flex-between mobile-stack" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
              <div className="flex" style={{ gap: '10px' }}>
                <div style={{ background: '#ecfdf5', color: '#059669', padding: '8px', borderRadius: '10px' }}>
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--dark)' }}>Delivery Location</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Where should we deliver your order?</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f0fdf4',
                  color: '#059669',
                  border: '1px solid #bbf7d0',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                <Navigation size={14} className={detectingLocation ? 'animate-spin' : ''} />
                {detectingLocation ? 'Detecting GPS...' : 'Use Current Location'}
              </button>
            </div>

            {locationSuccessMsg && (
              <div style={{ background: '#ecfdf5', color: '#059669', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
                <CheckCircle2 size={16} /> {locationSuccessMsg}
              </div>
            )}

            {validationError && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
                <AlertCircle size={16} /> {validationError}
              </div>
            )}

            <div className="grid" style={{ gap: '1rem' }}>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>Recipient Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={deliveryAddress.fullName}
                    onChange={handleAddressChange}
                    placeholder="e.g. Sonu Mandal"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>Mobile Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={deliveryAddress.phone}
                    onChange={handleAddressChange}
                    placeholder="10-digit phone number"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>House / Flat / Building / Street Address *</label>
                <input
                  type="text"
                  name="street"
                  value={deliveryAddress.street}
                  onChange={handleAddressChange}
                  placeholder="e.g. Flat 302, Palm Heights, MG Road"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={deliveryAddress.city}
                    onChange={handleAddressChange}
                    placeholder="City"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>State</label>
                  <input
                    type="text"
                    name="state"
                    value={deliveryAddress.state}
                    onChange={handleAddressChange}
                    placeholder="State"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={deliveryAddress.pincode}
                    onChange={handleAddressChange}
                    placeholder="Postal Code"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>Landmark / Instructions (Optional)</label>
                <input
                  type="text"
                  name="landmark"
                  value={deliveryAddress.landmark}
                  onChange={handleAddressChange}
                  placeholder="e.g. Near Community Park, ring bell twice"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="grid" style={{ gap: '1rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Your Groceries ({cart.length})</h3>
            {cart.map(item => (
              <div key={item._id} className="card flex-between mobile-stack" style={{ padding: '1.2rem', alignItems: 'center' }}>
                <div className="flex" style={{ gap: '1.5rem' }}>
                  <div style={{ background: '#f8f8f8', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {item.image ? (
                      <img 
                        src={getImageUrl(item.image, item.name, item.category)} 
                        alt={item.name} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getProductFallbackImage(item.name, item.category);
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <Package size={32} style={{ color: 'var(--primary)' }} />
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '2px' }}>{item.name}</h3>
                    <p style={{ color: '#888', fontSize: '0.85rem' }}>{item.category}</p>
                  </div>
                </div>

                <div className="flex mobile-stack" style={{ gap: '2rem', width: '100%', justifyContent: 'space-between' }}>
                  <div className="flex" style={{ background: '#f8f8f8', borderRadius: '30px', padding: '4px' }}>
                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ background: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)' }}>
                      <Minus size={14} />
                    </button>
                    <span style={{ margin: '0 1.2rem', fontWeight: '800' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ background: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)' }}>
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  <div style={{ textAlign: 'right', minWidth: '80px' }}>
                    <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>₹{(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item._id)} style={{ color: '#e74c3c', marginTop: '4px', background: 'none', padding: 0 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary & Payment */}
        <div className="card" style={{ position: 'sticky', top: '100px', border: '1px solid #eee' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.5rem' }}>Order Summary</h3>
          
          {/* Payment Method Selection */}
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontWeight: '800', fontSize: '0.95rem', marginBottom: '0.8rem' }}>Payment Method</p>
            <div className="grid" style={{ gap: '0.8rem' }}>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  border: `2px solid ${paymentMethod === 'cod' ? 'var(--primary)' : '#eee'}`,
                  background: paymentMethod === 'cod' ? '#f0fdf4' : 'white',
                  cursor: 'pointer',
                  transition: '0.3s'
                }}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  checked={paymentMethod === 'cod'} 
                  onChange={() => setPaymentMethod('cod')}
                  style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                />
                <div>
                  <p style={{ fontWeight: '800', fontSize: '0.95rem' }}>Cash on Delivery</p>
                  <p style={{ fontSize: '0.8rem', color: '#888' }}>Pay cash when delivery arrives</p>
                </div>
              </label>

              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  border: `2px solid ${paymentMethod === 'razorpay' ? 'var(--primary)' : '#eee'}`,
                  background: paymentMethod === 'razorpay' ? '#f0fdf4' : 'white',
                  cursor: 'pointer',
                  transition: '0.3s'
                }}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  checked={paymentMethod === 'razorpay'} 
                  onChange={() => setPaymentMethod('razorpay')}
                  style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                />
                <div>
                  <p style={{ fontWeight: '800', fontSize: '0.95rem' }}>Online Payment</p>
                  <p style={{ fontSize: '0.8rem', color: '#888' }}>UPI, Cards, NetBanking (Razorpay)</p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid" style={{ gap: '1rem' }}>
            <div className="flex-between">
              <span style={{ color: '#888' }}>Items Total</span>
              <span style={{ fontWeight: '700' }}>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex-between">
              <span style={{ color: '#888' }}>15-Min Delivery</span>
              <span style={{ color: 'var(--primary)', fontWeight: '700' }}>Free</span>
            </div>
            <div className="flex-between">
              <span style={{ color: '#888' }}>Taxes</span>
              <span style={{ fontWeight: '700' }}>₹0.00</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
            <div className="flex-between" style={{ fontSize: '1.3rem' }}>
              <span style={{ fontWeight: '800' }}>To Pay</span>
              <span style={{ fontWeight: '800', color: 'var(--primary)' }}>₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%', marginTop: '2rem', padding: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.05rem' }}
          >
            {loading ? 'Processing Order...' : (
              <>
                {paymentMethod === 'cod' ? <Package size={20} /> : <CreditCard size={20} />} 
                {paymentMethod === 'cod' ? 'Place COD Order' : 'Pay & Complete Order'} 
                <ChevronRight size={18} />
              </>
            )}
          </button>

          {!user && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#eef2ff', borderRadius: '12px', display: 'flex', gap: '10px', color: '#4338ca', fontSize: '0.9rem' }}>
              <AlertCircle size={18} />
              <p>Please <strong>log in</strong> to complete your purchase.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;
