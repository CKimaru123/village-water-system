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
} from "@mui/material";
import { ColorModeContext, tokens } from "../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // 🌍 Added for translations

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
];

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // 🌍 Translation hook

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [noResults, setNoResults] = useState(false);

  // -------------------------
  // 🏷️ Scope Switcher (Tenant/Site/Zone)
  // -------------------------
  const [scope, setScope] = useState(
    localStorage.getItem("adminScope") || "All Tenants"
  );
  const scopes = ["All Tenants", "Tenant A", "Tenant B", "Zone East", "Zone West"];

  // Quick Actions merged into Settings panel

  // -------------------------
  // 🔔 Notifications
  // -------------------------
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: t("invoiceGenerated") || "Invoice #245 Generated",
      text: "Invoice #245 was successfully generated for customer ID 1023.",
      read: false,
      date: "2025-10-10 09:30 AM",
    },
    {
      id: 2,
      title: t("newTariffPlan") || "New Tariff Plan Added",
      text: "The new Residential Tariff Plan 2025 is now active.",
      read: false,
      date: "2025-10-09 04:12 PM",
    },
    {
      id: 3,
      title: t("maintenanceScheduled") || "Maintenance Scheduled",
      text: "Maintenance is scheduled for East Pump Station on 12 Oct.",
      read: true,
      date: "2025-10-08 11:00 AM",
    },
  ]);
  const [openNotif, setOpenNotif] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const notifRef = useRef(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleNotif = () => setOpenNotif((prev) => !prev);
  const markAllRead = () => setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  const handleNotifClick = (notif) => {
    setSelectedNotif(notif);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
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
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en");
  const [role, setRole] = useState(localStorage.getItem("role") || "admin");

  const toggleSettings = () => setOpenSettings((prev) => !prev);

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

  // -------------------------
  // 👤 USER SETTINGS STATE
  // -------------------------
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );
  const [profile, setProfile] = useState({
    name: localStorage.getItem("name") || "John Doe",
    email: localStorage.getItem("email") || "john@example.com",
  });

  // Handlers
  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", "true");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem("isLoggedIn", "false");
  };

  return (
    <Box display="flex" justifyContent="space-between" p={2} position="relative">
      {/* SEARCH BAR */}
      <Box
        display="flex"
        backgroundColor={colors.primary[400]}
        borderRadius="8px"
        position="relative"
        width="520px"
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

        {/* Scope Switcher */}
        <Divider orientation="vertical" flexItem sx={{ opacity: 0.3 }} />
        <FormControl size="small" sx={{ minWidth: 160, mx: 1 }}>
          <InputLabel sx={{ color: colors.grey[100] }}>Scope</InputLabel>
          <Select
            value={scope}
            label="Scope"
            onChange={(e) => {
              setScope(e.target.value);
              localStorage.setItem("adminScope", e.target.value);
            }}
            sx={{ color: colors.grey[100] }}
            MenuProps={{ disablePortal: true }}
          >
            {scopes.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>

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
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>

        {/* Single Settings entry (includes Quick Actions) */}

        {/* 🔔 Notifications */}
        <IconButton onClick={toggleNotif}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsOutlinedIcon />
          </Badge>
        </IconButton>

        {openNotif && (
          <Paper
            sx={{
              position: "absolute",
              top: "50px",
              right: "100px",
              width: "320px",
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: "8px",
              boxShadow: 6,
              zIndex: 200,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" p={1.5}>
              <Typography variant="h6" fontSize="1rem">
                {t("notifications")}
              </Typography>
              <Button size="small" onClick={markAllRead} sx={{ color: colors.grey[100] }}>
                {t("markAllRead")}
              </Button>
            </Box>
            <Divider />
            <List dense>
              {notifications.map((n) => (
                <ListItemButton
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  sx={{
                    backgroundColor: n.read
                      ? "transparent"
                      : theme.palette.mode === "dark"
                      ? colors.primary[500]
                      : "#f0f0f0",
                  }}
                >
                  <ListItemText
                    primary={n.title}
                    secondary={n.date}
                    primaryTypographyProps={{
                      sx: {
                        color: n.read ? colors.grey[300] : colors.grey[100],
                        fontSize: "0.9rem",
                      },
                    }}
                    secondaryTypographyProps={{
                      sx: { color: colors.grey[400], fontSize: "0.75rem" },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}

        {/* ⚙️ SETTINGS MENU */}
        <IconButton onClick={toggleSettings}>
          <SettingsOutlinedIcon />
        </IconButton>

        {openSettings && (
          <Paper
            sx={{
              position: "absolute",
              top: "50px",
              right: "50px",
              width: 320,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: "8px",
              boxShadow: 8,
              zIndex: 210,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" p={1.5}>
              <Typography variant="h6" fontSize="1rem">{t("settings") || "Settings"}</Typography>
              <Button size="small" onClick={() => setOpenSettings(false)} sx={{ color: colors.grey[100] }}>Close</Button>
            </Box>
            <Divider />
            <Box px={1.5} pt={1} pb={0.5}>
              <Typography variant="overline" sx={{ color: colors.grey[300] }}>Quick Actions</Typography>
            </Box>
            <List dense>
              <ListItemButton onClick={() => { setOpenSettings(false); navigate("/invoice-generation"); }}>
                <ListItemText primary="Generate Invoice" />
              </ListItemButton>
              <ListItemButton onClick={() => { setOpenSettings(false); navigate("/assets"); }}>
                <ListItemText primary="Add Asset" />
              </ListItemButton>
              <ListItemButton onClick={() => { setOpenSettings(false); navigate("/announcements"); }}>
                <ListItemText primary="Post Announcement" />
              </ListItemButton>
              <ListItemButton onClick={() => { setOpenSettings(false); navigate("/transparency"); }}>
                <ListItemText primary="View KPIs" />
              </ListItemButton>
            </List>
            <Divider />
            <Box px={1.5} pt={1} pb={0.5}>
              <Typography variant="overline" sx={{ color: colors.grey[300] }}>Preferences</Typography>
            </Box>
            <List dense>
              <ListItemButton onClick={() => setOpenLangDialog(true)}>
                <ListItemText primary={`🌐 ${t("language")}`} />
              </ListItemButton>
              <ListItemButton onClick={() => setOpenRoleDialog(true)}>
                <ListItemText primary={`🧑‍💼 ${t("roleBasedAccess")}`} />
              </ListItemButton>
              <ListItemButton onClick={colorMode.toggleColorMode}>
                <ListItemText primary={`🌓 ${t("toggleTheme")}`} />
              </ListItemButton>
            </List>
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

        {/* 🧑‍💼 ROLE DIALOG */}
        <Dialog
          open={openRoleDialog}
          onClose={() => setOpenRoleDialog(false)}
          PaperProps={{
            sx: {
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: "12px",
              p: 2,
            },
          }}
        >
          <DialogTitle>{t("roleBasedAccess")}</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel sx={{ color: colors.grey[100] }}>
                {t("selectRole") || "Select Role"}
              </InputLabel>
              <Select
                value={role}
                label="Role"
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    localStorage.setItem("role", e.target.value);
                    setOpenRoleDialog(false);
                  }
                }}
                sx={{ color: colors.grey[100] }}
              >
                <MenuItem value="admin">{t("admin")}</MenuItem>
                <MenuItem value="manager">{t("manager")}</MenuItem>
                <MenuItem value="viewer">{t("viewer")}</MenuItem>
              </Select>
            </FormControl>
            <Box textAlign="right" mt={2}>
              <Button
                variant="contained"
                onClick={() => {
                  localStorage.setItem("role", role);
                  setOpenRoleDialog(false);
                }}
              >
                {t("save") || "Save"}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* 👤 USER SETTINGS ICON + DROPDOWN */}
        <Box position="relative">
          <IconButton onClick={() => setOpenUserMenu((prev) => !prev)}>
            <PersonOutlinedIcon />
          </IconButton>

          {openUserMenu && (
            <Paper
              sx={{
                position: "absolute",
                top: "50px",
                right: 0,
                width: "220px",
                backgroundColor: colors.primary[400],
                color: colors.grey[100],
                borderRadius: "8px",
                boxShadow: 6,
                zIndex: 250,
              }}
            >
              <List dense>
                {isLoggedIn ? (
                  <>
                    <ListItem sx={{ cursor: "default" }}>
                      <ListItemText
                        primary={profile.name}
                        secondary={profile.email}
                        primaryTypographyProps={{ sx: { color: colors.grey[100], fontWeight: 600 } }}
                        secondaryTypographyProps={{ sx: { color: colors.grey[300] } }}
                      />
                    </ListItem>
                    <Divider />
                    <ListItemButton onClick={() => setOpenProfileDialog(true)}>
                      <ListItemText primary={`✏️ ${t("editProfile") || "Edit Profile"}`} />
                    </ListItemButton>
                    <ListItemButton onClick={() => setOpenRoleDialog(true)}>
                      <ListItemText primary={`🧑‍💼 ${t("role") || "Role"}: ${role}`} />
                    </ListItemButton>
                    <ListItemButton onClick={handleLogout}>
                      <ListItemText primary="🚪 Logout" />
                    </ListItemButton>
                  </>
                ) : (
                  <ListItemButton onClick={handleLogin}>
                    <ListItemText primary="🔐 Login" />
                  </ListItemButton>
                )}
              </List>
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
                      localStorage.setItem("name", profile.name);
                      localStorage.setItem("email", profile.email);
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
    </Box>
  );
};

export default Topbar;
