import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, CardMedia, CircularProgress, Alert,
  TextField, InputAdornment, Chip, Grid, Button, Divider, IconButton, Tabs, Tab,
  Avatar,
} from "@mui/material";
import { tokens } from "../../../theme";
import ArticleIcon from "@mui/icons-material/Article";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RefreshIcon from "@mui/icons-material/Refresh";
import RssFeedIcon from "@mui/icons-material/RssFeed";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CommentIcon from "@mui/icons-material/Comment";

// â”€â”€ Matches the exact categories used in /blogs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BLOG_CATEGORIES = [
  { id: "all",                 name: "All",                        color: "#6870fa", icon: "ðŸ“‹" },
  { id: "water-health",        name: "Water & Health",             color: "#2196F3", icon: "ðŸ’§" },
  { id: "irrigation-farming",  name: "Irrigation & Farming",       color: "#4CAF50", icon: "ðŸŒ¾" },
  { id: "livestock-aquaculture", name: "Livestock & Aquaculture",  color: "#FF9800", icon: "ðŸ„" },
  { id: "home-solutions",      name: "Home Water Solutions",       color: "#9C27B0", icon: "ðŸ " },
  { id: "trees-agroforestry",  name: "Trees & Agroforestry",       color: "#8BC34A", icon: "ðŸŒ³" },
  { id: "tools-materials",     name: "Water Tools & Materials",    color: "#607D8B", icon: "ðŸ› ï¸" },
  { id: "weather-climate",     name: "Weather & Climate",          color: "#00BCD4", icon: "ðŸŒ¤ï¸" },
  { id: "government-policy",   name: "Government & Policy",        color: "#3F51B5", icon: "ðŸ›ï¸" },
  { id: "community-culture",   name: "Community & Culture",        color: "#E91E63", icon: "â›ª" },
  { id: "harvesting-storage",  name: "Water Harvesting & Storage", color: "#009688", icon: "ðŸ’§" },
  { id: "sustainability",      name: "Sustainability & Environment", color: "#689F38", icon: "ðŸŒ±" },
];

// KB article categories (admin knowledge base)
const KB_CATEGORIES = [
  { id: "all",          name: "All",           color: "#6870fa" },
  { id: "general",      name: "General",       color: "#4cceac" },
  { id: "billing",      name: "Billing",       color: "#6870fa" },
  { id: "connection",   name: "Connection",    color: "#4db6e4" },
  { id: "maintenance",  name: "Maintenance",   color: "#f0a500" },
  { id: "safety",       name: "Safety",        color: "#e05c5c" },
  { id: "water_quality", name: "Water Quality", color: "#34d399" },
];

const BASE_URL = "http://localhost:3001/api/v1";

const getCatInfo = (catId, isBlog) => {
  const list = isBlog ? BLOG_CATEGORIES : KB_CATEGORIES;
  return list.find(c => c.id === catId) || { name: catId, color: "#6870fa", icon: "ðŸ“„" };
};

const FALLBACK_IMG = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80";

