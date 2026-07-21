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
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Input,
  LinearProgress,
  Backdrop,
} from "@mui/material";
import { tokens } from "../../theme";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../hooks/useAuth";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";

const AdminProfile = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const { user, updateUser, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = user.token || localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.user) {
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

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  // Handle profile updates
  const handleSaveProfile = async () => {
    if (!user || !userProfile) return;
    
    setLoading(true);
    try {
      const token = user.token || localStorage.getItem('token');
      
      const avatarToSave = profileImage || editedProfile.avatar;
      console.log('=== ADMIN SAVE AVATAR DEBUG ===');
      console.log('profileImage:', profileImage);
      console.log('editedProfile.avatar:', editedProfile.avatar);
      console.log('avatarToSave:', avatarToSave);
      console.log('===============================');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/auth/me`, {
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
            alt_phone: editedProfile.alt_phone,
            landmark: editedProfile.landmark,
            communication_preference: editedProfile.communication_preference,
            // Institution-specific fields if applicable
            institution_name: editedProfile.institution_name,
            institution_type: editedProfile.institution_type,
            contact_person: editedProfile.contact_person,
            alt_contact: editedProfile.alt_contact,
            population_served: editedProfile.population_served
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.user) {
          console.log('=== ADMIN PROFILE SAVE DEBUG ===');
          console.log('Updated user data:', result.data.user);
          console.log('Avatar in response:', result.data.user.avatar);
          console.log('================================');
          
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

  // Avatar upload handlers
  const saveAvatarToDatabase = async (avatarData) => {
    if (!user || !userProfile) return false;
    
    try {
      setUploadLoading(true);
      setUploadProgress(30);
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const token = user.token || localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/auth/me`, {
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
          console.log('=== AVATAR SAVE SUCCESS ===');
          console.log('Updated user data:', result.data.user);
          console.log('Avatar in response:', result.data.user.avatar);
          console.log('===========================');
          
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

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return colors.redAccent[500];
      case 'admin':
        return colors.blueAccent[500];
      default:
        return colors.grey[500];
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <SupervisorAccountIcon sx={{ color: colors.redAccent[500] }} />;
      case 'admin':
        return <AdminPanelSettingsIcon sx={{ color: colors.blueAccent[500] }} />;
      default:
        return <PersonIcon />;
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
        <Typography variant="h4" color={colors.grey[100]} mb={1}>
          Please log in to view your profile.
        </Typography>
      </Box>
    );
  }

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" gutterBottom component="h1">
          Admin Profile
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
          {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </Box>

      <Grid container spacing={3} mt="20px">
        {/* Profile Picture Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  src={profileImage || userProfile.avatar}
                  sx={{
                    width: 120,
                    height: 120,
                    backgroundColor: getRoleColor(userProfile.role),
                    mb: 2,
                  }}
                  key={profileImage || userProfile.avatar || 'default'} // Force re-render when avatar changes
                >
                  {!profileImage && !userProfile.avatar && getRoleIcon(userProfile.role)}
                </Avatar>
                <Typography variant="h4" color={colors.grey[100]} mb={1} textAlign="center">
                  {userProfile.display_name || `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'User'}
                </Typography>
                <Typography variant="h6" color={getRoleColor(userProfile.role)} mb={1}>
                  {userProfile.role === 'super_admin' ? 'Super Administrator' : 
                   userProfile.role === 'admin' ? 'Administrator' : 'User'}
                </Typography>
                <Chip
                  label={userProfile.status?.toUpperCase() || 'ACTIVE'}
                  size="small"
                  sx={{
                    backgroundColor: userProfile.status === 'active' ? colors.greenAccent[500] : colors.redAccent[500],
                    color: colors.grey[900],
                    fontWeight: 'bold',
                    mb: 2
                  }}
                />
                <Typography variant="body2" color={colors.grey[300]} textAlign="center">
                  User ID: {userProfile.id}
                </Typography>
                <Typography variant="body2" color={colors.grey[300]} textAlign="center" mb={2}>
                  Account Type: {userProfile.account_type === 'household' ? 'Household' : 'Institution'}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setUploadDialogOpen(true)}
                  disabled={uploadLoading}
                  sx={{
                    borderColor: colors.blueAccent[500],
                    color: colors.blueAccent[500],
                    "&:hover": {
                      borderColor: colors.blueAccent[400],
                      backgroundColor: colors.blueAccent[500],
                      color: colors.grey[100],
                    },
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
                    onChange={(e) => isEditing && setEditedProfile({...editedProfile, first_name: e.target.value})}
                    variant="outlined"
                    disabled={!isEditing}
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
                    label="Last Name"
                    value={isEditing ? editedProfile.last_name || '' : userProfile.last_name || ''}
                    onChange={(e) => isEditing && setEditedProfile({...editedProfile, last_name: e.target.value})}
                    variant="outlined"
                    disabled={!isEditing}
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={isEditing ? editedProfile.email || '' : userProfile.email || ''}
                    onChange={(e) => isEditing && setEditedProfile({...editedProfile, email: e.target.value})}
                    variant="outlined"
                    disabled={!isEditing}
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
                    label="Role"
                    value={userProfile.role === 'super_admin' ? 'Super Administrator' : 
                           userProfile.role === 'admin' ? 'Administrator' : 'User'}
                    variant="outlined"
                    disabled
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: getRoleColor(userProfile.role),
                        "& fieldset": {
                          borderColor: getRoleColor(userProfile.role),
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
                    label="Account Status"
                    value={userProfile.status?.toUpperCase() || 'ACTIVE'}
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

              <Divider sx={{ my: 3, borderColor: colors.grey[300] }} />

              <Typography variant="h4" color={colors.grey[100]} mb={3}>
                Contact Details
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Alternative Phone"
                    value={isEditing ? editedProfile.alt_phone || '' : userProfile.alt_phone || ''}
                    onChange={(e) => isEditing && setEditedProfile({...editedProfile, alt_phone: e.target.value})}
                    variant="outlined"
                    disabled={!isEditing}
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
                    label="Communication Preference"
                    value={isEditing ? editedProfile.communication_preference || '' : userProfile.communication_preference || ''}
                    onChange={(e) => isEditing && setEditedProfile({...editedProfile, communication_preference: e.target.value})}
                    variant="outlined"
                    disabled={!isEditing}
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Landmark"
                    value={isEditing ? editedProfile.landmark || '' : userProfile.landmark || ''}
                    onChange={(e) => isEditing && setEditedProfile({...editedProfile, landmark: e.target.value})}
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
                      },
                      "& .MuiInputLabel-root": {
                        color: colors.grey[100],
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {/* Institution-specific fields */}
              {userProfile.account_type === 'institution' && (
                <>
                  <Divider sx={{ my: 3, borderColor: colors.grey[300] }} />
                  
                  <Typography variant="h4" color={colors.grey[100]} mb={3}>
                    Institution Details
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Institution Name"
                        value={isEditing ? editedProfile.institution_name || '' : userProfile.institution_name || ''}
                        onChange={(e) => isEditing && setEditedProfile({...editedProfile, institution_name: e.target.value})}
                        variant="outlined"
                        disabled={!isEditing}
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
                        label="Institution Type"
                        value={isEditing ? editedProfile.institution_type || '' : userProfile.institution_type || ''}
                        onChange={(e) => isEditing && setEditedProfile({...editedProfile, institution_type: e.target.value})}
                        variant="outlined"
                        disabled={!isEditing}
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
                        label="Contact Person"
                        value={isEditing ? editedProfile.contact_person || '' : userProfile.contact_person || ''}
                        onChange={(e) => isEditing && setEditedProfile({...editedProfile, contact_person: e.target.value})}
                        variant="outlined"
                        disabled={!isEditing}
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
                        label="Population Served"
                        value={isEditing ? editedProfile.population_served || '' : userProfile.population_served || ''}
                        onChange={(e) => isEditing && setEditedProfile({...editedProfile, population_served: parseInt(e.target.value) || 0})}
                        variant="outlined"
                        type="number"
                        disabled={!isEditing}
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
                  </Grid>
                </>
              )}

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
          
          {(profileImage || userProfile.avatar) && !uploadLoading && (
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
          {(profileImage || userProfile.avatar) && (
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

export default AdminProfile;