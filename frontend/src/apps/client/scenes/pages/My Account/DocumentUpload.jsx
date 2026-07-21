import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
  Alert,
  LinearProgress,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { tokens } from "../../../theme";
import UploadIcon from "@mui/icons-material/Upload";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import StorageIcon from "@mui/icons-material/Storage";
import LockIcon from "@mui/icons-material/Lock";

const DocumentUpload = () => {
  const colors = tokens("dark");
  const fileInputRef = useRef(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [documentTypes, setDocumentTypes] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Document type detection keywords
  const documentTypeKeywords = {
    "national_id": ["national", "id", "identity", "passport", "driving", "license"],
    "tenancy_agreement": ["tenancy", "rental", "lease", "agreement", "contract"],
    "property_ownership": ["property", "ownership", "title", "deed", "certificate"],
    "water_application": ["water", "connection", "application", "form"],
    "proof_of_income": ["income", "salary", "payroll", "employment", "bank", "statement"],
  };

  // Smart document type detection
  const detectDocumentType = (filename) => {
    const lowerFilename = filename.toLowerCase();
    const scores = {};
    
    Object.keys(documentTypeKeywords).forEach(type => {
      scores[type] = 0;
      documentTypeKeywords[type].forEach(keyword => {
        if (lowerFilename.includes(keyword)) {
          scores[type] += 1;
        }
      });
    });
    
    const bestMatch = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    return scores[bestMatch] > 0 ? bestMatch : "other";
  };

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('=== FETCH DOCUMENTS START ===');
      console.log('Token exists:', token ? 'YES' : 'NO');
      console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/documents/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const result = await response.json();
      console.log('Response JSON:', JSON.stringify(result, null, 2));
      
      if (response.ok && result.success) {
        console.log('✅ Success! Documents array:', result.data?.documents);
        console.log('Documents count:', result.data?.documents?.length || 0);
        
        if (result.data && result.data.documents) {
          console.log('Setting documents state with:', result.data.documents);
          setDocuments(result.data.documents);
          console.log('Documents state updated');
        } else {
          console.error('❌ No documents array in response data');
          setDocuments([]);
        }
      } else {
        console.error('❌ Failed to fetch documents:', result);
        setDocuments([]);
      }
      console.log('=== FETCH DOCUMENTS END ===');
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // File handling functions
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      detectedType: detectDocumentType(file.name),
    }));
    
    setSelectedFiles(newFiles);
    setUploadDialogOpen(true);
  };

  const handleFileUpload = async () => {
    if (isUploading || selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const token = localStorage.getItem('token');
      console.log('=== UPLOAD START ===');
      console.log('Files to upload:', selectedFiles.length);
      
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileData = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', fileData.file);
        formData.append('document_type', documentTypes[fileData.id] || fileData.detectedType);
        
        console.log(`Uploading file ${i + 1}/${selectedFiles.length}:`, fileData.name);
        console.log('Document type:', documentTypes[fileData.id] || fileData.detectedType);
        const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
        const response = await fetch(`${BASE_URL}/documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const result = await response.json();
        console.log(`Upload response for ${fileData.name}:`, result);
        
        if (response.ok && result.success) {
          console.log('✅ Upload successful');
          successCount++;
        } else {
          console.error('❌ Upload failed:', result.message);
          failCount++;
          setSnackbar({ open: true, message: result.message || 'Failed to upload document', severity: 'error' });
        }
        
        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }
      
      console.log(`Upload complete: ${successCount} success, ${failCount} failed`);
      console.log('=== UPLOAD END ===');
      
      // Refresh documents list
      console.log('Refreshing documents list...');
      await fetchDocuments();
      
      if (successCount > 0) {
        setSnackbar({ 
          open: true, 
          message: `${successCount} document${successCount > 1 ? 's' : ''} uploaded successfully`, 
          severity: 'success' 
        });
      }
      
      setSelectedFiles([]);
      setDocumentTypes({});
      setUploadDialogOpen(false);
    } catch (error) {
      console.error('❌ Error uploading documents:', error);
      setSnackbar({ open: true, message: 'Error uploading documents', severity: 'error' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDocumentTypeChange = (fileId, newType) => {
    setDocumentTypes(prev => ({
      ...prev,
      [fileId]: newType
    }));
  };

  const handleRemoveFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Document preview functions
  const handleDocumentClick = (document) => {
    setSelectedDocument(document);
    setPreviewDialogOpen(true);
  };

  const handleDownloadDocument = async (document) => {
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/documents/${document.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = document.file_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setSnackbar({ open: true, message: 'Failed to download document', severity: 'error' });
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      setSnackbar({ open: true, message: 'Error downloading document', severity: 'error' });
    }
  };

  const handleDeleteDocument = async (document) => {
    if (document.status === "verified") {
      setSnackbar({ open: true, message: "Verified documents cannot be deleted. Please contact support.", severity: "error" });
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/documents/${document.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setSnackbar({ open: true, message: 'Document deleted successfully', severity: 'success' });
        setPreviewDialogOpen(false);
        await fetchDocuments();
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to delete document', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setSnackbar({ open: true, message: 'Error deleting document', severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "verified":
        return colors.greenAccent[500];
      case "unverified":
        return colors.redAccent[500];
      case "rejected":
        return colors.redAccent[500];
      case "pending":
        return colors.blueAccent[500];
      default:
        return colors.grey[500];
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "verified":
        return <CheckCircleIcon />;
      case "unverified":
        return <WarningIcon />;
      case "rejected":
        return <CloseIcon />;
      case "pending":
        return <InfoIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // Format document type
  const formatDocumentType = (type) => {
    if (!type) return 'Other';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const requiredDocuments = [
    "National ID Copy",
    "Tenancy Agreement or Property Ownership Certificate",
    "Water Connection Application Form",
    "Proof of Income (for subsidy applications)",
  ];

  if (loading) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: colors.blueAccent[500] }} />
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="20px">
        Document Upload
      </Typography>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={3}>
                Upload Documents
              </Typography>

              <Box
                sx={{
                  border: `2px dashed ${colors.grey[300]}`,
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  mb: 3,
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: colors.blueAccent[500],
                    backgroundColor: colors.primary[500],
                  },
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon sx={{ fontSize: 48, color: colors.grey[300], mb: 2 }} />
                <Typography variant="h6" color={colors.grey[100]} mb={1}>
                  Drag & Drop Files Here
                </Typography>
                <Typography variant="body2" color={colors.grey[300]} mb={2}>
                  or click to browse files
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  sx={{
                    backgroundColor: colors.blueAccent[500],
                    "&:hover": {
                      backgroundColor: colors.blueAccent[600],
                    },
                  }}
                >
                  Choose Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </Box>

              <Typography variant="h6" color={colors.grey[100]} mb={2}>
                Supported Formats:
              </Typography>
              <Typography variant="body2" color={colors.grey[300]} mb={3}>
                PDF, JPG, PNG (Max 10MB per file)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Document Status */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={3}>
                Document Status
              </Typography>

              {/* Debug Info */}
              <Box mb={2} p={2} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                <Typography variant="body2" color={colors.grey[300]} mb={1}>
                  Debug Info: {documents.length} document(s) in state
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    console.log('=== MANUAL DEBUG ===');
                    console.log('Current documents state:', documents);
                    console.log('Documents count:', documents.length);
                    console.log('Loading state:', loading);
                    fetchDocuments();
                  }}
                  sx={{
                    borderColor: colors.blueAccent[500],
                    color: colors.blueAccent[500],
                    fontSize: '0.75rem',
                  }}
                >
                  Refresh & Debug
                </Button>
              </Box>

              {documents.length === 0 ? (
                <Alert severity="info">
                  No documents uploaded yet. Upload your documents to get started.
                </Alert>
              ) : (
                <List>
                  {documents.map((doc) => (
                    <ListItem 
                      key={doc.id} 
                      sx={{ 
                        px: 0, 
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: colors.primary[500],
                          borderRadius: 1,
                        },
                        borderRadius: 1,
                        mb: 1,
                        opacity: doc.status === "verified" ? 0.8 : 1,
                        border: doc.status === "verified" ? `1px solid ${colors.greenAccent[500]}` : "none",
                      }}
                      onClick={() => handleDocumentClick(doc)}
                    >
                      <ListItemIcon>
                        <Box display="flex" alignItems="center" gap={1}>
                          <DescriptionIcon sx={{ color: colors.blueAccent[500] }} />
                          {doc.status === "verified" && (
                            <LockIcon sx={{ color: colors.greenAccent[500], fontSize: 16 }} />
                          )}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.file_name}
                        secondary={`Uploaded: ${formatDate(doc.uploaded_at)}`}
                        primaryTypographyProps={{ color: colors.grey[100] }}
                        secondaryTypographyProps={{ color: colors.grey[300] }}
                      />
                      <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                        <Chip
                          label={formatDocumentType(doc.status)}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(doc.status),
                            color: colors.grey[100],
                          }}
                        />
                        <Typography variant="caption" color={colors.grey[300]}>
                          {formatFileSize(doc.file_size)}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Required Documents */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={3}>
                Required Documents
              </Typography>

              <List>
                {requiredDocuments.map((doc, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: colors.greenAccent[500] }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc}
                      primaryTypographyProps={{ color: colors.grey[100] }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Upload Guidelines */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h4" color={colors.grey[100]} mb={3}>
                Upload Guidelines
              </Typography>

              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <WarningIcon sx={{ color: colors.redAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Ensure documents are clear and readable"
                    primaryTypographyProps={{ color: colors.grey[100] }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <WarningIcon sx={{ color: colors.redAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="All documents must be in color"
                    primaryTypographyProps={{ color: colors.grey[100] }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <WarningIcon sx={{ color: colors.redAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Documents should be less than 3 months old"
                    primaryTypographyProps={{ color: colors.grey[100] }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <WarningIcon sx={{ color: colors.redAccent[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Maximum file size: 10MB per document"
                    primaryTypographyProps={{ color: colors.grey[100] }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
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
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <SmartToyIcon sx={{ color: colors.blueAccent[500] }} />
              <Typography variant="h4">Smart Document Upload</Typography>
            </Box>
            <IconButton onClick={() => setUploadDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedFiles.length > 0 && (
            <Alert 
              severity="info" 
              sx={{ mb: 2, backgroundColor: colors.blueAccent[500], color: colors.grey[100] }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <SmartToyIcon />
                <Typography variant="body2">
                  AI has detected document types for your files. Please review and confirm:
                </Typography>
              </Box>
            </Alert>
          )}

          {selectedFiles.map((file) => (
            <Card key={file.id} sx={{ mb: 2, backgroundColor: colors.primary[500] }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <DescriptionIcon sx={{ color: colors.blueAccent[500] }} />
                    <Typography variant="h6" color={colors.grey[100]}>
                      {file.name}
                    </Typography>
                  </Box>
                  <IconButton 
                    onClick={() => handleRemoveFile(file.id)}
                    sx={{ color: colors.redAccent[500] }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Detected Type:
                  </Typography>
                  <Chip
                    label={formatDocumentType(file.detectedType)}
                    size="small"
                    sx={{
                      backgroundColor: colors.blueAccent[500],
                      color: colors.grey[100],
                    }}
                  />
                </Box>

                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.grey[100] }}>Document Type</InputLabel>
                  <Select
                    value={documentTypes[file.id] || file.detectedType}
                    onChange={(e) => handleDocumentTypeChange(file.id, e.target.value)}
                    sx={{
                      color: colors.grey[100],
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: colors.grey[300],
                      },
                      "& .MuiSvgIcon-root": {
                        color: colors.grey[100],
                      },
                    }}
                  >
                    <MenuItem value="national_id">National ID</MenuItem>
                    <MenuItem value="tenancy_agreement">Tenancy Agreement</MenuItem>
                    <MenuItem value="property_ownership">Property Ownership Certificate</MenuItem>
                    <MenuItem value="water_application">Water Connection Application Form</MenuItem>
                    <MenuItem value="proof_of_income">Proof of Income</MenuItem>
                    <MenuItem value="utility_bill">Utility Bill</MenuItem>
                    <MenuItem value="business_registration">Business Registration</MenuItem>
                    <MenuItem value="tax_certificate">Tax Compliance Certificate</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          ))}

          {isUploading && (
            <Box mt={2}>
              <Typography variant="body2" color={colors.grey[300]} mb={1}>
                Uploading documents... {Math.round(uploadProgress)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress}
                sx={{
                  backgroundColor: colors.grey[700],
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: colors.blueAccent[500],
                  },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setUploadDialogOpen(false)}
            sx={{ color: colors.grey[100] }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFileUpload}
            variant="contained"
            disabled={selectedFiles.length === 0 || isUploading}
            sx={{
              backgroundColor: colors.blueAccent[500],
              "&:hover": {
                backgroundColor: colors.blueAccent[600],
              },
            }}
          >
            {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : `Upload ${selectedFiles.length} Document${selectedFiles.length > 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
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
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <DescriptionIcon sx={{ color: colors.blueAccent[500] }} />
              <Typography variant="h4">Document Details</Typography>
            </Box>
            <IconButton onClick={() => setPreviewDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              {/* Document Header */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" color={colors.grey[100]}>
                  {selectedDocument.file_name}
                </Typography>
                <Chip
                  icon={getStatusIcon(selectedDocument.status)}
                  label={formatDocumentType(selectedDocument.status)}
                  sx={{
                    backgroundColor: getStatusColor(selectedDocument.status),
                    color: colors.grey[100],
                  }}
                />
              </Box>

              {/* Document Information Grid */}
              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ backgroundColor: colors.primary[500], p: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CalendarTodayIcon sx={{ color: colors.blueAccent[500] }} />
                      <Typography variant="h6" color={colors.grey[100]}>
                        Upload Date
                      </Typography>
                    </Box>
                    <Typography variant="body2" color={colors.grey[300]}>
                      {formatDate(selectedDocument.uploaded_at)}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ backgroundColor: colors.primary[500], p: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <StorageIcon sx={{ color: colors.blueAccent[500] }} />
                      <Typography variant="h6" color={colors.grey[100]}>
                        File Size
                      </Typography>
                    </Box>
                    <Typography variant="body2" color={colors.grey[300]}>
                      {formatFileSize(selectedDocument.file_size)}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card sx={{ backgroundColor: colors.primary[500], p: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <InfoIcon sx={{ color: colors.blueAccent[500] }} />
                      <Typography variant="h6" color={colors.grey[100]}>
                        Document Type
                      </Typography>
                    </Box>
                    <Typography variant="body2" color={colors.grey[300]}>
                      {formatDocumentType(selectedDocument.document_type)}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Verification Status Details */}
              {selectedDocument.status === "verified" && (
                <Alert 
                  severity="success" 
                  sx={{ mb: 3, backgroundColor: colors.greenAccent[500], color: colors.grey[100] }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleIcon />
                    <Typography variant="body2">
                      This document has been verified and approved by our team on {formatDate(selectedDocument.verified_at)}.
                    </Typography>
                  </Box>
                </Alert>
              )}

              {selectedDocument.status === "unverified" && (
                <Alert 
                  severity="warning" 
                  sx={{ mb: 3, backgroundColor: colors.redAccent[500], color: colors.grey[100] }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <WarningIcon />
                    <Typography variant="body2">
                      This document is pending verification. Our team will review it soon.
                    </Typography>
                  </Box>
                </Alert>
              )}

              {selectedDocument.status === "rejected" && selectedDocument.rejection_reason && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 3, backgroundColor: colors.redAccent[500], color: colors.grey[100] }}
                >
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CloseIcon />
                      <Typography variant="body2" fontWeight="bold">
                        Document Rejected
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      Reason: {selectedDocument.rejection_reason}
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      Please delete this document and upload a new one.
                    </Typography>
                  </Box>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPreviewDialogOpen(false)}
            sx={{ color: colors.grey[100] }}
          >
            Close
          </Button>
          <Button
            onClick={() => handleDownloadDocument(selectedDocument)}
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{
              borderColor: colors.blueAccent[500],
              color: colors.blueAccent[500],
              "&:hover": {
                borderColor: colors.blueAccent[600],
                backgroundColor: colors.blueAccent[500],
                color: colors.grey[100],
              },
            }}
          >
            Download
          </Button>
          {selectedDocument && selectedDocument.status !== "verified" && (
            <Button
              onClick={() => handleDeleteDocument(selectedDocument)}
              variant="outlined"
              startIcon={<DeleteIcon />}
              sx={{
                borderColor: colors.redAccent[500],
                color: colors.redAccent[500],
                "&:hover": {
                  borderColor: colors.redAccent[600],
                  backgroundColor: colors.redAccent[500],
                  color: colors.grey[100],
                },
              }}
            >
              Delete
            </Button>
          )}
          {selectedDocument && selectedDocument.status === "verified" && (
            <Typography variant="body2" color={colors.grey[300]} sx={{ fontStyle: 'italic' }}>
              This document is verified and cannot be deleted
            </Typography>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      {snackbar.open && (
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 9999,
          }}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  );
};

export default DocumentUpload;
