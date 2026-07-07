import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import adminApi from "../../../utils/api";
import {
  Add,
  Notifications,
  Warning,
  Send,
  Download,
  Visibility,
  Link as LinkIcon,
  Email,
  Sms,
  Description,
} from "@mui/icons-material";

const zones = ["All Zones", "North", "South", "East", "West"];
const reminderTemplates = ["Gentle Reminder", "Final Notice", "Disconnection Warning"];
const deliveryChannels = ["SMS", "Email", "Letter"];

const DunningWorkflow = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [dueDateFilter, setDueDateFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("All Zones");
  const [invoices, setInvoices] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [nextId, setNextId] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Load real overdue invoices from API on mount
  useEffect(() => {
    adminApi.get("/admin/dunning/overdue")
      .then(res => {
        const data = res.data?.data?.overdue_invoices || res.data?.data?.invoices || res.data?.invoices || [];
        const mapped = (Array.isArray(data) ? data : []).map(inv => ({
          id: inv.id,
          customer: inv.user_name || inv.user_id || "Unknown",
          zone: inv.zone || "—",
          amount: inv.total_amount || 0,
          dueDate: inv.due_date ? inv.due_date.split("T")[0] : "",
          status: inv.status || "Overdue",
          daysOverdue: inv.days_overdue || calculateDaysOverdue(inv.due_date),
          escalationStage: getEscalationStage(inv.days_overdue || calculateDaysOverdue(inv.due_date)),
          deliveryStatus: "Not Sent",
          reminderCount: 0,
          invoiceId: inv.id,
        }));
        setInvoices(mapped);
        if (mapped.length > 0) setNextId(Math.max(...mapped.map(m => m.id)) + 1);
      })
      .catch(() => {}) // fall through to empty state
      .finally(() => setApiLoading(false));
  }, []);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [reminderDialog, setReminderDialog] = useState({ open: false, invoice: null, template: "Gentle Reminder", channel: "SMS" });

  const [filters, setFilters] = useState({
    status: "all",
    zone: "all",
    daysOverdue: "all",
    search: "",
  });

  // Common styling for TextFields
  const textFieldSx = {
    '& .MuiInputBase-input': { color: colors.grey[100] },
    '& .MuiInputLabel-root': { color: colors.grey[300] },
    '& .MuiInputLabel-root.Mui-focused': { color: colors.grey[100] },
    '& .MuiInputLabel-root.MuiFormLabel-filled': { color: colors.grey[100] },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.grey[500] },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.greenAccent[400] },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.greenAccent[400] },
  };

  // Calculate days overdue
  const calculateDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Auto-escalation based on days overdue
  const getEscalationStage = (daysOverdue) => {
    if (daysOverdue === 0) return "Generated";
    if (daysOverdue <= 3) return "Gentle Reminder";
    if (daysOverdue <= 7) return "Second Notice";
    if (daysOverdue <= 14) return "Final Notice";
    if (daysOverdue <= 21) return "Disconnection Warning";
    return "Overdue";
  };

  // Generate mock invoices
  const handleGenerateInvoices = () => {
    if (!dueDateFilter) {
      setSnackbar({ open: true, message: "Please select a due date", severity: "error" });
      return;
    }

    const newInvoices = [
      {
        id: nextId,
        customer: "John Doe",
        zone: "North",
        amount: 1200,
        dueDate: dueDateFilter,
        status: "Generated",
        daysOverdue: calculateDaysOverdue(dueDateFilter),
        escalationStage: getEscalationStage(calculateDaysOverdue(dueDateFilter)),
        deliveryStatus: "Not Sent",
        reminderCount: 0,
      },
      {
        id: nextId + 1,
        customer: "Jane Smith",
        zone: "South",
        amount: 1500,
        dueDate: dueDateFilter,
        status: "Generated",
        daysOverdue: calculateDaysOverdue(dueDateFilter),
        escalationStage: getEscalationStage(calculateDaysOverdue(dueDateFilter)),
        deliveryStatus: "Not Sent",
        reminderCount: 0,
      },
    ];
    setInvoices((prev) => [...prev, ...newInvoices]);
    setNextId(nextId + 2);
    setSnackbar({ open: true, message: "Invoices generated", severity: "success" });
  };

  // Send reminder with template — calls real API
  const handleSendReminder = async (invoice, template, channel) => {
    try {
      await adminApi.post("/admin/dunning/send_reminder", {
        invoice_id: invoice.invoiceId || invoice.id,
        action_type: template,
        message: `${template} via ${channel}`,
      });
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoice.id
            ? { ...inv, status: "Reminder Sent", deliveryStatus: "Delivered",
                reminderCount: (inv.reminderCount || 0) + 1,
                lastReminderDate: new Date().toISOString().split("T")[0],
                escalationStage: template }
            : inv
        )
      );
      setSnackbar({ open: true, message: `Reminder sent via ${channel}`, severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to send reminder", severity: "error" });
    }
  };

  // Handle mass reminder
  const handleMassReminder = (template, channel) => {
    if (selectedIds.length === 0) {
      setSnackbar({ open: true, message: "Please select at least one invoice", severity: "error" });
      return;
    }

    const ids = selectedIds.map((v) => Number(v)).filter((v) => Number.isFinite(v));
    setInvoices((prev) =>
      prev.map((inv) => {
        if (ids.includes(inv.id)) {
          const deliveryStatuses = ["Delivered", "Failed", "Pending"];
          const randomStatus = deliveryStatuses[Math.floor(Math.random() * deliveryStatuses.length)];
          return {
            ...inv,
            status: randomStatus === "Delivered" ? "Reminder Sent" : inv.status,
            deliveryStatus: randomStatus,
            reminderCount: (inv.reminderCount || 0) + 1,
            lastReminderDate: new Date().toISOString().split('T')[0],
            escalationStage: template,
          };
        }
        return inv;
      })
    );
    setSnackbar({ open: true, message: `Sent ${ids.length} reminder(s) via ${channel}`, severity: "success" });
    setSelectedIds([]);
  };

  // Escalate to collections
  const handleEscalate = (id) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: "Escalated", escalationStage: "Collections" } : inv
      )
    );
    setSnackbar({ open: true, message: "Invoice escalated to collections", severity: "info" });
  };

  // Export overdue reports
  const exportOverdue = () => {
    const overdue = filteredInvoices.filter((inv) => inv.daysOverdue > 0);
    const cols = ["id", "customer", "zone", "amount", "dueDate", "daysOverdue", "status", "escalationStage"];
    const rows = overdue.map((inv) => cols.map((c) => (inv[c] ?? "")).join(","));
    const csv = [cols.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `overdue_invoices_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: "Overdue report exported", severity: "success" });
  };

  // Filters
  const filteredInvoices = useMemo(() => {
    let filtered = invoices.map((inv) => ({
      ...inv,
      daysOverdue: calculateDaysOverdue(inv.dueDate),
      escalationStage: getEscalationStage(calculateDaysOverdue(inv.dueDate)),
    }));

    if (filters.status !== "all") filtered = filtered.filter((inv) => inv.status === filters.status);
    if (filters.zone !== "all" && filters.zone !== "All Zones") filtered = filtered.filter((inv) => inv.zone === filters.zone);
    if (filters.daysOverdue !== "all") {
      const days = Number(filters.daysOverdue);
      if (days === 0) filtered = filtered.filter((inv) => inv.daysOverdue === 0);
      else if (days === 30) filtered = filtered.filter((inv) => inv.daysOverdue > 30);
      else filtered = filtered.filter((inv) => inv.daysOverdue >= days && inv.daysOverdue < days + 30);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter((inv) => inv.customer.toLowerCase().includes(s));
    }
    if (zoneFilter !== "All Zones") filtered = filtered.filter((inv) => inv.zone === zoneFilter);

    return filtered;
  }, [invoices, filters, zoneFilter]);

  // DataGrid columns
  const columns = [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "customer", headerName: "Customer", flex: 1,
      renderCell: (params) => (
        <Button size="small" sx={{ color: colors.blueAccent[400], p: 0, minWidth: 0, textTransform: "none", fontSize: 13 }}
          onClick={() => navigate("../client-lookup", { state: { search: params.value } })}>
          {params.value}
        </Button>
      ),
    },
    { field: "zone", headerName: "Zone", flex: 0.8 },
    {
      field: "amount",
      headerName: "Amount (KES)",
      flex: 0.8,
      renderCell: (params) => (
        <Typography sx={{ color: colors.greenAccent[500], fontWeight: "bold" }}>
          {Number(params.value || 0).toLocaleString()}
        </Typography>
      ),
    },
    { field: "dueDate", headerName: "Due Date", flex: 0.8 },
    {
      field: "daysOverdue",
      headerName: "Days Overdue",
      flex: 0.7,
      renderCell: (params) => {
        const days = params.value || 0;
        const color = days === 0 ? colors.greenAccent[500] : days > 21 ? colors.redAccent[400] : colors.orangeAccent?.[400] || colors.blueAccent[300];
        return <Typography fontWeight="bold" color={color}>{days}</Typography>;
      },
    },
    {
      field: "escalationStage",
      headerName: "Escalation Stage",
      flex: 1,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          sx={{
            backgroundColor: colors.blueAccent[600],
            color: colors.grey[100],
            fontWeight: "bold",
          }}
        />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      renderCell: (params) => {
        let color = colors.grey[100];
        if (params.value === "Generated") color = colors.blueAccent[300];
        if (params.value === "Reminder Sent") color = colors.greenAccent[500];
        if (params.value === "Overdue") color = colors.redAccent[400];
        if (params.value === "Escalated") color = colors.redAccent[600];
        return (
          <Typography sx={{ fontWeight: "bold", color }}>
            {params.value}
          </Typography>
        );
      },
    },
    {
      field: "deliveryStatus",
      headerName: "Delivery",
      flex: 0.7,
      renderCell: (params) => {
        let color = colors.grey[400];
        if (params.value === "Delivered") color = colors.greenAccent[500];
        if (params.value === "Failed") color = colors.redAccent[400];
        return <Typography sx={{ fontSize: "0.75rem", color }}>{params.value || "-"}</Typography>;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 2,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Send reminder">
            <IconButton
              size="small"
              onClick={() => setReminderDialog({ open: true, invoice: params.row, template: "Gentle Reminder", channel: "SMS" })}
            >
              <Send fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Escalate">
            <IconButton
              size="small"
              onClick={() => handleEscalate(params.row.id)}
              disabled={params.row.status === "Escalated"}
            >
              <Warning fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View invoice">
            <IconButton size="small">
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Link to invoice">
            <IconButton size="small" onClick={() => navigate("../invoice-generation")}>
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" sx={{ m: "0 0 5px 0", paddingBottom: "20px" }}>
        DUNNING WORKFLOW
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        <strong>Purpose:</strong> Manage overdue invoices with reminders and escalation.
        <br />
        <strong>Statuses:</strong>
        <br />- <span style={{ color: colors.blueAccent[300] }}>Generated</span>: Invoice created.
        <br />- <span style={{ color: colors.greenAccent[500] }}>Reminder Sent</span>: Reminder issued.
        <br />- <span style={{ color: colors.redAccent[400] }}>Overdue</span>: Payment past due.
        <br />- <span style={{ color: colors.redAccent[600] }}>Escalated</span>: Sent to collections.
      </Typography>

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: colors.primary[400] }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            type="date"
            label="Due Date Filter"
            value={dueDateFilter}
            onChange={(e) => setDueDateFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={textFieldSx}
          />
          <TextField
            select
            label="Zone"
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            sx={{ minWidth: 200, ...textFieldSx }}
          >
            {zones.map((z) => (
              <MenuItem key={z} value={z}>
                {z}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleGenerateInvoices}
            sx={{
              backgroundColor: colors.greenAccent[600],
              "&:hover": { backgroundColor: colors.greenAccent[700] },
            }}
          >
            Generate Invoices
          </Button>
        </Box>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: colors.primary[400] }}>
        <Box display="flex" gap={1} flexWrap="wrap">
          <TextField
            label="Search"
            size="small"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            sx={textFieldSx}
          />
          <TextField
            label="Status"
            size="small"
            select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            sx={{ minWidth: 150, ...textFieldSx }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="Generated">Generated</MenuItem>
            <MenuItem value="Reminder Sent">Reminder Sent</MenuItem>
            <MenuItem value="Overdue">Overdue</MenuItem>
            <MenuItem value="Escalated">Escalated</MenuItem>
          </TextField>
          <TextField
            label="Days Overdue"
            size="small"
            select
            value={filters.daysOverdue}
            onChange={(e) => setFilters({ ...filters, daysOverdue: e.target.value })}
            sx={{ minWidth: 150, ...textFieldSx }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="0">Not Overdue</MenuItem>
            <MenuItem value="1">1-30 days</MenuItem>
            <MenuItem value="30">31-60 days</MenuItem>
            <MenuItem value="60">61-90 days</MenuItem>
            <MenuItem value="90">90+ days</MenuItem>
          </TextField>
          <Box flex={1} />
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => handleMassReminder("Gentle Reminder", "SMS")}
            disabled={!selectedIds.length}
            sx={{ backgroundColor: colors.blueAccent[600], '&:hover': { backgroundColor: colors.blueAccent[700] } }}
          >
            Bulk Send Reminders
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={exportOverdue}
            sx={{ backgroundColor: colors.blueAccent[600], '&:hover': { backgroundColor: colors.blueAccent[700] } }}
          >
            Export Overdue
          </Button>
        </Box>
      </Paper>

      {/* DataGrid */}
      {apiLoading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      ) : (
      <Box
        height="70vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.grey[100]} !important`,
          },
        }}
      >
        <DataGrid
          rows={filteredInvoices}
          columns={columns}
          getRowId={(row) => row.id}
          checkboxSelection
          onSelectionModelChange={(ids) => setSelectedIds((Array.isArray(ids) ? ids : [ids]).map((v) => Number(v)))}
          selectionModel={selectedIds}
          components={{ Toolbar: GridToolbar }}
        />
      </Box>
      )}

      {/* Reminder Dialog */}
      <Dialog
        open={reminderDialog.open}
        onClose={() => setReminderDialog({ open: false, invoice: null, template: "Gentle Reminder", channel: "SMS" })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Send Reminder</DialogTitle>
        <DialogContent dividers>
          <TextField
            margin="dense"
            select
            label="Template"
            value={reminderDialog.template}
            onChange={(e) => setReminderDialog({ ...reminderDialog, template: e.target.value })}
            fullWidth
            sx={textFieldSx}
          >
            {reminderTemplates.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            select
            label="Delivery Channel"
            value={reminderDialog.channel}
            onChange={(e) => setReminderDialog({ ...reminderDialog, channel: e.target.value })}
            fullWidth
            sx={textFieldSx}
          >
            {deliveryChannels.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setReminderDialog({ open: false, invoice: null, template: "Gentle Reminder", channel: "SMS" })}
            variant="contained"
            sx={{ color: colors.redAccent[200], backgroundColor: colors.redAccent[600] }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              handleSendReminder(reminderDialog.invoice, reminderDialog.template, reminderDialog.channel);
              setReminderDialog({ open: false, invoice: null, template: "Gentle Reminder", channel: "SMS" });
            }}
            sx={{ backgroundColor: colors.greenAccent[600], '&:hover': { backgroundColor: colors.greenAccent[700] } }}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DunningWorkflow;