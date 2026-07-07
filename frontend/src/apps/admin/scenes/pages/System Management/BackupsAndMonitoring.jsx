import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, Tabs, Tab, IconButton, Alert, Divider,
  LinearProgress, CircularProgress, Table, TableHead, TableRow, TableCell,
  TableBody, Switch, FormControlLabel,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import adminApi from "../../../utils/api";
import BackupIcon from "@mui/icons-material/Backup";
import RestoreIcon from "@mui/icons-material/Restore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import StorageIcon from "@mui/icons-material/Storage";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import MemoryIcon from "@mui/icons-material/Memory";
import SpeedIcon from "@mui/icons-material/Speed";
import DnsIcon from "@mui/icons-material/Dns";

const BACKUP_TYPES = ["Full","Incremental","Differential"];
const DESTINATIONS = ["Local Storage","AWS S3","Google Cloud","Azure Blob","FTP Server"];

const MOCK_BACKUPS = [
  { id: 1, name: "Full Backup — May 30, 2025", type: "Full", destination: "AWS S3", size: "4.2 GB", status: "Completed", duration: "18m 32s", createdAt: "2025-05-30 03:00", restorable: true },
  { id: 2, name: "Incremental — May 29, 2025", type: "Incremental", destination: "AWS S3", size: "320 MB", status: "Completed", duration: "2m 10s", createdAt: "2025-05-29 03:00", restorable: true },
  { id: 3, name: "Full Backup — May 23, 2025", type: "Full", destination: "Local Storage", size: "3.9 GB", status: "Completed", duration: "16m 55s", createdAt: "2025-05-23 03:00", restorable: true },
  { id: 4, name: "Incremental — May 28, 2025", type: "Incremental", destination: "AWS S3", size: "280 MB", status: "Failed", duration: "—", createdAt: "2025-05-28 03:00", restorable: false },
  { id: 5, name: "Differential — May 27, 2025", type: "Differential", destination: "Google Cloud", size: "1.1 GB", status: "Completed", duration: "5m 44s", createdAt: "2025-05-27 03:00", restorable: true },
];

const MOCK_SCHEDULES = [
  { id: 1, name: "Nightly Full Backup", type: "Full", frequency: "Daily", time: "03:00 AM", destination: "AWS S3", retention: 30, active: true },
  { id: 2, name: "Hourly Incremental", type: "Incremental", frequency: "Hourly", time: "Every hour", destination: "AWS S3", retention: 7, active: true },
  { id: 3, name: "Weekly Archive", type: "Full", frequency: "Weekly", time: "Sunday 01:00 AM", destination: "Google Cloud", retention: 90, active: false },
];

const MOCK_ALERTS = [
  { id: 1, level: "error", message: "Backup failed: Incremental May 28 — connection timeout to AWS S3", time: "2025-05-28 03:04" },
  { id: 2, level: "warning", message: "Disk usage at 78% — consider archiving old backups", time: "2025-05-30 08:15" },
  { id: 3, level: "success", message: "Full backup completed successfully — 4.2 GB stored to AWS S3", time: "2025-05-30 03:19" },
  { id: 4, level: "info", message: "Backup schedule updated: Nightly Full Backup retention changed to 30 days", time: "2025-05-25 14:00" },
];

