import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress,
  Alert, Chip, Divider, TextField, InputAdornment, Button, IconButton,
} from "@mui/material";
import { tokens } from "../../../theme";
import CampaignIcon from "@mui/icons-material/Campaign";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import EventIcon from "@mui/icons-material/Event";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import useRealTimeUpdates from "../../../../../hooks/useRealTimeUpdates";

const priorityColor = (priority, colors) => {
  if (priority === "urgent") return colors.redAccent[400];
  if (priority === "high") return "#f0c040";
  return colors.blueAccent[400];
};

const Announcements = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api.get("/announcements")
      .then(res => setAnnouncements(res.data?.announcements || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh when a new notification arrives (admin published something)
  const handleNewNotification = useCallback((data) => {
    if (data?.notification?.category === "announcement") {
      load();
    }
  }, [load]);

  useRealTimeUpdates(null, null, null, { onNewNotification: handleNewNotification });

  const filtered = announcements.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="5px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Announcements</Typography>
        <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }} title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Box>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">
        Latest news and updates from the water authority
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <TextField
        placeholder="Search announcements..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 3, width: 320 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: colors.grey[400] }} />
            </InputAdornment>
          ),
        }}
      />

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      )}

      {!loading && filtered.length === 0 && !error && (
        <Alert severity="info">No announcements found.</Alert>
      )}

      {filtered.map((a) => (
        <Card key={a.id} sx={{
          backgroundColor: colors.primary[400], mb: 2,
          borderLeft: `4px solid ${priorityColor(a.priority, colors)}`,
        }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <CampaignIcon sx={{ color: priorityColor(a.priority, colors) }} />
                <Typography variant="h5" color={colors.grey[100]}>{a.title}</Typography>
              </Box>
              {a.priority && (
                <Chip label={a.priority.toUpperCase()} size="small"
                  sx={{ backgroundColor: priorityColor(a.priority, colors), color: "#fff" }} />
              )}
            </Box>
            <Typography color={colors.grey[300]} mb={2} sx={{ whiteSpace: "pre-line" }}>
              {a.content}
            </Typography>
            <Divider sx={{ borderColor: colors.grey[700], mb: 1 }} />
            <Typography variant="caption" color={colors.grey[400]}>
              {a.published_at
                ? new Date(a.published_at).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })
                : ""}
              {a.created_by ? ` · ${a.created_by}` : ""}
            </Typography>
            {(a.poll_id || a.event_id) && (
              <Box display="flex" gap={1} mt={1}>
                {a.poll_id && (
                  <Button size="small" startIcon={<HowToVoteIcon />}
                    sx={{ color: colors.blueAccent[400] }}
                    onClick={() => navigate("../community-polls")}>
                    View Poll
                  </Button>
                )}
                {a.event_id && (
                  <Button size="small" startIcon={<EventIcon />}
                    sx={{ color: colors.greenAccent[400] }}
                    onClick={() => navigate("../events")}>
                    View Event
                  </Button>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default Announcements;
