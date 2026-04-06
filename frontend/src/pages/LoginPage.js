import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, Divider, Grid
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
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
      bgcolor: '#f5ede3', // Beige background
      px: 2
    }}>
      <Card sx={{ 
        width: '100%', 
        maxWidth: 440, 
        p: 2, 
        bgcolor: '#ffffff',
        borderRadius: 4,
        boxShadow: '0 20px 40px rgba(45, 36, 23, 0.1)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <AutoGraphIcon sx={{ fontSize: 40, color: '#3498db', mb: 2 }} />
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.04em', color: '#2d3748' }}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Log in to your PipelineAI account
            </Typography>
          </Box>

          {/* Social Logins (Render Style) */}
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

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Email Address" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required fullWidth
              size="small"
            />
            <TextField
              label="Password" type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} required fullWidth
              size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPass(!showPass)} edge="end">
                    {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              }}
            />
            <Button type="submit" variant="contained" fullWidth size="large"
              disabled={loading} sx={{ 
                py: 1.5, mt: 1, 
                bgcolor: '#2d3748', 
                color: '#fff',
                '&:hover': { bgcolor: '#1a202c' }
              }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" textAlign="center" mt={4}>
            New here?{' '}
            <Link to="/register" style={{ color: '#006397', textDecoration: 'none', fontWeight: 800 }}>
              Create an account
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
