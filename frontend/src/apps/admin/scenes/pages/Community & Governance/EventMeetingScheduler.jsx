import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, IconButton,
} from "@mui/material";
import { tokens } from "../../../theme";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import adminApi from "../../../utils/api";

const EMPTY = { title: "", description: "", event_date: "", location: "", event_type: "meeting" };

const EventMeetingScheduler = () => {
  const colors = tokens("dark");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    adminApi.get("/events")
      .then(res => setEvents(res.data?.data?.events || res.data?.events || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Set status to published so clients can see it
      const payload = { ...form, status: "published" };
      if (editing) await adminApi.patch(`/events/${editing.id}`, { event: payload });
      else await adminApi.post("/events", { event: payload });
      setOpen(false); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try { await adminApi.delete(`/events/${id}`); load(); }
    catch (err) { setError(err.message); }
  };

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));
  const fieldSx = { mb: 2, mt: 1 };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Event & Meeting Scheduler</Typography>
        <Button variant="contained" startIcon={<AddIcon />}
          sx={{ backgroundColor: colors.blueAccent[600] }} onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true); }}>
          Schedule Event
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? <CircularProgress sx={{ color: colors.blueAccent[500] }} /> : (
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Title", "Type", "Date", "Location", "Actions"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[300] }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map(e => (
                  <TableRow key={e.id}>
                    <TableCell sx={{ color: colors.grey[100] }}>{e.title}</TableCell>
                    <TableCell>
                      <Chip label={e.event_type?.toUpperCase() || "EVENT"} size="small"
                        sx={{ backgroundColor: colors.blueAccent[700], color: "#fff" }} />
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[300] }}>
                      {e.event_date ? new Date(e.event_date).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[400] }}>{e.location || "—"}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => { setEditing(e); setForm({ ...e }); setOpen(true); }}
                        sx={{ color: colors.blueAccent[400] }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(e.id)}
                        sx={{ color: colors.redAccent[400] }}><DeleteIcon fontSize="small" /></IconButton>
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
        <DialogTitle sx={{ color: colors.grey[100] }}>{editing ? "Edit Event" : "Schedule Event"}</DialogTitle>
        <DialogContent sx={{ overflow: "visible", pt: 2 }}>
          <TextField fullWidth label="Title" value={form.title} onChange={set("title")} sx={fieldSx} />
          <TextField fullWidth label="Event Type" value={form.event_type} onChange={set("event_type")} sx={fieldSx} />
          <TextField fullWidth label="Date" type="datetime-local" InputLabelProps={{ shrink: true }}
            value={form.event_date} onChange={set("event_date")} sx={fieldSx} />
          <TextField fullWidth label="Location" value={form.location} onChange={set("location")} sx={fieldSx} />
          <TextField fullWidth multiline rows={3} label="Description" value={form.description} onChange={set("description")} sx={fieldSx} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleSave}
            sx={{ backgroundColor: colors.blueAccent[600] }}>{saving ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventMeetingScheduler;
