import blog1 from "../assets/images/slider/blog1.jpg";
import blog2 from "../assets/images/slider/blog2.jpg";
import blog3 from "../assets/images/slider/blog3.jpg";
import blog4 from "../assets/images/slider/blog4.jpg";
import blog5 from "../assets/images/slider/blog5.jpg";
import blog6 from "../assets/images/slider/blog6.jpg";
import blog7 from "../assets/images/slider/blog7.jpg";
import blog8 from "../assets/images/slider/blog8.jpg";
import blog9 from "../assets/images/slider/blog9.jpg";
import blog10 from "../assets/images/slider/blog10.jpg";

// Blog Categories
export interface BlogCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export const blogCategories: BlogCategory[] = [
  {
    id: "water-health",
    name: "Water & Health",
    description: "Water quality, safety, and health-related topics",
    color: "#2196F3",
    icon: "💧"
  },
  {
    id: "irrigation-farming",
    name: "Irrigation & Farming",
    description: "Crop irrigation and water-efficient farming methods",
    color: "#4CAF50",
    icon: "🌾"
  },
  {
    id: "livestock-aquaculture",
    name: "Livestock & Aquaculture",
    description: "Animal water needs and fish farming techniques",
    color: "#FF9800",
    icon: "🐄"
  },
  {
    id: "home-solutions",
    name: "Home Water Solutions",
    description: "Household water storage and conservation",
    color: "#9C27B0",
    icon: "🏠"
  },
  {
    id: "trees-agroforestry",
    name: "Trees & Agroforestry",
    description: "Tree planting and sustainable land management",
    color: "#8BC34A",
    icon: "🌳"
  },
  {
    id: "tools-materials",
    name: "Water Tools & Materials",
    description: "Equipment guides and DIY projects",
    color: "#607D8B",
    icon: "🛠️"
  },
  {
    id: "weather-climate",
    name: "Weather & Climate",
    description: "Weather updates and climate change information",
    color: "#00BCD4",
    icon: "🌤️"
  },
  {
    id: "government-policy",
    name: "Government & Policy",
    description: "Water policies and regulatory updates",
    color: "#3F51B5",
    icon: "🏛️"
  },
  {
    id: "community-culture",
    name: "Community & Culture",
    description: "Cultural practices and community stories",
    color: "#E91E63",
    icon: "⛪"
  },
  {
    id: "harvesting-storage",
    name: "Water Harvesting & Storage",
    description: "Rainwater collection and storage systems",
    color: "#009688",
    icon: "💧"
  },
  {
    id: "sustainability",
    name: "Sustainability & Environment",
    description: "Environmental conservation and green practices",
    color: "#689F38",
    icon: "🌱"
  }
];

// Enhanced Blog Interface
export interface EnhancedBlog {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  category: string;
  tags: string[];
  image: string;
  date: string;
  readTime: number;
  featured: boolean;
  views: number;
  likes: number;
  comments: number;
}

