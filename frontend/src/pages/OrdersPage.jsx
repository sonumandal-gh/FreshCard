import React, { useState, useEffect } from 'react';
import { orderAPI } from '../api/api';
import { Package, Clock, CheckCircle2, XCircle, ChevronRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    orderAPI.getUserOrders()
      .then(res => {
        setOrders(res.data.data);
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
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircle2 size={18} /> };
      case 'cancelled':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <XCircle size={18} /> };
      default: // pending
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: <Clock size={18} /> };
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '6rem 0', background: 'linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 100%)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
           <div style={{ display: 'inline-flex', background: 'white', padding: '1rem', borderRadius: '50%', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', marginBottom: '1.5rem', color: 'var(--primary)' }}>
              <Package size={40} />
           </div>
           <h1 style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--dark)', letterSpacing: '-0.03em' }}>My Orders</h1>
           <p style={{ color: 'var(--gray)', fontSize: '1.1rem', marginTop: '0.5rem', fontWeight: '500' }}>Track, view, and manage your recent purchases</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '1.5rem', borderRadius: '1rem', display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '2rem', border: '1px solid #fee2e2' }}>
            <AlertCircle /> <span style={{ fontWeight: '600' }}>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '6rem 0' }}>
            <div className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: '800' }}>Loading your orders...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="premium-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
             <Package size={60} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
             <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>No Orders Yet</h3>
             <p style={{ color: 'var(--gray)', marginBottom: '2rem' }}>Looks like you haven't bought anything from FreshCart yet.</p>
             <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '0.8rem 2.5rem' }}>Start Shopping</button>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid" style={{ gap: '1.5rem' }}>
            {orders.map(order => {
              const statusCfg = getStatusConfig(order.status);
              
              return (
                <motion.div 
                  key={order._id} 
                  variants={itemVariants} 
                  className="premium-card"
                  style={{ padding: '2rem', border: '1px solid white', borderTop: '1px solid rgba(255,255,255,0.8)', borderLeft: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}
                >
                  <div className="flex-between" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                       <p style={{ fontSize: '0.85rem', color: 'var(--gray)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                          Order ID: <span style={{ color: 'var(--dark)' }}>#{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                       </p>
                       <p style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>{formatDate(order.createdAt)}</p>
                    </div>
                    <div style={{ background: statusCfg.bg, color: statusCfg.color, padding: '0.5rem 1rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                       {statusCfg.icon} {order.status}
                    </div>
                  </div>

                  <div className="grid" style={{ gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                    {order.products.map((item, idx) => (
                      <div key={idx} className="flex" style={{ gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '1rem' }}>
                         <div style={{ background: 'white', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                           {item.productId?.image ? (
                             <img src={item.productId.image} alt={item.productId.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           ) : (
                             <Package size={24} style={{ color: 'var(--primary)' }} />
                           )}
                         </div>
                         <div>
                            <p style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--dark)' }}>
                              {item.productId ? item.productId.name : 'Unknown Product'}
                            </p>
                            <p style={{ color: 'var(--gray)', fontSize: '0.85rem', fontWeight: '600' }}>
                              Qty: {item.quantity} × ₹{item.productId ? item.productId.price.toFixed(2) : 0}
                            </p>
                         </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex-between" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed #e2e8f0' }}>
                     <div style={{ color: 'var(--gray)', fontWeight: '600', fontSize: '0.95rem' }}>
                        {order.products.length} {order.products.length === 1 ? 'Item' : 'Items'}
                     </div>
                     <div className="flex" style={{ gap: '1rem' }}>
                        <span style={{ color: 'var(--gray)', fontWeight: '600' }}>Total:</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)' }}>₹{order.totalPrice.toFixed(2)}</span>
                     </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
