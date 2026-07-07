import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Button,
  ButtonGroup,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  Fade,
  Skeleton,
  useTheme,
  useMediaQuery,
  Alert,
  Badge,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Close as CloseIcon,
  ArrowBackIos as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  ZoomIn as ZoomInIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";

// Enhanced gallery item interface from database
interface EnhancedGalleryItem {
  id: number;
  title: string;
  description?: string;
  largeImage: string;
  smallImage: string;
  category: string;
  tags: string[];
  featured: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  formattedCreatedAt: string;
  location?: string;
  date?: string;
}

interface EnhancedGalleryProps {
  data?: EnhancedGalleryItem[];
}

// Admin Banner Component (simple banner only)
const AdminBanner: React.FC = () => {
  return (
    <Alert 
      severity="success" 
      sx={{ 
        mb: 3,
        fontSize: '1.1rem',
        fontWeight: 600,
        '& .MuiAlert-message': {
          fontSize: '1.1rem',
          fontWeight: 600
        }
      }}
    >
      🔧 Admin Mode: You can add, edit, and delete gallery items
    </Alert>
  );
};

// Admin Controls Component (separate section)
const AdminControls: React.FC<{ onAddNew: () => void; onRefresh: () => void }> = ({ onAddNew, onRefresh }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 2, 
        mb: 3 
      }}
    >
      <Button
        variant="contained"
        color="success"
        startIcon={<AddIcon />}
        onClick={onAddNew}
        sx={{
          boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(40, 167, 69, 0.4)',
          },
          transition: 'all 0.3s ease',
          fontSize: '0.9rem',
          fontWeight: 600,
          px: 3
        }}
      >
        Add New Gallery Item
      </Button>
      <Button
        variant="contained"
        color="primary"
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
        sx={{
          boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.4)',
          },
          transition: 'all 0.3s ease',
          fontSize: '0.9rem',
          fontWeight: 600,
          px: 3
        }}
      >
        Refresh
      </Button>
    </Box>
  );
};

// Categories for filtering
const categories = [
  { key: "all", label: "All Projects", color: "primary" },
  { key: "Water Infrastructure", label: "Water Infrastructure", color: "info" },
  { key: "Community Events", label: "Community Events", color: "success" },
  { key: "Agricultural Projects", label: "Agricultural Projects", color: "warning" },
  { key: "Training Sessions", label: "Training Sessions", color: "error" },
  { key: "Equipment Installation", label: "Equipment Installation", color: "secondary" },
  { key: "Environmental Conservation", label: "Environmental Conservation", color: "success" },
];

