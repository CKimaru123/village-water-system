import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,
  Chip, Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Rating, TextField,
} from "@mui/material";
import { tokens } from "../../../theme";
import StarIcon from "@mui/icons-material/Star";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CloseIcon from "@mui/icons-material/Close";
import ChatIcon from "@mui/icons-material/Chat";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";

const FeaturedPartners = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const [partners, setPartners]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [imgIdx, setImgIdx]       = useState(0);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: "", phone: "", message: "" });
  const [inquirySent, setInquirySent] = useState(false);

  useEffect(() => {
    api.get("/marketplace_items?featured=true")
      .then(res => {
        const items = res.data?.marketplace_items || [];
        setPartners(items);
        if (items.length > 0) setSelected(items[0]);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openDetail = (p) => { setSelected(p); setImgIdx(0); };
  const images = selected?.images || [];
  const prevImg = () => setImgIdx(i => (i - 1 + images.length) % images.length);
  const nextImg = () => setImgIdx(i => (i + 1) % images.length);

  const handleInquire = () => {
    if (!inquiryForm.name || !inquiryForm.phone) return;
    // Navigate to chat with prefilled message
    navigate("../chat-support", {
      state: {
        prefillMessage: `Hi, I'm interested in "${selected?.title}" by ${selected?.seller}. My name is ${inquiryForm.name}, phone: ${inquiryForm.phone}. ${inquiryForm.message}`,
      },
    });
    setInquiryOpen(false);
  };

  if (loading) return (
    <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress sx={{ color: colors.blueAccent[500] }} />
    </Box>
  );

  return (
    <Box m="20px">
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <StarIcon sx={{ color: colors.greenAccent[400], fontSize: 28 }} />
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Featured Partners</Typography>
      </Box>
      <Typography variant="h6" color={colors.grey[400]} mb={3}>
        Trusted banks, companies, and service providers for water-related products and financing
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {partners.length === 0 && !error && (
        <Alert severity="info">No featured partners at the moment. Check back soon.</Alert>
      )}

      {partners.length > 0 && (
        <Grid container spacing={3}>
          {/* Hero spotlight */}
          {selected && (
            <Grid item xs={12}>
              <Card sx={{
                backgroundColor: colors.primary[400],
                border: `2px solid ${colors.greenAccent[600]}`,
                borderRadius: 3, overflow: "hidden",
              }}>
                <Grid container>
                  {/* Image with navigation */}
                  {images.length > 0 && (
                    <Grid item xs={12} md={5}>
                      <Box sx={{ position: "relative", height: "100%", minHeight: 280, overflow: "hidden" }}>
                        <img src={images[imgIdx]} alt={selected.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={e => { e.target.style.display = "none"; }} />
                        {images.length > 1 && (
                          <>
                            <IconButton onClick={prevImg} sx={{
                              position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                              backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", size: "small",
                            }}><ChevronLeftIcon /></IconButton>
                            <IconButton onClick={nextImg} sx={{
                              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                              backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", size: "small",
                            }}><ChevronRightIcon /></IconButton>
                          </>
                        )}
                      </Box>
                    </Grid>
                  )}
                  {!images.length && (
                    <Grid item xs={12} md={5}>
                      <Box sx={{ height: "100%", minHeight: 280, backgroundColor: colors.primary[500],
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <StorefrontIcon sx={{ fontSize: 64, color: colors.greenAccent[600] }} />
                      </Box>
                    </Grid>
                  )}

                  {/* Details */}
                  <Grid item xs={12} md={7}>
                    <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <StarIcon sx={{ color: colors.greenAccent[400] }} />
                        <Chip label="Featured Partner" size="small"
                          sx={{ backgroundColor: colors.greenAccent[700], color: "#fff" }} />
                      </Box>

                      <Typography variant="h3" color={colors.grey[100]} fontWeight="bold" mb={0.5}>
                        {selected.title}
                      </Typography>
                      <Chip label={selected.category} size="small"
                        sx={{ mb: 2, backgroundColor: colors.blueAccent[700], color: "#fff", alignSelf: "flex-start" }} />

                      <Typography color={colors.grey[300]} mb={2} sx={{ flex: 1 }}>
                        {selected.description}
                      </Typography>

                      <Typography variant="h4" color={colors.greenAccent[400]} fontWeight="bold" mb={1}>
                        {selected.price ? `KES ${Number(selected.price).toLocaleString()}` : "Contact for pricing"}
                      </Typography>

                      {selected.rating > 0 && (
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Rating value={selected.rating} precision={0.5} readOnly size="small" />
                          <Typography variant="caption" color={colors.grey[400]}>
                            {selected.rating.toFixed(1)} ({selected.reviews} reviews)
                          </Typography>
                        </Box>
                      )}

                      <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />

                      <Typography variant="h6" color={colors.grey[200]} mb={1}>Contact</Typography>
                      <Typography color={colors.grey[300]} mb={0.5} fontWeight="bold">{selected.seller}</Typography>
                      {selected.sellerContact?.phone && (
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <PhoneIcon sx={{ fontSize: 16, color: colors.blueAccent[400] }} />
                          <Typography color={colors.grey[300]}>{selected.sellerContact.phone}</Typography>
                        </Box>
                      )}
                      {selected.sellerContact?.email && (
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <EmailIcon sx={{ fontSize: 16, color: colors.blueAccent[400] }} />
                          <Typography color={colors.grey[300]}>{selected.sellerContact.email}</Typography>
                        </Box>
                      )}
                      {selected.location && (
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <LocationOnIcon sx={{ fontSize: 16, color: colors.grey[500] }} />
                          <Typography color={colors.grey[400]}>{selected.location}</Typography>
                        </Box>
                      )}

                      <Button variant="contained" startIcon={<ChatIcon />}
                        onClick={() => setInquiryOpen(true)}
                        sx={{ alignSelf: "flex-start", backgroundColor: colors.greenAccent[600],
                          "&:hover": { backgroundColor: colors.greenAccent[700] } }}>
                        Inquire / Apply
                      </Button>
                    </CardContent>
                  </Grid>
                </Grid>

                {/* Specifications */}
                {selected.specifications && Object.keys(selected.specifications).length > 0 && (
                  <Box sx={{ backgroundColor: colors.primary[500], p: 3 }}>
                    <Typography variant="h6" color={colors.grey[200]} mb={2}>Details & Terms</Typography>
                    <Grid container spacing={2}>
                      {Object.entries(selected.specifications).map(([k, v]) => (
                        <Grid item xs={12} sm={6} md={4} key={k}>
                          <Box sx={{ backgroundColor: colors.primary[400], p: 1.5, borderRadius: 1 }}>
                            <Typography variant="caption" color={colors.grey[400]} sx={{ textTransform: "capitalize" }}>
                              {k.replace(/_/g, " ")}
                            </Typography>
                            <Typography variant="body2" color={colors.grey[100]} fontWeight="bold">
                              {Array.isArray(v) ? v.join(", ") : String(v)}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Card>
            </Grid>
          )}

          {/* Partner grid */}
          <Grid item xs={12}>
            <Typography variant="h5" color={colors.grey[200]} mb={2}>
              All Featured Partners ({partners.length})
            </Typography>
            <Grid container spacing={2}>
              {partners.map(p => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                  <Card
                    onClick={() => openDetail(p)}
                    sx={{
                      backgroundColor: selected?.id === p.id ? colors.primary[500] : colors.primary[400],
                      border: `1px solid ${selected?.id === p.id ? colors.greenAccent[500] : colors.grey[700]}`,
                      cursor: "pointer", transition: "all 0.2s", height: "100%",
                      "&:hover": { borderColor: colors.greenAccent[500], transform: "translateY(-2px)" },
                    }}
                  >
                    {p.images?.[0] ? (
                      <Box sx={{ height: 120, overflow: "hidden" }}>
                        <img src={p.images[0]} alt={p.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={e => { e.target.style.display = "none"; }} />
                      </Box>
                    ) : (
                      <Box sx={{ height: 80, backgroundColor: colors.primary[500],
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <StorefrontIcon sx={{ fontSize: 32, color: colors.greenAccent[600] }} />
                      </Box>
                    )}
                    <CardContent sx={{ p: 1.5 }}>
                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                        <StarIcon sx={{ fontSize: 14, color: colors.greenAccent[400] }} />
                        <Typography variant="h6" color={colors.grey[100]} fontWeight="bold" noWrap sx={{ fontSize: "0.9rem" }}>
                          {p.title}
                        </Typography>
                      </Box>
                      <Chip label={p.category} size="small"
                        sx={{ mb: 1, backgroundColor: colors.greenAccent[700], color: "#fff", fontSize: "0.7rem" }} />
                      <Typography variant="body2" color={colors.grey[400]}
                        sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", fontSize: "0.8rem" }}>
                        {p.description}
                      </Typography>
                      {p.rating > 0 && (
                        <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                          <Rating value={p.rating} precision={0.5} readOnly size="small" sx={{ fontSize: "0.8rem" }} />
                          <Typography variant="caption" color={colors.grey[400]}>({p.reviews})</Typography>
                        </Box>
                      )}
                      <Typography color={colors.greenAccent[400]} fontWeight="bold" mt={0.5} fontSize="0.9rem">
                        {p.price ? `KES ${Number(p.price).toLocaleString()}` : "Contact for price"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* Inquiry Dialog */}
      <Dialog open={inquiryOpen} onClose={() => setInquiryOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100], display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Inquire — {selected?.title}
          <IconButton onClick={() => setInquiryOpen(false)} sx={{ color: colors.grey[400] }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {inquirySent ? (
            <Box textAlign="center" py={3}>
              <Typography variant="h5" color={colors.greenAccent[400]} mb={1}>Inquiry Sent!</Typography>
              <Typography color={colors.grey[300]}>You'll be redirected to chat to continue the conversation.</Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField fullWidth label="Your Name *" value={inquiryForm.name}
                onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))} />
              <TextField fullWidth label="Your Phone *" value={inquiryForm.phone}
                onChange={e => setInquiryForm(f => ({ ...f, phone: e.target.value }))} />
              <TextField fullWidth multiline rows={3} label="Message (optional)"
                placeholder={`I'm interested in ${selected?.title}...`}
                value={inquiryForm.message}
                onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInquiryOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" startIcon={<ChatIcon />} onClick={handleInquire}
            disabled={!inquiryForm.name || !inquiryForm.phone}
            sx={{ backgroundColor: colors.greenAccent[600], "&:hover": { backgroundColor: colors.greenAccent[700] } }}>
            Send via Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeaturedPartners;
