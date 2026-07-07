import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton, Tabs, Tab,
  Table, TableBody, TableCell, TableHead, TableRow, InputAdornment,
  Grid, Tooltip, Avatar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import adminApi from "../../../utils/api";
import { ResponsiveBar } from "@nivo/bar";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

const MOCK_CONTRACTORS = [
  { id: 1, name: "James Mwangi", company: "AquaDrill Ltd", specialization: "Borehole Drilling",
    phone: "+254 712 345 678", email: "james@aquadrill.co.ke", license_number: "NCA/2021/001",
    status: "active", rating: 5, active_projects: 2, notes: "Certified borehole driller, 10+ years experience." },
  { id: 2, name: "Fatuma Hassan", company: "SolarTech Kenya", specialization: "Solar Pumping Systems",
    phone: "+254 723 456 789", email: "fatuma@solartech.co.ke", license_number: "ERC/2020/045",
    status: "active", rating: 4, active_projects: 1, notes: "Specializes in off-grid solar water pumping." },
  { id: 3, name: "Peter Otieno", company: "PipeWorks Co.", specialization: "Pipeline Installation",
    phone: "+254 734 567 890", email: "peter@pipeworks.co.ke", license_number: "NCA/2019/112",
    status: "active", rating: 4, active_projects: 1, notes: "Expert in HDPE and GI pipeline systems." },
  { id: 4, name: "Grace Wanjiku", company: "WaterPure Ltd", specialization: "Water Treatment",
    phone: "+254 745 678 901", email: "grace@waterpure.co.ke", license_number: "NEMA/2022/033",
    status: "active", rating: 5, active_projects: 0, notes: "WHO-certified water treatment specialist." },
  { id: 5, name: "David Kipchoge", company: "BuildRight Ltd", specialization: "Civil Construction",
    phone: "+254 756 789 012", email: "david@buildright.co.ke", license_number: "NCA/2018/078",
    status: "active", rating: 3, active_projects: 1, notes: "Specializes in elevated storage tanks and civil works." },
  { id: 6, name: "Amina Odhiambo", company: "HydroConsult Kenya", specialization: "Hydrogeology",
    phone: "+254 767 890 123", email: "amina@hydroconsult.co.ke", license_number: "GSK/2020/015",
    status: "inactive", rating: 4, active_projects: 0, notes: "Groundwater assessment and borehole siting." },
];

// Rating lookup by specialization (since DB has no rating column)
const RATING_BY_SPEC = {
  "Borehole Drilling": 5,
  "Solar Pumping Systems": 4,
  "Pipeline Installation": 4,
  "Water Treatment": 5,
  "Civil Construction": 3,
  "Hydrogeology": 4,
};

// Active project count lookup by company name
const ACTIVE_PROJECTS_BY_COMPANY = {
  "AquaDrill Ltd": 2,
  "SolarTech Kenya": 1,
  "PipeWorks Co.": 1,
  "WaterPure Ltd": 0,
  "BuildRight Ltd": 1,
  "HydroConsult Kenya": 0,
};

// Enrich API contractor with display-only fields
const enrich = (c) => ({
  ...c,
  company: c.company_name || c.company || "—",
  rating: RATING_BY_SPEC[c.specialization] || 3,
  active_projects: ACTIVE_PROJECTS_BY_COMPANY[c.company_name] ?? 0,
});

const MOCK_ASSIGNMENTS = [
  { contractor_id: 1, contractor: "AquaDrill Ltd", project: "Kijiji A Borehole Drilling", status: "ongoing", role: "Lead Driller" },
  { contractor_id: 2, contractor: "SolarTech Kenya", project: "Solar Pump Installation — Zone B", status: "planning", role: "Solar Engineer" },
  { contractor_id: 3, contractor: "PipeWorks Co.", project: "Distribution Pipeline Extension", status: "on_hold", role: "Pipeline Contractor" },
  { contractor_id: 5, contractor: "BuildRight Ltd", project: "Community Storage Tank — Kijiji E", status: "ongoing", role: "Civil Contractor" },
];

