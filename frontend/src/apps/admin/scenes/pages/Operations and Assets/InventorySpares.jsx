import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, IconButton, MenuItem, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import adminApi from "../../../utils/api";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";

const CATEGORIES = ["Pipes & Fittings", "Pumps & Parts", "Chemicals", "Electrical", "Tools", "Safety Equipment", "Other"];

const mockItems = [
  { id: 1, item_name: "HDPE Pipe DN50 (6m)", item_code: "PF-001", category: "Pipes & Fittings", quantity_in_stock: 45, reorder_level: 20, unit: "pieces", unit_cost: 850, supplier: "Unistar Pipes Ltd", low_stock: false },
  { id: 2, item_name: "Gate Valve DN100", item_code: "PF-002", category: "Pipes & Fittings", quantity_in_stock: 8, reorder_level: 10, unit: "pieces", unit_cost: 4500, supplier: "Unistar Pipes Ltd", low_stock: true },
  { id: 3, item_name: "Pump Impeller (Grundfos)", item_code: "PP-001", category: "Pumps & Parts", quantity_in_stock: 3, reorder_level: 5, unit: "pieces", unit_cost: 18000, supplier: "Grundfos Kenya", low_stock: true },
  { id: 4, item_name: "Pump Seal Kit", item_code: "PP-002", category: "Pumps & Parts", quantity_in_stock: 12, reorder_level: 8, unit: "sets", unit_cost: 3200, supplier: "Grundfos Kenya", low_stock: false },
  { id: 5, item_name: "Chlorine (HTH 70%)", item_code: "CH-001", category: "Chemicals", quantity_in_stock: 6, reorder_level: 15, unit: "kg", unit_cost: 320, supplier: "Chemtrade EA", low_stock: true },
  { id: 6, item_name: "Alum (Aluminium Sulphate)", item_code: "CH-002", category: "Chemicals", quantity_in_stock: 80, reorder_level: 50, unit: "kg", unit_cost: 85, supplier: "Chemtrade EA", low_stock: false },
  { id: 7, item_name: "3-Phase Motor Starter", item_code: "EL-001", category: "Electrical", quantity_in_stock: 4, reorder_level: 3, unit: "pieces", unit_cost: 12500, supplier: "Schneider Electric", low_stock: false },
  { id: 8, item_name: "Cable (4mm² 3-core)", item_code: "EL-002", category: "Electrical", quantity_in_stock: 120, reorder_level: 50, unit: "metres", unit_cost: 180, supplier: "Kenwest Cables", low_stock: false },
  { id: 9, item_name: "Pipe Wrench 24\"", item_code: "TL-001", category: "Tools", quantity_in_stock: 6, reorder_level: 4, unit: "pieces", unit_cost: 2800, supplier: "Hardware House", low_stock: false },
  { id: 10, item_name: "Safety Helmet (EN397)", item_code: "SE-001", category: "Safety Equipment", quantity_in_stock: 2, reorder_level: 10, unit: "pieces", unit_cost: 650, supplier: "SafetyFirst Kenya", low_stock: true },
];

const mockTransactions = [
  { id: 1, item_name: "HDPE Pipe DN50 (6m)", type: "in", quantity: 20, date: "2025-01-08", recorded_by: "James Mwangi", notes: "Restocking order" },
  { id: 2, item_name: "Chlorine (HTH 70%)", type: "out", quantity: 10, date: "2025-01-09", recorded_by: "Grace Wanjiku", notes: "Treatment plant usage" },
  { id: 3, item_name: "Gate Valve DN100", type: "out", quantity: 2, date: "2025-01-10", recorded_by: "Peter Kamau", notes: "Zone 2 repair" },
  { id: 4, item_name: "Pump Seal Kit", type: "out", quantity: 1, date: "2025-01-10", recorded_by: "David Ochieng", notes: "Kiambu pump maintenance" },
  { id: 5, item_name: "Safety Helmet (EN397)", type: "out", quantity: 3, date: "2025-01-11", recorded_by: "Mary Achieng", notes: "New field staff" },
];

const emptyForm = { item_name: "", item_code: "", category: "Pipes & Fittings", quantity_in_stock: "", reorder_level: "", unit: "", unit_cost: "", supplier: "", notes: "" };
const emptyTx = { quantity: "", notes: "", transaction_type: "in" };

