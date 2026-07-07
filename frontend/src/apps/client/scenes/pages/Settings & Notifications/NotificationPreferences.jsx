import React, { useState } from "react";
import {
  Box, Typography, Card, CardContent, Switch, Button, CircularProgress,
  Alert, Divider, Tabs, Tab, Chip, IconButton, Tooltip, Badge,
  List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
  TextField, InputAdornment, Select, MenuItem, FormControl,
  Grid, Paper, Avatar,
} from "@mui/material";
import { tokens } from "../../../theme";
import { useNotificationsContext } from "../../../../../context/NotificationsContext";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import PaymentIcon from "@mui/icons-material/Payment";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import CampaignIcon from "@mui/icons-material/Campaign";
import EventIcon from "@mui/icons-material/Event";
import BuildIcon from "@mui/icons-material/Build";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CircleIcon from "@mui/icons-material/Circle";
import EmailIcon from "@mui/icons-material/Email";
import SmsIcon from "@mui/icons-material/Sms";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SummarizeIcon from "@mui/icons-material/Summarize";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import NightsStayIcon from "@mui/icons-material/NightsStay";

function TabPanel({ children, value, index }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

const NOTIF_TYPES = [
  { key: "billing_alerts",   label: "Billing Alerts",       desc: "Invoice due dates, payment confirmations", icon: <PaymentIcon />,    color: "#6870fa" },
  { key: "usage_alerts",     label: "Usage Alerts",         desc: "High consumption and leak notifications",  icon: <WaterDropIcon />,  color: "#4db6e4" },
  { key: "announcements",    label: "Announcements",        desc: "News and updates from the water authority", icon: <CampaignIcon />,  color: "#4cceac" },
  { key: "events",           label: "Events",               desc: "Upcoming community events",                icon: <EventIcon />,      color: "#f0a500" },
  { key: "maintenance",      label: "Maintenance Notices",  desc: "Planned outages and service interruptions", icon: <BuildIcon />,     color: "#e05c5c" },
  { key: "promotions",       label: "Promotions",           desc: "Special offers and marketplace deals",     icon: <LocalOfferIcon />, color: "#a78bfa" },
];

const CHANNELS = [
  { key: "email",     label: "Email",     icon: <EmailIcon fontSize="small" />,       color: "#6870fa" },
  { key: "sms",       label: "SMS",       icon: <SmsIcon fontSize="small" />,         color: "#4cceac" },
  { key: "whatsapp",  label: "WhatsApp",  icon: <WhatsAppIcon fontSize="small" />,    color: "#25D366" },
  { key: "in_app",    label: "In-App",    icon: <PhoneAndroidIcon fontSize="small" />, color: "#4db6e4" },
];

const DIGEST_OPTIONS = [
  { value: "immediate", label: "Immediately" },
  { value: "daily",     label: "Daily Digest" },
  { value: "weekly",    label: "Weekly Digest" },
];

const CATEGORY_ICON = {
  billing: <PaymentIcon fontSize="small" />,
  usage: <WaterDropIcon fontSize="small" />,
  announcement: <CampaignIcon fontSize="small" />,
  event: <EventIcon fontSize="small" />,
  maintenance: <BuildIcon fontSize="small" />,
  promotion: <LocalOfferIcon fontSize="small" />,
};

const CATEGORY_COLOR = {
  billing: "#6870fa", usage: "#4db6e4", announcement: "#4cceac",
  event: "#f0a500", maintenance: "#e05c5c", promotion: "#a78bfa",
};

const NotificationPreferences = () => {
  const colors = tokens("dark");
  const {
    notifications, unreadCount, loading,
    preferences, prefsLoading,
    fetchNotifications, markAsRead, markAllAsRead,
    deleteNotification, savePreferences, playSound, isQuietHours,
  } = useNotificationsContext();

  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [localPrefs, setLocalPrefs] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifSound, setNotifSound] = useState(
    localStorage.getItem("notif_sound") !== "false"
  );

  // Initialise localPrefs from context once loaded
  const prefs = localPrefs ?? preferences;

  // Whether we are currently in quiet hours (live check)
  const quietNow = isQuietHours(prefs);

  const togglePref = (key) => setLocalPrefs(p => ({ ...(p ?? preferences), [key]: !(p ?? preferences)[key] }));
  const toggleChannel = (type, channel) => {
    const channelKey = `${type}_${channel}`;
    setLocalPrefs(p => ({ ...(p ?? preferences), [channelKey]: !(p ?? preferences)[channelKey] }));
  };

  const handleSavePrefs = async () => {
    setSaving(true); setSaveError(null); setSaveSuccess(false);
    try {
      await savePreferences(prefs);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const toggleSound = () => {
    const next = !notifSound;
    setNotifSound(next);
    localStorage.setItem("notif_sound", String(next));
  };

  const testSound = () => {
    // Temporarily bypass quiet hours for the test button
    const audio = new Audio("/assets/notification.wav");
    audio.volume = 0.6;
    audio.play().catch(() => {});
  };

  // ── Inbox filtering ───────────────────────────────────────────────────────
  const filtered = notifications.filter(n => {
    const matchType = filterType === "all" || n.notification_type === filterType || n.category === filterType;
    const q = search.toLowerCase();
    const matchSearch = !q || n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const timeAgo = (ts) => {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const catColor = (n) => CATEGORY_COLOR[n.notification_type] || CATEGORY_COLOR[n.category] || colors.blueAccent[400];
  const catIcon  = (n) => CATEGORY_ICON[n.notification_type]  || CATEGORY_ICON[n.category]  || <NotificationsIcon fontSize="small" />;

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Notifications</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Manage your notification inbox and preferences</Typography>
        </Box>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsActiveIcon sx={{ fontSize: 32, color: colors.blueAccent[400] }} />
        </Badge>
      </Box>

      <Paper sx={{ bgcolor: colors.primary[400], mb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
          borderBottom: `1px solid ${colors.primary[300]}`,
          "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
          "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
          "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
        }}>
          <Tab label={
            <Box display="flex" alignItems="center" gap={0.5}>
              Inbox
              {unreadCount > 0 && <Chip label={unreadCount} size="small" color="error" sx={{ height: 18, fontSize: "0.65rem" }} />}
            </Box>
          } />
          <Tab label="Preferences" />
        </Tabs>

        {/* ── TAB 0: INBOX ─────────────────────────────────────────────────── */}
        <TabPanel value={tab} index={0}>
          <Box p={2}>
            {/* Toolbar */}
            <Box display="flex" gap={1.5} mb={2} flexWrap="wrap" alignItems="center">
              <TextField
                placeholder="Search notifications…"
                value={search} onChange={e => setSearch(e.target.value)}
                size="small" sx={{
                  flex: 1, minWidth: 200,
                  "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } },
                }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[500], fontSize: 18 }} /></InputAdornment> }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select value={filterType} onChange={e => setFilterType(e.target.value)}
                  sx={{ color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] }, "& .MuiSelect-icon": { color: colors.grey[400] } }}>
                  <MenuItem value="all">All Types</MenuItem>
                  {NOTIF_TYPES.map(t => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
              <Tooltip title="Mark all read">
                <span>
                  <IconButton onClick={markAllAsRead} disabled={unreadCount === 0} sx={{ color: colors.greenAccent[400] }}>
                    <DoneAllIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchNotifications} sx={{ color: colors.blueAccent[400] }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {loading && <Box display="flex" justifyContent="center" py={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>}

            {!loading && filtered.length === 0 && (
              <Box textAlign="center" py={6}>
                <NotificationsOffIcon sx={{ fontSize: 48, color: colors.grey[600], mb: 1 }} />
                <Typography color={colors.grey[500]}>
                  {search || filterType !== "all" ? "No notifications match your filter." : "You're all caught up!"}
                </Typography>
              </Box>
            )}

            {!loading && filtered.length > 0 && (
              <List disablePadding>
                {filtered.map((n, i) => (
                  <React.Fragment key={n.id}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        borderRadius: 1, mb: 0.5, cursor: "pointer",
                        bgcolor: n.read ? "transparent" : `${catColor(n)}11`,
                        border: `1px solid ${n.read ? colors.primary[300] : catColor(n) + "44"}`,
                        "&:hover": { bgcolor: colors.primary[300] },
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => !n.read && markAsRead(n.id)}
                    >
                      <ListItemIcon sx={{ mt: 0.5, minWidth: 36 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: catColor(n) + "33", color: catColor(n) }}>
                          {catIcon(n)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            {!n.read && <CircleIcon sx={{ fontSize: 8, color: catColor(n) }} />}
                            <Typography variant="body2" fontWeight={n.read ? 400 : 600} color={colors.grey[100]}>
                              {n.title}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color={colors.grey[400]} display="block">
                              {n.message}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mt={0.3}>
                              <AccessTimeIcon sx={{ fontSize: 11, color: colors.blueAccent[600] }} />
                              <Typography variant="caption" color={colors.white}>{timeAgo(n.created_at)}</Typography>
                              {n.notification_type && (
                                <Chip label={n.notification_type} size="small"
                                  sx={{ height: 16, fontSize: "0.6rem", bgcolor: catColor(n) + "22", color: catColor(n) }} />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                            sx={{ color: colors.grey[600], "&:hover": { color: colors.redAccent[400] } }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {i < filtered.length - 1 && <Divider sx={{ borderColor: colors.primary[300] }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>

        {/* ── TAB 1: PREFERENCES ───────────────────────────────────────────── */}
        <TabPanel value={tab} index={1}>
          <Box p={2}>
            {saveError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>{saveError}</Alert>}
            {saveSuccess && <Alert severity="success" sx={{ mb: 2 }}>Preferences saved.</Alert>}

            {/* Sound & Digest */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ bgcolor: colors.primary[500], border: `1px solid ${colors.primary[300]}` }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {notifSound ? <VolumeUpIcon sx={{ color: colors.blueAccent[400] }} /> : <VolumeOffIcon sx={{ color: colors.grey[500] }} />}
                        <Box>
                          <Typography variant="body2" color={colors.grey[100]} fontWeight={600}>Notification Sound</Typography>
                          <Typography variant="caption" color={colors.grey[400]}>Play a sound for new notifications</Typography>
                        </Box>
                      </Box>
                      <Switch checked={notifSound} onChange={toggleSound} color="primary" />
                    </Box>
                    {notifSound && (
                      <Button size="small" startIcon={<PlayArrowIcon />} onClick={testSound}
                        variant="outlined" sx={{ color: colors.blueAccent[300], borderColor: colors.blueAccent[700], fontSize: "0.75rem" }}>
                        Test Sound
                      </Button>
                    )}
                    {quietNow && notifSound && (
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                        <NightsStayIcon sx={{ fontSize: 13, color: colors.grey[500] }} />
                        <Typography variant="caption" color={colors.grey[500]}>Muted — quiet hours active</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card sx={{ bgcolor: colors.primary[500], border: `1px solid ${colors.primary[300]}` }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <SummarizeIcon sx={{ color: colors.blueAccent[400] }} />
                      <Typography variant="body2" color={colors.grey[100]} fontWeight={600}>Digest Frequency</Typography>
                    </Box>
                    <FormControl fullWidth size="small">
                      <Select value={prefs.digest_frequency || "immediate"}
                        onChange={e => setLocalPrefs(p => ({ ...(p ?? preferences), digest_frequency: e.target.value }))}
                        sx={{ color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] }, "& .MuiSelect-icon": { color: colors.grey[400] } }}>
                        {DIGEST_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Quiet Hours */}
            <Card sx={{ bgcolor: colors.primary[500], border: `1px solid ${colors.primary[300]}`, mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccessTimeIcon sx={{ color: colors.blueAccent[400] }} />
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color={colors.grey[100]} fontWeight={600}>Quiet Hours</Typography>
                        {prefs.quiet_hours_enabled && quietNow && (
                          <Chip icon={<NightsStayIcon sx={{ fontSize: 12 }} />} label="Active now"
                            size="small" color="info"
                            sx={{ height: 18, fontSize: "0.6rem", "& .MuiChip-label": { px: 0.8 } }} />
                        )}
                      </Box>
                      <Typography variant="caption" color={colors.grey[400]}>
                        Suppress all sounds and in-app popups during these hours
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={!!prefs.quiet_hours_enabled}
                    onChange={() => togglePref("quiet_hours_enabled")}
                    color="primary"
                  />
                </Box>
                {prefs.quiet_hours_enabled && (
                  <Box>
                    <Box display="flex" gap={2} mt={1}>
                      <TextField label="From" type="time" size="small"
                        value={prefs.quiet_hours_from || "22:00"}
                        onChange={e => setLocalPrefs(p => ({ ...(p ?? preferences), quiet_hours_from: e.target.value }))}
                        InputLabelProps={{ shrink: true, sx: { color: colors.grey[400] } }}
                        sx={{ "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } } }} />
                      <TextField label="To" type="time" size="small"
                        value={prefs.quiet_hours_to || "07:00"}
                        onChange={e => setLocalPrefs(p => ({ ...(p ?? preferences), quiet_hours_to: e.target.value }))}
                        InputLabelProps={{ shrink: true, sx: { color: colors.grey[400] } }}
                        sx={{ "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } } }} />
                    </Box>
                    <Typography variant="caption" color={colors.grey[500]} display="block" mt={1}>
                      {quietNow
                        ? `🌙 Quiet hours are active right now (${prefs.quiet_hours_from || "22:00"} – ${prefs.quiet_hours_to || "07:00"}). Sounds and popups are suppressed.`
                        : `Sounds and popups will be suppressed from ${prefs.quiet_hours_from || "22:00"} to ${prefs.quiet_hours_to || "07:00"}.`}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Per-type per-channel matrix */}
            <Typography variant="h6" color={colors.grey[100]} fontWeight={600} mb={1.5}>
              Notification Types & Channels
            </Typography>
            <Card sx={{ bgcolor: colors.primary[500], border: `1px solid ${colors.primary[300]}` }}>
              <CardContent sx={{ p: 0 }}>
                {/* Header row */}
                <Box display="flex" alignItems="center" px={2} py={1}
                  sx={{ borderBottom: `1px solid ${colors.primary[300]}`, bgcolor: colors.primary[400] }}>
                  <Box flex={1} />
                  {CHANNELS.map(ch => (
                    <Box key={ch.key} width={72} textAlign="center">
                      <Box display="flex" flexDirection="column" alignItems="center" gap={0.3}>
                        <Box sx={{ color: ch.color }}>{ch.icon}</Box>
                        <Typography variant="caption" color={colors.grey[400]}>{ch.label}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {NOTIF_TYPES.map((type, i) => (
                  <React.Fragment key={type.key}>
                    <Box display="flex" alignItems="center" px={2} py={1.2}>
                      <Box flex={1} display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: type.color + "22", color: type.color }}>
                          {type.icon}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color={colors.grey[100]} fontWeight={500}>{type.label}</Typography>
                          <Typography variant="caption" color={colors.grey[500]}>{type.desc}</Typography>
                        </Box>
                      </Box>
                      {CHANNELS.map(ch => (
                        <Box key={ch.key} width={72} display="flex" justifyContent="center">
                          <Switch
                            size="small"
                            checked={!!(prefs[`${type.key}_${ch.key}`] ?? (ch.key === "in_app"))}
                            onChange={() => toggleChannel(type.key, ch.key)}
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": { color: ch.color },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: ch.color + "99" },
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                    {i < NOTIF_TYPES.length - 1 && <Divider sx={{ borderColor: colors.primary[300] }} />}
                  </React.Fragment>
                ))}
              </CardContent>
            </Card>

            <Box mt={3} display="flex" justifyContent="flex-end">
              <Button variant="contained" disabled={saving || prefsLoading} onClick={handleSavePrefs}
                sx={{ bgcolor: colors.blueAccent[600], "&:hover": { bgcolor: colors.blueAccent[700] } }}>
                {saving ? "Saving…" : "Save Preferences"}
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default NotificationPreferences;
