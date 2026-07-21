import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
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
  TextField,
  InputAdornment,
  Avatar,
  Fade,
  Skeleton,
  useTheme,
  useMediaQuery,
  Pagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
  Favorite as LikeIcon,
  Comment as CommentIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { enhancedBlogs, blogCategories, getFeaturedBlogs, getBlogsByCategory, getCategoryById, EnhancedBlog } from '../data/blogData';

// Enhanced blog item interface from database
interface EnhancedBlogItem {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  categoryInfo?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  image: string;
  author: {
    name: string;
    email?: string;
  };
  tags: string[];
  featured: boolean;
  published: boolean;
  readTime: number;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  formattedPublishedAt?: string;
  date: string; // Make date required for compatibility
  slug?: string; // Add slug field for API operations
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
      🔧 Admin Mode: You can add, edit, and delete blog posts
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
        Add New Blog Post
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

// Featured Blog Slider Component
const FeaturedBlogSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const featuredBlogs = getFeaturedBlogs();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredBlogs.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredBlogs.length]);

  const handleSlideClick = (blogId: number) => {
    navigate(`/blogs/${blogId}`);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: 300, md: 500 },
        borderRadius: 3,
        overflow: 'hidden',
        mb: 6,
        cursor: 'pointer'
      }}
      onClick={() => handleSlideClick(featuredBlogs[currentSlide].id)}
    >
      {featuredBlogs.map((blog, index) => (
        <Fade key={blog.id} in={index === currentSlide} timeout={1000}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${blog.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'end',
              p: { xs: 3, md: 6 },
            }}
          >
            <Box sx={{ color: 'white', maxWidth: '70%' }}>
              <Chip
                label={getCategoryById(blog.category)?.name}
                sx={{
                  backgroundColor: getCategoryById(blog.category)?.color,
                  color: 'white',
                  fontWeight: 600,
                  mb: 2,
                  fontSize: '1.1rem',
                  '& .MuiChip-label': {
                    fontSize: '1.1rem',
                    padding: '10px 16px'
                  }
                }}
              />
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.8rem', md: '2.5rem' },
                  lineHeight: 1.2,
                  mb: 2
                }}
              >
                {blog.title}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontSize: { xs: '1.3rem', md: '1.5rem' },
                  opacity: 0.95,
                  mb: 4,
                  lineHeight: 1.5,
                  fontWeight: 400
                }}
              >
                {blog.excerpt}
              </Typography>
              <Box display="flex" alignItems="center" gap={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <TimeIcon sx={{ fontSize: '1.3rem' }} />
                  <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{blog.readTime} min read</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <ViewIcon sx={{ fontSize: '1.3rem' }} />
                  <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{blog.views.toLocaleString()} views</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Fade>
      ))}
      
      {/* Slide Indicators */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          display: 'flex',
          gap: 1
        }}
      >
        {featuredBlogs.map((_, index) => (
          <Box
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(index);
            }}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: index === currentSlide ? 'white' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

// Blog Card Component
const BlogCard: React.FC<{ 
  blog: EnhancedBlog | EnhancedBlogItem; 
  isAdmin?: boolean; 
  onEdit?: (blog: EnhancedBlog | EnhancedBlogItem) => void; 
  onDelete?: (blog: EnhancedBlog | EnhancedBlogItem) => void; 
}> = ({ blog, isAdmin = false, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const category = getCategoryById(blog.category);

  return (
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
      onClick={() => navigate(`/blogs/${blog.id}`)}
    >
      <Box position="relative">
        <CardMedia
          component="img"
          height="200"
          image={blog.image}
          alt={blog.title}
          sx={{
            transition: 'transform 0.3s ease-in-out',
            '&:hover': { transform: 'scale(1.05)' }
          }}
        />
        <Chip
          label={category?.name}
          size="medium"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            backgroundColor: category?.color,
            color: 'white',
            fontWeight: 600,
            fontSize: '1rem',
            '& .MuiChip-label': {
              fontSize: '1rem',
              padding: '8px 12px'
            }
          }}
        />
        
        {/* Featured Badge */}
        {blog.featured && (
          <Chip
            label="Featured"
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: '#ffd700',
              color: '#000',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          />
        )}
        
        {/* Admin Controls - Only show for admin users */}
        {isAdmin && onEdit && onDelete && (
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
                onEdit(blog);
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
                onDelete(blog);
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
          variant="h4"
          component="h3"
          gutterBottom
          sx={{
            fontWeight: 600,
            fontSize: '1.4rem',
            lineHeight: 1.3,
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {blog.title}
        </Typography>
        
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            lineHeight: 1.6,
            mb: 3,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '1.2rem',
            fontWeight: 400
          }}
        >
          {blog.excerpt}
        </Typography>

        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 40, height: 40, fontSize: '1rem' }}>
              {blog.author.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                {blog.author.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                {blog.date ? new Date(blog.date).toLocaleDateString() : 'No date'}
              </Typography>
            </Box>
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            {blog.readTime} min read
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <ViewIcon sx={{ fontSize: '1.3rem', color: 'text.secondary' }} />
              <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{blog.views}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <LikeIcon sx={{ fontSize: '1.3rem', color: 'text.secondary' }} />
              <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{blog.likes}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <CommentIcon sx={{ fontSize: '1.3rem', color: 'text.secondary' }} />
              <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{blog.comments}</Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Read More Button */}
        <Box display="flex" justifyContent="center" mt={2}>
          <Button
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/blogs/${blog.id}`);
            }}
            sx={{
              backgroundColor: '#2196f3',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              padding: '10px 24px',
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
              '&:hover': {
                backgroundColor: '#1976d2',
                boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Read More
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Main Enhanced Blogs Component
const EnhancedBlogs: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBlogs, setFilteredBlogs] = useState<EnhancedBlog[]>(enhancedBlogs);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [blogItems, setBlogItems] = useState<EnhancedBlogItem[]>([]);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EnhancedBlogItem | null>(null);
  const [addItemForm, setAddItemForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    image: "",
    authorName: "",
    authorEmail: "",
    tags: "",
    featured: false,
    published: true
  });
  const [editItemForm, setEditItemForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    image: "",
    authorName: "",
    authorEmail: "",
    tags: "",
    featured: false,
    published: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>("");
  const blogsPerPage = 9;

  // Load blog items from database
  const loadBlogItems = async () => {
    const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/blog_posts`);
      const result = await response.json();
      
      if (result.success) {
        setBlogItems(result.data.blog_posts);
      } else {
        console.error('Failed to load blog posts:', result.message);
        // Fallback to static data
        setBlogItems([]);
      }
    } catch (error) {
      console.error('Error loading blog posts:', error);
      // Fallback to static data
      setBlogItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Get actual data source for counting
  const getDataSource = (): (EnhancedBlog | EnhancedBlogItem)[] => {
    return isAdmin && blogItems.length > 0 ? blogItems : enhancedBlogs;
  };

  // Get category counts from actual data
  const getCategoryCount = (categoryId: string) => {
    const dataSource = getDataSource();
    if (categoryId === 'all') {
      return dataSource.length;
    }
    return (dataSource as (EnhancedBlog | EnhancedBlogItem)[]).filter(blog => blog.category === categoryId).length;
  };

  // Force re-render when blog items change to update counts
  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [blogItems]);

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

  // Handle file upload for Add form
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        // Check file size (limit to 2MB for data URL storage)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
          alert('File size too large. Please select an image smaller than 2MB.');
          return;
        }
        
        setImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        // Clear URL field when file is selected
        setAddItemForm({ ...addItemForm, image: "" });
      } else {
        alert('Please select an image file (JPG, PNG, GIF, etc.)');
      }
    }
  };

  // Handle file upload for Edit form
  const handleEditFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        // Check file size (limit to 2MB for data URL storage)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
          alert('File size too large. Please select an image smaller than 2MB.');
          return;
        }
        
        setEditImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setEditImagePreview(previewUrl);
        // Clear URL field when file is selected
        setEditItemForm({ ...editItemForm, image: "" });
      } else {
        alert('Please select an image file (JPG, PNG, GIF, etc.)');
      }
    }
  };

  // Handle URL change and preview for Add form
  const handleImageUrlChange = (url: string) => {
    setAddItemForm({ ...addItemForm, image: url });
    if (url) {
      const directUrl = convertToDirectImageUrl(url);
      setImagePreview(directUrl);
      // Clear file when URL is entered
      setImageFile(null);
    } else {
      setImagePreview("");
    }
  };

  // Handle URL change and preview for Edit form
  const handleEditImageUrlChange = (url: string) => {
    setEditItemForm({ ...editItemForm, image: url });
    if (url) {
      const directUrl = convertToDirectImageUrl(url);
      setEditImagePreview(directUrl);
      // Clear file when URL is entered
      setEditImageFile(null);
    } else {
      setEditImagePreview("");
    }
  };
  useEffect(() => {
    if (isAdmin) {
      loadBlogItems();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // Handle admin actions
  const handleAddNew = () => {
    setAddItemDialogOpen(true);
  };

  const handleRefresh = () => {
    if (isAdmin) {
      alert('Refreshing blog posts...');
      loadBlogItems();
    }
  };

  const handleEdit = async (item: EnhancedBlog | EnhancedBlogItem) => {
    // Check if this is a static blog post (from enhancedBlogs) or database post
    const isStaticPost = !isAdmin || !blogItems.some(dbItem => dbItem.id === item.id);
    
    if (isStaticPost) {
      alert('This is a demo blog post. Only database blog posts can be edited. Please create a new blog post to test editing functionality.');
      return;
    }

    try {
      // Fetch the full blog post content for editing
      const token = user?.token || localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const identifier = (item as EnhancedBlogItem).slug || item.id;
      const response = await fetch(`${BASE_URL}/blog_posts/${identifier}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        const fullBlogItem = result.data.blog_post;
        setEditingItem(fullBlogItem);
        setEditItemForm({
          title: fullBlogItem.title,
          excerpt: fullBlogItem.excerpt,
          content: fullBlogItem.content || "",
          category: fullBlogItem.category,
          image: fullBlogItem.image,
          authorName: fullBlogItem.author.name,
          authorEmail: fullBlogItem.author.email || "",
          tags: Array.isArray(fullBlogItem.tags) ? fullBlogItem.tags.join(', ') : (fullBlogItem.tags || ""),
          featured: fullBlogItem.featured,
          published: fullBlogItem.published !== undefined ? fullBlogItem.published : true
        });
        setEditImagePreview(fullBlogItem.image);
        setEditImageFile(null);
        setEditItemDialogOpen(true);
      } else {
        alert('Failed to load blog post details: ' + result.message);
      }
    } catch (error) {
      console.error('Error loading blog post for editing:', error);
      alert('Error loading blog post details. Please try again.');
    }
  };

  const handleDelete = async (item: EnhancedBlog | EnhancedBlogItem) => {
    // Check if this is a static blog post (from enhancedBlogs) or database post
    const isStaticPost = !isAdmin || !blogItems.some(dbItem => dbItem.id === item.id);
    
    if (isStaticPost) {
      alert('This is a demo blog post. Only database blog posts can be deleted. Please create a new blog post to test delete functionality.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      try {
        const token = user?.token || localStorage.getItem('token');
        // Use slug if available, otherwise use ID
        const identifier = (item as EnhancedBlogItem).slug || item.id;
        const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
        const response = await fetch(`${BASE_URL}/blog_posts/${identifier}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        if (result.success) {
          alert('Blog post deleted successfully!');
          // Refresh the blog items
          loadBlogItems();
        } else {
          alert('Failed to delete post: ' + result.message);
        }
      } catch (error) {
        console.error('Error deleting blog post:', error);
        alert('Error deleting post. Please try again.');
      }
    }
  };

  const handleAddItemSubmit = async () => {
    if (!addItemForm.title || !addItemForm.excerpt || !addItemForm.category) {
      alert('Please fill in all required fields (Title, Excerpt, and Category)');
      return;
    }

    if (addItemForm.content && addItemForm.content.length < 100) {
      alert('Content must be at least 100 characters long. Current length: ' + addItemForm.content.length);
      return;
    }

    try {
      const token = user?.token || localStorage.getItem('token');
      let imageUrl = addItemForm.image;
      
      // Handle image upload - convert file to base64 data URL for demo purposes
      // In production, you'd upload to cloud storage and get a URL
      if (imageFile) {
        // Convert file to base64 data URL
        const reader = new FileReader();
        const filePromise = new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        
        try {
          imageUrl = await filePromise;
          console.log('Using uploaded file as base64 data URL');
        } catch (error) {
          console.error('Error converting file to base64:', error);
          imageUrl = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80';
          alert('Error processing uploaded file. Using placeholder image.');
        }
      } else if (imageUrl) {
        // Convert Unsplash URLs to direct image URLs
        imageUrl = convertToDirectImageUrl(imageUrl);
      } else {
        // Provide a default image if none is specified
        imageUrl = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80';
      }
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/blog_posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blog_post: {
            title: addItemForm.title,
            excerpt: addItemForm.excerpt,
            content: addItemForm.content || '',
            category_id: addItemForm.category,
            image_url: imageUrl,
            author_name: addItemForm.authorName || (user ? `${user.first_name} ${user.last_name}` : 'Admin'),
            author_email: addItemForm.authorEmail || user?.email || '',
            tags: addItemForm.tags,
            featured: addItemForm.featured,
            published: addItemForm.published
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Blog post created successfully!');
        // Reset form and close dialog
        setAddItemForm({
          title: "",
          excerpt: "",
          content: "",
          category: "",
          image: "",
          authorName: "",
          authorEmail: "",
          tags: "",
          featured: false,
          published: true
        });
        setImageFile(null);
        setImagePreview("");
        setAddItemDialogOpen(false);
        // Refresh the blog items
        loadBlogItems();
      } else {
        const errorMessage = result.errors && result.errors.length > 0 
          ? 'Failed to create post: ' + result.errors.join(', ')
          : 'Failed to create post: ' + result.message;
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error creating blog post:', error);
      alert('Error creating post. Please try again.');
    }
  };

  const handleEditItemSubmit = async () => {
    if (!editingItem || !editItemForm.title || !editItemForm.excerpt || !editItemForm.category) {
      alert('Please fill in all required fields (Title, Excerpt, and Category)');
      return;
    }

    if (editItemForm.content && editItemForm.content.length < 100) {
      alert('Content must be at least 100 characters long. Current length: ' + editItemForm.content.length);
      return;
    }

    try {
      const token = user?.token || localStorage.getItem('token');
      let imageUrl = editItemForm.image;
      
      // Handle image upload - convert file to base64 data URL for demo purposes
      // In production, you'd upload to cloud storage and get a URL
      if (editImageFile) {
        // Convert file to base64 data URL
        const reader = new FileReader();
        const filePromise = new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(editImageFile);
        });
        
        try {
          imageUrl = await filePromise;
          console.log('Using uploaded file as base64 data URL');
        } catch (error) {
          console.error('Error converting file to base64:', error);
          // Keep the existing image URL if file conversion fails
          imageUrl = editItemForm.image;
          alert('Error processing uploaded file. Keeping existing image.');
        }
      } else if (imageUrl) {
        // Convert Unsplash URLs to direct image URLs
        imageUrl = convertToDirectImageUrl(imageUrl);
      }

      // Use slug if available, otherwise use ID
      const identifier = editingItem.slug || editingItem.id;
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/blog_posts/${identifier}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blog_post: {
            title: editItemForm.title,
            excerpt: editItemForm.excerpt,
            content: editItemForm.content || '',
            category_id: editItemForm.category,
            image_url: imageUrl,
            author_name: editItemForm.authorName,
            author_email: editItemForm.authorEmail,
            tags: editItemForm.tags,
            featured: editItemForm.featured,
            published: editItemForm.published
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Blog post updated successfully!');
        // Reset form and close dialog
        setEditItemForm({
          title: "",
          excerpt: "",
          content: "",
          category: "",
          image: "",
          authorName: "",
          authorEmail: "",
          tags: "",
          featured: false,
          published: true
        });
        setEditingItem(null);
        setEditImageFile(null);
        setEditImagePreview("");
        setEditItemDialogOpen(false);
        // Refresh the blog items
        loadBlogItems();
      } else {
        const errorMessage = result.errors && result.errors.length > 0 
          ? 'Failed to update post: ' + result.errors.join(', ')
          : 'Failed to update post: ' + result.message;
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error updating blog post:', error);
      alert('Error updating post. Please try again.');
    }
  };

  // Filter blogs based on category and search
  useEffect(() => {
    let filtered: (EnhancedBlog | EnhancedBlogItem)[] = isAdmin && blogItems.length > 0 ? blogItems : enhancedBlogs;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(blog => blog.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(blog.tags) ? blog.tags : []).some((tag: string) => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Convert to EnhancedBlog format for compatibility
    const compatibleFiltered = filtered.map(blog => ({
      ...blog,
      date: (blog as EnhancedBlogItem).formattedPublishedAt || (blog as EnhancedBlog).date || new Date().toISOString()
    })) as EnhancedBlog[];
    
    setFilteredBlogs(compatibleFiltered);
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, blogItems, isAdmin]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Pagination
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
  const startIndex = (currentPage - 1) * blogsPerPage;
  const currentBlogs = filteredBlogs.slice(startIndex, startIndex + blogsPerPage);

  return (
    <Box sx={{ py: 6, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Admin Banner - Only show for admin users */}
        {isAdmin && <AdminBanner />}
        
        {/* Admin Controls - Only show for admin users */}
        {isAdmin && <AdminControls onAddNew={handleAddNew} onRefresh={handleRefresh} />}
        
        {/* Header */}
        <Box textAlign="center" mb={8} sx={{ pt: 8 }}>
          <Typography
            variant="h1"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: '#2c3e50',
              mb: 3,
              fontSize: { xs: '2.5rem', md: '4rem' },
              letterSpacing: '-0.02em'
            }}
          >
            BLOGS
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              maxWidth: 700,
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: { xs: '1.2rem', md: '1.4rem' },
              fontWeight: 400
            }}
          >
            Discover insights, tips, and stories about water management, sustainability, and rural development
          </Typography>
        </Box>

        {/* Featured Blog Slider */}
        <FeaturedBlogSlider />

        {/* Main Content Layout with Sidebar */}
        <Grid container spacing={4}>
          {/* Left Sidebar - Categories */}
          <Grid item xs={12} md={3}>
            <Box
              sx={{
                position: { md: 'sticky' },
                top: { md: 100 },
                height: 'fit-content'
              }}
            >
              {/* Search Section */}
              <Box mb={4}>
                <TextField
                  fullWidth
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      fontSize: '1.1rem',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '1.1rem',
                      padding: '12px'
                    }
                  }}
                />
              </Box>

              {/* Categories Sidebar */}
              <Card
                sx={{
                  borderRadius: 3,
                  backgroundColor: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ p: 3, backgroundColor: '#2c3e50', color: 'white' }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1.3rem',
                      textAlign: 'center'
                    }}
                  >
                    📚 Categories
                  </Typography>
                </Box>
                
                <Box sx={{ p: 2 }}>
                  {/* All Articles Button */}
                  <Button
                    fullWidth
                    onClick={() => setSelectedCategory('all')}
                    variant={selectedCategory === 'all' ? 'contained' : 'text'}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '1rem',
                      padding: '12px 16px',
                      mb: 1,
                      borderRadius: 2,
                      backgroundColor: selectedCategory === 'all' ? '#2c3e50' : 'transparent',
                      color: selectedCategory === 'all' ? 'white' : '#2c3e50',
                      '&:hover': {
                        backgroundColor: selectedCategory === 'all' ? '#34495e' : 'rgba(44, 62, 80, 0.1)'
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography sx={{ fontSize: '1.2rem' }}>📚</Typography>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>All Articles</Typography>
                      </Box>
                      <Chip
                        label={getCategoryCount('all')}
                        size="small"
                        sx={{
                          backgroundColor: selectedCategory === 'all' ? 'rgba(255,255,255,0.2)' : '#2c3e50',
                          color: selectedCategory === 'all' ? 'white' : 'white',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  </Button>

                  {/* Category List */}
                  {blogCategories.map((category) => {
                    const categoryBlogCount = getCategoryCount(category.id);
                    return (
                      <Button
                        key={category.id}
                        fullWidth
                        onClick={() => setSelectedCategory(category.id)}
                        variant={selectedCategory === category.id ? 'contained' : 'text'}
                        sx={{
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: '0.95rem',
                          padding: '10px 16px',
                          mb: 0.5,
                          borderRadius: 2,
                          backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
                          color: selectedCategory === category.id ? 'white' : '#2c3e50',
                          '&:hover': {
                            backgroundColor: selectedCategory === category.id ? category.color : `${category.color}15`
                          }
                        }}
                      >
                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography sx={{ fontSize: '1rem' }}>{category.icon}</Typography>
                            <Typography 
                              sx={{ 
                                fontSize: '0.95rem', 
                                fontWeight: selectedCategory === category.id ? 600 : 500,
                                textAlign: 'left'
                              }}
                            >
                              {category.name}
                            </Typography>
                          </Box>
                          <Chip
                            label={categoryBlogCount}
                            size="small"
                            sx={{
                              backgroundColor: selectedCategory === category.id ? 'rgba(255,255,255,0.2)' : `${category.color}20`,
                              color: selectedCategory === category.id ? 'white' : category.color,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              minWidth: '24px',
                              height: '20px'
                            }}
                          />
                        </Box>
                      </Button>
                    );
                  })}
                </Box>
              </Card>
            </Box>
          </Grid>

          {/* Right Content - Blog Grid */}
          <Grid item xs={12} md={9}>
            {/* Current Category Header */}
            <Box mb={4}>
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#2c3e50',
                  fontSize: { xs: '1.6rem', md: '2rem' }
                }}
              >
                {selectedCategory === 'all' 
                  ? `All Articles (${getCategoryCount('all')})` 
                  : `${getCategoryById(selectedCategory)?.icon} ${getCategoryById(selectedCategory)?.name} (${getCategoryCount(selectedCategory)})`
                }
              </Typography>
              {selectedCategory !== 'all' && (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontSize: '1.1rem', mb: 2 }}
                >
                  {getCategoryById(selectedCategory)?.description}
                </Typography>
              )}
            </Box>

            {/* Blog Grid */}
            <Grid container spacing={3}>
              {loading ? (
                // Loading skeletons
                Array.from(new Array(6)).map((_, index) => (
                  <Grid item xs={12} sm={6} lg={4} key={index}>
                    <Card sx={{ borderRadius: 3 }}>
                      <Skeleton variant="rectangular" height={200} />
                      <CardContent>
                        <Skeleton variant="text" height={30} />
                        <Skeleton variant="text" height={20} width="80%" />
                        <Skeleton variant="text" height={20} width="60%" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                currentBlogs.map((blog, index) => (
                  <Grid item xs={12} sm={6} lg={4} key={blog.id}>
                    <Fade in timeout={300 + index * 100}>
                      <div>
                        <BlogCard 
                          blog={blog} 
                          isAdmin={isAdmin}
                          onEdit={isAdmin ? handleEdit : undefined}
                          onDelete={isAdmin ? handleDelete : undefined}
                        />
                      </div>
                    </Fade>
                  </Grid>
                ))
              )}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={6}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                  size="large"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      fontSize: '1rem'
                    }
                  }}
                />
              </Box>
            )}

            {/* No Results */}
            {!loading && filteredBlogs.length === 0 && (
              <Box textAlign="center" py={8}>
                <Typography variant="h5" gutterBottom>
                  No articles found
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Try adjusting your search terms or selecting a different category
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Add Blog Post Dialog */}
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
              Add New Blog Post
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
                label="Excerpt *"
                value={addItemForm.excerpt}
                onChange={(e) => setAddItemForm({ ...addItemForm, excerpt: e.target.value })}
                multiline
                rows={3}
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                value={addItemForm.content}
                onChange={(e) => setAddItemForm({ ...addItemForm, content: e.target.value })}
                multiline
                rows={6}
                sx={{ mb: 2 }}
                helperText={`${addItemForm.content.length}/100 characters minimum required`}
                error={addItemForm.content.length > 0 && addItemForm.content.length < 100}
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
                  {blogCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                onClick={() => document.getElementById('blog-image-file-upload')?.click()}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: '#007bff', mb: 2 }} />
                <Typography variant="body1" color="#2c3e50" mb={1}>
                  Upload Image File
                </Typography>
                <Typography variant="body2" color="#6c757d">
                  Click to browse or drag & drop (JPG, PNG, GIF - Max 2MB)
                </Typography>
                <input
                  id="blog-image-file-upload"
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
                label="Image URL"
                value={addItemForm.image}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="https://images.unsplash.com/photo-xyz or direct image URL"
                helperText="Supports Unsplash photo URLs and direct image URLs"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Author Name"
                value={addItemForm.authorName}
                onChange={(e) => setAddItemForm({ ...addItemForm, authorName: e.target.value })}
                placeholder="Author name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Author Email"
                value={addItemForm.authorEmail}
                onChange={(e) => setAddItemForm({ ...addItemForm, authorEmail: e.target.value })}
                placeholder="author@example.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags"
                value={addItemForm.tags}
                onChange={(e) => setAddItemForm({ ...addItemForm, tags: e.target.value })}
                placeholder="water, health, community (comma separated)"
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
                label="Featured Post"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={addItemForm.published}
                    onChange={(e) => setAddItemForm({ ...addItemForm, published: e.target.checked })}
                    color="success"
                  />
                }
                label="Published"
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
            Add Blog Post
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Blog Post Dialog */}
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
              Edit Blog Post
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
                label="Excerpt *"
                value={editItemForm.excerpt}
                onChange={(e) => setEditItemForm({ ...editItemForm, excerpt: e.target.value })}
                multiline
                rows={3}
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                value={editItemForm.content}
                onChange={(e) => setEditItemForm({ ...editItemForm, content: e.target.value })}
                multiline
                rows={6}
                sx={{ mb: 2 }}
                helperText={`${editItemForm.content.length}/100 characters minimum required`}
                error={editItemForm.content.length > 0 && editItemForm.content.length < 100}
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
                  {blogCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                onClick={() => document.getElementById('edit-blog-image-file-upload')?.click()}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: '#007bff', mb: 2 }} />
                <Typography variant="body1" color="#2c3e50" mb={1}>
                  Upload New Image File
                </Typography>
                <Typography variant="body2" color="#6c757d">
                  Click to browse or drag & drop (JPG, PNG, GIF - Max 2MB)
                </Typography>
                <input
                  id="edit-blog-image-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleEditFileUpload}
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
                label="Image URL"
                value={editItemForm.image}
                onChange={(e) => handleEditImageUrlChange(e.target.value)}
                placeholder="https://images.unsplash.com/photo-xyz or direct image URL"
                helperText="Supports Unsplash photo URLs and direct image URLs"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Author Name"
                value={editItemForm.authorName}
                onChange={(e) => setEditItemForm({ ...editItemForm, authorName: e.target.value })}
                placeholder="Author name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Author Email"
                value={editItemForm.authorEmail}
                onChange={(e) => setEditItemForm({ ...editItemForm, authorEmail: e.target.value })}
                placeholder="author@example.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags"
                value={editItemForm.tags}
                onChange={(e) => setEditItemForm({ ...editItemForm, tags: e.target.value })}
                placeholder="water, health, community (comma separated)"
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
                label="Featured Post"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editItemForm.published}
                    onChange={(e) => setEditItemForm({ ...editItemForm, published: e.target.checked })}
                    color="success"
                  />
                }
                label="Published"
              />
            </Grid>
            
            {/* Current Image Preview */}
            {editImagePreview && (
              <Grid item xs={12}>
                <Typography variant="h6" color="#2c3e50" mb={2}>
                  {editImageFile ? 'New Image Preview:' : 'Current Image:'}
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
                    src={editImagePreview}
                    alt={editImageFile ? 'New Preview' : 'Current'}
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
                  {editImageFile && (
                    <Typography variant="body2" color="#28a745" sx={{ mt: 1 }}>
                      New File: {editImageFile.name} ({(editImageFile.size / 1024 / 1024).toFixed(2)} MB)
                    </Typography>
                  )}
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
            Update Blog Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedBlogs;