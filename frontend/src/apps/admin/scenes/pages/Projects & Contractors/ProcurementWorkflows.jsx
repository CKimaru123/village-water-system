import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton, Tabs, Tab,
  Table, TableBody, TableCell, TableHead, TableRow, Grid, Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import adminApi from "../../../utils/api";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";

const MOCK_ORDERS = [
  { id: 1, title: "HDPE Pipes 110mm (500m)", category: "Pipes & Fittings", vendor: "PipeSupply Kenya",
    estimated_cost: 185000, actual_cost: 182000, status: "delivered", date: "2024-03-15",
    quantity: 500, unit: "metres", justification: "Pipeline extension project materials.", project_id: 3 },
  { id: 2, title: "Submersible Pump 5HP", category: "Pumps & Equipment", vendor: "AquaEquip Ltd",
    estimated_cost: 95000, actual_cost: null, status: "approved", date: "2024-04-01",
    quantity: 2, unit: "units", justification: "Replacement pumps for borehole.", project_id: 1 },
  { id: 3, title: "Chlorine Tablets (50kg)", category: "Chemicals", vendor: "ChemTech EA",
    estimated_cost: 28000, actual_cost: null, status: "pending", date: "2024-04-10",
    quantity: 50, unit: "kg", justification: "Monthly water treatment chemicals.", project_id: 4 },
  { id: 4, title: "Solar Panels 400W (20 units)", category: "Solar Equipment", vendor: "SolarTech Kenya",
    estimated_cost: 320000, actual_cost: null, status: "pending", date: "2024-04-12",
    quantity: 20, unit: "units", justification: "Solar pump installation project.", project_id: 2 },
  { id: 5, title: "Water Meters (100 units)", category: "Meters & Sensors", vendor: "MeterPro Ltd",
    estimated_cost: 150000, actual_cost: 148500, status: "ordered", date: "2024-03-28",
    quantity: 100, unit: "units", justification: "New meter installations for Zone B.", project_id: 2 },
  { id: 6, title: "Excavation Tools Set", category: "Tools & Equipment", vendor: "ToolMart Kenya",
    estimated_cost: 45000, actual_cost: null, status: "rejected", date: "2024-03-20",
    quantity: 1, unit: "set", justification: "Pipeline trench digging tools.", project_id: 3 },
];

const MOCK_SUPPLIERS = [
  { id: 1, name: "PipeSupply Kenya", category: "Pipes & Fittings", contact: "+254 700 111 222", rating: 5 },
  { id: 2, name: "AquaEquip Ltd", category: "Pumps & Equipment", contact: "+254 700 222 333", rating: 4 },
  { id: 3, name: "ChemTech EA", category: "Chemicals", contact: "+254 700 333 444", rating: 4 },
  { id: 4, name: "SolarTech Kenya", category: "Solar Equipment", contact: "+254 700 444 555", rating: 5 },
  { id: 5, name: "MeterPro Ltd", category: "Meters & Sensors", contact: "+254 700 555 666", rating: 4 },
  { id: 6, name: "ToolMart Kenya", category: "Tools & Equipment", contact: "+254 700 666 777", rating: 3 },
];

const EMPTY_FORM = {
  supplier_name: "", total_amount: "", order_date: "", expected_delivery: "", notes: "",
};

const STATUS_COLORS = {
  draft: "#858585", pending: "#f0c040", approved: "#4cceac",
  rejected: "#e2726e", ordered: "#868dfb", delivered: "#4caf50",
};

const statusChip = (s) => (
  <Chip label={s?.toUpperCase()} size="small"
    sx={{ backgroundColor: STATUS_COLORS[s] || "#666", color: "#fff", fontWeight: "bold", fontSize: 10 }} />
);

