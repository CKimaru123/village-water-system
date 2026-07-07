import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import Team from "./scenes/team";
import Invoices from "./scenes/invoices";
import Contacts from "./scenes/contacts";
import Bar from "./scenes/bar";
import Form from "./scenes/form";
import Line from "./scenes/line";
import Pie from "./scenes/pie";
import FAQ from "./scenes/faq";
import Geography from "./scenes/geography";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import Calendar from "./scenes/calendar/calendar";
import { NotificationsProvider } from "../../context/NotificationsContext";


// Finance and Billing
import TariffManagement from "./scenes/pages/Finance and Billing/TariffManagement";
import InvoiceGeneration from "./scenes/pages/Finance and Billing/InvoiceGeneration";
import DunningWorkflow from "./scenes/pages/Finance and Billing/DunningWorkflow";
import DepositAndConnectionFee from "./scenes/pages/Finance and Billing/DepositAndConnectionFee";
import RefundApproval from "./scenes/pages/Finance and Billing/RefundApproval";
import Reconciliation from "./scenes/pages/Finance and Billing/Reconciliation";
import FinancialReports from "./scenes/pages/Finance and Billing/FinancialReports";
import SubsidyWaiverPrograms from "./scenes/pages/Finance and Billing/SubsidyWaiverPrograms";
import ExportTools from "./scenes/pages/Finance and Billing/ExportTools";
import DocumentGenerator from "./scenes/pages/Finance and Billing/DocumentGenerator";
import ClientLookup from "./scenes/pages/Finance and Billing/ClientLookup";
import ClientProfileEdit from "./scenes/pages/Finance and Billing/ClientProfileEdit";
import MeterReadingEntry from "./scenes/pages/Finance and Billing/MeterReadingEntry";
import BulkPaymentPrompt from "./scenes/pages/Finance and Billing/BulkPaymentPrompt";
import BillingModeConfig from "./scenes/pages/Finance and Billing/BillingModeConfig";

// Operations and Assets
import AssetsRegister from "./scenes/pages/Operations and Assets/AssetRegister"
import PreventiveMaintenance from "./scenes/pages/Operations and Assets/PreventiveMaintenance";
import IncidentManagement from "./scenes/pages/Operations and Assets/IncidentManagement";
import GISMap from "./scenes/pages/Operations and Assets/GISMap"
import ValveOperationsRationing from "./scenes/pages/Operations and Assets/ValveOperationsRationing"
import InventorySpares from "./scenes/pages/Operations and Assets/InventorySpares";
import EnergyFuelTracking from "./scenes/pages/Operations and Assets/EnergyFuelTracking";
import SCADAIntegration from "./scenes/pages/Operations and Assets/SCADAIntegration";

// Community and Governance
import AnnouncementsCampaigns from "./scenes/pages/Community & Governance/AnnouncementsCampaigns";
import EventMeetingScheduler from "./scenes/pages/Community & Governance/EventMeetingScheduler";
import CommunityPollsAnalytics from "./scenes/pages/Community & Governance/CommunityPollsAnalytics";
import TransparencyDashboards from "./scenes/pages/Community & Governance/TransparencyDashboards";
import DocumentRepository from "./scenes/pages/Community & Governance/DocumentRepository";
import KnowledgeBase from "./scenes/pages/Community & Governance/KnowledgeBase";
import TeamCollaboration from "./scenes/pages/Community & Governance/TeamCollaboration";

// Projects and Contractors
import ProjectTracker from "./scenes/pages/Projects & Contractors/ProjectTracker";
import ContractorPortal from "./scenes/pages/Projects & Contractors/ContractorPortal";
import ProcurementWorkflows from "./scenes/pages/Projects & Contractors/ProcurementWorkflows";
import DonorGrantsManagement from "./scenes/pages/Projects & Contractors/DonorGrantsManagement";
import CarbonFootprintAnalysis from "./scenes/pages/Projects & Contractors/CarbonFootprintAnalysis";

