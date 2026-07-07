import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { tokens } from "../../../theme";
import ScheduleIcon from "@mui/icons-material/Schedule";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import adminApi from "../../../utils/api";

const SCHEDULE_TYPES = [
  { value: "interval_minutes", label: "Every N Minutes" },
  { value: "interval_hours",   label: "Every N Hours" },
  { value: "daily_at",         label: "Daily at Time" },
  { value: "end_of_month",     label: "End of Month" },
];

const EMPTY_FORM = { schedule_type: "end_of_month", interval_value: "", daily_time: "00:00" };

const ScheduleForm = ({ value, onChange, colors, fieldSx }) => (
  <>
    <FormControl fullWidth sx={{ mb: 2 }}>
      <InputLabel sx={{ color: colors.grey[400] }}>Schedule Type</InputLabel>
      <Select
        value={value.schedule_type}
        label="Schedule Type"
        onChange={e => onChange({ ...value, schedule_type: e.target.value })}
        sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
      >
        {SCHEDULE_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
      </Select>
    </FormControl>

    {(value.schedule_type === "interval_minutes" || value.schedule_type === "interval_hours") && (
      <TextField
        fullWidth
        label={value.schedule_type === "interval_minutes" ? "Interval (minutes, min 1)" : "Interval (hours)"}
        type="number"
        value={value.interval_value}
        onChange={e => onChange({ ...value, interval_value: e.target.value })}
        inputProps={{ min: 1 }}
        sx={fieldSx}
      />
    )}

    {value.schedule_type === "daily_at" && (
      <TextField
        fullWidth
        label="Time (HH:MM)"
        type="time"
        value={value.daily_time}
        onChange={e => onChange({ ...value, daily_time: e.target.value })}
        InputLabelProps={{ shrink: true }}
        sx={fieldSx}
      />
    )}
  </>
);

const ReadingScheduleConfig = () => {
  const colors = tokens("dark");

  const [globalSchedule, setGlobalSchedule] = useState(null);
  const [meterSchedules, setMeterSchedules] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [alert, setAlert]       = useState(null);

  const [globalForm, setGlobalForm] = useState(EMPTY_FORM);
  const [editDialog, setEditDialog] = useState(null); // { meterId, meterSerial, form }
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fieldSx = {
    mb: 2,
    "& label": { color: colors.grey[400] },
    "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } },
  };

  const showAlert = (msg, sev = "success") => { setAlert({ msg, sev }); setTimeout(() => setAlert(null), 4000); };

  const load = () => {
    setLoading(true);
    adminApi.get("/admin/reading_schedules")
      .then(res => {
        const data = res.data?.data || res.data;
        const g = data?.global_default;
        setGlobalSchedule(g || null);
        setGlobalForm(g ? { schedule_type: g.schedule_type, interval_value: g.interval_value || "", daily_time: g.daily_time || "00:00" } : EMPTY_FORM);
        setMeterSchedules(data?.meter_schedules || []);
      })
      .catch(() => showAlert("Failed to load reading schedules", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const saveGlobal = async () => {
    setSaving(true);
    try {
      await adminApi.patch("/admin/reading_schedules/global", { reading_schedule: globalForm });
      showAlert("Global reading schedule saved.");
      load();
    } catch (err) {
      const msgs = err.response?.data?.errors || [err.response?.data?.message || err.message];
      showAlert(msgs.join(", "), "error");
    } finally { setSaving(false); }
  };

  const saveMeterSchedule = async () => {
    if (!editDialog) return;
    setSaving(true);
    try {
      await adminApi.patch(`/admin/meters/${editDialog.meterId}/schedule`, { reading_schedule: editDialog.form });
      showAlert(`Schedule saved for meter ${editDialog.meterSerial}.`);
      setEditDialog(null);
      load();
    } catch (err) {
      const msgs = err.response?.data?.errors || [err.response?.data?.message || err.message];
      showAlert(msgs.join(", "), "error");
    } finally { setSaving(false); }
  };

  const deleteMeterSchedule = async (meterId, meterSerial) => {
    try {
      await adminApi.delete(`/admin/meters/${meterId}/schedule`);
      showAlert(`Schedule removed for meter ${meterSerial}. Meter will use global default.`);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      showAlert(err.response?.data?.message || err.message, "error");
    }
  };

  const scheduleLabel = (s) => {
    if (!s) return "—";
    switch (s.schedule_type) {
      case "interval_minutes": return `Every ${s.interval_value} min`;
      case "interval_hours":   return `Every ${s.interval_value} hr`;
      case "daily_at":         return `Daily at ${s.daily_time}`;
      case "end_of_month":     return "End of month";
      default: return s.schedule_type;
    }
  };

  if (loading) return <Box m="20px" display="flex" justifyContent="center"><CircularProgress sx={{ color: colors.blueAccent[400] }} /></Box>;

  return (
    <Box m="20px">
      <Box display="flex" alignItems="center" gap={1} mb="20px">
        <ScheduleIcon sx={{ color: colors.blueAccent[400], fontSize: 32 }} />
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Reading Schedule Configuration</Typography>
      </Box>

      {alert && <Alert severity={alert.sev} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      <Grid container spacing={3}>
        {/* Global Default */}
        <Grid item xs={12} md={5}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={1}>Global Default Schedule</Typography>
              <Typography variant="body2" color={colors.grey[400]} mb={3}>
                Applies to all smart meters without an individual schedule.
              </Typography>

              <ScheduleForm value={globalForm} onChange={setGlobalForm} colors={colors} fieldSx={fieldSx} />

              <Button
                variant="contained"
                fullWidth
                startIcon={<SaveIcon />}
                disabled={saving}
                onClick={saveGlobal}
                sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[700] } }}
              >
                {saving ? "Saving..." : "Save Global Schedule"}
              </Button>

              {globalSchedule && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Current: <strong>{scheduleLabel(globalSchedule)}</strong>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Per-Meter Overrides */}
        <Grid item xs={12} md={7}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={1}>Per-Meter Overrides</Typography>
              <Typography variant="body2" color={colors.grey[400]} mb={2}>
                Individual schedules override the global default for that meter.
              </Typography>

              {meterSchedules.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["Meter Serial", "Schedule", "Actions"].map(h => (
                        <TableCell key={h} sx={{ color: colors.grey[300] }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {meterSchedules.map(s => (
                      <TableRow key={s.id}>
                        <TableCell sx={{ color: colors.grey[100] }}>{s.meter_serial || s.meter_id}</TableCell>
                        <TableCell>
                          <Chip label={scheduleLabel(s)} size="small" sx={{ backgroundColor: colors.blueAccent[700], color: "#fff" }} />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" sx={{ color: colors.blueAccent[400] }}
                            onClick={() => setEditDialog({ meterId: s.meter_id, meterSerial: s.meter_serial, form: { schedule_type: s.schedule_type, interval_value: s.interval_value || "", daily_time: s.daily_time || "00:00" } })}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" sx={{ color: colors.redAccent[400] }}
                            onClick={() => setDeleteConfirm({ meterId: s.meter_id, meterSerial: s.meter_serial })}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color={colors.grey[400]}>No per-meter overrides configured.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Meter Schedule Dialog */}
      <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>
          Edit Schedule — Meter {editDialog?.meterSerial}
        </DialogTitle>
        <DialogContent>
          {editDialog && (
            <Box pt={1}>
              <ScheduleForm value={editDialog.form} onChange={f => setEditDialog(d => ({ ...d, form: f }))} colors={colors} fieldSx={fieldSx} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(null)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={saveMeterSchedule}
            sx={{ backgroundColor: colors.blueAccent[600] }}>{saving ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Remove Schedule</DialogTitle>
        <DialogContent>
          <Typography color={colors.grey[100]}>
            Remove individual schedule for meter <strong>{deleteConfirm?.meterSerial}</strong>?
            It will revert to the global default.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" color="error"
            onClick={() => deleteMeterSchedule(deleteConfirm.meterId, deleteConfirm.meterSerial)}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReadingScheduleConfig;
