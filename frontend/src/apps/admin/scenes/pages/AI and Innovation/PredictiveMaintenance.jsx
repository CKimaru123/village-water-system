import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Chip, Button,
  Grid, Tabs, Tab, TextField, MenuItem, InputAdornment, IconButton, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { useNavigate } from "react-router-dom";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import adminApi from "../../../utils/api";
import BuildIcon from "@mui/icons-material/Build";
import RefreshIcon from "@mui/icons-material/Refresh";
import ScheduleIcon from "@mui/icons-material/Schedule";
import InventoryIcon from "@mui/icons-material/Inventory";
import TimelineIcon from "@mui/icons-material/Timeline";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";

const RISK_COLOR = (r, c) => ({ critical: c.redAccent[400], high: "#f0a040", medium: "#f0c040", low: c.greenAccent[400] }[r] || c.grey[400]);
const RISK_PCT = { critical: 92, high: 70, medium: 45, low: 18 };

const MOCK_PREDICTIONS = [
  { asset_id: 1, asset_name: "Kiambu Main Pump", asset_type: "pump", location: "Kiambu Station A", last_maintenance: "2024-08-15", days_since_maintenance: 252, predicted_risk: "critical", failure_probability: 0.91, predicted_failure_date: "2025-02-10", recommended_action: "Schedule pump maintenance within 7 days", maintenance_history: 4, estimated_cost: 45000 },
  { asset_id: 2, asset_name: "Ruiru Borehole #1", asset_type: "borehole", location: "Ruiru North", last_maintenance: "2024-09-01", days_since_maintenance: 235, predicted_risk: "high", failure_probability: 0.72, predicted_failure_date: "2025-03-01", recommended_action: "Schedule borehole inspection within 30 days", maintenance_history: 6, estimated_cost: 28000 },
  { asset_id: 3, asset_name: "Thika Treatment Plant", asset_type: "treatment_plant", location: "Thika Road", last_maintenance: "2024-10-10", days_since_maintenance: 196, predicted_risk: "high", failure_probability: 0.68, predicted_failure_date: "2025-03-15", recommended_action: "Schedule treatment plant maintenance within 30 days", maintenance_history: 8, estimated_cost: 120000 },
  { asset_id: 4, asset_name: "Githurai Pipeline B", asset_type: "pipeline", location: "Githurai 44", last_maintenance: "2024-11-20", days_since_maintenance: 155, predicted_risk: "medium", failure_probability: 0.44, predicted_failure_date: "2025-05-01", recommended_action: "Schedule pipeline inspection within 60 days", maintenance_history: 3, estimated_cost: 15000 },
  { asset_id: 5, asset_name: "Zone 3 Elevated Tank", asset_type: "tank", location: "Zone 3 - Kahawa", last_maintenance: "2024-12-01", days_since_maintenance: 144, predicted_risk: "medium", failure_probability: 0.38, predicted_failure_date: "2025-05-20", recommended_action: "Schedule tank inspection within 60 days", maintenance_history: 5, estimated_cost: 22000 },
  { asset_id: 6, asset_name: "Juja Valve JJ-V03", asset_type: "valve", location: "Juja Town", last_maintenance: "2025-01-05", days_since_maintenance: 100, predicted_risk: "low", failure_probability: 0.15, predicted_failure_date: "2025-08-01", recommended_action: "Monitor — no immediate action required", maintenance_history: 7, estimated_cost: 5000 },
];

