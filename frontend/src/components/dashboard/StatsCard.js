import React from 'react';
import { Card, Box, Typography } from '@mui/material';

const StatsCard = ({ label, value, icon, color = '#3498db' }) => (
  <Card sx={{ p: 3, flex: 1, minWidth: 200, borderRadius: 2.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
      <Box sx={{ color, opacity: 0.8 }}>{icon}</Box>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#718096' }}>
        {label}
      </Typography>
    </Box>
    <Typography variant="h4" sx={{ fontWeight: 900, color: '#2d3748' }}>
      {value}
    </Typography>
  </Card>
);

export default StatsCard;
