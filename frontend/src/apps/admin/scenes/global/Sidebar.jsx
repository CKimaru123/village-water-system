import { useState, useEffect } from "react";
import { ProSidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme, Chip, Divider } from "@mui/material";
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";
import { useAuth } from "../../../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

// Finance and Billing
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";   // Tariffs
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";   // Invoices
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined"; // Dunning
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined"; // Deposits
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";                 // Refunds/Reversals
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined"; // Reconciliation
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined"; // Subsidy/Waiver
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined"; // Export Tools
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined"; // Client Lookup
import NatureOutlinedIcon from "@mui/icons-material/NatureOutlined"; // Carbon Footprint

import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

// Operations and Assets
import {
  BuildCircleOutlined as BuildCircleOutlinedIcon,
  Inventory2Outlined as Inventory2OutlinedIcon,
  BuildOutlined as BuildOutlinedIcon,
  ReportProblemOutlined as ReportProblemOutlinedIcon,
  PlumbingOutlined as PlumbingOutlinedIcon,
  CategoryOutlined as CategoryOutlinedIcon,
  BatteryChargingFullOutlined as BatteryChargingFullOutlinedIcon,
  SettingsInputComponentOutlined as SettingsInputComponentOutlinedIcon,
} from "@mui/icons-material";

// Community and Governance
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";

//Projects and Contractors
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";

// Support and Engagement
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";

// Security and Compliance
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import SmartphoneOutlinedIcon from "@mui/icons-material/SmartphoneOutlined";
import DescriptionIcon from "@mui/icons-material/Description";

// System Management
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";
import DevicesOtherOutlinedIcon from "@mui/icons-material/DevicesOtherOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import SensorsOutlinedIcon from "@mui/icons-material/SensorsOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";

