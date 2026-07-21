import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import { tokens } from "../../../theme";
import LocalDrinkIcon from "@mui/icons-material/LocalDrink";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import SpeedIcon from "@mui/icons-material/Speed";
import WaterIcon from "@mui/icons-material/Water";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { useNavigate } from "react-router-dom";

const ConnectionDetails = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch connection details from API
  useEffect(() => {
    const fetchConnectionDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
        const response = await fetch(`${BASE_URL}/connections/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          setConnection(result.data.connection);
        } else {
          setError(result.message || 'No connection found');
        }
      } catch (err) {
        console.error('Error fetching connection details:', err);
        setError('Failed to load connection details');
      } finally {
        setLoading(false);
      }
    };

    fetchConnectionDetails();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return colors.greenAccent[500];
      case 'pending':
        return colors.blueAccent[500];
      case 'suspended':
        return colors.redAccent[500];
      case 'inactive':
        return colors.grey[500];
      default:
        return colors.grey[500];
    }
  };

  // Get meter status color
  const getMeterStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'functioning':
        return colors.greenAccent[500];
      case 'faulty':
        return colors.redAccent[500];
      case 'needs_calibration':
        return colors.blueAccent[500];
      default:
        return colors.grey[500];
    }
  };

  // Format connection type
  const formatConnectionType = (type) => {
    if (!type) return 'N/A';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Format meter type
  const formatMeterType = (type) => {
    if (!type) return 'N/A';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: colors.blueAccent[500] }} />
      </Box>
    );
  }

  if (error || !connection) {
    return (
      <Box m="20px">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">
          Connection Details
        </Typography>
        <Button variant="outlined" startIcon={<ShowChartIcon />}
          sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
          onClick={() => navigate("../usage-overview")}>
          View Usage
        </Button>
      </Box>
        <Alert severity="info">
          {error || 'No connection found. Please contact support to set up your water connection.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="20px">
        Connection Details
      </Typography>

      <Grid container spacing={3}>
        {/* Connection Overview */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={3}>
                Connection Overview
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <LocalDrinkIcon sx={{ color: colors.blueAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Connection Type"
                    secondary={formatConnectionType(connection.connection_type)}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocationOnIcon sx={{ color: colors.blueAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Zone"
                    secondary={connection.zone || 'N/A'}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon sx={{ color: colors.blueAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Installation Date"
                    secondary={formatDate(connection.connection_date)}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon sx={{ color: getStatusColor(connection.connection_status) }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Status"
                    secondary={
                      <Chip
                        label={formatConnectionType(connection.connection_status)}
                        size="small"
                        sx={{ 
                          backgroundColor: getStatusColor(connection.connection_status),
                          color: colors.grey[100]
                        }}
                      />
                    }
                    primaryTypographyProps={{ color: colors.grey[100] }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Meter Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={3}>
                Meter Information
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SpeedIcon sx={{ color: colors.blueAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Meter Number"
                    secondary={connection.meter_number || 'N/A'}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocalDrinkIcon sx={{ color: colors.blueAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Meter Type"
                    secondary={formatMeterType(connection.meter_type)}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon sx={{ color: colors.blueAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Meter Installation Date"
                    secondary={formatDate(connection.meter_installation_date)}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon sx={{ color: getMeterStatusColor(connection.meter_status) }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Meter Status"
                    secondary={
                      <Chip
                        label={formatMeterType(connection.meter_status)}
                        size="small"
                        sx={{ 
                          backgroundColor: getMeterStatusColor(connection.meter_status),
                          color: colors.grey[100]
                        }}
                      />
                    }
                    primaryTypographyProps={{ color: colors.grey[100] }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={3}>
                Account Information
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText
                    primary="Account Number"
                    secondary={connection.account_number || 'N/A'}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300], fontWeight: 'bold' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Connection Number"
                    secondary={connection.connection_number || 'N/A'}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300], fontWeight: 'bold' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Technical Specifications */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={3}>
                Technical Specifications
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <WaterIcon sx={{ color: colors.blueAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Pipe Diameter"
                    secondary={connection.pipe_diameter ? `${connection.pipe_diameter} inches` : 'N/A'}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SpeedIcon sx={{ color: colors.blueAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Water Pressure"
                    secondary={connection.water_pressure ? `${connection.water_pressure} PSI` : 'N/A'}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon sx={{ color: colors.blueAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Supply Schedule"
                    secondary={connection.supply_schedule || 'N/A'}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WaterIcon sx={{ color: colors.blueAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Service Line Size"
                    secondary={connection.service_line_size || 'N/A'}
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Meter Readings */}
        {connection.recent_readings && connection.recent_readings.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Typography variant="h4" color={colors.grey[100]} mb={3}>
                  Recent Meter Readings
                </Typography>
                
                <List>
                  {connection.recent_readings.map((reading, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <SpeedIcon sx={{ color: colors.blueAccent[500] }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${reading.reading_value} m³`}
                        secondary={`${formatDate(reading.reading_date)} - ${reading.reading_type}`}
                        primaryTypographyProps={{ color: colors.grey[100], fontWeight: 'bold' }}
                        secondaryTypographyProps={{ color: colors.grey[300] }}
                      />
                      {reading.consumption && (
                        <Typography variant="body2" color={colors.greenAccent[500]}>
                          Consumption: {reading.consumption} m³
                        </Typography>
                      )}
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Installation Notes */}
        {connection.installation_notes && (
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Typography variant="h4" color={colors.grey[100]} mb={2}>
                  Installation Notes
                </Typography>
                <Typography variant="body2" color={colors.grey[300]}>
                  {connection.installation_notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ConnectionDetails;
