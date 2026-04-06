import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

// DEV MODE: Skip authentication, provide a mock Admin user
const MOCK_USER = { user_id: 1, role: 'Developer', name: 'Dev User', email: 'dev@local' };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState('Developer');

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // In a real app, you'd decode the JWT here to get the user info
    setUser({ ...MOCK_USER, role: 'Developer' });
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
