import React from 'react';
import AdminApp from './AdminApp';

const adminCSS = `
  @import url("https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap");
  .admin-dashboard-container { height:100vh; width:100vw; font-family:"Source Sans Pro",sans-serif; margin:0; padding:0; overflow:auto; }
  .admin-dashboard-container .app { height:100%; width:100%; display:flex; position:relative; overflow:hidden; }
  .admin-dashboard-container .content { height:100%; width:100%; overflow:auto; padding-bottom:20px; }
  .admin-dashboard-container main { overflow:auto !important; height:calc(100vh - 60px) !important; padding-bottom:40px !important; }
  .admin-dashboard-container main.content { overflow-y:auto !important; overflow-x:hidden !important; height:100% !important; max-height:calc(100vh - 60px) !important; }
  .admin-dashboard-container * { font-family:"Source Sans Pro",sans-serif !important; }
  .admin-dashboard-container h1,.admin-dashboard-container .MuiTypography-h1 { font-size:32px !important; font-weight:600 !important; }
  .admin-dashboard-container h2,.admin-dashboard-container .MuiTypography-h2 { font-size:28px !important; font-weight:600 !important; }
  .admin-dashboard-container h3,.admin-dashboard-container .MuiTypography-h3 { font-size:24px !important; font-weight:600 !important; }
  .admin-dashboard-container h4,.admin-dashboard-container .MuiTypography-h4 { font-size:20px !important; font-weight:600 !important; }
  .admin-dashboard-container h5,.admin-dashboard-container .MuiTypography-h5 { font-size:16px !important; font-weight:600 !important; }
  .admin-dashboard-container p,.admin-dashboard-container span,.admin-dashboard-container div,.admin-dashboard-container .MuiTypography-body1 { font-size:14px !important; }
  .admin-dashboard-container .MuiTypography-body2 { font-size:12px !important; }
  .admin-dashboard-container .MuiButton-root { font-size:14px !important; font-weight:500 !important; }
  .admin-dashboard-container .MuiInputBase-root,.admin-dashboard-container .MuiFormLabel-root { font-size:14px !important; }
  .admin-dashboard-container .MuiTableCell-root,.admin-dashboard-container .MuiMenuItem-root { font-size:14px !important; }
  .admin-dashboard-container .MuiListItemText-primary { font-size:14px !important; }
  .admin-dashboard-container .MuiListItemText-secondary { font-size:12px !important; }
  .admin-dashboard-container ::-webkit-scrollbar { width:10px; }
  .admin-dashboard-container ::-webkit-scrollbar-track { background:#e0e0e0; }
  .admin-dashboard-container ::-webkit-scrollbar-thumb { background:#888; }
  .admin-dashboard-container ::-webkit-scrollbar-thumb:hover { background:#555; }
`;

const AdminDashboardWrapper: React.FC = () => (
  <>
    <style>{adminCSS}</style>
    <div className="admin-dashboard-container">
      <AdminApp />
    </div>
  </>
);

export default AdminDashboardWrapper;
