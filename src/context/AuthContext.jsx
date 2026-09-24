import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('stsms_admin_token'));

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      if (!token) {
        setAdmin(null);
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch('/auth/me');
        if (data.success) {
          setAdmin(data.admin);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Failed to verify admin auth session:', error.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentAdmin();
  }, [token]);

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.success) {
      localStorage.setItem('stsms_admin_token', data.token);
      setToken(data.token);
      setAdmin(data.admin);
    }
    return data;
  };

  const register = async (adminData) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });

    if (data.success) {
      localStorage.setItem('stsms_admin_token', data.token);
      setToken(data.token);
      setAdmin(data.admin);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('stsms_admin_token');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        loading,
        isAuthenticated: !!admin,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
