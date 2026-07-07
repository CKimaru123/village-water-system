import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Divider,
  RadioGroup, FormControlLabel, Radio, FormLabel,
} from "@mui/material";
import { tokens } from "../../../theme";
import SendIcon from "@mui/icons-material/Send";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import PublicIcon from "@mui/icons-material/Public";
import adminApi from "../../../utils/api";

const BulkPaymentPrompt = () => {
  const colors = tokens("dark");

  const [scope,   setScope]   = useState("all");      // "individual" | "group" | "all"
  const [method,  setMethod]  = useState("mpesa");     // "mpesa" | "airtel_money"
  const [userId,  setUserId]  = useState("");
  const [zone,    setZone]    = useState("");
  const [clients, setClients] = useState([]);
  const [zones,   setZones]   = useState([]);

  const [sending,  setSending]  = useState(false);
  const [results,  setResults]  = useState(null);
  const [error,    setError]    = useState(null);
  const [summary,  setSummary]  = useState(null);

  useEffect(() => {
    adminApi.get("/admin/clients?per_page=300&include_all=true")
      .then(res => setClients(res.data?.data?.clients || []))
      .catch(() => {});
    // Fetch distinct zones from connections
    adminApi.get("/connections?per_page=500")
      .then(res => {
        const conns = res.data?.data?.connections || res.data?.connections || [];
        const zoneSet = [...new Set(conns.map(c => c.zone).filter(Boolean))];
        setZones(zoneSet);
      })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    if (scope === "individual" && !userId) return setError("Please select a client.");
    if (scope === "group" && !zone) return setError("Please select a zone.");

    setSending(true);
    setError(null);
    setResults(null);
    setSummary(null);

    try {
      const payload = {
        scope,
        payment_method: method,
        ...(scope === "individual" && { user_id: userId }),
        ...(scope === "group" && { zone }),
      };
      const res = await adminApi.post("/payments/bulk_prompt", payload);
      const data = res.data?.data || {};
      setResults(data.results || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSending(false);
    }
  };

  const scopeIcon = { individual: <PersonIcon />, group: <GroupIcon />, all: <PublicIcon /> };

  return (
    <Box m="20px">
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <SendIcon sx={{ color: colors.blueAccent[400], fontSize: 32 }} />
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Bulk Payment Prompts</Typography>
      </Box>
      <Typography color={colors.grey[400]} mb={3}>
        Send M-Pesa or Airtel Money STK push prompts to clients — they only need to enter their PIN.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Config panel */}
        <Grid item xs={12} md={5}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h5" color={colors.grey[100]} mb={3}>Configure Prompt</Typography>

              {/* Payment method */}
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel sx={{ color: colors.grey[300], mb: 1 }}>Payment Method</FormLabel>
                <RadioGroup row value={method} onChange={e => setMethod(e.target.value)}>
                  <FormControlLabel value="mpesa" control={<Radio sx={{ color: colors.grey[400] }} />}
                    label={<Box display="flex" alignItems="center" gap={0.5}><PhoneAndroidIcon sx={{ fontSize: 18, color: "#4caf50" }} /><Typography color={colors.grey[200]}>M-Pesa</Typography></Box>} />
                  <FormControlLabel value="airtel_money" control={<Radio sx={{ color: colors.grey[400] }} />}
                    label={<Box display="flex" alignItems="center" gap={0.5}><PhoneAndroidIcon sx={{ fontSize: 18, color: "#f44336" }} /><Typography color={colors.grey[200]}>Airtel Money</Typography></Box>} />
                </RadioGroup>
              </FormControl>

              {/* Scope */}
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel sx={{ color: colors.grey[300], mb: 1 }}>Who to Prompt</FormLabel>
                <RadioGroup value={scope} onChange={e => setScope(e.target.value)}>
                  {[
                    { value: "individual", label: "Individual client", icon: <PersonIcon sx={{ fontSize: 18 }} /> },
                    { value: "group",      label: "Clients in a zone", icon: <GroupIcon sx={{ fontSize: 18 }} /> },
                    { value: "all",        label: "All clients with unpaid invoices", icon: <PublicIcon sx={{ fontSize: 18 }} /> },
                  ].map(s => (
                    <FormControlLabel key={s.value} value={s.value}
                      control={<Radio sx={{ color: colors.grey[400] }} />}
                      label={<Box display="flex" alignItems="center" gap={0.5}>{s.icon}<Typography color={colors.grey[200]}>{s.label}</Typography></Box>} />
                  ))}
                </RadioGroup>
              </FormControl>

              {/* Individual — client picker */}
              {scope === "individual" && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: colors.grey[400] }}>Select Client</InputLabel>
                  <Select value={userId} label="Select Client"
                    onChange={e => setUserId(e.target.value)}
                    sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}>
                    {clients.map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.display_name || c.name} — {c.phone || "no phone"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Group — zone picker */}
              {scope === "group" && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: colors.grey[400] }}>Select Zone</InputLabel>
                  <Select value={zone} label="Select Zone" onChange={e => setZone(e.target.value)}
                    sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}>
                    {zones.length > 0
                      ? zones.map(z => <MenuItem key={z} value={z}>{z}</MenuItem>)
                      : <MenuItem value="Zone A">Zone A (example — configure zones in connections)</MenuItem>
                    }
                  </Select>
                </FormControl>
              )}

              <Divider sx={{ borderColor: colors.grey[700], my: 2 }} />

              <Button fullWidth variant="contained" size="large" disabled={sending}
                startIcon={sending ? <CircularProgress size={18} /> : <SendIcon />}
                onClick={handleSend}
                sx={{ backgroundColor: colors.greenAccent[600], "&:hover": { backgroundColor: colors.greenAccent[700] } }}>
                {sending ? "Sending prompts..." : `Send ${method === "mpesa" ? "M-Pesa" : "Airtel Money"} Prompt`}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Results panel */}
        <Grid item xs={12} md={7}>
          {summary && (
            <Grid container spacing={2} mb={2}>
              {[
                { label: "Total Sent", value: summary.total, color: colors.blueAccent[400] },
                { label: "Successful", value: summary.successful, color: colors.greenAccent[400] },
                { label: "Failed",     value: summary.failed,     color: colors.redAccent[400] },
              ].map(s => (
                <Grid item xs={4} key={s.label}>
                  <Card sx={{ backgroundColor: colors.primary[400], textAlign: "center" }}>
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Typography variant="h3" color={s.color} fontWeight="bold">{s.value}</Typography>
                      <Typography variant="caption" color={colors.grey[400]}>{s.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {results && results.length > 0 && (
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} mb={2}>Results</Typography>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {["Client", "Status", "Message"].map(h => (
                          <TableCell key={h} sx={{ color: colors.grey[300], fontWeight: "bold", borderBottom: `1px solid ${colors.grey[700]}` }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ color: colors.grey[100], borderBottom: `1px solid ${colors.grey[800]}` }}>
                            {r.name || `Client ${r.user_id}`}
                          </TableCell>
                          <TableCell sx={{ borderBottom: `1px solid ${colors.grey[800]}` }}>
                            <Chip label={r.success ? "Sent" : "Failed"} size="small"
                              sx={{ backgroundColor: r.success ? colors.greenAccent[700] : colors.redAccent[700], color: "#fff" }} />
                          </TableCell>
                          <TableCell sx={{ color: colors.grey[400], fontSize: "0.78rem", borderBottom: `1px solid ${colors.grey[800]}` }}>
                            {r.message}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </CardContent>
            </Card>
          )}

          {!results && !sending && (
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <SendIcon sx={{ fontSize: 48, color: colors.grey[600], mb: 2 }} />
                <Typography color={colors.grey[500]}>Configure the prompt settings and click Send.</Typography>
                <Typography variant="caption" color={colors.grey[600]}>
                  Only clients with unpaid invoices and registered phone numbers will receive prompts.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default BulkPaymentPrompt;
