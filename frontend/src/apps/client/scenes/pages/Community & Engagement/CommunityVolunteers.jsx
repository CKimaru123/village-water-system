import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,
  Chip, Button, IconButton, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Avatar, Divider, Paper, Snackbar,
} from "@mui/material";
import { tokens } from "../../../theme";
import { useAuth } from "../../../../../hooks/useAuth";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from "@mui/icons-material/Send";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../../utils/api";

const BASE_WS = "ws://localhost:3001/cable";
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 2000;

const ROLES = ["Water Monitor","Community Liaison","Meter Reader","Event Coordinator","Leak Reporter","Sanitation Inspector","General Helper"];
const priorityColor = (p) => ({ high:"#e2726e", normal:"#4cceac", low:"#868dfb" }[p] || "#666");

// ── Task Chat — WebSocket + HTTP fallback, DB-backed ─────────────────────────
const TaskChat = ({ task, myId, myName, colors, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [wsStatus, setWsStatus] = useState("connecting");
  const [chatError, setChatError] = useState(null);
  const bottomRef = useRef(null);
  const cableRef  = useRef(null);
  const retryRef  = useRef(0);
  const timerRef  = useRef(null);
  const mountedRef = useRef(true);
  const sessionId = `volunteer-task-${task.id}`;

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    const token = localStorage.getItem("token");
    if (!token) { setWsStatus("failed"); return; }
    const ws = new WebSocket(`${BASE_WS}?token=${token}`);
    cableRef.current = ws;
    ws.onopen = () => {
      if (!mountedRef.current) return;
      retryRef.current = 0;
      ws.send(JSON.stringify({ command:"subscribe", identifier:JSON.stringify({ channel:"ChatChannel", session_id:sessionId }) }));
    };
    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const p = JSON.parse(e.data);
        if (p.type === "welcome" || p.type === "ping") return;
        if (p.type === "confirm_subscription") { setWsStatus("connected"); setChatError(null); return; }
        if (p.type === "reject_subscription")  { setWsStatus("failed"); return; }
        if (p.message) setMessages(prev => prev.find(m => m.id === p.message.id) ? prev : [...prev, p.message]);
      } catch {}
    };
    ws.onerror = () => {};
    ws.onclose = (e) => {
      if (!mountedRef.current || e.code === 1000 || e.code === 1001) return;
      if (retryRef.current < MAX_RETRIES) {
        retryRef.current += 1;
        setWsStatus("reconnecting");
        timerRef.current = setTimeout(connect, RETRY_BASE_MS * retryRef.current);
      } else { setWsStatus("failed"); setChatError("Real-time unavailable — messages still send via HTTP."); }
    };
  }, [sessionId]);

  useEffect(() => {
    mountedRef.current = true;
    api.get(`/chat_messages?session_id=${sessionId}`)
      .then(res => setMessages(res.data?.data?.messages || res.data?.messages || []))
      .catch(() => {});
    connect();
    return () => { mountedRef.current = false; clearTimeout(timerRef.current); cableRef.current?.close(1000, "unmounted"); };
  }, [connect, sessionId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    const msg = text.trim(); setText(""); setSending(true);
    const ws = cableRef.current;
    if (ws?.readyState === WebSocket.OPEN && wsStatus === "connected") {
      ws.send(JSON.stringify({ command:"message", identifier:JSON.stringify({ channel:"ChatChannel", session_id:sessionId }), data:JSON.stringify({ action:"send_message", message:msg }) }));
      setSending(false); return;
    }
    try {
      const res = await api.post("/chat_messages", { session_id:sessionId, message:msg });
      const m = res.data?.data?.message || res.data?.message;
      if (m) setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
    } catch (err) { setChatError(err.message); } finally { setSending(false); }
  };

  const wsInfo = { connected:{label:"Live",color:"#4caf50"}, connecting:{label:"Connecting…",color:"#ff9800"}, reconnecting:{label:"Reconnecting…",color:"#ff9800"}, failed:{label:"Offline",color:"#f44336"} }[wsStatus] || {label:"…",color:"#888"};
  const fmt = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "";

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Box>
          <Typography sx={{ fontSize:"1rem !important", fontWeight:"bold", color:colors.grey[100] }}>{task.title}</Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.3}>
            <Chip label={wsInfo.label} size="small" sx={{ backgroundColor:wsInfo.color, color:"#fff", height:18, fontSize:"0.65rem" }} />
            <Typography sx={{ fontSize:"0.75rem !important", color:colors.grey[400] }}>
              {task.volunteers?.length || 0} volunteer{task.volunteers?.length !== 1 ? "s" : ""} · {task.zone}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color:colors.grey[500] }}><CloseIcon /></IconButton>
      </Box>
      <Divider sx={{ borderColor:colors.grey[700], mb:1.5 }} />
      {task.volunteers?.length > 0 && (
        <Box mb={1.5} p={1.5} sx={{ backgroundColor:colors.primary[500], borderRadius:1 }}>
          <Typography sx={{ fontSize:"0.72rem !important", color:colors.grey[400], mb:0.5, fontWeight:"bold", textTransform:"uppercase" }}>Volunteers on this task</Typography>
          <Box display="flex" gap={0.8} flexWrap="wrap">
            {task.volunteers.map((v, i) => (
              <Chip key={i} avatar={<Avatar sx={{ width:18, height:18, fontSize:"0.6rem" }}>{v.name?.charAt(0)}</Avatar>}
                label={`${v.name} · ${v.role}`} size="small"
                sx={{ backgroundColor:colors.blueAccent[800], color:colors.blueAccent[200], fontSize:"0.7rem" }} />
            ))}
          </Box>
        </Box>
      )}
      {chatError && <Alert severity="warning" sx={{ mb:1, fontSize:"0.8rem" }} onClose={() => setChatError(null)}>{chatError}</Alert>}
      <Box flex={1} sx={{ overflowY:"auto", maxHeight:300, pr:0.5 }}>
        {messages.length === 0 ? (
          <Box textAlign="center" py={3}>
            <ChatIcon sx={{ fontSize:32, color:colors.grey[700], mb:1 }} />
            <Typography sx={{ fontSize:"0.85rem !important", color:colors.grey[500] }}>No messages yet. Coordinate with your team!</Typography>
          </Box>
        ) : messages.map((m, i) => {
          const isMe = m.sender_role === "client" && (m.user_id === myId || m.sender_id === myId);
          const isAdmin = m.sender_role === "admin";
          return (
            <Box key={m.id || i} display="flex" justifyContent={isMe ? "flex-end" : "flex-start"} mb={1.5}>
              <Box display="flex" flexDirection={isMe ? "row-reverse" : "row"} alignItems="flex-end" gap={1} maxWidth="82%">
                <Avatar sx={{ width:26, height:26, fontSize:"0.7rem", flexShrink:0,
                  backgroundColor:isMe ? colors.greenAccent[700] : isAdmin ? colors.redAccent[700] : colors.blueAccent[700] }}>
                  {(m.sender_name || "?").charAt(0)}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize:"0.7rem !important", color:colors.grey[500], mb:0.2, textAlign:isMe ? "right" : "left" }}>
                    {isMe ? "You" : m.sender_name}
                    {!isMe && isAdmin && <Chip label="Admin" size="small" sx={{ ml:0.5, height:14, fontSize:"0.6rem", backgroundColor:colors.redAccent[800], color:colors.redAccent[200] }} />}
                    {" · "}{fmt(m.created_at)}
                  </Typography>
                  <Paper sx={{ p:1.5, backgroundColor:isMe ? colors.greenAccent[800] : colors.primary[500], borderRadius:isMe ? "12px 4px 12px 12px" : "4px 12px 12px 12px" }}>
                    <Typography sx={{ fontSize:"0.85rem !important", color:colors.grey[100], lineHeight:1.5 }}>{m.message}</Typography>
                  </Paper>
                </Box>
              </Box>
            </Box>
          );
        })}
        <div ref={bottomRef} />
      </Box>
      <Box display="flex" gap={1} mt={1.5} alignItems="flex-end">
        <TextField fullWidth multiline maxRows={3} size="small" placeholder="Agree on time, tools, hours… (Enter to send)"
          value={text} onChange={e => setText(e.target.value)}
          onKeyPress={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          sx={{ "& .MuiOutlinedInput-root":{ color:colors.grey[100], "& fieldset":{ borderColor:colors.grey[600] }, "&:hover fieldset":{ borderColor:colors.blueAccent[500] }, "&.Mui-focused fieldset":{ borderColor:colors.blueAccent[500] } } }} />
        <IconButton onClick={send} disabled={!text.trim() || sending}
          sx={{ backgroundColor:colors.greenAccent[500], color:"#fff", "&:hover":{ backgroundColor:colors.greenAccent[600] }, "&.Mui-disabled":{ backgroundColor:colors.grey[700], color:colors.grey[500] } }}>
          {sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

// ── Main Client Volunteer Page ────────────────────────────────────────────────
const CommunityVolunteers = () => {
  const colors = tokens("dark");
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [chatTask, setChatTask] = useState(null);
  const [volunteerDialog, setVolunteerDialog] = useState({ open:false, task:null });
  const [selectedRole, setSelectedRole] = useState("General Helper");
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open:false, message:"", severity:"success" });
  const cableRef = useRef(null);
  const mountedRef = useRef(true);

  const myName = user?.display_name || user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Community Member";
  const myId = user?.id;

  const load = useCallback(() => {
    setLoading(true);
    api.get("/community_tasks")
      .then(res => {
        const d = res.data?.data?.tasks || res.data?.tasks || [];
        setTasks(Array.isArray(d) ? d : []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Subscribe to CommunityTasksChannel for real-time task updates
  useEffect(() => {
    mountedRef.current = true;
    load();
    const token = localStorage.getItem("token");
    if (!token) return;
    const ws = new WebSocket(`${BASE_WS}?token=${token}`);
    cableRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ command:"subscribe", identifier:JSON.stringify({ channel:"CommunityTasksChannel" }) }));
    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const p = JSON.parse(e.data);
        if (!p.message) return;
        const { type, task, task_id } = p.message;
        if (type === "task_updated" && task) {
          setTasks(prev => prev.map(t => t.id === task.id ? task : t));
          // Update chatTask if open
          setChatTask(prev => prev?.id === task.id ? task : prev);
        }
        if (type === "task_deleted") setTasks(prev => prev.filter(t => t.id !== task_id));
        if (type === "volunteer_joined" && task) setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      } catch {}
    };
    ws.onerror = () => {};
    ws.onclose = () => {};
    return () => { mountedRef.current = false; ws.close(1000, "unmounted"); };
  }, [load]);

  const isVolunteered = (task) => task.volunteers?.some(v => v.id === myId);

  const handleVolunteer = async () => {
    const task = volunteerDialog.task;
    if (!task) return;
    setSaving(true);
    try {
      await api.post(`/community_tasks/${task.id}/volunteer`, { role: selectedRole });
      setSnackbar({ open:true, message:`Joined "${task.title}" as ${selectedRole}! Open Team Chat to coordinate.`, severity:"success" });
      setVolunteerDialog({ open:false, task:null });
      // Optimistic update — real update comes via WebSocket
      setTasks(prev => prev.map(t => t.id === task.id
        ? { ...t, volunteers:[...(t.volunteers||[]).filter(v => v.id !== myId), { id:myId, name:myName, role:selectedRole }] }
        : t));
    } catch (err) {
      setSnackbar({ open:true, message:err.message || "Failed to volunteer.", severity:"error" });
    } finally { setSaving(false); }
  };

  const handleLeave = async (taskId) => {
    try {
      await api.delete(`/community_tasks/${taskId}/leave`);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, volunteers:(t.volunteers||[]).filter(v => v.id !== myId) } : t));
      setSnackbar({ open:true, message:"You've left the task.", severity:"info" });
    } catch (err) {
      setSnackbar({ open:true, message:err.message || "Failed to leave.", severity:"error" });
    }
  };

  const openTasks = tasks.filter(t => t.open !== false && t.status === "open");
  const myTasks  = tasks.filter(t => isVolunteered(t));

  const tabSx = {
    "& .MuiTab-root":{ fontSize:"0.95rem", color:colors.grey[400] },
    "& .Mui-selected":{ color:"#fff !important", backgroundColor:colors.greenAccent[700], borderRadius:"4px 4px 0 0" },
    "& .MuiTabs-indicator":{ backgroundColor:colors.greenAccent[400] },
  };

  const TaskCard = ({ task }) => {
    const joined = isVolunteered(task);
    return (
      <Card sx={{ backgroundColor:colors.primary[400], mb:2,
        border:`2px solid ${joined ? colors.greenAccent[600] : colors.grey[700]}`,
        transition:"transform 0.15s", "&:hover":{ transform:"translateY(-2px)" } }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                <Typography sx={{ fontSize:"1rem !important", fontWeight:"bold", color:colors.grey[100] }}>{task.title}</Typography>
                {joined && <Chip icon={<VolunteerActivismIcon sx={{ fontSize:12 }} />} label="Joined" size="small"
                  sx={{ backgroundColor:colors.greenAccent[800], color:colors.greenAccent[300], fontSize:"0.7rem" }} />}
              </Box>
              <Box display="flex" gap={1.5} flexWrap="wrap" mb={1}>
                <Chip label={task.priority} size="small"
                  sx={{ backgroundColor:priorityColor(task.priority)+"33", color:priorityColor(task.priority), fontSize:"0.7rem" }} />
                {task.zone && <Box display="flex" alignItems="center" gap={0.3}>
                  <LocationOnIcon sx={{ fontSize:13, color:colors.grey[500] }} />
                  <Typography sx={{ fontSize:"0.75rem !important", color:colors.grey[400] }}>{task.zone}</Typography>
                </Box>}
                {task.due && <Box display="flex" alignItems="center" gap={0.3}>
                  <CalendarTodayIcon sx={{ fontSize:13, color:colors.grey[500] }} />
                  <Typography sx={{ fontSize:"0.75rem !important", color:colors.grey[400] }}>Due: {task.due}</Typography>
                </Box>}
                <Box display="flex" alignItems="center" gap={0.3}>
                  <PeopleIcon sx={{ fontSize:13, color:colors.grey[500] }} />
                  <Typography sx={{ fontSize:"0.75rem !important", color:colors.grey[400] }}>
                    {task.volunteers?.length || 0} volunteer{task.volunteers?.length !== 1 ? "s" : ""}
                  </Typography>
                </Box>
              </Box>
              {task.description && <Typography sx={{ fontSize:"0.85rem !important", color:colors.grey[300], lineHeight:1.5, mb:1 }}>{task.description}</Typography>}
              {task.volunteers?.length > 0 && (
                <Box display="flex" gap={0.8} flexWrap="wrap" mb={1}>
                  {task.volunteers.map((v, i) => (
                    <Chip key={i} avatar={<Avatar sx={{ width:18, height:18, fontSize:"0.6rem" }}>{v.name?.charAt(0)}</Avatar>}
                      label={`${v.name} · ${v.role}`} size="small"
                      sx={{ backgroundColor:colors.primary[500], color:colors.grey[300], fontSize:"0.7rem" }} />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap">
            {!joined ? (
              <Button size="small" variant="contained" startIcon={<VolunteerActivismIcon />}
                onClick={() => { setVolunteerDialog({ open:true, task }); setSelectedRole("General Helper"); }}
                sx={{ backgroundColor:colors.greenAccent[700], fontSize:"0.8rem", "&:hover":{ backgroundColor:colors.greenAccent[600] } }}>
                Volunteer for This Task
              </Button>
            ) : (
              <Button size="small" variant="outlined" onClick={() => handleLeave(task.id)}
                sx={{ borderColor:colors.redAccent[500], color:colors.redAccent[400], fontSize:"0.8rem" }}>
                Leave Task
              </Button>
            )}
            <Button size="small" variant="outlined" startIcon={<ChatIcon />}
              onClick={() => setChatTask(task)}
              sx={{ borderColor:colors.blueAccent[600], color:colors.blueAccent[300], fontSize:"0.8rem" }}>
              Team Chat
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Community Volunteering</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Join community tasks, coordinate with volunteers, and make a difference</Typography>
        </Box>
        <IconButton onClick={load} sx={{ color:colors.blueAccent[400] }}><RefreshIcon /></IconButton>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {[
          { label:"Open Tasks", value:openTasks.length, color:colors.blueAccent[400] },
          { label:"I've Joined", value:myTasks.length, color:colors.greenAccent[400] },
          { label:"Total Volunteers", value:tasks.reduce((s,t) => s+(t.volunteers?.length||0), 0), color:"#f0c040" },
        ].map(k => (
          <Card key={k.label} sx={{ flex:"1 1 120px", minWidth:100, backgroundColor:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p:"12px 16px !important" }}>
              <Typography sx={{ fontSize:"1.6rem", fontWeight:"bold", color:k.color }}>{k.value}</Typography>
              <Typography sx={{ fontSize:"0.75rem", color:"#858585" }}>{k.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {error && <Alert severity="error" sx={{ mb:2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ borderBottom:`2px solid ${colors.grey[700]}`, mb:2 }}>
        <Box display="flex">
          {[{ label:"Open Tasks", icon:<AssignmentIcon sx={{ fontSize:18 }} /> }, { label:`My Tasks (${myTasks.length})`, icon:<VolunteerActivismIcon sx={{ fontSize:18 }} /> }].map((t, i) => (
            <Button key={i} onClick={() => setTab(i)} startIcon={t.icon}
              sx={{ fontSize:"0.95rem", textTransform:"none", px:2, py:1.2, borderRadius:"4px 4px 0 0",
                color:tab===i ? "#fff" : colors.grey[400],
                backgroundColor:tab===i ? colors.greenAccent[700] : "transparent",
                borderBottom:tab===i ? `3px solid ${colors.greenAccent[400]}` : "none",
                "&:hover":{ backgroundColor:tab===i ? colors.greenAccent[700] : colors.primary[300]+"33" } }}>
              {t.label}
            </Button>
          ))}
        </Box>
      </Box>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color:colors.blueAccent[500] }} /></Box> : (
        <>
          {tab === 0 && (openTasks.length === 0
            ? <Alert severity="info">No open tasks at the moment. Check back soon!</Alert>
            : openTasks.map(t => <TaskCard key={t.id} task={t} />))}
          {tab === 1 && (myTasks.length === 0
            ? <Alert severity="info">You haven't joined any tasks yet. Browse Open Tasks and volunteer!</Alert>
            : myTasks.map(t => <TaskCard key={t.id} task={t} />))}
        </>
      )}

      {/* Volunteer Dialog */}
      <Dialog open={volunteerDialog.open} onClose={() => setVolunteerDialog({ open:false, task:null })}
        maxWidth="sm" fullWidth PaperProps={{ sx:{ backgroundColor:colors.primary[400] } }}>
        <DialogTitle sx={{ color:colors.grey[100], fontSize:"1.2rem !important" }}>Volunteer for Task</DialogTitle>
        <DialogContent sx={{ pt:2 }}>
          <Box p={2} sx={{ backgroundColor:colors.primary[500], borderRadius:1, mb:2 }}>
            <Typography sx={{ fontSize:"1rem !important", fontWeight:"bold", color:colors.grey[100] }}>{volunteerDialog.task?.title}</Typography>
            <Typography sx={{ fontSize:"0.85rem !important", color:colors.grey[400], mt:0.5 }}>{volunteerDialog.task?.description}</Typography>
            <Box display="flex" gap={1} mt={1} flexWrap="wrap">
              {volunteerDialog.task?.zone && <Chip icon={<LocationOnIcon sx={{ fontSize:12 }} />} label={volunteerDialog.task.zone} size="small" sx={{ backgroundColor:colors.primary[400], color:colors.grey[300], fontSize:"0.7rem" }} />}
              {volunteerDialog.task?.due && <Chip icon={<CalendarTodayIcon sx={{ fontSize:12 }} />} label={`Due: ${volunteerDialog.task.due}`} size="small" sx={{ backgroundColor:colors.primary[400], color:colors.grey[300], fontSize:"0.7rem" }} />}
            </Box>
          </Box>
          <TextField fullWidth select label="Select Your Role" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
            sx={{ "& .MuiInputBase-input":{ color:colors.grey[100] }, "& .MuiInputLabel-root":{ color:colors.grey[300] }, "& .MuiOutlinedInput-notchedOutline":{ borderColor:colors.grey[500] } }}>
            {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <Box mt={2} p={1.5} sx={{ backgroundColor:colors.greenAccent[800]+"33", borderRadius:1, border:`1px solid ${colors.greenAccent[700]}` }}>
            <Typography sx={{ fontSize:"0.85rem !important", color:colors.greenAccent[300] }}>
              ✅ You'll be added to the volunteer list and can chat with the team immediately after joining.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVolunteerDialog({ open:false, task:null })} sx={{ color:colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" startIcon={<VolunteerActivismIcon />} disabled={saving} onClick={handleVolunteer}
            sx={{ backgroundColor:colors.greenAccent[700], "&:hover":{ backgroundColor:colors.greenAccent[600] } }}>
            {saving ? "Joining…" : "Join Task"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={!!chatTask} onClose={() => setChatTask(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx:{ backgroundColor:colors.primary[400] } }}>
        <DialogContent sx={{ p:2.5, height:520, display:"flex", flexDirection:"column" }}>
          {chatTask && <TaskChat task={chatTask} myId={myId} myName={myName} colors={colors} onClose={() => setChatTask(null)} />}
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open:false }))}
        anchorOrigin={{ vertical:"bottom", horizontal:"center" }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({ ...s, open:false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CommunityVolunteers;
