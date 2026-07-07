import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  MenuItem, CircularProgress, Alert, Chip, LinearProgress, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { tokens } from "../../../theme";
import PaymentIcon from "@mui/icons-material/Payment";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../utils/api";

const STATUS_COLOR = { active: colors => colors.greenAccent[500], pending: colors => colors.blueAccent[500], completed: colors => colors.grey[500], defaulted: colors => colors.redAccent[500] };

const PaymentPlans = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const location = useLocation();
  const passedInvoice = location.state?.invoice || null;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState(passedInvoice?.id || "");
  const [installments, setInstallments] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(passedInvoice);

  const load = () => {
    setLoading(true);
    api.get("/payment_plans")
      .then(res => setPlans(res?.data?.payment_plans || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (!passedInvoice) {
      api.get("/client/current_bill").then(res => {
        const inv = res?.data?.invoice || null;
        if (inv) {
          setCurrentInvoice(inv);
          setInvoiceId(inv.id);
        }
      }).catch(() => {});
    }
  }, []);

  const handleRequest = async () => {
    if (!invoiceId) return setError("No invoice selected.");
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/payment_plans", { invoice_id: invoiceId, installments_count: installments });
      setSuccess("Payment plan requested. Admin will review and approve shortly.");
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => `KES ${Number(n || 0).toLocaleString()}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Payment Plans</Typography>
        <Button variant="contained" startIcon={<AddIcon />}
          sx={{ backgroundColor: colors.greenAccent[600] }}
          onClick={() => setDialogOpen(true)}>
          Request Plan
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>
      ) : plans.length === 0 ? (
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <PaymentIcon sx={{ fontSize: 48, color: colors.grey[500], mb: 2 }} />
            <Typography color={colors.grey[300]} mb={2}>No payment plans yet.</Typography>
            {currentInvoice && (
              <Button variant="contained" sx={{ backgroundColor: colors.blueAccent[500] }}
                onClick={() => setDialogOpen(true)}>
                Request a Plan for {fmt(currentInvoice.total_amount)}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {plans.map(plan => {
            const pct = Math.round((plan.installments_paid / plan.installments_count) * 100);
            return (
              <Grid item xs={12} md={6} key={plan.id}>
                <Card sx={{ backgroundColor: colors.primary[400] }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="h5" color={colors.grey[100]}>
                        {plan.invoice?.invoice_number}
                      </Typography>
                      <Chip label={plan.status} size="small"
                        sx={{ backgroundColor: STATUS_COLOR[plan.status]?.(colors) || colors.grey[500], color: "#fff" }} />
                    </Box>
                    <Typography color={colors.grey[300]} mb={1}>Total: {fmt(plan.total_amount)}</Typography>
                    <Typography color={colors.grey[300]} mb={1}>
                      {plan.installments_paid}/{plan.installments_count} installments × {fmt(plan.installment_amount)}
                    </Typography>
                    <Typography color={colors.grey[300]} mb={2}>
                      Next due: {fmtDate(plan.next_due_date)}
                    </Typography>
                    <LinearProgress variant="determinate" value={pct}
                      sx={{ height: 8, borderRadius: 4, backgroundColor: colors.grey[700],
                        "& .MuiLinearProgress-bar": { backgroundColor: colors.greenAccent[500] } }} />
                    <Typography variant="caption" color={colors.grey[400]} mt={0.5} display="block">
                      {pct}% complete — {fmt(plan.remaining_amount)} remaining
                    </Typography>
                    {plan.status === "active" && (
                      <Button variant="outlined" size="small" sx={{ mt: 2, color: colors.greenAccent[400], borderColor: colors.greenAccent[400] }}
                        onClick={() => navigate("../make-payment", { state: { invoice: plan.invoice } })}>
                        Pay Installment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Request Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Request Payment Plan</DialogTitle>
        <DialogContent>
          {currentInvoice && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Invoice {currentInvoice.invoice_number} — {fmt(currentInvoice.total_amount)}
            </Alert>
          )}
          <TextField fullWidth select label="Number of Installments" value={installments}
            onChange={e => setInstallments(Number(e.target.value))} sx={{ mt: 1 }}
            InputProps={{ sx: { color: colors.grey[100] } }}
            InputLabelProps={{ sx: { color: colors.grey[300] } }}>
            {[2, 3, 4, 6].map(n => (
              <MenuItem key={n} value={n}>
                {n} installments
                {currentInvoice ? ` (${fmt(currentInvoice.total_amount / n)}/month)` : ""}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: colors.grey[300] }}>Cancel</Button>
          <Button variant="contained" disabled={submitting}
            sx={{ backgroundColor: colors.greenAccent[600] }}
            onClick={handleRequest}>
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentPlans;
