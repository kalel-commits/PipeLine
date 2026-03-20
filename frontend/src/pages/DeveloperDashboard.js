import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Box, Typography, Fade, Grow, CircularProgress, Card, CardContent,
  LinearProgress, Chip, Divider, IconButton, Tooltip, Alert, Skeleton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SchoolIcon from '@mui/icons-material/School';
import InsightsIcon from '@mui/icons-material/Insights';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedIcon from '@mui/icons-material/Verified';

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";
const FETCH_TIMEOUT = 4000; // ms — fallback to demo if slower

function fetchWithTimeout(url, ms = FETCH_TIMEOUT) {
  return Promise.race([
    axios.get(url),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

function timeSince(isoStr) {
  if (!isoStr) return null;
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [driftStatus, setDriftStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      let predRes;
      try {
        predRes = await fetchWithTimeout(`${API}/predict/latest`);
      } catch {
        // Backend slow or offline → fall back to demo mode for seamless demo
        predRes = await axios.get(`${API}/predict/latest?demo=high`).catch(() => null);
      }

      const [statsRes, fbRes, driftRes] = await Promise.all([
        axios.get(`${API}/training/stats`).catch(() => null),
        axios.get(`${API}/feedback/stats`).catch(() => null),
        axios.get(`${API}/drift/status`).catch(() => null),
      ]);

      if (predRes?.data && predRes.data.reason !== "Model not ready") {
        setData(predRes.data);
        setFeedbackGiven(false);
      }
      if (statsRes?.data && !statsRes.data.error) setStats(statsRes.data);
      if (fbRes?.data) setFeedbackStats(fbRes.data);
      if (driftRes?.data) setDriftStatus(driftRes.data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleFeedback = async (outcome) => {
    if (!data) return;
    try {
      await axios.post(`${API}/feedback`, {
        prediction_risk: data.risk,
        prediction_reason: data.reason,
        risk_category: data.risk_category || "",
        actual_outcome: outcome,
        feedback_note: "",
      });
      setFeedbackGiven(true);
    } catch {}
  };

  // ── Loading state ──
  if (loading || !data) return (
    <Fade in timeout={600}>
      <Box sx={{ p: { xs: 3, md: 5 }, maxWidth: "900px", mx: "auto" }}>
        <Typography variant="h3" sx={{ fontWeight: 900, color: "#2D3748", mb: 1, textAlign: 'center' }}>
          PipelineAI Command Center
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "#7dc2c3", mb: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>
          Zero-Config ML · Real-Time Risk Intelligence · AI Mentor
        </Typography>
        <Card sx={{ p: 4, borderRadius: '24px', mb: 4 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Skeleton variant="circular" width={48} height={48} sx={{ mx: 'auto', mb: 2 }} />
            <Skeleton variant="text" width="40%" sx={{ mx: 'auto', mb: 1 }} />
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '16px', mb: 2 }} />
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: '12px' }} />
          </CardContent>
        </Card>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="rectangular" height={120} sx={{ flex: 1, borderRadius: '20px' }} />
          <Skeleton variant="rectangular" height={120} sx={{ flex: 1, borderRadius: '20px' }} />
        </Box>
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <CircularProgress size={32} thickness={4} sx={{ color: '#4a9dae' }} />
          <Typography variant="body2" sx={{ color: '#718096', mt: 1, fontWeight: 600 }}>
            Analyzing your Git history and building an ML model...
          </Typography>
        </Box>
      </Box>
    </Fade>
  );

  const categoryColors = { High: '#f26f60', Medium: '#F59E0B', Low: '#10B981' };
  const category = data.risk_category || (data.risk > 0.65 ? 'High' : data.risk > 0.35 ? 'Medium' : 'Low');
  const riskColor = categoryColors[category] || '#4a9dae';
  const confidence = data.confidence ?? Math.abs(data.risk - 0.5) * 2;

  return (
    <Fade in timeout={600}>
      <Box sx={{ p: { xs: 3, md: 5 }, maxWidth: "900px", mx: "auto" }}>
        <Typography variant="h3" sx={{ fontWeight: 900, color: "#2D3748", mb: 1, letterSpacing: '-0.02em', textAlign: 'center' }}>
          PipelineAI Command Center
        </Typography>

        {/* Model version + last trained */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Chip
            label="Zero-Config ML · Real-Time Risk Intelligence · AI Mentor"
            size="small"
            sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7dc2c3', background: 'rgba(125,194,195,0.08)', border: '1px solid rgba(125,194,195,0.2)' }}
          />
          {data.model_version > 0 && (
            <Chip icon={<VerifiedIcon sx={{ fontSize: 14 }} />} label={`Model v${data.model_version}`} size="small"
              sx={{ fontWeight: 700, color: '#4a9dae', background: 'rgba(74,157,174,0.08)', border: '1px solid rgba(74,157,174,0.2)' }} />
          )}
          {data.last_trained_at && (
            <Chip icon={<AccessTimeIcon sx={{ fontSize: 14 }} />} label={`Trained ${timeSince(data.last_trained_at)}`} size="small"
              sx={{ fontWeight: 700, color: '#718096', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }} />
          )}
        </Box>

        {/* ── Hero Insight Banner ── */}
        <Grow in timeout={800}>
          <Card sx={{
            p: 0, borderRadius: '20px', mb: 4, overflow: 'hidden',
            background: `linear-gradient(135deg, ${riskColor}12, ${riskColor}05)`,
            border: `1.5px solid ${riskColor}33`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 2.5 }}>
              <Box sx={{
                width: 56, height: 56, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${riskColor}15`, border: `2px solid ${riskColor}33`, flexShrink: 0,
              }}>
                <Typography sx={{ fontSize: '1.8rem', lineHeight: 1 }}>
                  {category === 'High' ? '🚨' : category === 'Medium' ? '⚠️' : '✅'}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: riskColor }}>
                    {category} Risk — {(data.risk * 100).toFixed(1)}%
                  </Typography>
                  <Chip label={`${(confidence * 100).toFixed(0)}% confident`} size="small"
                    sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22, background: `${riskColor}12`, color: riskColor, border: `1px solid ${riskColor}33` }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#4A5568', lineHeight: 1.3 }}>
                  {data.top_insight || data.reason}
                </Typography>
                {data.suggestions?.[0] && (
                  <Typography variant="caption" sx={{ color: '#718096', display: 'block', mt: 0.5 }}>
                    💡 {data.suggestions[0].title}
                  </Typography>
                )}
              </Box>
            </Box>
          </Card>
        </Grow>

        {/* ── Risk Score Card ── */}
        <Grow in timeout={1000}>
          <Card sx={{
            p: 4, borderRadius: '24px', mb: 4,
            boxShadow: `0 20px 50px ${riskColor}15`,
            border: `2px solid ${riskColor}22`,
            background: '#FFFFFF', position: 'relative', overflow: 'visible',
            transition: 'all 0.5s ease',
          }}>
            <Box sx={{
              position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)',
              background: riskColor, color: '#fff', borderRadius: '50%', width: 48, height: 48,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 16px ${riskColor}66`, transition: 'background 0.5s ease',
            }}>
              {category === 'High' ? <ErrorOutlineIcon fontSize="large" /> : <CheckCircleIcon fontSize="large" />}
            </Box>

            <CardContent sx={{ pt: 4, textAlign: 'center' }}>
              <Chip label={category} sx={{
                mb: 2, fontWeight: 800, fontSize: '0.85rem', px: 2,
                background: `${riskColor}15`, color: riskColor,
                border: `1.5px solid ${riskColor}44`, transition: 'all 0.5s ease',
              }} />

              <Typography variant="h5" sx={{ color: "#718096", fontWeight: 700, mb: 1 }}>
                Current Risk Score
              </Typography>
              <Typography sx={{
                fontSize: { xs: "64px", md: "88px" }, fontWeight: 900,
                color: riskColor, lineHeight: 1, mb: 1,
                textShadow: `0 4px 12px ${riskColor}33`, transition: 'color 0.5s ease',
              }}>
                {(data.risk * 100).toFixed(1)}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#A0AEC0', mb: 3, display: 'block' }}>
                Confidence: {(confidence * 100).toFixed(0)}%
              </Typography>

              <Box sx={{
                background: `${riskColor}08`, p: 2.5, borderRadius: "16px",
                border: `1px dashed ${riskColor}44`, transition: 'all 0.5s ease',
              }}>
                <Typography variant="subtitle2" sx={{ color: "#718096", textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                  🧠 Explainable AI Reason:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: riskColor, fontSize: '1rem' }}>
                  {data.reason}
                </Typography>
              </Box>

              {/* ── Feedback Buttons ── */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                {feedbackGiven ? (
                  <Fade in><Alert severity="success" variant="outlined" sx={{ borderRadius: '12px' }}>
                    Thanks for your feedback! This helps improve future predictions.
                  </Alert></Fade>
                ) : (
                  <Fade in timeout={400}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                        Was this prediction accurate?
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                        <Tooltip title="Yes, prediction was correct">
                          <IconButton onClick={() => handleFeedback('correct')}
                            sx={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.3)', borderRadius: '14px', px: 3, py: 1, transition: 'all 0.2s ease', '&:hover': { background: 'rgba(16,185,129,0.15)', transform: 'translateY(-2px)' } }}>
                            <ThumbUpIcon sx={{ color: '#10B981', mr: 0.5 }} />
                            <Typography sx={{ fontWeight: 700, color: '#10B981' }}>Correct</Typography>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="No, prediction was wrong">
                          <IconButton onClick={() => handleFeedback('incorrect')}
                            sx={{ background: 'rgba(242,111,96,0.08)', border: '1.5px solid rgba(242,111,96,0.3)', borderRadius: '14px', px: 3, py: 1, transition: 'all 0.2s ease', '&:hover': { background: 'rgba(242,111,96,0.15)', transform: 'translateY(-2px)' } }}>
                            <ThumbDownIcon sx={{ color: '#f26f60', mr: 0.5 }} />
                            <Typography sx={{ fontWeight: 700, color: '#f26f60' }}>Incorrect</Typography>
                          </IconButton>
                        </Tooltip>
                      </Box>
                      {feedbackStats?.total > 0 && (
                        <Typography variant="caption" sx={{ color: '#A0AEC0', mt: 1, display: 'block' }}>
                          Model accuracy from feedback: {(feedbackStats.accuracy_rate * 100).toFixed(0)}% ({feedbackStats.total} ratings)
                        </Typography>
                      )}
                    </Box>
                  </Fade>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grow>

        {/* ── SHAP Force Plot ── */}
        {data.shap_values?.length > 0 && (
          <Grow in timeout={1200}>
            <Card sx={{ p: 3, borderRadius: '20px', mb: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InsightsIcon sx={{ color: '#7C3AED' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#2D3748' }}>
                  SHAP Explainability — Why This Score?
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#718096', display: 'block', mb: 2 }}>
                Each bar shows a feature's mathematical contribution. Red pushes toward failure, green toward success.
              </Typography>
              {data.shap_values.map((sv, idx) => {
                const isPositive = sv.shap_value > 0;
                const barColor = isPositive ? '#f26f60' : '#10B981';
                const maxShap = Math.max(...data.shap_values.map(s => Math.abs(s.shap_value)), 0.01);
                const barWidth = Math.min((Math.abs(sv.shap_value) / maxShap) * 100, 100);
                return (
                  <Fade in timeout={400 + idx * 100} key={sv.feature}>
                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2D3748' }}>
                          {sv.feature} <Typography component="span" variant="caption" sx={{ color: '#A0AEC0' }}>= {sv.value}</Typography>
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: barColor }}>
                          {isPositive ? '+' : ''}{sv.shap_value.toFixed(4)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {!isPositive && <Box sx={{ flex: 1 }} />}
                        <Box sx={{
                          width: `${barWidth}%`, minWidth: '4px', height: 8, borderRadius: 99,
                          background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
                          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                        {isPositive && <Box sx={{ flex: 1 }} />}
                      </Box>
                    </Box>
                  </Fade>
                );
              })}
            </Card>
          </Grow>
        )}

        {/* ── AI Mentor Suggestions ── */}
        {data.suggestions?.length > 0 && (
          <Grow in timeout={1400}>
            <Card sx={{ p: 3, borderRadius: '20px', mb: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TipsAndUpdatesIcon sx={{ color: '#F59E0B' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#2D3748' }}>
                  AI Mentor — Actionable Suggestions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {data.suggestions.map((s, i) => (
                  <Fade in timeout={500 + i * 150} key={i}>
                    <Box sx={{
                      p: 2, borderRadius: '14px', background: 'rgba(245,158,11,0.05)',
                      border: '1px solid rgba(245,158,11,0.15)',
                      display: 'flex', gap: 1.5, alignItems: 'flex-start',
                      transition: 'all 0.2s ease',
                      '&:hover': { background: 'rgba(245,158,11,0.1)', transform: 'translateX(4px)' },
                    }}>
                      <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>{s.icon}</Typography>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#2D3748', mb: 0.25 }}>{s.title}</Typography>
                        <Typography variant="caption" sx={{ color: '#718096', lineHeight: 1.4 }}>{s.detail}</Typography>
                      </Box>
                    </Box>
                  </Fade>
                ))}
              </Box>
            </Card>
          </Grow>
        )}

        {/* ── Feature Values ── */}
        {data.features && (
          <Grow in timeout={1600}>
            <Card sx={{ p: 3, borderRadius: '20px', mb: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InsightsIcon sx={{ color: '#4a9dae' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#2D3748' }}>
                  Live Feature Values
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {Object.entries(data.features).map(([key, val]) => (
                  <Chip key={key}
                    label={`${key}: ${typeof val === 'number' ? Number(val).toFixed(2) : val}`}
                    variant="outlined"
                    sx={{
                      fontWeight: 700, fontSize: '0.8rem', borderRadius: '10px',
                      borderColor: '#7dc2c3', color: '#2D3748',
                      background: 'rgba(125,194,195,0.08)',
                      transition: 'all 0.2s ease',
                      '&:hover': { background: 'rgba(125,194,195,0.18)', transform: 'scale(1.05)' },
                    }}
                  />
                ))}
              </Box>
            </Card>
          </Grow>
        )}

        {/* ── Training Intelligence ── */}
        {stats && (
          <Grow in timeout={1800}>
            <Card sx={{ p: 3, borderRadius: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon sx={{ color: '#f26f60' }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#2D3748' }}>
                    Model Training Intelligence
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {/* Model Health Badge */}
                  {driftStatus && driftStatus.status !== 'insufficient_data' && (
                    <Chip icon={<MonitorHeartIcon sx={{ fontSize: 14 }} />}
                      label={driftStatus.status === 'stable' ? 'Model Healthy' : 'Drift Detected'}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        background: driftStatus.status === 'stable' ? 'rgba(16,185,129,0.1)' : 'rgba(242,111,96,0.1)',
                        color: driftStatus.status === 'stable' ? '#10B981' : '#f26f60',
                        border: `1px solid ${driftStatus.status === 'stable' ? '#10B981' : '#f26f60'}33`,
                      }}
                    />
                  )}
                  {stats.model_version && (
                    <Chip icon={<VerifiedIcon sx={{ fontSize: 14 }} />}
                      label={`v${stats.model_version}`} size="small"
                      sx={{ fontWeight: 700, color: '#4a9dae', background: 'rgba(74,157,174,0.08)', border: '1px solid rgba(74,157,174,0.2)' }}
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commits Trained</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#4a9dae' }}>{stats.total_commits}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Failure Rate</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#f26f60' }}>{(stats.failure_rate * 100).toFixed(1)}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#2D3748' }}>{stats.model_type?.replace('Classifier', '')}</Typography>
                </Box>
                {stats.cross_validation?.cv_accuracy_mean && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CV Accuracy</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#10B981' }}>
                      {(stats.cross_validation.cv_accuracy_mean * 100).toFixed(1)}%
                      <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#718096' }}>
                        ±{(stats.cross_validation.cv_accuracy_std * 100).toFixed(1)}
                      </Typography>
                    </Typography>
                  </Box>
                )}
                {feedbackStats?.accuracy_rate != null && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Accuracy</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#7C3AED' }}>
                      {(feedbackStats.accuracy_rate * 100).toFixed(0)}%
                      <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#718096' }}>
                        ({feedbackStats.total} votes)
                      </Typography>
                    </Typography>
                  </Box>
                )}
                {stats.last_trained_at && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Trained</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#718096' }}>
                      {timeSince(stats.last_trained_at)}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {stats.feature_importances && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Feature Importance (What Drives Predictions)
                  </Typography>
                  {Object.entries(stats.feature_importances)
                    .sort(([,a], [,b]) => b - a)
                    .map(([name, importance], idx) => (
                      <Fade in timeout={600 + idx * 80} key={name}>
                        <Box sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#2D3748' }}>{name}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#4a9dae' }}>{(importance * 100).toFixed(1)}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={importance * 100}
                            sx={{
                              height: 8, borderRadius: 99,
                              backgroundColor: 'rgba(74,157,174,0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 99,
                                background: 'linear-gradient(90deg, #4a9dae, #7dc2c3)',
                                transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)',
                              }
                            }}
                          />
                        </Box>
                      </Fade>
                    ))}
                </>
              )}
            </Card>
          </Grow>
        )}

        {data.demo_mode && (
          <Fade in timeout={500}>
            <Alert severity="info" variant="outlined" sx={{ mt: 3, borderRadius: '14px', fontWeight: 600 }}>
              🎭 Demo Mode Active — This prediction is simulated for demonstration purposes.
            </Alert>
          </Fade>
        )}
      </Box>
    </Fade>
  );
}
