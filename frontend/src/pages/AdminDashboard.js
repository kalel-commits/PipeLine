import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import { Box, Typography, Grid, CircularProgress, Alert, Pagination } from '@mui/material';
import Sidebar from '../components/layout/Sidebar';
import StatsCard from '../components/dashboard/StatsCard';
import AuditLogTable from '../components/dashboard/AuditLogTable';
import UserTable from '../components/dashboard/UserTable';
import PeopleIcon from '@mui/icons-material/People';
import StorageIcon from '@mui/icons-material/Storage';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SpeedIcon from '@mui/icons-material/Speed';

const PAGE_SIZE = 10;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const fetchData = useCallback(async () => {
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        api.get('/admin/system-stats'),
        api.get(`/admin/users?page=${page}&size=${PAGE_SIZE}`),
        api.get('/admin/audit-logs?size=10')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setTotalUsers(usersRes.data.total || 0);
      setLogs(logsRes.data.logs);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleUserAction = async (userId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await api.post(`/admin/users/${userId}/action`, { action });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5ede3' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5ede3' }}>
      <Sidebar />
      <Box sx={{ flex: 1, p: 6 }}>
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" sx={{ color: '#2d3748' }}>AI Console</Typography>
          <Typography variant="body1" sx={{ color: '#718096' }}>System governance and audit transparency.</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={3}>
            <StatsCard label="Total Users" value={stats?.total_users} icon={<PeopleIcon />} />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatsCard label="Datasets" value={stats?.total_datasets} icon={<StorageIcon />} color="#9b59b6" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatsCard label="Models Trained" value={stats?.total_models} icon={<PsychologyIcon />} color="#e67e22" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatsCard label="Predictions Run" value={stats?.total_predictions} icon={<SpeedIcon />} color="#1abc9c" />
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          <Grid item xs={12} lg={7}>
            <Typography variant="h5" sx={{ color: '#2d3748', mb: 3, fontWeight: 800 }}>User Management</Typography>
            <UserTable users={users} onAction={handleUserAction} />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Pagination count={Math.ceil(totalUsers / PAGE_SIZE)} page={page} onChange={(_, p) => setPage(p)} />
            </Box>
          </Grid>
          <Grid item xs={12} lg={5}>
            <Typography variant="h5" sx={{ color: '#2d3748', mb: 3, fontWeight: 800 }}>Latest Activity</Typography>
            <AuditLogTable logs={logs} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
