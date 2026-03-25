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
    primary: { main: '#006397', contrastText: '#fff' }, 
    secondary: { main: '#2d3748', contrastText: '#fff' }, 
    error: { main: '#f26f60' },
    warning: { main: '#F59E0B' },
    success: { main: '#10B981' },
    background: { default: '#f5ede3', paper: '#FFFFFF' }, 
    text: { primary: '#2d3748', secondary: '#718096' },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, letterSpacing: '-0.04em' },
    h2: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, letterSpacing: '-0.03em' },
    h3: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, letterSpacing: '-0.02em' },
    h4: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, letterSpacing: '-0.01em' },
    h5: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800 },
    h6: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800 },
    subtitle1: { fontWeight: 600, color: '#718096' },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    overline: { fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#718096', fontSize: '0.7rem' },
  },
  shape: { borderRadius: 20 },
  components: {
    MuiCssBaseline: { 
      styleOverrides: { 
        body: { background: '#f5ede3', scrollBehavior: 'smooth' } 
      } 
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24, 
          padding: '32px', 
          boxShadow: '0 10px 30px rgba(45, 36, 23, 0.07)',
          border: '1px solid rgba(0,0,0,0.06)', 
          backgroundImage: 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 20px 40px rgba(45, 36, 23, 0.12)',
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 800, borderRadius: 12, px: 3, py: 1 },
        containedPrimary: { background: 'linear-gradient(135deg, #3498db, #2980b9)', boxShadow: '0 6px 16px rgba(52, 152, 219, 0.2)' },
      }
    },
    MuiGrid: {
      defaultProps: { spacing: 3 }
    }
  }
});

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
