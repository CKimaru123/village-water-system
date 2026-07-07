import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  Alert, CircularProgress, Autocomplete, Chip, Divider,
  Table, TableHead, TableRow, TableCell, TableBody,
} from "@mui/material";
import { tokens } from "../../../theme";
import SpeedIcon from "@mui/icons-material/Speed";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import adminApi from "../../../utils/api";

const MeterReadingEntry = () => {
  const colors = tokens("dark");

  const [clients, setClients]               = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [connection, setConnection]         = useState(null);
  const [prevReading, setPrevReading]       = useState(null);
  const [recentReadings, setRecentReadings] = useState([]);
  const [loadingClient, setLoadingClient]   = useState(false);

  const [form, setForm] = useState({
    reading_value: "",
    reading_date:  new Date().toISOString().split("T")[0],
    reading_type:  "manual",
    notes: ""
  });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError]     = useState(null);

  // Load all users (clients + admins with connections) for autocomplete
  useEffect(() => {
    adminApi.get("/admin/clients?per_page=200&include_all=true")
      .then(res => setClients(res.data?.clients || res.data?.data?.clients || []))
      .catch(() => {});
  }, []);

  // When client selected, load their connection and last reading
  useEffect(() => {
    if (!selectedClient) {
      setConnection(null); setPrevReading(null); setRecentReadings([]);
      return;
    }
    setLoadingClient(true);

    // Get connection details
    adminApi.get(`/admin/clients/${selectedClient.id}`)
      .then(res => {
        const conn = res.data?.connection || res.data?.data?.connection;
        setConnection(conn || null);
        if (conn?.id) {
          return adminApi.get(`/meter_readings?connection_id=${conn.id}&per_page=5`);
        }
      })
      .then(res => {
        if (res) {
          const readings = res.data?.meter_readings || [];
          setRecentReadings(readings);
          setPrevReading(readings[0] || null);
          // Pre-fill reading value slightly above previous
          if (readings[0]) {
            setForm(f => ({ ...f, reading_value: "" }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingClient(false));
  }, [selectedClient]);

  const handleSubmit = async () => {
    if (!selectedClient) { setError("Please select a client."); return; }
    if (!form.reading_value) { setError("Reading value is required."); return; }
    if (!connection) { setError("This client has no connection. Create a connection first."); return; }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await adminApi.post("/meter_readings", {
        meter_reading: {
          connection_id: connection.id,
          reading_value: parseFloat(form.reading_value),
          reading_date:  form.reading_date,
          reading_type:  form.reading_type,
          notes:         form.notes,
        }
      });
      setSuccess(`Reading of ${form.reading_value} m³ recorded for ${selectedClient.display_name}.`);
      setForm(f => ({ ...f, reading_value: "", notes: "" }));

      // Refresh recent readings
      const res = await adminApi.get(`/meter_readings?connection_id=${connection.id}&per_page=5`);
      const readings = res.data?.meter_readings || [];
      setRecentReadings(readings);
      setPrevReading(readings[0] || null);
    } catch (err) {
      const msgs = err.response?.data?.errors || [err.response?.data?.message || err.message];
      setError(msgs.join(", "));
    } finally {
      setSaving(false);
    }
  };

  // Quick-add two readings (opening + closing) so invoice generation works immediately
  const handleQuickSeed = async () => {
    if (!selectedClient || !connection) {
      setError("Select a client with a connection first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const base = prevReading?.reading_value || 1200.0;
      const today = new Date().toISOString().split("T")[0];
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Opening reading (last month)
      await adminApi.post("/meter_readings", {
        meter_reading: {
          connection_id: connection.id,
          reading_value: base,
          reading_date:  lastMonth,
          reading_type:  "automatic",
          notes:         "Opening reading (quick seed)"
        }
      }).catch(() => {}); // ignore duplicate errors

      // Closing reading (today)
      await adminApi.post("/meter_readings", {
        meter_reading: {
          connection_id: connection.id,
          reading_value: parseFloat((base + 13.5).toFixed(2)),
          reading_date:  today,
          reading_type:  "automatic",
          notes:         "Closing reading (quick seed)"
        }
      }).catch(() => {});

      setSuccess(`Quick readings added for ${selectedClient.display_name}. You can now generate an invoice.`);

      const res = await adminApi.get(`/meter_readings?connection_id=${connection.id}&per_page=5`);
      const readings = res.data?.meter_readings || [];
      setRecentReadings(readings);
      setPrevReading(readings[0] || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const fieldSx = {
    mb: 2,
    "& label": { color: colors.grey[400] },
    "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } },
  };

  return (
    <Box m="20px">
      <Box display="flex" alignItems="center" gap={1} mb="20px">
        <SpeedIcon sx={{ color: colors.blueAccent[400], fontSize: 32 }} />
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Meter Reading Entry</Typography>
      </Box>

      {success && <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      {error   && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Entry Form */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={3}>Record Meter Reading</Typography>

              {/* Client Search */}
              <Autocomplete
                options={clients}
                getOptionLabel={c => `${c.display_name || ""} — ${c.email || c.phone || c.id}`}
                onChange={(_, val) => setSelectedClient(val)}
                renderInput={params => <TextField {...params} label="Search Client / Account" sx={fieldSx} />}
                sx={{ mb: 2 }}
              />

              {loadingClient && <CircularProgress size={20} sx={{ mb: 2, color: colors.blueAccent[400] }} />}

              {selectedClient && !connection && !loadingClient && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This client has no connection registered. A connection must be created before readings can be entered.
                </Alert>
              )}

              {/* Previous reading context */}
              {prevReading && (
                <Alert severity="info" sx={{ mb: 2, backgroundColor: colors.blueAccent[700] }}>
                  Previous reading: <strong>{prevReading.reading_value} m³</strong> on {prevReading.reading_date}
                  {" "}({prevReading.reading_type === "automatic" ? "Smart Meter" : "Manual"})
                </Alert>
              )}

              {connection && recentReadings.length === 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  No readings yet for this client.{" "}
                  <Button size="small" variant="outlined" startIcon={<AddIcon />}
                    sx={{ ml: 1, color: colors.greenAccent[400], borderColor: colors.greenAccent[400] }}
                    onClick={handleQuickSeed} disabled={saving}>
                    Quick Add Test Readings
                  </Button>
                </Alert>
              )}

              <TextField
                fullWidth
                label="Reading Value (m³)"
                type="number"
                value={form.reading_value}
                onChange={e => setForm(f => ({ ...f, reading_value: e.target.value }))}
                inputProps={{ min: prevReading?.reading_value || 0, step: "0.01" }}
                helperText={prevReading ? `Must be ≥ ${prevReading.reading_value} m³` : "Enter the meter reading in cubic metres"}
                sx={fieldSx}
              />

              <TextField
                fullWidth select
                label="Reading Type"
                value={form.reading_type}
                onChange={e => setForm(f => ({ ...f, reading_type: e.target.value }))}
                sx={fieldSx}
                SelectProps={{ native: true }}
                InputProps={{ sx: { color: colors.grey[100] } }}
              >
                <option value="manual">Manual (Field Officer)</option>
                <option value="automatic">Automatic (Smart Meter)</option>
              </TextField>

              <TextField
                fullWidth
                label="Reading Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.reading_date}
                onChange={e => setForm(f => ({ ...f, reading_date: e.target.value }))}
                sx={fieldSx}
              />

              <TextField
                fullWidth
                label="Notes (optional)"
                multiline rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                sx={fieldSx}
              />

              <Button
                variant="contained" fullWidth
                disabled={saving || !selectedClient || !connection}
                onClick={handleSubmit}
                sx={{ mt: 1, backgroundColor: colors.greenAccent[600], "&:hover": { backgroundColor: colors.greenAccent[700] } }}
              >
                {saving ? "Saving..." : "Record Reading"}
              </Button>

              {connection && recentReadings.length > 0 && (
                <Button
                  variant="outlined" fullWidth size="small"
                  disabled={saving}
                  onClick={handleQuickSeed}
                  sx={{ mt: 1, color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
                >
                  Quick Add Test Readings (for invoice generation)
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Readings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={2}>Recent Readings</Typography>
              {selectedClient ? (
                recentReadings.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {["Date", "Value (m³)", "Consumption", "Source"].map(h => (
                          <TableCell key={h} sx={{ color: colors.grey[300] }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentReadings.map(r => (
                        <TableRow key={r.id}>
                          <TableCell sx={{ color: colors.grey[100] }}>{r.reading_date}</TableCell>
                          <TableCell sx={{ color: colors.grey[100] }}>{r.reading_value}</TableCell>
                          <TableCell sx={{ color: colors.greenAccent[400] }}>{r.consumption?.toFixed(2) || "—"}</TableCell>
                          <TableCell>
                            <Chip
                              label={r.reading_type === "automatic" ? "Smart" : "Manual"}
                              size="small"
                              sx={{
                                backgroundColor: r.reading_type === "automatic" ? colors.blueAccent[600] : colors.greenAccent[700],
                                color: "#fff",
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography color={colors.grey[400]}>No readings found for this client.</Typography>
                )
              ) : (
                <Typography color={colors.grey[400]}>Select a client to view their reading history.</Typography>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card sx={{ backgroundColor: colors.primary[400], mt: 2 }}>
            <CardContent>
              <Typography variant="h5" color={colors.grey[100]} mb={1}>How to Bill a Client</Typography>
              <Typography variant="body2" color={colors.grey[400]} mb={0.5}>1. Select the client above</Typography>
              <Typography variant="body2" color={colors.grey[400]} mb={0.5}>2. Add meter readings (or use Quick Add)</Typography>
              <Typography variant="body2" color={colors.grey[400]} mb={0.5}>3. Go to <strong style={{color: colors.blueAccent[400]}}>Invoice Generation</strong></Typography>
              <Typography variant="body2" color={colors.grey[400]} mb={0.5}>4. Search the client and click Generate Invoice</Typography>
              <Typography variant="body2" color={colors.grey[400]}>5. Client receives a notification and sees the bill</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MeterReadingEntry;
