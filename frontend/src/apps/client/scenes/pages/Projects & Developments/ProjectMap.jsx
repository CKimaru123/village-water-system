import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert,
  Chip, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton, Grid, Divider, List, ListItem, ListItemIcon,
  ListItemText, Tooltip,
} from "@mui/material";
import { tokens } from "../../../theme";
import MapIcon from "@mui/icons-material/Map";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import RefreshIcon from "@mui/icons-material/Refresh";
import EngineeringIcon from "@mui/icons-material/Engineering";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PeopleIcon from "@mui/icons-material/People";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import api from "../../../utils/api";

const MOCK_PROJECTS = [
  { id: 1, title: "Kijiji A Borehole Drilling", project_type: "Borehole", status: "ongoing",
    start_date: "2024-02-01", expected_end_date: "2024-07-31", budget: 2800000,
    location: "Kijiji A", contractor: "AquaDrill Ltd", completion_percentage: 65,
    priority: "high", beneficiaries: 450,
    description: "Drilling a 120m borehole to serve 450 households in Kijiji A.",
    map_x: 22, map_y: 30 },
  { id: 2, title: "Solar Pump Installation — Zone B", project_type: "Solar Pump", status: "planning",
    start_date: "2024-06-01", expected_end_date: "2024-09-30", budget: 1500000,
    location: "Zone B", contractor: "SolarTech Kenya", completion_percentage: 0,
    priority: "high", beneficiaries: 320,
    description: "Replace diesel pump with 5kW solar system to cut emissions and costs.",
    map_x: 60, map_y: 20 },
  { id: 3, title: "Distribution Pipeline Extension", project_type: "Distribution", status: "on_hold",
    start_date: "2024-01-15", expected_end_date: "2024-05-30", budget: 980000,
    location: "Kijiji C–D corridor", contractor: "PipeWorks Co.", completion_percentage: 30,
    priority: "medium", beneficiaries: 180,
    description: "Extend 3.2km pipeline to reach underserved areas.",
    map_x: 45, map_y: 55 },
  { id: 4, title: "Water Treatment Plant Upgrade", project_type: "Treatment", status: "completed",
    start_date: "2023-09-01", expected_end_date: "2024-01-31", budget: 3200000,
    location: "Central Treatment Plant", contractor: "WaterPure Ltd", completion_percentage: 100,
    priority: "high", beneficiaries: 1200,
    description: "Upgrade chlorination and filtration systems to WHO standards.",
    map_x: 50, map_y: 45 },
  { id: 5, title: "Community Storage Tank — Kijiji E", project_type: "Storage", status: "ongoing",
    start_date: "2024-03-10", expected_end_date: "2024-08-15", budget: 1750000,
    location: "Kijiji E", contractor: "BuildRight Ltd", completion_percentage: 45,
    priority: "medium", beneficiaries: 280,
    description: "50,000L elevated storage tank construction.",
    map_x: 75, map_y: 65 },
];

const STATUS_COLORS = {
  planning: "#868dfb", ongoing: "#4cceac", on_hold: "#f0c040",
  completed: "#4caf50", cancelled: "#e2726e",
};
const TYPE_COLORS = {
  Borehole: "#4cceac", "Solar Pump": "#f0c040", Distribution: "#868dfb",
  Treatment: "#e2726e", Storage: "#4caf50",
};

const statusIcon = (s) => {
  if (s === "completed") return <CheckCircleIcon sx={{ fontSize: 14 }} />;
  if (s === "on_hold") return <PauseCircleIcon sx={{ fontSize: 14 }} />;
  if (s === "planning") return <ScheduleIcon sx={{ fontSize: 14 }} />;
  return <EngineeringIcon sx={{ fontSize: 14 }} />;
};

