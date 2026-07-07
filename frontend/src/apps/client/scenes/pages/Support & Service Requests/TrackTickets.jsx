import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert,
  Chip, Button, TextField, Divider, Avatar, Paper, IconButton,
} from "@mui/material";
import { tokens } from "../../../theme";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import SendIcon from "@mui/icons-material/Send";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddCommentIcon from "@mui/icons-material/AddComment";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";

const statusColor = (status, colors) => {
  if (status === "resolved" || status === "closed") return colors.greenAccent[400];
  if (status === "in_progress") return colors.blueAccent[400];
  if (status === "open") return "#f0c040";
  return colors.grey[400];
};

const priorityColor = (priority, colors) => {
  if (priority === "urgent") return colors.redAccent[400];
  if (priority === "high") return "#ff9800";
  if (priority === "normal") return colors.blueAccent[400];
  return colors.greenAccent[400];
};

const formatTime = (ts) =>
  ts ? new Date(ts).toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "";

// ── Single ticket card with always-visible chat thread ──────────────────────
const TicketCard = ({ ticket, colors, onRefresh }) => {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const threadEndRef = useRef(null);

  // Scroll to bottom of thread only when a NEW message is added (not on initial load)
  const prevLengthRef = useRef(null);
  useEffect(() => {
    const currentLength = ticket.updates?.length ?? 0;
    if (prevLengthRef.current !== null && currentLength > prevLengthRef.current) {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = currentLength;
  }, [ticket.updates?.length]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    const text = replyText.trim();
    setReplyText("");
    setSending(true);
    setError(null);
    try {
      await api.post(`/tickets/${ticket.id}/updates`, { message: text });
      onRefresh(); // refresh all tickets to get latest updates
    } catch (err) {
      setError(err.message);
      setReplyText(text); // restore on error
    } finally {
      setSending(false);
    }
  };

  const isOpen = ticket.status !== "closed" && ticket.status !== "resolved";
  const updates = ticket.updates || [];

  return (
    <Card sx={{ backgroundColor: colors.primary[400], mb: 3, borderRadius: 2 }}>
      <CardContent sx={{ p: 0 }}>
        {/* ── Ticket header ── */}
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${colors.grey[700]}` }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
            <Box display="flex" alignItems="flex-start" gap={1.5}>
              <SupportAgentIcon sx={{ color: colors.blueAccent[400], mt: 0.3 }} />
              <Box>
                <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">
                  {ticket.subject}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                  <Typography variant="caption" color={colors.grey[400]}>
                    {ticket.ticket_number || `#${ticket.id}`}
                  </Typography>
                  <Typography variant="caption" color={colors.grey[500]}>·</Typography>
                  <Typography variant="caption" color={colors.grey[400]}>
                    {ticket.category?.replace(/_/g, " ")}
                  </Typography>
                  <Typography variant="caption" color={colors.grey[500]}>·</Typography>
                  <Typography variant="caption" color={colors.grey[400]}>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
              <Chip
                label={ticket.priority?.toUpperCase()}
                size="small"
                sx={{ backgroundColor: priorityColor(ticket.priority, colors), color: "#fff", fontSize: "0.75rem" }}
              />
              <Chip
                label={ticket.status?.replace(/_/g, " ").toUpperCase()}
                size="small"
                sx={{ backgroundColor: statusColor(ticket.status, colors), color: "#fff", fontSize: "0.75rem" }}
              />
            </Box>
          </Box>

          {/* Description */}
          <Box mt={2} p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
            <Typography variant="body2" color={colors.grey[300]} sx={{ lineHeight: 1.6 }}>
              {ticket.description}
            </Typography>
          </Box>

          {ticket.resolution_notes && (
            <Box mt={1.5} p={1.5} sx={{ backgroundColor: colors.greenAccent[900] || colors.primary[600], borderRadius: 1,
              borderLeft: `3px solid ${colors.greenAccent[500]}` }}>
              <Typography variant="caption" color={colors.greenAccent[400]} fontWeight="bold">Resolution Note</Typography>
              <Typography variant="body2" color={colors.grey[200]} mt={0.5}>{ticket.resolution_notes}</Typography>
            </Box>
          )}
        </Box>

        {/* ── Chat thread ── */}
        <Box sx={{ p: 2.5 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <AddCommentIcon sx={{ fontSize: 18, color: colors.grey[400] }} />
            <Typography variant="body2" color={colors.grey[400]} fontWeight="bold">
              Conversation ({updates.length} message{updates.length !== 1 ? "s" : ""})
            </Typography>
          </Box>

          {/* Messages */}
          <Box sx={{ maxHeight: 320, overflowY: "auto", pr: 0.5 }}>
            {updates.length === 0 ? (
              <Typography variant="body2" color={colors.grey[500]} textAlign="center" py={2}>
                No messages yet. Add a reply below to communicate with support.
              </Typography>
            ) : (
              updates.map((u, i) => {
                const isAdmin = u.user?.role === "admin" || u.user?.role === "super_admin";
                return (
                  <Box
                    key={u.id || i}
                    display="flex"
                    justifyContent={isAdmin ? "flex-start" : "flex-end"}
                    mb={1.5}
                  >
                    <Box
                      display="flex"
                      flexDirection={isAdmin ? "row" : "row-reverse"}
                      alignItems="flex-end"
                      gap={1}
                      maxWidth="80%"
                    >
                      <Avatar
                        sx={{
                          width: 28, height: 28, fontSize: "0.75rem",
                          backgroundColor: isAdmin ? colors.blueAccent[600] : colors.greenAccent[700],
                          flexShrink: 0,
                        }}
                      >
                        {isAdmin ? "S" : "Y"}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="caption"
                          color={colors.grey[500]}
                          display="block"
                          mb={0.3}
                          textAlign={isAdmin ? "left" : "right"}
                        >
                          {isAdmin ? (u.user?.name || "Support Team") : "You"} · {formatTime(u.created_at)}
                        </Typography>
                        <Paper
                          sx={{
                            p: 1.5,
                            backgroundColor: isAdmin ? colors.primary[500] : colors.blueAccent[700],
                            borderRadius: isAdmin ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                          }}
                        >
                          <Typography variant="body2" color={colors.grey[100]} sx={{ lineHeight: 1.5 }}>
                            {u.message}
                          </Typography>
                        </Paper>
                      </Box>
                    </Box>
                  </Box>
                );
              })
            )}
            <div ref={threadEndRef} />
          </Box>

          {/* Reply input */}
          {isOpen && (
            <Box mt={2}>
              {error && (
                <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>{error}</Alert>
              )}
              <Box display="flex" gap={1} alignItems="flex-end">
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  size="small"
                  placeholder="Add a reply to this ticket..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); }
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: colors.grey[100],
                      "& fieldset": { borderColor: colors.grey[600] },
                      "&:hover fieldset": { borderColor: colors.blueAccent[500] },
                      "&.Mui-focused fieldset": { borderColor: colors.blueAccent[500] },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  disabled={sending || !replyText.trim()}
                  onClick={handleReply}
                  sx={{
                    backgroundColor: colors.blueAccent[600],
                    "&:hover": { backgroundColor: colors.blueAccent[700] },
                    minWidth: 48, height: 40,
                  }}
                >
                  {sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                </Button>
              </Box>
            </Box>
          )}

          {!isOpen && (
            <Box mt={2} p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1, textAlign: "center" }}>
              <Typography variant="body2" color={colors.grey[400]}>
                This ticket is {ticket.status}. No further replies can be added.
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
const TrackTickets = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api.get("/tickets")
      .then(res => setTickets(res.data?.tickets || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    // Poll every 30s so new admin replies appear without manual refresh
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return (
    <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress sx={{ color: colors.blueAccent[500] }} />
    </Box>
  );

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">My Tickets</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Track and reply to your support requests</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }} title="Refresh">
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[700] } }}
            onClick={() => navigate("../report-issue")}
          >
            New Ticket
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {tickets.length === 0 && !error && (
        <Alert severity="info">
          No tickets yet.{" "}
          <Button size="small" onClick={() => navigate("../report-issue")} sx={{ color: colors.blueAccent[400] }}>
            Report an issue
          </Button>
        </Alert>
      )}

      {tickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} colors={colors} onRefresh={load} />
      ))}
    </Box>
  );
};

export default TrackTickets;
