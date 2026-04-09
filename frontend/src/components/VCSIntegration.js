import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
  Box, Typography, Button, CircularProgress, Chip, Divider,
  List, ListItem, ListItemText, ListItemSecondaryAction, Alert, Collapse
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GitHubIcon from '@mui/icons-material/GitHub';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

/**
 * VCSIntegration — Repository Picker & Webhook Manager
 * Shows connection status, lists user's repos, and lets them hook one with a single click.
 */
export default function VCSIntegration() {
  const [status, setStatus] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reposLoading, setReposLoading] = useState(false);
  const [hookingRepo, setHookingRepo] = useState(null); // repo_id being hooked
  const [showRepos, setShowRepos] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/vcs-auth/status');
      setStatus(res.data);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleConnectGitHub = async () => {
    try {
      const res = await api.get('/vcs-auth/github/login');
      window.location.href = res.data.url;
    } catch {
      setErrorMsg('Failed to initiate GitHub authorization.');
    }
  };

  const handleShowRepos = async () => {
    if (showRepos) { setShowRepos(false); return; }
    setReposLoading(true);
    setShowRepos(true);
    setErrorMsg('');
    try {
      const res = await api.get('/vcs-auth/repositories');
      if (res.data.error) {
        setErrorMsg(res.data.error);
        setRepos([]);
      } else {
        setRepos(res.data.repos || []);
      }
    } catch (e) {
      setErrorMsg('Failed to load repositories.');
    } finally {
      setReposLoading(false);
    }
  };

  const handleHookRepo = async (repo) => {
    setHookingRepo(repo.id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post('/vcs-auth/hook', {
        repo_id: repo.id,
        repo_name: repo.name,
        hooks_url: repo.hooks_url,
      });
      if (res.data.status === 'success' || res.data.status === 'already_exists') {
        setSuccessMsg(`✅ Webhook active on "${repo.name}". Push a commit to see it in real time!`);
        setShowRepos(false);
        fetchStatus(); // Refresh the status card
      } else {
        setErrorMsg(`Failed to register webhook: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      setErrorMsg(`Hook failed: ${e.response?.data?.detail || e.message}`);
    } finally {
      setHookingRepo(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
        <CircularProgress size={16} sx={{ color: '#006397' }} />
        <Typography variant="caption" color="text.secondary">Checking VCS connection...</Typography>
      </Box>
    );
  }

  const isConnected = status?.connected;
  const hasWebhook = status?.webhook_active;

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <SettingsIcon sx={{ color: '#006397', fontSize: 20 }} />
        <Typography variant="overline" sx={{ fontWeight: 800, color: '#475569' }}>Integration Manager</Typography>
      </Box>

      {/* ── Status Summary ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        p: 2, borderRadius: '12px', bgcolor: isConnected ? '#f0fdf4' : '#f8fafc',
        border: `1px solid ${isConnected ? '#bbf7d0' : '#e2e8f0'}`, mb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <GitHubIcon sx={{ fontSize: 22, color: isConnected ? '#166534' : '#94a3b8' }} />
          <Box>
            {isConnected ? (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534', lineHeight: 1.2 }}>
                  Connected as @{status.connected_as}
                </Typography>
                <Typography variant="caption" sx={{ color: '#4ade80' }}>
                  {status.repo_name
                    ? `📡 Monitoring: ${status.repo_name}`
                    : '⚠️ No repository selected yet'}
                </Typography>
              </>
            ) : (
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#94a3b8' }}>
                GitHub / GitLab not connected
              </Typography>
            )}
          </Box>
        </Box>

        {isConnected && hasWebhook && (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
            label="Webhook Active"
            size="small"
            sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: '0.65rem' }}
          />
        )}
        {isConnected && !hasWebhook && (
          <Chip
            label="No Repo"
            size="small"
            sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 800, fontSize: '0.65rem' }}
          />
        )}
      </Box>

      {/* ── Success / Error feedback ── */}
      {successMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>{errorMsg}</Alert>}

      {/* ── Action Buttons ── */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {!isConnected ? (
          <Button
            variant="contained"
            startIcon={<GitHubIcon />}
            onClick={handleConnectGitHub}
            sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, borderRadius: '10px', fontSize: '0.8rem' }}
          >
            Connect GitHub
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              startIcon={<StorageIcon />}
              onClick={handleShowRepos}
              sx={{ borderRadius: '10px', borderColor: '#006397', color: '#006397', fontSize: '0.8rem', fontWeight: 800 }}
            >
              {showRepos ? 'Hide Repos' : 'Select Repository'}
            </Button>
            <Button
              variant="text"
              startIcon={<GitHubIcon />}
              onClick={handleConnectGitHub}
              sx={{ borderRadius: '10px', color: '#64748b', fontSize: '0.75rem' }}
            >
              Reconnect
            </Button>
          </>
        )}
      </Box>

      {/* ── Repo List ── */}
      <Collapse in={showRepos}>
        <Box sx={{ mt: 2, border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          {reposLoading ? (
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} sx={{ color: '#006397' }} />
              <Typography variant="caption">Loading your repositories...</Typography>
            </Box>
          ) : repos.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No repositories found.</Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {repos.map((repo, idx) => (
                <React.Fragment key={repo.id}>
                  {idx > 0 && <Divider />}
                  <ListItem sx={{
                    py: 1.5, px: 2,
                    bgcolor: status?.repo_id === repo.id ? 'rgba(0,99,151,0.06)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(0,99,151,0.04)' }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
                      {repo.is_private
                        ? <LockIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                        : <LockOpenIcon sx={{ fontSize: 14, color: '#10b981' }} />}
                    </Box>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {repo.name}
                          {status?.repo_id === repo.id && (
                            <Chip label="Active" size="small" sx={{ ml: 1, height: 16, fontSize: '0.6rem', bgcolor: '#dcfce7', color: '#166534' }} />
                          )}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {repo.description || (repo.is_private ? 'Private repository' : 'Public repository')}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        variant={status?.repo_id === repo.id ? 'contained' : 'outlined'}
                        startIcon={hookingRepo === repo.id ? <CircularProgress size={12} /> : <LinkIcon />}
                        disabled={hookingRepo !== null}
                        onClick={() => handleHookRepo(repo)}
                        sx={{
                          borderRadius: '8px', fontSize: '0.7rem', py: 0.5, px: 1.5,
                          ...(status?.repo_id === repo.id
                            ? { bgcolor: '#006397', '&:hover': { bgcolor: '#004a71' } }
                            : { borderColor: '#006397', color: '#006397' })
                        }}
                      >
                        {status?.repo_id === repo.id ? 'Connected' : hookingRepo === repo.id ? 'Connecting...' : 'Connect'}
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
        {/* Manual fallback info */}
        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.5 }}>Manual Webhook URL (Fallback)</Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', color: '#334155' }}>
            {`https://pipeline-9ux3.onrender.com/api/v1/vcs/webhook`}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}
