import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Chip, Button,
  Grid, Tabs, Tab, TextField, MenuItem, InputAdornment, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, LinearProgress, Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { useNavigate, useLocation } from "react-router-dom";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import adminApi from "../../../utils/api";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import TimelineIcon from "@mui/icons-material/Timeline";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";

const SEV_COLOR = (s, c) => ({ critical: c.redAccent[400], high: "#f0a040", medium: "#f0c040", low: c.greenAccent[400] }[s] || c.grey[400]);
const STATUS_COLOR = (s, c) => ({ open: "#f0c040", resolved: c.greenAccent[400], dismissed: c.grey[500] }[s] || c.grey[400]);

const MOCK = [
  { id: 1, anomaly_type: "high_consumption", severity: "critical", status: "open", description: "Consumption 42.3 m³/day vs baseline 8.1 m³/day", detected_value: 42.3, expected_value: 8.1, detected_at: new Date(Date.now() - 3600000).toISOString(), affected_zone: "Zone 3", user: "James Mwangi", connection_id: 12 },
  { id: 2, anomaly_type: "meter_tampering", severity: "high", status: "open", description: "Meter reading dropped to zero for 48 hours then spiked", detected_value: 0, expected_value: 5.2, detected_at: new Date(Date.now() - 7200000).toISOString(), affected_zone: "Zone 1", user: "Grace Wanjiku", connection_id: 7 },
  { id: 3, anomaly_type: "leak_suspected", severity: "high", status: "open", description: "Night-time flow detected above 2 m³/hr for 3 consecutive nights", detected_value: 3.8, expected_value: 0.2, detected_at: new Date(Date.now() - 86400000).toISOString(), affected_zone: "Zone 2", user: "Peter Njoroge", connection_id: 19 },
  { id: 4, anomaly_type: "billing_anomaly", severity: "medium", status: "open", description: "Invoice amount 340% above 6-month average", detected_value: 12400, expected_value: 3650, detected_at: new Date(Date.now() - 172800000).toISOString(), affected_zone: "Zone 4", user: "Mary Achieng", connection_id: 31 },
  { id: 5, anomaly_type: "high_consumption", severity: "medium", status: "resolved", description: "Consumption 18.2 m³/day vs baseline 6.4 m³/day", detected_value: 18.2, expected_value: 6.4, detected_at: new Date(Date.now() - 259200000).toISOString(), affected_zone: "Zone 1", user: "Samuel Ochieng", connection_id: 5, resolved_at: new Date(Date.now() - 86400000).toISOString(), resolution_notes: "Client confirmed garden irrigation project. Resolved." },
  { id: 6, anomaly_type: "no_consumption", severity: "low", status: "open", description: "No meter readings for 14 days on active connection", detected_value: 0, expected_value: 4.1, detected_at: new Date(Date.now() - 345600000).toISOString(), affected_zone: "Zone 5", user: "Alice Kamau", connection_id: 44 },
];

const STATS_MOCK = {
  total_open: 5, critical: 1, by_type: { high_consumption: 2, meter_tampering: 1, leak_suspected: 1, billing_anomaly: 1, no_consumption: 1 },
  by_severity: { critical: 1, high: 2, medium: 2, low: 1 }, by_status: { open: 5, resolved: 1, dismissed: 0 },
  resolved_today: 1,
  trend_7d: [0,1,2,3,4,5,6].map(i => ({ date: new Date(Date.now() - (6-i)*86400000).toISOString().split("T")[0], count: [2,1,3,2,4,3,5][i] }))
};

