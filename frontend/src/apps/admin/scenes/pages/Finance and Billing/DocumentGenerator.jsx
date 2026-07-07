import React, { useState } from "react";
import {
  Box, Typography, Button, TextField, MenuItem, Alert,
  Snackbar, CircularProgress, Card, CardContent,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import DescriptionIcon from "@mui/icons-material/Description";
import adminApi from "../../../utils/api";

const DOC_TYPES = [
  { value: "invoice_pdf", label: "Invoice PDF" },
  { value: "connection_letter", label: "Connection Letter" },
  { value: "statement", label: "Account Statement" },
  { value: "connection_certificate", label: "Connection Certificate" },
  { value: "receipt", label: "Payment Receipt" },
];

const DocumentGenerator = () => {
  const colors = tokens(useTheme().palette.mode);
  const [form, setForm] = useState({ user_id: "", document_type: "invoice_pdf", reference_id: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const sx = {
    "& .MuiInputBase-input": { color: colors.grey[100] },
    "& .MuiInputLabel-root": { color: colors.grey[300] },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.greenAccent[400] },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colors.greenAccent[400] },
  };

  const handleGenerate = async () => {
    if (!form.user_id) {
      setSnackbar({ open: true, message: "Please enter a client ID", severity: "error" });
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await adminApi.post("/admin/documents/generate", {
        user_id: form.user_id,
        document_type: form.document_type,
        reference_id: form.reference_id || undefined,
      });
      setResult(res.data?.document || res.data);
      setSnackbar({ open: true, message: "Document generated successfully", severity: "success" });
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">Document Generator</Typography>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">Generate official documents for clients</Typography>

      <Box sx={{ backgroundColor: colors.primary[400], p: 3, borderRadius: 2, maxWidth: 600, mb: 3 }}>
        <TextField fullWidth margin="dense" label="Client ID" value={form.user_id}
          onChange={e => setForm({ ...form, user_id: e.target.value })}
          helperText="Enter the client's user ID"
          FormHelperTextProps={{ sx: { color: colors.grey[400] } }}
          sx={sx} />

        <TextField fullWidth margin="dense" select label="Document Type" value={form.document_type}
          onChange={e => setForm({ ...form, document_type: e.target.value })} sx={sx}>
          {DOC_TYPES.map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
        </TextField>

        <TextField fullWidth margin="dense" label="Reference ID (optional)"
          value={form.reference_id}
          onChange={e => setForm({ ...form, reference_id: e.target.value })}
          helperText="Invoice ID, payment ID, etc."
          FormHelperTextProps={{ sx: { color: colors.grey[400] } }}
          sx={sx} />

        <Button variant="contained" onClick={handleGenerate} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <DescriptionIcon />}
          sx={{ mt: 2, backgroundColor: colors.greenAccent[600], "&:hover": { backgroundColor: colors.greenAccent[700] } }}>
          {loading ? "Generating..." : "Generate Document"}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {result && (
        <Card sx={{ backgroundColor: colors.primary[400], maxWidth: 600 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <DescriptionIcon sx={{ color: colors.greenAccent[400] }} />
              <Typography variant="h5" color={colors.grey[100]}>Document Generated</Typography>
            </Box>
            {[
              ["Type", result.document_type],
              ["File", result.file_name],
              ["Client ID", result.user_id],
              ["Generated At", result.created_at ? new Date(result.created_at).toLocaleString() : "—"],
            ].map(([label, val]) => (
              <Box key={label} display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color={colors.grey[400]}>{label}</Typography>
                <Typography variant="body2" color={colors.grey[100]}>{val || "—"}</Typography>
              </Box>
            ))}
            {result.content && (
              <Box mt={2} p={2} sx={{ backgroundColor: colors.primary[300], borderRadius: 1 }}>
                <Typography variant="caption" color={colors.grey[300]} sx={{ whiteSpace: "pre-wrap" }}>
                  {result.content}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentGenerator;
