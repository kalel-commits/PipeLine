import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, MenuItem, Select, FormControl, InputLabel, Divider, InputAdornment
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Developer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password, role });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    }
    setLoading(false);
  };

  return (
    <Box className="auth-container">
      <Card sx={{ width: '100%', maxWidth: 460, p: 1 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <AutoGraphIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>Create Account</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Join the CI/CD Failure Prediction platform
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Full Name" value={name} onChange={e => setName(e.target.value)} required fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'text.secondary', fontSize: 18 }} /></InputAdornment> }} />
            <TextField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.secondary', fontSize: 18 }} /></InputAdornment> }} />
            <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required fullWidth
              helperText="Min 8 chars, upper, lower, digit, special character"
              InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary', fontSize: 18 }} /></InputAdornment> }} />
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select value={role} label="Role" onChange={e => setRole(e.target.value)}>
                <MenuItem value="Developer">Developer</MenuItem>
                <MenuItem value="Analyst">Analyst</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <Button type="submit" variant="contained" fullWidth size="large"
              disabled={loading} sx={{ py: 1.5, mt: 1, fontSize: '1rem' }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>

          <Divider sx={{ my: 3, borderColor: 'rgba(0,0,0,0.08)' }} />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#4a9eff', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;
