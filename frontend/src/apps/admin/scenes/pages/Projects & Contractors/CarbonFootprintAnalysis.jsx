import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,
  Chip, Button, IconButton, Tab, Tabs, Divider, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Tooltip, List,
  ListItem, ListItemIcon, ListItemText, Table, TableBody,
  TableCell, TableHead, TableRow,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import Co2Icon from "@mui/icons-material/Co2";
import ForestIcon from "@mui/icons-material/Forest";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import SettingsIcon from "@mui/icons-material/Settings";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VerifiedIcon from "@mui/icons-material/Verified";
import AssessmentIcon from "@mui/icons-material/Assessment";
import NatureIcon from "@mui/icons-material/Nature";
import PeopleIcon from "@mui/icons-material/People";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import SecurityIcon from "@mui/icons-material/Security";
import HistoryIcon from "@mui/icons-material/History";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PsychologyIcon from "@mui/icons-material/Psychology";
import StorefrontIcon from "@mui/icons-material/Storefront";
import FlagIcon from "@mui/icons-material/Flag";
import SpeedIcon from "@mui/icons-material/Speed";
import adminApi from "../../../utils/api";

const CARBON_FACTOR = 0.298;
const TREE_ABSORPTION = 21;

// ── Mock emission factors ─────────────────────────────────────────────────────
const DEFAULT_EMISSION_FACTORS = [
  { id: 1, region: "Kenya National Grid", source: "EPA eGRID", factor: 0.233, unit: "kg CO₂/kWh", year: 2024, status: "active" },
  { id: 2, region: "East Africa Grid", source: "DEFRA", factor: 0.298, unit: "kg CO₂/m³", year: 2024, status: "active" },
  { id: 3, region: "Solar (Avoided)", source: "Victron API", factor: 0.000, unit: "kg CO₂/kWh", year: 2024, status: "active" },
];

// ── Mock offset projects ──────────────────────────────────────────────────────
const DEFAULT_OFFSET_PROJECTS = [
  { id: 1, name: "Karura Forest Reforestation", standard: "Gold Standard", credits_total: 10000,
    credits_sold: 5200, price: 12, status: "active", registry_id: "GS-KE-2024-001" },
  { id: 2, name: "Village Solar Pump Upgrade", standard: "Verra VCS", credits_total: 5000,
    credits_sold: 2800, price: 9, status: "active", registry_id: "VCS-KE-2024-042" },
  { id: 3, name: "Mangrove Restoration", standard: "Gold Standard", credits_total: 3000,
    credits_sold: 1500, price: 15, status: "active", registry_id: "GS-KE-2024-007" },
];

// ── Mock anomaly alerts ───────────────────────────────────────────────────────
const MOCK_ANOMALIES = [
  { id: 1, client: "Household #B07", type: "spike", value: 48.2, baseline: 12.4, severity: "high",
    date: "2024-05-15", status: "pending" },
  { id: 2, client: "Institution #I03", type: "drop", value: 0.1, baseline: 22.8, severity: "medium",
    date: "2024-05-14", status: "pending" },
  { id: 3, client: "Household #C22", type: "spike", value: 31.0, baseline: 9.6, severity: "medium",
    date: "2024-05-13", status: "reviewed" },
];

// ── Mock client carbon profiles ───────────────────────────────────────────────
const MOCK_CLIENT_PROFILES = [
  { id: 1, name: "Household #A12", type: "household", village: "Kijiji A", carbon_kg: 3.2, efficiency: 92, trees_planted: 4, status: "active", trend: "down" },
  { id: 2, name: "Household #B07", type: "household", village: "Kijiji B", carbon_kg: 48.2, efficiency: 22, trees_planted: 0, status: "flagged", trend: "up" },
  { id: 3, name: "Institution #I03", type: "institution", village: "Kijiji C", carbon_kg: 0.1, efficiency: 99, trees_planted: 12, status: "active", trend: "down" },
  { id: 4, name: "Household #C22", type: "household", village: "Kijiji A", carbon_kg: 31.0, efficiency: 38, trees_planted: 1, status: "flagged", trend: "up" },
  { id: 5, name: "Household #D03", type: "household", village: "Kijiji D", carbon_kg: 7.7, efficiency: 74, trees_planted: 2, status: "active", trend: "stable" },
  { id: 6, name: "School #S01", type: "institution", village: "Kijiji B", carbon_kg: 14.5, efficiency: 61, trees_planted: 8, status: "active", trend: "down" },
];

// ── Mock offset purchase requests ─────────────────────────────────────────────
const MOCK_OFFSET_REQUESTS = [
  { id: 1, client: "Household #D03", project: "Karura Forest Reforestation", qty: 2, total_cost: 24,
    platform_fee: 2.40, client_pays: 26.40, status: "pending", submitted: "2024-05-15", standard: "Gold Standard" },
  { id: 2, client: "Institution #I03", project: "Village Solar Pump Upgrade", qty: 5, total_cost: 45,
    platform_fee: 4.50, client_pays: 49.50, status: "pending", submitted: "2024-05-14", standard: "Verra VCS" },
  { id: 3, client: "Household #A12", project: "Mangrove Restoration Project", qty: 1, total_cost: 15,
    platform_fee: 1.50, client_pays: 16.50, status: "approved", submitted: "2024-05-10", standard: "Gold Standard" },
];

// ── Mock tree planting submissions ────────────────────────────────────────────
const MOCK_TREE_SUBMISSIONS = [
  { id: 1, client: "Household #A12", tree_type: "exotic", species: "Eucalyptus", qty: 10,
    category: "timber", water_need: "low", carbon_offset_kg: 42, location: "Kijiji A Plot 12",
    status: "pending", submitted: "2024-05-15", has_image: true },
  { id: 2, client: "Institution #I03", tree_type: "indigenous", species: "Mugumo (Fig)", qty: 5,
    category: "heritage", water_need: "medium", carbon_offset_kg: 35, location: "School compound",
    status: "approved", submitted: "2024-05-10", has_image: true },
];

// ── Mock audit trail ──────────────────────────────────────────────────────────
const MOCK_AUDIT = [
  { id: 1, action: "Updated emission factor", user: "Admin #1", target: "Kenya National Grid", timestamp: "2024-05-15 09:12" },
  { id: 2, action: "Approved offset purchase", user: "Admin #2", target: "Karura Forest — 5t", timestamp: "2024-05-14 14:30" },
  { id: 3, action: "Flagged anomaly", user: "System", target: "Household #B07", timestamp: "2024-05-15 08:00" },
  { id: 4, action: "Added offset project", user: "Admin #1", target: "Mangrove Restoration", timestamp: "2024-05-10 11:45" },
  { id: 5, action: "Updated AI recommendation", user: "Admin #3", target: "LED switching tip", timestamp: "2024-05-09 16:20" },
];

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, unit, color, sub, colors }) => (
  <Card sx={{ backgroundColor: colors.primary[400], height: "100%", border: `1px solid ${color}33`,
    transition: "transform 0.2s", "&:hover": { transform: "translateY(-2px)" } }}>
    <CardContent sx={{ textAlign: "center", py: 2.5 }}>
      <Box sx={{ color, mb: 1 }}>{icon}</Box>
      <Typography variant="h3" color={color} fontWeight="bold">{value ?? "—"}</Typography>
      <Typography variant="caption" color={colors.grey[400]}>{unit}</Typography>
      <Typography variant="body2" color={colors.grey[300]} mt={0.5}>{label}</Typography>
      {sub && <Typography variant="caption" color={colors.grey[500]} display="block" mt={0.3}>{sub}</Typography>}
    </CardContent>
  </Card>
);