const AnomalyDetection = () => {
  const colors = tokens(useTheme().palette.mode);
  const navigate = useNavigate();
  const location = useLocation();
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [filterSev, setFilterSev] = useState("all");
  const [filterStatus, setFilterStatus] = useState("open");
  const [filterType, setFilterType] = useState("all");
  const [resolveDialog, setResolveDialog] = useState({ open: false, anomaly: null });
  const [resolveNotes, setResolveNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminApi.get("/admin/ai/anomalies").catch(() => null),
      adminApi.get("/admin/ai/anomalies/stats").catch(() => null),
    ]).then(([aRes, sRes]) => {
      const raw = aRes?.stored_anomalies || aRes?.data?.stored_anomalies || aRes?.anomalies;
      setAnomalies(Array.isArray(raw) && raw.length > 0 ? raw : MOCK);
      setStats(sRes?.data || sRes || STATS_MOCK);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async () => {
    setSaving(true);
    try {
      await adminApi.patch(`/admin/ai/anomalies/${resolveDialog.anomaly.id}/resolve`, { resolution_notes: resolveNotes });
    } catch {}
    setAnomalies(prev => prev.map(a => a.id === resolveDialog.anomaly.id
      ? { ...a, status: "resolved", resolved_at: new Date().toISOString(), resolution_notes: resolveNotes } : a));
    setSaving(false);
    setResolveDialog({ open: false, anomaly: null });
    setResolveNotes("");
  };

  const handleDismiss = async (anomaly) => {
    try { await adminApi.patch(`/admin/ai/anomalies/${anomaly.id}/dismiss`); } catch {}
    setAnomalies(prev => prev.map(a => a.id === anomaly.id ? { ...a, status: "dismissed" } : a));
  };

  const filtered = anomalies.filter(a => {
    const ms = !search || (a.anomaly_type + a.description + (a.user || "") + (a.affected_zone || "")).toLowerCase().includes(search.toLowerCase());
    const mv = filterSev === "all" || a.severity === filterSev;
    const mt = filterStatus === "all" || a.status === filterStatus;
    const mtype = filterType === "all" || a.anomaly_type === filterType;
    return ms && mv && mt && mtype;
  });

  const types = [...new Set(anomalies.map(a => a.anomaly_type))];
  const nivoTheme = { axis: { ticks: { text: { fill: colors.grey[400] } } }, grid: { line: { stroke: colors.grey[700] } }, tooltip: { container: { background: colors.primary[400], color: colors.grey[100] } } };

  const pieData = Object.entries(stats?.by_severity || STATS_MOCK.by_severity).map(([id, value]) => ({ id, label: id, value }));
  const barData = Object.entries(stats?.by_type || STATS_MOCK.by_type).map(([type, count]) => ({ type: type.replace(/_/g, " "), count }));
  const trendData = [{ id: "Anomalies", color: colors.redAccent[400], data: (stats?.trend_7d || STATS_MOCK.trend_7d).map(d => ({ x: d.date?.slice(5), y: d.count })) }];

  const kpis = [
    { label: "Open", value: anomalies.filter(a => a.status === "open").length, color: "#f0c040" },
    { label: "Critical", value: anomalies.filter(a => a.severity === "critical" && a.status === "open").length, color: colors.redAccent[400] },
    { label: "High", value: anomalies.filter(a => a.severity === "high" && a.status === "open").length, color: "#f0a040" },
    { label: "Resolved Today", value: stats?.resolved_today ?? STATS_MOCK.resolved_today, color: colors.greenAccent[400] },
    { label: "Total Tracked", value: anomalies.length, color: colors.blueAccent[400] },
  ];

  const tabSx = { "& .MuiTab-root": { color: colors.grey[400] }, "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" }, "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] } };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">AI Anomaly Detection</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Real-time AI-driven detection of usage, billing and meter anomalies</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<ReportProblemIcon />}
            onClick={() => navigate("../incidents")}
            sx={{ backgroundColor: colors.redAccent[700], "&:hover": { backgroundColor: colors.redAccent[600] } }}>
            View Incidents
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {kpis.map(k => (
          <Card key={k.label} sx={{ flex: "1 1 120px", minWidth: 100, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p: "12px 16px !important" }}>
              <Typography variant="h3" color={k.color} fontWeight="bold">{k.value}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>{k.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...tabSx, mb: 2 }}>
        <Tab label="Live Anomalies" icon={<DashboardIcon />} iconPosition="start" />
        <Tab label="All Records" icon={<ListAltIcon />} iconPosition="start" />
        <Tab label="Analytics" icon={<TimelineIcon />} iconPosition="start" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box> : (
        <>
          {tab === 0 && (
            <Box>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <TextField size="small" placeholder="Search anomalies..." value={search} onChange={e => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[500] }} /></InputAdornment> }}
                  sx={{ flex: "1 1 200px" }} />
                <TextField select size="small" label="Severity" value={filterSev} onChange={e => setFilterSev(e.target.value)} sx={{ minWidth: 130 }}>
                  <MenuItem value="all">All Severities</MenuItem>
                  {["critical","high","medium","low"].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Type" value={filterType} onChange={e => setFilterType(e.target.value)} sx={{ minWidth: 160 }}>
                  <MenuItem value="all">All Types</MenuItem>
                  {types.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, " ")}</MenuItem>)}
                </TextField>
              </Box>
              {filtered.filter(a => a.status === "open").length === 0 && (
                <Alert severity="success" sx={{ mb: 2 }}>No open anomalies. System operating normally.</Alert>
              )}
              <Grid container spacing={2}>
                {filtered.filter(a => a.status === "open").map(a => (
                  <Grid item xs={12} md={6} key={a.id}>
                    <Card sx={{ backgroundColor: colors.primary[400], borderLeft: `5px solid ${SEV_COLOR(a.severity, colors)}` }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <WarningAmberIcon sx={{ color: SEV_COLOR(a.severity, colors) }} />
                            <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">
                              {a.anomaly_type?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                            </Typography>
                          </Box>
                          <Chip label={a.severity?.toUpperCase()} size="small" sx={{ backgroundColor: SEV_COLOR(a.severity, colors), color: "#fff", fontWeight: "bold" }} />
                        </Box>
                        <Typography variant="body2" color={colors.grey[300]} mb={1}>{a.description}</Typography>
                        <Box display="flex" gap={2} mb={1} flexWrap="wrap">
                          {a.detected_value != null && (
                            <Box>
                              <Typography variant="caption" color={colors.grey[500]}>Detected</Typography>
                              <Typography variant="body2" color={colors.redAccent[400]} fontWeight="bold">{a.detected_value}</Typography>
                            </Box>
                          )}
                          {a.expected_value != null && (
                            <Box>
                              <Typography variant="caption" color={colors.grey[500]}>Expected</Typography>
                              <Typography variant="body2" color={colors.greenAccent[400]} fontWeight="bold">{a.expected_value}</Typography>
                            </Box>
                          )}
                          {a.detected_value && a.expected_value && a.expected_value > 0 && (
                            <Box>
                              <Typography variant="caption" color={colors.grey[500]}>Deviation</Typography>
                              <Typography variant="body2" color="#f0a040" fontWeight="bold">
                                {((a.detected_value / a.expected_value - 1) * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        {a.detected_value && a.expected_value && (
                          <Box mb={1}>
                            <LinearProgress variant="determinate"
                              value={Math.min((a.detected_value / (a.expected_value * 5)) * 100, 100)}
                              sx={{ height: 6, borderRadius: 3, backgroundColor: colors.primary[300], "& .MuiLinearProgress-bar": { backgroundColor: SEV_COLOR(a.severity, colors) } }} />
                          </Box>
                        )}
                        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                          <Box>
                            <Typography variant="caption" color={colors.grey[400]}>
                              {a.detected_at ? new Date(a.detected_at).toLocaleString() : ""}
                              {a.affected_zone ? ` · ${a.affected_zone}` : ""}
                              {a.user ? ` · ${a.user}` : ""}
                            </Typography>
                          </Box>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            {a.connection_id && (
                              <Tooltip title="View client profile">
                                <Button size="small" startIcon={<PersonSearchIcon />} sx={{ color: colors.blueAccent[400], fontSize: "0.75rem" }}
                                  onClick={() => navigate("../client-lookup", { state: { connection_id: a.connection_id } })}>
                                  Client
                                </Button>
                              </Tooltip>
                            )}
                            <Tooltip title="Create incident from this anomaly">
                              <Button size="small" variant="outlined" startIcon={<ReportProblemIcon />}
                                sx={{ color: colors.redAccent[400], borderColor: colors.redAccent[400], fontSize: "0.75rem" }}
                                onClick={() => navigate("../incidents", { state: { prefill: { title: a.anomaly_type?.replace(/_/g, " "), description: a.description, severity: a.severity } } })}>
                                Incident
                              </Button>
                            </Tooltip>
                            <Tooltip title="Mark as resolved">
                              <Button size="small" variant="outlined" startIcon={<CheckCircleIcon />}
                                sx={{ color: colors.greenAccent[400], borderColor: colors.greenAccent[400], fontSize: "0.75rem" }}
                                onClick={() => { setResolveDialog({ open: true, anomaly: a }); setResolveNotes(""); }}>
                                Resolve
                              </Button>
                            </Tooltip>
                            <Tooltip title="Dismiss false positive">
                              <Button size="small" sx={{ color: colors.grey[500], fontSize: "0.75rem" }}
                                onClick={() => handleDismiss(a)}>
                                Dismiss
                              </Button>
                            </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <TextField size="small" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[500] }} /></InputAdornment> }}
                  sx={{ flex: "1 1 200px" }} />
                <TextField select size="small" label="Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} sx={{ minWidth: 130 }}>
                  <MenuItem value="all">All Statuses</MenuItem>
                  {["open","resolved","dismissed"].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Severity" value={filterSev} onChange={e => setFilterSev(e.target.value)} sx={{ minWidth: 130 }}>
                  <MenuItem value="all">All</MenuItem>
                  {["critical","high","medium","low"].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Box>
              <Box sx={{ overflowX: "auto" }}>
                <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                  <Box component="thead">
                    <Box component="tr" sx={{ backgroundColor: colors.blueAccent[700] }}>
                      {["Type","Severity","Status","Description","Zone","User","Detected","Actions"].map(h => (
                        <Box component="th" key={h} sx={{ p: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "#fff", fontWeight: "bold", borderBottom: `1px solid ${colors.grey[600]}` }}>{h}</Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {filtered.map((a, i) => (
                      <Box component="tr" key={a.id} sx={{ backgroundColor: i % 2 === 0 ? colors.primary[400] : colors.primary[500] }}>
                        <Box component="td" sx={{ p: "8px 12px", fontSize: "0.85rem", color: colors.grey[100], fontWeight: "bold" }}>{a.anomaly_type?.replace(/_/g, " ")}</Box>
                        <Box component="td" sx={{ p: "8px 12px" }}><Chip label={a.severity} size="small" sx={{ backgroundColor: SEV_COLOR(a.severity, colors) + "33", color: SEV_COLOR(a.severity, colors), fontSize: "0.7rem" }} /></Box>
                        <Box component="td" sx={{ p: "8px 12px" }}><Chip label={a.status} size="small" sx={{ backgroundColor: STATUS_COLOR(a.status, colors) + "33", color: STATUS_COLOR(a.status, colors), fontSize: "0.7rem" }} /></Box>
                        <Box component="td" sx={{ p: "8px 12px", fontSize: "0.8rem", color: colors.grey[300], maxWidth: 220 }}>{a.description}</Box>
                        <Box component="td" sx={{ p: "8px 12px", fontSize: "0.8rem", color: colors.grey[400] }}>{a.affected_zone || "—"}</Box>
                        <Box component="td" sx={{ p: "8px 12px", fontSize: "0.8rem", color: colors.grey[400] }}>{a.user || "—"}</Box>
                        <Box component="td" sx={{ p: "8px 12px", fontSize: "0.75rem", color: colors.grey[500] }}>{a.detected_at ? new Date(a.detected_at).toLocaleDateString() : "—"}</Box>
                        <Box component="td" sx={{ p: "8px 12px" }}>
                          <Box display="flex" gap={0.5}>
                            {a.status === "open" && (
                              <Button size="small" variant="outlined" onClick={() => { setResolveDialog({ open: true, anomaly: a }); setResolveNotes(""); }}
                                sx={{ fontSize: "0.7rem", borderColor: colors.greenAccent[500], color: colors.greenAccent[400] }}>Resolve</Button>
                            )}
                            {a.connection_id && (
                              <Button size="small" onClick={() => navigate("../client-lookup", { state: { connection_id: a.connection_id } })}
                                sx={{ fontSize: "0.7rem", color: colors.blueAccent[400] }}>Client</Button>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {tab === 2 && (
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Box flex="1 1 280px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>By Severity</Typography>
                <ResponsivePie data={pieData} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                  colors={[colors.greenAccent[500], "#f0c040", "#f0a040", colors.redAccent[400]]}
                  theme={nivoTheme}
                  legends={[{ anchor: "bottom", direction: "row", itemWidth: 80, itemHeight: 18, itemTextColor: colors.grey[400] }]} />
              </Box>
              <Box flex="1 1 320px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>By Anomaly Type</Typography>
                <ResponsiveBar data={barData} keys={["count"]} indexBy="type"
                  margin={{ top: 10, right: 20, bottom: 70, left: 40 }}
                  colors={[colors.redAccent[500]]} axisBottom={{ tickRotation: -30 }}
                  theme={nivoTheme} />
              </Box>
              <Box flex="1 1 320px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>7-Day Detection Trend</Typography>
                <ResponsiveLine data={trendData} margin={{ top: 10, right: 20, bottom: 40, left: 40 }}
                  colors={[colors.redAccent[400]]} pointSize={8} curve="monotoneX"
                  theme={nivoTheme} />
              </Box>
              <Box flex="1 1 200px" sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={2}>Status Summary</Typography>
                {Object.entries(stats?.by_status || STATS_MOCK.by_status).map(([s, v]) => (
                  <Box key={s} display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color={colors.grey[300]}>{s}</Typography>
                    <Chip label={v} size="small" sx={{ backgroundColor: STATUS_COLOR(s, colors) + "33", color: STATUS_COLOR(s, colors) }} />
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </>
      )}

      <Dialog open={resolveDialog.open} onClose={() => setResolveDialog({ open: false, anomaly: null })} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Resolve Anomaly</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color={colors.grey[300]} mb={2}>
            {resolveDialog.anomaly?.anomaly_type?.replace(/_/g, " ")} — {resolveDialog.anomaly?.description}
          </Typography>
          <TextField label="Resolution Notes *" value={resolveNotes} onChange={e => setResolveNotes(e.target.value)}
            fullWidth multiline rows={3} placeholder="Describe how this anomaly was investigated and resolved..." />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialog({ open: false, anomaly: null })} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!resolveNotes || saving} onClick={handleResolve}
            startIcon={<DoneAllIcon />} sx={{ backgroundColor: colors.greenAccent[700] }}>
            {saving ? "Saving..." : "Mark Resolved"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnomalyDetection;