// Support & Engagement
import MultiChannelTicketing from "./scenes/pages/Support & Engagement/MultiChannelTicketing";
import EscalationSLATracking from "./scenes/pages/Support & Engagement/EscalationSLATracking";
import CannedResponsesKnowledgeBase from "./scenes/pages/Support & Engagement/CannedResponsesKnowledgeBase";
import CommunityVolunteerManagement from "./scenes/pages/Support & Engagement/CommunityVolunteerManagement";
import ChatSessions from "./scenes/pages/Support & Engagement/ChatSessions";

// Security & Compliance
import RoleBasedAccessControl from "./scenes/pages/Security & Compliance/RoleBasedAccessControl";
import AuditLogs from "./scenes/pages/Security & Compliance/AuditLogs";
import ConsentAndDataPrivacy from "./scenes/pages/Security & Compliance/ConsentAndDataPrivacy";
import AccessReviews from "./scenes/pages/Security & Compliance/AccessReviews";
import EFilingRegulatoryCompliance from "./scenes/pages/Security & Compliance/EFilingRegulatoryCompliance";
import MobileAppExtensions from "./scenes/pages/Security & Compliance/MobileAppExtensions";
import DocumentVerification from "./scenes/pages/Security & Compliance/DocumentVerification";

// System Management
import MultiTenantReadiness from "./scenes/pages/System Management/MultiTenantReadiness";
import APIAndWebhooks from "./scenes/pages/System Management/APIAndWebhooks";
import BackupsAndMonitoring from "./scenes/pages/System Management/BackupsAndMonitoring";
import DeviceCompatibility from "./scenes/pages/System Management/DeviceCompatibility";
import DataImportWizard from "./scenes/pages/System Management/DataImportWizard";
import IoTSmartDeviceIntegration from "./scenes/pages/System Management/IoTSmartDeviceIntegration";
import MarketplaceManagement from "./scenes/pages/System Management/MarketplaceManagement";
import ReadingScheduleConfig from "./scenes/pages/System Management/ReadingScheduleConfig";

// AI and Innovation
import AnomalyDetection from "./scenes/pages/AI and Innovation/AnomalyDetection";
import PredictiveMaintenance from "./scenes/pages/AI and Innovation/PredictiveMaintenance";
import AdvancedSegmentation from "./scenes/pages/AI and Innovation/AdvancedSegmentation";
import VoiceAssistantIntegration from "./scenes/pages/AI and Innovation/VoiceAssistantIntegration";
import BlockchainTransparency from "./scenes/pages/AI and Innovation/BlockchainTransparency";

// Others
import AdminProfile from "./scenes/pages/AdminProfile";
import AdminManagement from "../../pages/AdminManagement";
import RequestQueue from "./scenes/pages/RequestQueue";
import StatusManagement from "./scenes/pages/StatusManagement";

