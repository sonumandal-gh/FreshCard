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
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </main>
            <footer style={{ background: 'var(--dark)', color: 'white', padding: '4rem 0', marginTop: 'auto' }}>
              <div className="container" style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '1rem' }}>Fresh<span style={{ color: 'var(--primary)' }}>Cart.</span></h2>
                <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>&copy; 2026 FreshCart. Premium grocery experience.</p>
              </div>
            </footer>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
