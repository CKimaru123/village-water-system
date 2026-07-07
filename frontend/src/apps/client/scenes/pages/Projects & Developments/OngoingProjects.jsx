import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert,
  Chip, LinearProgress, Grid, IconButton,
} from "@mui/material";
import { tokens } from "../../../theme";
import EngineeringIcon from "@mui/icons-material/Engineering";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import RefreshIcon from "@mui/icons-material/Refresh";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import api from "../../../utils/api";

const MOCK_PROJECTS = [
  { id: 1, title: "Kijiji A Borehole Drilling", project_type: "Borehole", status: "ongoing",
    start_date: "2024-02-01", expected_end_date: "2024-07-31", budget: 2800000,
    location: "Kijiji A", contractor: "AquaDrill Ltd", completion_percentage: 65,
    priority: "high", beneficiaries: 450,
    description: "Drilling a 120m borehole to serve 450 households in Kijiji A.",
    milestones: [
      { date: "2024-05-10", text: "Casing installation completed to 80m depth." },
      { date: "2024-04-15", text: "Drilling reached 65m — water table encountered." },
      { date: "2024-03-01", text: "Site preparation and equipment mobilization done." },
    ] },
  { id: 5, title: "Community Storage Tank — Kijiji E", project_type: "Storage", status: "ongoing",
    start_date: "2024-03-10", expected_end_date: "2024-08-15", budget: 1750000,
    location: "Kijiji E", contractor: "BuildRight Ltd", completion_percentage: 45,
    priority: "medium", beneficiaries: 280,
    description: "50,000L elevated storage tank construction.",
    milestones: [
      { date: "2024-05-05", text: "Foundation slab poured and cured." },
      { date: "2024-04-20", text: "Structural steel columns erected." },
      { date: "2024-03-25", text: "Excavation and site leveling completed." },
    ] },
  { id: 2, title: "Solar Pump Installation — Zone B", project_type: "Solar Pump", status: "planning",
    start_date: "2024-06-01", expected_end_date: "2024-09-30", budget: 1500000,
    location: "Zone B", contractor: "SolarTech Kenya", completion_percentage: 0,
    priority: "high", beneficiaries: 320,
    description: "Replace diesel pump with 5kW solar system to cut emissions and costs.",
    milestones: [
      { date: "2024-05-20", text: "Procurement of solar panels approved." },
      { date: "2024-05-01", text: "Site survey and design finalized." },
      { date: "2024-04-10", text: "Environmental impact assessment submitted." },
    ] },
];

const CLIENT_VILLAGE = "Kijiji A";

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

