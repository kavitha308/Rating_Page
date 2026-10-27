import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

import { getRoleRedirectPath } from '../utils/navigation';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  // If user and token already exist in localStorage, do not block initial render with fullScreen loader
  const [loading, setLoading] = useState(() => {
    return Boolean(localStorage.getItem('token') && !localStorage.getItem('user'));
  });
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // Listen for session expired events from axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
      setSessionExpiredMessage('Your session has expired. Please log in again to continue.');
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, [logout]);

  // Load current user profile on initial app boot or refresh
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await authService.getMe();
        if (response && response.success && response.data?.user) {
          if (isMounted) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        }
      } catch (err) {
        // ONLY log out if explicitly an unauthorized 401 error (token expired or invalidated)
        if (err.status === 401 || err.response?.status === 401) {
          if (isMounted) logout();
        }
        // For temporary network glitches or timeouts, keep the user logged in using cached profile
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  // Login action
  const login = async (email, password) => {
    setSessionExpiredMessage('');
    const response = await authService.login({ email, password });
    const { token: receivedToken, user: receivedUser } = response.data;

    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  // Register action
  const register = async (userData) => {
    setSessionExpiredMessage('');
    return await authService.register(userData);
  };

  // Update password action
  const updatePassword = async (currentPassword, newPassword) => {
    return await authService.updatePassword({ currentPassword, newPassword });
  };

  const clearSessionMessage = () => {
    setSessionExpiredMessage('');
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    loading,
    sessionExpiredMessage,
    clearSessionMessage,
    login,
    register,
    updatePassword,
    logout,
    getRoleRedirectPath
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
