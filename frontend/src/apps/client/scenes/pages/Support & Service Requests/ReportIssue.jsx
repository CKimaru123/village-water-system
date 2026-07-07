import React, { useState } from "react";
import {
  Box, Typography, Card, CardContent, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress,
  InputAdornment,
} from "@mui/material";
import { tokens } from "../../../theme";
import BugReportIcon from "@mui/icons-material/BugReport";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SubjectIcon from "@mui/icons-material/Subject";
import CategoryIcon from "@mui/icons-material/Category";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../utils/api";

const CATEGORIES = [
  { label: "Billing Issue",      value: "billing" },
  { label: "Water Quality",      value: "water_quality" },
  { label: "Leak / Pipe Damage", value: "leak" },
  { label: "Meter Problem",      value: "meter" },
  { label: "Service Connection", value: "connection" },
  { label: "General Complaint",  value: "complaint" },
  { label: "Other",              value: "general" },
];

const PRIORITIES = [
  { label: "Low — not urgent",         value: "low",    color: "#4caf50" },
  { label: "Normal — standard request", value: "normal", color: "#2196f3" },
  { label: "High — needs attention",   value: "high",   color: "#ff9800" },
  { label: "Urgent — critical issue",  value: "urgent", color: "#f44336" },
];

// Shared input styling — white label, visible border, white text
const inputSx = (colors) => ({
  "& .MuiInputLabel-root": { color: colors.grey[200], fontSize: "0.95rem" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#90caf9" },
  "& .MuiOutlinedInput-root": {
    color: colors.grey[100],
    fontSize: "1rem",
    "& fieldset": { borderColor: colors.grey[500] },
    "&:hover fieldset": { borderColor: colors.blueAccent[400] },
    "&.Mui-focused fieldset": { borderColor: colors.blueAccent[400], borderWidth: 2 },
  },
  "& .MuiSelect-icon": { color: colors.grey[300] },
});

const ReportIssue = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefill || "";

  const [form, setForm] = useState({ subject: prefill, category: "", description: "", priority: "normal" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.subject.trim()) { setError("Subject is required."); return; }
    if (!form.category) { setError("Please select a category."); return; }
    if (!form.description.trim()) { setError("Description is required."); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/tickets", {
        ticket: {
          subject: form.subject,
          category: form.category,
          description: form.description,
          priority: form.priority,
        },
      });
      setSuccess(`Ticket ${res.data?.ticket?.ticket_number || `#${res.data?.ticket?.id}`} submitted. We'll respond within 24 hours.`);
      setForm({ subject: "", category: "", description: "", priority: "normal" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sx = inputSx(colors);

  return (
    <Box
      m="20px"
      display="flex"
      flexDirection="column"
      alignItems="center"
      minHeight="calc(100vh - 80px)"
    >
      {/* Page heading */}
      <Box width="100%" maxWidth={680} mb={3}>
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="4px">
          Report an Issue
        </Typography>
        <Typography variant="h6" color={colors.grey[400]}>
          Submit a support ticket and we'll get back to you within 24 hours.
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Box width="100%" maxWidth={680} mb={2}>
          <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
        </Box>
      )}
      {success && (
        <Box width="100%" maxWidth={680} mb={2}>
          <Alert severity="success" icon={<CheckCircleIcon />}
            action={
              <Button size="small" onClick={() => navigate("../track-tickets")}
                sx={{ color: colors.greenAccent[400], fontWeight: "bold" }}>
                Track Ticket
              </Button>
            }>
            {success}
          </Alert>
        </Box>
      )}

      {/* Form card */}
      <Card sx={{ backgroundColor: colors.primary[400], width: "100%", maxWidth: 680, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Card header */}
          <Box display="flex" alignItems="center" gap={1.5} mb={4}>
            <Box sx={{ backgroundColor: colors.blueAccent[700], borderRadius: 2, p: 1, display: "flex" }}>
              <BugReportIcon sx={{ color: colors.blueAccent[300], fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h4" color={colors.grey[100]} fontWeight="bold">New Support Ticket</Typography>
              <Typography variant="body2" color={colors.grey[400]}>All fields marked are required</Typography>
            </Box>
          </Box>

          {/* Subject */}
          <TextField
            fullWidth
            label="Subject *"
            placeholder="Brief summary of the issue"
            value={form.subject}
            onChange={set("subject")}
            sx={{ ...sx, mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SubjectIcon sx={{ color: colors.grey[400] }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Category */}
          <FormControl fullWidth sx={{ ...sx, mb: 3 }}>
            <InputLabel>Category *</InputLabel>
            <Select
              value={form.category}
              onChange={set("category")}
              label="Category *"
              startAdornment={
                <InputAdornment position="start">
                  <CategoryIcon sx={{ color: colors.grey[400], ml: 1 }} />
                </InputAdornment>
              }
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: colors.primary[500],
                    "& .MuiMenuItem-root": {
                      color: colors.grey[100],
                      fontSize: "0.95rem",
                      py: 1.2,
                      "&:hover": { backgroundColor: colors.blueAccent[700] },
                      "&.Mui-selected": { backgroundColor: colors.blueAccent[800] },
                    },
                  },
                },
              }}
            >
              {CATEGORIES.map(c => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Priority */}
          <FormControl fullWidth sx={{ ...sx, mb: 3 }}>
            <InputLabel>Priority *</InputLabel>
            <Select
              value={form.priority}
              onChange={set("priority")}
              label="Priority *"
              startAdornment={
                <InputAdornment position="start">
                  <PriorityHighIcon sx={{ color: colors.grey[400], ml: 1 }} />
                </InputAdornment>
              }
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: colors.primary[500],
                    "& .MuiMenuItem-root": {
                      color: colors.grey[100],
                      fontSize: "0.95rem",
                      py: 1.2,
                      "&:hover": { backgroundColor: colors.blueAccent[700] },
                      "&.Mui-selected": { backgroundColor: colors.blueAccent[800] },
                    },
                  },
                },
              }}
            >
              {PRIORITIES.map(p => (
                <MenuItem key={p.value} value={p.value}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: p.color, flexShrink: 0 }} />
                    {p.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Description */}
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Description *"
            placeholder="Please describe the issue in detail — include any relevant dates, meter readings, or reference numbers..."
            value={form.description}
            onChange={set("description")}
            sx={{ ...sx, mb: 4 }}
          />

          {/* Submit */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            onClick={handleSubmit}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <BugReportIcon />}
            sx={{
              backgroundColor: colors.blueAccent[600],
              "&:hover": { backgroundColor: colors.blueAccent[500] },
              py: 1.5,
              fontSize: "1rem",
              fontWeight: "bold",
              borderRadius: 2,
            }}
          >
            {loading ? "Submitting..." : "Submit Ticket"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportIssue;
