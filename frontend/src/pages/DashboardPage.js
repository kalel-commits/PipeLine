import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import DeveloperDashboard from './DeveloperDashboard';
import AnalystDashboard from './AnalystDashboard';
import AdminDashboard from './AdminDashboard';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // If no user exists and there is no token to hydrate from, bounce to login
    if (!user && !localStorage.getItem('token')) {
      console.log("🛡️ [ROUTER] Unauthorized access to dashboard, redirecting to login...");
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // Show a spinner while the redirect is queuing or while session is hydrating
  if (!user) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5ede3' }}>
        <CircularProgress sx={{ color: '#006397' }} />
        <Typography variant="overline" sx={{ ml: 2, color: '#006397', fontWeight: 800 }}>Verifying Session...</Typography>
      </Box>
    );
  }

  if (user.role === 'Developer') return <DeveloperDashboard />;
  if (user.role === 'Analyst') return <AnalystDashboard />;
  if (user.role === 'Admin') return <AdminDashboard />;
  
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography color="error">Unauthorized role: {user.role}</Typography>
    </Box>
  );
};

export default DashboardPage;
