import React from 'react';
import { Card, Box, Typography, LinearProgress } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

const SHAPChart = ({ shapValues }) => {
  return (
    <Card sx={{ p: 4, height: '100%', borderRadius: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', color: '#2d3748', fontSize: '0.9rem' }}>
          SHAP Feature Importance
        </Typography>
        <InfoIcon sx={{ color: '#2d3748', opacity: 0.6 }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {shapValues?.map((sv, idx) => (
          <Box key={idx}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#2d3748' }}>{sv.feature.toUpperCase()}</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: sv.shap_value > 0 ? '#1e5f74' : '#7C3AED' }}>
                {sv.shap_value > 0 ? '+' : ''}{sv.shap_value.toFixed(2)}
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={Math.min(Math.abs(sv.shap_value) * 100, 100)} 
              sx={{ 
                height: 10, borderRadius: 5, bgcolor: '#f1f5f9',
                '& .MuiLinearProgress-bar': { bgcolor: sv.shap_value > 0 ? '#1e5f74' : '#7C3AED', borderRadius: 5 }
              }} />
          </Box>
        ))}
      </Box>
    </Card>
  );
};

export default SHAPChart;