// Enhanced Blog Data
export const enhancedBlogs: EnhancedBlog[] = [
  {
    id: 1,
    title: "Safe Water Storage: Protecting Your Family's Health",
    excerpt: "Learn essential techniques for storing water safely at home to prevent contamination and ensure your family has access to clean, healthy water year-round.",
    content: "Water storage is crucial for rural communities, especially during dry seasons. Proper storage techniques can prevent waterborne diseases and ensure your family's health. This comprehensive guide covers everything from choosing the right containers to maintaining water quality over time.",
    author: {
      name: "Dr. Sarah Kimani",
      bio: "Public Health Specialist with 15 years of experience in rural water systems"
    },
    category: "water-health",
    tags: ["water storage", "health", "safety", "contamination prevention"],
    image: blog1,
    date: "2024-12-15",
    readTime: 8,
    featured: true,
    views: 1250,
    likes: 89,
    comments: 23
  },
  {
    id: 2,
    title: "Drip Irrigation: Maximizing Crop Yield with Minimal Water",
    excerpt: "Discover how drip irrigation systems can increase your crop productivity while using 50% less water than traditional farming methods.",
    content: "Drip irrigation is revolutionizing farming in water-scarce regions. This efficient watering method delivers water directly to plant roots, reducing waste and increasing yields. Learn how to set up and maintain your own drip irrigation system.",
    author: {
      name: "James Mwangi",
      bio: "Agricultural Engineer and Irrigation Specialist"
    },
    category: "irrigation-farming",
    tags: ["drip irrigation", "water efficiency", "farming", "crop yield"],
    image: blog2,
    date: "2024-12-12",
    readTime: 12,
    featured: true,
    views: 2100,
    likes: 156,
    comments: 45
  },
  {
    id: 3,
    title: "Rainwater Harvesting: Your Complete Setup Guide",
    excerpt: "Step-by-step instructions for building an effective rainwater harvesting system that can provide water for your home and garden throughout the year.",
    content: "Rainwater harvesting is one of the most sustainable ways to secure water for your household. This detailed guide walks you through planning, building, and maintaining a rainwater collection system that suits your needs and budget.",
    author: {
      name: "Mary Wanjiku",
      bio: "Environmental Engineer and Sustainability Consultant"
    },
    category: "harvesting-storage",
    tags: ["rainwater harvesting", "sustainability", "water collection", "DIY"],
    image: blog3,
    date: "2024-12-10",
    readTime: 15,
    featured: true,
    views: 1800,
    likes: 134,
    comments: 67
  },
  {
    id: 4,
    title: "Fish Farming in Small Ponds: A Beginner's Guide",
    excerpt: "Start your own fish farming venture with minimal space and investment. Learn about pond setup, fish selection, and water management for successful aquaculture.",
    content: "Fish farming provides both protein and income for rural families. This comprehensive guide covers everything from pond construction to fish care, helping you start a successful aquaculture project in your backyard.",
    author: {
      name: "Peter Ochieng",
      bio: "Aquaculture Specialist and Fish Farming Consultant"
    },
    category: "livestock-aquaculture",
    tags: ["fish farming", "aquaculture", "pond management", "protein source"],
    image: blog4,
    date: "2024-12-08",
    readTime: 10,
    featured: false,
    views: 950,
    likes: 78,
    comments: 34
  },
  {
    id: 5,
    title: "Climate-Smart Agriculture: Adapting to Changing Weather",
    excerpt: "Practical strategies for adapting your farming practices to climate change, including drought-resistant crops and water conservation techniques.",
    content: "Climate change is affecting rainfall patterns and temperatures across Kenya. Learn how to adapt your farming practices to these changes while maintaining productivity and sustainability.",
    author: {
      name: "Dr. Grace Mutua",
      bio: "Climate Change Adaptation Specialist"
    },
    category: "weather-climate",
    tags: ["climate change", "adaptation", "drought resistance", "sustainable farming"],
    image: blog5,
    date: "2024-12-05",
    readTime: 14,
    featured: false,
    views: 1400,
    likes: 112,
    comments: 28
  },
  {
    id: 6,
    title: "Water Quality Testing: Simple Methods for Rural Areas",
    excerpt: "Learn how to test your water quality using affordable methods and understand what the results mean for your family's health and safety.",
    content: "Regular water quality testing is essential for ensuring safe drinking water. This guide introduces simple, affordable testing methods that rural communities can use to monitor their water sources.",
    author: {
      name: "John Kariuki",
      bio: "Water Quality Technician and Community Health Worker"
    },
    category: "water-health",
    tags: ["water testing", "quality control", "health safety", "community health"],
    image: blog6,
    date: "2024-12-03",
    readTime: 9,
    featured: false,
    views: 1100,
    likes: 95,
    comments: 19
  },
  {
    id: 7,
    title: "Agroforestry: Trees That Conserve Water and Boost Income",
    excerpt: "Discover tree species that help conserve water while providing additional income through fruits, timber, or other products.",
    content: "Agroforestry combines trees with crops or livestock to create sustainable farming systems. Learn which trees work best for water conservation and how they can boost your farm's productivity and income.",
    author: {
      name: "Susan Njeri",
      bio: "Agroforestry Specialist and Environmental Conservationist"
    },
    category: "trees-agroforestry",
    tags: ["agroforestry", "water conservation", "income generation", "tree planting"],
    image: blog7,
    date: "2024-12-01",
    readTime: 11,
    featured: false,
    views: 850,
    likes: 67,
    comments: 15
  },
  {
    id: 8,
    title: "Government Water Subsidies: How to Apply and Qualify",
    excerpt: "Navigate the application process for government water infrastructure subsidies and grants available to rural communities and farmers.",
    content: "The government offers various subsidies and grants for water infrastructure projects. This guide explains the application process, eligibility criteria, and tips for successful applications.",
    author: {
      name: "David Kiprotich",
      bio: "Policy Analyst and Community Development Officer"
    },
    category: "government-policy",
    tags: ["government subsidies", "funding", "water infrastructure", "grants"],
    image: blog8,
    date: "2024-11-28",
    readTime: 13,
    featured: false,
    views: 1650,
    likes: 143,
    comments: 52
  },
  {
    id: 9,
    title: "Traditional Water Conservation: Learning from Our Ancestors",
    excerpt: "Explore traditional water conservation methods used by Kenyan communities for generations and how they can be applied today.",
    content: "Traditional knowledge offers valuable insights into sustainable water management. Learn about indigenous water conservation practices and how to integrate them with modern techniques.",
    author: {
      name: "Elder Joseph Maina",
      bio: "Traditional Knowledge Keeper and Community Elder"
    },
    category: "community-culture",
    tags: ["traditional knowledge", "indigenous practices", "water conservation", "cultural heritage"],
    image: blog9,
    date: "2024-11-25",
    readTime: 7,
    featured: false,
    views: 720,
    likes: 89,
    comments: 31
  },
  {
    id: 10,
    title: "DIY Water Filters: Clean Water on a Budget",
    excerpt: "Build effective water filtration systems using locally available materials to ensure safe drinking water for your family.",
    content: "Access to clean water shouldn't depend on expensive equipment. Learn how to build effective water filters using sand, charcoal, and other locally available materials.",
    author: {
      name: "Engineer Alice Wambui",
      bio: "Water Systems Engineer and Appropriate Technology Advocate"
    },
    category: "tools-materials",
    tags: ["DIY", "water filtration", "appropriate technology", "budget solutions"],
    image: blog10,
    date: "2024-11-22",
    readTime: 16,
    featured: false,
    views: 1950,
    likes: 187,
    comments: 73
  }
];

// Helper functions
export const getBlogsByCategory = (categoryId: string): EnhancedBlog[] => {
  return enhancedBlogs.filter(blog => blog.category === categoryId);
};

export const getFeaturedBlogs = (): EnhancedBlog[] => {
  return enhancedBlogs.filter(blog => blog.featured);
};

export const getRelatedBlogs = (currentBlogId: number, categoryId: string, limit: number = 3): EnhancedBlog[] => {
  return enhancedBlogs
    .filter(blog => blog.id !== currentBlogId && blog.category === categoryId)
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
};

export const getCategoryById = (categoryId: string): BlogCategory | undefined => {
  return blogCategories.find(category => category.id === categoryId);
};