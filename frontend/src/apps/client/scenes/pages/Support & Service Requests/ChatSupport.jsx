import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Grid, TextField,
  IconButton, Avatar, Chip, List, ListItem, ListItemText,
  ListItemIcon, Paper, CircularProgress, Alert,
} from "@mui/material";
import { tokens } from "../../../theme";
import SendIcon from "@mui/icons-material/Send";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TagIcon from "@mui/icons-material/Tag";
import { useLocation } from "react-router-dom";
import api from "../../../utils/api";

const BASE_WS = "ws://localhost:3001/cable";
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 2000;

const ChatSupport = () => {
  const colors = tokens("dark");
  const location = useLocation();

  // Prefilled message from navigation state (e.g. from MyAds "Request Changes")
  const prefillMessage = location.state?.prefillMessage || "";

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState(prefillMessage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  // "connecting" | "connected" | "reconnecting" | "failed"
  const [wsStatus, setWsStatus] = useState("connecting");

  const messagesEndRef = useRef(null);
  const cableRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const sessionId = `client-${user.id || "guest"}`;

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setWsStatus("failed");
      setError("No auth token. Please log in again.");
      return;
    }

    const ws = new WebSocket(`${BASE_WS}?token=${token}`);
    cableRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      retryCountRef.current = 0;
      // Subscribe to the chat channel
      ws.send(JSON.stringify({
        command: "subscribe",
        identifier: JSON.stringify({ channel: "ChatChannel", session_id: sessionId }),
      }));
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "welcome" || payload.type === "ping") return;
        if (payload.type === "confirm_subscription") {
          setWsStatus("connected");
          setError(null);
          return;
        }
        if (payload.type === "reject_subscription") {
          setWsStatus("failed");
          setError("Chat subscription rejected — please refresh the page.");
          return;
        }
        if (payload.message) {
          setMessages(prev =>
            prev.find(m => m.id === payload.message.id) ? prev : [...prev, payload.message]
          );
        }
      } catch {}
    };

    // onerror always fires before onclose — handle retry in onclose only
    ws.onerror = () => {};

    ws.onclose = (event) => {
      if (!mountedRef.current) return;
      if (event.code === 1000 || event.code === 1001) return; // intentional close

      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        setWsStatus("reconnecting");
        const delay = RETRY_BASE_MS * retryCountRef.current;
        retryTimerRef.current = setTimeout(connect, delay);
      } else {
        setWsStatus("failed");
        setError("Real-time connection unavailable. Messages will still send.");
      }
    };
  }, [sessionId]);

  useEffect(() => {
    mountedRef.current = true;

    api.get(`/chat_messages?session_id=${sessionId}`)
      .then(res => setMessages(res.data?.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(retryTimerRef.current);
      cableRef.current?.close(1000, "unmounted");
    };
  }, [connect, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim()) return;
    const text = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    const ws = cableRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && wsStatus === "connected") {
      ws.send(JSON.stringify({
        command: "message",
        identifier: JSON.stringify({ channel: "ChatChannel", session_id: sessionId }),
        data: JSON.stringify({ action: "send_message", message: text }),
      }));
      setSending(false);
      return;
    }

    // HTTP fallback
    try {
      const res = await api.post("/chat_messages", { session_id: sessionId, message: text });
      setMessages(prev =>
        prev.find(m => m.id === res.data?.message?.id) ? prev : [...prev, res.data.message]
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (ts) =>
    ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  const statusMap = {
    connected:    { label: "Connected",      color: "#4caf50" },
    connecting:   { label: "Connecting...",  color: "#ff9800" },
    reconnecting: { label: "Reconnecting...", color: "#ff9800" },
    failed:       { label: "Offline",        color: "#f44336" },
  };
  const status = statusMap[wsStatus] || statusMap.connecting;

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="20px">Chat Support</Typography>

      <Grid container spacing={3}>
        {/* Chat window */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: colors.primary[400], height: "75vh", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 0 }}>
              {/* Header */}
              <Box sx={{ backgroundColor: colors.primary[500], p: 2, borderBottom: `1px solid ${colors.grey[700]}` }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ backgroundColor: colors.greenAccent[500] }}>S</Avatar>
                  <Box>
                    <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">Support Team</Typography>
                    <Chip label={status.label} size="small"
                      sx={{ backgroundColor: status.color, color: "#fff", height: 20, fontSize: "0.75rem" }} />
                  </Box>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
                {loading && <Box display="flex" justifyContent="center"><CircularProgress size={24} /></Box>}
                {error && (
                  <Alert severity="warning" sx={{ mb: 1 }} onClose={() => setError(null)}>{error}</Alert>
                )}
                {messages.length === 0 && !loading && (
                  <Typography color={colors.grey[500]} textAlign="center" mt={4}>
                    Start a conversation with our support team.
                  </Typography>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.sender_role === "client";
                  return (
                    <Box key={msg.id || i} display="flex" justifyContent={isMe ? "flex-end" : "flex-start"} mb={2}>
                      <Box display="flex" flexDirection={isMe ? "row-reverse" : "row"} alignItems="flex-start" gap={1} maxWidth="70%">
                        {!isMe && (
                          <Avatar sx={{ backgroundColor: colors.greenAccent[500], width: 32, height: 32, fontSize: "0.875rem" }}>
                            {msg.sender_name?.[0] || "S"}
                          </Avatar>
                        )}
                        <Paper sx={{ p: 1.5, backgroundColor: isMe ? colors.blueAccent[600] : colors.primary[500], borderRadius: 2 }}>
                          {!isMe && (
                            <Typography variant="caption" color={colors.greenAccent[400]} fontWeight="bold" display="block">
                              {msg.sender_name || "Support"}
                            </Typography>
                          )}
                          <Typography variant="body1" color={colors.grey[100]}>{msg.message}</Typography>
                          <Typography variant="caption" color={colors.grey[400]} display="block" mt={0.5}>
                            {formatTime(msg.created_at)}
                          </Typography>
                        </Paper>
                        {isMe && (
                          <Avatar sx={{ backgroundColor: colors.blueAccent[500], width: 32, height: 32, fontSize: "0.875rem" }}>
                            {user.first_name?.[0] || "Y"}
                          </Avatar>
                        )}
                      </Box>
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box sx={{ p: 2, borderTop: `1px solid ${colors.grey[700]}`, backgroundColor: colors.primary[500] }}>
                <Box display="flex" gap={1} alignItems="center">
                  <TextField fullWidth multiline maxRows={4} placeholder="Type your message..."
                    value={inputMessage} onChange={e => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: colors.grey[100], backgroundColor: colors.primary[400],
                        "& fieldset": { borderColor: colors.grey[700] },
                        "&:hover fieldset": { borderColor: colors.blueAccent[500] },
                        "&.Mui-focused fieldset": { borderColor: colors.blueAccent[500] },
                      },
                    }} />
                  <IconButton onClick={handleSend} disabled={!inputMessage.trim() || sending}
                    sx={{
                      backgroundColor: colors.greenAccent[500], color: "#fff",
                      "&:hover": { backgroundColor: colors.greenAccent[600] },
                      "&.Mui-disabled": { backgroundColor: colors.grey[700], color: colors.grey[500] },
                    }}>
                    {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Support info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={3}>Need Help?</Typography>
              <List>
                <ListItem>
                  <ListItemIcon><PhoneIcon sx={{ color: colors.blueAccent[500] }} /></ListItemIcon>
                  <ListItemText primary="Call Support" secondary="+254 700 000 000"
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.blueAccent[500] }} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><EmailIcon sx={{ color: colors.greenAccent[500] }} /></ListItemIcon>
                  <ListItemText primary="Email Support" secondary="support@waterservice.co.ke"
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.greenAccent[500] }} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ScheduleIcon sx={{ color: colors.blueAccent[500] }} /></ListItemIcon>
                  <ListItemText primary="Available 24/7" secondary="Always here to help"
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }} />
                </ListItem>
              </List>
              <Box mt={3}>
                <Typography variant="h6" color={colors.grey[100]} mb={2}>Quick Topics</Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {["Billing & Payments", "Water Quality Issues", "Meter Reading", "Connection Issues"].map(topic => (
                    <Chip key={topic} icon={<TagIcon />} label={topic}
                      onClick={() => setInputMessage(`I need help with: ${topic}`)}
                      sx={{
                        backgroundColor: colors.primary[500], color: colors.grey[100],
                        justifyContent: "flex-start", cursor: "pointer",
                        "&:hover": { backgroundColor: colors.blueAccent[500] },
                      }} />
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatSupport;
