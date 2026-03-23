import React from 'react';
import { Button } from '@mui/material';

const ActionButton = ({ children, onClick, variant = 'contained', color = 'primary', ...props }) => {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      sx={{
        borderRadius: '8px',
        textTransform: 'none',
        fontWeight: 600,
        px: 3,
        py: 1,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default ActionButton;
