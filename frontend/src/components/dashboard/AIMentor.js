import React from 'react';
import { Card, Box, Typography } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const AIMentor = ({ suggestions }) => {
  return (
    <Card sx={{ p: 4, height: '100%', bgcolor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)', borderRadius: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box sx={{ bgcolor: '#3498db', p: 1.5, borderRadius: 2, display: 'flex' }}>
           <SchoolIcon sx={{ color: '#fff' }} />
        </Box>
        <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', color: '#2d3748' }}>AI Mentor</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {suggestions?.map((s, idx) => (
          <Box key={idx} sx={{ bgcolor: '#fff', p: 3, borderRadius: 3, border: '1.5px solid rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <CalendarMonthIcon sx={{ color: '#7C3AED' }} />
              <Typography sx={{ fontWeight: 800, color: '#2d3748', fontSize: '0.9rem' }}>{s.title}</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.8rem', color: '#718096', lineHeight: 1.5 }}>
              {s.detail}
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
};

export default AIMentor;
