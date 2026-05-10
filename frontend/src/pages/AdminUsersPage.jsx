import React, { useState, useEffect } from 'react';
import { authAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, User, Search, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminUsersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, authLoading, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await authAPI.getAllUsers();
      setUsers(res.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch users database.');
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await authAPI.updateRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      setSuccessMsg(`Role updated to ${newRole} successfully!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to update user role.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) return <div className="container" style={{ padding: '10rem 0', textAlign: 'center' }}><Loader2 className="animate-spin" /> Authenticating...</div>;

  return (
    <div className="container" style={{ padding: '7rem 0', minHeight: '100vh' }}>
      <div className="flex-between mobile-stack" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--dark)', letterSpacing: '-0.02em' }}>User Ecosystem</h1>
          <p style={{ color: 'var(--gray)', fontSize: '1.1rem' }}>Manage roles and access permissions</p>
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '48px', borderRadius: '30px' }}
          />
        </div>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            style={{ background: '#ecfdf5', color: '#059669', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', fontWeight: '600' }}
          >
            <CheckCircle size={20} /> {successMsg}
          </motion.div>
        )}
        {error && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', fontWeight: '600' }}
          >
            <AlertCircle size={20} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '10rem 0' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto' }} />
          <p style={{ marginTop: '1rem', color: 'var(--gray)' }}>Scanning User Directory...</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto', borderRadius: '1.5rem', border: '1px solid #f1f5f9' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.85rem' }}>USER PROFILE</th>
                <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.85rem' }}>JOINED DATE</th>
                <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.85rem' }}>CURRENT ROLE</th>
                <th style={{ padding: '1.2rem', color: 'var(--gray)', fontWeight: '700', fontSize: '0.85rem' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1.2rem' }}>
                    <div className="flex" style={{ gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dark)', fontWeight: '800' }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--dark)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.2rem', fontSize: '0.9rem', color: 'var(--gray)' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1.2rem' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      background: u.role === 'admin' ? '#fef2f2' : (u.role === 'seller' ? '#eff6ff' : '#f8fafc'),
                      color: u.role === 'admin' ? '#dc2626' : (u.role === 'seller' ? '#2563eb' : '#64748b'),
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {u.role === 'admin' && <Shield size={12} />}
                      {u.role === 'user' && <User size={12} />}
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '1.2rem' }}>
                    <div className="flex" style={{ gap: '8px' }}>
                      <select 
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        disabled={u._id === user.id} // Prevent self-demotion
                        style={{ 
                          padding: '0.4rem 0.8rem', 
                          borderRadius: '8px', 
                          fontSize: '0.85rem', 
                          fontWeight: '600',
                          border: '1px solid #e2e8f0',
                          cursor: u._id === user.id ? 'not-allowed' : 'pointer',
                          background: 'white'
                        }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="seller">Seller</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray)' }}>
              <Users size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
              <p>No users found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
