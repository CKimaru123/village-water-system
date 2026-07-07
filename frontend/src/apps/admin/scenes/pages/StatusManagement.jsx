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
} from "@mui/material";
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  CheckCircle as ActiveIcon,
  Schedule as InactiveIcon,
  Block as SuspendedIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const StatusManagement = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`http://localhost:3001/api/v1/admin_management/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setUsers(result.data.users);
        setStats(result.data.stats);
        setTotalPages(Math.ceil(result.data.pagination.total / result.data.pagination.per_page));
      } else {
        console.error('Failed to load users:', result.message);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, statusFilter]);

  // Handle status change
  const handleStatusChange = async () => {
    if (!selectedUser || !newStatus || !statusReason.trim()) {
      alert('Please select a status and provide a reason');
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3001/api/v1/admin_management/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          user: { 
            status: newStatus,
            status_change_reason: statusReason
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`User status updated to ${newStatus.toUpperCase()} successfully!`);
        setStatusDialogOpen(false);
        setSelectedUser(null);
        setNewStatus('');
        setStatusReason('');
        loadUsers(); // Refresh the list
      } else {
        alert('Failed to update status: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return colors.greenAccent[500];
      case 'inactive': return colors.blueAccent[500];
      case 'suspended': return colors.redAccent[500];
      default: return colors.grey[500];
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <ActiveIcon />;
      case 'inactive': return <InactiveIcon />;
      case 'suspended': return <SuspendedIcon />;
      default: return <PeopleIcon />;
    }
  };

  return (
    <Box m="20px">
      <Header title="STATUS MANAGEMENT" subtitle="Manage user account statuses and permissions" />

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <ActiveIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.active}</Typography>
                    <Typography variant="body2" color="text.secondary">Active Users</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <InactiveIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.inactive}</Typography>
                    <Typography variant="body2" color="text.secondary">Inactive Users</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <SuspendedIcon color="error" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.suspended}</Typography>
                    <Typography variant="body2" color="text.secondary">Suspended Users</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <PeopleIcon color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.total_users}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Users</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Controls */}
      <Box mb={3} display="flex" gap={2} flexWrap="wrap" alignItems="center">
        <TextField
          placeholder="Search users..."
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
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadUsers}
          sx={{ ml: 'auto' }}
        >
          Refresh
        </Button>
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Account Type</TableCell>
              <TableCell>Current Status</TableCell>
              <TableCell>Last Change</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Loading...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No users found</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {user.display_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {user.id} • {user.role.replace('_', ' ').toUpperCase()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{user.phone}</Typography>
                      {user.email && (
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {user.account_type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(user.status)}
                      label={user.status.toUpperCase()}
                      sx={{
                        backgroundColor: getStatusColor(user.status),
                        color: colors.grey[100],
                        fontWeight: 'bold'
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.formatted_updated_at || 'No changes'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton
                        onClick={() => {
                          setSelectedUser(user);
                          setNewStatus(user.status);
                          setStatusDialogOpen(true);
                        }}
                        size="small"
                        sx={{ color: colors.blueAccent[500] }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      )}

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change User Status</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                User: {selectedUser.display_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Status: {selectedUser.status.toUpperCase()}
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>New Status</InputLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  label="New Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Reason for Status Change"
                multiline
                rows={3}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                margin="normal"
                placeholder="Please provide a reason for this status change..."
                required
              />

              {newStatus === 'suspended' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Suspending a user will immediately block their access to the system and water services.
                </Alert>
              )}
              
              {newStatus === 'inactive' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Inactivating a user will pause their water service but allow them to request reactivation.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setStatusDialogOpen(false)}
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': { backgroundColor: '#b71c1c' },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStatusChange}
            variant="contained"
            disabled={updating || !newStatus || !statusReason.trim()}
          >
            {updating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StatusManagement;