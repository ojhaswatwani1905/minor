import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = async () => {
    try {
      setLoading(true);
      const storedToken = await storage.getItem('stsms_mobile_token');
      const storedUser = await storage.getItem('stsms_mobile_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Session restore error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success && res.token) {
      setToken(res.token);
      const userData = res.user || res.admin || { email, name: 'Registered Tourist' };
      setUser(userData);
      await storage.setItem('stsms_mobile_token', res.token);
      await storage.setItem('stsms_mobile_user', JSON.stringify(userData));
    }
    return res;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res.success && res.token) {
      setToken(res.token);
      const newUser = res.user || res.admin || { email: userData.email, name: userData.name };
      setUser(newUser);
      await storage.setItem('stsms_mobile_token', res.token);
      await storage.setItem('stsms_mobile_user', JSON.stringify(newUser));
    }
    return res;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await storage.removeItem('stsms_mobile_token');
    await storage.removeItem('stsms_mobile_user');
  };

  const updateUser = async (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    await storage.setItem('stsms_mobile_user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!token, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
