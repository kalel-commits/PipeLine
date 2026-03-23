import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Chip, IconButton, Tooltip, Box 
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const UserTable = ({ users, onAction }) => {
  const roleColor = { Developer: 'primary', Analyst: 'success', Admin: 'warning' };

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1.5px solid rgba(0,0,0,0.03)' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f8fafc' }}>
            <TableCell sx={{ fontWeight: 800, color: '#718096', fontSize: '0.7rem' }}>USER</TableCell>
            <TableCell sx={{ fontWeight: 800, color: '#718096', fontSize: '0.7rem' }}>ROLE</TableCell>
            <TableCell sx={{ fontWeight: 800, color: '#718096', fontSize: '0.7rem' }}>STATUS</TableCell>
            <TableCell align="right" sx={{ fontWeight: 800, color: '#718096', fontSize: '0.7rem' }}>ACTIONS</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <Typography variant="body2" fontWeight={700} color="#2d3748">{u.name}</Typography>
                <Typography variant="caption" color="text.secondary">{u.email}</Typography>
              </TableCell>
              <TableCell>
                <Chip label={u.role} color={roleColor[u.role] || 'default'} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
              </TableCell>
              <TableCell>
                <Chip 
                   label={u.is_active ? 'Active' : 'Inactive'} 
                   size="small" 
                   sx={{ 
                     fontWeight: 800, fontSize: '0.65rem',
                     bgcolor: u.is_active ? '#def7ed' : '#f1f5f9',
                     color: u.is_active ? '#065f46' : '#64748b'
                   }} 
                />
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  <Tooltip title="Activate">
                    <IconButton size="small" onClick={() => onAction(u.id, 'activate')} disabled={u.is_active} color="success">
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Deactivate">
                    <IconButton size="small" onClick={() => onAction(u.id, 'deactivate')} disabled={!u.is_active}>
                      <BlockIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => onAction(u.id, 'delete')} color="error">
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UserTable;
