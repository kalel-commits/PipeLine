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
    primary: { main: '#3498db', contrastText: '#fff' }, 
    secondary: { main: '#2d3748', contrastText: '#fff' }, 
    error: { main: '#f26f60' },
    warning: { main: '#F59E0B' },
    success: { main: '#10B981' },
    background: { default: '#f5ede3', paper: '#FFFFFF' }, 
    text: { primary: '#2d3748', secondary: '#718096' },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h3: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, letterSpacing: '-0.02em' },
    h5: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800 },
    h6: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: { styleOverrides: { body: { background: '#f5ede3' } } },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16, padding: 0, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1.5px solid rgba(0,0,0,0.03)', backgroundImage: 'none',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 800, borderRadius: 8 },
        containedPrimary: { background: 'linear-gradient(135deg, #3498db, #2980b9)', boxShadow: '0 6px 16px rgba(52, 152, 219, 0.2)' },
      }
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
