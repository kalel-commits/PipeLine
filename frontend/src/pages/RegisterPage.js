import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, MenuItem, Select, FormControl, InputLabel, Divider, InputAdornment, Grid
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
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider) => {
    try {
      const res = await api.get(`/vcs-auth/${provider.toLowerCase()}/login`);
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(`Failed to initiate ${provider} login:`, err);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      bgcolor: '#f5ede3', 
      px: 2,
      py: 4
    }}>
      <Card sx={{ 
        width: '100%', 
        maxWidth: 460, 
        p: 2, 
        bgcolor: '#ffffff',
        borderRadius: 4,
        boxShadow: '0 20px 40px rgba(45, 36, 23, 0.1)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <AutoGraphIcon sx={{ fontSize: 40, color: '#3498db', mb: 2 }} />
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.04em', color: '#2d3748' }}>
              Create account
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Start predicting CI/CD risks today
            </Typography>
          </Box>

          {/* Social Logins */}
          <Grid container spacing={1.5} sx={{ mb: 4 }}>
            {['GitHub', 'GitLab', 'Bitbucket', 'Google'].map((provider) => (
              <Grid item xs={6} key={provider}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={() => handleSocialLogin(provider)}
                  sx={{ 
                    py: 1, 
                    borderRadius: 2, 
                    borderColor: 'rgba(0,0,0,0.08)',
                    color: '#2d3748',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    '&:hover': { bgcolor: '#f8fafc', borderColor: 'rgba(0,0,0,0.15)' }
                  }}
                >
                  {provider}
                </Button>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Divider sx={{ flex: 1 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>OR</Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Full Name" value={name} onChange={e => setName(e.target.value)} required fullWidth size="small" />
            <TextField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required fullWidth size="small" />
            <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required fullWidth size="small"
              helperText="Min 8 chars" />
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select value={role} label="Role" onChange={e => setRole(e.target.value)}>
                <MenuItem value="Developer">Developer</MenuItem>
                <MenuItem value="Analyst">Analyst</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <Button type="submit" variant="contained" fullWidth size="large"
              disabled={loading} sx={{ 
                py: 1.5, mt: 1, 
                bgcolor: '#2d3748', 
                color: '#fff',
                '&:hover': { bgcolor: '#1a202c' }
              }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" textAlign="center" mt={4}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#006397', textDecoration: 'none', fontWeight: 800 }}>Sign in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;
