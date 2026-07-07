import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress,
  Chip, IconButton, MenuItem, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import adminApi from "../../../utils/api";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";

const ENERGY_TYPES = ["electricity", "diesel", "solar", "water"];
const UNITS_MAP = { electricity: "kWh", diesel: "L", solar: "kWh", water: "m³" };

const mockRecords = [
  { id: 1, energy_type: "electricity", quantity: 1240, unit: "kWh", cost: 18600, record_date: "2024-11-05", asset: { name: "Kiambu Main Pump" }, notes: "Monthly KPLC bill" },
  { id: 2, energy_type: "diesel", quantity: 180, unit: "L", cost: 32400, record_date: "2024-11-10", asset: { name: "Backup Generator" }, notes: "Fuel top-up" },
  { id: 3, energy_type: "solar", quantity: 620, unit: "kWh", cost: 0, record_date: "2024-11-15", asset: { name: "Solar Array Unit 1" }, notes: "Generated energy" },
  { id: 4, energy_type: "electricity", quantity: 980, unit: "kWh", cost: 14700, record_date: "2024-11-20", asset: { name: "Thika Treatment Plant" }, notes: "Treatment plant power" },
  { id: 5, energy_type: "diesel", quantity: 95, unit: "L", cost: 17100, record_date: "2024-12-02", asset: { name: "Backup Generator" }, notes: "Emergency outage fuel" },
  { id: 6, energy_type: "electricity", quantity: 1350, unit: "kWh", cost: 20250, record_date: "2024-12-05", asset: { name: "Kiambu Main Pump" }, notes: "Monthly KPLC bill" },
  { id: 7, energy_type: "solar", quantity: 540, unit: "kWh", cost: 0, record_date: "2024-12-10", asset: { name: "Solar Array Unit 1" }, notes: "Generated energy" },
  { id: 8, energy_type: "electricity", quantity: 760, unit: "kWh", cost: 11400, record_date: "2024-12-15", asset: { name: "Ruiru Borehole #1" }, notes: "Borehole pump power" },
  { id: 9, energy_type: "diesel", quantity: 120, unit: "L", cost: 21600, record_date: "2024-12-20", asset: { name: "Backup Generator" }, notes: "Scheduled refuel" },
  { id: 10, energy_type: "electricity", quantity: 1100, unit: "kWh", cost: 16500, record_date: "2025-01-03", asset: { name: "Kiambu Main Pump" }, notes: "Monthly KPLC bill" },
  { id: 11, energy_type: "solar", quantity: 480, unit: "kWh", cost: 0, record_date: "2025-01-07", asset: { name: "Solar Array Unit 1" }, notes: "Generated energy" },
  { id: 12, energy_type: "diesel", quantity: 60, unit: "L", cost: 10800, record_date: "2025-01-09", asset: { name: "Backup Generator" }, notes: "Fuel top-up" },
];

const budgetData = [
  { month: "Oct 2024", budget: 80000, actual: 72000 },
  { month: "Nov 2024", budget: 80000, actual: 83700 },
  { month: "Dec 2024", budget: 85000, actual: 69750 },
  { month: "Jan 2025", budget: 80000, actual: 27300 },
];

const typeColor = (t) => {
  if (t === "electricity") return "#f0c040";
  if (t === "diesel") return "#ff7043";
  if (t === "solar") return "#4cceac";
  if (t === "water") return "#6870fa";
  return "#858585";
};

const emptyForm = { energy_type: "electricity", asset_id: "", quantity: "", unit: "kWh", cost: "", record_date: "", notes: "" };

