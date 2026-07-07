import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Pagination,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  CheckCircle as ApproveIcon,
  Cancel as DenyIcon,
  Refresh as RefreshIcon,
  Schedule as PendingIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Gavel as AppealIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const RequestQueue = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [requests, setRequests] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Load requests
  const loadRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { request_type: typeFilter })
      });

      const response = await fetch(`http://localhost:3001/api/v1/admin/requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setRequests(result.data.requests);
        setStats(result.data.stats);
        setTotalPages(Math.ceil(result.data.pagination.total / result.data.pagination.per_page));
      } else {
        console.error('Failed to load requests:', result.message);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load appeals
  const loadAppeals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/v1/admin/appeals', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setAppeals(result.data.appeals);
      }
    } catch (error) {
      console.error('Error loading appeals:', error);
    }
  };

  useEffect(() => {
    loadRequests();
    loadAppeals();
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  // Handle request action
  const handleRequestAction = async (action) => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      
      const endpoint = action === 'approve' ? 'approve' : 'deny';
      const response = await fetch(`http://localhost:3001/api/v1/admin/requests/${selectedRequest.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_notes: adminNotes })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Request ${action}d successfully!`);
        setActionDialogOpen(false);
        setAdminNotes('');
        setSelectedRequest(null);
        loadRequests(); // Refresh the list
      } else {
        alert(`Failed to ${action} request: ` + result.message);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      alert(`Error ${action}ing request. Please try again.`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.blueAccent[500];
      case 'approved': return colors.greenAccent[500];
      case 'denied': return colors.redAccent[500];
      case 'completed': return colors.grey[500];
      default: return colors.grey[500];
    }
  };

  const getRequestTypeIcon = (type) => {
    switch (type) {
      case 'pause': return <PauseIcon />;
      case 'reactivate': return <PlayIcon />;
      case 'appeal': return <AppealIcon />;
      default: return <PendingIcon />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return colors.redAccent[500];
      case 'high': return colors.redAccent[300];
      case 'normal': return colors.blueAccent[500];
      case 'low': return colors.greenAccent[500];
      default: return colors.grey[500];
    }
  };

  return (
    <Box m="20px">
      <Header title="REQUEST QUEUE" subtitle="Manage client status requests and appeals" />

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <PendingIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.pending}</Typography>
                    <Typography variant="body2" color="text.secondary">Pending Requests</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <ApproveIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.approved}</Typography>
                    <Typography variant="body2" color="text.secondary">Approved</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <DenyIcon color="error" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.denied}</Typography>
                    <Typography variant="body2" color="text.secondary">Denied</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <AppealIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{appeals.filter(a => a.status === 'pending').length}</Typography>
                    <Typography variant="body2" color="text.secondary">Pending Appeals</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs for Requests and Appeals */}
      <Paper sx={{ backgroundColor: colors.primary[400] }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: `1px solid ${colors.grey[300]}`,
            "& .MuiTab-root": {
              color: colors.grey[300],
              "&.Mui-selected": { color: colors.blueAccent[500] },
            },
          }}
        >
          <Tab icon={<PendingIcon />} iconPosition="start" label="Status Requests" />
          <Tab icon={<AppealIcon />} iconPosition="start" label="Appeals" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* Controls */}
          <Box mb={3} display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
            
            {activeTab === 0 && (
              <>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="denied">Denied</MenuItem>
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="pause">Pause</MenuItem>
                    <MenuItem value="reactivate">Reactivate</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                loadRequests();
                loadAppeals();
              }}
              sx={{ ml: 'auto' }}
            >
              Refresh
            </Button>
          </Box>

          {/* Requests Tab */}
          {activeTab === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client</TableCell>
                    <TableCell>Request Type</TableCell>
                    <TableCell>Status Change</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">Loading...</TableCell>
                    </TableRow>
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No requests found</TableCell>
                    </TableRow>
                  ) : (
                    requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {request.user.display_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {request.user.account_number} • {request.user.phone}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getRequestTypeIcon(request.request_type)}
                            <Typography sx={{ textTransform: 'capitalize' }}>
                              {request.request_type}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {request.from_status} → {request.to_status}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {request.reason}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.status.toUpperCase()}
                            sx={{
                              backgroundColor: getStatusColor(request.status),
                              color: colors.grey[100],
                              fontWeight: 'bold'
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(request.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <IconButton
                              onClick={() => {
                                setSelectedRequest(request);
                                setDetailDialogOpen(true);
                              }}
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                            {request.status === 'pending' && (
                              <>
                                <IconButton
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setActionType('approve');
                                    setActionDialogOpen(true);
                                  }}
                                  size="small"
                                  sx={{ color: colors.greenAccent[500] }}
                                >
                                  <ApproveIcon />
                                </IconButton>
                                <IconButton
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setActionType('deny');
                                    setActionDialogOpen(true);
                                  }}
                                  size="small"
                                  sx={{ color: colors.redAccent[500] }}
                                >
                                  <DenyIcon />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Appeals Tab */}
          {activeTab === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Days Since</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appeals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No appeals found</TableCell>
                    </TableRow>
                  ) : (
                    appeals.map((appeal) => (
                      <TableRow key={appeal.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {appeal.user.display_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {appeal.user.account_number} • {appeal.user.phone}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={appeal.priority.toUpperCase()}
                            sx={{
                              backgroundColor: getPriorityColor(appeal.priority),
                              color: colors.grey[100],
                              fontWeight: 'bold'
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {appeal.reason}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={appeal.status.replace('_', ' ').toUpperCase()}
                            sx={{
                              backgroundColor: getStatusColor(appeal.status),
                              color: colors.grey[100],
                              fontWeight: 'bold'
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {appeal.days_since_submitted} days
                            {appeal.is_overdue && (
                              <Chip label="OVERDUE" size="small" color="error" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => {
                              setSelectedRequest(appeal);
                              setDetailDialogOpen(true);
                            }}
                            size="small"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {totalPages > 1 && activeTab === 0 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </Box>
      </Paper>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRequest?.request_type ? 'Request Details' : 'Appeal Details'}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Client:</Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                  {selectedRequest.user?.display_name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Account:</Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                  {selectedRequest.user?.account_number}
                </Typography>
              </Grid>
              {selectedRequest.request_type && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Request Type:</Typography>
                    <Typography variant="body1" sx={{ mb: 2, textTransform: 'capitalize' }}>
                      {selectedRequest.request_type}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Status Change:</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedRequest.from_status} → {selectedRequest.to_status}
                    </Typography>
                  </Grid>
                </>
              )}
              {selectedRequest.priority && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Priority:</Typography>
                  <Chip
                    label={selectedRequest.priority.toUpperCase()}
                    sx={{
                      backgroundColor: getPriorityColor(selectedRequest.priority),
                      color: 'white',
                      mb: 2
                    }}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Reason:</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedRequest.reason}
                </Typography>
              </Grid>
              {selectedRequest.formatted_dates && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Dates:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedRequest.formatted_dates}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Submitted:</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </Typography>
              </Grid>
              {selectedRequest.reviewed_at && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Reviewed:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {new Date(selectedRequest.reviewed_at).toLocaleString()}
                  </Typography>
                </Grid>
              )}
              {selectedRequest.admin_notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Admin Notes:</Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                    {selectedRequest.admin_notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Request' : 'Deny Request'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={actionType === 'approve' ? 'Approval Notes (Optional)' : 'Reason for Denial (Required)'}
            multiline
            rows={3}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            margin="normal"
            placeholder={
              actionType === 'approve' 
                ? 'Add any notes about this approval...'
                : 'Please explain why this request is being denied...'
            }
            sx={{
              '& .MuiInputLabel-root': { color: '#1976d2' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#1976d2', fontWeight: 'bold' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#e0e0e0' },
                '&:hover fieldset': { borderColor: '#1976d2' },
                '&.Mui-focused fieldset': { borderColor: '#1976d2' },
              },
            }}
          />
          {actionType === 'deny' && !adminNotes.trim() && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Please provide a reason for denying this request.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setActionDialogOpen(false)}
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': { backgroundColor: '#b71c1c' },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleRequestAction(actionType)}
            variant="contained"
            disabled={processing || (actionType === 'deny' && !adminNotes.trim())}
            sx={{
              backgroundColor: actionType === 'approve' ? colors.greenAccent[600] : colors.redAccent[600],
              '&:hover': { 
                backgroundColor: actionType === 'approve' ? colors.greenAccent[700] : colors.redAccent[700] 
              }
            }}
          >
            {processing ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Deny')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestQueue;