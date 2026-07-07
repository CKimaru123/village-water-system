import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert,
  Chip, Grid, TextField, InputAdornment, IconButton, Select,
  MenuItem, FormControl, InputLabel,
} from "@mui/material";
import { tokens } from "../../../theme";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import PeopleIcon from "@mui/icons-material/People";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import HomeIcon from "@mui/icons-material/Home";
import SpeedIcon from "@mui/icons-material/Speed";
import ImageIcon from "@mui/icons-material/Image";
import api from "../../../utils/api";

const MOCK_COMPLETED = [
  { id: 4, title: "Water Treatment Plant Upgrade", project_type: "Treatment", status: "completed",
    start_date: "2023-09-01", expected_end_date: "2024-01-31", budget: 3200000,
    location: "Central Treatment Plant", contractor: "WaterPure Ltd", completion_percentage: 100,
    priority: "high", beneficiaries: 1200,
    description: "Upgrade chlorination and filtration systems to WHO standards.",
    completion_date: "2024-01-28",
    impact: {
      households_connected: 1200,
      water_quality_improvement: 95,
      uptime_percent: 99,
      impact_statement: "Improved water quality for 1,200 households, reducing waterborne disease incidence by an estimated 60%.",
    } },
  { id: 6, title: "Kijiji B Borehole & Pump House", project_type: "Borehole", status: "completed",
    start_date: "2023-05-01", expected_end_date: "2023-10-31", budget: 2100000,
    location: "Kijiji B", contractor: "AquaDrill Ltd", completion_percentage: 100,
    priority: "high", beneficiaries: 380,
    description: "100m borehole with pump house and distribution network for Kijiji B.",
    completion_date: "2023-10-15",
    impact: {
      households_connected: 380,
      water_quality_improvement: 88,
      uptime_percent: 97,
      impact_statement: "Eliminated 3km daily water walk for 380 households, saving an average of 2 hours per day per family.",
    } },
  { id: 7, title: "Zone A Distribution Network", project_type: "Distribution", status: "completed",
    start_date: "2023-02-01", expected_end_date: "2023-07-31", budget: 1450000,
    location: "Zone A", contractor: "PipeWorks Co.", completion_percentage: 100,
    priority: "medium", beneficiaries: 520,
    description: "2.8km distribution pipeline connecting Zone A to the main water supply.",
    completion_date: "2023-07-20",
    impact: {
      households_connected: 520,
      water_quality_improvement: 82,
      uptime_percent: 96,
      impact_statement: "Connected 520 households to piped water, replacing unreliable surface water sources.",
    } },
];

const TYPE_COLORS = {
  Borehole: "#4cceac", "Solar Pump": "#f0c040", Distribution: "#868dfb",
  Treatment: "#e2726e", Storage: "#4caf50", Other: "#858585",
};

