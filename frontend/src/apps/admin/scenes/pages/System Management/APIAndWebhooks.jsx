import React, { useState, useRef } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Tabs, Tab,
  IconButton, Alert, Divider, Table, TableHead, TableRow, TableCell,
  TableBody, Badge, LinearProgress, InputAdornment,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import HubIcon from "@mui/icons-material/Hub";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import WebhookIcon from "@mui/icons-material/Webhook";
import ApiIcon from "@mui/icons-material/Api";
import HistoryIcon from "@mui/icons-material/History";
import TuneIcon from "@mui/icons-material/Tune";

const METHODS = ["GET","POST","PUT","PATCH","DELETE"];
const TYPES = ["REST API","Webhook","GraphQL","WebSocket"];
const AUTH_TYPES = ["None","API Key","Bearer Token","Basic Auth","OAuth2"];
const EVENTS = ["payment.received","user.created","connection.approved","meter.reading","alert.triggered","backup.completed"];

const EMPTY_FORM = {
  name: "", type: "REST API", endpoint: "", method: "POST",
  authType: "API Key", secret: "", active: true, retries: 3,
  description: "", events: [],
};

const MOCK_INTEGRATIONS = [
  { id: 1, name: "Payment Gateway Webhook", type: "Webhook", endpoint: "https://payments.example.com/webhook/water",
    method: "POST", authType: "Bearer Token", secret: "sk_live_abc123xyz", active: true, retries: 3,
    description: "Receives payment confirmations from payment processor", events: ["payment.received"],
    lastTriggered: "2025-05-30 14:22", successRate: 98, totalCalls: 1240 },
  { id: 2, name: "SMS Notification API", type: "REST API", endpoint: "https://api.smsgateway.co.ke/send",
    method: "POST", authType: "API Key", secret: "sms_key_9f3b2c", active: true, retries: 2,
    description: "Sends SMS alerts to customers", events: ["alert.triggered","user.created"],
    lastTriggered: "2025-05-30 09:10", successRate: 95, totalCalls: 8320 },
  { id: 3, name: "Meter Reading Sync", type: "REST API", endpoint: "https://scada.waterboard.go.ke/api/readings",
    method: "GET", authType: "Basic Auth", secret: "user:pass_encoded", active: false, retries: 5,
    description: "Pulls meter readings from SCADA system", events: ["meter.reading"],
    lastTriggered: "2025-05-28 06:00", successRate: 72, totalCalls: 430 },
  { id: 4, name: "Backup Completion Hook", type: "Webhook", endpoint: "https://monitor.internal/hooks/backup",
    method: "POST", authType: "None", secret: "", active: true, retries: 1,
    description: "Notifies monitoring system when backup completes", events: ["backup.completed"],
    lastTriggered: "2025-05-30 03:00", successRate: 100, totalCalls: 90 },
];

const MOCK_LOGS = [
  { id: 1, integration: "Payment Gateway Webhook", status: 200, duration: "142ms", timestamp: "2025-05-30 14:22:01", payload: '{"event":"payment.received","amount":1500}' },
  { id: 2, integration: "SMS Notification API", status: 200, duration: "89ms", timestamp: "2025-05-30 09:10:44", payload: '{"to":"+254700000000","message":"Bill ready"}' },
  { id: 3, integration: "Meter Reading Sync", status: 503, duration: "5001ms", timestamp: "2025-05-28 06:00:12", payload: '{"error":"Service unavailable"}' },
  { id: 4, integration: "Payment Gateway Webhook", status: 200, duration: "201ms", timestamp: "2025-05-29 11:05:33", payload: '{"event":"payment.received","amount":800}' },
  { id: 5, integration: "Backup Completion Hook", status: 200, duration: "55ms", timestamp: "2025-05-30 03:00:05", payload: '{"backup":"completed","size":"2.4GB"}' },
];

