import React, { createContext, useState, useEffect } from 'react';

import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState('Developer');

  // Hydrate user from token on startup
  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          setUser(res.data);
          setRole(res.data.role);
          console.log("✅ [AUTH FLOW] Session hydrated for:", res.data.email);
        } catch (err) {
          console.error("❌ [AUTH FLOW] Session invalid. Logging out.");
          logout();
        }
      }
    };
    fetchMe();
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // User will be hydrated automatically due to the useEffect above
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const switchRole = (newRole) => {
    setRole(newRole);
    if (user) setUser({ ...user, role: newRole });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};
