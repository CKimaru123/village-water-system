import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,
  Chip, Button, IconButton, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Tabs, Tab, Divider, Avatar, LinearProgress,
  InputAdornment, Snackbar, Tooltip, Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { ResponsiveBar } from "@nivo/bar";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChatIcon from "@mui/icons-material/Chat";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import adminApi from "../../../utils/api";

const BASE_WS = "ws://localhost:3001/cable";
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 2000;

const ROLES = ["Water Monitor","Community Liaison","Meter Reader","Event Coordinator","Leak Reporter","Sanitation Inspector","Other"];
const STATUSES = ["active","inactive","pending"];
const ZONES = ["Zone A","Zone B","Zone C","Zone D","Zone E","Kijiji A","Kijiji B","Kijiji C","Kijiji D","Kijiji E"];

const MOCK_VOLUNTEERS = [
  { id:1, name:"Mary Wanjiku", phone:"+254712001001", email:"mary@example.com", role:"Water Monitor", zone:"Zone A", status:"active", tasks_completed:12, notes:"Monitors daily water pressure and reports anomalies." },
  { id:2, name:"John Kamau", phone:"+254712001002", email:"john@example.com", role:"Meter Reader", zone:"Zone B", status:"active", tasks_completed:28, notes:"Monthly meter reading rounds for Zone B." },
  { id:3, name:"Fatuma Ali", phone:"+254712001003", email:"fatuma@example.com", role:"Community Liaison", zone:"Zone C", status:"active", tasks_completed:9, notes:"Coordinates community meetings and feedback collection." },
  { id:4, name:"Peter Njoroge", phone:"+254712001004", email:"peter@example.com", role:"Leak Reporter", zone:"Zone A", status:"active", tasks_completed:6, notes:"Reports pipe leaks and infrastructure damage." },
  { id:5, name:"Grace Odhiambo", phone:"+254712001005", email:"grace@example.com", role:"Event Coordinator", zone:"Zone D", status:"pending", tasks_completed:0, notes:"New volunteer — pending orientation." },
  { id:6, name:"Samuel Mwenda", phone:"+254712001006", email:"samuel@example.com", role:"Sanitation Inspector", zone:"Zone E", status:"inactive", tasks_completed:15, notes:"On leave until further notice." },
];

const MOCK_TASKS = [
  { id:1, volunteer_id:1, title:"Monthly pressure check — Zone A", due:"2025-06-01", status:"pending", priority:"high" },
  { id:2, volunteer_id:2, title:"Meter reading round — Zone B", due:"2025-05-30", status:"completed", priority:"normal" },
  { id:3, volunteer_id:3, title:"Community meeting facilitation", due:"2025-06-05", status:"pending", priority:"normal" },
  { id:4, volunteer_id:4, title:"Inspect reported leak at Plot 22", due:"2025-05-28", status:"in_progress", priority:"high" },
  { id:5, volunteer_id:1, title:"Water quality observation report", due:"2025-06-10", status:"pending", priority:"low" },
];

const empty = { name:"", phone:"", email:"", role:"Water Monitor", zone:"Zone A", status:"active", notes:"" };
const statusColor = (s, colors) => ({ active:colors.greenAccent[500], pending:"#f0c040", inactive:colors.grey[500] }[s] || colors.grey[400]);
const taskStatusColor = (s, colors) => ({ completed:colors.greenAccent[500], in_progress:colors.blueAccent[400], pending:"#f0c040" }[s] || colors.grey[400]);
const priorityColor = (p) => ({ high:"#e2726e", normal:"#4cceac", low:"#868dfb" }[p] || "#666");

const KpiCard = ({ label, value, color }) => (
  <Card sx={{ flex:"1 1 130px", minWidth:110, backgroundColor:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
    <CardContent sx={{ p:"12px 16px !important" }}>
      <Typography sx={{ fontSize:"1.6rem", fontWeight:"bold", color }}>{value}</Typography>
      <Typography sx={{ fontSize:"0.75rem", color:"#858585" }}>{label}</Typography>
    </CardContent>
  </Card>
);

// ── Task Chat Panel — DB-backed WebSocket (same as client) ────────────────────
const TaskChatPanel = ({ task, adminId, adminName, colors, onClose }) => {
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
        retryRef.current += 1; setWsStatus("reconnecting");
        timerRef.current = setTimeout(connect, RETRY_BASE_MS * retryRef.current);
      } else { setWsStatus("failed"); setChatError("Real-time unavailable — messages still send via HTTP."); }
    };
  }, [sessionId]);

  useEffect(() => {
    mountedRef.current = true;
    adminApi.get(`/chat_messages?session_id=${sessionId}`)
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
      const res = await adminApi.post("/chat_messages", { session_id:sessionId, message:msg });
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
        {onClose && <IconButton size="small" onClick={onClose} sx={{ color:colors.grey[500] }}><CloseIcon /></IconButton>}
      </Box>
      <Divider sx={{ borderColor:colors.grey[700], mb:1.5 }} />
      {task.volunteers?.length > 0 && (
        <Box mb={1.5} p={1.5} sx={{ backgroundColor:colors.primary[500], borderRadius:1 }}>
          <Typography sx={{ fontSize:"0.72rem !important", color:colors.grey[400], mb:0.5, fontWeight:"bold", textTransform:"uppercase" }}>Volunteers</Typography>
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
            <Typography sx={{ fontSize:"0.85rem !important", color:colors.grey[500] }}>No messages yet. Start coordinating!</Typography>
          </Box>
        ) : messages.map((m, i) => {
          const isMe = m.sender_id === adminId || m.user_id === adminId;
          const isAdmin = m.sender_role === "admin";
          return (
            <Box key={m.id || i} display="flex" justifyContent={isMe ? "flex-end" : "flex-start"} mb={1.5}>
              <Box display="flex" flexDirection={isMe ? "row-reverse" : "row"} alignItems="flex-end" gap={1} maxWidth="82%">
                <Avatar sx={{ width:26, height:26, fontSize:"0.7rem", flexShrink:0,
                  backgroundColor:isMe ? colors.blueAccent[700] : isAdmin ? colors.redAccent[700] : colors.greenAccent[700] }}>
                  {(m.sender_name || "?").charAt(0)}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize:"0.7rem !important", color:colors.grey[500], mb:0.2, textAlign:isMe ? "right" : "left" }}>
                    {isMe ? "You" : m.sender_name}
                    {!isMe && isAdmin && <Chip label="Admin" size="small" sx={{ ml:0.5, height:14, fontSize:"0.6rem", backgroundColor:colors.redAccent[800], color:colors.redAccent[200] }} />}
                    {" · "}{fmt(m.created_at)}
                  </Typography>
                  <Paper sx={{ p:1.5, backgroundColor:isMe ? colors.blueAccent[700] : colors.primary[500], borderRadius:isMe ? "12px 4px 12px 12px" : "4px 12px 12px 12px" }}>
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
        <TextField fullWidth multiline maxRows={3} size="small" placeholder="Coordinate with volunteers… (Enter to send)"
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

const CommunityVolunteerManagement = () => {
  const colors = tokens(useTheme().palette.mode);
  const [volunteers, setVolunteers] = useState([]);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [communityTasks, setCommunityTasks] = useState([]);
  const [chatDialog, setChatDialog] = useState({ open:false, task:null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [dialog, setDialog] = useState({ open:false, mode:"create", data:empty });
  const [taskDialog, setTaskDialog] = useState({ open:false, volunteerId:null });
  const [taskForm, setTaskForm] = useState({ title:"", due:"", priority:"normal" });
  const [newTaskDialog, setNewTaskDialog] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({ title:"", description:"", zone:"Zone A", due_date:"", priority:"normal" });
  const [snackbar, setSnackbar] = useState({ open:false, message:"", severity:"success" });
  const [saving, setSaving] = useState(false);
  const cableRef = useRef(null);
  const mountedRef = useRef(true);

  const adminUser = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const adminName = adminUser?.display_name || adminUser?.full_name || `${adminUser?.first_name || ""} ${adminUser?.last_name || ""}`.trim() || "Admin";
  const adminId   = adminUser?.id || "admin";

  const fieldSx = {
    "& .MuiInputBase-input":{ color:colors.grey[100] },
    "& .MuiInputLabel-root":{ color:colors.grey[300] },
    "& .MuiOutlinedInput-notchedOutline":{ borderColor:colors.grey[500] },
  };

  const loadVolunteers = useCallback(() => {
    setLoading(true);
    adminApi.get("/admin/volunteers")
      .then(res => {
        const d = res.data?.volunteers || res.data?.data?.volunteers || res.data;
        setVolunteers(Array.isArray(d) && d.length > 0 ? d : MOCK_VOLUNTEERS);
      })
      .catch(() => setVolunteers(MOCK_VOLUNTEERS))
      .finally(() => setLoading(false));
  }, []);

  const loadCommunityTasks = useCallback(() => {
    adminApi.get("/community_tasks")
      .then(res => {
        const d = res.data?.data?.tasks || res.data?.tasks || [];
        setCommunityTasks(Array.isArray(d) ? d : []);
      })
      .catch(() => {});
  }, []);

  // Subscribe to CommunityTasksChannel for real-time updates
  useEffect(() => {
    mountedRef.current = true;
    loadVolunteers();
    loadCommunityTasks();
    const token = localStorage.getItem("token");
    if (token) {
      const ws = new WebSocket(`${BASE_WS}?token=${token}`);
      cableRef.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({ command:"subscribe", identifier:JSON.stringify({ channel:"CommunityTasksChannel" }) }));
      ws.onmessage = (e) => {
        if (!mountedRef.current) return;
        try {
          const p = JSON.parse(e.data);
          if (!p.message) return;
          const { type, task, task_id, volunteer, task_title } = p.message;
          if (type === "task_updated" && task) setCommunityTasks(prev => prev.map(t => t.id === task.id ? task : t));
          if (type === "task_deleted") setCommunityTasks(prev => prev.filter(t => t.id !== task_id));
          if (type === "volunteer_joined" && task) {
            setCommunityTasks(prev => prev.map(t => t.id === task.id ? task : t));
            setSnackbar({ open:true, message:`${volunteer?.name} volunteered for "${task_title}"`, severity:"info" });
          }
        } catch {}
      };
      ws.onerror = () => {};
      ws.onclose = () => {};
    }
    return () => { mountedRef.current = false; cableRef.current?.close(1000, "unmounted"); };
  }, [loadVolunteers, loadCommunityTasks]);

  const openCreate = () => setDialog({ open:true, mode:"create", data:empty });
  const openEdit   = (v) => setDialog({ open:true, mode:"edit", data:{ ...v } });

  const handleSave = async () => {
    if (!dialog.data.name.trim()) { setSnackbar({ open:true, message:"Name is required.", severity:"error" }); return; }
    setSaving(true);
    try {
      if (dialog.mode === "create") {
        await adminApi.post("/admin/volunteers", { volunteer:dialog.data });
        setVolunteers(prev => [...prev, { ...dialog.data, id:Date.now(), tasks_completed:0 }]);
        setSnackbar({ open:true, message:"Volunteer added.", severity:"success" });
      } else {
        await adminApi.patch(`/admin/volunteers/${dialog.data.id}`, { volunteer:dialog.data });
        setVolunteers(prev => prev.map(v => v.id === dialog.data.id ? { ...v, ...dialog.data } : v));
        setSnackbar({ open:true, message:"Volunteer updated.", severity:"success" });
      }
      setDialog({ open:false, mode:"create", data:empty });
    } catch {
      if (dialog.mode === "create") setVolunteers(prev => [...prev, { ...dialog.data, id:Date.now(), tasks_completed:0 }]);
      else setVolunteers(prev => prev.map(v => v.id === dialog.data.id ? { ...v, ...dialog.data } : v));
      setDialog({ open:false, mode:"create", data:empty });
      setSnackbar({ open:true, message:"Saved (offline).", severity:"info" });
    } finally { setSaving(false); }
  };

  const handleAddTask = () => {
    if (!taskForm.title.trim()) return;
    setTasks(prev => [...prev, { id:Date.now(), volunteer_id:taskDialog.volunteerId, ...taskForm, status:"pending" }]);
    setTaskDialog({ open:false, volunteerId:null });
    setTaskForm({ title:"", due:"", priority:"normal" });
    setSnackbar({ open:true, message:"Task assigned.", severity:"success" });
  };

  const handleCreateCommunityTask = async () => {
    if (!newTaskForm.title.trim()) return;
    setSaving(true);
    try {
      await adminApi.post("/community_tasks", { community_task:newTaskForm });
      loadCommunityTasks();
      setSnackbar({ open:true, message:"Community task created.", severity:"success" });
    } catch {
      setSnackbar({ open:true, message:"Failed to create task.", severity:"error" });
    } finally { setSaving(false); setNewTaskDialog(false); setNewTaskForm({ title:"", description:"", zone:"Zone A", due_date:"", priority:"normal" }); }
  };

  const handleAdminJoinTask = async (taskId) => {
    try {
      await adminApi.post(`/community_tasks/${taskId}/volunteer`, { role:"Admin Supervisor" });
      loadCommunityTasks();
      setSnackbar({ open:true, message:"Joined task as Admin Supervisor.", severity:"success" });
    } catch (err) { setSnackbar({ open:true, message:err.message || "Failed to join.", severity:"error" }); }
  };

  const handleAdminLeaveTask = async (taskId) => {
    try {
      await adminApi.delete(`/community_tasks/${taskId}/leave`);
      loadCommunityTasks();
    } catch (err) { setSnackbar({ open:true, message:err.message || "Failed to leave.", severity:"error" }); }
  };

  const completeTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status:"completed" } : t));
    setVolunteers(prev => prev.map(v => {
      const task = tasks.find(t => t.id === id);
      return task && v.id === task.volunteer_id ? { ...v, tasks_completed:(v.tasks_completed||0)+1 } : v;
    }));
  };

  const filtered = volunteers.filter(v => {
    const matchSearch = !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.role?.toLowerCase().includes(search.toLowerCase());
    const matchZone = zoneFilter === "all" || v.zone === zoneFilter;
    return matchSearch && matchZone;
  });

  const kpis = [
    { label:"Total Volunteers", value:volunteers.length, color:colors.blueAccent[400] },
    { label:"Active", value:volunteers.filter(v => v.status === "active").length, color:colors.greenAccent[400] },
    { label:"Pending", value:volunteers.filter(v => v.status === "pending").length, color:"#f0c040" },
    { label:"Tasks Completed", value:volunteers.reduce((s,v) => s+(v.tasks_completed||0), 0), color:colors.blueAccent[300] },
    { label:"Open Tasks", value:tasks.filter(t => t.status !== "completed").length, color:"#f0c040" },
    { label:"Community Tasks", value:communityTasks.length, color:colors.greenAccent[300] },
  ];

  const zoneData = ZONES.map(z => ({ zone:z, count:volunteers.filter(v => v.zone === z).length })).filter(x => x.count > 0);
  const roleData = ROLES.map(r => ({ role:r.split(" ")[0], count:volunteers.filter(v => v.role === r).length })).filter(x => x.count > 0);

  const tabSx = {
    "& .MuiTab-root":{ fontSize:"0.95rem", color:colors.grey[400] },
    "& .Mui-selected":{ color:"#fff !important", backgroundColor:colors.blueAccent[700], borderRadius:"4px 4px 0 0" },
    "& .MuiTabs-indicator":{ backgroundColor:colors.blueAccent[400] },
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Community Volunteers</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Manage volunteer roles, zones, and task assignments</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={() => { loadVolunteers(); loadCommunityTasks(); }} sx={{ color:colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ backgroundColor:colors.greenAccent[600] }}>Add Volunteer</Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </Box>

      {error && <Alert severity="warning" sx={{ mb:2 }}>API unavailable — showing sample data</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...tabSx, mb:2 }}>
        <Tab label="Volunteer Directory" icon={<PeopleIcon />} iconPosition="start" />
        <Tab label="Task Assignments" icon={<AssignmentIcon />} iconPosition="start" />
        <Tab label="Community Tasks" icon={<VolunteerActivismIcon />} iconPosition="start" />
        <Tab label="Zone Analytics" icon={<LocationOnIcon />} iconPosition="start" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color:colors.blueAccent[500] }} /></Box> : (
        <>
          {/* TAB 0: Volunteer Directory */}
          {tab === 0 && (
            <Box>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
                <TextField size="small" placeholder="Search volunteers…" value={search} onChange={e => setSearch(e.target.value)} sx={{ width:260, ...fieldSx }}
                  InputProps={{ startAdornment:<InputAdornment position="start"><SearchIcon sx={{ color:colors.grey[400] }} /></InputAdornment> }} />
                <TextField size="small" select label="Zone" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} sx={{ width:140, ...fieldSx }}>
                  <MenuItem value="all">All Zones</MenuItem>
                  {ZONES.map(z => <MenuItem key={z} value={z}>{z}</MenuItem>)}
                </TextField>
              </Box>
              <Grid container spacing={2}>
                {filtered.map(v => {
                  const vTasks = tasks.filter(t => t.volunteer_id === v.id);
                  const completed = vTasks.filter(t => t.status === "completed").length;
                  const progress = vTasks.length > 0 ? Math.round((completed / vTasks.length) * 100) : 0;
                  return (
                    <Grid item xs={12} sm={6} md={4} key={v.id}>
                      <Card sx={{ backgroundColor:colors.primary[400], border:`1px solid ${statusColor(v.status, colors)}33`, transition:"transform 0.15s", "&:hover":{ transform:"translateY(-2px)" } }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar sx={{ backgroundColor:colors.blueAccent[700], width:40, height:40, fontSize:"1rem" }}>{v.name?.charAt(0)}</Avatar>
                              <Box>
                                <Typography sx={{ fontSize:"0.9rem", fontWeight:"bold", color:colors.grey[100] }}>{v.name}</Typography>
                                <Typography sx={{ fontSize:"0.75rem", color:colors.grey[400] }}>{v.role}</Typography>
                              </Box>
                            </Box>
                            <Chip label={v.status} size="small" sx={{ backgroundColor:statusColor(v.status, colors), color:"#fff", fontSize:"0.7rem" }} />
                          </Box>
                          <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
                            <Chip icon={<LocationOnIcon sx={{ fontSize:12 }} />} label={v.zone} size="small" sx={{ backgroundColor:colors.primary[500], color:colors.grey[300], fontSize:"0.7rem" }} />
                            <Chip label={`${v.tasks_completed||0} tasks done`} size="small" sx={{ backgroundColor:colors.greenAccent[800], color:colors.greenAccent[300], fontSize:"0.7rem" }} />
                          </Box>
                          {vTasks.length > 0 && (
                            <Box mb={1.5}>
                              <Box display="flex" justifyContent="space-between" mb={0.3}>
                                <Typography sx={{ fontSize:"0.7rem", color:colors.grey[500] }}>Task progress</Typography>
                                <Typography sx={{ fontSize:"0.7rem", color:colors.grey[400] }}>{completed}/{vTasks.length}</Typography>
                              </Box>
                              <LinearProgress variant="determinate" value={progress} sx={{ height:5, borderRadius:3, backgroundColor:colors.grey[700], "& .MuiLinearProgress-bar":{ backgroundColor:colors.greenAccent[500] } }} />
                            </Box>
                          )}
                          {v.phone && <Typography sx={{ fontSize:"0.75rem", color:colors.grey[500] }}>📞 {v.phone}</Typography>}
                          {v.notes && <Typography sx={{ fontSize:"0.72rem", color:colors.grey[600], mt:0.5 }} noWrap>{v.notes}</Typography>}
                          <Box display="flex" gap={1} mt={1.5}>
                            <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEdit(v)} sx={{ borderColor:colors.blueAccent[600], color:colors.blueAccent[400], fontSize:"0.75rem" }}>Edit</Button>
                            <Button size="small" variant="outlined" startIcon={<AssignmentIcon />}
                              onClick={() => { setTaskDialog({ open:true, volunteerId:v.id }); setTaskForm({ title:"", due:"", priority:"normal" }); }}
                              sx={{ borderColor:colors.greenAccent[600], color:colors.greenAccent[400], fontSize:"0.75rem" }}>Assign Task</Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Client volunteers from community tasks */}
              {communityTasks.some(t => t.volunteers?.length > 0) && (
                <Box mt={3}>
                  <Divider sx={{ borderColor:colors.grey[700], mb:2 }} />
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <VolunteerActivismIcon sx={{ color:colors.greenAccent[400] }} />
                    <Typography variant="h5" color={colors.grey[100]}>Client Volunteers (from Community Tasks)</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {communityTasks.flatMap(t => (t.volunteers||[]).map(v => ({ ...v, taskTitle:t.title, taskZone:t.zone, taskId:t.id }))).map((v, i) => (
                      <Grid item xs={12} sm={6} md={4} key={`${v.id}-${i}`}>
                        <Card sx={{ backgroundColor:colors.primary[400], border:`1px solid ${colors.greenAccent[600]}33`, transition:"transform 0.15s", "&:hover":{ transform:"translateY(-2px)" } }}>
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                              <Box display="flex" alignItems="center" gap={1.5}>
                                <Avatar sx={{ backgroundColor:colors.greenAccent[700], width:36, height:36, fontSize:"0.9rem" }}>{v.name?.charAt(0)}</Avatar>
                                <Box>
                                  <Typography sx={{ fontSize:"0.9rem", fontWeight:"bold", color:colors.grey[100] }}>{v.name}</Typography>
                                  <Typography sx={{ fontSize:"0.75rem", color:colors.grey[400] }}>{v.role}</Typography>
                                </Box>
                              </Box>
                              <Chip label="Client" size="small" sx={{ backgroundColor:colors.greenAccent[800], color:colors.greenAccent[300], fontSize:"0.65rem" }} />
                            </Box>
                            <Box p={1} sx={{ backgroundColor:colors.primary[500], borderRadius:1 }}>
                              <Typography sx={{ fontSize:"0.75rem", color:colors.grey[400] }}>Task:</Typography>
                              <Typography sx={{ fontSize:"0.8rem", color:colors.grey[200] }} noWrap>{v.taskTitle}</Typography>
                              {v.taskZone && <Typography sx={{ fontSize:"0.72rem", color:colors.grey[500] }}>📍 {v.taskZone}</Typography>}
                            </Box>
                            <Button size="small" variant="outlined" startIcon={<ChatIcon />}
                              onClick={() => setChatDialog({ open:true, task:communityTasks.find(t => t.id === v.taskId) })}
                              sx={{ mt:1.5, borderColor:colors.blueAccent[600], color:colors.blueAccent[300], fontSize:"0.75rem" }}>
                              Open Task Chat
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          )}

          {/* TAB 1: Task Assignments */}
          {tab === 1 && (
            <Box>
              <Typography variant="h5" color={colors.grey[100]} mb={2}>All Task Assignments</Typography>
              {tasks.map(t => {
                const vol = volunteers.find(v => v.id === t.volunteer_id);
                return (
                  <Card key={t.id} sx={{ mb:1.5, backgroundColor:colors.primary[400], borderLeft:`4px solid ${taskStatusColor(t.status, colors)}` }}>
                    <CardContent sx={{ p:"12px 16px !important" }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                        <Box>
                          <Typography sx={{ fontSize:"0.9rem", fontWeight:"bold", color:colors.grey[100] }}>{t.title}</Typography>
                          <Box display="flex" gap={1} mt={0.3} flexWrap="wrap">
                            <Typography sx={{ fontSize:"0.75rem", color:colors.grey[400] }}>👤 {vol?.name || `Volunteer #${t.volunteer_id}`}</Typography>
                            {t.due && <Typography sx={{ fontSize:"0.75rem", color:colors.grey[500] }}>📅 Due: {t.due}</Typography>}
                            <Chip label={t.priority} size="small" sx={{ backgroundColor:priorityColor(t.priority)+"33", color:priorityColor(t.priority), fontSize:"0.65rem", height:18 }} />
                          </Box>
                        </Box>
                        <Box display="flex" gap={1} alignItems="center">
                          <Chip label={t.status?.replace(/_/g," ").toUpperCase()} size="small" sx={{ backgroundColor:taskStatusColor(t.status, colors)+"33", color:taskStatusColor(t.status, colors), fontSize:"0.7rem" }} />
                          {t.status !== "completed" && (
                            <Button size="small" variant="outlined" startIcon={<CheckCircleIcon />} onClick={() => completeTask(t.id)}
                              sx={{ borderColor:colors.greenAccent[500], color:colors.greenAccent[400], fontSize:"0.75rem" }}>Complete</Button>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {/* TAB 2: Community Tasks (DB-backed) */}
          {tab === 2 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <VolunteerActivismIcon sx={{ color:colors.greenAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]}>Community Task Sign-ups</Typography>
                  <Chip label={`${communityTasks.length} tasks`} size="small" sx={{ backgroundColor:colors.greenAccent[800], color:colors.greenAccent[300] }} />
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNewTaskDialog(true)}
                  sx={{ backgroundColor:colors.greenAccent[700] }}>New Task</Button>
              </Box>
              <Typography sx={{ fontSize:"0.85rem", color:colors.grey[400], mb:2 }}>
                Tasks are visible to clients in the Community Volunteers page. Client sign-ups appear in real time via WebSocket.
              </Typography>
              {communityTasks.length === 0 ? (
                <Alert severity="info">No community tasks yet. Create one to get started.</Alert>
              ) : communityTasks.map(t => (
                <Card key={t.id} sx={{ mb:2, backgroundColor:colors.primary[400], borderLeft:`4px solid ${t.volunteers?.length > 0 ? colors.greenAccent[500] : colors.grey[600]}` }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                      <Box flex={1}>
                        <Typography sx={{ fontSize:"0.95rem", fontWeight:"bold", color:colors.grey[100] }}>{t.title}</Typography>
                        <Box display="flex" gap={1.5} mt={0.5} flexWrap="wrap">
                          {t.zone && <Typography sx={{ fontSize:"0.75rem", color:colors.grey[400] }}>📍 {t.zone}</Typography>}
                          {t.due && <Typography sx={{ fontSize:"0.75rem", color:colors.grey[500] }}>📅 Due: {t.due}</Typography>}
                          <Chip label={t.priority} size="small" sx={{ backgroundColor:priorityColor(t.priority)+"33", color:priorityColor(t.priority), fontSize:"0.65rem", height:18 }} />
                        </Box>
                        {t.volunteers?.length > 0 ? (
                          <Box mt={1}>
                            <Typography sx={{ fontSize:"0.75rem", color:colors.greenAccent[400], fontWeight:"bold", mb:0.5 }}>
                              {t.volunteers.length} volunteer{t.volunteers.length !== 1 ? "s" : ""} signed up:
                            </Typography>
                            <Box display="flex" gap={0.8} flexWrap="wrap">
                              {t.volunteers.map((v, i) => (
                                <Chip key={i} avatar={<Avatar sx={{ width:18, height:18, fontSize:"0.6rem" }}>{v.name?.charAt(0)}</Avatar>}
                                  label={`${v.name} · ${v.role}`} size="small"
                                  sx={{ backgroundColor:colors.greenAccent[800], color:colors.greenAccent[200], fontSize:"0.7rem" }} />
                              ))}
                            </Box>
                          </Box>
                        ) : <Typography sx={{ fontSize:"0.75rem", color:colors.grey[600], mt:0.5 }}>No client volunteers yet.</Typography>}
                      </Box>
                      <Box display="flex" gap={1} flexWrap="wrap" alignItems="flex-start">
                        {!t.volunteers?.some(v => v.id === adminId) ? (
                          <Button size="small" variant="contained" startIcon={<VolunteerActivismIcon />}
                            onClick={() => handleAdminJoinTask(t.id)}
                            sx={{ backgroundColor:colors.greenAccent[700], fontSize:"0.75rem" }}>Join Task</Button>
                        ) : (
                          <Button size="small" variant="outlined" onClick={() => handleAdminLeaveTask(t.id)}
                            sx={{ borderColor:colors.redAccent[500], color:colors.redAccent[400], fontSize:"0.75rem" }}>Leave Task</Button>
                        )}
                        <Button size="small" variant="outlined" startIcon={<ChatIcon />}
                          onClick={() => setChatDialog({ open:true, task:t })}
                          sx={{ borderColor:colors.blueAccent[600], color:colors.blueAccent[300], fontSize:"0.75rem" }}>Team Chat</Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* TAB 3: Zone Analytics */}
          {tab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor:colors.primary[400], p:2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Volunteers by Zone</Typography>
                  <Box height={280}>
                    <ResponsiveBar data={zoneData} keys={["count"]} indexBy="zone" margin={{ top:10, right:20, bottom:60, left:50 }}
                      padding={0.3} colors={[colors.blueAccent[500]]} axisBottom={{ tickRotation:-30, tickSize:5 }}
                      axisLeft={{ tickSize:5, legend:"Volunteers", legendOffset:-40, legendPosition:"middle" }}
                      labelSkipWidth={12} labelTextColor="#fff"
                      theme={{ axis:{ ticks:{ text:{ fill:colors.grey[300] } } }, grid:{ line:{ stroke:colors.grey[700] } } }} />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor:colors.primary[400], p:2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Volunteers by Role</Typography>
                  <Box height={280}>
                    <ResponsiveBar data={roleData} keys={["count"]} indexBy="role" margin={{ top:10, right:20, bottom:60, left:50 }}
                      padding={0.3} colors={[colors.greenAccent[500]]} axisBottom={{ tickRotation:-30, tickSize:5 }}
                      axisLeft={{ tickSize:5, legend:"Count", legendOffset:-40, legendPosition:"middle" }}
                      labelSkipWidth={12} labelTextColor="#fff"
                      theme={{ axis:{ ticks:{ text:{ fill:colors.grey[300] } } }, grid:{ line:{ stroke:colors.grey[700] } } }} />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ backgroundColor:colors.primary[400], p:2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Zone Coverage Summary</Typography>
                  <Grid container spacing={1}>
                    {ZONES.map(z => {
                      const count = volunteers.filter(v => v.zone === z).length;
                      const active = volunteers.filter(v => v.zone === z && v.status === "active").length;
                      return (
                        <Grid item xs={6} sm={4} md={2} key={z}>
                          <Box p={1.5} sx={{ backgroundColor:colors.primary[500], borderRadius:1, textAlign:"center", border:`1px solid ${count > 0 ? colors.greenAccent[700] : colors.grey[700]}` }}>
                            <Typography sx={{ fontSize:"1.2rem", fontWeight:"bold", color:count > 0 ? colors.greenAccent[400] : colors.grey[600] }}>{count}</Typography>
                            <Typography sx={{ fontSize:"0.7rem", color:colors.grey[400] }}>{z}</Typography>
                            <Typography sx={{ fontSize:"0.65rem", color:colors.grey[600] }}>{active} active</Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {/* Create/Edit Volunteer Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open:false })} maxWidth="sm" fullWidth PaperProps={{ sx:{ backgroundColor:colors.primary[400] } }}>
        <DialogTitle sx={{ color:colors.grey[100], fontSize:"1.2rem !important" }}>{dialog.mode === "create" ? "Add Volunteer" : "Edit Volunteer"}</DialogTitle>
        <DialogContent sx={{ pt:2 }}>
          <Grid container spacing={2} sx={{ mt:0.5 }}>
            {[["Full Name *","name",6],["Phone","phone",6],["Email","email",6]].map(([label,key,xs]) => (
              <Grid item xs={xs} key={key}>
                <TextField fullWidth size="small" label={label} value={dialog.data[key]||""} onChange={e => setDialog({ ...dialog, data:{ ...dialog.data, [key]:e.target.value } })} sx={fieldSx} />
              </Grid>
            ))}
            <Grid item xs={6}><TextField fullWidth size="small" select label="Role" value={dialog.data.role||"Water Monitor"} onChange={e => setDialog({ ...dialog, data:{ ...dialog.data, role:e.target.value } })} sx={fieldSx}>{ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</TextField></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" select label="Zone" value={dialog.data.zone||"Zone A"} onChange={e => setDialog({ ...dialog, data:{ ...dialog.data, zone:e.target.value } })} sx={fieldSx}>{ZONES.map(z => <MenuItem key={z} value={z}>{z}</MenuItem>)}</TextField></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" select label="Status" value={dialog.data.status||"active"} onChange={e => setDialog({ ...dialog, data:{ ...dialog.data, status:e.target.value } })} sx={fieldSx}>{STATUSES.map(s => <MenuItem key={s} value={s} sx={{ textTransform:"capitalize" }}>{s}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" multiline rows={2} label="Notes" value={dialog.data.notes||""} onChange={e => setDialog({ ...dialog, data:{ ...dialog.data, notes:e.target.value } })} sx={fieldSx} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ ...dialog, open:false })} sx={{ color:colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleSave} sx={{ backgroundColor:colors.greenAccent[600] }}>{saving ? "Saving…" : dialog.mode === "create" ? "Add" : "Update"}</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Task Dialog */}
      <Dialog open={taskDialog.open} onClose={() => setTaskDialog({ open:false, volunteerId:null })} maxWidth="sm" fullWidth PaperProps={{ sx:{ backgroundColor:colors.primary[400] } }}>
        <DialogTitle sx={{ color:colors.grey[100], fontSize:"1.2rem !important" }}>Assign Task — {volunteers.find(v => v.id === taskDialog.volunteerId)?.name}</DialogTitle>
        <DialogContent sx={{ pt:2 }}>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField fullWidth size="small" label="Task Title *" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title:e.target.value }))} sx={fieldSx} />
            <TextField fullWidth size="small" label="Due Date" type="date" value={taskForm.due} onChange={e => setTaskForm(f => ({ ...f, due:e.target.value }))} InputLabelProps={{ shrink:true }} sx={fieldSx} />
            <TextField fullWidth size="small" select label="Priority" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority:e.target.value }))} sx={fieldSx}>
              {["low","normal","high"].map(p => <MenuItem key={p} value={p} sx={{ textTransform:"capitalize" }}>{p}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialog({ open:false, volunteerId:null })} sx={{ color:colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!taskForm.title.trim()} onClick={handleAddTask} sx={{ backgroundColor:colors.greenAccent[600] }}>Assign</Button>
        </DialogActions>
      </Dialog>

      {/* New Community Task Dialog */}
      <Dialog open={newTaskDialog} onClose={() => setNewTaskDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx:{ backgroundColor:colors.primary[400] } }}>
        <DialogTitle sx={{ color:colors.grey[100], fontSize:"1.2rem !important" }}>Create Community Task</DialogTitle>
        <DialogContent sx={{ pt:2 }}>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField fullWidth size="small" label="Title *" value={newTaskForm.title} onChange={e => setNewTaskForm(f => ({ ...f, title:e.target.value }))} sx={fieldSx} />
            <TextField fullWidth size="small" multiline rows={2} label="Description" value={newTaskForm.description} onChange={e => setNewTaskForm(f => ({ ...f, description:e.target.value }))} sx={fieldSx} />
            <TextField fullWidth size="small" select label="Zone" value={newTaskForm.zone} onChange={e => setNewTaskForm(f => ({ ...f, zone:e.target.value }))} sx={fieldSx}>{ZONES.map(z => <MenuItem key={z} value={z}>{z}</MenuItem>)}</TextField>
            <TextField fullWidth size="small" label="Due Date" type="date" value={newTaskForm.due_date} onChange={e => setNewTaskForm(f => ({ ...f, due_date:e.target.value }))} InputLabelProps={{ shrink:true }} sx={fieldSx} />
            <TextField fullWidth size="small" select label="Priority" value={newTaskForm.priority} onChange={e => setNewTaskForm(f => ({ ...f, priority:e.target.value }))} sx={fieldSx}>
              {["low","normal","high"].map(p => <MenuItem key={p} value={p} sx={{ textTransform:"capitalize" }}>{p}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewTaskDialog(false)} sx={{ color:colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!newTaskForm.title.trim() || saving} onClick={handleCreateCommunityTask} sx={{ backgroundColor:colors.greenAccent[700] }}>{saving ? "Creating…" : "Create Task"}</Button>
        </DialogActions>
      </Dialog>

      {/* Task Chat Dialog */}
      <Dialog open={chatDialog.open} onClose={() => setChatDialog({ open:false, task:null })} maxWidth="sm" fullWidth PaperProps={{ sx:{ backgroundColor:colors.primary[400] } }}>
        <DialogContent sx={{ p:2.5, height:540, display:"flex", flexDirection:"column" }}>
          {chatDialog.task && <TaskChatPanel task={chatDialog.task} adminId={adminId} adminName={adminName} colors={colors} onClose={() => setChatDialog({ open:false, task:null })} />}
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open:false }))} anchorOrigin={{ vertical:"bottom", horizontal:"center" }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({ ...s, open:false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CommunityVolunteerManagement;
