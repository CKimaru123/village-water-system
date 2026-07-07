import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip,
  Divider, List, ListItem, ListItemText, CircularProgress, Alert,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { tokens } from "../../../theme";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentIcon from "@mui/icons-material/Payment";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SpeedIcon from "@mui/icons-material/Speed";
import SensorsIcon from "@mui/icons-material/Sensors";
import PersonIcon from "@mui/icons-material/Person";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CloseIcon from "@mui/icons-material/Close";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import { formatCurrency, formatDate } from '../../../../../utils/formatters';

const CurrentBill = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    api.get("/client/current_bill")
      .then(res => {
        // api.js returns raw JSON body: { success, message, data: { invoice, demo } }
        const payload = res?.data || {};
        setInvoice(payload?.invoice || null);
        setIsDemo(res?.demo === true);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => formatCurrency(n, 'KES');
  const fmtDate = (d) => d ? formatDate(d) : 'N/A';

  const generatePDF = () => {
    if (!invoice) return;
    setGenerating(true);
    const lineItemsHtml = (invoice.line_items || [])
      .map(li => `<tr><td>${li.description}</td><td style="text-align:right">KES ${Number(li.amount || 0).toLocaleString()}</td></tr>`)
      .join("");
    const html = `<!DOCTYPE html><html><head><title>Bill ${invoice.invoice_number}</title>
<style>body{font-family:Arial,sans-serif;margin:30px}h1{color:#1a5276}
table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #ccc;padding:8px}
th{background:#eaf2ff}.total{font-weight:bold}</style></head><body>
<h1>Water Bill — ${invoice.invoice_number}</h1>
<p><strong>Period:</strong> ${invoice.billing_period}</p>
<p><strong>Billing Mode:</strong> ${invoice.billing_mode_label || invoice.billing_mode || "—"}</p>
<p><strong>Reading Source:</strong> ${invoice.reading_source_label || "—"}</p>
<p><strong>Due Date:</strong> ${fmtDate(invoice.due_date)}</p>
${invoice.is_estimated ? "<p style='color:orange'><strong>Estimated bill</strong></p>" : ""}
<h2>Meter Readings</h2>
<table><tr><th>Previous (m³)</th><th>Current (m³)</th><th>Consumption (m³)</th></tr>
<tr><td>${invoice.meter_reading_previous ?? "—"}</td><td>${invoice.meter_reading_current ?? "—"}</td><td>${invoice.consumption_m3 ?? "—"}</td></tr></table>
<h2>Charges</h2>
<table><tr><th>Description</th><th>Amount</th></tr>${lineItemsHtml}
<tr class="total"><td>TOTAL DUE</td><td style="text-align:right">KES ${Number(invoice.total_amount || 0).toLocaleString()}</td></tr></table>
<p style="font-size:0.8em;color:#888">Generated ${new Date().toLocaleString()}</p>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bill_${invoice.invoice_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setGenerating(false);
    setDownloadOpen(false);
  };

  if (loading) return (
    <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress sx={{ color: colors.blueAccent[500] }} />
    </Box>
  );

  if (!invoice) return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="20px">Current Bill</Typography>
      <Alert severity="success" icon={<CheckCircleIcon />}>
        You have no outstanding bills. All payments are up to date.
      </Alert>
      <Button variant="outlined" sx={{ mt: 2, color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
        onClick={() => navigate("../payment-history")}>
        View Payment History
      </Button>
    </Box>
  );

  const isOverdue = invoice.days_overdue > 0;
  const daysUntilDue = invoice.days_until_due ?? 0;

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Current Bill</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />}
          sx={{ borderColor: colors.blueAccent[400], color: colors.blueAccent[400] }}
          onClick={() => setDownloadOpen(true)}>
          Download PDF
        </Button>
      </Box>

      {isDemo && (
        <Alert severity="info" sx={{ mb: 2, backgroundColor: colors.blueAccent[700] }}>
          <strong>Demo Bill</strong> — No invoice has been generated yet. Ask your admin to generate your bill via Invoice Generation. This is sample data showing how your bill will look.
        </Alert>
      )}
      {isOverdue && (
        <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
          This invoice is <strong>{invoice.days_overdue} days overdue</strong>. Please pay immediately to avoid service interruption.
        </Alert>
      )}
      {invoice.is_estimated && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This is an <strong>estimated bill</strong> — no meter reading was available for the end of the billing period.
        </Alert>
      )}
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Left: Summary */}
        <Grid item xs={12} md={5}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ReceiptIcon sx={{ color: colors.blueAccent[400] }} />
                <Typography variant="h4" color={colors.grey[100]}>Invoice Summary</Typography>
              </Box>

              <Typography variant="h6" color={colors.grey[300]} mb={0.5}>Invoice # {invoice.invoice_number}</Typography>
              <Typography variant="h6" color={colors.grey[300]} mb={0.5}>Period: {invoice.billing_period}</Typography>
              <Typography variant="h6" color={colors.grey[300]} mb={1}>Due: {fmtDate(invoice.due_date)}</Typography>

              {!isOverdue && (
                <Chip size="small" sx={{ mb: 1, backgroundColor: daysUntilDue > 7 ? colors.greenAccent[700] : colors.redAccent[600], color: "#fff" }}
                  label={daysUntilDue === 0 ? "Due today" : `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}`} />
              )}

              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <LocalOfferIcon sx={{ fontSize: 15, color: colors.blueAccent[400] }} />
                <Typography variant="body2" color={colors.grey[300]}>{invoice.billing_mode_label || "Usage-Based"}</Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1} mb={2}>
                {invoice.reading_source === "smart_meter"
                  ? <SensorsIcon sx={{ fontSize: 15, color: colors.greenAccent[400] }} />
                  : <PersonIcon sx={{ fontSize: 15, color: colors.blueAccent[400] }} />}
                <Typography variant="body2" color={colors.grey[300]}>{invoice.reading_source_label || "Manual Reading"}</Typography>
              </Box>

              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />

              <Typography variant="h2" color={isOverdue ? colors.redAccent[400] : colors.greenAccent[400]} fontWeight="bold">
                {fmt(invoice.total_amount)}
              </Typography>
              <Chip size="small" sx={{ mt: 1, backgroundColor: isOverdue ? colors.redAccent[500] : colors.blueAccent[500], color: "#fff" }}
                label={isOverdue ? `Overdue ${invoice.days_overdue}d` : invoice.status?.toUpperCase()} />

              <Box mt={3} display="flex" flexDirection="column" gap={1}>
                <Button variant="contained" startIcon={<PaymentIcon />}
                  sx={{ backgroundColor: colors.greenAccent[600], "&:hover": { backgroundColor: colors.greenAccent[700] } }}
                  onClick={() => navigate("../make-payment", { state: { invoice } })}>
                  Pay Now
                </Button>
                <Button variant="outlined" sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
                  onClick={() => navigate("../payment-plans", { state: { invoice } })}>
                  Set Up Payment Plan
                </Button>
                <Button variant="text" sx={{ color: colors.grey[300] }}
                  onClick={() => navigate("../payment-history")}>
                  View Payment History
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Breakdown + Meter Readings */}
        <Grid item xs={12} md={7}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={2}>Bill Breakdown</Typography>
              {invoice.line_items?.length > 0 ? (
                <List dense>
                  {invoice.line_items.map((li, i) => (
                    <ListItem key={i} sx={{ px: 0 }}>
                      <ListItemText
                        primary={li.description}
                        secondary={li.item_type === "water_consumption" && li.quantity
                          ? `${li.quantity} m³ × KES ${li.unit_rate}` : undefined}
                        primaryTypographyProps={{ color: li.item_type === "subsidy" ? colors.greenAccent[400] : colors.grey[100] }}
                        secondaryTypographyProps={{ color: colors.grey[400] }}
                      />
                      <Typography color={li.item_type === "subsidy" ? colors.greenAccent[400] : colors.grey[100]}
                        fontWeight={li.item_type === "subsidy" ? "bold" : "normal"}>
                        {li.amount < 0 ? `−${fmt(Math.abs(li.amount))}` : fmt(li.amount)}
                      </Typography>
                    </ListItem>
                  ))}
                  <Divider sx={{ borderColor: colors.grey[700], my: 1 }} />
                  {invoice.subtotal !== invoice.total_amount && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="Subtotal" primaryTypographyProps={{ color: colors.grey[300] }} />
                      <Typography color={colors.grey[300]}>{fmt(invoice.subtotal)}</Typography>
                    </ListItem>
                  )}
                  {invoice.tax_amount > 0 && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="Tax" primaryTypographyProps={{ color: colors.grey[300] }} />
                      <Typography color={colors.grey[300]}>{fmt(invoice.tax_amount)}</Typography>
                    </ListItem>
                  )}
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="TOTAL DUE" primaryTypographyProps={{ color: colors.grey[100], fontWeight: "bold" }} />
                    <Typography color={colors.greenAccent[400]} fontWeight="bold">{fmt(invoice.total_amount)}</Typography>
                  </ListItem>
                </List>
              ) : (
                <Typography color={colors.grey[400]}>No line items available.</Typography>
              )}

              {invoice.subsidy && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Subsidy: <strong>{invoice.subsidy.subsidy_type === "percentage"
                    ? `${invoice.subsidy.percentage_discount}% discount`
                    : `KES ${Number(invoice.subsidy.amount || 0).toLocaleString()} reduction`}</strong>
                  {" "}— {invoice.subsidy.reason}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Meter Readings */}
          <Card sx={{ backgroundColor: colors.primary[400], mt: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SpeedIcon sx={{ color: colors.blueAccent[400] }} />
                <Typography variant="h5" color={colors.grey[100]}>Meter Readings</Typography>
                {invoice.reading_source === "smart_meter"
                  ? <Chip label="Smart Meter" size="small" icon={<SensorsIcon />}
                      sx={{ backgroundColor: colors.greenAccent[700], color: "#fff", ml: 1 }} />
                  : <Chip label={invoice.field_officer_name ? `Field Officer: ${invoice.field_officer_name}` : "Manual"}
                      size="small" icon={<PersonIcon />}
                      sx={{ backgroundColor: colors.blueAccent[700], color: "#fff", ml: 1 }} />
                }
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="caption" color={colors.grey[400]}>Previous</Typography>
                  <Typography color={colors.grey[100]} fontWeight="bold">
                    {invoice.meter_reading_previous != null ? `${invoice.meter_reading_previous} m³` : "—"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color={colors.grey[400]}>Current</Typography>
                  <Typography color={colors.grey[100]} fontWeight="bold">
                    {invoice.meter_reading_current != null ? `${invoice.meter_reading_current} m³` : "—"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color={colors.grey[400]}>Consumption</Typography>
                  <Typography color={colors.greenAccent[400]} fontWeight="bold">
                    {invoice.consumption_m3 != null ? `${invoice.consumption_m3} m³` : "—"}
                  </Typography>
                </Grid>
              </Grid>
              <Button variant="text" size="small" sx={{ mt: 1, color: colors.blueAccent[400] }}
                onClick={() => navigate("../meter-reading-history")}>
                View full reading history →
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* PDF Download Dialog */}
      <Dialog open={downloadOpen} onClose={() => setDownloadOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <PictureAsPdfIcon sx={{ color: colors.redAccent[400] }} />
              <Typography variant="h5">Download Bill</Typography>
            </Box>
            <IconButton onClick={() => setDownloadOpen(false)} sx={{ color: colors.grey[300] }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography color={colors.grey[300]} mb={1}>Invoice: <strong>{invoice.invoice_number}</strong></Typography>
          <Typography color={colors.grey[300]} mb={1}>Period: <strong>{invoice.billing_period}</strong></Typography>
          <Typography color={colors.grey[300]} mb={1}>Amount due: <strong>{fmt(invoice.total_amount)}</strong></Typography>
          <Typography color={colors.grey[300]} mb={1}>Billing mode: <strong>{invoice.billing_mode_label}</strong></Typography>
          <Typography color={colors.grey[300]}>Reading source: <strong>{invoice.reading_source_label}</strong></Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDownloadOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={generating} startIcon={<DownloadIcon />} onClick={generatePDF}
            sx={{ backgroundColor: colors.redAccent[500], "&:hover": { backgroundColor: colors.redAccent[600] } }}>
            {generating ? "Generating..." : "Download"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CurrentBill;
