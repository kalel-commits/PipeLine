import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/client";
import {
  Box, Typography, CircularProgress, Grid, Button
} from '@mui/material';
import Sidebar from "../components/layout/Sidebar";
import RiskCard from "../components/dashboard/RiskCard";
import AIMentor from "../components/dashboard/AIMentor";
import SHAPChart from "../components/dashboard/SHAPChart";

export default function Dashboard() {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const predRes = await api.get(`/predict/latest?t=${Date.now()}`);
      if (predRes.data) setData(predRes.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Unable to connect to the AI engine.");
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) return (
    <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5ede3' }}>
      <CircularProgress sx={{ color: '#3498db' }} />
    </Box>
  );

  if (error || !data) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5ede3', p: 3, textAlign: 'center' }}>
      <Typography variant="h5" color="error" gutterBottom>⚠️ {error || "No data available"}</Typography>
      <Button variant="contained" onClick={fetchAll} sx={{ mt: 2, bgcolor: '#3498db' }}>Retry</Button>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5ede3' }}>
      <Sidebar />
      <Box sx={{ flex: 1, p: 6, overflowY: 'auto' }}>
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" sx={{ color: '#2d3748' }}>PipelineAI Dashboard</Typography>
          <Typography variant="body1" sx={{ color: '#718096' }}>Real-time predictive CI/CD intelligence.</Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <RiskCard 
              risk={data.risk} 
              category={data.risk_category} 
              confidence={data.confidence} 
              reason={data.reason} 
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <AIMentor suggestions={data.suggestions} />
          </Grid>

          <Grid item xs={12} md={12}>
            <SHAPChart shapValues={data.shap_values} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
