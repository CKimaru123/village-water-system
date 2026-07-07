import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, IconButton, Tooltip, MenuItem, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, LinearProgress, Divider, Grid,
  FormControl, InputLabel, Select,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import adminApi from "../../../utils/api";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BuildIcon from "@mui/icons-material/Build";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { DataGrid } from "@mui/x-data-grid";

const ASSET_TYPES = ["Pump","Borehole","Pipeline","Tank","Valve","Meter","Treatment Plant","Generator","Solar Panel","Other"];
const STATUSES = ["active","maintenance","decommissioned"];
const MAINT_TYPES = ["Inspection","Cleaning","Repair","Replacement","Calibration","Lubrication","Testing"];
const INCIDENT_TYPES = ["Pipe Burst","Pump Failure","Leak","Contamination","Power Outage","Sensor Fault","Vandalism","Other"];
const SEVERITIES = ["low","medium","high","critical"];

const mockAssets = [
  { id:1, asset_name:"Kiambu Main Pump", asset_type:"Pump", asset_code:"PMP-001", status:"active", location:"Kiambu Station A", gps_latitude:-1.1731, gps_longitude:36.8352, installation_date:"2019-03-15", last_maintenance_date:"2024-10-01", next_maintenance_date:"2025-04-01", notes:"Primary distribution pump" },
  { id:2, asset_name:"Ruiru Borehole #1", asset_type:"Borehole", asset_code:"BH-001", status:"active", location:"Ruiru North", gps_latitude:-1.1456, gps_longitude:36.9612, installation_date:"2017-06-20", last_maintenance_date:"2024-09-15", next_maintenance_date:"2025-03-15", notes:"Depth 120m, yield 5m³/hr" },
  { id:3, asset_name:"Thika Treatment Plant", asset_type:"Treatment Plant", asset_code:"TP-001", status:"active", location:"Thika Industrial Zone", gps_latitude:-1.0332, gps_longitude:37.0693, installation_date:"2018-01-10", last_maintenance_date:"2024-11-20", next_maintenance_date:"2025-02-20", notes:"Capacity 500m³/day" },
  { id:4, asset_name:"Juja Pipeline Segment A", asset_type:"Pipeline", asset_code:"PL-001", status:"active", location:"Juja Road Corridor", gps_latitude:-1.1012, gps_longitude:37.0145, installation_date:"2020-05-01", last_maintenance_date:"2024-08-10", next_maintenance_date:"2025-08-10", notes:"DN150 HDPE, 2.3km" },
  { id:5, asset_name:"Githurai Pipeline Segment B", asset_type:"Pipeline", asset_code:"PL-002", status:"maintenance", location:"Githurai 44", gps_latitude:-1.1789, gps_longitude:36.9234, installation_date:"2016-11-30", last_maintenance_date:"2024-12-01", next_maintenance_date:"2025-01-15", notes:"Scheduled relining" },
  { id:6, asset_name:"Kahawa Elevated Tank", asset_type:"Tank", asset_code:"TK-001", status:"active", location:"Kahawa West", gps_latitude:-1.1567, gps_longitude:36.9012, installation_date:"2015-07-22", last_maintenance_date:"2024-07-05", next_maintenance_date:"2025-07-05", notes:"Capacity 200,000L" },
  { id:7, asset_name:"Backup Pump Unit 2", asset_type:"Pump", asset_code:"PMP-002", status:"active", location:"Kiambu Station B", gps_latitude:-1.1801, gps_longitude:36.8401, installation_date:"2021-09-14", last_maintenance_date:"2024-10-20", next_maintenance_date:"2025-04-20", notes:"Standby unit" },
  { id:8, asset_name:"Solar Array Unit 1", asset_type:"Solar Panel", asset_code:"SP-001", status:"decommissioned", location:"Ruiru Pumping Station", gps_latitude:-1.1490, gps_longitude:36.9580, installation_date:"2018-04-01", last_maintenance_date:"2023-06-01", next_maintenance_date:"2024-06-01", notes:"Replaced by grid power" },
];

