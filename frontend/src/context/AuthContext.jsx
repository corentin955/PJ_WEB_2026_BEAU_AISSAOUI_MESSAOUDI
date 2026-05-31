import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('vitacare_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, mot_de_passe) => {
    const res = await api.post('/auth.php?action=login', { email, mot_de_passe });
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('vitacare_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth.php?action=register', data);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('vitacare_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = async () => {
    try { await api.post('/auth.php?action=logout'); } catch {}
    setUser(null);
    localStorage.removeItem('vitacare_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
