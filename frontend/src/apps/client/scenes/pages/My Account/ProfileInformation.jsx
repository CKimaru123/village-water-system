import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Input,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { tokens } from "../../../theme";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../../../../../hooks/useAuth";

const ProfileInformation = () => {
  const colors = tokens("dark");
  const { user, updateUser, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return true; // Email is optional
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return false;
    
    // First check: Must contain only digits, spaces, hyphens, plus sign, and parentheses
    const allowedCharsPattern = /^[\d\s\-+()]+$/;
    if (!allowedCharsPattern.test(phone)) {
      return false;
    }
    
    const cleaned = phone.replace(/\D/g, '');
    const validPatterns = [
      /^254[7]\d{8}$/,   // 254712345678
      /^0[7]\d{8}$/,     // 0712345678
      /^[7]\d{8}$/       // 712345678
    ];
    return validPatterns.some(pattern => pattern.test(cleaned));
  };

  const validateName = (name) => {
    if (!name) return false;
    const re = /^[a-zA-Z\s'-]+$/;
    return re.test(name.trim()) && name.trim().length >= 2;
  };

  const validateNumber = (value) => {
    if (!value) return false;
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0 && /^\d+$/.test(value.toString());
  };
  
  const validateVillage = (value) => {
    if (!value) return true; // Optional
    const re = /^[a-zA-Z\s'-]+$/;
    return re.test(value.trim()) && value.trim().length >= 2;
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'first_name':
      case 'last_name':
      case 'contact_person':
        return validateName(value);
      case 'alt_phone':
      case 'alt_contact':
        return value ? validatePhone(value) : true;
      case 'email':
        return validateEmail(value);
      case 'household_size':
      case 'population_served':
        return value ? validateNumber(value) : true;
      case 'village':
        return validateVillage(value);
      case 'plot_number':
      case 'landmark':
      case 'storage_capacity':
      case 'institution_name':
      case 'institution_type':
        return true; // Optional or allow any text
      default:
        return true;
    }
  };

  const getFieldError = (field, value) => {
    if (!validateField(field, value)) {
      switch (field) {
        case 'first_name':
        case 'last_name':
        case 'contact_person':
          if (!value) return `${field.replace('_', ' ')} is required`;
          if (value.length < 2) return `${field.replace('_', ' ')} must be at least 2 characters`;
          if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Must contain only letters, spaces, hyphens, and apostrophes (no numbers)';
          return 'Invalid format';
        case 'alt_phone':
        case 'alt_contact':
          if (!value) return '';
          if (!/^[\d\s\-+()]+$/.test(value)) return 'Phone number must contain only digits (no letters)';
          const cleaned = value.replace(/\D/g, '');
          if (cleaned.length < 9) return 'Phone number is too short (minimum 9 digits)';
          if (cleaned.length > 12) return 'Phone number is too long (maximum 12 digits)';
          return 'Valid Kenyan phone format required (e.g., 0729123456)';
        case 'email':
          return 'Invalid email format';
        case 'household_size':
        case 'population_served':
          if (!/^\d+$/.test(value.toString())) return 'Must contain only numbers';
          return 'Must be a positive number greater than 0';
        case 'village':
          if (value && value.length < 2) return 'Village name must be at least 2 characters';
          return 'Village name must contain only letters (no numbers)';
        default:
          return 'Invalid value';
      }
    }
    return '';
  };

  const handleFieldChange = (field, value) => {
    console.log(`[ProfileInfo] Field changed: ${field}, Value: ${value}`);
    setEditedProfile({...editedProfile, [field]: value});
    setTouched({...touched, [field]: true});
    
    // Validate immediately
    const error = getFieldError(field, value);
    console.log(`[ProfileInfo] Validation for ${field}: ${error || 'No error'}`);
    setErrors({...errors, [field]: error});
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      console.log('=== PROFILE INFORMATION DEBUG ===');
      console.log('User from AuthContext:', user);
      console.log('==================================');
      
      setLoading(true);
      try {
        const token = user.token || localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('=== API RESPONSE DEBUG ===');
          console.log('Full API response:', result);
          console.log('User data from API:', result.data?.user);
          console.log('==========================');
          
          if (result.success && result.data.user) {
            console.log('=== CLIENT PROFILE DATA DEBUG ===');
            console.log('Full user data from API:', result.data.user);
            console.log('alt_phone:', result.data.user.alt_phone);
            console.log('plot_number:', result.data.user.plot_number);
            console.log('household_size:', result.data.user.household_size);
            console.log('village:', result.data.user.village);
            console.log('email:', result.data.user.email);
            console.log('landmark:', result.data.user.landmark);
            console.log('communication_preference:', result.data.user.communication_preference);
            console.log('=====================================');
            
            setUserProfile(result.data.user);
            setEditedProfile(result.data.user);
            // Set the profile image from the database
            setProfileImage(result.data.user.avatar);
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

    fetchUserProfile();
  }, [user]);

  // Ensure editedProfile is synced with userProfile when userProfile changes
  useEffect(() => {
    if (userProfile && !isEditing) {
      console.log('=== SYNCING EDITED PROFILE ===');
      console.log('Setting editedProfile to:', userProfile);
      setEditedProfile(userProfile);
    }
  }, [userProfile, isEditing]);

  // Handle profile updates
  const handleSaveProfile = async () => {
    if (!user || !userProfile) return;
    
    setLoading(true);
    try {
      const token = user.token || localStorage.getItem('token');
      
      const avatarToSave = profileImage || editedProfile.avatar;
      console.log('=== CLIENT SAVE AVATAR DEBUG ===');
      console.log('profileImage:', profileImage);
      console.log('editedProfile.avatar:', editedProfile.avatar);
      console.log('avatarToSave:', avatarToSave);
      console.log('===============================');
      
      const response = await fetch('http://localhost:3001/api/v1/auth/me', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: {
            first_name: editedProfile.first_name,
            last_name: editedProfile.last_name,
            email: editedProfile.email,
            landmark: editedProfile.landmark,
            communication_preference: editedProfile.communication_preference,
            // Household-specific fields
            ...(userProfile.account_type === 'household' && {
              alt_phone: editedProfile.alt_phone,
              plot_number: editedProfile.plot_number,
              household_size: editedProfile.household_size,
              village: editedProfile.village
            }),
            // Institution-specific fields
            ...(userProfile.account_type === 'institution' && {
              institution_name: editedProfile.institution_name,
              institution_type: editedProfile.institution_type,
              contact_person: editedProfile.contact_person,
              alt_contact: editedProfile.alt_contact,
              population_served: editedProfile.population_served,
              storage_capacity: editedProfile.storage_capacity
            })
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.user) {
          console.log('=== CLIENT PROFILE SAVE DEBUG ===');
          console.log('Updated user data:', result.data.user);
          console.log('Avatar in response:', result.data.user.avatar);
          console.log('=================================');
          
          setUserProfile(result.data.user);
          setEditedProfile(result.data.user);
          setIsEditing(false);
          // Update the user in AuthContext so sidebar reflects changes
          updateUser(result.data.user);
          alert('Profile updated successfully!');
        }
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Avatar upload handlers with immediate database save
  const saveAvatarToDatabase = async (avatarData) => {
    if (!user || !userProfile) return false;
    
    try {
      setUploadLoading(true);
      setUploadProgress(30);
      
      const token = user.token || localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/v1/auth/me', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: {
            avatar: avatarData
          }
        })
      });
      
      setUploadProgress(70);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.user) {
          console.log('=== CLIENT AVATAR SAVE SUCCESS ===');
          console.log('Updated user data:', result.data.user);
          console.log('Avatar in response:', result.data.user.avatar);
          console.log('==================================');
          
          setUploadProgress(90);
          
          // Update all states with new user data
          setUserProfile(result.data.user);
          setEditedProfile(result.data.user);
          setProfileImage(result.data.user.avatar);
          
          // Update AuthContext so sidebar reflects changes immediately
          updateUser(result.data.user);
          
          // Also refresh user data to ensure everything is in sync
          await refreshUserData();
          
          setUploadProgress(100);
          
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Avatar save error:', error);
      return false;
    } finally {
      setUploadLoading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadLoading(true);
      setUploadProgress(10);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        setUploadProgress(20);
        const avatarData = e.target.result;
        setProfileImage(avatarData);
        
        // Save to database immediately
        const success = await saveAvatarToDatabase(avatarData);
        if (success) {
          alert('Profile picture updated successfully!');
          setUploadDialogOpen(false);
        } else {
          alert('Failed to save profile picture. Please try again.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlUpload = async () => {
    if (imageUrl) {
      setUploadLoading(true);
      setUploadProgress(20);
      setProfileImage(imageUrl);
      
      // Save to database immediately
      const success = await saveAvatarToDatabase(imageUrl);
      if (success) {
        alert('Profile picture updated successfully!');
        setImageUrl("");
        setUploadDialogOpen(false);
      } else {
        alert('Failed to save profile picture. Please try again.');
      }
    }
  };

  const handleUploadDialogClose = () => {
    if (!uploadLoading) {
      setUploadDialogOpen(false);
      setUploadTab(0);
      setImageUrl("");
      setUploadProgress(0);
    }
  };

  const handleRemovePhoto = async () => {
    setUploadLoading(true);
    setUploadProgress(50);
    
    // Save null avatar to database immediately
    const success = await saveAvatarToDatabase(null);
    if (success) {
      alert('Profile picture removed successfully!');
      setUploadDialogOpen(false);
    } else {
      alert('Failed to remove profile picture. Please try again.');
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
          Please log in to view your profile.
        </Typography>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">
          My Profile
        </Typography>
        <Button
          variant="contained"
          startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
          onClick={() => {
            if (isEditing) {
              handleSaveProfile();
            } else {
              setIsEditing(true);
            }
          }}
          disabled={loading}
          sx={{
            backgroundColor: isEditing ? colors.greenAccent[500] : colors.blueAccent[500],
            "&:hover": {
              backgroundColor: isEditing ? colors.greenAccent[600] : colors.blueAccent[600],
            },
          }}
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </Box>

      <Grid container spacing={3} mt="20px">
        {/* Profile Picture Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  src={profileImage}
                  sx={{
                    width: 120,
                    height: 120,
                    backgroundColor: colors.blueAccent[500],
                    mb: 2,
                  }}
                  key={profileImage || 'default'} // Force re-render when avatar changes
                >
                  {!profileImage && <PersonIcon sx={{ fontSize: 60 }} />}
                </Avatar>
                <Typography variant="h4" color={colors.grey[100]} mb={1}>
                  {userProfile.display_name || `${userProfile.first_name} ${userProfile.last_name}`}
                </Typography>
                <Typography variant="h6" color={colors.greenAccent[500]}>
                  {userProfile.account_type === 'household' ? 'Household User' : 'Institution User'}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setUploadDialogOpen(true)}
                  disabled={uploadLoading}
                  sx={{
                    mt: 2,
                    borderColor: colors.blueAccent[500],
                    color: colors.blueAccent[500],
                    "&:disabled": {
                      borderColor: colors.grey[600],
                      color: colors.grey[600],
                    },
                  }}
                >
                  {uploadLoading ? 'Processing...' : 'Change Photo'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Information Form */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={3}>
                Personal Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={isEditing ? editedProfile.first_name || '' : userProfile.first_name || ''}
                    onChange={(e) => isEditing && handleFieldChange('first_name', e.target.value)}
                    variant="outlined"
                    disabled={!isEditing}
                    error={isEditing && !!errors.first_name}
                    helperText={isEditing && errors.first_name}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: colors.grey[100],
                        "& fieldset": {
                          borderColor: errors.first_name ? colors.redAccent[500] : colors.grey[300],
                        },
                        "&:hover fieldset": {
                          borderColor: errors.first_name ? colors.redAccent[500] : colors.blueAccent[300],
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: errors.first_name ? colors.redAccent[500] : colors.blueAccent[300],
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: errors.first_name ? `${colors.redAccent[500]} !important` : `${colors.grey[100]} !important`,
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: errors.first_name ? `${colors.redAccent[500]} !important` : `${colors.blueAccent[300]} !important`,
                        fontWeight: "bold !important",
                      },
                      "& .MuiFormHelperText-root": {
                        color: `${colors.redAccent[500]} !important`,
                        fontWeight: "bold",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={isEditing ? editedProfile.last_name || '' : userProfile.last_name || ''}
                    onChange={(e) => isEditing && handleFieldChange('last_name', e.target.value)}
                    variant="outlined"
                    disabled={!isEditing}
                    error={isEditing && !!errors.last_name}
                    helperText={isEditing && errors.last_name}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: colors.grey[100],
                        "& fieldset": {
                          borderColor: errors.last_name ? colors.redAccent[500] : colors.grey[300],
                        },
                        "&:hover fieldset": {
                          borderColor: errors.last_name ? colors.redAccent[500] : colors.blueAccent[300],
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: errors.last_name ? colors.redAccent[500] : colors.blueAccent[300],
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: errors.last_name ? `${colors.redAccent[500]} !important` : `${colors.grey[100]} !important`,
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: errors.last_name ? `${colors.redAccent[500]} !important` : `${colors.blueAccent[300]} !important`,
                        fontWeight: "bold !important",
                      },
                      "& .MuiFormHelperText-root": {
                        color: `${colors.redAccent[500]} !important`,
                        fontWeight: "bold",
                      },
                    }}
                  />
                </Grid>
                
                {/* Institution-specific fields */}
                {userProfile.account_type === 'institution' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Institution Name"
                        value={isEditing ? editedProfile.institution_name || '' : userProfile.institution_name || ''}
                        onChange={(e) => isEditing && handleFieldChange('institution_name', e.target.value)}
                        variant="outlined"
                        disabled={!isEditing}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            color: colors.grey[100],
                            "& fieldset": {
                              borderColor: colors.grey[300],
                            },
                            "&:hover fieldset": {
                              borderColor: colors.blueAccent[300],
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: colors.blueAccent[300],
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color: `${colors.grey[100]} !important`,
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: `${colors.blueAccent[300]} !important`,
                            fontWeight: "bold !important",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Institution Type"
                        value={isEditing ? editedProfile.institution_type || '' : userProfile.institution_type || ''}
                        onChange={(e) => isEditing && handleFieldChange('institution_type', e.target.value)}
                        variant="outlined"
                        disabled={!isEditing}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            color: colors.grey[100],
                            "& fieldset": {
                              borderColor: colors.grey[300],
                            },
                            "&:hover fieldset": {
                              borderColor: colors.blueAccent[300],
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: colors.blueAccent[300],
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color: `${colors.grey[100]} !important`,
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: `${colors.blueAccent[300]} !important`,
                            fontWeight: "bold !important",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Contact Person"
                        value={isEditing ? editedProfile.contact_person || '' : userProfile.contact_person || ''}
                        onChange={(e) => isEditing && handleFieldChange('contact_person', e.target.value)}
                        variant="outlined"
                        disabled={!isEditing}
                        error={isEditing && !!errors.contact_person}
                        helperText={isEditing && errors.contact_person}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            color: colors.grey[100],
                            "& fieldset": {
                              borderColor: errors.contact_person ? colors.redAccent[500] : colors.grey[300],
                            },
                            "&:hover fieldset": {
                              borderColor: errors.contact_person ? colors.redAccent[500] : colors.blueAccent[300],
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: errors.contact_person ? colors.redAccent[500] : colors.blueAccent[300],
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color: errors.contact_person ? `${colors.redAccent[500]} !important` : `${colors.grey[100]} !important`,
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: errors.contact_person ? `${colors.redAccent[500]} !important` : `${colors.blueAccent[300]} !important`,
                            fontWeight: "bold !important",
                          },
                          "& .MuiFormHelperText-root": {
                            color: `${colors.redAccent[500]} !important`,
                            fontWeight: "bold",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Alternative Contact"
                        value={isEditing ? editedProfile.alt_contact || '' : userProfile.alt_contact || ''}
                        onChange={(e) => isEditing && handleFieldChange('alt_contact', e.target.value)}
                        variant="outlined"
                        disabled={!isEditing}
                        error={isEditing && !!errors.alt_contact}
                        helperText={isEditing && errors.alt_contact}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            color: colors.grey[100],
                            "& fieldset": {
                              borderColor: errors.alt_contact ? colors.redAccent[500] : colors.grey[300],
                            },
                            "&:hover fieldset": {
                              borderColor: errors.alt_contact ? colors.redAccent[500] : colors.blueAccent[300],
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: errors.alt_contact ? colors.redAccent[500] : colors.blueAccent[300],
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color: errors.alt_contact ? `${colors.redAccent[500]} !important` : `${colors.grey[100]} !important`,
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: errors.alt_contact ? `${colors.redAccent[500]} !important` : `${colors.blueAccent[300]} !important`,
                            fontWeight: "bold !important",
                          },
                          "& .MuiFormHelperText-root": {
                            color: `${colors.redAccent[500]} !important`,
                            fontWeight: "bold",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Population Served"
                        value={isEditing ? editedProfile.population_served || '' : userProfile.population_served || ''}
                        onChange={(e) => isEditing && handleFieldChange('population_served', e.target.value)}
                        variant="outlined"
                        type="number"
                        disabled={!isEditing}
                        error={isEditing && !!errors.population_served}
                        helperText={isEditing && errors.population_served}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            color: colors.grey[100],
                            "& fieldset": {
                              borderColor: errors.population_served ? colors.redAccent[500] : colors.grey[300],
                            },
                            "&:hover fieldset": {
                              borderColor: errors.population_served ? colors.redAccent[500] : colors.blueAccent[300],
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: errors.population_served ? colors.redAccent[500] : colors.blueAccent[300],
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color: errors.population_served ? `${colors.redAccent[500]} !important` : `${colors.grey[100]} !important`,
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: errors.population_served ? `${colors.redAccent[500]} !important` : `${colors.blueAccent[300]} !important`,
                            fontWeight: "bold !important",
                          },
                          "& .MuiFormHelperText-root": {
                            color: `${colors.redAccent[500]} !important`,
                            fontWeight: "bold",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Storage Capacity"
                        value={isEditing ? editedProfile.storage_capacity || '' : userProfile.storage_capacity || ''}
                        onChange={(e) => isEditing && handleFieldChange('storage_capacity', e.target.value)}
                        variant="outlined"
                        disabled={!isEditing}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            color: colors.grey[100],
                            "& fieldset": {
                              borderColor: colors.grey[300],
                            },
                            "&:hover fieldset": {
                              borderColor: colors.blueAccent[300],
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: colors.blueAccent[300],
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color: `${colors.grey[100]} !important`,
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: `${colors.blueAccent[300]} !important`,
                            fontWeight: "bold !important",
                          },
                        }}
                      />
                    </Grid>
                  </>
                )}
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={userProfile.phone || ''}
                    variant="outlined"
                    disabled
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: colors.grey[100],
                        "& fieldset": {
                          borderColor: colors.grey[300],
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: colors.grey[100],
                      },
                    }}
                  />
                </Grid>
                
                {/* Alternative Phone - different field names for household vs institution */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={userProfile.account_type === 'household' ? 'Alternative Phone' : 'Alternative Contact'}
                    value={isEditing ? 
                      (userProfile.account_type === 'household' ? 
                        editedProfile.alt_phone || '' : 
                        editedProfile.alt_contact || '') : 
                      (userProfile.account_type === 'household' ? 
                        userProfile.alt_phone || '' : 
                        userProfile.alt_contact || '')}
                    onChange={(e) => isEditing && handleFieldChange(
                      userProfile.account_type === 'household' ? 'alt_phone' : 'alt_contact',
                      e.target.value
                    )}
                    variant="outlined"
                    disabled={!isEditing}
                    error={isEditing && !!(errors.alt_phone || errors.alt_contact)}
                    helperText={isEditing && (errors.alt_phone || errors.alt_contact)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: colors.grey[100],
                        "& fieldset": {
                          borderColor: (errors.alt_phone || errors.alt_contact) ? colors.redAccent[500] : colors.grey[300],
                        },
                        "&:hover fieldset": {
                          borderColor: (errors.alt_phone || errors.alt_contact) ? colors.redAccent[500] : colors.blueAccent[300],
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: (errors.alt_phone || errors.alt_contact) ? colors.redAccent[500] : colors.blueAccent[300],
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: (errors.alt_phone || errors.alt_contact) ? `${colors.redAccent[500]} !important` : `${colors.grey[100]} !important`,
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: (errors.alt_phone || errors.alt_contact) ? `${colors.redAccent[500]} !important` : `${colors.blueAccent[300]} !important`,
                        fontWeight: "bold !important",
                      },
                      "& .MuiFormHelperText-root": {
                        color: `${colors.redAccent[500]} !important`,
                        fontWeight: "bold",
                      },
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={isEditing ? editedProfile.email || '' : userProfile.email || ''}
                    onChange={(e) => isEditing && handleFieldChange('email', e.target.value)}
                    variant="outlined"
                    disabled={!isEditing}
                    error={isEditing && !!errors.email}
                    helperText={isEditing && errors.email}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: colors.grey[100],
                        "& fieldset": {
                          borderColor: errors.email ? colors.redAccent[500] : colors.grey[300],
                        },
                        "&:hover fieldset": {
                          borderColor: errors.email ? colors.redAccent[500] : colors.blueAccent[300],
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: errors.email ? colors.redAccent[500] : colors.blueAccent[300],
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: errors.email ? `${colors.redAccent[500]} !important` : `${colors.grey[100]} !important`,
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: errors.email ? `${colors.redAccent[500]} !important` : `${colors.blueAccent[300]} !important`,
                        fontWeight: "bold !important",
                      },
                      "& .MuiFormHelperText-root": {
                        color: `${colors.redAccent[500]} !important`,
                        fontWeight: "bold",
                      },
                    }}
                  />
                </Grid>
                
                {/* Household-specific fields */}
                {userProfile.account_type === 'household' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Plot Number"
                      value={isEditing ? editedProfile.plot_number || '' : userProfile.plot_number || ''}
                      onChange={(e) => isEditing && handleFieldChange('plot_number', e.target.value)}
                      variant="outlined"
                      disabled={!isEditing}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: colors.grey[100],
                          "& fieldset": {
                            borderColor: colors.grey[300],
                          },
                          "&:hover fieldset": {
                            borderColor: colors.blueAccent[300],
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: colors.blueAccent[300],
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: `${colors.grey[100]} !important`,
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: `${colors.blueAccent[300]} !important`,
                          fontWeight: "bold !important",
                        },
                      }}
                    />
                  </Grid>
                )}
                
                {userProfile.account_type === 'household' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Village"
                      value={isEditing ? editedProfile.village || '' : userProfile.village || ''}
                      onChange={(e) => isEditing && handleFieldChange('village', e.target.value)}
                      variant="outlined"
                      disabled={!isEditing}
                      error={isEditing && !!errors.village}
                      helperText={isEditing && errors.village}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: colors.grey[100],
                          "& fieldset": {
                            borderColor: errors.village ? colors.redAccent[500] : colors.grey[300],
                          },
                          "&:hover fieldset": {
                            borderColor: errors.village ? colors.redAccent[500] : colors.blueAccent[300],
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: errors.village ? colors.redAccent[500] : colors.blueAccent[300],
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: errors.village ? `${colors.redAccent[500]} !important` : `${colors.grey[100]} !important`,
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: errors.village ? `${colors.redAccent[500]} !important` : `${colors.blueAccent[300]} !important`,
                          fontWeight: "bold !important",
                        },
                        "& .MuiFormHelperText-root": {
                          color: `${colors.redAccent[500]} !important`,
                          fontWeight: "bold",
                        },
                      }}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Landmark"
                    value={isEditing ? editedProfile.landmark || '' : userProfile.landmark || ''}
                    onChange={(e) => isEditing && handleFieldChange('landmark', e.target.value)}
                    variant="outlined"
                    multiline
                    rows={2}
                    disabled={!isEditing}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: colors.grey[100],
                        "& fieldset": {
                          borderColor: colors.grey[300],
                        },
                        "&:hover fieldset": {
                          borderColor: colors.blueAccent[300],
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: colors.blueAccent[300],
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: `${colors.grey[100]} !important`,
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: `${colors.blueAccent[300]} !important`,
                        fontWeight: "bold !important",
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3, borderColor: colors.grey[300] }} />

              <Typography variant="h4" color={colors.grey[100]} mb={3}>
                Account Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Type"
                    value={userProfile.account_type === 'household' ? 'Household' : 'Institution'}
                    variant="outlined"
                    disabled
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: colors.grey[100],
                        "& fieldset": {
                          borderColor: colors.grey[300],
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: colors.grey[100],
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Household Size"
                    value={isEditing ? editedProfile.household_size || '' : userProfile.household_size || ''}
                    onChange={(e) => isEditing && handleFieldChange('household_size', e.target.value)}
                    variant="outlined"
                    type="number"
                    disabled={!isEditing || userProfile.account_type !== 'household'}
                    error={isEditing && !!errors.household_size}
                    helperText={isEditing && errors.household_size}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: colors.grey[100],
                        "& fieldset": {
                          borderColor: errors.household_size ? colors.redAccent[500] : colors.grey[300],
                        },
                        "&:hover fieldset": {
                          borderColor: errors.household_size ? colors.redAccent[500] : colors.blueAccent[300],
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: errors.household_size ? colors.redAccent[500] : colors.blueAccent[300],
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: errors.household_size ? `${colors.redAccent[500]} !important` : `${colors.grey[100]} !important`,
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: errors.household_size ? `${colors.redAccent[500]} !important` : `${colors.blueAccent[300]} !important`,
                        fontWeight: "bold !important",
                      },
                      "& .MuiFormHelperText-root": {
                        color: `${colors.redAccent[500]} !important`,
                        fontWeight: "bold",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Communication Preference"
                    value={isEditing ? editedProfile.communication_preference || '' : userProfile.communication_preference || ''}
                    onChange={(e) => isEditing && handleFieldChange('communication_preference', e.target.value)}
                    variant="outlined"
                    disabled={!isEditing}
                    select
                    SelectProps={{ native: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: colors.grey[100],
                        "& fieldset": {
                          borderColor: colors.grey[300],
                        },
                        "&:hover fieldset": {
                          borderColor: colors.blueAccent[300],
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: colors.blueAccent[300],
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: `${colors.grey[100]} !important`,
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: `${colors.blueAccent[300]} !important`,
                        fontWeight: "bold !important",
                      },
                    }}
                  >
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Status"
                    value={userProfile.status || 'Active'}
                    variant="outlined"
                    disabled
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: userProfile.status === 'active' ? colors.greenAccent[500] : colors.redAccent[500],
                        "& fieldset": {
                          borderColor: userProfile.status === 'active' ? colors.greenAccent[500] : colors.redAccent[500],
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: colors.grey[100],
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {isEditing && (
                <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedProfile(userProfile);
                    }}
                    sx={{
                      borderColor: colors.grey[500],
                      color: colors.grey[500],
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={loading}
                    sx={{
                      backgroundColor: colors.greenAccent[500],
                      "&:hover": {
                        backgroundColor: colors.greenAccent[600],
                      },
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Photo Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleUploadDialogClose}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: colors.primary[400],
            color: colors.grey[100],
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Upload Profile Photo</Typography>
            <IconButton onClick={handleUploadDialogClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Loading Progress Bar */}
          {uploadLoading && (
            <Box mb={3}>
              <Box display="flex" alignItems="center" mb={1}>
                <CircularProgress size={20} sx={{ mr: 1, color: colors.greenAccent[500] }} />
                <Typography variant="body2" color={colors.greenAccent[500]}>
                  Processing your image... Please wait
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{
                  backgroundColor: colors.grey[700],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: colors.greenAccent[500],
                  },
                }}
              />
              <Typography variant="caption" color={colors.grey[300]} mt={0.5}>
                {uploadProgress}% complete
              </Typography>
            </Box>
          )}
          
          {profileImage && !uploadLoading && (
            <Box mb={2} display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color={colors.greenAccent[500]}>
                ✓ Current profile photo is set
              </Typography>
            </Box>
          )}
          
          <Tabs
            value={uploadTab}
            onChange={(e, newValue) => !uploadLoading && setUploadTab(newValue)}
            sx={{ mb: 2 }}
            disabled={uploadLoading}
          >
            <Tab
              icon={<PhotoCameraIcon />}
              label="Device"
              sx={{ color: colors.grey[100] }}
              disabled={uploadLoading}
            />
            <Tab
              icon={<CloudUploadIcon />}
              label="Cloud"
              sx={{ color: colors.grey[100] }}
              disabled={uploadLoading}
            />
            <Tab
              icon={<LinkIcon />}
              label="URL"
              sx={{ color: colors.grey[100] }}
              disabled={uploadLoading}
            />
          </Tabs>

          {uploadTab === 0 && (
            <Box>
              <Typography variant="h6" mb={2}>
                Upload from Device
              </Typography>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                sx={{ color: colors.grey[100] }}
                disabled={uploadLoading}
              />
              {uploadLoading && (
                <Typography variant="body2" color={colors.grey[300]} mt={1}>
                  Reading file and uploading to server...
                </Typography>
              )}
            </Box>
          )}

          {uploadTab === 1 && (
            <Box>
              <Typography variant="h6" mb={2}>
                Upload from Cloud Storage
              </Typography>
              <Typography color={colors.grey[300]} mb={2}>
                Cloud upload functionality would be integrated with services like Google Drive, Dropbox, etc.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                sx={{
                  borderColor: colors.blueAccent[500],
                  color: colors.blueAccent[500],
                }}
              >
                Connect Cloud Storage
              </Button>
            </Box>
          )}

          {uploadTab === 2 && (
            <Box>
              <Typography variant="h6" mb={2}>
                Upload from URL
              </Typography>
              <TextField
                fullWidth
                label="Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={uploadLoading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: colors.grey[100],
                    "& fieldset": {
                      borderColor: colors.grey[300],
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: colors.grey[100],
                  },
                }}
              />
              {uploadLoading && (
                <Typography variant="body2" color={colors.grey[300]} mt={1}>
                  Uploading image from URL to server...
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleUploadDialogClose}
            sx={{ color: colors.grey[100] }}
            disabled={uploadLoading}
          >
            {uploadLoading ? 'Processing...' : 'Cancel'}
          </Button>
          {profileImage && (
            <Button
              onClick={handleRemovePhoto}
              variant="outlined"
              startIcon={uploadLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
              disabled={uploadLoading}
              sx={{
                borderColor: colors.redAccent[500],
                color: colors.redAccent[500],
                "&:hover": {
                  borderColor: colors.redAccent[600],
                  backgroundColor: colors.redAccent[500],
                  color: colors.grey[100],
                },
                "&:disabled": {
                  borderColor: colors.grey[600],
                  color: colors.grey[600],
                },
              }}
            >
              {uploadLoading ? 'Removing...' : 'Remove Photo'}
            </Button>
          )}
          {uploadTab === 2 && (
            <Button
              onClick={handleUrlUpload}
              variant="contained"
              startIcon={uploadLoading ? <CircularProgress size={16} /> : null}
              disabled={uploadLoading || !imageUrl}
              sx={{
                backgroundColor: colors.blueAccent[500],
                "&:hover": {
                  backgroundColor: colors.blueAccent[600],
                },
                "&:disabled": {
                  backgroundColor: colors.grey[600],
                },
              }}
            >
              {uploadLoading ? 'Uploading...' : 'Upload'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfileInformation;
