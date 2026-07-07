import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, IconButton, MenuItem, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import adminApi from "../../../utils/api";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";

const INCIDENT_TYPES = ["pipe_burst", "pump_failure", "contamination", "low_pressure", "power_outage", "valve_failure", "meter_fault", "other"];
const SEVERITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["open", "in_progress", "resolved", "closed"];

const mockIncidents = [
  { id: 1, title: "Main pipe burst on Thika Road", incident_type: "pipe_burst", severity: "critical", status: "in_progress", location: "Thika Road Km 12", asset: "Juja Pipeline A", reported_by: "John Kamau", assigned_to: "Repair Team A", resolved_at: null, created_at: "2025-01-10T08:30:00Z", description: "Major burst causing flooding and supply interruption to 200 households." },
  { id: 2, title: "Pump failure at Kiambu Station", incident_type: "pump_failure", severity: "high", status: "open", location: "Kiambu Station A", asset: "Kiambu Main Pump", reported_by: "Grace Wanjiku", assigned_to: null, resolved_at: null, created_at: "2025-01-11T14:00:00Z", description: "Primary pump tripped on overload. Backup pump engaged." },
  { id: 3, title: "Suspected contamination in Zone 3", incident_type: "contamination", severity: "critical", status: "open", location: "Zone 3 - Kahawa West", asset: null, reported_by: "Mary Achieng", assigned_to: "Water Quality Team", resolved_at: null, created_at: "2025-01-11T09:15:00Z", description: "Residents reporting discoloured water. Samples taken for testing." },
  { id: 4, title: "Low pressure complaints Zone 2", incident_type: "low_pressure", severity: "medium", status: "resolved", location: "Zone 2 - Githurai", asset: "Githurai Pipeline B", reported_by: "Peter Njoroge", assigned_to: "Operations Team", resolved_at: "2025-01-09T16:00:00Z", created_at: "2025-01-09T10:00:00Z", description: "Pressure drop due to partially closed valve. Valve reopened.", resolution_notes: "Valve at junction 4B was 40% closed. Fully opened. Pressure restored to 3.8 bar." },
  { id: 5, title: "Power outage at Ruiru pumping station", incident_type: "power_outage", severity: "high", status: "resolved", location: "Ruiru North Station", asset: "Ruiru Borehole #1", reported_by: "Samuel Ochieng", assigned_to: "Electrical Team", resolved_at: "2025-01-08T12:00:00Z", created_at: "2025-01-08T06:00:00Z", description: "KPLC power outage. Generator started after 30 min delay.", resolution_notes: "Generator ran for 6 hours. KPLC power restored at 12:00." },
  { id: 6, title: "Meter fault at Kahawa Estate", incident_type: "meter_fault", severity: "low", status: "resolved", location: "Kahawa Estate Block C", asset: "Meter KHW-045", reported_by: "Client Portal", assigned_to: "Meter Team", resolved_at: "2025-01-07T14:30:00Z", created_at: "2025-01-07T09:00:00Z", description: "Meter reading stuck at same value for 3 months.", resolution_notes: "Meter replaced with new unit. Reading reset." },
  { id: 7, title: "Valve failure Zone 4 supply line", incident_type: "valve_failure", severity: "high", status: "in_progress", location: "Zone 4 - Juja Town", asset: "Valve JJ-V03", reported_by: "Field Inspector", assigned_to: "Valve Team", resolved_at: null, created_at: "2025-01-10T11:00:00Z", description: "Zone 4 isolation valve stuck in closed position. Supply interrupted." },
  { id: 8, title: "Treatment plant chemical shortage", incident_type: "other", severity: "medium", status: "open", location: "Thika Treatment Plant", asset: "Thika Treatment Plant", reported_by: "Plant Operator", assigned_to: null, resolved_at: null, created_at: "2025-01-11T07:00:00Z", description: "Chlorine stock critically low. Emergency procurement initiated." },
];

const severityColor = (s, colors) => {
  if (s === "critical") return colors.redAccent[400];
  if (s === "high") return "#ff7043";
  if (s === "medium") return "#f0c040";
  if (s === "low") return colors.greenAccent[500];
  return colors.grey[400];
};

const statusColor = (s, colors) => {
  if (s === "open") return "#f0c040";
  if (s === "in_progress") return colors.blueAccent[400];
  if (s === "resolved") return colors.greenAccent[500];
  if (s === "closed") return colors.grey[500];
  return colors.grey[400];
};

const emptyForm = { title: "", incident_type: "pipe_burst", severity: "medium", status: "open", location: "", description: "", resolution_notes: "" };

