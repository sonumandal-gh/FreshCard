import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Package, AlertCircle } from 'lucide-react';
import { productAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', category: 'Vegetables', stock: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
      return;
    }

    fetchProducts();
  }, [user, authLoading]);

  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAll();
      setProducts(res.data.products);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ name: product.name, price: product.price, category: product.category, stock: product.stock });
      setImagePreview(product.image || '');
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', category: 'Vegetables', stock: '' });
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
    setLoading(true);
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
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(id);
        fetchProducts();
      } catch (err) {
        alert('Delete failed.');
      }
    }
  };

  if (authLoading) return <div className="container">Loading Auth...</div>;

  return (
    <div className="container" style={{ paddingTop: '7rem' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Admin Dashboard</h2>
          <p style={{ color: '#888' }}>Manage your product inventory efficiently</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} /> Add Product
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>Loading Inventory...</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
                  <td style={{ padding: '1.2rem', fontWeight: '600' }}>{product.name}</td>
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
                    <button onClick={() => handleOpenModal(product)} style={{ background: 'none', color: 'var(--secondary)', marginLeft: '1rem' }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(product._id)} style={{ background: 'none', color: '#e74c3c', marginLeft: '1rem' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', color: '#888' }}>
              <X size={24} />
            </button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>

            {error && <div style={{ color: '#e74c3c', marginBottom: '1rem' }}><AlertCircle size={16} /> {error}</div>}

            <form onSubmit={handleSubmit} className="grid" style={{ gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Product Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  style={{ width: '100%' }} 
                  required 
                />
              </div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Price (₹)</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={e => setFormData({ ...formData, price: e.target.value })} 
                    style={{ width: '100%' }} 
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Stock</label>
                  <input 
                    type="number" 
                    value={formData.stock} 
                    onChange={e => setFormData({ ...formData, stock: e.target.value })} 
                    style={{ width: '100%' }} 
                    required 
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Category</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid #ddd' }}
                >
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Beverages">Beverages</option>
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
                    <img src={imagePreview} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                {editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
