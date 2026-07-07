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
