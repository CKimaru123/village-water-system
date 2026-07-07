import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,
  Chip, TextField, InputAdornment, Button, Rating, Avatar,
  FormControl, InputLabel, Select, MenuItem, Divider,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { tokens } from "../../../theme";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import StarIcon from "@mui/icons-material/Star";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChatIcon from "@mui/icons-material/Chat";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import WaterIcon from "@mui/icons-material/Water";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import BuildIcon from "@mui/icons-material/Build";
import SupportIcon from "@mui/icons-material/Support";
import BusinessIcon from "@mui/icons-material/Business";
import api from "../../../utils/api";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  { name: "All",                   icon: <BusinessIcon sx={{ fontSize: 16 }} /> },
  { name: "Water Storage & Tanks", icon: <WaterIcon sx={{ fontSize: 16 }} /> },
  { name: "Irrigation Equipment",  icon: <AgricultureIcon sx={{ fontSize: 16 }} /> },
  { name: "Pipes & Fittings",      icon: <BuildIcon sx={{ fontSize: 16 }} /> },
  { name: "Pumps & Motors",        icon: <WaterIcon sx={{ fontSize: 16 }} /> },
  { name: "Water Treatment",       icon: <WaterIcon sx={{ fontSize: 16 }} /> },
  { name: "Farm Animals",          icon: <AgricultureIcon sx={{ fontSize: 16 }} /> },
  { name: "Farm Products",         icon: <AgricultureIcon sx={{ fontSize: 16 }} /> },
  { name: "Farming Equipment",     icon: <AgricultureIcon sx={{ fontSize: 16 }} /> },
  { name: "Protective Gear",       icon: <SupportIcon sx={{ fontSize: 16 }} /> },
  { name: "Plumbing Services",     icon: <BuildIcon sx={{ fontSize: 16 }} /> },
  { name: "Water Testing",         icon: <WaterIcon sx={{ fontSize: 16 }} /> },
  { name: "Agricultural Loans",    icon: <AttachMoneyIcon sx={{ fontSize: 16 }} /> },
  { name: "Other Services",        icon: <SupportIcon sx={{ fontSize: 16 }} /> },
];

