import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Button,
  Chip, IconButton, Tooltip, MenuItem, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import DownloadIcon from "@mui/icons-material/Download";
import VerifiedIcon from "@mui/icons-material/Verified";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";

const BASE_URL = "http://localhost:3001/api/v1";

const statusColor = (s, colors) => {
  if (s === "verified") return colors.greenAccent[500];
  if (s === "rejected") return colors.redAccent[400];
  if (s === "unverified") return "#f0c040";
  return colors.grey[400];
};

const DocumentRepository = () => {
  const colors = tokens(useTheme().palette.mode);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [rejectDialog, setRejectDialog] = useState({ open: false, docId: null });
  const [rejectReason, setRejectReason] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem("token");

  const load = () => {
    setLoading(true);
    setError(null);
    fetch(`${BASE_URL}/documents`, {
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    })
      .then(r => r.json())
      .then(data => {
        const list = data?.data?.documents || data?.documents || [];
        // Normalise: flatten user object into row
        setDocs(list.map(d => ({
          ...d,
          client_name: d.user ? `${d.user.name || ""}`.trim() || d.user.email || "—" : "—",
          client_email: d.user?.email || "—",
        })));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerify = async (id) => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/documents/${id}/verify`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Verified by admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to verify");
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "verified" } : d));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openReject = (id) => {
    setRejectReason("");
    setRejectDialog({ open: true, docId: id });
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/documents/${rejectDialog.docId}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject");
      setDocs(prev => prev.map(d =>
        d.id === rejectDialog.docId ? { ...d, status: "rejected", rejection_reason: rejectReason } : d
      ));
      setRejectDialog({ open: false, docId: null });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = (doc) => {
    window.open(`${BASE_URL}/documents/${doc.id}/download?token=${token()}`, "_blank");
  };

  const filtered = filter === "all" ? docs : docs.filter(d => d.status === filter);

  // Stats
  const stats = {
    total: docs.length,
    pending: docs.filter(d => d.status === "unverified").length,
    verified: docs.filter(d => d.status === "verified").length,
    rejected: docs.filter(d => d.status === "rejected").length,
  };

  const columns = [
    {
      field: "client_name", headerName: "Client", flex: 1.2,
      renderCell: p => (
        <Box>
          <Typography variant="body2" color={colors.grey[100]}>{p.value}</Typography>
          <Typography variant="caption" color={colors.grey[500]}>{p.row.client_email}</Typography>
        </Box>
      ),
    },
    {
      field: "document_type", headerName: "Type", flex: 1,
      renderCell: p => (
        <Typography variant="body2" color={colors.grey[200]}>
          {(p.value || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
        </Typography>
      ),
    },
    { field: "file_name", headerName: "File", flex: 1.3,
      renderCell: p => <Typography variant="body2" color={colors.grey[300]} noWrap>{p.value}</Typography> },
    {
      field: "uploaded_at", headerName: "Uploaded", flex: 0.9,
      renderCell: p => p.value ? new Date(p.value).toLocaleDateString() : "—",
    },
    {
      field: "status", headerName: "Status", flex: 0.8,
      renderCell: p => (
        <Chip label={(p.value || "").toUpperCase()} size="small"
          sx={{ backgroundColor: statusColor(p.value, colors), color: "#fff", fontWeight: "bold", fontSize: 10 }} />
      ),
    },
    {
      field: "actions", headerName: "Actions", flex: 1.1, sortable: false,
      renderCell: p => (
        <Box display="flex" gap={0.5} alignItems="center">
          <Tooltip title="Preview details">
            <IconButton size="small" onClick={() => setPreviewDoc(p.row)}
              sx={{ color: colors.blueAccent[400] }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small" onClick={() => handleDownload(p.row)}
              sx={{ color: colors.grey[300] }}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {(p.row.status === "unverified") && (
            <>
              <Tooltip title="Verify">
                <IconButton size="small" onClick={() => handleVerify(p.row.id)}
                  sx={{ color: colors.greenAccent[400] }}>
                  <VerifiedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton size="small" onClick={() => openReject(p.row.id)}
                  sx={{ color: colors.redAccent[400] }}>
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Document Repository</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Review and verify client-uploaded documents</Typography>
        </Box>
        <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }} title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Stats */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {[
          { label: "Total", value: stats.total, color: colors.blueAccent[400] },
          { label: "Pending Review", value: stats.pending, color: "#f0c040" },
          { label: "Verified", value: stats.verified, color: colors.greenAccent[400] },
          { label: "Rejected", value: stats.rejected, color: colors.redAccent[400] },
        ].map(s => (
          <Card key={s.label} sx={{ backgroundColor: colors.primary[400], flex: "1 1 120px", minWidth: 110 }}>
            <CardContent sx={{ p: "12px 16px !important" }}>
              <Typography variant="h4" color={s.color} fontWeight="bold">{s.value}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>{s.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Filter */}
      <Box mb={2}>
        <TextField select size="small" label="Filter by Status" value={filter}
          onChange={e => setFilter(e.target.value)}
          sx={{
            minWidth: 180,
            "& .MuiInputBase-input": { color: colors.grey[100] },
            "& .MuiInputLabel-root": { color: colors.grey[300] },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] },
          }}>
          <MenuItem value="all">All Documents</MenuItem>
          <MenuItem value="unverified">Pending Review</MenuItem>
          <MenuItem value="verified">Verified</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      ) : (
        <Box height="60vh" sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": { color: `${colors.grey[100]} !important` },
          "& .MuiDataGrid-row": { maxHeight: "60px !important" },
        }}>
          <DataGrid rows={filtered} columns={columns} getRowId={r => r.id}
            components={{ Toolbar: GridToolbar }}
            rowHeight={60}
            pageSize={15}
            rowsPerPageOptions={[15, 30, 50]} />
        </Box>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, docId: null })}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Reject Document</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color={colors.grey[300]} mb={2}>
            Please provide a reason for rejection. This will be visible to the client.
          </Typography>
          <TextField
            fullWidth multiline rows={3}
            label="Rejection Reason *"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            sx={{
              "& .MuiInputBase-input": { color: colors.grey[100] },
              "& .MuiInputLabel-root": { color: colors.grey[300] },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, docId: null })}
            sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!rejectReason.trim() || saving}
            onClick={handleReject}
            sx={{ backgroundColor: colors.redAccent[600] }}>
            {saving ? "Rejecting..." : "Reject Document"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onClose={() => setPreviewDoc(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        {previewDoc && (
          <>
            <DialogTitle sx={{ color: colors.grey[100] }}>
              Document Details
              <Chip label={(previewDoc.status || "").toUpperCase()} size="small"
                sx={{ ml: 2, backgroundColor: statusColor(previewDoc.status, colors), color: "#fff", fontSize: 10 }} />
            </DialogTitle>
            <DialogContent>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />
              {[
                ["Client", previewDoc.client_name],
                ["Email", previewDoc.client_email],
                ["Document Type", (previewDoc.document_type || "").replace(/_/g, " ")],
                ["File Name", previewDoc.file_name],
                ["File Size", previewDoc.file_size_mb ? `${previewDoc.file_size_mb} MB` : "—"],
                ["Uploaded", previewDoc.uploaded_at ? new Date(previewDoc.uploaded_at).toLocaleString() : "—"],
                ["Expiry Date", previewDoc.expiry_date ? new Date(previewDoc.expiry_date).toLocaleDateString() : "None"],
                ["Notes", previewDoc.notes || "—"],
                ["Rejection Reason", previewDoc.rejection_reason || "—"],
              ].map(([label, value]) => (
                <Box key={label} display="flex" gap={2} mb={1}>
                  <Typography variant="body2" color={colors.grey[400]} sx={{ minWidth: 130 }}>{label}:</Typography>
                  <Typography variant="body2" color={colors.grey[100]}>{value}</Typography>
                </Box>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewDoc(null)} sx={{ color: colors.grey[400] }}>Close</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />}
                onClick={() => handleDownload(previewDoc)}
                sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[400] }}>
                Download
              </Button>
              {previewDoc.status === "unverified" && (
                <>
                  <Button variant="contained" startIcon={<VerifiedIcon />}
                    onClick={() => { handleVerify(previewDoc.id); setPreviewDoc(null); }}
                    sx={{ backgroundColor: colors.greenAccent[600] }}>
                    Verify
                  </Button>
                  <Button variant="contained" startIcon={<CancelIcon />}
                    onClick={() => { setPreviewDoc(null); openReject(previewDoc.id); }}
                    sx={{ backgroundColor: colors.redAccent[600] }}>
                    Reject
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DocumentRepository;
