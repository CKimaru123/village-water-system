import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, CircularProgress, Alert, Button, TextField,
  Grid, Card, CardContent, Chip, Divider, Avatar, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  FormControl, InputLabel, Select, MenuItem, Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { useLocation, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import HistoryIcon from "@mui/icons-material/History";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import adminApi from "../../../utils/api";

const statusColor = (s, colors) => {
  if (s === "active")    return colors.greenAccent[500];
  if (s === "suspended") return colors.redAccent[400];
  if (s === "pending")   return "#f0c040";
  return colors.grey[400];
};

// ── Field row: shows old vs new value in the confirmation modal ──────────────
const ChangeRow = ({ label, oldVal, newVal, colors }) => {
  if (oldVal === newVal || (!oldVal && !newVal)) return null;
  return (
    <Box display="flex" alignItems="flex-start" gap={2} py={1}
      sx={{ borderBottom: `1px solid ${colors.grey[700]}` }}>
      <Typography variant="body2" color={colors.grey[400]} sx={{ minWidth: 140 }}>{label}</Typography>
      <Box flex={1}>
        <Typography variant="body2" color={colors.redAccent[400]}
          sx={{ textDecoration: "line-through", fontSize: "0.85rem" }}>
          {oldVal || "—"}
        </Typography>
        <Typography variant="body2" color={colors.greenAccent[400]} fontWeight="bold">
          {newVal || "—"}
        </Typography>
      </Box>
    </Box>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const ClientProfileEdit = () => {
  const colors = tokens(useTheme().palette.mode);
  const location = useLocation();
  const navigate = useNavigate();
  const clientId = location.state?.client_id;

  const [original, setOriginal]     = useState(null); // data as loaded from server
  const [form, setForm]             = useState({});
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason]         = useState("");
  const [auditLogs, setAuditLogs]   = useState([]);
  const [showAudit, setShowAudit]   = useState(false);

  // Load client profile
  useEffect(() => {
    if (!clientId) { setLoading(false); return; }
    adminApi.get(`/client_profile_management/${clientId}`)
      .then(res => {
        const c = res.data?.client || res.data;
        const p = res.data?.permissions || {};
        setOriginal(c);
        setForm({
          first_name:               c.first_name || "",
          last_name:                c.last_name || "",
          institution_name:         c.institution_name || "",
          contact_person:           c.contact_person || "",
          phone:                    c.phone || "",
          alt_phone:                c.alt_phone || "",
          alt_contact:              c.alt_contact || "",
          email:                    c.email || "",
          village:                  c.village || "",
          landmark:                 c.landmark || "",
          plot_number:              c.plot_number || "",
          household_size:           c.household_size || "",
          population_served:        c.population_served || "",
          communication_preference: c.communication_preference || "sms",
          account_type:             c.account_type || "household",
        });
        setPermissions(p);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [clientId]);

  // Load audit trail
  const loadAudit = () => {
    adminApi.get(`/client_profile_management/${clientId}/audit_trail`)
      .then(res => setAuditLogs(res.data?.audit_logs || []))
      .catch(() => {});
  };

  // Detect which fields changed
  const changedFields = useMemo(() => {
    if (!original) return {};
    const changes = {};
    Object.keys(form).forEach(key => {
      const oldVal = String(original[key] ?? "");
      const newVal = String(form[key] ?? "");
      if (oldVal !== newVal) changes[key] = { old: original[key], new: form[key] };
    });
    return changes;
  }, [form, original]);

  const hasChanges = Object.keys(changedFields).length > 0;

  const set = (field) => (e) => setForm(v => ({ ...v, [field]: e.target.value }));

  const handleSaveClick = () => {
    if (!hasChanges) { setError("No changes to save."); return; }
    setReason("");
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.patch(`/client_profile_management/${clientId}`, {
        client: form,
        reason: reason || "Profile updated by admin",
      });
      setSuccess("Profile updated successfully. The client has been notified.");
      setConfirmOpen(false);
      // Reload to get fresh data
      const res = await adminApi.get(`/client_profile_management/${clientId}`);
      const c = res.data?.client || res.data;
      setOriginal(c);
    } catch (err) {
      setError(err.message);
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const fieldLabel = (key) => ({
    first_name: "First Name", last_name: "Last Name",
    institution_name: "Institution Name", contact_person: "Contact Person",
    phone: "Phone", alt_phone: "Alt Phone", alt_contact: "Alt Contact", email: "Email",
    village: "Village", landmark: "Landmark", plot_number: "Plot Number",
    household_size: "Household Size", population_served: "Population Served",
    communication_preference: "Communication Preference", account_type: "Account Type",
  }[key] || key);

  if (!clientId) return (
    <Box m="20px">
      <Alert severity="warning">No client selected. Navigate here from Client Lookup.</Alert>
      <Button sx={{ mt: 2, color: colors.blueAccent[400] }} onClick={() => navigate("../client-lookup")}>
        Go to Client Lookup
      </Button>
    </Box>
  );

  const isHousehold = form.account_type === "household";
  const completion  = original?.profile_completion || 0;

  return (
    <Box m="20px">
      {/* ── Page header ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: colors.grey[300] }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Edit Client Profile</Typography>
            <Typography variant="h6" color={colors.grey[400]}>
              Changes are audited, notified to the client, and reflected in real time
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="View change history">
            <Button variant="outlined" startIcon={<HistoryIcon />}
              onClick={() => { loadAudit(); setShowAudit(true); }}
              sx={{ borderColor: colors.grey[600], color: colors.grey[300] }}>
              Audit Trail
            </Button>
          </Tooltip>
          <Button variant="contained" startIcon={<SaveIcon />}
            disabled={!hasChanges || saving}
            onClick={handleSaveClick}
            sx={{ backgroundColor: colors.greenAccent[600], "&:hover": { backgroundColor: colors.greenAccent[700] },
              "&.Mui-disabled": { backgroundColor: colors.grey[700], color: colors.grey[500] } }}>
            {saving ? "Saving..." : `Save Changes${hasChanges ? ` (${Object.keys(changedFields).length})` : ""}`}
          </Button>
        </Box>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}
        icon={<CheckCircleIcon />}>{success}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* ── Left: client summary card ── */}
          <Grid item xs={12} md={3}>
            <Card sx={{ backgroundColor: colors.primary[400], borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                  <Avatar sx={{ width: 72, height: 72, backgroundColor: colors.blueAccent[700], mb: 1.5 }}>
                    <PersonIcon sx={{ fontSize: 40, color: colors.blueAccent[300] }} />
                  </Avatar>
                  <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" textAlign="center">
                    {original?.display_name || "—"}
                  </Typography>
                  <Chip label={(original?.status || "—").toUpperCase()} size="small"
                    sx={{ backgroundColor: statusColor(original?.status, colors), color: "#fff", mt: 0.5 }} />
                </Box>

                <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />

                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color={colors.grey[400]}>Profile Completion</Typography>
                    <Typography variant="caption" color={colors.grey[300]}>{completion}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={completion}
                    sx={{ height: 6, borderRadius: 3, backgroundColor: colors.grey[700],
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: completion >= 80 ? colors.greenAccent[500] :
                          completion >= 50 ? "#f0c040" : colors.redAccent[400]
                      } }} />
                </Box>

                {[
                  ["Account Type", original?.account_type],
                  ["Phone",        original?.phone],
                  ["Email",        original?.email],
                  ["Village",      original?.village],
                  ["Last Updated", original?.formatted_updated_at],
                ].filter(([, v]) => v).map(([label, val]) => (
                  <Box key={label} mb={1}>
                    <Typography variant="caption" color={colors.grey[500]}>{label}</Typography>
                    <Typography variant="body2" color={colors.grey[200]}>{val}</Typography>
                  </Box>
                ))}

                {hasChanges && (
                  <Box mt={2} p={1.5} sx={{ backgroundColor: colors.blueAccent[900], borderRadius: 1,
                    border: `1px solid ${colors.blueAccent[700]}` }}>
                    <Typography variant="caption" color={colors.blueAccent[300]} fontWeight="bold">
                      {Object.keys(changedFields).length} unsaved change{Object.keys(changedFields).length !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* ── Right: edit form ── */}
          <Grid item xs={12} md={9}>
            {/* Identity */}
            <Card sx={{ backgroundColor: colors.primary[400], borderRadius: 2, mb: 3 }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" mb={2}>
                  Identity Information
                </Typography>
                <Grid container spacing={2}>
                  {isHousehold ? (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="First Name" value={form.first_name} onChange={set("first_name")}
                          sx={{ mt: 1 }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Last Name" value={form.last_name} onChange={set("last_name")}
                          sx={{ mt: 1 }} />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Institution Name" value={form.institution_name}
                          onChange={set("institution_name")} sx={{ mt: 1 }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Contact Person" value={form.contact_person}
                          onChange={set("contact_person")} sx={{ mt: 1 }} />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                      <InputLabel>Account Type</InputLabel>
                      <Select value={form.account_type} onChange={set("account_type")} label="Account Type">
                        <MenuItem value="household">Household</MenuItem>
                        <MenuItem value="institution">Institution</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card sx={{ backgroundColor: colors.primary[400], borderRadius: 2, mb: 3 }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" mb={2}>
                  Contact Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Phone *" value={form.phone} onChange={set("phone")} sx={{ mt: 1 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {isHousehold
                      ? <TextField fullWidth label="Alt Phone" value={form.alt_phone} onChange={set("alt_phone")} sx={{ mt: 1 }} />
                      : <TextField fullWidth label="Alt Contact (person/email)" value={form.alt_contact} onChange={set("alt_contact")} sx={{ mt: 1 }} />
                    }
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email" value={form.email} onChange={set("email")} sx={{ mt: 1 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                      <InputLabel>Communication Preference</InputLabel>
                      <Select value={form.communication_preference} onChange={set("communication_preference")}
                        label="Communication Preference">
                        <MenuItem value="sms">SMS</MenuItem>
                        <MenuItem value="email">Email</MenuItem>
                        <MenuItem value="both">Both</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Location & Service */}
            <Card sx={{ backgroundColor: colors.primary[400], borderRadius: 2, mb: 3 }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" mb={2}>
                  Location & Service Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Village / Area" value={form.village} onChange={set("village")} sx={{ mt: 1 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Landmark" value={form.landmark} onChange={set("landmark")} sx={{ mt: 1 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Plot Number" value={form.plot_number} onChange={set("plot_number")} sx={{ mt: 1 }} />
                  </Grid>
                  {isHousehold ? (
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Household Size" type="number" value={form.household_size}
                        onChange={set("household_size")} sx={{ mt: 1 }} />
                    </Grid>
                  ) : (
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Population Served" type="number" value={form.population_served}
                        onChange={set("population_served")} sx={{ mt: 1 }} />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Changed fields preview */}
            {hasChanges && (
              <Card sx={{ backgroundColor: colors.primary[400], borderRadius: 2,
                border: `1px solid ${colors.blueAccent[700]}` }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <InfoOutlinedIcon sx={{ color: colors.blueAccent[400], fontSize: 20 }} />
                    <Typography variant="h6" color={colors.blueAccent[300]} fontWeight="bold">
                      Pending Changes
                    </Typography>
                  </Box>
                  {Object.entries(changedFields).map(([key, { old: o, new: n }]) => (
                    <ChangeRow key={key} label={fieldLabel(key)} oldVal={String(o ?? "")} newVal={String(n ?? "")} colors={colors} />
                  ))}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* ── Confirmation modal ── */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <WarningIcon sx={{ color: "#f0c040" }} />
              <Typography variant="h4" color={colors.grey[100]}>Confirm Profile Changes</Typography>
            </Box>
            <IconButton onClick={() => setConfirmOpen(false)} sx={{ color: colors.grey[400] }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ overflow: "visible", pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2, backgroundColor: colors.blueAccent[800], color: colors.grey[100] }}>
            The client will be notified of these changes immediately with your name, role, and timestamp.
          </Alert>

          {/* Summary of client */}
          <Box display="flex" alignItems="center" gap={2} mb={2} p={1.5}
            sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
            <Avatar sx={{ backgroundColor: colors.blueAccent[700] }}>
              <PersonIcon sx={{ color: colors.blueAccent[300] }} />
            </Avatar>
            <Box>
              <Typography variant="h6" color={colors.grey[100]}>{original?.display_name}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>
                {original?.phone} · {original?.account_type}
              </Typography>
            </Box>
          </Box>

          {/* Changes list */}
          <Typography variant="body2" color={colors.grey[300]} mb={1} fontWeight="bold">
            The following {Object.keys(changedFields).length} field{Object.keys(changedFields).length !== 1 ? "s" : ""} will be updated:
          </Typography>
          <Box mb={2} sx={{ backgroundColor: colors.primary[500], borderRadius: 1, p: 1.5 }}>
            {Object.entries(changedFields).map(([key, { old: o, new: n }]) => (
              <ChangeRow key={key} label={fieldLabel(key)} oldVal={String(o ?? "")} newVal={String(n ?? "")} colors={colors} />
            ))}
          </Box>

          {/* Reason field */}
          <TextField
            fullWidth
            label="Reason for changes *"
            placeholder="e.g. Client requested phone number update, correcting data entry error..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            multiline
            rows={2}
            sx={{ mt: 1 }}
            helperText="This reason will be included in the audit log and client notification."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: colors.grey[400] }}>
            Cancel — Go Back to Edit
          </Button>
          <Button
            variant="contained"
            disabled={saving || !reason.trim()}
            onClick={handleConfirmSave}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{ backgroundColor: colors.greenAccent[600], "&:hover": { backgroundColor: colors.greenAccent[700] },
              "&.Mui-disabled": { backgroundColor: colors.grey[700] } }}>
            {saving ? "Saving..." : "Confirm & Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Audit trail modal ── */}
      <Dialog open={showAudit} onClose={() => setShowAudit(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <HistoryIcon sx={{ color: colors.blueAccent[400] }} />
              <Typography variant="h4" color={colors.grey[100]}>Change History</Typography>
            </Box>
            <IconButton onClick={() => setShowAudit(false)} sx={{ color: colors.grey[400] }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {auditLogs.length === 0 ? (
            <Alert severity="info">No changes recorded yet.</Alert>
          ) : (
            auditLogs.map(log => (
              <Box key={log.id} mb={2} p={2}
                sx={{ backgroundColor: colors.primary[500], borderRadius: 1,
                  borderLeft: `3px solid ${colors.blueAccent[500]}` }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                  <Typography variant="body1" color={colors.grey[100]} fontWeight="bold">
                    {log.field_name}
                  </Typography>
                  <Typography variant="caption" color={colors.grey[500]}>{log.formatted_timestamp}</Typography>
                </Box>
                <Box display="flex" gap={2} mb={0.5}>
                  <Typography variant="body2" color={colors.redAccent[400]}
                    sx={{ textDecoration: "line-through" }}>{log.old_value || "—"}</Typography>
                  <Typography variant="body2" color={colors.grey[500]}>→</Typography>
                  <Typography variant="body2" color={colors.greenAccent[400]} fontWeight="bold">
                    {log.new_value || "—"}
                  </Typography>
                </Box>
                <Typography variant="caption" color={colors.grey[400]}>
                  By {log.modified_by} ({log.modified_by_role})
                  {log.reason ? ` · Reason: ${log.reason}` : ""}
                </Typography>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAudit(false)} sx={{ color: colors.grey[300] }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientProfileEdit;
