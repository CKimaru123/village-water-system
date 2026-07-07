// import { Box, IconButton, useTheme } from "@mui/material";
// import { useContext } from "react";
// import { ColorModeContext, tokens } from "../../theme";
// import InputBase from "@mui/material/InputBase";
// import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
// import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
// import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
// import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
// import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
// import SearchIcon from "@mui/icons-material/Search";

// const Topbar = () => {
//   const theme = useTheme();
//   const colors = tokens(theme.palette.mode);
//   const colorMode = useContext(ColorModeContext);

//   return (
//     <Box display="flex" justifyContent="space-between" p={2}>
//       {/* SEARCH BAR */}
//       <Box
//         display="flex"
//         backgroundColor={colors.primary[400]}
//         borderRadius="3px"
//       >
//         <InputBase sx={{ ml: 2, flex: 1 }} placeholder="Search" />
//         <IconButton type="button" sx={{ p: 1 }}>
//           <SearchIcon />
//         </IconButton>
//       </Box>

//       {/* ICONS */}
//       <Box display="flex">
//         <IconButton onClick={colorMode.toggleColorMode}>
//           {theme.palette.mode === "dark" ? (
//             <DarkModeOutlinedIcon />
//           ) : (
//             <LightModeOutlinedIcon />
//           )}
//         </IconButton>
//         <IconButton>
//           <NotificationsOutlinedIcon />
//         </IconButton>
//         <IconButton>
//           <SettingsOutlinedIcon />
//         </IconButton>
//         <IconButton>
//           <PersonOutlinedIcon />
//         </IconButton>
//       </Box>
//     </Box>
//   );
// };

// export default Topbar;


import React, { useContext, useState, useEffect, useRef } from "react";
import {
  Box,
  IconButton,
  useTheme,
  InputBase,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Badge,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Chip,
  CircularProgress,
} from "@mui/material";
import { ColorModeContext, tokens } from "../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import MarkAsUnreadIcon from "@mui/icons-material/MarkAsUnread";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // 🌍 Added for translations
import { useAuth } from "../../../../hooks/useAuth"; // Import useAuth hook
import { useNotificationsContext } from "../../../../context/NotificationsContext";

const pagesIndex = [
  { name: "Dashboard", path: "" },
  { name: "Tariff Management", path: "tariff" },
  { name: "Invoice Generation", path: "invoice-generation" },
  { name: "Dunning Workflow", path: "dunning" },
  { name: "Deposits & Connection Fees", path: "deposits" },
  { name: "Refund/Reversal Approvals", path: "refunds" },
  { name: "Reconciliation", path: "reconciliation" },
  { name: "Financial Reports", path: "financial-reports" },
  { name: "Subsidy/Waiver Programs", path: "subsidy" },
  { name: "Document Generator", path: "document-generator" },
  { name: "Export Tools", path: "export-tools" },
  { name: "Asset Register", path: "assets" },
  { name: "Preventive Maintenance", path: "maintenance" },
  { name: "Incident Management", path: "incidents" },
  { name: "GIS Map", path: "gis-map" },
  { name: "Valve Operations & Rationing", path: "valves" },
  { name: "Inventory & Spares", path: "inventory" },
  { name: "Energy & Fuel Tracking", path: "energy" },
  { name: "SCADA Integration", path: "scada" },
  { name: "Carbon Footprint Analysis", path: "carbon-footprint-analysis" },
];

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // 🌍 Translation hook
  const { user } = useAuth(); // Get authenticated user data

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [noResults, setNoResults] = useState(false);

  // ── Single active panel — only one dropdown open at a time ──────────────
  // null | "notif" | "settings" | "user"
  const [activePanel, setActivePanel] = useState(null);

  const openNotif     = activePanel === "notif";
  const openSettings  = activePanel === "settings";
  const openUserMenu  = activePanel === "user";

  const togglePanel = (name) =>
    setActivePanel((prev) => (prev === name ? null : name));

  const toggleNotif    = () => togglePanel("notif");
  const toggleSettings = () => togglePanel("settings");
  const setOpenNotif     = (v) => setActivePanel(v ? "notif"    : null);
  const setOpenSettings  = (v) => setActivePanel(v ? "settings" : null);
  const setOpenUserMenu  = (v) => setActivePanel(v ? "user"     : null);

  // -------------------------
  // 🔔 Dynamic Notifications
  // -------------------------
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationsContext();

  // ── Notification detail dialog ───────────────────────────────────────────
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [openNotifDetail, setOpenNotifDetail] = useState(false);
  const notifRef = useRef(null);

  // Timer to update relative timestamps
  const [, setTimerTick] = useState(0);

  // Update timestamps every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick(tick => tick + 1);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Function to calculate relative time
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  const handleNotifClick = (notif) => {
    setSelectedNotif(notif);
    if (!notif.read) {
      markAsRead(notif.id);
    }
    setOpenNotif(false);
    setOpenNotifDetail(true);
  };

  const handleNotifMarkUnread = () => {
    if (!selectedNotif) return;
    // Note: We'd need to implement mark as unread in the backend
    // For now, we'll just close the dialog
    setOpenNotifDetail(false);
  };

  const handleNotifDelete = () => {
    if (!selectedNotif) return;
    deleteNotification(selectedNotif.id);
    setOpenNotifDetail(false);
    setSelectedNotif(null);
  };

  const handleNotifNavigate = () => {
    if (selectedNotif && selectedNotif.action_url) {
      navigate(selectedNotif.action_url);
      setOpenNotifDetail(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return colors.redAccent[500];
      case 'high': return colors.redAccent[400];
      case 'normal': return colors.blueAccent[500];
      case 'low': return colors.greenAccent[500];
      default: return colors.grey[500];
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'profile': return '👤';
      case 'billing': return '💰';
      case 'service': return '🔧';
      case 'system': return '⚙️';
      case 'meeting': return '📅';
      default: return '📢';
    }
  };

  const settingsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInNotif = notifRef.current && notifRef.current.contains(e.target);
      const clickedInSettings = settingsRef.current && settingsRef.current.contains(e.target);
      const clickedInUserMenu = userMenuRef && userMenuRef.current && userMenuRef.current.contains(e.target);
      if (!clickedInNotif && !clickedInSettings && !clickedInUserMenu) {
        setOpenNotif(false);
        setOpenSettings(false);
        setOpenUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Settings state ───────────────────────────────────────────────────────
  const [openLangDialog, setOpenLangDialog] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en");
  const [notificationSounds, setNotificationSounds] = useState(
    localStorage.getItem("notificationSounds") !== "false"
  );
  const [compactSidebar, setCompactSidebar] = useState(
    localStorage.getItem("compactSidebar") === "true"
  );

  useEffect(() => {
    i18n.changeLanguage(language); // 🌍 ensure app reflects saved language
  }, [language, i18n]);

  // ✅ Clear previous highlights
  const clearHighlights = () => {
    const marks = document.querySelectorAll("mark.page-highlight");
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  };

  const highlightMatches = (term) => {
    if (!term) return;
    clearHighlights();
    const body = document.body;
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null, false);
    const regex = new RegExp(term, "gi");
    let node;
    while ((node = walker.nextNode())) {
      if (regex.test(node.nodeValue)) {
        const range = document.createRange();
        const matchIndex = node.nodeValue.toLowerCase().indexOf(term.toLowerCase());
        if (matchIndex === -1) continue;
        range.setStart(node, matchIndex);
        range.setEnd(node, matchIndex + term.length);
        const mark = document.createElement("mark");
        mark.className = "page-highlight";
        mark.style.backgroundColor = "yellow";
        mark.style.fontWeight = "bold";
        range.surroundContents(mark);
      }
    }
  };

  const handleChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    clearHighlights();
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const filtered = pagesIndex.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(filtered);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    const query = searchTerm.toLowerCase();
    const currentPageText = document.body.innerText.toLowerCase();
    clearHighlights();
    if (currentPageText.includes(query)) {
      highlightMatches(searchTerm);
      setSuggestions([]);
      setNoResults(false);
      return;
    }
    const matched = pagesIndex.find((p) => p.name.toLowerCase().includes(query));
    if (matched) {
      navigate(matched.path);
      setSuggestions([]);
      setNoResults(false);
    } else {
      setSuggestions([]);
      setNoResults(true);
    }
  };

  const handleSuggestionClick = (page) => {
    navigate(page.path);
    setSearchTerm("");
    setSuggestions([]);
    setNoResults(false);
  };

  useEffect(() => {
    return () => clearHighlights();
  }, []);

  // ── User menu state ──────────────────────────────────────────────────────
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!user); // Check if user is authenticated
  const [profile, setProfile] = useState({
    name: user ? user.display_name || `${user.first_name} ${user.last_name}` : "Guest User",
    email: user ? user.email || user.phone : "guest@example.com",
  });
  const userMenuRef = useRef(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    localStorage.getItem("twoFactorEnabled") === "true"
  );
  const [marketingEmails, setMarketingEmails] = useState(
    localStorage.getItem("marketingEmails") !== "false"
  );
  const [accountPrivate, setAccountPrivate] = useState(
    localStorage.getItem("accountPrivate") === "true"
  );

  // Update profile when user data changes
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.display_name || user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
        email: user.email || user.phone || 'No email',
      });
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [user]);

  // Handlers
  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", "true");
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    try {
      const token = user.token || localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3001/api/v1/auth/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: {
            first_name: profile.name.split(' ')[0],
            last_name: profile.name.split(' ').slice(1).join(' '),
            email: profile.email
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.user) {
          setProfile({
            name: result.data.user.display_name || `${result.data.user.first_name} ${result.data.user.last_name}`,
            email: result.data.user.email || result.data.user.phone,
          });
        }
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const handleLogout = () => {
    // Use the same logout event system as the removed button
    const event = new CustomEvent('logoutDashboard');
    window.dispatchEvent(event);
  };

  return (
    <Box display="flex" justifyContent="space-between" p={2} position="relative">
      {/* SEARCH BAR */}
      <Box
        display="flex"
        backgroundColor={colors.primary[400]}
        borderRadius="8px"
        position="relative"
        width="350px"
      >
        <InputBase
          sx={{ ml: 2, flex: 1, color: colors.grey[100] }}
          placeholder={t("searchPlaceholder")}
          value={searchTerm}
          onChange={handleChange}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <IconButton type="button" sx={{ p: 1 }} onClick={handleSearch}>
          <SearchIcon />
        </IconButton>

        {(suggestions.length > 0 || noResults) && (
          <Paper
            sx={{
              position: "absolute",
              top: "45px",
              left: 0,
              width: "100%",
              backgroundColor: colors.primary[400],
              zIndex: 100,
              borderRadius: "8px",
              boxShadow: 4,
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            <List dense>
              {suggestions.map((s, i) => (
                <ListItem key={i} disablePadding>
                  <ListItemButton onClick={() => handleSuggestionClick(s)}>
                    <ListItemText
                      primary={s.name}
                      primaryTypographyProps={{
                        sx: { color: colors.grey[100], fontSize: "0.9rem" },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {noResults && suggestions.length === 0 && (
                <Typography variant="body2" color="error" textAlign="center" sx={{ p: 1 }}>
                  {t("noResults") || "No matching results found."}
                </Typography>
              )}
            </List>
          </Paper>
        )}
      </Box>

      {/* ICONS */}
      <Box display="flex" position="relative" ref={notifRef}>
        {/* Theme Toggle */}
        <IconButton onClick={colorMode.toggleColorMode} sx={{ p: 1 }}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon sx={{ fontSize: 26 }} />
          ) : (
            <LightModeOutlinedIcon sx={{ fontSize: 26 }} />
          )}
        </IconButton>

        {/* 🔔 Notifications */}
        <IconButton onClick={toggleNotif} sx={{ p: 1 }}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsOutlinedIcon sx={{ fontSize: 26 }} />
          </Badge>
        </IconButton>

        {/* 🏠 Back to Site Button */}
        <IconButton 
          onClick={() => {
            // This will be handled by the modal's onClose
            const event = new CustomEvent('closeDashboard');
            window.dispatchEvent(event);
          }}
          sx={{
            backgroundColor: colors.blueAccent[600],
            color: colors.grey[100],
            '&:hover': { backgroundColor: colors.blueAccent[500] },
            mx: 1,
            px: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              ← Back to Site
            </Typography>
          </Box>
        </IconButton>

        {openNotif && (
          <Paper
            sx={{
              position: "absolute",
              top: "50px",
              right: "100px",
              width: "380px",
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: "8px",
              boxShadow: 6,
              zIndex: 200,
              maxHeight: "500px",
              overflow: "hidden",
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" p={1.5}>
              <Typography variant="h6" fontSize="1.5rem">
                {t("notifications")} ({unreadCount} unread)
              </Typography>
              <Button 
                size="small" 
                onClick={markAllAsRead} 
                sx={{ color: colors.grey[100] }}
                disabled={unreadCount === 0}
              >
                {t("markAllRead")}
              </Button>
            </Box>
            <Divider />
            
            {notificationsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Loading notifications...
                </Typography>
              </Box>
            ) : notifications.length === 0 ? (
              <Box p={3} textAlign="center">
                <Typography variant="body2" color={colors.grey[300]}>
                  No notifications yet
                </Typography>
              </Box>
            ) : (
              <List dense sx={{ maxHeight: "400px", overflowY: "auto" }}>
                {notifications.map((notification) => (
                  <ListItemButton
                    key={notification.id}
                    onClick={() => handleNotifClick(notification)}
                    sx={{
                      backgroundColor: notification.read
                        ? "transparent"
                        : theme.palette.mode === "dark"
                        ? colors.primary[500]
                        : "#f0f0f0",
                      borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
                      mb: 0.5,
                    }}
                  >
                    <Box sx={{ mr: 1, fontSize: "1.2rem" }}>
                      {getCategoryIcon(notification.category)}
                    </Box>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: notification.read ? colors.grey[300] : colors.grey[100],
                              fontWeight: notification.read ? "normal" : "bold",
                              fontSize: "0.85rem",
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {notification.priority !== 'normal' && (
                            <Chip
                              label={notification.priority.toUpperCase()}
                              size="small"
                              sx={{
                                backgroundColor: getPriorityColor(notification.priority),
                                color: colors.grey[100],
                                fontSize: "0.72rem",
                                height: "20px",
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.grey[300],
                              fontSize: "0.82rem",
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: colors.grey[500], fontSize: "0.75rem" }}
                          >
                            {getRelativeTime(notification.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        )}

        {/* ⚙️ SETTINGS MENU */}
        <IconButton onClick={toggleSettings} sx={{ p: 1 }}>
          <SettingsOutlinedIcon sx={{ fontSize: 26 }} />
        </IconButton>

        {openSettings && (
          <Paper
            ref={settingsRef}
            sx={{
              position: "absolute",
              top: "50px",
              right: "20px",
              width: 400,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: "12px",
              boxShadow: 8,
              zIndex: 220,
              overflow: "hidden",
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1.5}>
              <Typography sx={{ fontSize: "1rem", fontWeight: 600, color: colors.grey[100] }}>Settings</Typography>
              <Button size="small" onClick={() => setOpenSettings(false)}
                sx={{ backgroundColor: colors.blueAccent[500], color: '#000', '&:hover': { backgroundColor: colors.blueAccent[400] } }}>
                Close
              </Button>
            </Box>
            <Divider />

            <Box px={2} py={1.5}>
              <Typography sx={{ color: colors.grey[300], mb: 1, fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Appearance</Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography sx={{ fontSize: "0.95rem", color: colors.grey[100] }}>Theme</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={theme.palette.mode === "dark"}
                      onChange={colorMode.toggleColorMode}
                    />
                  }
                  label={theme.palette.mode === "dark" ? "Dark" : "Light"}
                />
              </Box>
            </Box>

            <Divider />

            <Box px={2} py={1.5}>
              <Typography sx={{ color: colors.grey[300], mb: 1, fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Localization</Typography>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: colors.grey[100] }}>{t("language") || "Language"}</InputLabel>
                <Select
                  value={language}
                  label={t("language") || "Language"}
                  onChange={(e) => {
                    const selectedLang = e.target.value;
                    setLanguage(selectedLang);
                    i18n.changeLanguage(selectedLang);
                    localStorage.setItem("language", selectedLang);
                  }}
                  sx={{ color: colors.grey[100] }}
                  MenuProps={{ disablePortal: true }}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="sw">Swahili</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider />

            <Box px={2} py={1.5}>
              <Typography sx={{ color: colors.grey[300], mb: 1, fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Access</Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate("security")}
                  sx={{
                    backgroundColor: colors.blueAccent[500],
                    color: '#000',
                    '&:hover': { backgroundColor: colors.blueAccent[400] },
                  }}
                >
                  Security Settings
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate("notifications")}
                  sx={{
                    backgroundColor: colors.greenAccent[500],
                    color: '#000',
                    '&:hover': { backgroundColor: colors.greenAccent[400] },
                  }}
                >
                  Notification Preferences
                </Button>
              </Box>
            </Box>

            <Divider />

            <Box px={2} py={1.5}>
              <Typography sx={{ color: colors.grey[300], mb: 1, fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Preferences</Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography sx={{ fontSize: "0.95rem", color: colors.grey[100] }}>Notification sounds</Typography>
                <Switch
                  checked={notificationSounds}
                  onChange={(e) => {
                    setNotificationSounds(e.target.checked);
                    localStorage.setItem("notificationSounds", String(e.target.checked));
                  }}
                />
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography sx={{ fontSize: "0.95rem", color: colors.grey[100] }}>Compact sidebar</Typography>
                <Switch
                  checked={compactSidebar}
                  onChange={(e) => {
                    setCompactSidebar(e.target.checked);
                    localStorage.setItem("compactSidebar", String(e.target.checked));
                  }}
                />
              </Box>
            </Box>

            <Divider />

            <Box px={2} py={1.5} display="flex" justifyContent="flex-end" gap={1}>
              <Button 
                variant="text" 
                onClick={() => navigate("profile")}
                sx={{
                  backgroundColor: colors.blueAccent[500],
                  color: '#000',
                  '&:hover': { backgroundColor: colors.blueAccent[400] },
                }}
              >
                View Profile
              </Button>
              <Button variant="contained" onClick={() => setOpenSettings(false)}>
                Done
              </Button>
            </Box>
          </Paper>
        )}

        {/* 🌐 LANGUAGE DIALOG */}
        <Dialog
          open={openLangDialog}
          onClose={() => setOpenLangDialog(false)}
          PaperProps={{
            sx: {
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: "12px",
              p: 2,
            },
          }}
        >
          <DialogTitle>{t("languageSettings") || "Language Settings"}</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel sx={{ color: colors.grey[100] }}>
                {t("selectLanguage") || "Select Language"}
              </InputLabel>
              <Select
                value={language}
                label="Language"
                onChange={(e) => {
                  const selectedLang = e.target.value;
                  setLanguage(selectedLang);
                  i18n.changeLanguage(selectedLang);
                  localStorage.setItem("language", selectedLang);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setOpenLangDialog(false);
                }}
                sx={{ color: colors.grey[100] }}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="sw">Swahili</MenuItem>
              </Select>
            </FormControl>
            <Box textAlign="right" mt={2}>
              <Button
                variant="contained"
                onClick={() => setOpenLangDialog(false)}
              >
                {t("save") || "Save"}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* � USER LSETTINGS ICON + DROPDOWN */}
        <Box position="relative" ref={userMenuRef}>
          <IconButton onClick={() => togglePanel("user")} sx={{ p: 1 }}>
            <PersonOutlinedIcon sx={{ fontSize: 26 }} />
          </IconButton>



          {openUserMenu && (
            <Paper
              sx={{
                position: "absolute",
                top: "50px",
                right: 0,
                width: 420,
                backgroundColor: colors.primary[400],
                color: colors.grey[100],
                borderRadius: "12px",
                boxShadow: 8,
                zIndex: 260,
                overflow: "hidden",
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1.5}>
                <Typography sx={{ fontSize: "1rem", fontWeight: 600, color: colors.grey[100] }}>User Settings</Typography>
                <Button size="small" onClick={() => setOpenUserMenu(false)} sx={{ color: colors.grey[100] }}>Close</Button>
              </Box>
              <Divider />

              {isLoggedIn ? (
                <>
                  <Box px={2} py={1.5}>
                    <Typography sx={{ color: colors.grey[300], mb: 1, fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Profile</Typography>
                    <InputBase
                      placeholder="Full Name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      sx={{
                        backgroundColor: colors.primary[500], p: 1, borderRadius: "8px", color: colors.grey[100], mb: 2, width: "100%",
                      }}
                    />
                    <InputBase
                      placeholder="Email Address"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      sx={{
                        backgroundColor: colors.primary[500], p: 1, borderRadius: "8px", color: colors.grey[100], width: "100%",
                      }}
                    />
                    <Box display="flex" gap={1} mt={1}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => navigate("profile")}
                        sx={{
                          backgroundColor: colors.blueAccent[500],
                          color: '#000',
                          '&:hover': { backgroundColor: colors.blueAccent[400] },
                        }}
                      >Open Profile</Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleProfileUpdate}
                      >Save</Button>
                    </Box>
                  </Box>

                  <Divider />

                  <Box px={2} py={1.5}>
                    <Typography sx={{ color: colors.grey[300], mb: 1, fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Account & Security</Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography sx={{ fontSize: "0.95rem", color: colors.grey[100] }}>Two-factor authentication</Typography>
                      <Switch
                        checked={twoFactorEnabled}
                        onChange={(e) => {
                          setTwoFactorEnabled(e.target.checked);
                          localStorage.setItem("twoFactorEnabled", String(e.target.checked));
                        }}
                      />
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography sx={{ fontSize: "0.95rem", color: colors.grey[100] }}>Private account</Typography>
                      <Switch
                        checked={accountPrivate}
                        onChange={(e) => {
                          setAccountPrivate(e.target.checked);
                          localStorage.setItem("accountPrivate", String(e.target.checked));
                        }}
                      />
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography sx={{ fontSize: "0.95rem", color: colors.grey[100] }}>Marketing emails</Typography>
                      <Switch
                        checked={marketingEmails}
                        onChange={(e) => {
                          setMarketingEmails(e.target.checked);
                          localStorage.setItem("marketingEmails", String(e.target.checked));
                        }}
                      />
                    </Box>
                    <Box display="flex" gap={1} mt={1}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate("security")}
                        sx={{ backgroundColor: colors.blueAccent[500], color: '#000', '&:hover': { backgroundColor: colors.blueAccent[400] } }}
                      >Change password</Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate("notifications")}
                        sx={{ backgroundColor: colors.greenAccent[500], color: '#000', '&:hover': { backgroundColor: colors.greenAccent[400] } }}
                      >Manage notifications</Button>
                    </Box>
                  </Box>

                  <Divider />

                  <Box px={2} py={1.5}>
                    <Typography sx={{ color: colors.grey[300], mb: 1, fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick Preferences</Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: colors.grey[100] }}>{t("language") || "Language"}</InputLabel>
                      <Select
                        value={language}
                        label={t("language") || "Language"}
                        onChange={(e) => {
                          const selectedLang = e.target.value;
                          setLanguage(selectedLang);
                          i18n.changeLanguage(selectedLang);
                          localStorage.setItem("language", selectedLang);
                        }}
                        sx={{ color: colors.grey[100] }}
                        MenuProps={{ disablePortal: true }}
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="sw">Swahili</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Divider />

                  <Box px={2} py={1.5} display="flex" justifyContent="space-between">
                    <Button 
                    variant="text" onClick={handleLogout}
                    sx={{
                      backgroundColor: colors.redAccent[500],
                      color: '#000',
                      '&:hover': { backgroundColor: colors.redAccent[400] },
                    }}>Logout</Button>
                    <Button variant="contained" onClick={() => setOpenUserMenu(false)}>Done</Button>
                  </Box>
                </>
              ) : (
                <Box px={2} py={1.5}>
                  <Typography variant="body2" sx={{ mb: 1 }}>You are not logged in.</Typography>
                  <Button variant="contained" onClick={handleLogin}>Login</Button>
                </Box>
              )}
            </Paper>
          )}

          {/* 🧑 EDIT PROFILE DIALOG */}
          <Dialog
            open={openProfileDialog}
            onClose={() => setOpenProfileDialog(false)}
            PaperProps={{
              sx: {
                backgroundColor: colors.primary[400],
                color: colors.grey[100],
                borderRadius: "12px",
                p: 2,
              },
            }}
          >
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogContent>
              <Box component="form" display="flex" flexDirection="column" gap={2} mt={1}>
                <InputBase
                  placeholder="Full Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  sx={{
                    backgroundColor: colors.primary[500],
                    p: 1,
                    borderRadius: "8px",
                    color: colors.grey[100],
                  }}
                />
                <InputBase
                  placeholder="Email Address"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  sx={{
                    backgroundColor: colors.primary[500],
                    p: 1,
                    borderRadius: "8px",
                    color: colors.grey[100],
                  }}
                />
                <Box textAlign="right" mt={1}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleProfileUpdate();
                      setOpenProfileDialog(false);
                    }}
                  >
                    Save
                  </Button>
                </Box>
              </Box>
            </DialogContent>
          </Dialog>
        </Box>
      </Box>

      {/* Notification Details Dialog */}
      <Dialog
        open={openNotifDetail}
        onClose={() => setOpenNotifDetail(false)}
        PaperProps={{
          sx: {
            backgroundColor: colors.primary[400],
            color: colors.grey[100],
            borderRadius: "12px",
            p: 1,
            minWidth: 400,
            maxWidth: 500,
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ fontSize: "1.5rem" }}>
              {selectedNotif && getCategoryIcon(selectedNotif.category)}
            </Box>
            <Box>
              <Typography variant="h6">
                {selectedNotif?.title || "Notification"}
              </Typography>
              {selectedNotif && (
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Chip
                    label={selectedNotif.priority.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: getPriorityColor(selectedNotif.priority),
                      color: colors.grey[100],
                      fontSize: "0.7rem",
                    }}
                  />
                  <Chip
                    label={selectedNotif.category.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: colors.blueAccent[600],
                      color: colors.grey[100],
                      fontSize: "0.7rem",
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" sx={{ color: colors.grey[300] }}>
            {selectedNotif?.formatted_created_at} • {getRelativeTime(selectedNotif?.created_at)}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1.5, lineHeight: 1.6 }}>
            {selectedNotif?.message || "No additional details."}
          </Typography>
          
          {selectedNotif?.related_user && (
            <Box mt={2} p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
              <Typography variant="body2" color={colors.grey[300]}>
                Related to: <strong>{selectedNotif.related_user.name}</strong> ({selectedNotif.related_user.role})
              </Typography>
            </Box>
          )}

          {selectedNotif?.action_url && (
            <Box mt={2}>
              <Button 
                variant="contained" 
                onClick={handleNotifNavigate}
                startIcon={<OpenInNewIcon />}
                sx={{
                  backgroundColor: colors.blueAccent[600],
                  '&:hover': { backgroundColor: colors.blueAccent[700] }
                }}
              >
                View Details
              </Button>
            </Box>
          )}
          
          <Box display="flex" gap={1} mt={3}>
            <Button 
              variant="outlined" 
              onClick={handleNotifMarkUnread}
              startIcon={<MarkAsUnreadIcon />}
              sx={{
                borderColor: colors.blueAccent[500],
                color: colors.blueAccent[500],
                '&:hover': { 
                  borderColor: colors.blueAccent[400],
                  backgroundColor: colors.blueAccent[900] 
                },
              }}
            >
              Mark Unread
            </Button>
            <Button 
              color="error" 
              variant="outlined"
              onClick={handleNotifDelete}
              startIcon={<DeleteIcon />}
              sx={{
                borderColor: colors.redAccent[500],
                color: colors.redAccent[500],
                '&:hover': { 
                  borderColor: colors.redAccent[400],
                  backgroundColor: colors.redAccent[900] 
                },
              }}
            >
              Delete
            </Button>
            <Box flexGrow={1} />
            <Button 
              variant="contained" 
              onClick={() => setOpenNotifDetail(false)}
              sx={{
                backgroundColor: colors.greenAccent[600],
                '&:hover': { backgroundColor: colors.greenAccent[700] },
              }}
            >
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Topbar;
