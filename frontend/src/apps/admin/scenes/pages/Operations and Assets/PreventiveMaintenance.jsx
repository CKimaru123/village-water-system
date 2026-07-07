import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, IconButton, MenuItem, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, Divider, Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import adminApi from "../../../utils/api";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";

const MAINT_TYPES = ["Inspection", "Cleaning", "Repair", "Replacement", "Calibration", "Lubrication", "Testing"];

const mockSchedules = [
  { id: 1, asset: { id: 1, name: "Kiambu Main Pump", type: "Pump" }, maintenance_type: "Inspection", status: "overdue", scheduled_date: "2024-12-01", completed_date: null, assigned_to: "James Mwangi", description: "Quarterly pump inspection and bearing check", completion_notes: null, cost: 0 },
  { id: 2, asset: { id: 2, name: "Ruiru Borehole #1", type: "Borehole" }, maintenance_type: "Cleaning", status: "scheduled", scheduled_date: "2025-01-20", completed_date: null, assigned_to: "Peter Kamau", description: "Annual borehole cleaning and yield test", completion_notes: null, cost: 0 },
  { id: 3, asset: { id: 3, name: "Thika Treatment Plant", type: "Treatment Plant" }, maintenance_type: "Calibration", status: "scheduled", scheduled_date: "2025-01-25", completed_date: null, assigned_to: "Grace Wanjiku", description: "Chlorination dosing calibration", completion_notes: null, cost: 0 },
  { id: 4, asset: { id: 4, name: "Juja Pipeline Segment A", type: "Pipeline" }, maintenance_type: "Inspection", status: "completed", scheduled_date: "2024-11-15", completed_date: "2024-11-15", assigned_to: "David Ochieng", description: "Visual inspection and pressure test", completion_notes: "No leaks found. Pressure holding at 4.2 bar.", cost: 8500 },
  { id: 5, asset: { id: 5, name: "Githurai Pipeline Segment B", type: "Pipeline" }, maintenance_type: "Repair", status: "overdue", scheduled_date: "2024-12-10", completed_date: null, assigned_to: "Samuel Njoroge", description: "Repair identified crack at junction point", completion_notes: null, cost: 0 },
  { id: 6, asset: { id: 6, name: "Kahawa Elevated Tank", type: "Tank" }, maintenance_type: "Cleaning", status: "completed", scheduled_date: "2024-12-05", completed_date: "2024-12-06", assigned_to: "Mary Achieng", description: "Annual tank cleaning and disinfection", completion_notes: "Tank cleaned, disinfected with 5% chlorine solution.", cost: 12000 },
  { id: 7, asset: { id: 7, name: "Backup Pump Unit 2", type: "Pump" }, maintenance_type: "Lubrication", status: "scheduled", scheduled_date: "2025-02-01", completed_date: null, assigned_to: "James Mwangi", description: "Bearing lubrication and seal check", completion_notes: null, cost: 0 },
  { id: 8, asset: { id: 8, name: "Solar Array Unit 1", type: "Solar Panel" }, maintenance_type: "Testing", status: "completed", scheduled_date: "2024-10-20", completed_date: "2024-10-21", assigned_to: "Tech Team", description: "Panel output testing and connection check", completion_notes: "Output at 87% rated capacity. Connections cleaned.", cost: 4500 },
];

const statusColor = (s, colors) => {
  if (s === "overdue") return colors.redAccent[400];
  if (s === "scheduled") return colors.blueAccent[400];
  if (s === "completed") return colors.greenAccent[500];
  return colors.grey[400];
};

const emptyForm = { asset_id: "", maintenance_type: "Inspection", scheduled_date: "", description: "" };
const emptyComplete = { completion_notes: "", cost: "" };

