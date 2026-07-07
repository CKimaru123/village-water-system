import React, { useState } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, Tabs, Tab, IconButton, Alert, Divider,
  LinearProgress, Table, TableHead, TableRow, TableCell, TableBody,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import DevicesIcon from "@mui/icons-material/Devices";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import CloseIcon from "@mui/icons-material/Close";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import LaptopIcon from "@mui/icons-material/Laptop";
import TabletIcon from "@mui/icons-material/Tablet";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import RefreshIcon from "@mui/icons-material/Refresh";
import BugReportIcon from "@mui/icons-material/BugReport";

const DEVICE_TYPES = ["Desktop","Laptop","Tablet","Smartphone","Smart TV","IoT Device","Kiosk"];
const OS_LIST = ["Windows 11","Windows 10","macOS Ventura","macOS Sonoma","Ubuntu 24.04","Android 14","Android 13","iOS 17","iPadOS 17","ChromeOS","Other"];
const BROWSERS = ["Chrome 124+","Firefox 125+","Safari 17+","Edge 124+","Opera 109+","Samsung Internet","Other"];
const COMPAT_STATUSES = ["Fully Compatible","Compatible with Warnings","Partial Support","Unsupported"];

const EMPTY_DEVICE = { deviceType: "Laptop", os: "", browser: "", compatibility: "Fully Compatible", notes: "", lastChecked: new Date().toISOString().split("T")[0] };

const MOCK_DEVICES = [
  { id: 1, deviceType: "Laptop", os: "Windows 11", browser: "Chrome 124+", compatibility: "Fully Compatible", notes: "All features work as expected", lastChecked: "2025-05-30", testedBy: "QA Team" },
  { id: 2, deviceType: "Smartphone", os: "Android 14", browser: "Chrome 124+", compatibility: "Fully Compatible", notes: "Responsive layout confirmed", lastChecked: "2025-05-29", testedBy: "QA Team" },
  { id: 3, deviceType: "Tablet", os: "iPadOS 17", browser: "Safari 17+", compatibility: "Compatible with Warnings", notes: "File upload modal has minor layout issue", lastChecked: "2025-05-28", testedBy: "Dev Team" },
  { id: 4, deviceType: "Desktop", os: "Ubuntu 24.04", browser: "Firefox 125+", compatibility: "Compatible with Warnings", notes: "PDF export requires additional font package", lastChecked: "2025-05-27", testedBy: "QA Team" },
  { id: 5, deviceType: "Desktop", os: "Windows 10", browser: "Edge 124+", compatibility: "Fully Compatible", notes: "Tested all modules", lastChecked: "2025-05-26", testedBy: "QA Team" },
  { id: 6, deviceType: "Smartphone", os: "iOS 17", browser: "Safari 17+", compatibility: "Partial Support", notes: "WebSocket features limited on iOS Safari", lastChecked: "2025-05-25", testedBy: "Dev Team" },
  { id: 7, deviceType: "Smart TV", os: "Android 13", browser: "Chrome 124+", compatibility: "Unsupported", notes: "Screen resolution too low for dashboard", lastChecked: "2025-05-20", testedBy: "QA Team" },
  { id: 8, deviceType: "Laptop", os: "macOS Sonoma", browser: "Safari 17+", compatibility: "Fully Compatible", notes: "All features verified", lastChecked: "2025-05-30", testedBy: "Dev Team" },
];

const MOCK_ISSUES = [
  { id: 1, device: "iPad / iPadOS 17 / Safari", issue: "File upload modal misaligned on portrait mode", severity: "Low", status: "Open", reported: "2025-05-28" },
  { id: 2, device: "iPhone / iOS 17 / Safari", issue: "WebSocket connection drops after 30s idle", severity: "Medium", status: "In Progress", reported: "2025-05-25" },
  { id: 3, device: "Ubuntu / Firefox", issue: "PDF export missing Noto Sans font", severity: "Low", status: "Resolved", reported: "2025-05-20" },
  { id: 4, device: "Smart TV / Android", issue: "Dashboard layout breaks below 1024px width", severity: "High", status: "Won't Fix", reported: "2025-05-20" },
];

const compatColor = { "Fully Compatible": "success", "Compatible with Warnings": "warning", "Partial Support": "info", "Unsupported": "error" };
const severityColor = { Low: "info", Medium: "warning", High: "error" };
const issueStatusColor = { Open: "error", "In Progress": "warning", Resolved: "success", "Won't Fix": "default" };

const deviceIcon = (type) => {
  if (type === "Smartphone") return <SmartphoneIcon fontSize="small" />;
  if (type === "Tablet") return <TabletIcon fontSize="small" />;
  if (type === "Laptop") return <LaptopIcon fontSize="small" />;
  return <DesktopWindowsIcon fontSize="small" />;
};

function TabPanel({ children, value, index }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

const DeviceCompatibility = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [devices, setDevices] = useState(MOCK_DEVICES);
  const [issues, setIssues] = useState(MOCK_ISSUES);
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_DEVICE);
  const [alert, setAlert] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showAlert = (msg, sev = "success") => { setAlert({ msg, sev }); setTimeout(() => setAlert(null), 3500); };
  const openCreate = () => { setEditing(null); setForm(EMPTY_DEVICE); setOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...r }); setOpen(true); };

  const handleSave = () => {
    if (!form.os || !form.browser) { showAlert("OS and browser are required.", "error"); return; }
    if (editing) {
      setDevices(prev => prev.map(d => d.id === editing.id ? { ...form, id: editing.id, testedBy: editing.testedBy } : d));
      showAlert("Device entry updated.");
    } else {
      setDevices(prev => [{ ...form, id: Date.now(), testedBy: "Admin" }, ...prev]);
      showAlert("Device entry added.");
    }
    setOpen(false);
  };

  const handleDelete = (id) => { setDevices(prev => prev.filter(d => d.id !== id)); setDeleteConfirm(null); showAlert("Entry removed.", "info"); };
  const resolveIssue = (id) => setIssues(prev => prev.map(i => i.id === id ? { ...i, status: "Resolved" } : i));

  const f = (k) => (e) => setForm(v => ({ ...v, [k]: e.target.value }));

  const stats = {
    total: devices.length,
    full: devices.filter(d => d.compatibility === "Fully Compatible").length,
    warnings: devices.filter(d => d.compatibility === "Compatible with Warnings").length,
    unsupported: devices.filter(d => d.compatibility === "Unsupported").length,
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
    { field: "deviceType", headerName: "Device", flex: 0.9,
      renderCell: p => <Box display="flex" alignItems="center" gap={0.5}>{deviceIcon(p.value)}<Typography variant="body2">{p.value}</Typography></Box>
    },
    { field: "os", headerName: "Operating System", flex: 1.1 },
    { field: "browser", headerName: "Browser", flex: 1 },
    { field: "compatibility", headerName: "Compatibility", flex: 1.2,
      renderCell: p => <Chip label={p.value} color={compatColor[p.value] || "default"} size="small" />
    },
    { field: "notes", headerName: "Notes", flex: 1.5,
      renderCell: p => <Typography variant="caption" color="text.secondary">{p.value}</Typography>
    },
    { field: "lastChecked", headerName: "Last Checked", flex: 0.8 },
    { field: "actions", headerName: "Actions", flex: 0.9, sortable: false,
      renderCell: p => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Edit"><IconButton size="small" color="info" onClick={() => openEdit(p.row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
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
            <DevicesIcon sx={{ fontSize: 32, color: colors.blueAccent[400] }} />
            Device Compatibility
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Track and manage system compatibility across devices, OS, and browsers.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ bgcolor: colors.greenAccent[600], "&:hover": { bgcolor: colors.greenAccent[700] } }}>
          Add Device
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Devices Tested", value: stats.total, color: colors.blueAccent[500] },
          { label: "Fully Compatible", value: stats.full, color: colors.greenAccent[500] },
          { label: "With Warnings", value: stats.warnings, color: "#ed6c02" },
          { label: "Unsupported", value: stats.unsupported, color: colors.redAccent[400] },
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
          <Tab label="Compatibility Matrix" icon={<DevicesIcon />} iconPosition="start" />
          <Tab label="Known Issues" icon={<BugReportIcon />} iconPosition="start" />
          <Tab label="Coverage Summary" />
        </Tabs>

        {/* Tab 0: Matrix */}
        <TabPanel value={tab} index={0}>
          <Box p={2} sx={{ height: 500 }}>
            <DataGrid rows={devices} columns={columns} getRowId={r => r.id}
              slots={{ toolbar: GridToolbar }} sx={dgSx} rowHeight={56} />
          </Box>
        </TabPanel>

        {/* Tab 1: Known Issues */}
        <TabPanel value={tab} index={1}>
          <Box p={2}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: colors.blueAccent[700], color: colors.grey[100], fontWeight: "bold" } }}>
                  <TableCell>Device / Environment</TableCell>
                  <TableCell>Issue</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reported</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issues.map(issue => (
                  <TableRow key={issue.id} sx={{ "&:hover": { bgcolor: colors.primary[300] } }}>
                    <TableCell><Typography variant="body2" fontWeight="bold">{issue.device}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{issue.issue}</Typography></TableCell>
                    <TableCell><Chip label={issue.severity} color={severityColor[issue.severity] || "default"} size="small" /></TableCell>
                    <TableCell><Chip label={issue.status} color={issueStatusColor[issue.status] || "default"} size="small" /></TableCell>
                    <TableCell><Typography variant="caption">{issue.reported}</Typography></TableCell>
                    <TableCell>
                      {issue.status === "Open" || issue.status === "In Progress" ? (
                        <Button size="small" variant="outlined" color="success" onClick={() => resolveIssue(issue.id)}>Resolve</Button>
                      ) : <Typography variant="caption" color="text.secondary">—</Typography>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </TabPanel>

        {/* Tab 2: Coverage Summary */}
        <TabPanel value={tab} index={2}>
          <Box p={2}>
            <Grid container spacing={2}>
              {COMPAT_STATUSES.map(status => {
                const count = devices.filter(d => d.compatibility === status).length;
                const pct = devices.length ? Math.round((count / devices.length) * 100) : 0;
                return (
                  <Grid item xs={12} sm={6} key={status}>
                    <Card sx={{ bgcolor: colors.primary[500] }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Chip label={status} color={compatColor[status] || "default"} />
                          <Typography variant="h5" fontWeight="bold">{count} devices ({pct}%)</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct}
                          color={compatColor[status] || "primary"}
                          sx={{ height: 8, borderRadius: 4 }} />
                        <Box mt={1.5}>
                          {devices.filter(d => d.compatibility === status).map(d => (
                            <Typography key={d.id} variant="caption" display="block" color="text.secondary">
                              • {d.deviceType} / {d.os} / {d.browser}
                            </Typography>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: "#1a2332", color: "#fff" } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography fontWeight="bold">{editing ? "Edit Device Entry" : "Add Device"}</Typography>
          <IconButton onClick={() => setOpen(false)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "#2d3748" }}>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={inputSx}><InputLabel>Device Type</InputLabel>
                <Select value={form.deviceType} label="Device Type" onChange={f("deviceType")}>
                  {DEVICE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={inputSx}><InputLabel>Operating System</InputLabel>
                <Select value={form.os} label="Operating System" onChange={f("os")}>
                  {OS_LIST.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={inputSx}><InputLabel>Browser</InputLabel>
                <Select value={form.browser} label="Browser" onChange={f("browser")}>
                  {BROWSERS.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={inputSx}><InputLabel>Compatibility</InputLabel>
                <Select value={form.compatibility} label="Compatibility" onChange={f("compatibility")}>
                  {COMPAT_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" value={form.notes} onChange={f("notes")} multiline rows={2} sx={inputSx} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Last Checked" type="date" value={form.lastChecked} onChange={f("lastChecked")} InputLabelProps={{ shrink: true }} sx={inputSx} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #2d3748" }}>
          <Button onClick={() => setOpen(false)} sx={{ color: "#fff" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: colors.greenAccent[600], "&:hover": { bgcolor: colors.greenAccent[700] } }}>
            {editing ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { bgcolor: "#1a2332", color: "#fff" } }}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent><Typography>Remove <strong>{deleteConfirm.deviceType} / {deleteConfirm.os}</strong>?</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)} sx={{ color: "#fff" }}>Cancel</Button>
            <Button onClick={() => handleDelete(deleteConfirm.id)} variant="contained" color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default DeviceCompatibility;