const EnergyFuelTracking = () => {
  const colors = tokens(useTheme().palette.mode);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.get("/admin/energy")
      .then(res => setRecords(Array.isArray(res.records) ? res.records : mockRecords))
      .catch(() => setRecords(mockRecords))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await adminApi.post("/admin/energy", { record: form });
      setRecords(prev => [...prev, res.record || { ...form, id: Date.now(), asset: { name: "Asset " + form.asset_id } }]);
    } catch {
      setRecords(prev => [...prev, { ...form, id: Date.now(), asset: { name: "Asset " + form.asset_id } }]);
    } finally {
      setSaving(false);
      setDialogOpen(false);
      setForm(emptyForm);
    }
  };

  const totalCost = records.reduce((sum, r) => sum + Number(r.cost), 0);
  const totalElec = records.filter(r => r.energy_type === "electricity").reduce((sum, r) => sum + Number(r.quantity), 0);
  const totalDiesel = records.filter(r => r.energy_type === "diesel").reduce((sum, r) => sum + Number(r.quantity), 0);
  const totalSolar = records.filter(r => r.energy_type === "solar").reduce((sum, r) => sum + Number(r.quantity), 0);
  const carbonElec = totalElec * 0.233;
  const carbonDiesel = totalDiesel * 2.68;
  const carbonAvoided = totalSolar * 0.233;
  const netCarbon = carbonElec + carbonDiesel - carbonAvoided;

  const kpis = [
    { label: "Total Cost (KES)", value: totalCost.toLocaleString(), color: colors.redAccent[400] },
    { label: "Electricity (kWh)", value: totalElec.toLocaleString(), color: "#f0c040" },
    { label: "Diesel (L)", value: totalDiesel.toLocaleString(), color: "#ff7043" },
    { label: "Solar Generated (kWh)", value: totalSolar.toLocaleString(), color: colors.greenAccent[400] },
    { label: "Carbon Footprint (kg CO₂)", value: Math.round(netCarbon).toLocaleString(), color: colors.grey[300] },
  ];

  const tabSx = {
    "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
    "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
    "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
  };

  const filteredRecords = filterType === "all" ? records : records.filter(r => r.energy_type === filterType);

  const monthlyCostByType = [
    { id: "Electricity", data: [{ x: "Nov", y: 33300 }, { x: "Dec", y: 31650 }, { x: "Jan", y: 16500 }] },
    { id: "Diesel", data: [{ x: "Nov", y: 32400 }, { x: "Dec", y: 38700 }, { x: "Jan", y: 10800 }] },
    { id: "Solar", data: [{ x: "Nov", y: 0 }, { x: "Dec", y: 0 }, { x: "Jan", y: 0 }] },
  ];

  const costByAsset = [
    { asset: "Kiambu Pump", cost: records.filter(r => r.asset?.name?.includes("Kiambu")).reduce((s, r) => s + Number(r.cost), 0) },
    { asset: "Treatment Plant", cost: records.filter(r => r.asset?.name?.includes("Thika")).reduce((s, r) => s + Number(r.cost), 0) },
    { asset: "Generator", cost: records.filter(r => r.asset?.name?.includes("Generator")).reduce((s, r) => s + Number(r.cost), 0) },
    { asset: "Borehole", cost: records.filter(r => r.asset?.name?.includes("Ruiru")).reduce((s, r) => s + Number(r.cost), 0) },
  ].filter(x => x.cost > 0);

  const costPie = ENERGY_TYPES.map(t => ({
    id: t, label: t,
    value: records.filter(r => r.energy_type === t).reduce((s, r) => s + Number(r.cost), 0),
  })).filter(x => x.value > 0);

  const carbonTrend = [
    { id: "Emissions", data: [{ x: "Nov", y: Math.round(1240 * 0.233 + 180 * 2.68) }, { x: "Dec", y: Math.round(2110 * 0.233 + 215 * 2.68) }, { x: "Jan", y: Math.round(1100 * 0.233 + 60 * 2.68) }] },
    { id: "Avoided (Solar)", data: [{ x: "Nov", y: Math.round(620 * 0.233) }, { x: "Dec", y: Math.round(540 * 0.233) }, { x: "Jan", y: Math.round(480 * 0.233) }] },
  ];

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Energy & Fuel Tracking</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Monitor electricity, diesel, and solar energy consumption</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}
            sx={{ backgroundColor: colors.blueAccent[700], "&:hover": { backgroundColor: colors.blueAccent[600] } }}>
            Log Record
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {kpis.map(k => (
          <Card key={k.label} sx={{ flex: "1 1 130px", minWidth: 110, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p: "12px 16px !important" }}>
              <Typography variant="h4" color={k.color} fontWeight="bold">{k.value}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>{k.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...tabSx, mb: 2 }}>
        <Tab label="Records" />
        <Tab label="Analytics" />
        <Tab label="Carbon Tracker" />
        <Tab label="Budget vs Actual" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box> : (
        <>
          {tab === 0 && (
            <Box>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <TextField select size="small" label="Filter by Type" value={filterType} onChange={e => setFilterType(e.target.value)} sx={{ minWidth: 160 }}>
                  <MenuItem value="all">All Types</MenuItem>
                  {ENERGY_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {filteredRecords.map(r => (
                  <Card key={r.id} sx={{ flex: "1 1 240px", maxWidth: 300, backgroundColor: colors.primary[400], borderLeft: `4px solid ${typeColor(r.energy_type)}` }}>
                    <CardContent sx={{ p: "12px 16px !important" }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Chip label={r.energy_type} size="small" sx={{ backgroundColor: typeColor(r.energy_type) + "33", color: typeColor(r.energy_type), fontWeight: "bold" }} />
                        <Typography variant="caption" color={colors.grey[500]}>{r.record_date}</Typography>
                      </Box>
                      <Typography variant="body2" color={colors.grey[200]} fontWeight="bold">{r.asset?.name}</Typography>
                      <Typography variant="h5" color={typeColor(r.energy_type)} fontWeight="bold">{Number(r.quantity).toLocaleString()} {r.unit}</Typography>
                      {r.cost > 0 && <Typography variant="caption" color={colors.greenAccent[400]}>KES {Number(r.cost).toLocaleString()}</Typography>}
                      {r.notes && <Typography variant="caption" color={colors.grey[500]} display="block" mt={0.5}>{r.notes}</Typography>}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {tab === 1 && (
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Box flex="1 1 300px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Monthly Cost by Type (KES)</Typography>
                <ResponsiveLine data={monthlyCostByType} margin={{ top: 10, right: 80, bottom: 40, left: 60 }}
                  colors={["#f0c040", "#ff7043", colors.greenAccent[500]]} pointSize={6}
                  legends={[{ anchor: "right", direction: "column", itemWidth: 70, itemHeight: 20, itemTextColor: colors.grey[400] }]}
                  theme={{ axis: { ticks: { text: { fill: colors.grey[400] } } }, grid: { line: { stroke: colors.grey[700] } }, legends: { text: { fill: colors.grey[400] } } }} />
              </Box>
              <Box flex="1 1 300px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Cost by Asset (KES)</Typography>
                <ResponsiveBar data={costByAsset} keys={["cost"]} indexBy="asset" margin={{ top: 10, right: 20, bottom: 50, left: 60 }}
                  colors={[colors.blueAccent[500]]} axisBottom={{ tickRotation: -20 }}
                  theme={{ axis: { ticks: { text: { fill: colors.grey[400] } } }, grid: { line: { stroke: colors.grey[700] } } }} />
              </Box>
              <Box flex="1 1 260px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Cost Breakdown by Type</Typography>
                <ResponsivePie data={costPie} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                  colors={["#f0c040", "#ff7043", colors.greenAccent[500], colors.blueAccent[400]]}
                  theme={{ legends: { text: { fill: colors.grey[400] } } }}
                  legends={[{ anchor: "bottom", direction: "row", itemWidth: 70, itemHeight: 18, itemTextColor: colors.grey[400] }]} />
              </Box>
            </Box>
          )}

          {tab === 2 && (
            <Box>
              <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
                {[
                  { label: "Electricity Emissions", value: `${Math.round(carbonElec).toLocaleString()} kg CO₂`, color: "#f0c040", note: "0.233 kg/kWh" },
                  { label: "Diesel Emissions", value: `${Math.round(carbonDiesel).toLocaleString()} kg CO₂`, color: "#ff7043", note: "2.68 kg/L" },
                  { label: "Solar Avoided", value: `${Math.round(carbonAvoided).toLocaleString()} kg CO₂`, color: colors.greenAccent[400], note: "0.233 kg/kWh" },
                  { label: "Net Carbon Balance", value: `${Math.round(netCarbon).toLocaleString()} kg CO₂`, color: netCarbon > 0 ? colors.redAccent[400] : colors.greenAccent[400], note: "Total net emissions" },
                ].map(c => (
                  <Card key={c.label} sx={{ flex: "1 1 180px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <CardContent sx={{ p: "12px 16px !important" }}>
                      <Typography variant="h5" color={c.color} fontWeight="bold">{c.value}</Typography>
                      <Typography variant="body2" color={colors.grey[300]}>{c.label}</Typography>
                      <Typography variant="caption" color={colors.grey[500]}>{c.note}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              <Box height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Monthly Carbon Trend (kg CO₂)</Typography>
                <ResponsiveLine data={carbonTrend} margin={{ top: 10, right: 100, bottom: 40, left: 60 }}
                  colors={[colors.redAccent[400], colors.greenAccent[500]]} pointSize={8}
                  legends={[{ anchor: "right", direction: "column", itemWidth: 90, itemHeight: 20, itemTextColor: colors.grey[400] }]}
                  theme={{ axis: { ticks: { text: { fill: colors.grey[400] } } }, grid: { line: { stroke: colors.grey[700] } }, legends: { text: { fill: colors.grey[400] } } }} />
              </Box>
            </Box>
          )}

          {tab === 3 && (
            <Box>
              <Typography variant="h6" color={colors.grey[300]} mb={2}>Monthly Budget vs Actual Spend (KES)</Typography>
              <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ minWidth: 600 }}>
                  <Box display="flex" gap={2} p={1.5} sx={{ backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" }}>
                    {["Month", "Budget (KES)", "Actual (KES)", "Variance (KES)", "Status"].map(h => (
                      <Typography key={h} variant="caption" color="#fff" fontWeight="bold" sx={{ flex: 1 }}>{h}</Typography>
                    ))}
                  </Box>
                  {budgetData.map(row => {
                    const variance = row.budget - row.actual;
                    const isUnder = variance >= 0;
                    return (
                      <Box key={row.month} display="flex" gap={2} p={1.5} alignItems="center"
                        sx={{ backgroundColor: colors.primary[400], borderBottom: `1px solid ${colors.grey[700]}` }}>
                        <Typography variant="body2" color={colors.grey[100]} sx={{ flex: 1 }}>{row.month}</Typography>
                        <Typography variant="body2" color={colors.grey[300]} sx={{ flex: 1 }}>KES {row.budget.toLocaleString()}</Typography>
                        <Typography variant="body2" color={colors.grey[100]} sx={{ flex: 1 }}>KES {row.actual.toLocaleString()}</Typography>
                        <Typography variant="body2" color={isUnder ? colors.greenAccent[400] : colors.redAccent[400]} fontWeight="bold" sx={{ flex: 1 }}>
                          {isUnder ? "+" : ""}{variance.toLocaleString()}
                        </Typography>
                        <Chip label={isUnder ? "Under Budget" : "Over Budget"} size="small"
                          sx={{ flex: 1, backgroundColor: isUnder ? colors.greenAccent[800] : colors.redAccent[800], color: isUnder ? colors.greenAccent[300] : colors.redAccent[300] }} />
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Log Energy Record</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField select label="Energy Type" value={form.energy_type}
              onChange={e => setForm(f => ({ ...f, energy_type: e.target.value, unit: UNITS_MAP[e.target.value] || "" }))} fullWidth>
              {ENERGY_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Asset ID" value={form.asset_id} onChange={e => setForm(f => ({ ...f, asset_id: e.target.value }))} fullWidth />
            <Box display="flex" gap={2}>
              <TextField label="Quantity *" type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} fullWidth />
              <TextField label="Unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} fullWidth />
            </Box>
            <TextField label="Cost (KES)" type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} fullWidth />
            <TextField label="Record Date *" type="date" value={form.record_date} onChange={e => setForm(f => ({ ...f, record_date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!form.quantity || !form.record_date || saving} onClick={handleCreate}
            sx={{ backgroundColor: colors.blueAccent[700] }}>{saving ? "Saving..." : "Log Record"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnergyFuelTracking;
