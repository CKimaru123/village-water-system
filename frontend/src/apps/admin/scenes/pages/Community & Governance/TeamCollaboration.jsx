import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Typography, CircularProgress, Alert, Button, TextField, Chip,
  IconButton, Tooltip, MenuItem, Dialog, Snackbar, DialogTitle,
  DialogContent, DialogActions, Select, FormControl, InputLabel,
  Card, CardContent, Divider, Avatar, Badge, Tab, Tabs, LinearProgress,
  List, ListItem, ListItemAvatar, ListItemText, InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonIcon from "@mui/icons-material/Person";
import FlagIcon from "@mui/icons-material/Flag";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChatIcon from "@mui/icons-material/Chat";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import SubdirectoryArrowRightIcon from "@mui/icons-material/SubdirectoryArrowRight";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import SearchIcon from "@mui/icons-material/Search";
import EventNoteIcon from "@mui/icons-material/EventNote";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES   = ["pending", "in_progress", "completed", "blocked"];
const SUB_STATUSES = ["pending", "in_progress", "completed"];
const EMPTY_TASK = { title: "", description: "", assigned_to_id: "", priority: "medium", status: "pending", due_date: "" };
const EMPTY_SUB  = { title: "", description: "", role_label: "", status: "pending" };

const priorityColor = (p) => ({ urgent:"#e05c5c", high:"#f0a040", medium:"#f0c040", low:"#4cceac" }[p] || "#888");
const statusColor   = (s) => ({ completed:"#4cceac", in_progress:"#4db6e4", blocked:"#e05c5c", pending:"#888" }[s] || "#888");
const initials = (name) => (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const apiFetch = async (url, opts = {}) => {
  const res = await fetch(url, { headers: authHeaders(), ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.errors?.join(", ") || "Request failed");
  return data;
};

// ── Calendar mini-view ────────────────────────────────────────────────────────
const CalendarView = ({ tasks, colors }) => {
  const [month, setMonth] = useState(new Date());
  const year = month.getFullYear();
  const mon  = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const today = new Date();

  const tasksByDate = {};
  tasks.forEach(t => {
    if (!t.due_date) return;
    const d = new Date(t.due_date).toDateString();
    if (!tasksByDate[d]) tasksByDate[d] = [];
    tasksByDate[d].push(t);
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = month.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.grey[700]}` }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <IconButton size="small" onClick={() => setMonth(new Date(year, mon - 1, 1))} sx={{ color: colors.grey[300] }}>‹</IconButton>
          <Typography variant="h6" color={colors.grey[100]} fontWeight={600}>{monthName}</Typography>
          <IconButton size="small" onClick={() => setMonth(new Date(year, mon + 1, 1))} sx={{ color: colors.grey[300] }}>›</IconButton>
        </Box>
        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.3} mb={0.5}>
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
            <Typography key={d} variant="caption" color={colors.grey[500]} textAlign="center">{d}</Typography>
          ))}
        </Box>
        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.3}>
          {cells.map((day, i) => {
            if (!day) return <Box key={i} />;
            const dateStr = new Date(year, mon, day).toDateString();
            const dayTasks = tasksByDate[dateStr] || [];
            const isToday = new Date(year, mon, day).toDateString() === today.toDateString();
            return (
              <Tooltip key={i} title={dayTasks.map(t => t.title).join(", ") || ""} placement="top">
                <Box sx={{
                  p: 0.3, borderRadius: 1, textAlign: "center", cursor: dayTasks.length ? "pointer" : "default",
                  backgroundColor: isToday ? colors.blueAccent[700] : dayTasks.length ? colors.primary[300] : "transparent",
                  border: dayTasks.length ? `1px solid ${priorityColor(dayTasks[0]?.priority)}55` : "1px solid transparent",
                  "&:hover": { backgroundColor: colors.primary[300] },
                }}>
                  <Typography variant="caption" color={isToday ? "#fff" : colors.grey[300]}>{day}</Typography>
                  {dayTasks.length > 0 && (
                    <Box display="flex" justifyContent="center" gap={0.2} mt={0.2}>
                      {dayTasks.slice(0, 3).map((t, ti) => (
                        <Box key={ti} sx={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: priorityColor(t.priority) }} />
                      ))}
                    </Box>
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
        <Box display="flex" gap={1.5} mt={1.5} flexWrap="wrap">
          {PRIORITIES.map(p => (
            <Box key={p} display="flex" alignItems="center" gap={0.5}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: priorityColor(p) }} />
              <Typography variant="caption" color={colors.grey[500]}>{p}</Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// ── Comment thread ────────────────────────────────────────────────────────────
const CommentThread = ({ comments, onPost, colors, placeholder = "Add a comment..." }) => {
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [comments]);

  const submit = async () => {
    if (!body.trim()) return;
    setPosting(true);
    await onPost(body);
    setBody("");
    setPosting(false);
  };

  return (
    <Box>
      <Box sx={{ maxHeight: 280, overflowY: "auto", mb: 1.5, pr: 0.5 }}>
        {comments.length === 0 && (
          <Typography variant="body2" color={colors.grey[600]} textAlign="center" py={2}>
            No comments yet. Be the first to contribute.
          </Typography>
        )}
        {comments.map(c => (
          <Box key={c.id} display="flex" gap={1.5} mb={1.5}>
            <Avatar sx={{ width: 30, height: 30, fontSize: 12, backgroundColor: colors.blueAccent[700] }}>
              {initials(c.author)}
            </Avatar>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={0.3}>
                <Typography variant="caption" color={colors.blueAccent[300]} fontWeight={600}>{c.author}</Typography>
                <Typography variant="caption" color={colors.grey[600]}>
                  {new Date(c.created_at).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ backgroundColor: colors.primary[300], borderRadius: 1, p: 1 }}>
                <Typography variant="body2" color={colors.grey[200]} sx={{ whiteSpace: "pre-wrap" }}>{c.body}</Typography>
              </Box>
            </Box>
          </Box>
        ))}
        <div ref={bottomRef} />
      </Box>
      <Box display="flex" gap={1}>
        <TextField
          fullWidth size="small" placeholder={placeholder} value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          multiline maxRows={3}
          sx={{
            "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } },
          }}
        />
        <IconButton onClick={submit} disabled={posting || !body.trim()}
          sx={{ color: colors.blueAccent[400], alignSelf: "flex-end" }}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

// ── Task Detail Panel ─────────────────────────────────────────────────────────
const TaskDetail = ({ task, allAdmins, colors, onBack, onRefresh, showSnack }) => {
  const [detail, setDetail]       = useState(task);
  const [tab, setTab]             = useState(0);
  const [subDialog, setSubDialog] = useState({ open: false, mode: "create", data: { ...EMPTY_SUB } });
  const [memberDialog, setMemberDialog] = useState({ open: false, userId: "", role: "" });
  const [activeSubtask, setActiveSubtask] = useState(null);
  const [loading, setLoading]     = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch(`${BASE_URL}/admin/collaboration/tasks/${task.id}`);
      setDetail(d?.data?.task || task);
    } catch (e) { showSnack(e.message, "error"); }
    finally { setLoading(false); }
  }, [task]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { reload(); }, [reload]);

  const postComment = async (body, subtaskId = null) => {
    try {
      await apiFetch(`${BASE_URL}/admin/collaboration/tasks/${task.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body, subtask_id: subtaskId }),
      });
      reload();
    } catch (e) { showSnack(e.message, "error"); }
  };

  const saveSubtask = async () => {
    const { mode, data } = subDialog;
    try {
      if (mode === "create") {
        await apiFetch(`${BASE_URL}/admin/collaboration/tasks/${task.id}/subtasks`, {
          method: "POST", body: JSON.stringify({ subtask: data }),
        });
      } else {
        await apiFetch(`${BASE_URL}/admin/collaboration/tasks/${task.id}/subtasks/${data.id}`, {
          method: "PATCH", body: JSON.stringify({ subtask: data }),
        });
      }
      setSubDialog(d => ({ ...d, open: false }));
      showSnack(mode === "create" ? "Sub-task added" : "Sub-task updated", "success");
      reload();
    } catch (e) { showSnack(e.message, "error"); }
  };

  const deleteSubtask = async (sid) => {
    if (!window.confirm("Delete this sub-task?")) return;
    try {
      await apiFetch(`${BASE_URL}/admin/collaboration/tasks/${task.id}/subtasks/${sid}`, { method: "DELETE" });
      showSnack("Sub-task deleted", "success");
      if (activeSubtask?.id === sid) setActiveSubtask(null);
      reload();
    } catch (e) { showSnack(e.message, "error"); }
  };

  const quickSubStatus = async (sub, status) => {
    try {
      await apiFetch(`${BASE_URL}/admin/collaboration/tasks/${task.id}/subtasks/${sub.id}`, {
        method: "PATCH", body: JSON.stringify({ subtask: { status } }),
      });
      reload();
    } catch (e) { showSnack(e.message, "error"); }
  };

  const addMember = async () => {
    if (!memberDialog.userId) return;
    try {
      await apiFetch(`${BASE_URL}/admin/collaboration/tasks/${task.id}/members`, {
        method: "POST", body: JSON.stringify({ user_id: memberDialog.userId, role: memberDialog.role }),
      });
      setMemberDialog({ open: false, userId: "", role: "" });
      showSnack("Member added", "success");
      reload();
    } catch (e) { showSnack(e.message, "error"); }
  };

  const removeMember = async (uid) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      await apiFetch(`${BASE_URL}/admin/collaboration/tasks/${task.id}/members/${uid}`, { method: "DELETE" });
      showSnack("Member removed", "success");
      reload();
    } catch (e) { showSnack(e.message, "error"); }
  };

  const fieldSx = {
    mb: 1.5,
    "& .MuiInputBase-input": { color: colors.grey[100] },
    "& .MuiInputLabel-root": { color: colors.grey[400] },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.blueAccent[400] },
    "& .MuiSelect-icon": { color: colors.grey[400] },
  };

  const t = detail;
  const mainComments  = (t.comments || []).filter(c => !c.subtask_id);
  const memberIds     = (t.members || []).map(m => m.user_id);
  const nonMembers    = allAdmins.filter(a => !memberIds.includes(a.id));

  return (
    <Box>
      {/* Back + header */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <IconButton onClick={onBack} sx={{ color: colors.blueAccent[400] }}><ArrowBackIcon /></IconButton>
        <Box flex={1}>
          <Typography variant="h4" color={colors.grey[100]} fontWeight={700}>{t.title}</Typography>
          <Box display="flex" gap={1} mt={0.5} flexWrap="wrap" alignItems="center">
            <Chip label={t.priority} size="small"
              sx={{ backgroundColor: priorityColor(t.priority) + "33", color: priorityColor(t.priority), fontSize: "0.7rem" }} />
            <Chip label={t.status?.replace("_", " ")} size="small"
              sx={{ backgroundColor: statusColor(t.status) + "33", color: statusColor(t.status), fontSize: "0.7rem" }} />
            {t.due_date && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <CalendarTodayIcon sx={{ fontSize: 13, color: colors.grey[500] }} />
                <Typography variant="caption" color={
                  new Date(t.due_date) < new Date() && t.status !== "completed" ? "#e05c5c" : colors.grey[400]
                }>Due {new Date(t.due_date).toLocaleDateString()}</Typography>
              </Box>
            )}
            {t.created_by && (
              <Typography variant="caption" color={colors.grey[600]}>Created by {t.created_by}</Typography>
            )}
          </Box>
        </Box>
        <IconButton onClick={reload} sx={{ color: colors.grey[500] }}><RefreshIcon fontSize="small" /></IconButton>
      </Box>

      {t.description && (
        <Typography variant="body2" color={colors.grey[300]} mb={2} sx={{ lineHeight: 1.7 }}>{t.description}</Typography>
      )}

      {loading && <LinearProgress sx={{ mb: 1, "& .MuiLinearProgress-bar": { backgroundColor: colors.blueAccent[400] } }} />}

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
        mb: 2, borderBottom: `1px solid ${colors.grey[700]}`,
        "& .MuiTab-root": { color: colors.grey[400], textTransform: "none", minWidth: 0, px: 2 },
        "& .Mui-selected": { color: colors.blueAccent[400] },
        "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
      }}>
        <Tab label={`Discussion (${mainComments.length})`} icon={<ChatIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
        <Tab label={`Sub-tasks (${(t.subtasks || []).length})`} icon={<SubdirectoryArrowRightIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
        <Tab label={`Team (${(t.members || []).length})`} icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
      </Tabs>

      {/* Tab 0: Main discussion */}
      {tab === 0 && (
        <CommentThread
          comments={mainComments}
          onPost={(body) => postComment(body, null)}
          colors={colors}
          placeholder="Contribute to this task discussion..."
        />
      )}

      {/* Tab 1: Sub-tasks */}
      {tab === 1 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={1.5}>
            <Button size="small" variant="outlined" startIcon={<AddIcon />}
              onClick={() => setSubDialog({ open: true, mode: "create", data: { ...EMPTY_SUB } })}
              sx={{ borderColor: colors.blueAccent[600], color: colors.blueAccent[400] }}>
              Add Sub-task / Role
            </Button>
          </Box>

          {(t.subtasks || []).length === 0 && (
            <Alert severity="info">No sub-tasks yet. Any team member can add their role/contribution here.</Alert>
          )}

          {(t.subtasks || []).map(sub => (
            <Card key={sub.id} sx={{
              backgroundColor: colors.primary[300], mb: 1.5,
              border: `1px solid ${statusColor(sub.status)}44`,
              borderLeft: `3px solid ${statusColor(sub.status)}`,
            }}>
              <CardContent sx={{ p: "12px 16px !important" }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.3}>
                      {sub.role_label && (
                        <Chip label={sub.role_label} size="small"
                          sx={{ backgroundColor: colors.blueAccent[700] + "55", color: colors.blueAccent[300], fontSize: "0.65rem" }} />
                      )}
                      <Typography variant="body1" color={colors.grey[100]} fontWeight={600}>{sub.title}</Typography>
                    </Box>
                    {sub.description && (
                      <Typography variant="body2" color={colors.grey[400]} mb={0.5}>{sub.description}</Typography>
                    )}
                    <Box display="flex" gap={1.5} alignItems="center">
                      <Typography variant="caption" color={colors.grey[600]}>by {sub.created_by}</Typography>
                      <Chip label={sub.status?.replace("_", " ")} size="small"
                        sx={{ backgroundColor: statusColor(sub.status) + "33", color: statusColor(sub.status), fontSize: "0.65rem" }} />
                      <Typography variant="caption" color={colors.grey[600]}>
                        {sub.comment_count} comment{sub.comment_count !== 1 ? "s" : ""}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" gap={0.5}>
                    {sub.status !== "completed" && (
                      <Tooltip title="Mark complete">
                        <IconButton size="small" onClick={() => quickSubStatus(sub, "completed")} sx={{ color: "#4cceac" }}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setSubDialog({ open: true, mode: "edit", data: { ...sub } })}
                        sx={{ color: colors.blueAccent[400] }}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => deleteSubtask(sub.id)} sx={{ color: colors.redAccent[400] }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={activeSubtask?.id === sub.id ? "Hide discussion" : "Discuss"}>
                      <IconButton size="small"
                        onClick={() => setActiveSubtask(activeSubtask?.id === sub.id ? null : sub)}
                        sx={{ color: activeSubtask?.id === sub.id ? colors.blueAccent[300] : colors.grey[500] }}>
                        <ChatIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Inline discussion for this sub-task */}
                {activeSubtask?.id === sub.id && (
                  <Box mt={1.5} pt={1.5} sx={{ borderTop: `1px solid ${colors.grey[700]}` }}>
                    <CommentThread
                      comments={(t.comments || []).filter(c => c.subtask_id === sub.id)}
                      onPost={(body) => postComment(body, sub.id)}
                      colors={colors}
                      placeholder={`Contribute to "${sub.title}"...`}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Tab 2: Team members */}
      {tab === 2 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={1.5}>
            <Button size="small" variant="outlined" startIcon={<GroupAddIcon />}
              onClick={() => setMemberDialog({ open: true, userId: "", role: "" })}
              sx={{ borderColor: colors.blueAccent[600], color: colors.blueAccent[400] }}>
              Add Member
            </Button>
          </Box>

          {(t.members || []).length === 0 && (
            <Alert severity="info">No team members yet.</Alert>
          )}

          <List dense>
            {(t.members || []).map(m => (
              <ListItem key={m.user_id} sx={{
                backgroundColor: colors.primary[300], borderRadius: 1, mb: 0.5,
                border: `1px solid ${colors.grey[700]}`,
              }}
                secondaryAction={
                  <Tooltip title="Remove member">
                    <IconButton size="small" onClick={() => removeMember(m.user_id)} sx={{ color: colors.redAccent[400] }}>
                      <PersonRemoveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }>
                <ListItemAvatar>
                  <Avatar sx={{ width: 32, height: 32, fontSize: 12, backgroundColor: colors.blueAccent[700] }}>
                    {initials(m.name)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography variant="body2" color={colors.grey[100]}>{m.name}</Typography>}
                  secondary={
                    <Box display="flex" gap={1} alignItems="center">
                      {m.role && <Chip label={m.role} size="small"
                        sx={{ backgroundColor: colors.blueAccent[700] + "55", color: colors.blueAccent[300], fontSize: "0.65rem" }} />}
                      <Typography variant="caption" color={colors.grey[500]}>{m.email}</Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Sub-task dialog */}
      <Dialog open={subDialog.open} onClose={() => setSubDialog(d => ({ ...d, open: false }))}
        maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>
          {subDialog.mode === "create" ? "Add Sub-task / Role" : "Edit Sub-task"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth margin="dense" label="Title *" value={subDialog.data.title}
            onChange={e => setSubDialog(d => ({ ...d, data: { ...d.data, title: e.target.value } }))} sx={fieldSx} />
          <TextField fullWidth margin="dense" label="Role / Department (e.g. Finance, Projects)"
            value={subDialog.data.role_label}
            onChange={e => setSubDialog(d => ({ ...d, data: { ...d.data, role_label: e.target.value } }))} sx={fieldSx} />
          <TextField fullWidth margin="dense" label="Description / Contribution" multiline rows={3}
            value={subDialog.data.description}
            onChange={e => setSubDialog(d => ({ ...d, data: { ...d.data, description: e.target.value } }))} sx={fieldSx} />
          <FormControl fullWidth sx={fieldSx}>
            <InputLabel sx={{ color: colors.grey[400] }}>Status</InputLabel>
            <Select value={subDialog.data.status} label="Status"
              onChange={e => setSubDialog(d => ({ ...d, data: { ...d.data, status: e.target.value } }))}
              sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
              MenuProps={{ PaperProps: { sx: { backgroundColor: colors.primary[300] } } }}>
              {SUB_STATUSES.map(s => <MenuItem key={s} value={s} sx={{ color: colors.grey[100] }}>{s.replace("_", " ")}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubDialog(d => ({ ...d, open: false }))} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" onClick={saveSubtask}
            sx={{ backgroundColor: colors.blueAccent[600] }}>
            {subDialog.mode === "create" ? "Add" : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add member dialog */}
      <Dialog open={memberDialog.open} onClose={() => setMemberDialog({ open: false, userId: "", role: "" })}
        maxWidth="xs" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Add Team Member</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={fieldSx}>
            <InputLabel sx={{ color: colors.grey[400] }}>Admin</InputLabel>
            <Select value={memberDialog.userId} label="Admin"
              onChange={e => setMemberDialog(d => ({ ...d, userId: e.target.value }))}
              sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
              MenuProps={{ PaperProps: { sx: { backgroundColor: colors.primary[300] } } }}>
              {nonMembers.map(a => (
                <MenuItem key={a.id} value={a.id} sx={{ color: colors.grey[100] }}>{a.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth margin="dense" label="Role / Responsibility (optional)"
            value={memberDialog.role}
            onChange={e => setMemberDialog(d => ({ ...d, role: e.target.value }))} sx={fieldSx} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberDialog({ open: false, userId: "", role: "" })} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" onClick={addMember} disabled={!memberDialog.userId}
            sx={{ backgroundColor: colors.blueAccent[600] }}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const TeamCollaboration = () => {
  const colors = tokens(useTheme().palette.mode);
  const [tasks,        setTasks]        = useState([]);
  const [allAdmins,    setAllAdmins]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [dialog,       setDialog]       = useState({ open: false, mode: "create", data: { ...EMPTY_TASK } });
  const [snackbar,     setSnackbar]     = useState({ open: false, message: "", severity: "success" });
  const [saving,       setSaving]       = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search,       setSearch]       = useState("");
  const [view,         setView]         = useState("list"); // "list" | "calendar"
  const [activeTask,   setActiveTask]   = useState(null);

  const showSnack = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const load = () => {
    setLoading(true);
    fetch(`${BASE_URL}/admin/collaboration/tasks`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setTasks(d?.data?.tasks || d?.tasks || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const loadAdmins = () => {
    fetch(`${BASE_URL}/admin/collaboration/admins`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setAllAdmins(d?.data?.admins || []))
      .catch(() => {});
  };

  useEffect(() => { load(); loadAdmins(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => setDialog({ open: true, mode: "create", data: { ...EMPTY_TASK } });
  const openEdit   = (t) => setDialog({ open: true, mode: "edit",   data: { ...t } });
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));

  const handleSave = async () => {
    if (!dialog.data.title.trim()) { showSnack("Title is required", "error"); return; }
    setSaving(true);
    try {
      const method = dialog.mode === "create" ? "POST" : "PATCH";
      const url = dialog.mode === "create"
        ? `${BASE_URL}/admin/collaboration/tasks`
        : `${BASE_URL}/admin/collaboration/tasks/${dialog.data.id}`;
      await apiFetch(url, { method, body: JSON.stringify({ task: dialog.data }) });
      showSnack(dialog.mode === "create" ? "Task created" : "Task updated");
      closeDialog();
      load();
    } catch (err) { showSnack(err.message, "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task and all its sub-tasks and comments?")) return;
    try {
      await apiFetch(`${BASE_URL}/admin/collaboration/tasks/${id}`, { method: "DELETE" });
      setTasks(prev => prev.filter(t => t.id !== id));
      showSnack("Task deleted");
    } catch (err) { showSnack(err.message, "error"); }
  };

  const quickStatus = async (task, newStatus) => {
    try {
      await apiFetch(`${BASE_URL}/admin/collaboration/tasks/${task.id}`, {
        method: "PATCH", body: JSON.stringify({ task: { status: newStatus } }),
      });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (err) { showSnack(err.message, "error"); }
  };

  const set = (f) => (e) => setDialog(d => ({ ...d, data: { ...d.data, [f]: e.target.value } }));

  const filtered = tasks.filter(t => {
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter(t => t.status === s).length }), {});

  const fieldSx = {
    mb: 1.5,
    "& .MuiInputBase-input": { color: colors.grey[100] },
    "& .MuiInputLabel-root": { color: colors.grey[400] },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.blueAccent[400] },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colors.blueAccent[400] },
    "& .MuiSelect-icon": { color: colors.grey[400] },
  };

  // ── Task detail view ──
  if (activeTask) {
    return (
      <Box m="20px">
        <TaskDetail
          task={activeTask}
          allAdmins={allAdmins}
          colors={colors}
          onBack={() => { setActiveTask(null); load(); }}
          onRefresh={load}
          showSnack={showSnack}
        />
        <Snackbar open={snackbar.open} autoHideDuration={3000}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity={snackbar.severity} variant="filled"
            onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Team Collaboration</Typography>
          <Typography variant="h6" color={colors.grey[400]}>
            Create tasks, assign roles, discuss progress, and track deadlines
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title={view === "list" ? "Calendar view" : "List view"}>
            <IconButton onClick={() => setView(v => v === "list" ? "calendar" : "list")}
              sx={{ color: colors.blueAccent[400] }}>
              <EventNoteIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={load} sx={{ color: colors.grey[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[500] } }}>
            New Task
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Summary cards */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {[
          { label: "Total",       value: tasks.length,          color: colors.blueAccent[400] },
          { label: "Pending",     value: counts.pending || 0,   color: "#888" },
          { label: "In Progress", value: counts.in_progress||0, color: "#4db6e4" },
          { label: "Completed",   value: counts.completed || 0, color: "#4cceac" },
          { label: "Blocked",     value: counts.blocked || 0,   color: "#e05c5c" },
        ].map(s => (
          <Card key={s.label} sx={{ backgroundColor: colors.primary[400], flex: "1 1 100px", minWidth: 100,
            cursor: "pointer", "&:hover": { backgroundColor: colors.primary[300] } }}
            onClick={() => setFilterStatus(s.label === "Total" ? "all" : s.label.toLowerCase().replace(" ", "_"))}>
            <CardContent sx={{ p: "12px 16px !important" }}>
              <Typography variant="h4" color={s.color} fontWeight="bold">{s.value}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>{s.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Calendar view */}
      {view === "calendar" && (
        <Box mb={3}>
          <CalendarView tasks={tasks} colors={colors} />
        </Box>
      )}

      {/* Filters + search */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <TextField
          placeholder="Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{
            width: 280,
            "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } },
          }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[400] }} /></InputAdornment> }}
        />
        <Box display="flex" gap={1} flexWrap="wrap">
          {["all", ...STATUSES].map(s => (
            <Chip key={s} label={s === "all" ? "All" : s.replace("_", " ")}
              onClick={() => setFilterStatus(s)}
              sx={{
                cursor: "pointer", textTransform: "capitalize",
                backgroundColor: filterStatus === s ? colors.blueAccent[600] : colors.primary[400],
                color: filterStatus === s ? "#fff" : colors.grey[300],
                border: `1px solid ${filterStatus === s ? colors.blueAccent[500] : colors.grey[700]}`,
              }} />
          ))}
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>
      ) : filtered.length === 0 ? (
        <Alert severity="info">No tasks found.</Alert>
      ) : (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {filtered.map(task => (
            <Card key={task.id} sx={{
              backgroundColor: colors.primary[400],
              border: `1px solid ${task.status === "blocked" ? "#e05c5c44" : colors.grey[700]}`,
              borderLeft: `4px solid ${priorityColor(task.priority)}`,
              cursor: "pointer",
              transition: "all 0.15s",
              "&:hover": { backgroundColor: colors.primary[300], borderColor: colors.blueAccent[700] },
            }}>
              <CardContent sx={{ p: "14px 18px !important" }}
                onClick={() => setActiveTask(task)}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="h6" color={colors.grey[100]} fontWeight={600} mb={0.3}>{task.title}</Typography>
                    {task.description && (
                      <Typography variant="body2" color={colors.grey[400]} mb={0.8}
                        sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 500 }}>
                        {task.description}
                      </Typography>
                    )}
                    <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                      {task.assigned_to && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <PersonIcon sx={{ fontSize: 13, color: colors.grey[500] }} />
                          <Typography variant="caption" color={colors.grey[400]}>{task.assigned_to}</Typography>
                        </Box>
                      )}
                      {task.due_date && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <CalendarTodayIcon sx={{ fontSize: 13, color: colors.grey[500] }} />
                          <Typography variant="caption" color={
                            new Date(task.due_date) < new Date() && task.status !== "completed" ? "#e05c5c" : colors.grey[400]
                          }>Due {new Date(task.due_date).toLocaleDateString()}</Typography>
                        </Box>
                      )}
                      {task.member_count > 0 && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <PersonIcon sx={{ fontSize: 13, color: colors.grey[500] }} />
                          <Typography variant="caption" color={colors.grey[500]}>{task.member_count} member{task.member_count !== 1 ? "s" : ""}</Typography>
                        </Box>
                      )}
                      {task.subtask_count > 0 && (
                        <Typography variant="caption" color={colors.grey[500]}>
                          {task.subtask_count} sub-task{task.subtask_count !== 1 ? "s" : ""}
                        </Typography>
                      )}
                      {task.comment_count > 0 && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <ChatIcon sx={{ fontSize: 13, color: colors.grey[500] }} />
                          <Typography variant="caption" color={colors.grey[500]}>{task.comment_count}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} flexShrink={0} flexWrap="wrap"
                    onClick={e => e.stopPropagation()}>
                    <Chip label={task.priority} size="small"
                      sx={{ backgroundColor: priorityColor(task.priority) + "33", color: priorityColor(task.priority), fontSize: "0.7rem" }} />
                    <Chip label={task.status?.replace("_", " ")} size="small"
                      sx={{ backgroundColor: statusColor(task.status) + "33", color: statusColor(task.status), fontSize: "0.7rem" }} />
                    {task.status !== "completed" && (
                      <Tooltip title="Mark complete">
                        <IconButton size="small" onClick={() => quickStatus(task, "completed")} sx={{ color: "#4cceac" }}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(task)} sx={{ color: colors.blueAccent[400] }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(task.id)} sx={{ color: colors.redAccent[400] }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialog.open} onClose={closeDialog} fullWidth maxWidth="sm"
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100], borderBottom: `1px solid ${colors.grey[700]}` }}>
          {dialog.mode === "create" ? "New Task" : "Edit Task"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth margin="dense" label="Title *" value={dialog.data.title}
            onChange={set("title")} sx={fieldSx} />
          <TextField fullWidth margin="dense" label="Description" multiline rows={3}
            value={dialog.data.description} onChange={set("description")} sx={fieldSx} />
          <FormControl fullWidth sx={fieldSx}>
            <InputLabel sx={{ color: colors.grey[400] }}>Lead / Assigned To</InputLabel>
            <Select value={dialog.data.assigned_to_id || ""} label="Lead / Assigned To"
              onChange={set("assigned_to_id")}
              sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
              MenuProps={{ PaperProps: { sx: { backgroundColor: colors.primary[300] } } }}>
              <MenuItem value=""><em>Unassigned</em></MenuItem>
              {allAdmins.map(a => (
                <MenuItem key={a.id} value={a.id} sx={{ color: colors.grey[100] }}>{a.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box display="flex" gap={2}>
            <FormControl fullWidth sx={fieldSx}>
              <InputLabel sx={{ color: colors.grey[400] }}>Priority</InputLabel>
              <Select value={dialog.data.priority} label="Priority" onChange={set("priority")}
                sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
                MenuProps={{ PaperProps: { sx: { backgroundColor: colors.primary[300] } } }}>
                {PRIORITIES.map(p => (
                  <MenuItem key={p} value={p} sx={{ color: colors.grey[100] }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <FlagIcon sx={{ fontSize: 14, color: priorityColor(p) }} />
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={fieldSx}>
              <InputLabel sx={{ color: colors.grey[400] }}>Status</InputLabel>
              <Select value={dialog.data.status} label="Status" onChange={set("status")}
                sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
                MenuProps={{ PaperProps: { sx: { backgroundColor: colors.primary[300] } } }}>
                {STATUSES.map(s => (
                  <MenuItem key={s} value={s} sx={{ color: colors.grey[100] }}>{s.replace("_", " ")}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <TextField fullWidth margin="dense" type="date" label="Due Date"
            InputLabelProps={{ shrink: true }} value={dialog.data.due_date || ""}
            onChange={set("due_date")} sx={fieldSx} />
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${colors.grey[700]}`, px: 3, py: 2 }}>
          <Button onClick={closeDialog} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ backgroundColor: colors.blueAccent[600] }}>
            {saving ? "Saving..." : dialog.mode === "create" ? "Create Task" : "Update Task"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeamCollaboration;
