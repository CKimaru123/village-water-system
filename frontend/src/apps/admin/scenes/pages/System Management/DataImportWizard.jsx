import React, { useState, useRef } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, Tabs, Tab, IconButton, Alert, Divider,
  LinearProgress, CircularProgress, Table, TableHead, TableRow, TableCell,
  TableBody, Stepper, Step, StepLabel, StepContent,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import * as XLSX from "xlsx";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import ReplayIcon from "@mui/icons-material/Replay";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import DownloadIcon from "@mui/icons-material/Download";
import InfoIcon from "@mui/icons-material/Info";
import TableChartIcon from "@mui/icons-material/TableChart";

const IMPORT_TARGETS = ["Clients","Connections","Meter Readings","Payments","Assets","Users"];
const STEPS = ["Select Target & Upload","Preview & Map Fields","Validate","Import"];

const MOCK_HISTORY = [
  { id: 1, file: "clients_may2025.xlsx", target: "Clients", records: 142, success: 138, failed: 4, status: "Completed", date: "2025-05-28 10:14", importedBy: "Admin" },
  { id: 2, file: "meter_readings_q1.csv", target: "Meter Readings", records: 890, success: 890, failed: 0, status: "Completed", date: "2025-04-15 08:30", importedBy: "Admin" },
  { id: 3, file: "payments_april.xlsx", target: "Payments", records: 320, success: 298, failed: 22, status: "Completed with Errors", date: "2025-05-01 14:00", importedBy: "Admin" },
  { id: 4, file: "assets_inventory.csv", target: "Assets", records: 55, success: 0, failed: 55, status: "Failed", date: "2025-05-10 09:00", importedBy: "Admin" },
];

const FIELD_MAPS = {
  Clients: ["full_name","phone","email","address","connection_type","status"],
  Connections: ["client_id","meter_number","connection_date","zone","pipe_size"],
  "Meter Readings": ["meter_number","reading_date","reading_value","reader_name"],
  Payments: ["client_id","amount","payment_date","method","reference"],
  Assets: ["asset_name","category","location","condition","purchase_date","value"],
  Users: ["first_name","last_name","email","role","phone"],
};

