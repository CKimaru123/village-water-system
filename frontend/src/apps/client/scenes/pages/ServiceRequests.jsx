import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button,
  CircularProgress, Alert, Divider, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Avatar,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers";
import { format, isValid } from "date-fns";
import { tokens } from "../../theme";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import GavelIcon from "@mui/icons-material/Gavel";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PendingIcon from "@mui/icons-material/Pending";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const BASE = "http://localhost:3001/api/v1";

const getToken = () => localStorage.getItem("token");

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json", ...options.headers },
  });
  return res.json();
};

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:      { label: "Pending",      color: "#f0c040", icon: <ScheduleIcon sx={{ fontSize: 16 }} /> },
  approved:     { label: "Approved",     color: "#4cceac", icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
  denied:       { label: "Denied",       color: "#e2726e", icon: <CancelIcon sx={{ fontSize: 16 }} /> },
  completed:    { label: "Completed",    color: "#4cceac", icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
  under_review: { label: "Under Review", color: "#868dfb", icon: <PendingIcon sx={{ fontSize: 16 }} /> },
};

const REQUEST_TYPE_META = {
  pause:      { label: "Service Pause",        icon: <PauseCircleIcon />, color: "#868dfb" },
  reactivate: { label: "Service Reactivation", icon: <PlayCircleIcon />, color: "#4cceac" },
  inactivate: { label: "Account Inactivation", icon: <CancelIcon />,     color: "#f0c040" },
};

const PRIORITY_COLORS = { urgent: "#e2726e", high: "#ff9800", normal: "#868dfb", low: "#4cceac" };

const StatusChip = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, color: "#666", icon: null };
  return (
    <Chip
      icon={meta.icon}
      label={meta.label}
      size="small"
      sx={{ backgroundColor: meta.color, color: "#fff", fontWeight: "bold", fontSize: "0.75rem" }}
    />
  );
};

