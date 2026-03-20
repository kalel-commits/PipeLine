import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Tooltip } from '@mui/material';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

const roles = [
  { id: 'Developer', emoji: '🧑‍💻', color: '#4a9dae', bg: 'rgba(74,157,174,' }, // Teal
  { id: 'Analyst', emoji: '📊', color: '#7dc2c3', bg: 'rgba(125,194,195,' }, // Light Teal
  { id: 'Admin', emoji: '🛡️', color: '#f26f60', bg: 'rgba(242,111,96,' }, // Coral
];

const Navbar = () => {
  const { user, switchRole } = useContext(AuthContext);
  const location = useLocation();
  const currentRole = user?.role || 'Developer';
  const activeRole = roles.find(r => r.id === currentRole) || roles[0];

  return (
    <AppBar position="sticky" elevation={0} sx={{
      background: 'rgba(255, 255, 255, 0.92)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
    }}>
      <Toolbar sx={{ minHeight: 60, px: { xs: 2, md: '2rem' }, maxWidth: 1200, width: '100%', mx: 'auto', gap: 2 }}>

        {/* Logo */}
        <Box component={Link} to="/dashboard" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, textDecoration: 'none', mr: 2, '&:hover': { opacity: 0.85 } }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #f26f60, #d95e50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(242, 111, 96, 0.4)',
          }}>
            <AutoGraphIcon sx={{ fontSize: 20, color: '#fff' }} />
          </Box>
          <Typography fontWeight={800} fontSize={18} color="#2D3748" sx={{ letterSpacing: '-0.02em' }}>
            PipelineAI
          </Typography>
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Role segmented control */}
        <Box sx={{
          display: 'flex',
          background: '#f9e2b4', // Cream background for toggle
          border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: '12px',
          p: '4px',
          gap: '2px',
        }}>
          {roles.map(r => {
            const active = r.id === currentRole;
            return (
              <Tooltip key={r.id} title={`Switch to ${r.id} view`} arrow>
                <Box
                  onClick={() => switchRole && switchRole(r.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    px: { xs: 1.5, sm: 2 },
                    py: '8px',
                    borderRadius: '9px',
                    cursor: 'pointer',
                    fontWeight: active ? 700 : 600,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    whiteSpace: 'nowrap',
                    transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                    background: active
                      ? '#FFFFFF'
                      : 'transparent',
                    color: active ? r.color : 'rgba(0,0,0,0.5)',
                    boxShadow: active ? `0 2px 8px rgba(0,0,0,0.1)` : 'none',
                    '&:hover': !active ? { background: 'rgba(255,255,255,0.4)', color: 'rgba(0,0,0,0.7)' } : {},
                    userSelect: 'none',
                  }}
                >
                  <Box component="span" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, lineHeight: 1 }}>{r.emoji}</Box>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{r.id}</Box>
                </Box>
              </Tooltip>
            );
          })}
        </Box>

      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
