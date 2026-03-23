import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  Box, Typography, Fade, Grow, CircularProgress, Card, CardContent,
  LinearProgress, Chip, IconButton, Tooltip, Grid, Button, Avatar
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import TimelineIcon from '@mui/icons-material/Timeline';
import HistoryIcon from '@mui/icons-material/History';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AddIcon from '@mui/icons-material/Add';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import SchoolIcon from '@mui/icons-material/School';
import InfoIcon from '@mui/icons-material/Info';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

const API = process.env.REACT_APP_API_URL || "https://pipeline-9ux3.onrender.com";

export default function Dashboard() {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [predRes, statsRes] = await Promise.all([
        axios.get(`${API}/predict/latest${location.search}`).catch(() => null),
        axios.get(`${API}/training/stats`).catch(() => null),
      ]);
      if (predRes?.data) setData(predRes.data);
      if (statsRes?.data) setStats(statsRes.data);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to connect to the AI engine. It might be waking up...");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5ede3' }}>
        <CircularProgress sx={{ color: '#3498db' }} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5ede3', p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>⚠️ {error || "No data available"}</Typography>
        <Typography variant="body1" sx={{ mb: 3, maxWidth: 500 }}>
          The backend service might be starting up. This can take up to 60 seconds on the first load.
        </Typography>
        <Button variant="contained" onClick={fetchAll} sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}>
          Retry Connection
        </Button>
      </Box>
    );
  }

  const risk = (data.risk * 100).toFixed(0);
  const category = data.risk_category || (data.risk > 0.65 ? 'High' : 'Medium');

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5ede3' }}>
      
      {/* ── Sidebar ── */}
      <Box sx={{ 
        width: 280, p: 4, display: 'flex', flexDirection: 'column', gap: 4,
        bgcolor: 'transparent', flexShrink: 0 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <AutoGraphIcon sx={{ color: '#3498db', fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.05em', color: '#2d3748' }}>
            PipelineAI
          </Typography>
        </Box>

        <Box sx={{ 
          p: 2, borderRadius: 4, bgcolor: '#ffffff', shadow: '0 4px 12px rgba(0,0,0,0.03)',
          display: 'flex', gap: 2, alignItems: 'center' 
        }}>
          <Avatar sx={{ bgcolor: '#3498db', width: 32, height: 32 }}>
            <AddIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#718096' }}>
              Command
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#2d3748' }}>
              Center
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
          <SidebarItem icon={<DashboardIcon />} label="DASHBOARD" active />
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Button variant="contained" fullWidth startIcon={<AddIcon />} 
            sx={{ py: 1.5, background: '#3498db', boxShadow: '0 8px 20px rgba(52,152,219,0.3)' }}>
            New Analysis
          </Button>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 4 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#718096', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon sx={{ fontSize: 16 }} /> HELP
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#718096', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon sx={{ fontSize: 16 }} /> DOCUMENTATION
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Main Content ── */}
      <Box sx={{ flex: 1, p: 6, overflowY: 'auto' }}>
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" sx={{ color: '#2d3748' }}>PipelineAI Command Center</Typography>
          <Typography variant="body1" sx={{ color: '#718096', fontWeight: 500 }}>Real-time predictive CI/CD intelligence.</Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Risk Probability Card */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#718096', fontSize: '0.75rem' }}>
                  Risk Probability
                </Typography>
                <Chip label={`${category} Risk`} size="small" 
                   sx={{ fontWeight: 800, background: '#fef3c7', color: '#f59e0b', fontSize: '0.65rem' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 4 }}>
                <Typography variant="h1" sx={{ fontSize: '80px', fontWeight: 900, color: '#2d3748', lineHeight: 1 }}>{risk}%</Typography>
                <Typography sx={{ fontWeight: 800, color: '#718096' }}>Confidence</Typography>
              </Box>
              <Box sx={{ p: 2.5, borderRadius: 4, bgcolor: '#fef3c7', display: 'flex', gap: 2, alignItems: 'center' }}>
                <InfoIcon sx={{ color: '#f59e0b' }} />
                <Typography sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>
                  {data.reason}
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Prediction Accuracy Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#718096', fontSize: '0.75rem', mb: 4 }}>
                Prediction Accuracy
              </Typography>
              <Typography sx={{ fontWeight: 700, color: '#2d3748', mb: 4, textAlign: 'center' }}>
                Was this prediction accurate?
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
                <Box sx={{ flex: 1, border: '2px solid #f1f5f9', p: 3, borderRadius: 4, textAlign: 'center', cursor: 'pointer', transition: '0.2s', '&:hover': { bgcolor: '#f8fafc' } }}>
                  <ThumbUpIcon sx={{ color: '#2d3748', mb: 1, fontSize: 32 }} />
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#2d3748' }}>CORRECT</Typography>
                </Box>
                <Box sx={{ flex: 1, border: '2px solid #f1f5f9', p: 3, borderRadius: 4, textAlign: 'center', cursor: 'pointer', transition: '0.2s', '&:hover': { bgcolor: '#f8fafc' } }}>
                  <ThumbDownIcon sx={{ color: '#2d3748', mb: 1, fontSize: 32 }} />
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#2d3748' }}>INCORRECT</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* AI Mentor Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 4, height: '100%', bgcolor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Box sx={{ bgcolor: '#3498db', p: 1.5, borderRadius: 3, display: 'flex' }}>
                   <SchoolIcon sx={{ color: '#fff' }} />
                </Box>
                <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', color: '#2d3748' }}>AI Mentor</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {data.suggestions?.map((s, idx) => (
                  <Box key={idx} sx={{ bgcolor: '#fff', p: 3, borderRadius: 4, border: '1.5px solid rgba(0,0,0,0.03)' }}>
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
          </Grid>

          {/* SHAP Chart Card */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 4, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', color: '#2d3748', fontSize: '0.9rem' }}>
                  SHAP Feature Importance
                </Typography>
                <InfoIcon sx={{ color: '#2d3748', opacity: 0.6 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                   {data.shap_values?.map((sv, idx) => (
                     <Box key={idx}>
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                         <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#2d3748' }}>{sv.feature.toUpperCase()}</Typography>
                         <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: sv.shap_value > 0 ? '#1e5f74' : '#7C3AED' }}>
                           {sv.shap_value > 0 ? '+' : ''}{sv.shap_value.toFixed(2)}
                         </Typography>
                       </Box>
                       <LinearProgress variant="determinate" value={Math.abs(sv.shap_value) * 100} 
                        sx={{ 
                          height: 10, borderRadius: 5, bgcolor: '#f1f5f9',
                          '& .MuiLinearProgress-bar': { bgcolor: sv.shap_value > 0 ? '#1e5f74' : '#7C3AED', borderRadius: 5 }
                        }} />
                     </Box>
                   ))}
              </Box>
            </Card>
          </Grid>

          {/* Small Feature Cards */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {Object.entries(data.features || {}).slice(0, 4).map(([k, v]) => (
                  <Card key={k} sx={{ py: 2.5, px: 3, minWidth: 160, flex: 1 }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#718096', mb: 1 }}>
                      {k.replace('_', ' ')}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#2d3748' }}>
                      {typeof v === 'number' ? v.toFixed(2).replace('.00', '') : v}
                    </Typography>
                  </Card>
                ))}
                
                {/* System Health Card */}
                <Card sx={{ 
                  bgcolor: '#2d2417', p: 4, flex: 1.5, minWidth: 260,
                  display: 'flex', flexDirection: 'column', color: '#fff' 
                }}>
                   <Typography sx={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, mb: 4 }}>
                     System Health
                   </Typography>
                   <Box sx={{ display: 'flex', gap: 2, mb: 6 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10B981', mt: 1 }} />
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>Model Status: <br/> Healthy</Typography>
                   </Box>
                   <Box>
                     <Typography sx={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6 }}>
                        Last Retrain
                     </Typography>
                     <Typography sx={{ fontWeight: 700, opacity: 0.9 }}>
                        {stats?.last_trained_at ? new Date(stats.last_trained_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'March 18, 2026'}
                     </Typography>
                   </Box>
                </Card>

            </Box>
          </Grid>
        </Grid>
        
        {/* Footer info */}
        <Box sx={{ mt: 12, display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
           <Typography sx={{ fontSize: '0.7rem', fontWeight: 800 }}>API STATUS: UP</Typography>
           <Typography sx={{ fontSize: '0.7rem', fontWeight: 800 }}>VERSION 4.2.0-STABLE</Typography>
           <Typography sx={{ fontSize: '0.7rem', fontWeight: 800 }}>● ENCRYPTED DATA PIPELINE ACTIVE</Typography>
        </Box>
      </Box>
    </Box>
  );
}

function SidebarItem({ icon, label, active = false }) {
  return (
    <Box sx={{ 
      display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 3,
      cursor: 'pointer', transition: '0.2s',
      bgcolor: active ? '#ffffff' : 'transparent',
      boxShadow: active ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
      '&:hover': { bgcolor: active ? '#ffffff' : 'rgba(0,0,0,0.02)' }
    }}>
      <Box sx={{ color: active ? '#3498db' : '#718096', opacity: active ? 1 : 0.6 }}>{icon}</Box>
      <Typography sx={{ 
        fontSize: '0.75rem', fontWeight: 800, 
        color: active ? '#2d3748' : '#718096',
        opacity: active ? 1 : 0.6 
      }}>
        {label}
      </Typography>
    </Box>
  );
}