const KpiCard = ({ label, value, color }) => (
  <Card sx={{ flex: "1 1 130px", minWidth: 110, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
    <CardContent sx={{ p: "12px 16px !important" }}>
      <Typography sx={{ fontSize: "1.6rem", fontWeight: "bold", color }}>{value}</Typography>
      <Typography sx={{ fontSize: "0.75rem", color: "#858585" }}>{label}</Typography>
    </CardContent>
  </Card>
);

const CompletedProjects = () => {
  const colors = tokens("dark");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const load = () => {
    setLoading(true);
    api.get("/projects?status=completed")
      .then(res => {
        const d = res.data?.data?.projects || res.data?.projects || res.data || res;
        setProjects(Array.isArray(d) && d.length > 0 ? d : MOCK_COMPLETED);
      })
      .catch(() => setProjects(MOCK_COMPLETED))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const years = ["all", ...new Set(MOCK_COMPLETED.map(p => (p.completion_date || p.expected_end_date || "").slice(0, 4)).filter(Boolean))];
  const types = ["all", ...new Set(MOCK_COMPLETED.map(p => p.project_type))];

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.location?.toLowerCase().includes(search.toLowerCase());
    const matchYear = yearFilter === "all" || (p.completion_date || p.expected_end_date || "").startsWith(yearFilter);
    const matchType = typeFilter === "all" || p.project_type === typeFilter;
    return matchSearch && matchYear && matchType;
  });

  const kpi = {
    completed: projects.length,
    beneficiaries: projects.reduce((s, p) => s + (Number(p.beneficiaries) || 0), 0),
    investment: projects.reduce((s, p) => s + (Number(p.budget) || 0), 0),
  };

  const fmtKES = (n) => `KES ${Number(n).toLocaleString()}`;

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Completed Projects</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Successfully delivered infrastructure</Typography>
        </Box>
        <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
      </Box>

      {/* KPI Row */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <KpiCard label="Completed" value={kpi.completed} color="#4caf50" />
        <KpiCard label="Total Beneficiaries" value={kpi.beneficiaries.toLocaleString()} color={colors.greenAccent[400]} />
        <KpiCard label="Total Investment" value={fmtKES(kpi.investment)} color={colors.blueAccent[300]} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
        <TextField size="small" placeholder="Search projects…" value={search}
          onChange={e => setSearch(e.target.value)} sx={{ width: 260 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[400] }} /></InputAdornment> }} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select value={yearFilter} label="Year" onChange={e => setYearFilter(e.target.value)}>
            {years.map(y => <MenuItem key={y} value={y}>{y === "all" ? "All Years" : y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} label="Type" onChange={e => setTypeFilter(e.target.value)}>
            {types.map(t => <MenuItem key={t} value={t}>{t === "all" ? "All Types" : t}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(p => {
            const impact = p.impact || {};
            return (
              <Grid item xs={12} md={6} key={p.id}>
                <Card sx={{
                  backgroundColor: colors.primary[400],
                  borderLeft: `4px solid #4caf50`,
                  height: "100%",
                }}>
                  <CardContent>
                    {/* Title Row */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box display="flex" alignItems="flex-start" gap={1} flex={1}>
                        <CheckCircleIcon sx={{ color: "#4caf50", mt: 0.3, flexShrink: 0 }} />
                        <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" sx={{ lineHeight: 1.3 }}>
                          {p.title}
                        </Typography>
                      </Box>
                      <Chip label={p.project_type} size="small"
                        sx={{ backgroundColor: TYPE_COLORS[p.project_type] || colors.blueAccent[700], color: "#fff", fontSize: 10, ml: 1, flexShrink: 0 }} />
                    </Box>

                    {/* Meta */}
                    <Box display="flex" gap={2} mb={1.5} flexWrap="wrap">
                      <Typography sx={{ fontSize: "0.8rem", color: colors.grey[400] }}>
                        📍 {p.location}
                      </Typography>
                      <Typography sx={{ fontSize: "0.8rem", color: "#4caf50", fontWeight: "bold" }}>
                        ✓ Completed: {p.completion_date || p.expected_end_date}
                      </Typography>
                    </Box>

                    <Box display="flex" gap={2} mb={1.5} flexWrap="wrap">
                      <Typography sx={{ fontSize: "0.8rem", color: colors.grey[300] }}>
                        Budget: <strong>{fmtKES(p.budget)}</strong>
                      </Typography>
                      <Typography sx={{ fontSize: "0.8rem", color: colors.grey[300] }}>
                        Contractor: <strong>{p.contractor}</strong>
                      </Typography>
                    </Box>

                    {/* Impact Statement */}
                    {impact.impact_statement && (
                      <Box p={1.5} sx={{ backgroundColor: "rgba(76,175,80,0.1)", borderRadius: 1, border: "1px solid rgba(76,175,80,0.3)", mb: 1.5 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: colors.grey[200], lineHeight: 1.5, fontStyle: "italic" }}>
                          "{impact.impact_statement}"
                        </Typography>
                      </Box>
                    )}

                    {/* Impact Metrics */}
                    <Grid container spacing={1} sx={{ mb: 1.5 }}>
                      <Grid item xs={4}>
                        <Box sx={{ backgroundColor: colors.primary[500], borderRadius: 1, p: 1, textAlign: "center" }}>
                          <HomeIcon sx={{ fontSize: 18, color: colors.blueAccent[400] }} />
                          <Typography sx={{ fontSize: "1rem", fontWeight: "bold", color: colors.grey[100] }}>
                            {impact.households_connected?.toLocaleString() || "—"}
                          </Typography>
                          <Typography sx={{ fontSize: "0.65rem", color: colors.grey[500] }}>Households</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ backgroundColor: colors.primary[500], borderRadius: 1, p: 1, textAlign: "center" }}>
                          <WaterDropIcon sx={{ fontSize: 18, color: "#4cceac" }} />
                          <Typography sx={{ fontSize: "1rem", fontWeight: "bold", color: colors.grey[100] }}>
                            {impact.water_quality_improvement ? `${impact.water_quality_improvement}%` : "—"}
                          </Typography>
                          <Typography sx={{ fontSize: "0.65rem", color: colors.grey[500] }}>Quality ↑</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ backgroundColor: colors.primary[500], borderRadius: 1, p: 1, textAlign: "center" }}>
                          <SpeedIcon sx={{ fontSize: 18, color: "#f0c040" }} />
                          <Typography sx={{ fontSize: "1rem", fontWeight: "bold", color: colors.grey[100] }}>
                            {impact.uptime_percent ? `${impact.uptime_percent}%` : "—"}
                          </Typography>
                          <Typography sx={{ fontSize: "0.65rem", color: colors.grey[500] }}>Uptime</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Photo Gallery Placeholders */}
                    <Box>
                      <Typography sx={{ fontSize: "0.75rem", color: colors.grey[500], mb: 1, textTransform: "uppercase", fontWeight: "bold" }}>
                        Project Gallery
                      </Typography>
                      <Box display="flex" gap={1}>
                        {[1, 2, 3].map(n => (
                          <Box key={n} sx={{
                            flex: 1, height: 60, backgroundColor: colors.primary[500],
                            borderRadius: 1, display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center",
                            border: `1px dashed ${colors.grey[700]}`,
                          }}>
                            <ImageIcon sx={{ fontSize: 20, color: colors.grey[600] }} />
                            <Typography sx={{ fontSize: "0.65rem", color: colors.grey[600] }}>Photo {n}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {filtered.length === 0 && (
            <Grid item xs={12}><Alert severity="info">No completed projects match your filters.</Alert></Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default CompletedProjects;
