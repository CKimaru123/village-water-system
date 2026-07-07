import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Chip,
  TextField, InputAdornment, IconButton, Button, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, Tooltip, Collapse,
} from "@mui/material";
import { tokens } from "../../../theme";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PeopleIcon from "@mui/icons-material/People";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import api from "../../../utils/api";
import useRealTimeUpdates from "../../../../../hooks/useRealTimeUpdates";

// ── helpers ──────────────────────────────────────────────────────────────────

const isPastEvent = (dateStr) => new Date(dateStr) < new Date();

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const daysUntil = (dateStr) => {
  const diff = new Date(dateStr) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 0) return `In ${days} day${days !== 1 ? "s" : ""}`;
  const absDays = Math.abs(days);
  if (absDays === 1) return "Yesterday";
  return `${absDays} days ago`;
};

// Build a Google Calendar URL for the event
const buildGoogleCalendarUrl = (event) => {
  const start = new Date(event.event_date);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour default
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.description || "",
    location: event.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Build an .ics download blob
const buildICSBlob = (event) => {
  const start = new Date(event.event_date);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${event.location || ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Blob([ics], { type: "text/calendar" });
};

const RSVP_OPTIONS = [
  { value: "attending", label: "I will attend", icon: <CheckCircleIcon fontSize="small" /> },
  { value: "not_attending", label: "I cannot attend", icon: <CancelIcon fontSize="small" /> },
  { value: "sending_someone", label: "Sending someone on my behalf", icon: <PersonAddIcon fontSize="small" /> },
];

const RSVP_COLORS = {
  attending: "#4caf50",
  not_attending: "#f44336",
  sending_someone: "#ff9800",
};

// ── EventCard ─────────────────────────────────────────────────────────────────

const EventCard = ({ event, colors, onRsvpSaved }) => {
  const past = isPastEvent(event.event_date);
  const [rsvpStatus, setRsvpStatus] = useState(event.user_rsvp?.status || "");
  const [delegateName, setDelegateName] = useState(event.user_rsvp?.delegate_name || "");
  const [delegateContact, setDelegateContact] = useState(event.user_rsvp?.delegate_contact || "");
  const [rsvpSaving, setRsvpSaving] = useState(false);
  const [rsvpError, setRsvpError] = useState(null);
  const [rsvpSuccess, setRsvpSuccess] = useState(!!event.user_rsvp);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderPhone, setReminderPhone] = useState("");
  const [reminderTiming, setReminderTiming] = useState("1_day");
  const [reminderSaved, setReminderSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleRsvp = async () => {
    if (!rsvpStatus) return;
    setRsvpSaving(true);
    setRsvpError(null);
    try {
      await api.post(`/events/${event.id}/rsvp`, {
        rsvp: {
          status: rsvpStatus,
          delegate_name: rsvpStatus === "sending_someone" ? delegateName : "",
          delegate_contact: rsvpStatus === "sending_someone" ? delegateContact : "",
        },
      });
      setRsvpSuccess(true);
      if (onRsvpSaved) onRsvpSaved();
    } catch (err) {
      setRsvpError(err.response?.data?.errors?.join(", ") || err.message);
    } finally {
      setRsvpSaving(false);
    }
  };

  const handleAddToCalendar = (type) => {
    if (type === "google") {
      window.open(buildGoogleCalendarUrl(event), "_blank");
    } else {
      const blob = buildICSBlob(event);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${event.title.replace(/\s+/g, "_")}.ics`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleSaveReminder = () => {
    // In a real system this would call an API to schedule reminder notifications.
    // For now we store locally and show confirmation.
    setReminderSaved(true);
    setShowReminder(false);
  };

  const rsvpCounts = event.rsvp_counts || {};
  const totalRsvps = Object.values(rsvpCounts).reduce((s, v) => s + v, 0);

  return (
    <Card sx={{
      backgroundColor: colors.primary[400],
      opacity: past ? 0.75 : 1,
      border: `1px solid ${past ? colors.grey[700] : colors.blueAccent[700]}`,
      borderRadius: 2,
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: past ? "none" : "0 4px 20px rgba(0,0,0,0.4)" },
    }}>
      <CardContent sx={{ p: 2.5 }}>

        {/* ── Header row ── */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1} flex={1} minWidth={0}>
            <EventIcon sx={{ color: past ? colors.grey[500] : colors.blueAccent[400], flexShrink: 0 }} />
            <Typography variant="h5" color={colors.grey[100]}
              sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              {event.title}
            </Typography>
          </Box>
          <Box display="flex" gap={0.5} flexShrink={0} ml={1} flexWrap="wrap" justifyContent="flex-end">
            {event.event_type && (
              <Chip label={event.event_type.replace(/_/g, " ").toUpperCase()} size="small"
                sx={{ backgroundColor: colors.blueAccent[700], color: "#fff", fontSize: 10 }} />
            )}
            <Chip
              label={past ? "Past Event" : daysUntil(event.event_date)}
              size="small"
              sx={{
                backgroundColor: past ? colors.grey[700] : colors.greenAccent[700],
                color: "#fff", fontSize: 10,
              }}
            />
            {rsvpSuccess && rsvpStatus && (
              <Chip
                label={RSVP_OPTIONS.find(o => o.value === rsvpStatus)?.label || rsvpStatus}
                size="small"
                sx={{ backgroundColor: RSVP_COLORS[rsvpStatus] || colors.blueAccent[700], color: "#fff", fontSize: 10 }}
              />
            )}
          </Box>
        </Box>

        {/* ── Description ── */}
        {event.description && (
          <Typography color={colors.grey[300]} variant="body2" mb={1.5} sx={{ lineHeight: 1.6 }}>
            {event.description}
          </Typography>
        )}

        {/* ── Date / Location row ── */}
        <Box display="flex" gap={3} flexWrap="wrap" mb={1.5}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <CalendarTodayIcon sx={{ fontSize: 15, color: colors.grey[400] }} />
            <Typography variant="caption" color={colors.grey[300]}>
              {formatDate(event.event_date)} · {formatTime(event.event_date)}
            </Typography>
          </Box>
          {event.location && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <LocationOnIcon sx={{ fontSize: 15, color: colors.grey[400] }} />
              <Typography variant="caption" color={colors.grey[300]}>{event.location}</Typography>
            </Box>
          )}
          {event.max_attendees && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <PeopleIcon sx={{ fontSize: 15, color: colors.grey[400] }} />
              <Typography variant="caption" color={colors.grey[400]}>
                Max {event.max_attendees} attendees
                {totalRsvps > 0 && ` · ${rsvpCounts.attending || 0} confirmed`}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderColor: colors.grey[700], mb: 1.5 }} />

        {/* ── Action buttons ── */}
        {!past && (
          <Box display="flex" gap={1} flexWrap="wrap" mb={expanded ? 1.5 : 0}>
            <Button size="small" variant="outlined" startIcon={<CalendarTodayIcon />}
              onClick={() => handleAddToCalendar("google")}
              sx={{ color: colors.blueAccent[300], borderColor: colors.blueAccent[700], fontSize: 11 }}>
              Google Calendar
            </Button>
            <Button size="small" variant="outlined" startIcon={<CalendarTodayIcon />}
              onClick={() => handleAddToCalendar("ics")}
              sx={{ color: colors.blueAccent[300], borderColor: colors.blueAccent[700], fontSize: 11 }}>
              Download .ics
            </Button>
            <Button size="small" variant="outlined" startIcon={<NotificationsActiveIcon />}
              onClick={() => setShowReminder(true)}
              sx={{
                color: reminderSaved ? "#4caf50" : colors.grey[300],
                borderColor: reminderSaved ? "#4caf50" : colors.grey[600],
                fontSize: 11,
              }}>
              {reminderSaved ? "Reminder Set" : "Set Reminder"}
            </Button>
            <Button size="small" variant="text"
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setExpanded(v => !v)}
              sx={{ color: colors.grey[400], fontSize: 11, ml: "auto" }}>
              {rsvpSuccess ? "Update RSVP" : "RSVP"}
            </Button>
          </Box>
        )}

        {/* ── RSVP panel ── */}
        {!past && (
          <Collapse in={expanded}>
            <Box sx={{ backgroundColor: colors.primary[300], borderRadius: 1, p: 2, mt: 1 }}>
              <Typography variant="body2" color={colors.grey[200]} mb={1.5} fontWeight={600}>
                Confirm your attendance
              </Typography>

              {rsvpError && (
                <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setRsvpError(null)}>
                  {rsvpError}
                </Alert>
              )}

              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel sx={{ color: colors.grey[400] }}>Attendance</InputLabel>
                <Select value={rsvpStatus} onChange={e => setRsvpStatus(e.target.value)} label="Attendance">
                  {RSVP_OPTIONS.map(o => (
                    <MenuItem key={o.value} value={o.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ color: RSVP_COLORS[o.value] }}>{o.icon}</Box>
                        {o.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {rsvpStatus === "sending_someone" && (
                <Box display="flex" gap={1} mb={1.5}>
                  <TextField size="small" label="Delegate name *" value={delegateName}
                    onChange={e => setDelegateName(e.target.value)} sx={{ flex: 1 }} />
                  <TextField size="small" label="Delegate contact" value={delegateContact}
                    onChange={e => setDelegateContact(e.target.value)} sx={{ flex: 1 }} />
                </Box>
              )}

              <Button variant="contained" size="small" disabled={!rsvpStatus || rsvpSaving}
                onClick={handleRsvp}
                sx={{ backgroundColor: colors.blueAccent[600] }}>
                {rsvpSaving ? "Saving..." : rsvpSuccess ? "Update RSVP" : "Confirm RSVP"}
              </Button>

              {rsvpSuccess && (
                <Typography variant="caption" color="#4caf50" ml={1.5}>
                  ✓ Receipt confirmed
                </Typography>
              )}
            </Box>
          </Collapse>
        )}

        {/* Past event note */}
        {past && (
          <Typography variant="caption" color={colors.grey[500]} fontStyle="italic">
            This event has already taken place.
            {event.user_rsvp && ` You had RSVP'd as: ${RSVP_OPTIONS.find(o => o.value === event.user_rsvp.status)?.label || event.user_rsvp.status}.`}
          </Typography>
        )}
      </CardContent>

      {/* ── Reminder Dialog ── */}
      <Dialog open={showReminder} onClose={() => setShowReminder(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Set Event Reminder</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color={colors.grey[300]} mb={2}>
            We'll remind you about <strong style={{ color: colors.grey[100] }}>{event.title}</strong>.
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Remind me</InputLabel>
            <Select value={reminderTiming} onChange={e => setReminderTiming(e.target.value)} label="Remind me">
              <MenuItem value="2_hours">2 hours before</MenuItem>
              <MenuItem value="1_day">1 day before</MenuItem>
              <MenuItem value="daily">Every day until the event</MenuItem>
              <MenuItem value="1_week">1 week before</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth size="small" label="Email (optional)" value={reminderEmail}
            onChange={e => setReminderEmail(e.target.value)} sx={{ mb: 2 }}
            placeholder="your@email.com" />
          <TextField fullWidth size="small" label="Phone / WhatsApp (optional)" value={reminderPhone}
            onChange={e => setReminderPhone(e.target.value)}
            placeholder="+254 7XX XXX XXX" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReminder(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveReminder}
            sx={{ backgroundColor: colors.blueAccent[600] }}>
            Save Reminder
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const Events = () => {
  const colors = tokens("dark");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get("/events"),
      api.get("/events?past=true"),
    ])
      .then(([upRes, pastRes]) => {
        const upcoming = upRes.data?.data?.events || upRes.data?.events || [];
        const past = pastRes.data?.data?.events || pastRes.data?.events || [];
        // Deduplicate by id
        const seen = new Set();
        const all = [...upcoming, ...past].filter(e => {
          if (seen.has(e.id)) return false;
          seen.add(e.id);
          return true;
        });
        setEvents(all);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleNewNotification = useCallback((data) => {
    if (data?.notification?.category === "community") load();
  }, [load]);

  useRealTimeUpdates(null, null, null, { onNewNotification: handleNewNotification });

  const filtered = events.filter(e =>
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.location?.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase())
  );

  const upcoming = filtered.filter(e => !isPastEvent(e.event_date));
  const past = filtered.filter(e => isPastEvent(e.event_date));

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="5px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Events & Meetings</Typography>
        <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }} title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Box>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">
        Community events and water authority activities
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <TextField
        placeholder="Search events..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 3, width: 320 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: colors.grey[400] }} />
            </InputAdornment>
          ),
        }}
      />

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      )}

      {!loading && upcoming.length > 0 && (
        <>
          <Typography variant="h5" color={colors.grey[200]} mb={2}>Upcoming Events</Typography>
          {upcoming.map(e => (
            <Box key={e.id} mb={2}>
              <EventCard event={e} colors={colors} onRsvpSaved={load} />
            </Box>
          ))}
        </>
      )}

      {!loading && past.length > 0 && (
        <>
          <Typography variant="h5" color={colors.grey[500]} mb={2}>Past Events</Typography>
          {past.map(e => (
            <Box key={e.id} mb={2}>
              <EventCard event={e} colors={colors} onRsvpSaved={load} />
            </Box>
          ))}
        </>
      )}

      {!loading && filtered.length === 0 && !error && (
        <Alert severity="info">No events found.</Alert>
      )}
    </Box>
  );
};

export default Events;
