import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, Tabs, Tab, IconButton, Alert, Divider,
  LinearProgress, Table, TableHead, TableRow, TableCell, TableBody,
  Switch, FormControlLabel, Badge,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import SensorsIcon from "@mui/icons-material/Sensors";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from "@mui/icons-material/Close";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import WaterIcon from "@mui/icons-material/Water";
import BoltIcon from "@mui/icons-material/Bolt";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import RouterIcon from "@mui/icons-material/Router";
import WarningIcon from "@mui/icons-material/Warning";
import RefreshIcon from "@mui/icons-material/Refresh";
import TimelineIcon from "@mui/icons-material/Timeline";
import SettingsIcon from "@mui/icons-material/Settings";

const DEVICE_TYPES = ["Water Quality Sensor","Smart Meter","Flow Sensor","Pressure Sensor","Level Sensor","Pump Controller","Valve Actuator","Weather Station","Gateway","Custom"];
const PROTOCOLS = ["MQTT","HTTP/REST","CoAP","Modbus","LoRaWAN","Zigbee","Z-Wave","BLE"];
const LOCATIONS = ["Zone A - Nairobi North","Zone B - Nairobi South","Zone C - Westlands","Zone D - Eastlands","Pumping Station 1","Pumping Station 2","Reservoir 1","Reservoir 2","Treatment Plant"];

const EMPTY_DEVICE = { name: "", type: DEVICE_TYPES[0], protocol: "MQTT", location: LOCATIONS[0], firmware: "v1.0.0", notes: "" };

const MOCK_DEVICES = [
  { id: 1, name: "WQ-Sensor-001", type: "Water Quality Sensor", protocol: "MQTT", location: "Zone A - Nairobi North",
    status: "Connected", firmware: "v2.3.1", lastPing: "2025-05-30 14:55",
    telemetry: { ph: 7.2, turbidity: 1.4, chlorine: 0.8, temperature: 22.5 }, battery: 87, signalStrength: 92, alerts: 0 },
  { id: 2, name: "SM-BlockA-001", type: "Smart Meter", protocol: "LoRaWAN", location: "Zone B - Nairobi South",
    status: "Connected", firmware: "v1.8.0", lastPing: "2025-05-30 14:54",
    telemetry: { flow: 12.4, totalVolume: 8420, pressure: 3.2, temperature: 21.0 }, battery: 64, signalStrength: 78, alerts: 1 },
  { id: 3, name: "PS-Station1-001", type: "Pressure Sensor", protocol: "Modbus", location: "Pumping Station 1",
    status: "Connected", firmware: "v3.0.0", lastPing: "2025-05-30 14:53",
    telemetry: { pressure: 4.8, flow: 45.2, temperature: 28.1, vibration: 0.02 }, battery: 100, signalStrength: 99, alerts: 0 },
  { id: 4, name: "LS-Reservoir1", type: "Level Sensor", protocol: "HTTP/REST", location: "Reservoir 1",
    status: "Disconnected", firmware: "v1.2.0", lastPing: "2025-05-29 22:10",
    telemetry: { level: 0, capacity: 0, temperature: 0, turbidity: 0 }, battery: 12, signalStrength: 0, alerts: 2 },
  { id: 5, name: "GW-Central-001", type: "Gateway", protocol: "MQTT", location: "Treatment Plant",
    status: "Connected", firmware: "v4.1.2", lastPing: "2025-05-30 14:55",
    telemetry: { connectedDevices: 14, uptime: 99.8, dataRate: 2.4, temperature: 35.0 }, battery: 100, signalStrength: 100, alerts: 0 },
];

const MOCK_ALERTS = [
  { id: 1, device: "SM-BlockA-001", type: "High Flow", message: "Flow rate exceeded threshold: 12.4 L/s (limit: 10 L/s)", severity: "warning", time: "2025-05-30 14:30" },
  { id: 2, device: "LS-Reservoir1", type: "Disconnected", message: "Device offline for more than 12 hours", severity: "error", time: "2025-05-30 10:10" },
  { id: 3, device: "LS-Reservoir1", type: "Low Battery", message: "Battery at 12% — replace soon", severity: "warning", time: "2025-05-29 18:00" },
];

