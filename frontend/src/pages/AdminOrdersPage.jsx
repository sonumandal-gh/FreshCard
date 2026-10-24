import React, { useState, useEffect } from 'react';
import { orderAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, AlertCircle, Package, User, MapPin, ExternalLink, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminOrdersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
      return;
    }

    fetchOrders();
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getAllOrders();
      setOrders(res.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load orders matrix.');
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      // Optimistic update
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (authLoading) return <div className="container" style={{ padding: '5rem 0' }}>Loading Admin Portal...</div>;

  return (
    <div className="container" style={{ padding: '6rem 0', minHeight: '100vh' }}>
      <div className="flex-between mobile-stack" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--dark)' }}>Manage Orders</h1>
          <p style={{ color: 'var(--gray)', fontSize: '1.1rem' }}>Global view of all customer orders</p>
        </div>
        <ClipboardList size={40} style={{ color: 'var(--primary)', opacity: 0.5 }} />
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '10px', marginBottom: '2rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--gray)' }}>Extracting Order Database...</div>
      ) : orders.length === 0 ? (
        <div className="premium-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Package size={50} style={{ margin: '0 auto 1rem', color: '#cbd5e1' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>No Orders Found</h3>
          <p style={{ color: 'var(--gray)' }}>Your store hasn't received any orders yet.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto', borderRadius: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.9rem' }}>Order ID & Date</th>
                <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.9rem' }}>Customer</th>
                <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.9rem' }}>Delivery Location</th>
                <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.9rem' }}>Items</th>
                <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.9rem' }}>Total Amount</th>
                <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.9rem' }}>Action / Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1.2rem' }}>
                    <div style={{ fontWeight: '800', color: 'var(--dark)' }}>#{order._id.substring(18).toUpperCase()}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{formatDate(order.createdAt)}</div>
                  </td>
                  <td style={{ padding: '1.2rem' }}>
                    {order.userId ? (
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} />{order.userId.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{order.userId.email}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--error)' }}>Deleted User</span>
                    )}
                  </td>
                  <td style={{ padding: '1.2rem' }}>
                    {(() => {
                      const addr = order.deliveryAddress || {};
                      const usr = order.userId || {};
                      const street = addr.street || usr.address || '';
                      const city = addr.city || usr.city || '';
                      const pincode = addr.pincode || usr.pincode || '';
                      const phone = addr.phone || usr.phone || '';
                      const recipient = addr.fullName || usr.name || 'Customer';
                      const landmark = addr.landmark || '';
                      const lat = addr.lat;
                      const lng = addr.lng;
                      const hasLocation = Boolean(street || city || (lat && lng));

                      if (!hasLocation) {
                        return (
                          <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '700', background: '#fef2f2', padding: '4px 8px', borderRadius: '6px' }}>
                            ⚠️ No address specified
                          </span>
                        );
                      }

                      return (
                        <div style={{ maxWidth: '300px' }}>
                          <div style={{ fontWeight: '800', color: 'var(--dark)', display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.92rem', lineHeight: '1.25' }}>
                            <MapPin size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                            <span>{street ? `${street}, ` : ''}{city}{pincode ? ` - ${pincode}` : ''}</span>
                          </div>

                          <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
                            <span>To: <strong>{recipient}</strong></span>
                            {phone && (
                              <span style={{ marginLeft: '8px', color: '#059669', fontWeight: '700' }}>
                                📞 <a href={`tel:${phone}`} style={{ color: '#059669', textDecoration: 'underline' }}>{phone}</a>
                              </span>
                            )}
                          </div>

                          {landmark && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px', fontStyle: 'italic' }}>
                              Note: {landmark}
                            </div>
                          )}

                          {lat && lng && (
                            <div style={{ fontSize: '0.72rem', color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px', fontWeight: '700' }}>
                              📍 GPS: {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
                            </div>
                          )}

                          <div style={{ marginTop: '6px' }}>
                            <a 
                              href={lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([street, city, pincode].filter(Boolean).join(', '))}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ 
                                fontSize: '0.75rem', 
                                color: '#059669', 
                                fontWeight: '800', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                background: '#ecfdf5',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid #a7f3d0',
                                textDecoration: 'none'
                              }}
                            >
                              🗺️ Open in Google Maps <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '1.2rem', fontWeight: '600', color: 'var(--dark)' }}>
                    {order.products.length} Items
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>
                      {order.products.map(p => p.productId?.name).filter(Boolean).slice(0, 2).join(', ')}
                      {order.products.length > 2 ? ' ...' : ''}
                    </div>
                  </td>
                  <td style={{ padding: '1.2rem', fontWeight: '900', color: 'var(--dark)', fontSize: '1.1rem' }}>
                    ₹{Number(order.totalPrice || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '1.2rem' }}>
                    <select 
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      style={{ 
                        padding: '0.5rem 1rem', 
                        borderRadius: '2rem',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        border: 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        color: order.status === 'completed' ? '#059669' : order.status === 'cancelled' ? '#dc2626' : '#d97706',
                        background: order.status === 'completed' ? '#ecfdf5' : order.status === 'cancelled' ? '#fef2f2' : '#fffbeb',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <option value="pending" style={{ color: '#d97706' }}>Pending</option>
                      <option value="completed" style={{ color: '#059669' }}>Completed</option>
                      <option value="cancelled" style={{ color: '#dc2626' }}>Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
