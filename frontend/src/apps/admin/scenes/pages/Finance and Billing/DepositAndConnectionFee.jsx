import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
} from "@mui/material";
import { tokens } from "../../../theme";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import adminApi from "../../../utils/api";

const EMPTY = { user_id: "", amount: "", fee_type: "connection", notes: "" };

const DepositAndConnectionFee = () => {
  const colors = tokens("dark");
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState({});

  const load = () => {
    adminApi.get("/admin/deposits")
      .then(res => setDeposits(res.data?.data?.deposits || res.data?.deposits || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    setSaving(true);
    try { await adminApi.post("/admin/deposits", { deposit: form }); setOpen(false); setForm(EMPTY); load(); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleConfirm = async (id) => {
    setProcessing(p => ({ ...p, [id]: true }));
    try { await adminApi.patch(`/admin/deposits/${id}/confirm`); load(); }
    catch (err) { setError(err.message); }
    finally { setProcessing(p => ({ ...p, [id]: false })); }
  };

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));
  const fieldSx = { mb: 2, "& label": { color: colors.grey[400] },
    "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } } };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Deposits & Connection Fees</Typography>
        <Button variant="contained" startIcon={<AddIcon />}
          sx={{ backgroundColor: colors.blueAccent[600] }} onClick={() => setOpen(true)}>Record Fee</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? <CircularProgress sx={{ color: colors.blueAccent[500] }} /> : (
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Client", "Type", "Amount (KES)", "Date", "Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[300] }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {deposits.map(d => (
                  <TableRow key={d.id}>
                    <TableCell sx={{ color: colors.grey[100] }}>{d.user_name || d.user_id}</TableCell>
                    <TableCell sx={{ color: colors.grey[300] }}>{d.fee_type}</TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>KES {Number(d.amount || 0).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: colors.grey[400] }}>{d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Chip label={d.status?.toUpperCase() || "PENDING"} size="small"
                        sx={{ backgroundColor: d.status === "confirmed" ? colors.greenAccent[700] : "#f0c040", color: "#fff" }} />
                    </TableCell>
                    <TableCell>
                      {d.status !== "confirmed" && (
                        <Button size="small" startIcon={<CheckCircleIcon />}
                          disabled={processing[d.id]} onClick={() => handleConfirm(d.id)}
                          sx={{ color: colors.greenAccent[400] }}>Confirm</Button>
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
        <DialogTitle sx={{ color: colors.grey[100] }}>Record Deposit / Connection Fee</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Client ID" value={form.user_id} onChange={set("user_id")} sx={fieldSx} />
          <TextField fullWidth label="Amount (KES)" type="number" value={form.amount} onChange={set("amount")} sx={fieldSx} />
          <TextField fullWidth label="Notes" value={form.notes} onChange={set("notes")} sx={fieldSx} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleCreate}
            sx={{ backgroundColor: colors.blueAccent[600] }}>{saving ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepositAndConnectionFee;
