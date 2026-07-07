import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  LinearProgress, Select, MenuItem, FormControl, InputLabel, IconButton,
  Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow, Divider,
  Grid, Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { useNavigate } from "react-router-dom";
import adminApi from "../../../utils/api";
import { ResponsiveBar } from "@nivo/bar";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PeopleIcon from "@mui/icons-material/People";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import RefreshIcon from "@mui/icons-material/Refresh";

// Display-only enrichment (fields not in DB — derived from title/type)
const CONTRACTOR_BY_TITLE = {
  "Kijiji A Borehole Drilling": "AquaDrill Ltd",
  "Solar Pump Installation — Zone B": "SolarTech Kenya",
  "Distribution Pipeline Extension": "PipeWorks Co.",
  "Water Treatment Plant Upgrade": "WaterPure Ltd",
  "Community Storage Tank — Kijiji E": "BuildRight Ltd",
};
const PROGRESS_BY_TITLE = {
  "Kijiji A Borehole Drilling": 65,
  "Solar Pump Installation — Zone B": 5,
  "Distribution Pipeline Extension": 30,
  "Water Treatment Plant Upgrade": 100,
  "Community Storage Tank — Kijiji E": 45,
};
const PRIORITY_BY_TITLE = {
  "Kijiji A Borehole Drilling": "high",
  "Solar Pump Installation — Zone B": "high",
  "Distribution Pipeline Extension": "medium",
  "Water Treatment Plant Upgrade": "high",
  "Community Storage Tank — Kijiji E": "medium",
};
const BENEFICIARIES_BY_TITLE = {
  "Kijiji A Borehole Drilling": 450,
  "Solar Pump Installation — Zone B": 320,
  "Distribution Pipeline Extension": 180,
  "Water Treatment Plant Upgrade": 1200,
  "Community Storage Tank — Kijiji E": 280,
};

// Normalise API project: map end_date → expected_end_date, fill display-only fields
const enrichProject = (p) => ({
  ...p,
  expected_end_date: p.expected_end_date || p.end_date || "",
  contractor: p.contractor || CONTRACTOR_BY_TITLE[p.title] || "—",
  completion_percentage: p.completion_percentage ?? PROGRESS_BY_TITLE[p.title] ?? 0,
  priority: p.priority || PRIORITY_BY_TITLE[p.title] || "medium",
  beneficiaries: p.beneficiaries || BENEFICIARIES_BY_TITLE[p.title] || 0,
});

const MOCK_PROJECTS = [
  { id: 1, title: "Kijiji A Borehole Drilling", project_type: "Borehole", status: "ongoing",
    start_date: "2024-02-01", expected_end_date: "2024-07-31", budget: 2800000,
    location: "Kijiji A", contractor: "AquaDrill Ltd", completion_percentage: 65,
    priority: "high", beneficiaries: 450,
    description: "Drilling a 120m borehole to serve 450 households in Kijiji A." },
  { id: 2, title: "Solar Pump Installation — Zone B", project_type: "Solar Pump", status: "planning",
    start_date: "2024-06-01", expected_end_date: "2024-09-30", budget: 1500000,
    location: "Zone B", contractor: "SolarTech Kenya", completion_percentage: 0,
    priority: "high", beneficiaries: 320,
    description: "Replace diesel pump with 5kW solar system to cut emissions and costs." },
  { id: 3, title: "Distribution Pipeline Extension", project_type: "Distribution", status: "on_hold",
    start_date: "2024-01-15", expected_end_date: "2024-05-30", budget: 980000,
    location: "Kijiji C–D corridor", contractor: "PipeWorks Co.", completion_percentage: 30,
    priority: "medium", beneficiaries: 180,
    description: "Extend 3.2km pipeline to reach underserved areas." },
  { id: 4, title: "Water Treatment Plant Upgrade", project_type: "Treatment", status: "completed",
    start_date: "2023-09-01", expected_end_date: "2024-01-31", budget: 3200000,
    location: "Central Treatment Plant", contractor: "WaterPure Ltd", completion_percentage: 100,
    priority: "high", beneficiaries: 1200,
    description: "Upgrade chlorination and filtration systems to WHO standards." },
  { id: 5, title: "Community Storage Tank — Kijiji E", project_type: "Storage", status: "ongoing",
    start_date: "2024-03-10", expected_end_date: "2024-08-15", budget: 1750000,
    location: "Kijiji E", contractor: "BuildRight Ltd", completion_percentage: 45,
    priority: "medium", beneficiaries: 280,
    description: "50,000L elevated storage tank construction." },
];