const PLAYBOOK = [
  { type: "pipe_burst", title: "Pipe Burst Response", steps: ["Isolate affected section using nearest upstream/downstream valves", "Notify affected customers via SMS/announcement", "Deploy repair crew with pipe repair clamps", "Excavate and repair or replace damaged section", "Pressure test before reopening valves", "Document repair and update asset register"] },
  { type: "pump_failure", title: "Pump Failure Response", steps: ["Switch to backup pump immediately", "Notify operations supervisor", "Diagnose failure: electrical, mechanical, or control", "Contact pump supplier/technician if needed", "Log downtime and cause in maintenance system", "Test primary pump after repair before returning to service"] },
  { type: "contamination", title: "Contamination Response", steps: ["Immediately close supply valves to affected zone", "Collect water samples for laboratory testing", "Issue public health advisory to affected area", "Flush distribution lines with clean water", "Increase chlorination dosing at treatment plant", "Await lab results before restoring supply"] },
  { type: "power_outage", title: "Power Outage Response", steps: ["Start backup generator within 15 minutes", "Notify KPLC and log outage reference number", "Monitor fuel levels — refuel if outage exceeds 4 hours", "Reduce pumping to conserve fuel if extended outage", "Restore normal operations when grid power returns", "Log total downtime and fuel consumed"] },
];

