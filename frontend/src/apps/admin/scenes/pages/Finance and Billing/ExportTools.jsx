import React, { useState } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button,
  FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress,
} from "@mui/material";
import { tokens } from "../../../theme";
import DownloadIcon from "@mui/icons-material/Download";

const BASE_URL = "http://localhost:3001/api/v1";

const EXPORT_TYPES = [
  { value: "clients", label: "Client Data" },
  { value: "invoices", label: "Invoices" },
  { value: "payments", label: "Payments" },
  { value: "financial_summary", label: "Financial Summary" },
];

const ExportTools = () => {
  const colors = tokens("dark");
  const [type, setType] = useState("invoices");
  const [format, setFormat] = useState("csv");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleExport = async () => {
    setLoading(true); setError(null); setSuccess(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/admin/export?type=${type}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${type}_export.${format}`; a.click();
      window.URL.revokeObjectURL(url);
      setSuccess(`${type} exported successfully.`);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const selectSx = { color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } };

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="20px">Export Tools</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h5" color={colors.grey[100]} mb={3}>Export Options</Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: colors.grey[400] }}>Data Type</InputLabel>
                <Select value={type} onChange={e => setType(e.target.value)} label="Data Type" sx={selectSx}>
                  {EXPORT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: colors.grey[400] }}>Format</InputLabel>
                <Select value={format} onChange={e => setFormat(e.target.value)} label="Format" sx={selectSx}>
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" fullWidth disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
                onClick={handleExport}
                sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[700] } }}>
                {loading ? "Exporting..." : "Export Now"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Grid container spacing={2}>
            {EXPORT_TYPES.map(t => (
              <Grid item xs={12} sm={6} key={t.value}>
                <Card sx={{ backgroundColor: colors.primary[400], cursor: "pointer",
                  border: type === t.value ? `1px solid ${colors.blueAccent[500]}` : "none" }}
                  onClick={() => setType(t.value)}>
                  <CardContent>
                    <Typography variant="h6" color={colors.grey[100]}>{t.label}</Typography>
                    <Typography variant="caption" color={colors.grey[400]}>Click to select</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExportTools;
