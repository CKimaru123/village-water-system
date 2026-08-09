import React from 'react';
import ClientApp from './ClientApp';

const clientCSS = `
  @import url("https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap");
  .client-dashboard-container { height:100vh; width:100vw; font-family:"Source Sans Pro",sans-serif; margin:0; padding:0; overflow:hidden; }
  .client-dashboard-container .app { height:100%; width:100%; display:flex; position:relative; overflow:hidden; }
  .client-dashboard-container .content { height:100%; min-width:0; flex:1; overflow-x:hidden; overflow-y:auto; }
  .client-dashboard-container main { overflow:auto !important; height:calc(100vh - 60px) !important; padding-bottom:40px !important; }
  .client-dashboard-container main.content { overflow-y:auto !important; overflow-x:hidden !important; height:100% !important; max-height:calc(100vh - 60px) !important; }
  .client-dashboard-container * { font-family:"Source Sans Pro",sans-serif !important; }
  .client-dashboard-container h1,.client-dashboard-container .MuiTypography-h1 { font-size:32px !important; font-weight:600 !important; }
  .client-dashboard-container h2,.client-dashboard-container .MuiTypography-h2 { font-size:28px !important; font-weight:600 !important; }
  .client-dashboard-container h3,.client-dashboard-container .MuiTypography-h3 { font-size:24px !important; font-weight:600 !important; }
  .client-dashboard-container h4,.client-dashboard-container .MuiTypography-h4 { font-size:20px !important; font-weight:600 !important; }
  .client-dashboard-container h5,.client-dashboard-container .MuiTypography-h5 { font-size:16px !important; font-weight:600 !important; }
  .client-dashboard-container p,.client-dashboard-container span,.client-dashboard-container div,.client-dashboard-container .MuiTypography-body1 { font-size:14px !important; }
  .client-dashboard-container .MuiTypography-body2 { font-size:12px !important; }
  .client-dashboard-container .MuiButton-root { font-size:14px !important; font-weight:500 !important; }
  .client-dashboard-container .MuiInputBase-root,.client-dashboard-container .MuiFormLabel-root { font-size:14px !important; }
  .client-dashboard-container .MuiTableCell-root,.client-dashboard-container .MuiMenuItem-root { font-size:14px !important; }
  .client-dashboard-container .MuiListItemText-primary { font-size:14px !important; }
  .client-dashboard-container .MuiListItemText-secondary { font-size:12px !important; }
  .client-dashboard-container ::-webkit-scrollbar { width:10px; }
  .client-dashboard-container ::-webkit-scrollbar-track { background:#e0e0e0; }
  .client-dashboard-container ::-webkit-scrollbar-thumb { background:#888; }
  .client-dashboard-container ::-webkit-scrollbar-thumb:hover { background:#555; }

  /* ── Responsive: tablet and mobile ─────────────────────────────────── */
  @media (max-width: 899px) {
    /* Content takes full width when sidebar is in overlay mode */
    .client-dashboard-container .content {
      width: 100% !important;
      max-width: 100vw !important;
      min-width: 0 !important;
    }
    .client-dashboard-container main.content {
      width: 100% !important;
      max-width: 100vw !important;
    }
    /* Prevent the pro-sidebar from taking up layout space on mobile */
    .client-dashboard-container .app .pro-sidebar {
      height: 100vh !important;
    }
    /* Tables scroll horizontally */
    .client-dashboard-container .MuiTableContainer-root {
      overflow-x: auto !important;
    }
    /* DataGrid horizontal scroll */
    .client-dashboard-container .MuiDataGrid-root {
      overflow-x: auto !important;
    }
    /* Reduce page padding on tablet */
    .client-dashboard-container main > div { padding: 12px !important; }
  }

  @media (max-width: 599px) {
    /* Tighter heading sizes on phones */
    .client-dashboard-container h1,.client-dashboard-container .MuiTypography-h1 { font-size:22px !important; }
    .client-dashboard-container h2,.client-dashboard-container .MuiTypography-h2 { font-size:19px !important; }
    .client-dashboard-container h3,.client-dashboard-container .MuiTypography-h3 { font-size:17px !important; }
    .client-dashboard-container h4,.client-dashboard-container .MuiTypography-h4 { font-size:15px !important; }
    .client-dashboard-container h5,.client-dashboard-container .MuiTypography-h5 { font-size:13px !important; }
    /* Stop horizontal overflow on phone */
    .client-dashboard-container .app {
      overflow-x: hidden !important;
    }
    .client-dashboard-container main.content {
      overflow-x: hidden !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    /* Thinner scrollbar on mobile */
    .client-dashboard-container ::-webkit-scrollbar { width: 4px; }
  }
`;

const ClientDashboardWrapper: React.FC = () => (
  <>
    <style>{clientCSS}</style>
    <div className="client-dashboard-container">
      <ClientApp />
    </div>
  </>
);

export default ClientDashboardWrapper;
