import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Card, CardContent, Grid, TextField, IconButton,
  Avatar, Chip, Paper, CircularProgress, Alert, Badge, Divider, List,
  ListItemButton, ListItemAvatar, ListItemText,
} from "@mui/material";
import { tokens } from "../../../theme";
import SendIcon from "@mui/icons-material/Send";
import RefreshIcon from "@mui/icons-material/Refresh";
import ChatIcon from "@mui/icons-material/Chat";
import adminApi from "../../../utils/api";

// const BASE_WS = "ws://localhost:3001/cable";
const BASE_WS = process.env.REACT_APP_CABLE_URL || 'wss://village-water-system-backend.onrender.com/cable';

const ChatSessions = () => {
  const colors = tokens("dark");
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const cableRef = useRef(null);
  const activeSessionRef = useRef(null);

  // Keep ref in sync so WS handler always has latest session
  useEffect(() => { activeSessionRef.current = activeSession; }, [activeSession]);

  // Load all sessions
  const loadSessions = () => {
    setLoadingSessions(true);
    adminApi.get("/chat_messages/sessions")
      .then(res => setSessions(res.data?.sessions || []))
      .catch(err => setError(err.message))
      .finally(() => setLoadingSessions(false));
  };

  useEffect(() => {
    loadSessions();

    // Connect ActionCable once with retry
    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(`${BASE_WS}?token=${token}`);
    cableRef.current = ws;

    ws.onopen = () => {
      // WS open — subscriptions happen per-session when admin clicks one
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "welcome" || payload.type === "ping") return;
        if (payload.type === "confirm_subscription") { setConnected(true); return; }
        if (payload.message) {
          const msg = payload.message;
          if (msg.session_id === activeSessionRef.current) {
            setMessages(prev => {
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
          // Refresh session list to update unread counts
          loadSessions();
        }
      } catch {}
    };

    ws.onerror = () => {};
    ws.onclose = () => setConnected(false);

    return () => ws.close(1000, "unmounted");
  }, []); // eslint-disable-line

  // Subscribe to a session channel
  const subscribeToSession = (sessionId) => {
    const ws = cableRef.current;
    if (!ws) return;

    const doSubscribe = () => {
      ws.send(JSON.stringify({
        command: "subscribe",
        identifier: JSON.stringify({ channel: "ChatChannel", session_id: sessionId }),
      }));
    };

    if (ws.readyState === WebSocket.OPEN) {
      doSubscribe();
    } else if (ws.readyState === WebSocket.CONNECTING) {
      // Queue subscription for when connection opens
      const prevOnOpen = ws.onopen;
      ws.onopen = (e) => {
        if (prevOnOpen) prevOnOpen(e);
        doSubscribe();
      };
    }
  };

  // Open a session
  const openSession = (session) => {
    setActiveSession(session.session_id);
    setLoadingMessages(true);
    setMessages([]);
    subscribeToSession(session.session_id);
    adminApi.get(`/chat_messages?session_id=${session.session_id}`)
      .then(res => setMessages(res.data?.messages || []))
      .catch(err => setError(err.message))
      .finally(() => setLoadingMessages(false));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeSession) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    const ws = cableRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        command: "message",
        identifier: JSON.stringify({ channel: "ChatChannel", session_id: activeSession }),
        data: JSON.stringify({ action: "send_message", message: text }),
      }));
      setSending(false);
      return;
    }

    // HTTP fallback
    try {
      const res = await adminApi.post("/chat_messages", { session_id: activeSession, message: text });
      setMessages(prev => {
        if (prev.find(m => m.id === res.data?.message?.id)) return prev;
        return [...prev, res.data.message];
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts) =>
    ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return formatTime(ts);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const activeSessionData = sessions.find(s => s.session_id === activeSession);

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Live Chat Sessions</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Respond to client support chats in real time</Typography>
        </Box>
        <IconButton onClick={loadSessions} sx={{ color: colors.blueAccent[400] }}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={2} sx={{ height: "78vh" }}>
        {/* Sessions list */}
        <Grid item xs={12} md={4} sx={{ height: "100%" }}>
          <Card sx={{ backgroundColor: colors.primary[400], height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ p: 2, borderBottom: `1px solid ${colors.grey[700]}` }}>
              <Typography variant="h5" color={colors.grey[100]}>
                Active Sessions
                {sessions.length > 0 && (
                  <Chip label={sessions.length} size="small"
                    sx={{ ml: 1, backgroundColor: colors.blueAccent[700], color: "#fff", height: 20 }} />
                )}
              </Typography>
            </Box>

            {loadingSessions ? (
              <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                <CircularProgress sx={{ color: colors.blueAccent[500] }} />
              </Box>
            ) : sessions.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flex={1} p={3}>
                <ChatIcon sx={{ fontSize: 48, color: colors.grey[600], mb: 1 }} />
                <Typography color={colors.grey[500]} textAlign="center">No active chat sessions yet.</Typography>
              </Box>
            ) : (
              <List sx={{ flex: 1, overflowY: "auto", p: 0 }}>
                {sessions.map(session => (
                  <React.Fragment key={session.session_id}>
                    <ListItemButton
                      selected={activeSession === session.session_id}
                      onClick={() => openSession(session)}
                      sx={{
                        "&.Mui-selected": { backgroundColor: colors.primary[500] },
                        "&:hover": { backgroundColor: colors.primary[500] },
                        py: 1.5,
                      }}
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={session.unread_count || 0} color="error">
                          <Avatar sx={{ backgroundColor: colors.blueAccent[600] }}>
                            {session.client_name?.[0] || "C"}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" color={colors.grey[100]} fontWeight={session.unread_count > 0 ? "bold" : "normal"} noWrap>
                            {session.client_name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color={colors.grey[400]} noWrap display="block">
                              {session.last_message || "No messages yet"}
                            </Typography>
                            <Typography variant="caption" color={colors.grey[500]}>
                              {formatDate(session.last_message_at)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    <Divider sx={{ borderColor: colors.grey[800] }} />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Card>
        </Grid>

        {/* Chat window */}
        <Grid item xs={12} md={8} sx={{ height: "100%" }}>
          <Card sx={{ backgroundColor: colors.primary[400], height: "100%", display: "flex", flexDirection: "column" }}>
            {!activeSession ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flex={1}>
                <ChatIcon sx={{ fontSize: 64, color: colors.grey[600], mb: 2 }} />
                <Typography variant="h5" color={colors.grey[500]}>Select a session to start chatting</Typography>
              </Box>
            ) : (
              <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 0 }}>
                {/* Header */}
                <Box sx={{ backgroundColor: colors.primary[500], p: 2, borderBottom: `1px solid ${colors.grey[700]}` }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ backgroundColor: colors.blueAccent[600] }}>
                      {activeSessionData?.client_name?.[0] || "C"}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">
                        {activeSessionData?.client_name || "Client"}
                      </Typography>
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip
                          label={connected ? "Live" : "Connecting..."}
                          size="small"
                          sx={{
                            backgroundColor: connected ? colors.greenAccent[500] : colors.grey[600],
                            color: "#fff", height: 18, fontSize: "0.7rem",
                          }}
                        />
                        <Typography variant="caption" color={colors.grey[400]}>
                          Session: {activeSession}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
                  {loadingMessages ? (
                    <Box display="flex" justifyContent="center" mt={4}>
                      <CircularProgress sx={{ color: colors.blueAccent[500] }} />
                    </Box>
                  ) : messages.length === 0 ? (
                    <Typography color={colors.grey[500]} textAlign="center" mt={4}>
                      No messages yet. Say hello!
                    </Typography>
                  ) : (
                    messages.map((msg, i) => {
                      const isAdmin = msg.sender_role === "admin";
                      return (
                        <Box key={msg.id || i} display="flex" justifyContent={isAdmin ? "flex-end" : "flex-start"} mb={2}>
                          <Box display="flex" flexDirection={isAdmin ? "row-reverse" : "row"} alignItems="flex-start" gap={1} maxWidth="70%">
                            <Avatar sx={{
                              backgroundColor: isAdmin ? colors.blueAccent[600] : colors.greenAccent[600],
                              width: 32, height: 32, fontSize: "0.875rem",
                            }}>
                              {msg.sender_name?.[0] || (isAdmin ? "A" : "C")}
                            </Avatar>
                            <Paper sx={{
                              p: 1.5,
                              backgroundColor: isAdmin ? colors.blueAccent[700] : colors.primary[500],
                              borderRadius: 2,
                            }}>
                              <Typography variant="caption" color={isAdmin ? colors.blueAccent[300] : colors.greenAccent[400]} fontWeight="bold" display="block">
                                {msg.sender_name || (isAdmin ? "Admin" : "Client")}
                              </Typography>
                              <Typography variant="body1" color={colors.grey[100]}>{msg.message}</Typography>
                              <Typography variant="caption" color={colors.grey[400]} display="block" mt={0.5}>
                                {formatTime(msg.created_at)}
                              </Typography>
                            </Paper>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Input */}
                <Box sx={{ p: 2, borderTop: `1px solid ${colors.grey[700]}`, backgroundColor: colors.primary[500] }}>
                  <Box display="flex" gap={1} alignItems="center">
                    <TextField fullWidth multiline maxRows={3} placeholder="Type a reply..."
                      value={input} onChange={e => setInput(e.target.value)}
                      onKeyPress={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: colors.grey[100], backgroundColor: colors.primary[400],
                          "& fieldset": { borderColor: colors.grey[700] },
                          "&:hover fieldset": { borderColor: colors.blueAccent[500] },
                          "&.Mui-focused fieldset": { borderColor: colors.blueAccent[500] },
                        },
                      }} />
                    <IconButton onClick={handleSend} disabled={!input.trim() || sending}
                      sx={{
                        backgroundColor: colors.blueAccent[600], color: "#fff",
                        "&:hover": { backgroundColor: colors.blueAccent[700] },
                        "&.Mui-disabled": { backgroundColor: colors.grey[700], color: colors.grey[500] },
                      }}>
                      {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatSessions;