const PredictiveMaintenance = () => {
  const colors = tokens(useTheme().palette.mode);
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [scheduleDialog, setScheduleDialog] = useState({ open: false, asset: null });
  const [schedForm, setSchedForm] = useState({ scheduled_date: "", maintenance_type: "preventive", description: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.get("/admin/ai/maintenance_predictions")
      .then(res => {
        const raw = res?.predictions || res?.data?.predictions;
        setPredictions(Array.isArray(raw) && raw.length > 0 ? raw : MOCK_PREDICTIONS);
      })
      .catch(() => setPredictions(MOCK_PREDICTIONS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSchedule = async () => {
    setSaving(true);
    try {
      await adminApi.post("/admin/maintenance", {
        maintenance: {
          asset_id: scheduleDialog.asset.asset_id,
          scheduled_date: schedForm.scheduled_date,
          maintenance_type: schedForm.maintenance_type,
          description: schedForm.description || scheduleDialog.asset.recommended_action,
        }
      });
    } catch {}
    setSaving(false);
    setScheduleDialog({ open: false, asset: null });
    navigate("../maintenance");
  };

  const filtered = predictions.filter(p => {
    const ms = !search || (p.asset_name + p.asset_type + (p.location || "")).toLowerCase().includes(search.toLowerCase());
    const mr = filterRisk === "all" || p.predicted_risk === filterRisk;
    const mt = filterType === "all" || p.asset_type === filterType;
    return ms && mr && mt;
  });

  const types = [...new Set(predictions.map(p => p.asset_type))];
  const nivoTheme = { axis: { ticks: { text: { fill: colors.grey[400] } } }, grid: { line: { stroke: colors.grey[700] } }, tooltip: { container: { background: colors.primary[400], color: colors.grey[100] } } };

  const pieData = ["critical","high","medium","low"].map(r => ({ id: r, label: r, value: predictions.filter(p => p.predicted_risk === r).length })).filter(d => d.value > 0);
  const barData = types.map(t => ({ type: t.replace(/_/g, " "), count: predictions.filter(p => p.asset_type === t).length }));
  const costData = [{ id: "Est. Cost (KES)", data: predictions.sort((a,b) => b.estimated_cost - a.estimated_cost).slice(0,6).map(p => ({ x: p.asset_name.split(" ").slice(0,2).join(" "), y: p.estimated_cost })) }];

  const kpis = [
    { label: "Critical Risk", value: predictions.filter(p => p.predicted_risk === "critical").length, color: colors.redAccent[400] },
    { label: "High Risk", value: predictions.filter(p => p.predicted_risk === "high").length, color: "#f0a040" },
    { label: "Medium Risk", value: predictions.filter(p => p.predicted_risk === "medium").length, color: "#f0c040" },
    { label: "Total Assets", value: predictions.length, color: colors.blueAccent[400] },
    { label: "Est. Total Cost", value: `KES ${(predictions.reduce((s,p) => s + (p.estimated_cost||0), 0)/1000).toFixed(0)}K`, color: colors.greenAccent[400] },
  ];

  const tabSx = { "& .MuiTab-root": { color: colors.grey[400] }, "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" }, "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] } };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Predictive Maintenance</Typography>
          <Typography variant="h6" color={colors.grey[400]}>AI-driven asset failure risk predictions and maintenance scheduling</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="outlined" startIcon={<InventoryIcon />} onClick={() => navigate("../assets")}
            sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[300] }}>Asset Register</Button>
          <Button variant="contained" startIcon={<ScheduleIcon />} onClick={() => navigate("../maintenance")}
            sx={{ backgroundColor: colors.blueAccent[700], "&:hover": { backgroundColor: colors.blueAccent[600] } }}>
            Maintenance Schedule
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {kpis.map(k => (
          <Card key={k.label} sx={{ flex: "1 1 120px", minWidth: 100, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p: "12px 16px !important" }}>
              <Typography variant="h4" color={k.color} fontWeight="bold">{k.value}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>{k.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {predictions.filter(p => p.predicted_risk === "critical").length > 0 && (
        <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
          <strong>{predictions.filter(p => p.predicted_risk === "critical").length} asset(s) at critical failure risk</strong> — immediate maintenance required.
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...tabSx, mb: 2 }}>
        <Tab label="Risk Dashboard" icon={<DashboardIcon />} iconPosition="start" />
        <Tab label="All Predictions" icon={<ListAltIcon />} iconPosition="start" />
        <Tab label="Analytics" icon={<TimelineIcon />} iconPosition="start" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box> : (
        <>
          {tab === 0 && (
            <Box>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <TextField size="small" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[500] }} /></InputAdornment> }}
                  sx={{ flex: "1 1 200px" }} />
                <TextField select size="small" label="Risk Level" value={filterRisk} onChange={e => setFilterRisk(e.target.value)} sx={{ minWidth: 130 }}>
                  <MenuItem value="all">All Risks</MenuItem>
                  {["critical","high","medium","low"].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Asset Type" value={filterType} onChange={e => setFilterType(e.target.value)} sx={{ minWidth: 150 }}>
                  <MenuItem value="all">All Types</MenuItem>
                  {types.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, " ")}</MenuItem>)}
                </TextField>
              </Box>
              <Grid container spacing={2}>
                {filtered.map(p => (
                  <Grid item xs={12} md={6} key={p.asset_id}>
                    <Card sx={{ backgroundColor: colors.primary[400], borderLeft: `5px solid ${RISK_COLOR(p.predicted_risk, colors)}` }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <BuildIcon sx={{ color: RISK_COLOR(p.predicted_risk, colors) }} />
                            <Box>
                              <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">{p.asset_name}</Typography>
                              <Typography variant="caption" color={colors.grey[500]}>{p.asset_type?.replace(/_/g, " ")} · {p.location}</Typography>
                            </Box>
                          </Box>
                          <Chip label={p.predicted_risk?.toUpperCase()} size="small" sx={{ backgroundColor: RISK_COLOR(p.predicted_risk, colors), color: "#fff", fontWeight: "bold" }} />
                        </Box>

                        <Box mb={1.5}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" color={colors.grey[400]}>Failure Probability</Typography>
                            <Typography variant="caption" color={RISK_COLOR(p.predicted_risk, colors)} fontWeight="bold">
                              {p.failure_probability ? `${(p.failure_probability * 100).toFixed(0)}%` : `${RISK_PCT[p.predicted_risk]}%`}
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate"
                            value={p.failure_probability ? p.failure_probability * 100 : RISK_PCT[p.predicted_risk]}
                            sx={{ height: 8, borderRadius: 4, backgroundColor: colors.primary[300], "& .MuiLinearProgress-bar": { backgroundColor: RISK_COLOR(p.predicted_risk, colors) } }} />
                        </Box>

                        <Box display="flex" gap={3} mb={1} flexWrap="wrap">
                          <Box>
                            <Typography variant="caption" color={colors.grey[500]}>Days Since Maint.</Typography>
                            <Typography variant="body2" color={p.days_since_maintenance > 180 ? colors.redAccent[400] : colors.grey[200]} fontWeight="bold">{p.days_since_maintenance}d</Typography>
                          </Box>
                          {p.predicted_failure_date && (
                            <Box>
                              <Typography variant="caption" color={colors.grey[500]}>Est. Failure Date</Typography>
                              <Typography variant="body2" color={colors.grey[200]} fontWeight="bold">{new Date(p.predicted_failure_date).toLocaleDateString()}</Typography>
                            </Box>
                          )}
                          {p.estimated_cost && (
                            <Box>
                              <Typography variant="caption" color={colors.grey[500]}>Est. Cost</Typography>
                              <Typography variant="body2" color={colors.greenAccent[400]} fontWeight="bold">KES {p.estimated_cost?.toLocaleString()}</Typography>
                            </Box>
                          )}
                        </Box>

                        <Typography variant="body2" color={colors.grey[300]} mb={1.5} sx={{ fontStyle: "italic" }}>
                          💡 {p.recommended_action}
                        </Typography>

                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Button size="small" variant="contained" startIcon={<ScheduleIcon />}
                            onClick={() => { setScheduleDialog({ open: true, asset: p }); setSchedForm({ scheduled_date: "", maintenance_type: "preventive", description: p.recommended_action }); }}
                            sx={{ fontSize: "0.75rem", backgroundColor: colors.blueAccent[700] }}>
                            Schedule Maintenance
                          </Button>
                          <Button size="small" variant="outlined" startIcon={<InventoryIcon />}
                            onClick={() => navigate("../assets", { state: { asset_id: p.asset_id } })}
                            sx={{ fontSize: "0.75rem", borderColor: colors.grey[600], color: colors.grey[300] }}>
                            View Asset
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ overflowX: "auto" }}>
              <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                <Box component="thead">
                  <Box component="tr" sx={{ backgroundColor: colors.blueAccent[700] }}>
                    {["Asset","Type","Location","Risk","Probability","Days Since Maint.","Est. Failure","Est. Cost","Actions"].map(h => (
                      <Box component="th" key={h} sx={{ p: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "#fff", fontWeight: "bold", borderBottom: `1px solid ${colors.grey[600]}` }}>{h}</Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {predictions.map((p, i) => (
                    <Box component="tr" key={p.asset_id} sx={{ backgroundColor: i % 2 === 0 ? colors.primary[400] : colors.primary[500] }}>
                      <Box component="td" sx={{ p: "8px 12px", fontSize: "0.85rem", color: colors.grey[100], fontWeight: "bold" }}>{p.asset_name}</Box>
                      <Box component="td" sx={{ p: "8px 12px", fontSize: "0.8rem", color: colors.grey[300] }}>{p.asset_type?.replace(/_/g, " ")}</Box>
                      <Box component="td" sx={{ p: "8px 12px", fontSize: "0.8rem", color: colors.grey[400] }}>{p.location}</Box>
                      <Box component="td" sx={{ p: "8px 12px" }}><Chip label={p.predicted_risk} size="small" sx={{ backgroundColor: RISK_COLOR(p.predicted_risk, colors) + "33", color: RISK_COLOR(p.predicted_risk, colors), fontSize: "0.7rem" }} /></Box>
                      <Box component="td" sx={{ p: "8px 12px", fontSize: "0.85rem", color: RISK_COLOR(p.predicted_risk, colors), fontWeight: "bold" }}>{p.failure_probability ? `${(p.failure_probability * 100).toFixed(0)}%` : `${RISK_PCT[p.predicted_risk]}%`}</Box>
                      <Box component="td" sx={{ p: "8px 12px", fontSize: "0.85rem", color: p.days_since_maintenance > 180 ? colors.redAccent[400] : colors.grey[300] }}>{p.days_since_maintenance}d</Box>
                      <Box component="td" sx={{ p: "8px 12px", fontSize: "0.8rem", color: colors.grey[400] }}>{p.predicted_failure_date ? new Date(p.predicted_failure_date).toLocaleDateString() : "—"}</Box>
                      <Box component="td" sx={{ p: "8px 12px", fontSize: "0.8rem", color: colors.greenAccent[400] }}>KES {p.estimated_cost?.toLocaleString() || "—"}</Box>
                      <Box component="td" sx={{ p: "8px 12px" }}>
                        <Button size="small" variant="outlined" onClick={() => { setScheduleDialog({ open: true, asset: p }); setSchedForm({ scheduled_date: "", maintenance_type: "preventive", description: p.recommended_action }); }}
                          sx={{ fontSize: "0.7rem", borderColor: colors.blueAccent[500], color: colors.blueAccent[300] }}>Schedule</Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          {tab === 2 && (
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Box flex="1 1 260px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Risk Distribution</Typography>
                <ResponsivePie data={pieData} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                  colors={[colors.greenAccent[500], "#f0c040", "#f0a040", colors.redAccent[400]]}
                  theme={nivoTheme}
                  legends={[{ anchor: "bottom", direction: "row", itemWidth: 80, itemHeight: 18, itemTextColor: colors.grey[400] }]} />
              </Box>
              <Box flex="1 1 300px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Assets by Type</Typography>
                <ResponsiveBar data={barData} keys={["count"]} indexBy="type"
                  margin={{ top: 10, right: 20, bottom: 60, left: 40 }}
                  colors={[colors.blueAccent[500]]} axisBottom={{ tickRotation: -20 }}
                  theme={nivoTheme} />
              </Box>
              <Box flex="1 1 340px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Estimated Maintenance Cost (Top 6)</Typography>
                <ResponsiveLine data={costData} margin={{ top: 10, right: 20, bottom: 60, left: 70 }}
                  colors={[colors.greenAccent[400]]} pointSize={8} curve="monotoneX"
                  axisBottom={{ tickRotation: -25 }}
                  axisLeft={{ legend: "KES", legendOffset: -60, legendPosition: "middle" }}
                  theme={nivoTheme} />
              </Box>
            </Box>
          )}
        </>
      )}

      <Dialog open={scheduleDialog.open} onClose={() => setScheduleDialog({ open: false, asset: null })} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Schedule Maintenance — {scheduleDialog.asset?.asset_name}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Alert severity="warning" sx={{ fontSize: "0.85rem" }}>
              Risk: <strong>{scheduleDialog.asset?.predicted_risk?.toUpperCase()}</strong> · {scheduleDialog.asset?.recommended_action}
            </Alert>
            <TextField label="Scheduled Date *" type="date" value={schedForm.scheduled_date}
              onChange={e => setSchedForm(f => ({ ...f, scheduled_date: e.target.value }))}
              fullWidth InputLabelProps={{ shrink: true }} />
            <TextField select label="Maintenance Type" value={schedForm.maintenance_type}
              onChange={e => setSchedForm(f => ({ ...f, maintenance_type: e.target.value }))} fullWidth>
              {["preventive","corrective","inspection","overhaul"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Description" value={schedForm.description}
              onChange={e => setSchedForm(f => ({ ...f, description: e.target.value }))}
              fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialog({ open: false, asset: null })} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!schedForm.scheduled_date || saving} onClick={handleSchedule}
            startIcon={<ScheduleIcon />} sx={{ backgroundColor: colors.blueAccent[700] }}>
            {saving ? "Scheduling..." : "Schedule"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PredictiveMaintenance;