const MOCK_KEYS = [
  { id: 1, name: "Production API Key", key: "wtr_prod_8f3b2c9d4e1a7f6b", scope: "read,write", created: "2024-01-15", lastUsed: "2025-05-30", active: true },
  { id: 2, name: "Read-Only Key", key: "wtr_ro_1a2b3c4d5e6f7890", scope: "read", created: "2024-06-01", lastUsed: "2025-05-28", active: true },
  { id: 3, name: "Legacy Integration Key", key: "wtr_leg_0987654321abcdef", scope: "read,write,admin", created: "2023-03-10", lastUsed: "2025-01-05", active: false },
];

function TabPanel({ children, value, index }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

const methodColor = { GET: "success", POST: "primary", PUT: "warning", PATCH: "info", DELETE: "error" };

const APIAndWebhooks = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [integrations, setIntegrations] = useState(MOCK_INTEGRATIONS);
  const [logs] = useState(MOCK_LOGS);
  const [keys, setKeys] = useState(MOCK_KEYS);
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [alert, setAlert] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});

  const showAlert = (msg, sev = "success") => { setAlert({ msg, sev }); setTimeout(() => setAlert(null), 3500); };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...r }); setOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.endpoint) { showAlert("Name and endpoint are required.", "error"); return; }
    if (editing) {
      setIntegrations(prev => prev.map(i => i.id === editing.id ? { ...form, id: editing.id, lastTriggered: editing.lastTriggered, successRate: editing.successRate, totalCalls: editing.totalCalls } : i));
      showAlert("Integration updated.");
    } else {
      setIntegrations(prev => [{ ...form, id: Date.now(), lastTriggered: "Never", successRate: 0, totalCalls: 0 }, ...prev]);
      showAlert("Integration created.");
    }
    setOpen(false);
  };

  const handleDelete = (id) => { setIntegrations(prev => prev.filter(i => i.id !== id)); setDeleteConfirm(null); showAlert("Integration deleted.", "info"); };
  const toggleActive = (id) => setIntegrations(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i));

  const handleTest = (row) => {
    setTesting(true); setTestResult(null);
    setTimeout(() => {
      const ok = Math.random() > 0.25;
      setTestResult({ ok, status: ok ? 200 : 503, msg: ok ? "Connection successful — endpoint responded with 200 OK." : "Connection failed — endpoint returned 503 Service Unavailable.", integration: row.name });
      setTesting(false);
    }, 1500);
  };

  const copyKey = (k) => { navigator.clipboard.writeText(k); showAlert("Copied to clipboard.", "info"); };
  const revokeKey = (id) => setKeys(prev => prev.map(k => k.id === id ? { ...k, active: false } : k));
  const generateKey = () => {
    const newKey = { id: Date.now(), name: "New API Key", key: `wtr_new_${Math.random().toString(36).slice(2,18)}`, scope: "read", created: new Date().toISOString().split("T")[0], lastUsed: "Never", active: true };
    setKeys(prev => [newKey, ...prev]);
    showAlert("New API key generated.");
  };

  const f = (k) => (e) => setForm(v => ({ ...v, [k]: e.target.value }));
  const fChk = (k) => (e) => setForm(v => ({ ...v, [k]: e.target.checked }));

  const stats = {
    total: integrations.length,
    active: integrations.filter(i => i.active).length,
    webhooks: integrations.filter(i => i.type === "Webhook").length,
    avgSuccess: integrations.length ? Math.round(integrations.reduce((a, i) => a + i.successRate, 0) / integrations.length) : 0,
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
    { field: "name", headerName: "Name", flex: 1.4,
      renderCell: p => (
        <Box>
          <Typography variant="body2" fontWeight="bold">{p.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{p.row.description?.slice(0,45)}…</Typography>
        </Box>
      )
    },
    { field: "type", headerName: "Type", flex: 0.8,
      renderCell: p => <Chip icon={p.value === "Webhook" ? <WebhookIcon sx={{ fontSize: 14 }} /> : <ApiIcon sx={{ fontSize: 14 }} />} label={p.value} size="small" variant="outlined" />
    },
    { field: "method", headerName: "Method", flex: 0.6,
      renderCell: p => <Chip label={p.value} color={methodColor[p.value] || "default"} size="small" />
    },
    { field: "successRate", headerName: "Success", flex: 0.7,
      renderCell: p => (
        <Box width="100%">
          <Typography variant="caption">{p.value}%</Typography>
          <LinearProgress variant="determinate" value={p.value}
            color={p.value >= 90 ? "success" : p.value >= 70 ? "warning" : "error"}
            sx={{ height: 4, borderRadius: 2 }} />
        </Box>
      )
    },
    { field: "active", headerName: "Status", flex: 0.7,
      renderCell: p => <Chip label={p.value ? "Active" : "Disabled"} color={p.value ? "success" : "default"} size="small" />
    },
    { field: "lastTriggered", headerName: "Last Triggered", flex: 1 },
    { field: "actions", headerName: "Actions", flex: 1.5, sortable: false,
      renderCell: p => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Test Connection">
            <IconButton size="small" color="info" onClick={() => handleTest(p.row)}><PlayArrowIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p.row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={p.row.active ? "Disable" : "Enable"}>
            <IconButton size="small" color={p.row.active ? "warning" : "success"} onClick={() => toggleActive(p.row.id)}>
              {p.row.active ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteConfirm(p.row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      )
    },
  ];

  return (
    <Box m="20px">
      {alert && <Alert severity={alert.sev} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.msg}</Alert>}
      {testResult && (
        <Alert severity={testResult.ok ? "success" : "error"} sx={{ mb: 2 }} onClose={() => setTestResult(null)}>
          <strong>{testResult.integration}</strong> — {testResult.msg}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h3" fontWeight="bold" color={colors.grey[100]} display="flex" alignItems="center" gap={1}>
            <HubIcon sx={{ fontSize: 32, color: colors.blueAccent[400] }} />
            API & Webhooks
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage integrations, webhooks, API keys, and monitor call logs.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ bgcolor: colors.greenAccent[600], "&:hover": { bgcolor: colors.greenAccent[700] } }}>
          New Integration
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Total Integrations", value: stats.total, color: colors.blueAccent[500] },
          { label: "Active", value: stats.active, color: colors.greenAccent[500] },
          { label: "Webhooks", value: stats.webhooks, color: colors.blueAccent[400] },
          { label: "Avg Success Rate", value: `${stats.avgSuccess}%`, color: stats.avgSuccess >= 90 ? colors.greenAccent[500] : colors.redAccent[400] },
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
          <Tab label="Integrations" icon={<HubIcon />} iconPosition="start" />
          <Tab label="Call Logs" icon={<HistoryIcon />} iconPosition="start" />
          <Tab label="API Keys" icon={<VpnKeyIcon />} iconPosition="start" />
        </Tabs>

        {/* Tab 0: Integrations */}
        <TabPanel value={tab} index={0}>
          <Box p={2} sx={{ height: 480 }}>
            <DataGrid rows={integrations} columns={columns} getRowId={r => r.id}
              slots={{ toolbar: GridToolbar }} sx={dgSx} rowHeight={56} />
          </Box>
        </TabPanel>

        {/* Tab 1: Call Logs */}
        <TabPanel value={tab} index={1}>
          <Box p={2}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: colors.blueAccent[700], color: colors.grey[100], fontWeight: "bold" } }}>
                  <TableCell>Integration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Payload Preview</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id} sx={{ "&:hover": { bgcolor: colors.primary[300] } }}>
                    <TableCell><Typography variant="body2">{log.integration}</Typography></TableCell>
                    <TableCell>
                      <Chip label={log.status} color={log.status === 200 ? "success" : "error"} size="small" />
                    </TableCell>
                    <TableCell><Typography variant="body2">{log.duration}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{log.timestamp}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", color: colors.grey[300] }}>
                        {log.payload.slice(0, 50)}…
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </TabPanel>

        {/* Tab 2: API Keys */}
        <TabPanel value={tab} index={2}>
          <Box p={2}>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={generateKey}
                sx={{ bgcolor: colors.greenAccent[600], "&:hover": { bgcolor: colors.greenAccent[700] } }}>
                Generate Key
              </Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: colors.blueAccent[700], color: colors.grey[100], fontWeight: "bold" } }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Key</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {keys.map(k => (
                  <TableRow key={k.id} sx={{ "&:hover": { bgcolor: colors.primary[300] } }}>
                    <TableCell><Typography variant="body2" fontWeight="bold">{k.name}</Typography></TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                          {showSecrets[k.id] ? k.key : `${k.key.slice(0,12)}${"•".repeat(10)}`}
                        </Typography>
                        <IconButton size="small" onClick={() => setShowSecrets(p => ({ ...p, [k.id]: !p[k.id] }))}>
                          {showSecrets[k.id] ? <VisibilityOffIcon sx={{ fontSize: 14 }} /> : <VisibilityIcon sx={{ fontSize: 14 }} />}
                        </IconButton>
                        <IconButton size="small" onClick={() => copyKey(k.key)}><ContentCopyIcon sx={{ fontSize: 14 }} /></IconButton>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={k.scope} size="small" variant="outlined" /></TableCell>
                    <TableCell><Typography variant="caption">{k.created}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{k.lastUsed}</Typography></TableCell>
                    <TableCell><Chip label={k.active ? "Active" : "Revoked"} color={k.active ? "success" : "default"} size="small" /></TableCell>
                    <TableCell>
                      {k.active && (
                        <Button size="small" color="error" variant="outlined" onClick={() => revokeKey(k.id)}>Revoke</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </TabPanel>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { bgcolor: "#1a2332", color: "#fff" } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5" fontWeight="bold">{editing ? "Edit Integration" : "New Integration"}</Typography>
          <IconButton onClick={() => setOpen(false)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "#2d3748" }}>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Integration Name" value={form.name} onChange={f("name")} sx={inputSx} /></Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth sx={inputSx}><InputLabel>Type</InputLabel>
                <Select value={form.type} label="Type" onChange={f("type")}>
                  {TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={9}><TextField fullWidth label="Endpoint URL" value={form.endpoint} onChange={f("endpoint")} placeholder="https://api.example.com/webhook" sx={inputSx} /></Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth sx={inputSx}><InputLabel>Method</InputLabel>
                <Select value={form.method} label="Method" onChange={f("method")}>
                  {METHODS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={inputSx}><InputLabel>Auth Type</InputLabel>
                <Select value={form.authType} label="Auth Type" onChange={f("authType")}>
                  {AUTH_TYPES.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Secret / Token" value={form.secret} onChange={f("secret")} type="password" sx={inputSx} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Max Retries" type="number" value={form.retries} onChange={f("retries")} inputProps={{ min: 0, max: 10 }} sx={inputSx} /></Grid>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Description" value={form.description} onChange={f("description")} sx={inputSx} /></Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={form.active} onChange={fChk("active")} color="success" />} label="Active" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #2d3748" }}>
          <Button onClick={() => setOpen(false)} variant="outlined" sx={{ color: "#fff", borderColor: "#4a5568" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: colors.greenAccent[600], "&:hover": { bgcolor: colors.greenAccent[700] } }}>
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { bgcolor: "#1a2332", color: "#fff" } }}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent><Typography>Remove <strong>{deleteConfirm.name}</strong>?</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)} sx={{ color: "#fff" }}>Cancel</Button>
            <Button onClick={() => handleDelete(deleteConfirm.id)} variant="contained" color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default APIAndWebhooks;
