import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Grid, TextField,
} from "@mui/material";
import { tokens } from "../../../theme";
import LinkIcon from "@mui/icons-material/Link";
import adminApi from "../../../utils/api";

const Reconciliation = () => {
  const colors = tokens("dark");
  const [unmatched, setUnmatched] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matchForm, setMatchForm] = useState({ payment_id: "", invoice_id: "" });
  const [matching, setMatching] = useState(false);

  const load = () => {
    Promise.all([
      adminApi.get("/admin/reconciliation/unmatched"),
      adminApi.get("/admin/reconciliation/summary"),
    ]).then(([u, s]) => {
      const raw = u.data?.data?.unmatched_payments ?? u.data?.data?.payments ?? u.data?.payments ?? u.data?.unmatched_payments;
      setUnmatched(Array.isArray(raw) ? raw : []);
      setSummary(s.data?.data || s.data);
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleMatch = async () => {
    setMatching(true);
    try {
      await adminApi.post("/admin/reconciliation/match", matchForm);
      setMatchForm({ payment_id: "", invoice_id: "" });
      load();
    } catch (err) { setError(err.message); }
    finally { setMatching(false); }
  };

  const fieldSx = { "& label": { color: colors.grey[400] },
    "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } } };

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="20px">Reconciliation</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {summary && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: "Total Payments", value: `KES ${Number(summary.total_payments || 0).toLocaleString()}` },
            { label: "Matched", value: summary.matched_count || 0 },
            { label: "Unmatched", value: summary.unmatched_count || 0 },
            { label: "Variance", value: `KES ${Number(summary.variance || 0).toLocaleString()}` },
          ].map(s => (
            <Grid item xs={6} md={3} key={s.label}>
              <Card sx={{ backgroundColor: colors.primary[400] }}>
                <CardContent>
                  <Typography variant="caption" color={colors.grey[400]}>{s.label}</Typography>
                  <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">{s.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Manual match */}
      <Card sx={{ backgroundColor: colors.primary[400], mb: 3 }}>
        <CardContent>
          <Typography variant="h5" color={colors.grey[100]} mb={2}>Manual Match</Typography>
          <Box display="flex" gap={2} alignItems="center">
            <TextField size="small" label="Payment ID" value={matchForm.payment_id}
              onChange={e => setMatchForm(f => ({ ...f, payment_id: e.target.value }))} sx={fieldSx} />
            <TextField size="small" label="Invoice ID" value={matchForm.invoice_id}
              onChange={e => setMatchForm(f => ({ ...f, invoice_id: e.target.value }))} sx={fieldSx} />
            <Button variant="contained" startIcon={<LinkIcon />} disabled={matching}
              onClick={handleMatch} sx={{ backgroundColor: colors.blueAccent[600] }}>
              {matching ? "Matching..." : "Match"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {loading ? <CircularProgress sx={{ color: colors.blueAccent[500] }} /> : (
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent>
            <Typography variant="h5" color={colors.grey[100]} mb={2}>Unmatched Payments</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Payment ID", "Amount", "Method", "Date", "Reference"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[300] }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {unmatched.map(p => (
                  <TableRow key={p.id}>
                    <TableCell sx={{ color: colors.grey[100] }}>{p.id}</TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>KES {Number(p.amount || 0).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: colors.grey[300] }}>{p.payment_method}</TableCell>
                    <TableCell sx={{ color: colors.grey[400] }}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell sx={{ color: colors.grey[400] }}>{p.transaction_reference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {unmatched.length === 0 && (
              <Typography color={colors.greenAccent[400]} mt={2} textAlign="center">All payments matched.</Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Reconciliation;
