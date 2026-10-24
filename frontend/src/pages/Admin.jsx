import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Package, AlertCircle, MapPin, ExternalLink, Phone, ClipboardList, User as UserIcon } from 'lucide-react';
import { productAPI, categoryAPI, orderAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE, getProductFallbackImage } from '../utils/imageUtils';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);

  // Sync tab from URL if present (e.g. /admin?tab=orders)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['products', 'categories', 'orders'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);
  
  // Product Modals & Form
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', category: '', stock: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // Category Modals & Form
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');

  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
      return;
    }

    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProducts(false), fetchCategories(), fetchOrders()]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (shouldSetLoading = false) => {
    if (shouldSetLoading) setLoading(true);
    try {
      const res = await productAPI.getAll();
      setProducts(res.data.products);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      if (shouldSetLoading) setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getAll();
      if (res.data.success && res.data.categories) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getAllOrders();
      if (res.data.success && res.data.data) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  // Product Modals/CRUD
  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ name: product.name, price: product.price, category: product.category, stock: product.stock });
      setImagePreview(product.image || '');
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', category: categories[0]?.name || 'Vegetables', stock: '' });
      setImagePreview('');
    }
    setImageFile(null);
    setShowModal(true);
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('price', formData.price);
      data.append('category', formData.category);
      data.append('stock', formData.stock);
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (editingProduct) {
        await productAPI.update(editingProduct._id, data);
      } else {
        await productAPI.create(data);
      }
      setShowModal(false);
      await fetchProducts(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Product action failed.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(id);
        await fetchProducts(false);
      } catch (err) {
        alert('Delete failed.');
      }
    }
  };

  // Category Modals/CRUD
  const handleOpenCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setShowCategoryModal(true);
    setError('');
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    try {
      if (editingCategory) {
        await categoryAPI.update(editingCategory._id, { name: categoryName });
      } else {
        await categoryAPI.create({ name: categoryName });
      }
      setShowCategoryModal(false);
      setCategoryName('');
      setEditingCategory(null);
      await fetchCategories();
      await fetchProducts(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Category action failed.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleCategoryDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? Associated products will be marked as "Uncategorized".')) {
      try {
        await categoryAPI.delete(id);
        await fetchCategories();
        await fetchProducts(false);
      } catch (err) {
        alert('Delete failed.');
      }
    }
  };

  if (authLoading) return <div className="container">Loading Auth...</div>;

  return (
    <div className="container" style={{ paddingTop: '7rem' }}>
      <div className="flex-between mobile-stack" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Admin Dashboard</h2>
          <p style={{ color: '#888' }}>Manage your product inventory and categories efficiently</p>
        </div>
        {activeTab === 'products' ? (
          <button onClick={() => handleOpenModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} /> Add Product
          </button>
        ) : activeTab === 'categories' ? (
          <button onClick={() => handleOpenCategoryModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} /> Add Category
          </button>
        ) : (
          <button onClick={() => fetchOrders()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--dark)' }}>
            Refresh Orders ({orders.length})
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #eee', marginBottom: '2rem', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('products')} 
          style={{ 
            padding: '0.8rem 1.5rem', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'products' ? '3px solid var(--primary)' : '3px solid transparent',
            fontWeight: '700',
            color: activeTab === 'products' ? 'var(--primary)' : '#888',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '-2px',
            transition: 'all 0.3s ease'
          }}
        >
          Products ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('categories')} 
          style={{ 
            padding: '0.8rem 1.5rem', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'categories' ? '3px solid var(--primary)' : '3px solid transparent',
            fontWeight: '700',
            color: activeTab === 'categories' ? 'var(--primary)' : '#888',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '-2px',
            transition: 'all 0.3s ease'
          }}
        >
          Categories ({categories.length})
        </button>
        <button 
          onClick={() => setActiveTab('orders')} 
          style={{ 
            padding: '0.8rem 1.5rem', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'orders' ? '3px solid var(--primary)' : '3px solid transparent',
            fontWeight: '700',
            color: activeTab === 'orders' ? 'var(--primary)' : '#888',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '-2px',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ClipboardList size={18} /> Orders & Delivery Location
          {orders.length > 0 && (
            <span style={{ background: activeTab === 'orders' ? 'var(--primary)' : '#64748b', color: 'white', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px' }}>
              {orders.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>Loading Inventory Data...</div>
      ) : activeTab === 'products' ? (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8f8f8', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={{ padding: '1.2rem' }}>Product</th>
                <th style={{ padding: '1.2rem' }}>Category</th>
                <th style={{ padding: '1.2rem' }}>Price</th>
                <th style={{ padding: '1.2rem' }}>Stock</th>
                <th style={{ padding: '1.2rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1.2rem', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {product.image ? (
                        <img 
                          src={getImageUrl(product.image, product.name, product.category)} 
                          alt={product.name} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getProductFallbackImage(product.name, product.category);
                          }}
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={20} style={{ color: '#aaa' }} />
                        </div>
                      )}
                      {product.name}
                    </div>
                  </td>
                  <td style={{ padding: '1.2rem' }}>
                    <span style={{ padding: '4px 10px', background: '#eef2ff', color: '#4338ca', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                      {product.category}
                    </span>
                  </td>
                  <td style={{ padding: '1.2rem' }}>₹{product.price}</td>
                  <td style={{ padding: '1.2rem' }}>
                    <span style={{ color: product.stock < 10 ? '#e74c3c' : 'inherit', fontWeight: product.stock < 10 ? '700' : '400' }}>
                      {product.stock} units
                    </span>
                  </td>
                  <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                    <button onClick={() => handleOpenModal(product)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)', marginLeft: '1rem' }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(product._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', marginLeft: '1rem' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'categories' ? (
        <div className="card" style={{ padding: 0, overflowX: 'auto', maxWidth: '800px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8f8f8', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={{ padding: '1.2rem' }}>Category Name</th>
                <th style={{ padding: '1.2rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1.2rem', fontWeight: '600' }}>{category.name}</td>
                  <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                    <button onClick={() => handleOpenCategoryModal(category)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)', marginLeft: '1rem' }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleCategoryDelete(category._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', marginLeft: '1rem' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Orders & Delivery Location Management */
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--gray)' }}>
              <Package size={50} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>No Orders Found</h3>
              <p>When customers place orders, they will appear here with their exact delivery location.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.85rem' }}>ORDER DETAILS</th>
                  <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.85rem' }}>CUSTOMER</th>
                  <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.85rem' }}>📍 DELIVERY LOCATION</th>
                  <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.85rem' }}>ITEMS</th>
                  <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.85rem' }}>TOTAL</th>
                  <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.85rem' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1.2rem' }}>
                      <div style={{ fontWeight: '800', color: 'var(--dark)' }}>#{order._id.substring(18).toUpperCase()}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: order.paymentMethod === 'cod' ? '#fef3c7' : '#dcfce7', color: order.paymentMethod === 'cod' ? '#b45309' : '#15803d', fontWeight: '800', textTransform: 'uppercase', display: 'inline-block', marginTop: '4px' }}>
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem' }}>
                      {order.userId ? (
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--primary)' }}>{order.userId.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{order.userId.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--gray)' }}>Guest Customer</span>
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
                    <td style={{ padding: '1.2rem', fontWeight: '600' }}>
                      <div style={{ fontWeight: '700', color: 'var(--dark)' }}>{order.products.length} Items</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
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
                        onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                        style={{ 
                          padding: '0.5rem 0.9rem', 
                          borderRadius: '2rem',
                          fontWeight: '800',
                          fontSize: '0.8rem',
                          border: 'none',
                          outline: 'none',
                          cursor: 'pointer',
                          color: order.status === 'completed' ? '#059669' : order.status === 'cancelled' ? '#dc2626' : '#d97706',
                          background: order.status === 'completed' ? '#ecfdf5' : order.status === 'cancelled' ? '#fef2f2' : '#fffbeb',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              <X size={24} />
            </button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>

            {error && <div style={{ color: '#e74c3c', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> {error}</div>}

            <form onSubmit={handleSubmit} className="grid" style={{ gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Product Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid #ddd' }} 
                  required 
                />
              </div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Price (₹)</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={e => setFormData({ ...formData, price: e.target.value })} 
                    style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid #ddd' }} 
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Stock</label>
                  <input 
                    type="number" 
                    value={formData.stock} 
                    onChange={e => setFormData({ ...formData, stock: e.target.value })} 
                    style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid #ddd' }} 
                    required 
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Category</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid #ddd', background: 'white' }}
                >
                  {categories.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Product Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange} 
                  style={{ width: '100%', padding: '0.5rem', border: '1px dashed #ccc', borderRadius: '8px' }} 
                />
                {imagePreview && (
                  <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f8' }}>
                    <img src={getImageUrl(imagePreview)} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                )}
              </div>
              <button type="submit" disabled={modalSubmitting} className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                {modalSubmitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%', position: 'relative' }}>
            <button type="button" onClick={() => setShowCategoryModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              <X size={24} />
            </button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>

            {error && <div style={{ color: '#e74c3c', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> {error}</div>}

            <form onSubmit={handleCategorySubmit} className="grid" style={{ gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Category Name</label>
                <input 
                  type="text" 
                  value={categoryName} 
                  onChange={e => setCategoryName(e.target.value)} 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid #ddd' }} 
                  required 
                />
              </div>
              <button type="submit" disabled={modalSubmitting} className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                {modalSubmitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
