import React, { useState } from 'react';
import api from '../services/api';
import { Box, Button, Typography, Alert, Grid, TextField, LinearProgress } from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const ModelPrediction = ({ modelId, featureNames }) => {
  const [input, setInput] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setInput(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) || 0 }));

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post(`/models/${modelId}/predict`, input);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed');
    }
    setLoading(false);
  };

  const isSuccess = result?.prediction === 'Success';

  return (
    <Box>
      <Box component="form" onSubmit={handlePredict}>
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          {featureNames.map(name => (
            <Grid item xs={12} sm={6} md={4} key={name}>
              <TextField
                name={name}
                label={name.replace(/_/g, ' ')}
                type="number"
                size="small"
                fullWidth
                onChange={handleChange}
                inputProps={{ step: 'any' }}
              />
            </Grid>
          ))}
        </Grid>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Button type="submit" variant="contained" disabled={loading}
          startIcon={<FlashOnIcon />} sx={{ borderRadius: 2, mb: result ? 2.5 : 0 }}>
          {loading ? 'Running…' : 'Run Prediction'}
        </Button>
      </Box>

      {result && (
        <Box sx={{
          borderRadius: 3, p: 3, textAlign: 'center',
          background: isSuccess ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        }}>
          {isSuccess
            ? <CheckCircleIcon sx={{ fontSize: 44, color: '#10b981', mb: 1 }} />
            : <CancelIcon sx={{ fontSize: 44, color: '#ef4444', mb: 1 }} />}
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: isSuccess ? '#10b981' : '#ef4444', letterSpacing: '-0.02em' }}>
            Build {result.prediction}
          </Typography>
          {result.probability != null && (
            <Box sx={{ mt: 1.5, maxWidth: 300, mx: 'auto' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                Confidence: <strong style={{ color: '#f9fafb' }}>{(result.probability * 100).toFixed(1)}%</strong>
              </Typography>
              <LinearProgress
                variant="determinate"
                value={result.probability * 100}
                sx={{
                  height: 6, borderRadius: 3,
                  '& .MuiLinearProgress-bar': { background: isSuccess ? '#10b981' : '#ef4444' }
                }}
              />
            </Box>
          )}

          {/* New Top Risk Factors Explainability UI */}
          {!isSuccess && result.top_risk_factors && result.top_risk_factors.length > 0 && (
            <Box sx={{ 
              mt: 4, pt: 3, borderTop: '1px solid rgba(239,68,68,0.15)', 
              textAlign: 'left', maxWidth: 400, mx: 'auto' 
            }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
                ⚠️ Top Risk Factors
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {result.top_risk_factors.map((factor, idx) => (
                  <Box key={idx} sx={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.4)', px: 2, py: 1.5, borderRadius: 2
                  }}>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1f2937' }}>
                        {factor.feature.replace(/_/g, ' ')}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>
                        Value: {factor.value > 1000 ? (factor.value / 1000).toFixed(1) + 'k' : factor.value}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 800, color: '#ef4444', fontSize: '15px' }}>
                        +{factor.contribution}%
                      </Typography>
                      <Typography sx={{ fontSize: '11px', color: '#9ca3af' }}>impact</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ModelPrediction;