// â”€â”€ Article detail view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ArticleDetail = ({ article, onBack, colors, isBlog }) => {
  const cat = getCatInfo(article.category, isBlog);
  const authorName = isBlog
    ? (article.author?.name || article.author || "Admin")
    : "Admin";
  const imageUrl = isBlog ? article.image : article.image_url;
  const dateStr = article.created_at || article.date || article.published_at;

  return (
    <Box m="20px" maxWidth="860px">
      <Button startIcon={<ArrowBackIcon />} onClick={onBack}
        sx={{ color: colors.blueAccent[400], mb: 3, textTransform: "none" }}>
        Back to Help Articles
      </Button>

      {imageUrl && (
        <Box mb={3} borderRadius={2} overflow="hidden" maxHeight={400}>
          <img src={imageUrl} alt={article.title}
            onError={e => { e.target.src = FALLBACK_IMG; }}
            style={{ width: "100%", objectFit: "cover", display: "block", maxHeight: 400 }} />
        </Box>
      )}

      <Box display="flex" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
        <Chip label={isBlog ? "Blog Post" : "Knowledge Base"} size="small"
          sx={{ bgcolor: colors.blueAccent[700], color: "#fff", fontWeight: 600 }} />
        <Chip label={`${cat.icon || ""} ${cat.name}`} size="small"
          sx={{ backgroundColor: cat.color, color: "#fff", fontWeight: 600 }} />
        {!isBlog && article.tags && article.tags.split(",").map((t, i) => (
          <Chip key={i} label={t.trim()} size="small"
            sx={{ backgroundColor: colors.grey[700], color: colors.grey[300] }} />
        ))}
        {isBlog && Array.isArray(article.tags) && article.tags.map((t, i) => (
          <Chip key={i} label={t} size="small"
            sx={{ backgroundColor: colors.grey[700], color: colors.grey[300] }} />
        ))}
      </Box>

      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb={1}>
        {article.title}
      </Typography>

      <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={0.5}>
          <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: colors.blueAccent[600] }}>
            {authorName.charAt(0)}
          </Avatar>
          <Typography variant="caption" color={colors.grey[400]}>{authorName}</Typography>
        </Box>
        {dateStr && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <AccessTimeIcon sx={{ fontSize: 14, color: colors.grey[500] }} />
            <Typography variant="caption" color={colors.grey[500]}>
              {new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </Typography>
          </Box>
        )}
        {article.views !== undefined && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <VisibilityOutlinedIcon sx={{ fontSize: 14, color: colors.grey[500] }} />
            <Typography variant="caption" color={colors.grey[500]}>{article.views} views</Typography>
          </Box>
        )}
        {article.views_count !== undefined && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <VisibilityOutlinedIcon sx={{ fontSize: 14, color: colors.grey[500] }} />
            <Typography variant="caption" color={colors.grey[500]}>{article.views_count} views</Typography>
          </Box>
        )}
        {article.readTime && (
          <Typography variant="caption" color={colors.grey[500]}>{article.readTime} min read</Typography>
        )}
      </Box>

      <Divider sx={{ borderColor: colors.grey[700], mb: 3 }} />

      <Card sx={{ backgroundColor: colors.primary[400] }}>
        <CardContent sx={{ p: 3 }}>
          <Typography color={colors.grey[200]} sx={{ whiteSpace: "pre-line", lineHeight: 1.9, fontSize: "0.95rem" }}>
            {article.content || article.body || "No content available."}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

