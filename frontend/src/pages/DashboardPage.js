import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DeveloperDashboard from './DeveloperDashboard';
import AnalystDashboard from './AnalystDashboard';
import AdminDashboard from './AdminDashboard';
import { Box, Typography, CircularProgress } from '@mui/material'; // Added CircularProgress import

const DashboardPage = () => {
  const context = useContext(AuthContext);
  // Added null-guard for context itself
  if (!context) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f5ede3', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading authentication context...</Typography>
      </Box>
    );
  }

  const user = context.user; // context is guaranteed to be not null here
  
  if (!user) return (
    <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f5ede3', minHeight: '100vh' }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Initializing secure session...</Typography>
    </Box>
  );
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
