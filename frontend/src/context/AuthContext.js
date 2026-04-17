import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const [savedAccounts, setSavedAccounts] = useState(() => {
    try {
      const stored = localStorage.getItem('savedAccounts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    setSavedAccounts(prev => {
      const exists = prev.find(a => a.user.id === userData.id);
      const updated = exists
        ? prev.map(a => a.user.id === userData.id ? { user: userData, token: authToken } : a)
        : [...prev, { user: userData, token: authToken }];
      localStorage.setItem('savedAccounts', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const removeAccount = (userId) => {
    setSavedAccounts(prev => {
      const updated = prev.filter(a => a.user.id !== userId);
      localStorage.setItem('savedAccounts', JSON.stringify(updated));
      return updated;
    });
    if (user && user.id === userId) {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, savedAccounts, removeAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
