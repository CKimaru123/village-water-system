import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider as MuiSlider,
  Paper,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Star as StarIcon,
  Add as AddIcon,
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Agriculture as AgricultureIcon,
  Water as WaterIcon,
  Build as BuildIcon,
  Support as SupportIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Types
interface MarketplaceAd {
  id: string;
  title: string;
  description: string;
  price?: number;
  priceType: 'fixed' | 'contact';
  image: string;
  category: string;
  advertiser: {
    name: string;
    company: string;
    avatar: string;
    rating: number;
    reviews: number;
  };
  location: string;
  contact: {
    phone: string;
    email: string;
  };
  featured: boolean;
  datePosted: string;
}

interface FeaturedBusiness {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: string;
  link: string;
}

interface PremiumAd {
  id: string;
  title: string;
  description: string;
  image: string;
  advertiser: {
    name: string;
    logo: string;
    category: string;
  };
  ctaText: string;
  ctaLink: string;
  featured: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Mock Data
const mockAds: MarketplaceAd[] = [
  {
    id: '1',
    title: '5000L Plastic Water Tank',
    description: 'High-quality polyethylene water storage tank. Perfect for rainwater harvesting and water storage.',
    price: 45000,
    priceType: 'fixed',
    image: '/img/portfolio/water 1.avif',
    category: 'Tanks',
    advertiser: {
      name: 'John Mwangi',
      company: 'Aqua Solutions Ltd',
      avatar: '/img/team/01.jpg',
      rating: 4.8,
      reviews: 127,
    },
    location: 'Nairobi, Kenya',
    contact: {
      phone: '+254 712 345 678',
      email: 'john@aquasolutions.co.ke',
    },
    featured: true,
    datePosted: '2024-01-15',
  },
  {
    id: '2',
    title: 'Drip Irrigation System',
    description: 'Complete drip irrigation kit for small to medium farms. Includes pipes, emitters, and filters.',
    price: 25000,
    priceType: 'fixed',
    image: '/img/portfolio/Irrigation 2.avif',
    category: 'Irrigation',
    advertiser: {
      name: 'Sarah Kimani',
      company: 'FarmTech Solutions',
      avatar: '/img/team/02.jpg',
      rating: 4.6,
      reviews: 89,
    },
    location: 'Nakuru, Kenya',
    contact: {
      phone: '+254 723 456 789',
      email: 'sarah@farmtech.co.ke',
    },
    featured: false,
    datePosted: '2024-01-14',
  },
  {
    id: '3',
    title: 'Professional Plumbing Services',
    description: 'Expert plumbing services for water systems, repairs, and installations. Licensed and insured.',
    priceType: 'contact',
    image: '/img/portfolio/water from sink.avif',
    category: 'Services',
    advertiser: {
      name: 'Peter Ochieng',
      company: 'AquaFlow Plumbing',
      avatar: '/img/team/03.jpg',
      rating: 4.9,
      reviews: 203,
    },
    location: 'Mombasa, Kenya',
    contact: {
      phone: '+254 734 567 890',
      email: 'peter@aquaflow.co.ke',
    },
    featured: true,
    datePosted: '2024-01-13',
  },
  {
    id: '4',
    title: 'Livestock Water Troughs',
    description: 'Heavy-duty galvanized steel water troughs for cattle, goats, and sheep. Various sizes available.',
    price: 15000,
    priceType: 'fixed',
    image: '/img/portfolio/water 2.avif',
    category: 'Livestock',
    advertiser: {
      name: 'Mary Wanjiku',
      company: 'Livestock Solutions',
      avatar: '/img/team/04.jpg',
      rating: 4.7,
      reviews: 156,
    },
    location: 'Eldoret, Kenya',
    contact: {
      phone: '+254 745 678 901',
      email: 'mary@livestock.co.ke',
    },
    featured: false,
    datePosted: '2024-01-12',
  },
  {
    id: '5',
    title: 'PVC Pipes & Fittings',
    description: 'High-quality PVC pipes and fittings for water distribution systems. Various diameters available.',
    price: 8000,
    priceType: 'fixed',
    image: '/img/portfolio/water 3.avif',
    category: 'Pipes',
    advertiser: {
      name: 'David Kiprop',
      company: 'PipeMaster Kenya',
      avatar: '/img/team/01.jpg',
      rating: 4.5,
      reviews: 98,
    },
    location: 'Kisumu, Kenya',
    contact: {
      phone: '+254 756 789 012',
      email: 'david@pipemaster.co.ke',
    },
    featured: false,
    datePosted: '2024-01-11',
  },
  {
    id: '6',
    title: 'Water Pump Installation',
    description: 'Professional water pump installation and maintenance services. Solar and electric pumps available.',
    priceType: 'contact',
    image: '/img/portfolio/water 4.avif',
    category: 'Services',
    advertiser: {
      name: 'Grace Akinyi',
      company: 'PumpTech Services',
      avatar: '/img/team/02.jpg',
      rating: 4.8,
      reviews: 142,
    },
    location: 'Thika, Kenya',
    contact: {
      phone: '+254 767 890 123',
      email: 'grace@pumptech.co.ke',
    },
    featured: true,
    datePosted: '2024-01-10',
  },
];

const featuredBusinesses: FeaturedBusiness[] = [
  {
    id: '1',
    name: 'Equity Bank',
    logo: '/img/team/01.jpg',
    description: 'Agricultural loans for water systems and farming equipment',
    category: 'Banking',
    link: '#',
  },
  {
    id: '2',
    name: 'KCB Bank',
    logo: '/img/team/02.jpg',
    description: 'Specialized loans for irrigation and water infrastructure',
    category: 'Banking',
    link: '#',
  },
  {
    id: '3',
    name: 'Cooperative Bank',
    logo: '/img/team/03.jpg',
    description: 'Farmers\' cooperative loans and water project financing',
    category: 'Banking',
    link: '#',
  },
];

const premiumAds: PremiumAd[] = [
  {
    id: '1',
    title: 'Equity Bank - Agricultural Financing',
    description: 'Get up to KSh 5M for your water projects and farming equipment. Low interest rates and flexible repayment terms.',
    image: '/img/portfolio/water 1.avif',
    advertiser: {
      name: 'Equity Bank',
      logo: '/img/team/01.jpg',
      category: 'Banking',
    },
    ctaText: 'Apply Now',
    ctaLink: '#',
    featured: true,
  },
  {
    id: '2',
    title: 'KCB Bank - Water Infrastructure Loans',
    description: 'Specialized financing for irrigation systems, water tanks, and agricultural infrastructure. Quick approval process.',
    image: '/img/portfolio/Irrigation 2.avif',
    advertiser: {
      name: 'KCB Bank',
      logo: '/img/team/02.jpg',
      category: 'Banking',
    },
    ctaText: 'Learn More',
    ctaLink: '#',
    featured: true,
  },
  {
    id: '3',
    title: 'Cooperative Bank - Farmers\' Loans',
    description: 'Join thousands of farmers who trust Cooperative Bank for their agricultural and water project financing needs.',
    image: '/img/portfolio/water 2.avif',
    advertiser: {
      name: 'Cooperative Bank',
      logo: '/img/team/03.jpg',
      category: 'Banking',
    },
    ctaText: 'Get Started',
    ctaLink: '#',
    featured: true,
  },
  {
    id: '4',
    title: 'Absa Bank - Smart Farming Solutions',
    description: 'Innovative financial products designed for modern farmers. Digital banking with competitive rates.',
    image: '/img/portfolio/water 3.avif',
    advertiser: {
      name: 'Absa Bank',
      logo: '/img/team/04.jpg',
      category: 'Banking',
    },
    ctaText: 'Explore',
    ctaLink: '#',
    featured: true,
  },
];

const categories = [
  { name: 'All', icon: <BusinessIcon />, color: '#666666' },
  { name: 'Tanks', icon: <WaterIcon />, color: '#2196F3' },
  { name: 'Pipes', icon: <BuildIcon />, color: '#FF9800' },
  { name: 'Irrigation', icon: <AgricultureIcon />, color: '#4CAF50' },
  { name: 'Services', icon: <SupportIcon />, color: '#9C27B0' },
  { name: 'Livestock', icon: <BusinessIcon />, color: '#F44336' },
  { name: 'Pumps', icon: <WaterIcon />, color: '#00BCD4' },
];

const MarketPlace: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [sortBy, setSortBy] = useState('newest');
  const [locationFilter, setLocationFilter] = useState('All');
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<MarketplaceAd | null>(null);