const statusColor = (s, colors) => {
  if (s === "active") return colors.greenAccent[500];
  if (s === "maintenance") return "#f0c040";
  if (s === "decommissioned") return colors.redAccent[400];
  return colors.grey[400];
};
const daysSince = (d) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : 0;
const daysUntil = (d) => d ? Math.floor((new Date(d).getTime() - Date.now()) / 86400000) : 9999;
const emptyForm = { asset_name:"", asset_type:"Pump", asset_code:"", status:"active", location:"", installation_date:"", notes:"" };
const emptyMaint = { maintenance_type:"Inspection", scheduled_date:"", description:"", assigned_to:"" };
const emptyIncident = { incident_type:"Pipe Burst", severity:"medium", description:"", reported_by:"" };

// Map marker positions derived from GPS (normalized to SVG viewport)
const toSVG = (lat, lng, assets) => {
  const lats = assets.map(a => a.gps_latitude).filter(Boolean);
  const lngs = assets.map(a => a.gps_longitude).filter(Boolean);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const pad = 10;
  const x = pad + ((lng - minLng) / (maxLng - minLng || 1)) * (100 - 2 * pad);
  const y = pad + ((maxLat - lat) / (maxLat - minLat || 1)) * (100 - 2 * pad);
  return { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) };
};

