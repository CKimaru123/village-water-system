import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  InputAdornment, IconButton, Tooltip, Select, MenuItem, FormControl,
  InputLabel, Table, TableBody, TableCell, TableHead, TableRow,
  LinearProgress, Snackbar, Badge,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FilterListIcon from "@mui/icons-material/FilterList";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

const BASE_URL = "http://localhost:3001/api/v1";

const STATUS_COLORS = {
  unverified: "#f0c040",
  pending:    "#f0c040",
  verified:   "#4cceac",
  rejected:   "#e05c5c",
  expired:    "#888",
};

const DOC_TYPE_LABELS = {
  national_id:                  "National ID",
  tenancy_agreement:            "Tenancy Agreement",
  property_ownership:           "Property Ownership",
  water_connection_application: "Water Connection Application",
  proof_of_income:              "Proof of Income",
  utility_bill:                 "Utility Bill",
  business_registration:        "Business Registration",
  tax_compliance:               "Tax Compliance",
  authorization_letter:         "Authorization Letter",
  other:                        "Other",
};

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const DocumentVerification = () => {
  const colors = tokens(useTheme().palette.mode);
  const [docs,         setDocs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [rejectDialog, setRejectDialog] = useState({ open: false, doc: null, reason: "" });
  const [previewDoc,   setPreviewDoc]   = useState(null);
  const [processing,   setProcessing]   = useState({});
  const [snackbar,     setSnackbar]     = useState({ open: false, message: "", severity: "success" });
  const [page,         setPage]         = useState(0);
  const [pageSize,     setPageSize]     = useState(25);
  const [totalCount,   setTotalCount]   = useState(0);

  const showSnack = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page + 1,
      per_page: pageSize,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(typeFilter   !== "all" ? { document_type: typeFilter } : {}),
    });
    fetch(`${BASE_URL}/documents?${params}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        setDocs(d?.data?.documents || d?.documents || []);
        setTotalCount(d?.data?.pagination?.total_count || d?.data?.documents?.length || 0);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, pageSize, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (id) => {
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`${BASE_URL}/documents/${id}/verify`, { method: "PATCH", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verify failed");
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "verified" } : d));
      showSnack("Document verified successfully");
    } catch (err) { showSnack(err.message, "error"); }
    finally { setProcessing(p => ({ ...p, [id]: false })); }
  };

  const handleReject = async () => {
    const { doc, reason } = rejectDialog;
    if (!reason.trim()) return;
    setProcessing(p => ({ ...p, [doc.id]: true }));
    try {
      const res = await fetch(`${BASE_URL}/documents/${doc.id}/reject`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ rejection_reason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reject failed");
      setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: "rejected", rejection_reason: reason } : d));
      setRejectDialog({ open: false, doc: null, reason: "" });
      showSnack("Document rejected");
    } catch (err) { showSnack(err.message, "error"); }
    finally { setProcessing(p => ({ ...p, [doc.id]: false })); }
  };

  // Client-side search filter on top of server-side pagination
  const filtered = docs.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.user?.name?.toLowerCase().includes(q) ||
      d.document_type?.toLowerCase().includes(q) ||
      d.file_name?.toLowerCase().includes(q) ||
      d.user?.email?.toLowerCase().includes(q)
    );
  });

  // Counts from current page (approximate — full counts need a separate API call)
  const counts = { all: totalCount };
  ["unverified", "verified", "rejected", "expired"].forEach(s => {
    counts[s] = docs.filter(d => d.status === s).length;
  });
  const pendingCount = docs.filter(d => d.status === "unverified" || d.status === "pending").length;
  const expiringCount = docs.filter(d => d.expiring_soon).length;

  // DataGrid columns
  const columns = [
    {
      field: "client", headerName: "Client", flex: 1.2, minWidth: 160,
      renderCell: (p) => (
        <Box>
          <Typography variant="body2" color={colors.grey[100]} fontWeight={500}>
            {p.row.user?.name || "—"}
          </Typography>
          <Typography variant="caption" color={colors.grey[500]}>{p.row.user?.email}</Typography>
        </Box>
      ),
    },
    {
      field: "document_type", headerName: "Document Type", flex: 1.2, minWidth: 160,
      renderCell: (p) => (
        <Typography variant="body2" color={colors.grey[300]}>
          {DOC_TYPE_LABELS[p.value] || p.value?.replace(/_/g, " ") || "—"}
        </Typography>
      ),
    },
    {
      field: "file_name", headerName: "File", flex: 1.2, minWidth: 160,
      renderCell: (p) => (
        <Tooltip title={p.value}>
          <Typography variant="body2" color={colors.grey[400]}
            sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
            {p.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "file_size_mb", headerName: "Size", flex: 0.5, minWidth: 70,
      renderCell: (p) => (
        <Typography variant="body2" color={colors.grey[500]}>
          {p.value ? `${p.value} MB` : "—"}
        </Typography>
      ),
    },
    {
      field: "uploaded_at", headerName: "Uploaded", flex: 0.8, minWidth: 110,
      renderCell: (p) => (
        <Typography variant="body2" color={colors.grey[400]}>
          {p.value ? new Date(p.value).toLocaleDateString() : "—"}
        </Typography>
      ),
    },
    {
      field: "expiry_date", headerName: "Expiry", flex: 0.8, minWidth: 110,
      renderCell: (p) => {
        if (!p.value) return <Typography variant="body2" color={colors.grey[600]}>—</Typography>;
        const expired = p.row.expired;
        const soon    = p.row.expiring_soon;
        return (
          <Box display="flex" alignItems="center" gap={0.5}>
            {(expired || soon) && <WarningAmberIcon sx={{ fontSize: 14, color: expired ? "#e05c5c" : "#f0c040" }} />}
            <Typography variant="body2" color={expired ? "#e05c5c" : soon ? "#f0c040" : colors.grey[400]}>
              {new Date(p.value).toLocaleDateString()}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "status", headerName: "Status", flex: 0.7, minWidth: 110,
      renderCell: (p) => (
        <Box>
          <Chip label={p.value?.toUpperCase()} size="small"
            sx={{
              backgroundColor: (STATUS_COLORS[p.value] || colors.grey[600]) + "33",
              color: STATUS_COLORS[p.value] || colors.grey[300],
              border: `1px solid ${(STATUS_COLORS[p.value] || colors.grey[600])}55`,
              fontSize: "0.65rem", fontWeight: 700,
            }} />
          {p.row.rejection_reason && (
            <Tooltip title={p.row.rejection_reason}>
              <Typography variant="caption" color={colors.redAccent[400]} display="block"
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                {p.row.rejection_reason}
              </Typography>
            </Tooltip>
          )}
        </Box>
      ),
    },
    {
      field: "actions", headerName: "Actions", flex: 0.9, minWidth: 140, sortable: false,
      renderCell: (p) => (
        <Box display="flex" gap={0.3} alignItems="center">
          <Tooltip title="View details">
            <IconButton size="small" onClick={() => setPreviewDoc(p.row)} sx={{ color: colors.grey[400] }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small" component="a"
              href={`${BASE_URL}/documents/${p.row.id}/download`} target="_blank"
              sx={{ color: colors.blueAccent[400] }}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {(p.row.status === "unverified" || p.row.status === "pending") && (
            <>
              <Tooltip title="Verify">
                <IconButton size="small" disabled={processing[p.row.id]}
                  onClick={() => handleVerify(p.row.id)} sx={{ color: "#4cceac" }}>
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton size="small" disabled={processing[p.row.id]}
                  onClick={() => setRejectDialog({ open: true, doc: p.row, reason: "" })}
                  sx={{ color: "#e05c5c" }}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="5px">
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Document Management</Typography>
          <Typography variant="h6" color={colors.grey[400]}>All documents uploaded by clients — verify, reject, and download</Typography>
        </Box>
        <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Summary cards */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {[
          { label: "Total Documents", value: totalCount,    color: colors.blueAccent[400] },
          { label: "Pending Review",  value: pendingCount,  color: "#f0c040" },
          { label: "Verified",        value: counts.verified || 0, color: "#4cceac" },
          { label: "Rejected",        value: counts.rejected || 0, color: "#e05c5c" },
          { label: "Expiring Soon",   value: expiringCount, color: "#f0a040" },
        ].map(s => (
          <Card key={s.label} sx={{ backgroundColor: colors.primary[400], flex: "1 1 120px", minWidth: 120 }}>
            <CardContent sx={{ p: "12px 16px !important" }}>
              <Typography variant="h4" color={s.color} fontWeight="bold">{s.value}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>{s.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <TextField
          placeholder="Search by client, type, or file name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{
            width: 340,
            "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } },
          }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[400] }} /></InputAdornment> }}
        />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel sx={{ color: colors.grey[400] }}>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
            MenuProps={{ PaperProps: { sx: { backgroundColor: colors.primary[300] } } }}>
            <MenuItem value="all" sx={{ color: colors.grey[100] }}>All Statuses</MenuItem>
            {["unverified", "verified", "rejected", "expired"].map(s => (
              <MenuItem key={s} value={s} sx={{ color: colors.grey[100] }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: STATUS_COLORS[s] }} />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: colors.grey[400] }}>Document Type</InputLabel>
          <Select value={typeFilter} label="Document Type" onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
            sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
            MenuProps={{ PaperProps: { sx: { backgroundColor: colors.primary[300] } } }}>
            <MenuItem value="all" sx={{ color: colors.grey[100] }}>All Types</MenuItem>
            {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
              <MenuItem key={k} value={k} sx={{ color: colors.grey[100] }}>{v}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* DataGrid */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>
      ) : (
        <Box height="60vh" sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: `1px solid ${colors.grey[800]}`, alignItems: "center" },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-columnHeaderTitle": { color: colors.grey[100], fontWeight: 600 },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": { color: `${colors.grey[100]} !important` },
          "& .MuiDataGrid-row:hover": { backgroundColor: `${colors.primary[300]} !important` },
          "& .MuiTablePagination-root": { color: colors.grey[300] },
          "& .MuiTablePagination-selectIcon": { color: colors.grey[300] },
        }}>
          <DataGrid
            rows={filtered}
            columns={columns}
            getRowId={r => r.id}
            rowCount={totalCount}
            paginationMode="server"
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            components={{ Toolbar: GridToolbar }}
            componentsProps={{
              toolbar: { showQuickFilter: false },
            }}
            disableSelectionOnClick
            rowHeight={60}
            sx={{ color: colors.grey[100] }}
          />
        </Box>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, doc: null, reason: "" })}
        maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Reject Document</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color={colors.grey[300]} mb={2}>
            Rejecting: <strong style={{ color: colors.grey[100] }}>{rejectDialog.doc?.file_name}</strong>
            {" "}from <strong style={{ color: colors.grey[100] }}>{rejectDialog.doc?.user?.name}</strong>
          </Typography>
          <TextField fullWidth multiline rows={3} label="Rejection Reason *"
            value={rejectDialog.reason}
            onChange={e => setRejectDialog(d => ({ ...d, reason: e.target.value }))}
            sx={{
              "& label": { color: colors.grey[400] },
              "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } },
            }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, doc: null, reason: "" })}
            sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" onClick={handleReject}
            disabled={!rejectDialog.reason.trim() || processing[rejectDialog.doc?.id]}
            sx={{ backgroundColor: "#e05c5c" }}>Reject Document</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onClose={() => setPreviewDoc(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        {previewDoc && (
          <>
            <DialogTitle sx={{ color: colors.grey[100], borderBottom: `1px solid ${colors.grey[700]}` }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Document Details</Typography>
                <Chip label={previewDoc.status?.toUpperCase()} size="small"
                  sx={{ backgroundColor: (STATUS_COLORS[previewDoc.status] || "#888") + "33",
                    color: STATUS_COLORS[previewDoc.status] || colors.grey[300], fontSize: "0.7rem" }} />
                {previewDoc.expiring_soon && (
                  <Chip label="EXPIRING SOON" size="small"
                    sx={{ backgroundColor: "#f0a04033", color: "#f0a040", fontSize: "0.7rem" }} />
                )}
                {previewDoc.expired && (
                  <Chip label="EXPIRED" size="small"
                    sx={{ backgroundColor: "#88888833", color: "#888", fontSize: "0.7rem" }} />
                )}
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              {[
                ["Client",           previewDoc.user?.name],
                ["Email",            previewDoc.user?.email],
                ["Phone",            previewDoc.user?.phone],
                ["Document Type",    DOC_TYPE_LABELS[previewDoc.document_type] || previewDoc.document_type?.replace(/_/g, " ")],
                ["Document Number",  previewDoc.document_number],
                ["File Name",        previewDoc.file_name],
                ["File Size",        previewDoc.file_size_mb ? `${previewDoc.file_size_mb} MB` : null],
                ["Format",           previewDoc.file_format?.toUpperCase()],
                ["Uploaded",         previewDoc.uploaded_at ? new Date(previewDoc.uploaded_at).toLocaleString() : null],
                ["Expiry Date",      previewDoc.expiry_date ? new Date(previewDoc.expiry_date).toLocaleDateString() : null],
                ["Verified At",      previewDoc.verified_at ? new Date(previewDoc.verified_at).toLocaleString() : null],
                ["Verified By",      previewDoc.verified_by?.name],
                ["Notes",            previewDoc.notes],
                ["Rejection Reason", previewDoc.rejection_reason],
              ].filter(([, v]) => v).map(([label, value]) => (
                <Box key={label} display="flex" gap={2} py={0.75}
                  sx={{ borderBottom: `1px solid ${colors.grey[800]}` }}>
                  <Typography variant="body2" color={colors.grey[400]} sx={{ minWidth: 140, flexShrink: 0 }}>{label}</Typography>
                  <Typography variant="body2" color={
                    label === "Rejection Reason" ? colors.redAccent[400] : colors.grey[100]
                  }>{value}</Typography>
                </Box>
              ))}
            </DialogContent>
            <DialogActions sx={{ borderTop: `1px solid ${colors.grey[700]}`, px: 3, py: 2 }}>
              <Button onClick={() => setPreviewDoc(null)} sx={{ color: colors.grey[400] }}>Close</Button>
              {(previewDoc.status === "unverified" || previewDoc.status === "pending") && (
                <>
                  <Button variant="outlined" onClick={() => { setPreviewDoc(null); setRejectDialog({ open: true, doc: previewDoc, reason: "" }); }}
                    sx={{ borderColor: "#e05c5c", color: "#e05c5c" }}>Reject</Button>
                  <Button variant="contained" onClick={() => { handleVerify(previewDoc.id); setPreviewDoc(null); }}
                    sx={{ backgroundColor: "#4cceac", color: "#000" }}>Verify</Button>
                </>
              )}
              <Button variant="outlined" component="a"
                href={`${BASE_URL}/documents/${previewDoc.id}/download`} target="_blank"
                startIcon={<DownloadIcon />}
                sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[400] }}>
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3500}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentVerification;
