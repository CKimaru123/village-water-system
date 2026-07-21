import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Menu,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SuperAdminIcon,
} from '@mui/icons-material';

interface User {
  id: number;
  phone: string;
  email?: string;
  full_name: string;
  display_name: string;
  account_type: 'household' | 'institution';
  role: 'client' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'suspended';
  communication_preference: string;
  created_at: string;
  updated_at: string;
  formatted_updated_at: string;
  // Additional fields for editing
  first_name?: string;
  last_name?: string;
  institution_name?: string;
  contact_person?: string;
  alt_phone?: string;
  plot_number?: string;
  household_size?: number;
  village?: string;
  landmark?: string;
  institution_type?: string;
  population_served?: number;
  alt_contact?: string;
}

interface Stats {
  total_users: number;
  clients: number;
  admins: number;
  super_admins: number;
  active: number;
  inactive: number;
  suspended: number;
}

const AdminManagement: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    phone: '',
    email: '',
    password: '',
    password_confirmation: '',
    first_name: '',
    last_name: '',
    account_type: 'household' as 'household' | 'institution',
    role: 'client' as 'client' | 'admin',
    communication_preference: 'sms',
    alt_phone: '',
    plot_number: '',
    household_size: 1,
    village: '',
    institution_name: '',
    institution_type: 'school',
    contact_person: '',
    alt_contact: '',
    population_served: 0,
    landmark: ''
  });
  const [createUserErrors, setCreateUserErrors] = useState<{[key: string]: string}>({});
  const [creatingUser, setCreatingUser] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Load users and stats
  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = user?.token || localStorage.getItem('token');
      
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/admin_management/users?${params}`, {
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
        alert('Failed to load users: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error loading users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers();
    }
  }, [isSuperAdmin, currentPage, searchTerm, roleFilter, statusFilter]);

  // Handle edit user
  const handleEditUser = async (user: User) => {
    try {
      // Fetch detailed user information
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/admin_management/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setEditUserForm(result.data.user);
        setEditUserDialogOpen(true);
      } else {
        alert('Failed to load user details: ' + result.message);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      alert('Error loading user details. Please try again.');
    }
    setActionMenuAnchor(null);
  };

  // Handle save user changes
  const handleSaveUser = async () => {
    if (!editUserForm) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/admin_management/users/${editUserForm.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user: editUserForm })
      });
      
      const result = await response.json();
      if (result.success) {
        setConfirmationDialogOpen(false);
        setEditUserDialogOpen(false);
        setEditUserForm(null);
        alert('User updated successfully!');
        loadUsers(); // Refresh the list
      } else {
        const errorMessage = result.errors && result.errors.length > 0 
          ? 'Failed to update user: ' + result.errors.join(', ')
          : 'Failed to update user: ' + result.message;
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle proceed to confirmation
  const handleProceedToConfirmation = () => {
    setEditUserDialogOpen(false);
    setConfirmationDialogOpen(true);
  };

  // Handle cancel confirmation (back to edit)
  const handleCancelConfirmation = () => {
    setConfirmationDialogOpen(false);
    setEditUserDialogOpen(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditUserDialogOpen(false);
    setEditUserForm(null);
  };

  // Validation functions for create user
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    const validPatterns = [
      /^254[7]\d{8}$/,   // 254712345678
      /^0[7]\d{8}$/,     // 0712345678
      /^[7]\d{8}$/       // 712345678
    ];
    return validPatterns.some(pattern => pattern.test(cleaned));
  };

  const validatePassword = (password: string): boolean => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  };

  const validateName = (name: string): boolean => {
    const re = /^[a-zA-Z\s'-]+$/;
    return re.test(name.trim()) && name.trim().length >= 2;
  };

  const validateCreateUserForm = (): {[key: string]: string} => {
    const errors: {[key: string]: string} = {};

    // Common validations
    if (!newUserForm.phone || !validatePhone(newUserForm.phone)) {
      errors.phone = "Valid Kenyan phone number is required (e.g., 0729123456, +254729123456, or 729123456).";
    }
    if (newUserForm.email && !validateEmail(newUserForm.email)) {
      errors.email = "Invalid email format.";
    }
    if (!newUserForm.password || !validatePassword(newUserForm.password)) {
      errors.password = "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.";
    }
    if (newUserForm.password_confirmation !== newUserForm.password) {
      errors.password_confirmation = "Passwords do not match.";
    }

    // Role-specific validations
    if (newUserForm.role === 'client') {
      // Client-specific validations
      if (newUserForm.account_type === 'household') {
        if (!newUserForm.first_name || !validateName(newUserForm.first_name)) {
          errors.first_name = "First name must contain only letters (min 2 chars).";
        }
        if (!newUserForm.last_name || !validateName(newUserForm.last_name)) {
          errors.last_name = "Last name must contain only letters (min 2 chars).";
        }
        if (!newUserForm.alt_phone || !validatePhone(newUserForm.alt_phone)) {
          errors.alt_phone = "Valid alternative phone is required.";
        }
        if (!newUserForm.plot_number?.trim()) {
          errors.plot_number = "Plot number is required.";
        }
        if (!newUserForm.household_size || newUserForm.household_size <= 0) {
          errors.household_size = "Valid household size (>0) is required.";
        }
        if (!newUserForm.village?.trim()) {
          errors.village = "Village/location is required.";
        }
      } else if (newUserForm.account_type === 'institution') {
        if (!newUserForm.institution_name?.trim()) {
          errors.institution_name = "Institution name is required.";
        }
        if (!newUserForm.institution_type?.trim()) {
          errors.institution_type = "Institution type is required.";
        }
        if (!newUserForm.contact_person || !validateName(newUserForm.contact_person)) {
          errors.contact_person = "Contact person name must contain only letters (min 2 chars).";
        }
        if (newUserForm.alt_contact && !validatePhone(newUserForm.alt_contact)) {
          errors.alt_contact = "Invalid alternative contact phone.";
        }
        if (newUserForm.population_served && newUserForm.population_served <= 0) {
          errors.population_served = "Valid population served (>0) is required.";
        }
      }
    } else if (newUserForm.role === 'admin') {
      // Admin only needs basic info
      if (!newUserForm.first_name || !validateName(newUserForm.first_name)) {
        errors.first_name = "First name must contain only letters (min 2 chars).";
      }
      if (!newUserForm.last_name || !validateName(newUserForm.last_name)) {
        errors.last_name = "Last name must contain only letters (min 2 chars).";
      }
    }

    return errors;
  };

  // Handle create user form changes
  const handleCreateUserChange = (field: string, value: any) => {
    setNewUserForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (createUserErrors[field]) {
      setCreateUserErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle create user submission
  const handleCreateUser = async () => {
    const errors = validateCreateUserForm();
    setCreateUserErrors(errors);

    if (Object.keys(errors).length === 0) {
      setCreatingUser(true);
      try {
        const token = localStorage.getItem('token');
        const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
        const response = await fetch(`${BASE_URL}/admin_management/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user: newUserForm })
        });
        
        const result = await response.json();
        if (result.success) {
          alert('User created successfully!');
          setCreateUserDialogOpen(false);
          // Reset form
          setNewUserForm({
            phone: '',
            email: '',
            password: '',
            password_confirmation: '',
            first_name: '',
            last_name: '',
            account_type: 'household',
            role: 'client',
            communication_preference: 'sms',
            alt_phone: '',
            plot_number: '',
            household_size: 1,
            village: '',
            institution_name: '',
            institution_type: 'school',
            contact_person: '',
            alt_contact: '',
            population_served: 0,
            landmark: ''
          });
          setCreateUserErrors({});
          loadUsers(); // Refresh the list
        } else {
          const errorMessage = result.errors && result.errors.length > 0 
            ? 'Failed to create user: ' + result.errors.join(', ')
            : 'Failed to create user: ' + result.message;
          alert(errorMessage);
        }
      } catch (error) {
        console.error('Error creating user:', error);
        alert('Error creating user. Please try again.');
      } finally {
        setCreatingUser(false);
      }
    }
  };

  // Handle cancel create user
  const handleCancelCreateUser = () => {
    setCreateUserDialogOpen(false);
    setCreateUserErrors({});
    // Reset form
    setNewUserForm({
      phone: '',
      email: '',
      password: '',
      password_confirmation: '',
      first_name: '',
      last_name: '',
      account_type: 'household',
      role: 'client',
      communication_preference: 'sms',
      alt_phone: '',
      plot_number: '',
      household_size: 1,
      village: '',
      institution_name: '',
      institution_type: 'school',
      contact_person: '',
      alt_contact: '',
      population_served: 0,
      landmark: ''
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <SuperAdminIcon />;
      case 'admin': return <AdminIcon />;
      default: return <PeopleIcon />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'error';
      case 'admin': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  if (!isSuperAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Access denied. Super admin privileges required to access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#2c3e50' }}>
          Admin Management
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Manage users, admins, and system permissions
        </Typography>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <PeopleIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.total_users}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Users</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <AdminIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.admins}</Typography>
                    <Typography variant="body2" color="text.secondary">Admins</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <SuperAdminIcon color="error" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.super_admins}</Typography>
                    <Typography variant="body2" color="text.secondary">Super Admins</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.active}</Typography>
                    <Typography variant="body2" color="text.secondary">Active Users</Typography>
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
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            label="Role"
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="client">Client</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="super_admin">Super Admin</MenuItem>
          </Select>
        </FormControl>

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
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateUserDialogOpen(true)}
          sx={{ ml: 'auto' }}
        >
          Create User
        </Button>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadUsers}
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
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Account Type</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No users found</TableCell>
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
                        ID: {user.id}
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
                    <Chip
                      icon={getRoleIcon(user.role)}
                      label={user.role.replace('_', ' ').toUpperCase()}
                      color={getRoleColor(user.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status.toUpperCase()}
                      color={getStatusColor(user.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {user.account_type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(user.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => {
                        setSelectedUser(user);
                        setActionMenuAnchor(e.currentTarget);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
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

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
      >
        <MenuItemComponent onClick={() => selectedUser && handleEditUser(selectedUser)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItemComponent>
        <MenuItemComponent onClick={() => setActionMenuAnchor(null)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItemComponent>
      </Menu>

      {/* Create User Dialog - Placeholder */}
      <Dialog open={createUserDialogOpen} onClose={() => setCreateUserDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ py: 2 }}>
            User creation functionality will be implemented here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCreateUserDialogOpen(false)}
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': {
                backgroundColor: '#b71c1c',
              },
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={() => setCreateUserDialogOpen(false)}>Create User</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onClose={handleCancelEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editUserForm && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={editUserForm.phone || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  placeholder="+254712345678"
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: '#1976d2',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#1976d2',
                      fontWeight: 'bold',
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editUserForm.email || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: '#1976d2',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#1976d2',
                      fontWeight: 'bold',
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editUserForm.first_name || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, first_name: e.target.value })}
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: '#1976d2',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#1976d2',
                      fontWeight: 'bold',
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editUserForm.last_name || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, last_name: e.target.value })}
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: '#1976d2',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#1976d2',
                      fontWeight: 'bold',
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Institution Name"
                  value={editUserForm.institution_name || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, institution_name: e.target.value })}
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: '#1976d2',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#1976d2',
                      fontWeight: 'bold',
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={editUserForm.contact_person || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, contact_person: e.target.value })}
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: '#1976d2',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#1976d2',
                      fontWeight: 'bold',
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{
                  '& .MuiInputLabel-root': {
                    color: '#1976d2',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1976d2',
                    fontWeight: 'bold',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                }}>
                  <InputLabel>Account Type</InputLabel>
                  <Select
                    value={editUserForm.account_type || 'household'}
                    onChange={(e) => setEditUserForm({ ...editUserForm, account_type: e.target.value as 'household' | 'institution' })}
                    label="Account Type"
                  >
                    <MenuItem value="household">Household</MenuItem>
                    <MenuItem value="institution">Institution</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{
                  '& .MuiInputLabel-root': {
                    color: '#1976d2',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1976d2',
                    fontWeight: 'bold',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={editUserForm.role || 'client'}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as 'client' | 'admin' | 'super_admin' })}
                    label="Role"
                  >
                    <MenuItem value="client">Client</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="super_admin">Super Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{
                  '& .MuiInputLabel-root': {
                    color: '#1976d2',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1976d2',
                    fontWeight: 'bold',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editUserForm.status || 'active'}
                    onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value as 'active' | 'inactive' | 'suspended' })}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{
                  '& .MuiInputLabel-root': {
                    color: '#1976d2',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1976d2',
                    fontWeight: 'bold',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                }}>
                  <InputLabel>Communication Preference</InputLabel>
                  <Select
                    value={editUserForm.communication_preference || 'sms'}
                    onChange={(e) => setEditUserForm({ ...editUserForm, communication_preference: e.target.value })}
                    label="Communication Preference"
                  >
                    <MenuItem value="sms">SMS</MenuItem>
                    <MenuItem value="whatsapp">WhatsApp</MenuItem>
                    <MenuItem value="call">Call</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {editUserForm.account_type === 'household' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Alternative Phone"
                      value={editUserForm.alt_phone || ''}
                      onChange={(e) => setEditUserForm({ ...editUserForm, alt_phone: e.target.value })}
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: '#1976d2',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#1976d2',
                          fontWeight: 'bold',
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#e0e0e0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Plot Number"
                      value={editUserForm.plot_number || ''}
                      onChange={(e) => setEditUserForm({ ...editUserForm, plot_number: e.target.value })}
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: '#1976d2',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#1976d2',
                          fontWeight: 'bold',
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#e0e0e0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Household Size"
                      type="number"
                      value={editUserForm.household_size || 1}
                      onChange={(e) => setEditUserForm({ ...editUserForm, household_size: parseInt(e.target.value) || 1 })}
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: '#1976d2',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#1976d2',
                          fontWeight: 'bold',
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#e0e0e0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Village"
                      value={editUserForm.village || ''}
                      onChange={(e) => setEditUserForm({ ...editUserForm, village: e.target.value })}
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: '#1976d2',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#1976d2',
                          fontWeight: 'bold',
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#e0e0e0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                          },
                        },
                      }}
                    />
                  </Grid>
                </>
              )}
              {editUserForm.account_type === 'institution' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{
                      '& .MuiInputLabel-root': {
                        color: '#1976d2',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#1976d2',
                        fontWeight: 'bold',
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#1976d2',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1976d2',
                        },
                      },
                    }}>
                      <InputLabel>Institution Type</InputLabel>
                      <Select
                        value={editUserForm.institution_type || 'other'}
                        onChange={(e) => setEditUserForm({ ...editUserForm, institution_type: e.target.value })}
                        label="Institution Type"
                      >
                        <MenuItem value="school">School</MenuItem>
                        <MenuItem value="dispensary">Dispensary</MenuItem>
                        <MenuItem value="church">Church</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Population Served"
                      type="number"
                      value={editUserForm.population_served || ''}
                      onChange={(e) => setEditUserForm({ ...editUserForm, population_served: parseInt(e.target.value) || 0 })}
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: '#1976d2',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#1976d2',
                          fontWeight: 'bold',
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#e0e0e0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Alternative Contact"
                      value={editUserForm.alt_contact || ''}
                      onChange={(e) => setEditUserForm({ ...editUserForm, alt_contact: e.target.value })}
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: '#1976d2',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#1976d2',
                          fontWeight: 'bold',
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#e0e0e0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                          },
                        },
                      }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelEdit}
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': {
                backgroundColor: '#b71c1c',
              },
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleProceedToConfirmation}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialogOpen} onClose={handleCancelConfirmation} maxWidth="md" fullWidth>
        <DialogTitle>Confirm User Changes</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Please review the user details before saving:
          </Typography>
          {editUserForm && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Phone Number:</Typography>
                <Typography variant="body1" fontWeight="bold">{editUserForm.phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Email:</Typography>
                <Typography variant="body1" fontWeight="bold">{editUserForm.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Full Name:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {editUserForm.account_type === 'household' 
                    ? `${editUserForm.first_name || ''} ${editUserForm.last_name || ''}`.trim()
                    : editUserForm.contact_person || 'N/A'
                  }
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Display Name:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {editUserForm.account_type === 'household' 
                    ? `${editUserForm.first_name || ''} ${editUserForm.last_name || ''}`.trim()
                    : editUserForm.institution_name || 'N/A'
                  }
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Account Type:</Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                  {editUserForm.account_type}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Role:</Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                  {editUserForm.role?.replace('_', ' ')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Status:</Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                  {editUserForm.status}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Communication Preference:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {editUserForm.communication_preference}
                </Typography>
              </Grid>
              {editUserForm.account_type === 'household' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Alternative Phone:</Typography>
                    <Typography variant="body1" fontWeight="bold">{editUserForm.alt_phone || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Plot Number:</Typography>
                    <Typography variant="body1" fontWeight="bold">{editUserForm.plot_number || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Household Size:</Typography>
                    <Typography variant="body1" fontWeight="bold">{editUserForm.household_size || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Village:</Typography>
                    <Typography variant="body1" fontWeight="bold">{editUserForm.village || 'N/A'}</Typography>
                  </Grid>
                </>
              )}
              {editUserForm.account_type === 'institution' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Institution Name:</Typography>
                    <Typography variant="body1" fontWeight="bold">{editUserForm.institution_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Institution Type:</Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                      {editUserForm.institution_type || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Contact Person:</Typography>
                    <Typography variant="body1" fontWeight="bold">{editUserForm.contact_person || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Population Served:</Typography>
                    <Typography variant="body1" fontWeight="bold">{editUserForm.population_served || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Alternative Contact:</Typography>
                    <Typography variant="body1" fontWeight="bold">{editUserForm.alt_contact || 'N/A'}</Typography>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelConfirmation}
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': {
                backgroundColor: '#b71c1c',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveUser}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminManagement;