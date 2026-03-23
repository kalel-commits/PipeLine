import React from 'react';
import { Card, Box, Typography, Chip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

const RiskCard = ({ risk, category, confidence, reason }) => {
  const riskPercentage = (risk * 100).toFixed(1);

  return (
    <Card sx={{ p: 4, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#718096', fontSize: '0.75rem' }}>
          Risk Probability
        </Typography>
        <Chip label={`${category} Risk`} size="small" 
           sx={{ fontWeight: 800, background: '#fef3c7', color: '#f59e0b', fontSize: '0.65rem' }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '80px', fontWeight: 900, color: '#2d3748', lineHeight: 1 }}>{riskPercentage}%</Typography>
        <Typography sx={{ fontWeight: 800, color: '#718096' }}>Confidence</Typography>
      </Box>
      <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: '#fef3c7', display: 'flex', gap: 2, alignItems: 'center' }}>
        <InfoIcon sx={{ color: '#f59e0b' }} />
        <Typography sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>
          {reason}
        </Typography>
      </Box>
    </Card>
  );
};

export default RiskCard;