// ── Request card ──────────────────────────────────────────────────────────────
const RequestCard = ({ request, colors }) => {
  const meta = REQUEST_TYPE_META[request.request_type] || { label: request.request_type, icon: <ScheduleIcon />, color: "#666" };
  return (
    <Card sx={{ backgroundColor: colors.primary[400], mb: 2, borderRadius: 2,
      borderLeft: `4px solid ${meta.color}` }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ backgroundColor: meta.color, width: 36, height: 36 }}>
              {React.cloneElement(meta.icon, { sx: { fontSize: 20, color: "#fff" } })}
            </Avatar>
            <Box>
              <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">{meta.label}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>
                Submitted {new Date(request.created_at).toLocaleDateString("en-US", {
                  year: "numeric", month: "short", day: "numeric",
                })}
                {request.formatted_dates ? ` · ${request.formatted_dates}` : ""}
              </Typography>
            </Box>
          </Box>
          <StatusChip status={request.status} />
        </Box>

        <Box mt={1.5} p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
          <Typography variant="body2" color={colors.grey[300]} sx={{ lineHeight: 1.6 }}>
            {request.reason}
          </Typography>
        </Box>

        {request.admin_notes && (
          <Box mt={1.5} p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1,
            borderLeft: `3px solid ${colors.blueAccent[500]}` }}>
            <Typography variant="caption" color={colors.blueAccent[400]} fontWeight="bold">Admin Response</Typography>
            <Typography variant="body2" color={colors.grey[200]} mt={0.5}>{request.admin_notes}</Typography>
            {request.reviewed_at && (
              <Typography variant="caption" color={colors.grey[500]} display="block" mt={0.5}>
                Reviewed by {request.reviewed_by} on {new Date(request.reviewed_at).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ── Appeal card ───────────────────────────────────────────────────────────────
const AppealCard = ({ appeal, colors }) => (
  <Card sx={{ backgroundColor: colors.primary[400], mb: 2, borderRadius: 2,
    borderLeft: `4px solid ${PRIORITY_COLORS[appeal.priority] || "#666"}` }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ backgroundColor: PRIORITY_COLORS[appeal.priority] || "#666", width: 36, height: 36 }}>
            <GavelIcon sx={{ fontSize: 20, color: "#fff" }} />
          </Avatar>
          <Box>
            <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">
              Appeal #{appeal.id}
            </Typography>
            <Box display="flex" gap={1} alignItems="center" mt={0.3}>
              <Chip label={appeal.priority?.toUpperCase()} size="small"
                sx={{ backgroundColor: PRIORITY_COLORS[appeal.priority], color: "#fff", fontSize: "0.7rem", height: 20 }} />
              <Typography variant="caption" color={colors.grey[400]}>
                {appeal.days_since_submitted} day{appeal.days_since_submitted !== 1 ? "s" : ""} ago
              </Typography>
              {appeal.is_overdue && (
                <Chip label="OVERDUE" size="small" color="error" sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
            </Box>
          </Box>
        </Box>
        <StatusChip status={appeal.status} />
      </Box>

      <Box mt={1.5} p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
        <Typography variant="body2" color={colors.grey[300]} sx={{ lineHeight: 1.6 }}>
          {appeal.reason}
        </Typography>
      </Box>

      {appeal.resolution && (
        <Box mt={1.5} p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1,
          borderLeft: `3px solid ${colors.greenAccent[500]}` }}>
          <Typography variant="caption" color={colors.greenAccent[400]} fontWeight="bold">Resolution</Typography>
          <Typography variant="body2" color={colors.grey[200]} mt={0.5}>{appeal.resolution}</Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const ServiceRequests = () => {
  const colors = tokens(useTheme().palette.mode);
  const navigate = useNavigate();

  const [requests, setRequests]   = useState([]);
  const [appeals, setAppeals]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);
  const [userStatus, setUserStatus] = useState(null); // current account status

  // New request dialog
  const [reqOpen, setReqOpen]     = useState(false);
  const [reqType, setReqType]     = useState("pause");
  const [reqReason, setReqReason] = useState("");
  const [reqStartDate, setReqStartDate] = useState(null);
  const [reqEndDate, setReqEndDate]     = useState(null);
  const [submitting, setSubmitting]     = useState(false);

  // New appeal dialog
  const [appOpen, setAppOpen]         = useState(false);
  const [appReason, setAppReason]     = useState("");
  const [appPriority, setAppPriority] = useState("normal");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, appRes, statusRes] = await Promise.all([
        apiFetch("/client/status/requests"),
        apiFetch("/client/appeals"),
        apiFetch("/client/status"),
      ]);
      if (reqRes.success) setRequests(reqRes.data?.requests || []);
      if (appRes.success) setAppeals(appRes.data?.appeals || []);
      if (statusRes.success) setUserStatus(statusRes.data);
    } catch {
      setError("Failed to load service requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmitRequest = async () => {
    if (!reqReason.trim()) { setError("Please provide a reason."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const endpoint = reqType === "reactivate"
        ? "/client/status/request-reactivation"
        : "/client/status/request-pause";
      const body = { request: {
        reason: reqReason,
        ...(reqType !== "reactivate" && { request_type: reqType }),
        ...(reqStartDate && isValid(reqStartDate) && { start_date: format(reqStartDate, "yyyy-MM-dd") }),
        ...(reqEndDate && isValid(reqEndDate) && { end_date: format(reqEndDate, "yyyy-MM-dd") }),
      }};
      const res = await apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) });
      if (res.success) {
        setSuccess("Request submitted successfully. The admin team will review it shortly.");
        setReqOpen(false);
        setReqReason(""); setReqStartDate(null); setReqEndDate(null);
        load();
      } else {
        setError(res.message || "Failed to submit request.");
      }
    } catch {
      setError("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!appReason.trim() || appReason.length < 10) {
      setError("Please provide a detailed reason (at least 10 characters).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/client/appeals", {
        method: "POST",
        body: JSON.stringify({ appeal: { reason: appReason, priority: appPriority } }),
      });
      if (res.success) {
        setSuccess("Appeal submitted successfully.");
        setAppOpen(false);
        setAppReason(""); setAppPriority("normal");
        load();
      } else {
        setError(res.message || "Failed to submit appeal.");
      }
    } catch {
      setError("Failed to submit appeal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length
    + appeals.filter(a => a.status === "pending" || a.status === "under_review").length;

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Service Requests</Typography>
          <Typography variant="h6" color={colors.grey[400]}>
            Manage your account status requests and suspension appeals
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }} title="Refresh">
            <RefreshIcon />
          </IconButton>
          <Button variant="outlined" startIcon={<GavelIcon />} onClick={() => setAppOpen(true)}
            sx={{ borderColor: colors.redAccent[400], color: colors.redAccent[400] }}>
            New Appeal
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => {
              const status = userStatus?.user?.status;
              setReqType(status === "inactive" ? "reactivate" : "pause");
              setReqOpen(true);
            }}
            sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[700] } }}>
            New Request
          </Button>
        </Box>
      </Box>

      {/* Info banner */}
      <Box mb={3} p={2} sx={{ backgroundColor: colors.primary[400], borderRadius: 2,
        border: `1px solid ${colors.grey[700]}`, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <InfoOutlinedIcon sx={{ color: colors.blueAccent[400], mt: 0.2, flexShrink: 0 }} />
        <Box>
          <Typography variant="body2" color={colors.grey[200]} fontWeight="bold" mb={0.5}>
            About Service Requests
          </Typography>
          <Typography variant="body2" color={colors.grey[400]}>
            Use <strong>New Request</strong> to request a service pause, reactivation, or account inactivation.
            Use <strong>New Appeal</strong> if your account has been suspended and you want to contest it.
            You can also manage your account status from the{" "}
            <Button size="small" onClick={() => navigate("../account-status")}
              sx={{ color: colors.blueAccent[400], p: 0, minWidth: 0, textDecoration: "underline", fontSize: "0.875rem" }}>
              Account Status
            </Button>{" "}page.
          </Typography>
        </Box>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Status Requests */}
          <Grid item xs={12} lg={7}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">
                Status Change Requests
                {requests.length > 0 && (
                  <Chip label={requests.length} size="small"
                    sx={{ ml: 1, backgroundColor: colors.blueAccent[700], color: "#fff", height: 20 }} />
                )}
              </Typography>
            </Box>

            {requests.length === 0 ? (
              <Card sx={{ backgroundColor: colors.primary[400], p: 3, textAlign: "center" }}>
                <ScheduleIcon sx={{ fontSize: 48, color: colors.grey[600], mb: 1 }} />
                <Typography color={colors.grey[400]} mb={2}>No status requests yet.</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setReqOpen(true)}
                  sx={{ backgroundColor: colors.blueAccent[600] }}>
                  Submit a Request
                </Button>
              </Card>
            ) : (
              requests.map(r => <RequestCard key={r.id} request={r} colors={colors} />)
            )}
          </Grid>

          {/* Appeals */}
          <Grid item xs={12} lg={5}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">
                Appeals
                {appeals.length > 0 && (
                  <Chip label={appeals.length} size="small"
                    sx={{ ml: 1, backgroundColor: colors.redAccent[600], color: "#fff", height: 20 }} />
                )}
              </Typography>
            </Box>

            {appeals.length === 0 ? (
              <Card sx={{ backgroundColor: colors.primary[400], p: 3, textAlign: "center" }}>
                <GavelIcon sx={{ fontSize: 48, color: colors.grey[600], mb: 1 }} />
                <Typography color={colors.grey[400]} mb={2}>No appeals submitted.</Typography>
                <Button variant="outlined" startIcon={<GavelIcon />} onClick={() => setAppOpen(true)}
                  sx={{ borderColor: colors.redAccent[400], color: colors.redAccent[400] }}>
                  Submit an Appeal
                </Button>
              </Card>
            ) : (
              appeals.map(a => <AppealCard key={a.id} appeal={a} colors={colors} />)
            )}
          </Grid>
        </Grid>
      )}

      {/* ── New Request Dialog ── */}
      <Dialog open={reqOpen} onClose={() => setReqOpen(false)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { backgroundColor: "#1F2A40", p: 2 } }}>
        <DialogTitle sx={{ color: "#e0e0e0", fontSize: "1.8rem", fontWeight: "bold", pb: 2 }}>
          Submit Service Request
        </DialogTitle>
        <DialogContent sx={{ overflow: "visible", pt: 1 }}>

          {/* Request Type */}
          <Box mb={3}>
            <Typography sx={{ color: "#c2c2c2", fontSize: "1.5rem", mb: 1, fontWeight: 600 }}>
              Request Type
            </Typography>
            <Box display="flex" flexDirection="column" gap={1.5}>
              {(userStatus?.user?.status === "active" || !userStatus) && (
                <Box
                  onClick={() => setReqType("pause")}
                  sx={{
                    display: "flex", alignItems: "center", gap: 2, p: 2,
                    borderRadius: 2, cursor: "pointer",
                    border: `2px solid ${reqType === "pause" ? "#868dfb" : "#3d3d3d"}`,
                    backgroundColor: reqType === "pause" ? "rgba(134,141,251,0.1)" : "transparent",
                    "&:hover": { borderColor: "#868dfb", backgroundColor: "rgba(134,141,251,0.08)" },
                  }}
                >
                  <PauseCircleIcon sx={{ color: "#868dfb", fontSize: 36 }} />
                  <Box>
                    <Typography sx={{ color: "#e0e0e0", fontSize: "1.5rem", fontWeight: 700 }}>
                      Service Pause
                    </Typography>
                    <Typography sx={{ color: "#858585", fontSize: "1.3rem" }}>
                      Temporarily stop your water service
                    </Typography>
                  </Box>
                </Box>
              )}
              {(userStatus?.can_request_reactivation || userStatus?.user?.status === "inactive") && (
                <Box
                  onClick={() => setReqType("reactivate")}
                  sx={{
                    display: "flex", alignItems: "center", gap: 2, p: 2,
                    borderRadius: 2, cursor: "pointer",
                    border: `2px solid ${reqType === "reactivate" ? "#4cceac" : "#3d3d3d"}`,
                    backgroundColor: reqType === "reactivate" ? "rgba(76,206,172,0.1)" : "transparent",
                    "&:hover": { borderColor: "#4cceac", backgroundColor: "rgba(76,206,172,0.08)" },
                  }}
                >
                  <PlayCircleIcon sx={{ color: "#4cceac", fontSize: 36 }} />
                  <Box>
                    <Typography sx={{ color: "#e0e0e0", fontSize: "1.5rem", fontWeight: 700 }}>
                      Service Reactivation
                    </Typography>
                    <Typography sx={{ color: "#858585", fontSize: "1.3rem" }}>
                      Resume a paused or inactive service
                    </Typography>
                  </Box>
                </Box>
              )}
              {(userStatus?.user?.status === "active" || !userStatus) && (
                <Box
                  onClick={() => setReqType("inactivate")}
                  sx={{
                    display: "flex", alignItems: "center", gap: 2, p: 2,
                    borderRadius: 2, cursor: "pointer",
                    border: `2px solid ${reqType === "inactivate" ? "#f0c040" : "#3d3d3d"}`,
                    backgroundColor: reqType === "inactivate" ? "rgba(240,192,64,0.1)" : "transparent",
                    "&:hover": { borderColor: "#f0c040", backgroundColor: "rgba(240,192,64,0.08)" },
                  }}
                >
                  <CancelIcon sx={{ color: "#f0c040", fontSize: 36 }} />
                  <Box>
                    <Typography sx={{ color: "#e0e0e0", fontSize: "1.5rem", fontWeight: 700 }}>
                      Account Inactivation
                    </Typography>
                    <Typography sx={{ color: "#858585", fontSize: "1.3rem" }}>
                      Deactivate your account
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Reason */}
          <Box mb={3}>
            <Typography sx={{ color: "#c2c2c2", fontSize: "1.5rem", mb: 1, fontWeight: 600 }}>
              Reason *
            </Typography>
            <TextField
              fullWidth multiline rows={5}
              placeholder="Please explain your reason in detail..."
              value={reqReason}
              onChange={e => setReqReason(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#e0e0e0",
                  fontSize: "1.2rem",
                  backgroundColor: "#141b2d",
                  "& fieldset": { borderColor: "#525252" },
                  "&:hover fieldset": { borderColor: "#868dfb" },
                  "&.Mui-focused fieldset": { borderColor: "#868dfb", borderWidth: 2 },
                },
                "& .MuiInputBase-input::placeholder": { color: "#666666", opacity: 1 },
              }}
            />
          </Box>

          {/* Date pickers — only for pause */}
          {reqType === "pause" && (
            <Box mb={3}>
              <Typography sx={{ color: "#c2c2c2", fontSize: "1.5rem", mb: 1.5, fontWeight: 600 }}>
                Service Pause Dates (optional)
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={5.5}> {/* Repeat for both Start and End Date */}
                    <Typography sx={{ color: "#ffffff", fontSize: "1.5rem", mb: 0.5 }}>Start Date</Typography>
                    <DatePicker
                      value={reqStartDate}
                      onChange={(val) => setReqStartDate(val)}
                      format="dd/MM/yyyy"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          placeholder="dd/mm/yyyy"
                          inputProps={{
                            ...params.inputProps,
                            style: { 
                              fontSize: "1.5rem", 
                              color: "#ffffff",           // Changed: Consistent text color
                              padding: "20px 24px" 
                            },
                          }}
                          InputProps={{
                            ...params.InputProps,
                            sx: {
                              backgroundColor: "#141b2d",
                              // [CHANGE 2] Set border color to white consistently
                              "& fieldset": { borderColor: "#ffffff" },
                              "&:hover fieldset": { borderColor: "#868dfb" },
                              "&.Mui-focused fieldset": { borderColor: "#868dfb", borderWidth: 2 },
                              "& .MuiInputAdornment-root .MuiSvgIcon-root": { fontSize: "1.8rem", color: "#ffffff" },
                              // [CHANGE 3] Style placeholder text to be white and fully opaque
                              "& .MuiInputBase-input::placeholder": {
                                color: "#ffffff",
                                opacity: 1 // Ensures visibility in Firefox
                              }
                            },
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5.5}> {/* Repeat for both Start and End Date */}
                    <Typography sx={{ color: "#ffffff", fontSize: "1.5rem", mb: 0.5 }}>End Date</Typography>
                    <DatePicker
                      value={reqEndDate}
                      onChange={(val) => setReqEndDate(val)}
                      format="dd/MM/yyyy"
                      minDate={reqStartDate || undefined}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          placeholder="dd/mm/yyyy"
                          inputProps={{
                            ...params.inputProps,
                            style: { 
                              fontSize: "1.5rem", 
                              color: "#ffffff",           // Changed: Consistent text color
                              padding: "20px 24px" 
                            },
                          }}
                          InputProps={{
                            ...params.InputProps,
                            sx: {
                              backgroundColor: "#141b2d",
                              
                              // ==================== CHANGES START HERE ====================
                              "& fieldset": { 
                                borderColor: "#ffffff"          // Changed: Default border to white
                              },
                              "&:hover fieldset": { 
                                borderColor: "#868dfb" 
                              },
                              "&.Mui-focused fieldset": { 
                                borderColor: "#868dfb", 
                                borderWidth: 2 
                              },
                              "& .MuiInputBase-input::placeholder": { 
                                color: "#ffffff",               // Changed: Placeholder text to white
                                opacity: 1 
                              },
                              "& .MuiInputAdornment-root .MuiSvgIcon-root": { 
                                fontSize: "1.8rem", 
                                color: "#ffffff"                // Changed: Icon color for consistency
                              },
                              // ==================== CHANGES END HERE ====================
                            },
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </LocalizationProvider>
            </Box>
          )}

          {/* Info alert */}
          <Box sx={{ backgroundColor: "rgba(83,90,200,0.15)", border: "1px solid #535ac8",
            borderRadius: 2, p: 2, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <InfoOutlinedIcon sx={{ color: "#868dfb", fontSize: "1.6rem", flexShrink: 0, mt: 0.2 }} />
            <Typography sx={{ color: "#c2c2c2", fontSize: "1.3rem", lineHeight: 1.6 }}>
              Your request will be reviewed by the admin team. You'll receive a notification when it's processed.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 2 }}>
          <Button onClick={() => setReqOpen(false)}
            sx={{ color: "#858585", fontSize: "1.5rem", px: 3, py: 1,
              border: "1px solid #525252", borderRadius: 2,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" } }}>
            Cancel
          </Button>
          <Button variant="contained" disabled={submitting || !reqReason.trim()} onClick={handleSubmitRequest}
            sx={{ backgroundColor: "#535ac8", "&:hover": { backgroundColor: "#3e4396" },
              "&.Mui-disabled": { backgroundColor: "#3d3d3d", color: "#666666" },
              fontSize: "1.5rem", px: 4, py: 1, borderRadius: 2, fontWeight: 700 }}>
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── New Appeal Dialog ── */}
      <Dialog open={appOpen} onClose={() => setAppOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Submit Suspension Appeal</DialogTitle>
        <DialogContent sx={{ overflow: "visible", pt: 2 }}>
          <MuiAlert severity="warning" sx={{ mb: 2 }}>
            Appeals are for contesting account suspensions. If your account was suspended and you believe it was in error, explain your case below.
          </MuiAlert>
          <TextField fullWidth multiline rows={4} label="Reason for Appeal *" value={appReason}
            onChange={e => setAppReason(e.target.value)}
            placeholder="Provide a detailed explanation (minimum 10 characters)..."
            sx={{ mb: 2, mt: 1 }} />
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select value={appPriority} onChange={e => setAppPriority(e.target.value)} label="Priority">
              {["low", "normal", "high", "urgent"].map(p => (
                <MenuItem key={p} value={p}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: PRIORITY_COLORS[p] }} />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={submitting || appReason.length < 10} onClick={handleSubmitAppeal}
            sx={{ backgroundColor: colors.redAccent[600], "&:hover": { backgroundColor: colors.redAccent[700] } }}>
            {submitting ? "Submitting..." : "Submit Appeal"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceRequests;
