import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="auth-card"
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            style={{ 
              background: 'linear-gradient(135deg, var(--secondary), var(--primary))', 
              color: 'white', 
              display: 'inline-flex', 
              padding: '1.2rem', 
              borderRadius: '24px', 
              marginBottom: '1.5rem',
              boxShadow: '0 12px 30px -5px rgba(52, 152, 219, 0.4)'
            }}
          >
            <UserPlus size={36} />
          </motion.div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '0.8rem' }}>Join the <span style={{ color: 'var(--primary)' }}>Fresh</span> Revolution</h2>
          <p style={{ color: 'var(--gray)', fontWeight: '600', fontSize: '1rem' }}>Enter your details to create your premium account</p>
        </div>

        {error && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            style={{ 
              background: '#fff1f2', 
              color: '#e11d48', 
              padding: '1rem 1.4rem', 
              borderRadius: '16px', 
              marginBottom: '2.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              fontSize: '0.95rem',
              fontWeight: '700',
              border: '1px solid #ffe4e6'
            }}
          >
            <AlertCircle size={20} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="grid" style={{ gap: '2rem' }}>
          <div className="animate-fade" style={{ animationDelay: '0.1s' }}>
            <label style={{ display: 'block', fontWeight: '800', marginBottom: '10px', fontSize: '0.95rem' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Eleanor Shellstrop" 
                style={{ paddingLeft: '48px', fontSize: '1rem' }} 
                required 
              />
            </div>
          </div>

          <div className="animate-fade" style={{ animationDelay: '0.2s' }}>
            <label style={{ display: 'block', fontWeight: '800', marginBottom: '10px', fontSize: '0.95rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eleanor@thegoodplace.com" 
                style={{ paddingLeft: '48px', fontSize: '1rem' }} 
                required 
              />
            </div>
          </div>

          <div className="animate-fade" style={{ animationDelay: '0.3s' }}>
            <label style={{ display: 'block', fontWeight: '800', marginBottom: '10px', fontSize: '0.95rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••" 
                style={{ paddingLeft: '48px', fontSize: '1rem' }} 
                required 
              />
            </div>
          </div>

          {/* Role selector removed for security - default is 'user' */}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '1.2rem', 
              fontSize: '1.1rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px',
              marginTop: '1.5rem',
              borderRadius: '18px'
            }}
          >
            {loading ? 'Creating Experience...' : (
              <>Start Shopping <ArrowRight size={22} /></>
            )}
          </motion.button>
        </form>

        <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--gray)', fontSize: '0.9rem', fontWeight: '600' }}>
          <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }}></div>
          OR
          <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }}></div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const authPath = baseUrl.endsWith('/api') ? '/users/google' : '/api/users/google';
            window.location.href = `${baseUrl}${authPath}`;
          }}
          style={{ 
            width: '100%', 
            padding: '1.1rem', 
            background: 'white',
            color: 'var(--dark)',
            border: '2px solid #f1f5f9',
            borderRadius: '16px',
            fontSize: '1rem', 
            fontWeight: '700',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px' }} />
          Sign up with Google
        </motion.button>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <p style={{ color: 'var(--gray)', fontWeight: '600' }}>
            Already a member? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '950' }}>Sign in here</Link>
          </p>
        </div>

        <div className="flex" style={{ justifyContent: 'center', gap: '2rem', marginTop: '3rem', opacity: 0.4 }}>
           <div className="flex" style={{ gap: '6px', fontSize: '0.75rem', fontWeight: '800' }}><CheckCircle2 size={12} /> VERIFIED QUALITY</div>
           <div className="flex" style={{ gap: '6px', fontSize: '0.75rem', fontWeight: '800' }}><CheckCircle2 size={12} /> SECURE PAY</div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