const PreventiveMaintenance = () => {
  const colors = tokens(useTheme().palette.mode);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, schedule: null });
  const [editForm, setEditForm] = useState({});
  const [completeDialog, setCompleteDialog] = useState({ open: false, id: null });
  const [form, setForm] = useState(emptyForm);
  const [completeForm, setCompleteForm] = useState(emptyComplete);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.get("/admin/maintenance")
      .then(res => {
        const api = Array.isArray(res.schedules) ? res.schedules : mockSchedules;
        setSchedules(mergeWithLocal(api));
      })
      .catch(() => setSchedules(mergeWithLocal(mockSchedules)))
      .finally(() => setLoading(false));
  };

  // Merge API/mock schedules with anything saved from AssetRegister
  const mergeWithLocal = (base) => {
    try {
      const local = JSON.parse(localStorage.getItem("pending_maintenance") || "[]");
      if (!local.length) return base;
      // Avoid duplicates by id
      const baseIds = new Set(base.map(s => String(s.id)));
      const fresh = local.filter(l => !baseIds.has(String(l.id)));
      return [...base, ...fresh];
    } catch {
      return base;
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    const newEntry = {
      id: `local-${Date.now()}`,
      asset: { id: form.asset_id, name: `Asset ${form.asset_id}`, type: "Unknown" },
      maintenance_type: form.maintenance_type,
      scheduled_date: form.scheduled_date,
      description: form.description,
      assigned_to: "",
      status: "scheduled",
      cost: 0,
      completed_date: null,
      completion_notes: null,
    };
    try {
      const res = await adminApi.post("/admin/maintenance", { schedule: form });
      newEntry.id = res.schedule?.id || newEntry.id;
      newEntry.asset = res.schedule?.asset || newEntry.asset;
    } catch { /* use local entry */ }
    try {
      const existing = JSON.parse(localStorage.getItem("pending_maintenance") || "[]");
      localStorage.setItem("pending_maintenance", JSON.stringify([...existing, newEntry]));
    } catch { /* ignore */ }
    setSchedules(prev => [...prev, newEntry]);
    setSaving(false);
    setCreateOpen(false);
    setForm(emptyForm);
  };

  const handleComplete = async () => {
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    try {
      await adminApi.patch(`/admin/maintenance/${completeDialog.id}/complete`, completeForm);
    } catch { /* use local update */ }
    setSchedules(prev => prev.map(s => s.id === completeDialog.id ? { ...s, status: "completed", completion_notes: completeForm.completion_notes, cost: Number(completeForm.cost) || 0, completed_date: today } : s));
    setSaving(false);
    setCompleteDialog({ open: false, id: null });
    setCompleteForm(emptyComplete);
  };

  const openEditDialog = (s) => {
    setEditForm({ maintenance_type: s.maintenance_type, scheduled_date: s.scheduled_date, description: s.description || "", assigned_to: s.assigned_to || "" });
    setEditDialog({ open: true, schedule: s });
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      await adminApi.patch(`/admin/maintenance/${editDialog.schedule.id}`, { schedule: editForm });
    } catch { /* local update */ }
    setSchedules(prev => prev.map(s => s.id === editDialog.schedule.id ? { ...s, ...editForm } : s));
    setSaving(false);
    setEditDialog({ open: false, schedule: null });
  };

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const kpis = [
    { label: "Total Scheduled", value: schedules.length, color: colors.blueAccent[400] },
    { label: "Overdue", value: schedules.filter(s => s.status === "overdue").length, color: colors.redAccent[400] },
    { label: "Due This Week", value: schedules.filter(s => { if (s.status !== "scheduled") return false; const d = Math.floor((new Date(s.scheduled_date) - now) / 86400000); return d >= 0 && d <= 7; }).length, color: "#f0c040" },
    { label: "Completed This Month", value: schedules.filter(s => s.status === "completed" && (s.completed_date || "").startsWith(thisMonth)).length, color: colors.greenAccent[400] },
    { label: "Total Cost (KES)", value: schedules.reduce((sum, s) => sum + (Number(s.cost) || 0), 0).toLocaleString(), color: colors.greenAccent[300] },
  ];

  const tabSx = {
    "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
    "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
    "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
  };

  const byType = MAINT_TYPES.map(t => ({ type: t, count: schedules.filter(s => s.maintenance_type === t).length })).filter(x => x.count > 0);
  const monthlyCost = [{ id: "Cost (KES)", data: [{ x: "Oct", y: 4500 }, { x: "Nov", y: 12000 }, { x: "Dec", y: 8500 }] }];
  const statusDist = [
    { id: "overdue", label: "Overdue", value: schedules.filter(s => s.status === "overdue").length },
    { id: "scheduled", label: "Scheduled", value: schedules.filter(s => s.status === "scheduled").length },
    { id: "completed", label: "Completed", value: schedules.filter(s => s.status === "completed").length },
  ];

  const grouped = {
    Overdue: schedules.filter(s => s.status === "overdue"),
    Scheduled: schedules.filter(s => s.status === "scheduled"),
    Completed: schedules.filter(s => s.status === "completed"),
  };

  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const scheduledDates = schedules.filter(s => s.scheduled_date).map(s => new Date(s.scheduled_date).getDate());

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Preventive Maintenance</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Schedule and track all maintenance activities</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
            sx={{ backgroundColor: colors.blueAccent[700], "&:hover": { backgroundColor: colors.blueAccent[600] } }}>
            Schedule Maintenance
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {kpis.map(k => (
          <Card key={k.label} sx={{ flex: "1 1 130px", minWidth: 110, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p: "12px 16px !important" }}>
              <Typography variant="h4" color={k.color} fontWeight="bold">{k.value}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>{k.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...tabSx, mb: 2 }}>
        <Tab label="Schedule" />
        <Tab label="Calendar View" />
        <Tab label="Completion History" />
        <Tab label="Analytics" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box> : (
        <>
          {tab === 0 && (
            <Box>
              {Object.entries(grouped).map(([group, items]) => (
                <Box key={group} mb={3}>
                  <Typography variant="h5" color={statusColor(group.toLowerCase(), colors)} fontWeight="bold" mb={1.5}>
                    {group} ({items.length})
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    {items.map(s => (
                      <Card key={s.id} sx={{ flex: "1 1 280px", maxWidth: 360, backgroundColor: colors.primary[400], borderLeft: `4px solid ${statusColor(s.status, colors)}` }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">{s.asset?.name}</Typography>
                            <Chip label={s.maintenance_type} size="small" sx={{ backgroundColor: colors.blueAccent[800], color: colors.blueAccent[200] }} />
                          </Box>
                          <Typography variant="caption" color={colors.grey[400]}>{s.asset?.type}</Typography>
                          <Typography variant="body2" color={colors.grey[300]} mt={0.5}>{s.description}</Typography>
                          <Box mt={1}>
                            <Typography variant="caption" color={colors.grey[500]}>Scheduled: {s.scheduled_date}</Typography>
                            {s.assigned_to && <Typography variant="caption" color={colors.grey[500]} display="block">Assigned: {s.assigned_to}</Typography>}
                            {s.cost > 0 && <Typography variant="caption" color={colors.greenAccent[400]} display="block">Cost: KES {Number(s.cost).toLocaleString()}</Typography>}
                          </Box>
                          {s.status !== "completed" && (
                            <Box display="flex" gap={1} mt={1.5}>
                              <Button size="small" variant="contained" startIcon={<CheckCircleIcon />}
                                onClick={() => { setCompleteDialog({ open: true, id: s.id }); setCompleteForm(emptyComplete); }}
                                sx={{ fontSize: "0.75rem", backgroundColor: colors.greenAccent[700] }}>Complete</Button>
                              <Button size="small" variant="outlined" startIcon={<EditIcon />}
                                onClick={() => openEditDialog(s)}
                                sx={{ fontSize: "0.75rem", borderColor: colors.blueAccent[600], color: colors.blueAccent[400] }}>Edit</Button>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                  <Divider sx={{ borderColor: colors.grey[700], mt: 2 }} />
                </Box>
              ))}
            </Box>
          )}

          {tab === 1 && (
            <Box>
              {/* Calendar header */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">
                  {now.toLocaleString("default", { month: "long", year: "numeric" })} — Maintenance Calendar
                </Typography>
                <Box display="flex" gap={1}>
                  {[["Overdue","#e2726e"],["Scheduled",colors.blueAccent[400]],["Completed",colors.greenAccent[500]]].map(([l,c]) => (
                    <Box key={l} display="flex" alignItems="center" gap={0.5}>
                      <Box sx={{ width:10, height:10, borderRadius:"50%", backgroundColor:c }} />
                      <Typography variant="caption" color={colors.grey[400]}>{l}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Day-of-week headers */}
              <Box display="grid" sx={{ gridTemplateColumns:"repeat(7, 1fr)", gap:0.5, mb:0.5 }}>
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                  <Box key={d} sx={{ textAlign:"center", py:0.5 }}>
                    <Typography sx={{ fontSize:"0.75rem", color:colors.grey[500], fontWeight:"bold" }}>{d}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Calendar grid */}
              {(() => {
                const year = now.getFullYear();
                const month = now.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const cells = [];
                for (let i = 0; i < firstDay; i++) cells.push(null);
                for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                while (cells.length % 7 !== 0) cells.push(null);

                const getEventsForDay = (day) => {
                  if (!day) return [];
                  const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  return schedules.filter(s => s.scheduled_date === dateStr || s.completed_date === dateStr);
                };

                const today = now.getDate();
                const rows = [];
                for (let i = 0; i < cells.length; i += 7) {
                  rows.push(cells.slice(i, i + 7));
                }

                return rows.map((row, ri) => (
                  <Box key={ri} display="grid" sx={{ gridTemplateColumns:"repeat(7, 1fr)", gap:0.5, mb:0.5 }}>
                    {row.map((day, ci) => {
                      const events = getEventsForDay(day);
                      const isToday = day === today;
                      return (
                        <Box key={ci} sx={{
                          minHeight:80, backgroundColor: isToday ? colors.blueAccent[800] + "66" : colors.primary[400],
                          border:`1px solid ${isToday ? colors.blueAccent[500] : colors.grey[700]}`,
                          borderRadius:1, p:0.5, position:"relative",
                        }}>
                          {day && (
                            <>
                              <Typography sx={{ fontSize:"0.75rem", fontWeight: isToday ? "bold" : "normal",
                                color: isToday ? colors.blueAccent[300] : colors.grey[400], mb:0.3 }}>
                                {day}
                                {isToday && <span style={{ fontSize:"0.6rem", marginLeft:3, color:colors.blueAccent[300] }}>TODAY</span>}
                              </Typography>
                              {events.slice(0, 3).map((ev, ei) => (
                                <Tooltip key={ei} title={`${ev.asset?.name} — ${ev.maintenance_type} (${ev.status})`} placement="top">
                                  <Box sx={{
                                    fontSize:"0.6rem", px:0.5, py:0.2, mb:0.2, borderRadius:0.5, cursor:"pointer",
                                    backgroundColor: ev.status === "overdue" ? "#e2726e33" : ev.status === "completed" ? colors.greenAccent[800] : colors.blueAccent[800],
                                    color: ev.status === "overdue" ? "#e2726e" : ev.status === "completed" ? colors.greenAccent[300] : colors.blueAccent[300],
                                    overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
                                  }}>
                                    {ev.asset?.name?.split(" ")[0]} · {ev.maintenance_type}
                                  </Box>
                                </Tooltip>
                              ))}
                              {events.length > 3 && (
                                <Typography sx={{ fontSize:"0.6rem", color:colors.grey[500] }}>+{events.length - 3} more</Typography>
                              )}
                            </>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ));
              })()}

              {/* Upcoming reminders */}
              <Box mt={3}>
                <Typography variant="h6" color={colors.grey[200]} mb={1.5}>📅 Upcoming Reminders (Next 14 Days)</Typography>
                {schedules
                  .filter(s => s.status === "scheduled" && s.scheduled_date)
                  .filter(s => { const d = Math.floor((new Date(s.scheduled_date) - now) / 86400000); return d >= 0 && d <= 14; })
                  .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
                  .map(s => {
                    const daysLeft = Math.floor((new Date(s.scheduled_date) - now) / 86400000);
                    return (
                      <Box key={s.id} display="flex" alignItems="center" gap={2} mb={1} p={1.5}
                        sx={{ backgroundColor:colors.primary[400], borderRadius:1, borderLeft:`3px solid ${daysLeft <= 3 ? "#f0c040" : colors.blueAccent[400]}` }}>
                        <Box sx={{ minWidth:50, textAlign:"center" }}>
                          <Typography sx={{ fontSize:"1.2rem", fontWeight:"bold", color: daysLeft <= 3 ? "#f0c040" : colors.blueAccent[300] }}>{daysLeft}</Typography>
                          <Typography sx={{ fontSize:"0.65rem", color:colors.grey[500] }}>days</Typography>
                        </Box>
                        <Box flex={1}>
                          <Typography sx={{ fontSize:"0.9rem", fontWeight:"bold", color:colors.grey[100] }}>{s.asset?.name}</Typography>
                          <Typography sx={{ fontSize:"0.8rem", color:colors.grey[400] }}>{s.maintenance_type} · {s.scheduled_date}</Typography>
                          {s.assigned_to && <Typography sx={{ fontSize:"0.75rem", color:colors.grey[500] }}>Assigned: {s.assigned_to}</Typography>}
                        </Box>
                        <Chip label={daysLeft <= 3 ? "URGENT" : "UPCOMING"} size="small"
                          sx={{ backgroundColor: daysLeft <= 3 ? "#f0c04033" : colors.blueAccent[800],
                            color: daysLeft <= 3 ? "#f0c040" : colors.blueAccent[300], fontSize:"0.7rem" }} />
                      </Box>
                    );
                  })}
              </Box>
            </Box>
          )}

          {tab === 2 && (
            <Box>
              {schedules.filter(s => s.status === "completed").map(s => (
                <Card key={s.id} sx={{ mb: 2, backgroundColor: colors.primary[400] }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={1}>
                      <Box>
                        <Typography variant="h6" color={colors.grey[100]}>{s.asset?.name}</Typography>
                        <Chip label={s.maintenance_type} size="small" sx={{ backgroundColor: colors.blueAccent[800], color: colors.blueAccent[200], mr: 1 }} />
                        <Typography variant="caption" color={colors.grey[400]}>Completed: {s.completed_date}</Typography>
                      </Box>
                      <Typography variant="h6" color={colors.greenAccent[400]}>KES {Number(s.cost).toLocaleString()}</Typography>
                    </Box>
                    {s.completion_notes && (
                      <Box mt={1} p={1} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                        <Typography variant="body2" color={colors.grey[300]}>{s.completion_notes}</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {tab === 3 && (
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Box flex="1 1 300px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Maintenance by Type</Typography>
                <ResponsiveBar data={byType} keys={["count"]} indexBy="type" margin={{ top: 10, right: 20, bottom: 50, left: 40 }}
                  colors={[colors.blueAccent[500]]} axisBottom={{ tickRotation: -30 }}
                  theme={{ axis: { ticks: { text: { fill: colors.grey[400] } } }, grid: { line: { stroke: colors.grey[700] } } }} />
              </Box>
              <Box flex="1 1 300px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Monthly Cost (KES)</Typography>
                <ResponsiveLine data={monthlyCost} margin={{ top: 10, right: 20, bottom: 40, left: 60 }}
                  colors={[colors.greenAccent[500]]} pointSize={8} enableArea
                  theme={{ axis: { ticks: { text: { fill: colors.grey[400] } } }, grid: { line: { stroke: colors.grey[700] } } }} />
              </Box>
              <Box flex="1 1 260px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Status Distribution</Typography>
                <ResponsivePie data={statusDist} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                  colors={[colors.redAccent[400], colors.blueAccent[400], colors.greenAccent[500]]}
                  theme={{ legends: { text: { fill: colors.grey[400] } } }}
                  legends={[{ anchor: "bottom", direction: "row", itemWidth: 80, itemHeight: 18, itemTextColor: colors.grey[400] }]} />
              </Box>
            </Box>
          )}
        </>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Schedule Maintenance</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Asset ID" value={form.asset_id} onChange={e => setForm(f => ({ ...f, asset_id: e.target.value }))} fullWidth />
            <TextField select label="Maintenance Type" value={form.maintenance_type} onChange={e => setForm(f => ({ ...f, maintenance_type: e.target.value }))} fullWidth>
              {MAINT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Scheduled Date *" type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!form.scheduled_date || saving} onClick={handleCreate}
            sx={{ backgroundColor: colors.blueAccent[700] }}>{saving ? "Saving..." : "Schedule"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={completeDialog.open} onClose={() => setCompleteDialog({ open: false, id: null })} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Mark as Completed</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Completion Notes" value={completeForm.completion_notes} onChange={e => setCompleteForm(f => ({ ...f, completion_notes: e.target.value }))} fullWidth multiline rows={3} />
            <TextField label="Cost (KES)" type="number" value={completeForm.cost} onChange={e => setCompleteForm(f => ({ ...f, cost: e.target.value }))} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialog({ open: false, id: null })} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleComplete}
            sx={{ backgroundColor: colors.greenAccent[700] }}>{saving ? "Saving..." : "Mark Complete"}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, schedule: null })} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100], fontSize: "1.2rem !important" }}>
          Edit Schedule — {editDialog.schedule?.asset?.name}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField select label="Maintenance Type" value={editForm.maintenance_type || "Inspection"}
              onChange={e => setEditForm(f => ({ ...f, maintenance_type: e.target.value }))} fullWidth>
              {MAINT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Scheduled Date" type="date" value={editForm.scheduled_date || ""}
              onChange={e => setEditForm(f => ({ ...f, scheduled_date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Assigned To" value={editForm.assigned_to || ""}
              onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))} fullWidth />
            <TextField label="Description" value={editForm.description || ""}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline rows={3} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, schedule: null })} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleEditSave}
            sx={{ backgroundColor: colors.blueAccent[700] }}>{saving ? "Saving..." : "Save Changes"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PreventiveMaintenance;
