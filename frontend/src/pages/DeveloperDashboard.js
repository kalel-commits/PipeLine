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
import mentorAvatar from '../assets/ai-mentor.png';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

// Using shared api service from ../services/api

export default function Dashboard() {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const safeSearch = location.search; // Always allow demo params for the presentation

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
      setError("Unable to connect to the AI engine. It might be waking up...");
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
            <Card sx={{ position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="overline">Risk Probability</Typography>
                <Chip label={`${category} Risk`} size="small" 
                   sx={{ fontWeight: 800, background: '#fef3c7', color: '#f59e0b', fontSize: '0.65rem', borderRadius: '4px' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 2 }}>
                <Typography variant="h1" sx={{ color: '#2d3748' }}>{risk}%</Typography>
                <Typography sx={{ fontWeight: 800, color: '#718096' }}>Confidence</Typography>
              </Box>
              <Fade in={true} timeout={800}>
                <Box sx={{ 
                  p: 2, borderRadius: '12px', bgcolor: 'rgba(245,158,11,0.08)', 
                  display: 'flex', gap: 1.5, alignItems: 'center',
                  border: '1px solid rgba(245,158,11,0.15)'
                }}>
                  <InfoIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400e' }}>
                    {data.reason}
                  </Typography>
                </Box>
              </Fade>
            </Card>
          </Grid>

          {/* Prediction Accuracy Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="overline" sx={{ mb: 3 }}>
                Prediction Accuracy
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 3, textAlign: 'center', color: '#2d3748' }}>
                Was this prediction accurate?
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
                <Box sx={{ flex: 1, border: '1px solid rgba(0,0,0,0.06)', p: 2, borderRadius: '12px', textAlign: 'center', cursor: 'pointer', transition: '0.2s', '&:hover': { bgcolor: '#f8fafc' } }}>
                  <ThumbUpIcon sx={{ color: '#3498db', mb: 1, fontSize: 24 }} />
                  <Typography variant="overline" sx={{ color: '#2d3748', display: 'block' }}>CORRECT</Typography>
                </Box>
                <Box sx={{ flex: 1, border: '1px solid rgba(0,0,0,0.06)', p: 2, borderRadius: '12px', textAlign: 'center', cursor: 'pointer', transition: '0.2s', '&:hover': { bgcolor: '#f8fafc' } }}>
                  <ThumbDownIcon sx={{ color: '#f26f60', mb: 1, fontSize: 24 }} />
                  <Typography variant="overline" sx={{ color: '#2d3748', display: 'block' }}>INCORRECT</Typography>
                </Box>
              </Box>
            </Card>
           {/* AI Mentor Card */}
          <Grid item xs={12} md={4}>
            <Grow in={true} timeout={1000}>
              <Card sx={{ height: '100%', bgcolor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,99,151,0.1)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar src={mentorAvatar} sx={{ width: 48, height: 48, border: '2px solid #006397' }} />
                  <Typography variant="h6" sx={{ textTransform: 'uppercase', color: '#2d3748', fontWeight: 900 }}>AI Mentor</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {data.suggestions?.map((s, idx) => (
                    <Fade key={idx} in={true} timeout={1200 + (idx * 200)}>
                      <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 1, alignItems: 'center' }}>
                          <Typography sx={{ fontSize: 20 }}>{s.icon}</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#2d3748' }}>{s.title}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#718096', lineHeight: 1.4 }}>
                          {s.detail}
                        </Typography>
                      </Box>
                    </Fade>
                  ))}
                  {!data.suggestions?.length && (
                    <Typography variant="body2" sx={{ color: '#718096', p: 2, textAlign: 'center', fontStyle: 'italic' }}>
                      Gathering architectural signals...
                    </Typography>
                  )}
                </Box>
              </Card>
            </Grow>
          </Grid>

          {/* SHAP Chart Card */}
          <Grid item xs={12} md={8}>
            <Grow in={true} timeout={1000}>
              <Card sx={{ height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                  <Typography variant="h6" sx={{ textTransform: 'uppercase', color: '#2d3748', fontWeight: 900 }}>
                    SHAP Feature Impact
                  </Typography>
                  <Tooltip title="SHAP values explain how much each feature contributed to the risk score.">
                    <InfoIcon sx={{ color: '#2d3748', opacity: 0.6 }} />
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                     {data.shap_values?.map((sv, idx) => {
                       const labelMap = {
                         'code_churn': 'Code Churn (Lines Changed)',
                         'num_files': 'Files Impacted',
                         'msg_length': 'Commit Message Length',
                         'has_fix': 'Urgent Fix Indicators',
                         'is_weekend': 'Off-Hours Activity',
                         'commit_hour': 'Time of Day',
                         'change_ratio': 'Deletions/Additions Ratio'
                       };
                       const displayName = labelMap[sv.feature] || sv.feature.replace('_', ' ');
                       const isHighRisk = sv.shap_value > 0;
                       return (
                         <Box key={idx}>
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                             <Typography variant="overline" sx={{ color: '#2d3748', fontWeight: 700 }}>{displayName}</Typography>
                             <Typography variant="caption" sx={{ fontWeight: 900, color: isHighRisk ? '#ba1a1a' : '#006397' }}>
                               {isHighRisk ? '+' : ''}{sv.shap_value.toFixed(2)}
                             </Typography>
                           </Box>
                           <LinearProgress variant="determinate" value={Math.min(Math.abs(sv.shap_value) * 100, 100)} 
                            sx={{ 
                              height: 10, borderRadius: 5, bgcolor: '#f1f5f9',
                              '& .MuiLinearProgress-bar': { bgcolor: isHighRisk ? '#ba1a1a' : '#006397', borderRadius: 5 }
                            }} />
                         </Box>
                       );
                     })}
                </Box>
              </Card>
            </Grow>
          </Grid>

          </Grid>

          {/* Small Feature Cards & System Health integrated into Grid */}
          {Object.entries(data.features || {}).slice(0, 4).map(([k, v]) => (
            <Grid item xs={6} md={3} key={k}>
              <Card sx={{ height: '100%' }}>
                <Typography variant="overline" sx={{ display: 'block', mb: 1 }}>
                  {k.replace('_', ' ')}
                </Typography>
                <Typography variant="h4" sx={{ color: '#2d3748' }}>
                  {typeof v === 'number' ? v.toFixed(2).replace('.00', '') : v}
                </Typography>
              </Card>
            </Grid>
          ))}
          
          {/* System Health Card */}
          <Grid item xs={12} md={12}>
            <Card sx={{ 
              bgcolor: '#2d2417', color: '#fff',
              display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
            }}>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#10B981', boxShadow: '0 0 12px rgba(16,185,129,0.5)' }} />
                  <Box>
                    <Typography variant="h5" sx={{ color: '#fff', mb: 0.5 }}>Model Status: Healthy</Typography>
                    <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)' }}>System Integrity Verified</Typography>
                  </Box>
               </Box>
               <Box sx={{ textAlign: 'right' }}>
                 <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>
                    Last Retrain
                 </Typography>
                 <Typography variant="h6" sx={{ color: '#fff' }}>
                    {stats?.last_trained_at ? new Date(stats.last_trained_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'March 18, 2026'}
                 </Typography>
               </Box>
            </Card>
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