export const EnhancedGallery: React.FC<EnhancedGalleryProps> = ({ data }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredData, setFilteredData] = useState<EnhancedGalleryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryItems, setGalleryItems] = useState<EnhancedGalleryItem[]>([]);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EnhancedGalleryItem | null>(null);
  const [addItemForm, setAddItemForm] = useState({
    title: "",
    description: "",
    largeImageUrl: "",
    smallImageUrl: "",
    category: "",
    featured: false,
    active: true,
    tags: ""
  });
  const [editItemForm, setEditItemForm] = useState({
    title: "",
    description: "",
    largeImageUrl: "",
    smallImageUrl: "",
    category: "",
    featured: false,
    active: true,
    tags: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Load gallery items from database
  const loadGalleryItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/v1/gallery_items');
      const result = await response.json();
      
      if (result.success) {
        setGalleryItems(result.data.gallery_items);
      } else {
        console.error('Failed to load gallery items:', result.message);
        // Fallback to provided data or empty array
        setGalleryItems(data || []);
      }
    } catch (error) {
      console.error('Error loading gallery items:', error);
      // Fallback to provided data or empty array
      setGalleryItems(data || []);
    } finally {
      setLoading(false);
    }
  };

  // Load gallery items on component mount
  useEffect(() => {
    loadGalleryItems();
  }, []);

  // Handle admin actions
  const handleAddNew = () => {
    setAddItemDialogOpen(true);
  };

  const handleRefresh = () => {
    alert('Refreshing gallery items...');
    loadGalleryItems();
  };

  // Helper function to convert Unsplash URLs to direct image URLs
  const convertToDirectImageUrl = (url: string): string => {
    if (url.includes('unsplash.com/photos/')) {
      // Convert Unsplash photo page URL to direct image URL
      const photoId = url.split('/').pop()?.split('?')[0];
      if (photoId) {
        return `https://images.unsplash.com/photo-${photoId}?w=800&q=80`;
      }
    }
    return url;
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        // Clear URL field when file is selected
        setAddItemForm({ ...addItemForm, largeImageUrl: "", smallImageUrl: "" });
      } else {
        alert('Please select an image file (JPG, PNG, GIF, etc.)');
      }
    }
  };

  // Handle URL change and preview
  const handleImageUrlChange = (url: string) => {
    setAddItemForm({ ...addItemForm, largeImageUrl: url });
    if (url) {
      const directUrl = convertToDirectImageUrl(url);
      setImagePreview(directUrl);
      // Clear file when URL is entered
      setImageFile(null);
    } else {
      setImagePreview("");
    }
  };

  // File upload handlers
  const handleAddItemSubmit = async () => {
    if (!addItemForm.title || (!addItemForm.largeImageUrl && !imageFile) || !addItemForm.category) {
      alert('Please fill in all required fields (Title, Image URL or File, and Category)');
      return;
    }

    try {
      const token = user?.token || localStorage.getItem('token');
      let imageUrl = addItemForm.largeImageUrl;
      
      // If file is selected, we'll use a placeholder URL for now
      // In a real app, you'd upload the file to a cloud service first
      if (imageFile) {
        // For demo purposes, we'll use the preview URL
        // In production, upload to cloud storage and get the URL
        imageUrl = imagePreview;
        alert('Note: File upload is for preview only. In production, this would be uploaded to cloud storage.');
      } else if (imageUrl) {
        // Convert Unsplash URLs to direct image URLs
        imageUrl = convertToDirectImageUrl(imageUrl);
      }

      const response = await fetch('http://localhost:3001/api/v1/gallery_items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gallery_item: {
            title: addItemForm.title,
            description: addItemForm.description || '',
            large_image_url: imageUrl,
            small_image_url: addItemForm.smallImageUrl || imageUrl,
            category: addItemForm.category,
            featured: addItemForm.featured,
            active: addItemForm.active,
            tags: addItemForm.tags,
            sort_order: 999
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Gallery item created successfully!');
        // Reset form and close dialog
        setAddItemForm({
          title: "",
          description: "",
          largeImageUrl: "",
          smallImageUrl: "",
          category: "",
          featured: false,
          active: true,
          tags: ""
        });
        setImageFile(null);
        setImagePreview("");
        setAddItemDialogOpen(false);
        // Refresh the gallery items
        loadGalleryItems();
      } else {
        alert('Failed to create item: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating gallery item:', error);
      alert('Error creating item. Please try again.');
    }
  };

  const handleEdit = (item: EnhancedGalleryItem) => {
    setEditingItem(item);
    setEditItemForm({
      title: item.title,
      description: item.description || "",
      largeImageUrl: item.largeImage,
      smallImageUrl: item.smallImage,
      category: item.category,
      featured: item.featured,
      active: item.active,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || "")
    });
    setEditItemDialogOpen(true);
  };

  const handleEditItemSubmit = async () => {
    if (!editingItem || !editItemForm.title || !editItemForm.category) {
      alert('Please fill in all required fields (Title and Category)');
      return;
    }

    try {
      const token = user?.token || localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/v1/gallery_items/${editingItem.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gallery_item: {
            title: editItemForm.title,
            description: editItemForm.description || '',
            large_image_url: editItemForm.largeImageUrl,
            small_image_url: editItemForm.smallImageUrl || editItemForm.largeImageUrl,
            category: editItemForm.category,
            featured: editItemForm.featured,
            active: editItemForm.active,
            tags: editItemForm.tags
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Gallery item updated successfully!');
        // Reset form and close dialog
        setEditItemForm({
          title: "",
          description: "",
          largeImageUrl: "",
          smallImageUrl: "",
          category: "",
          featured: false,
          active: true,
          tags: ""
        });
        setEditingItem(null);
        setEditItemDialogOpen(false);
        // Refresh the gallery items
        loadGalleryItems();
      } else {
        alert('Failed to update item: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating gallery item:', error);
      alert('Error updating item. Please try again.');
    }
  };

  const handleDelete = async (item: EnhancedGalleryItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      try {
        const token = user?.token || localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/v1/gallery_items/${item.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        if (result.success) {
          alert('Gallery item deleted successfully!');
          // Refresh the gallery items
          loadGalleryItems();
        } else {
          alert('Failed to delete item: ' + result.message);
        }
      } catch (error) {
        console.error('Error deleting gallery item:', error);
        alert('Error deleting item. Please try again.');
      }
    }
  };

  // Enhanced data with categories - use database data if available
  const enhancedData: EnhancedGalleryItem[] = galleryItems.length > 0 
    ? galleryItems.map((item, index) => ({
        ...item,
        location: "Rural Kenya",
        date: new Date(item.createdAt).getFullYear().toString()
      }))
    : (data ? data.map((item, index) => ({
        ...item,
        category: getCategoryForItem(item.title),
        description: getDescriptionForItem(item.title),
        location: "Rural Kenya",
        date: "2024"
      })) : []);

  // Categorize items based on title
  function getCategoryForItem(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('hospital') || titleLower.includes('health')) return 'healthcare';
    if (titleLower.includes('irrigation') || titleLower.includes('farming')) return 'agriculture';
    if (titleLower.includes('household') || titleLower.includes('community')) return 'community';
    return 'infrastructure';
  }

  // Get description for items
  function getDescriptionForItem(title: string): string {
    const descriptions: { [key: string]: string } = {
      "Household Water": "Clean water access directly to homes, improving health and convenience for families.",
      "Household cleaning": "Proper sanitation facilities ensuring hygiene and disease prevention.",
      "Household Repair": "Maintenance and repair services keeping water systems running efficiently.",
      "Digging": "Well construction and borehole drilling to access groundwater sources.",
      "River": "Natural water source protection and sustainable management practices.",
      "Swimming Pool": "Community recreational facilities promoting health and social cohesion.",
      "Irrigation": "Agricultural water systems supporting food security and farmer livelihoods.",
      "Hospital": "Healthcare facility water supply ensuring medical services can operate effectively."
    };
    return descriptions[title] || "Water infrastructure project improving community access to clean water.";
  }

  // Filter data based on selected category
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredData(enhancedData);
    } else {
      setFilteredData(enhancedData.filter(item => item.category === selectedCategory));
    }
  }, [selectedCategory, galleryItems, data]);

  // Simulate loading only if no data is being loaded from API
  useEffect(() => {
    if (galleryItems.length === 0 && !data) {
      const timer = setTimeout(() => setLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [galleryItems, data]);

  // Handle image navigation in lightbox
  const handlePrevImage = () => {
    if (selectedImage !== null && selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImage !== null && selectedImage < filteredData.length - 1) {
      setSelectedImage(selectedImage + 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (selectedImage !== null) {
        if (event.key === 'ArrowLeft') handlePrevImage();
        if (event.key === 'ArrowRight') handleNextImage();
        if (event.key === 'Escape') setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedImage, filteredData.length]);

  return (
    <Box id="portfolio" sx={{ py: 8, backgroundColor: '#f8f9fa' }}>
      <Container maxWidth="lg">
        {/* Admin Banner - Only show for admin users */}
        {isAdmin && <AdminBanner />}
        
        {/* Admin Controls - Only show for admin users */}
        {isAdmin && <AdminControls onAddNew={handleAddNew} onRefresh={handleRefresh} />}
        
        {/* Section Header */}
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: '#2c3e50',
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}
          >
            Project Gallery
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ 
              maxWidth: 600, 
              mx: 'auto', 
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.3rem' }
            }}
          >
            Explore our water infrastructure projects across rural communities. 
            From household connections to large-scale irrigation systems, see the impact of clean water access.
          </Typography>
        </Box>

        {/* Category Filter */}
        <Box display="flex" justifyContent="center" mb={4}>
          <ButtonGroup
            variant="outlined"
            sx={{
              flexWrap: 'wrap',
              gap: 1,
              '& .MuiButton-root': {
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1.1rem',
                padding: '10px 20px',
              }
            }}
          >
            {categories.map((category) => (
              <Button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                variant={selectedCategory === category.key ? "contained" : "outlined"}
                color={category.color as any}
                sx={{
                  mb: { xs: 1, sm: 0 },
                  minWidth: { xs: '140px', sm: '120px' },
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
              >
                {category.label}
              </Button>
            ))}
          </ButtonGroup>
        </Box>

        {/* Gallery Grid */}
        <Grid container spacing={3}>
          {loading ? (
            // Loading skeletons
            Array.from(new Array(9)).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ borderRadius: 3 }}>
                  <Skeleton variant="rectangular" height={250} />
                  <CardContent>
                    <Skeleton variant="text" height={30} />
                    <Skeleton variant="text" height={20} width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            filteredData.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={`${item.title}-${index}`}>
                <Fade in timeout={300 + index * 100}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      }
                    }}
                    onClick={() => setSelectedImage(index)}
                  >
                    <Box position="relative" overflow="hidden">
                      <CardMedia
                        component="img"
                        height="250"
                        image={item.smallImage}
                        alt={item.title}
                        sx={{
                          transition: 'transform 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          }
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.3s ease-in-out',
                          '&:hover': { opacity: 1 }
                        }}
                      >
                        <ZoomInIcon sx={{ color: 'white', fontSize: 40 }} />
                      </Box>
                      
                      {/* Featured Badge */}
                      {item.featured && (
                        <Badge
                          badgeContent={<StarIcon sx={{ fontSize: 16 }} />}
                          color="warning"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            '& .MuiBadge-badge': {
                              backgroundColor: '#ffd700',
                              color: '#000',
                              borderRadius: '50%',
                              width: 32,
                              height: 32,
                              fontSize: '0.75rem'
                            }
                          }}
                        />
                      )}
                      
                      {/* Category Chip */}
                      <Chip
                        label={categories.find(cat => cat.key === item.category)?.label || item.category}
                        size="medium"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          fontWeight: 600,
                          fontSize: '1rem',
                          '& .MuiChip-label': {
                            fontSize: '1rem',
                            fontWeight: 600
                          }
                        }}
                      />
                      
                      {/* Admin Controls - Only show for admin users */}
                      {isAdmin && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 12,
                            right: 12,
                            display: 'flex',
                            gap: 1,
                            opacity: 0,
                            transition: 'opacity 0.3s ease-in-out',
                            '.MuiCard-root:hover &': {
                              opacity: 1
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            sx={{
                              backgroundColor: 'rgba(25, 118, 210, 0.9)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 1)',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                            sx={{
                              backgroundColor: 'rgba(211, 47, 47, 0.9)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(211, 47, 47, 1)',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h5"
                        component="h3"
                        gutterBottom
                        sx={{ 
                          fontWeight: 600, 
                          color: '#2c3e50',
                          fontSize: '1.25rem'
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ 
                          lineHeight: 1.6,
                          fontSize: '1.25rem',
                          fontWeight: 400
                        }}
                      >
                        {item.description}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                        <Typography 
                          variant="body1" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: '1.1rem',
                            fontWeight: 500
                          }}
                        >
                          {item.location}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: '1.1rem',
                            fontWeight: 500
                          }}
                        >
                          {item.date}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))
          )}
        </Grid>

        {/* Enhanced Lightbox Modal */}
        <Dialog
          open={selectedImage !== null}
          onClose={() => setSelectedImage(null)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              overflow: 'hidden'
            }
          }}
        >
          <DialogContent sx={{ p: 0, position: 'relative' }}>
            {selectedImage !== null && filteredData[selectedImage] && (
              <>
                {/* Close Button */}
                <IconButton
                  onClick={() => setSelectedImage(null)}
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                  }}
                >
                  <CloseIcon />
                </IconButton>

                {/* Navigation Arrows */}
                {selectedImage > 0 && (
                  <IconButton
                    onClick={handlePrevImage}
                    sx={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                )}

                {selectedImage < filteredData.length - 1 && (
                  <IconButton
                    onClick={handleNextImage}
                    sx={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                    }}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                )}

                {/* Image */}
                <Box
                  component="img"
                  src={filteredData[selectedImage].largeImage}
                  alt={filteredData[selectedImage].title}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '80vh',
                    objectFit: 'contain',
                    borderRadius: 2
                  }}
                />

                {/* Image Info */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    color: 'white',
                    p: 3
                  }}
                >
                  <Typography 
                    variant="h3" 
                    gutterBottom
                    sx={{ fontSize: '1.8rem', fontWeight: 600 }}
                  >
                    {filteredData[selectedImage].title}
                  </Typography>
                  <Typography 
                    variant="h6"
                    sx={{ 
                      fontSize: '1.3rem', 
                      lineHeight: 1.6,
                      fontWeight: 400,
                      mb: 2
                    }}
                  >
                    {filteredData[selectedImage].description}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    display="block" 
                    mt={1}
                    sx={{ 
                      fontSize: '1.2rem',
                      fontWeight: 500,
                      opacity: 0.9
                    }}
                  >
                    {filteredData[selectedImage].location} • {filteredData[selectedImage].date}
                  </Typography>
                </Box>
              </>
            )}
          </DialogContent>
        </Dialog>
      </Container>

      {/* Add Gallery Item Dialog */}
      <Dialog
        open={addItemDialogOpen}
        onClose={() => setAddItemDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: '#f8f9fa',
            color: '#2c3e50',
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" color="#2c3e50" fontWeight="bold">
              Add New Gallery Item
            </Typography>
            <IconButton onClick={() => setAddItemDialogOpen(false)}>
              <CloseIcon sx={{ color: '#2c3e50' }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title *"
                value={addItemForm.title}
                onChange={(e) => setAddItemForm({ ...addItemForm, title: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={addItemForm.description}
                onChange={(e) => setAddItemForm({ ...addItemForm, description: e.target.value })}
                multiline
                rows={4}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" color="#2c3e50" mb={2}>
                Image Upload Options
              </Typography>
              
              {/* File Upload Section */}
              <Box
                sx={{
                  border: '2px dashed #007bff',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa',
                  cursor: 'pointer',
                  mb: 2,
                  '&:hover': {
                    backgroundColor: '#e9ecef',
                  },
                }}
                onClick={() => document.getElementById('image-file-upload')?.click()}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: '#007bff', mb: 2 }} />
                <Typography variant="body1" color="#2c3e50" mb={1}>
                  Upload Image File
                </Typography>
                <Typography variant="body2" color="#6c757d">
                  Click to browse or drag & drop (JPG, PNG, GIF)
                </Typography>
                <input
                  id="image-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </Box>
              
              {/* OR Divider */}
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <Typography variant="body2" color="#6c757d">
                  OR
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Image URL *"
                value={addItemForm.largeImageUrl}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="https://images.unsplash.com/photo-xyz or direct image URL"
                helperText="Supports Unsplash photo URLs and direct image URLs"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Small Image URL"
                value={addItemForm.smallImageUrl}
                onChange={(e) => setAddItemForm({ ...addItemForm, smallImageUrl: e.target.value })}
                placeholder="https://example.com/image-small.jpg (optional)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={addItemForm.category}
                  onChange={(e) => setAddItemForm({ ...addItemForm, category: e.target.value })}
                  label="Category *"
                >
                  <MenuItem value="Water Infrastructure">Water Infrastructure</MenuItem>
                  <MenuItem value="Community Events">Community Events</MenuItem>
                  <MenuItem value="Agricultural Projects">Agricultural Projects</MenuItem>
                  <MenuItem value="Training Sessions">Training Sessions</MenuItem>
                  <MenuItem value="Equipment Installation">Equipment Installation</MenuItem>
                  <MenuItem value="Environmental Conservation">Environmental Conservation</MenuItem>
                  <MenuItem value="Success Stories">Success Stories</MenuItem>
                  <MenuItem value="Maintenance Work">Maintenance Work</MenuItem>
                  <MenuItem value="Partnerships">Partnerships</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tags"
                value={addItemForm.tags}
                onChange={(e) => setAddItemForm({ ...addItemForm, tags: e.target.value })}
                placeholder="water, community, project (comma separated)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={addItemForm.featured}
                    onChange={(e) => setAddItemForm({ ...addItemForm, featured: e.target.checked })}
                    color="warning"
                  />
                }
                label="Featured Item"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={addItemForm.active}
                    onChange={(e) => setAddItemForm({ ...addItemForm, active: e.target.checked })}
                    color="success"
                  />
                }
                label="Active"
              />
            </Grid>
            
            {/* Image Preview */}
            {imagePreview && (
              <Grid item xs={12}>
                <Typography variant="h6" color="#2c3e50" mb={2}>
                  Image Preview:
                </Typography>
                <Box
                  sx={{
                    border: '2px solid #e0e0e0',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      const nextElement = target.nextElementSibling as HTMLElement;
                      target.style.display = 'none';
                      if (nextElement) {
                        nextElement.style.display = 'block';
                      }
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    color="error" 
                    sx={{ display: 'none', mt: 2 }}
                  >
                    Invalid image URL. Please check the URL and try again.
                  </Typography>
                  {imageFile && (
                    <Typography variant="body2" color="#28a745" sx={{ mt: 1 }}>
                      File: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setAddItemDialogOpen(false)}
            sx={{
              color: '#6c757d',
              borderColor: '#6c757d',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddItemSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#28a745',
              "&:hover": {
                backgroundColor: '#218838',
              },
            }}
          >
            Add Gallery Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Gallery Item Dialog */}
      <Dialog
        open={editItemDialogOpen}
        onClose={() => setEditItemDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: '#f8f9fa',
            color: '#2c3e50',
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" color="#2c3e50" fontWeight="bold">
              Edit Gallery Item
            </Typography>
            <IconButton onClick={() => setEditItemDialogOpen(false)}>
              <CloseIcon sx={{ color: '#2c3e50' }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title *"
                value={editItemForm.title}
                onChange={(e) => setEditItemForm({ ...editItemForm, title: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editItemForm.description}
                onChange={(e) => setEditItemForm({ ...editItemForm, description: e.target.value })}
                multiline
                rows={4}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Large Image URL *"
                value={editItemForm.largeImageUrl}
                onChange={(e) => setEditItemForm({ ...editItemForm, largeImageUrl: e.target.value })}
                required
                placeholder="https://images.unsplash.com/photo-xyz or direct image URL"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Small Image URL"
                value={editItemForm.smallImageUrl}
                onChange={(e) => setEditItemForm({ ...editItemForm, smallImageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/photo-xyz (optional)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={editItemForm.category}
                  onChange={(e) => setEditItemForm({ ...editItemForm, category: e.target.value })}
                  label="Category *"
                >
                  <MenuItem value="Water Infrastructure">Water Infrastructure</MenuItem>
                  <MenuItem value="Community Events">Community Events</MenuItem>
                  <MenuItem value="Agricultural Projects">Agricultural Projects</MenuItem>
                  <MenuItem value="Training Sessions">Training Sessions</MenuItem>
                  <MenuItem value="Equipment Installation">Equipment Installation</MenuItem>
                  <MenuItem value="Environmental Conservation">Environmental Conservation</MenuItem>
                  <MenuItem value="Success Stories">Success Stories</MenuItem>
                  <MenuItem value="Maintenance Work">Maintenance Work</MenuItem>
                  <MenuItem value="Partnerships">Partnerships</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tags"
                value={editItemForm.tags}
                onChange={(e) => setEditItemForm({ ...editItemForm, tags: e.target.value })}
                placeholder="water, community, project (comma separated)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editItemForm.featured}
                    onChange={(e) => setEditItemForm({ ...editItemForm, featured: e.target.checked })}
                    color="warning"
                  />
                }
                label="Featured Item"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editItemForm.active}
                    onChange={(e) => setEditItemForm({ ...editItemForm, active: e.target.checked })}
                    color="success"
                  />
                }
                label="Active"
              />
            </Grid>
            
            {/* Current Image Preview */}
            {editItemForm.largeImageUrl && (
              <Grid item xs={12}>
                <Typography variant="h6" color="#2c3e50" mb={2}>
                  Current Image:
                </Typography>
                <Box
                  sx={{
                    border: '2px solid #e0e0e0',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <img
                    src={editItemForm.largeImageUrl}
                    alt="Current"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      const nextElement = target.nextElementSibling as HTMLElement;
                      target.style.display = 'none';
                      if (nextElement) {
                        nextElement.style.display = 'block';
                      }
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    color="error" 
                    sx={{ display: 'none', mt: 2 }}
                  >
                    Invalid image URL. Please check the URL and try again.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setEditItemDialogOpen(false)}
            sx={{
              color: '#6c757d',
              borderColor: '#6c757d',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditItemSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#007bff',
              "&:hover": {
                backgroundColor: '#0056b3',
              },
            }}
          >
            Update Gallery Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};