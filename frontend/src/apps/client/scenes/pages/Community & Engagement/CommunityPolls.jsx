import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert,
  Button, Radio, RadioGroup, FormControlLabel, FormControl,
  LinearProgress, Chip, Divider, IconButton,
} from "@mui/material";
import { tokens } from "../../../theme";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import BarChartIcon from "@mui/icons-material/BarChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../../utils/api";
import useRealTimeUpdates from "../../../../../hooks/useRealTimeUpdates";

const CommunityPolls = () => {
  const colors = tokens("dark");
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votes, setVotes] = useState({});
  const [results, setResults] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [showResults, setShowResults] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    api.get("/polls?active=true")
      .then(res => setPolls(res?.data?.polls || res?.polls || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh when admin creates a new poll
  const handleNewNotification = useCallback((data) => {
    if (data?.notification?.category === "community") load();
  }, [load]);

  useRealTimeUpdates(null, null, null, { onNewNotification: handleNewNotification });

  const handleVote = async (pollId) => {
    if (!votes[pollId]) return;
    setSubmitting(s => ({ ...s, [pollId]: true }));
    try {
      await api.post(`/polls/${pollId}/vote`, { poll_option_id: votes[pollId] });
      const res = await api.get(`/polls/${pollId}/results`);
      setResults(r => ({ ...r, [pollId]: res?.data || res }));
      setShowResults(s => ({ ...s, [pollId]: true }));
      // Mark as voted locally
      setPolls(prev => prev.map(p => p.id === pollId ? { ...p, user_voted: true } : p));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(s => ({ ...s, [pollId]: false }));
    }
  };

  const loadResults = async (pollId) => {
    try {
      const res = await api.get(`/polls/${pollId}/results`);
      setResults(r => ({ ...r, [pollId]: res?.data || res }));
      setShowResults(s => ({ ...s, [pollId]: true }));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="5px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Community Polls</Typography>
        <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }} title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Box>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">
        Have your say on community water matters
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      )}

      {!loading && polls.length === 0 && !error && (
        <Alert severity="info">No active polls at the moment. Check back soon.</Alert>
      )}

      {polls.map(poll => {
        const pollResults = results[poll.id];
        const showing = showResults[poll.id];
        const totalVotes = pollResults?.total_votes || 0;
        const alreadyVoted = poll.user_voted;

        return (
          <Card key={poll.id} sx={{ backgroundColor: colors.primary[400], mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <HowToVoteIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]}>{poll.title}</Typography>
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                  {alreadyVoted && (
                    <Chip label="Voted" size="small"
                      sx={{ backgroundColor: colors.greenAccent[700], color: "#fff" }} />
                  )}
                  {poll.closes_at && (
                    <Chip label={`Closes ${new Date(poll.closes_at).toLocaleDateString()}`}
                      size="small" sx={{ backgroundColor: colors.grey[700], color: colors.grey[300] }} />
                  )}
                </Box>
              </Box>

              {!showing ? (
                <>
                  {alreadyVoted ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      You have already voted in this poll.
                    </Alert>
                  ) : (
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup
                        value={votes[poll.id] || ""}
                        onChange={e => setVotes(v => ({ ...v, [poll.id]: e.target.value }))}>
                        {(poll.options || []).map((opt) => (
                          <FormControlLabel key={opt.id} value={String(opt.id)}
                            control={<Radio sx={{ color: colors.blueAccent[400], "&.Mui-checked": { color: colors.blueAccent[300] } }} />}
                            label={<Typography color={colors.grey[200]}>{opt.option_text}</Typography>}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  )}
                  <Box display="flex" gap={2} mt={2}>
                    {!alreadyVoted && (
                      <Button variant="contained"
                        disabled={!votes[poll.id] || submitting[poll.id]}
                        onClick={() => handleVote(poll.id)}
                        sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[700] } }}>
                        {submitting[poll.id] ? "Submitting..." : "Submit Vote"}
                      </Button>
                    )}
                    <Button variant="text" startIcon={<BarChartIcon />}
                      sx={{ color: colors.grey[400] }} onClick={() => loadResults(poll.id)}>
                      View Results
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Typography variant="body2" color={colors.grey[400]} mb={2}>
                    {totalVotes} vote{totalVotes !== 1 ? "s" : ""} total
                  </Typography>
                  {(pollResults?.results || []).map((r, i) => {
                    const pct = totalVotes > 0 ? Math.round((r.votes / totalVotes) * 100) : 0;
                    return (
                      <Box key={i} mb={1.5}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography color={colors.grey[200]}>{r.option_text}</Typography>
                          <Typography color={colors.grey[400]}>{pct}% ({r.votes})</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct}
                          sx={{ height: 8, borderRadius: 4,
                            backgroundColor: colors.grey[700],
                            "& .MuiLinearProgress-bar": { backgroundColor: colors.blueAccent[500] } }} />
                      </Box>
                    );
                  })}
                  <Divider sx={{ borderColor: colors.grey[700], my: 1 }} />
                  <Button variant="text" sx={{ color: colors.grey[400] }}
                    onClick={() => setShowResults(s => ({ ...s, [poll.id]: false }))}>
                    Back to Vote
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default CommunityPolls;
