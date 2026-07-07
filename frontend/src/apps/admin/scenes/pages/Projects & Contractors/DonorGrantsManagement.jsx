import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton, Tabs, Tab,
  Table, TableBody, TableCell, TableHead, TableRow, Grid, LinearProgress,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { useLocation } from "react-router-dom";
import adminApi from "../../../utils/api";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

const MOCK_GRANTS = [
  { id: 1, title: "WASH Infrastructure Fund 2024", donor_name: "UNICEF Kenya", donor_type: "NGO",
    amount: 5000000, disbursed: 3500000, currency: "KES", status: "active",
    start_date: "2024-01-01", end_date: "2024-12-31", project_id: 1,
    description: "Funding for borehole drilling and water access in rural communities.",
    conditions: "Quarterly progress reports required. Community participation mandatory." },
  { id: 2, title: "Rural Water Development Grant", donor_name: "World Bank", donor_type: "Government",
    amount: 12000000, disbursed: 6000000, currency: "KES", status: "active",
    start_date: "2023-07-01", end_date: "2025-06-30", project_id: 4,
    description: "Multi-year grant for water treatment plant upgrades.",
    conditions: "Annual audits required. Procurement must follow World Bank guidelines." },
  { id: 3, title: "Kenya Water Sector Trust Fund", donor_name: "Kenya Government", donor_type: "Government",
    amount: 3200000, disbursed: 3200000, currency: "KES", status: "completed",
    start_date: "2023-09-01", end_date: "2024-01-31", project_id: 4,
    description: "Government co-financing for treatment plant upgrade.",
    conditions: "Must align with County Integrated Development Plan." },
  { id: 4, title: "Community Water Access Initiative", donor_name: "WaterAid Kenya", donor_type: "NGO",
    amount: 1800000, disbursed: 900000, currency: "KES", status: "active",
    start_date: "2024-03-01", end_date: "2024-09-30", project_id: 5,
    description: "Support for community storage tank construction in Kijiji E.",
    conditions: "Community must contribute 10% of project cost." },
  { id: 5, title: "Green Energy CSR Grant", donor_name: "Safaricom Foundation", donor_type: "Corporate",
    amount: 1500000, disbursed: 0, currency: "KES", status: "pending",
    start_date: "2024-06-01", end_date: "2024-12-31", project_id: 2,
    description: "CSR funding for solar pump installation to reduce carbon footprint.",
    conditions: "Branding requirements apply. Impact report due at project completion." },
];

const MOCK_DISBURSEMENTS = [
  { id: 1, grant_id: 1, grant_title: "WASH Infrastructure Fund 2024", amount: 2000000, date: "2024-01-15", milestone: "Project Kickoff", status: "paid" },
  { id: 2, grant_id: 1, grant_title: "WASH Infrastructure Fund 2024", amount: 1500000, date: "2024-04-01", milestone: "50% Completion", status: "paid" },
  { id: 3, grant_id: 1, grant_title: "WASH Infrastructure Fund 2024", amount: 1500000, date: "2024-08-01", milestone: "Project Completion", status: "pending" },
  { id: 4, grant_id: 2, grant_title: "Rural Water Development Grant", amount: 4000000, date: "2023-07-15", milestone: "Year 1 Disbursement", status: "paid" },
  { id: 5, grant_id: 2, grant_title: "Rural Water Development Grant", amount: 2000000, date: "2024-01-15", milestone: "Mid-term Review", status: "paid" },
  { id: 6, grant_id: 4, grant_title: "Community Water Access Initiative", amount: 900000, date: "2024-03-15", milestone: "Initial Disbursement", status: "paid" },
  { id: 7, grant_id: 4, grant_title: "Community Water Access Initiative", amount: 900000, date: "2024-07-01", milestone: "Final Disbursement", status: "pending" },
];

const EMPTY_FORM = {
  title: "", donor_name: "", donor_type: "NGO", amount: "", currency: "KES",
  start_date: "", end_date: "", project_id: "", description: "", conditions: "", status: "active",
};

const STATUS_COLORS = { active: "#4cceac", completed: "#4caf50", pending: "#f0c040", cancelled: "#e2726e" };
const DONOR_TYPE_COLORS = { NGO: "#868dfb", Government: "#4cceac", Corporate: "#f0c040", Individual: "#e2726e" };

