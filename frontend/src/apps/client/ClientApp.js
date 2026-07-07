import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import { NotificationsProvider } from "../../context/NotificationsContext";


// My Account Pages
import ProfileInformation from "./scenes/pages/My Account/ProfileInformation";
import ConnectionDetails from "./scenes/pages/My Account/ConnectionDetails";
import DocumentUpload from "./scenes/pages/My Account/DocumentUpload";
import ProfileHistory from "./scenes/pages/My Account/ProfileHistory";

// Billing & Payments Pages
import CurrentBill from "./scenes/pages/Billing & Payments/CurrentBill";
import PaymentHistory from "./scenes/pages/Billing & Payments/PaymentHistory";
import MakePayment from "./scenes/pages/Billing & Payments/MakePayment";
import PaymentPlans from "./scenes/pages/Billing & Payments/PaymentPlans";
import MeterReadingHistory from "./scenes/pages/Billing & Payments/MeterReadingHistory";

// Water Usage & Analytics Pages
import UsageOverview from "./scenes/pages/Water Usage & Analytics/UsageOverview";
import ConsumptionTrends from "./scenes/pages/Water Usage & Analytics/ConsumptionTrends";
import LeakAlerts from "./scenes/pages/Water Usage & Analytics/LeakAlerts";
import ExportData from "./scenes/pages/Water Usage & Analytics/ExportData";

// Support & Service Requests Pages
import ReportIssue from "./scenes/pages/Support & Service Requests/ReportIssue";
import TrackTickets from "./scenes/pages/Support & Service Requests/TrackTickets";
import ChatSupport from "./scenes/pages/Support & Service Requests/ChatSupport";

// Community & Engagement Pages
import Announcements from "./scenes/pages/Community & Engagement/Announcements";
import CommunityPolls from "./scenes/pages/Community & Engagement/CommunityPolls";
import Events from "./scenes/pages/Community & Engagement/Events";
import CommunityVolunteers from "./scenes/pages/Community & Engagement/CommunityVolunteers";

// Marketplace Access Pages
import Marketplace from "./scenes/pages/Marketplace Access/Marketplace";
import MyAds from "./scenes/pages/Marketplace Access/MyAds";
import FeaturedPartners from "./scenes/pages/Marketplace Access/FeaturedPartners";

// Projects & Developments Pages
import OngoingProjects from "./scenes/pages/Projects & Developments/OngoingProjects";
import CompletedProjects from "./scenes/pages/Projects & Developments/CompletedProjects";
import ProjectMap from "./scenes/pages/Projects & Developments/ProjectMap";

// Knowledge Base & FAQ Pages
import HelpArticles from "./scenes/pages/Knowledge Base & FAQ/HelpArticles";
import FAQ from "./scenes/pages/Knowledge Base & FAQ/FAQ";
import WaterQualityGuide from "./scenes/pages/Knowledge Base & FAQ/WaterQualityGuide";

// Settings & Notifications Pages
import NotificationPreferences from "./scenes/pages/Settings & Notifications/NotificationPreferences";
import LanguageSettings from "./scenes/pages/Settings & Notifications/LanguageSettings";
import SecuritySettings from "./scenes/pages/Settings & Notifications/SecuritySettings";

// Advanced Features
import CarbonFootprintCalculator from "./scenes/pages/Advanced Features/CarbonFootprintCalculator";

// Account Status Management
import AccountStatus from "./scenes/pages/AccountStatus";
import ServiceRequests from "./scenes/pages/ServiceRequests";

function ClientApp() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationsProvider>
          <div className="app" style={{ backgroundColor: theme.palette.background.default }}>
            <Sidebar isSidebar={isSidebar} />
            <main className="content" style={{ backgroundColor: theme.palette.background.default }}>
              <Topbar setIsSidebar={setIsSidebar} />
            <Routes>
              <Route index element={<Dashboard />} />
              
              {/* My Account */}
              <Route path="profile" element={<ProfileInformation />} />
              <Route path="profile-history" element={<ProfileHistory />} />
              <Route path="connection" element={<ConnectionDetails />} />
              <Route path="documents" element={<DocumentUpload />} />
              
              {/* Billing & Payments */}
              <Route path="current-bill" element={<CurrentBill />} />
              <Route path="payment-history" element={<PaymentHistory />} />
              <Route path="make-payment" element={<MakePayment />} />
              <Route path="payment-plans" element={<PaymentPlans />} />
              <Route path="meter-reading-history" element={<MeterReadingHistory />} />
              
              {/* Water Usage & Analytics */}
              <Route path="usage-overview" element={<UsageOverview />} />
              <Route path="consumption-trends" element={<ConsumptionTrends />} />
              <Route path="leak-alerts" element={<LeakAlerts />} />
              <Route path="export-data" element={<ExportData />} />
              
              {/* Support & Service Requests */}
              <Route path="report-issue" element={<ReportIssue />} />
              <Route path="track-tickets" element={<TrackTickets />} />
              <Route path="chat-support" element={<ChatSupport />} />
              
              {/* Community & Engagement */}
              <Route path="announcements" element={<Announcements />} />
              <Route path="community-polls" element={<CommunityPolls />} />
              <Route path="events" element={<Events />} />
              <Route path="volunteers" element={<CommunityVolunteers />} />
              
              {/* Marketplace Access */}
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="my-ads" element={<MyAds />} />
              <Route path="featured-partners" element={<FeaturedPartners />} />
              
              {/* Projects & Developments */}
              <Route path="ongoing-projects" element={<OngoingProjects />} />
              <Route path="completed-projects" element={<CompletedProjects />} />
              <Route path="project-map" element={<ProjectMap />} />
              
              {/* Knowledge Base & FAQ */}
              <Route path="help-articles" element={<HelpArticles />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="water-quality" element={<WaterQualityGuide />} />
              
              {/* Settings & Notifications */}
              <Route path="notifications" element={<NotificationPreferences />} />
              <Route path="language" element={<LanguageSettings />} />
              <Route path="security" element={<SecuritySettings />} />
              
              {/* Advanced Features */}
              <Route path="carbon-footprint" element={<CarbonFootprintCalculator />} />
              
              {/* Account Status Management */}
              <Route path="account-status" element={<AccountStatus />} />
              <Route path="service-requests" element={<ServiceRequests />} />
            </Routes>
            </main>
          </div>
        </NotificationsProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
  );
}

export default ClientApp;
