import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Grid, Container } from '@mui/material';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import StorageIcon from '@mui/icons-material/Storage';
import PsychologyIcon from '@mui/icons-material/Psychology';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SecurityIcon from '@mui/icons-material/Security';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import ShaderBackground from '../components/ui/shader-background';

const FEATURES = [
    { icon: StorageIcon, color: '#E86A33', title: 'Dataset Intelligence', desc: 'Upload, validate, and preprocess CI/CD pipeline logs with automatic schema detection and feature engineering.' },
    { icon: PsychologyIcon, color: '#4CAF50', title: 'ML Model Training', desc: 'Train Logistic Regression, Random Forest, and Decision Tree classifiers with one click and compare results.' },
    { icon: FlashOnIcon, color: '#F59E0B', title: 'Real-time Risk Scoring', desc: 'Enter pipeline metrics and get instant failure probability with confidence intervals and threshold alerts.' },
    { icon: SecurityIcon, color: '#3B82F6', title: 'Governance & Audit Trails', desc: 'Role-based access control, immutable audit logs with CSV/PDF export, and full activity tracking.' },
];

const HOW_IT_WORKS = [
    { n: '01', title: 'Upload Pipeline Data', desc: 'Import your CI/CD build history in CSV or JSON. Auto-validation checks schema integrity on upload.' },
    { n: '02', title: 'Train & Compare Models', desc: 'Preprocess data, extract features, and train ML models. Compare metrics side-by-side across algorithms.' },
    { n: '03', title: 'Predict & Monitor', desc: 'Score new pipeline runs for failure risk before they execute. Track system health in the Admin console.' },
];

const BADGES = ['Open Source', 'FastAPI Backend', 'scikit-learn', 'Role-based Access', 'REST API'];