function TabPanel({ children, value, index }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

const DataImportWizard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const fileRef = useRef(null);
  const [tab, setTab] = useState(0);
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState("Clients");
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [fieldMap, setFieldMap] = useState({});
  const [validationResults, setValidationResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [alert, setAlert] = useState(null);
  const [history] = useState(MOCK_HISTORY);

  const showAlert = (msg, sev = "success") => { setAlert({ msg, sev }); setTimeout(() => setAlert(null), 4000); };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        let parsed = [];
        if (ext === "csv") {
          const rows = evt.target.result.split("\n").filter(r => r.trim());
          const headers = rows[0].split(",").map(h => h.trim().replace(/"/g, ""));
          parsed = rows.slice(1).map(r => {
            const vals = r.split(",");
            return headers.reduce((acc, h, i) => { acc[h] = vals[i]?.trim().replace(/"/g, "") || ""; return acc; }, {});
          });
          setFileHeaders(headers);
        } else {
          const wb = XLSX.read(evt.target.result, { type: "binary" });
          parsed = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
          setFileHeaders(parsed.length ? Object.keys(parsed[0]) : []);
        }
        setFileData(parsed);
        setFileName(file.name);
        // Auto-map fields
        const autoMap = {};
        const targetFields = FIELD_MAPS[target] || [];
        (parsed.length ? Object.keys(parsed[0]) : []).forEach(h => {
          const match = targetFields.find(f => f.toLowerCase() === h.toLowerCase().replace(/\s/g, "_"));
          if (match) autoMap[match] = h;
        });
        setFieldMap(autoMap);
        setStep(1);
      } catch (err) {
        showAlert(`File parse error: ${err.message}`, "error");
      }
    };
    if (ext === "csv") reader.readAsText(file);
    else reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleValidate = () => {
    setStep(2);
    const targetFields = FIELD_MAPS[target] || [];
    const errors = [];
    const warnings = [];
    fileData.slice(0, 50).forEach((row, i) => {
      targetFields.forEach(field => {
        const col = fieldMap[field];
        if (!col && field.includes("name") || field === "email") {
          warnings.push(`Row ${i + 2}: "${field}" not mapped`);
        }
        if (col && !row[col]) {
          errors.push(`Row ${i + 2}: "${field}" is empty`);
        }
      });
    });
    setValidationResults({ errors: errors.slice(0, 10), warnings: warnings.slice(0, 5), total: fileData.length, valid: fileData.length - errors.length });
  };

  const handleImport = () => {
    setImporting(true);
    setTimeout(() => {
      const failed = Math.floor(Math.random() * 5);
      setImportResult({ total: fileData.length, success: fileData.length - failed, failed, target });
      setImporting(false);
      setStep(3);
    }, 2500);
  };

  const handleReset = () => {
    setStep(0); setFileName(""); setFileData([]); setFileHeaders([]);
    setFieldMap({}); setValidationResults(null); setImportResult(null);
  };

  const downloadTemplate = () => {
    const fields = FIELD_MAPS[target] || [];
    const ws = XLSX.utils.aoa_to_sheet([fields, fields.map(() => "")]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, target);
    XLSX.writeFile(wb, `${target.toLowerCase().replace(/\s/g, "_")}_template.xlsx`);
  };

  const dgSx = {
    "& .MuiDataGrid-root": { border: "none" },
    "& .MuiDataGrid-cell": { borderBottom: "none" },
    "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], color: colors.grey[100], borderBottom: "none" },
    "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
    "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
    "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
    "& .MuiDataGrid-toolbarContainer .MuiButton-text": { color: `${colors.grey[100]} !important` },
  };

  return (
    <Box m="20px">
      {alert && <Alert severity={alert.sev} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h3" color={colors.grey[100]} fontWeight="bold" display="flex" alignItems="center" gap={1}>
            <UploadFileIcon sx={{ fontSize: 32, color: colors.blueAccent[400] }} />
            Data Import Wizard
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Import CSV or Excel data into the system with field mapping and validation.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadTemplate}
          sx={{ color: colors.grey[100], borderColor: colors.grey[600] }}>
          Download Template
        </Button>
      </Box>

      <Paper sx={{ bgcolor: colors.primary[400] }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2,
          "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
          "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
          "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
        }}>
          <Tab label="Import Wizard" icon={<CloudUploadIcon />} iconPosition="start" />
          <Tab label="Import History" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>

        {/* Tab 0: Wizard */}
        <TabPanel value={tab} index={0}>
          <Box p={3}>
            <Stepper activeStep={step} sx={{ mb: 4 }}>
              {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
            </Stepper>

            {/* Step 0: Select Target & Upload */}
            {step === 0 && (
              <Box>
                <Grid container spacing={3} alignItems="flex-start">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: "#fff" }}>Import Target</InputLabel>
                      <Select value={target} label="Import Target" onChange={e => setTarget(e.target.value)}
                        sx={{ color: "#fff", "& fieldset": { borderColor: "#4a5568" }, "& .MuiSelect-icon": { color: "#fff" } }}>
                        {IMPORT_TARGETS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <Box mt={2} p={2} sx={{ bgcolor: colors.primary[500], borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        <InfoIcon sx={{ fontSize: 12, mr: 0.5 }} />Expected fields for <strong>{target}</strong>:
                      </Typography>
                      {(FIELD_MAPS[target] || []).map(f => (
                        <Chip key={f} label={f} size="small" sx={{ m: 0.3, fontSize: 10 }} />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <Box border={`2px dashed ${colors.blueAccent[600]}`} borderRadius={2} p={5} textAlign="center"
                      sx={{ cursor: "pointer", "&:hover": { bgcolor: colors.primary[500] } }}
                      onClick={() => fileRef.current?.click()}>
                      <CloudUploadIcon sx={{ fontSize: 48, color: colors.blueAccent[400], mb: 1 }} />
                      <Typography variant="h6">Drop file here or click to browse</Typography>
                      <Typography variant="caption" color="text.secondary">Supports .csv, .xlsx, .xls</Typography>
                      <input ref={fileRef} type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 1: Preview & Map */}
            {step === 1 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    <TableChartIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                    {fileName} — {fileData.length} rows detected
                  </Typography>
                  <Chip label={target} color="primary" />
                </Box>

                <Typography variant="subtitle2" mb={1}>Field Mapping</Typography>
                <Grid container spacing={1.5} mb={3}>
                  {(FIELD_MAPS[target] || []).map(field => (
                    <Grid item xs={12} sm={6} md={4} key={field}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: "#b0b8c1", fontSize: 12 }}>{field}</InputLabel>
                        <Select value={fieldMap[field] || ""} label={field}
                          onChange={e => setFieldMap(p => ({ ...p, [field]: e.target.value }))}
                          sx={{ color: "#fff", fontSize: 12, "& fieldset": { borderColor: "#4a5568" }, "& .MuiSelect-icon": { color: "#b0b8c1" } }}>
                          <MenuItem value=""><em>— skip —</em></MenuItem>
                          {fileHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                  ))}
                </Grid>

                <Typography variant="subtitle2" mb={1}>Data Preview (first 5 rows)</Typography>
                <Box sx={{ overflowX: "auto", maxHeight: 220, border: `1px solid ${colors.primary[300]}`, borderRadius: 1 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {fileHeaders.map(h => <TableCell key={h} sx={{ bgcolor: colors.blueAccent[700], color: colors.grey[100], fontWeight: "bold", fontSize: 11 }}>{h}</TableCell>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fileData.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          {fileHeaders.map(h => <TableCell key={h} sx={{ fontSize: 11 }}>{row[h]}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>

                <Box display="flex" justifyContent="space-between" mt={3}>
                  <Button startIcon={<ReplayIcon />} onClick={handleReset} variant="outlined" sx={{ color: "#fff", borderColor: "#4a5568" }}>Start Over</Button>
                  <Button variant="contained" onClick={handleValidate}
                    sx={{ bgcolor: colors.blueAccent[600], "&:hover": { bgcolor: colors.blueAccent[700] } }}>
                    Validate Data
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 2: Validate */}
            {step === 2 && validationResults && (
              <Box>
                <Grid container spacing={2} mb={3}>
                  {[
                    { label: "Total Rows", value: validationResults.total, color: colors.blueAccent[500] },
                    { label: "Valid Rows", value: validationResults.valid, color: colors.greenAccent[500] },
                    { label: "Errors", value: validationResults.errors.length, color: colors.redAccent[400] },
                    { label: "Warnings", value: validationResults.warnings.length, color: "#ed6c02" },
                  ].map((s, i) => (
                    <Grid item xs={6} sm={3} key={i}>
                      <Card sx={{ bgcolor: colors.primary[500], borderLeft: `4px solid ${s.color}` }}>
                        <CardContent sx={{ py: 1.5 }}>
                          <Typography variant="h5" color="text.secondary" fontWeight="bold">{s.value}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {validationResults.errors.length > 0 && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" mb={0.5}>Validation Errors:</Typography>
                    {validationResults.errors.map((e, i) => <Typography key={i} variant="caption" display="block">• {e}</Typography>)}
                  </Alert>
                )}
                {validationResults.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" mb={0.5}>Warnings:</Typography>
                    {validationResults.warnings.map((w, i) => <Typography key={i} variant="caption" display="block">• {w}</Typography>)}
                  </Alert>
                )}
                {validationResults.errors.length === 0 && (
                  <Alert severity="success" sx={{ mb: 2 }}>All rows passed validation. Ready to import.</Alert>
                )}

                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Button startIcon={<ReplayIcon />} onClick={() => setStep(1)} variant="outlined" sx={{ color: "#fff", borderColor: "#4a5568" }}>Back</Button>
                  <Button variant="contained" onClick={handleImport} disabled={importing}
                    sx={{ bgcolor: colors.greenAccent[600], "&:hover": { bgcolor: colors.greenAccent[700] } }}>
                    {importing ? <CircularProgress size={20} /> : `Import ${validationResults.valid} Records`}
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 3: Result */}
            {step === 3 && importResult && (
              <Box textAlign="center" py={4}>
                <CheckCircleIcon sx={{ fontSize: 64, color: colors.greenAccent[400], mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" mb={1}>Import Complete</Typography>
                <Grid container spacing={2} justifyContent="center" mb={3}>
                  {[
                    { label: "Total", value: importResult.total, color: colors.blueAccent[400] },
                    { label: "Imported", value: importResult.success, color: colors.greenAccent[400] },
                    { label: "Failed", value: importResult.failed, color: colors.redAccent[400] },
                  ].map((s, i) => (
                    <Grid item xs={4} sm={2} key={i}>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: s.color }}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </Grid>
                  ))}
                </Grid>
                <Button variant="outlined" startIcon={<ReplayIcon />} onClick={handleReset}
                  sx={{ color: "#fff", borderColor: "#4a5568" }}>
                  Import Another File
                </Button>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Tab 1: History */}
        <TabPanel value={tab} index={1}>
          <Box p={2}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: colors.blueAccent[700], color: colors.grey[100], fontWeight: "bold" } }}>
                  <TableCell>File</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Success</TableCell>
                  <TableCell>Failed</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map(h => (
                  <TableRow key={h.id} sx={{ "&:hover": { bgcolor: colors.primary[300] } }}>
                    <TableCell><Typography variant="body2" fontWeight="bold">{h.file}</Typography></TableCell>
                    <TableCell><Chip label={h.target} size="small" color="primary" /></TableCell>
                    <TableCell>{h.records}</TableCell>
                    <TableCell><Typography variant="body2" color={colors.greenAccent[400]}>{h.success}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color={h.failed > 0 ? colors.redAccent[400] : "inherit"}>{h.failed}</Typography></TableCell>
                    <TableCell>
                      <Chip label={h.status} size="small"
                        color={h.status === "Completed" ? "success" : h.status === "Failed" ? "error" : "warning"} />
                    </TableCell>
                    <TableCell><Typography variant="caption">{h.date}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{h.importedBy}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default DataImportWizard;
