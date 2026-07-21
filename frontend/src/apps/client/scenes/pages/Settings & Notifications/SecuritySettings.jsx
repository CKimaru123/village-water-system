import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../hooks/useAuth";
import { useNotificationsContext } from "../../../../../context/NotificationsContext";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Paper,
  Avatar,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from "@mui/material";
import { tokens } from "../../../theme";
// import SecurityIcon from "@mui/icons-material/Security";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SecurityIcon from "@mui/icons-material/Security";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import EmailIcon from "@mui/icons-material/Email";
import ComputerIcon from "@mui/icons-material/Computer";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import TabletIcon from "@mui/icons-material/Tablet";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import HistoryIcon from "@mui/icons-material/History";
import ShieldIcon from "@mui/icons-material/Shield";
import KeyIcon from "@mui/icons-material/Key";
import PersonIcon from "@mui/icons-material/Person";
import QrCodeIcon from "@mui/icons-material/QrCode";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
// (No PDF lib needed) We'll export a styled HTML document, same approach as CurrentBill

const SecuritySettings = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { fetchNotifications } = useNotificationsContext();
  
  // Define static data before using it in state initializers
  const activeSessions = [
    {
      id: 1,
      device: 'Chrome on Windows',
      location: 'Nairobi, Kenya',
      ipAddress: '192.168.1.100',
      lastActive: new Date(Date.now() - 30 * 60 * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      current: true,
      icon: <ComputerIcon sx={{ color: colors.blueAccent[500] }} />
    },
    {
      id: 2,
      device: 'Safari on iPhone',
      location: 'Nairobi, Kenya',
      ipAddress: '192.168.1.101',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      current: false,
      icon: <SmartphoneIcon sx={{ color: colors.greenAccent[500] }} />
    },
    {
      id: 3,
      device: 'Chrome on Android',
      location: 'Mombasa, Kenya',
      ipAddress: '203.0.113.45',
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      current: false,
      icon: <PhoneAndroidIcon sx={{ color: colors.redAccent[500] }} />
    }
  ];

  const securityHistory = [
    {
      id: 1,
      action: 'Password Changed',
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      ipAddress: '192.168.1.100',
      location: 'Nairobi, Kenya',
      status: 'success',
      icon: <KeyIcon sx={{ color: colors.greenAccent[500] }} />
    },
    {
      id: 2,
      action: 'Two-Factor Authentication Enabled',
      timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      ipAddress: '192.168.1.100',
      location: 'Nairobi, Kenya',
      status: 'success',
      icon: <SecurityIcon sx={{ color: colors.greenAccent[500] }} />
    },
    {
      id: 3,
      action: 'Failed Login Attempt',
      timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      ipAddress: '203.0.113.45',
      location: 'Mombasa, Kenya',
      status: 'warning',
      icon: <WarningIcon sx={{ color: colors.redAccent[500] }} />
    },
    {
      id: 4,
      action: 'New Device Login',
      timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      ipAddress: '192.168.1.101',
      location: 'Nairobi, Kenya',
      status: 'info',
      icon: <InfoIcon sx={{ color: colors.blueAccent[500] }} />
    }
  ];
  // Helper function to get timestamp in the same format as getCurrentUserInfo
  const getFormattedTimestamp = (date = new Date()) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const [securitySettings, setSecuritySettings] = useState({
    // Password Settings - will be updated from backend
    passwordStrength: 'strong',
    lastPasswordChange: null, // Will be loaded from backend
    passwordExpiry: null,     // Will be calculated from backend data
    
    // Two-Factor Authentication
    twoFactorEnabled: true,
    twoFactorMethod: 'app', // 'app', 'sms', 'email'
    backupCodes: 8,
    
    // Session Management
    activeSessions: 3,
    sessionTimeout: 30, // minutes
    rememberDevice: true,
    
    // Security Alerts
    loginAlerts: true,
    passwordChangeAlerts: true,
    suspiciousActivityAlerts: true,
    newDeviceAlerts: true,
    
    // Privacy Settings
    dataSharing: false,
    analytics: true,
    marketingEmails: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    level: 'weak',
    feedback: []
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Password validation function (same as signup page)
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    
    let score = 0;
    let feedback = [];
    
    if (password.length >= minLength) score += 1;
    else feedback.push('At least 8 characters');
    
    if (hasUpperCase) score += 1;
    else feedback.push('One uppercase letter');
    
    if (hasLowerCase) score += 1;
    else feedback.push('One lowercase letter');
    
    if (hasNumbers) score += 1;
    else feedback.push('One number');
    
    if (hasSpecialChar) score += 1;
    else feedback.push('One special character (@$!%*?&)');
    
    let level = 'weak';
    if (score >= 5) level = 'strong';
    else if (score >= 4) level = 'good';
    else if (score >= 3) level = 'fair';
    
    return { score, level, feedback, isValid: score >= 5 };
  };

  const [dialogs, setDialogs] = useState({
    changePassword: false,
    twoFactorSetup: false,
    backupCodes: false,
    securityReport: false,
    passwordSuccess: false,
    securityLockout: false,
  });

  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState({
    message: '',
    expiryDate: '',
    showLogoutCountdown: false,
    countdown: 10
  });

  const [countdownInterval, setCountdownInterval] = useState(null);
  
  // Load real timestamps from backend
  const loadUserTimestamps = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        return;
      }

      console.log('Fetching user data from backend...');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Backend user data:', data);
        
        if (data.success && data.data) {
          const userData = data.data;
          const timestamp = userData.updated_at_with_timezone; // Single timestamp source
          
          console.log('Using timestamp:', timestamp);
          
          if (timestamp) {
            // Update security settings with the timezone-adjusted updated_at
            setSecuritySettings(prev => ({
              ...prev,
              lastPasswordChange: timestamp,
              passwordExpiry: calculateExpiryDate(timestamp)
            }));

            // Update login event with the same timestamp
            const realLoginEvent = {
              id: generateEventId(),
              action: 'Successful Login',
              timestamp: timestamp, // Same timestamp as password change
              ipAddress: '192.168.1.100',
              location: 'Nairobi, Kenya',
              status: 'success',
              icon: <CheckCircleIcon sx={{ color: colors.greenAccent[500] }} />
            };

            setSecurityEvents(prev => {
              // Remove any existing login events and add the real one
              const filtered = prev.filter(event => event.action !== 'Successful Login');
              return [realLoginEvent, ...filtered];
            });
          } else {
            console.log('No timestamp received from backend');
          }
        } else {
          console.log('Invalid response structure:', data);
        }
      } else {
        console.log('API request failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error loading user timestamps:', error);
    }
  };

  // Load timestamps when component mounts
  useEffect(() => {
    loadUserTimestamps();
  }, []);
  
  // Security: Track password change attempts
  const [passwordAttempts, setPasswordAttempts] = useState({
    count: 0,
    lockedUntil: null,
    showSecurityDialog: false
  });

  const handleManualLogout = () => {
    // Clear any running countdown
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    
    // Logout and redirect
    logout();
    navigate('/login');
  };

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);

  // Generate unique ID for security events
  const generateEventId = () => {
    return Date.now() + Math.random();
  };

  // Security helper functions
  const isAccountLocked = () => {
    if (!passwordAttempts.lockedUntil) return false;
    return new Date() < new Date(passwordAttempts.lockedUntil);
  };

  const getRemainingLockTime = () => {
    if (!passwordAttempts.lockedUntil) return 0;
    const remaining = new Date(passwordAttempts.lockedUntil) - new Date();
    return Math.max(0, Math.ceil(remaining / 1000 / 60)); // minutes
  };

  // Get current user location and IP (simulated for demo)
  const getCurrentUserInfo = () => {
    // In production, this would come from the backend or a geolocation service
    return {
      ipAddress: '192.168.1.100', // Would be actual IP from backend
      location: 'Nairobi, Kenya',  // Would be actual location from IP geolocation
      userAgent: navigator.userAgent,
      timestamp: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    };
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    
    // If it's already in the MM/DD/YYYY, HH:MM:SS format, return as is
    if (typeof timestamp === 'string' && timestamp.includes('/') && timestamp.includes(',')) {
      return timestamp;
    }
    
    // Parse as Date and format consistently
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Calculate expiry date (6 months from given date)
  const calculateExpiryDate = (fromTimestamp) => {
    // Parse the timestamp (which is in the format from getCurrentUserInfo)
    const date = new Date(fromTimestamp);
    date.setMonth(date.getMonth() + 6);
    
    // Return in the same format as getCurrentUserInfo
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const handleFailedAttempt = () => {
    const newCount = passwordAttempts.count + 1;
    const userInfo = getCurrentUserInfo();
    
    if (newCount >= 3) {
      // Lock account for 5 minutes after 3 failed attempts
      const lockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      setPasswordAttempts({
        count: newCount,
        lockedUntil: lockUntil,
        showSecurityDialog: true
      });
      
      // Close password dialog and show security lockout
      handleDialogClose('changePassword');
      handleDialogOpen('securityLockout');
      
      // Add security event with real data
      const securityEvent = {
        id: generateEventId(),
        action: 'Account Temporarily Locked - Multiple Failed Password Attempts',
        timestamp: userInfo.timestamp,
        ipAddress: userInfo.ipAddress,
        location: userInfo.location,
        status: 'warning',
        icon: <WarningIcon sx={{ color: colors.redAccent[500] }} />
      };
      setSecurityEvents(prev => [securityEvent, ...prev]);
      
    } else {
      // Just increment attempt count and log the failed attempt
      setPasswordAttempts(prev => ({
        ...prev,
        count: newCount
      }));
      
      // Add failed attempt to security events
      const failedAttemptEvent = {
        id: generateEventId(),
        action: 'Failed Password Change Attempt',
        timestamp: userInfo.timestamp,
        ipAddress: userInfo.ipAddress,
        location: userInfo.location,
        status: 'warning',
        icon: <WarningIcon sx={{ color: colors.redAccent[500] }} />
      };
      setSecurityEvents(prev => [failedAttemptEvent, ...prev]);
    }
  };

  const resetAttempts = () => {
    setPasswordAttempts({
      count: 0,
      lockedUntil: null,
      showSecurityDialog: false
    });
  };

  const [hasChanges, setHasChanges] = useState(false);
  const [sessions, setSessions] = useState(activeSessions);
  const [securityEvents, setSecurityEvents] = useState(securityHistory);

  const passwordStrengthLevels = [
    { level: 'weak', color: colors.redAccent[500], score: 1 },
    { level: 'fair', color: colors.blueAccent[500], score: 2 },
    { level: 'good', color: colors.greenAccent[500], score: 3 },
    { level: 'strong', color: colors.greenAccent[600], score: 4 },
  ];

  const handleGoBack = () => {
    navigate(-1);
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Real-time password strength validation for new password
    if (field === 'newPassword') {
      const strength = validatePassword(value);
      setPasswordStrength(strength);
    }

    // Clear errors when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleShowPassword = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSecuritySettingChange = (field, value) => {
    setSecuritySettings(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleDialogOpen = (dialog) => {
    setDialogs(prev => ({
      ...prev,
      [dialog]: true
    }));
  };

  const handleDialogClose = (dialog) => {
    setDialogs(prev => ({
      ...prev,
      [dialog]: false
    }));
  };

  const handleChangePassword = async () => {
    // Check if account is locked
    if (isAccountLocked()) {
      const remainingTime = getRemainingLockTime();
      setPasswordAttempts(prev => ({ ...prev, showSecurityDialog: true }));
      handleDialogOpen('securityLockout');
      return;
    }

    // Reset errors
    setPasswordErrors({});
    
    // Validate form
    const errors = {};
    
    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else {
      const passwordValidation = validatePassword(passwordForm.newPassword);
      if (!passwordValidation.isValid) {
        errors.newPassword = 'Password must meet all requirements';
      }
    }
    
    if (!passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // Get current user token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Call backend API to change password
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/auth/change_password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
          password_confirmation: passwordForm.confirmPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Success - reset attempts and proceed
        resetAttempts();
        
        // Refresh notifications so topbar badge reflects any new security notification
        fetchNotifications();
        
        // Use the timestamp returned from the backend
        const backendTimestamp = data.data.password_changed_at;
        const changeTimestamp = backendTimestamp; // Use the exact timestamp from backend
        const expiryTimestamp = calculateExpiryDate(changeTimestamp);
        
        console.log('Backend returned timestamp:', backendTimestamp);
        
        // Update local state with backend timestamp
        setSecuritySettings(prev => ({
          ...prev,
          lastPasswordChange: changeTimestamp, // This comes from the database
          passwordExpiry: expiryTimestamp,
          passwordStrength: passwordStrength.level
        }));
        
        // Reset form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        setPasswordStrength({ score: 0, level: 'weak', feedback: [] });
        
        // Close dialog
        handleDialogClose('changePassword');
        
        // Show success dialog with logout countdown
        setPasswordChangeSuccess({
          message: 'Password changed successfully!',
          expiryDate: formatTimestamp(expiryTimestamp),
          showLogoutCountdown: true,
          countdown: 10
        });
        handleDialogOpen('passwordSuccess');
        
        // Start countdown for automatic logout
        let countdownTimer = 10;
        const interval = setInterval(() => {
          countdownTimer -= 1;
          setPasswordChangeSuccess(prev => ({
            ...prev,
            countdown: countdownTimer
          }));
          
          if (countdownTimer <= 0) {
            clearInterval(interval);
            setCountdownInterval(null);
            // Logout user and redirect to login
            logout();
            navigate('/login');
          }
        }, 1000);
        
        setCountdownInterval(interval);
        
        // Create password change event using the backend timestamp
        const userInfo = getCurrentUserInfo(); // Get user info for IP and location
        const passwordChangeEvent = {
          id: generateEventId(),
          action: 'Password Changed Successfully',
          timestamp: changeTimestamp, // Use the exact timestamp from backend database
          ipAddress: userInfo.ipAddress,
          location: userInfo.location,
          status: 'success',
          icon: <KeyIcon sx={{ color: colors.greenAccent[500] }} />
        };
        console.log('Password change event timestamp:', changeTimestamp);
        setSecurityEvents(prev => [passwordChangeEvent, ...prev]);
        
      } else {
        // Handle authentication failure
        if (response.status === 401 || (data.message && data.message.toLowerCase().includes('incorrect'))) {
          // This is likely a wrong current password - handle securely
          handleFailedAttempt();
          
          // Show generic error message (security best practice)
          setPasswordErrors({ 
            submit: `Authentication failed. ${3 - passwordAttempts.count - 1} attempts remaining before temporary lockout.` 
          });
        } else if (data.errors) {
          // Handle other validation errors
          const backendErrors = {};
          if (data.errors.new_password) {
            backendErrors.newPassword = data.errors.new_password[0];
          }
          if (data.errors.password_confirmation) {
            backendErrors.confirmPassword = data.errors.password_confirmation[0];
          }
          setPasswordErrors(backendErrors);
        } else {
          setPasswordErrors({ submit: data.message || 'Failed to change password. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordErrors({ 
        submit: 'Network error. Please check if the server is running and try again.' 
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTerminateSession = (sessionId) => {
    console.log('Terminating session:', sessionId);
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    
    // Add termination event to security history
    const userInfo = getCurrentUserInfo();
    const terminationEvent = {
      id: generateEventId(),
      action: 'Session Terminated',
      timestamp: userInfo.timestamp,
      ipAddress: sessions.find(s => s.id === sessionId)?.ipAddress || 'Unknown',
      location: sessions.find(s => s.id === sessionId)?.location || 'Unknown',
      status: 'info',
      icon: <DeleteIcon sx={{ color: colors.blueAccent[500] }} />
    };
    setSecurityEvents(prev => [terminationEvent, ...prev]);
    
    alert('Session terminated successfully!');
  };

  const handleTerminateAllSessions = () => {
    console.log('Terminating all sessions');
    const currentSession = sessions.find(s => s.current);
    setSessions(prev => prev.filter(session => session.current)); // Keep only current session
    
    // Add termination event to security history
    const userInfo = getCurrentUserInfo();
    const terminationEvent = {
      id: generateEventId(),
      action: 'All Sessions Terminated',
      timestamp: userInfo.timestamp,
      ipAddress: 'Multiple',
      location: 'Multiple',
      status: 'warning',
      icon: <WarningIcon sx={{ color: colors.redAccent[500] }} />
    };
    setSecurityEvents(prev => [terminationEvent, ...prev]);
    
    alert('All sessions terminated successfully!');
  };

  const handleGenerateBackupCodes = () => {
    console.log('Generating backup codes...');
    setSecuritySettings(prev => ({
      ...prev,
      backupCodes: 10
    }));
    alert('New backup codes generated!');
  };

  const handleDownloadSecurityReport = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const userInfo = getCurrentUserInfo();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Security Report - Burguret Water Project</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2196f3; padding-bottom: 20px; }
          .header h1 { color: #2196f3; margin: 0; }
          .summary { margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px; }
          .summary h3 { margin: 0 0 15px 0; color: #333; }
          .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; }
          .chip { display: inline-block; padding: 8px 12px; background: #e3f2fd; border-radius: 16px; font-size: 13px; color: #1976d2; font-weight: 500; }
          .chip.success { background: #e8f5e8; color: #2e7d32; }
          .chip.warning { background: #fff3e0; color: #f57c00; }
          .chip.error { background: #ffebee; color: #d32f2f; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 13px; }
          th { background-color: #2196f3; color: white; font-weight: 600; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .section { margin-top: 35px; }
          .section h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          .muted { color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          .status-success { color: #2e7d32; font-weight: bold; }
          .status-warning { color: #f57c00; font-weight: bold; }
          .status-error { color: #d32f2f; font-weight: bold; }
          .meta-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Account Security Report</h1>
          <p><strong>Account Holder:</strong> ${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name || 'User' : 'User'}</p>
          <p class="muted">Generated: ${userInfo.timestamp}</p>
        </div>

        <div class="meta-info">
          <h4>Report Information</h4>
          <p><strong>Generated From:</strong> ${userInfo.location}</p>
          <p><strong>IP Address:</strong> ${userInfo.ipAddress}</p>
          <p><strong>Report ID:</strong> SEC-${timestamp}</p>
        </div>

        <div class="summary">
          <h3>Security Summary</h3>
          <div class="chips">
            <span class="chip success">Password last changed: ${formatTimestamp(securitySettings.lastPasswordChange)}</span>
            <span class="chip ${securitySettings.passwordStrength === 'strong' ? 'success' : securitySettings.passwordStrength === 'good' ? 'chip' : 'warning'}">Password strength: ${securitySettings.passwordStrength.toUpperCase()}</span>
            <span class="chip">Password expires: ${formatTimestamp(securitySettings.passwordExpiry)}</span>
            <span class="chip ${securitySettings.twoFactorEnabled ? 'success' : 'warning'}">2FA: ${securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'} ${securitySettings.twoFactorEnabled ? `(${securitySettings.twoFactorMethod})` : ''}</span>
            <span class="chip">Active sessions: ${sessions.length}</span>
            <span class="chip">Security events: ${securityEvents.length}</span>
            <span class="chip">Failed attempts: ${passwordAttempts.count}/3</span>
          </div>
        </div>

        <div class="section">
          <h3>Password Management (${sessions.length} active sessions)</h3>
          <table>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
            <tr>
              <td>Last Password Change</td>
              <td>${formatTimestamp(securitySettings.lastPasswordChange)}</td>
              <td><span class="status-success">Current</span></td>
              <td>Changed successfully</td>
            </tr>
            <tr>
              <td>Password Expiry</td>
              <td>${formatTimestamp(securitySettings.passwordExpiry)}</td>
              <td><span class="status-${new Date(securitySettings.passwordExpiry) > new Date() ? 'success' : 'warning'}">${new Date(securitySettings.passwordExpiry) > new Date() ? 'Valid' : 'Expired'}</span></td>
              <td>6 months from last change</td>
            </tr>
            <tr>
              <td>Password Strength</td>
              <td>${securitySettings.passwordStrength.toUpperCase()}</td>
              <td><span class="status-${securitySettings.passwordStrength === 'strong' ? 'success' : securitySettings.passwordStrength === 'good' ? 'success' : 'warning'}">${securitySettings.passwordStrength === 'strong' ? 'Excellent' : securitySettings.passwordStrength === 'good' ? 'Good' : 'Needs Improvement'}</span></td>
              <td>Meets security requirements</td>
            </tr>
            <tr>
              <td>Failed Attempts</td>
              <td>${passwordAttempts.count}/3</td>
              <td><span class="status-${passwordAttempts.count === 0 ? 'success' : passwordAttempts.count < 3 ? 'warning' : 'error'}">${passwordAttempts.count === 0 ? 'Clean' : passwordAttempts.count < 3 ? 'Monitored' : 'Locked'}</span></td>
              <td>${passwordAttempts.count === 0 ? 'No failed attempts' : `${passwordAttempts.count} recent failed attempts`}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h3>Active Sessions (${sessions.length})</h3>
          <table>
            <tr>
              <th>Device</th>
              <th>Location</th>
              <th>IP Address</th>
              <th>Last Active</th>
              <th>Status</th>
            </tr>
            ${sessions.map(s => `
              <tr>
                <td>${s.device}</td>
                <td>${s.location}</td>
                <td>${s.ipAddress}</td>
                <td>${s.lastActive}</td>
                <td><span class="status-${s.current ? 'success' : 'chip'}">${s.current ? 'Current Session' : 'Active'}</span></td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div class="section">
          <h3>Security Events Log (${securityEvents.length} events)</h3>
          <table>
            <tr>
              <th>Action</th>
              <th>Timestamp</th>
              <th>Location</th>
              <th>IP Address</th>
              <th>Status</th>
            </tr>
            ${securityEvents.map(e => `
              <tr>
                <td>${e.action}</td>
                <td>${e.timestamp}</td>
                <td>${e.location}</td>
                <td>${e.ipAddress}</td>
                <td><span class="status-${e.status}">${e.status.toUpperCase()}</span></td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div class="section">
          <h3>Security Recommendations</h3>
          <ul>
            ${securitySettings.passwordStrength !== 'strong' ? '<li>Consider using a stronger password with more complexity</li>' : ''}
            ${!securitySettings.twoFactorEnabled ? '<li>Enable Two-Factor Authentication for enhanced security</li>' : ''}
            ${sessions.length > 3 ? '<li>Review and terminate unnecessary active sessions</li>' : ''}
            ${passwordAttempts.count > 0 ? '<li>Monitor account for suspicious activity due to recent failed attempts</li>' : ''}
            <li>Regularly review security events and active sessions</li>
            <li>Update password every 6 months or when compromised</li>
            <li>Use unique passwords for different accounts</li>
          </ul>
        </div>

        <div class="muted">
          <p><strong>Report Details:</strong></p>
          <p>This comprehensive security report was generated by the Burguret Water Project Client Dashboard and reflects the current state of your account security at the time of generation.</p>
          <p><strong>Confidentiality:</strong> This report contains sensitive security information. Please store it securely and do not share with unauthorized individuals.</p>
          <p><strong>Support:</strong> For security concerns or questions, contact system administrator at admin@burguretwater.com</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security_report_${timestamp}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleViewFullHistory = () => {
    handleDialogOpen('securityReport');
  };

  const getPasswordStrengthColor = () => {
    const strength = passwordStrengthLevels.find(level => level.level === securitySettings.passwordStrength);
    return strength ? strength.color : colors.grey[500];
  };

  const getPasswordStrengthScore = () => {
    const strength = passwordStrengthLevels.find(level => level.level === securitySettings.passwordStrength);
    return strength ? strength.score : 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return colors.greenAccent[500];
      case 'warning': return colors.redAccent[500];
      case 'info': return colors.blueAccent[500];
      default: return colors.grey[500];
    }
  };

  return (
    <Box m="20px">
      <Box display="flex" alignItems="center" mb="20px">
        <IconButton
          onClick={handleGoBack}
          sx={{
            color: colors.grey[100],
            mr: 2,
            "&:hover": {
              backgroundColor: colors.primary[300],
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">
          Security Settings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <SecurityIcon sx={{ color: colors.blueAccent[500], fontSize: 32 }} />
                <Typography variant="h4" color={colors.grey[100]}>
                  Account Security Management
                </Typography>
              </Box>
              <Typography variant="body1" color={colors.grey[100]} mb={2}>
                Manage your account security settings, change password, enable two-factor authentication, and monitor security activity.
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => setHasChanges(false)}
                  disabled={!hasChanges}
                  sx={{
                    backgroundColor: colors.greenAccent[500],
                    "&:hover": {
                      backgroundColor: colors.greenAccent[600],
                    },
                    "&:disabled": {
                      backgroundColor: colors.grey[500],
                    },
                  }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadSecurityReport}
                  sx={{
                    borderColor: colors.blueAccent[500],
                    color: colors.blueAccent[500],
                  }}
                >
                  Download Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Password Management */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h5" color={colors.grey[100]} mb={3}>
                Password Management
              </Typography>

              <Box mb={3}>
                <Typography variant="h6" color={colors.grey[100]} mb={1} sx={{ fontSize: '16px' }}>
                  Password Strength
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <LinearProgress
                    variant="determinate"
                    value={(getPasswordStrengthScore() / 4) * 100}
                    sx={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.primary[500],
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: getPasswordStrengthColor(),
                      },
                    }}
                  />
                  <Chip
                    label={securitySettings.passwordStrength.toUpperCase()}
                    sx={{
                      backgroundColor: getPasswordStrengthColor(),
                      color: colors.grey[100],
                      fontSize: '12px'
                    }}
                  />
                </Box>
                <Typography variant="body2" color={colors.grey[300]} sx={{ fontSize: '14px' }}>
                  Last changed: {formatTimestamp(securitySettings.lastPasswordChange)}
                </Typography>
                <Typography variant="body2" color={colors.grey[300]} sx={{ fontSize: '14px' }}>
                  Expires: {formatTimestamp(securitySettings.passwordExpiry)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<LockIcon />}
                onClick={() => {
                  if (isAccountLocked()) {
                    handleDialogOpen('securityLockout');
                  } else {
                    handleDialogOpen('changePassword');
                  }
                }}
                disabled={isAccountLocked()}
                sx={{
                  backgroundColor: isAccountLocked() ? colors.grey[500] : colors.blueAccent[500],
                  fontSize: '14px',
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: isAccountLocked() ? colors.grey[500] : colors.blueAccent[600],
                  },
                  "&:disabled": {
                    backgroundColor: colors.grey[500],
                    color: colors.grey[300],
                  },
                }}
              >
                {isAccountLocked() ? `Locked (${getRemainingLockTime()}m remaining)` : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Two-Factor Authentication */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h5" color={colors.grey[100]} mb={3}>
                Two-Factor Authentication
              </Typography>

              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <SecurityIcon sx={{ color: colors.greenAccent[500], fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" color={colors.grey[100]}>
                    {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Method: {securitySettings.twoFactorMethod === 'app' ? 'Authenticator App' : 
                             securitySettings.twoFactorMethod === 'sms' ? 'SMS' : 'Email'}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<QrCodeIcon />}
                  onClick={() => handleDialogOpen('twoFactorSetup')}
                  sx={{
                    borderColor: colors.blueAccent[500],
                    color: colors.blueAccent[500],
                  }}
                >
                  Setup 2FA
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<KeyIcon />}
                  onClick={() => handleDialogOpen('backupCodes')}
                  sx={{
                    borderColor: colors.greenAccent[500],
                    color: colors.greenAccent[500],
                  }}
                >
                  Backup Codes ({securitySettings.backupCodes})
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Sessions */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" color={colors.grey[100]}>
                  Active Sessions ({sessions.length})
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={handleTerminateAllSessions}
                  sx={{
                    borderColor: colors.redAccent[500],
                    color: colors.redAccent[500],
                  }}
                >
                  Terminate All
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ backgroundColor: colors.primary[500] }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Device</TableCell>
                      <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Location</TableCell>
                      <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>IP Address</TableCell>
                      <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Last Active</TableCell>
                      <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Status</TableCell>
                      <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell sx={{ color: colors.grey[100] }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {session.icon}
                            {session.device}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: colors.grey[100] }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationOnIcon sx={{ color: colors.grey[400], fontSize: 16 }} />
                            {session.location}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: colors.grey[100] }}>{session.ipAddress}</TableCell>
                        <TableCell sx={{ color: colors.grey[100] }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <AccessTimeIcon sx={{ color: colors.grey[400], fontSize: 16 }} />
                            {session.lastActive}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={session.current ? "Current" : "Active"}
                            sx={{
                              backgroundColor: session.current ? colors.greenAccent[500] : colors.blueAccent[500],
                              color: colors.grey[100],
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {!session.current && (
                            <IconButton
                              onClick={() => handleTerminateSession(session.id)}
                              sx={{ color: colors.redAccent[500] }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h5" color={colors.grey[100]} mb={3}>
                Security Preferences
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon sx={{ color: colors.greenAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Login Alerts"
                    secondary="Get notified of new login attempts"
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={securitySettings.loginAlerts}
                      onChange={(e) => handleSecuritySettingChange('loginAlerts', e.target.checked)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: colors.greenAccent[500],
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: colors.greenAccent[500],
                        },
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <KeyIcon sx={{ color: colors.blueAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Password Change Alerts"
                    secondary="Notifications when password is changed"
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={securitySettings.passwordChangeAlerts}
                      onChange={(e) => handleSecuritySettingChange('passwordChangeAlerts', e.target.checked)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: colors.greenAccent[500],
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: colors.greenAccent[500],
                        },
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <WarningIcon sx={{ color: colors.redAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Suspicious Activity Alerts"
                    secondary="Alerts for unusual account activity"
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={securitySettings.suspiciousActivityAlerts}
                      onChange={(e) => handleSecuritySettingChange('suspiciousActivityAlerts', e.target.checked)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: colors.greenAccent[500],
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: colors.greenAccent[500],
                        },
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <SmartphoneIcon sx={{ color: colors.blueAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="New Device Alerts"
                    secondary="Notifications for new device logins"
                    primaryTypographyProps={{ color: colors.grey[100] }}
                    secondaryTypographyProps={{ color: colors.grey[300] }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={securitySettings.newDeviceAlerts}
                      onChange={(e) => handleSecuritySettingChange('newDeviceAlerts', e.target.checked)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: colors.greenAccent[500],
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: colors.greenAccent[500],
                        },
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Security History */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h5" color={colors.grey[100]} mb={3}>
                Security History
              </Typography>

              <List>
                {securityEvents.slice(0, 4).map((event) => (
                  <ListItem key={event.id} sx={{ py: 1 }}>
                    <ListItemIcon>
                      {event.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={event.action}
                      secondary={`${event.timestamp} • ${event.location}`}
                      primaryTypographyProps={{ color: colors.grey[100], fontSize: "0.9rem" }}
                      secondaryTypographyProps={{ color: colors.grey[300], fontSize: "0.8rem" }}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={event.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(event.status),
                          color: colors.grey[100],
                        }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={handleViewFullHistory}
                sx={{
                  borderColor: colors.blueAccent[500],
                  color: colors.blueAccent[500],
                  mt: 2,
                }}
              >
                View Full History
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog
        open={dialogs.changePassword}
        onClose={() => handleDialogClose('changePassword')}
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
          <Typography variant="h5" color={colors.grey[100]} sx={{ fontSize: '1.5rem', fontWeight: 600 }}>
            Change Password
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Current Password"
            type={showPasswords.current ? "text" : "password"}
            value={passwordForm.currentPassword}
            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
            error={!!passwordErrors.currentPassword}
            helperText={passwordErrors.currentPassword}
            sx={{ 
              mb: 3, 
              mt: 1,
              '& .MuiInputLabel-root': { 
                fontSize: '14px',
                color: colors.grey[200],
                '&.Mui-focused': {
                  color: colors.blueAccent[500]
                }
              },
              '& .MuiInputBase-input': { 
                fontSize: '14px',
                color: colors.grey[100]
              },
              '& .MuiFormHelperText-root': {
                fontSize: '12px'
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={() => handleShowPassword('current')}
                    sx={{ color: colors.grey[300] }}
                  >
                    {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            fullWidth
            label="New Password"
            type={showPasswords.new ? "text" : "password"}
            value={passwordForm.newPassword}
            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
            error={!!passwordErrors.newPassword}
            helperText={passwordErrors.newPassword}
            sx={{ 
              mb: 2,
              '& .MuiInputLabel-root': { 
                fontSize: '14px',
                color: colors.grey[200],
                '&.Mui-focused': {
                  color: colors.blueAccent[500]
                }
              },
              '& .MuiInputBase-input': { 
                fontSize: '14px',
                color: colors.grey[100]
              },
              '& .MuiFormHelperText-root': {
                fontSize: '12px'
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={() => handleShowPassword('new')}
                    sx={{ color: colors.grey[300] }}
                  >
                    {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password Strength Indicator */}
          {passwordForm.newPassword && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color={colors.grey[200]} sx={{ fontSize: '14px', mb: 1 }}>
                Password Strength
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <LinearProgress
                  variant="determinate"
                  value={(passwordStrength.score / 5) * 100}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.primary[500],
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: passwordStrength.level === 'strong' ? colors.greenAccent[500] :
                                     passwordStrength.level === 'good' ? colors.greenAccent[400] :
                                     passwordStrength.level === 'fair' ? colors.blueAccent[500] :
                                     colors.redAccent[500],
                    },
                  }}
                />
                <Chip
                  label={passwordStrength.level.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: passwordStrength.level === 'strong' ? colors.greenAccent[500] :
                                   passwordStrength.level === 'good' ? colors.greenAccent[400] :
                                   passwordStrength.level === 'fair' ? colors.blueAccent[500] :
                                   colors.redAccent[500],
                    color: colors.grey[100],
                    fontSize: '12px'
                  }}
                />
              </Box>
              {passwordStrength.feedback.length > 0 && (
                <Typography variant="body2" color={colors.grey[300]} sx={{ fontSize: '12px' }}>
                  Missing: {passwordStrength.feedback.join(', ')}
                </Typography>
              )}
            </Box>
          )}
          
          <TextField
            fullWidth
            label="Confirm New Password"
            type={showPasswords.confirm ? "text" : "password"}
            value={passwordForm.confirmPassword}
            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            error={!!passwordErrors.confirmPassword}
            helperText={passwordErrors.confirmPassword}
            sx={{ 
              mb: 2,
              '& .MuiInputLabel-root': { 
                fontSize: '14px',
                color: colors.grey[200],
                '&.Mui-focused': {
                  color: colors.blueAccent[500]
                }
              },
              '& .MuiInputBase-input': { 
                fontSize: '14px',
                color: colors.grey[100]
              },
              '& .MuiFormHelperText-root': {
                fontSize: '12px'
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={() => handleShowPassword('confirm')}
                    sx={{ color: colors.grey[300] }}
                  >
                    {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Alert 
            severity="info" 
            sx={{ 
              backgroundColor: colors.blueAccent[500], 
              color: colors.grey[100],
              '& .MuiAlert-message': {
                fontSize: '14px'
              }
            }}
          >
            Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.
          </Alert>

          {passwordErrors.submit && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2,
                backgroundColor: colors.redAccent[500], 
                color: colors.grey[100],
                '& .MuiAlert-message': {
                  fontSize: '14px'
                }
              }}
            >
              {passwordErrors.submit}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => handleDialogClose('changePassword')}
            disabled={isChangingPassword}
            sx={{ 
              color: colors.grey[100],
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={isChangingPassword}
            sx={{
              backgroundColor: colors.greenAccent[500],
              fontSize: '14px',
              fontWeight: 600,
              "&:hover": {
                backgroundColor: colors.greenAccent[600],
              },
              "&:disabled": {
                backgroundColor: colors.grey[500],
              },
            }}
          >
            {isChangingPassword ? 'Changing Password...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Two-Factor Setup Dialog */}
      <Dialog
        open={dialogs.twoFactorSetup}
        onClose={() => handleDialogClose('twoFactorSetup')}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: colors.primary[400],
            color: colors.grey[100],
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h5" color={colors.grey[100]}>
            Setup Two-Factor Authentication
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stepper orientation="vertical">
            <Step active={true}>
              <StepLabel sx={{ color: colors.grey[100] }}>Download Authenticator App</StepLabel>
              <StepContent>
                <Typography variant="body1" color={colors.grey[300]} mb={2}>
                  Download Google Authenticator or Microsoft Authenticator on your mobile device.
                </Typography>
              </StepContent>
            </Step>
            <Step active={true}>
              <StepLabel sx={{ color: colors.grey[100] }}>Scan QR Code</StepLabel>
              <StepContent>
                <Box textAlign="center" py={2}>
                  <QrCodeIcon sx={{ fontSize: 100, color: colors.blueAccent[500] }} />
                  <Typography variant="body2" color={colors.grey[300]} mt={1}>
                    Scan this QR code with your authenticator app
                  </Typography>
                </Box>
              </StepContent>
            </Step>
            <Step active={true}>
              <StepLabel sx={{ color: colors.grey[100] }}>Enter Verification Code</StepLabel>
              <StepContent>
                <TextField
                  fullWidth
                  label="6-digit code"
                  placeholder="123456"
                  sx={{ mb: 2 }}
                />
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleDialogClose('twoFactorSetup')}
            sx={{ color: colors.grey[100] }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: colors.greenAccent[500],
              "&:hover": {
                backgroundColor: colors.greenAccent[600],
              },
            }}
          >
            Enable 2FA
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog
        open={dialogs.backupCodes}
        onClose={() => handleDialogClose('backupCodes')}
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
          <Typography variant="h5" color={colors.grey[100]}>
            Backup Codes
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ backgroundColor: colors.redAccent[500], color: colors.grey[100], mb: 2 }}>
            Save these backup codes in a safe place. Each code can only be used once.
          </Alert>
          <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1} mb={2}>
            {Array.from({ length: 10 }, (_, i) => (
              <Paper key={i} sx={{ backgroundColor: colors.primary[500], p: 1, textAlign: 'center' }}>
                <Typography variant="body2" color={colors.grey[100]} fontFamily="monospace">
                  {Math.random().toString(36).substr(2, 8).toUpperCase()}
                </Typography>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleDialogClose('backupCodes')}
            sx={{ color: colors.grey[100] }}
          >
            Close
          </Button>
          <Button
            onClick={handleGenerateBackupCodes}
            variant="outlined"
            sx={{
              borderColor: colors.blueAccent[500],
              color: colors.blueAccent[500],
            }}
          >
            Generate New Codes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Security Report Dialog */}
      <Dialog
        open={dialogs.securityReport}
        onClose={() => handleDialogClose('securityReport')}
        maxWidth="lg"
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
            <Typography variant="h5" color={colors.grey[100]}>
              Security History Report
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadSecurityReport}
              sx={{
                borderColor: colors.blueAccent[500],
                color: colors.blueAccent[500],
              }}
            >
              Download Report
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" color={colors.grey[100]} mb={2}>
            Complete Security Activity Log ({securityEvents.length} events)
          </Typography>
          
          <TableContainer component={Paper} sx={{ backgroundColor: colors.primary[500] }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Action</TableCell>
                  <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Timestamp</TableCell>
                  <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Location</TableCell>
                  <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>IP Address</TableCell>
                  <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {securityEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell sx={{ color: colors.grey[100] }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {event.icon}
                        {event.action}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>{event.timestamp}</TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>{event.location}</TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>{event.ipAddress}</TableCell>
                    <TableCell>
                      <Chip
                        label={event.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(event.status),
                          color: colors.grey[100],
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleDialogClose('securityReport')}
            sx={{ color: colors.grey[100] }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Success Dialog */}
      <Dialog
        open={dialogs.passwordSuccess}
        onClose={() => {}} // Prevent closing by clicking outside
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
          <Box display="flex" alignItems="center" gap={2}>
            <CheckCircleIcon sx={{ color: colors.greenAccent[500], fontSize: 32 }} />
            <Typography variant="h5" color={colors.grey[100]} sx={{ fontSize: '1.5rem', fontWeight: 600 }}>
              Password Changed Successfully!
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert 
            severity="success" 
            sx={{ 
              backgroundColor: colors.greenAccent[500], 
              color: colors.grey[100],
              mb: 3,
              '& .MuiAlert-message': {
                fontSize: '14px'
              }
            }}
          >
            {passwordChangeSuccess.message}
          </Alert>

          <Typography variant="body1" color={colors.grey[100]} sx={{ fontSize: '14px', mb: 2 }}>
            Your password has been updated successfully and will expire on <strong>{passwordChangeSuccess.expiryDate}</strong>.
          </Typography>

          <Alert 
            severity="info" 
            sx={{ 
              backgroundColor: colors.blueAccent[500], 
              color: colors.grey[100],
              mb: 2,
              '& .MuiAlert-message': {
                fontSize: '14px'
              }
            }}
          >
            For security reasons, you will be automatically logged out in <strong>{passwordChangeSuccess.countdown}</strong> seconds. Please log in again with your new password.
          </Alert>

          <Typography variant="body2" color={colors.grey[300]} sx={{ fontSize: '12px' }}>
            This is a security measure to ensure your account remains protected after a password change.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleManualLogout}
            variant="contained"
            sx={{
              backgroundColor: colors.blueAccent[500],
              fontSize: '14px',
              fontWeight: 600,
              "&:hover": {
                backgroundColor: colors.blueAccent[600],
              },
            }}
          >
            Login Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Security Lockout Dialog */}
      <Dialog
        open={dialogs.securityLockout}
        onClose={() => {}} // Prevent closing by clicking outside
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
          <Box display="flex" alignItems="center" gap={2}>
            <SecurityIcon sx={{ color: colors.redAccent[500], fontSize: 32 }} />
            <Typography variant="h5" color={colors.grey[100]} sx={{ fontSize: '1.5rem', fontWeight: 600 }}>
              Security Protection Activated
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert 
            severity="warning" 
            sx={{ 
              backgroundColor: colors.redAccent[500], 
              color: colors.grey[100],
              mb: 3,
              '& .MuiAlert-message': {
                fontSize: '14px'
              }
            }}
          >
            Multiple authentication attempts detected. Account temporarily secured.
          </Alert>

          <Typography variant="body1" color={colors.grey[100]} sx={{ fontSize: '14px', mb: 2 }}>
            For your security, password changes have been temporarily disabled due to multiple failed attempts.
          </Typography>

          <Box sx={{ mb: 2, p: 2, backgroundColor: colors.primary[500], borderRadius: 2 }}>
            <Typography variant="body2" color={colors.grey[200]} sx={{ fontSize: '14px', mb: 1 }}>
              <strong>Security Lockout Details:</strong>
            </Typography>
            <Typography variant="body2" color={colors.grey[300]} sx={{ fontSize: '13px', mb: 0.5 }}>
              • Failed attempts: {passwordAttempts.count}/3
            </Typography>
            <Typography variant="body2" color={colors.grey[300]} sx={{ fontSize: '13px', mb: 0.5 }}>
              • Lockout duration: 5 minutes
            </Typography>
            <Typography variant="body2" color={colors.grey[300]} sx={{ fontSize: '13px' }}>
              • Time remaining: ~{getRemainingLockTime()} minutes
            </Typography>
          </Box>

          <Alert 
            severity="info" 
            sx={{ 
              backgroundColor: colors.blueAccent[500], 
              color: colors.grey[100],
              mb: 2,
              '& .MuiAlert-message': {
                fontSize: '14px'
              }
            }}
          >
            If you're having trouble remembering your password, please contact system administrator for assistance.
          </Alert>

          <Typography variant="body2" color={colors.grey[300]} sx={{ fontSize: '12px' }}>
            This security measure protects your account from unauthorized access attempts. The lockout will automatically expire, or you can contact support for immediate assistance.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              handleDialogClose('securityLockout');
              // Optionally redirect to dashboard or logout
            }}
            variant="outlined"
            sx={{
              borderColor: colors.grey[400],
              color: colors.grey[100],
              fontSize: '14px',
              fontWeight: 500,
              "&:hover": {
                borderColor: colors.grey[300],
              },
            }}
          >
            Return to Dashboard
          </Button>
          <Button
            onClick={() => {
              // Contact support functionality could be added here
              alert('Please contact system administrator at admin@burguretwater.com or call +254-XXX-XXXX for immediate assistance.');
            }}
            variant="contained"
            sx={{
              backgroundColor: colors.blueAccent[500],
              fontSize: '14px',
              fontWeight: 600,
              "&:hover": {
                backgroundColor: colors.blueAccent[600],
              },
            }}
          >
            Contact Support
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecuritySettings;
