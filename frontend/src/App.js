import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#f26f60', contrastText: '#fff' }, // Coral
    secondary: { main: '#4a9dae', contrastText: '#fff' }, // Teal
    error: { main: '#EF4444' },
    warning: { main: '#F59E0B' },
    info: { main: '#7dc2c3' }, // Light Teal
    success: { main: '#10B981' },
    background: { default: '#f9e2b4', paper: '#FFFFFF' }, // Cream
    divider: 'rgba(0,0,0,0.08)',
    text: { primary: '#2D3748', secondary: '#4a9dae', disabled: '#A0AEC0' },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontSize: 14,
    h1: { fontWeight: 800, letterSpacing: '-0.04em', fontSize: '2.5rem', color: '#2D3748' },
    h2: { fontWeight: 800, letterSpacing: '-0.03em', fontSize: '2rem', color: '#2D3748' },
    h3: { fontWeight: 700, letterSpacing: '-0.025em', fontSize: '1.75rem', color: '#2D3748' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: '2rem', color: '#2D3748' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.25rem', color: '#2D3748' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1rem', color: '#2D3748' },
    body1: { fontSize: '0.875rem', lineHeight: 1.7, color: '#4A5568' },
    body2: { fontSize: '0.875rem', lineHeight: 1.6, color: '#718096' },
  },
  shape: { borderRadius: 14 },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.05)',
    '0 2px 4px rgba(0,0,0,0.05)',
    '0 4px 8px rgba(0,0,0,0.05)',
    '0 8px 16px rgba(0,0,0,0.05)',
    '0 16px 32px rgba(0,0,0,0.05)',
    ...Array(19).fill('0 16px 32px rgba(0,0,0,0.05)'),
  ],
  components: {
    MuiCssBaseline: { styleOverrides: { body: { backgroundImage: 'none', background: '#f9e2b4' } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none', fontWeight: 700, fontSize: '0.9rem',
          borderRadius: 12, transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
          padding: '10px 20px',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #f26f60, #d95e50)',
          boxShadow: '0 6px 16px rgba(242, 111, 96, 0.3)',
          '&:hover': { background: 'linear-gradient(135deg, #d95e50, #b0493e)', boxShadow: '0 8px 24px rgba(242, 111, 96, 0.4)', transform: 'translateY(-2px)' },
        },
        containedSecondary: {
            background: 'linear-gradient(135deg, #4a9dae, #3a7c8a)',
            boxShadow: '0 6px 16px rgba(74, 157, 174, 0.3)',
            '&:hover': { background: 'linear-gradient(135deg, #3a7c8a, #2a5a64)', boxShadow: '0 8px 24px rgba(74, 157, 174, 0.4)', transform: 'translateY(-2px)' },
        },
        outlined: {
          borderColor: 'rgba(0,0,0,0.12)',
          color: '#2D3748',
          '&:hover': { borderColor: 'rgba(0,0,0,0.25)', background: 'rgba(0,0,0,0.04)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.04)',
          boxShadow: '0 10px 30px rgba(74, 157, 174, 0.08)', backgroundImage: 'none', borderRadius: 20,
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.05)' },
        elevation4: { boxShadow: '0 12px 40px rgba(0,0,0,0.08)' },
      }
    },
  }
});

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