const statusChip = (s) => (
  <Chip label={s?.toUpperCase()} size="small"
    sx={{ backgroundColor: STATUS_COLORS[s] || "#666", color: "#fff", fontWeight: "bold", fontSize: 10 }} />
);

const KpiCard = ({ label, value, color }) => (
  <Card sx={{ flex: "1 1 130px", minWidth: 110, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
    <CardContent sx={{ p: "12px 16px !important" }}>
      <Typography sx={{ fontSize: "1.3rem", fontWeight: "bold", color }}>{value}</Typography>
      <Typography sx={{ fontSize: "0.75rem", color: "#858585" }}>{label}</Typography>
    </CardContent>
  </Card>
);

const DonorGrantsManagement = () => {
  const colors = tokens(useTheme().palette.mode);
  const location = useLocation();
  const prefillProjectId = location.state?.project_id || "";

  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, project_id: prefillProjectId });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.get("/admin/grants")
      .then(res => {
        const d = res.data?.grants || res.data || res;
        setGrants(Array.isArray(d) ? d : MOCK_GRANTS);
      })
      .catch(() => setGrants(MOCK_GRANTS))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, project_id: prefillProjectId });
    setOpen(true);
  };
  const openEdit = (g) => { setEditing(g); setForm({ ...EMPTY_FORM, ...g }); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await adminApi.patch(`/admin/grants/${editing.id}`, { grant: form });
      else await adminApi.post("/admin/grants", { grant: form });
      setOpen(false); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const kpi = {
    total: grants.length,
    active: grants.filter(g => g.status === "active").length,
    totalFunded: grants.reduce((s, g) => s + (Number(g.amount) || 0), 0),
    disbursed: grants.reduce((s, g) => s + (Number(g.disbursed) || 0), 0),
    pending: grants.filter(g => g.status === "pending").length,
  };

  const donors = Object.values(
    grants.reduce((acc, g) => {
      if (!acc[g.donor_name]) {
        acc[g.donor_name] = { name: g.donor_name, type: g.donor_type, total: 0, active: 0 };
      }
      acc[g.donor_name].total += Number(g.amount) || 0;
      if (g.status === "active") acc[g.donor_name].active += 1;
      return acc;
    }, {})
  );

  const donorBarData = donors.map(d => ({
    donor: d.name.length > 15 ? d.name.slice(0, 15) + "…" : d.name,
    "Total Funded (KES)": d.total,
  }));

  const disbursementLineData = [{
    id: "Disbursements",
    data: [
      { x: "Jul 23", y: 4000000 }, { x: "Jan 24", y: 2000000 },
      { x: "Mar 24", y: 900000 }, { x: "Apr 24", y: 1500000 },
    ],
  }];

  const fmtKES = (n) => `KES ${Number(n).toLocaleString()}`;

  const fieldSx = {
    "& .MuiInputBase-input": { color: colors.grey[100] },
    "& .MuiInputLabel-root": { color: colors.grey[300] },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] },
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Donor & Grants Management</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Track funding sources and disbursement milestones</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ backgroundColor: colors.blueAccent[600] }}>New Grant</Button>
        </Box>
      </Box>

      {prefillProjectId && (
        <Alert severity="info" sx={{ mb: 2 }}>Showing grants for Project ID: {prefillProjectId}</Alert>
      )}

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <KpiCard label="Total Grants" value={kpi.total} color={colors.blueAccent[400]} />
        <KpiCard label="Active" value={kpi.active} color={colors.greenAccent[400]} />
        <KpiCard label="Total Funded" value={fmtKES(kpi.totalFunded)} color={colors.blueAccent[300]} />
        <KpiCard label="Disbursed" value={fmtKES(kpi.disbursed)} color="#4caf50" />
        <KpiCard label="Pending" value={kpi.pending} color="#f0c040" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2,
        "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
        "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
        "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
      }}>
        <Tab label="Grants Overview" />
        <Tab label="Donors" />
        <Tab label="Disbursements" />
        <Tab label="Reports" />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>
      ) : (
        <>
          {/* TAB 0: Grants Overview */}
          {tab === 0 && (
            <Grid container spacing={2}>
              {grants.map(g => {
                const pct = g.amount > 0 ? Math.round((g.disbursed / g.amount) * 100) : 0;
                return (
                  <Grid item xs={12} md={6} key={g.id}>
                    <Card sx={{ backgroundColor: colors.primary[400], borderLeft: `4px solid ${STATUS_COLORS[g.status] || "#666"}` }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" sx={{ flex: 1, mr: 1 }}>{g.title}</Typography>
                          {statusChip(g.status)}
                        </Box>
                        <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
                          <Chip label={g.donor_name} size="small"
                            sx={{ backgroundColor: DONOR_TYPE_COLORS[g.donor_type] || colors.blueAccent[700], color: "#fff", fontSize: 10 }} />
                          <Chip label={g.donor_type} size="small"
                            sx={{ backgroundColor: colors.primary[500], color: colors.grey[300], fontSize: 10 }} />
                          {g.project_id && (
                            <Chip label={`Project #${g.project_id}`} size="small"
                              sx={{ backgroundColor: colors.primary[500], color: colors.grey[300], fontSize: 10 }} />
                          )}
                        </Box>
                        <Box mb={1.5}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography sx={{ fontSize: "0.8rem", color: colors.grey[400] }}>
                              Disbursed: {fmtKES(g.disbursed)} / {fmtKES(g.amount)}
                            </Typography>
                            <Typography sx={{ fontSize: "0.8rem", color: colors.grey[300] }}>{pct}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={pct}
                            sx={{ height: 8, borderRadius: 4, backgroundColor: colors.grey[700],
                              "& .MuiLinearProgress-bar": { backgroundColor: STATUS_COLORS[g.status] || colors.blueAccent[500] } }} />
                        </Box>
                        <Grid container spacing={1} sx={{ mb: 1.5 }}>
                          {[["Start", g.start_date], ["End", g.end_date]].map(([k, v]) => (
                            <Grid item xs={6} key={k}>
                              <Typography sx={{ fontSize: "0.7rem", color: colors.grey[500] }}>{k}</Typography>
                              <Typography sx={{ fontSize: "0.8rem", color: colors.grey[200] }}>{v || "—"}</Typography>
                            </Grid>
                          ))}
                        </Grid>
                        <Typography sx={{ fontSize: "0.8rem", color: colors.grey[400], mb: 1.5 }}>{g.description}</Typography>
                        <Button size="small" variant="outlined" startIcon={<EditIcon />}
                          onClick={() => openEdit(g)}
                          sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[700], fontSize: 11 }}>Edit</Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {/* TAB 1: Donors */}
          {tab === 1 && (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ "& .MuiTableCell-root": { borderColor: colors.grey[700], color: colors.grey[200] } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: colors.blueAccent[700] }}>
                    {["Donor Name", "Type", "Total Donated (KES)", "Active Grants"].map(h => (
                      <TableCell key={h} sx={{ color: "#fff", fontWeight: "bold", fontSize: "0.8rem" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {donors.map((d, i) => (
                    <TableRow key={d.name} sx={{ backgroundColor: i % 2 === 0 ? colors.primary[400] : colors.primary[500] }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccountBalanceIcon sx={{ fontSize: 18, color: DONOR_TYPE_COLORS[d.type] || colors.blueAccent[400] }} />
                          <Typography sx={{ fontSize: "0.85rem", fontWeight: "bold" }}>{d.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={d.type} size="small"
                          sx={{ backgroundColor: DONOR_TYPE_COLORS[d.type] || "#666", color: "#fff", fontSize: 10 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.85rem", fontWeight: "bold", color: colors.greenAccent[400] }}>
                        {fmtKES(d.total)}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Chip label={d.active} size="small"
                          sx={{ backgroundColor: d.active > 0 ? colors.greenAccent[700] : colors.grey[700], color: "#fff" }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* TAB 2: Disbursements */}
          {tab === 2 && (
            <Box>
              {MOCK_DISBURSEMENTS.map((d, i) => (
                <Box key={d.id} display="flex" gap={2} mb={2} alignItems="flex-start">
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Box sx={{ width: 12, height: 12, borderRadius: "50%",
                      backgroundColor: d.status === "paid" ? "#4caf50" : "#f0c040", mt: 0.5 }} />
                    {i < MOCK_DISBURSEMENTS.length - 1 && (
                      <Box sx={{ width: 2, height: 40, backgroundColor: colors.grey[700], mt: 0.5 }} />
                    )}
                  </Box>
                  <Card sx={{ flex: 1, backgroundColor: colors.primary[400],
                    borderLeft: `3px solid ${d.status === "paid" ? "#4caf50" : "#f0c040"}` }}>
                    <CardContent sx={{ p: "12px 16px !important" }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography sx={{ fontSize: "0.9rem", fontWeight: "bold", color: colors.grey[100] }}>{d.milestone}</Typography>
                          <Typography sx={{ fontSize: "0.8rem", color: colors.grey[400] }}>{d.grant_title}</Typography>
                          <Typography sx={{ fontSize: "0.75rem", color: colors.grey[500] }}>{d.date}</Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography sx={{ fontSize: "1rem", fontWeight: "bold", color: d.status === "paid" ? "#4caf50" : "#f0c040" }}>
                            {fmtKES(d.amount)}
                          </Typography>
                          <Chip label={d.status?.toUpperCase()} size="small"
                            sx={{ backgroundColor: d.status === "paid" ? "#4caf50" : "#f0c040", color: "#fff", fontSize: 10 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          )}

          {/* TAB 3: Reports */}
          {tab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: colors.primary[400], p: 2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Funding by Donor (KES)</Typography>
                  <Box height={300}>
                    <ResponsiveBar data={donorBarData} keys={["Total Funded (KES)"]} indexBy="donor"
                      margin={{ top: 10, right: 20, bottom: 80, left: 90 }}
                      padding={0.3} colors={["#868dfb"]}
                      axisBottom={{ tickRotation: -20, tickSize: 5 }}
                      axisLeft={{ tickSize: 5, format: v => `${(v / 1000000).toFixed(1)}M` }}
                      labelSkipWidth={12} labelSkipHeight={12}
                      theme={{ axis: { ticks: { text: { fill: colors.grey[300] } } }, grid: { line: { stroke: colors.grey[700] } } }} />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: colors.primary[400], p: 2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Disbursements Over Time (KES)</Typography>
                  <Box height={300}>
                    <ResponsiveLine data={disbursementLineData}
                      margin={{ top: 10, right: 20, bottom: 50, left: 90 }}
                      xScale={{ type: "point" }} yScale={{ type: "linear", min: 0 }}
                      axisBottom={{ tickSize: 5 }}
                      axisLeft={{ tickSize: 5, format: v => `${(v / 1000000).toFixed(1)}M` }}
                      colors={["#4cceac"]} pointSize={8} pointColor="#fff" pointBorderWidth={2}
                      pointBorderColor={{ from: "serieColor" }}
                      theme={{ axis: { ticks: { text: { fill: colors.grey[300] } } }, grid: { line: { stroke: colors.grey[700] } } }} />
                  </Box>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100], fontSize: "1.2rem !important" }}>
          {editing ? "Edit Grant" : "Create New Grant"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Grant Title *" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Donor Name *" value={form.donor_name}
                onChange={e => setForm(f => ({ ...f, donor_name: e.target.value }))} sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel sx={{ color: colors.grey[300] }}>Donor Type</InputLabel>
                <Select value={form.donor_type} label="Donor Type"
                  onChange={e => setForm(f => ({ ...f, donor_type: e.target.value }))} sx={{ color: colors.grey[100] }}>
                  {["NGO", "Government", "Corporate", "Individual"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth size="small" label="Amount" type="number" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} sx={fieldSx} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth size="small" label="Currency" value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} sx={fieldSx} />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel sx={{ color: colors.grey[300] }}>Status</InputLabel>
                <Select value={form.status} label="Status"
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))} sx={{ color: colors.grey[100] }}>
                  {["active", "pending", "completed", "cancelled"].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Start Date" type="date" value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="End Date" type="date" value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Project ID" value={form.project_id}
                onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} sx={fieldSx} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} size="small" label="Description"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} sx={fieldSx} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} size="small" label="Conditions"
                value={form.conditions} onChange={e => setForm(f => ({ ...f, conditions: e.target.value }))} sx={fieldSx} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving || !form.title || !form.donor_name} onClick={handleSave}
            sx={{ backgroundColor: colors.blueAccent[600] }}>{saving ? "Saving…" : editing ? "Update" : "Create"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DonorGrantsManagement;
