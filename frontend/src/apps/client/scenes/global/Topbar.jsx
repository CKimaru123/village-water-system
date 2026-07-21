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
} from "@mui/material";
import { ColorModeContext, tokens } from "../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PaymentIcon from "@mui/icons-material/Payment";
import BuildIcon from "@mui/icons-material/Build";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import EventIcon from "@mui/icons-material/Event";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // 🌍 Added for translations
import { useAuth } from "../../../../hooks/useAuth"; // Import useAuth hook
import { useNotificationsContext } from "../../../../context/NotificationsContext";
import { setAppLanguage, getAppLanguage } from '../../../../utils/i18nHelper';

const pagesIndex = [
  { name: "Dashboard", path: "/" },
  { name: "Tariff Management", path: "/tariff-management" },
  { name: "Invoice Generation", path: "/invoice-generation" },
  { name: "Dunning Workflow", path: "/dunning" },
  { name: "Deposits & Connection Fees", path: "/deposits" },
  { name: "Refund/Reversal Approvals", path: "/refunds" },
  { name: "Reconciliation", path: "/reconciliation" },
  { name: "Financial Reports", path: "/financial-reports" },
  { name: "Subsidy/Waiver Programs", path: "/subsidy" },
  { name: "Document Generator", path: "/document-generator" },
  { name: "Export Tools", path: "/export-tools" },
  { name: "Asset Register", path: "/assets" },
  { name: "Preventive Maintenance", path: "/maintenance" },
  { name: "Incident Management", path: "/incidents" },
  { name: "GIS Map", path: "/gis-map" },
  { name: "Valve Operations & Rationing", path: "/valves" },
  { name: "Inventory & Spares", path: "/inventory" },
  { name: "Energy & Fuel Tracking", path: "/energy" },
  { name: "SCADA Integration", path: "/scada" },
  { name: "Carbon Footprint Calculator", path: "/carbon-footprint" },
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

  const [openNotif, setOpenNotif] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [openNotifDetail, setOpenNotifDetail] = useState(false);
  const notifRef = useRef(null);
  const settingsRef = useRef(null);

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

  const toggleNotif = () => setOpenNotif((prev) => !prev);

  const handleNotifClick = (notif) => {
    setSelectedNotif(notif);
    // Mark as read when clicked
    if (!notif.read) {
      markAsRead(notif.id);
    }
    setOpenNotif(false);
    setOpenNotifDetail(true);
  };

  const handleNotifMarkUnread = () => {
    if (!selectedNotif) return;
    // This would require a new API endpoint to mark as unread
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

  // Get notification icon based on category
  const getNotificationIcon = (category = 'general', priority = 'normal') => {
    const iconProps = {
      fontSize: "small",
      sx: { 
        mr: 1,
        color: priority === 'urgent' ? '#ff1744' : 
               priority === 'high' ? '#ff9800' : 
               priority === 'normal' ? '#2196f3' : '#4caf50'
      }
    };

    switch (category) {
      case 'profile':
        return <AccountCircleIcon {...iconProps} />;
      case 'billing':
        return <PaymentIcon {...iconProps} />;
      case 'service':
        return <WaterDropIcon {...iconProps} />;
      case 'system':
        return <BuildIcon {...iconProps} />;
      case 'meeting':
        return <EventIcon {...iconProps} />;
      default:
        return <AnnouncementIcon {...iconProps} />;
    }
  };

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

  // -------------------------
  // ⚙️ Settings
  // -------------------------
  const [openSettings, setOpenSettings] = useState(false);
  const [openLangDialog, setOpenLangDialog] = useState(false);
  const [language, setLanguage] = useState(getAppLanguage());
  const [notificationSounds, setNotificationSounds] = useState(
    localStorage.getItem("notificationSounds") !== "false"
  );
  const [compactSidebar, setCompactSidebar] = useState(
    localStorage.getItem("compactSidebar") === "true"
  );

  const toggleSettings = () => setOpenSettings((prev) => !prev);

  const handleAppLanguageChange = async (selectedLang) => {
    if (!selectedLang) return;
    setLanguage(selectedLang);
    await setAppLanguage(selectedLang, { persistBackend: !!user });
  };

  useEffect(() => {
    // keep component state in sync with i18n global language
    const handler = (lng) => setLanguage((lng || i18n.language || 'en').slice(0,2));
    i18n.on('languageChanged', handler);
    setLanguage((i18n.language || getAppLanguage() || 'en').slice(0,2));
    return () => i18n.off('languageChanged', handler);
  }, [i18n]);

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

  // -------------------------
  // 👤 USER SETTINGS STATE
  // -------------------------
  const [openUserMenu, setOpenUserMenu] = useState(false);
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
    console.log('=== CLIENT TOPBAR USER DATA DEBUG ===');
    console.log('User object:', user);
    console.log('User first_name:', user?.first_name);
    console.log('User last_name:', user?.last_name);
    console.log('User display_name:', user?.display_name);
    console.log('User full_name:', user?.full_name);
    console.log('=====================================');
    
    if (user) {
      setProfile({
        name: user.display_name || user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
        email: user.email || user.phone || 'No email',
      });
      setIsLoggedIn(true);
    } else {
      setProfile({
        name: "Guest User",
        email: "guest@example.com",
      });
      setIsLoggedIn(false);
    }
  }, [user]);

  // Handlers
  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", "true");
  };

  const handleLogout = () => {
    // Use the same logout event system as the removed button
    const event = new CustomEvent('logoutDashboard');
    window.dispatchEvent(event);
  };

  // Handle profile updates
  const handleProfileUpdate = async () => {
    if (!user) return;
    
    try {
      const token = user.token || localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/auth/me`, {
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
        alert('Profile updated successfully!');
        // Update local profile state with server response
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
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon sx={{ fontSize: 26 }} />
          ) : (
            <LightModeOutlinedIcon sx={{ fontSize: 26 }} />
          )}
        </IconButton>

        {/* 🔔 Notifications */}
        <IconButton onClick={toggleNotif}>
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
              ← {t("Back to Site")}
            </Typography>
          </Box>
        </IconButton>

        {openNotif && (
          <Paper
            sx={{
              position: "absolute",
              top: "50px",
              right: "100px",
              width: "420px",
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: "8px",
              boxShadow: 6,
              zIndex: 200,
              maxHeight: "520px",
              overflow: "hidden",
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" p={1.5}>
              <Typography variant="h6" fontSize="1.5rem">
                {t("notifications")} ({unreadCount} unread)
              </Typography>
              <Button 
                size="small" 
                onClick={() => markAllAsRead()} 
                sx={{ color: colors.grey[100] }}
                disabled={unreadCount === 0}
              >
                {t("markAllRead")}
              </Button>
            </Box>
            <Divider />
            
            {notificationsLoading ? (
              <Box p={2} textAlign="center">
                <Typography variant="body2" color={colors.grey[300]}>
                  {t("loadingNotifications") || "Loading notifications..."}
                </Typography>
              </Box>
            ) : notifications.length === 0 ? (
              <Box p={2} textAlign="center">
                <Typography variant="body2" color={colors.grey[300]}>
                  {t("noNotificationsYet") || "No notifications yet"}
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
                      borderLeft: `4px solid ${
                        (notification.priority || 'normal') === 'urgent' ? '#ff1744' : 
                        (notification.priority || 'normal') === 'high' ? '#ff9800' : 
                        (notification.priority || 'normal') === 'normal' ? '#2196f3' : '#4caf50'
                      }`,
                      mb: 0.5,
                    }}
                  >
                    <Box display="flex" alignItems="flex-start" width="100%">
                      {getNotificationIcon(notification.category || 'general', notification.priority || 'normal')}
                      <Box flex={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: notification.read ? colors.grey[300] : colors.grey[100],
                              fontSize: "0.95rem",
                              fontWeight: notification.read ? 400 : 600,
                              lineHeight: 1.3,
                            }}
                          >
                            {notification.title || 'Notification'}
                          </Typography>
                          <Box display="flex" flexDirection="column" alignItems="flex-end" ml={1}>
                            <Chip
                              label={(notification.priority || 'normal').toUpperCase()}
                              size="small"
                              sx={{
                                fontSize: "0.72rem",
                                height: "20px",
                                backgroundColor: 
                                  (notification.priority || 'normal') === 'urgent' ? '#ff1744' : 
                                  (notification.priority || 'normal') === 'high' ? '#ff9800' : 
                                  (notification.priority || 'normal') === 'normal' ? '#2196f3' : '#4caf50',
                                color: '#fff',
                                mb: 0.5,
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: colors.grey[400], 
                                fontSize: "0.8rem",
                                textAlign: "right",
                              }}
                            >
                              {getRelativeTime(notification.created_at) || 'Just now'}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: colors.grey[300],
                            fontSize: "0.9rem",
                            mt: 0.5,
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {notification.message || 'No message'}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        )}

        {/* ⚙️ SETTINGS MENU */}
        <IconButton onClick={toggleSettings}>
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
              <Typography variant="h6" fontSize="1rem">{t("Settings")}</Typography>
              <Button 
                size="small" 
                onClick={() => setOpenSettings(false)} 
                sx={{ color: '#000', backgroundColor: colors.redAccent[500], '&:hover': { backgroundColor: colors.redAccent[400] } }}
              >
                {t("Close")}
              </Button>
            </Box>
            <Divider />

            <Box px={2} py={1.5}>
              <Typography variant="subtitle2" fontSize="1.3rem" sx={{ color: colors.grey[300], mb: 1 }}>{t("Appearance")}</Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography>{t("Theme")}</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={theme.palette.mode === "dark"}
                      onChange={colorMode.toggleColorMode}
                    />
                  }
                  label={theme.palette.mode === "dark" ? t("Dark") : t("Light")}
                />
              </Box>
            </Box>

            <Divider />

            <Box px={2} py={1.5}>
              <Typography variant="subtitle2" fontSize="1.3rem" sx={{ color: colors.grey[300], mb: 1 }}>{t("Localization")}</Typography>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: colors.grey[100] }}>{t("language") || "Language"}</InputLabel>
                <Select
                  value={language}
                  label={t("language") || "Language"}
                  onChange={async (e) => {
                    const selectedLang = e.target.value;
                    await handleAppLanguageChange(selectedLang);
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
              <Typography variant="subtitle2" fontSize="1.3rem" sx={{ color: colors.grey[300], mb: 1 }}>{t("Preferences")}</Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography>{t("Notification sounds")}</Typography>
                <Switch
                  checked={notificationSounds}
                  onChange={(e) => {
                    setNotificationSounds(e.target.checked);
                    localStorage.setItem("notificationSounds", String(e.target.checked));
                  }}
                />
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography>{t("Compact sidebar")}</Typography>
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
                onClick={() => {
                  navigate("profile");
                  setOpenSettings(false);
                }}
                sx={{
                  backgroundColor: colors.blueAccent[500],
                  color: '#000',
                  '&:hover': { backgroundColor: colors.blueAccent[400] },
                }}
              >
                View Profile
              </Button>
              <Button variant="contained" onClick={() => setOpenSettings(false)}>
                {t("Done")}
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
                label={t("language") || "Language"}
                onChange={async (e) => {
                  const selectedLang = e.target.value;
                  await handleAppLanguageChange(selectedLang);
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

        {/* 👤 USER SETTINGS ICON + DROPDOWN */}
        <Box position="relative" ref={userMenuRef}>
          <IconButton onClick={() => setOpenUserMenu((prev) => !prev)}>
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
                <Typography variant="h6" fontSize="1.3rem">{t("User Settings")}</Typography>
                <Button 
                size="small" onClick={() => setOpenUserMenu(false)} sx={{ color: '#000', backgroundColor: colors.redAccent[500], '&:hover': { backgroundColor: colors.redAccent[400] } }}>{t("Close")}</Button>
                </Box>
              <Divider />

              {isLoggedIn ? (
                <>
                  <Box px={2} py={1.5}>
                    <Typography variant="subtitle2" sx={{ color: colors.grey[300], mb: 1, fontSize: 16 }}>{t("Profile")}</Typography>
                    <InputBase
                      placeholder={t("Full Name") || "Full Name"}
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      sx={{
                        backgroundColor: colors.primary[500], p: 1, borderRadius: "8px", color: colors.grey[100], mb: 2, width: "100%",
                      }}
                    />
                    {/* <InputBase
                      placeholder="Email Address"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      sx={{
                        backgroundColor: colors.primary[500], p: 1, borderRadius: "8px", color: colors.grey[100], width: "100%",
                      }}
                    /> */}
                    <Box display="flex" gap={1} mt={1}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => {
                          navigate("profile");
                          setOpenSettings(false);
                        }}
                        sx={{
                          backgroundColor: colors.blueAccent[500],
                          color: '#000',
                          '&:hover': { backgroundColor: colors.blueAccent[400] },
                        }}
                      >{t("Open editor")}</Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleProfileUpdate}
                      >{t("Save")}</Button>
                    </Box>
                  </Box>

                  <Divider />

                  <Box px={2} py={1.5}>
                    <Typography variant="subtitle2" sx={{ color: colors.grey[300], mb: 1, fontSize: 14 }}>{t("Account & Security")}</Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography>{t("Two-factor authentication")}</Typography>
                      <Switch
                        checked={twoFactorEnabled}
                        onChange={(e) => {
                          setTwoFactorEnabled(e.target.checked);
                          localStorage.setItem("twoFactorEnabled", String(e.target.checked));
                        }}
                      />
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography>{t("Private account")}</Typography>
                      <Switch
                        checked={accountPrivate}
                        onChange={(e) => {
                          setAccountPrivate(e.target.checked);
                          localStorage.setItem("accountPrivate", String(e.target.checked));
                        }}
                      />
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography>{t("Marketing emails")}</Typography>
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
                        onClick={() => {
                          navigate("security");
                          setOpenSettings(false);
                          setOpenUserMenu(false);
                        }}
                        sx={{ backgroundColor: colors.blueAccent[500], color: '#000', '&:hover': { backgroundColor: colors.blueAccent[400] } }}
                      >{t("Change password")}</Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          navigate("notifications");
                          setOpenSettings(false);
                          setOpenUserMenu(false);
                        }}
                        sx={{ backgroundColor: colors.greenAccent[500], color: '#000', '&:hover': { backgroundColor: colors.greenAccent[400] } }}
                      >{t("Manage notifications")}</Button>
                    </Box>
                  </Box>

                  <Divider />

                  <Box px={2} py={1.5}>
                    <Typography variant="subtitle2" fontSize="1.3rem" sx={{ color: colors.grey[300], mb: 1 }}>{t("Quick Preferences")}</Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                      <InputLabel sx={{ color: colors.grey[100] }}>{t("language") || "Language"}</InputLabel>
                      <Select
                        value={language}
                        label={t("language") || "Language"}
                        onChange={async (e) => {
                          const selectedLang = e.target.value;
                          await handleAppLanguageChange(selectedLang);
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
                    }}>{t("Logout")}</Button>
                    <Button variant="contained" onClick={() => setOpenUserMenu(false)}>{t("Done")}</Button>
                  </Box>
                </>
              ) : (
                <Box px={2} py={1.5}>
                  <Typography variant="body2" sx={{ mb: 1 }}>{t("You are not logged in.")}</Typography>
                  <Button variant="contained" onClick={handleLogin}>{t("Login")}</Button>
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
            <DialogTitle>{t("Edit Profile")}</DialogTitle>
            <DialogContent>
              <Box component="form" display="flex" flexDirection="column" gap={2} mt={1}>
                <InputBase
                  placeholder={t("Full Name") || "Full Name"}
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
                  placeholder={t("Email Address") || "Email Address"}
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
                    {t("Save")}
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
            {selectedNotif && getNotificationIcon(selectedNotif.category || 'general', selectedNotif.priority || 'normal')}
            {selectedNotif?.title || "Notification"}
            <Chip
              label={(selectedNotif?.priority || 'normal').toUpperCase()}
              size="small"
              sx={{
                ml: 'auto',
                fontSize: "0.7rem",
                height: "20px",
                backgroundColor: 
                  (selectedNotif?.priority || 'normal') === 'urgent' ? '#ff1744' : 
                  (selectedNotif?.priority || 'normal') === 'high' ? '#ff9800' : 
                  (selectedNotif?.priority || 'normal') === 'normal' ? '#2196f3' : '#4caf50',
                color: '#fff',
              }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" sx={{ color: colors.grey[300] }}>
            {selectedNotif?.formatted_created_at} • {getRelativeTime(selectedNotif?.created_at)}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1.5, lineHeight: 1.6 }}>
            {selectedNotif?.message || "No additional details."}
          </Typography>
          
          {selectedNotif?.metadata && Object.keys(selectedNotif.metadata).length > 0 && (
            <Box mt={2} p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ color: colors.grey[300], mb: 1 }}>
                Additional Details:
              </Typography>
              {selectedNotif.metadata.updated_fields && (
                <Typography variant="body2" sx={{ color: colors.grey[400] }}>
                  Fields changed: {selectedNotif.metadata.updated_fields.join(', ')}
                </Typography>
              )}
              {selectedNotif.metadata.modified_by_name && (
                <Typography variant="body2" sx={{ color: colors.grey[400] }}>
                  Modified by: {selectedNotif.metadata.modified_by_name} ({selectedNotif.metadata.modified_by_role})
                </Typography>
              )}
            </Box>
          )}
          
          {selectedNotif?.action_url && (
            <Box mt={2}>
              <Button 
                variant="contained" 
                onClick={handleNotifNavigate}
                sx={{
                  backgroundColor: colors.blueAccent[500],
                  color: '#000',
                  '&:hover': { backgroundColor: colors.blueAccent[400] },
                }}
              >
                View Related Page
              </Button>
            </Box>
          )}
          
          <Box display="flex" gap={1} mt={2}>
            <Button 
              color="error" 
              variant="text" 
              onClick={handleNotifDelete} 
              sx={{ 
                backgroundColor: colors.redAccent[500], 
                color: '#000', 
                '&:hover': { backgroundColor: colors.redAccent[400] } 
              }}
            >
              Delete
            </Button>
            <Box flexGrow={1} />
            <Button 
              variant="contained" 
              onClick={() => setOpenNotifDetail(false)}
              sx={{ 
                backgroundColor: colors.blueAccent[500], 
                color: '#000', 
                '&:hover': { backgroundColor: colors.blueAccent[400] } 
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
