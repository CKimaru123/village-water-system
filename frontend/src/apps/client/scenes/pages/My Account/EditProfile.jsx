import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  CircularProgress,
  Grid,
  Alert,
  Snackbar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { PhotoCamera, Delete, Save, Refresh } from "@mui/icons-material";
import { useAuth } from "../../../../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import useRealTimeUpdates from "../../../../../hooks/useRealTimeUpdates";

const EditProfile = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [hasExternalUpdates, setHasExternalUpdates] = useState(false);

  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    alt_phone: "",
    plot_number: "",
    household_size: 1,
    village: "",
    landmark: "",
    communication_preference: "sms",
    photo: null,
  });

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation functions (matching signup page - strict validation)
  const validateEmail = (email) => {
    if (!email) return true; // Email is optional
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    
    // Accept various Kenyan phone number formats - STRICT validation
    const validPatterns = [
      /^254[7]\d{8}$/,   // 254712345678 (exactly 12 digits)
      /^0[7]\d{8}$/,     // 0712345678 (exactly 10 digits)
      /^[7]\d{8}$/       // 712345678 (exactly 9 digits)
    ];
    
    return validPatterns.some(pattern => pattern.test(cleaned));
  };

  const validateName = (name) => {
    if (!name) return false;
    // STRICT: Only letters, spaces, hyphens, apostrophes - NO numbers or other symbols
    const re = /^[a-zA-Z\s'-]+$/;
    return re.test(name.trim()) && name.trim().length >= 2;
  };

  const validateNumber = (value) => {
    if (!value) return false;
    // STRICT: Only positive integers
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0 && /^\d+$/.test(value.toString());
  };

  const validatePlotNumber = (plotNumber) => {
    if (!plotNumber) return true; // Optional field
    // Allow alphanumeric plot numbers (e.g., "A123", "PLOT-456")
    const re = /^[a-zA-Z0-9\-\/\s]+$/;
    return re.test(plotNumber.trim()) && plotNumber.trim().length >= 1;
  };

  const validateVillage = (village) => {
    if (!village) return true; // Optional field
    // STRICT: Only letters, spaces, hyphens, apostrophes - NO numbers
    const re = /^[a-zA-Z\s'-]+$/;
    return re.test(village.trim()) && village.trim().length >= 2;
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'first_name':
      case 'last_name':
        return validateName(value);
      case 'phone':
        return validatePhone(value);
      case 'alt_phone':
        return value ? validatePhone(value) : true; // Optional
      case 'email':
        return validateEmail(value);
      case 'household_size':
        return validateNumber(value);
      case 'village':
        return validateVillage(value);
      case 'plot_number':
        return validatePlotNumber(value);
      case 'landmark':
        return true; // Optional field, any text allowed
      case 'communication_preference':
        return value ? ['sms', 'whatsapp', 'call', 'email'].includes(value) : false;
      default:
        return true;
    }
  };

  const getFieldError = (field, value) => {
    if (!validateField(field, value)) {
      switch (field) {
        case 'first_name':
          return !value ? 'First name is required' : 
                 value.length < 2 ? 'First name must be at least 2 characters' :
                 'First name must contain only letters, spaces, hyphens, and apostrophes';
        case 'last_name':
          return !value ? 'Last name is required' : 
                 value.length < 2 ? 'Last name must be at least 2 characters' :
                 'Last name must contain only letters, spaces, hyphens, and apostrophes';
        case 'phone':
          return 'Valid Kenyan phone number is required (e.g., 0729123456, +254729123456, or 729123456)';
        case 'alt_phone':
          return 'Valid alternative phone number format (e.g., 0729123456, +254729123456, or 729123456)';
        case 'email':
          return 'Invalid email format (e.g., user@example.com)';
        case 'household_size':
          return !value ? 'Household size is required' :
                 !/^\d+$/.test(value.toString()) ? 'Household size must contain only numbers' :
                 'Household size must be a positive number greater than 0';
        case 'village':
          return value && value.length < 2 ? 'Village name must be at least 2 characters' :
                 'Village name must contain only letters, spaces, hyphens, and apostrophes';
        case 'plot_number':
          return 'Plot number contains invalid characters';
        case 'communication_preference':
          return 'Please select a communication method';
        default:
          return 'Invalid value';
      }
    }
    return '';
  };

  const handleFieldChange = (field, value) => {
    console.log(`[EditProfile] Field changed: ${field}, Value: ${value}`);
    setProfile(prev => ({ ...prev, [field]: value }));
    
    // Mark field as touched when user starts typing
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field immediately as user types (real-time validation)
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      
      // ALWAYS validate as user types
      const error = getFieldError(field, value);
      console.log(`[EditProfile] Validation for ${field}: ${error || 'No error'}`);
      if (error) {
        newErrors[field] = error;
      }
      
      return newErrors;
    });
  };

  const handleFieldBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    const error = getFieldError(field, profile[field]);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Real-time updates handler
  const handleProfileUpdate = (data) => {
    if (data.client_id === user?.id) {
      setHasExternalUpdates(true);
      setSnackbar({
        open: true,
        message: `Your profile was updated by ${data.modified_by.name} (${data.modified_by.role}). Fields: ${data.updated_fields.join(', ')}`,
        severity: "info"
      });
    }
  };

  const handleAuditLogUpdate = (data) => {
    if (data.client_id === user?.id) {
      console.log('New audit log entry:', data.audit_log);
    }
  };

  // Set up real-time updates
  useRealTimeUpdates(handleProfileUpdate, handleAuditLogUpdate, user?.id);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!user) return;
    const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
    
    setLoading(true);
    try {
      const token = user.token || localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.user) {
          const userData = result.data.user;
          setUserProfile(userData);
          setProfile({
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            alt_phone: userData.alt_phone || "",
            plot_number: userData.plot_number || "",
            household_size: userData.household_size || 1,
            village: userData.village || "",
            landmark: userData.landmark || "",
            communication_preference: userData.communication_preference || "sms",
            photo: null,
          });
        }
      } else {
        console.error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh profile data when external updates are detected
  const refreshProfile = async () => {
    await fetchUserProfile();
    setHasExternalUpdates(false);
    setSnackbar({
      open: true,
      message: "Profile refreshed with latest changes",
      severity: "success"
    });
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfile({ ...profile, photo: URL.createObjectURL(file) });
    }
  };

  const handlePhotoRemove = () => {
    setProfile({ ...profile, photo: null });
  };

  const handleSave = async () => {
    if (!user || !userProfile) return;
    
    // Validate all fields before saving
    const validationErrors = {};
    Object.keys(profile).forEach(field => {
      if (field !== 'photo') { // Skip photo validation
        const error = getFieldError(field, profile[field]);
        if (error) {
          validationErrors[field] = error;
        }
      }
    });

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSnackbar({
        open: true,
        message: `Please fix ${Object.keys(validationErrors).length} validation error(s) before saving`,
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    try {
      const token = user.token || localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            alt_phone: profile.alt_phone,
            plot_number: profile.plot_number,
            household_size: profile.household_size,
            village: profile.village,
            landmark: profile.landmark,
            communication_preference: profile.communication_preference
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'Profile updated successfully!',
            severity: 'success'
          });
          navigate('/client/profile'); // Navigate back to profile view
        }
      } else {
        const errorData = await response.json();
        let errorMessage = 'Failed to update profile. Please try again.';
        
        if (errorData.errors) {
          // Handle backend validation errors
          setErrors(errorData.errors);
          errorMessage = 'Please fix the validation errors and try again.';
        }
        
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setSnackbar({
        open: true,
        message: 'Error updating profile. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userProfile) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !userProfile) {
    return (
      <Box m="20px">
        <Typography variant="h4" color={colors.grey[100]}>
          Please log in to edit your profile.
        </Typography>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Typography variant="h3" color={colors.grey[100]} fontWeight="bold" mb={3}>
        Edit Profile
      </Typography>

      {/* Validation Errors Alert */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Please fix the following validation errors:
          </Typography>
          <Box component="ul" sx={{ margin: 0, paddingLeft: 2 }}>
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>
                <Typography variant="body2">
                  {field.replace('_', ' ').toUpperCase()}: {error}
                </Typography>
              </li>
            ))}
          </Box>
        </Alert>
      )}

      {/* External Updates Alert */}
      {hasExternalUpdates && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={refreshProfile}
              startIcon={<Refresh />}
            >
              Refresh
            </Button>
          }
        >
          Your profile has been updated by an administrator. Click refresh to see the latest changes.
        </Alert>
      )}

      <Paper sx={{ p: 3, backgroundColor: colors.primary[400], maxWidth: 800 }}>
        {/* Profile Photo */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar
            src={profile.photo}
            alt="Profile Photo"
            sx={{ width: 80, height: 80 }}
          />
          <Box display="flex" flexDirection="column" gap={1}>
            <Button
              variant="contained"
              component="label"
              startIcon={<PhotoCamera />}
            >
              Upload
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={handlePhotoChange}
              />
            </Button>
            {profile.photo && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handlePhotoRemove}
              >
                Remove
              </Button>
            )}
          </Box>
        </Box>

        {/* Profile Info Form */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="First Name"
              variant="filled"
              value={profile.first_name}
              onChange={(e) => handleFieldChange('first_name', e.target.value)}
              onBlur={() => handleFieldBlur('first_name')}
              error={!!errors.first_name}
              helperText={errors.first_name}
              fullWidth
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                  color: colors.grey[100],
                },
                "& .MuiInputLabel-root": {
                  color: errors.first_name ? `${colors.redAccent[500]} !important` : `${colors.grey[100]} !important`,
                  fontWeight: errors.first_name ? 'bold' : 'normal',
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: errors.first_name ? `${colors.redAccent[500]} !important` : `${colors.blueAccent[300]} !important`,
                  fontWeight: "bold !important",
                },
                "& .MuiFilledInput-underline:before": {
                  borderBottomColor: colors.grey[300],
                },
                "& .MuiFilledInput-underline:after": {
                  borderBottomColor: errors.first_name ? colors.redAccent[500] : colors.blueAccent[300],
                  borderBottomWidth: 2,
                },
                "& .MuiFormHelperText-root": {
                  color: `${colors.redAccent[500]} !important`,
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Last Name"
              variant="filled"
              value={profile.last_name}
              onChange={(e) => handleFieldChange('last_name', e.target.value)}
              onBlur={() => handleFieldBlur('last_name')}
              error={!!errors.last_name}
              helperText={errors.last_name}
              fullWidth
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                  color: colors.grey[100],
                },
                "& .MuiInputLabel-root": {
                  color: errors.last_name ? colors.redAccent[500] : colors.grey[100],
                  fontWeight: errors.last_name ? 'bold' : 'normal',
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: errors.last_name ? colors.redAccent[500] : "#F0F0F0",
                  fontWeight: "bold",
                },
                "& .MuiFilledInput-underline:before": {
                  borderBottomColor: colors.grey[300],
                },
                "& .MuiFilledInput-underline:after": {
                  borderBottomColor: errors.last_name ? colors.redAccent[500] : "#F0F0F0",
                  borderBottomWidth: 2,
                },
                "& .MuiFormHelperText-root": {
                  color: colors.redAccent[500],
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email Address"
              variant="filled"
              value={profile.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
              error={!!errors.email}
              helperText={errors.email}
              fullWidth
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                  color: colors.grey[100],
                },
                "& .MuiInputLabel-root": {
                  color: errors.email ? colors.redAccent[500] : colors.grey[100],
                  fontWeight: errors.email ? 'bold' : 'normal',
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: errors.email ? colors.redAccent[500] : "#F0F0F0",
                  fontWeight: "bold",
                },
                "& .MuiFilledInput-underline:before": {
                  borderBottomColor: colors.grey[300],
                },
                "& .MuiFilledInput-underline:after": {
                  borderBottomColor: errors.email ? colors.redAccent[500] : "#F0F0F0",
                  borderBottomWidth: 2,
                },
                "& .MuiFormHelperText-root": {
                  color: colors.redAccent[500],
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone Number"
              variant="filled"
              value={profile.phone}
              disabled
              fullWidth
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                  color: colors.grey[100],
                },
                "& .MuiInputLabel-root": {
                  color: colors.grey[100],
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Alternative Phone"
              variant="filled"
              value={profile.alt_phone}
              onChange={(e) => handleFieldChange('alt_phone', e.target.value)}
              onBlur={() => handleFieldBlur('alt_phone')}
              error={!!errors.alt_phone}
              helperText={errors.alt_phone}
              fullWidth
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                  color: colors.grey[100],
                },
                "& .MuiInputLabel-root": {
                  color: errors.alt_phone ? colors.redAccent[500] : colors.grey[100],
                  fontWeight: errors.alt_phone ? 'bold' : 'normal',
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: errors.alt_phone ? colors.redAccent[500] : "#F0F0F0",
                  fontWeight: "bold",
                },
                "& .MuiFilledInput-underline:before": {
                  borderBottomColor: colors.grey[300],
                },
                "& .MuiFilledInput-underline:after": {
                  borderBottomColor: errors.alt_phone ? colors.redAccent[500] : "#F0F0F0",
                  borderBottomWidth: 2,
                },
                "& .MuiFormHelperText-root": {
                  color: colors.redAccent[500],
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Plot Number"
              variant="filled"
              value={profile.plot_number}
              onChange={(e) => handleFieldChange('plot_number', e.target.value)}
              onBlur={() => handleFieldBlur('plot_number')}
              error={!!errors.plot_number}
              helperText={errors.plot_number}
              fullWidth
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                  color: colors.grey[100],
                },
                "& .MuiInputLabel-root": {
                  color: errors.plot_number ? colors.redAccent[500] : colors.grey[100],
                  fontWeight: errors.plot_number ? 'bold' : 'normal',
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: errors.plot_number ? colors.redAccent[500] : "#F0F0F0",
                  fontWeight: "bold",
                },
                "& .MuiFilledInput-underline:before": {
                  borderBottomColor: colors.grey[300],
                },
                "& .MuiFilledInput-underline:after": {
                  borderBottomColor: errors.plot_number ? colors.redAccent[500] : "#F0F0F0",
                  borderBottomWidth: 2,
                },
                "& .MuiFormHelperText-root": {
                  color: colors.redAccent[500],
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Household Size"
              variant="filled"
              type="number"
              value={profile.household_size}
              onChange={(e) => handleFieldChange('household_size', parseInt(e.target.value) || 1)}
              onBlur={() => handleFieldBlur('household_size')}
              error={!!errors.household_size}
              helperText={errors.household_size}
              fullWidth
              inputProps={{ min: 1 }}
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                  color: colors.grey[100],
                },
                "& .MuiInputLabel-root": {
                  color: errors.household_size ? colors.redAccent[500] : colors.grey[100],
                  fontWeight: errors.household_size ? 'bold' : 'normal',
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: errors.household_size ? colors.redAccent[500] : "#F0F0F0",
                  fontWeight: "bold",
                },
                "& .MuiFilledInput-underline:before": {
                  borderBottomColor: colors.grey[300],
                },
                "& .MuiFilledInput-underline:after": {
                  borderBottomColor: errors.household_size ? colors.redAccent[500] : "#F0F0F0",
                  borderBottomWidth: 2,
                },
                "& .MuiFormHelperText-root": {
                  color: colors.redAccent[500],
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Village"
              variant="filled"
              value={profile.village}
              onChange={(e) => handleFieldChange('village', e.target.value)}
              onBlur={() => handleFieldBlur('village')}
              error={!!errors.village}
              helperText={errors.village}
              fullWidth
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                  color: colors.grey[100],
                },
                "& .MuiInputLabel-root": {
                  color: errors.village ? colors.redAccent[500] : colors.grey[100],
                  fontWeight: errors.village ? 'bold' : 'normal',
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: errors.village ? colors.redAccent[500] : "#F0F0F0",
                  fontWeight: "bold",
                },
                "& .MuiFilledInput-underline:before": {
                  borderBottomColor: colors.grey[300],
                },
                "& .MuiFilledInput-underline:after": {
                  borderBottomColor: errors.village ? colors.redAccent[500] : "#F0F0F0",
                  borderBottomWidth: 2,
                },
                "& .MuiFormHelperText-root": {
                  color: colors.redAccent[500],
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Landmark"
              variant="filled"
              value={profile.landmark}
              onChange={(e) => handleFieldChange('landmark', e.target.value)}
              onBlur={() => handleFieldBlur('landmark')}
              error={!!errors.landmark}
              helperText={errors.landmark}
              fullWidth
              multiline
              rows={2}
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                  color: colors.grey[100],
                },
                "& .MuiInputLabel-root": {
                  color: errors.landmark ? colors.redAccent[500] : colors.grey[100],
                  fontWeight: errors.landmark ? 'bold' : 'normal',
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: errors.landmark ? colors.redAccent[500] : "#F0F0F0",
                  fontWeight: "bold",
                },
                "& .MuiFilledInput-underline:before": {
                  borderBottomColor: colors.grey[300],
                },
                "& .MuiFilledInput-underline:after": {
                  borderBottomColor: errors.landmark ? colors.redAccent[500] : "#F0F0F0",
                  borderBottomWidth: 2,
                },
                "& .MuiFormHelperText-root": {
                  color: colors.redAccent[500],
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Communication Preference"
              variant="filled"
              select
              value={profile.communication_preference}
              onChange={(e) => handleFieldChange('communication_preference', e.target.value)}
              onBlur={() => handleFieldBlur('communication_preference')}
              error={!!errors.communication_preference}
              helperText={errors.communication_preference}
              fullWidth
              SelectProps={{
                native: true,
              }}
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                  color: colors.grey[100],
                },
                "& .MuiInputLabel-root": {
                  color: errors.communication_preference ? colors.redAccent[500] : colors.grey[100],
                  fontWeight: errors.communication_preference ? 'bold' : 'normal',
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: errors.communication_preference ? colors.redAccent[500] : "#F0F0F0",
                  fontWeight: "bold",
                },
                "& .MuiFilledInput-underline:before": {
                  borderBottomColor: colors.grey[300],
                },
                "& .MuiFilledInput-underline:after": {
                  borderBottomColor: errors.communication_preference ? colors.redAccent[500] : "#F0F0F0",
                  borderBottomWidth: 2,
                },
                "& .MuiFormHelperText-root": {
                  color: colors.redAccent[500],
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                },
              }}
            >
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
            </TextField>
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/client/profile')}
            sx={{
              borderColor: colors.grey[500],
              color: colors.grey[500],
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading || Object.keys(errors).length > 0}
            sx={{
              backgroundColor: colors.greenAccent[500],
              "&:hover": {
                backgroundColor: colors.greenAccent[600],
              },
              "&:disabled": {
                backgroundColor: colors.grey[600],
                color: colors.grey[400],
              },
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditProfile;