const EMPTY_FORM = {
  title: "", status: "ongoing", project_type: "Borehole",
  location: "", budget: "", start_date: "", expected_end_date: "", description: "",
};

const STATUS_COLORS = {
  planning: "#868dfb", ongoing: "#4cceac", on_hold: "#f0c040",
  completed: "#4caf50", cancelled: "#e2726e",
};
const PRIORITY_COLORS = { high: "#e2726e", medium: "#f0c040", low: "#4cceac" };

const statusChip = (s) => (
  <Chip label={s?.replace(/_/g, " ").toUpperCase()} size="small"
    sx={{ backgroundColor: STATUS_COLORS[s] || "#666", color: "#fff", fontWeight: "bold", fontSize: 10 }} />
);
const priorityChip = (p) => (
  <Chip label={p?.toUpperCase()} size="small"
    sx={{ backgroundColor: PRIORITY_COLORS[p] || "#666", color: "#fff", fontSize: 10 }} />
);

const KpiCard = ({ label, value, color }) => (
  <Card sx={{ flex: "1 1 130px", minWidth: 110, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
    <CardContent sx={{ p: "12px 16px !important" }}>
      <Typography sx={{ fontSize: "1.6rem", fontWeight: "bold", color }}>{value}</Typography>
      <Typography sx={{ fontSize: "0.75rem", color: "#858585" }}>{label}</Typography>
    </CardContent>
  </Card>
);

const ProjectTracker = () => {
  const colors = tokens(useTheme().palette.mode);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detailProject, setDetailProject] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.get("/projects")
      .then(res => {
        const d = res.data?.data?.projects || res.data?.projects || res.data || res;
        const list = Array.isArray(d) && d.length > 0 ? d : MOCK_PROJECTS;
        setProjects(list.map(enrichProject));
      })
      .catch(() => setProjects(MOCK_PROJECTS.map(enrichProject)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...EMPTY_FORM, ...p }); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    // Only send fields the backend permits — strip display-only fields
    const payload = {
      title: form.title,
      description: form.description,
      status: form.status,
      project_type: form.project_type,
      location: form.location,
      start_date: form.start_date,
      end_date: form.expected_end_date || form.end_date,
      budget: form.budget,
    };
    try {
      if (editing) await adminApi.patch(`/projects/${editing.id}`, { project: payload });
      else await adminApi.post("/projects", { project: payload });
      setOpen(false); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try { await adminApi.delete(`/projects/${id}`); load(); }
    catch (err) { setError(err.message); }
  };

  const filtered = statusFilter === "all" ? projects : projects.filter(p => p.status === statusFilter);

  const kpi = {
    total: projects.length,
    ongoing: projects.filter(p => p.status === "ongoing").length,
    completed: projects.filter(p => p.status === "completed").length,
    on_hold: projects.filter(p => p.status === "on_hold").length,
    budget: projects.reduce((s, p) => s + (Number(p.budget) || 0), 0),
    beneficiaries: projects.reduce((s, p) => s + (Number(p.beneficiaries) || 0), 0),
  };

  const barData = filtered.map(p => ({
    project: p.title.length > 20 ? p.title.slice(0, 20) + "…" : p.title,
    "Completion %": p.completion_percentage || 0,
  }));
  const budgetData = filtered.map(p => ({
    project: p.title.length > 20 ? p.title.slice(0, 20) + "…" : p.title,
    "Budget (KES)": Number(p.budget) || 0,
  }));

  const fmtKES = (n) => `KES ${Number(n).toLocaleString()}`;

  const fieldSx = {
    "& .MuiInputBase-input": { color: colors.grey[100] },
    "& .MuiInputLabel-root": { color: colors.grey[300] },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] },
  };

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Project Tracker</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Monitor all water infrastructure projects</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ backgroundColor: colors.blueAccent[600] }}>New Project</Button>
        </Box>
      </Box>

      {/* KPI Strip */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <KpiCard label="Total Projects" value={kpi.total} color={colors.blueAccent[400]} />
        <KpiCard label="Ongoing" value={kpi.ongoing} color={colors.greenAccent[400]} />
        <KpiCard label="Completed" value={kpi.completed} color="#4caf50" />
        <KpiCard label="On Hold" value={kpi.on_hold} color="#f0c040" />
        <KpiCard label="Total Budget" value={fmtKES(kpi.budget)} color={colors.blueAccent[300]} />
        <KpiCard label="Beneficiaries" value={kpi.beneficiaries.toLocaleString()} color={colors.greenAccent[300]} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Status Filter Chips */}
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        {["all", "planning", "ongoing", "on_hold", "completed", "cancelled"].map(s => (
          <Chip key={s} label={s.replace(/_/g, " ").toUpperCase()} clickable
            onClick={() => setStatusFilter(s)}
            sx={{
              backgroundColor: statusFilter === s ? (STATUS_COLORS[s] || colors.blueAccent[600]) : colors.primary[400],
              color: statusFilter === s ? "#fff" : colors.grey[300],
              fontWeight: statusFilter === s ? "bold" : "normal",
              border: `1px solid ${statusFilter === s ? "transparent" : colors.grey[700]}`,
            }} />
        ))}
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2,
        "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
        "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
        "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
      }}>
        <Tab label="Project Cards" />
        <Tab label="Progress Table" />
        <Tab label="Analytics" />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>
      ) : (
        <>
          {/* TAB 0: Project Cards */}
          {tab === 0 && (
            <Grid container spacing={2}>
              {filtered.map(p => (
                <Grid item xs={12} md={6} lg={4} key={p.id}>
                  <Card sx={{ backgroundColor: colors.primary[400], height: "100%", borderLeft: `4px solid ${STATUS_COLORS[p.status] || "#666"}` }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" sx={{ flex: 1, mr: 1 }}>{p.title}</Typography>
                        <Box display="flex" gap={0.5} flexWrap="wrap" justifyContent="flex-end">
                          {statusChip(p.status)}
                          {priorityChip(p.priority)}
                        </Box>
                      </Box>
                      <Chip label={p.project_type} size="small" sx={{ mb: 1.5, backgroundColor: colors.blueAccent[700], color: "#fff", fontSize: 10 }} />
                      <Box mb={1.5}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography sx={{ fontSize: "0.8rem", color: colors.grey[400] }}>Progress</Typography>
                          <Typography sx={{ fontSize: "0.8rem", color: colors.grey[300] }}>{p.completion_percentage || 0}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={p.completion_percentage || 0}
                          sx={{ height: 8, borderRadius: 4, backgroundColor: colors.grey[700],
                            "& .MuiLinearProgress-bar": { backgroundColor: STATUS_COLORS[p.status] || colors.blueAccent[500] } }} />
                      </Box>
                      <Grid container spacing={1} sx={{ mb: 1.5 }}>
                        {[
                          ["Location", p.location],
                          ["Contractor", p.contractor],
                          ["Budget", fmtKES(p.budget)],
                          ["Due", p.expected_end_date],
                        ].map(([k, v]) => (
                          <Grid item xs={6} key={k}>
                            <Typography sx={{ fontSize: "0.7rem", color: colors.grey[500] }}>{k}</Typography>
                            <Typography sx={{ fontSize: "0.8rem", color: colors.grey[200] }} noWrap>{v || "—"}</Typography>
                          </Grid>
                        ))}
                      </Grid>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Button size="small" variant="outlined" startIcon={<VisibilityIcon />}
                          onClick={() => setDetailProject(p)}
                          sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[700], fontSize: 11 }}>Details</Button>
                        <Button size="small" variant="outlined" startIcon={<PeopleIcon />}
                          onClick={() => navigate("../contractors", { state: { project_id: p.id } })}
                          sx={{ color: colors.greenAccent[400], borderColor: colors.greenAccent[700], fontSize: 11 }}>Contractors</Button>
                        <Button size="small" variant="outlined" startIcon={<AttachMoneyIcon />}
                          onClick={() => navigate("../grants", { state: { project_id: p.id } })}
                          sx={{ color: "#f0c040", borderColor: "#7a6200", fontSize: 11 }}>Funding</Button>
                        <IconButton size="small" onClick={() => openEdit(p)} sx={{ color: colors.grey[400] }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(p.id)} sx={{ color: colors.redAccent[400] }}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {filtered.length === 0 && <Grid item xs={12}><Alert severity="info">No projects match the selected filter.</Alert></Grid>}
            </Grid>
          )}

          {/* TAB 1: Progress Table */}
          {tab === 1 && (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ "& .MuiTableCell-root": { borderColor: colors.grey[700], color: colors.grey[200] } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: colors.blueAccent[700] }}>
                    {["Title", "Type", "Status", "Priority", "Progress", "Location", "Contractor", "Budget", "Due Date", "Beneficiaries", "Actions"].map(h => (
                      <TableCell key={h} sx={{ color: "#fff", fontWeight: "bold", fontSize: "0.8rem" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((p, i) => (
                    <TableRow key={p.id} sx={{ backgroundColor: i % 2 === 0 ? colors.primary[400] : colors.primary[500] }}>
                      <TableCell sx={{ maxWidth: 160 }}><Typography noWrap sx={{ fontSize: "0.85rem" }}>{p.title}</Typography></TableCell>
                      <TableCell><Chip label={p.project_type} size="small" sx={{ backgroundColor: colors.blueAccent[800], color: "#fff", fontSize: 10 }} /></TableCell>
                      <TableCell>{statusChip(p.status)}</TableCell>
                      <TableCell>{priorityChip(p.priority)}</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress variant="determinate" value={p.completion_percentage || 0}
                            sx={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.grey[700],
                              "& .MuiLinearProgress-bar": { backgroundColor: STATUS_COLORS[p.status] } }} />
                          <Typography sx={{ fontSize: "0.75rem", minWidth: 30 }}>{p.completion_percentage || 0}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{p.location}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{p.contractor}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{fmtKES(p.budget)}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{p.expected_end_date}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{p.beneficiaries?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p)} sx={{ color: colors.blueAccent[400] }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(p.id)} sx={{ color: colors.redAccent[400] }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* TAB 2: Analytics */}
          {tab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: colors.primary[400], p: 2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Completion % by Project</Typography>
                  <Box height={300}>
                    <ResponsiveBar data={barData} keys={["Completion %"]} indexBy="project"
                      margin={{ top: 10, right: 20, bottom: 80, left: 50 }}
                      padding={0.3} colors={["#4cceac"]}
                      axisBottom={{ tickRotation: -30, tickSize: 5 }}
                      axisLeft={{ tickSize: 5 }}
                      labelSkipWidth={12} labelSkipHeight={12}
                      theme={{ axis: { ticks: { text: { fill: colors.grey[300] } } }, grid: { line: { stroke: colors.grey[700] } } }} />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: colors.primary[400], p: 2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Budget by Project (KES)</Typography>
                  <Box height={300}>
                    <ResponsiveBar data={budgetData} keys={["Budget (KES)"]} indexBy="project"
                      margin={{ top: 10, right: 20, bottom: 80, left: 80 }}
                      padding={0.3} colors={["#868dfb"]}
                      axisBottom={{ tickRotation: -30, tickSize: 5 }}
                      axisLeft={{ tickSize: 5, format: v => `${(v / 1000000).toFixed(1)}M` }}
                      labelSkipWidth={12} labelSkipHeight={12}
                      theme={{ axis: { ticks: { text: { fill: colors.grey[300] } } }, grid: { line: { stroke: colors.grey[700] } } }} />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={2} flexWrap="wrap">
                  {Object.entries(STATUS_COLORS).map(([s, c]) => {
                    const count = projects.filter(p => p.status === s).length;
                    return (
                      <Card key={s} sx={{ flex: "1 1 120px", backgroundColor: colors.primary[400], borderLeft: `4px solid ${c}` }}>
                        <CardContent sx={{ p: "12px 16px !important" }}>
                          <Typography sx={{ fontSize: "1.4rem", fontWeight: "bold", color: c }}>{count}</Typography>
                          <Typography sx={{ fontSize: "0.75rem", color: colors.grey[400] }}>{s.replace(/_/g, " ").toUpperCase()}</Typography>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100], fontSize: "1.2rem !important" }}>
          {editing ? "Edit Project" : "Create New Project"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {[
              { label: "Title *", key: "title", xs: 12 },
              { label: "Location", key: "location", xs: 6 },
              { label: "Budget (KES)", key: "budget", xs: 6, type: "number" },
              { label: "Start Date", key: "start_date", xs: 6, type: "date" },
              { label: "Expected End Date", key: "expected_end_date", xs: 6, type: "date" },
            ].map(({ label, key, xs, type }) => (
              <Grid item xs={xs} key={key}>
                <TextField fullWidth size="small" label={label} type={type || "text"}
                  value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  InputLabelProps={type === "date" ? { shrink: true } : undefined}
                  sx={fieldSx} />
              </Grid>
            ))}
            {[
              { label: "Status", key: "status", options: ["ongoing", "completed", "cancelled"] },
              { label: "Type", key: "project_type", options: ["Borehole", "Solar Pump", "Distribution", "Treatment", "Storage", "Other"] },
            ].map(({ label, key, options }) => (
              <Grid item xs={6} key={key}>
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel sx={{ color: colors.grey[300] }}>{label}</InputLabel>
                  <Select value={form[key] || ""} label={label} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    sx={{ color: colors.grey[100] }}>
                    {options.map(o => <MenuItem key={o} value={o}>{o.replace(/_/g, " ")}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            ))}
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} size="small" label="Description"
                value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                sx={fieldSx} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving || !form.title} onClick={handleSave}
            sx={{ backgroundColor: colors.blueAccent[600] }}>{saving ? "Saving…" : editing ? "Update" : "Create"}</Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailProject} onClose={() => setDetailProject(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        {detailProject && (
          <>
            <DialogTitle sx={{ color: colors.grey[100], fontSize: "1.2rem !important" }}>
              {detailProject.title}
              <Box display="flex" gap={1} mt={0.5}>{statusChip(detailProject.status)}{priorityChip(detailProject.priority)}</Box>
            </DialogTitle>
            <DialogContent>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />
              {[
                ["Type", detailProject.project_type],
                ["Location", detailProject.location],
                ["Contractor", detailProject.contractor],
                ["Budget", fmtKES(detailProject.budget)],
                ["Beneficiaries", detailProject.beneficiaries?.toLocaleString()],
                ["Start Date", detailProject.start_date],
                ["Expected End", detailProject.expected_end_date],
                ["Completion", `${detailProject.completion_percentage || 0}%`],
                ["Description", detailProject.description],
              ].map(([k, v]) => (
                <Box key={k} display="flex" gap={2} mb={1.5}>
                  <Typography sx={{ fontSize: "1rem !important", color: colors.grey[400], minWidth: 130 }}>{k}:</Typography>
                  <Typography sx={{ fontSize: "1rem !important", color: colors.grey[100] }}>{v || "—"}</Typography>
                </Box>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailProject(null)} sx={{ color: colors.grey[400] }}>Close</Button>
              <Button variant="outlined" onClick={() => { setDetailProject(null); openEdit(detailProject); }}
                sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[400] }}>Edit</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ProjectTracker;
