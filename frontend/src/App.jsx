import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminUsersPage from './pages/AdminUsersPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import AuthSuccess from './pages/AuthSuccess';
import CartDrawer from './components/CartDrawer';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <CartDrawer />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth-success" element={<AuthSuccess />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </main>
            <footer style={{ background: '#0f172a', color: 'white', padding: '4.5rem 0 2.5rem', marginTop: 'auto', borderTop: '1px solid #1e293b' }}>
              <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', marginBottom: '3.5rem' }}>
                  
                  {/* Brand column */}
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '1rem', color: 'white' }}>
                      Fresh<span style={{ color: '#16a34a' }}>Cart.</span>
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.2rem' }}>
                      Farm-fresh vegetables, seasonal fruits, organic dairy, and everyday pantry essentials delivered to your doorstep in 15–30 minutes.
                    </p>
                    <div style={{ display: 'flex', gap: '8px', color: '#16a34a', fontSize: '0.82rem', fontWeight: '800' }}>
                      <span>● Certified Organic</span>
                      <span>● Doorstep Return</span>
                    </div>
                  </div>

                  {/* Departments */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.2rem' }}>
                      Departments
                    </h4>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>
                      <li><a href="/#categories-section" style={{ color: '#94a3b8' }}>Fruits & Vegetables</a></li>
                      <li><a href="/#categories-section" style={{ color: '#94a3b8' }}>Dairy & Bakery</a></li>
                      <li><a href="/#categories-section" style={{ color: '#94a3b8' }}>Snacks & Munchies</a></li>
                      <li><a href="/#categories-section" style={{ color: '#94a3b8' }}>Rice, Atta & Pulses</a></li>
                    </ul>
                  </div>

                  {/* Customer Service */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.2rem' }}>
                      Customer Care
                    </h4>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>
                      <li><a href="/orders" style={{ color: '#94a3b8' }}>Track Live Delivery</a></li>
                      <li><a href="/cart" style={{ color: '#94a3b8' }}>View Basket</a></li>
                      <li><a href="tel:+919830012345" style={{ color: '#94a3b8' }}>24/7 Support Hotline</a></li>
                      <li><span style={{ color: '#94a3b8' }}>Instant Doorstep Refund</span></li>
                    </ul>
                  </div>

                  {/* Security & Verification */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.2rem' }}>
                      Safe Payments
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                      All transactions are 256-bit encrypted with Razorpay & Cash on Delivery support.
                    </p>
                    <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '12px', display: 'inline-block', fontSize: '0.78rem', color: '#38bdf8', fontWeight: '700' }}>
                      🛡️ Razorpay Verified Merchant
                    </div>
                  </div>

                </div>

                {/* Bottom line */}
                <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                  <p>&copy; {new Date().getFullYear()} FreshCart Technologies Inc. All rights reserved.</p>
                  <p>Hand-harvested freshness delivered with care.</p>
                </div>
              </div>
            </footer>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
