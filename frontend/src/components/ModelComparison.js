import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Bar } from 'react-chartjs-2';
import { Box, Typography, Alert, CircularProgress, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Chip, Tooltip, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

const METRICS = ['accuracy', 'precision', 'recall', 'f1_score'];
const LABELS = ['Accuracy', 'Precision', 'Recall', 'F1'];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6'];

const algoColor = { LogisticRegression: 'primary', RandomForest: 'success', DecisionTree: 'warning', VotingEnsemble: 'secondary' };

const ModelComparison = ({ datasetId, onModelActivated, currentModel }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    api.get(`/models/compare?dataset_id=${datasetId}`)
      .then(res => setModels(res.data.models))
      .catch(err => setError(err.response?.data?.detail || 'Compare failed'))
      .finally(() => setLoading(false));
  }, [datasetId, currentModel]);

  const handleActivate = async (m) => {
    try {
      await api.post(`/models/${m.model_id}/set_active`);
      setModels(prev => prev.map(mdl => ({ ...mdl, is_active: mdl.model_id === m.model_id })));
      if (onModelActivated) onModelActivated({ ...m, is_active: true });
    } catch (err) {
      setError("Failed to activate model: " + (err.response?.data?.detail || err.message));
    }
  };

  if (!datasetId) return null;
  if (loading) return <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={28} sx={{ color: 'var(--primary)' }} /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!models.length) return <Typography color="text.secondary" variant="body2">No models trained yet on this dataset.</Typography>;

  const displayModels = models.slice().reverse(); // newest first
  const latestBatch = displayModels.slice(0, 4); // for chart keep it clean

  const chartData = {
    labels: LABELS,
    datasets: latestBatch.map((m, i) => ({
      label: m.algorithm,
      data: METRICS.map(k => m.metrics[k]),
      backgroundColor: `${COLORS[i % COLORS.length]}99`,
      borderColor: COLORS[i % COLORS.length],
      borderWidth: 1.5,
      borderRadius: 4,
    }))
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#9ca3af', font: { size: 11 }, boxWidth: 10, padding: 16 } }
    },
    scales: {
      y: {
        min: 0, max: 1,
        ticks: { color: '#6b7280', callback: v => `${(v * 100).toFixed(0)}%`, font: { size: 11 } },
        grid: { color: 'rgba(0,0,0,0.04)' }, border: { color: 'transparent' }
      },
      x: { ticks: { color: '#6b7280', font: { size: 11 } }, grid: { display: false }, border: { color: 'transparent' } }
    }
  };

  return (
    <Box>
      <Box sx={{ height: 240, mb: 3 }}>
        <Bar data={chartData} options={chartOptions} />
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Algorithm</TableCell>
              <TableCell align="right">Accuracy</TableCell>
              <TableCell align="right">Precision</TableCell>
              <TableCell align="right">Recall</TableCell>
              <TableCell align="right">F1</TableCell>
              <TableCell align="center">Active</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayModels.map((m) => (
              <TableRow key={m.model_id} selected={m.is_active}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={m.algorithm.replace(/([A-Z])/g, ' $1').trim()} color={algoColor[m.algorithm] || 'default'} size="small" />
                    <Typography variant="caption" color="text.secondary">#{m.model_id}</Typography>
                    {m.algorithm === 'VotingEnsemble' && <Chip label="Ensemble Mode" size="small" variant="outlined" color="secondary" sx={{ height: 18, fontSize: '10px' }} />}
                  </Box>
                </TableCell>
                {METRICS.map((k, i) => (
                  <TableCell key={k} align="right">
                    <Typography variant="body2" fontWeight={k === 'accuracy' || k === 'f1_score' ? 700 : 400}
                      sx={{ color: k === 'accuracy' || k === 'f1_score' ? COLORS[i] : 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                      {(m.metrics[k] * 100).toFixed(2)}%
                    </Typography>
                  </TableCell>
                ))}
                <TableCell align="center">
                  <Tooltip title={m.is_active ? "Currently Active Model" : "Set as Active Model"}>
                    <IconButton size="small" onClick={() => handleActivate(m)} color={m.is_active ? "success" : "default"}>
                      {m.is_active ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ModelComparison;
