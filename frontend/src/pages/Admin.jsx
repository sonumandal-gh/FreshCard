import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, X, Check, Package, AlertCircle, MapPin, 
  ExternalLink, Phone, ClipboardList, User as UserIcon, TrendingUp,
  DollarSign, ShoppingBag, AlertTriangle, Layers, Search, Truck,
  CheckCircle2, Save, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { productAPI, categoryAPI, orderAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE, getProductFallbackImage } from '../utils/imageUtils';
import { getDeliverySettings, saveDeliverySettings, syncDeliverySettings } from '../utils/settingsUtils';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [searchProductQuery, setSearchProductQuery] = useState('');

  // Sync tab from URL if present (e.g. /admin?tab=orders or /admin?tab=delivery)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['products', 'categories', 'orders', 'delivery'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Delivery Settings State
  const [deliverySettings, setDeliverySettings] = useState(getDeliverySettings());
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  useEffect(() => {
    syncDeliverySettings().then(s => {
      if (s) setDeliverySettings(s);
    });
  }, []);

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess('');
    try {
      await saveDeliverySettings(deliverySettings);
      setSettingsSuccess('Delivery charges & settings updated successfully!');
      setTimeout(() => setSettingsSuccess(''), 4000);
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };
  
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
      setProducts(res.data.products || []);
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
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getAllOrders();
      if (res.data.success && res.data.data) {
        setOrders(res.data.data || []);
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

  // KPIs
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const lowStockCount = products.filter(p => (Number(p.stock) || 0) < 10).length;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchProductQuery.toLowerCase()))
  );

  if (authLoading) return <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>Authenticating Admin Portal...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fbf9', padding: '6.5rem 0 5rem' }}>
      <div className="container">
        
        {/* Header & Main Actions */}
        <div className="flex-between mobile-stack" style={{ marginBottom: '2.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#16a34a', letterSpacing: '0.05em' }}>
              Operations Hub
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em' }}>
              Store Management
            </h1>
          </div>

          <div className="flex" style={{ gap: '10px' }}>
            {activeTab === 'products' ? (
              <button 
                onClick={() => handleOpenModal()} 
                className="btn-primary" 
                style={{ padding: '0.8rem 1.6rem', borderRadius: '14px' }}
              >
                <Plus size={18} /> Add New Product
              </button>
            ) : activeTab === 'categories' ? (
              <button 
                onClick={() => handleOpenCategoryModal()} 
                className="btn-primary" 
                style={{ padding: '0.8rem 1.6rem', borderRadius: '14px' }}
              >
                <Plus size={18} /> Add Category
              </button>
            ) : activeTab === 'delivery' ? (
              <button 
                onClick={handleSaveSettings} 
                disabled={savingSettings}
                className="btn-primary" 
                style={{ padding: '0.8rem 1.6rem', borderRadius: '14px' }}
              >
                <Save size={18} /> {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            ) : (
              <button 
                onClick={() => fetchOrders()} 
                className="btn-primary" 
                style={{ padding: '0.8rem 1.6rem', borderRadius: '14px', background: '#0f172a' }}
              >
                Refresh Orders ({orders.length})
              </button>
            )}
          </div>
        </div>

        {/* Top KPI Analytics Cards */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '2.5rem'
          }}
        >
          {/* Revenue */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <div className="flex-between" style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b' }}>Total Revenue</span>
              <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '10px', color: '#16a34a' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
              ₹{totalRevenue.toFixed(0)}
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '700', marginTop: '4px' }}>
              ● Live across {orders.length} orders
            </p>
          </div>

          {/* Orders */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <div className="flex-between" style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b' }}>Total Orders</span>
              <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '10px', color: '#3b82f6' }}>
                <ShoppingBag size={18} />
              </div>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
              {orders.length}
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', marginTop: '4px' }}>
              Orders processed
            </p>
          </div>

          {/* Products */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <div className="flex-between" style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b' }}>Inventory Items</span>
              <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '10px', color: '#d97706' }}>
                <Package size={18} />
              </div>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
              {products.length}
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', marginTop: '4px' }}>
              In {categories.length} categories
            </p>
          </div>

          {/* Low Stock Warning */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <div className="flex-between" style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b' }}>Low Stock Alert</span>
              <div style={{ background: '#fee2e2', padding: '8px', borderRadius: '10px', color: '#ef4444' }}>
                <AlertTriangle size={18} />
              </div>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: lowStockCount > 0 ? '#ef4444' : '#0f172a', letterSpacing: '-0.02em' }}>
              {lowStockCount}
            </h2>
            <p style={{ fontSize: '0.78rem', color: lowStockCount > 0 ? '#ef4444' : '#16a34a', fontWeight: '700', marginTop: '4px' }}>
              {lowStockCount > 0 ? 'Needs replenishment (< 10 units)' : 'All items well stocked'}
            </p>
          </div>
        </div>

        {/* Tab Controls & Search */}
        <div className="flex-between mobile-stack" style={{ marginBottom: '2rem', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '6px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <button 
              onClick={() => setActiveTab('products')}
              style={{
                background: activeTab === 'products' ? '#16a34a' : 'transparent',
                color: activeTab === 'products' ? 'white' : '#64748b',
                padding: '8px 18px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '0.88rem'
              }}
            >
              Products ({products.length})
            </button>
            <button 
              onClick={() => setActiveTab('categories')}
              style={{
                background: activeTab === 'categories' ? '#16a34a' : 'transparent',
                color: activeTab === 'categories' ? 'white' : '#64748b',
                padding: '8px 18px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '0.88rem'
              }}
            >
              Categories ({categories.length})
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              style={{
                background: activeTab === 'orders' ? '#16a34a' : 'transparent',
                color: activeTab === 'orders' ? 'white' : '#64748b',
                padding: '8px 18px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Orders & Routing ({orders.length})
            </button>
            <button 
              onClick={() => setActiveTab('delivery')}
              style={{
                background: activeTab === 'delivery' ? '#16a34a' : 'transparent',
                color: activeTab === 'delivery' ? 'white' : '#64748b',
                padding: '8px 18px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Truck size={16} /> Delivery & Charges
            </button>
          </div>

          {activeTab === 'products' && (
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchProductQuery}
                onChange={(e) => setSearchProductQuery(e.target.value)}
                style={{ padding: '0.65rem 1rem 0.65rem 2.5rem', borderRadius: '14px', fontSize: '0.88rem' }}
              />
            </div>
          )}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '6rem 0', color: '#64748b', fontWeight: '700' }}>
            Syncing inventory database...
          </div>
        ) : activeTab === 'products' ? (
          <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '1.2rem', fontSize: '0.82rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Product</th>
                    <th style={{ padding: '1.2rem', fontSize: '0.82rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Department</th>
                    <th style={{ padding: '1.2rem', fontSize: '0.82rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Price</th>
                    <th style={{ padding: '1.2rem', fontSize: '0.82rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Stock Available</th>
                    <th style={{ padding: '1.2rem', fontSize: '0.82rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1.2rem' }}>
                        <div className="flex" style={{ gap: '12px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '2px' }}>
                            <img 
                              src={getImageUrl(product.image, product.name, product.category)} 
                              alt={product.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getProductFallbackImage(product.name, product.category);
                              }}
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          </div>
                          <div>
                            <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>{product.name}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.2rem' }}>
                        <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                          {product.category}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem', fontWeight: '800', color: '#0f172a', fontSize: '1.05rem' }}>
                        ₹{product.price}
                      </td>
                      <td style={{ padding: '1.2rem' }}>
                        <span style={{ color: product.stock < 10 ? '#ef4444' : '#16a34a', fontWeight: '800', fontSize: '0.9rem' }}>
                          {product.stock} units {product.stock < 10 && '⚠️'}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleOpenModal(product)} 
                          style={{ background: '#f1f5f9', color: '#0f172a', padding: '8px', borderRadius: '8px', marginRight: '8px' }}
                          title="Edit Product"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product._id)} 
                          style={{ background: '#fee2e2', color: '#ef4444', padding: '8px', borderRadius: '8px' }}
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', maxWidth: '700px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '1.2rem', fontSize: '0.82rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Department Name</th>
                  <th style={{ padding: '1.2rem', fontSize: '0.82rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1.2rem', fontWeight: '800', color: '#0f172a' }}>{category.name}</td>
                    <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleOpenCategoryModal(category)} 
                        style={{ background: '#f1f5f9', color: '#0f172a', padding: '8px', borderRadius: '8px', marginRight: '8px' }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleCategoryDelete(category._id)} 
                        style={{ background: '#fee2e2', color: '#ef4444', padding: '8px', borderRadius: '8px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'delivery' ? (
          <div style={{ maxWidth: '820px' }}>
            <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              
              <div className="flex-between mobile-stack" style={{ marginBottom: '1.8rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.2rem', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Truck size={24} color="#16a34a" /> Delivery Charges & Threshold Configuration
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px' }}>
                    Control the minimum free delivery order amount, standard delivery charge, and express delivery time text across the entire store.
                  </p>
                </div>
              </div>

              {settingsSuccess && (
                <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 18px', borderRadius: '14px', marginBottom: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={20} color="#16a34a" /> {settingsSuccess}
                </div>
              )}

              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
                
                {/* 1. Free Delivery Threshold */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '18px', border: '1px solid #f1f5f9' }}>
                  <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                      Free Delivery Minimum Order (₹)
                    </label>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: '10px' }}>
                      Active: ₹{deliverySettings.freeDeliveryThreshold}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '12px' }}>
                    Customer orders reaching this amount will automatically unlock 100% FREE Delivery.
                  </p>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={deliverySettings.freeDeliveryThreshold}
                    onChange={(e) => setDeliverySettings({ ...deliverySettings, freeDeliveryThreshold: Number(e.target.value) })}
                    placeholder="e.g. 299"
                    required
                    style={{ background: 'white', maxWidth: '300px' }}
                  />
                </div>

                {/* 2. Standard Delivery Charge */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '18px', border: '1px solid #f1f5f9' }}>
                  <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                      Standard Delivery Fee (₹)
                    </label>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#d97706', background: '#fef3c7', padding: '3px 10px', borderRadius: '10px' }}>
                      Fee: ₹{deliverySettings.standardDeliveryCharge}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '12px' }}>
                    Delivery charge applied whenever a customer's basket is below the Free Delivery threshold.
                  </p>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={deliverySettings.standardDeliveryCharge}
                    onChange={(e) => setDeliverySettings({ ...deliverySettings, standardDeliveryCharge: Number(e.target.value) })}
                    placeholder="e.g. 35"
                    required
                    style={{ background: 'white', maxWidth: '300px' }}
                  />
                </div>

                {/* 3. Estimated Delivery Time */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '18px', border: '1px solid #f1f5f9' }}>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                    Estimated Delivery Time Tagline
                  </label>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '12px' }}>
                    Shown across the store (Header, Hero section, and Checkout banners).
                  </p>
                  <input
                    type="text"
                    value={deliverySettings.deliveryTimeText}
                    onChange={(e) => setDeliverySettings({ ...deliverySettings, deliveryTimeText: e.target.value })}
                    placeholder="e.g. 15-30 Mins"
                    required
                    style={{ background: 'white', maxWidth: '350px' }}
                  />
                </div>

                {/* Live Customer Preview */}
                <div style={{ background: '#f0fdf4', border: '1.5px dashed #86efac', borderRadius: '18px', padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Customer Experience Live Preview
                  </span>
                  <div style={{ marginTop: '8px', fontSize: '0.95rem', color: '#0f172a', fontWeight: '700' }}>
                    • Basket under ₹{deliverySettings.freeDeliveryThreshold}: Customer pays <span style={{ color: '#dc2626' }}>+₹{deliverySettings.standardDeliveryCharge} delivery charge</span>.
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '0.95rem', color: '#15803d', fontWeight: '800' }}>
                    • Basket ₹{deliverySettings.freeDeliveryThreshold} or above: Customer unlocks <span style={{ textDecoration: 'underline' }}>100% FREE Delivery</span>.
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '0.88rem', color: '#64748b', fontWeight: '600' }}>
                    • Banner status: <strong>"⚡ {deliverySettings.deliveryTimeText || '15-30 Mins'} Delivery"</strong>.
                  </div>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="btn-primary"
                    style={{ padding: '0.9rem 2.4rem', borderRadius: '14px', fontSize: '0.95rem' }}
                  >
                    <Save size={18} /> {savingSettings ? 'Saving Settings...' : 'Save & Publish Changes'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        ) : (
          /* Orders Tab with full address & Google Maps */
          <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '1.2rem', fontSize: '0.82rem', fontWeight: '800', color: '#475569' }}>ORDER ID & TIME</th>
                    <th style={{ padding: '1.2rem', fontSize: '0.82rem', fontWeight: '800', color: '#475569' }}>CUSTOMER</th>
                    <th style={{ padding: '1.2rem', fontSize: '0.82rem', fontWeight: '800', color: '#475569' }}>📍 DELIVERY DESTINATION</th>
                    <th style={{ padding: '1.2rem', fontSize: '0.82rem', fontWeight: '800', color: '#475569' }}>ITEMS</th>
                    <th style={{ padding: '1.2rem', fontSize: '0.82rem', fontWeight: '800', color: '#475569' }}>AMOUNT</th>
                    <th style={{ padding: '1.2rem', fontSize: '0.82rem', fontWeight: '800', color: '#475569' }}>STATUS UPDATE</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
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

                    return (
                      <tr key={order._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1.2rem' }}>
                          <span style={{ fontWeight: '800', color: '#0f172a' }}>#{order._id?.slice(-8).toUpperCase()}</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                            {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: order.paymentMethod === 'cod' ? '#fef3c7' : '#dcfce7', color: order.paymentMethod === 'cod' ? '#b45309' : '#15803d', fontWeight: '800', display: 'inline-block', marginTop: '4px' }}>
                            {order.paymentMethod?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1.2rem' }}>
                          <span style={{ fontWeight: '800', color: '#0f172a', display: 'block' }}>{recipient}</span>
                          {phone && (
                            <a href={`tel:${phone}`} style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: '700' }}>
                              📞 {phone}
                            </a>
                          )}
                        </td>
                        <td style={{ padding: '1.2rem', maxWidth: '320px' }}>
                          <p style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.88rem' }}>
                            {street ? `${street}, ` : ''}{city}{pincode ? ` - ${pincode}` : ''}
                          </p>
                          {landmark && (
                            <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                              Note: {landmark}
                            </p>
                          )}
                          <div style={{ marginTop: '6px' }}>
                            <a 
                              href={lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([street, city, pincode].filter(Boolean).join(', '))}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ 
                                fontSize: '0.75rem', 
                                color: '#16a34a', 
                                fontWeight: '800', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                background: '#f0fdf4',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                border: '1px solid #bbf7d0'
                              }}
                            >
                              🗺️ Open in Google Maps <ExternalLink size={10} />
                            </a>
                          </div>
                        </td>
                        <td style={{ padding: '1.2rem', fontWeight: '700', color: '#0f172a' }}>
                          {order.products?.length} Items
                        </td>
                        <td style={{ padding: '1.2rem', fontWeight: '900', color: '#16a34a', fontSize: '1.1rem' }}>
                          ₹{Number(order.totalPrice || 0).toFixed(0)}
                        </td>
                        <td style={{ padding: '1.2rem' }}>
                          <select 
                            value={order.status}
                            onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                            style={{ 
                              padding: '0.45rem 0.8rem', 
                              borderRadius: '12px',
                              fontWeight: '800',
                              fontSize: '0.82rem',
                              border: '1.5px solid #e2e8f0',
                              cursor: 'pointer',
                              color: order.status === 'completed' ? '#16a34a' : order.status === 'cancelled' ? '#dc2626' : '#d97706',
                              background: 'white'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed / Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(6px)' }}>
            <div style={{ maxWidth: '520px', width: '90%', background: 'white', borderRadius: '24px', padding: '2.5rem', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#f8fafc', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginBottom: '1.5rem' }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>

              {error && <div style={{ color: '#ef4444', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: '700' }}><AlertCircle size={16} /> {error}</div>}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '0.85rem', marginBottom: '6px' }}>Product Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="e.g. Farm Fresh Carrots"
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '700', fontSize: '0.85rem', marginBottom: '6px' }}>Price (₹)</label>
                    <input 
                      type="number" 
                      value={formData.price} 
                      onChange={e => setFormData({ ...formData, price: e.target.value })} 
                      placeholder="45"
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: '700', fontSize: '0.85rem', marginBottom: '6px' }}>Stock Quantity</label>
                    <input 
                      type="number" 
                      value={formData.stock} 
                      onChange={e => setFormData({ ...formData, stock: e.target.value })} 
                      placeholder="50"
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '0.85rem', marginBottom: '6px' }}>Category</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '0.85rem', marginBottom: '6px' }}>Product Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange} 
                    style={{ background: '#f8fafc', padding: '0.6rem' }}
                  />
                  {imagePreview && (
                    <div style={{ marginTop: '10px', borderRadius: '12px', overflow: 'hidden', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <img src={getImageUrl(imagePreview)} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>

                <button type="submit" disabled={modalSubmitting} className="btn-primary" style={{ marginTop: '0.8rem', padding: '1rem', borderRadius: '14px' }}>
                  {modalSubmitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(6px)' }}>
            <div style={{ maxWidth: '420px', width: '90%', background: 'white', borderRadius: '24px', padding: '2.5rem', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
              <button 
                type="button" 
                onClick={() => setShowCategoryModal(false)} 
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#f8fafc', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', marginBottom: '1.5rem' }}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>

              {error && <div style={{ color: '#ef4444', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}><AlertCircle size={16} /> {error}</div>}

              <form onSubmit={handleCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '0.85rem', marginBottom: '6px' }}>Category Name</label>
                  <input 
                    type="text" 
                    value={categoryName} 
                    onChange={e => setCategoryName(e.target.value)} 
                    placeholder="e.g. Organic Dairy"
                    required 
                  />
                </div>
                <button type="submit" disabled={modalSubmitting} className="btn-primary" style={{ marginTop: '0.5rem', padding: '1rem', borderRadius: '14px' }}>
                  {modalSubmitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;
