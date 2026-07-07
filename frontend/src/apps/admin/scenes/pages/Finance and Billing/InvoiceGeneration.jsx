import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Autocomplete,
  Divider, FormControl, InputLabel, Select, MenuItem, Collapse,
  FormControlLabel, Switch, InputAdornment,
} from "@mui/material";
import { tokens } from "../../../theme";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SendIcon from "@mui/icons-material/Send";
import InfoIcon from "@mui/icons-material/Info";
import SettingsIcon from "@mui/icons-material/Settings";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { useNavigate } from "react-router-dom";
import adminApi from "../../../utils/api";

const statusColor = (s, colors) => {
  if (s === "paid") return colors.greenAccent[400];
  if (s === "overdue") return colors.redAccent[400];
  if (s === "sent") return colors.blueAccent[400];
  return colors.grey[400];
};

const modeLabel = (mode) => {
  if (mode === "fixed")       return "Fixed Rate";
  if (mode === "usage_based") return "Usage-Based";
  if (mode === "combined")    return "Combined";
  return mode || "Usage-Based";
};

const BILLING_MODES = [
  { value: "usage_based", label: "Usage-Based",              desc: "Charged per mÂ³ consumed" },
  { value: "fixed",       label: "Fixed Rate",               desc: "Flat charge regardless of consumption" },
  { value: "combined",    label: "Combined (Fixed + Usage)",  desc: "Fixed base + usage top-up" },
];

