import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,
  Button, Chip, Divider, Tabs, Tab, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Rating,
} from "@mui/material";
import { tokens } from "../../../theme";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ChatIcon from "@mui/icons-material/Chat";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import StarIcon from "@mui/icons-material/Star";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";

const MyAds = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const [ads, setAds]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState(0);
  const [selected, setSelected] = useState(null);
  const [imgIdx, setImgIdx]   = useState(0);

  useEffect(() => {
    api.get("/marketplace_items?my_ads=true")
      .then(r => setAds(r.data?.marketplace_items || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total:      ads.length,
    active:     ads.filter(a => a.active).length,
    totalViews: ads.reduce((s, a) => s + (a.viewsCount || 0), 0),
    featured:   ads.filter(a => a.featured).length,
  }), [ads]);

  const filtered = useMemo(() => {
    if (tab === 1) return ads.filter(a => a.active);
    if (tab === 2) return ads.filter(a => !a.active);
    return ads;
  }, [ads, tab]);

  const openDetail = (ad) => { setSelected(ad); setImgIdx(0); };
  const closeDetail = () => setSelected(null);
  const images = selected?.images || [];
  const prevImg = () => setImgIdx(i => (i - 1 + images.length) % images.length);
  const nextImg = () => setImgIdx(i => (i + 1) % images.length);

  const requestChanges = (ad) => {
    navigate("../chat-support", {
      state: { prefillMessage: `Hi, I'd like to request changes to my listing: "${ad.title}" (ID: ${ad.id}). ` },
    });
  };

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">My Listings</Typography>
          <Typography variant="h6" color={colors.grey[400]}>
            Your marketplace listings managed by the water authority admin
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<ChatIcon />}
          onClick={() => navigate("../chat-support")}
          sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[400] }}>
          Contact Admin
        </Button>
      </Box>

      {/* Stats */}
      {ads.length > 0 && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: "Total Listings", value: stats.total,                    color: colors.grey[100],        icon: <StorefrontIcon /> },
            { label: "Active",         value: stats.active,                   color: colors.greenAccent[400], icon: <TrendingUpIcon /> },
            { label: "Total Views",    value: stats.totalViews.toLocaleString(), color: colors.blueAccent[400],  icon: <VisibilityIcon /> },
            { label: "Featured",       value: stats.featured,                 color: "#f0c040",               icon: <StarIcon /> },
          ].map(s => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Card sx={{ backgroundColor: colors.primary[400] }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Box sx={{ color: s.color, display: "flex" }}>{s.icon}</Box>
                    <Typography variant="h4" color={s.color} fontWeight="bold">{s.value}</Typography>
                  </Box>
                  <Typography variant="caption" color={colors.grey[400]}>{s.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Info banner */}
      <Alert severity="info" icon={<InfoOutlinedIcon />}
        sx={{ mb: 3, backgroundColor: colors.primary[500], color: colors.grey[200] }}>
        Listings are managed by the water authority admin. To add a new listing or request changes
        (price update, new images, description), use <strong>Request Changes</strong> or contact admin via chat.
      </Alert>

      {error   && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {loading && <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>}

      {!loading && ads.length === 0 && !error && (
        <Card sx={{ backgroundColor: colors.primary[400], p: 4, textAlign: "center" }}>
          <StorefrontIcon sx={{ fontSize: 64, color: colors.grey[600], mb: 2 }} />
          <Typography variant="h5" color={colors.grey[300]} mb={1}>No listings yet</Typography>
          <Typography color={colors.grey[500]} mb={3}>
            Contact the admin team to have your products or services listed on the marketplace.
          </Typography>
          <Button variant="contained" startIcon={<ChatIcon />}
            onClick={() => navigate("../chat-support")}
            sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[700] } }}>
            Chat with Admin
          </Button>
        </Card>
      )}

      {ads.length > 0 && (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
            mb: 3,
            "& .MuiTab-root": { color: colors.grey[400] },
            "& .Mui-selected": { color: colors.blueAccent[400] },
            "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
          }}>
            <Tab label={`All (${ads.length})`} />
            <Tab label={`Active (${stats.active})`} />
            <Tab label={`Inactive (${ads.length - stats.active})`} />
          </Tabs>

          <Grid container spacing={3}>
            {filtered.map(ad => (
              <Grid item xs={12} sm={6} md={4} key={ad.id}>
                <Card sx={{
                  backgroundColor: colors.primary[400], height: "100%",
                  border: ad.featured ? `1px solid ${colors.greenAccent[600]}` : "none",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": { transform: "translateY(-3px)", boxShadow: "0 6px 20px rgba(0,0,0,0.4)" },
                }}>
                  {/* Image */}
                  {ad.images?.[0] ? (
                    <Box sx={{ height: 160, overflow: "hidden", cursor: "pointer" }} onClick={() => openDetail(ad)}>
                      <img src={ad.images[0]} alt={ad.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { e.target.style.display = "none"; }} />
                    </Box>
                  ) : (
                    <Box sx={{ height: 120, backgroundColor: colors.primary[500],
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      onClick={() => openDetail(ad)}>
                      <StorefrontIcon sx={{ fontSize: 40, color: colors.grey[600] }} />
                    </Box>
                  )}

                  <CardContent>
                    {/* Title + badges */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" color={colors.grey[100]} fontWeight="bold"
                        sx={{ flex: 1, mr: 1, cursor: "pointer" }} onClick={() => openDetail(ad)}>
                        {ad.title}
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={0.5} alignItems="flex-end">
                        {ad.featured && (
                          <Chip label="Featured" size="small"
                            sx={{ backgroundColor: colors.greenAccent[700], color: "#fff", fontSize: "0.65rem" }} />
                        )}
                        <Chip label={ad.active ? "Active" : "Inactive"} size="small"
                          sx={{ backgroundColor: ad.active ? colors.greenAccent[800] : colors.grey[700],
                            color: "#fff", fontSize: "0.65rem" }} />
                      </Box>
                    </Box>

                    <Chip label={ad.category} size="small"
                      sx={{ mb: 1.5, backgroundColor: colors.primary[500], color: colors.grey[300] }} />

                    <Typography variant="body2" color={colors.grey[400]} mb={1.5}
                      sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {ad.description}
                    </Typography>

                    <Typography color={colors.greenAccent[400]} fontWeight="bold" fontSize="1.1rem" mb={1}>
                      {ad.price ? `KES ${Number(ad.price).toLocaleString()}` : "Contact for price"}
                    </Typography>

                    {/* Analytics */}
                    <Box display="flex" gap={2} mb={1} flexWrap="wrap">
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <VisibilityIcon sx={{ fontSize: 14, color: colors.blueAccent[400] }} />
                        <Typography variant="caption" color={colors.grey[400]}>{ad.viewsCount || 0} views</Typography>
                      </Box>
                      {ad.rating > 0 && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <StarIcon sx={{ fontSize: 14, color: "#f0c040" }} />
                          <Typography variant="caption" color={colors.grey[300]}>
                            {ad.rating.toFixed(1)} ({ad.reviews} reviews)
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {ad.location && (
                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                        <LocationOnIcon sx={{ fontSize: 14, color: colors.grey[500] }} />
                        <Typography variant="caption" color={colors.grey[500]}>{ad.location}</Typography>
                      </Box>
                    )}

                    <Divider sx={{ borderColor: colors.grey[700], my: 1.5 }} />

                    <Box display="flex" gap={1}>
                      <Button size="small" variant="outlined" onClick={() => openDetail(ad)}
                        sx={{ flex: 1, borderColor: colors.grey[600], color: colors.grey[300],
                          "&:hover": { borderColor: colors.grey[400] } }}>
                        View Details
                      </Button>
                      <Button size="small" variant="outlined" startIcon={<ChatIcon />}
                        onClick={() => requestChanges(ad)}
                        sx={{ flex: 1, borderColor: colors.blueAccent[500], color: colors.blueAccent[400],
                          "&:hover": { backgroundColor: colors.blueAccent[900] } }}>
                        Request Changes
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onClose={closeDetail} maxWidth="md" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400], color: colors.grey[100] } }}>
        {selected && (
          <>
            <DialogTitle sx={{ p: 0, position: "relative" }}>
              {images.length > 0 && (
                <Box sx={{ position: "relative", height: 260, overflow: "hidden", backgroundColor: colors.primary[500] }}>
                  <img src={images[imgIdx]} alt={selected.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { e.target.style.display = "none"; }} />
                  {images.length > 1 && (
                    <>
                      <IconButton onClick={prevImg} sx={{
                        position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                        backgroundColor: "rgba(0,0,0,0.5)", color: "#fff",
                      }}><ChevronLeftIcon /></IconButton>
                      <IconButton onClick={nextImg} sx={{
                        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                        backgroundColor: "rgba(0,0,0,0.5)", color: "#fff",
                      }}><ChevronRightIcon /></IconButton>
                      <Box sx={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
                        display: "flex", gap: 0.5 }}>
                        {images.map((_, i) => (
                          <Box key={i} onClick={() => setImgIdx(i)} sx={{
                            width: 8, height: 8, borderRadius: "50%", cursor: "pointer",
                            backgroundColor: i === imgIdx ? "#fff" : "rgba(255,255,255,0.4)",
                          }} />
                        ))}
                      </Box>
                    </>
                  )}
                  <IconButton onClick={closeDetail} sx={{
                    position: "absolute", top: 8, right: 8,
                    backgroundColor: "rgba(0,0,0,0.5)", color: "#fff",
                  }}><CloseIcon /></IconButton>
                </Box>
              )}
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography variant="h4" color={colors.grey[100]} fontWeight="bold" sx={{ flex: 1, mr: 1 }}>
                  {selected.title}
                </Typography>
                {selected.featured && <Chip label="Featured" size="small" sx={{ backgroundColor: "#f0c040", color: "#000" }} />}
              </Box>
              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                <Chip label={selected.category} size="small" sx={{ backgroundColor: colors.blueAccent[700], color: "#fff" }} />
                <Chip label={selected.active ? "Active" : "Inactive"} size="small"
                  sx={{ backgroundColor: selected.active ? colors.greenAccent[700] : colors.grey[700], color: "#fff" }} />
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
                    {selected.rating.toFixed(1)} ({selected.reviews} reviews) · {selected.viewsCount || 0} views
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
              <Typography variant="h6" color={colors.grey[200]} mb={1}>Seller Contact</Typography>
              <Typography color={colors.grey[300]} mb={0.5}><strong>{selected.seller}</strong></Typography>
              {selected.location && (
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <LocationOnIcon sx={{ fontSize: 15, color: colors.grey[500] }} />
                  <Typography variant="body2" color={colors.grey[400]}>{selected.location}</Typography>
                </Box>
              )}
              {selected.sellerContact?.phone && (
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <PhoneIcon sx={{ fontSize: 15, color: colors.blueAccent[400] }} />
                  <Typography variant="body2" color={colors.grey[300]}>{selected.sellerContact.phone}</Typography>
                </Box>
              )}
              {selected.sellerContact?.email && (
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon sx={{ fontSize: 15, color: colors.blueAccent[400] }} />
                  <Typography variant="body2" color={colors.grey[300]}>{selected.sellerContact.email}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
              <Button onClick={closeDetail} sx={{ color: colors.grey[400] }}>Close</Button>
              <Button variant="contained" startIcon={<ChatIcon />}
                onClick={() => { closeDetail(); requestChanges(selected); }}
                sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[700] } }}>
                Request Changes
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default MyAds;
