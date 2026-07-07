import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, CircularProgress, Alert, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Chip, IconButton, Tooltip,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import { useNavigate, useLocation } from "react-router-dom";
import adminApi from "../../../utils/api";

const statusColor = (s, colors) => {
  if (s === "active") return colors.greenAccent[500];
  if (s === "suspended") return colors.redAccent[400];
  if (s === "pending") return "#f0c040";
  return colors.grey[400];
};

const ClientLookup = () => {
  const colors = tokens(useTheme().palette.mode);
  const navigate = useNavigate();
  const location = useLocation();

  // Passed from ticketing page when "View Client" is clicked
  const targetUserId  = location.state?.user_id;
  const targetName    = location.state?.client_name;

  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(null);

  // Fetch all clients once — same call regardless of whether we came from a ticket
  useEffect(() => {
    adminApi.get("/admin/clients")
      .then(res => setAllClients(res.data?.clients || res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // When coming from a ticket: filter to just that user_id (instant, no extra API call)
  // When on the normal lookup page: filter by the search box
  const displayedClients = useMemo(() => {
    if (targetUserId) {
      return allClients.filter(c => String(c.id) === String(targetUserId));
    }
    if (!search.trim()) return allClients;
    const q = search.toLowerCase();
    return allClients.filter(c =>
      (c.display_name || c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim()).toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.account_number || "").toLowerCase().includes(q)
    );
  }, [allClients, targetUserId, search]);

  const handleView = (row) => setSelected(row);

  const columns = [
    {
      field: "name", headerName: "Name", flex: 1.2,
      valueGetter: p =>
        p.row.display_name || p.row.name ||
        `${p.row.first_name || ""} ${p.row.last_name || ""}`.trim() || "—",
    },
    { field: "email",          headerName: "Email",      flex: 1.2 },
    { field: "phone",          headerName: "Phone",      flex: 0.9 },
    { field: "account_number", headerName: "Account #",  flex: 0.8 },
    {
      field: "status", headerName: "Status", flex: 0.7,
      renderCell: p => (
        <Chip label={p.value || "—"} size="small"
          sx={{ backgroundColor: statusColor(p.value, colors), color: "#fff", fontWeight: "bold" }} />
      ),
    },
    { field: "account_type", headerName: "Type", flex: 0.7 },
    {
      field: "actions", headerName: "Actions", flex: 0.7, sortable: false,
      renderCell: p => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View details">
            <IconButton size="small" onClick={() => handleView(p.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit profile">
            <IconButton size="small"
              onClick={() => navigate("../client-profile-edit", { state: { client_id: p.row.id } })}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const gridSx = {
    "& .MuiDataGrid-root":        { border: "none" },
    "& .MuiDataGrid-cell":        { borderBottom: "none" },
    "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
    "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
    "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
    "& .MuiDataGrid-toolbarContainer .MuiButton-text": { color: `${colors.grey[100]} !important` },
  };

  return (
    <Box m="20px">
      {/* ── Contextual banner when coming from a ticket ── */}
      {targetUserId ? (
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <IconButton onClick={() => navigate(-1)} sx={{ color: colors.grey[300] }}>
              <ArrowBackIcon />
            </IconButton>
            <PersonSearchIcon sx={{ color: colors.blueAccent[400], fontSize: 28 }} />
            <Box>
              <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">
                Viewing Client: {targetName || `ID ${targetUserId}`}
              </Typography>
              <Typography variant="h6" color={colors.grey[400]}>
                Filtered from the ticket — showing only this client's record
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: "inline-flex", alignItems: "center", gap: 1,
              backgroundColor: colors.blueAccent[800], borderRadius: 1,
              px: 2, py: 0.75, mt: 1,
            }}
          >
            <Typography variant="body2" color={colors.blueAccent[300]}>
              Click "View All Clients" to see the full list
            </Typography>
            <Button size="small"
              onClick={() => navigate("../client-lookup")}
              sx={{ color: colors.blueAccent[300], textDecoration: "underline", p: 0, minWidth: 0 }}>
              View All Clients →
            </Button>
          </Box>
        </Box>
      ) : (
        <Box mb={2}>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">
            Client Lookup
          </Typography>
          <Typography variant="h6" color={colors.grey[400]} mb={2}>
            Search and view all registered clients
          </Typography>
          <TextField
            size="small"
            placeholder="Search by name, email, phone, or account number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{
              minWidth: 340,
              "& .MuiInputBase-input": { color: colors.grey[100] },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] },
            }}
          />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      ) : (
        <Box height={targetUserId ? "auto" : "65vh"} sx={gridSx}>
          <DataGrid
            rows={displayedClients}
            columns={columns}
            getRowId={r => r.id}
            components={{ Toolbar: targetUserId ? undefined : GridToolbar }}
            // Hide footer when showing a single client — no pagination needed
            hideFooter={targetUserId && displayedClients.length <= 1}
            autoHeight={!!targetUserId}
          />
        </Box>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Client Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box display="flex" flexDirection="column" gap={1.5} pt={1}>
              {[
                ["Name",         selected.display_name || selected.name || `${selected.first_name || ""} ${selected.last_name || ""}`.trim()],
                ["Email",        selected.email],
                ["Phone",        selected.phone],
                ["Account #",    selected.account_number],
                ["Status",       selected.status],
                ["Account Type", selected.account_type],
                ["Village",      selected.village],
                ["Plot Number",  selected.plot_number],
                ["Institution",  selected.institution_name],
                ["Joined",       selected.created_at ? new Date(selected.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null],
              ].filter(([, v]) => v).map(([label, val]) => (
                <Box key={label} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color={colors.grey[400]}>{label}</Typography>
                  <Typography variant="body2" color={colors.grey[100]}>{val}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)} sx={{ color: colors.grey[300] }}>Close</Button>
          {selected && (
            <Button variant="contained"
              sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[700] } }}
              onClick={() => { navigate("../client-profile-edit", { state: { client_id: selected.id } }); setSelected(null); }}>
              Edit Profile
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientLookup;
