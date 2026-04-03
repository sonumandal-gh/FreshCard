import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Minus, Plus, CreditCard, ChevronRight, Package, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, default as api } from '../api/api';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); 

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (cart.length === 0) return;

    setLoading(true);
    try {
      if (paymentMethod === 'razorpay') {
        // --- RAZORPAY FLOW ---
        const res = await api.post('/payment/create-order', { amount: totalPrice });
        const { order } = res.data;

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY_ID', 
          amount: order.amount,
          currency: order.currency,
          name: "FreshCart",
          description: "Grocery Purchase",
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
                signature: response.razorpay_signature
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
            name: user.name,
            email: user.email,
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
          paymentMethod: 'cod'
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
        <h2 className="heading-xl" style={{ fontSize: '3rem' }}>Order Placed!</h2>
        <p style={{ fontSize: '1.2rem', color: '#888', marginBottom: '3rem' }}>Your groceries are being packed and will reach you shortly.</p>
        <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '1rem 3rem' }}>Continue Shopping</button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '10rem', paddingBottom: '4rem' }}>
        <ShoppingCart size={100} style={{ color: '#ddd', marginBottom: '2rem' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>Your cart is empty</h2>
        <p style={{ color: '#888', marginBottom: '2rem' }}>Looks like you haven't added anything yet.</p>
        <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '1rem 3rem' }}>Browse Products</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '7rem', paddingBottom: '4rem' }}>
      <div className="flex-between" style={{ marginBottom: '3rem' }}>
        <div>
          <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Shopping Cart</h2>
          <p style={{ color: '#888' }}>You have {cart.length} items in your cart</p>
        </div>
        <button onClick={clearCart} style={{ color: '#e74c3c', fontWeight: '700', background: 'none' }}>Empty Cart</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start', gap: '3rem' }}>
        {/* Cart Items */}
        <div className="grid" style={{ gap: '1.5rem' }}>
          {cart.map(item => (
            <div key={item._id} className="card flex-between" style={{ padding: '1.2rem' }}>
              <div className="flex" style={{ gap: '1.5rem' }}>
                <div style={{ background: '#f8f8f8', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Package size={32} style={{ color: 'var(--primary)' }} />
                  )}
                </div>
                <div>
                  <h3 style={{ fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>{item.name}</h3>
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>{item.category}</p>
                </div>
              </div>

              <div className="flex" style={{ gap: '3rem' }}>
                <div className="flex" style={{ background: '#f8f8f8', borderRadius: '30px', padding: '4px' }}>
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ background: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)' }}>
                    <Minus size={14} />
                  </button>
                  <span style={{ margin: '0 1.5rem', fontWeight: '800' }}>{item.quantity}</span>
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

        {/* Order Summary */}
        <div className="card" style={{ position: 'sticky', top: '100px', border: '1px solid #eee' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '2rem' }}>Order Summary</h3>
          
          {/* Payment Method Selection */}
          <div style={{ marginBottom: '2.5rem' }}>
            <p style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '1rem' }}>Choose Payment Method</p>
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
                  <p style={{ fontWeight: '800', fontSize: '1rem' }}>Cash on Delivery</p>
                  <p style={{ fontSize: '0.85rem', color: '#888' }}>Pay when you receive your order</p>
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
                  <p style={{ fontWeight: '800', fontSize: '1rem' }}>Online Payment</p>
                  <p style={{ fontSize: '0.85rem', color: '#888' }}>Pay securely via Razorpay</p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid" style={{ gap: '1.2rem' }}>
            <div className="flex-between">
              <span style={{ color: '#888' }}>Subtotal</span>
              <span style={{ fontWeight: '700' }}>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex-between">
              <span style={{ color: '#888' }}>Shipping</span>
              <span style={{ color: 'var(--primary)', fontWeight: '700' }}>Free</span>
            </div>
            <div className="flex-between">
              <span style={{ color: '#888' }}>Estimated Tax</span>
              <span style={{ fontWeight: '700' }}>₹0.00</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
            <div className="flex-between" style={{ fontSize: '1.4rem' }}>
              <span style={{ fontWeight: '800' }}>Total</span>
              <span style={{ fontWeight: '800', color: 'var(--primary)' }}>₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%', marginTop: '2.5rem', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '1.1rem' }}
          >
            {loading ? 'Processing...' : (
              <>
                {paymentMethod === 'cod' ? <Package size={20} /> : <CreditCard size={20} />} 
                {paymentMethod === 'cod' ? 'Place COD Order' : 'Pay & Checkout'} 
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