const InventorySpares = () => {
  const colors = tokens(useTheme().palette.mode);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [txDialog, setTxDialog] = useState({ open: false, item: null, type: "in" });
  const [form, setForm] = useState(emptyForm);
  const [txForm, setTxForm] = useState(emptyTx);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.get("/admin/inventory")
      .then(res => setItems(Array.isArray(res.items) ? res.items : mockItems))
      .catch(() => setItems(mockItems))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ item_name: item.item_name, item_code: item.item_code, category: item.category, quantity_in_stock: item.quantity_in_stock, reorder_level: item.reorder_level, unit: item.unit, unit_cost: item.unit_cost, supplier: item.supplier, notes: "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editItem) {
        await adminApi.patch(`/admin/inventory/${editItem.id}`, { item: form });
        setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...form, low_stock: Number(form.quantity_in_stock) < Number(form.reorder_level) } : i));
      } else {
        const res = await adminApi.post("/admin/inventory", { item: form });
        setItems(prev => [...prev, res.item || { ...form, id: Date.now(), low_stock: Number(form.quantity_in_stock) < Number(form.reorder_level) }]);
      }
    } catch {
      if (editItem) setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...form, low_stock: Number(form.quantity_in_stock) < Number(form.reorder_level) } : i));
      else setItems(prev => [...prev, { ...form, id: Date.now(), low_stock: Number(form.quantity_in_stock) < Number(form.reorder_level) }]);
    } finally {
      setSaving(false);
      setDialogOpen(false);
    }
  };

  const handleTransaction = async () => {
    setSaving(true);
    const delta = txDialog.type === "in" ? Number(txForm.quantity) : -Number(txForm.quantity);
    try {
      await adminApi.post(`/admin/inventory/${txDialog.item.id}/transaction`, { transaction_type: txDialog.type, quantity: Number(txForm.quantity), notes: txForm.notes });
    } catch { /* use local update */ }
    setItems(prev => prev.map(i => i.id === txDialog.item.id ? { ...i, quantity_in_stock: Math.max(0, i.quantity_in_stock + delta), low_stock: Math.max(0, i.quantity_in_stock + delta) < i.reorder_level } : i));
    setSaving(false);
    setTxDialog({ open: false, item: null, type: "in" });
    setTxForm(emptyTx);
  };

  const lowStockItems = items.filter(i => i.low_stock || i.quantity_in_stock < i.reorder_level);
  const totalValue = items.reduce((sum, i) => sum + (Number(i.quantity_in_stock) * Number(i.unit_cost)), 0);

  const kpis = [
    { label: "Total Items", value: items.length, color: colors.blueAccent[400] },
    { label: "Low Stock", value: lowStockItems.length, color: colors.redAccent[400] },
    { label: "Total Value (KES)", value: totalValue.toLocaleString(), color: colors.greenAccent[400] },
    { label: "Categories", value: [...new Set(items.map(i => i.category))].length, color: colors.grey[300] },
  ];

  const tabSx = {
    "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
    "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
    "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
  };

  const filteredItems = items.filter(i => !search || i.item_name.toLowerCase().includes(search.toLowerCase()) || i.item_code.toLowerCase().includes(search.toLowerCase()));

  const stockByCategory = CATEGORIES.map(cat => ({
    category: cat.split(" ")[0],
    stock: items.filter(i => i.category === cat).reduce((sum, i) => sum + i.quantity_in_stock, 0),
  })).filter(x => x.stock > 0);

  const valueByCategory = CATEGORIES.map(cat => ({
    id: cat.split(" ")[0],
    label: cat.split(" ")[0],
    value: items.filter(i => i.category === cat).reduce((sum, i) => sum + i.quantity_in_stock * i.unit_cost, 0),
  })).filter(x => x.value > 0);

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Inventory & Spares</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Manage spare parts, chemicals, and equipment stock</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ backgroundColor: colors.blueAccent[700], "&:hover": { backgroundColor: colors.blueAccent[600] } }}>
            Add Item
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

      {lowStockItems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⚠️ {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} below reorder level — review Low Stock Alerts tab.
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...tabSx, mb: 2 }}>
        <Tab label="Inventory Table" />
        <Tab label="Low Stock Alerts" />
        <Tab label="Transactions" />
        <Tab label="Analytics" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box> : (
        <>
          {tab === 0 && (
            <Box>
              <TextField size="small" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[500] }} /></InputAdornment> }}
                sx={{ mb: 2, width: 280 }} />
              <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ minWidth: 900 }}>
                  <Box display="flex" gap={1} p={1} sx={{ backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" }}>
                    {["Item Name", "Code", "Category", "In Stock", "Reorder", "Unit", "Unit Cost", "Total Value", "Supplier", "Actions"].map(h => (
                      <Typography key={h} variant="caption" color="#fff" fontWeight="bold" sx={{ flex: h === "Item Name" ? 2 : h === "Supplier" ? 1.5 : 1, minWidth: 60 }}>{h}</Typography>
                    ))}
                  </Box>
                  {filteredItems.map(item => {
                    const isLow = item.quantity_in_stock < item.reorder_level;
                    return (
                      <Box key={item.id} display="flex" gap={1} p={1} alignItems="center"
                        sx={{ backgroundColor: colors.primary[400], borderBottom: `1px solid ${colors.grey[700]}`, "&:hover": { backgroundColor: colors.primary[500] } }}>
                        <Typography variant="body2" color={colors.grey[100]} sx={{ flex: 2, minWidth: 60 }}>{item.item_name}</Typography>
                        <Typography variant="caption" color={colors.grey[400]} sx={{ flex: 1, minWidth: 60 }}>{item.item_code}</Typography>
                        <Box sx={{ flex: 1, minWidth: 60 }}><Chip label={item.category.split(" ")[0]} size="small" sx={{ backgroundColor: colors.blueAccent[800], color: colors.blueAccent[200], fontSize: "0.65rem" }} /></Box>
                        <Typography variant="body2" color={isLow ? colors.redAccent[400] : colors.greenAccent[400]} fontWeight="bold" sx={{ flex: 1, minWidth: 60 }}>{item.quantity_in_stock}</Typography>
                        <Typography variant="caption" color={colors.grey[400]} sx={{ flex: 1, minWidth: 60 }}>{item.reorder_level}</Typography>
                        <Typography variant="caption" color={colors.grey[400]} sx={{ flex: 1, minWidth: 60 }}>{item.unit}</Typography>
                        <Typography variant="caption" color={colors.grey[300]} sx={{ flex: 1, minWidth: 60 }}>KES {Number(item.unit_cost).toLocaleString()}</Typography>
                        <Typography variant="caption" color={colors.greenAccent[400]} sx={{ flex: 1, minWidth: 60 }}>KES {(item.quantity_in_stock * item.unit_cost).toLocaleString()}</Typography>
                        <Typography variant="caption" color={colors.grey[400]} sx={{ flex: 1.5, minWidth: 80 }} noWrap>{item.supplier}</Typography>
                        <Box display="flex" gap={0.3} sx={{ flex: 1, minWidth: 60 }}>
                          <IconButton size="small" onClick={() => openEdit(item)} sx={{ color: colors.blueAccent[400] }}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
                          <IconButton size="small" onClick={() => { setTxDialog({ open: true, item, type: "in" }); setTxForm({ ...emptyTx, transaction_type: "in" }); }} sx={{ color: colors.greenAccent[400] }}><AddCircleIcon sx={{ fontSize: 14 }} /></IconButton>
                          <IconButton size="small" onClick={() => { setTxDialog({ open: true, item, type: "out" }); setTxForm({ ...emptyTx, transaction_type: "out" }); }} sx={{ color: colors.redAccent[400] }}><RemoveCircleIcon sx={{ fontSize: 14 }} /></IconButton>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}

          {tab === 1 && (
            <Box display="flex" flexWrap="wrap" gap={2}>
              {lowStockItems.length === 0 && <Alert severity="success" sx={{ width: "100%" }}>All items are adequately stocked.</Alert>}
              {lowStockItems.map(item => (
                <Card key={item.id} sx={{ flex: "1 1 260px", maxWidth: 320, backgroundColor: colors.primary[400], borderLeft: `4px solid ${colors.redAccent[400]}` }}>
                  <CardContent>
                    <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">{item.item_name}</Typography>
                    <Chip label={item.category} size="small" sx={{ backgroundColor: colors.blueAccent[800], color: colors.blueAccent[200], mb: 1 }} />
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color={colors.grey[400]}>In Stock:</Typography>
                      <Typography variant="caption" color={colors.redAccent[400]} fontWeight="bold">{item.quantity_in_stock} {item.unit}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color={colors.grey[400]}>Reorder Level:</Typography>
                      <Typography variant="caption" color={colors.grey[300]}>{item.reorder_level} {item.unit}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color={colors.grey[400]}>Suggested Order:</Typography>
                      <Typography variant="caption" color={colors.greenAccent[400]}>{item.reorder_level * 2 - item.quantity_in_stock} {item.unit}</Typography>
                    </Box>
                    <Typography variant="caption" color={colors.grey[500]}>Supplier: {item.supplier}</Typography>
                    <Box mt={1.5}>
                      <Button size="small" variant="outlined" sx={{ fontSize: "0.75rem", borderColor: colors.blueAccent[600], color: colors.blueAccent[400] }}>
                        Create PO
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {tab === 2 && (
            <Box>
              {mockTransactions.map(tx => (
                <Box key={tx.id} display="flex" gap={2} alignItems="center" p={1.5} mb={1}
                  sx={{ backgroundColor: colors.primary[400], borderRadius: 1, borderLeft: `3px solid ${tx.type === "in" ? colors.greenAccent[500] : colors.redAccent[400]}` }}>
                  <Chip label={tx.type === "in" ? "STOCK IN" : "STOCK OUT"} size="small"
                    sx={{ backgroundColor: tx.type === "in" ? colors.greenAccent[800] : colors.redAccent[800], color: tx.type === "in" ? colors.greenAccent[300] : colors.redAccent[300], fontWeight: "bold" }} />
                  <Box flex={1}>
                    <Typography variant="body2" color={colors.grey[100]} fontWeight="bold">{tx.item_name}</Typography>
                    <Typography variant="caption" color={colors.grey[400]}>Qty: {tx.quantity} · {tx.date} · {tx.recorded_by}</Typography>
                    {tx.notes && <Typography variant="caption" color={colors.grey[500]} display="block">{tx.notes}</Typography>}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {tab === 3 && (
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Box flex="1 1 300px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Stock Levels by Category</Typography>
                <ResponsiveBar data={stockByCategory} keys={["stock"]} indexBy="category" margin={{ top: 10, right: 20, bottom: 50, left: 50 }}
                  colors={[colors.blueAccent[500]]} axisBottom={{ tickRotation: -20 }}
                  theme={{ axis: { ticks: { text: { fill: colors.grey[400] } } }, grid: { line: { stroke: colors.grey[700] } } }} />
              </Box>
              <Box flex="1 1 280px" height={280} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Inventory Value by Category</Typography>
                <ResponsivePie data={valueByCategory} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                  colors={{ scheme: "nivo" }}
                  theme={{ legends: { text: { fill: colors.grey[400] } } }}
                  legends={[{ anchor: "bottom", direction: "row", itemWidth: 70, itemHeight: 18, itemTextColor: colors.grey[400] }]} />
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>{editItem ? "Edit Item" : "Add Inventory Item"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Item Name *" value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} fullWidth />
            <TextField label="Item Code" value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))} fullWidth />
            <TextField select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} fullWidth>
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <Box display="flex" gap={2}>
              <TextField label="Quantity in Stock" type="number" value={form.quantity_in_stock} onChange={e => setForm(f => ({ ...f, quantity_in_stock: e.target.value }))} fullWidth />
              <TextField label="Reorder Level" type="number" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: e.target.value }))} fullWidth />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="Unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} fullWidth />
              <TextField label="Unit Cost (KES)" type="number" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))} fullWidth />
            </Box>
            <TextField label="Supplier" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} fullWidth />
            <TextField label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!form.item_name || saving} onClick={handleSave}
            sx={{ backgroundColor: colors.blueAccent[700] }}>{saving ? "Saving..." : editItem ? "Update" : "Add Item"}</Button>
        </DialogActions>
      </Dialog>

      {/* Stock In/Out Dialog */}
      <Dialog open={txDialog.open} onClose={() => setTxDialog({ open: false, item: null, type: "in" })} maxWidth="xs" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>
          {txDialog.type === "in" ? "Stock In" : "Stock Out"} — {txDialog.item?.item_name}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Quantity" type="number" value={txForm.quantity} onChange={e => setTxForm(f => ({ ...f, quantity: e.target.value }))} fullWidth />
            <TextField label="Notes" value={txForm.notes} onChange={e => setTxForm(f => ({ ...f, notes: e.target.value }))} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTxDialog({ open: false, item: null, type: "in" })} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!txForm.quantity || saving} onClick={handleTransaction}
            sx={{ backgroundColor: txDialog.type === "in" ? colors.greenAccent[700] : colors.redAccent[600] }}>
            {saving ? "Saving..." : txDialog.type === "in" ? "Add Stock" : "Remove Stock"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventorySpares;