const SORT_OPTIONS = [
  { value: "recent",     label: "Newest First" },
  { value: "price-low",  label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating",     label: "Highest Rated" },
  { value: "popular",    label: "Most Popular" },
];

/* ── Custom carousel — no external CSS, no gap ─────────────────────── */
const FeaturedCarousel = ({ items, colors, onOpen }) => {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const perPage = 3;
  const total = Math.ceil(items.length / perPage);

  const go = useCallback((n) => {
    setIdx((n + total) % total);
  }, [total]);

  useEffect(() => {
    timerRef.current = setInterval(() => go(idx + 1), 3500);
    return () => clearInterval(timerRef.current);
  }, [idx, go]);

  const visible = items.slice(idx * perPage, idx * perPage + perPage);

  return (
    <Box sx={{ position: "relative" }}>
      <Grid container spacing={2}>
        {visible.map(item => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card onClick={() => onOpen(item)} sx={{
              backgroundColor: colors.primary[400], cursor: "pointer", borderRadius: 2,
              border: `2px solid ${colors.greenAccent[700]}`, overflow: "hidden",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                borderColor: colors.greenAccent[500] },
            }}>
              <Box sx={{ position: "relative" }}>
                {item.images?.[0] ? (
                  <Box sx={{ height: 130, overflow: "hidden" }}>
                    <img src={item.images[0]} alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { e.target.style.display = "none"; }} />
                  </Box>
                ) : (
                  <Box sx={{ height: 100, backgroundColor: colors.primary[500],
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <StorefrontIcon sx={{ fontSize: 36, color: colors.greenAccent[600] }} />
                  </Box>
                )}
                <Chip label="Premium" size="small" sx={{
                  position: "absolute", top: 8, right: 8,
                  backgroundColor: "#f0c040", color: "#000", fontWeight: "bold", fontSize: "0.7rem",
                }} />
                <Avatar sx={{
                  position: "absolute", bottom: -14, left: 12,
                  width: 32, height: 32, border: "2px solid #fff",
                  backgroundColor: colors.blueAccent[700], fontSize: "0.75rem",
                }}>
                  {item.seller?.[0]?.toUpperCase() || "S"}
                </Avatar>
              </Box>
              <CardContent sx={{ pt: 3 }}>
                <Typography variant="h6" color={colors.grey[100]} fontWeight="bold" noWrap>
                  {item.title}
                </Typography>
                <Typography variant="caption" color={colors.greenAccent[400]} display="block" mb={0.5}>
                  {item.category}
                </Typography>
                <Typography variant="body2" color={colors.grey[400]} mb={1}
                  sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {item.description}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography color={colors.greenAccent[300]} fontWeight="bold" fontSize="0.9rem">
                    {item.price ? `KES ${Number(item.price).toLocaleString()}` : "Contact for price"}
                  </Typography>
                  <Button size="small" variant="contained"
                    onClick={e => { e.stopPropagation(); onOpen(item); }}
                    sx={{ backgroundColor: colors.greenAccent[600], color: "#fff", fontSize: "0.7rem",
                      "&:hover": { backgroundColor: colors.greenAccent[700] } }}>
                    View
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Nav arrows + dots */}
      {total > 1 && (
        <Box display="flex" justifyContent="center" alignItems="center" gap={1} mt={1.5}>
          <IconButton size="small" onClick={() => go(idx - 1)}
            sx={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.15)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" } }}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          {Array.from({ length: total }).map((_, i) => (
            <Box key={i} onClick={() => go(i)} sx={{
              width: i === idx ? 20 : 8, height: 8, borderRadius: 4, cursor: "pointer",
              backgroundColor: i === idx ? colors.greenAccent[400] : "rgba(255,255,255,0.35)",
              transition: "all 0.3s",
            }} />
          ))}
          <IconButton size="small" onClick={() => go(idx + 1)}
            sx={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.15)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" } }}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

const Marketplace = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();

  const [items, setItems]       = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy]     = useState("recent");
  const [selected, setSelected] = useState(null);
  const [imgIdx, setImgIdx]     = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ sort_by: sortBy });
    if (category !== "All") p.set("category", category);
    if (search) p.set("search", search);
    Promise.all([
      api.get(`/marketplace_items?${p}`),
      api.get("/marketplace_items?featured=true"),
    ])
      .then(([all, feat]) => {
        setItems(all.data?.marketplace_items || []);
        setFeatured(feat.data?.marketplace_items || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [category, sortBy, search]);

  useEffect(() => { load(); }, [load]);

  const open  = (item) => { setSelected(item); setImgIdx(0); };
  const close = () => setSelected(null);
  const imgs  = selected?.images || [];
  const prev  = () => setImgIdx(i => (i - 1 + imgs.length) % imgs.length);
  const next  = () => setImgIdx(i => (i + 1) % imgs.length);

  const contact = (item) => navigate("../chat-support", {
    state: { prefillMessage: `Hi, I'm interested in "${item.title}" listed by ${item.seller}. ` },
  });

  const ItemCard = ({ item }) => (
    <Card onClick={() => open(item)} sx={{
      backgroundColor: colors.primary[400], height: "100%", cursor: "pointer",
      display: "flex", flexDirection: "column",
      border: item.featured ? `1px solid ${colors.greenAccent[600]}` : `1px solid ${colors.primary[600]}`,
      transition: "transform 0.2s, box-shadow 0.2s",
      "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" },
    }}>
      {item.images?.[0] ? (
        <Box sx={{ height: 140, overflow: "hidden", flexShrink: 0 }}>
          <img src={item.images[0]} alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { e.target.style.display = "none"; }} />
        </Box>
      ) : (
        <Box sx={{ height: 110, backgroundColor: colors.primary[500], flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <StorefrontIcon sx={{ fontSize: 40, color: colors.grey[600] }} />
        </Box>
      )}
      <CardContent sx={{ p: 1.5, flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
          <Typography variant="h6" color={colors.grey[100]} fontWeight="bold"
            sx={{ fontSize: "0.95rem", lineHeight: 1.3, flex: 1, mr: 1 }}>
            {item.title}
          </Typography>
          {item.featured && (
            <Chip label="Featured" size="small"
              sx={{ backgroundColor: "#f0c040", color: "#000", fontSize: "0.65rem", fontWeight: "bold", height: 20 }} />
          )}
        </Box>
        <Chip label={item.category} size="small"
          sx={{ mb: 1, alignSelf: "flex-start", backgroundColor: colors.primary[500],
            color: colors.grey[300], fontSize: "0.7rem" }} />
        <Typography variant="body2" color={colors.grey[400]} mb={1.5}
          sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical", fontSize: "0.82rem", flexGrow: 1 }}>
          {item.description}
        </Typography>
        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
          <AttachMoneyIcon sx={{ fontSize: 16, color: colors.greenAccent[400] }} />
          <Typography color={colors.greenAccent[400]} fontWeight="bold" fontSize="1rem">
            {item.price ? `KES ${Number(item.price).toLocaleString()}` : "Contact for price"}
          </Typography>
        </Box>
        {item.rating > 0 && (
          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
            <StarIcon sx={{ fontSize: 14, color: "#f0c040" }} />
            <Typography variant="caption" color={colors.grey[300]}>
              {item.rating.toFixed(1)} ({item.reviews} reviews)
            </Typography>
          </Box>
        )}
        {item.location && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <LocationOnIcon sx={{ fontSize: 13, color: colors.grey[500] }} />
            <Typography variant="caption" color={colors.grey[500]}>{item.location}</Typography>
          </Box>
        )}
        <Box display="flex" alignItems="center" gap={1} mt={1.5} pt={1}
          sx={{ borderTop: `1px solid ${colors.primary[600]}` }}>
          <Avatar sx={{ width: 24, height: 24, backgroundColor: colors.blueAccent[700], fontSize: "0.7rem" }}>
            {item.seller?.[0]?.toUpperCase() || "S"}
          </Avatar>
          <Typography variant="caption" color={colors.grey[400]} noWrap>{item.seller}</Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <Box sx={{ background: "linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%)", px: 2, py: 3 }}>
        <Typography variant="h2" color="#fff" fontWeight="bold" mb={0.5}>
          Water &amp; Farming Marketplace
        </Typography>
        <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.85)", mb: 3 }}>
          Discover trusted suppliers, products, and services to power your water and farm operations
        </Typography>
        <Box sx={{ maxWidth: 600, mb: 3 }}>
          <TextField fullWidth placeholder="Search products, services, or sellers..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load()}
            size="small"
            sx={{
              backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 2,
              "& .MuiOutlinedInput-root": {
                color: "#fff", borderRadius: 2,
                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.6)" },
                "&.Mui-focused fieldset": { borderColor: "#fff" },
              },
              "& input::placeholder": { color: "rgba(255,255,255,0.6)", opacity: 1 },
            }}
            InputProps={{ startAdornment:
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "rgba(255,255,255,0.7)" }} />
              </InputAdornment>
            }}
          />
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {CATEGORIES.map(cat => (
            <Chip key={cat.name} label={cat.name} icon={cat.icon}
              onClick={() => setCategory(cat.name)}
              variant={category === cat.name ? "filled" : "outlined"}
              sx={{
                color: "#fff", borderColor: "rgba(255,255,255,0.5)",
                backgroundColor: category === cat.name ? "rgba(255,255,255,0.25)" : "transparent",
                "& .MuiChip-icon": { color: "#fff" },
                "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
                cursor: "pointer",
              }}
            />
          ))}
        </Box>
      </Box>

      {/* ── Premium Partners carousel (no react-slick, no gap) ──────────── */}
      {featured.length > 0 && (
        <Box sx={{ backgroundColor: colors.primary[600], px: 2, py: 2 }}>
          <Typography variant="h4" color="#fff" fontWeight="bold" textAlign="center" mb={0.5}>
            Premium Partners
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", textAlign: "center", mb: 2 }}>
            Trusted suppliers and service providers for your water and farm needs
          </Typography>
          <FeaturedCarousel items={featured} colors={colors} onOpen={open} />
        </Box>
      )}

      {/* ── Filters + grid ──────────────────────────────────────────────── */}
      <Box sx={{ px: 2, pt: 1.5, pb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center",
          mb: 2, p: 1.5, borderRadius: 1, backgroundColor: colors.primary[400] }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel sx={{ color: colors.grey[400] }}>Sort By</InputLabel>
            <Select value={sortBy} onChange={e => setSortBy(e.target.value)} label="Sort By"
              sx={{ color: colors.grey[100],
                "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[700] } }}>
              {SORT_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, flex: 1 }}>
            {CATEGORIES.map(cat => (
              <Chip key={cat.name} label={cat.name} size="small"
                onClick={() => setCategory(cat.name)}
                sx={{
                  backgroundColor: category === cat.name ? colors.blueAccent[600] : colors.primary[500],
                  color: category === cat.name ? "#fff" : colors.grey[300],
                  cursor: "pointer", fontSize: "0.75rem",
                  "&:hover": { backgroundColor: category === cat.name ? colors.blueAccent[600] : colors.primary[600] },
                }}
              />
            ))}
          </Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography variant="caption" color={colors.grey[500]}>
              {items.length} result{items.length !== 1 ? "s" : ""}
            </Typography>
            <Button size="small"
              onClick={() => { setSearch(""); setCategory("All"); setSortBy("recent"); }}
              sx={{ color: colors.blueAccent[400], fontSize: "0.72rem", textTransform: "none",
                minWidth: 0, whiteSpace: "nowrap" }}>
              Clear filters
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {loading && <Box display="flex" justifyContent="center" mt={6}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>}
        {!loading && items.length === 0 && (
          <Box textAlign="center" py={8}>
            <StorefrontIcon sx={{ fontSize: 64, color: colors.grey[600], mb: 2 }} />
            <Typography variant="h5" color={colors.grey[400]}>No items found</Typography>
            <Typography variant="body2" color={colors.grey[600]} mt={1}>Try adjusting your filters or search terms</Typography>
          </Box>
        )}
        <Grid container spacing={2}>
          {items.map(item => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <ItemCard item={item} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Detail dialog ────────────────────────────────────────────────── */}
      <Dialog open={!!selected} onClose={close} maxWidth="md" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400], color: colors.grey[100] } }}>
        {selected && (
          <>
            <DialogTitle sx={{ p: 0, position: "relative" }}>
              {imgs.length > 0 ? (
                <Box sx={{ position: "relative", height: 280, overflow: "hidden", backgroundColor: colors.primary[500] }}>
                  <img src={imgs[imgIdx]} alt={selected.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { e.target.style.display = "none"; }} />
                  {imgs.length > 1 && (
                    <>
                      <IconButton onClick={prev} sx={{ position: "absolute", left: 8, top: "50%",
                        transform: "translateY(-50%)", backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}>
                        <ChevronLeftIcon />
                      </IconButton>
                      <IconButton onClick={next} sx={{ position: "absolute", right: 48, top: "50%",
                        transform: "translateY(-50%)", backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}>
                        <ChevronRightIcon />
                      </IconButton>
                      <Box sx={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 0.5 }}>
                        {imgs.map((_, i) => (
                          <Box key={i} onClick={() => setImgIdx(i)} sx={{
                            width: 8, height: 8, borderRadius: "50%", cursor: "pointer",
                            backgroundColor: i === imgIdx ? "#fff" : "rgba(255,255,255,0.4)",
                          }} />
                        ))}
                      </Box>
                    </>
                  )}
                  <IconButton onClick={close} sx={{ position: "absolute", top: 8, right: 8,
                    backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              ) : (
                <Box display="flex" justifyContent="flex-end" p={1}>
                  <IconButton onClick={close} sx={{ color: colors.grey[400] }}><CloseIcon /></IconButton>
                </Box>
              )}
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography variant="h4" color={colors.grey[100]} fontWeight="bold" sx={{ flex: 1, mr: 1 }}>
                  {selected.title}
                </Typography>
                {selected.featured && <Chip label="Featured" size="small" sx={{ backgroundColor: "#f0c040", color: "#000", fontWeight: "bold" }} />}
              </Box>
              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                <Chip label={selected.category} size="small" sx={{ backgroundColor: colors.blueAccent[700], color: "#fff" }} />
                {!selected.inStock && <Chip label="Out of Stock" size="small" sx={{ backgroundColor: "#b71c1c", color: "#fff" }} />}
              </Box>
              <Typography color={colors.grey[300]} mb={2}>{selected.description}</Typography>
              <Typography variant="h4" color={colors.greenAccent[400]} fontWeight="bold" mb={1}>
                {selected.price ? `KES ${Number(selected.price).toLocaleString()}` : "Contact for price"}
              </Typography>
              {selected.rating > 0 && (
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Rating value={selected.rating} precision={0.5} readOnly size="small" />
                  <Typography variant="caption" color={colors.grey[400]}>
                    {selected.rating.toFixed(1)} ({selected.reviews} reviews)
                  </Typography>
                </Box>
              )}
              {selected.specifications && Object.keys(selected.specifications).length > 0 && (
                <>
                  <Divider sx={{ borderColor: colors.grey[700], my: 2 }} />
                  <Typography variant="h6" color={colors.grey[200]} mb={1}>Specifications</Typography>
                  <Grid container spacing={1}>
                    {Object.entries(selected.specifications).map(([k, v]) => (
                      <Grid item xs={12} sm={6} key={k}>
                        <Box sx={{ backgroundColor: colors.primary[500], p: 1, borderRadius: 1 }}>
                          <Typography variant="caption" color={colors.grey[400]} sx={{ textTransform: "capitalize" }}>
                            {k.replace(/_/g, " ")}
                          </Typography>
                          <Typography variant="body2" color={colors.grey[100]}>
                            {Array.isArray(v) ? v.join(", ") : String(v)}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
              <Divider sx={{ borderColor: colors.grey[700], my: 2 }} />
              <Typography variant="h6" color={colors.grey[200]} mb={1}>Seller Information</Typography>
              <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                <Avatar sx={{ backgroundColor: colors.blueAccent[700] }}>
                  {selected.seller?.[0]?.toUpperCase() || "S"}
                </Avatar>
                <Typography color={colors.grey[200]} fontWeight="bold">{selected.seller}</Typography>
              </Box>
              {selected.location && (
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <LocationOnIcon sx={{ fontSize: 16, color: colors.grey[500] }} />
                  <Typography color={colors.grey[400]}>{selected.location}</Typography>
                </Box>
              )}
              {selected.sellerContact?.phone && (
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <PhoneIcon sx={{ fontSize: 16, color: colors.blueAccent[400] }} />
                  <Typography color={colors.grey[300]}>{selected.sellerContact.phone}</Typography>
                </Box>
              )}
              {selected.sellerContact?.email && (
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon sx={{ fontSize: 16, color: colors.blueAccent[400] }} />
                  <Typography color={colors.grey[300]}>{selected.sellerContact.email}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
              <Button onClick={close} sx={{ color: colors.grey[400] }}>Close</Button>
              <Button variant="contained" startIcon={<ChatIcon />}
                onClick={() => { close(); contact(selected); }}
                sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[700] } }}>
                Contact Seller
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Marketplace;