const AssetRegister = () => {
  const colors = tokens(useTheme().palette.mode);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [maintDialog, setMaintDialog] = useState({ open: false, asset: null });
  const [maintForm, setMaintForm] = useState(emptyMaint);
  const [incidentDialog, setIncidentDialog] = useState({ open: false, asset: null });
  const [incidentForm, setIncidentForm] = useState(emptyIncident);
  const [mapSelected, setMapSelected] = useState(null);
  const [mapHovered, setMapHovered] = useState(null);
  const [success, setSuccess] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.get("/admin/assets")
      .then(res => {
        const d = res.data?.assets || res.data?.data?.assets || res.assets;
        setAssets(Array.isArray(d) && d.length > 0 ? d : mockAssets);
      })
      .catch(() => setAssets(mockAssets))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditAsset(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (a) => {
    setEditAsset(a);
    setForm({ asset_name: a.asset_name, asset_type: a.asset_type, asset_code: a.asset_code, status: a.status, location: a.location, installation_date: a.installation_date || "", notes: a.notes || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editAsset) {
        await adminApi.patch(`/admin/assets/${editAsset.id}`, { asset: form });
        setAssets(prev => prev.map(a => a.id === editAsset.id ? { ...a, ...form } : a));
      } else {
        const res = await adminApi.post("/admin/assets", { asset: form });
        setAssets(prev => [...prev, res.data?.asset || { ...form, id: Date.now() }]);
      }
    } catch {
      setAssets(prev => editAsset ? prev.map(a => a.id === editAsset.id ? { ...a, ...form } : a) : [...prev, { ...form, id: Date.now() }]);
    } finally {
      setSaving(false);
      setDialogOpen(false);
    }
  };

  const handleScheduleMaint = async () => {
    setSaving(true);
    try {
      await adminApi.post("/admin/maintenance", { schedule: { ...maintForm, asset_id: maintDialog.asset?.id } });
    } catch { /* local only */ }

    // Persist to localStorage so PreventiveMaintenance can pick it up
    const newEntry = {
      id: `local-${Date.now()}`,
      asset: { id: maintDialog.asset?.id, name: maintDialog.asset?.asset_name, type: maintDialog.asset?.asset_type },
      maintenance_type: maintForm.maintenance_type,
      scheduled_date: maintForm.scheduled_date,
      description: maintForm.description,
      assigned_to: maintForm.assigned_to,
      status: "scheduled",
      cost: 0,
      completed_date: null,
      completion_notes: null,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("pending_maintenance") || "[]");
      localStorage.setItem("pending_maintenance", JSON.stringify([...existing, newEntry]));
    } catch { /* ignore storage errors */ }

    setSuccess(`Maintenance scheduled for ${maintDialog.asset?.asset_name}`);
    setSaving(false);
    setMaintDialog({ open: false, asset: null });
    setMaintForm(emptyMaint);
  };

  const handleLogIncident = async () => {
    setSaving(true);
    try {
      await adminApi.post("/admin/incidents", { incident: { ...incidentForm, asset_id: incidentDialog.asset?.id } });
    } catch { /* local only */ }
    setSuccess(`Incident logged for ${incidentDialog.asset?.asset_name}`);
    setSaving(false);
    setIncidentDialog({ open: false, asset: null });
    setIncidentForm(emptyIncident);
  };

  const kpis = [
    { label: "Total Assets", value: assets.length, color: colors.blueAccent[400] },
    { label: "Active", value: assets.filter(a => a.status === "active").length, color: colors.greenAccent[400] },
    { label: "Under Maintenance", value: assets.filter(a => a.status === "maintenance").length, color: "#f0c040" },
    { label: "Decommissioned", value: assets.filter(a => a.status === "decommissioned").length, color: colors.redAccent[400] },
    { label: "Due ≤30 Days", value: assets.filter(a => daysUntil(a.next_maintenance_date) <= 30).length, color: "#ff7043" },
  ];

  const maintenanceGroups = {
    Overdue: assets.filter(a => daysUntil(a.next_maintenance_date) < 0),
    "Due This Week": assets.filter(a => { const d = daysUntil(a.next_maintenance_date); return d >= 0 && d <= 7; }),
    "Due This Month": assets.filter(a => { const d = daysUntil(a.next_maintenance_date); return d > 7 && d <= 30; }),
    Upcoming: assets.filter(a => daysUntil(a.next_maintenance_date) > 30),
  };

  const tabSx = {
    "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
    "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
    "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
  };

  const columns = [
    { field: "asset_name", headerName: "Asset Name", flex: 1.2 },
    { field: "asset_type", headerName: "Type", flex: 0.8, renderCell: p => <Chip label={p.value} size="small" sx={{ backgroundColor: colors.blueAccent[700], color: "#fff" }} /> },
    { field: "asset_code", headerName: "Code", flex: 0.7 },
    { field: "status", headerName: "Status", flex: 0.7, renderCell: p => <Chip label={p.value} size="small" sx={{ backgroundColor: statusColor(p.value, colors), color: "#fff" }} /> },
    { field: "location", headerName: "Location", flex: 1 },
    { field: "installation_date", headerName: "Installed", flex: 0.8 },
    { field: "next_maintenance_date", headerName: "Next Maint.", flex: 0.9 },
    { field: "actions", headerName: "Actions", flex: 0.6, sortable: false, renderCell: p => (
      <IconButton size="small" onClick={() => openEdit(p.row)} sx={{ color: colors.blueAccent[400] }}><EditIcon fontSize="small" /></IconButton>
    )},
  ];

  // Compute SVG positions from GPS
  const mapPoints = assets.filter(a => a.gps_latitude && a.gps_longitude).map(a => ({
    ...a, ...toSVG(a.gps_latitude, a.gps_longitude, assets.filter(x => x.gps_latitude && x.gps_longitude)),
  }));

  const openGoogleMaps = (a) => {
    if (a.gps_latitude && a.gps_longitude) {
      window.open(`https://www.google.com/maps?q=${a.gps_latitude},${a.gps_longitude}&z=17&t=k`, "_blank");
    }
  };

  const fieldSx = {
    "& .MuiInputBase-input": { color: colors.grey[100] },
    "& .MuiInputLabel-root": { color: colors.grey[300] },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] },
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Asset Register</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Manage all water system infrastructure assets</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ backgroundColor: colors.blueAccent[700] }}>Add Asset</Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {kpis.map(k => (
          <Card key={k.label} sx={{ flex:"1 1 130px", minWidth:110, backgroundColor:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p:"12px 16px !important" }}>
              <Typography variant="h4" color={k.color} fontWeight="bold">{k.value}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>{k.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {error && <Alert severity="error" sx={{ mb:2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb:2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...tabSx, mb:2 }}>
        <Tab label="Asset Cards" />
        <Tab label="Asset Table" />
        <Tab label="Maintenance Calendar" />
        <Tab label="Map View" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box> : (
        <>
          {/* Tab 0: Asset Cards */}
          {tab === 0 && (
            <Box display="flex" flexWrap="wrap" gap={2}>
              {assets.map(a => {
                const sinceLastMaint = daysSince(a.last_maintenance_date);
                const progress = Math.min((sinceLastMaint / 180) * 100, 100);
                return (
                  <Card key={a.id} sx={{ flex:"1 1 280px", maxWidth:340, backgroundColor:colors.primary[400], border:`1px solid ${statusColor(a.status, colors)}33` }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">{a.asset_name}</Typography>
                        <Chip label={a.status} size="small" sx={{ backgroundColor:statusColor(a.status, colors), color:"#fff", fontSize:"0.75rem" }} />
                      </Box>
                      <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                        <Chip label={a.asset_type} size="small" sx={{ backgroundColor:colors.blueAccent[800], color:colors.blueAccent[200] }} />
                        <Chip label={a.asset_code} size="small" variant="outlined" sx={{ borderColor:colors.grey[600], color:colors.grey[300] }} />
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                        <LocationOnIcon sx={{ fontSize:14, color:colors.grey[500] }} />
                        <Typography variant="caption" color={colors.grey[400]}>{a.location}</Typography>
                      </Box>
                      <Typography variant="caption" color={colors.grey[500]} display="block">Installed: {a.installation_date || "—"}</Typography>
                      <Typography variant="caption" color={colors.grey[500]} display="block">Last Maint: {a.last_maintenance_date || "—"}</Typography>
                      <Typography variant="caption" color={daysUntil(a.next_maintenance_date) <= 30 ? "#ff7043" : colors.grey[500]} display="block">
                        Next Maint: {a.next_maintenance_date || "—"}
                      </Typography>
                      <Box mt={1.5} mb={0.5}>
                        <Typography variant="caption" color={colors.grey[500]}>Days since last maintenance: {sinceLastMaint}</Typography>
                        <LinearProgress variant="determinate" value={progress}
                          sx={{ mt:0.5, height:6, borderRadius:3, backgroundColor:colors.grey[700], "& .MuiLinearProgress-bar":{ backgroundColor: progress > 80 ? colors.redAccent[400] : colors.greenAccent[500] } }} />
                      </Box>
                      <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
                        <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEdit(a)}
                          sx={{ fontSize:"0.75rem", borderColor:colors.blueAccent[600], color:colors.blueAccent[400] }}>Edit</Button>
                        <Button size="small" variant="outlined" startIcon={<BuildIcon />}
                          onClick={() => { setMaintDialog({ open:true, asset:a }); setMaintForm(emptyMaint); }}
                          sx={{ fontSize:"0.75rem", borderColor:"#f0c040", color:"#f0c040" }}>Schedule Maint.</Button>
                        <Button size="small" variant="outlined" startIcon={<WarningAmberIcon />}
                          onClick={() => { setIncidentDialog({ open:true, asset:a }); setIncidentForm(emptyIncident); }}
                          sx={{ fontSize:"0.75rem", borderColor:colors.redAccent[400], color:colors.redAccent[400] }}>Log Incident</Button>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {/* Tab 1: Asset Table */}
          {tab === 1 && (
            <Box height="60vh" sx={{
              "& .MuiDataGrid-root":{ border:"none" },
              "& .MuiDataGrid-cell":{ borderBottom:"none" },
              "& .MuiDataGrid-columnHeaders":{ backgroundColor:colors.blueAccent[700], borderBottom:"none" },
              "& .MuiDataGrid-virtualScroller":{ backgroundColor:colors.primary[400] },
              "& .MuiDataGrid-footerContainer":{ borderTop:"none", backgroundColor:colors.blueAccent[700] },
            }}>
              <DataGrid rows={assets} columns={columns} getRowId={r => r.id} pageSize={10} rowsPerPageOptions={[10,25]} />
            </Box>
          )}

          {/* Tab 2: Maintenance Calendar */}
          {tab === 2 && (() => {
            // Load scheduled entries from localStorage (created via Schedule Maint. button)
            let localScheduled = [];
            try {
              localScheduled = JSON.parse(localStorage.getItem("pending_maintenance") || "[]");
            } catch { /* ignore */ }

            return (
              <Box>
                {/* Scheduled maintenance from Schedule Maint. button */}
                {localScheduled.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="h5" color={colors.blueAccent[400]} fontWeight="bold" mb={1}>
                      Scheduled via Asset Cards ({localScheduled.length})
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={2}>
                      {localScheduled.map((s, i) => (
                        <Card key={s.id || i} sx={{ flex:"1 1 240px", maxWidth:320, backgroundColor:colors.primary[400], borderLeft:`4px solid ${colors.blueAccent[400]}` }}>
                          <CardContent sx={{ p:"12px 16px !important" }}>
                            <Typography variant="body1" color={colors.grey[100]} fontWeight="bold">{s.asset?.name || "Unknown Asset"}</Typography>
                            <Chip label={s.maintenance_type} size="small" sx={{ backgroundColor:colors.blueAccent[800], color:colors.blueAccent[200], mt:0.5, mb:0.5 }} />
                            <Typography variant="caption" color={colors.grey[400]} display="block">{s.asset?.type}</Typography>
                            <Typography variant="body2" color={colors.blueAccent[300]} mt={0.5}>
                              📅 Scheduled: {s.scheduled_date}
                            </Typography>
                            {s.assigned_to && (
                              <Typography variant="caption" color={colors.grey[500]} display="block">
                                Assigned: {s.assigned_to}
                              </Typography>
                            )}
                            {s.description && (
                              <Typography variant="caption" color={colors.grey[500]} display="block" mt={0.3}>
                                {s.description}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                    <Divider sx={{ borderColor:colors.grey[700], mt:2 }} />
                  </Box>
                )}

                {/* Asset next-maintenance groupings */}
                {Object.entries(maintenanceGroups).map(([group, items]) => (
                  <Box key={group} mb={3}>
                    <Typography variant="h5" color={group === "Overdue" ? colors.redAccent[400] : group === "Due This Week" ? "#f0c040" : colors.grey[200]} fontWeight="bold" mb={1}>
                      {group} ({items.length})
                    </Typography>
                    {items.length === 0 ? (
                      <Typography variant="body2" color={colors.grey[500]} ml={2}>None</Typography>
                    ) : (
                      <Box display="flex" flexWrap="wrap" gap={2}>
                        {items.map(a => (
                          <Card key={a.id} sx={{ flex:"1 1 220px", maxWidth:280, backgroundColor:colors.primary[400] }}>
                            <CardContent sx={{ p:"12px 16px !important" }}>
                              <Typography variant="body1" color={colors.grey[100]} fontWeight="bold">{a.asset_name}</Typography>
                              <Typography variant="caption" color={colors.grey[400]}>{a.asset_type} · {a.location}</Typography>
                              <Typography variant="body2" color={group === "Overdue" ? colors.redAccent[400] : "#f0c040"} mt={0.5}>
                                {group === "Overdue" ? `${Math.abs(daysUntil(a.next_maintenance_date))} days overdue` : `Due: ${a.next_maintenance_date}`}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    )}
                    <Divider sx={{ borderColor:colors.grey[700], mt:2 }} />
                  </Box>
                ))}
              </Box>
            );
          })()}

          {/* Tab 3: Map View */}
          {tab === 3 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" color={colors.grey[100]}>Asset Locations — Hover to preview, click to open in Google Maps</Typography>
                <Chip label="GPS coordinates available" size="small" sx={{ backgroundColor:colors.greenAccent[800], color:colors.greenAccent[300] }} />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Card sx={{ backgroundColor:colors.primary[400], border:`1px solid ${colors.grey[700]}` }}>
                    <CardContent sx={{ p:1.5 }}>
                      <Box sx={{ position:"relative", width:"100%", paddingBottom:"65%", backgroundColor:colors.primary[500], borderRadius:1, overflow:"hidden" }}>
                        <svg style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
                          {/* Grid */}
                          {[10,20,30,40,50,60,70,80,90].map(v => (
                            <React.Fragment key={v}>
                              <line x1={v} y1="0" x2={v} y2="100" stroke={colors.grey[800]} strokeWidth="0.25" />
                              <line x1="0" y1={v} x2="100" y2={v} stroke={colors.grey[800]} strokeWidth="0.25" />
                            </React.Fragment>
                          ))}
                          {/* Roads */}
                          <path d="M 0 50 Q 30 45 55 50 Q 75 55 100 50" stroke={colors.grey[700]} strokeWidth="1.2" fill="none" />
                          <path d="M 50 0 Q 48 30 50 55 Q 52 75 50 100" stroke={colors.grey[700]} strokeWidth="1.2" fill="none" />
                          <path d="M 0 75 Q 40 72 70 75 Q 85 77 100 75" stroke={colors.grey[700]} strokeWidth="0.7" fill="none" strokeDasharray="2,2" />
                          {/* Asset markers */}
                          {mapPoints.map(a => {
                            const color = statusColor(a.status, colors);
                            const isHov = mapHovered?.id === a.id;
                            const isSel = mapSelected?.id === a.id;
                            return (
                              <g key={a.id} style={{ cursor:"pointer" }}
                                onMouseEnter={() => setMapHovered(a)}
                                onMouseLeave={() => setMapHovered(null)}
                                onClick={() => setMapSelected(a)}>
                                {(isHov || isSel) && (
                                  <circle cx={a.x} cy={a.y} r="8" fill="none" stroke={color} strokeWidth="0.6" opacity="0.4">
                                    <animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" repeatCount="indefinite" />
                                  </circle>
                                )}
                                <circle cx={a.x} cy={a.y} r={isSel ? 5 : 3.5} fill={color} opacity="0.95" />
                                <circle cx={a.x} cy={a.y} r={isSel ? 7 : 5.5} fill="none" stroke={color} strokeWidth="0.7" opacity="0.5" />
                                {/* Hover tooltip */}
                                {isHov && (
                                  <g>
                                    <rect x={a.x + 5} y={a.y - 12} width={a.asset_name.length * 1.9 + 6} height="14" rx="1.5" fill="rgba(0,0,0,0.85)" />
                                    <text x={a.x + 8} y={a.y - 3} fontSize="3.8" fill="#fff" fontWeight="bold">{a.asset_name}</text>
                                    <text x={a.x + 8} y={a.y + 4} fontSize="3" fill="#aaa">{a.location}</text>
                                  </g>
                                )}
                              </g>
                            );
                          })}
                          {/* Zone labels */}
                          {[["Zone 1",12,18],["Zone 2",55,15],["Zone 3",78,55],["Zone 4",25,75]].map(([l,x,y]) => (
                            <text key={l} x={x} y={y} fontSize="3" fill={colors.grey[600]} opacity="0.6">{l}</text>
                          ))}
                        </svg>
                        {/* Legend */}
                        <Box sx={{ position:"absolute", bottom:8, left:8, backgroundColor:"rgba(0,0,0,0.7)", p:1, borderRadius:1 }}>
                          {[["active",colors.greenAccent[500]],["maintenance","#f0c040"],["decommissioned",colors.redAccent[400]]].map(([s,c]) => (
                            <Box key={s} display="flex" alignItems="center" gap={0.8} mb={0.3}>
                              <Box sx={{ width:9, height:9, borderRadius:"50%", backgroundColor:c }} />
                              <Typography sx={{ fontSize:"0.65rem", color:colors.grey[300] }}>{s}</Typography>
                            </Box>
                          ))}
                        </Box>
                        {/* Instruction */}
                        <Box sx={{ position:"absolute", top:8, right:8, backgroundColor:"rgba(0,0,0,0.6)", px:1, py:0.5, borderRadius:1 }}>
                          <Typography sx={{ fontSize:"0.65rem", color:colors.grey[300] }}>Hover = preview · Click = details</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Side panel */}
                <Grid item xs={12} md={4}>
                  {mapSelected ? (
                    <Card sx={{ backgroundColor:colors.primary[400], border:`1px solid ${statusColor(mapSelected.status, colors)}55` }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                          <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">{mapSelected.asset_name}</Typography>
                          <IconButton size="small" onClick={() => setMapSelected(null)} sx={{ color:colors.grey[500] }}><CloseIcon fontSize="small" /></IconButton>
                        </Box>
                        <Chip label={mapSelected.status} size="small" sx={{ backgroundColor:statusColor(mapSelected.status, colors), color:"#fff", mb:1.5 }} />
                        {[
                          ["Type", mapSelected.asset_type],
                          ["Code", mapSelected.asset_code],
                          ["Location", mapSelected.location],
                          ["GPS", mapSelected.gps_latitude ? `${mapSelected.gps_latitude}, ${mapSelected.gps_longitude}` : "—"],
                          ["Installed", mapSelected.installation_date || "—"],
                          ["Last Maint.", mapSelected.last_maintenance_date || "—"],
                          ["Next Maint.", mapSelected.next_maintenance_date || "—"],
                        ].map(([label, value]) => (
                          <Box key={label} display="flex" gap={1.5} mb={1}>
                            <Typography sx={{ fontSize:"0.8rem", color:colors.grey[500], minWidth:90 }}>{label}:</Typography>
                            <Typography sx={{ fontSize:"0.8rem", color:colors.grey[100] }}>{value}</Typography>
                          </Box>
                        ))}
                        {mapSelected.notes && (
                          <Box mt={1} p={1} sx={{ backgroundColor:colors.primary[500], borderRadius:1 }}>
                            <Typography sx={{ fontSize:"0.8rem", color:colors.grey[300] }}>{mapSelected.notes}</Typography>
                          </Box>
                        )}
                        <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                          <Button size="small" variant="contained" startIcon={<OpenInNewIcon />}
                            onClick={() => openGoogleMaps(mapSelected)}
                            disabled={!mapSelected.gps_latitude}
                            sx={{ backgroundColor:colors.blueAccent[700], fontSize:"0.8rem" }}>
                            Open in Google Maps
                          </Button>
                          <Button size="small" variant="outlined" startIcon={<BuildIcon />}
                            onClick={() => { setMaintDialog({ open:true, asset:mapSelected }); setMaintForm(emptyMaint); }}
                            sx={{ borderColor:"#f0c040", color:"#f0c040", fontSize:"0.8rem" }}>
                            Schedule Maint.
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card sx={{ backgroundColor:colors.primary[400] }}>
                      <CardContent>
                        <Typography variant="h6" color={colors.grey[300]} mb={2}>All Assets ({assets.length})</Typography>
                        {assets.map(a => (
                          <Box key={a.id} onClick={() => setMapSelected(a)}
                            sx={{ p:1, mb:1, borderRadius:1, cursor:"pointer", backgroundColor:colors.primary[500],
                              "&:hover":{ backgroundColor:colors.primary[300] },
                              borderLeft:`3px solid ${statusColor(a.status, colors)}` }}>
                            <Typography sx={{ fontSize:"0.85rem", fontWeight:"bold", color:colors.grey[100] }} noWrap>{a.asset_name}</Typography>
                            <Typography sx={{ fontSize:"0.75rem", color:colors.grey[400] }} noWrap>{a.location}</Typography>
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx:{ backgroundColor:colors.primary[400] } }}>
        <DialogTitle sx={{ color:colors.grey[100], fontSize:"1.2rem !important" }}>{editAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Asset Name *" value={form.asset_name} onChange={e => setForm(f => ({ ...f, asset_name:e.target.value }))} fullWidth sx={fieldSx} />
            <TextField select label="Asset Type" value={form.asset_type} onChange={e => setForm(f => ({ ...f, asset_type:e.target.value }))} fullWidth sx={fieldSx}>
              {ASSET_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Asset Code" value={form.asset_code} onChange={e => setForm(f => ({ ...f, asset_code:e.target.value }))} fullWidth sx={fieldSx} />
            <TextField select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status:e.target.value }))} fullWidth sx={fieldSx}>
              {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField label="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location:e.target.value }))} fullWidth sx={fieldSx} />
            <TextField label="Installation Date" type="date" value={form.installation_date} onChange={e => setForm(f => ({ ...f, installation_date:e.target.value }))} fullWidth InputLabelProps={{ shrink:true }} sx={fieldSx} />
            <TextField label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))} fullWidth multiline rows={2} sx={fieldSx} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color:colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!form.asset_name || saving} onClick={handleSave}
            sx={{ backgroundColor:colors.blueAccent[700] }}>{saving ? "Saving..." : editAsset ? "Update" : "Create"}</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Maintenance Dialog */}
      <Dialog open={maintDialog.open} onClose={() => setMaintDialog({ open:false, asset:null })} maxWidth="sm" fullWidth PaperProps={{ sx:{ backgroundColor:colors.primary[400] } }}>
        <DialogTitle sx={{ color:colors.grey[100], fontSize:"1.2rem !important" }}>
          Schedule Maintenance — {maintDialog.asset?.asset_name}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField select label="Maintenance Type" value={maintForm.maintenance_type} onChange={e => setMaintForm(f => ({ ...f, maintenance_type:e.target.value }))} fullWidth sx={fieldSx}>
              {MAINT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Scheduled Date *" type="date" value={maintForm.scheduled_date} onChange={e => setMaintForm(f => ({ ...f, scheduled_date:e.target.value }))} fullWidth InputLabelProps={{ shrink:true }} sx={fieldSx} />
            <TextField label="Assigned To" value={maintForm.assigned_to} onChange={e => setMaintForm(f => ({ ...f, assigned_to:e.target.value }))} fullWidth sx={fieldSx} />
            <TextField label="Description / Instructions" value={maintForm.description} onChange={e => setMaintForm(f => ({ ...f, description:e.target.value }))} fullWidth multiline rows={3} sx={fieldSx} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaintDialog({ open:false, asset:null })} sx={{ color:colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!maintForm.scheduled_date || saving} onClick={handleScheduleMaint}
            sx={{ backgroundColor:"#f0c040", color:"#000" }}>{saving ? "Scheduling..." : "Schedule"}</Button>
        </DialogActions>
      </Dialog>

      {/* Log Incident Dialog */}
      <Dialog open={incidentDialog.open} onClose={() => setIncidentDialog({ open:false, asset:null })} maxWidth="sm" fullWidth PaperProps={{ sx:{ backgroundColor:colors.primary[400] } }}>
        <DialogTitle sx={{ color:colors.grey[100], fontSize:"1.2rem !important" }}>
          Log Incident — {incidentDialog.asset?.asset_name}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField select label="Incident Type" value={incidentForm.incident_type} onChange={e => setIncidentForm(f => ({ ...f, incident_type:e.target.value }))} fullWidth sx={fieldSx}>
              {INCIDENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Severity" value={incidentForm.severity} onChange={e => setIncidentForm(f => ({ ...f, severity:e.target.value }))} fullWidth sx={fieldSx}>
              {SEVERITIES.map(s => <MenuItem key={s} value={s} sx={{ textTransform:"capitalize" }}>{s}</MenuItem>)}
            </TextField>
            <TextField label="Reported By" value={incidentForm.reported_by} onChange={e => setIncidentForm(f => ({ ...f, reported_by:e.target.value }))} fullWidth sx={fieldSx} />
            <TextField label="Description *" value={incidentForm.description} onChange={e => setIncidentForm(f => ({ ...f, description:e.target.value }))} fullWidth multiline rows={3} sx={fieldSx} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIncidentDialog({ open:false, asset:null })} sx={{ color:colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!incidentForm.description || saving} onClick={handleLogIncident}
            sx={{ backgroundColor:colors.redAccent[600] }}>{saving ? "Logging..." : "Log Incident"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetRegister;
