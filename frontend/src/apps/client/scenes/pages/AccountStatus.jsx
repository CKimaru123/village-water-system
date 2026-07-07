import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import {
  AccountCircle,
  Pause,
  PlayArrow,
  Gavel as Appeal,
  CheckCircle,
  Error,
  Info,
  Schedule,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";

const AccountStatus = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [inactivateDialogOpen, setInactivateDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [appealDialogOpen, setAppealDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [pauseForm, setPauseForm] = useState({
    reason: "",
    start_date: "",
    end_date: "",
  });

  const [inactivateForm, setInactivateForm] = useState({
    reason: "",
  });

  const [reactivateForm, setReactivateForm] = useState({
    reason: "",
  });

  const [appealForm, setAppealForm] = useState({
    reason: "",
    priority: "normal",
  });

  // Load user status with polling for real-time updates
  const loadUserStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/v1/client/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setUserStatus(result.data);
        
        // Update AuthContext with latest user status
        if (result.data.user) {
          updateUser({ 
            status: result.data.user.status,
            last_status_change: result.data.user.last_status_change,
            status_change_reason: result.data.user.status_change_reason
          });
        }
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to load status', severity: 'error' });
      }
    } catch (error) {
      console.error('Error loading status:', error);
      setSnackbar({ open: true, message: 'Error loading status', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserStatus();
    
    // Temporarily disable polling to fix loading issue
    // Set up polling for real-time updates every 60 seconds (reduced frequency)
    // const interval = setInterval(() => {
    //   loadUserStatus();
    // }, 60000);

    // return () => clearInterval(interval);
  }, []);

  // Handle pause request
  const handlePauseRequest = async () => {
    if (!pauseForm.reason.trim()) {
      setSnackbar({ open: true, message: 'Please provide a reason for the pause', severity: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/v1/client/status/request-pause', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request: pauseForm })
      });

      const result = await response.json();
      if (result.success) {
        setSnackbar({ open: true, message: 'Pause request submitted successfully', severity: 'success' });
        setPauseDialogOpen(false);
        setPauseForm({ reason: "", start_date: "", end_date: "" });
        loadUserStatus(); // Refresh status
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to submit request', severity: 'error' });
      }
    } catch (error) {
      console.error('Error submitting pause request:', error);
      setSnackbar({ open: true, message: 'Error submitting request', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle inactivation request
  const handleInactivationRequest = async () => {
    if (!inactivateForm.reason.trim()) {
      setSnackbar({ open: true, message: 'Please provide a reason for inactivation', severity: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/v1/client/status/request-pause', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          request: {
            ...inactivateForm,
            request_type: 'inactivate'
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setSnackbar({ open: true, message: 'Inactivation request submitted successfully', severity: 'success' });
        setInactivateDialogOpen(false);
        setInactivateForm({ reason: "" });
        loadUserStatus(); // Refresh status
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to submit request', severity: 'error' });
      }
    } catch (error) {
      console.error('Error submitting inactivation request:', error);
      setSnackbar({ open: true, message: 'Error submitting request', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };
  const handleReactivationRequest = async () => {
    if (!reactivateForm.reason.trim()) {
      setSnackbar({ open: true, message: 'Please provide a reason for reactivation', severity: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/v1/client/status/request-reactivation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request: reactivateForm })
      });

      const result = await response.json();
      if (result.success) {
        setSnackbar({ open: true, message: 'Reactivation request submitted successfully', severity: 'success' });
        setReactivateDialogOpen(false);
        setReactivateForm({ reason: "" });
        loadUserStatus(); // Refresh status
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to submit request', severity: 'error' });
      }
    } catch (error) {
      console.error('Error submitting reactivation request:', error);
      setSnackbar({ open: true, message: 'Error submitting request', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle appeal submission
  const handleAppealSubmission = async () => {
    if (!appealForm.reason.trim() || appealForm.reason.length < 10) {
      setSnackbar({ open: true, message: 'Please provide a detailed reason (at least 10 characters)', severity: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/v1/client/appeals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appeal: appealForm })
      });

      const result = await response.json();
      if (result.success) {
        setSnackbar({ open: true, message: 'Appeal submitted successfully', severity: 'success' });
        setAppealDialogOpen(false);
        setAppealForm({ reason: "", priority: "normal" });
        loadUserStatus(); // Refresh status
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to submit appeal', severity: 'error' });
      }
    } catch (error) {
      console.error('Error submitting appeal:', error);
      setSnackbar({ open: true, message: 'Error submitting appeal', severity: 'error' });
    } finally {
      setSubmitting(false);
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
      case 'active': return <CheckCircle />;
      case 'inactive': return <Schedule />;
      case 'suspended': return <Error />;
      default: return <Info />;
    }
  };

  if (loading) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Header title="ACCOUNT STATUS" subtitle="Manage your water service status and requests" />
        <Button variant="outlined"
          sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400], whiteSpace: "nowrap" }}
          onClick={() => navigate("../service-requests")}>
          View Requests
        </Button>
      </Box>

      {/* Current Status Card */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <AccountCircle sx={{ fontSize: 40, color: colors.blueAccent[500] }} />
                <Box>
                  <Typography variant="h4" color={colors.grey[100]} fontWeight="bold">
                    {userStatus?.user?.display_name}
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Account: {userStatus?.user?.account_number}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2, borderColor: colors.grey[300] }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {getStatusIcon(userStatus?.user?.status)}
                    <Typography variant="h6" color={colors.grey[100]}>
                      Current Status:
                    </Typography>
                    <Chip
                      label={userStatus?.user?.status?.toUpperCase()}
                      sx={{
                        backgroundColor: getStatusColor(userStatus?.user?.status),
                        color: colors.grey[100],
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Last Status Change: {userStatus?.user?.last_status_change || 'No changes recorded'}
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Reason: {userStatus?.user?.status_change_reason}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h6" color={colors.grey[100]} gutterBottom>
                Pending Items
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Schedule sx={{ color: colors.blueAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Pending Requests"
                    secondary={`${userStatus?.pending_requests || 0} requests`}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Appeal sx={{ color: colors.redAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Pending Appeals"
                    secondary={`${userStatus?.pending_appeals || 0} appeals`}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: colors.primary[400] }}>
        <Typography variant="h6" color={colors.grey[100]} gutterBottom>
          Available Actions
        </Typography>
        <Grid container spacing={2}>
          {userStatus?.can_request_pause && (
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Pause />}
                onClick={() => setPauseDialogOpen(true)}
                sx={{
                  backgroundColor: colors.blueAccent[600],
                  '&:hover': { backgroundColor: colors.blueAccent[700] }
                }}
              >
                Request Service Pause
              </Button>
            </Grid>
          )}
          {userStatus?.user?.status === 'active' && (
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Schedule />}
                onClick={() => setInactivateDialogOpen(true)}
                sx={{
                  backgroundColor: colors.grey[600],
                  '&:hover': { backgroundColor: colors.grey[700] }
                }}
              >
                Request Account Inactivation
              </Button>
            </Grid>
          )}
          {userStatus?.can_request_reactivation && (
            <Grid item>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => setReactivateDialogOpen(true)}
                sx={{
                  backgroundColor: colors.greenAccent[600],
                  '&:hover': { backgroundColor: colors.greenAccent[700] }
                }}
              >
                Request Reactivation
              </Button>
            </Grid>
          )}
          {userStatus?.can_appeal_suspension && (
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Appeal />}
                onClick={() => setAppealDialogOpen(true)}
                sx={{
                  backgroundColor: colors.redAccent[600],
                  '&:hover': { backgroundColor: colors.redAccent[700] }
                }}
              >
                Appeal Suspension
              </Button>
            </Grid>
          )}
        </Grid>
        
        {!userStatus?.can_request_pause && !userStatus?.can_request_reactivation && !userStatus?.can_appeal_suspension && userStatus?.user?.status !== 'active' && (
          <MuiAlert severity="info" sx={{ mt: 2 }}>
            No actions available at this time. Your account status is {userStatus?.user?.status}.
          </MuiAlert>
        )}
      </Paper>

      {/* Pause Request Dialog */}
      <Dialog open={pauseDialogOpen} onClose={() => setPauseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Service Pause</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason for Pause"
            multiline
            rows={3}
            value={pauseForm.reason}
            onChange={(e) => setPauseForm({ ...pauseForm, reason: e.target.value })}
            margin="normal"
            placeholder="Please explain why you need to pause your service..."
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
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Start Date (Optional)"
                type="date"
                value={pauseForm.start_date}
                onChange={(e) => setPauseForm({ ...pauseForm, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
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
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="End Date (Optional)"
                type="date"
                value={pauseForm.end_date}
                onChange={(e) => setPauseForm({ ...pauseForm, end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
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
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPauseDialogOpen(false)}
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': { backgroundColor: '#b71c1c' },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePauseRequest} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inactivation Request Dialog */}
      <Dialog open={inactivateDialogOpen} onClose={() => setInactivateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Account Inactivation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason for Inactivation"
            multiline
            rows={3}
            value={inactivateForm.reason}
            onChange={(e) => setInactivateForm({ ...inactivateForm, reason: e.target.value })}
            margin="normal"
            placeholder="Please explain why you want to inactivate your account..."
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
          <MuiAlert severity="warning" sx={{ mt: 2 }}>
            Inactivating your account will temporarily suspend your water service. You can request reactivation later.
          </MuiAlert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setInactivateDialogOpen(false)}
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': { backgroundColor: '#b71c1c' },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleInactivationRequest} 
            variant="contained"
            disabled={submitting}
            sx={{
              backgroundColor: colors.grey[600],
              '&:hover': { backgroundColor: colors.grey[700] }
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reactivation Request Dialog */}
      <Dialog open={reactivateDialogOpen} onClose={() => setReactivateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Service Reactivation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason for Reactivation"
            multiline
            rows={3}
            value={reactivateForm.reason}
            onChange={(e) => setReactivateForm({ ...reactivateForm, reason: e.target.value })}
            margin="normal"
            placeholder="Please explain why you want to reactivate your service..."
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
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReactivateDialogOpen(false)}
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': { backgroundColor: '#b71c1c' },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReactivationRequest} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Appeal Dialog */}
      <Dialog open={appealDialogOpen} onClose={() => setAppealDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Appeal Suspension</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason for Appeal"
            multiline
            rows={4}
            value={appealForm.reason}
            onChange={(e) => setAppealForm({ ...appealForm, reason: e.target.value })}
            margin="normal"
            placeholder="Please provide a detailed explanation for your appeal (minimum 10 characters)..."
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
          <FormControl fullWidth margin="normal" sx={{
            '& .MuiInputLabel-root': { color: '#1976d2' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#1976d2', fontWeight: 'bold' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#e0e0e0' },
              '&:hover fieldset': { borderColor: '#1976d2' },
              '&.Mui-focused fieldset': { borderColor: '#1976d2' },
            },
          }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={appealForm.priority}
              onChange={(e) => setAppealForm({ ...appealForm, priority: e.target.value })}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setAppealDialogOpen(false)}
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': { backgroundColor: '#b71c1c' },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAppealSubmission} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Appeal'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      {snackbar.open && (
        <MuiAlert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
        >
          {snackbar.message}
        </MuiAlert>
      )}
    </Box>
  );
};

export default AccountStatus;