  // Admin State
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminTabValue, setAdminTabValue] = useState(0);
  
  // Dynamic data state — populated from backend
  const [dynamicAds, setDynamicAds] = useState<MarketplaceAd[]>([]);
  const [dynamicFeaturedBusinesses, setDynamicFeaturedBusinesses] = useState<FeaturedBusiness[]>([]);
  const [dynamicPremiumAds, setDynamicPremiumAds] = useState<PremiumAd[]>([]);

  // Fetch all marketplace items from backend on mount
  useEffect(() => {
    const BASE_URL = 'http://localhost:3001/api/v1';
    Promise.all([
      fetch(`${BASE_URL}/marketplace_items`).then(r => r.json()),
      fetch(`${BASE_URL}/marketplace_items?featured=true`).then(r => r.json()),
    ]).then(([allRes, featuredRes]) => {
      const allItems: any[] = allRes?.data?.marketplace_items || [];
      const featuredItems: any[] = featuredRes?.data?.marketplace_items || [];

      // Map backend items → MarketplaceAd shape
      const toAd = (item: any): MarketplaceAd => ({
        id: String(item.id),
        title: item.title || '',
        description: item.description || '',
        price: item.price > 0 ? item.price : undefined,
        priceType: item.price > 0 ? 'fixed' : 'contact',
        image: item.images?.[0] || '/img/portfolio/water 1.avif',
        category: item.category || 'Other Services',
        advertiser: {
          name: item.seller || '',
          company: item.seller || '',
          avatar: item.images?.[0] || '/img/team/01.jpg',
          rating: item.rating || 0,
          reviews: item.reviews || 0,
        },
        location: item.location || '',
        contact: {
          phone: item.sellerContact?.phone || '',
          email: item.sellerContact?.email || '',
        },
        featured: item.featured || false,
        datePosted: item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      });

      setDynamicAds(allItems.map(toAd));

      // Featured items → PremiumAds carousel
      setDynamicPremiumAds(featuredItems.map((item: any): PremiumAd => ({
        id: String(item.id),
        title: item.title || '',
        description: item.description || '',
        image: item.images?.[0] || '/img/portfolio/water 1.avif',
        advertiser: {
          name: item.seller || '',
          logo: item.images?.[0] || '/img/team/01.jpg',
          category: item.category || '',
        },
        ctaText: 'View Details',
        ctaLink: '#',
        featured: true,
      })));

      // Featured items → FeaturedBusinesses section
      setDynamicFeaturedBusinesses(featuredItems.map((item: any): FeaturedBusiness => ({
        id: String(item.id),
        name: item.seller || item.title || '',
        logo: item.images?.[0] || '/img/team/01.jpg',
        description: item.description || '',
        category: item.category || '',
        link: '#',
      })));
    }).catch(() => {
      // Fallback to mock data if API is unavailable
      setDynamicAds(mockAds);
      setDynamicFeaturedBusinesses(featuredBusinesses);
      setDynamicPremiumAds(premiumAds);
    });
  }, []);

  // Form states
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    price: '',
    priceType: 'fixed' as 'fixed' | 'contact',
    image: '',
    category: '',
    advertiserName: '',
    advertiserCompany: '',
    advertiserAvatar: '',
    advertiserRating: 4.5,
    advertiserReviews: 0,
    location: '',
    phone: '',
    email: '',
    featured: false,
  });

  const [newFeaturedBusiness, setNewFeaturedBusiness] = useState({
    name: '',
    logo: '',
    description: '',
    category: '',
    link: '',
  });

  const [newPremiumAd, setNewPremiumAd] = useState({
    title: '',
    description: '',
    image: '',
    advertiserName: '',
    advertiserLogo: '',
    advertiserCategory: '',
    ctaText: '',
    ctaLink: '',
  });

  // Image upload states
  const [imagePreview, setImagePreview] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Modal states
  const [premiumPartnerModalOpen, setPremiumPartnerModalOpen] = useState(false);
  const [featuredPartnerModalOpen, setFeaturedPartnerModalOpen] = useState(false);
  const [selectedPremiumPartner, setSelectedPremiumPartner] = useState<PremiumAd | null>(null);
  const [selectedFeaturedPartner, setSelectedFeaturedPartner] = useState<FeaturedBusiness | null>(null);

  // Common form field styles
  const formFieldStyles = {
    mb: 2,
    '& .MuiInputLabel-root': { fontSize: '1.2rem' },
    '& .MuiOutlinedInput-input': { fontSize: '1.2rem' },
    '& .MuiSelect-select': { fontSize: '1.2rem' },
    '& .MuiMenuItem-root': { fontSize: '1.2rem' },
  };

  // Image upload handlers
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'logo') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'image') {
          setImagePreview(result);
          setNewAd({...newAd, image: result});
        } else {
          setLogoPreview(result);
          setNewAd({...newAd, advertiserAvatar: result});
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDrop = (event: React.DragEvent<HTMLDivElement>, type: 'image' | 'logo') => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'image') {
          setImagePreview(result);
          setNewAd({...newAd, image: result});
        } else {
          setLogoPreview(result);
          setNewAd({...newAd, advertiserAvatar: result});
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter and sort ads
  const filteredAds = dynamicAds
    .filter(ad => {
      const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ad.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ad.advertiser.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || ad.category === selectedCategory;
      const matchesLocation = locationFilter === 'All' || ad.location.includes(locationFilter);
      const matchesPrice = !ad.price || (ad.price >= priceRange[0] && ad.price <= priceRange[1]);
      
      return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime();
        case 'oldest':
          return new Date(a.datePosted).getTime() - new Date(b.datePosted).getTime();
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'rating':
          return b.advertiser.rating - a.advertiser.rating;
        default:
          return 0;
      }
    });

  const handleContactAd = (ad: MarketplaceAd) => {
    setSelectedAd(ad);
    setContactDialogOpen(true);
  };

  const handleCloseContactDialog = () => {
    setContactDialogOpen(false);
    setSelectedAd(null);
  };

  // Modal handlers
  const handlePremiumPartnerClick = (partner: PremiumAd) => {
    setSelectedPremiumPartner(partner);
    setPremiumPartnerModalOpen(true);
  };

  const handleFeaturedPartnerClick = (partner: FeaturedBusiness) => {
    setSelectedFeaturedPartner(partner);
    setFeaturedPartnerModalOpen(true);
  };

  const handleClosePremiumPartnerModal = () => {
    setPremiumPartnerModalOpen(false);
    setSelectedPremiumPartner(null);
  };

  const handleCloseFeaturedPartnerModal = () => {
    setFeaturedPartnerModalOpen(false);
    setSelectedFeaturedPartner(null);
  };

  // Admin functions
  const handleAdminTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setAdminTabValue(newValue);
  };

  const handleCreateAd = () => {
    const newAdData: MarketplaceAd = {
      id: Date.now().toString(),
      title: newAd.title,
      description: newAd.description,
      price: newAd.price ? parseFloat(newAd.price) : undefined,
      priceType: newAd.priceType,
      image: newAd.image,
      category: newAd.category,
      advertiser: {
        name: newAd.advertiserName,
        company: newAd.advertiserCompany,
        avatar: newAd.advertiserAvatar,
        rating: newAd.advertiserRating,
        reviews: newAd.advertiserReviews,
      },
      location: newAd.location,
      contact: {
        phone: newAd.phone,
        email: newAd.email,
      },
      featured: newAd.featured,
      datePosted: new Date().toISOString().split('T')[0],
    };

    setDynamicAds([newAdData, ...dynamicAds]);
    setNewAd({
      title: '',
      description: '',
      price: '',
      priceType: 'fixed',
      image: '',
      category: '',
      advertiserName: '',
      advertiserCompany: '',
      advertiserAvatar: '',
      advertiserRating: 4.5,
      advertiserReviews: 0,
      location: '',
      phone: '',
      email: '',
      featured: false,
    });
    setImagePreview('');
    setLogoPreview('');
    alert('Ad created successfully!');
  };

  const handleCreateFeaturedBusiness = () => {
    const newBusiness: FeaturedBusiness = {
      id: Date.now().toString(),
      name: newFeaturedBusiness.name,
      logo: newFeaturedBusiness.logo,
      description: newFeaturedBusiness.description,
      category: newFeaturedBusiness.category,
      link: newFeaturedBusiness.link,
    };

    setDynamicFeaturedBusinesses([...dynamicFeaturedBusinesses, newBusiness]);
    setNewFeaturedBusiness({
      name: '',
      logo: '',
      description: '',
      category: '',
      link: '',
    });
    alert('Featured Business added successfully!');
  };

  const handleCreatePremiumAd = () => {
    const newPremiumAdData: PremiumAd = {
      id: Date.now().toString(),
      title: newPremiumAd.title,
      description: newPremiumAd.description,
      image: newPremiumAd.image,
      advertiser: {
        name: newPremiumAd.advertiserName,
        logo: newPremiumAd.advertiserLogo,
        category: newPremiumAd.advertiserCategory,
      },
      ctaText: newPremiumAd.ctaText,
      ctaLink: newPremiumAd.ctaLink,
      featured: true,
    };

    setDynamicPremiumAds([...dynamicPremiumAds, newPremiumAdData]);
    setNewPremiumAd({
      title: '',
      description: '',
      image: '',
      advertiserName: '',
      advertiserLogo: '',
      advertiserCategory: '',
      ctaText: '',
      ctaLink: '',
    });
    alert('Premium Ad created successfully!');
  };

  // Carousel settings
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: isMobile ? 1 : 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 15 }}>
      {/* Header Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 3.75 }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h1" component="h1" gutterBottom fontWeight="bold" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
              Water & Farming Marketplace
            </Typography>
            <Typography variant="h4" sx={{ opacity: 0.9, maxWidth: 800, mx: 'auto', fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
              Discover trusted suppliers, products, and services to power your water and farm operations
            </Typography>
          </Box>

          {/* Search Bar */}
          <Box sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
            <TextField
              fullWidth
              placeholder="Search products, services, or companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: 'white',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '1.3rem',
                  py: 1.5,
                },
                '& .MuiInputBase-input::placeholder': {
                  fontSize: '1.3rem',
                  opacity: 0.7,
                },
              }}
            />
          </Box>

          {/* Category Filters */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
            {categories.map((category) => (
              <Chip
                key={category.name}
                label={category.name}
                icon={category.icon}
                onClick={() => setSelectedCategory(category.name)}
                variant={selectedCategory === category.name ? 'filled' : 'outlined'}
                sx={{
                  bgcolor: selectedCategory === category.name ? category.color : 'transparent',
                  color: selectedCategory === category.name ? 'white' : 'white',
                  borderColor: 'white',
                  fontSize: '1.2rem',
                  py: 2.5,
                  px: 3,
                  height: 'auto',
                  minHeight: '52px',
                  '&:hover': {
                    bgcolor: selectedCategory === category.name ? category.color : 'rgba(255,255,255,0.1)',
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Premium Ads Banner */}
      <Box sx={{ bgcolor: 'primary.main', py: '40px', position: 'relative', overflow: 'hidden', maxHeight: { xs: '500px', md: '600px' } }}>
        <Box sx={{ px: 3.75 }}>
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" component="h2" sx={{ color: 'white', fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 'bold', mb: 1 }}>
              Premium Partners
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: { xs: '1.3rem', md: '1.5rem' } }}>
              Trusted financial partners for your agricultural and water projects
            </Typography>
          </Box>
          
          <Slider {...carouselSettings}>
            {dynamicPremiumAds.map((ad) => (
              <Box key={ad.id} sx={{ px: 2 }}>
                <Card 
                  sx={{ 
                    textAlign: 'left', 
                    p: 0,
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    minHeight: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={ad.image}
                      alt={ad.title}
                      sx={{ 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(45deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        zIndex: 1,
                      }}
                    >
                      <Chip
                        label="Premium"
                        size="small"
                        sx={{ 
                          bgcolor: '#FFD700', 
                          color: 'black',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        left: 12,
                        zIndex: 1,
                      }}
                    >
                      <Avatar
                        src={ad.advertiser.logo}
                        sx={{ width: 40, height: 40, border: '2px solid white' }}
                      />
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'text.primary' }}>
                      {ad.title}
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '1.3rem', lineHeight: 1.6 }}>
                      {ad.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontSize: '1.2rem', color: 'primary.main', fontWeight: 'medium' }}>
                        {ad.advertiser.name}
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => handlePremiumPartnerClick(ad)}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          px: 3,
                          py: 1,
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          borderRadius: 2,
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        {ad.ctaText}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Slider>
        </Box>
      </Box>

      <Box sx={{ px: 3.75, py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Filter Sidebar */}
          <Box sx={{ width: { xs: '100%', md: '300px' }, flexShrink: 0 }}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                Filters
              </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setPriceRange([0, 100000]);
                    setSortBy('newest');
                    setLocationFilter('All');
                  }}
                  sx={{ fontSize: '1.1rem', textTransform: 'none' }}
                >
                  Clear All
                </Button>
              </Box>

              {/* Sort By */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ fontSize: '1.3rem' }}>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                  sx={{ fontSize: '1.3rem' }}
                >
                  <MenuItem value="newest" sx={{ fontSize: '1.3rem' }}>Newest First</MenuItem>
                  <MenuItem value="oldest" sx={{ fontSize: '1.3rem' }}>Oldest First</MenuItem>
                  <MenuItem value="price-low" sx={{ fontSize: '1.3rem' }}>Price: Low to High</MenuItem>
                  <MenuItem value="price-high" sx={{ fontSize: '1.3rem' }}>Price: High to Low</MenuItem>
                  <MenuItem value="rating" sx={{ fontSize: '1.3rem' }}>Highest Rated</MenuItem>
                </Select>
              </FormControl>

              {/* Location Filter */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ fontSize: '1.3rem' }}>Location</InputLabel>
                <Select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  label="Location"
                  sx={{ fontSize: '1.3rem' }}
                >
                  <MenuItem value="All" sx={{ fontSize: '1.3rem' }}>All Locations</MenuItem>
                  <MenuItem value="Nairobi" sx={{ fontSize: '1.3rem' }}>Nairobi</MenuItem>
                  <MenuItem value="Mombasa" sx={{ fontSize: '1.3rem' }}>Mombasa</MenuItem>
                  <MenuItem value="Kisumu" sx={{ fontSize: '1.3rem' }}>Kisumu</MenuItem>
                  <MenuItem value="Nakuru" sx={{ fontSize: '1.3rem' }}>Nakuru</MenuItem>
                  <MenuItem value="Eldoret" sx={{ fontSize: '1.3rem' }}>Eldoret</MenuItem>
                </Select>
              </FormControl>

              {/* Price Range */}
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom sx={{ fontSize: '1.3rem', fontWeight: 'medium' }}>Price Range (KSh)</Typography>
                <MuiSlider
                  value={priceRange}
                  onChange={(_, newValue) => setPriceRange(newValue as number[])}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100000}
                  step={5000}
                  valueLabelFormat={(value) => `KSh ${value.toLocaleString()}`}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.3rem' }}>
                Showing {filteredAds.length} results
              </Typography>
            </Paper>
          </Box>

          {/* Ads Grid */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                lg: 'repeat(3, 1fr)' 
              }, 
              gap: 3 
            }}>
              {filteredAds.map((ad) => (
                <Box key={ad.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                      },
                    }}
                  >
                    {ad.featured && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 1,
                        }}
                      >
                        <Chip
                          label="Featured"
                          size="small"
                          color="primary"
                          sx={{ bgcolor: '#FFD700', color: 'black' }}
                        />
                      </Box>
                    )}
                    
                    <CardMedia
                      component="img"
                      height="200"
                      image={ad.image}
                      alt={ad.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h4" component="h3" gutterBottom>
                        {ad.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: 16 }}>
                        {ad.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <MoneyIcon sx={{ fontSize: 18, mr: 0.5, color: 'primary.main' }} />
                        <Typography variant="h5" color="primary.main">
                          {ad.priceType === 'fixed' 
                            ? `KSh ${ad.price?.toLocaleString()}` 
                            : 'Contact for Price'
                          }
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationIcon sx={{ fontSize: 18, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{fontSize: 16 }}>
                          {ad.location}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={ad.advertiser.avatar}
                          sx={{ width: 30, height: 30, mr: 1 }}
                        />
                        <Typography variant="body2" sx={{ flexGrow: 1, fontSize: 16 }}>
                          {ad.advertiser.company}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StarIcon sx={{ fontSize: 18, color: '#FFD700', mr: 0.5 }} />
                          <Typography variant="body2" sx={{fontSize: 16 }}>
                            {ad.advertiser.rating} ({ad.advertiser.reviews})
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => handleContactAd(ad)}
                        startIcon={<PhoneIcon />}
                      >
                        Contact Seller
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
              ))}
            </Box>

            {filteredAds.length === 0 && (
              <Box textAlign="center" py={8}>
                <Typography variant="h6" color="text.secondary">
                  No ads found matching your criteria
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try adjusting your filters or search terms
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Featured Businesses Section */}
      <Box sx={{ bgcolor: 'grey.50', py: '40px', maxHeight: { xs: '400px', md: '450px' } }}>
        <Box sx={{ px: 3.75 }}>
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ fontSize: { xs: '2.2rem', md: '2.8rem' } }}>
            Featured Partners
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '1.2rem', md: '1.4rem' } }}>
            Trusted partners offering specialized services for farmers and water users
          </Typography>
          
          <Slider {...carouselSettings}>
            {dynamicFeaturedBusinesses.map((business) => (
              <Box key={business.id} sx={{ px: 2 }}>
                <Card sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar
                    src={business.logo}
                    sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {business.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '1.3rem' }}>
                    {business.description}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => handleFeaturedPartnerClick(business)}
                    sx={{ fontSize: '1.2rem' }}
                  >
                    Learn More
                  </Button>
                </Card>
              </Box>
            ))}
          </Slider>
        </Box>
      </Box>

      {/* Advertise With Us Section */}
      <Box sx={{ py: 4, px: 3.75 }}>
        <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Typography variant="h3" component="h2" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
              Want to reach farmers and water users?
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, opacity: 0.9, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
              Post your ad today and connect with thousands of potential customers
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAdminDialogOpen(true)}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 2,
                fontSize: '1.1rem',
                minHeight: '48px',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              Create Ad
            </Button>
          </Paper>
        </Box>
      </Box>

      {/* Admin Dialog */}
      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Admin Dashboard
          <IconButton
            onClick={() => setAdminDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={adminTabValue} onChange={handleAdminTabChange} aria-label="admin tabs">
              <Tab label="Create Marketplace Ad" />
              <Tab label="Add Featured Business" />
              <Tab label="Create Premium Ad" />
            </Tabs>
          </Box>

          <TabPanel value={adminTabValue} index={0}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1.4rem', fontWeight: 'bold', mb: 3 }}>
              Create New Marketplace Ad
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Ad Title"
                  value={newAd.title}
                  onChange={(e) => setNewAd({...newAd, title: e.target.value})}
                  sx={formFieldStyles}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={newAd.description}
                  onChange={(e) => setNewAd({...newAd, description: e.target.value})}
                  sx={formFieldStyles}
                />
                
                {/* Image Upload Section */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ fontSize: '1.2rem', mb: 1, fontWeight: 'medium' }}>
                    Product Image
                  </Typography>
                  <Box
                    sx={{
                      border: '2px dashed #ccc',
                      borderRadius: 2,
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                    onDrop={(e) => handleImageDrop(e, 'image')}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    {imagePreview ? (
                      <Box>
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                        />
                        <Typography variant="body2" sx={{ mt: 1, fontSize: '1rem' }}>
                          Click to change image
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" sx={{ fontSize: '1.1rem' }}>
                          Drag & drop image here or click to upload
                        </Typography>
                      </Box>
                    )}
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(e, 'image')}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    label="Or enter image URL"
                    value={newAd.image}
                    onChange={(e) => setNewAd({...newAd, image: e.target.value})}
                    sx={{ mt: 1, ...formFieldStyles }}
                  />
                </Box>
                <FormControl fullWidth sx={formFieldStyles}>
                  <InputLabel sx={{ fontSize: '1.2rem' }}>Category</InputLabel>
                  <Select
                    value={newAd.category}
                    onChange={(e) => setNewAd({...newAd, category: e.target.value})}
                    label="Category"
                    sx={{ fontSize: '1.2rem' }}
                  >
                    <MenuItem value="Tanks" sx={{ fontSize: '1.2rem' }}>Tanks</MenuItem>
                    <MenuItem value="Pipes" sx={{ fontSize: '1.2rem' }}>Pipes</MenuItem>
                    <MenuItem value="Irrigation" sx={{ fontSize: '1.2rem' }}>Irrigation</MenuItem>
                    <MenuItem value="Services" sx={{ fontSize: '1.2rem' }}>Services</MenuItem>
                    <MenuItem value="Livestock" sx={{ fontSize: '1.2rem' }}>Livestock</MenuItem>
                    <MenuItem value="Pumps" sx={{ fontSize: '1.2rem' }}>Pumps</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Price (KSh)"
                  type="number"
                  value={newAd.price}
                  onChange={(e) => setNewAd({...newAd, price: e.target.value})}
                  sx={formFieldStyles}
                />
                <FormControl fullWidth sx={formFieldStyles}>
                  <InputLabel sx={{ fontSize: '1.2rem' }}>Price Type</InputLabel>
                  <Select
                    value={newAd.priceType}
                    onChange={(e) => setNewAd({...newAd, priceType: e.target.value as 'fixed' | 'contact'})}
                    label="Price Type"
                    sx={{ fontSize: '1.2rem' }}
                  >
                    <MenuItem value="fixed" sx={{ fontSize: '1.2rem' }}>Fixed Price</MenuItem>
                    <MenuItem value="contact" sx={{ fontSize: '1.2rem' }}>Contact for Price</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Advertiser Name"
                  value={newAd.advertiserName}
                  onChange={(e) => setNewAd({...newAd, advertiserName: e.target.value})}
                  sx={formFieldStyles}
                />
                <TextField
                  fullWidth
                  label="Company Name"
                  value={newAd.advertiserCompany}
                  onChange={(e) => setNewAd({...newAd, advertiserCompany: e.target.value})}
                  sx={formFieldStyles}
                />
                
                {/* Avatar Upload Section */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ fontSize: '1.2rem', mb: 1, fontWeight: 'medium' }}>
                    Advertiser Avatar
                  </Typography>
                  <Box
                    sx={{
                      border: '2px dashed #ccc',
                      borderRadius: 2,
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                    onDrop={(e) => handleImageDrop(e, 'logo')}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    {logoPreview ? (
                      <Box>
                        <img 
                          src={logoPreview} 
                          alt="Avatar Preview" 
                          style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '50%' }}
                        />
                        <Typography variant="body2" sx={{ mt: 1, fontSize: '1rem' }}>
                          Click to change avatar
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <CloudUploadIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" sx={{ fontSize: '1.1rem' }}>
                          Upload avatar image
                        </Typography>
                      </Box>
                    )}
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(e, 'logo')}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    label="Or enter avatar URL"
                    value={newAd.advertiserAvatar}
                    onChange={(e) => setNewAd({...newAd, advertiserAvatar: e.target.value})}
                    sx={{ mt: 1, ...formFieldStyles }}
                  />
                </Box>
                
                <TextField
                  fullWidth
                  label="Location"
                  value={newAd.location}
                  onChange={(e) => setNewAd({...newAd, location: e.target.value})}
                  sx={formFieldStyles}
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={newAd.phone}
                  onChange={(e) => setNewAd({...newAd, phone: e.target.value})}
                  sx={formFieldStyles}
                />
                <TextField
                  fullWidth
                  label="Email"
                  value={newAd.email}
                  onChange={(e) => setNewAd({...newAd, email: e.target.value})}
                  sx={formFieldStyles}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={newAd.featured}
                      onChange={(e) => setNewAd({...newAd, featured: e.target.checked})}
                    />
                  }
                  label={<Typography sx={{ fontSize: '1.2rem' }}>Featured Ad</Typography>}
                />
              </Box>
            </Box>
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button variant="contained" onClick={handleCreateAd} size="large" sx={{ fontSize: '1.2rem', px: 4 }}>
                Create Ad
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={adminTabValue} index={1}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1.4rem', fontWeight: 'bold', mb: 3 }}>
              Add Featured Business
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Business Name"
                  value={newFeaturedBusiness.name}
                  onChange={(e) => setNewFeaturedBusiness({...newFeaturedBusiness, name: e.target.value})}
                  sx={formFieldStyles}
                />
                <TextField
                  fullWidth
                  label="Logo URL"
                  value={newFeaturedBusiness.logo}
                  onChange={(e) => setNewFeaturedBusiness({...newFeaturedBusiness, logo: e.target.value})}
                  sx={formFieldStyles}
                />
                <TextField
                  fullWidth
                  label="Category"
                  value={newFeaturedBusiness.category}
                  onChange={(e) => setNewFeaturedBusiness({...newFeaturedBusiness, category: e.target.value})}
                  sx={formFieldStyles}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={newFeaturedBusiness.description}
                  onChange={(e) => setNewFeaturedBusiness({...newFeaturedBusiness, description: e.target.value})}
                  sx={formFieldStyles}
                />
                <TextField
                  fullWidth
                  label="Link URL"
                  value={newFeaturedBusiness.link}
                  onChange={(e) => setNewFeaturedBusiness({...newFeaturedBusiness, link: e.target.value})}
                  sx={formFieldStyles}
                />
              </Box>
            </Box>
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button variant="contained" onClick={handleCreateFeaturedBusiness} size="large" sx={{ fontSize: '1.2rem', px: 4 }}>
                Add Featured Business
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={adminTabValue} index={2}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1.4rem', fontWeight: 'bold', mb: 3 }}>
              Create Premium Ad
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Ad Title"
                  value={newPremiumAd.title}
                  onChange={(e) => setNewPremiumAd({...newPremiumAd, title: e.target.value})}
                  sx={formFieldStyles}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={newPremiumAd.description}
                  onChange={(e) => setNewPremiumAd({...newPremiumAd, description: e.target.value})}
                  sx={formFieldStyles}
                />
                <TextField
                  fullWidth
                  label="Image URL"
                  value={newPremiumAd.image}
                  onChange={(e) => setNewPremiumAd({...newPremiumAd, image: e.target.value})}
                  sx={formFieldStyles}
                />
                <TextField
                  fullWidth
                  label="Advertiser Name"
                  value={newPremiumAd.advertiserName}
                  onChange={(e) => setNewPremiumAd({...newPremiumAd, advertiserName: e.target.value})}
                  sx={formFieldStyles}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Advertiser Logo URL"
                  value={newPremiumAd.advertiserLogo}
                  onChange={(e) => setNewPremiumAd({...newPremiumAd, advertiserLogo: e.target.value})}
                  sx={formFieldStyles}
                />
                <TextField
                  fullWidth
                  label="Advertiser Category"
                  value={newPremiumAd.advertiserCategory}
                  onChange={(e) => setNewPremiumAd({...newPremiumAd, advertiserCategory: e.target.value})}
                  sx={formFieldStyles}
                />
                <TextField
                  fullWidth
                  label="CTA Button Text"
                  value={newPremiumAd.ctaText}
                  onChange={(e) => setNewPremiumAd({...newPremiumAd, ctaText: e.target.value})}
                  sx={formFieldStyles}
                />
                <TextField
                  fullWidth
                  label="CTA Link URL"
                  value={newPremiumAd.ctaLink}
                  onChange={(e) => setNewPremiumAd({...newPremiumAd, ctaLink: e.target.value})}
                  sx={formFieldStyles}
                />
              </Box>
            </Box>
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button variant="contained" onClick={handleCreatePremiumAd} size="large" sx={{ fontSize: '1.2rem', px: 4 }}>
                Create Premium Ad
              </Button>
            </Box>
          </TabPanel>
        </DialogContent>
      </Dialog>

      {/* Premium Partner Modal */}
      <Dialog open={premiumPartnerModalOpen} onClose={handleClosePremiumPartnerModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedPremiumPartner && (
              <>
                <Avatar
                  src={selectedPremiumPartner.advertiser.logo}
                  sx={{ width: 50, height: 50 }}
                />
                <Box>
                  <Typography variant="h5" sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {selectedPremiumPartner.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
                    by {selectedPremiumPartner.advertiser.name}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
          <IconButton
            onClick={handleClosePremiumPartnerModal}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedPremiumPartner && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <img 
                  src={selectedPremiumPartner.image} 
                  alt={selectedPremiumPartner.title}
                  style={{ 
                    width: '100%', 
                    height: '300px', 
                    objectFit: 'cover', 
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}
                />
              </Box>
              
              <Typography variant="h6" sx={{ fontSize: '1.4rem', fontWeight: 'bold', mb: 2 }}>
                About This Service
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.2rem', lineHeight: 1.6, mb: 3 }}>
                {selectedPremiumPartner.description}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontSize: '1.4rem', fontWeight: 'bold', mb: 2 }}>
                Why Choose {selectedPremiumPartner.advertiser.name}?
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StarIcon sx={{ color: '#FFD700', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
                    Trusted financial partner with proven track record
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StarIcon sx={{ color: '#FFD700', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
                    Competitive rates and flexible terms
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StarIcon sx={{ color: '#FFD700', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
                    Specialized in agricultural and water project financing
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StarIcon sx={{ color: '#FFD700', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
                    Quick approval process and excellent customer service
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontSize: '1.4rem', fontWeight: 'bold', mb: 2 }}>
                How to Get Started
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ fontSize: '1.2rem', mb: 2 }}>
                  1. <strong>Contact Us:</strong> Reach out through our website or visit a branch
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.2rem', mb: 2 }}>
                  2. <strong>Application:</strong> Complete our simple application form
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.2rem', mb: 2 }}>
                  3. <strong>Review:</strong> We'll review your project and financial needs
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.2rem', mb: 2 }}>
                  4. <strong>Approval:</strong> Get quick approval with competitive terms
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
                  5. <strong>Funding:</strong> Receive your funds and start your project
                </Typography>
              </Box>

              <Box sx={{ 
                bgcolor: 'primary.main', 
                color: 'white', 
                p: 3, 
                borderRadius: 2,
                textAlign: 'center'
              }}>
                <Typography variant="h6" sx={{ fontSize: '1.3rem', fontWeight: 'bold', mb: 1 }}>
                  Ready to Get Started?
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '1.1rem', mb: 2, opacity: 0.9 }}>
                  Contact us today to discuss your financing needs
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    '&:hover': {
                      bgcolor: 'grey.100',
                    },
                  }}
                >
                  {selectedPremiumPartner.ctaText}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Featured Partner Modal */}
      <Dialog open={featuredPartnerModalOpen} onClose={handleCloseFeaturedPartnerModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedFeaturedPartner && (
              <>
                <Avatar
                  src={selectedFeaturedPartner.logo}
                  sx={{ width: 50, height: 50 }}
                />
                <Box>
                  <Typography variant="h5" sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {selectedFeaturedPartner.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
                    {selectedFeaturedPartner.category}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
          <IconButton
            onClick={handleCloseFeaturedPartnerModal}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedFeaturedPartner && (
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.4rem', fontWeight: 'bold', mb: 2 }}>
                About {selectedFeaturedPartner.name}
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.2rem', lineHeight: 1.6, mb: 3 }}>
                {selectedFeaturedPartner.description}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontSize: '1.4rem', fontWeight: 'bold', mb: 2 }}>
                Our Services
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StarIcon sx={{ color: '#FFD700', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
                    Specialized financial products for farmers
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StarIcon sx={{ color: '#FFD700', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
                    Water system and irrigation financing
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StarIcon sx={{ color: '#FFD700', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
                    Equipment and infrastructure loans
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StarIcon sx={{ color: '#FFD700', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
                    Expert financial advice and support
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ 
                bgcolor: 'grey.50', 
                p: 3, 
                borderRadius: 2,
                textAlign: 'center'
              }}>
                <Typography variant="h6" sx={{ fontSize: '1.3rem', fontWeight: 'bold', mb: 1 }}>
                  Partner with {selectedFeaturedPartner.name}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '1.1rem', mb: 2, color: 'text.secondary' }}>
                  Discover how we can help grow your agricultural business
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                  }}
                >
                  Learn More
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onClose={handleCloseContactDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Contact Seller
          <IconButton
            onClick={handleCloseContactDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedAd && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAd.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                by {selectedAd.advertiser.company}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body1">
                  {selectedAd.contact.phone}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body1">
                  {selectedAd.contact.email}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body1">
                  {selectedAd.location}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContactDialog}>Close</Button>
          <Button variant="contained" onClick={handleCloseContactDialog}>
            Contact Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarketPlace;
