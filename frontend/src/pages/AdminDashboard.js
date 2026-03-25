import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import SystemStats from '../components/SystemStats';
import AuditLogTable from '../components/AuditLogTable';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, IconButton, Tooltip, Alert, CircularProgress,
  Pagination, Chip
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const PAGE_SIZE = 10;

const roleColor = { Developer: 'primary', Analyst: 'success', Admin: 'warning' };

const AdminDashboard = () => {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchUsers(); }, [page]);

  const fetchUsers = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/admin/users?page=${page}&size=${PAGE_SIZE}${location.search ? '&' + location.search.substring(1) : ''}`);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to load users'); }
    setLoading(false);
  };

  const act = async (userId, action) => {
    if (!window.confirm(`${action} this user?`)) return;
    try {
      if (action === 'activate') await api.put(`/admin/users/${userId}/activate`);
      if (action === 'deactivate') await api.put(`/admin/users/${userId}/deactivate`);
      if (action === 'unlock') await api.put(`/admin/users/${userId}/unlock`);
      if (action === 'delete') await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (err) { setError(err.response?.data?.detail || 'Action failed'); }
  };

  const Panel = ({ children, title }) => (
    <Card sx={{ mb: 3 }}>
      {title && (
        <Box sx={{ pb: 1, mb: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography variant="overline">{title}</Typography>
        </Box>
      )}
      {children}
    </Card>
  );

  return (
    <Box className="page-container">
      {/* Header */}
      <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245,158,11,0.3)' }}>
          <AdminPanelSettingsIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
        </Box>
        <Box>
          <Typography variant="h2" sx={{ color: '#2d3748' }}>Admin Console</Typography>
          <Typography variant="subtitle1">System overview, user management, and audit logging</Typography>
        </Box>
      </Box>

      {/* Stats */}
      <SystemStats />

      {/* Users */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Panel title="User Management">
        {loading && <Box sx={{ py: 3, textAlign: 'center' }}><CircularProgress size={24} sx={{ color: 'var(--primary)' }} /></Box>}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Failed&nbsp;Logins</TableCell>
                <TableCell>Locked</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{u.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                  </TableCell>
                  <TableCell><Chip label={u.role} color={roleColor[u.role] || 'default'} size="small" /></TableCell>
                  <TableCell>
                    <Box sx={{
                      display: 'inline-block', px: 1, py: 0.25, borderRadius: '5px',
                      fontSize: '0.7rem', fontWeight: 700,
                      background: u.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                      border: `1px solid ${u.is_active ? 'rgba(16,185,129,0.3)' : 'rgba(107,114,128,0.2)'}`,
                      color: u.is_active ? '#10b981' : '#6b7280',
                    }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ color: u.failed_login_attempts > 0 ? '#f59e0b' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {u.failed_login_attempts}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{
                      display: 'inline-block', px: 1, py: 0.25, borderRadius: '5px',
                      fontSize: '0.7rem', fontWeight: 700,
                      background: u.is_locked ? 'rgba(239,68,68,0.1)' : 'transparent',
                      border: `1px solid ${u.is_locked ? 'rgba(239,68,68,0.3)' : 'transparent'}`,
                      color: u.is_locked ? '#ef4444' : 'var(--text-muted)',
                    }}>
                      {u.is_locked ? 'Locked' : '—'}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end' }}>
                      <Tooltip title="Activate">
                        <IconButton size="small" onClick={() => act(u.id, 'activate')} disabled={u.is_active}
                          sx={{ color: '#10b981', '&:hover': { background: 'rgba(16,185,129,0.1)' } }}>
                          <CheckCircleIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deactivate">
                        <IconButton size="small" onClick={() => act(u.id, 'deactivate')} disabled={!u.is_active}
                          sx={{ color: '#6b7280', '&:hover': { background: 'rgba(107,114,128,0.1)' } }}>
                          <BlockIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Unlock">
                        <IconButton size="small" onClick={() => act(u.id, 'unlock')} disabled={!u.is_locked}
                          sx={{ color: '#6366f1', '&:hover': { background: 'rgba(99,102,241,0.1)' } }}>
                          <LockOpenIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => act(u.id, 'delete')}
                          sx={{ color: '#ef4444', '&:hover': { background: 'rgba(239,68,68,0.1)' } }}>
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && !users.length && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', color: 'var(--text-muted)', py: 5 }}>
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {total > PAGE_SIZE && (
          <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
            <Pagination count={Math.ceil(total / PAGE_SIZE)} page={page} onChange={(_, p) => setPage(p)} size="small" />
          </Box>
        )}
      </Panel>

      {/* Audit logs */}
      <Panel title="Audit Logs">
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <AuditLogTable />
        </Box>
      </Panel>
    </Box>
  );
};

export default AdminDashboard;