const OngoingProjects = () => {
  const colors = tokens("dark");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");

  const load = () => {
    setLoading(true);
    api.get("/projects?status=ongoing")
      .then(res => {
        const d = res.data?.data?.projects || res.data?.projects || res.data || res;
        setProjects(Array.isArray(d) && d.length > 0 ? d : MOCK_PROJECTS);
      })
      .catch(() => setProjects(MOCK_PROJECTS))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const types = ["all", ...new Set(MOCK_PROJECTS.map(p => p.project_type))];

  const filtered = typeFilter === "all"
    ? projects
    : projects.filter(p => p.project_type === typeFilter);

  const kpi = {
    active: projects.filter(p => p.status === "ongoing" || p.status === "planning").length,
    beneficiaries: projects.reduce((s, p) => s + (Number(p.beneficiaries) || 0), 0),
    avgProgress: projects.length > 0
      ? Math.round(projects.reduce((s, p) => s + (Number(p.completion_percentage) || 0), 0) / projects.length)
      : 0,
  };

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Ongoing Projects</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Active projects in your community</Typography>
        </Box>
        <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
      </Box>

      {/* KPI Row */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <KpiCard label="Active Projects" value={kpi.active} color={colors.blueAccent[400]} />
        <KpiCard label="Total Beneficiaries" value={kpi.beneficiaries.toLocaleString()} color={colors.greenAccent[400]} />
        <KpiCard label="Avg Progress" value={`${kpi.avgProgress}%`} color="#f0c040" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Type Filter Chips */}
      <Box display="flex" gap={1} mb={3} flexWrap="wrap">
        {types.map(t => (
          <Chip key={t} label={t === "all" ? "All Types" : t} clickable
            onClick={() => setTypeFilter(t)}
            sx={{
              backgroundColor: typeFilter === t ? (TYPE_COLORS[t] || colors.blueAccent[600]) : colors.primary[400],
              color: typeFilter === t ? "#fff" : colors.grey[300],
              fontWeight: typeFilter === t ? "bold" : "normal",
              border: `1px solid ${typeFilter === t ? "transparent" : colors.grey[700]}`,
            }} />
        ))}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(p => {
            const affectsYou = p.location?.toLowerCase().includes(CLIENT_VILLAGE.toLowerCase());
            const milestones = p.milestones || [];
            return (
              <Grid item xs={12} md={6} lg={4} key={p.id}>
                <Card sx={{
                  backgroundColor: colors.primary[400], height: "100%",
                  borderLeft: `4px solid ${TYPE_COLORS[p.project_type] || colors.blueAccent[500]}`,
                  position: "relative",
                }}>
                  {affectsYou && (
                    <Box sx={{
                      position: "absolute", top: 12, right: 12,
                      backgroundColor: colors.greenAccent[700], color: "#fff",
                      fontSize: "0.7rem", fontWeight: "bold", px: 1, py: 0.3, borderRadius: 1,
                    }}>
                      AFFECTS YOU
                    </Box>
                  )}
                  <CardContent>
                    <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
                      <EngineeringIcon sx={{ color: TYPE_COLORS[p.project_type] || colors.blueAccent[400], mt: 0.3, flexShrink: 0 }} />
                      <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" sx={{ lineHeight: 1.3 }}>
                        {p.title}
                      </Typography>
                    </Box>

                    <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
                      <Chip label={p.project_type} size="small"
                        sx={{ backgroundColor: TYPE_COLORS[p.project_type] || colors.blueAccent[700], color: "#fff", fontSize: 10 }} />
                      <Chip label={p.status?.replace(/_/g, " ").toUpperCase()} size="small"
                        sx={{ backgroundColor: p.status === "ongoing" ? colors.greenAccent[700] : colors.blueAccent[700], color: "#fff", fontSize: 10 }} />
                    </Box>

                    {/* Progress Bar */}
                    <Box mb={1.5}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography sx={{ fontSize: "0.8rem", color: colors.grey[400] }}>Progress</Typography>
                        <Typography sx={{ fontSize: "0.8rem", color: colors.grey[300], fontWeight: "bold" }}>
                          {p.completion_percentage || 0}%
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={p.completion_percentage || 0}
                        sx={{ height: 8, borderRadius: 4, backgroundColor: colors.grey[700],
                          "& .MuiLinearProgress-bar": { backgroundColor: TYPE_COLORS[p.project_type] || colors.blueAccent[500] } }} />
                    </Box>

                    {/* Info Grid */}
                    <Grid container spacing={1} sx={{ mb: 1.5 }}>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <LocationOnIcon sx={{ fontSize: 14, color: colors.grey[500] }} />
                          <Typography sx={{ fontSize: "0.8rem", color: colors.grey[300] }} noWrap>{p.location}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <PeopleIcon sx={{ fontSize: 14, color: colors.grey[500] }} />
                          <Typography sx={{ fontSize: "0.8rem", color: colors.grey[300] }}>
                            {p.beneficiaries?.toLocaleString()} beneficiaries
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <CalendarTodayIcon sx={{ fontSize: 14, color: colors.grey[500] }} />
                          <Typography sx={{ fontSize: "0.8rem", color: colors.grey[300] }}>
                            Due: {p.expected_end_date} · {p.contractor}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Mini Timeline */}
                    {milestones.length > 0 && (
                      <Box sx={{ backgroundColor: colors.primary[500], borderRadius: 1, p: 1.5 }}>
                        <Typography sx={{ fontSize: "0.75rem", color: colors.grey[500], fontWeight: "bold", mb: 1, textTransform: "uppercase" }}>
                          Recent Updates
                        </Typography>
                        {milestones.slice(0, 3).map((m, i) => (
                          <Box key={i} display="flex" gap={1} mb={i < 2 ? 1 : 0} alignItems="flex-start">
                            <FiberManualRecordIcon sx={{ fontSize: 8, color: TYPE_COLORS[p.project_type] || colors.blueAccent[400], mt: 0.6, flexShrink: 0 }} />
                            <Box>
                              <Typography sx={{ fontSize: "0.75rem", color: colors.grey[400] }}>{m.date}</Typography>
                              <Typography sx={{ fontSize: "0.8rem", color: colors.grey[300], lineHeight: 1.4 }}>{m.text}</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {filtered.length === 0 && (
            <Grid item xs={12}><Alert severity="info">No ongoing projects found.</Alert></Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default OngoingProjects;
