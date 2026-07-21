import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  History,
  Person,
  Phone,
  Email,
  Home,
  Security,
  Info,
  Warning,
  CheckCircle,
  Refresh,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { useAuth } from "../../../../../hooks/useAuth";
import useRealTimeUpdates from "../../../../../hooks/useRealTimeUpdates";
import Header from "../../../components/Header";

const ProfileHistory = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuth();

  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);

  // Real-time updates handler
  const handleAuditLogUpdate = (data) => {
    if (data.client_id === user?.id) {
      setHasNewUpdates(true);
      // Add the new audit log to the beginning of the list
      setAuditLogs(prev => [data.audit_log, ...prev]);
    }
  };

  // Set up real-time updates
  useRealTimeUpdates(null, handleAuditLogUpdate, user?.id);

  const loadAuditTrail = async () => {
    if (!user) {
      console.log('No user found, cannot load audit trail');
      return;
    }

    console.log('Loading audit trail for user:', user.id);

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const url = `${BASE_URL}/client/profile/audit_trail`;
      console.log('Fetching audit trail from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Audit trail response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Audit trail result:', result);
        
        if (result.success) {
          console.log('Setting audit logs:', result.data.audit_logs);
          setAuditLogs(result.data.audit_logs);
        } else {
          console.error('Failed to load audit trail:', result.message);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to load audit trail - Response:', errorText);
      }
    } catch (error) {
      console.error('Error loading audit trail:', error);
    } finally {
      setLoading(false);
      setHasNewUpdates(false);
    }
  };

  useEffect(() => {
    loadAuditTrail();
  }, [user]);

  const getSensitivityIcon = (level) => {
    switch (level) {
      case 'high': return <Security sx={{ color: colors.redAccent[500] }} />;
      case 'medium': return <Warning sx={{ color: colors.blueAccent[500] }} />;
      case 'low': return <Info sx={{ color: colors.greenAccent[500] }} />;
      default: return <CheckCircle sx={{ color: colors.grey[500] }} />;
    }
  };

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
        title="PROFILE HISTORY" 
        subtitle="View all changes made to your profile by administrators" 
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
              onClick={loadAuditTrail}
              startIcon={<Refresh />}
            >
              Refresh
            </Button>
          }
        >
          New profile changes detected. Click refresh to see the latest updates.
        </Alert>
      )}

      {/* Summary Card */}
      <Card sx={{ mb: 3, backgroundColor: colors.primary[400] }}>
        <CardContent>
          <Typography variant="h6" color={colors.grey[100]} gutterBottom>
            Profile Change Summary
          </Typography>
          <Typography variant="body2" color={colors.grey[300]}>
            Total Changes: {auditLogs.length} | 
            Recent Activity: {auditLogs.filter(log => {
              const logDate = new Date(log.created_at);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return logDate > weekAgo;
            }).length} changes in the last 7 days
          </Typography>
        </CardContent>
      </Card>

      {/* Audit Trail List */}
      <Paper sx={{ backgroundColor: colors.primary[400] }}>
        {auditLogs.length === 0 ? (
          <Box p={4} textAlign="center">
            <History sx={{ fontSize: 48, color: colors.grey[500], mb: 2 }} />
            <Typography variant="h6" color={colors.grey[300]} gutterBottom>
              No Profile Changes
            </Typography>
            <Typography variant="body2" color={colors.grey[400]}>
              Your profile hasn't been modified by administrators yet.
            </Typography>
          </Box>
        ) : (
          <List>
            {auditLogs.map((log, index) => (
              <React.Fragment key={log.id}>
                <ListItem 
                  button 
                  onClick={() => handleViewDetails(log)}
                  sx={{ 
                    '&:hover': { backgroundColor: colors.primary[500] },
                    py: 2
                  }}
                >
                  <ListItemIcon>
                    {getCategoryIcon(log.change_category)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" color={colors.grey[100]} fontWeight="bold">
                          {log.field_name}
                        </Typography>
                        <Chip
                          label={log.sensitivity_level}
                          size="small"
                          sx={{
                            backgroundColor: getSensitivityColor(log.sensitivity_level),
                            color: colors.grey[100],
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                          {log.change_description}
                        </Typography>
                        <Typography variant="caption" color={colors.grey[400]}>
                          {log.formatted_timestamp} by {log.modified_by} ({log.modified_by_role})
                        </Typography>
                        {log.reason && (
                          <Typography variant="caption" color={colors.grey[400]} display="block">
                            Reason: {log.reason}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Box display="flex" alignItems="center">
                    {getSensitivityIcon(log.sensitivity_level)}
                  </Box>
                </ListItem>
                {index < auditLogs.length - 1 && <Divider sx={{ borderColor: colors.grey[600] }} />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: colors.blueAccent[700], color: colors.grey[100] }}>
          Profile Change Details
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: colors.primary[400] }}>
          {selectedLog && (
            <Box>
              <Typography variant="h6" color={colors.grey[100]} gutterBottom>
                {selectedLog.field_name}
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                  Change Description:
                </Typography>
                <Typography variant="body1" color={colors.grey[100]}>
                  {selectedLog.change_description}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                  Modified By:
                </Typography>
                <Typography variant="body1" color={colors.grey[100]}>
                  {selectedLog.modified_by} ({selectedLog.modified_by_role})
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                  Date & Time:
                </Typography>
                <Typography variant="body1" color={colors.grey[100]}>
                  {selectedLog.formatted_timestamp}
                </Typography>
              </Box>

              {selectedLog.reason && (
                <Box mb={2}>
                  <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                    Reason:
                  </Typography>
                  <Typography variant="body1" color={colors.grey[100]}>
                    {selectedLog.reason}
                  </Typography>
                </Box>
              )}

              <Box mb={2}>
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
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                  Category:
                </Typography>
                <Typography variant="body1" color={colors.grey[100]}>
                  {selectedLog.change_category.replace('_', ' ').toUpperCase()}
                </Typography>
              </Box>
            </Box>
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

export default ProfileHistory;