// â”€â”€ Blog card (matches /blogs style) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BlogCard = ({ article, onClick, colors, isBlog }) => {
  const cat = getCatInfo(article.category, isBlog);
  const imageUrl = isBlog ? article.image : article.image_url;
  const authorName = isBlog
    ? (article.author?.name || article.author || "Admin")
    : "Admin";
  const dateStr = article.created_at || article.date || article.published_at;

  return (
    <Card onClick={onClick} sx={{
      backgroundColor: colors.primary[400], cursor: "pointer", height: "100%",
      border: `1px solid ${colors.grey[700]}`, borderRadius: 3, overflow: "hidden",
      transition: "all 0.3s ease",
      "&:hover": { transform: "translateY(-6px)", boxShadow: "0 16px 40px rgba(0,0,0,0.35)", borderColor: cat.color },
    }}>
      {/* Image */}
      <Box position="relative">
        <CardMedia
          component="img"
          height="180"
          image={imageUrl || FALLBACK_IMG}
          alt={article.title}
          onError={e => { e.target.src = FALLBACK_IMG; }}
          sx={{ transition: "transform 0.3s ease", "&:hover": { transform: "scale(1.04)" } }}
        />
        {/* Category badge */}
        <Chip
          label={`${cat.icon || ""} ${cat.name}`}
          size="small"
          sx={{
            position: "absolute", top: 10, left: 10,
            backgroundColor: cat.color, color: "#fff",
            fontWeight: 600, fontSize: "0.7rem",
          }}
        />
        {/* Source badge */}
        <Chip
          label={isBlog ? "Blog" : "Knowledge Base"}
          size="small"
          sx={{
            position: "absolute", top: 10, right: 10,
            backgroundColor: "rgba(0,0,0,0.6)", color: "#fff",
            fontSize: "0.65rem",
          }}
        />
        {article.featured && (
          <Chip label="Featured" size="small"
            sx={{ position: "absolute", bottom: 10, right: 10, backgroundColor: "#ffd700", color: "#000", fontWeight: 700, fontSize: "0.65rem" }} />
        )}
      </Box>

      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" color={colors.grey[100]} fontWeight={600} mb={0.5}
          sx={{ lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {article.title}
        </Typography>

        {(article.excerpt || article.summary) && (
          <Typography variant="body2" color={colors.grey[400]} mb={1.5}
            sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>
            {article.excerpt || article.summary}
          </Typography>
        )}

        {/* Author + date */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: colors.blueAccent[600] }}>
            {authorName.charAt(0)}
          </Avatar>
          <Typography variant="caption" color={colors.grey[500]}>{authorName}</Typography>
          {dateStr && (
            <Typography variant="caption" color={colors.grey[600]} ml="auto">
              {new Date(dateStr).toLocaleDateString()}
            </Typography>
          )}
        </Box>

        {/* Stats */}
        <Box display="flex" alignItems="center" gap={1.5}>
          {(article.views !== undefined || article.views_count !== undefined) && (
            <Box display="flex" alignItems="center" gap={0.3}>
              <VisibilityOutlinedIcon sx={{ fontSize: 13, color: colors.grey[600] }} />
              <Typography variant="caption" color={colors.grey[600]}>{article.views ?? article.views_count}</Typography>
            </Box>
          )}
          {article.likes !== undefined && (
            <Box display="flex" alignItems="center" gap={0.3}>
              <FavoriteIcon sx={{ fontSize: 13, color: colors.grey[600] }} />
              <Typography variant="caption" color={colors.grey[600]}>{article.likes}</Typography>
            </Box>
          )}
          {article.comments !== undefined && (
            <Box display="flex" alignItems="center" gap={0.3}>
              <CommentIcon sx={{ fontSize: 13, color: colors.grey[600] }} />
              <Typography variant="caption" color={colors.grey[600]}>{article.comments}</Typography>
            </Box>
          )}
          {article.readTime && (
            <Typography variant="caption" color={colors.grey[600]} ml="auto">
              {article.readTime} min read
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HelpArticles = () => {
  const colors = tokens("dark");
  const [tab, setTab] = useState(0);           // 0=All, 1=Blog Posts, 2=Knowledge Base
  const [kbArticles, setKbArticles] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selected, setSelected] = useState(null);
  const [selectedIsBlog, setSelectedIsBlog] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const getToken = () => localStorage.getItem("token");
  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  });

  const loadKB = () =>
    fetch(`${BASE_URL}/knowledge_base/articles`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        const all = d?.data?.articles || d?.articles || [];
        // exclude faq â€” those go to the FAQ page
        setKbArticles(all.filter(a => a.published && a.category !== "faq"));
      });

  const loadBlogs = () =>
    fetch(`${BASE_URL}/blog_posts`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        const posts = d?.data?.blog_posts || d?.blog_posts || [];
        setBlogPosts(posts.filter(p => p.published !== false));
      });

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([loadKB(), loadBlogs()])
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openArticle = (article, isBlog) => {
    setSelectedIsBlog(isBlog);
    setLoadingDetail(true);
    if (isBlog) {
      const id = article.slug || article.id;
      fetch(`${BASE_URL}/blog_posts/${id}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(d => setSelected(d?.data?.blog_post || d?.blog_post || article))
        .catch(() => setSelected(article))
        .finally(() => setLoadingDetail(false));
    } else {
      fetch(`${BASE_URL}/knowledge_base/articles/${article.id}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(d => setSelected(d?.data?.article || d?.article || article))
        .catch(() => setSelected(article))
        .finally(() => setLoadingDetail(false));
    }
  };

  // Unified list with source flag
  const allArticles = [
    ...blogPosts.map(a => ({ ...a, _isBlog: true })),
    ...kbArticles.map(a => ({ ...a, _isBlog: false })),
  ];

  const sourceArticles =
    tab === 0 ? allArticles :
    tab === 1 ? blogPosts.map(a => ({ ...a, _isBlog: true })) :
    kbArticles.map(a => ({ ...a, _isBlog: false }));

  // Category list depends on active tab
  const activeCategoryList =
    tab === 2 ? KB_CATEGORIES : BLOG_CATEGORIES;

  const filtered = sourceArticles.filter(a => {
    const matchCat = activeCategory === "all" || a.category === activeCategory;
    const q = search.toLowerCase();
    const tagsStr = Array.isArray(a.tags) ? a.tags.join(" ") : (a.tags || "");
    const matchSearch =
      !q ||
      a.title?.toLowerCase().includes(q) ||
      a.excerpt?.toLowerCase().includes(q) ||
      a.summary?.toLowerCase().includes(q) ||
      tagsStr.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  if (selected) return (
    <ArticleDetail article={selected} onBack={() => setSelected(null)}
      colors={colors} isBlog={selectedIsBlog} />
  );

  return (
    <Box m="20px">
      <Box mb="20px">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb="5px">
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Help Articles</Typography>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }} title="Refresh">
            <RefreshIcon />
          </IconButton>
        </Box>
        <Typography variant="h6" color={colors.grey[400]}>
          Browse blog posts and knowledge base guides from our team
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Source tabs */}
      <Tabs value={tab} onChange={(_, v) => { setTab(v); setActiveCategory("all"); }} sx={{
        mb: 2,
        "& .MuiTab-root": { color: colors.grey[400], textTransform: "none", minHeight: 40 },
        "& .Mui-selected": { color: "#fff !important" },
        "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
      }}>
        <Tab icon={<ArticleIcon sx={{ fontSize: 16 }} />} iconPosition="start"
          label={`All (${allArticles.length})`} />
        <Tab icon={<RssFeedIcon sx={{ fontSize: 16 }} />} iconPosition="start"
          label={`Blog Posts (${blogPosts.length})`} />
        <Tab icon={<MenuBookIcon sx={{ fontSize: 16 }} />} iconPosition="start"
          label={`Knowledge Base (${kbArticles.length})`} />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      ) : (
        <>
          <TextField
            placeholder="Search by title, topic, or keyword..."
            value={search} onChange={e => setSearch(e.target.value)}
            size="small" fullWidth
            sx={{
              mb: 2, maxWidth: 520,
              "& .MuiOutlinedInput-root": {
                color: colors.grey[100],
                "& fieldset": { borderColor: colors.grey[600] },
                "&:hover fieldset": { borderColor: colors.blueAccent[500] },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: colors.grey[400] }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Category chips â€” match the active tab's category set */}
          <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
            {activeCategoryList.map(cat => (
              <Chip
                key={cat.id}
                label={`${cat.icon || ""} ${cat.name}`}
                onClick={() => setActiveCategory(cat.id)}
                sx={{
                  cursor: "pointer",
                  backgroundColor: activeCategory === cat.id ? cat.color : colors.primary[400],
                  color: activeCategory === cat.id ? "#fff" : colors.grey[300],
                  border: `1px solid ${activeCategory === cat.id ? cat.color : colors.grey[700]}`,
                  "&:hover": { backgroundColor: cat.color, color: "#fff" },
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </Box>

          {filtered.length === 0 && (
            <Alert severity="info" sx={{ maxWidth: 520 }}>
              No articles found{search ? ` for "${search}"` : ""}.
            </Alert>
          )}

          <Grid container spacing={2}>
            {filtered.map((a, i) => (
              <Grid item xs={12} md={6} lg={4} key={`${a._isBlog ? "blog" : "kb"}-${a.id || i}`}>
                <BlogCard article={a} colors={colors} isBlog={a._isBlog}
                  onClick={() => openArticle(a, a._isBlog)} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {loadingDetail && (
        <Box position="fixed" top={0} left={0} right={0} bottom={0}
          display="flex" alignItems="center" justifyContent="center"
          sx={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}>
          <CircularProgress sx={{ color: colors.blueAccent[400] }} />
        </Box>
      )}
    </Box>
  );
};

export default HelpArticles;