const KpiCard = ({ label, value, color }) => (
  <Card sx={{ flex: "1 1 130px", minWidth: 110, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
    <CardContent sx={{ p: "12px 16px !important" }}>
      <Typography sx={{ fontSize: "1.4rem", fontWeight: "bold", color }}>{value}</Typography>
      <Typography sx={{ fontSize: "0.75rem", color: "#858585" }}>{label}</Typography>
    </CardContent>
  </Card>
);

const ProcurementWorkflows = () => {
  const colors = tokens(useTheme().palette.mode);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.get("/admin/procurement")
      .then(res => {
        const d = res.data?.orders || res.data || res;
        setOrders(Array.isArray(d) ? d : MOCK_ORDERS);
      })
      .catch(() => setOrders(MOCK_ORDERS))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleCreate = async () => {
    setSaving(true);
    try {
      await adminApi.post("/admin/procurement", { order: form });
      setOpen(false); setForm(EMPTY_FORM); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try {
      await adminApi.post(`/admin/procurement/${id}/approve`, {});
      setSuccess("Order approved successfully.");
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "approved" } : o));
    } catch {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "approved" } : o));
      setSuccess("Order approved (mock).");
    }
  };

  const handleReject = async (id) => {
    try {
      await adminApi.post(`/admin/procurement/${id}/reject`, {});
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "rejected" } : o));
    } catch {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "rejected" } : o));
    }
  };

  const kpi = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    approved: orders.filter(o => ["approved", "ordered", "delivered"].includes(o.status)).length,
    value: orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0),
  };

  const pendingOrders = orders.filter(o => o.status === "pending");

  const categorySpend = Object.entries(
    orders.reduce((acc, o) => {
      const key = o.supplier_name || "Unknown";
      acc[key] = (acc[key] || 0) + (Number(o.total_amount) || 0);
      return acc;
    }, {})
  ).map(([supplier, value]) => ({ category: supplier.length > 15 ? supplier.slice(0, 15) + "…" : supplier, "Spend (KES)": value }));

  const monthlyData = [{
    id: "Procurement Value",
    data: [
      { x: "Jan", y: 0 }, { x: "Feb", y: 85000 }, { x: "Mar", y: 230000 },
      { x: "Apr", y: 593000 }, { x: "May", y: 0 }, { x: "Jun", y: 0 },
    ],
  }];

  const fmtKES = (n) => n ? `KES ${Number(n).toLocaleString()}` : "—";

  const fieldSx = {
    "& .MuiInputBase-input": { color: colors.grey[100] },
    "& .MuiInputLabel-root": { color: colors.grey[300] },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] },
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Procurement Workflows</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Manage purchase orders and supplier approvals</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
            sx={{ backgroundColor: colors.blueAccent[600] }}>New Order</Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <KpiCard label="Total Orders" value={kpi.total} color={colors.blueAccent[400]} />
        <KpiCard label="Pending Approval" value={kpi.pending} color="#f0c040" />
        <KpiCard label="Approved / Ordered" value={kpi.approved} color={colors.greenAccent[400]} />
        <KpiCard label="Total Value" value={fmtKES(kpi.value)} color={colors.blueAccent[300]} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2,
        "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
        "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
        "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
      }}>
        <Tab label="Orders" />
        <Tab label={`Approval Queue (${pendingOrders.length})`} />
        <Tab label="Suppliers" />
        <Tab label="Analytics" />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>
      ) : (
        <>
          {/* TAB 0: Orders */}
          {tab === 0 && (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ "& .MuiTableCell-root": { borderColor: colors.grey[700], color: colors.grey[200] } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: colors.blueAccent[700] }}>
                    {["Order #", "Supplier", "Amount (KES)", "Order Date", "Expected Delivery", "Status", "Actions"].map(h => (
                      <TableCell key={h} sx={{ color: "#fff", fontWeight: "bold", fontSize: "0.8rem" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((o, i) => (
                    <TableRow key={o.id} sx={{ backgroundColor: i % 2 === 0 ? colors.primary[400] : colors.primary[500] }}>
                      <TableCell sx={{ fontSize: "0.8rem", fontFamily: "monospace", color: colors.blueAccent[300] }}>
                        {o.order_number || `#${o.id}`}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 180 }}>
                        <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: "bold" }}>{o.supplier_name}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.85rem", whiteSpace: "nowrap", color: colors.greenAccent[400], fontWeight: "bold" }}>
                        {o.total_amount ? `KES ${Number(o.total_amount).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{o.order_date || "—"}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{o.expected_delivery || "—"}</TableCell>
                      <TableCell>{statusChip(o.status)}</TableCell>
                      <TableCell>
                        {o.status === "pending" && (
                          <Box display="flex" gap={0.5}>
                            <IconButton size="small" onClick={() => handleApprove(o.id)} sx={{ color: colors.greenAccent[400] }}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleReject(o.id)} sx={{ color: colors.redAccent[400] }}>
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {orders.length === 0 && (
                <Typography color={colors.grey[400]} textAlign="center" py={3}>No procurement orders found.</Typography>
              )}
            </Box>
          )}

          {/* TAB 1: Approval Queue */}
          {tab === 1 && (
            <Grid container spacing={2}>
              {pendingOrders.length === 0 ? (
                <Grid item xs={12}><Alert severity="info">No orders pending approval.</Alert></Grid>
              ) : pendingOrders.map(o => (
                <Grid item xs={12} md={6} key={o.id}>
                  <Card sx={{ backgroundColor: colors.primary[400], borderLeft: `4px solid #f0c040` }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box>
                          <Typography sx={{ fontSize: "0.7rem", fontFamily: "monospace", color: colors.blueAccent[300] }}>
                            {o.order_number || `#${o.id}`}
                          </Typography>
                          <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">{o.supplier_name}</Typography>
                        </Box>
                        {statusChip(o.status)}
                      </Box>
                      <Box display="flex" gap={3} mb={1.5}>
                        <Box>
                          <Typography sx={{ fontSize: "0.75rem", color: colors.grey[500] }}>Total Amount</Typography>
                          <Typography sx={{ fontSize: "0.95rem", color: colors.greenAccent[400], fontWeight: "bold" }}>
                            {o.total_amount ? `KES ${Number(o.total_amount).toLocaleString()}` : "—"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: "0.75rem", color: colors.grey[500] }}>Order Date</Typography>
                          <Typography sx={{ fontSize: "0.85rem", color: colors.grey[200] }}>{o.order_date || "—"}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: "0.75rem", color: colors.grey[500] }}>Expected Delivery</Typography>
                          <Typography sx={{ fontSize: "0.85rem", color: colors.grey[200] }}>{o.expected_delivery || "—"}</Typography>
                        </Box>
                      </Box>
                      {o.notes && (
                        <Box p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1, mb: 1.5 }}>
                          <Typography sx={{ fontSize: "0.75rem", color: colors.grey[500] }}>Notes / Justification</Typography>
                          <Typography sx={{ fontSize: "0.85rem", color: colors.grey[300] }}>{o.notes}</Typography>
                        </Box>
                      )}
                      <Box display="flex" gap={1}>
                        <Button variant="contained" size="small" startIcon={<CheckCircleIcon />}
                          onClick={() => handleApprove(o.id)}
                          sx={{ backgroundColor: colors.greenAccent[700], "&:hover": { backgroundColor: colors.greenAccent[600] } }}>
                          Approve
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<CancelIcon />}
                          onClick={() => handleReject(o.id)}
                          sx={{ borderColor: colors.redAccent[500], color: colors.redAccent[400] }}>
                          Reject
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* TAB 2: Suppliers */}
          {tab === 2 && (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ "& .MuiTableCell-root": { borderColor: colors.grey[700], color: colors.grey[200] } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: colors.blueAccent[700] }}>
                    {["Supplier Name", "Category", "Contact", "Rating"].map(h => (
                      <TableCell key={h} sx={{ color: "#fff", fontWeight: "bold", fontSize: "0.8rem" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {MOCK_SUPPLIERS.map((s, i) => (
                    <TableRow key={s.id} sx={{ backgroundColor: i % 2 === 0 ? colors.primary[400] : colors.primary[500] }}>
                      <TableCell sx={{ fontSize: "0.85rem", fontWeight: "bold" }}>{s.name}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{s.category}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{s.contact}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.2}>
                          {[1,2,3,4,5].map(n => (
                            <Box key={n} sx={{ width: 10, height: 10, borderRadius: "50%",
                              backgroundColor: n <= s.rating ? "#f0c040" : colors.grey[700] }} />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* TAB 3: Analytics */}
          {tab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: colors.primary[400], p: 2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Spend by Category (KES)</Typography>
                  <Box height={300}>
                    <ResponsiveBar data={categorySpend} keys={["Spend (KES)"]} indexBy="category"
                      margin={{ top: 10, right: 20, bottom: 80, left: 80 }}
                      padding={0.3} colors={["#868dfb"]}
                      axisBottom={{ tickRotation: -20, tickSize: 5 }}
                      axisLeft={{ tickSize: 5, format: v => `${(v / 1000).toFixed(0)}K` }}
                      labelSkipWidth={12} labelSkipHeight={12}
                      theme={{ axis: { ticks: { text: { fill: colors.grey[300] } } }, grid: { line: { stroke: colors.grey[700] } } }} />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: colors.primary[400], p: 2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Monthly Procurement Value (KES)</Typography>
                  <Box height={300}>
                    <ResponsiveLine data={monthlyData}
                      margin={{ top: 10, right: 20, bottom: 50, left: 80 }}
                      xScale={{ type: "point" }} yScale={{ type: "linear", min: 0 }}
                      axisBottom={{ tickSize: 5 }}
                      axisLeft={{ tickSize: 5, format: v => `${(v / 1000).toFixed(0)}K` }}
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

      {/* Create Order Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100], fontSize: "1.2rem !important" }}>Create Purchase Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Supplier Name *" value={form.supplier_name}
                onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Total Amount (KES)" type="number" value={form.total_amount}
                onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Order Date" type="date" value={form.order_date}
                onChange={e => setForm(f => ({ ...f, order_date: e.target.value }))}
                InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Expected Delivery" type="date" value={form.expected_delivery}
                onChange={e => setForm(f => ({ ...f, expected_delivery: e.target.value }))}
                InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} size="small" label="Notes / Justification"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} sx={fieldSx} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving || !form.supplier_name} onClick={handleCreate}
            sx={{ backgroundColor: colors.blueAccent[600] }}>{saving ? "Saving…" : "Submit Order"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProcurementWorkflows;
