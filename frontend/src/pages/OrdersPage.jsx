import React, { useState, useEffect } from 'react';
import { orderAPI } from '../api/api';
import { 
  Package, Clock, CheckCircle2, XCircle, ChevronRight, 
  AlertCircle, MapPin, Phone, Truck, ShieldCheck, ArrowRight,
  ShoppingBag, Calendar, CreditCard, Banknote
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE, getProductFallbackImage } from '../utils/imageUtils';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    orderAPI.getUserOrders()
      .then(res => {
        setOrders(res.data.data || []);
      })
      .catch(err => {
        setError('Failed to load your orders.');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, navigate]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return { 
          color: '#16a34a', 
          bg: '#f0fdf4', 
          border: '#bbf7d0',
          label: 'Delivered', 
          icon: <CheckCircle2 size={16} /> 
        };
      case 'cancelled':
        return { 
          color: '#ef4444', 
          bg: '#fef2f2', 
          border: '#fecaca',
          label: 'Cancelled', 
          icon: <XCircle size={16} /> 
        };
      default: // pending / processing / out for delivery
        return { 
          color: '#d97706', 
          bg: '#fffbeb', 
          border: '#fde68a',
          label: 'Out for Delivery (15-30 mins)', 
          icon: <Clock size={16} /> 
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'active') return order.status !== 'completed' && order.status !== 'delivered' && order.status !== 'cancelled';
    if (filter === 'completed') return order.status === 'completed' || order.status === 'delivered';
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fbf9', padding: '6.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Page Title & Stats */}
        <div className="flex-between mobile-stack" style={{ marginBottom: '2.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#16a34a', letterSpacing: '0.05em' }}>
              My Account
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em' }}>
              My Orders & Deliveries
            </h1>
          </div>

          {/* Filter Pills */}
          <div className="flex" style={{ gap: '8px', background: 'white', padding: '4px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            {[
              { id: 'all', label: `All (${orders.length})` },
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Completed' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  background: filter === tab.id ? '#16a34a' : 'transparent',
                  color: filter === tab.id ? 'white' : '#64748b',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '14px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '6rem 0' }}>
            <div className="text-gradient" style={{ fontSize: '1.4rem', fontWeight: '800' }}>
              Retrieving your grocery orders...
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
            <div style={{ background: '#f8fafc', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#94a3b8' }}>
              <Package size={40} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              No Orders Found
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '2rem' }}>
              You don't have any orders under this category yet.
            </p>
            <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '0.85rem 2rem', borderRadius: '14px' }}>
              Start Shopping Now
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            {filteredOrders.map(order => {
              const statusCfg = getStatusConfig(order.status);
              const isOngoing = order.status !== 'completed' && order.status !== 'delivered' && order.status !== 'cancelled';

              return (
                <div
                  key={order._id}
                  style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '2rem',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
                  }}
                >
                  {/* Card Header: Order ID + Status */}
                  <div className="flex-between mobile-stack" style={{ paddingBottom: '1.2rem', borderBottom: '1px solid #f1f5f9', gap: '1rem' }}>
                    <div>
                      <div className="flex" style={{ gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#0f172a', letterSpacing: '0.02em' }}>
                          ORDER #{order._id?.slice(-8).toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} /> {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                        Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Razorpay Verified'}
                      </p>
                    </div>

                    <div 
                      style={{ 
                        background: statusCfg.bg, 
                        color: statusCfg.color, 
                        border: `1px solid ${statusCfg.border}`,
                        padding: '6px 14px', 
                        borderRadius: '20px', 
                        fontSize: '0.82rem', 
                        fontWeight: '800',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {statusCfg.icon}
                      <span>{statusCfg.label}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div style={{ padding: '1.2rem 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                      {order.products?.map((item, idx) => (
                        <div 
                          key={idx}
                          style={{
                            background: '#f8fafc',
                            borderRadius: '16px',
                            padding: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            border: '1px solid #f1f5f9'
                          }}
                        >
                          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '2px', flexShrink: 0 }}>
                            <img 
                              src={getImageUrl(item.productId?.image, item.productId?.name, item.productId?.category)} 
                              alt={item.productId?.name || 'Product'}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getProductFallbackImage(item.productId?.name, item.productId?.category);
                              }}
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <h4 className="line-clamp-1" style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>
                              {item.productId?.name || 'Fresh Item'}
                            </h4>
                            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              Qty: {item.quantity} • ₹{item.productId?.price ? (item.productId.price * item.quantity).toFixed(0) : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Location & Direct Delivery Partner Call */}
                  <div 
                    className="flex-between mobile-stack" 
                    style={{ 
                      paddingTop: '1.2rem', 
                      borderTop: '1px solid #f1f5f9', 
                      background: '#f8fbf9', 
                      borderRadius: '16px', 
                      padding: '1rem 1.4rem', 
                      gap: '1rem',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                        Delivery Address
                      </p>
                      <p style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                        📍 {order.deliveryAddress?.street || 'Home'}, {order.deliveryAddress?.city || ''} {order.deliveryAddress?.pincode ? `- ${order.deliveryAddress.pincode}` : ''}
                      </p>
                    </div>

                    {/* Action button for active delivery */}
                    <div className="flex" style={{ gap: '1rem', alignItems: 'center' }}>
                      {isOngoing && (
                        <a
                          href="tel:+919830012345"
                          style={{
                            background: '#16a34a',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontSize: '0.82rem',
                            fontWeight: '800',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                          }}
                        >
                          <Phone size={14} /> Call Delivery Partner
                        </a>
                      )}

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'block' }}>Total Paid</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#16a34a' }}>
                          ₹{order.totalPrice?.toFixed(0) || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default OrdersPage;
