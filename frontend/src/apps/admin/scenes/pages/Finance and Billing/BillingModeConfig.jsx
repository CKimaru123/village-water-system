import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete,
  InputAdornment,
} from "@mui/material";
import { tokens } from "../../../theme";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import adminApi from "../../../utils/api";

const BILLING_MODES = [
  { value: "fixed",       label: "Fixed Rate",              desc: "Flat charge regardless of consumption" },
  { value: "usage_based", label: "Usage-Based",             desc: "Charged per m³ consumed (tiered tariff)" },
  { value: "combined",    label: "Combined (Fixed + Usage)", desc: "Fixed base charge plus usage-based top-up" },
];

const modeColor = (mode, colors) => {
  if (mode === "fixed")       return colors.greenAccent[600];
  if (mode === "usage_based") return colors.blueAccent[600];
  return colors.redAccent[600];
};

const BillingModeForm = ({ form, onChange, tariffs, colors, fieldSx }) => (
  <>
    <FormControl fullWidth sx={{ mb: 2 }}>
      <InputLabel sx={{ color: colors.grey[400] }}>Billing Mode</InputLabel>
      <Select
        value={form.billing_mode}
        label="Billing Mode"
        onChange={e => onChange({ ...form, billing_mode: e.target.value })}
        sx={{ color: colors.grey[100], fontSize: "12px", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
      >
        {BILLING_MODES.map(m => (
          <MenuItem key={m.value} value={m.value}>
            <Box>
              <Typography variant="body2" sx={{ fontSize: "12px" }}>{m.label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "12px" }}>{m.desc}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    {(form.billing_mode === "fixed" || form.billing_mode === "combined") && (
      <TextField
        fullWidth
        label="Fixed Amount (KES)"
        type="number"
        value={form.fixed_amount}
        onChange={e => onChange({ ...form, fixed_amount: e.target.value })}
        InputProps={{ startAdornment: <InputAdornment position="start">KES</InputAdornment> }}
        inputProps={{ min: 0, step: "0.01" }}
        sx={fieldSx}
      />
    )}

    {(form.billing_mode === "usage_based" || form.billing_mode === "combined") && (
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel sx={{ color: colors.grey[400] }}>Tariff Rate</InputLabel>
        <Select
          value={form.tariff_id}
          label="Tariff Rate"
          onChange={e => onChange({ ...form, tariff_id: e.target.value })}
          sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
        >
          <MenuItem value=""><em>Use default tariff</em></MenuItem>
          {tariffs.map(t => (
            <MenuItem key={t.id} value={t.id}>{t.rate_name} — KES {t.rate_per_unit}/m³</MenuItem>
          ))}
        </Select>
      </FormControl>
    )}

    <TextField
      fullWidth
      label="Effective From"
      type="date"
      InputLabelProps={{ shrink: true }}
      value={form.effective_from}
      onChange={e => onChange({ ...form, effective_from: e.target.value })}
      sx={fieldSx}
    />
  </>
);

const EMPTY_FORM = { billing_mode: "usage_based", fixed_amount: "", tariff_id: "", effective_from: new Date().toISOString().split("T")[0] };

const BillingModeConfig = () => {
  const colors = tokens("dark");

  const [globalConfig, setGlobalConfig]   = useState(null);
  const [clientConfigs, setClientConfigs] = useState([]);
  const [tariffs, setTariffs]             = useState([]);
  const [clients, setClients]             = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [alert, setAlert]       = useState(null);

  const [globalForm, setGlobalForm] = useState(EMPTY_FORM);
  const [addDialog, setAddDialog]   = useState(false);
  const [addClient, setAddClient]   = useState(null);
  const [addForm, setAddForm]       = useState(EMPTY_FORM);
  const [editDialog, setEditDialog] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fieldSx = {
    mb: 2,
    "& label": { color: colors.grey[400] },
    "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } },
  };

  const showAlert = (msg, sev = "success") => { setAlert({ msg, sev }); setTimeout(() => setAlert(null), 4000); };

  const load = () => {
    setLoading(true);
    Promise.all([
      adminApi.get("/admin/billing_configs"),
      adminApi.get("/admin/tariffs"),
      adminApi.get("/admin/clients"),
    ]).then(([cfgRes, tariffRes, clientRes]) => {
      const data = cfgRes.data?.data || cfgRes.data;
      const g = data?.global_default;
      setGlobalConfig(g || null);
      setGlobalForm(g ? { billing_mode: g.billing_mode, fixed_amount: g.fixed_amount || "", tariff_id: g.tariff_id || "", effective_from: g.effective_from || new Date().toISOString().split("T")[0] } : EMPTY_FORM);
      setClientConfigs(data?.client_configs || []);
      setTariffs(tariffRes.data?.data?.tariffs || tariffRes.data?.tariffs || []);
      setClients(clientRes.data?.data?.clients || clientRes.data?.clients || []);
    }).catch(() => showAlert("Failed to load billing configs", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const saveGlobal = async () => {
    setSaving(true);
    try {
      await adminApi.patch("/admin/billing_configs/global", { billing_config: globalForm });
      showAlert("Global billing config saved.");
      load();
    } catch (err) {
      const msgs = err.response?.data?.errors || [err.response?.data?.message || err.message];
      showAlert(msgs.join(", "), "error");
    } finally { setSaving(false); }
  };

  const saveClientConfig = async (userId, form) => {
    setSaving(true);
    try {
      await adminApi.patch(`/admin/billing_configs/${userId}`, { billing_config: form });
      showAlert("Client billing config saved.");
      setAddDialog(false); setEditDialog(null); setAddClient(null); setAddForm(EMPTY_FORM);
      load();
    } catch (err) {
      const msgs = err.response?.data?.errors || [err.response?.data?.message || err.message];
      showAlert(msgs.join(", "), "error");
    } finally { setSaving(false); }
  };

  const deleteClientConfig = async (userId, userName) => {
    try {
      await adminApi.delete(`/admin/billing_configs/${userId}`);
      showAlert(`Billing config removed for ${userName}. Client will use global default.`);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      showAlert(err.response?.data?.message || err.message, "error");
    }
  };

  const modeLabel = (mode) => BILLING_MODES.find(m => m.value === mode)?.label || mode;

  if (loading) return <Box m="20px" display="flex" justifyContent="center"><CircularProgress sx={{ color: colors.blueAccent[400] }} /></Box>;

  return (
    <Box m="20px">
      <Box display="flex" alignItems="center" gap={1} mb="20px">
        <AccountBalanceIcon sx={{ color: colors.blueAccent[400], fontSize: 32 }} />
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Billing Mode Configuration</Typography>
      </Box>

      {alert && <Alert severity={alert.sev} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      <Grid container spacing={3}>
        {/* Global Default */}
        <Grid item xs={12} md={5}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={1}>Global Default</Typography>
              <Typography variant="body2" color={colors.grey[400]} mb={3}>
                Applies to all clients without an individual billing config.
              </Typography>

              <BillingModeForm form={globalForm} onChange={setGlobalForm} tariffs={tariffs} colors={colors} fieldSx={fieldSx} />

              <Button
                variant="contained"
                fullWidth
                startIcon={<SaveIcon />}
                disabled={saving}
                onClick={saveGlobal}
                sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[700] } }}
              >
                {saving ? "Saving..." : "Save Global Config"}
              </Button>

              {globalConfig && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Current: <strong>{modeLabel(globalConfig.billing_mode)}</strong>
                  {globalConfig.fixed_amount ? ` — KES ${globalConfig.fixed_amount}` : ""}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Per-Client Overrides */}
        <Grid item xs={12} md={7}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" color={colors.grey[100]}>Per-Client Overrides</Typography>
                <Button variant="outlined" startIcon={<AddIcon />} size="small"
                  sx={{ borderColor: colors.blueAccent[400], color: colors.blueAccent[400] }}
                  onClick={() => setAddDialog(true)}>
                  Add Override
                </Button>
              </Box>

              {clientConfigs.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["Client", "Mode", "Fixed Amt", "Tariff", "Actions"].map(h => (
                        <TableCell key={h} sx={{ color: colors.grey[300] }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientConfigs.map(c => (
                      <TableRow key={c.id}>
                        <TableCell sx={{ color: colors.grey[100] }}>{c.user_name || c.user_id}</TableCell>
                        <TableCell>
                          <Chip label={modeLabel(c.billing_mode)} size="small"
                            sx={{ backgroundColor: modeColor(c.billing_mode, colors), color: "#fff" }} />
                        </TableCell>
                        <TableCell sx={{ color: colors.grey[300] }}>{c.fixed_amount ? `KES ${c.fixed_amount}` : "—"}</TableCell>
                        <TableCell sx={{ color: colors.grey[300] }}>{c.tariff_name || "—"}</TableCell>
                        <TableCell>
                          <IconButton size="small" sx={{ color: colors.blueAccent[400] }}
                            onClick={() => setEditDialog({ userId: c.user_id, userName: c.user_name, form: { billing_mode: c.billing_mode, fixed_amount: c.fixed_amount || "", tariff_id: c.tariff_id || "", effective_from: c.effective_from || new Date().toISOString().split("T")[0] } })}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" sx={{ color: colors.redAccent[400] }}
                            onClick={() => setDeleteConfirm({ userId: c.user_id, userName: c.user_name })}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color={colors.grey[400]}>No per-client overrides configured.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Client Override Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Add Client Billing Override</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <Autocomplete
              options={clients}
              getOptionLabel={c => `${c.display_name || c.name || ""} (${c.account_number || c.id})`}
              onChange={(_, val) => setAddClient(val)}
              renderInput={params => <TextField {...params} label="Select Client" sx={fieldSx} />}
              sx={{ mb: 2 }}
            />
            <BillingModeForm form={addForm} onChange={setAddForm} tariffs={tariffs} colors={colors} fieldSx={fieldSx} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving || !addClient} onClick={() => saveClientConfig(addClient?.id, addForm)}
            sx={{ backgroundColor: colors.blueAccent[600] }}>{saving ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Edit Billing Config — {editDialog?.userName}</DialogTitle>
        <DialogContent>
          {editDialog && (
            <Box pt={1}>
              <BillingModeForm form={editDialog.form} onChange={f => setEditDialog(d => ({ ...d, form: f }))} tariffs={tariffs} colors={colors} fieldSx={fieldSx} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(null)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={() => saveClientConfig(editDialog.userId, editDialog.form)}
            sx={{ backgroundColor: colors.blueAccent[600] }}>{saving ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Remove Override</DialogTitle>
        <DialogContent>
          <Typography color={colors.grey[100]}>
            Remove billing config for <strong>{deleteConfirm?.userName}</strong>? They will revert to the global default.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" color="error"
            onClick={() => deleteClientConfig(deleteConfirm.userId, deleteConfirm.userName)}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingModeConfig;