function AdminApp() {
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
              <Route path="team" element={<Team />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="form" element={<Form />} />
              <Route path="bar" element={<Bar />} />
              <Route path="pie" element={<Pie />} />
              <Route path="line" element={<Line />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="geography" element={<Geography />} />

              {/* Financial and Billing */}
              <Route path="tariff" element={<TariffManagement />} />
              <Route path="invoice-generation" element={<InvoiceGeneration />} />
              <Route path="dunning" element={<DunningWorkflow />} />
              <Route path="deposits" element={<DepositAndConnectionFee />} />
              <Route path="refunds" element={<RefundApproval />} />
              <Route path="reconciliation" element={<Reconciliation />} />
              <Route path="financial-reports" element={<FinancialReports />} />
              <Route path="subsidy" element={<SubsidyWaiverPrograms />} />
              <Route path="document-generator" element={<DocumentGenerator />} />
              <Route path="export-tools" element={<ExportTools />} />
              <Route path="client-lookup" element={<ClientLookup />} />
              <Route path="client-profile-edit" element={<ClientProfileEdit />} />
              <Route path="meter-readings" element={<MeterReadingEntry />} />
              <Route path="billing-mode" element={<BillingModeConfig />} />
              <Route path="bulk-payment-prompt" element={<BulkPaymentPrompt />} />

              {/* Operations & Assets */}
              <Route path="assets" element={<AssetsRegister />} />
              <Route path="maintenance" element={<PreventiveMaintenance />} />
              <Route path="incidents" element={<IncidentManagement />} />
              <Route path="gis-map" element={<GISMap />} />
              <Route path="valves" element={<ValveOperationsRationing />} />
              <Route path="inventory" element={<InventorySpares />} />
              <Route path="energy" element={<EnergyFuelTracking />} />
              <Route path="scada" element={<SCADAIntegration />} />

              {/* Community and Governance */}
              <Route path="announcements" element={<AnnouncementsCampaigns />} />
              <Route path="events" element={<EventMeetingScheduler />} />
              <Route path="polls" element={<CommunityPollsAnalytics />} />
              <Route path="transparency" element={<TransparencyDashboards />} />
              <Route path="documents" element={<DocumentRepository />} />
              <Route path="knowledge-base" element={<KnowledgeBase />} />
              <Route path="collaboration" element={<TeamCollaboration />} />

              {/* Projects and Contractors */}
              <Route path="project-tracker" element={<ProjectTracker />} />
              <Route path="contractors" element={<ContractorPortal />} />
              <Route path="procurement" element={<ProcurementWorkflows />} />
              <Route path="grants" element={<DonorGrantsManagement />} />
              <Route path="carbon-footprint-analysis" element={<CarbonFootprintAnalysis />} />

              {/* Support & Engagement */}
              <Route path="ticketing" element={<MultiChannelTicketing />} />
              <Route path="sla-tracking" element={<EscalationSLATracking />} />
              <Route path="canned-responses" element={<CannedResponsesKnowledgeBase />} />
              <Route path="community" element={<CommunityVolunteerManagement />} />
              <Route path="chat-sessions" element={<ChatSessions />} />

              {/* Security & Compliance */}
              <Route path="access-control" element={<RoleBasedAccessControl />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="data-privacy" element={<ConsentAndDataPrivacy />} />
              <Route path="access-reviews" element={<AccessReviews />} />
              <Route path="e-filing" element={<EFilingRegulatoryCompliance />} />
              <Route path="mobile-extensions" element={<MobileAppExtensions />} />

              {/* System Management */}
              <Route path="multi-tenant" element={<MultiTenantReadiness />} />
              <Route path="api-webhooks" element={<APIAndWebhooks />} />
              <Route path="backups-monitoring" element={<BackupsAndMonitoring />} />
              <Route path="device-compatibility" element={<DeviceCompatibility />} />
              <Route path="data-import" element={<DataImportWizard />} />
              <Route path="iot-integration" element={<IoTSmartDeviceIntegration />} />
              <Route path="marketplace-management" element={<MarketplaceManagement />} />
              <Route path="reading-schedules" element={<ReadingScheduleConfig />} />

              {/* AI and Innovation */}
              <Route path="ai-anomalies" element={<AnomalyDetection />} />
              <Route path="predictive-maintenance" element={<PredictiveMaintenance />} />
              <Route path="ai-segmentation" element={<AdvancedSegmentation />} />
              <Route path="voice-assistants" element={<VoiceAssistantIntegration />} />
              <Route path="blockchain-ledger" element={<BlockchainTransparency />} />

              {/* others */}
              <Route path="profile" element={<AdminProfile />} />
              <Route path="admin-management" element={<AdminManagement />} />
              <Route path="status-management" element={<StatusManagement />} />
              <Route path="request-queue" element={<RequestQueue />} />
              <Route path="document-verification" element={<DocumentVerification />} />
            </Routes>
            </main>
          </div>
        </NotificationsProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
  );
}

export default AdminApp;
