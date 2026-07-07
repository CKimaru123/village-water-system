import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, Select, MenuItem, FormControl, TextField, Divider, Avatar,
  Paper, IconButton, InputLabel,
} from "@mui/material";
import { tokens } from "../../../theme";
import SendIcon from "@mui/icons-material/Send";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import AddAlertIcon from "@mui/icons-material/AddAlert";
import { useNavigate } from "react-router-dom";
import adminApi from "../../../utils/api";

const STATUS_OPTIONS = [
  { value: "open",        label: "Open",        color: "#f0c040" },
  { value: "in_progress", label: "In Progress",  color: "#2196f3" },
  { value: "resolved",    label: "Resolved",     color: "#4cceac" },
  { value: "closed",      label: "Closed",       color: "#666666" },
];

const PRIORITY_COLORS = {
  urgent: "#f44336",
  high:   "#ff9800",
  normal: "#2196f3",
  low:    "#4caf50",
};

const formatTime = (ts) =>
  ts ? new Date(ts).toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "";

// ── Single ticket card ───────────────────────────────────────────────────────
const TicketCard = ({ ticket, colors, onRefresh, navigate }) => {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [localError, setLocalError] = useState(null);
  const threadEndRef = useRef(null);

  // Only scroll when a NEW message is added, not on initial load
  const prevLengthRef = useRef(null);
  useEffect(() => {
    const currentLength = ticket.updates?.length ?? 0;
    if (prevLengthRef.current !== null && currentLength > prevLengthRef.current) {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = currentLength;
  }, [ticket.updates?.length]);

  const handleStatusChange = async (status) => {
    setUpdating(true);
    try {
      await adminApi.patch(`/tickets/${ticket.id}`, { ticket: { status } });
      onRefresh();
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    const text = replyText.trim();
    setReplyText("");
    setSending(true);
    setLocalError(null);
    try {
      await adminApi.post(`/tickets/${ticket.id}/updates`, { message: text });
      onRefresh();
    } catch (err) {
      setLocalError(err.message);
      setReplyText(text);
    } finally {
      setSending(false);
    }
  };

  const updates = ticket.updates || [];
  const isOpen = ticket.status !== "closed" && ticket.status !== "resolved";
  const statusOpt = STATUS_OPTIONS.find(s => s.value === ticket.status) || STATUS_OPTIONS[0];

  return (
    <Card sx={{ backgroundColor: colors.primary[400], mb: 3, borderRadius: 2 }}>
      <CardContent sx={{ p: 0 }}>
        {/* ── Header ── */}
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${colors.grey[700]}` }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
            {/* Left: ticket info */}
            <Box flex={1} minWidth={0}>
              <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" mb={0.5}>
                {ticket.subject}
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                <Typography variant="body2" color={colors.grey[400]}>
                  {ticket.ticket_number || `#${ticket.id}`}
                </Typography>
                <Typography variant="body2" color={colors.grey[600]}>·</Typography>
                <Typography variant="body2" color={colors.grey[300]}>
                  {ticket.user?.name || ticket.user?.phone || `User #${ticket.user_id}`}
                </Typography>
                <Typography variant="body2" color={colors.grey[600]}>·</Typography>
                <Typography variant="body2" color={colors.grey[400]}>
                  {ticket.category?.replace(/_/g, " ")}
                </Typography>
                <Chip
                  label={ticket.priority?.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: PRIORITY_COLORS[ticket.priority] || "#666",
                    color: "#fff", fontSize: "0.75rem", height: 22,
                  }}
                />
                <Button
                  size="small"
                  startIcon={<PersonSearchIcon sx={{ fontSize: 14 }} />}
                  onClick={() => navigate("../client-lookup", { state: { user_id: ticket.user?.id || ticket.user_id, client_name: ticket.user?.name || ticket.user?.phone } })}
                  sx={{ color: colors.blueAccent[400], fontSize: "0.8rem", p: 0, minWidth: 0 }}
                >
                  View Client
                </Button>
              </Box>
              <Typography variant="caption" color={colors.grey[500]} mt={0.5} display="block">
                Submitted {formatTime(ticket.created_at)}
                {ticket.updates_count > 0 && ` · ${ticket.updates_count} message${ticket.updates_count !== 1 ? "s" : ""}`}
              </Typography>
            </Box>

            {/* Right: status selector */}
            <Box display="flex" alignItems="center" gap={1} flexShrink={0}>
              <FormControl size="small" disabled={updating} sx={{ minWidth: 150 }}>
                <InputLabel sx={{ fontSize: "0.9rem" }}>Status</InputLabel>
                <Select
                  value={ticket.status || "open"}
                  label="Status"
                  onChange={e => handleStatusChange(e.target.value)}
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: statusOpt.color,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: statusOpt.color },
                    "& .MuiSvgIcon-root": { color: statusOpt.color },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: colors.primary[400],
                        "& .MuiMenuItem-root": {
                          fontSize: "0.95rem",
                          py: 1.2,
                          "&:hover": { backgroundColor: colors.primary[500] },
                        },
                      },
                    },
                  }}
                >
                  {STATUS_OPTIONS.map(s => (
                    <MenuItem key={s.value} value={s.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: s.color, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: "0.95rem", color: colors.grey[100] }}>{s.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddAlertIcon sx={{ fontSize: 14 }} />}
                onClick={() => navigate("../incident-management", { state: { prefill: { title: ticket.subject } } })}
                sx={{ color: colors.redAccent[400], borderColor: colors.redAccent[400], fontSize: "0.8rem", whiteSpace: "nowrap" }}
              >
                Incident
              </Button>
            </Box>
          </Box>

          {/* Description */}
          <Box mt={2} p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
            <Typography variant="body2" color={colors.grey[400]} fontWeight="bold" mb={0.5} fontSize="0.8rem">
              DESCRIPTION
            </Typography>
            <Typography variant="body2" color={colors.grey[300]} sx={{ lineHeight: 1.6 }}>
              {ticket.description}
            </Typography>
          </Box>

          {ticket.resolution_notes && (
            <Box mt={1.5} p={1.5} sx={{
              backgroundColor: colors.primary[500], borderRadius: 1,
              borderLeft: `3px solid ${colors.greenAccent[500]}`,
            }}>
              <Typography variant="caption" color={colors.greenAccent[400]} fontWeight="bold">Resolution Note</Typography>
              <Typography variant="body2" color={colors.grey[200]} mt={0.5}>{ticket.resolution_notes}</Typography>
            </Box>
          )}
        </Box>

        {/* ── Conversation thread ── */}
        <Box sx={{ p: 2.5 }}>
          <Typography variant="body2" color={colors.grey[400]} fontWeight="bold" mb={2} fontSize="0.85rem"
            sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Conversation ({updates.length})
          </Typography>

          <Box sx={{ maxHeight: 340, overflowY: "auto", pr: 0.5 }}>
            {updates.length === 0 ? (
              <Typography variant="body2" color={colors.grey[500]} textAlign="center" py={2}>
                No messages yet. Reply below to communicate with the client.
              </Typography>
            ) : (
              updates.map((u, i) => {
                const isAdmin = u.user?.role === "admin" || u.user?.role === "super_admin";
                return (
                  <Box
                    key={u.id || i}
                    display="flex"
                    justifyContent={isAdmin ? "flex-end" : "flex-start"}
                    mb={1.5}
                  >
                    <Box
                      display="flex"
                      flexDirection={isAdmin ? "row-reverse" : "row"}
                      alignItems="flex-end"
                      gap={1}
                      maxWidth="80%"
                    >
                      <Avatar sx={{
                        width: 28, height: 28, fontSize: "0.75rem", flexShrink: 0,
                        backgroundColor: isAdmin ? colors.blueAccent[600] : colors.greenAccent[700],
                      }}>
                        {isAdmin ? "A" : "C"}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="caption"
                          color={colors.grey[500]}
                          display="block"
                          mb={0.3}
                          textAlign={isAdmin ? "right" : "left"}
                        >
                          {isAdmin ? (u.user?.name || "Admin") : (u.user?.name || "Client")} · {formatTime(u.created_at)}
                        </Typography>
                        <Paper sx={{
                          p: 1.5,
                          backgroundColor: isAdmin ? colors.blueAccent[700] : colors.primary[500],
                          borderRadius: isAdmin ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                        }}>
                          <Typography variant="body2" color={colors.grey[100]} sx={{ lineHeight: 1.5, fontSize: "0.9rem" }}>
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
              {localError && (
                <Alert severity="error" sx={{ mb: 1 }} onClose={() => setLocalError(null)}>{localError}</Alert>
              )}
              <Box display="flex" gap={1} alignItems="flex-end">
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  size="small"
                  placeholder="Reply to client..."
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
                Ticket is {ticket.status}. Reopen by changing status to continue the conversation.
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
const MultiChannelTicketing = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const load = useCallback(() => {
    adminApi.get("/tickets/admin_all")
      .then(res => setTickets(res.data?.tickets || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = filterStatus === "all"
    ? tickets
    : tickets.filter(t => t.status === filterStatus);

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Support Tickets</Typography>
          <Typography variant="h6" color={colors.grey[400]}>
            Manage and respond to client support requests
          </Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          {/* Status filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ fontSize: "0.9rem" }}>Filter</InputLabel>
            <Select
              value={filterStatus}
              label="Filter"
              onChange={e => setFilterStatus(e.target.value)}
              sx={{ fontSize: "0.95rem" }}
            >
              <MenuItem value="all" sx={{ fontSize: "0.95rem" }}>All Tickets</MenuItem>
              {STATUS_OPTIONS.map(s => (
                <MenuItem key={s.value} value={s.value} sx={{ fontSize: "0.95rem" }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: s.color }} />
                    {s.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }} title="Refresh">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      ) : (
        <>
          {filtered.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              colors={colors}
              onRefresh={load}
              navigate={navigate}
            />
          ))}
          {filtered.length === 0 && (
            <Alert severity="info">No tickets found.</Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default MultiChannelTicketing;
