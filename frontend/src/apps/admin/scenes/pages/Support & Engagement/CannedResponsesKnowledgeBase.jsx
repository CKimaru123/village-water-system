import { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,
  Chip, Button, IconButton, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Tabs, Tab, Divider, InputAdornment, Tooltip,
  Snackbar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import adminApi from "../../../utils/api";

const CATEGORIES = ["Billing","Technical","Account","General","Outage","Water Quality","Meter","Connection","Other"];

const MOCK_RESPONSES = [
  { id:1, title:"Water Outage Acknowledgement", category:"Outage", body:"Dear customer, we have received your report of a water outage in your area. Our technical team has been dispatched and we expect service to resume within 4 hours. We apologize for the inconvenience.", usage_count:24, created_at:"2024-01-10" },
  { id:2, title:"Billing Dispute — Standard Response", category:"Billing", body:"Thank you for contacting us regarding your bill. We have reviewed your account and our billing team will investigate the discrepancy. You will receive a detailed breakdown within 2 business days.", usage_count:18, created_at:"2024-01-15" },
  { id:3, title:"Meter Reading Request", category:"Meter", body:"We have scheduled a meter reading visit for your property. Our technician will visit between 8am–12pm on the date provided. Please ensure access to the meter is available.", usage_count:31, created_at:"2024-02-01" },
  { id:4, title:"Leak Report — Urgent Response", category:"Technical", body:"Thank you for reporting a water leak. This has been flagged as urgent and our repair team will be on-site within 2 hours. Please turn off your main valve if safe to do so.", usage_count:12, created_at:"2024-02-10" },
  { id:5, title:"Account Activation Confirmation", category:"Account", body:"Your water account has been successfully activated. Your account number is [ACCOUNT_NUMBER]. You can now access all services through the client portal.", usage_count:45, created_at:"2024-03-01" },
  { id:6, title:"Water Quality Concern", category:"Water Quality", body:"We take water quality very seriously. A sample collection has been scheduled for your area. Results will be shared within 48 hours. In the meantime, we recommend boiling water as a precaution.", usage_count:8, created_at:"2024-03-15" },
];

const empty = { title:"", body:"", category:"General" };

const catColor = (cat, colors) => {
  const map = { Billing:colors.greenAccent[600], Technical:colors.blueAccent[600], Account:colors.blueAccent[700],
    Outage:colors.redAccent[600], "Water Quality":"#2e7c67", Meter:"#535ac8", Connection:"#3e4396", General:colors.grey[600], Other:colors.grey[700] };
  return map[cat] || colors.grey[600];
};

const KpiCard = ({ label, value, color }) => (
  <Card sx={{ flex:"1 1 130px", minWidth:110, backgroundColor:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
    <CardContent sx={{ p:"12px 16px !important" }}>
      <Typography sx={{ fontSize:"1.6rem", fontWeight:"bold", color }}>{value}</Typography>
      <Typography sx={{ fontSize:"0.75rem", color:"#858585" }}>{label}</Typography>
    </CardContent>
  </Card>
);

const CannedResponsesKnowledgeBase = () => {
  const colors = tokens(useTheme().palette.mode);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [dialog, setDialog] = useState({ open:false, mode:"create", data:empty });
  const [preview, setPreview] = useState(null);
  const [snackbar, setSnackbar] = useState({ open:false, message:"", severity:"success" });
  const [saving, setSaving] = useState(false);

  const fieldSx = {
    "& .MuiInputBase-input":{ color:colors.grey[100] },
    "& .MuiInputLabel-root":{ color:colors.grey[300] },
    "& .MuiOutlinedInput-notchedOutline":{ borderColor:colors.grey[500] },
  };

  const load = () => {
    setLoading(true);
    adminApi.get("/admin/canned_responses")
      .then(res => {
        const d = res.data?.canned_responses || res.data?.data?.canned_responses || res.data;
        setResponses(Array.isArray(d) && d.length > 0 ? d : MOCK_RESPONSES);
      })
      .catch(() => setResponses(MOCK_RESPONSES))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openCreate = () => setDialog({ open:true, mode:"create", data:empty });
  const openEdit = (r) => setDialog({ open:true, mode:"edit", data:{ id:r.id, title:r.title, body:r.body, category:r.category } });

  const handleSave = async () => {
    if (!dialog.data.title.trim() || !dialog.data.body.trim()) {
      setSnackbar({ open:true, message:"Title and body are required.", severity:"error" }); return;
    }
    setSaving(true);
    try {
      if (dialog.mode === "create") {
        await adminApi.post("/admin/canned_responses", { canned_response:dialog.data });
        setResponses(prev => [...prev, { ...dialog.data, id:Date.now(), usage_count:0, created_at:new Date().toISOString().split("T")[0] }]);
        setSnackbar({ open:true, message:"Response created successfully.", severity:"success" });
      } else {
        await adminApi.patch(`/admin/canned_responses/${dialog.data.id}`, { canned_response:dialog.data });
        setResponses(prev => prev.map(r => r.id === dialog.data.id ? { ...r, ...dialog.data } : r));
        setSnackbar({ open:true, message:"Response updated.", severity:"success" });
      }
      setDialog({ open:false, mode:"create", data:empty });
    } catch {
      if (dialog.mode === "create") {
        setResponses(prev => [...prev, { ...dialog.data, id:Date.now(), usage_count:0, created_at:new Date().toISOString().split("T")[0] }]);
      } else {
        setResponses(prev => prev.map(r => r.id === dialog.data.id ? { ...r, ...dialog.data } : r));
      }
      setDialog({ open:false, mode:"create", data:empty });
      setSnackbar({ open:true, message:dialog.mode === "create" ? "Response saved (offline)." : "Response updated (offline).", severity:"info" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this canned response?")) return;
    try { await adminApi.delete(`/admin/canned_responses/${id}`); }
    catch { /* local delete */ }
    setResponses(prev => prev.filter(r => r.id !== id));
    setSnackbar({ open:true, message:"Response deleted.", severity:"success" });
  };

  const handleCopy = (body) => {
    navigator.clipboard.writeText(body).catch(() => {});
    setSnackbar({ open:true, message:"Response copied to clipboard.", severity:"success" });
  };

  const filtered = responses.filter(r => {
    const matchSearch = !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.body?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || r.category === catFilter;
    return matchSearch && matchCat;
  });

  const kpis = [
    { label:"Total Responses", value:responses.length, color:colors.blueAccent[400] },
    { label:"Categories", value:new Set(responses.map(r => r.category)).size, color:colors.greenAccent[400] },
    { label:"Most Used", value:responses.reduce((m,r) => Math.max(m, r.usage_count||0), 0), color:"#f0c040" },
    { label:"Total Uses", value:responses.reduce((s,r) => s + (r.usage_count||0), 0), color:colors.blueAccent[300] },
  ];

  const byCategory = CATEGORIES.map(c => ({ cat:c, count:responses.filter(r => r.category === c).length })).filter(x => x.count > 0);

  const columns = [
    { field:"title", headerName:"Title", flex:1.5, renderCell:p => <Typography sx={{ fontSize:"0.85rem", fontWeight:"bold", color:colors.grey[100] }}>{p.value}</Typography> },
    { field:"category", headerName:"Category", flex:0.8, renderCell:p => <Chip label={p.value} size="small" sx={{ backgroundColor:catColor(p.value, colors), color:"#fff", fontSize:"0.7rem" }} /> },
    { field:"usage_count", headerName:"Uses", flex:0.5, renderCell:p => <Chip label={p.value||0} size="small" sx={{ backgroundColor:colors.primary[500], color:colors.grey[200] }} /> },
    { field:"body", headerName:"Preview", flex:2, renderCell:p => <Typography variant="body2" color={colors.grey[400]} noWrap sx={{ fontSize:"0.8rem" }}>{p.value}</Typography> },
    { field:"actions", headerName:"Actions", flex:0.9, sortable:false, renderCell:p => (
      <Box display="flex" gap={0.5}>
        <Tooltip title="Preview"><IconButton size="small" onClick={() => setPreview(p.row)} sx={{ color:colors.blueAccent[400] }}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Copy"><IconButton size="small" onClick={() => handleCopy(p.row.body)} sx={{ color:colors.grey[400] }}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p.row)} sx={{ color:colors.blueAccent[400] }}><EditIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(p.row.id)} sx={{ color:colors.redAccent[400] }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
      </Box>
    )},
  ];

  const tabSx = {
    "& .MuiTab-root":{ fontSize:"0.95rem", color:colors.grey[400] },
    "& .Mui-selected":{ color:"#fff !important", backgroundColor:colors.blueAccent[700], borderRadius:"4px 4px 0 0" },
    "& .MuiTabs-indicator":{ backgroundColor:colors.blueAccent[400] },
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Canned Responses</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Pre-written replies for common support queries</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color:colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ backgroundColor:colors.greenAccent[600] }}>New Response</Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </Box>

      {error && <Alert severity="warning" sx={{ mb:2 }} onClose={() => setError(null)}>API unavailable — showing sample data</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...tabSx, mb:2 }}>
        <Tab label="All Responses" />
        <Tab label="By Category" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color:colors.blueAccent[500] }} /></Box> : (
        <>
          {tab === 0 && (
            <Box>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
                <TextField size="small" placeholder="Search responses…" value={search}
                  onChange={e => setSearch(e.target.value)} sx={{ width:280, ...fieldSx }}
                  InputProps={{ startAdornment:<InputAdornment position="start"><SearchIcon sx={{ color:colors.grey[400] }} /></InputAdornment> }} />
                <Box display="flex" gap={1} flexWrap="wrap">
                  {["all", ...CATEGORIES].map(c => (
                    <Chip key={c} label={c === "all" ? "All" : c} size="small" clickable
                      onClick={() => setCatFilter(c)}
                      sx={{ backgroundColor:catFilter===c ? catColor(c, colors) : colors.primary[400],
                        color:catFilter===c ? "#fff" : colors.grey[300],
                        border:`1px solid ${catFilter===c ? "transparent" : colors.grey[700]}` }} />
                  ))}
                </Box>
              </Box>
              <Box height="55vh" sx={{
                "& .MuiDataGrid-root":{ border:"none" },
                "& .MuiDataGrid-cell":{ borderBottom:"none" },
                "& .MuiDataGrid-columnHeaders":{ backgroundColor:colors.blueAccent[700], borderBottom:"none" },
                "& .MuiDataGrid-virtualScroller":{ backgroundColor:colors.primary[400] },
                "& .MuiDataGrid-footerContainer":{ borderTop:"none", backgroundColor:colors.blueAccent[700] },
                "& .MuiDataGrid-toolbarContainer .MuiButton-text":{ color:`${colors.grey[100]} !important` },
              }}>
                <DataGrid rows={filtered} columns={columns} getRowId={r => r.id}
                  slots={{ toolbar:GridToolbar }} rowHeight={52} />
              </Box>
            </Box>
          )}

          {tab === 1 && (
            <Grid container spacing={2}>
              {byCategory.map(({ cat, count }) => (
                <Grid item xs={12} md={6} key={cat}>
                  <Card sx={{ backgroundColor:colors.primary[400], borderLeft:`4px solid ${catColor(cat, colors)}` }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">{cat}</Typography>
                        <Chip label={`${count} response${count > 1 ? "s" : ""}`} size="small"
                          sx={{ backgroundColor:catColor(cat, colors), color:"#fff" }} />
                      </Box>
                      {responses.filter(r => r.category === cat).map(r => (
                        <Box key={r.id} mb={1} p={1.5} sx={{ backgroundColor:colors.primary[500], borderRadius:1 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Typography sx={{ fontSize:"0.85rem", fontWeight:"bold", color:colors.grey[100] }}>{r.title}</Typography>
                            <Box display="flex" gap={0.5}>
                              <Tooltip title="Copy"><IconButton size="small" onClick={() => handleCopy(r.body)} sx={{ color:colors.grey[500] }}><ContentCopyIcon sx={{ fontSize:14 }} /></IconButton></Tooltip>
                              <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(r)} sx={{ color:colors.blueAccent[400] }}><EditIcon sx={{ fontSize:14 }} /></IconButton></Tooltip>
                            </Box>
                          </Box>
                          <Typography sx={{ fontSize:"0.75rem", color:colors.grey[400], mt:0.3 }} noWrap>{r.body}</Typography>
                          <Typography sx={{ fontSize:"0.7rem", color:colors.grey[600], mt:0.3 }}>Used {r.usage_count||0} times</Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="sm" fullWidth PaperProps={{ sx:{ backgroundColor:colors.primary[400] } }}>
        <DialogTitle sx={{ color:colors.grey[100], fontSize:"1.2rem !important" }}>
          {preview?.title}
          <Chip label={preview?.category} size="small" sx={{ ml:1.5, backgroundColor:catColor(preview?.category, colors), color:"#fff", fontSize:"0.7rem" }} />
        </DialogTitle>
        <DialogContent>
          <Divider sx={{ borderColor:colors.grey[700], mb:2 }} />
          <Box p={2} sx={{ backgroundColor:colors.primary[500], borderRadius:1, border:`1px solid ${colors.grey[700]}` }}>
            <Typography sx={{ fontSize:"1rem !important", color:colors.grey[100], lineHeight:1.7, whiteSpace:"pre-wrap" }}>{preview?.body}</Typography>
          </Box>
          <Typography sx={{ fontSize:"0.8rem", color:colors.grey[500], mt:1.5 }}>Used {preview?.usage_count||0} times · Created {preview?.created_at}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreview(null)} sx={{ color:colors.grey[400] }}>Close</Button>
          <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => { handleCopy(preview?.body); setPreview(null); }}
            sx={{ borderColor:colors.blueAccent[500], color:colors.blueAccent[300] }}>Copy to Clipboard</Button>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => { openEdit(preview); setPreview(null); }}
            sx={{ backgroundColor:colors.blueAccent[700] }}>Edit</Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open:false })} maxWidth="sm" fullWidth PaperProps={{ sx:{ backgroundColor:colors.primary[400] } }}>
        <DialogTitle sx={{ color:colors.grey[100], fontSize:"1.2rem !important" }}>
          {dialog.mode === "create" ? "New Canned Response" : "Edit Canned Response"}
        </DialogTitle>
        <DialogContent sx={{ pt:2 }}>
          <TextField fullWidth label="Title *" value={dialog.data.title} margin="dense"
            onChange={e => setDialog({ ...dialog, data:{ ...dialog.data, title:e.target.value } })} sx={fieldSx} />
          <TextField fullWidth select label="Category" value={dialog.data.category} margin="dense"
            onChange={e => setDialog({ ...dialog, data:{ ...dialog.data, category:e.target.value } })} sx={fieldSx}>
            {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField fullWidth multiline rows={6} label="Response Body *" value={dialog.data.body} margin="dense"
            placeholder="Write the canned response text here. Use [PLACEHOLDER] for dynamic values."
            onChange={e => setDialog({ ...dialog, data:{ ...dialog.data, body:e.target.value } })} sx={fieldSx} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ ...dialog, open:false })} sx={{ color:colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleSave}
            sx={{ backgroundColor:colors.greenAccent[600] }}>{saving ? "Saving…" : "Save"}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open:false }))}
        anchorOrigin={{ vertical:"bottom", horizontal:"center" }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({ ...s, open:false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CannedResponsesKnowledgeBase;
