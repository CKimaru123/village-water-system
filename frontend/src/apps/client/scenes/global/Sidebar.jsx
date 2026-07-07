import { useState, useEffect } from "react";
import { ProSidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme, Chip, Divider } from "@mui/material";
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";
import { useAuth } from "../../../../hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";

// Client Dashboard Icons
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import LocalDrinkIcon from "@mui/icons-material/LocalDrink";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";
import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import NatureIcon from "@mui/icons-material/Nature";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const location = useLocation();

  const targetPath = to === "" ? "/client" : `/client/${to}`;
  const isActive = to === ""
    ? location.pathname === "/client" || location.pathname === "/client/"
    : location.pathname === targetPath || location.pathname.startsWith(targetPath + "/");

  const handleClick = () => {
    setSelected(title);
    navigate(targetPath);
  };

  return (
    <MenuItem
      active={isActive}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
      icon={icon}
    >
      <Typography>{title}</Typography>
    </MenuItem>
  );
};

const Sidebar = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  const { user } = useAuth();

  // Force re-render when user changes
  useEffect(() => {}, [user?.avatar, user?.id]);

  // Get user display information
  const getUserDisplayInfo = () => {
    if (!user) {
      return {
        name: "Guest User",
        subtitle: "Water User Portal",
        accountInfo: "Please log in",
        statusColor: colors.grey[500]
      };
    }

    const displayName = user.display_name || 
                       user.full_name || 
                       `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                       user.contact_person || 
                       'User';

    const accountTypeLabel = user.account_type === 'household' ? 'Household Account' : 'Institution Account';
    const statusColor = user.status === 'active' ? colors.greenAccent[500] : 
                       user.status === 'suspended' ? colors.redAccent[500] : 
                       colors.grey[500];

    let subtitle = "Water User Portal";
    let accountInfo = accountTypeLabel;

    if (user.account_type === 'household' && user.village) {
      accountInfo = `${accountTypeLabel} • ${user.village}`;
    } else if (user.account_type === 'institution' && user.institution_name) {
      subtitle = user.institution_name;
      accountInfo = user.institution_type ? `${user.institution_type} • ${accountTypeLabel}` : accountTypeLabel;
    }

    return {
      name: displayName,
      subtitle: subtitle,
      accountInfo: accountInfo,
      statusColor: statusColor
    };
  };

  const userInfo = getUserDisplayInfo();

  return (
    <Box
      sx={{
        "& .pro-sidebar-inner": {
          background: `${colors.primary[400]} !important`,
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "5px 35px 5px 20px !important",
          color: `${colors.grey[100]} !important`,
          position: "relative",
        },
        "& .pro-inner-item:hover": {
          color: "#868dfb !important",
        },
        "& .pro-menu-item.active > .pro-inner-item": {
          color: "#6870fa !important",
        },
        "& .pro-menu-item.active > .pro-inner-item > .pro-icon-wrapper .pro-icon": {
          color: "#6870fa !important",
        },
        "& .pro-menu-item.active > .pro-inner-item::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          backgroundColor: "#6870fa",
          borderRadius: "0 2px 2px 0",
        },
        "& .pro-menu-item.active": {
          backgroundColor: "rgba(104, 112, 250, 0.12) !important",
          borderRadius: "0 8px 8px 0",
          marginRight: "8px",
        },
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu iconShape="square">
          {/* LOGO AND MENU ICON */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "10px 0 20px 0",
              color: colors.grey[100],
            }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml="15px"
              >
                <Box display="flex" alignItems="center">
                <Box
                  component="img"
                  src="/assets/logo.jpg"
                  alt="BWP Logo"
                  sx={{
                    height: 48,
                    width: "auto",
                    borderRadius: "8px",
                    mr: 1,
                  }}
                />
              </Box>

                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {!isCollapsed && (
            <Box mb="25px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  alt="profile-user"
                  width="100px"
                  height="100px"
                  src={user?.avatar || `../../assets/user.png`}
                  onError={(e) => {
                    console.log('Client sidebar avatar failed to load:', user?.avatar);
                    e.target.src = `../../assets/user.png`;
                  }}
                  onLoad={() => {
                    console.log('Client sidebar avatar loaded successfully:', user?.avatar);
                  }}
                  style={{ cursor: "pointer", borderRadius: "50%" }}
                  key={user?.avatar || 'default'} // Force re-render when avatar changes
                />
              </Box>
              <Box textAlign="center" px={2}>
                <Typography
                  variant="h3"
                  color={colors.grey[100]}
                  fontWeight="bold"
                  sx={{ 
                    m: "10px 0 5px 0",
                    fontSize: "1.4rem",
                    lineHeight: 1.2,
                    wordBreak: "break-word"
                  }}
                >
                  {userInfo.name}
                </Typography>
                
                <Typography 
                  variant="h6" 
                  color={colors.greenAccent[500]}
                  sx={{ 
                    fontSize: "0.9rem",
                    mb: 1,
                    fontWeight: 500
                  }}
                >
                  {userInfo.subtitle}
                </Typography>

                <Box display="flex" justifyContent="center" mb={1}>
                  <Chip
                    label={user?.status?.toUpperCase() || 'GUEST'}
                    size="small"
                    sx={{
                      backgroundColor: userInfo.statusColor,
                      color: colors.grey[900],
                      fontWeight: 'bold',
                      fontSize: '0.7rem'
                    }}
                  />
                </Box>

                <Typography 
                  variant="body2" 
                  color={colors.grey[300]}
                  sx={{ 
                    fontSize: "0.75rem",
                    lineHeight: 1.3,
                    mb: 1
                  }}
                >
                  {userInfo.accountInfo}
                </Typography>

                {user && (
                  <>
                    <Divider sx={{ borderColor: colors.grey[600], my: 1 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography 
                        variant="caption" 
                        color={colors.grey[400]}
                        sx={{ fontSize: "0.65rem" }}
                      >
                        ID: {user.id}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color={colors.grey[400]}
                        sx={{ fontSize: "0.65rem" }}
                      >
                        {user.account_type === 'household' && user.plot_number ? `Plot: ${user.plot_number}` : 
                         user.account_type === 'institution' && user.contact_person ? `Contact: ${user.contact_person}` : 
                         'Client Portal'}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          )}

          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Item
              title={t("Dashboard")}
              to=""
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            {/* My Account */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              {t("My Account")}
            </Typography>
            <SubMenu title={t("My Account")} icon={<PersonOutlinedIcon />}>
              <Item
                title={t("Profile Information")}
                to="profile"
                icon={<PersonOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Profile History")}
                to="profile-history"
                icon={<HistoryOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Connection Details")}
                to="connection"
                icon={<LocalDrinkIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Document Upload")}
                to="documents"
                icon={<ReceiptOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Account Status Management */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              {t("Account Status")}
            </Typography>
            <SubMenu title={t("Account Status")} icon={<NotificationsActiveOutlinedIcon />}>
              <Item
                title={t("Account Status")}
                to="account-status"
                icon={<NotificationsActiveOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Service Requests")}
                to="service-requests"
                icon={<ReceiptOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Billing & Payments */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              {t("Billing & Payments")}
            </Typography>
            <SubMenu title={t("Billing & Payments")} icon={<AccountBalanceWalletOutlinedIcon />}>
              <Item
                title={t("Current Bill")}
                to="current-bill"
                icon={<ReceiptOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Payment History")}
                to="payment-history"
                icon={<AccountBalanceWalletOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Make Payment")}
                to="make-payment"
                icon={<AccountBalanceWalletOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Payment Plans")}
                to="payment-plans"
                icon={<AccountBalanceWalletOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Reading History")}
                to="meter-reading-history"
                icon={<SpeedOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Water Usage & Analytics */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              {t("Water Usage & Analytics")}
            </Typography>
            <SubMenu title={t("Water Usage & Analytics")} icon={<LocalDrinkIcon />}>
              <Item
                title={t("Usage Overview")}
                to="usage-overview"
                icon={<TrendingUpOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Consumption Trends")}
                to="consumption-trends"
                icon={<TrendingUpOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Leak Alerts")}
                to="leak-alerts"
                icon={<ReportProblemOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Export Data")}
                to="export-data"
                icon={<ReceiptOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Support & Service Requests */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              {t("Support & Service Requests")}
            </Typography>
            <SubMenu title={t("Support & Service Requests")} icon={<SupportAgentOutlinedIcon />}>
              <Item
                title={t("Report Issue")}
                to="report-issue"
                icon={<ReportProblemOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Track Tickets")}
                to="track-tickets"
                icon={<SupportAgentOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Chat Support")}
                to="chat-support"
                icon={<SupportAgentOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Community & Engagement */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              {t("Community & Engagement")}
            </Typography>
            <SubMenu title={t("Community & Engagement")} icon={<GroupsOutlinedIcon />}>
              <Item
                title={t("Announcements")}
                to="announcements"
                icon={<CampaignOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Community Polls")}
                to="community-polls"
                icon={<GroupsOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Events & Meetings")}
                to="events"
                icon={<EventOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Community Volunteers")}
                to="volunteers"
                icon={<GroupsOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Marketplace Access */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              {t("Marketplace Access")}
            </Typography>
            <SubMenu title={t("Marketplace Access")} icon={<StoreOutlinedIcon />}>
              <Item
                title={t("Browse Marketplace")}
                to="marketplace"
                icon={<StoreOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("My Ads")}
                to="my-ads"
                icon={<ShoppingCartOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Featured Partners")}
                to="featured-partners"
                icon={<StoreOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Projects & Developments */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              {t("Projects & Developments")}
            </Typography>
            <SubMenu title={t("Projects & Developments")} icon={<ConstructionOutlinedIcon />}>
              <Item
                title={t("Ongoing Projects")}
                to="ongoing-projects"
                icon={<ConstructionOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Completed Projects")}
                to="completed-projects"
                icon={<TimelineOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Project Map")}
                to="project-map"
                icon={<ConstructionOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Knowledge Base & FAQ */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              {t("Knowledge Base & FAQ")}
            </Typography>
            <SubMenu title={t("Knowledge Base & FAQ")} icon={<MenuBookOutlinedIcon />}>
              <Item
                title={t("Help Articles")}
                to="help-articles"
                icon={<MenuBookOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("FAQ")}
                to="faq"
                icon={<HelpOutlineOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Water Quality Guide")}
                to="water-quality"
                icon={<LocalDrinkIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Advanced Features */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              {t("Advanced Features")}
            </Typography>
            <SubMenu title={t("Advanced Features")} icon={<NatureIcon />}>
              <Item
                title={t("Carbon Footprint Calculator")}
                to="carbon-footprint"
                icon={<NatureIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Settings & Notifications */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              {t("Settings & Notifications")}
            </Typography>
            <SubMenu title={t("Settings & Notifications")} icon={<SettingsOutlinedIcon />}>
              <Item
                title={t("Notification Preferences")}
                to="notifications"
                icon={<NotificationsOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Language Settings")}
                to="language"
                icon={<SettingsOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title={t("Security Settings")}
                to="security"
                icon={<SettingsOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;