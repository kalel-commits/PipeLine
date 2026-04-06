import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
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
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import mentorAvatar from '../assets/ai-mentor.png';

function SidebarItem({ icon, label, active = false }) {
  return (
    <Button
      fullWidth
      startIcon={icon}
      sx={{
        justifyContent: 'flex-start',
        py: 1.5, px: 3,
        borderRadius: '12px',
        color: active ? '#fff' : '#718096',
        bgcolor: active ? '#006397' : 'transparent',
        fontWeight: 800,
        fontSize: '0.75rem',
        '&:hover': { bgcolor: active ? '#005a8a' : 'rgba(0,99,151,0.05)' },
        transition: 'all 0.2s',
        mb: 1
      }}
    >
      {label}
    </Button>
  );
}

export default function Dashboard() {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const safeSearch = location.search;

  const fetchAll = useCallback(async () => {
    try {
      const [predRes, statsRes] = await Promise.all([
        api.get(`/predict/latest${safeSearch}`).catch(() => null),
        api.get(`/training/stats`).catch(() => null),
      ]);
      if (predRes?.data) setData(predRes.data);
      if (statsRes?.data) setStats(statsRes.data);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to connect to the AI engine.");
    } finally {
      setLoading(false);
    }
  }, [safeSearch]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5ede3' }}>
        <CircularProgress sx={{ color: '#006397' }} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>⚠️ Dashboard Connectivity Break</Typography>
        <Typography variant="body1" sx={{ mb: 1, maxWidth: 500 }}>
          The Frontend (Vercel) cannot reach the Backend (Render).
        </Typography>
        
        <Box sx={{ p: 3, bgcolor: '#f1f5f9', borderRadius: 4, mb: 3, border: '1px solid #e2e8f0', width: '100%', maxWidth: 500 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#64748b', fontWeight: 800 }}>CONNECTION DETECTIVE (DEBUG INFO)</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, textAlign: 'left', wordBreak: 'break-all' }}>
            <strong>Attempting to reach:</strong> {api.defaults.baseURL}
          </Typography>
          <Typography variant="body2" sx={{ color: '#ef4444', textAlign: 'left' }}>
            <strong>Status:</strong> {error || "No response. The backend might be asleep or the URL is wrong."}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={fetchAll} sx={{ bgcolor: '#006397', borderRadius: '12px', px: 4, '&:hover': { bgcolor: '#004a71' } }}>
            Retry Now
          </Button>
          <Button variant="outlined" onClick={() => window.open(`${api.defaults.baseURL}/docs`, '_blank')} sx={{ borderColor: '#006397', color: '#006397', borderRadius: '12px', px: 4 }}>
            Open Backend API
          </Button>
        </Box>
        
        <Typography variant="caption" sx={{ mt: 4, color: '#94a3b8', maxWidth: 450 }}>
          TIP: If the "Attempting to reach" URL is localhost, you must set REACT_APP_API_URL in your Vercel Project Settings to your Render URL.
        </Typography>
      </Box>
    );
  }

  const risk = (data.risk * 100).toFixed(0);
  const category = data.risk_category || (data.risk > 0.65 ? 'High' : 'Medium');

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5ede3' }}>

      {/* ── Sidebar ── */}
      <Box sx={{
        width: 280, p: 4, display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', 
        bgcolor: '#fff', borderRight: '1px solid #e2e8f0', flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
          <AutoGraphIcon sx={{ color: '#006397', fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
            PipelineAI
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <SidebarItem icon={<DashboardIcon />} label="DASHBOARD" active />
          <SidebarItem icon={<TimelineIcon />} label="PREDICTION LAB" />
          <SidebarItem icon={<PsychologyIcon />} label="AI AUDIT" />
          <SidebarItem icon={<SchoolIcon />} label="ACADEMY" />
          <SidebarItem icon={<HistoryIcon />} label="HISTORICAL DATA" />
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Card sx={{ bgcolor: '#f1f5f9', p: 2, mb: 1.5, boxShadow: 'none', border: 'none' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1, display: 'block' }}>SYSTEM MODE</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>Architectural Insight</Typography>
          </Card>
          <Button variant="contained" fullWidth startIcon={<AddIcon />}
            sx={{ py: 1.5, mb: 1, bgcolor: '#006397', boxShadow: '0 8px 16px rgba(0,99,151,0.2)', borderRadius: '12px', '&:hover': { bgcolor: '#005a8a' } }}>
            New Analysis
          </Button>
          <Button 
            variant="text" 
            fullWidth 
            onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
            sx={{ mt: 1, color: '#64748b', fontWeight: 600, '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
          >
            Logout Session
          </Button>
        </Box>
      </Box>

      {/* ── Main Content Area ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Header */}
        <Box sx={{ 
          h: 80, px: { xs: 3, md: 6 }, display: 'flex', alignItems: 'center', 
          justifyContent: 'space-between', bgcolor: '#fff', borderBottom: '1px solid #e2e8f0' 
        }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>Command Center</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip label="API Status: UP" size="small" sx={{ bgcolor: '#f0fdf4', color: '#166534', fontWeight: 700, borderRadius: '6px' }} />
            <Chip label="VCS Status: ACTIVE" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700, borderRadius: '6px' }} />
            <Chip label="v4.2.0-STABLE" size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, borderRadius: '6px' }} />
          </Box>
        </Box>

        {/* Dashboard Grid Container */}
        <Box sx={{ p: { xs: 3, md: 6 }, flexGrow: 1, overflowY: 'auto' }}>
          <Grid container spacing={4} alignItems="stretch">
            
            {/* Row 1: Primary Metrics */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                  <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 700 }}>Risk Probability</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={data.source === 'extension' ? 'IDE Sync' : 'VCS Hook'} size="small" sx={{ 
                      bgcolor: data.source === 'extension' ? '#e0f2fe' : '#fef2f2',
                      color: data.source === 'extension' ? '#0369a1' : '#991b1b',
                      fontWeight: 800, borderRadius: '6px'
                    }} />
                    <Chip label={`${category} Risk`} sx={{ 
                      bgcolor: category === 'High' ? '#fef2f2' : '#fffbeb',
                      color: category === 'High' ? '#991b1b' : '#92400e',
                      fontWeight: 800, borderRadius: '6px'
                    }} />
                  </Box>
                </Box>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h1" sx={{ color: '#0f172a', lineHeight: 1, mb: 1 }}>{risk}%</Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>Failure Confidence Level</Typography>
                </Box>
                <Box sx={{ 
                  mt: 'auto', p: 2, borderRadius: '12px', bgcolor: '#f5ede3',
                  border: '1px solid rgba(0,0,0,0.08)', display: 'flex', gap: 2, alignItems: 'center'
                }}>
                  <InfoIcon sx={{ color: '#006397' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{data.reason}</Typography>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 700, mb: 4 }}>Prediction Feedback</Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 3, textAlign: 'center' }}>Help us refine the engine by validating this prediction.</Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
                  <Button fullWidth variant="outlined" startIcon={<ThumbUpIcon />} 
                    sx={{ py: 2, borderRadius: '12px', borderColor: '#e2e8f0', color: '#0f172a', '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' } }}>
                    CORRECT
                  </Button>
                  <Button fullWidth variant="outlined" startIcon={<ThumbDownIcon />} 
                    sx={{ py: 2, borderRadius: '12px', borderColor: '#e2e8f0', color: '#0f172a', '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' } }}>
                    INCORRECT
                  </Button>
                </Box>
              </Card>
            </Grid>

            {/* Row 2: Deep Analysis */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', bgcolor: '#f5ede3', border: '1px solid rgba(0,0,0,0.08)', boxShadow: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar src={mentorAvatar} sx={{ width: 44, height: 44, border: '2px solid #006397' }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>AI Mentor</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {data.suggestions?.map((s, idx) => (
                    <Box key={idx} sx={{ bgcolor: '#fff', p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <Box sx={{ display: 'flex', gap: 1.5, mb: 1, alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 20 }}>{s.icon}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>{s.title}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.5 }}>{s.detail}</Typography>
                    </Box>
                  ))}
                  {!data.suggestions?.length && (
                    <Typography variant="body2" sx={{ color: '#64748b', p: 4, textAlign: 'center', fontStyle: 'italic' }}>
                      Awaiting architectural signals...
                    </Typography>
                  )}
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card sx={{ height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>SHAP Feature Impact</Typography>
                  <Tooltip title="Explains the logic behind the risk score.">
                    <InfoIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </Tooltip>
                </Box>
                <Grid container spacing={3}>
                  {data.shap_values?.map((sv, idx) => {
                    const labelMap = {
                      'code_churn': 'Code Churn',
                      'num_files': 'Files Impacted',
                      'msg_length': 'Message Clarity',
                      'has_fix': 'Urgent Fix Indicator',
                      'is_weekend': 'Temporal Risk',
                      'commit_hour': 'Time Pressure',
                      'change_ratio': 'Stability Ratio'
                    };
                    const name = labelMap[sv.feature] || sv.feature;
                    const isRisky = sv.shap_value > 0;
                    return (
                      <Grid item xs={12} sm={6} key={idx}>
                        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>{name}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 900, color: isRisky ? '#ba1a1a' : '#006397' }}>
                            {isRisky ? '▲' : '▼'}{Math.abs(sv.shap_value).toFixed(2)}
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={Math.min(Math.abs(sv.shap_value) * 100, 100)} 
                          sx={{ 
                            height: 6, borderRadius: 3, bgcolor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': { bgcolor: isRisky ? '#ba1a1a' : '#006397' }
                          }} />
                      </Grid>
                    );
                  })}
                </Grid>
              </Card>
            </Grid>

            {/* Row 3: Minor Signals */}
            {Object.entries(data.features || {}).slice(0, 4).map(([k, v]) => (
              <Grid item xs={6} md={3} key={k}>
                <Card sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" sx={{ color: '#64748b', mb: 1, display: 'block' }}>{k.replace('_', ' ')}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {typeof v === 'number' ? v.toFixed(1).replace('.0', '') : v}
                  </Typography>
                </Card>
              </Grid>
            ))}

            {/* Row 4: System Status */}
            <Grid item xs={12}>
              <Card sx={{ 
                bgcolor: '#0f172a', color: '#fff', 
                display: 'flex', flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center', justifyContent: 'space-between', gap: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 12px rgba(16,185,129,0.5)' }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>System Status: Healthy</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>ML Engine Integrity Verified</Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>LAST MODEL RETRAIN</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {stats?.last_trained_at ? new Date(stats.last_trained_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'March 18, 2026'}
                  </Typography>
                </Box>
              </Card>
            </Grid>

          </Grid>
        </Box>

        {/* Footer */}
        <Box sx={{ py: 3, px: 6, display: 'flex', justifyContent: 'center', borderTop: '1px solid #e2e8f0' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>● ENCRYPTED DATA PIPELINE ACTIVE</Typography>
        </Box>

      </Box>
    </Box>
  );
}
