import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  RadioGroup, FormControlLabel, Radio, FormLabel, FormControl,
  InputAdornment,
} from "@mui/material";
import { tokens } from "../../../theme";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import adminApi from "../../../utils/api";

const EMPTY = { user_id: "", subsidy_type: "fixed_amount", amount: "", percentage_discount: "", reason: "", invoice_id: "" };

const SubsidyWaiverPrograms = () => {
  const colors = tokens("dark");
  const [subsidies, setSubsidies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState({});

  const load = () => {
    adminApi.get("/admin/subsidies")
      .then(res => setSubsidies(res.data?.data?.subsidies || res.data?.subsidies || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    setFormError(null);
    if (!form.reason || form.reason.trim().length < 5) {
      setFormError("Reason is required (minimum 5 characters).");
      return;
    }
    if (form.subsidy_type === "fixed_amount" && (!form.amount || parseFloat(form.amount) <= 0)) {
      setFormError("Amount must be greater than 0 for fixed amount subsidies.");
      return;
    }
    if (form.subsidy_type === "percentage" && (!form.percentage_discount || parseFloat(form.percentage_discount) <= 0 || parseFloat(form.percentage_discount) > 100)) {
      setFormError("Percentage discount must be between 1 and 100.");
      return;
    }

    setSaving(true);
    try {
      await adminApi.post("/admin/subsidies", { subsidy: form });
      setOpen(false); setForm(EMPTY); load();
    } catch (err) {
      const msgs = err.response?.data?.errors || [err.response?.data?.message || err.message];
      setFormError(msgs.join(", "));
    } finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    setProcessing(p => ({ ...p, [id]: true }));
    try { await adminApi.patch(`/admin/subsidies/${id}/approve`); load(); }
    catch (err) { setError(err.message); }
    finally { setProcessing(p => ({ ...p, [id]: false })); }
  };

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));
  const fieldSx = { mb: 2, "& label": { color: colors.grey[400] },
    "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } } };

  const statusColor = (s) => {
    if (s === "approved") return colors.greenAccent[400];
    if (s === "rejected") return colors.redAccent[400];
    return "#f0c040";
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Subsidy & Waiver Programs</Typography>
        <Button variant="contained" startIcon={<AddIcon />}
          sx={{ backgroundColor: colors.blueAccent[600] }} onClick={() => { setForm(EMPTY); setFormError(null); setOpen(true); }}>New Subsidy</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? <CircularProgress sx={{ color: colors.blueAccent[500] }} /> : (
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Client", "Type", "Amount / Discount", "Reason", "Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[300] }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {subsidies.map(s => (
                  <TableRow key={s.id}>
                    <TableCell sx={{ color: colors.grey[100] }}>{s.user?.name || s.user_id}</TableCell>
                    <TableCell>
                      <Chip label={s.subsidy_type === "percentage" ? "%" : "Fixed"} size="small"
                        sx={{ backgroundColor: s.subsidy_type === "percentage" ? colors.blueAccent[600] : colors.greenAccent[700], color: "#fff" }} />
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>
                      {s.subsidy_type === "percentage"
                        ? `${s.percentage_discount}%`
                        : `KES ${Number(s.amount || 0).toLocaleString()}`}
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[300] }}>{s.reason}</TableCell>
                    <TableCell>
                      <Chip label={s.status?.toUpperCase()} size="small"
                        sx={{ backgroundColor: statusColor(s.status), color: "#fff" }} />
                    </TableCell>
                    <TableCell>
                      {s.status === "pending" && (
                        <Button size="small" startIcon={<CheckCircleIcon />}
                          disabled={processing[s.id]}
                          onClick={() => handleApprove(s.id)}
                          sx={{ color: colors.greenAccent[400] }}>Approve</Button>
                      )}
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
        <DialogTitle sx={{ color: colors.grey[100] }}>New Subsidy</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

          <TextField fullWidth label="Client ID" value={form.user_id} onChange={set("user_id")} sx={fieldSx} />

          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel sx={{ color: colors.grey[300], mb: 1 }}>Subsidy Type</FormLabel>
            <RadioGroup row value={form.subsidy_type} onChange={set("subsidy_type")}>
              <FormControlLabel value="fixed_amount" control={<Radio sx={{ color: colors.grey[400] }} />}
                label={<Typography color={colors.grey[100]}>Fixed Amount</Typography>} />
              <FormControlLabel value="percentage" control={<Radio sx={{ color: colors.grey[400] }} />}
                label={<Typography color={colors.grey[100]}>Percentage Discount</Typography>} />
            </RadioGroup>
          </FormControl>

          {form.subsidy_type === "fixed_amount" && (
            <TextField fullWidth label="Amount (KES)" type="number" value={form.amount} onChange={set("amount")}
              InputProps={{ startAdornment: <InputAdornment position="start">KES</InputAdornment> }}
              inputProps={{ min: 0, step: "0.01" }} sx={fieldSx} />
          )}

          {form.subsidy_type === "percentage" && (
            <TextField fullWidth label="Percentage Discount (%)" type="number" value={form.percentage_discount}
              onChange={set("percentage_discount")}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              inputProps={{ min: 1, max: 100, step: "0.01" }} sx={fieldSx} />
          )}

          <TextField fullWidth label="Invoice ID (optional)" value={form.invoice_id} onChange={set("invoice_id")} sx={fieldSx} />
          <TextField fullWidth multiline rows={3} label="Reason *" value={form.reason} onChange={set("reason")}
            helperText="Required — e.g. 'Elderly resident', 'Chronic illness', 'Low income household'"
            sx={{ ...fieldSx, "& .MuiFormHelperText-root": { color: colors.grey[400] } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleCreate}
            sx={{ backgroundColor: colors.blueAccent[600] }}>{saving ? "Saving..." : "Create"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubsidyWaiverPrograms;