const InvoiceGeneration = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients]   = useState([]);
  const [tariffs, setTariffs]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [genOpen, setGenOpen]   = useState(false);

  const [selectedClient, setSelectedClient]     = useState(null);
  const [clientBillingConfig, setClientConfig]  = useState(null);  // resolved config object
  const [configLoading, setConfigLoading]       = useState(false);

  // override controls
  const [overrideMode, setOverrideMode]               = useState(false);  // boolean toggle
  const [overrideBillingMode, setOverrideBillingMode] = useState("");
  const [overrideFixed, setOverrideFixed]             = useState("");
  const [overrideTariff, setOverrideTariff]           = useState("");

  const [form, setForm] = useState({ billing_period_start: "", billing_period_end: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    adminApi.get("/invoices/admin_all")
      .then(res => setInvoices(res.data?.data?.invoices || res.data?.invoices || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    adminApi.get("/admin/clients?per_page=100").then(res => {
      setClients(res.data?.clients || res.data?.data?.clients || []);
    }).catch(() => {});
    adminApi.get("/admin/tariffs?active=true").then(res => {
      setTariffs(res.data?.data?.tariffs || res.data?.tariffs || []);
    }).catch(() => {});
  }, []);

  // When client selected, fetch their resolved billing config (per-client or global fallback)
  useEffect(() => {
    if (!selectedClient) { setClientConfig(null); setOverrideMode(false); return; }
    setConfigLoading(true);
    // Try per-client config first, fall back to global
    adminApi.get(`/admin/billing_configs/${selectedClient.id}`)
      .then(res => {
        const cfg = res.data?.billing_config || res.data?.data?.billing_config;
        if (cfg) {
          setClientConfig({ ...cfg, source: "per_client" });
        } else {
          throw new Error("no per-client config");
        }
      })
      .catch(() =>
        adminApi.get("/admin/billing_configs/global")
          .then(res => {
            const cfg = res.data?.billing_config || res.data?.data?.billing_config;
            setClientConfig(cfg ? { ...cfg, source: "global_default" } : null);
          })
          .catch(() => setClientConfig(null))
      )
      .finally(() => setConfigLoading(false));
  }, [selectedClient]);

  const handleGenerate = async () => {
    if (!selectedClient) { setError("Please select a client."); return; }
    setSaving(true);
    try {
      const payload = {
        user_id: selectedClient.id,
        billing_period_start: form.billing_period_start || undefined,
        billing_period_end:   form.billing_period_end   || undefined,
      };
      // Include billing mode override if admin toggled it on
      if (overrideMode && overrideBillingMode) {
        payload.billing_mode = overrideBillingMode;
        if (overrideFixed)   payload.fixed_amount = parseFloat(overrideFixed);
        if (overrideTariff)  payload.tariff_id    = overrideTariff;
      }
      await adminApi.post("/invoices/generate", payload);
      setGenOpen(false);
      setSelectedClient(null);
      setOverrideMode(false);
      setOverrideBillingMode("");
      setOverrideFixed("");
      setOverrideTariff("");
      setForm({ billing_period_start: "", billing_period_end: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setSaving(false); }
  };

  const handleSend = async (id) => {
    try { await adminApi.patch(`/invoices/${id}/send_invoice`); load(); }
    catch (err) { setError(err.message); }
  };

  const fieldSx = {
    mb: 2,
    "& label": { color: colors.grey[400] },
    "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } },
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Invoice Generation</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" sx={{ color: colors.grey[400], borderColor: colors.grey[600] }}
            onClick={() => navigate("../client-lookup")}>Select Client</Button>
          <Button variant="outlined" sx={{ color: colors.redAccent[400], borderColor: colors.redAccent[400] }}
            onClick={() => navigate("../dunning")}>View Overdue</Button>
          <Button variant="contained" startIcon={<ReceiptIcon />}
            sx={{ backgroundColor: colors.blueAccent[600] }} onClick={() => setGenOpen(true)}>
            Generate Invoice
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? <CircularProgress sx={{ color: colors.blueAccent[500] }} /> : (
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Invoice #", "Client", "Period", "Mode", "Amount", "Due Date", "Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[300] }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell sx={{ color: colors.grey[100] }}>{inv.invoice_number}</TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>{inv.user?.name || inv.user_name || inv.user_id}</TableCell>
                    <TableCell sx={{ color: colors.grey[300] }}>{inv.billing_period}</TableCell>
                    <TableCell>
                      <Chip label={modeLabel(inv.billing_mode)} size="small"
                        sx={{ backgroundColor: colors.primary[500], color: colors.grey[200] }} />
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>KES {Number(inv.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: colors.grey[300] }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "â€”"}</TableCell>
                    <TableCell>
                      <Chip label={inv.status?.toUpperCase()} size="small"
                        sx={{ backgroundColor: statusColor(inv.status, colors), color: "#fff" }} />
                    </TableCell>
                    <TableCell>
                      {inv.status === "draft" && (
                        <Button size="small" startIcon={<SendIcon />}
                          onClick={() => handleSend(inv.id)}
                          sx={{ color: colors.blueAccent[400] }}>Send</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={genOpen} onClose={() => setGenOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Generate Invoice</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={clients}
            getOptionLabel={c => `${c.display_name || c.name || ""} (${c.account_number || c.id})`}
            onChange={(_, val) => { setSelectedClient(val); setOverrideMode(false); setOverrideBillingMode(""); }}
            renderInput={params => <TextField {...params} label="Search Client" sx={fieldSx} />}
            sx={{ mb: 1 }}
          />

          {/* Resolved billing config for this client */}
          {configLoading && <CircularProgress size={18} sx={{ mb: 1 }} />}

          {selectedClient && clientBillingConfig && !configLoading && (
            <Card sx={{ backgroundColor: colors.primary[500], mb: 2, border: `1px solid ${colors.blueAccent[700]}` }}>
              <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <SettingsIcon sx={{ fontSize: 16, color: colors.blueAccent[400] }} />
                  <Typography variant="body2" color={colors.grey[200]} fontWeight={600}>
                    Billing Configuration
                  </Typography>
                  <Chip size="small"
                    label={clientBillingConfig.source === "per_client" ? "Per-Client Override" : "Global Default"}
                    sx={{
                      fontSize: "0.62rem", height: 18,
                      backgroundColor: clientBillingConfig.source === "per_client"
                        ? colors.greenAccent[700] : colors.grey[700],
                      color: "#fff",
                    }} />
                </Box>
                <Box display="flex" gap={3} flexWrap="wrap">
                  <Box>
                    <Typography variant="caption" color={colors.grey[400]}>Mode</Typography>
                    <Typography variant="body2" color={colors.grey[100]} fontWeight={600}>
                      {modeLabel(clientBillingConfig.billing_mode)}
                    </Typography>
                  </Box>
                  {clientBillingConfig.fixed_amount && (
                    <Box>
                      <Typography variant="caption" color={colors.grey[400]}>Fixed Amount</Typography>
                      <Typography variant="body2" color={colors.grey[100]} fontWeight={600}>
                        KES {Number(clientBillingConfig.fixed_amount).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                  {clientBillingConfig.tariff_name && (
                    <Box>
                      <Typography variant="caption" color={colors.grey[400]}>Tariff</Typography>
                      <Typography variant="body2" color={colors.grey[100]} fontWeight={600}>
                        {clientBillingConfig.tariff_name}
                      </Typography>
                    </Box>
                  )}
                  {clientBillingConfig.effective_from && (
                    <Box>
                      <Typography variant="caption" color={colors.grey[400]}>Effective From</Typography>
                      <Typography variant="body2" color={colors.grey[100]}>
                        {new Date(clientBillingConfig.effective_from).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {selectedClient && !clientBillingConfig && !configLoading && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No billing config found. Invoice will use system defaults.
            </Alert>
          )}

          {/* Override toggle */}
          {selectedClient && (
            <Box mb={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={overrideMode}
                    onChange={e => {
                      setOverrideMode(e.target.checked);
                      if (e.target.checked) setOverrideBillingMode(clientBillingConfig?.billing_mode || "usage_based");
                    }}
                    sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: colors.blueAccent[400] } }}
                  />
                }
                label={
                  <Typography variant="body2" color={colors.grey[300]}>
                    Override billing mode for this invoice only
                  </Typography>
                }
              />
            </Box>
          )}

          <Collapse in={overrideMode}>
            <Card sx={{ backgroundColor: colors.primary[500], mb: 2, border: `1px solid ${colors.blueAccent[600]}` }}>
              <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                <Typography variant="caption" color={colors.blueAccent[300]} fontWeight={600} display="block" mb={1}>
                  One-time billing override â€” does not change the saved config
                </Typography>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: colors.grey[400] }}>Billing Mode</InputLabel>
                  <Select
                    value={overrideBillingMode}
                    label="Billing Mode"
                    onChange={e => setOverrideBillingMode(e.target.value)}
                    sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
                  >
                    {BILLING_MODES.map(m => (
                      <MenuItem key={m.value} value={m.value}>
                        <Box>
                          <Typography variant="body2">{m.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{m.desc}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {(overrideBillingMode === "fixed" || overrideBillingMode === "combined") && (
                  <TextField
                    fullWidth size="small" label="Fixed Amount (KES)" type="number"
                    value={overrideFixed}
                    onChange={e => setOverrideFixed(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">KES</InputAdornment> }}
                    sx={{ ...fieldSx, mb: 2 }}
                  />
                )}

                {(overrideBillingMode === "usage_based" || overrideBillingMode === "combined") && (
                  <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel sx={{ color: colors.grey[400] }}>Tariff Rate (optional)</InputLabel>
                    <Select
                      value={overrideTariff}
                      label="Tariff Rate (optional)"
                      onChange={e => setOverrideTariff(e.target.value)}
                      sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
                    >
                      <MenuItem value=""><em>Use default tariff</em></MenuItem>
                      {tariffs.map(t => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.rate_name} â€” KES {t.rate_per_unit}/mÂ³
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </CardContent>
            </Card>
          </Collapse>

          <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />

          <TextField fullWidth label="Period Start (optional)" type="date" InputLabelProps={{ shrink: true }}
            value={form.billing_period_start}
            onChange={e => setForm(f => ({ ...f, billing_period_start: e.target.value }))} sx={fieldSx} />
          <TextField fullWidth label="Period End (optional)" type="date" InputLabelProps={{ shrink: true }}
            value={form.billing_period_end}
            onChange={e => setForm(f => ({ ...f, billing_period_end: e.target.value }))} sx={fieldSx} />

          <Alert severity="info" sx={{ backgroundColor: colors.primary[500] }}>
            Leave period dates blank to use the two most recent meter readings automatically.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving || !selectedClient} onClick={handleGenerate}
            sx={{ backgroundColor: colors.blueAccent[600] }}>
            {saving ? "Generating..." : "Generate"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceGeneration;

