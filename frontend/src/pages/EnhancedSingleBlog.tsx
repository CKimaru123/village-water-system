import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Button,
  TextField,
  Paper,
  Breadcrumbs,
  Link,
  Skeleton,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
  Favorite as LikeIcon,
  FavoriteBorder as LikeOutlineIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  WhatsApp as WhatsAppIcon,
  ArrowBack as BackIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { enhancedBlogs, getCategoryById, getRelatedBlogs, EnhancedBlog } from '../data/blogData';

// Comment Interface (for future backend integration)
interface Comment {
  id: number;
  author: string;
  content: string;
  date: string;
  avatar?: string;
  replies?: Comment[];
}

// Mock comments data
const mockComments: Comment[] = [
  {
    id: 1,
    author: "Jane Wanjiru",
    content: "This is exactly what our community needed! We've been struggling with water storage during dry seasons. Thank you for the detailed guide.",
    date: "2024-12-14",
    replies: [
      {
        id: 2,
        author: "Dr. Sarah Kimani",
        content: "I'm glad you found it helpful, Jane! Feel free to reach out if you have any questions about implementation.",
        date: "2024-12-14"
      }
    ]
  },
  {
    id: 3,
    author: "Michael Omondi",
    content: "Great article! I've implemented similar techniques in my village and seen a 60% reduction in waterborne diseases.",
    date: "2024-12-13"
  }
];