function TabPanel({ children, value, index }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

const BackupsAndMonitoring = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [backups, setBackups] = useState(MOCK_BACKUPS);
  const [schedules, setSchedules] = useState(MOCK_SCHEDULES);
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(null);
  const [tab, setTab] = useState(0);
  const [alert, setAlert] = useState(null);
  const [creating, setCreating] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [newBackupForm, setNewBackupForm] = useState({ type: "Full", destination: "AWS S3" });
  const [createOpen, setCreateOpen] = useState(false);

  const showAlert = (msg, sev = "success") => { setAlert({ msg, sev }); setTimeout(() => setAlert(null), 4000); };

  useEffect(() => {
    const fetch = () => {
      adminApi.get("/admin/system/health")
        .then(res => setHealth(res.data?.data || res.data))
        .catch(err => setHealthError(err.message))
        .finally(() => setHealthLoading(false));
    };
    fetch();
    const iv = setInterval(fetch, 30000);
    return () => clearInterval(iv);
  }, []);

  const handleCreateBackup = () => {
    setCreating(true);
    const id = Date.now();
    const now = new Date();
    const entry = {
      id, name: `${newBackupForm.type} Backup — ${now.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}`,
      type: newBackupForm.type, destination: newBackupForm.destination,
      size: "—", status: "In Progress", duration: "—",
      createdAt: now.toLocaleString(), restorable: false,
    };
    setBackups(prev => [entry, ...prev]);
    setCreateOpen(false);
    setTimeout(() => {
      const size = newBackupForm.type === "Full" ? `${(3.5 + Math.random()).toFixed(1)} GB` : `${Math.round(200 + Math.random() * 400)} MB`;
      setBackups(prev => prev.map(b => b.id === id ? { ...b, status: "Completed", size, duration: `${Math.round(5 + Math.random() * 20)}m ${Math.round(Math.random() * 59)}s`, restorable: true } : b));
      setCreating(false);
      showAlert("Backup completed successfully.");
    }, 4000);
  };

  const handleRestore = () => {
    setRestoring(true);
    setTimeout(() => {
      setRestoring(false);
      setRestoreTarget(null);
      showAlert(`Restore from "${restoreTarget.name}" completed.`);
    }, 3000);
  };

  const handleDeleteBackup = (id) => {
    setBackups(prev => prev.filter(b => b.id !== id));
    showAlert("Backup deleted.", "info");
  };

  const toggleSchedule = (id) => setSchedules(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));

  const tables = health?.tables || {};
  const totalRecords = Object.values(tables).reduce((a, b) => a + (b || 0), 0);
  const dbStatus = health?.database || "unknown";

  const dgSx = {
    "& .MuiDataGrid-root": { border: "none" },
    "& .MuiDataGrid-cell": { borderBottom: "none" },
    "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], color: colors.grey[100], borderBottom: "none" },
    "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
    "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
    "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
    "& .MuiDataGrid-toolbarContainer .MuiButton-text": { color: `${colors.grey[100]} !important` },
  };

  const columns = [
    { field: "name", headerName: "Backup Name", flex: 1.8,
      renderCell: p => (
        <Box>
          <Typography variant="body2" fontWeight="bold">{p.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{p.row.destination}</Typography>
        </Box>
      )
    },
    { field: "type", headerName: "Type", flex: 0.7,
      renderCell: p => <Chip label={p.value} size="small" color={p.value === "Full" ? "primary" : p.value === "Incremental" ? "info" : "secondary"} />
    },
    { field: "size", headerName: "Size", flex: 0.7 },
    { field: "duration", headerName: "Duration", flex: 0.7 },
    { field: "status", headerName: "Status", flex: 0.9,
      renderCell: p => (
        <Chip
          icon={p.value === "Completed" ? <CheckCircleIcon /> : p.value === "In Progress" ? <CircularProgress size={12} /> : <ErrorIcon />}
          label={p.value}
          color={p.value === "Completed" ? "success" : p.value === "In Progress" ? "warning" : "error"}
          size="small"
        />
      )
    },
    { field: "createdAt", headerName: "Created", flex: 1 },
    { field: "actions", headerName: "Actions", flex: 1.2, sortable: false,
      renderCell: p => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Restore">
            <span>
              <IconButton size="small" color="info" disabled={!p.row.restorable} onClick={() => setRestoreTarget(p.row)}>
                <RestoreIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Download">
            <span>
              <IconButton size="small" color="success" disabled={!p.row.restorable}>
                <CloudDownloadIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDeleteBackup(p.row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
            <BackupIcon sx={{ fontSize: 32, color: colors.blueAccent[400] }} />
            Backups & Monitoring
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            System health, backup management, schedules, and alerts.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => window.location.reload()}
            sx={{ color: colors.grey[100], borderColor: colors.grey[600] }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
            sx={{ bgcolor: colors.greenAccent[600], "&:hover": { bgcolor: colors.greenAccent[700] } }}>
            Create Backup
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Total Backups", value: backups.length, color: colors.blueAccent[500] },
          { label: "Completed", value: backups.filter(b => b.status === "Completed").length, color: colors.greenAccent[500] },
          { label: "Failed", value: backups.filter(b => b.status === "Failed").length, color: colors.redAccent[400] },
          { label: "DB Status", value: healthLoading ? "…" : dbStatus, color: dbStatus === "connected" ? colors.greenAccent[500] : colors.redAccent[400] },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ bgcolor: colors.primary[400], borderLeft: `4px solid ${s.color}` }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" color="text.secondary" fontWeight="bold" sx={{ textTransform: "capitalize" }}>{s.value}</Typography>
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
          <Tab label="Backup History" icon={<BackupIcon />} iconPosition="start" />
          <Tab label="System Health" icon={<MonitorHeartIcon />} iconPosition="start" />
          <Tab label="Schedules" icon={<ScheduleIcon />} iconPosition="start" />
          <Tab label="Alerts" icon={<WarningIcon />} iconPosition="start" />
        </Tabs>

        {/* Tab 0: Backup History */}
        <TabPanel value={tab} index={0}>
          <Box p={2} sx={{ height: 480 }}>
            <DataGrid rows={backups} columns={columns} getRowId={r => r.id}
              slots={{ toolbar: GridToolbar }} sx={dgSx} rowHeight={56} />
          </Box>
        </TabPanel>

        {/* Tab 1: System Health */}
        <TabPanel value={tab} index={1}>
          <Box p={2}>
            {healthLoading && <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>}
            {healthError && <Alert severity="warning">Could not load live metrics: {healthError}</Alert>}
            {health && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                    <Chip icon={<DnsIcon />} label={`Database: ${dbStatus}`} color={dbStatus === "connected" ? "success" : "error"} />
                    <Chip icon={<MonitorHeartIcon />} label={`Status: ${health.status || "unknown"}`} color={health.status === "healthy" ? "success" : "warning"} />
                    <Chip icon={<StorageIcon />} label={`Total Records: ${totalRecords.toLocaleString()}`} color="info" />
                  </Box>
                </Grid>
                {Object.entries(tables).map(([table, count]) => (
                  <Grid item xs={12} sm={6} md={4} key={table}>
                    <Card sx={{ bgcolor: colors.primary[500] }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" sx={{ textTransform: "capitalize", fontWeight: "bold" }}>{table}</Typography>
                          <Typography variant="body2" color="text.secondary">{count?.toLocaleString()}</Typography>
                        </Box>
                        <LinearProgress variant="determinate"
                          value={totalRecords > 0 ? Math.min(100, (count / totalRecords) * 100 * 4) : 0}
                          sx={{ height: 5, borderRadius: 3 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Last checked: {health.checked_at ? new Date(health.checked_at).toLocaleString() : "—"} · Auto-refreshes every 30s
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Box>
        </TabPanel>

        {/* Tab 2: Schedules */}
        <TabPanel value={tab} index={2}>
          <Box p={2}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: colors.blueAccent[700], color: colors.grey[100], fontWeight: "bold" } }}>
                  <TableCell>Schedule Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Retention</TableCell>
                  <TableCell>Active</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schedules.map(s => (
                  <TableRow key={s.id} sx={{ "&:hover": { bgcolor: colors.primary[300] } }}>
                    <TableCell><Typography variant="body2" fontWeight="bold">{s.name}</Typography></TableCell>
                    <TableCell><Chip label={s.type} size="small" color={s.type === "Full" ? "primary" : "info"} /></TableCell>
                    <TableCell>{s.frequency}</TableCell>
                    <TableCell><Typography variant="caption">{s.time}</Typography></TableCell>
                    <TableCell>{s.destination}</TableCell>
                    <TableCell>{s.retention} days</TableCell>
                    <TableCell>
                      <Switch checked={s.active} onChange={() => toggleSchedule(s.id)} color="success" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </TabPanel>

        {/* Tab 3: Alerts */}
        <TabPanel value={tab} index={3}>
          <Box p={2} display="flex" flexDirection="column" gap={1.5}>
            {MOCK_ALERTS.map(a => (
              <Alert key={a.id} severity={a.level === "info" ? "info" : a.level}
                icon={a.level === "success" ? <CheckCircleIcon /> : a.level === "error" ? <ErrorIcon /> : a.level === "warning" ? <WarningIcon /> : undefined}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">{a.message}</Typography>
                  <Typography variant="caption" color="text.secondary" ml={2} whiteSpace="nowrap">{a.time}</Typography>
                </Box>
              </Alert>
            ))}
          </Box>
        </TabPanel>
      </Paper>

      {/* Create Backup Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: "#1a2332", color: "#fff" } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography fontWeight="bold">Create Backup</Typography>
          <IconButton onClick={() => setCreateOpen(false)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "#2d3748" }}>
          <FormControl fullWidth sx={{ mb: 2, "& .MuiInputLabel-root": { color: "#b0b8c1" }, "& .MuiOutlinedInput-root": { color: "#fff", "& fieldset": { borderColor: "#4a5568" } }, "& .MuiSelect-icon": { color: "#b0b8c1" } }}>
            <InputLabel>Backup Type</InputLabel>
            <Select value={newBackupForm.type} label="Backup Type" onChange={e => setNewBackupForm(p => ({ ...p, type: e.target.value }))}>
              {BACKUP_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ "& .MuiInputLabel-root": { color: "#b0b8c1" }, "& .MuiOutlinedInput-root": { color: "#fff", "& fieldset": { borderColor: "#4a5568" } }, "& .MuiSelect-icon": { color: "#b0b8c1" } }}>
            <InputLabel>Destination</InputLabel>
            <Select value={newBackupForm.destination} label="Destination" onChange={e => setNewBackupForm(p => ({ ...p, destination: e.target.value }))}>
              {DESTINATIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ color: "#fff" }}>Cancel</Button>
          <Button onClick={handleCreateBackup} variant="contained" disabled={creating}
            sx={{ bgcolor: colors.greenAccent[600], "&:hover": { bgcolor: colors.greenAccent[700] } }}>
            {creating ? <CircularProgress size={20} /> : "Start Backup"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Confirm */}
      {restoreTarget && (
        <Dialog open={!!restoreTarget} onClose={() => setRestoreTarget(null)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { bgcolor: "#1a2332", color: "#fff" } }}>
          <DialogTitle>Confirm Restore</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>This will overwrite current data. Proceed with caution.</Alert>
            <Typography>Restore from: <strong>{restoreTarget?.name}</strong></Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRestoreTarget(null)} sx={{ color: "#fff" }}>Cancel</Button>
            <Button onClick={handleRestore} variant="contained" color="warning" disabled={restoring}>
              {restoring ? <CircularProgress size={20} /> : "Restore"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default BackupsAndMonitoring;