// AI and Innovations
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import ScatterPlotOutlinedIcon from "@mui/icons-material/ScatterPlotOutlined";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import CurrencyBitcoinOutlinedIcon from "@mui/icons-material/CurrencyBitcoinOutlined";

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const location = useLocation();

  // Active when the current path ends with the item's route segment
  const targetPath = to === "" ? "/admin" : `/admin/${to}`;
  const isActive = to === ""
    ? location.pathname === "/admin" || location.pathname === "/admin/"
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
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  console.log('=== ADMIN SIDEBAR DEBUG ===');
  console.log('User in sidebar:', user);
  console.log('User avatar:', user?.avatar);
  console.log('===========================');

  // Force re-render when user changes
  useEffect(() => {
    console.log('Admin sidebar user changed:', user?.avatar);
    // Force a small delay to ensure DOM updates
    if (user?.avatar) {
      setTimeout(() => {
        console.log('Admin sidebar avatar should be visible now:', user.avatar);
      }, 100);
    }
  }, [user?.avatar, user?.id]); // Also depend on user ID to catch user changes

  // Get admin user display information
  const getAdminDisplayInfo = () => {
    if (!user) {
      return {
        name: "Guest Admin",
        subtitle: "Management Portal",
        accountInfo: "Please log in",
        statusColor: colors.grey[500]
      };
    }

    const displayName = user.display_name || 
                       user.full_name || 
                       `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                       user.contact_person || 
                       'Administrator';

    const roleLabel = user.role === 'super_admin' ? 'Super Administrator' : 
                     user.role === 'admin' ? 'Administrator' : 'User';
    
    const statusColor = user.status === 'active' ? colors.greenAccent[500] : 
                       user.status === 'suspended' ? colors.redAccent[500] : 
                       colors.grey[500];

    let subtitle = "Management Portal";
    let accountInfo = roleLabel;

    if (user.account_type === 'household' && user.village) {
      accountInfo = `${roleLabel} • ${user.village}`;
    } else if (user.account_type === 'institution' && user.institution_name) {
      subtitle = user.institution_name;
      accountInfo = user.institution_type ? `${roleLabel} • ${user.institution_type}` : roleLabel;
    }

    return {
      name: displayName,
      subtitle: subtitle,
      accountInfo: accountInfo,
      statusColor: statusColor
    };
  };

  const adminInfo = getAdminDisplayInfo();

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
                    console.log('Admin sidebar avatar failed to load:', user?.avatar);
                    e.target.src = `../../assets/user.png`;
                  }}
                  onLoad={() => {
                    console.log('Admin sidebar avatar loaded successfully:', user?.avatar);
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
                  {adminInfo.name}
                </Typography>
                
                <Typography 
                  variant="h6" 
                  color={colors.blueAccent[500]}
                  sx={{ 
                    fontSize: "0.9rem",
                    mb: 1,
                    fontWeight: 500
                  }}
                >
                  {adminInfo.subtitle}
                </Typography>

                <Box display="flex" justifyContent="center" mb={1}>
                  <Chip
                    label={user?.status?.toUpperCase() || 'GUEST'}
                    size="small"
                    sx={{
                      backgroundColor: adminInfo.statusColor,
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
                  {adminInfo.accountInfo}
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
                        {user.role === 'super_admin' ? 'Super Admin' : 
                         user.role === 'admin' ? 'Admin' : 
                         user.account_type === 'household' && user.plot_number ? `Plot: ${user.plot_number}` : 
                         user.account_type === 'institution' && user.contact_person ? `Contact: ${user.contact_person}` : 
                         'Admin Portal'}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          )}

          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Item
              title="Dashboard"
              to=""
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            {/* Finance and Billing */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Finance and Billing
            </Typography>
            <SubMenu title="Finance and Billing" icon={<AttachMoneyIcon />}>
              <Item
                title="Client Lookup"
                to="client-lookup"
                icon={<PersonSearchOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Tariff Management"
                to="tariff"
                icon={<ReceiptLongOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Invoice Generation"
                to="invoice-generation"
                icon={<DescriptionOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Dunning Workflows"
                to="dunning"
                icon={<WarningAmberOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Deposits & Connection Fees"
                to="deposits"
                icon={<AccountBalanceWalletOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Refund/Reversal Approvals"
                to="refunds"
                icon={<UndoOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Reconciliation"
                to="reconciliation"
                icon={<CompareArrowsOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Financial Reports"
                to="financial-reports"
                icon={<BarChartOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Subsidy/Waiver Programs"
                to="subsidy"
                icon={<VolunteerActivismOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Meter Reading Entry"
                to="meter-readings"
                icon={<SpeedOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Billing Mode Config"
                to="billing-mode"
                icon={<AttachMoneyIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Document Generator"
                to="document-generator"
                icon={<DescriptionOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Export Tools"
                to="export-tools"
                icon={<FileDownloadOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Operations and Assets */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Operations & Assets
            </Typography>
            <SubMenu title="Operations & Assets" icon={<BuildCircleOutlinedIcon />}>
              <Item
                title="Asset Register"
                to="assets"
                icon={<Inventory2OutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Preventive Maintenance"
                to="maintenance"
                icon={<BuildOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Incident Management"
                to="incidents"
                icon={<ReportProblemOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="GIS Map"
                to="gis-map"
                icon={<MapOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Valve Operations & Rationing"
                to="valves"
                icon={<PlumbingOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Inventory & Spares"
                to="inventory"
                icon={<CategoryOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Energy & Fuel Tracking"
                to="energy"
                icon={<BatteryChargingFullOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="SCADA Integration"
                to="scada"
                icon={<SettingsInputComponentOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Community & Governance */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Community & Governance
            </Typography>
            <SubMenu title="Community & Governance" icon={<GroupsOutlinedIcon />}>
              <Item
                title="Announcements & Campaigns"
                to="announcements"
                icon={<CampaignOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Event & Meeting Scheduler"
                to="events"
                icon={<EventOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Community Polls & Analytics"
                to="polls"
                icon={<HowToVoteOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Transparency Dashboards"
                to="transparency"
                icon={<InsightsOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Document Repository"
                to="documents"
                icon={<FolderOpenOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Knowledge Base & FAQs"
                to="knowledge-base"
                icon={<MenuBookOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Team Collaboration"
                to="collaboration"
                icon={<ChatOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Projects & Contractors */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Projects & Contractors
            </Typography>
            <SubMenu title="Projects & Contractors" icon={<WorkOutlineOutlinedIcon />}>
              <Item
                title="Project Tracker"
                to="project-tracker"
                icon={<TimelineOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Contractor / Vendor Portal"
                to="contractors"
                icon={<HandshakeOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Procurement Workflows"
                to="procurement"
                icon={<RequestQuoteOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Donor & Grants Management"
                to="grants"
                icon={<VolunteerActivismOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Carbon Footprint Analysis"
                to="carbon-footprint-analysis"
                icon={<NatureOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Support & Engagement */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Support & Engagement
            </Typography>
            <SubMenu title="Support & Engagement" icon={<SupportAgentOutlinedIcon />}>
              <Item
                title="Multi-Channel Ticketing"
                to="ticketing"
                icon={<ChatOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Live Chat Sessions"
                to="chat-sessions"
                icon={<ChatOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Escalation & SLA Tracking"
                to="sla-tracking"
                icon={<TimelineOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Canned Responses & Knowledge Base"
                to="canned-responses"
                icon={<MenuBookOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Community & Volunteer Management"
                to="community"
                icon={<VolunteerActivismOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* Security & Compliance */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Security & Compliance
            </Typography>
            <SubMenu title="Security & Compliance" icon={<SecurityOutlinedIcon />}>
              <Item
                title="Role-Based Access Control"
                to="access-control"
                icon={<AdminPanelSettingsOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              {/* Admin Management - Super Admin Only */}
              {isSuperAdmin && (
                <Item
                  title="Admin Management"
                  to="admin-management"
                  icon={<AdminPanelSettingsOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
              )}
              {/* Status Management - Admin and Super Admin */}
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <Item
                  title="Status Management"
                  to="status-management"
                  icon={<GavelOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
              )}
              {/* Request Queue - Admin and Super Admin */}
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <Item
                  title="Request Queue"
                  to="request-queue"
                  icon={<AssignmentTurnedInOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
              )}
              {/* Document Verification - Admin and Super Admin */}
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <Item
                  title="Document Verification"
                  to="document-verification"
                  icon={<DescriptionIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
              )}
              <Item
                title="Audit Logs"
                to="audit-logs"
                icon={<HistoryOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Consent & Data Privacy"
                to="data-privacy"
                icon={<LockOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Access Reviews"
                to="access-reviews"
                icon={<AssignmentTurnedInOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="E-Filing & Regulatory Compliance"
                to="e-filing"
                icon={<GavelOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Mobile App Extensions"
                to="mobile-extensions"
                icon={<SmartphoneOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* System Management */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              System Management
            </Typography>
            <SubMenu title="System Management" icon={<SettingsOutlinedIcon />}>
              <Item
                title="Multi-Tenant Readiness"
                to="multi-tenant"
                icon={<ApartmentOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="API & Webhooks"
                to="api-webhooks"
                icon={<HubOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Backups & Monitoring"
                to="backups-monitoring"
                icon={<CloudSyncOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Device Compatibility"
                to="device-compatibility"
                icon={<DevicesOtherOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Data Import Wizard"
                to="data-import"
                icon={<UploadFileOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="IoT & Smart Device Integration"
                to="iot-integration"
                icon={<SensorsOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Reading Schedules"
                to="reading-schedules"
                icon={<ScheduleOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Marketplace Management"
                to="marketplace-management"
                icon={<StorefrontOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </SubMenu>

            {/* AI and Innovation */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              AI & Innovation
            </Typography>
            <SubMenu title="AI & Innovation" icon={<AutoAwesomeOutlinedIcon />}>
              <Item
                title="Anomaly Detection"
                to="ai-anomalies"
                icon={<AnalyticsOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Predictive Maintenance"
                to="predictive-maintenance"
                icon={<AnalyticsOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Advanced Segmentation"
                to="ai-segmentation"
                icon={<ScatterPlotOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Voice Assistant Integration"
                to="voice-assistants"
                icon={<MicOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Blockchain Transparency"
                to="blockchain-ledger"
                icon={<CurrencyBitcoinOutlinedIcon />}
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