// Related Blog Card Component
const RelatedBlogCard: React.FC<{ blog: EnhancedBlog }> = ({ blog }) => {
  const navigate = useNavigate();
  const category = getCategoryById(blog.category);

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
      }}
      onClick={() => navigate(`/blogs/${blog.id}`)}
    >
      <CardMedia
        component="img"
        height="150"
        image={blog.image}
        alt={blog.title}
      />
      <CardContent sx={{ p: 2 }}>
        <Chip
          label={category?.name}
          size="medium"
          sx={{
            backgroundColor: category?.color,
            color: 'white',
            fontSize: '0.9rem',
            mb: 1,
            '& .MuiChip-label': {
              fontSize: '0.9rem'
            }
          }}
        />
        <Typography
          variant="h5"
          sx={{
            fontSize: '1.1rem',
            fontWeight: 600,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {blog.title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            mt: 1,
            fontSize: '1rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {blog.excerpt}
        </Typography>
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem' }}>
            {blog.readTime} min read
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <ViewIcon sx={{ fontSize: '1rem' }} />
            <Typography variant="body2" sx={{ fontSize: '1rem' }}>{blog.views}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Comment Component
const CommentItem: React.FC<{ comment: Comment; isReply?: boolean }> = ({ comment, isReply = false }) => {
  return (
    <Box sx={{ ml: isReply ? 4 : 0, mb: 3 }}>
      <Box display="flex" gap={2}>
        <Avatar sx={{ width: 50, height: 50, fontSize: '1.2rem' }}>
          {comment.author.charAt(0)}
        </Avatar>
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {comment.author}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem' }}>
              {new Date(comment.date).toLocaleDateString()}
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ lineHeight: 1.6, mb: 2, fontSize: '1.1rem', fontWeight: 400 }}>
            {comment.content}
          </Typography>
          <Button size="medium" sx={{ textTransform: 'none', fontSize: '1rem', padding: '6px 12px' }}>
            Reply
          </Button>
        </Box>
      </Box>
      {comment.replies && comment.replies.map(reply => (
        <CommentItem key={reply.id} comment={reply} isReply />
      ))}
    </Box>
  );
};

// Main Enhanced Single Blog Component
const EnhancedSingleBlog: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<EnhancedBlog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<EnhancedBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments] = useState<Comment[]>(mockComments);

  useEffect(() => {
    if (id) {
      const foundBlog = enhancedBlogs.find(b => b.id === parseInt(id));
      if (foundBlog) {
        setBlog(foundBlog);
        setRelatedBlogs(getRelatedBlogs(foundBlog.id, foundBlog.category, 3));
      }
      setLoading(false);
      window.scrollTo(0, 0);
    }
  }, [id]);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = blog?.title || '';
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${title} ${url}`
    };
    
    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
  };

  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      // Here you would typically send the comment to your backend
      console.log('New comment:', newComment);
      setNewComment('');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" height={60} width="60%" />
        <Skeleton variant="rectangular" height={400} sx={{ my: 3 }} />
        <Skeleton variant="text" height={30} />
        <Skeleton variant="text" height={30} />
        <Skeleton variant="text" height={30} width="80%" />
      </Container>
    );
  }

  if (!blog) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>Blog post not found</Typography>
        <Button variant="contained" onClick={() => navigate('/blogs')}>
          Back to Blogs
        </Button>
      </Container>
    );
  }

  const category = getCategoryById(blog.category);

  return (
    <Box sx={{ backgroundColor: '#f8f9fa', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="lg">
        {/* Top Spacing */}
        <Box sx={{ pt: 6 }}>
          {/* Breadcrumbs */}
          <Breadcrumbs sx={{ mb: 4, fontSize: '1rem' }}>
            <Link
              color="inherit"
              href="/"
              sx={{ 
                textDecoration: 'none', 
                '&:hover': { textDecoration: 'underline' },
                fontSize: '1rem'
              }}
            >
              Home
            </Link>
            <Link
              color="inherit"
              href="/blogs"
              sx={{ 
                textDecoration: 'none', 
                '&:hover': { textDecoration: 'underline' },
                fontSize: '1rem'
              }}
            >
              Blogs
            </Link>
            <Typography color="text.primary" sx={{ fontSize: '1rem' }}>{blog.title}</Typography>
          </Breadcrumbs>

          {/* Back Button */}
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/blogs')}
            sx={{ 
              mb: 4, 
              textTransform: 'none',
              fontSize: '1.1rem',
              padding: '10px 20px'
            }}
          >
            Back to Articles
          </Button>
        </Box>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
              {/* Article Header */}
              <Box mb={4}>
                <Chip
                  label={category?.name}
                  sx={{
                    backgroundColor: category?.color,
                    color: 'white',
                    fontWeight: 600,
                    mb: 2,
                    fontSize: '0.9rem'
                  }}
                />
                <Typography
                  variant="h2"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '2.2rem', md: '3rem' },
                    lineHeight: 1.2,
                    color: '#2c3e50'
                  }}
                >
                  {blog.title}
                </Typography>
                
                {/* Author and Meta Info */}
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={3}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 50, height: 50 }}>
                      {blog.author.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.2rem' }}>
                        {blog.author.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                        {new Date(blog.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TimeIcon sx={{ fontSize: '1.3rem', color: 'text.secondary' }} />
                      <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{blog.readTime} min read</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ViewIcon sx={{ fontSize: '1.3rem', color: 'text.secondary' }} />
                      <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{blog.views.toLocaleString()} views</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Featured Image */}
              <Box
                component="img"
                src={blog.image}
                alt={blog.title}
                sx={{
                  width: '100%',
                  height: { xs: 250, md: 400 },
                  objectFit: 'cover',
                  borderRadius: 2,
                  mb: 4
                }}
              />

              {/* Article Content */}
              <Typography
                variant="h4"
                sx={{
                  fontSize: '1.4rem',
                  lineHeight: 1.8,
                  color: 'text.secondary',
                  mb: 4,
                  fontStyle: 'italic',
                  fontWeight: 400
                }}
              >
                {blog.excerpt}
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  fontSize: '1.2rem',
                  lineHeight: 1.8,
                  mb: 4,
                  fontWeight: 400,
                  '& p': { mb: 3 }
                }}
              >
                {blog.content}
              </Typography>

              {/* Tags */}
              <Box mb={4}>
                <Typography variant="h5" gutterBottom sx={{ fontSize: '1.3rem', fontWeight: 600 }}>
                  Tags
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {blog.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      variant="outlined"
                      size="medium"
                      sx={{ 
                        fontSize: '1rem',
                        '& .MuiChip-label': {
                          fontSize: '1rem',
                          padding: '8px 12px'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Social Actions */}
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                <Box display="flex" alignItems="center" gap={3}>
                  <IconButton
                    onClick={() => setLiked(!liked)}
                    color={liked ? 'error' : 'default'}
                    sx={{ p: 1.5 }}
                  >
                    {liked ? <LikeIcon sx={{ fontSize: '1.5rem' }} /> : <LikeOutlineIcon sx={{ fontSize: '1.5rem' }} />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{blog.likes + (liked ? 1 : 0)} likes</Typography>
                  
                  <IconButton sx={{ p: 1.5 }}>
                    <CommentIcon sx={{ fontSize: '1.5rem' }} />
                  </IconButton>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{comments.length} comments</Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6" sx={{ mr: 1, fontSize: '1.1rem' }}>Share:</Typography>
                  <IconButton size="medium" onClick={() => handleShare('facebook')}>
                    <FacebookIcon sx={{ fontSize: '1.3rem' }} />
                  </IconButton>
                  <IconButton size="medium" onClick={() => handleShare('twitter')}>
                    <TwitterIcon sx={{ fontSize: '1.3rem' }} />
                  </IconButton>
                  <IconButton size="medium" onClick={() => handleShare('linkedin')}>
                    <LinkedInIcon sx={{ fontSize: '1.3rem' }} />
                  </IconButton>
                  <IconButton size="medium" onClick={() => handleShare('whatsapp')}>
                    <WhatsAppIcon sx={{ fontSize: '1.3rem' }} />
                  </IconButton>
                </Box>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Author Bio */}
              {blog.author.bio && (
                <Box mb={4}>
                  <Typography variant="h4" gutterBottom sx={{ fontSize: '1.4rem', fontWeight: 600 }}>
                    About the Author
                  </Typography>
                  <Box display="flex" gap={3}>
                    <Avatar sx={{ width: 70, height: 70, fontSize: '1.5rem' }}>
                      {blog.author.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, fontSize: '1.2rem' }}>
                        {blog.author.name}
                      </Typography>
                      <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: '1.1rem' }}>
                        {blog.author.bio}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              <Divider sx={{ mb: 4 }} />

              {/* Comments Section */}
              <Box>
                <Typography variant="h4" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 600 }}>
                  Comments ({comments.length})
                </Typography>

                {/* Add Comment Form */}
                <Box mb={4}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Share your thoughts..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    sx={{ 
                      mb: 2,
                      '& .MuiInputBase-input': {
                        fontSize: '1.1rem'
                      },
                      '& .MuiInputBase-root': {
                        fontSize: '1.1rem'
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    endIcon={<SendIcon sx={{ fontSize: '1.2rem' }} />}
                    onClick={handleCommentSubmit}
                    disabled={!newComment.trim()}
                    sx={{ 
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      padding: '10px 20px'
                    }}
                  >
                    Post Comment
                  </Button>
                </Box>

                {/* Comments List */}
                {comments.map(comment => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Related Posts */}
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="h4" gutterBottom sx={{ fontSize: '1.4rem', fontWeight: 600 }}>
                Related Articles
              </Typography>
              <Grid container spacing={2}>
                {relatedBlogs.map(relatedBlog => (
                  <Grid item xs={12} key={relatedBlog.id}>
                    <RelatedBlogCard blog={relatedBlog} />
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Newsletter Signup */}
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom sx={{ fontSize: '1.3rem', fontWeight: 600 }}>
                Stay Updated
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 400 }}>
                Get the latest articles about water management and sustainability delivered to your inbox.
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter your email"
                sx={{ 
                  mb: 2,
                  '& .MuiInputBase-input': {
                    fontSize: '1.1rem',
                    padding: '14px'
                  }
                }}
              />
              <Button
                variant="contained"
                fullWidth
                sx={{ 
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  padding: '12px 24px'
                }}
              >
                Subscribe
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default EnhancedSingleBlog;