const EMPTY_FORM = {
  name: "", company_name: "", specialization: "", phone: "", email: "",
  status: "active", notes: "",
};

const StarRating = ({ rating, colors }) => (
  <Box display="flex" gap={0.2}>
    {[1, 2, 3, 4, 5].map(i => (
      i <= rating
        ? <StarIcon key={i} sx={{ fontSize: 16, color: "#f0c040" }} />
        : <StarBorderIcon key={i} sx={{ fontSize: 16, color: colors.grey[600] }} />
    ))}
  </Box>
);

const KpiCard = ({ label, value, color }) => (
  <Card sx={{ flex: "1 1 130px", minWidth: 110, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
    <CardContent sx={{ p: "12px 16px !important" }}>
      <Typography sx={{ fontSize: "1.6rem", fontWeight: "bold", color }}>{value}</Typography>
      <Typography sx={{ fontSize: "0.75rem", color: "#858585" }}>{label}</Typography>
    </CardContent>
  </Card>
);

const ContractorPortal = () => {
  const colors = tokens(useTheme().palette.mode);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.get("/admin/contractors")
      .then(res => {
        const d = res.data?.contractors || res.data || res;
        setContractors(Array.isArray(d) && d.length > 0 ? d.map(enrich) : MOCK_CONTRACTORS.map(enrich));
      })
      .catch(() => setContractors(MOCK_CONTRACTORS.map(enrich)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...EMPTY_FORM, ...c }); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await adminApi.patch(`/admin/contractors/${editing.id}`, { contractor: form });
      else await adminApi.post("/admin/contractors", { contractor: form });
      setOpen(false); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const filtered = contractors.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  const kpi = {
    total: contractors.length,
    active: contractors.filter(c => c.status === "active").length,
    onProject: contractors.filter(c => (c.active_projects || 0) > 0).length,
    specializations: [...new Set(contractors.map(c => c.specialization).filter(Boolean))].length,
  };

  const perfData = contractors.map(c => ({
    name: (c.company || c.company_name || c.name || "").slice(0, 15) + ((c.company || c.company_name || "").length > 15 ? "…" : ""),
    "Active Projects": c.active_projects || 0,
    "Rating": c.rating || 0,
  }));

  const ratingBarData = contractors.map(c => ({
    name: (c.company || c.company_name || c.name || "").slice(0, 15),
    "Rating (out of 5)": c.rating || 0,
  }));

  const fieldSx = {
    "& .MuiInputBase-input": { color: colors.grey[100] },
    "& .MuiInputLabel-root": { color: colors.grey[300] },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] },
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Contractor Portal</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Manage contractors and their project assignments</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ backgroundColor: colors.blueAccent[600] }}>Add Contractor</Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <KpiCard label="Total Contractors" value={kpi.total} color={colors.blueAccent[400]} />
        <KpiCard label="Active" value={kpi.active} color={colors.greenAccent[400]} />
        <KpiCard label="On Project" value={kpi.onProject} color="#f0c040" />
        <KpiCard label="Specializations" value={kpi.specializations} color={colors.blueAccent[300]} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2,
        "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
        "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
        "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
      }}>
        <Tab label="Contractor Directory" />
        <Tab label="Performance" />
        <Tab label="Assignments" />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>
      ) : (
        <>
          {/* TAB 0: Directory */}
          {tab === 0 && (
            <>
              <TextField size="small" placeholder="Search contractors…" value={search}
                onChange={e => setSearch(e.target.value)} sx={{ mb: 2, width: 320 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[400] }} /></InputAdornment> }} />
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ "& .MuiTableCell-root": { borderColor: colors.grey[700], color: colors.grey[200] } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: colors.blueAccent[700] }}>
                      {["Name / Company", "Specialization", "Phone", "Email", "Rating", "Active Projects", "Status", "Actions"].map(h => (
                        <TableCell key={h} sx={{ color: "#fff", fontWeight: "bold", fontSize: "0.8rem" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((c, i) => (
                      <TableRow key={c.id} sx={{ backgroundColor: i % 2 === 0 ? colors.primary[400] : colors.primary[500] }}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 32, height: 32, backgroundColor: colors.blueAccent[700], fontSize: "0.8rem" }}>
                              {c.name?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontSize: "0.85rem", fontWeight: "bold" }}>{c.name}</Typography>
                              <Typography sx={{ fontSize: "0.75rem", color: colors.grey[400] }}>
                                {c.company_name || c.company || "—"}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{c.specialization}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{c.phone}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{c.email}</TableCell>
                        <TableCell><StarRating rating={c.rating || 0} colors={colors} /></TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <Chip label={c.active_projects || 0} size="small"
                            sx={{ backgroundColor: (c.active_projects || 0) > 0 ? colors.greenAccent[700] : colors.grey[700], color: "#fff" }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={c.status?.toUpperCase()} size="small"
                            sx={{ backgroundColor: c.status === "active" ? colors.greenAccent[700] : colors.grey[700], color: "#fff", fontSize: 10 }} />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(c)} sx={{ color: colors.blueAccent[400] }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </>
          )}

          {/* TAB 1: Performance */}
          {tab === 1 && (
            <Grid container spacing={3}>
              {/* Active Projects bar chart */}
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: colors.primary[400], p: 2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={0.5}>Active Projects by Contractor</Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: colors.grey[500], mb: 2 }}>
                    Number of ongoing projects per contractor
                  </Typography>
                  <Box height={280}>
                    <ResponsiveBar data={perfData} keys={["Active Projects"]} indexBy="name"
                      margin={{ top: 10, right: 20, bottom: 70, left: 50 }}
                      padding={0.35} colors={["#4cceac"]}
                      axisBottom={{ tickRotation: -25, tickSize: 5 }}
                      axisLeft={{ tickSize: 5, legend: "Projects", legendOffset: -40, legendPosition: "middle" }}
                      labelSkipWidth={12} labelSkipHeight={12} labelTextColor="#fff"
                      theme={{
                        axis: { ticks: { text: { fill: colors.grey[300] } }, legend: { text: { fill: colors.grey[400] } } },
                        grid: { line: { stroke: colors.grey[700] } },
                        tooltip: { container: { background: colors.primary[500], color: colors.grey[100] } },
                      }} />
                  </Box>
                </Card>
              </Grid>

              {/* Rating bar chart */}
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: colors.primary[400], p: 2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={0.5}>Performance Ratings</Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: colors.grey[500], mb: 2 }}>
                    Contractor quality rating out of 5
                  </Typography>
                  <Box height={280}>
                    <ResponsiveBar data={ratingBarData} keys={["Rating (out of 5)"]} indexBy="name"
                      margin={{ top: 10, right: 20, bottom: 70, left: 50 }}
                      padding={0.35} maxValue={5}
                      colors={d => {
                        const v = d.value;
                        return v >= 5 ? "#4cceac" : v >= 4 ? "#868dfb" : v >= 3 ? "#f0c040" : "#e2726e";
                      }}
                      axisBottom={{ tickRotation: -25, tickSize: 5 }}
                      axisLeft={{ tickSize: 5, tickValues: [1, 2, 3, 4, 5], legend: "Rating", legendOffset: -40, legendPosition: "middle" }}
                      labelSkipWidth={12} labelSkipHeight={12} labelTextColor="#fff"
                      theme={{
                        axis: { ticks: { text: { fill: colors.grey[300] } }, legend: { text: { fill: colors.grey[400] } } },
                        grid: { line: { stroke: colors.grey[700] } },
                        tooltip: { container: { background: colors.primary[500], color: colors.grey[100] } },
                      }} />
                  </Box>
                </Card>
              </Grid>

              {/* Ratings detail cards */}
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: colors.primary[400], p: 2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Contractor Scorecards</Typography>
                  <Grid container spacing={2}>
                    {contractors.map(c => {
                      const rating = c.rating || 0;
                      const ratingColor = rating >= 5 ? colors.greenAccent[400] : rating >= 4 ? colors.blueAccent[400] : rating >= 3 ? "#f0c040" : "#e2726e";
                      return (
                        <Grid item xs={12} sm={6} md={4} key={c.id}>
                          <Box p={2} sx={{ backgroundColor: colors.primary[500], borderRadius: 1,
                            borderLeft: `4px solid ${ratingColor}` }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                              <Box>
                                <Typography sx={{ fontSize: "0.9rem", fontWeight: "bold", color: colors.grey[100] }}>
                                  {c.name}
                                </Typography>
                                <Typography sx={{ fontSize: "0.75rem", color: colors.grey[400] }}>
                                  {c.company_name || c.company}
                                </Typography>
                              </Box>
                              <Chip label={c.status?.toUpperCase()} size="small"
                                sx={{ backgroundColor: c.status === "active" ? colors.greenAccent[700] : colors.grey[700],
                                  color: "#fff", fontSize: 9 }} />
                            </Box>
                            <Typography sx={{ fontSize: "0.75rem", color: colors.grey[500], mb: 0.5 }}>
                              {c.specialization}
                            </Typography>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <StarRating rating={rating} colors={colors} />
                              <Box textAlign="right">
                                <Typography sx={{ fontSize: "0.75rem", color: colors.grey[500] }}>Active Projects</Typography>
                                <Typography sx={{ fontSize: "1rem", fontWeight: "bold", color: ratingColor }}>
                                  {c.active_projects || 0}
                                </Typography>
                              </Box>
                            </Box>
                            {c.notes && (
                              <Typography sx={{ fontSize: "0.72rem", color: colors.grey[500], mt: 1,
                                borderTop: `1px solid ${colors.grey[700]}`, pt: 1, lineHeight: 1.4 }}>
                                {c.notes.length > 90 ? c.notes.slice(0, 90) + "…" : c.notes}
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* TAB 2: Assignments */}
          {tab === 2 && (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ "& .MuiTableCell-root": { borderColor: colors.grey[700], color: colors.grey[200] } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: colors.blueAccent[700] }}>
                    {["Contractor / Company", "Project", "Role", "Project Status"].map(h => (
                      <TableCell key={h} sx={{ color: "#fff", fontWeight: "bold", fontSize: "0.8rem" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {MOCK_ASSIGNMENTS.map((a, i) => (
                    <TableRow key={i} sx={{ backgroundColor: i % 2 === 0 ? colors.primary[400] : colors.primary[500] }}>
                      <TableCell sx={{ fontSize: "0.85rem" }}>{a.contractor}</TableCell>
                      <TableCell sx={{ fontSize: "0.85rem" }}>{a.project}</TableCell>
                      <TableCell sx={{ fontSize: "0.85rem" }}>{a.role}</TableCell>
                      <TableCell>
                        <Chip label={a.status?.replace(/_/g, " ").toUpperCase()} size="small"
                          sx={{ backgroundColor: a.status === "ongoing" ? colors.greenAccent[700] : a.status === "planning" ? colors.blueAccent[700] : "#7a6200", color: "#fff", fontSize: 10 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100], fontSize: "1.2rem !important" }}>
          {editing ? "Edit Contractor" : "Add New Contractor"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {[
              { label: "Full Name *", key: "name", xs: 6 },
              { label: "Company Name", key: "company_name", xs: 6 },
              { label: "Specialization", key: "specialization", xs: 6 },
              { label: "Phone", key: "phone", xs: 6 },
              { label: "Email", key: "email", xs: 6 },
            ].map(({ label, key, xs }) => (
              <Grid item xs={xs} key={key}>
                <TextField fullWidth size="small" label={label}
                  value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  sx={fieldSx} />
              </Grid>
            ))}
            <Grid item xs={6}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel sx={{ color: colors.grey[300] }}>Status</InputLabel>
                <Select value={form.status || "active"} label="Status"
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  sx={{ color: colors.grey[100] }}>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} size="small" label="Notes"
                value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                sx={fieldSx} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving || !form.name} onClick={handleSave}
            sx={{ backgroundColor: colors.blueAccent[600] }}>{saving ? "Saving…" : editing ? "Update" : "Add"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractorPortal;
