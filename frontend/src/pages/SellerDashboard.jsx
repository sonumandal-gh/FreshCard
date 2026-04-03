import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';

const SellerDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'seller')) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="container" style={{ padding: '5rem 0', minHeight: '80vh' }}>
      <div className="flex" style={{ gap: '1rem', marginBottom: '2rem' }}>
         <LayoutDashboard size={40} style={{ color: 'var(--primary)' }} />
         <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--dark)' }}>Seller Portal</h1>
      </div>
      
      <div className="premium-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
         <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1rem' }}>Welcome, {user?.name}!</h2>
         <p style={{ color: 'var(--gray)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
           This is your dedicated seller portal. Soon you will be able to manage your own products, track your sales, and monitor your revenue right from this dashboard.
         </p>
      </div>
    </div>
  );
};

export default SellerDashboard;
