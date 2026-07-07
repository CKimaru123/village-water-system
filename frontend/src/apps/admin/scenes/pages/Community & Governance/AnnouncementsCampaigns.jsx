import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, IconButton, Checkbox, FormControlLabel,
} from "@mui/material";
import { tokens } from "../../../theme";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import adminApi from "../../../utils/api";

const EMPTY = { title: "", content: "", priority: "normal", category: "", target_audience: "all" };

const AnnouncementsCampaigns = () => {
  const colors = tokens("dark");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    // Admin sees all announcements — use a broader query
    adminApi.get("/announcements?admin=true")
      .then(res => setItems(res.data?.data?.announcements || res.data?.announcements || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm(a); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Always publish so clients get notified immediately
      const payload = { ...form, published: true };
      if (editing) await adminApi.patch(`/announcements/${editing.id}`, { announcement: payload });
      else await adminApi.post("/announcements", { announcement: payload });
      setOpen(false); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try { await adminApi.delete(`/announcements/${id}`); load(); }
    catch (err) { setError(err.message); }
  };

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));
  const setCheckbox = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.checked }));

  // fieldSx: let the theme handle label colors; just add top margin so shrunk label isn't clipped
  const fieldSx = { mb: 2, mt: 1 };

  const priorityColor = (p) => {
    if (p === "urgent") return colors.redAccent[400];
    if (p === "high") return "#f0c040";
    return colors.blueAccent[400];
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Announcements & Campaigns</Typography>
        <Button variant="contained" startIcon={<AddIcon />}
          sx={{ backgroundColor: colors.blueAccent[600] }} onClick={openCreate}>New Announcement</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? <CircularProgress sx={{ color: colors.blueAccent[500] }} /> : (
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Title", "Category", "Priority", "Published", "Actions"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[300] }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(a => (
                  <TableRow key={a.id}>
                    <TableCell sx={{ color: colors.grey[100] }}>{a.title}</TableCell>
                    <TableCell sx={{ color: colors.grey[300] }}>{a.category || "—"}</TableCell>
                    <TableCell>
                      <Chip label={a.priority?.toUpperCase() || "NORMAL"} size="small"
                        sx={{ backgroundColor: priorityColor(a.priority), color: "#fff" }} />
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[400] }}>
                      {a.published_at ? new Date(a.published_at).toLocaleDateString() : "Draft"}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => openEdit(a)} sx={{ color: colors.blueAccent[400] }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(a.id)} sx={{ color: colors.redAccent[400] }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>{editing ? "Edit Announcement" : "New Announcement"}</DialogTitle>
        <DialogContent sx={{ overflow: "visible", pt: 2 }}>
          <TextField fullWidth label="Title" value={form.title} onChange={set("title")} sx={fieldSx} />
          <TextField fullWidth label="Category" placeholder="e.g. Water Supply, Maintenance"
            value={form.category} onChange={set("category")} sx={fieldSx} />
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Priority</InputLabel>
            <Select value={form.priority} onChange={set("priority")} label="Priority">
              {["normal", "high", "urgent"].map(p => (
                <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Audience</InputLabel>
            <Select value={form.target_audience} onChange={set("target_audience")} label="Audience">
              <MenuItem value="all">All (Clients + Admins)</MenuItem>
              <MenuItem value="client">Clients Only</MenuItem>
              <MenuItem value="admin">Admins Only</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth multiline rows={4} label="Content" value={form.content}
            onChange={set("content")} sx={fieldSx} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleSave}
            sx={{ backgroundColor: colors.blueAccent[600] }}>{saving ? "Saving..." : "Publish"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnnouncementsCampaigns;