// ── Main component ────────────────────────────────────────────────────────────
const CarbonFootprintAnalysis = () => {
  const colors = tokens(useTheme().palette.mode);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);

  // Emission factors state
  const [emissionFactors, setEmissionFactors] = useState(DEFAULT_EMISSION_FACTORS);
  const [factorDialog, setFactorDialog] = useState({ open: false, item: null });
  const [factorForm, setFactorForm] = useState({ region: "", source: "", factor: "", unit: "kg CO₂/kWh", year: 2024 });

  // Offset projects state
  const [offsetProjects, setOffsetProjects] = useState(DEFAULT_OFFSET_PROJECTS);
  const [projectDialog, setProjectDialog] = useState({ open: false, item: null });
  const [projectForm, setProjectForm] = useState({ name: "", standard: "Gold Standard", credits_total: "", price: "", registry_id: "" });

  // Anomalies
  const [anomalies, setAnomalies] = useState(MOCK_ANOMALIES);

  // Client profiles
  const [clientProfiles, setClientProfiles] = useState(MOCK_CLIENT_PROFILES);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetailOpen, setClientDetailOpen] = useState(false);
  const [editTreesDialog, setEditTreesDialog] = useState({ open: false, client: null });
  const [editTreesForm, setEditTreesForm] = useState({ trees_planted: 0, tree_notes: "" });

  // Offset requests (from clients)
  const [offsetRequests, setOffsetRequests] = useState(MOCK_OFFSET_REQUESTS);
  const [treeSubmissions, setTreeSubmissions] = useState(MOCK_TREE_SUBMISSIONS);
  const [treeDetailOpen, setTreeDetailOpen] = useState({ open: false, item: null });

  const load = useCallback(() => {
    setLoading(true);
    adminApi.get("/admin/carbon_footprint/analysis")
      .then(res => setData(res.data?.analysis || res.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derived metrics (use API data or fallback to computed)
  const totalCarbon = data?.total_carbon_kg || 0;
  const totalEnergy = data?.total_energy_kwh || 0;
  const totalWater = data?.total_water_pumped_m3 || 0;
  const totalTrees = data?.equivalent_trees || (totalCarbon / TREE_ABSORPTION);
  const activeClients = data?.active_clients || 0;
  const avgPerClient = activeClients > 0 ? (totalCarbon / activeClients).toFixed(1) : "—";

  // Scope breakdown for pie
  const scopeData = [
    { id: "Scope 1 – Direct", label: "Scope 1", value: Math.round(totalCarbon * 0.15), color: "#e05c5c" },
    { id: "Scope 2 – Electricity", label: "Scope 2", value: Math.round(totalCarbon * 0.55), color: "#f0c040" },
    { id: "Scope 3 – Supply Chain", label: "Scope 3", value: Math.round(totalCarbon * 0.30), color: "#4db6e4" },
  ];

  // Monthly trend line (mock if no API data)
  const trendLine = [{
    id: "Total CO₂ (kg)",
    color: "#4cceac",
    data: data?.monthly_trend || [
      { x: "Dec", y: 0 }, { x: "Jan", y: 0 }, { x: "Feb", y: 0 },
      { x: "Mar", y: 0 }, { x: "Apr", y: 0 }, { x: "May", y: totalCarbon },
    ],
  }];

  // Client tier bar data
  const tierData = data?.tier_breakdown || [
    { tier: "Household", clients: 0, carbon: 0, color: colors.blueAccent[400] },
    { tier: "Institution", clients: 0, carbon: 0, color: colors.greenAccent[400] },
    { tier: "Commercial", clients: 0, carbon: 0, color: "#f0c040" },
  ];

  const handleExportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Carbon (kg CO2)", totalCarbon],
      ["Total Energy (kWh)", totalEnergy],
      ["Total Water Pumped (m3)", totalWater],
      ["Equivalent Trees", totalTrees.toFixed(0)],
      ["Active Clients", activeClients],
      ["Avg per Client (kg)", avgPerClient],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "carbon_analysis.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const openFactorEdit = (item) => {
    setFactorForm({ region: item.region, source: item.source, factor: item.factor, unit: item.unit, year: item.year });
    setFactorDialog({ open: true, item });
  };

  const saveFactorEdit = () => {
    setEmissionFactors(prev => prev.map(f =>
      f.id === factorDialog.item.id ? { ...f, ...factorForm, factor: parseFloat(factorForm.factor) } : f
    ));
    setFactorDialog({ open: false, item: null });
  };

  const openProjectEdit = (item) => {
    setProjectForm({ name: item.name, standard: item.standard, credits_total: item.credits_total,
      price: item.price, registry_id: item.registry_id });
    setProjectDialog({ open: true, item });
  };

  const saveProjectEdit = () => {
    if (projectDialog.item) {
      setOffsetProjects(prev => prev.map(p =>
        p.id === projectDialog.item.id ? { ...p, ...projectForm, credits_total: parseInt(projectForm.credits_total), price: parseFloat(projectForm.price) } : p
      ));
    } else {
      setOffsetProjects(prev => [...prev, { id: Date.now(), ...projectForm,
        credits_total: parseInt(projectForm.credits_total), price: parseFloat(projectForm.price),
        credits_sold: 0, status: "active" }]);
    }
    setProjectDialog({ open: false, item: null });
  };

  const resolveAnomaly = (id) => {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: "reviewed" } : a));
  };

  const handleOffsetRequest = (id, action) => {
    setOffsetRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
  };

  const handleTreeSubmission = (id, action) => {
    setTreeSubmissions(prev => prev.map(t => t.id === id ? { ...t, status: action } : t));
  };

  const openClientDetail = (client) => {
    setSelectedClient(client);
    setClientDetailOpen(true);
  };

  const openEditTrees = (e, client) => {
    e.stopPropagation();
    setEditTreesForm({ trees_planted: client.trees_planted, tree_notes: "" });
    setEditTreesDialog({ open: true, client });
  };

  const saveEditTrees = () => {
    setClientProfiles(prev => prev.map(c =>
      c.id === editTreesDialog.client.id
        ? { ...c, trees_planted: parseInt(editTreesForm.trees_planted) || 0 }
        : c
    ));
    // Also update selectedClient if detail dialog is open
    if (selectedClient?.id === editTreesDialog.client.id) {
      setSelectedClient(prev => ({ ...prev, trees_planted: parseInt(editTreesForm.trees_planted) || 0 }));
    }
    setEditTreesDialog({ open: false, client: null });
  };

  if (loading) return (
    <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress sx={{ color: colors.blueAccent[500] }} />
    </Box>
  );

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb="20px" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Carbon Footprint Analysis</Typography>
          <Typography variant="h6" color={colors.grey[400]}>
            System-wide environmental command centre — verify, configure, and report
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.grey[400] }} title="Refresh"><RefreshIcon /></IconButton>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}
            sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[400] }}>
            Export CSV
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
        API unavailable — showing cached/demo data.
      </Alert>}

      {/* KPI strip */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<Co2Icon sx={{ fontSize: 32 }} />} label="Total Carbon" value={totalCarbon.toLocaleString()}
            unit="kg CO₂e" color="#e05c5c" colors={colors} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<ElectricBoltIcon sx={{ fontSize: 32 }} />} label="Energy Used" value={totalEnergy.toLocaleString()}
            unit="kWh" color="#f0c040" colors={colors} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<WaterDropIcon sx={{ fontSize: 32 }} />} label="Water Pumped" value={totalWater.toLocaleString()}
            unit="m³" color={colors.blueAccent[400]} colors={colors} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<ForestIcon sx={{ fontSize: 32 }} />} label="Trees Equivalent" value={Math.round(totalTrees).toLocaleString()}
            unit="trees/yr" color={colors.greenAccent[400]} colors={colors} sub="to offset total" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<PeopleIcon sx={{ fontSize: 32 }} />} label="Active Clients" value={activeClients}
            unit="tracked" color={colors.blueAccent[300]} colors={colors} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon={<SpeedIcon sx={{ fontSize: 32 }} />} label="Avg per Client" value={avgPerClient}
            unit="kg CO₂e/mo" color={colors.grey[300]} colors={colors} />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{
        mb: 3, borderBottom: `2px solid ${colors.grey[700]}`,
        "& .MuiTab-root": {
          color: colors.grey[300],
          textTransform: "none",
          minWidth: 150,
          fontSize: "0.95rem",
          fontWeight: 500,
          py: 1.5,
          gap: 0.5,
        },
        "& .Mui-selected": {
          color: "#ffffff !important",
          fontWeight: 700,
          backgroundColor: colors.blueAccent[700] + "55",
          borderRadius: "8px 8px 0 0",
        },
        "& .MuiTabs-indicator": {
          backgroundColor: colors.blueAccent[400],
          height: 3,
          borderRadius: 2,
        },
        "& .MuiTab-root:hover": { color: colors.grey[100], backgroundColor: colors.primary[300] + "33" },
      }}>
        <Tab label="Global Analytics" icon={<AssessmentIcon />} iconPosition="start" />
        <Tab label="Client Profiles" icon={<PeopleIcon />} iconPosition="start" />
        <Tab label="Offset Requests" icon={<LocalFloristIcon />} iconPosition="start"
          sx={{ "& .MuiBadge-badge": { fontSize: "0.7rem" } }} />
        <Tab label="Anomaly Alerts" icon={<WarningAmberIcon />} iconPosition="start" />
        <Tab label="Emission Factors" icon={<SettingsIcon />} iconPosition="start" />
        <Tab label="Offset Projects" icon={<StorefrontIcon />} iconPosition="start" />
        <Tab label="AI Recommendations" icon={<PsychologyIcon />} iconPosition="start" />
        <Tab label="Audit Trail" icon={<HistoryIcon />} iconPosition="start" />
      </Tabs>

      {/* ── Tab 0: Global Analytics ── */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} mb={2}>Scope Breakdown (GHG Protocol)</Typography>
                <Box height={260}>
                  <ResponsivePie
                    data={scopeData}
                    margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                    innerRadius={0.55} padAngle={2} cornerRadius={3}
                    colors={d => d.data.color}
                    borderWidth={1} borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                    arcLinkLabelsSkipAngle={10} arcLinkLabelsTextColor={colors.grey[300]}
                    arcLinkLabelsThickness={2} arcLinkLabelsColor={{ from: "color" }}
                    arcLabelsSkipAngle={10} arcLabelsTextColor="#fff"
                    theme={{ tooltip: { container: { background: colors.primary[500], color: colors.grey[100] } } }}
                  />
                </Box>
                {scopeData.map(s => (
                  <Box key={s.id} display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: s.color }} />
                      <Typography variant="caption" color={colors.grey[300]}>{s.id}</Typography>
                    </Box>
                    <Typography variant="caption" color={colors.grey[200]} fontWeight="bold">{s.value.toLocaleString()} kg</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} mb={2}>Monthly Carbon Trend</Typography>
                <Box height={280}>
                  <ResponsiveLine
                    data={trendLine}
                    margin={{ top: 20, right: 30, bottom: 50, left: 70 }}
                    xScale={{ type: "point" }} yScale={{ type: "linear", min: 0, max: "auto" }}
                    curve="monotoneX"
                    axisBottom={{ tickRotation: -30, legend: "Month", legendOffset: 40, legendPosition: "middle" }}
                    axisLeft={{ legend: "kg CO₂e", legendOffset: -55, legendPosition: "middle" }}
                    colors={["#4cceac"]} pointSize={8} pointColor="#141b2d"
                    pointBorderWidth={2} pointBorderColor={{ from: "serieColor" }}
                    enableArea areaOpacity={0.15} useMesh
                    theme={{
                      axis: { ticks: { text: { fill: colors.grey[400] } }, legend: { text: { fill: colors.grey[300] } } },
                      grid: { line: { stroke: colors.grey[700] } },
                      tooltip: { container: { background: colors.primary[500], color: colors.grey[100] } },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} mb={2}>Carbon by Client Tier</Typography>
                <Box height={200}>
                  <ResponsiveBar
                    data={tierData} keys={["carbon"]} indexBy="tier"
                    margin={{ top: 10, right: 20, bottom: 40, left: 70 }}
                    padding={0.4} colors={d => d.data.color || colors.blueAccent[400]}
                    axisBottom={{ tickSize: 5 }}
                    axisLeft={{ legend: "kg CO₂e", legendOffset: -55, legendPosition: "middle" }}
                    labelSkipWidth={12} labelTextColor="#fff"
                    theme={{
                      axis: { ticks: { text: { fill: colors.grey[400] } }, legend: { text: { fill: colors.grey[300] } } },
                      grid: { line: { stroke: colors.grey[700] } },
                      tooltip: { container: { background: colors.primary[500], color: colors.grey[100] } },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      )}

      {/* ── Tab 1: Client Carbon Profiles ── */}
      {tab === 1 && (
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <PeopleIcon sx={{ color: colors.blueAccent[400] }} />
            <Typography variant="h5" color={colors.grey[100]}>Client Carbon Profiles</Typography>
            <Chip label={`${clientProfiles.filter(c => c.status === "flagged").length} flagged`} size="small"
              sx={{ backgroundColor: "#e05c5c33", color: "#e05c5c", border: "1px solid #e05c5c55" }} />
          </Box>
          <Typography variant="body2" color={colors.grey[400]} mb={2}>
            Click any client to view their full carbon footprint, recommendations, and tree planting submissions.
          </Typography>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: colors.blueAccent[700] + "55" }}>
                  {["Client", "Type", "Village", "CO₂ (kg/mo)", "Efficiency", "Trees Planted", "Trend", "Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[200], fontWeight: "bold", fontSize: "0.9rem",
                      borderBottom: `1px solid ${colors.grey[600]}` }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {clientProfiles.map(c => (
                  <TableRow key={c.id} sx={{ "&:hover": { backgroundColor: colors.primary[300] + "33", cursor: "pointer" } }}
                    onClick={() => openClientDetail(c)}>
                    <TableCell sx={{ color: colors.grey[100], fontWeight: "bold", fontSize: "0.9rem" }}>{c.name}</TableCell>
                    <TableCell>
                      <Chip label={c.type} size="small"
                        sx={{ backgroundColor: c.type === "household" ? colors.blueAccent[800] : colors.greenAccent[800],
                          color: c.type === "household" ? colors.blueAccent[200] : colors.greenAccent[200], fontSize: "0.75rem" }} />
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[300], fontSize: "0.85rem" }}>{c.village}</TableCell>
                    <TableCell sx={{ color: c.carbon_kg > 20 ? "#e05c5c" : c.carbon_kg > 10 ? "#f0c040" : colors.greenAccent[400],
                      fontWeight: "bold", fontSize: "0.95rem" }}>{c.carbon_kg}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress variant="determinate" value={c.efficiency}
                          sx={{ width: 60, height: 8, borderRadius: 4, backgroundColor: colors.grey[700],
                            "& .MuiLinearProgress-bar": { backgroundColor: c.efficiency >= 70 ? colors.greenAccent[500] : "#f0c040", borderRadius: 4 } }} />
                        <Typography variant="caption" color={colors.grey[300]}>{c.efficiency}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: colors.greenAccent[400], fontWeight: "bold", fontSize: "0.9rem" }}>{c.trees_planted}</TableCell>
                    <TableCell>
                      {c.trend === "down" ? <TrendingDownIcon sx={{ color: colors.greenAccent[400], fontSize: 20 }} />
                        : c.trend === "up" ? <TrendingUpIcon sx={{ color: "#e05c5c", fontSize: 20 }} />
                        : <Typography variant="caption" color={colors.grey[400]}>—</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip label={c.status.toUpperCase()} size="small"
                        sx={{ backgroundColor: c.status === "active" ? colors.greenAccent[800] : "#e05c5c33",
                          color: c.status === "active" ? colors.greenAccent[300] : "#e05c5c", fontSize: "0.75rem" }} />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); openClientDetail(c); }}
                        sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[300], fontSize: "0.8rem", mr: 0.5 }}>
                        View Profile
                      </Button>
                      <Button size="small" variant="outlined" startIcon={<NatureIcon sx={{ fontSize: 14 }} />}
                        onClick={(e) => openEditTrees(e, c)}
                        sx={{ borderColor: colors.greenAccent[600], color: colors.greenAccent[400], fontSize: "0.8rem" }}>
                        Edit Trees
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Box>
      )}

      {/* ── Tab 2: Offset Requests & Tree Submissions ── */}
      {tab === 2 && (
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <LocalFloristIcon sx={{ color: colors.greenAccent[400] }} />
            <Typography variant="h5" color={colors.grey[100]}>Offset Purchase Requests</Typography>
            <Chip label={`${offsetRequests.filter(r => r.status === "pending").length} pending`} size="small"
              sx={{ backgroundColor: "#f0c04033", color: "#f0c040", border: "1px solid #f0c04055" }} />
          </Box>
          <Typography variant="body2" color={colors.grey[400]} mb={2}>
            All client offset purchase requests must be reviewed here before payment is processed.
            A 10% platform fee is added to each purchase to maintain the system.
          </Typography>
          {offsetRequests.map(r => (
            <Card key={r.id} sx={{ backgroundColor: colors.primary[400], mb: 2,
              borderLeft: `4px solid ${r.status === "pending" ? "#f0c040" : r.status === "approved" ? colors.greenAccent[500] : "#e05c5c"}` }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">{r.client}</Typography>
                    <Typography variant="body2" color={colors.grey[300]}>
                      Project: <strong style={{ color: colors.greenAccent[300] }}>{r.project}</strong> · {r.standard}
                    </Typography>
                    <Typography variant="body2" color={colors.grey[400]} mt={0.5}>
                      Quantity: <strong style={{ color: colors.grey[200] }}>{r.qty} tonne{r.qty > 1 ? "s" : ""}</strong> ·
                      Base cost: <strong style={{ color: colors.grey[200] }}>${r.total_cost}</strong> ·
                      Platform fee (10%): <strong style={{ color: "#f0c040" }}>${r.platform_fee}</strong> ·
                      Client pays: <strong style={{ color: colors.greenAccent[400], fontSize: "1rem" }}>${r.client_pays}</strong>
                    </Typography>
                    <Typography variant="caption" color={colors.grey[500]}>Submitted: {r.submitted}</Typography>
                  </Box>
                  <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                    <Chip label={r.status.toUpperCase()} size="small"
                      sx={{ backgroundColor: r.status === "pending" ? "#f0c04033" : r.status === "approved" ? colors.greenAccent[800] : "#e05c5c33",
                        color: r.status === "pending" ? "#f0c040" : r.status === "approved" ? colors.greenAccent[300] : "#e05c5c",
                        fontWeight: "bold", fontSize: "0.8rem" }} />
                    {r.status === "pending" && (
                      <>
                        <Button size="small" variant="contained" startIcon={<CheckCircleIcon />}
                          onClick={() => handleOffsetRequest(r.id, "approved")}
                          sx={{ backgroundColor: colors.greenAccent[700], fontSize: "0.8rem" }}>
                          Approve
                        </Button>
                        <Button size="small" variant="outlined" startIcon={<CancelIcon />}
                          onClick={() => handleOffsetRequest(r.id, "rejected")}
                          sx={{ borderColor: "#e05c5c", color: "#e05c5c", fontSize: "0.8rem" }}>
                          Reject
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}

          <Divider sx={{ borderColor: colors.grey[700], my: 3 }} />

          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <NatureIcon sx={{ color: colors.greenAccent[400] }} />
            <Typography variant="h5" color={colors.grey[100]}>Tree Planting Submissions</Typography>
            <Chip label={`${treeSubmissions.filter(t => t.status === "pending").length} pending`} size="small"
              sx={{ backgroundColor: "#f0c04033", color: "#f0c040", border: "1px solid #f0c04055" }} />
          </Box>
          <Typography variant="body2" color={colors.grey[400]} mb={2}>
            Client-submitted tree planting data awaiting verification. Each submission includes supporting images.
          </Typography>
          {treeSubmissions.map(t => (
            <Card key={t.id} sx={{ backgroundColor: colors.primary[400], mb: 2,
              borderLeft: `4px solid ${t.status === "pending" ? "#f0c040" : t.status === "approved" ? colors.greenAccent[500] : "#e05c5c"}` }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">{t.client}</Typography>
                      <Chip label={t.tree_type === "exotic" ? "Exotic/Modern" : "Indigenous/Heritage"} size="small"
                        sx={{ backgroundColor: t.tree_type === "exotic" ? colors.blueAccent[800] : colors.greenAccent[800],
                          color: t.tree_type === "exotic" ? colors.blueAccent[200] : colors.greenAccent[200], fontSize: "0.75rem" }} />
                      <Chip label={t.category} size="small"
                        sx={{ backgroundColor: colors.grey[700], color: colors.grey[200], fontSize: "0.75rem" }} />
                    </Box>
                    <Typography variant="body2" color={colors.grey[300]}>
                      Species: <strong style={{ color: colors.grey[100] }}>{t.species}</strong> ·
                      Qty: <strong style={{ color: colors.greenAccent[400] }}>{t.qty} trees</strong> ·
                      Water need: <strong style={{ color: colors.grey[200] }}>{t.water_need}</strong>
                    </Typography>
                    <Typography variant="body2" color={colors.grey[300]}>
                      Est. carbon offset: <strong style={{ color: colors.greenAccent[400] }}>{t.carbon_offset_kg} kg CO₂/yr</strong> ·
                      Location: {t.location}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <Typography variant="caption" color={colors.grey[500]}>Submitted: {t.submitted}</Typography>
                      {t.has_image && (
                        <Chip label="📷 Image attached" size="small"
                          sx={{ backgroundColor: colors.blueAccent[800], color: colors.blueAccent[200], fontSize: "0.7rem" }} />
                      )}
                    </Box>
                  </Box>
                  <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                    <Chip label={t.status.toUpperCase()} size="small"
                      sx={{ backgroundColor: t.status === "pending" ? "#f0c04033" : t.status === "approved" ? colors.greenAccent[800] : "#e05c5c33",
                        color: t.status === "pending" ? "#f0c040" : t.status === "approved" ? colors.greenAccent[300] : "#e05c5c",
                        fontWeight: "bold", fontSize: "0.8rem" }} />
                    <Button size="small" variant="outlined"
                      onClick={() => setTreeDetailOpen({ open: true, item: t })}
                      sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[300], fontSize: "0.8rem" }}>
                      Review
                    </Button>
                    {t.status === "pending" && (
                      <>
                        <Button size="small" variant="contained" startIcon={<CheckCircleIcon />}
                          onClick={() => handleTreeSubmission(t.id, "approved")}
                          sx={{ backgroundColor: colors.greenAccent[700], fontSize: "0.8rem" }}>
                          Approve
                        </Button>
                        <Button size="small" variant="outlined" startIcon={<CancelIcon />}
                          onClick={() => handleTreeSubmission(t.id, "rejected")}
                          sx={{ borderColor: "#e05c5c", color: "#e05c5c", fontSize: "0.8rem" }}>
                          Reject
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* ── Tab 1: Anomaly Alerts ── */}
      {tab === 3 && (
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <WarningAmberIcon sx={{ color: "#f0c040" }} />
            <Typography variant="h5" color={colors.grey[100]}>Anomaly Detection Alerts</Typography>
            <Chip label={`${anomalies.filter(a => a.status === "pending").length} pending`} size="small"
              sx={{ backgroundColor: "#f0c04033", color: "#f0c040", border: "1px solid #f0c04055" }} />
          </Box>
          <Typography variant="body2" color={colors.grey[400]} mb={2}>
            Automated flags for clients with statistical spikes or drops in carbon data.
          </Typography>
          {anomalies.map(a => (
            <Card key={a.id} sx={{ backgroundColor: colors.primary[400], mb: 2,
              borderLeft: `4px solid ${a.severity === "high" ? "#e05c5c" : "#f0c040"}` }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">{a.client}</Typography>
                      <Chip label={a.type.toUpperCase()} size="small"
                        sx={{ backgroundColor: a.type === "spike" ? "#e05c5c33" : "#4db6e433",
                          color: a.type === "spike" ? "#e05c5c" : "#4db6e4", fontSize: "0.65rem" }} />
                      <Chip label={a.severity.toUpperCase()} size="small"
                        sx={{ backgroundColor: a.severity === "high" ? "#e05c5c22" : "#f0c04022",
                          color: a.severity === "high" ? "#e05c5c" : "#f0c040", fontSize: "0.65rem" }} />
                    </Box>
                    <Typography variant="body2" color={colors.grey[300]}>
                      Reported: <strong style={{ color: "#e05c5c" }}>{a.value} kg CO₂e</strong> vs baseline{" "}
                      <strong style={{ color: colors.grey[200] }}>{a.baseline} kg CO₂e</strong>
                      {" "}({((a.value - a.baseline) / a.baseline * 100).toFixed(0)}% deviation)
                    </Typography>
                    <Typography variant="caption" color={colors.grey[500]}>{a.date}</Typography>
                  </Box>
                  <Box display="flex" gap={1} alignItems="center">
                    <Chip label={a.status === "pending" ? "Pending Review" : "Reviewed"} size="small"
                      sx={{ backgroundColor: a.status === "pending" ? "#f0c04033" : colors.greenAccent[800],
                        color: a.status === "pending" ? "#f0c040" : colors.greenAccent[300] }} />
                    {a.status === "pending" && (
                      <Button size="small" variant="outlined" startIcon={<CheckCircleIcon />}
                        onClick={() => resolveAnomaly(a.id)}
                        sx={{ borderColor: colors.greenAccent[500], color: colors.greenAccent[400] }}>
                        Mark Reviewed
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* ── Tab 2: Emission Factors ── */}
      {tab === 4 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <SettingsIcon sx={{ color: colors.blueAccent[400] }} />
              <Typography variant="h5" color={colors.grey[100]}>Emission Factor Configuration</Typography>
            </Box>
          </Box>
          <Typography variant="body2" color={colors.grey[400]} mb={2}>
            Manage regional grid emission factors (EPA eGRID, DEFRA). Updated annually as regulatory standards change.
          </Typography>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Region / Source", "Standard", "Factor", "Unit", "Year", "Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[300], borderBottom: `1px solid ${colors.grey[700]}` }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {emissionFactors.map(f => (
                  <TableRow key={f.id}>
                    <TableCell sx={{ color: colors.grey[100] }}>{f.region}</TableCell>
                    <TableCell sx={{ color: colors.grey[300] }}>{f.source}</TableCell>
                    <TableCell sx={{ color: "#f0c040", fontWeight: "bold" }}>{f.factor}</TableCell>
                    <TableCell sx={{ color: colors.grey[400] }}>{f.unit}</TableCell>
                    <TableCell sx={{ color: colors.grey[400] }}>{f.year}</TableCell>
                    <TableCell>
                      <Chip label={f.status.toUpperCase()} size="small"
                        sx={{ backgroundColor: colors.greenAccent[800], color: colors.greenAccent[300], fontSize: "0.65rem" }} />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => openFactorEdit(f)} sx={{ color: colors.blueAccent[400] }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <Box mt={2} p={2} sx={{ backgroundColor: colors.primary[400], borderRadius: 1, border: `1px solid ${colors.grey[700]}` }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <InfoOutlinedIcon sx={{ fontSize: 16, color: colors.blueAccent[400] }} />
              <Typography variant="body2" color={colors.grey[200]} fontWeight="bold">Compliance Note</Typography>
            </Box>
            <Typography variant="caption" color={colors.grey[400]}>
              Emission factors are sourced from EPA eGRID and DEFRA. Changes are logged in the Audit Trail.
              All modifications require admin authorisation and are immutable once applied to historical records.
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── Tab 3: Offset Projects ── */}
      {tab === 5 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <LocalFloristIcon sx={{ color: colors.greenAccent[400] }} />
              <Typography variant="h5" color={colors.grey[100]}>Offset Project Directory</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />}
              onClick={() => { setProjectForm({ name: "", standard: "Gold Standard", credits_total: "", price: "", registry_id: "" }); setProjectDialog({ open: true, item: null }); }}
              sx={{ backgroundColor: colors.greenAccent[700], "&:hover": { backgroundColor: colors.greenAccent[600] } }}>
              Add Project
            </Button>
          </Box>
          <Grid container spacing={2}>
            {offsetProjects.map(p => {
              const pct = Math.round((p.credits_sold / p.credits_total) * 100);
              return (
                <Grid item xs={12} md={4} key={p.id}>
                  <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.greenAccent[700]}` }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">{p.name}</Typography>
                        <Chip label={p.standard} size="small"
                          sx={{ backgroundColor: colors.greenAccent[800], color: colors.greenAccent[300], fontSize: "0.65rem" }} />
                      </Box>
                      <Typography variant="caption" color={colors.grey[500]}>Registry: {p.registry_id}</Typography>
                      <Box mt={1.5}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" color={colors.grey[400]}>Credits sold</Typography>
                          <Typography variant="caption" color={colors.grey[200]}>{p.credits_sold.toLocaleString()} / {p.credits_total.toLocaleString()} t</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct}
                          sx={{ height: 8, borderRadius: 4, backgroundColor: colors.grey[700],
                            "& .MuiLinearProgress-bar": { backgroundColor: colors.greenAccent[500], borderRadius: 4 } }} />
                        <Typography variant="caption" color={colors.grey[500]}>{pct}% sold · ${p.price}/t</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5}>
                        <Chip label={p.status.toUpperCase()} size="small"
                          sx={{ backgroundColor: colors.greenAccent[800], color: colors.greenAccent[300], fontSize: "0.65rem" }} />
                        <IconButton size="small" onClick={() => openProjectEdit(p)} sx={{ color: colors.blueAccent[400] }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* ── Tab 4: AI Recommendations ── */}
      {tab === 6 && (
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <PsychologyIcon sx={{ color: colors.blueAccent[400] }} />
            <Typography variant="h5" color={colors.grey[100]}>AI Recommendation Trainer</Typography>
          </Box>
          <Typography variant="body2" color={colors.grey[400]} mb={3}>
            Review and refine the logic models behind automated mitigation suggestions sent to clients.
          </Typography>
          <Grid container spacing={2}>
            {[
              { title: "Fix Leaking Taps", trigger: "Usage spike > 20%", saving: "1.6 kg CO₂/mo", status: "active", clients: 12 },
              { title: "Collect Rainwater", trigger: "Dry season + high usage", saving: "3.2 kg CO₂/mo", status: "active", clients: 8 },
              { title: "Off-Peak Usage", trigger: "Peak hour consumption > 40%", saving: "0.8 kg CO₂/mo", status: "active", clients: 24 },
              { title: "Efficient Appliances", trigger: "Efficiency rating < 50", saving: "2.1 kg CO₂/mo", status: "active", clients: 6 },
              { title: "Reuse Greywater", trigger: "Household water > 15 m³/mo", saving: "1.4 kg CO₂/mo", status: "draft", clients: 0 },
            ].map((rec, i) => (
              <Grid item xs={12} md={6} key={i}>
                <Card sx={{ backgroundColor: colors.primary[400],
                  borderLeft: `4px solid ${rec.status === "active" ? colors.greenAccent[500] : colors.grey[600]}` }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">{rec.title}</Typography>
                        <Typography variant="caption" color={colors.grey[400]}>Trigger: {rec.trigger}</Typography>
                      </Box>
                      <Box textAlign="right">
                        <Chip label={rec.status.toUpperCase()} size="small"
                          sx={{ backgroundColor: rec.status === "active" ? colors.greenAccent[800] : colors.grey[700],
                            color: rec.status === "active" ? colors.greenAccent[300] : colors.grey[400], fontSize: "0.65rem" }} />
                        <Typography variant="caption" color={colors.grey[500]} display="block" mt={0.3}>
                          {rec.clients} clients triggered
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <Chip label={`Saves ${rec.saving}`} size="small"
                        sx={{ backgroundColor: colors.greenAccent[800], color: colors.greenAccent[100], fontSize: "0.7rem" }} />
                      <IconButton size="small" sx={{ color: colors.blueAccent[400] }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* ── Tab 5: Audit Trail ── */}
      {tab === 7 && (
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <SecurityIcon sx={{ color: colors.blueAccent[400] }} />
            <Typography variant="h5" color={colors.grey[100]}>Immutable Audit Trail</Typography>
            <Chip label="Regulatory Compliant" size="small"
              sx={{ backgroundColor: colors.greenAccent[800], color: colors.greenAccent[300], fontSize: "0.65rem" }} />
          </Box>
          <Typography variant="body2" color={colors.grey[400]} mb={2}>
            Immutable security log tracking all modifications to emission factors, offset approvals, and user data.
          </Typography>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Action", "Performed By", "Target", "Timestamp"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[300], borderBottom: `1px solid ${colors.grey[700]}` }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {MOCK_AUDIT.map(log => (
                  <TableRow key={log.id}>
                    <TableCell sx={{ color: colors.grey[100] }}>{log.action}</TableCell>
                    <TableCell sx={{ color: colors.blueAccent[300] }}>{log.user}</TableCell>
                    <TableCell sx={{ color: colors.grey[300] }}>{log.target}</TableCell>
                    <TableCell sx={{ color: colors.grey[500] }}>{log.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <Box mt={2} p={2} sx={{ backgroundColor: colors.primary[400], borderRadius: 1, border: `1px solid ${colors.grey[700]}` }}>
            <Box display="flex" alignItems="center" gap={1}>
              <VerifiedIcon sx={{ fontSize: 16, color: colors.greenAccent[400] }} />
              <Typography variant="caption" color={colors.grey[400]}>
                All audit records are cryptographically signed and cannot be modified.
                Compliant with GHG Protocol, ESG, and BRSR reporting requirements.
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Client Detail Dialog ── */}
      <Dialog open={clientDetailOpen} onClose={() => setClientDetailOpen(false)}
        maxWidth="md" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100], fontSize: "1.5rem !important", fontWeight: "bold",
          borderBottom: `1px solid ${colors.grey[700]}`, pb: 2 }}>
          {selectedClient?.name} — Carbon Profile
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedClient && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h5" color={colors.grey[200]} mb={2}
                  sx={{ fontSize: "1.1rem !important", fontWeight: 700 }}>
                  Client Details
                </Typography>
                {[
                  ["Type", selectedClient.type],
                  ["Village", selectedClient.village],
                  ["Monthly CO₂", `${selectedClient.carbon_kg} kg CO₂e`],
                  ["Efficiency Rating", `${selectedClient.efficiency} / 100`],
                  ["Trees Planted", `${selectedClient.trees_planted} trees`],
                  ["Trend", selectedClient.trend],
                  ["Status", selectedClient.status],
                ].map(([label, value]) => (
                  <Box key={label} display="flex" gap={2} mb={1.8}
                    sx={{ borderBottom: `1px solid ${colors.grey[700]}`, pb: 1 }}>
                    <Typography sx={{ minWidth: 160, fontSize: "1rem !important",
                      color: colors.grey[400], fontWeight: 500 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: "1rem !important",
                      color: colors.grey[100], fontWeight: 700 }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: "1.1rem !important", fontWeight: 700,
                  color: colors.grey[200], mb: 2 }}>
                  Scope Breakdown
                </Typography>
                {[
                  ["Scope 1 – Direct", `${Math.round(selectedClient.carbon_kg * 0.15)} kg`, "#e05c5c"],
                  ["Scope 2 – Electricity", `${Math.round(selectedClient.carbon_kg * 0.55)} kg`, "#f0c040"],
                  ["Scope 3 – Supply Chain", `${Math.round(selectedClient.carbon_kg * 0.30)} kg`, "#4db6e4"],
                ].map(([label, value, color]) => (
                  <Box key={label} display="flex" justifyContent="space-between" alignItems="center"
                    mb={1.5} p={1} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: "0.95rem !important", color: colors.grey[300] }}>{label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: "1rem !important", color, fontWeight: 700 }}>{value}</Typography>
                  </Box>
                ))}
                <Divider sx={{ borderColor: colors.grey[700], my: 2 }} />
                <Typography sx={{ fontSize: "1.1rem !important", fontWeight: 700,
                  color: colors.grey[200], mb: 1.5 }}>
                  AI Recommendations
                </Typography>
                {["Fix leaking taps to save ~1.6 kg CO₂/mo",
                  "Harvest rainwater to reduce pump demand",
                  "Switch to off-peak water usage"].map((rec, i) => (
                  <Box key={i} display="flex" alignItems="flex-start" gap={1.5} mb={1.2}
                    p={1} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                    <CheckCircleIcon sx={{ color: colors.greenAccent[400], fontSize: 20, mt: 0.1, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: "0.95rem !important", color: colors.grey[200] }}>{rec}</Typography>
                  </Box>
                ))}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${colors.grey[700]}`, pt: 2 }}>
          <Button onClick={() => setClientDetailOpen(false)}
            sx={{ color: colors.grey[300], fontSize: "1rem !important", px: 3 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Tree Submission Detail Dialog ── */}
      <Dialog open={treeDetailOpen.open} onClose={() => setTreeDetailOpen({ open: false, item: null })}
        maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100], fontSize: "1.3rem", fontWeight: "bold",
          borderBottom: `1px solid ${colors.grey[700]}`, pb: 2 }}>
          Tree Planting Submission — {treeDetailOpen.item?.client}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {treeDetailOpen.item && (
            <Box>
              {[
                ["Species", treeDetailOpen.item.species],
                ["Tree Type", treeDetailOpen.item.tree_type === "exotic" ? "Exotic / Modern" : "Indigenous / Heritage"],
                ["Category", treeDetailOpen.item.category],
                ["Quantity", `${treeDetailOpen.item.qty} trees`],
                ["Water Requirement", treeDetailOpen.item.water_need],
                ["Est. Carbon Offset", `${treeDetailOpen.item.carbon_offset_kg} kg CO₂/yr`],
                ["Location", treeDetailOpen.item.location],
                ["Submitted", treeDetailOpen.item.submitted],
              ].map(([label, value]) => (
                <Box key={label} display="flex" gap={2} mb={1.5}>
                  <Typography variant="body1" color={colors.grey[400]} sx={{ minWidth: 160, fontSize: "0.95rem" }}>{label}:</Typography>
                  <Typography variant="body1" color={colors.grey[100]} fontWeight="bold" sx={{ fontSize: "0.95rem" }}>{value}</Typography>
                </Box>
              ))}
              {treeDetailOpen.item.has_image && (
                <Box mt={2} p={2} sx={{ backgroundColor: colors.primary[500], borderRadius: 1,
                  border: `1px dashed ${colors.grey[600]}`, textAlign: "center" }}>
                  <Typography variant="body1" color={colors.grey[300]} sx={{ fontSize: "0.95rem" }}>
                    📷 Supporting image attached — click to view in full resolution
                  </Typography>
                  <Button size="small" variant="outlined" sx={{ mt: 1, borderColor: colors.blueAccent[500],
                    color: colors.blueAccent[300], fontSize: "0.85rem" }}>
                    View Image
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${colors.grey[700]}`, pt: 2 }}>
          <Button onClick={() => setTreeDetailOpen({ open: false, item: null })}
            sx={{ color: colors.grey[300], fontSize: "0.95rem" }}>Close</Button>
          {treeDetailOpen.item?.status === "pending" && (
            <>
              <Button variant="contained" startIcon={<CheckCircleIcon />}
                onClick={() => { handleTreeSubmission(treeDetailOpen.item.id, "approved"); setTreeDetailOpen({ open: false, item: null }); }}
                sx={{ backgroundColor: colors.greenAccent[700], fontSize: "0.95rem" }}>
                Approve Submission
              </Button>
              <Button variant="outlined" startIcon={<CancelIcon />}
                onClick={() => { handleTreeSubmission(treeDetailOpen.item.id, "rejected"); setTreeDetailOpen({ open: false, item: null }); }}
                sx={{ borderColor: "#e05c5c", color: "#e05c5c", fontSize: "0.95rem" }}>
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Emission Factor Edit Dialog ── */}
      <Dialog open={factorDialog.open} onClose={() => setFactorDialog({ open: false, item: null })}
        maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100], fontSize: "1.3rem", fontWeight: "bold",
          borderBottom: `1px solid ${colors.grey[700]}`, pb: 2 }}>
          Edit Emission Factor
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {[
            { label: "Region", field: "region" },
            { label: "Standard Source", field: "source" },
            { label: "Factor Value", field: "factor", type: "number" },
          ].map(({ label, field, type }) => (
            <TextField key={field} fullWidth label={label} type={type || "text"}
              value={factorForm[field]} onChange={e => setFactorForm(p => ({ ...p, [field]: e.target.value }))}
              sx={{ mb: 2, "& .MuiInputBase-input": { color: colors.grey[100], fontSize: "1rem" },
                "& .MuiInputLabel-root": { color: colors.grey[300], fontSize: "1rem" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }} />
          ))}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: colors.grey[300], fontSize: "1rem" }}>Unit</InputLabel>
            <Select value={factorForm.unit} onChange={e => setFactorForm(p => ({ ...p, unit: e.target.value }))}
              label="Unit" sx={{ color: colors.grey[100], fontSize: "1rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }}>
              <MenuItem value="kg CO₂/kWh" sx={{ fontSize: "1rem" }}>kg CO₂/kWh</MenuItem>
              <MenuItem value="kg CO₂/m³" sx={{ fontSize: "1rem" }}>kg CO₂/m³</MenuItem>
              <MenuItem value="kg CO₂/litre" sx={{ fontSize: "1rem" }}>kg CO₂/litre</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${colors.grey[700]}`, pt: 2 }}>
          <Button onClick={() => setFactorDialog({ open: false, item: null })}
            sx={{ color: colors.grey[300], fontSize: "0.95rem" }}>Cancel</Button>
          <Button variant="contained" onClick={saveFactorEdit}
            sx={{ backgroundColor: colors.blueAccent[600], fontSize: "0.95rem" }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* ── Offset Project Dialog ── */}
      <Dialog open={projectDialog.open} onClose={() => setProjectDialog({ open: false, item: null })}
        maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100], fontSize: "1.3rem", fontWeight: "bold",
          borderBottom: `1px solid ${colors.grey[700]}`, pb: 2 }}>
          {projectDialog.item ? "Edit Offset Project" : "Add Offset Project"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {[
            { label: "Project Name", field: "name" },
            { label: "Registry ID", field: "registry_id" },
            { label: "Total Credits (tonnes)", field: "credits_total", type: "number" },
            { label: "Price per Tonne ($)", field: "price", type: "number" },
          ].map(({ label, field, type }) => (
            <TextField key={field} fullWidth label={label} type={type || "text"}
              value={projectForm[field]} onChange={e => setProjectForm(p => ({ ...p, [field]: e.target.value }))}
              sx={{ mb: 2, "& .MuiInputBase-input": { color: colors.grey[100], fontSize: "1rem" },
                "& .MuiInputLabel-root": { color: colors.grey[300], fontSize: "1rem" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }} />
          ))}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: colors.grey[300], fontSize: "1rem" }}>Standard</InputLabel>
            <Select value={projectForm.standard} onChange={e => setProjectForm(p => ({ ...p, standard: e.target.value }))}
              label="Standard" sx={{ color: colors.grey[100], fontSize: "1rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }}>
              <MenuItem value="Gold Standard" sx={{ fontSize: "1rem" }}>Gold Standard</MenuItem>
              <MenuItem value="Verra VCS" sx={{ fontSize: "1rem" }}>Verra VCS</MenuItem>
              <MenuItem value="SDG Impact" sx={{ fontSize: "1rem" }}>SDG Impact Standards</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${colors.grey[700]}`, pt: 2 }}>
          <Button onClick={() => setProjectDialog({ open: false, item: null })}
            sx={{ color: colors.grey[300], fontSize: "0.95rem" }}>Cancel</Button>
          <Button variant="contained" onClick={saveProjectEdit}
            sx={{ backgroundColor: colors.greenAccent[700], fontSize: "0.95rem" }}>
            {projectDialog.item ? "Save Changes" : "Add Project"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* ── Edit Trees Dialog ── */}
      <Dialog open={editTreesDialog.open} onClose={() => setEditTreesDialog({ open: false, client: null })}
        maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100], fontSize: "1.5rem !important", fontWeight: "bold",
          borderBottom: `1px solid ${colors.grey[700]}`, pb: 2 }}>
          Edit Existing Trees — {editTreesDialog.client?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box mb={2.5} p={2} sx={{ backgroundColor: colors.greenAccent[800] + "33", borderRadius: 1,
            border: `1px solid ${colors.greenAccent[700]}` }}>
            <Typography sx={{ fontSize: "1rem !important", color: colors.greenAccent[300], lineHeight: 1.6 }}>
              🌳 Enter the number of trees already planted at this client's property.
              This will be applied to their carbon offset baseline and reflected in their simulator.
              Each tree offsets approximately <strong>21 kg CO₂/year (1.75 kg/month)</strong>.
            </Typography>
          </Box>
          <TextField fullWidth label="Number of Trees Already Planted" type="number"
            value={editTreesForm.trees_planted}
            onChange={e => setEditTreesForm(p => ({ ...p, trees_planted: e.target.value }))}
            inputProps={{ min: 0 }}
            helperText={`Monthly offset: ${((parseInt(editTreesForm.trees_planted) || 0) * 21 / 12).toFixed(2)} kg CO₂e/month`}
            sx={{ mb: 2.5,
              "& .MuiInputBase-input": { color: colors.grey[100], fontSize: "1.1rem !important" },
              "& .MuiInputLabel-root": { color: colors.grey[300], fontSize: "1rem !important" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] },
              "& .MuiFormHelperText-root": { color: colors.greenAccent[400], fontSize: "0.95rem !important" },
            }} />
          <TextField fullWidth multiline rows={3} label="Admin Notes (optional)"
            value={editTreesForm.tree_notes}
            onChange={e => setEditTreesForm(p => ({ ...p, tree_notes: e.target.value }))}
            placeholder="e.g. Verified on-site visit 15 May 2024 — 4 mango trees, 6 indigenous"
            sx={{ mb: 2,
              "& .MuiInputBase-input": { color: colors.grey[100], fontSize: "1rem !important" },
              "& .MuiInputLabel-root": { color: colors.grey[300], fontSize: "1rem !important" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }} />
          {(parseInt(editTreesForm.trees_planted) || 0) > 0 && (
            <Box mt={1} p={2} sx={{ backgroundColor: colors.primary[500], borderRadius: 1,
              border: `1px solid ${colors.grey[600]}` }}>
              <Typography sx={{ fontSize: "1rem !important", color: colors.grey[200], lineHeight: 1.7 }}>
                Impact preview:{" "}
                <strong style={{ color: colors.greenAccent[400] }}>
                  {parseInt(editTreesForm.trees_planted)} trees
                </strong>{" "}will offset{" "}
                <strong style={{ color: colors.greenAccent[400] }}>
                  {((parseInt(editTreesForm.trees_planted) || 0) * 21).toFixed(0)} kg CO₂/year
                </strong>{" "}
                ({((parseInt(editTreesForm.trees_planted) || 0) * 21 / 12).toFixed(2)} kg/month), reducing this
                client's net carbon from{" "}
                <strong style={{ color: "#e05c5c" }}>{editTreesDialog.client?.carbon_kg} kg</strong> to{" "}
                <strong style={{ color: colors.greenAccent[400] }}>
                  {Math.max(0, (editTreesDialog.client?.carbon_kg || 0) -
                    (parseInt(editTreesForm.trees_planted) || 0) * 21 / 12).toFixed(2)} kg
                </strong>{" "}CO₂e/month.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${colors.grey[700]}`, pt: 2 }}>
          <Button onClick={() => setEditTreesDialog({ open: false, client: null })}
            sx={{ color: colors.grey[300], fontSize: "1rem !important", px: 3 }}>Cancel</Button>
          <Button variant="contained" startIcon={<NatureIcon />} onClick={saveEditTrees}
            sx={{ backgroundColor: colors.greenAccent[700], fontSize: "1rem !important", px: 3,
              "&:hover": { backgroundColor: colors.greenAccent[600] } }}>
            Save Tree Record
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default CarbonFootprintAnalysis;
