import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('civiconnect_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.auth.getMe()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          // Token invalid or expired
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem('civiconnect_token', res.access_token);
    setToken(res.access_token);
    setUser({
      user_id: res.user_id,
      email: res.email,
      name: res.name,
      role: res.role,
      preferred_language: res.preferred_language,
    });
    return res;
  };

  const register = async (name, email, password, preferred_language = 'en') => {
    const res = await api.auth.register({ name, email, password, preferred_language });
    localStorage.setItem('civiconnect_token', res.access_token);
    setToken(res.access_token);
    setUser({
      user_id: res.user_id,
      email: res.email,
      name: res.name,
      role: res.role,
      preferred_language: res.preferred_language,
    });
    return res;
  };

  const logout = () => {
    localStorage.removeItem('civiconnect_token');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const data = await api.auth.getMe();
      setUser(data);
      return data;
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
