import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Typography } from '@mui/material';

const AuditLogTable = ({ logs }) => (
  <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1.5px solid rgba(0,0,0,0.03)' }}>
    <Table>
      <TableHead>
        <TableRow sx={{ bgcolor: '#f8fafc' }}>
          <TableCell sx={{ fontWeight: 800, color: '#718096', fontSize: '0.65rem', width: '20%' }}>USER</TableCell>
          <TableCell sx={{ fontWeight: 800, color: '#718096', fontSize: '0.65rem' }}>ACTION</TableCell>
          <TableCell sx={{ fontWeight: 800, color: '#718096', fontSize: '0.65rem', width: '15%' }}>STATUS</TableCell>
          <TableCell sx={{ fontWeight: 800, color: '#718096', fontSize: '0.65rem', width: '25%' }}>TIME</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {logs?.map((log) => (
          <TableRow key={log.id}>
            <TableCell sx={{ fontWeight: 700, color: '#2d3748' }}>{log.user_id === 1 ? 'System' : `User ${log.user_id}`}</TableCell>
            <TableCell sx={{ color: '#4a5568', fontSize: '0.85rem' }}>{log.action}</TableCell>
            <TableCell>
              <Chip label={log.status} size="small" 
                sx={{ 
                  fontWeight: 800, fontSize: '0.65rem',
                  bgcolor: log.status === 'success' ? '#def7ed' : '#fee2e2',
                  color: log.status === 'success' ? '#065f46' : '#991b1b'
                }} 
              />
            </TableCell>
            <TableCell sx={{ color: '#718096', fontSize: '0.8rem' }}>
              {new Date(log.timestamp).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default AuditLogTable;
