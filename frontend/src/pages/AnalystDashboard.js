import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Bar } from 'react-chartjs-2';
import {
  Box, Typography, FormControl, Select, MenuItem, CircularProgress,
  Alert, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, Grid, Tooltip
} from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ScienceIcon from '@mui/icons-material/Science';

const METRICS = ['accuracy', 'precision', 'recall', 'f1'];
const M_LABELS = ['Accuracy', 'Precision', 'Recall', 'F1'];
const COLORS = ['#E86A33', '#4CAF50', '#F59E0B', '#3B82F6'];
const algoColor = { LogisticRegression: 'primary', RandomForest: 'success', DecisionTree: 'warning' };

const SectionCard = ({ title, children, action }) => (
  <Box sx={{
    background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', mb: 2.5,
    overflow: 'hidden', transition: 'border-color 200ms',
    '&:hover': { borderColor: 'rgba(0,0,0,0.1)' },
  }}>
    <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#2D3748', letterSpacing: '-0.01em' }}>{title}</Typography>
      {action}
    </Box>
    <Box sx={{ p: 3 }}>{children}</Box>
  </Box>
);

const AnalystDashboard = () => {
  const [datasets, setDatasets] = useState([]);
  const [selected, setSelected] = useState('');
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/datasets/list').then(r => setDatasets(r.data.datasets || [])).catch(() => { });
  }, []);

  const handleSelect = async (e) => {
    const id = e.target.value;
    setSelected(id);
    if (!id) return;
    setLoading(true); setError('');
    try {
      const res = await api.get(`/models/compare?dataset_id=${id}`);
      setModels(res.data.models || []);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to compare'); }
    setLoading(false);
  };

  const getCvMean = (m, key) => (m.metrics.cv && m.metrics.cv[`${key}_mean`]) || m.metrics[key === 'f1' ? 'f1_score' : key] || 0;
  const getCvStd = (m, key) => (m.metrics.cv && m.metrics.cv[`${key}_std`]) || 0;

  const bestModel = models.length ? models.reduce((best, m) => getCvMean(m, 'f1') > getCvMean(best, 'f1') ? m : best, models[0]) : null;

  const chartData = {
    labels: M_LABELS,
    datasets: models.map((m, i) => ({
      label: m.algorithm.replace(/([A-Z])/g, ' $1').trim(),
      data: METRICS.map(k => +(getCvMean(m, k) * 100).toFixed(2)),
      backgroundColor: `${COLORS[i % COLORS.length]}88`,
      borderColor: COLORS[i % COLORS.length],
      borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
    }))
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#718096', font: { size: 12, family: 'Inter' }, boxWidth: 10, padding: 18 } },
      tooltip: { backgroundColor: '#F7FAFC', borderColor: 'rgba(0,0,0,0.08)', borderWidth: 1, titleFont: { size: 12 }, bodyFont: { size: 12 }, padding: 10, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}% CV Mean` } },
    },
    scales: {
      y: {
        min: 0, max: 100,
        ticks: { color: '#6B7280', font: { size: 11 }, callback: v => `${v}%`, stepSize: 25 },
        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
        border: { color: 'transparent' },
      },
      x: {
        ticks: { color: '#6B7280', font: { size: 12 } },
        grid: { display: false },
        border: { color: 'rgba(0,0,0,0.06)' },
      }
    },
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, py: '48px' }}>

      {/* Page header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '11px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScienceIcon sx={{ fontSize: 22, color: '#4CAF50' }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em', color: '#2D3748', lineHeight: 1.2 }}>Analytics Lab</Typography>
            <Typography sx={{ fontSize: '14px', color: '#718096', mt: 0.5 }}>Hyperparameter tuned models with 5-fold cross-validation comparisons</Typography>
          </Box>
        </Box>

        {/* Dataset selector + Upload */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 260 }} size="small">
            <Select value={selected} onChange={handleSelect} displayEmpty sx={{ borderRadius: '10px', fontSize: '14px' }}>
              <MenuItem value=""><em style={{ color: '#A0AEC0' }}>Select a dataset…</em></MenuItem>
              {datasets.map(d => (
                <MenuItem key={d.id} value={d.id} sx={{ fontSize: '14px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{d.filename}</span>
                    <Chip label={d.status} size="small" sx={{ height: 18, fontSize: '10px', borderRadius: '4px' }} />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <input
            type="file"
            id="csv-upload"
            hidden
            accept=".csv"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              setLoading(true); setError('');
              const formData = new FormData();
              formData.append('file', file);
              try {
                // 1. Upload
                const upRes = await api.post('/datasets/upload', formData);
                const dsId = upRes.data.dataset_id;
                // 2. Preprocess automatically
                await api.post(`/datasets/preprocess/${dsId}`);
                // 3. Refresh list
                const listRes = await api.get('/datasets/list');
                setDatasets(listRes.data.datasets || []);
                setSelected(dsId);
                // 4. Trigger comparison
                const compRes = await api.get(`/models/compare?dataset_id=${dsId}`);
                setModels(compRes.data.models || []);
              } catch (err) {
                setError(err.response?.data?.detail || 'Upload/Analysis failed. Check your CSV schema.');
              }
              setLoading(false);
            }}
          />
          <Tooltip title="Upload any CSV repository export for instant multi-model analysis">
            <Box 
              component="label" 
              htmlFor="csv-upload" 
              sx={{ 
                px: 2, py: 1, borderRadius: '10px', background: '#2D3748', color: '#fff', 
                fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: '0.2s',
                '&:hover': { background: '#1A202C' }, display: 'flex', alignItems: 'center', gap: 1
              }}
            >
              UPLOAD CSV
            </Box>
          </Tooltip>
        </Box>
      </Box>

      {loading && <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress size={28} sx={{ color: '#E86A33' }} /></Box>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Best model banner */}
      {bestModel && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 3, px: 3, py: 2, mb: 2.5,
          background: 'rgba(232,106,51,0.07)', border: '1px solid rgba(232,106,51,0.18)', borderRadius: '12px',
          flexWrap: 'wrap',
        }}>
          <TrendingUpIcon sx={{ color: '#E86A33', fontSize: 22 }} />
          <Box>
            <Typography sx={{ fontSize: '13px', color: '#818CF8', fontWeight: 600, mb: 0.25 }}>Top Performer (Highest CV F1)</Typography>
            <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#2D3748' }}>
              {bestModel.algorithm.replace(/([A-Z])/g, ' $1').trim()}
            </Typography>
          </Box>
          {METRICS.map((k, i) => (
            <Box key={k} sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>{M_LABELS[i]}</Typography>
              <Typography sx={{ fontSize: '18px', fontWeight: 800, color: COLORS[i], letterSpacing: '-0.02em' }}>
                {(getCvMean(bestModel, k) * 100).toFixed(1)}%
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {models.length > 0 && (
        <>
          {/* Chart */}
          <SectionCard title="Performance Comparison (5-Fold CV Means)">
            <Box sx={{ height: 300 }}>
              <Bar data={chartData} options={{ ...chartOptions, maintainAspectRatio: false }} />
            </Box>
          </SectionCard>

          {/* Metrics table */}
          <SectionCard title="Detailed Validation Metrics (CV Mean ± Std)">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Algorithm</TableCell>
                    {M_LABELS.map((l, i) => (
                      <TableCell key={l} align="right" sx={{ color: COLORS[i] + ' !important' }}>{l}</TableCell>
                    ))}
                    <TableCell align="right">Eval Approach</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {models.map(m => {
                    const isBest = bestModel && m.model_id === bestModel.model_id;
                    return (
                      <TableRow key={m.model_id} sx={{ background: isBest ? 'rgba(232,106,51,0.04) !important' : undefined }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Chip label={m.algorithm.replace(/([A-Z])/g, ' $1').trim()} color={algoColor[m.algorithm] || 'default'} size="small" />
                            {isBest && <Chip label="Best" size="small" sx={{ height: 18, fontSize: '10px', background: 'rgba(232,106,51,0.15)', color: '#818CF8', borderRadius: '4px' }} />}
                            {m.metrics.best_params && (
                              <Tooltip title={`GridSearchCV Best Params: ${JSON.stringify(m.metrics.best_params)}`}>
                                <Chip label="Tuned" size="small" sx={{ height: 18, fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#4CAF50', borderRadius: '4px' }} />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        {METRICS.map((k, i) => (
                          <TableCell key={k} align="right">
                            <Box>
                              <Typography sx={{ fontSize: '14px', fontWeight: k === 'accuracy' || k === 'f1' ? 700 : 400, color: k === 'accuracy' || k === 'f1' ? COLORS[i] : '#2D3748', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                                {(getCvMean(m, k) * 100).toFixed(2)}%
                              </Typography>
                              <Typography sx={{ fontSize: '11px', color: '#6B7280', fontVariantNumeric: 'tabular-nums', mt: 0.5 }}>
                                ±{(getCvStd(m, k) * 100).toFixed(2)}
                              </Typography>
                            </Box>
                          </TableCell>
                        ))}
                        <TableCell align="right"><Typography variant="caption" color="text.secondary">{m.metrics.cv ? '5-Fold CV' : 'Holdout'}</Typography></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        </>
      )}

      {selected && !loading && !models.length && (
        <Box sx={{ py: 10, textAlign: 'center', border: '2px dashed rgba(0,0,0,0.06)', borderRadius: '20px', background: '#FAFBFC' }}>
          <ScienceIcon sx={{ fontSize: 40, color: '#4CAF50', mb: 2 }} />
          <Typography sx={{ color: '#2D3748', fontWeight: 700, mb: 1.5 }}>No predictive models exist for this dataset</Typography>
          <Typography sx={{ color: '#718096', fontSize: '13px', maxWidth: 400, mx: 'auto', mb: 4 }}>
            Before you can analyze this dataset, the AI needs to extract features and train its internal neurons across multiple algorithms.
          </Typography>
          <Box 
            component="button" 
            onClick={async () => {
              setLoading(true); setError('');
              try {
                // 1. Extract features
                await api.post(`/datasets/${selected}/extract-features`);
                // 2. Train models
                await api.post(`/models/train?dataset_id=${selected}`);
                // 3. Refresh list
                const res = await api.get(`/models/compare?dataset_id=${selected}`);
                setModels(res.data.models || []);
              } catch (err) {
                setError(err.response?.data?.detail || 'Training failed. Ensure your CSV has a "label" column.');
              }
              setLoading(false);
            }}
            sx={{ 
              px: 4, py: 1.5, borderRadius: '12px', background: '#4CAF50', color: '#fff', border: 'none',
              fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: '0.2s',
              boxShadow: '0 4px 12px rgba(76,175,80,0.2)',
              '&:hover': { background: '#388E3C', transform: 'translateY(-2px)' }
            }}
          >
            TRAIN ML MODELS NOW
          </Box>
        </Box>
      )}

      {!selected && (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <AnalyticsIcon sx={{ fontSize: 40, color: '#1F2937', mb: 2 }} />
          <Typography sx={{ color: '#374151', fontSize: '14px' }}>Select a dataset above to view model comparisons</Typography>
        </Box>
      )}
    </Box>
  );
};

export default AnalystDashboard;
