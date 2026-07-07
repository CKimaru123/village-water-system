import React, { useState, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Tabs, Tab,
  IconButton, Alert, Divider, LinearProgress, Avatar, Badge,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import ApartmentIcon from "@mui/icons-material/Apartment";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SecurityIcon from "@mui/icons-material/Security";
import StorageIcon from "@mui/icons-material/Storage";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import PublicIcon from "@mui/icons-material/Public";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const REGIONS = ["Africa","North America","Europe","Asia","South America","Oceania","Middle East"];
const PLANS = ["Starter","Professional","Enterprise","Custom"];
const STATUSES = ["Active","Inactive","Suspended","Trial"];

const EMPTY_TENANT = {
  name: "", code: "", region: REGIONS[0], plan: PLANS[1],
  status: STATUSES[0], isolatedDB: true, customDomain: "",
  adminEmail: "", maxUsers: 50, storageGB: 10,
  ssoEnabled: false, apiAccess: true, whiteLabel: false,
};

const MOCK_TENANTS = [
  { id: 1, name: "Nairobi Water Authority", code: "NWA", region: "Africa", plan: "Enterprise",
    status: "Active", isolatedDB: true, customDomain: "nwa.waterportal.co.ke",
    adminEmail: "admin@nwa.co.ke", maxUsers: 500, storageGB: 100,
    ssoEnabled: true, apiAccess: true, whiteLabel: true, users: 312, createdAt: "2024-01-15" },
  { id: 2, name: "Mombasa County Water", code: "MCW", region: "Africa", plan: "Professional",
    status: "Active", isolatedDB: false, customDomain: "",
    adminEmail: "admin@mcw.go.ke", maxUsers: 200, storageGB: 50,
    ssoEnabled: false, apiAccess: true, whiteLabel: false, users: 87, createdAt: "2024-03-22" },
  { id: 3, name: "Rural Water Initiative", code: "RWI", region: "Africa", plan: "Starter",
    status: "Trial", isolatedDB: false, customDomain: "",
    adminEmail: "info@rwi.org", maxUsers: 20, storageGB: 5,
    ssoEnabled: false, apiAccess: false, whiteLabel: false, users: 8, createdAt: "2025-04-01" },
  { id: 4, name: "Kisumu Water Board", code: "KWB", region: "Africa", plan: "Professional",
    status: "Suspended", isolatedDB: true, customDomain: "kwb.water.go.ke",
    adminEmail: "admin@kwb.go.ke", maxUsers: 150, storageGB: 30,
    ssoEnabled: false, apiAccess: true, whiteLabel: false, users: 0, createdAt: "2023-11-10" },
];

const statColor = { Active:"success", Inactive:"default", Suspended:"error", Trial:"warning" };
const planColor = { Starter:"default", Professional:"info", Enterprise:"success", Custom:"secondary" };

function TabPanel({ children, value, index }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

const MultiTenantReadiness = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [tenants, setTenants] = useState(MOCK_TENANTS);
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_TENANT);
  const [detail, setDetail] = useState(null);
  const [alert, setAlert] = useState(null);
  const [showSecret, setShowSecret] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showAlert = (msg, sev = "success") => {
    setAlert({ msg, sev });
    setTimeout(() => setAlert(null), 3500);
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY_TENANT); setOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ ...t }); setOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.code || !form.adminEmail) {
      showAlert("Name, code and admin email are required.", "error"); return;
    }
    if (editing) {
      setTenants(prev => prev.map(t => t.id === editing.id ? { ...form, id: editing.id, users: editing.users, createdAt: editing.createdAt } : t));
      showAlert("Tenant updated successfully.");
    } else {
      const newT = { ...form, id: Date.now(), users: 0, createdAt: new Date().toISOString().split("T")[0] };
      setTenants(prev => [newT, ...prev]);
      showAlert("Tenant created successfully.");
    }
    setOpen(false);
  };

  const handleDelete = (id) => {
    setTenants(prev => prev.filter(t => t.id !== id));
    setDeleteConfirm(null);
    showAlert("Tenant removed.", "info");
  };

  const toggleStatus = (id) => {
    setTenants(prev => prev.map(t => t.id === id
      ? { ...t, status: t.status === "Active" ? "Suspended" : "Active" } : t));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showAlert("Copied to clipboard.", "info");
  };

  const f = (k) => (e) => setForm(v => ({ ...v, [k]: e.target.value }));
  const fChk = (k) => (e) => setForm(v => ({ ...v, [k]: e.target.checked }));

  // Stats
  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === "Active").length,
    totalUsers: tenants.reduce((a, t) => a + t.users, 0),
    enterprise: tenants.filter(t => t.plan === "Enterprise").length,
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

  const columns = [
    { field: "name", headerName: "Tenant Name", flex: 1.5,
      renderCell: p => (
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: colors.blueAccent[600], fontSize: 12 }}>
            {p.row.code?.slice(0,2)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">{p.row.name}</Typography>
            <Typography variant="caption" color="text.secondary">{p.row.code}</Typography>
          </Box>
        </Box>
      )
    },
    { field: "region", headerName: "Region", flex: 0.9,
      renderCell: p => <Box display="flex" alignItems="center" gap={0.5}><PublicIcon fontSize="small" />{p.value}</Box>
    },
    { field: "plan", headerName: "Plan", flex: 0.8,
      renderCell: p => <Chip label={p.value} color={planColor[p.value] || "default"} size="small" />
    },
    { field: "status", headerName: "Status", flex: 0.8,
      renderCell: p => <Chip label={p.value} color={statColor[p.value] || "default"} size="small" />
    },
    { field: "users", headerName: "Users", flex: 0.6,
      renderCell: p => (
        <Box>
          <Typography variant="body2">{p.row.users}/{p.row.maxUsers}</Typography>
          <LinearProgress variant="determinate" value={Math.min(100,(p.row.users/p.row.maxUsers)*100)}
            sx={{ height: 4, borderRadius: 2, mt: 0.5 }} />
        </Box>
      )
    },
    { field: "isolatedDB", headerName: "DB", flex: 0.6,
      renderCell: p => p.value
        ? <Chip icon={<CheckCircleIcon />} label="Isolated" color="success" size="small" />
        : <Chip icon={<CancelIcon />} label="Shared" size="small" />
    },
    { field: "actions", headerName: "Actions", flex: 1.4, sortable: false,
      renderCell: p => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View Details"><IconButton size="small" onClick={() => setDetail(p.row)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" color="info" onClick={() => openEdit(p.row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={p.row.status === "Active" ? "Suspend" : "Activate"}>
            <IconButton size="small" color={p.row.status === "Active" ? "warning" : "success"} onClick={() => toggleStatus(p.row.id)}>
              {p.row.status === "Active" ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteConfirm(p.row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      )
    },
  ];

  const inputSx = {
    mb: 2,
    "& .MuiInputLabel-root": { color: "#b0b8c1" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#90caf9" },
    "& .MuiOutlinedInput-root": {
      color: "#fff",
      "& fieldset": { borderColor: "#4a5568" },
      "&:hover fieldset": { borderColor: "#90caf9" },
      "&.Mui-focused fieldset": { borderColor: "#90caf9" },
    },
    "& .MuiSelect-icon": { color: "#b0b8c1" },
  };

  return (
    <Box m="20px">
      {alert && <Alert severity={alert.sev} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h3" fontWeight="bold" display="flex" color={colors.grey[100]} alignItems="center" gap={1}>
            <ApartmentIcon sx={{ fontSize: 32, color: colors.blueAccent[400] }} />
            Multi-Tenant Readiness
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage isolated tenant environments, plans, and access controls across all organizations.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ bgcolor: colors.greenAccent[600], "&:hover": { bgcolor: colors.greenAccent[700] } }}>
          New Tenant
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Total Tenants", value: stats.total, icon: <ApartmentIcon />, color: colors.blueAccent[500] },
          { label: "Active Tenants", value: stats.active, icon: <CheckCircleIcon />, color: colors.greenAccent[500] },
          { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: <PeopleIcon />, color: colors.blueAccent[400] },
          { label: "Enterprise Plans", value: stats.enterprise, icon: <SecurityIcon />, color: colors.redAccent[400] },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ bgcolor: colors.primary[400], borderLeft: `4px solid ${s.color}` }}>
              <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 2 }}>
                <Box>
                  <Typography variant="h4" color="text.secondary" fontWeight="bold">{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </Box>
                <Box sx={{ color: s.color, opacity: 0.8 }}>{s.icon}</Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ bgcolor: colors.primary[400] }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2,
          "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
          "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
          "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
        }}>
          <Tab label="Tenant Registry" />
          <Tab label="Plan Comparison" />
          <Tab label="Security Policies" />
        </Tabs>

        

        {/* Tab 0: Tenant Registry */}
        <TabPanel value={tab} index={0}>
          <Box p={2} sx={{ height: 480 }}>
            <DataGrid rows={tenants} columns={columns} getRowId={r => r.id}
              slots={{ toolbar: GridToolbar }} sx={dgSx} rowHeight={56} />
          </Box>
        </TabPanel>

        {/* Tab 1: Plan Comparison */}
        <TabPanel value={tab} index={1}>
          <Box p={2}>
            <Grid container spacing={2}>
              {PLANS.map((plan, i) => {
                const count = tenants.filter(t => t.plan === plan).length;
                const features = {
                  Starter: ["Up to 20 users","5 GB storage","Shared DB","Email support"],
                  Professional: ["Up to 200 users","50 GB storage","Shared DB","API access","Priority support"],
                  Enterprise: ["Unlimited users","100+ GB storage","Isolated DB","SSO","White-label","24/7 support"],
                  Custom: ["Custom limits","Custom storage","Custom DB","Full customization","Dedicated support"],
                };
                return (
                  <Grid item xs={12} sm={6} md={3} key={plan}>
                    <Card sx={{ bgcolor: colors.primary[500], border: `1px solid ${colors.primary[300]}`, height: "100%" }}>
                      <CardContent>
                        <Chip label={plan} color={planColor[plan] || "default"} sx={{ mb: 1 }} />
                        <Typography variant="h5" fontWeight="bold">{count} tenant{count !== 1 ? "s" : ""}</Typography>
                        <Divider sx={{ my: 1.5 }} />
                        {features[plan].map(f => (
                          <Box key={f} display="flex" alignItems="center" gap={1} mb={0.5}>
                            <CheckCircleIcon sx={{ fontSize: 14, color: colors.greenAccent[400] }} />
                            <Typography variant="caption">{f}</Typography>
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </TabPanel>

        {/* Tab 2: Security Policies */}
        <TabPanel value={tab} index={2}>
          <Box p={2}>
            <Grid container spacing={2}>
              {[
                { label: "Isolated Databases", count: tenants.filter(t => t.isolatedDB).length, icon: <StorageIcon />, desc: "Tenants with fully isolated database instances" },
                { label: "SSO Enabled", count: tenants.filter(t => t.ssoEnabled).length, icon: <VpnKeyIcon />, desc: "Tenants using Single Sign-On authentication" },
                { label: "API Access", count: tenants.filter(t => t.apiAccess).length, icon: <SettingsIcon />, desc: "Tenants with API integration access" },
                { label: "White-Label", count: tenants.filter(t => t.whiteLabel).length, icon: <ApartmentIcon />, desc: "Tenants with custom branding enabled" },
              ].map((item, i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Card sx={{ bgcolor: colors.primary[500], p: 1 }}>
                    <CardContent sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                      <Box sx={{ color: colors.blueAccent[400], mt: 0.5 }}>{item.icon}</Box>
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight="bold">{item.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                        <Box mt={1}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2">{item.count} / {tenants.length} tenants</Typography>
                            <Typography variant="body2">{Math.round((item.count/tenants.length)*100)}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={(item.count/tenants.length)*100}
                            sx={{ height: 6, borderRadius: 3 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { bgcolor: "#1a2332", color: "#fff" } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5" fontWeight="bold">{editing ? "Edit Tenant" : "New Tenant"}</Typography>
          <IconButton onClick={() => setOpen(false)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "#2d3748" }}>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Organization Name" value={form.name} onChange={f("name")} sx={inputSx} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Tenant Code" value={form.code} onChange={f("code")} inputProps={{ maxLength: 6, style: { textTransform: "uppercase" } }} sx={inputSx} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Admin Email" type="email" value={form.adminEmail} onChange={f("adminEmail")} sx={inputSx} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Custom Domain" value={form.customDomain} onChange={f("customDomain")} placeholder="e.g. tenant.yourapp.com" sx={inputSx} /></Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth sx={inputSx}>
                <InputLabel>Region</InputLabel>
                <Select value={form.region} label="Region" onChange={f("region")}>
                  {REGIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth sx={inputSx}>
                <InputLabel>Plan</InputLabel>
                <Select value={form.plan} label="Plan" onChange={f("plan")}>
                  {PLANS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth sx={inputSx}>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status" onChange={f("status")}>
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Max Users" type="number" value={form.maxUsers} onChange={f("maxUsers")} sx={inputSx} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Storage (GB)" type="number" value={form.storageGB} onChange={f("storageGB")} sx={inputSx} /></Grid>
            <Grid item xs={12}>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Switch checked={form.isolatedDB} onChange={fChk("isolatedDB")} color="success" />} label="Isolated Database" />
                <FormControlLabel control={<Switch checked={form.ssoEnabled} onChange={fChk("ssoEnabled")} color="info" />} label="SSO Enabled" />
                <FormControlLabel control={<Switch checked={form.apiAccess} onChange={fChk("apiAccess")} color="primary" />} label="API Access" />
                <FormControlLabel control={<Switch checked={form.whiteLabel} onChange={fChk("whiteLabel")} color="secondary" />} label="White-Label" />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #2d3748" }}>
          <Button onClick={() => setOpen(false)} variant="outlined" sx={{ color: "#fff", borderColor: "#4a5568" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: colors.greenAccent[600], "&:hover": { bgcolor: colors.greenAccent[700] } }}>
            {editing ? "Update Tenant" : "Create Tenant"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      {detail && (
        <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { bgcolor: "#1a2332", color: "#fff" } }}>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ bgcolor: colors.blueAccent[600] }}>{detail.code?.slice(0,2)}</Avatar>
              <Box><Typography fontWeight="bold">{detail.name}</Typography><Typography variant="caption" color="text.secondary">{detail.code}</Typography></Box>
            </Box>
            <IconButton onClick={() => setDetail(null)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: "#2d3748" }}>
            <Grid container spacing={1.5}>
              {[
                ["Region", detail.region], ["Plan", detail.plan], ["Status", detail.status],
                ["Admin Email", detail.adminEmail], ["Users", `${detail.users} / ${detail.maxUsers}`],
                ["Storage", `${detail.storageGB} GB`], ["Created", detail.createdAt],
                ["Custom Domain", detail.customDomain || "—"],
              ].map(([k, v]) => (
                <Grid item xs={6} key={k}>
                  <Typography variant="caption" color="text.secondary">{k}</Typography>
                  <Typography variant="body2" fontWeight="bold">{v}</Typography>
                </Grid>
              ))}
              <Grid item xs={12}><Divider sx={{ my: 1, borderColor: "#2d3748" }} /></Grid>
              {[["Isolated DB", detail.isolatedDB], ["SSO", detail.ssoEnabled], ["API Access", detail.apiAccess], ["White-Label", detail.whiteLabel]].map(([k, v]) => (
                <Grid item xs={6} key={k}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {v ? <CheckCircleIcon sx={{ fontSize: 14, color: colors.greenAccent[400] }} /> : <CancelIcon sx={{ fontSize: 14, color: colors.redAccent[400] }} />}
                    <Typography variant="body2">{k}: <strong>{v ? "Yes" : "No"}</strong></Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => { setDetail(null); openEdit(detail); }} variant="outlined" startIcon={<EditIcon />} sx={{ color: "#fff", borderColor: "#4a5568" }}>Edit</Button>
            <Button onClick={() => setDetail(null)} variant="contained" sx={{ bgcolor: colors.blueAccent[600] }}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { bgcolor: "#1a2332", color: "#fff" } }}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>Remove tenant <strong>{deleteConfirm.name}</strong>? This cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)} sx={{ color: "#fff" }}>Cancel</Button>
            <Button onClick={() => handleDelete(deleteConfirm.id)} variant="contained" color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default MultiTenantReadiness;