const IncidentManagement = () => {
  const colors = tokens(useTheme().palette.mode);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIncident, setEditIncident] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.get("/admin/incidents")
      .then(res => setIncidents(Array.isArray(res.incidents) ? res.incidents : mockIncidents))
      .catch(() => setIncidents(mockIncidents))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditIncident(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (inc) => {
    setEditIncident(inc);
    setForm({ title: inc.title, incident_type: inc.incident_type, severity: inc.severity, status: inc.status, location: inc.location, description: inc.description || "", resolution_notes: inc.resolution_notes || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editIncident) {
        await adminApi.patch(`/admin/incidents/${editIncident.id}`, { incident: form });
        setIncidents(prev => prev.map(i => i.id === editIncident.id ? { ...i, ...form } : i));
      } else {
        const res = await adminApi.post("/admin/incidents", { incident: form });
        setIncidents(prev => [...prev, res.incident || { ...form, id: Date.now(), created_at: new Date().toISOString() }]);
      }
    } catch {
      if (editIncident) setIncidents(prev => prev.map(i => i.id === editIncident.id ? { ...i, ...form } : i));
      else setIncidents(prev => [...prev, { ...form, id: Date.now(), created_at: new Date().toISOString() }]);
    } finally {
      setSaving(false);
      setDialogOpen(false);
    }
  };

  const updateStatus = (id, newStatus) => {
    const today = new Date().toISOString();
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: newStatus, resolved_at: newStatus === "resolved" ? today : i.resolved_at } : i));
    adminApi.patch(`/admin/incidents/${id}`, { incident: { status: newStatus } }).catch(() => {});
  };

  const today = new Date().toDateString();
  const resolvedToday = incidents.filter(i => i.resolved_at && new Date(i.resolved_at).toDateString() === today).length;
  const resolvedWithTime = incidents.filter(i => i.resolved_at && i.created_at);
  const avgResolution = resolvedWithTime.length > 0
    ? Math.round(resolvedWithTime.reduce((sum, i) => sum + (new Date(i.resolved_at) - new Date(i.created_at)) / 3600000, 0) / resolvedWithTime.length)
    : 0;

  const kpis = [
    { label: "Total", value: incidents.length, color: colors.blueAccent[400] },
    { label: "Open", value: incidents.filter(i => i.status === "open").length, color: "#f0c040" },
    { label: "In Progress", value: incidents.filter(i => i.status === "in_progress").length, color: colors.blueAccent[400] },
    { label: "Critical", value: incidents.filter(i => i.severity === "critical").length, color: colors.redAccent[400] },
    { label: "Resolved Today", value: resolvedToday, color: colors.greenAccent[400] },
    { label: "Avg Resolution (hrs)", value: avgResolution, color: colors.grey[300] },
  ];

  const tabSx = {
    "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
    "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
    "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
  };

  const activeIncidents = incidents.filter(i => i.status === "open" || i.status === "in_progress")
    .sort((a, b) => SEVERITIES.indexOf(b.severity) - SEVERITIES.indexOf(a.severity));

  const filteredAll = incidents.filter(i => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.location.toLowerCase().includes(search.toLowerCase());
    const matchSev = filterSeverity === "all" || i.severity === filterSeverity;
    const matchStat = filterStatus === "all" || i.status === filterStatus;
    return matchSearch && matchSev && matchStat;
  });

  const byType = INCIDENT_TYPES.map(t => ({ type: t.replace("_", " "), count: incidents.filter(i => i.incident_type === t).length })).filter(x => x.count > 0);
  const bySeverity = SEVERITIES.map(s => ({ id: s, label: s, value: incidents.filter(i => i.severity === s).length }));
  const monthlyData = [{ id: "Incidents", data: [{ x: "Oct", y: 3 }, { x: "Nov", y: 5 }, { x: "Dec", y: 4 }, { x: "Jan", y: incidents.length }] }];

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Incident Management</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Track, respond to, and resolve operational incidents</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ backgroundColor: colors.blueAccent[700], "&:hover": { backgroundColor: colors.blueAccent[600] } }}>
            Log Incident
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
        <Tab label="Active Incidents" />
        <Tab label="All Incidents" />
        <Tab label="Analytics" />
        <Tab label="Response Playbook" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box> : (
        <>
          {tab === 0 && (
            <Box display="flex" flexWrap="wrap" gap={2}>
              {activeIncidents.length === 0 && <Alert severity="success" sx={{ width: "100%" }}>No active incidents. All clear!</Alert>}
              {activeIncidents.map(inc => (
                <Card key={inc.id} sx={{ flex: "1 1 300px", maxWidth: 420, backgroundColor: colors.primary[400], borderLeft: `5px solid ${severityColor(inc.severity, colors)}` }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" color={colors.grey[100]} fontWeight="bold" sx={{ flex: 1, mr: 1 }}>{inc.title}</Typography>
                    </Box>
                    <Box display="flex" gap={0.5} flexWrap="wrap" mb={1}>
                      <Chip label={inc.severity.toUpperCase()} size="small" sx={{ backgroundColor: severityColor(inc.severity, colors), color: "#fff", fontWeight: "bold" }} />
                      <Chip label={inc.status.replace("_", " ")} size="small" sx={{ backgroundColor: statusColor(inc.status, colors), color: "#fff" }} />
                      <Chip label={inc.incident_type.replace("_", " ")} size="small" variant="outlined" sx={{ borderColor: colors.grey[600], color: colors.grey[300] }} />
                    </Box>
                    <Typography variant="caption" color={colors.grey[400]} display="block">📍 {inc.location}</Typography>
                    {inc.reported_by && <Typography variant="caption" color={colors.grey[500]} display="block">Reported by: {inc.reported_by}</Typography>}
                    {inc.assigned_to && <Typography variant="caption" color={colors.grey[500]} display="block">Assigned: {inc.assigned_to}</Typography>}
                    <Typography variant="caption" color={colors.grey[500]} display="block">
                      {new Date(inc.created_at).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color={colors.grey[300]} mt={1} sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {inc.description}
                    </Typography>
                    <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
                      {inc.status === "open" && (
                        <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} onClick={() => updateStatus(inc.id, "in_progress")}
                          sx={{ fontSize: "0.75rem", backgroundColor: colors.blueAccent[700] }}>Start</Button>
                      )}
                      {inc.status === "in_progress" && (
                        <Button size="small" variant="contained" startIcon={<CheckCircleIcon />} onClick={() => updateStatus(inc.id, "resolved")}
                          sx={{ fontSize: "0.75rem", backgroundColor: colors.greenAccent[700] }}>Resolve</Button>
                      )}
                      <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEdit(inc)}
                        sx={{ fontSize: "0.75rem", borderColor: colors.blueAccent[600], color: colors.blueAccent[400] }}>Edit</Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <TextField size="small" placeholder="Search incidents..." value={search} onChange={e => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[500] }} /></InputAdornment> }}
                  sx={{ flex: "1 1 200px" }} />
                <TextField select size="small" label="Severity" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} sx={{ minWidth: 130 }}>
                  <MenuItem value="all">All Severities</MenuItem>
                  {SEVERITIES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} sx={{ minWidth: 130 }}>
                  <MenuItem value="all">All Statuses</MenuItem>
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s.replace("_", " ")}</MenuItem>)}
                </TextField>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {filteredAll.map(inc => (
                  <Card key={inc.id} sx={{ flex: "1 1 280px", maxWidth: 380, backgroundColor: colors.primary[400] }}>
                    <CardContent sx={{ p: "12px 16px !important" }}>
                      <Typography variant="body1" color={colors.grey[100]} fontWeight="bold">{inc.title}</Typography>
                      <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                        <Chip label={inc.severity} size="small" sx={{ backgroundColor: severityColor(inc.severity, colors), color: "#fff", fontSize: "0.7rem" }} />
                        <Chip label={inc.status.replace("_", " ")} size="small" sx={{ backgroundColor: statusColor(inc.status, colors), color: "#fff", fontSize: "0.7rem" }} />
                      </Box>
                      <Typography variant="caption" color={colors.grey[400]} display="block" mt={0.5}>{inc.location}</Typography>
                      <Typography variant="caption" color={colors.grey[500]}>{new Date(inc.created_at).toLocaleDateString()}</Typography>
                      <Box mt={1}><IconButton size="small" onClick={() => openEdit(inc)} sx={{ color: colors.blueAccent[400] }}><EditIcon fontSize="small" /></IconButton></Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {tab === 2 && (
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Box flex="1 1 300px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Incidents by Type</Typography>
                <ResponsiveBar data={byType} keys={["count"]} indexBy="type" margin={{ top: 10, right: 20, bottom: 60, left: 40 }}
                  colors={[colors.redAccent[500]]} axisBottom={{ tickRotation: -35 }}
                  theme={{ axis: { ticks: { text: { fill: colors.grey[400] } } }, grid: { line: { stroke: colors.grey[700] } } }} />
              </Box>
              <Box flex="1 1 260px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>By Severity</Typography>
                <ResponsivePie data={bySeverity} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                  colors={[colors.greenAccent[500], "#f0c040", "#ff7043", colors.redAccent[400]]}
                  theme={{ legends: { text: { fill: colors.grey[400] } } }}
                  legends={[{ anchor: "bottom", direction: "row", itemWidth: 70, itemHeight: 18, itemTextColor: colors.grey[400] }]} />
              </Box>
              <Box flex="1 1 300px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Monthly Trend</Typography>
                <ResponsiveLine data={monthlyData} margin={{ top: 10, right: 20, bottom: 40, left: 40 }}
                  colors={[colors.blueAccent[400]]} pointSize={8}
                  theme={{ axis: { ticks: { text: { fill: colors.grey[400] } } }, grid: { line: { stroke: colors.grey[700] } } }} />
              </Box>
              <Card sx={{ flex: "1 1 200px", backgroundColor: colors.primary[400] }}>
                <CardContent>
                  <Typography variant="h6" color={colors.grey[200]}>Avg Resolution Time</Typography>
                  <Typography variant="h2" color={colors.greenAccent[400]} fontWeight="bold">{avgResolution}h</Typography>
                  <Typography variant="caption" color={colors.grey[500]}>Based on {resolvedWithTime.length} resolved incidents</Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {tab === 3 && (
            <Box display="flex" flexWrap="wrap" gap={2}>
              {PLAYBOOK.map(pb => (
                <Card key={pb.type} sx={{ flex: "1 1 280px", maxWidth: 380, backgroundColor: colors.primary[400] }}>
                  <CardContent>
                    <Typography variant="h6" color={colors.blueAccent[300]} fontWeight="bold" mb={1.5}>{pb.title}</Typography>
                    {pb.steps.map((step, i) => (
                      <Box key={i} display="flex" gap={1.5} mb={1} alignItems="flex-start">
                        <Box sx={{ minWidth: 22, height: 22, borderRadius: "50%", backgroundColor: colors.blueAccent[700], display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Typography variant="caption" color="#fff" fontWeight="bold">{i + 1}</Typography>
                        </Box>
                        <Typography variant="body2" color={colors.grey[300]} sx={{ lineHeight: 1.5 }}>{step}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>{editIncident ? "Edit Incident" : "Log New Incident"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} fullWidth />
            <TextField select label="Incident Type" value={form.incident_type} onChange={e => setForm(f => ({ ...f, incident_type: e.target.value }))} fullWidth>
              {INCIDENT_TYPES.map(t => <MenuItem key={t} value={t}>{t.replace("_", " ")}</MenuItem>)}
            </TextField>
            <TextField select label="Severity" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} fullWidth>
              {SEVERITIES.map(s => (
                <MenuItem key={s} value={s}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: severityColor(s, colors) }} />
                    {s}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            {editIncident && (
              <TextField select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} fullWidth>
                {STATUSES.map(s => <MenuItem key={s} value={s}>{s.replace("_", " ")}</MenuItem>)}
              </TextField>
            )}
            <TextField label="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} fullWidth />
            <TextField label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline rows={3} />
            {editIncident && (
              <TextField label="Resolution Notes" value={form.resolution_notes} onChange={e => setForm(f => ({ ...f, resolution_notes: e.target.value }))} fullWidth multiline rows={2} />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!form.title || saving} onClick={handleSave}
            sx={{ backgroundColor: colors.blueAccent[700] }}>{saving ? "Saving..." : editIncident ? "Update" : "Log Incident"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IncidentManagement;
