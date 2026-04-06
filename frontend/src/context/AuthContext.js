import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

// DEV MODE: Skip authentication, provide a mock Admin user
const MOCK_USER = { user_id: 1, role: 'Developer', name: 'Dev User', email: 'dev@local' };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState('Developer');

  // Hydrate user from token on startup
  useEffect(() => {
    if (token) {
      // For the demo, we assume the token is valid and just set the mock user
      setUser({ ...MOCK_USER, role: 'Developer' });
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
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
