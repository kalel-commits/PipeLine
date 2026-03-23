import React from 'react';
import { Box, Typography, Avatar, Button } from '@mui/material';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import HistoryIcon from '@mui/icons-material/History';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import TimelineIcon from '@mui/icons-material/Timeline';
import PsychologyIcon from '@mui/icons-material/Psychology';

const SidebarItem = ({ icon, label, active = false }) => (
  <Box sx={{ 
    display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2.5,
    cursor: 'pointer', transition: '0.2s',
    bgcolor: active ? '#ffffff' : 'transparent',
    boxShadow: active ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
    '&:hover': { bgcolor: active ? '#ffffff' : 'rgba(0,0,0,0.02)' }
  }}>
    <Box sx={{ color: active ? '#3498db' : '#718096', opacity: active ? 1 : 0.6 }}>{icon}</Box>
    <Typography sx={{ 
      fontSize: '0.75rem', fontWeight: 800, 
      color: active ? '#2d3748' : '#718096',
      opacity: active ? 1 : 0.6 
    }}>
      {label}
    </Typography>
  </Box>
);

const Sidebar = () => {
  return (
    <Box sx={{ width: 280, p: 4, display: 'flex', flexDirection: 'column', gap: 4, bgcolor: 'transparent', flexShrink: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <AutoGraphIcon sx={{ color: '#3498db', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.05em', color: '#2d3748' }}>PipelineAI</Typography>
      </Box>

      <Box sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)', bgcolor: '#ffffff', shadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', gap: 2, alignItems: 'center' }}>
        <Avatar sx={{ bgcolor: '#3498db', width: 32, height: 32, borderRadius: '8px' }}><AddIcon sx={{ fontSize: 20 }} /></Avatar>
        <Box>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#718096' }}>Command</Typography>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#2d3748' }}>Center</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
        <SidebarItem icon={<DashboardIcon />} label="DASHBOARD" active />
      </Box>
    </Box>
  );
};

export default Sidebar;
