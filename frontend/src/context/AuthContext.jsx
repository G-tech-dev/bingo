import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      if (!user) {
        loadUser();
      } else {
        setLoading(false);
      }
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await authService.getMe();
      const currentUser = response.data.user;
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      setLoading(false);

      toast.success('Welcome back!');
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const activatePremium = async (plan = 'basic') => {
    try {
      const response = await authService.activatePremium(plan);
      setUser(response.data.user);
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Premium activation failed' };
    }
  };

  const isPremiumCreator = Boolean(
    user?.isPremium && (!user?.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date())
  );

  const value = {
    user,
    loading,
    token,
    login,
    activatePremium,
    logout,
    isAuthenticated: !!user,
    isCreator: user?.role === 'creator' || user?.role === 'both',
    isAdmin: user?.role === 'admin',
    isPremiumCreator,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};