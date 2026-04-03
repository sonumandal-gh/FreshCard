import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="premium-card" 
        style={{ maxWidth: '480px', width: '100%', padding: '3rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            style={{ 
              background: 'var(--primary)', 
              color: 'white', 
              display: 'inline-flex', 
              padding: '1.2rem', 
              borderRadius: '20px', 
              marginBottom: '1.5rem',
              boxShadow: '0 10px 25px -5px var(--primary-glow)'
            }}
          >
            <LogIn size={32} />
          </motion.div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Welcome Back</h2>
          <p style={{ color: 'var(--gray)', fontWeight: '500' }}>Access your premium grocery experience</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ 
              background: '#fef2f2', 
              color: '#b91c1c', 
              padding: '1rem 1.2rem', 
              borderRadius: '12px', 
              marginBottom: '2rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              fontSize: '0.9rem',
              fontWeight: '600',
              border: '1px solid #fee2e2'
            }}
          >
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="grid" style={{ gap: '1.8rem' }}>
          <div className="animate-fade" style={{ animationDelay: '0.1s' }}>
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--dark)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" 
                style={{ paddingLeft: '48px' }} 
                required 
              />
            </div>
          </div>

          <div className="animate-fade" style={{ animationDelay: '0.2s' }}>
            <div className="flex-between">
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--dark)' }}>Password</label>
              <a href="#" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700' }}>Forgot?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                style={{ paddingLeft: '48px' }} 
                required 
              />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '1.1rem', 
              fontSize: '1.1rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px',
              marginTop: '1rem'
            }}
          >
            {loading ? 'Authenticating...' : (
              <>Sign In <ArrowRight size={20} /></>
            )}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ color: 'var(--gray)', fontSize: '0.95rem', fontWeight: '500' }}>
            New to FreshCart? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '800' }}>Create account</Link>
          </p>
        </div>

        <div className="flex" style={{ justifyContent: 'center', gap: '8px', marginTop: '2rem', opacity: 0.4, fontSize: '0.8rem', fontWeight: '700' }}>
           <ShieldCheck size={14} /> SECURE 256-BIT ENCRYPTION
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
