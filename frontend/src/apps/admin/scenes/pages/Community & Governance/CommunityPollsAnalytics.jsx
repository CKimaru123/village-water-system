import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton, LinearProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Checkbox,
  ListItemText, OutlinedInput,
} from "@mui/material";
import { tokens } from "../../../theme";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PollIcon from "@mui/icons-material/Poll";
import adminApi from "../../../utils/api";

const CATEGORIES = [
  "Water Supply",
  "Water Quality",
  "Billing & Tariffs",
  "Communication",
  "Infrastructure",
  "Community Governance",
  "Environment",
  "Other",
];

const PRESET_OPTIONS = {
  "Water Supply": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
  "Water Quality": ["Taste / Odour", "Colour / Turbidity", "Pressure Issues", "Contamination Risk", "No Concerns"],
  "Billing & Tariffs": ["Yes, strongly support", "Yes, with conditions", "Neutral", "No, find other funding", "No, oppose"],
  "Communication": ["SMS / Text", "Email", "WhatsApp", "Notice Board", "All of the above"],
  default: ["Yes", "No", "Maybe", "Not Sure"],
};

const EMPTY = { title: "", description: "", status: "active", category: "", closes_at: "" };

const CommunityPollsAnalytics = () => {
  const colors = tokens("dark");
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [customOption, setCustomOption] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.get("/polls")
      .then(res => setPolls(res.data?.data?.polls || res.data?.polls || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setSelectedOptions([]);
    setCustomOption("");
    setOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    const opts = (p.options || []).map(o => o.option_text || o);
    setForm({
      title: p.title || "",
      description: p.description || "",
      status: p.status || "active",
      category: p.category || "",
      closes_at: p.closes_at ? p.closes_at.slice(0, 16) : "",
    });
    setSelectedOptions(opts);
    setCustomOption("");
    setOpen(true);
  };

  // When category changes, pre-fill options with presets if options are empty
  const handleCategoryChange = (cat) => {
    setForm(v => ({ ...v, category: cat }));
    if (selectedOptions.length === 0) {
      setSelectedOptions(PRESET_OPTIONS[cat] || PRESET_OPTIONS.default);
    }
  };

  const handleOptionToggle = (opt) => {
    setSelectedOptions(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  };

  const addCustomOption = () => {
    const trimmed = customOption.trim();
    if (trimmed && !selectedOptions.includes(trimmed)) {
      setSelectedOptions(prev => [...prev, trimmed]);
    }
    setCustomOption("");
  };

  const removeOption = (opt) => setSelectedOptions(prev => prev.filter(o => o !== opt));

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Poll question/title is required."); return; }
    if (selectedOptions.length < 2) { setError("Please add at least 2 options."); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        category: form.category,
        closes_at: form.closes_at || null,
        options: selectedOptions,
      };
      if (editing) {
        await adminApi.patch(`/polls/${editing.id}`, { poll: payload });
      } else {
        await adminApi.post("/polls", { poll: payload });
      }
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this poll?")) return;
    try { await adminApi.delete(`/polls/${id}`); load(); }
    catch (err) { setError(err.message); }
  };

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));
  const fieldSx = { mb: 2, mt: 1 };

  const totalVotes = (poll) => (poll.options || []).reduce((s, o) => s + (o.votes_count || 0), 0);

  const statusColor = (s) => {
    if (s === "active") return "#4caf50";
    if (s === "closed") return "#f44336";
    return "#2196f3";
  };

  const presetOpts = PRESET_OPTIONS[form.category] || PRESET_OPTIONS.default;

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Box display="flex" alignItems="center" gap={1}>
          <PollIcon sx={{ color: colors.blueAccent[400], fontSize: 32 }} />
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">
            Community Polls & Analytics
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}
          sx={{ backgroundColor: colors.blueAccent[600] }} onClick={openCreate}>
          New Poll
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <CircularProgress sx={{ color: colors.blueAccent[500] }} />
      ) : polls.length === 0 ? (
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent>
            <Typography color={colors.grey[400]} textAlign="center" py={4}>
              No polls yet. Create one to get started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box display="flex" flexDirection="column" gap={3}>
          {/* Summary table */}
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h5" color={colors.grey[200]} mb={2}>All Polls</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Question", "Category", "Status", "Votes", "Closes", "Actions"].map(h => (
                      <TableCell key={h} sx={{ color: colors.grey[300] }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {polls.map(poll => (
                    <TableRow key={poll.id}>
                      <TableCell sx={{ color: colors.grey[100], maxWidth: 260 }}>{poll.title}</TableCell>
                      <TableCell sx={{ color: colors.grey[300] }}>{poll.category || "—"}</TableCell>
                      <TableCell>
                        <Chip label={poll.status?.toUpperCase() || "ACTIVE"} size="small"
                          sx={{ backgroundColor: statusColor(poll.status), color: "#fff" }} />
                      </TableCell>
                      <TableCell sx={{ color: colors.grey[300] }}>{totalVotes(poll)}</TableCell>
                      <TableCell sx={{ color: colors.grey[400], fontSize: 12 }}>
                        {poll.closes_at ? new Date(poll.closes_at).toLocaleDateString() : "No expiry"}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => openEdit(poll)} sx={{ color: colors.blueAccent[400] }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(poll.id)} sx={{ color: colors.redAccent[400] }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Results breakdown for polls with votes */}
          {polls.filter(p => totalVotes(p) > 0).map(poll => {
            const total = totalVotes(poll);
            return (
              <Card key={"results-" + poll.id} sx={{ backgroundColor: colors.primary[400] }}>
                <CardContent>
                  <Typography variant="h6" color={colors.grey[100]} mb={0.5}>{poll.title}</Typography>
                  <Typography variant="caption" color={colors.grey[400]} mb={2} display="block">
                    {total} vote{total !== 1 ? "s" : ""} · {poll.category || "General"}
                  </Typography>
                  {(poll.options || []).map(opt => {
                    const pct = total > 0 ? Math.round(((opt.votes_count || 0) / total) * 100) : 0;
                    return (
                      <Box key={opt.id || opt.option_text} mb={1.5}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" color={colors.grey[200]}>{opt.option_text}</Typography>
                          <Typography variant="body2" color={colors.grey[400]}>{opt.votes_count || 0} ({pct}%)</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct}
                          sx={{ height: 8, borderRadius: 4,
                            backgroundColor: colors.primary[300],
                            "& .MuiLinearProgress-bar": { backgroundColor: colors.blueAccent[500] } }} />
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>
          {editing ? "Edit Poll" : "New Poll"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Question */}
          <TextField fullWidth label="Poll Question *" value={form.title}
            onChange={set("title")} sx={fieldSx}
            placeholder="e.g. How satisfied are you with water supply?" />

          {/* Description */}
          <TextField fullWidth label="Description (optional)" value={form.description}
            onChange={set("description")} sx={fieldSx} multiline rows={2} />

          {/* Category dropdown */}
          <FormControl fullWidth sx={fieldSx}>
            <InputLabel>Category</InputLabel>
            <Select value={form.category} onChange={e => handleCategoryChange(e.target.value)} label="Category">
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>

          {/* Options — checkboxes from presets + custom */}
          <Typography variant="body2" color={colors.grey[300]} mb={1}>
            Poll Options * (select from presets or add custom)
          </Typography>
          <Card variant="outlined" sx={{ backgroundColor: colors.primary[300], mb: 2, p: 1 }}>
            {presetOpts.map(opt => (
              <Box key={opt} display="flex" alignItems="center">
                <Checkbox
                  checked={selectedOptions.includes(opt)}
                  onChange={() => handleOptionToggle(opt)}
                  size="small"
                  sx={{ color: colors.blueAccent[400], "&.Mui-checked": { color: colors.blueAccent[300] } }}
                />
                <Typography variant="body2" color={colors.grey[200]}>{opt}</Typography>
              </Box>
            ))}
          </Card>

          {/* Custom option input */}
          <Box display="flex" gap={1} mb={2}>
            <TextField size="small" label="Add custom option" value={customOption}
              onChange={e => setCustomOption(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomOption()}
              sx={{ flex: 1 }} />
            <Button variant="outlined" onClick={addCustomOption}
              sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[600] }}>
              Add
            </Button>
          </Box>

          {/* Selected options preview */}
          {selectedOptions.length > 0 && (
            <Box mb={2}>
              <Typography variant="caption" color={colors.grey[400]} mb={0.5} display="block">
                Selected options ({selectedOptions.length}):
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {selectedOptions.map(opt => (
                  <Chip key={opt} label={opt} size="small" onDelete={() => removeOption(opt)}
                    sx={{ backgroundColor: colors.blueAccent[700], color: "#fff" }} />
                ))}
              </Box>
            </Box>
          )}

          {/* Status */}
          <FormControl fullWidth sx={fieldSx}>
            <InputLabel>Status</InputLabel>
            <Select value={form.status} onChange={set("status")} label="Status">
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>

          {/* Closes at */}
          <TextField fullWidth label="Closes At (optional)" type="datetime-local"
            value={form.closes_at} onChange={set("closes_at")} sx={fieldSx}
            InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleSave}
            sx={{ backgroundColor: colors.blueAccent[600] }}>
            {saving ? "Saving..." : "Publish Poll"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityPollsAnalytics;
