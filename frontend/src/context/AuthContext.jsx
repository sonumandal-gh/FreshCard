import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getProfile()
        .then(res => {
          setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token } = res.data;
    localStorage.setItem('token', token);
    const profile = await authAPI.getProfile();
    setUser(profile.data.user);
    return profile.data.user;
  };

  const loginWithToken = async (token) => {
    localStorage.setItem('token', token);
    const profile = await authAPI.getProfile();
    setUser(profile.data.user);
    return profile.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async (name, email, password, role) => {
    await authAPI.register({ name, email, password, role });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithToken, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