const KpiCard = ({ label, value, color }) => (
  <Card sx={{ flex: "1 1 100px", minWidth: 90, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
    <CardContent sx={{ p: "10px 14px !important" }}>
      <Typography sx={{ fontSize: "1.4rem", fontWeight: "bold", color }}>{value}</Typography>
      <Typography sx={{ fontSize: "0.7rem", color: "#858585" }}>{label}</Typography>
    </CardContent>
  </Card>
);

const ProjectMap = () => {
  const colors = tokens("dark");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState(null);
  const [highlighted, setHighlighted] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/projects?include_coordinates=true")
      .then(res => {
        const d = res.data?.data?.projects || res.data?.projects || res.data || res;
        const list = Array.isArray(d) && d.length > 0 ? d : MOCK_PROJECTS;
        // Derive map_x/map_y from GPS if available, otherwise keep existing or use defaults
        const lats = list.map(p => p.gps_latitude).filter(Boolean);
        const lngs = list.map(p => p.gps_longitude).filter(Boolean);
        const minLat = Math.min(...lats), maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
        const enriched = list.map((p, i) => ({
          ...p,
          map_x: p.map_x || (p.gps_longitude && maxLng !== minLng
            ? Math.round(10 + ((p.gps_longitude - minLng) / (maxLng - minLng)) * 80)
            : 15 + (i % 4) * 20),
          map_y: p.map_y || (p.gps_latitude && maxLat !== minLat
            ? Math.round(10 + ((maxLat - p.gps_latitude) / (maxLat - minLat)) * 80)
            : 20 + Math.floor(i / 4) * 30),
        }));
        setProjects(enriched);
      })
      .catch(() => setProjects(MOCK_PROJECTS))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const filterByTab = (p) => {
    if (tab === 0) return true;
    if (tab === 1) return p.status === "ongoing" || p.status === "planning";
    if (tab === 2) return p.status === "completed";
    return true; // tab 3: by type — show all
  };

  const filtered = projects.filter(filterByTab);

  const kpi = {
    total: projects.length,
    ongoing: projects.filter(p => p.status === "ongoing").length,
    completed: projects.filter(p => p.status === "completed").length,
    planned: projects.filter(p => p.status === "planning").length,
  };

  const fmtKES = (n) => `KES ${Number(n).toLocaleString()}`;

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Project Map</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Geographic overview of all water infrastructure projects</Typography>
        </Box>
        <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
      </Box>

      {/* KPI Strip */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <KpiCard label="Total" value={kpi.total} color={colors.blueAccent[400]} />
        <KpiCard label="Ongoing" value={kpi.ongoing} color={colors.greenAccent[400]} />
        <KpiCard label="Completed" value={kpi.completed} color="#4caf50" />
        <KpiCard label="Planned" value={kpi.planned} color="#868dfb" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Filter Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2,
        "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
        "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
        "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
      }}>
        <Tab label="All" />
        <Tab label="Ongoing" />
        <Tab label="Completed" />
        <Tab label="By Type" />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>
      ) : (
        <Grid container spacing={2}>
          {/* Map Area */}
          <Grid item xs={12} md={8}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MapIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">Village Water Infrastructure Map</Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 2, fontSize: "0.8rem" }}>
                  Full interactive map requires GPS coordinates from admin. Showing schematic positions.
                </Alert>

                {/* SVG Map */}
                <Box sx={{
                  height: 500, backgroundColor: colors.primary[500], borderRadius: 2,
                  position: "relative", overflow: "hidden",
                  border: `1px solid ${colors.grey[700]}`,
                }}>
                  {/* Background grid lines */}
                  <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
                    {/* Horizontal grid lines */}
                    {[20, 40, 60, 80].map(y => (
                      <line key={`h${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`}
                        stroke={colors.grey[800]} strokeWidth="1" strokeDasharray="4,4" />
                    ))}
                    {/* Vertical grid lines */}
                    {[20, 40, 60, 80].map(x => (
                      <line key={`v${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%"
                        stroke={colors.grey[800]} strokeWidth="1" strokeDasharray="4,4" />
                    ))}
                    {/* Simulated roads */}
                    <path d="M 10% 50% Q 50% 30% 90% 50%" stroke={colors.grey[700]} strokeWidth="2" fill="none" />
                    <path d="M 50% 10% L 50% 90%" stroke={colors.grey[700]} strokeWidth="1.5" fill="none" strokeDasharray="6,3" />
                  </svg>

                  {/* Map label */}
                  <Box sx={{ position: "absolute", bottom: 8, left: 8 }}>
                    <Typography sx={{ fontSize: "0.7rem", color: colors.grey[600] }}>
                      Schematic map — not to scale
                    </Typography>
                  </Box>

                  {/* Project Markers */}
                  {filtered.map(p => {
                    const mx = p.map_x || 50;
                    const my = p.map_y || 50;
                    const isHighlighted = highlighted === p.id;
                    const markerColor = STATUS_COLORS[p.status] || "#666";
                    return (
                      <Tooltip key={p.id} title={`${p.title} — ${p.location}`} placement="top">
                        <Box
                          onClick={() => setSelected(p)}
                          onMouseEnter={() => setHighlighted(p.id)}
                          onMouseLeave={() => setHighlighted(null)}
                          sx={{
                            position: "absolute",
                            left: `${mx}%`,
                            top: `${my}%`,
                            transform: "translate(-50%, -50%)",
                            cursor: "pointer",
                            zIndex: isHighlighted ? 10 : 5,
                            transition: "transform 0.15s",
                            "&:hover": { transform: "translate(-50%, -50%) scale(1.3)" },
                          }}
                        >
                          {/* Pulse ring for ongoing */}
                          {(p.status === "ongoing") && (
                            <Box sx={{
                              position: "absolute", top: "50%", left: "50%",
                              transform: "translate(-50%, -50%)",
                              width: 36, height: 36, borderRadius: "50%",
                              border: `2px solid ${markerColor}`,
                              opacity: 0.4,
                            }} />
                          )}
                          <Box sx={{
                            width: isHighlighted ? 28 : 24,
                            height: isHighlighted ? 28 : 24,
                            borderRadius: "50%",
                            backgroundColor: markerColor,
                            border: `3px solid ${isHighlighted ? "#fff" : colors.primary[400]}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: isHighlighted ? `0 0 12px ${markerColor}` : "none",
                            transition: "all 0.15s",
                          }}>
                            <Typography sx={{ fontSize: "0.6rem", color: "#fff", fontWeight: "bold" }}>
                              {p.id}
                            </Typography>
                          </Box>
                          {isHighlighted && (
                            <Box sx={{
                              position: "absolute", top: "100%", left: "50%",
                              transform: "translateX(-50%)",
                              backgroundColor: colors.primary[400],
                              border: `1px solid ${markerColor}`,
                              borderRadius: 1, px: 1, py: 0.3, mt: 0.5,
                              whiteSpace: "nowrap", zIndex: 20,
                            }}>
                              <Typography sx={{ fontSize: "0.7rem", color: colors.grey[100] }}>{p.location}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>

                {/* Legend */}
                <Box display="flex" gap={2} mt={2} flexWrap="wrap">
                  {Object.entries(STATUS_COLORS).map(([s, c]) => (
                    <Box key={s} display="flex" alignItems="center" gap={0.5}>
                      <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: c }} />
                      <Typography sx={{ fontSize: "0.75rem", color: colors.grey[400] }}>
                        {s.replace(/_/g, " ")}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar List */}
          <Grid item xs={12} md={4}>
            <Card sx={{ backgroundColor: colors.primary[400], height: "100%" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" mb={2}>
                  Projects ({filtered.length})
                </Typography>
                <Box sx={{ maxHeight: 560, overflowY: "auto" }}>
                  <List dense disablePadding>
                    {filtered.map(p => (
                      <ListItem
                        key={p.id}
                        button
                        onClick={() => setSelected(p)}
                        onMouseEnter={() => setHighlighted(p.id)}
                        onMouseLeave={() => setHighlighted(null)}
                        sx={{
                          borderRadius: 1, mb: 1, cursor: "pointer",
                          backgroundColor: highlighted === p.id ? colors.primary[300] : colors.primary[500],
                          border: `1px solid ${highlighted === p.id ? STATUS_COLORS[p.status] || colors.grey[600] : "transparent"}`,
                          transition: "all 0.15s",
                          "&:hover": { backgroundColor: colors.primary[300] },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Box sx={{
                            width: 28, height: 28, borderRadius: "50%",
                            backgroundColor: STATUS_COLORS[p.status] || "#666",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff",
                          }}>
                            {statusIcon(p.status)}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: "0.85rem", fontWeight: "bold", color: colors.grey[100] }} noWrap>
                              {p.title}
                            </Typography>
                          }
                          secondary={
                            <Box display="flex" gap={0.5} alignItems="center" mt={0.3}>
                              <LocationOnIcon sx={{ fontSize: 12, color: colors.grey[500] }} />
                              <Typography sx={{ fontSize: "0.75rem", color: colors.grey[400] }} noWrap>{p.location}</Typography>
                              <Chip label={p.status?.replace(/_/g, " ")} size="small"
                                sx={{ backgroundColor: STATUS_COLORS[p.status] || "#666", color: "#fff", fontSize: 9, height: 16, ml: 0.5 }} />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Project Detail Dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        {selected && (
          <>
            <DialogTitle sx={{ color: colors.grey[100], fontSize: "1.2rem !important" }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: STATUS_COLORS[selected.status] || "#666", flexShrink: 0 }} />
                {selected.title}
              </Box>
              <Box display="flex" gap={1} mt={0.5}>
                <Chip label={selected.status?.replace(/_/g, " ").toUpperCase()} size="small"
                  sx={{ backgroundColor: STATUS_COLORS[selected.status] || "#666", color: "#fff", fontSize: 10 }} />
                <Chip label={selected.project_type} size="small"
                  sx={{ backgroundColor: TYPE_COLORS[selected.project_type] || colors.blueAccent[700], color: "#fff", fontSize: 10 }} />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />
              {[
                [<LocationOnIcon sx={{ fontSize: 16 }} />, "Location", selected.location],
                [<EngineeringIcon sx={{ fontSize: 16 }} />, "Contractor", selected.contractor],
                [<AttachMoneyIcon sx={{ fontSize: 16 }} />, "Budget", `KES ${Number(selected.budget).toLocaleString()}`],
                [<PeopleIcon sx={{ fontSize: 16 }} />, "Beneficiaries", selected.beneficiaries?.toLocaleString()],
                [<CalendarTodayIcon sx={{ fontSize: 16 }} />, "Start Date", selected.start_date],
                [<CalendarTodayIcon sx={{ fontSize: 16 }} />, "Expected End", selected.expected_end_date],
              ].map(([icon, label, value]) => (
                <Box key={label} display="flex" gap={2} mb={1.5} alignItems="flex-start">
                  <Box sx={{ color: colors.grey[500], mt: 0.1, flexShrink: 0 }}>{icon}</Box>
                  <Typography sx={{ fontSize: "1rem !important", color: colors.grey[400], minWidth: 110 }}>{label}:</Typography>
                  <Typography sx={{ fontSize: "1rem !important", color: colors.grey[100] }}>{value || "—"}</Typography>
                </Box>
              ))}
              {selected.description && (
                <Box mt={1} p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                  <Typography sx={{ fontSize: "1rem !important", color: colors.grey[300], lineHeight: 1.6 }}>
                    {selected.description}
                  </Typography>
                </Box>
              )}
              {selected.completion_percentage !== undefined && (
                <Box mt={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography sx={{ fontSize: "1rem !important", color: colors.grey[400] }}>Progress</Typography>
                    <Typography sx={{ fontSize: "1rem !important", color: colors.grey[300], fontWeight: "bold" }}>
                      {selected.completion_percentage}%
                    </Typography>
                  </Box>
                  <Box sx={{ height: 8, borderRadius: 4, backgroundColor: colors.grey[700], overflow: "hidden" }}>
                    <Box sx={{ height: "100%", width: `${selected.completion_percentage}%`,
                      backgroundColor: STATUS_COLORS[selected.status] || colors.blueAccent[500], borderRadius: 4 }} />
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelected(null)} sx={{ color: colors.grey[400] }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ProjectMap;
