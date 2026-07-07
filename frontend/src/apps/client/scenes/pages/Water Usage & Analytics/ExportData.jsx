import React, { useState } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button,
  FormControl, InputLabel, Select, MenuItem, Chip,
  List, ListItem, ListItemText, ListItemIcon, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Alert, LinearProgress,
} from "@mui/material";
import { tokens } from "../../../theme";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import TableChartIcon from "@mui/icons-material/TableChart";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import PreviewIcon from "@mui/icons-material/Preview";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PolicyIcon from "@mui/icons-material/Policy";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

const ExportData = () => {
  const colors = tokens("dark");

  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedExport, setSelectedExport] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [dateRange, setDateRange] = useState("12months");
  const [format, setFormat] = useState("csv");

  const exportOptions = [
    { id: 1, title: "Usage History", description: "Meter readings, daily/monthly consumption", format: "CSV", icon: <TableChartIcon sx={{ color: colors.blueAccent[500] }} /> },
    { id: 2, title: "Payment History", description: "Invoices, payments, payment plans", format: "PDF", icon: <DescriptionIcon sx={{ color: colors.greenAccent[500] }} /> },
    { id: 3, title: "Bill Statements", description: "Monthly bill statements", format: "PDF", icon: <PictureAsPdfIcon sx={{ color: colors.redAccent[500] }} /> },
    { id: 4, title: "Service Requests", description: "Support tickets and resolutions", format: "CSV", icon: <TableChartIcon sx={{ color: colors.blueAccent[400] }} /> },
  ];

  const recentExports = [
    { id: 1, name: "Usage_History_2024.csv", date: "2025-01-10", size: "2.3 MB" },
    { id: 2, name: "Payment_History_2024.pdf", date: "2025-01-08", size: "1.8 MB" },
    { id: 3, name: "Bill_Statements_2024.pdf", date: "2025-01-05", size: "3.2 MB" },
  ];

  const summaryMap = {
    1: { records: 1247, size: "2.3 MB", time: "2-3 min" },
    2: { records: 8, size: "1.8 MB", time: "1-2 min" },
    3: { records: 12, size: "3.2 MB", time: "2-4 min" },
    4: { records: 3, size: "0.5 MB", time: "1 min" },
    all: { records: 1270, size: "7.8 MB", time: "5-10 min" },
  };

  const openExport = (option) => { setSelectedExport(option); setPreviewOpen(true); };
  const openExportAll = () => {
    setSelectedExport({ id: "all", title: "All Data", format: format.toUpperCase() });
    setPreviewOpen(true);
  };

  const handleConfirm = () => { setPreviewOpen(false); setConfirmOpen(true); };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const buildCSV = (title) => {
    const isAll = title === "All Data";
    const isPayment = title.includes("Payment") || title.includes("Bill");
    const isService = title.includes("Service");

    if (isAll) {
      // Combine all sections
      let out = "=== USAGE HISTORY ===\nPeriod,Consumption (m3),Cost (KES),Status\n";
      out += Array.from({ length: 12 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const m = d.toLocaleString("default", { month: "long", year: "numeric" });
        return `${m},${(7 + Math.random() * 3).toFixed(2)},${(1500 + Math.random() * 1000).toFixed(0)},Recorded`;
      }).join("\n");
      out += "\n\n=== PAYMENT HISTORY ===\nPeriod,Amount (KES),Method,Status\n";
      out += Array.from({ length: 12 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const m = d.toLocaleString("default", { month: "long", year: "numeric" });
        return `${m},${(1500 + Math.random() * 1000).toFixed(0)},M-Pesa,Paid`;
      }).join("\n");
      out += "\n\n=== SERVICE REQUESTS ===\nDate,Subject,Category,Status\n";
      out += "2025-01-10,Meter reading issue,Meter,Resolved\n2024-12-05,Billing query,Billing,Closed\n2024-11-20,Pipe leak,Leak,Resolved";
      return out;
    }
    if (isPayment) {
      const header = "Period,Amount (KES),Payment Method,Transaction Code,Status\n";
      const rows = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const m = d.toLocaleString("default", { month: "long", year: "numeric" });
        return `${m},${(1500 + Math.random() * 1000).toFixed(0)},M-Pesa,TXN-${Date.now() - i * 1000000},Paid`;
      });
      return header + rows.join("\n");
    }
    if (isService) {
      return "Date,Subject,Category,Priority,Status\n2025-01-10,Meter reading issue,Meter,High,Resolved\n2024-12-05,Billing query,Billing,Medium,Closed\n2024-11-20,Pipe leak,Leak,Urgent,Resolved";
    }
    // Usage History (default)
    const header = "Period,Consumption (m3),Cost (KES),Status\n";
    const rows = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const m = d.toLocaleString("default", { month: "long", year: "numeric" });
      return `${m},${(7 + Math.random() * 3).toFixed(2)},${(1500 + Math.random() * 1000).toFixed(0)},Recorded`;
    });
    return header + rows.join("\n");
  };

  const buildHTML = (title, now) => {
    const rangeLabel = dateRange === "12months" ? "Last 12 Months" : dateRange === "6months" ? "Last 6 Months" : "Last 3 Months";
    const rows = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const month = d.toLocaleString("default", { month: "long", year: "numeric" });
      const usage = (7 + Math.random() * 3).toFixed(2);
      const cost = Number((1500 + Math.random() * 1000).toFixed(0)).toLocaleString();
      return `<tr><td>${month}</td><td>${usage}</td><td>KES ${cost}</td><td>Recorded</td></tr>`;
    }).join("");
    return `<!DOCTYPE html><html><head><title>${title}</title>
<style>body{font-family:Arial,sans-serif;margin:30px;color:#333}h1{color:#1a73e8}
table{width:100%;border-collapse:collapse;margin-top:16px}
th{background:#f0f4ff;padding:10px;text-align:left;border:1px solid #ddd}
td{padding:8px 10px;border:1px solid #eee}tr:nth-child(even){background:#fafafa}
.footer{margin-top:40px;font-size:12px;color:#888;border-top:1px solid #ddd;padding-top:12px}</style>
</head><body>
<h1>Village Water System</h1><h2>${title} Report</h2>
<p><strong>Generated:</strong> ${now.toLocaleString()}</p>
<p><strong>Date Range:</strong> ${rangeLabel}</p>
<table><thead><tr><th>Period</th><th>Consumption (m3)</th><th>Cost (KES)</th><th>Status</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="footer"><p>Generated by Village Water System Client Portal.</p>
<p>Inquiries: +254 700 123 456 | support@villagewater.co.ke</p></div>
</body></html>`;
  };

  const handleExport = () => {
    // Capture values NOW before state changes wipe them
    const exportTitle = selectedExport?.title || "Export";
    const exportFmt = (selectedExport?.format || format).toLowerCase();

    setIsExporting(true);
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress(prev => {
        const next = prev + 12;
        if (next >= 100) {
          clearInterval(interval);
          const now = new Date();
          const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
          if (exportFmt === "pdf" || exportFmt === "html") {
            triggerDownload(new Blob([buildHTML(exportTitle, now)], { type: "text/html" }), `${exportTitle.replace(/\s+/g, "_")}_${ts}.html`);
          } else {
            triggerDownload(new Blob([buildCSV(exportTitle)], { type: "text/csv" }), `${exportTitle.replace(/\s+/g, "_")}_${ts}.csv`);
          }
          // Defer state cleanup so the download fires first
          setTimeout(() => {
            setIsExporting(false);
            setConfirmOpen(false);
            setSelectedExport(null);
          }, 100);
          return 100;
        }
        return next;
      });
    }, 180);
  };

  const summary = selectedExport ? (summaryMap[selectedExport.id] || summaryMap.all) : null;
  const rangeLabel = dateRange === "12months" ? "Last 12 Months" : dateRange === "6months" ? "Last 6 Months" : "Last 3 Months";
  const dialogPaper = { "& .MuiDialog-paper": { backgroundColor: colors.primary[400], color: colors.grey[100] } };

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">Export Data</Typography>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">Download your usage and billing records</Typography>

      <Grid container spacing={3}>
        {/* Export option cards */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={3}>Export Your Data</Typography>
              <Grid container spacing={2}>
                {exportOptions.map(opt => (
                  <Grid item xs={12} sm={6} key={opt.id}>
                    <Card sx={{ backgroundColor: colors.primary[500], height: "100%" }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                          {opt.icon}
                          <Box>
                            <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">{opt.title}</Typography>
                            <Chip label={opt.format} size="small" sx={{ backgroundColor: colors.blueAccent[700], color: "#fff" }} />
                          </Box>
                        </Box>
                        <Typography variant="body2" color={colors.grey[300]} mb={2}>{opt.description}</Typography>
                        <Button variant="contained" fullWidth startIcon={<DownloadIcon />}
                          onClick={() => openExport(opt)}
                          sx={{ backgroundColor: colors.greenAccent[600], "&:hover": { backgroundColor: colors.greenAccent[700] } }}>
                          Export
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Settings + recent exports */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={3}>Export Settings</Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: colors.grey[300] }}>Date Range</InputLabel>
                  <Select value={dateRange} onChange={e => setDateRange(e.target.value)} label="Date Range"
                    sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}>
                    <MenuItem value="3months">Last 3 Months</MenuItem>
                    <MenuItem value="6months">Last 6 Months</MenuItem>
                    <MenuItem value="12months">Last 12 Months</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: colors.grey[300] }}>Format</InputLabel>
                  <Select value={format} onChange={e => setFormat(e.target.value)} label="Format"
                    sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}>
                    <MenuItem value="csv">CSV (Excel)</MenuItem>
                    <MenuItem value="pdf">PDF / HTML</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" fullWidth startIcon={<FileDownloadIcon />} onClick={openExportAll}
                  sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[700] } }}>
                  Export All Data
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ backgroundColor: colors.primary[400], mt: 2 }}>
            <CardContent>
              <Typography variant="h5" color={colors.grey[100]} mb={2}>Recent Exports</Typography>
              <List dense>
                {recentExports.map(e => (
                  <ListItem key={e.id} sx={{ px: 0 }}>
                    <ListItemIcon><CheckCircleIcon sx={{ color: colors.greenAccent[500] }} /></ListItemIcon>
                    <ListItemText
                      primary={e.name} secondary={`${e.date} • ${e.size}`}
                      primaryTypographyProps={{ color: colors.grey[100], fontSize: "0.85rem" }}
                      secondaryTypographyProps={{ color: colors.grey[400], fontSize: "0.75rem" }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick access */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400], cursor: "pointer" }} onClick={() => openExport(exportOptions[0])}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <WaterDropIcon sx={{ color: colors.blueAccent[400], fontSize: 36 }} />
              <Box>
                <Typography variant="h5" color={colors.grey[100]}>Usage Data</Typography>
                <Typography variant="body2" color={colors.grey[400]}>Meter readings, daily/monthly consumption</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400], cursor: "pointer" }} onClick={() => openExport(exportOptions[1])}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <ReceiptIcon sx={{ color: colors.greenAccent[400], fontSize: 36 }} />
              <Box>
                <Typography variant="h5" color={colors.grey[100]}>Billing Records</Typography>
                <Typography variant="body2" color={colors.grey[400]}>Invoices, payments, payment plans</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy notice */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={colors.grey[300]}>
                  🔒 All exported files are generated locally in your browser. No data is sent to third parties.
                </Typography>
                <Button variant="outlined" size="small" onClick={() => setPrivacyOpen(true)}
                  sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[500], ml: 2, whiteSpace: "nowrap" }}>
                  Privacy Policy
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth sx={dialogPaper}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <PreviewIcon sx={{ color: colors.blueAccent[500] }} />
              <Typography variant="h4">Export Preview</Typography>
            </Box>
            <IconButton onClick={() => setPreviewOpen(false)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedExport && summary && (
            <Box>
              <Alert severity="info" sx={{ mb: 2, backgroundColor: colors.blueAccent[700], color: "#fff" }}>
                Review the details below before downloading.
              </Alert>
              <Typography variant="body2" color={colors.grey[300]} mb={0.5}><strong>Type:</strong> {selectedExport.title}</Typography>
              <Typography variant="body2" color={colors.grey[300]} mb={0.5}><strong>Format:</strong> {selectedExport.format}</Typography>
              <Typography variant="body2" color={colors.grey[300]} mb={0.5}><strong>Date Range:</strong> {rangeLabel}</Typography>
              <Typography variant="body2" color={colors.grey[300]} mb={0.5}><strong>Records:</strong> ~{summary.records}</Typography>
              <Typography variant="body2" color={colors.grey[300]} mb={2}><strong>Est. Size:</strong> {summary.size}</Typography>
              <Divider sx={{ borderColor: colors.grey[700], my: 1.5 }} />
              <Typography variant="body2" color={colors.grey[300]} mb={1}>Includes:</Typography>
              <List dense>
                {(selectedExport.id === "all" ? exportOptions.map(o => o.title) : [selectedExport.title]).map((item, i) => (
                  <ListItem key={i} sx={{ px: 0, py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}><CheckCircleIcon sx={{ color: colors.greenAccent[500], fontSize: 18 }} /></ListItemIcon>
                    <ListItemText primary={item} primaryTypographyProps={{ color: colors.grey[100], fontSize: "0.9rem" }} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)} sx={{ color: colors.grey[300] }}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirm}
            sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[700] } }}>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm & Download Dialog */}
      <Dialog open={confirmOpen} onClose={() => !isExporting && setConfirmOpen(false)} maxWidth="sm" fullWidth sx={dialogPaper}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <DownloadIcon sx={{ color: colors.greenAccent[500] }} />
              <Typography variant="h4">Download Export</Typography>
            </Box>
            {!isExporting && <IconButton onClick={() => setConfirmOpen(false)}><CloseIcon /></IconButton>}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedExport && (
            <Box>
              {!isExporting
                ? <Alert severity="success" sx={{ mb: 2, backgroundColor: colors.greenAccent[700], color: "#fff" }}>Ready to download: <strong>{selectedExport.title}</strong></Alert>
                : <Alert severity="info" sx={{ mb: 2, backgroundColor: colors.blueAccent[700], color: "#fff" }}>Preparing your file, please wait...</Alert>
              }
              <Typography variant="body2" color={colors.grey[300]} mb={0.5}><strong>Type:</strong> {selectedExport.title}</Typography>
              <Typography variant="body2" color={colors.grey[300]} mb={0.5}><strong>Format:</strong> {selectedExport.format}</Typography>
              <Typography variant="body2" color={colors.grey[300]} mb={2}><strong>Date Range:</strong> {rangeLabel}</Typography>
              {isExporting && (
                <Box mt={1}>
                  <Typography variant="body2" color={colors.grey[300]} mb={1}>Progress</Typography>
                  <LinearProgress variant="determinate" value={exportProgress}
                    sx={{ height: 8, borderRadius: 4, backgroundColor: colors.grey[700], "& .MuiLinearProgress-bar": { backgroundColor: colors.blueAccent[500] } }} />
                  <Typography variant="caption" color={colors.grey[400]}>{exportProgress}%</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!isExporting && <Button onClick={() => setConfirmOpen(false)} sx={{ color: colors.grey[300] }}>Cancel</Button>}
          <Button variant="contained" onClick={handleExport} disabled={isExporting} startIcon={!isExporting && <DownloadIcon />}
            sx={{ backgroundColor: colors.greenAccent[600], "&:hover": { backgroundColor: colors.greenAccent[700] } }}>
            {isExporting ? "Downloading..." : "Download Now"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} maxWidth="md" fullWidth sx={dialogPaper}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <PolicyIcon sx={{ color: colors.blueAccent[500] }} />
              <Typography variant="h4">Data Privacy Policy</Typography>
            </Box>
            <IconButton onClick={() => setPrivacyOpen(false)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {[
            ["🔒 Data Collection", "We collect only data necessary to provide water utility services, processed in accordance with applicable privacy laws."],
            ["📥 Local Export", "Exported files are generated entirely in your browser and downloaded directly — no data is sent to external servers."],
            ["🛡️ Security", "We implement industry-standard security including encryption and regular audits."],
            ["📋 Your Rights", "You have the right to access, correct, or delete your personal data at any time."],
            ["📞 Contact", "privacy@villagewater.co.ke | +254 700 123 456"],
          ].map(([title, body]) => (
            <Box key={title} mb={2}>
              <Typography variant="h6" color={colors.grey[100]} mb={0.5}>{title}</Typography>
              <Typography variant="body2" color={colors.grey[300]}>{body}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrivacyOpen(false)} sx={{ color: colors.grey[300] }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExportData;