const LandingPage = () => (
    <Box sx={{ background: 'transparent', minHeight: '100vh', overflowX: 'hidden' }}>
        <ShaderBackground />



        {/* ── HERO ─────────────────────────────────────────────── */}
        <Box sx={{
            position: 'relative',
            pt: { xs: 12, md: 18 }, pb: { xs: 12, md: 20 },
            textAlign: 'center',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: '-10%', left: '50%', transform: 'translateX(-50%)',
                width: '900px', height: '600px',
                background: 'radial-gradient(ellipse at center, rgba(232,106,51,0.22) 0%, rgba(214,90,49,0.08) 40%, transparent 70%)',
                pointerEvents: 'none',
            },
        }}>
            <Container maxWidth={false} sx={{ maxWidth: 800, px: { xs: 3, md: 4 }, position: 'relative' }}>


                {/* Headline */}
                <Typography sx={{
                    fontSize: { xs: '2.5rem', sm: '3.25rem', md: '3.75rem' },
                    fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08,
                    color: '#2D3748', mb: 2.5,
                }}>
                    Predict CI/CD Failures{' '}
                    <Box component="span" sx={{
                        color: '#2D3748',
                    }}>
                        Before They Happen
                    </Box>
                </Typography>

                {/* Sub */}
                <Typography sx={{ fontSize: '1.0625rem', color: '#4A5568', lineHeight: 1.75, maxWidth: 560, mx: 'auto', mb: 5 }}>
                    Upload your pipeline build history, train machine learning models, and score every commit for failure risk — all in one unified platform.
                </Typography>

                {/* CTA buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 5 }}>
                    <Button
                        component={Link} to="/dashboard"
                        variant="contained" size="large"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                            px: 4, py: 1.5, fontSize: '0.9375rem', fontWeight: 700,
                            borderRadius: '999px', background: 'linear-gradient(135deg,#E86A33,#D65A31)',
                            boxShadow: '0 0 32px rgba(232,106,51,0.35)',
                            transition: 'all 250ms',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 40px rgba(232,106,51,0.5)' },
                        }}
                    >
                        Get Started
                    </Button>
                    <Button
                        component={Link} to="/dashboard"
                        variant="outlined" size="large"
                        sx={{
                            px: 4, py: 1.5, fontSize: '0.9375rem', fontWeight: 600,
                            borderRadius: '999px',
                            borderColor: 'rgba(0,0,0,0.12)',
                            color: '#718096',
                            transition: 'all 250ms',
                            '&:hover': { borderColor: 'rgba(0,0,0,0.25)', color: '#2D3748', background: 'rgba(0,0,0,0.03)' }
                        }}
                    >
                        View Demo →
                    </Button>
                </Box>

                {/* Trust badges */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {BADGES.map(b => (
                        <Box key={b} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <CheckIcon sx={{ fontSize: 13, color: '#4CAF50' }} />
                            <Typography sx={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>{b}</Typography>
                        </Box>
                    ))}
                </Box>
            </Container>
        </Box>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <Box sx={{ py: '80px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <Container maxWidth={false} sx={{ maxWidth: 1200, px: { xs: 3, md: 4 } }}>
                <Box sx={{ textAlign: 'center', mb: 7 }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A0AEC0', mb: 1.5 }}>
                        Capabilities
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '1.75rem', md: '2rem' }, fontWeight: 700, letterSpacing: '-0.025em', color: '#2D3748' }}>
                        Everything for pipeline risk analytics
                    </Typography>
                </Box>
                <Grid container spacing={2}>
                    {FEATURES.map((f, i) => (
                        <Grid item xs={12} sm={6} key={f.title}>
                            <Box className={`feature-card fade-up fade-up-${i + 1}`} sx={{ height: '100%' }}>
                                <Box sx={{
                                    width: 42, height: 42, borderRadius: '11px', mb: 2.5,
                                    background: `${f.color}15`,
                                    border: `1px solid ${f.color}25`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <f.icon sx={{ fontSize: 21, color: f.color }} />
                                </Box>
                                <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#2D3748', mb: 1, letterSpacing: '-0.01em' }}>
                                    {f.title}
                                </Typography>
                                <Typography sx={{ fontSize: '14px', color: '#718096', lineHeight: 1.7 }}>
                                    {f.desc}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        <Box sx={{ py: '80px', background: '#FCF8E8', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <Container maxWidth={false} sx={{ maxWidth: 1200, px: { xs: 3, md: 4 } }}>
                <Box sx={{ textAlign: 'center', mb: 7 }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A0AEC0', mb: 1.5 }}>
                        Process
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '1.75rem', md: '2rem' }, fontWeight: 700, letterSpacing: '-0.025em', color: '#2D3748' }}>
                        How it works
                    </Typography>
                </Box>
                <Grid container spacing={5}>
                    {HOW_IT_WORKS.map((s, i) => (
                        <Grid item xs={12} md={4} key={s.n}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em', color: 'rgba(232,106,51,0.15)', lineHeight: 1, mb: 2.5 }}>
                                    {s.n}
                                </Typography>
                                <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#2D3748', mb: 1.25 }}>{s.title}</Typography>
                                <Typography sx={{ fontSize: '14px', color: '#718096', lineHeight: 1.7, maxWidth: 300, mx: 'auto' }}>{s.desc}</Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>

        {/* ── CTA BANNER ───────────────────────────────────────── */}
        <Box sx={{ py: '80px' }}>
            <Container maxWidth={false} sx={{ maxWidth: 800, px: { xs: 3, md: 4 }, textAlign: 'center' }}>
                <Box sx={{
                    background: 'linear-gradient(135deg, rgba(232,106,51,0.08) 0%, rgba(214,90,49,0.04) 100%)',
                    border: '1px solid rgba(232,106,51,0.18)',
                    borderRadius: '20px',
                    px: { xs: 4, md: 8 }, py: { xs: 6, md: 8 },
                }}>
                    <Typography sx={{ fontSize: { xs: '1.5rem', md: '1.875rem' }, fontWeight: 700, color: '#2D3748', letterSpacing: '-0.025em', mb: 1.5 }}>
                        Ready to cut pipeline failures?
                    </Typography>
                    <Typography sx={{ fontSize: '15px', color: '#718096', mb: 4, maxWidth: 420, mx: 'auto', lineHeight: 1.7 }}>
                        Start analyzing your CI/CD pipelines in minutes with no configuration needed.
                    </Typography>
                    <Button
                        component={Link} to="/dashboard"
                        variant="contained" size="large"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                            px: 4, py: 1.5, borderRadius: '999px', fontWeight: 700,
                            background: 'linear-gradient(135deg,#E86A33,#D65A31)',
                            boxShadow: '0 0 28px rgba(232,106,51,0.3)',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 36px rgba(232,106,51,0.45)' },
                        }}
                    >
                        Open Dashboard
                    </Button>
                </Box>
            </Container>
        </Box>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <Box sx={{
            borderTop: '1px solid rgba(0,0,0,0.05)', px: { xs: 3, md: 4 }, py: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 22, height: 22, borderRadius: '6px', background: 'linear-gradient(135deg,#E86A33,#D65A31)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AutoGraphIcon sx={{ fontSize: 13, color: '#fff' }} />
                </Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#A0AEC0' }}>PipelineAI</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3 }}>
                {['About', 'Documentation', 'GitHub', 'Contact'].map(l => (
                    <Typography key={l} sx={{ fontSize: '13px', color: '#A0AEC0', cursor: 'pointer', '&:hover': { color: '#718096' }, transition: 'color 200ms' }}>{l}</Typography>
                ))}
            </Box>
            <Typography sx={{ fontSize: '12px', color: '#374151' }}>© 2026 PipelineAI</Typography>
        </Box>

    </Box>
);

export default LandingPage;