const MOCK_TELEMETRY_HISTORY = [
  { id: 1, device: "WQ-Sensor-001", metric: "pH", value: "7.2", unit: "", time: "14:55" },
  { id: 2, device: "WQ-Sensor-001", metric: "Turbidity", value: "1.4", unit: "NTU", time: "14:55" },
  { id: 3, device: "SM-BlockA-001", metric: "Flow", value: "12.4", unit: "L/s", time: "14:54" },
  { id: 4, device: "PS-Station1-001", metric: "Pressure", value: "4.8", unit: "bar", time: "14:53" },
  { id: 5, device: "GW-Central-001", metric: "Connected Devices", value: "14", unit: "", time: "14:55" },
];

function TabPanel({ children, value, index }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

const signalColor = (s) => s >= 80 ? "success" : s >= 50 ? "warning" : "error";
const batteryColor = (b) => b >= 50 ? "success" : b >= 20 ? "warning" : "error";

const IoTSmartDeviceIntegration = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [devices, setDevices] = useState(MOCK_DEVICES);
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_DEVICE);
  const [alert, setAlert] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const apiToken = "iot_wtr_8f3b2c9d4e1a7f6b_prod_2025";

  const showAlert = (msg, sev = "success") => { setAlert({ msg, sev }); setTimeout(() => setAlert(null), 3500); };

  // Simulate live telemetry updates
  useEffect(() => {
    const iv = setInterval(() => {
      setDevices(prev => prev.map(d => {
        if (d.status !== "Connected") return d;
        const t = d.telemetry;
        const updated = {};
        Object.keys(t).forEach(k => {
          const v = parseFloat(t[k]);
          if (!isNaN(v) && v > 0) updated[k] = parseFloat((v + (Math.random() - 0.5) * v * 0.05).toFixed(2));
          else updated[k] = t[k];
        });
        return { ...d, telemetry: updated, lastPing: new Date().toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "short" }) };
      }));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_DEVICE); setOpen(true); };
  const openEdit = (d) => { setEditing(d); setForm({ name: d.name, type: d.type, protocol: d.protocol, location: d.location, firmware: d.firmware, notes: d.notes || "" }); setOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.type) { showAlert("Name and type are required.", "error"); return; }
    if (editing) {
      setDevices(prev => prev.map(d => d.id === editing.id ? { ...d, ...form } : d));
      showAlert("Device updated.");
    } else {
      const newD = { ...form, id: Date.now(), status: "Disconnected", lastPing: "Never",
        telemetry: {}, battery: 100, signalStrength: 0, alerts: 0 };
      setDevices(prev => [newD, ...prev]);
      showAlert("Device registered.");
    }
    setOpen(false);
  };

  const handleDelete = (id) => { setDevices(prev => prev.filter(d => d.id !== id)); setDeleteConfirm(null); showAlert("Device removed.", "info"); };
  const toggleConnect = (id) => {
    setDevices(prev => prev.map(d => d.id === id
      ? { ...d, status: d.status === "Connected" ? "Disconnected" : "Connected", lastPing: new Date().toLocaleString(), signalStrength: d.status === "Connected" ? 0 : 85 }
      : d));
  };

  const copyToken = () => { navigator.clipboard.writeText(apiToken); showAlert("Token copied.", "info"); };
  const f = (k) => (e) => setForm(v => ({ ...v, [k]: e.target.value }));

  const stats = {
    total: devices.length,
    connected: devices.filter(d => d.status === "Connected").length,
    alerts: MOCK_ALERTS.length,
    avgBattery: Math.round(devices.reduce((a, d) => a + d.battery, 0) / devices.length),
  };

  const dgSx = {
    "& .MuiDataGrid-root": { border: "none" },
    "& .MuiDataGrid-cell": { borderBottom: "none" },
    "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], color: colors.grey[100], borderBottom: "none" },
    "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
    "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
    "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
    "& .MuiDataGrid-toolbarContainer .MuiButton-text": { color: `${colors.grey[100]} !important` },
  };

  const inputSx = {
    mb: 2,
    "& .MuiInputLabel-root": { color: "#b0b8c1" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#90caf9" },
    "& .MuiOutlinedInput-root": { color: "#fff", "& fieldset": { borderColor: "#4a5568" }, "&:hover fieldset": { borderColor: "#90caf9" }, "&.Mui-focused fieldset": { borderColor: "#90caf9" } },
    "& .MuiSelect-icon": { color: "#b0b8c1" },
  };

  const columns = [
    { field: "name", headerName: "Device", flex: 1.2,
      renderCell: p => (
        <Box>
          <Typography variant="body2" fontWeight="bold">{p.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{p.row.type}</Typography>
        </Box>
      )
    },
    { field: "protocol", headerName: "Protocol", flex: 0.7,
      renderCell: p => <Chip label={p.value} size="small" variant="outlined" />
    },
    { field: "location", headerName: "Location", flex: 1.1,
      renderCell: p => <Typography variant="caption">{p.value}</Typography>
    },
    { field: "status", headerName: "Status", flex: 0.7,
      renderCell: p => (
        <Badge badgeContent={p.row.alerts > 0 ? p.row.alerts : null} color="error">
          <Chip label={p.value} color={p.value === "Connected" ? "success" : "default"} size="small" />
        </Badge>
      )
    },
    { field: "battery", headerName: "Battery", flex: 0.7,
      renderCell: p => (
        <Box width="100%">
          <Typography variant="caption">{p.value}%</Typography>
          <LinearProgress variant="determinate" value={p.value} color={batteryColor(p.value)} sx={{ height: 4, borderRadius: 2 }} />
        </Box>
      )
    },
    { field: "signalStrength", headerName: "Signal", flex: 0.7,
      renderCell: p => (
        <Box width="100%">
          <Typography variant="caption">{p.value}%</Typography>
          <LinearProgress variant="determinate" value={p.value} color={signalColor(p.value)} sx={{ height: 4, borderRadius: 2 }} />
        </Box>
      )
    },
    { field: "lastPing", headerName: "Last Ping", flex: 1,
      renderCell: p => <Typography variant="caption">{p.value}</Typography>
    },
    { field: "actions", headerName: "Actions", flex: 1.4, sortable: false,
      renderCell: p => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View Telemetry"><IconButton size="small" color="info" onClick={() => setSelectedDevice(p.row)}><TimelineIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={p.row.status === "Connected" ? "Disconnect" : "Connect"}>
            <IconButton size="small" color={p.row.status === "Connected" ? "warning" : "success"} onClick={() => toggleConnect(p.row.id)}>
              <PowerSettingsNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p.row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteConfirm(p.row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      )
    },
  ];

  return (
    <Box m="20px">
      {alert && <Alert severity={alert.sev} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h3" color={colors.grey[100]} fontWeight="bold" display="flex" alignItems="center" gap={1}>
            <SensorsIcon sx={{ fontSize: 32, color: colors.blueAccent[400] }} />
            IoT & Smart Device Integration
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Monitor, manage, and control IoT devices with live telemetry and alerts.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Chip icon={<SensorsIcon />} label={`${stats.connected}/${stats.total} Online`}
            color={stats.connected === stats.total ? "success" : "warning"} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ bgcolor: colors.greenAccent[600], "&:hover": { bgcolor: colors.greenAccent[700] } }}>
            Register Device
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Total Devices", value: stats.total, color: colors.blueAccent[500] },
          { label: "Connected", value: stats.connected, color: colors.greenAccent[500] },
          { label: "Active Alerts", value: stats.alerts, color: stats.alerts > 0 ? colors.redAccent[400] : colors.greenAccent[500] },
          { label: "Avg Battery", value: `${stats.avgBattery}%`, color: batteryColor(stats.avgBattery) === "success" ? colors.greenAccent[500] : colors.redAccent[400] },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ bgcolor: colors.primary[400], borderLeft: `4px solid ${s.color}` }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" color="text.secondary" fontWeight="bold">{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ bgcolor: colors.primary[400] }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2,
          "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
          "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
          "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
        }}>
          <Tab label="Devices" icon={<SensorsIcon />} iconPosition="start" />
          <Tab label="Live Telemetry" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Alerts" icon={<WarningIcon />} iconPosition="start" />
          <Tab label="Settings" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>

        {/* Tab 0: Devices */}
        <TabPanel value={tab} index={0}>
          <Box p={2} sx={{ height: 500 }}>
            <DataGrid rows={devices} columns={columns} getRowId={r => r.id}
              slots={{ toolbar: GridToolbar }} sx={dgSx} rowHeight={56} />
          </Box>
        </TabPanel>

        {/* Tab 1: Live Telemetry */}
        <TabPanel value={tab} index={1}>
          <Box p={2}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: colors.greenAccent[400], animation: "pulse 1.5s infinite" }} />
              <Typography variant="body2" color={colors.greenAccent[400]}>Live — updates every 5 seconds</Typography>
            </Box>
            <Grid container spacing={2}>
              {devices.filter(d => d.status === "Connected").map(d => (
                <Grid item xs={12} sm={6} md={4} key={d.id}>
                  <Card sx={{ bgcolor: colors.primary[500], border: `1px solid ${colors.primary[300]}` }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" fontWeight="bold">{d.name}</Typography>
                        <Chip label="Live" color="success" size="small" />
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>{d.location}</Typography>
                      <Divider sx={{ mb: 1 }} />
                      {Object.entries(d.telemetry).map(([k, v]) => (
                        <Box key={k} display="flex" justifyContent="space-between" mb={0.3}>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</Typography>
                          <Typography variant="caption" fontWeight="bold">{typeof v === "number" ? v.toFixed(2) : v}</Typography>
                        </Box>
                      ))}
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        Last ping: {d.lastPing}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* Tab 2: Alerts */}
        <TabPanel value={tab} index={2}>
          <Box p={2} display="flex" flexDirection="column" gap={1.5}>
            {MOCK_ALERTS.length === 0 && <Alert severity="success">No active alerts.</Alert>}
            {MOCK_ALERTS.map(a => (
              <Alert key={a.id} severity={a.severity}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" fontWeight="bold">{a.device} — {a.type}</Typography>
                    <Typography variant="caption">{a.message}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" ml={2} whiteSpace="nowrap">{a.time}</Typography>
                </Box>
              </Alert>
            ))}
          </Box>
        </TabPanel>

        {/* Tab 3: Settings */}
        <TabPanel value={tab} index={3}>
          <Box p={2}>
            <Typography variant="h6" fontWeight="bold" mb={2} display="flex" alignItems="center" gap={1}>
              <VpnKeyIcon /> API Integration Token
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Use this token to authenticate IoT devices and external systems communicating with the platform.
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <TextField fullWidth value={showToken ? apiToken : `${apiToken.slice(0, 12)}${"•".repeat(20)}`}
                InputProps={{ readOnly: true, sx: { fontFamily: "monospace", color: "#fff", "& fieldset": { borderColor: "#4a5568" } } }}
                sx={{ "& .MuiInputBase-root": { bgcolor: colors.primary[500] } }} />
              <Tooltip title={showToken ? "Hide" : "Show"}>
                <IconButton onClick={() => setShowToken(p => !p)} sx={{ color: colors.grey[300] }}>
                  {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy">
                <IconButton onClick={copyToken} sx={{ color: colors.grey[300] }}><ContentCopyIcon /></IconButton>
              </Tooltip>
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight="bold" mb={2}>Supported Protocols</Typography>
            <Grid container spacing={1.5}>
              {PROTOCOLS.map(p => (
                <Grid item xs={6} sm={3} key={p}>
                  <Card sx={{ bgcolor: colors.primary[500], textAlign: "center", p: 1 }}>
                    <RouterIcon sx={{ color: colors.blueAccent[400], mb: 0.5 }} />
                    <Typography variant="body2" fontWeight="bold">{p}</Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Telemetry Detail Dialog */}
      {selectedDevice && (
        <Dialog open={!!selectedDevice} onClose={() => setSelectedDevice(null)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { bgcolor: "#1a2332", color: "#fff" } }}>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Typography fontWeight="bold">{selectedDevice.name}</Typography>
              <Typography variant="caption" color="text.secondary">{selectedDevice.type} · {selectedDevice.location}</Typography>
            </Box>
            <IconButton onClick={() => setSelectedDevice(null)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: "#2d3748" }}>
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Status</Typography>
                <Box><Chip label={selectedDevice.status} color={selectedDevice.status === "Connected" ? "success" : "default"} size="small" /></Box>
              </Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Protocol</Typography>
                <Typography variant="body2" fontWeight="bold">{selectedDevice.protocol}</Typography>
              </Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Firmware</Typography>
                <Typography variant="body2" fontWeight="bold">{selectedDevice.firmware}</Typography>
              </Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Last Ping</Typography>
                <Typography variant="body2" fontWeight="bold">{selectedDevice.lastPing}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Battery</Typography>
                <LinearProgress variant="determinate" value={selectedDevice.battery} color={batteryColor(selectedDevice.battery)} sx={{ height: 6, borderRadius: 3, mt: 0.5 }} />
                <Typography variant="caption">{selectedDevice.battery}%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Signal</Typography>
                <LinearProgress variant="determinate" value={selectedDevice.signalStrength} color={signalColor(selectedDevice.signalStrength)} sx={{ height: 6, borderRadius: 3, mt: 0.5 }} />
                <Typography variant="caption">{selectedDevice.signalStrength}%</Typography>
              </Grid>
              <Grid item xs={12}><Divider sx={{ borderColor: "#2d3748" }} /></Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" mb={1}>Telemetry Data</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { bgcolor: colors.blueAccent[700], color: colors.grey[100] } }}>
                      <TableCell>Metric</TableCell><TableCell>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(selectedDevice.telemetry).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell sx={{ textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</TableCell>
                        <TableCell><strong>{typeof v === "number" ? v.toFixed(2) : v}</strong></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSelectedDevice(null)} variant="contained" sx={{ bgcolor: colors.blueAccent[600] }}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: "#1a2332", color: "#fff" } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography fontWeight="bold">{editing ? "Edit Device" : "Register Device"}</Typography>
          <IconButton onClick={() => setOpen(false)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "#2d3748" }}>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12}><TextField fullWidth label="Device Name" value={form.name} onChange={f("name")} sx={inputSx} /></Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={inputSx}><InputLabel>Device Type</InputLabel>
                <Select value={form.type} label="Device Type" onChange={f("type")}>
                  {DEVICE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={inputSx}><InputLabel>Protocol</InputLabel>
                <Select value={form.protocol} label="Protocol" onChange={f("protocol")}>
                  {PROTOCOLS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth sx={inputSx}><InputLabel>Location</InputLabel>
                <Select value={form.location} label="Location" onChange={f("location")}>
                  {LOCATIONS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Firmware Version" value={form.firmware} onChange={f("firmware")} sx={inputSx} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" value={form.notes} onChange={f("notes")} multiline rows={2} sx={inputSx} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #2d3748" }}>
          <Button onClick={() => setOpen(false)} sx={{ color: "#fff" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: colors.greenAccent[600], "&:hover": { bgcolor: colors.greenAccent[700] } }}>
            {editing ? "Update" : "Register"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { bgcolor: "#1a2332", color: "#fff" } }}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent><Typography>Remove device <strong>{deleteConfirm.name}</strong>?</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)} sx={{ color: "#fff" }}>Cancel</Button>
            <Button onClick={() => handleDelete(deleteConfirm.id)} variant="contained" color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default IoTSmartDeviceIntegration;
