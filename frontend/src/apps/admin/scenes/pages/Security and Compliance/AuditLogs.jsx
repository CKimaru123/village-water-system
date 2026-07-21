import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  History,
  Person,
  Phone,
  Email,
  Home,
  Security,
  Info,
  Warning,
  CheckCircle,
  Visibility,
  FilterList,
  Refresh,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useAuth } from "../../../../../hooks/useAuth";
import useRealTimeUpdates from "../../../../../hooks/useRealTimeUpdates";
import Header from "../../../components/Header";

const AuditLogs = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuth();

  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    clientSearch: '',
    sensitivityLevel: '',
    changeCategory: '',
    modifiedBy: ''
  });

  // Real-time updates handler
  const handleAuditLogUpdate = (data) => {
    setHasNewUpdates(true);
    // Add the new audit log to the beginning of the list
    setAuditLogs(prev => [data.audit_log, ...prev]);
  };

  // Set up real-time updates for all admin updates
  useRealTimeUpdates(null, handleAuditLogUpdate);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      // For now, we'll load audit logs for all clients
      // In a real implementation, you'd have a dedicated endpoint for admin audit logs
      const response = await fetch(`${BASE_URL}/admin_management/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.users) {
          // For demo purposes, we'll simulate audit logs
          // In a real implementation, you'd have a dedicated audit logs endpoint
          const mockAuditLogs = generateMockAuditLogs(result.data.users);
          setAuditLogs(mockAuditLogs);
        }
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
      setHasNewUpdates(false);
    }
  };

  // Generate mock audit logs for demonstration
  const generateMockAuditLogs = (users) => {
    const mockLogs = [];
    const actions = ['phone', 'email', 'first_name', 'last_name', 'plot_number', 'village'];
    const reasons = [
      'Client requested update',
      'Data correction',
      'System migration',
      'Verification update',
      'Administrative correction'
    ];

    users.slice(0, 10).forEach((user, index) => {
      const numLogs = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numLogs; i++) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        mockLogs.push({
          id: `${user.id}-${i}`,
          client_id: user.id,
          client_name: user.display_name || user.full_name,
          field_name: action.replace('_', ' ').toUpperCase(),
          change_description: `Changed ${action.replace('_', ' ')} from 'old_value' to 'new_value'`,
          modified_by: 'System Admin',
          modified_by_role: Math.random() > 0.5 ? 'admin' : 'super_admin',
          sensitivity_level: action.includes('name') ? 'high' : action.includes('phone') ? 'medium' : 'low',
          change_category: action.includes('name') ? 'identity' : action.includes('phone') || action.includes('email') ? 'contact_info' : 'service',
          reason: reasons[Math.floor(Math.random() * reasons.length)],
          created_at: date.toISOString(),
          formatted_timestamp: date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
        });
      }
    });

    return mockLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const getSensitivityColor = (level) => {
    switch (level) {
      case 'high': return colors.redAccent[500];
      case 'medium': return colors.blueAccent[500];
      case 'low': return colors.greenAccent[500];
      default: return colors.grey[500];
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'contact_info': return <Phone sx={{ color: colors.blueAccent[500] }} />;
      case 'identity': return <Person sx={{ color: colors.redAccent[500] }} />;
      case 'service': return <Home sx={{ color: colors.greenAccent[500] }} />;
      case 'communication': return <Email sx={{ color: colors.blueAccent[500] }} />;
      case 'security': return <Security sx={{ color: colors.redAccent[500] }} />;
      default: return <Info sx={{ color: colors.grey[500] }} />;
    }
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const filteredLogs = auditLogs.filter(log => {
    return (
      (!filters.clientSearch || log.client_name.toLowerCase().includes(filters.clientSearch.toLowerCase())) &&
      (!filters.sensitivityLevel || log.sensitivity_level === filters.sensitivityLevel) &&
      (!filters.changeCategory || log.change_category === filters.changeCategory) &&
      (!filters.modifiedBy || log.modified_by.toLowerCase().includes(filters.modifiedBy.toLowerCase()))
    );
  });

  const columns = [
    {
      field: 'client_name',
      headerName: 'Client',
      flex: 1.5,
      renderCell: (params) => (
        <Typography sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'field_name',
      headerName: 'Field Changed',
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          {getCategoryIcon(params.row.change_category)}
          <Typography sx={{ color: colors.grey[100] }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'sensitivity_level',
      headerName: 'Sensitivity',
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value.toUpperCase()}
          size="small"
          sx={{
            backgroundColor: getSensitivityColor(params.value),
            color: colors.grey[100],
            fontWeight: 'bold'
          }}
        />
      )
    },
    {
      field: 'modified_by',
      headerName: 'Modified By',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography sx={{ color: colors.grey[100] }}>
            {params.value}
          </Typography>
          <Typography variant="caption" sx={{ color: colors.grey[400] }}>
            {params.row.modified_by_role}
          </Typography>
        </Box>
      )
    },
    {
      field: 'formatted_timestamp',
      headerName: 'Date & Time',
      flex: 1.2,
      renderCell: (params) => (
        <Typography sx={{ color: colors.grey[300] }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<Visibility />}
          onClick={() => handleViewDetails(params.row)}
          sx={{
            borderColor: colors.blueAccent[500],
            color: colors.blueAccent[500],
            '&:hover': { borderColor: colors.blueAccent[600] }
          }}
        >
          View
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header 
        title="AUDIT LOGS" 
        subtitle="Complete audit trail of all client profile changes" 
      />

      {/* New Updates Alert */}
      {hasNewUpdates && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadAuditLogs}
              startIcon={<Refresh />}
            >
              Refresh
            </Button>
          }
        >
          New profile changes detected. Click refresh to see the latest updates.
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <History sx={{ fontSize: 40, color: colors.blueAccent[500] }} />
                <Box>
                  <Typography variant="h4" color={colors.grey[100]} fontWeight="bold">
                    {filteredLogs.length}
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Total Changes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Security sx={{ fontSize: 40, color: colors.redAccent[500] }} />
                <Box>
                  <Typography variant="h4" color={colors.grey[100]} fontWeight="bold">
                    {filteredLogs.filter(log => log.sensitivity_level === 'high').length}
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    High Sensitivity
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Person sx={{ fontSize: 40, color: colors.greenAccent[500] }} />
                <Box>
                  <Typography variant="h4" color={colors.grey[100]} fontWeight="bold">
                    {new Set(filteredLogs.map(log => log.client_id)).size}
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Clients Affected
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle sx={{ fontSize: 40, color: colors.blueAccent[500] }} />
                <Box>
                  <Typography variant="h4" color={colors.grey[100]} fontWeight="bold">
                    {filteredLogs.filter(log => {
                      const logDate = new Date(log.created_at);
                      const today = new Date();
                      return logDate.toDateString() === today.toDateString();
                    }).length}
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Today's Changes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: colors.primary[400] }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <FilterList sx={{ color: colors.blueAccent[500] }} />
          <Typography variant="h6" color={colors.grey[100]}>
            Filters
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Search Client"
              value={filters.clientSearch}
              onChange={(e) => setFilters({ ...filters, clientSearch: e.target.value })}
              fullWidth
              size="small"
              sx={{
                '& .MuiInputLabel-root': { color: colors.grey[100] },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.grey[300] },
                  color: colors.grey[100],
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: colors.grey[100] }}>Sensitivity Level</InputLabel>
              <Select
                value={filters.sensitivityLevel}
                onChange={(e) => setFilters({ ...filters, sensitivityLevel: e.target.value })}
                label="Sensitivity Level"
                sx={{
                  color: colors.grey[100],
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.grey[300] },
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: colors.grey[100] }}>Category</InputLabel>
              <Select
                value={filters.changeCategory}
                onChange={(e) => setFilters({ ...filters, changeCategory: e.target.value })}
                label="Category"
                sx={{
                  color: colors.grey[100],
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.grey[300] },
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="contact_info">Contact Info</MenuItem>
                <MenuItem value="identity">Identity</MenuItem>
                <MenuItem value="service">Service</MenuItem>
                <MenuItem value="communication">Communication</MenuItem>
                <MenuItem value="security">Security</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Modified By"
              value={filters.modifiedBy}
              onChange={(e) => setFilters({ ...filters, modifiedBy: e.target.value })}
              fullWidth
              size="small"
              sx={{
                '& .MuiInputLabel-root': { color: colors.grey[100] },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.grey[300] },
                  color: colors.grey[100],
                },
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Audit Logs Table */}
      <Paper sx={{ backgroundColor: colors.primary[400] }}>
        <Box height="600px">
          <DataGrid
            rows={filteredLogs}
            columns={columns}
            getRowId={(row) => row.id}
            components={{ Toolbar: GridToolbar }}
            sx={{
              "& .MuiDataGrid-root": { border: "none" },
              "& .MuiDataGrid-cell": { borderBottom: "none", color: colors.grey[100] },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: colors.blueAccent[700],
                borderBottom: "none",
                color: colors.grey[100],
              },
              "& .MuiDataGrid-virtualScroller": {
                backgroundColor: colors.primary[400],
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "none",
                backgroundColor: colors.blueAccent[700],
              },
              "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
                color: `${colors.grey[100]} !important`,
              },
            }}
          />
        </Box>
      </Paper>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: colors.blueAccent[700], color: colors.grey[100] }}>
          Audit Log Details
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: colors.primary[400] }}>
          {selectedLog && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                  Client Name:
                </Typography>
                <Typography variant="body1" color={colors.grey[100]} gutterBottom>
                  {selectedLog.client_name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                  Field Changed:
                </Typography>
                <Typography variant="body1" color={colors.grey[100]} gutterBottom>
                  {selectedLog.field_name}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                  Change Description:
                </Typography>
                <Typography variant="body1" color={colors.grey[100]} gutterBottom>
                  {selectedLog.change_description}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                  Modified By:
                </Typography>
                <Typography variant="body1" color={colors.grey[100]} gutterBottom>
                  {selectedLog.modified_by} ({selectedLog.modified_by_role})
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                  Date & Time:
                </Typography>
                <Typography variant="body1" color={colors.grey[100]} gutterBottom>
                  {selectedLog.formatted_timestamp}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                  Sensitivity Level:
                </Typography>
                <Chip
                  label={selectedLog.sensitivity_level.toUpperCase()}
                  sx={{
                    backgroundColor: getSensitivityColor(selectedLog.sensitivity_level),
                    color: colors.grey[100]
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                  Category:
                </Typography>
                <Typography variant="body1" color={colors.grey[100]} gutterBottom>
                  {selectedLog.change_category.replace('_', ' ').toUpperCase()}
                </Typography>
              </Grid>
              {selectedLog.reason && (
                <Grid item xs={12}>
                  <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                    Reason:
                  </Typography>
                  <Typography variant="body1" color={colors.grey[100]} gutterBottom>
                    {selectedLog.reason}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: colors.primary[500] }}>
          <Button onClick={() => setDetailDialogOpen(false)} sx={{ color: colors.grey[100] }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogs;