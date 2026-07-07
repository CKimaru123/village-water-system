import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, IconButton,
} from "@mui/material";
import { tokens } from "../../../theme";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import adminApi from "../../../utils/api";

const EMPTY = { name: "", rate_per_m3: "", fixed_charge: "", min_units: "", max_units: "", description: "" };

const TariffManagement = () => {
  const colors = tokens("dark");
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    adminApi.get("/admin/tariffs")
      .then(res => setTariffs(res.data?.data?.tariffs || res.data?.tariffs || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ ...t }); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await adminApi.patch(`/admin/tariffs/${editing.id}`, { tariff: form });
      else await adminApi.post("/admin/tariffs", { tariff: form });
      setOpen(false);
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this tariff?")) return;
    try { await adminApi.delete(`/admin/tariffs/${id}`); load(); }
    catch (err) { setError(err.message); }
  };

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));
  const fieldSx = { mb: 2, "& label": { color: colors.grey[400] },
    "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } } };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Tariff Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />}
          sx={{ backgroundColor: colors.blueAccent[600] }} onClick={openCreate}>Add Tariff</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? <CircularProgress sx={{ color: colors.blueAccent[500] }} /> : (
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Name", "Rate/m³ (KES)", "Fixed Charge", "Min Units", "Max Units", "Actions"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[300] }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tariffs.map(t => (
                  <TableRow key={t.id}>
                    <TableCell sx={{ color: colors.grey[100] }}>{t.name}</TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>{t.rate_per_m3}</TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>{t.fixed_charge || "—"}</TableCell>
                    <TableCell sx={{ color: colors.grey[300] }}>{t.min_units ?? "—"}</TableCell>
                    <TableCell sx={{ color: colors.grey[300] }}>{t.max_units ?? "—"}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => openEdit(t)} sx={{ color: colors.blueAccent[400] }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(t.id)} sx={{ color: colors.redAccent[400] }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>{editing ? "Edit Tariff" : "New Tariff"}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={form.name} onChange={set("name")} sx={fieldSx} />
          <TextField fullWidth label="Rate per m³ (KES)" type="number" value={form.rate_per_m3} onChange={set("rate_per_m3")} sx={fieldSx} />
          <TextField fullWidth label="Fixed Charge (KES)" type="number" value={form.fixed_charge} onChange={set("fixed_charge")} sx={fieldSx} />
          <TextField fullWidth label="Min Units (m³)" type="number" value={form.min_units} onChange={set("min_units")} sx={fieldSx} />
          <TextField fullWidth label="Max Units (m³)" type="number" value={form.max_units} onChange={set("max_units")} sx={fieldSx} />
          <TextField fullWidth label="Description" value={form.description} onChange={set("description")} sx={fieldSx} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleSave}
            sx={{ backgroundColor: colors.blueAccent[600] }}>{saving ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TariffManagement;
