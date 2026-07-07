import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, InputAdornment, Switch, FormControlLabel,
  Tabs, Tab, Autocomplete, Divider, Rating, Tooltip,
} from "@mui/material";
import { tokens } from "../../../theme";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PersonIcon from "@mui/icons-material/Person";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LinkIcon from "@mui/icons-material/Link";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import adminApi from "../../../utils/api";

const CATEGORIES = [
  "Water Storage & Tanks","Irrigation Equipment","Pipes & Fittings","Pumps & Motors",
  "Water Treatment","Farm Animals","Farm Products","Farming Equipment","Protective Gear",
  "Plumbing Services","Water Testing","Agricultural Loans","Other Services",
];

const EMPTY = {
  title:"", description:"", price:"", category:CATEGORIES[0],
  seller_name:"", seller_phone:"", seller_email:"", location:"",
  featured:false, active:true, in_stock:true, tags:"",
  images:[], specifications:{}, seller_user_id:null,
};

// Shared input styles for the modal — white text on dark background
const inputSx = {
  mb: 2,
  "& .MuiInputLabel-root": { color: "#b0b8c1", fontSize: "0.95rem" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#90caf9" },
  "& .MuiOutlinedInput-root": {
    color: "#ffffff",
    fontSize: "0.95rem",
    "& fieldset": { borderColor: "#4a5568" },
    "&:hover fieldset": { borderColor: "#90caf9" },
    "&.Mui-focused fieldset": { borderColor: "#90caf9" },
  },
  "& .MuiFormHelperText-root": { color: "#8a9bb0", fontSize: "0.8rem" },
  "& .MuiSelect-icon": { color: "#b0b8c1" },
};

const MarketplaceManagement = () => {
  const colors = tokens("dark");
  const fileInputRef = useRef(null);
  const [items, setItems]           = useState([]);
  const [clients, setClients]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);
  const [open, setOpen]             = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("All");
  const [filterFeat, setFilterFeat] = useState("all");
  const [tab, setTab]               = useState(0);
  const [preview, setPreview]       = useState(null);
  const [urlInput, setUrlInput]     = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);

  // ── Data loading ─────────────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ admin: "true" });
    if (filterCat !== "All") p.set("category", filterCat);
    if (search) p.set("search", search);
    if (filterFeat === "featured") p.set("featured", "true");
    adminApi.get(`/marketplace_items?${p}`)
      .then(r => setItems(r?.data?.marketplace_items || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [filterCat, search, filterFeat]);

  const loadClients = useCallback(() => {
    adminApi.get("/admin/clients?per_page=200")
      .then(r => setClients(r?.data?.clients || []))
      .catch(() => setClients([]));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadClients(); }, [loadClients]);

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const openCreate = () => { setEditing(null); setForm(EMPTY); setUrlInput(""); setOpen(true); };
  const openEdit   = (item) => {
    setEditing(item);
    setForm({
      title: item.title||"", description: item.description||"",
      price: item.price||"", category: item.category||CATEGORIES[0],
      seller_name: item.seller||"", seller_phone: item.sellerContact?.phone||"",
      seller_email: item.sellerContact?.email||"", location: item.location||"",
      featured: item.featured||false, active: item.active!==false,
      in_stock: item.inStock!==false,
      tags: item.tags?.join(", ")||"",
      images: item.images||[], specifications: item.specifications||{},
      seller_user_id: item.sellerUserId||null,
    });
    setUrlInput("");
    setOpen(true);
  };

  const set    = f => e => setForm(v => ({...v, [f]: e.target.value}));
  const setChk = f => e => setForm(v => ({...v, [f]: e.target.checked}));

  // ── Image helpers ─────────────────────────────────────────────────────────────
  const addImageUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (form.images.length >= 5) { setError("Maximum 5 images allowed."); return; }
    setForm(v => ({ ...v, images: [...v.images, url] }));
    setUrlInput("");
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - form.images.length;
    if (remaining <= 0) { setError("Maximum 5 images allowed."); return; }
    setUploadingImg(true);
    const toProcess = files.slice(0, remaining);
    const readers = toProcess.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = ev => resolve(ev.target.result);
      reader.readAsDataURL(file);
    }));
    Promise.all(readers).then(dataUrls => {
      setForm(v => ({ ...v, images: [...v.images, ...dataUrls] }));
      setUploadingImg(false);
    });
    e.target.value = "";
  };

  const removeImage = (idx) => setForm(v => ({ ...v, images: v.images.filter((_, i) => i !== idx) }));

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title || !form.description || !form.seller_name) {
      setError("Title, description, and seller name are required."); return;
    }
    setSaving(true);
    try {
      const payload = { marketplace_item: {
        ...form, price: parseFloat(form.price)||0,
        images: form.images.length ? form.images : [""],
        seller_user_id: form.seller_user_id||null,
      }};
      if (editing) {
        await adminApi.patch(`/marketplace_items/${editing.id}`, payload);
        setSuccess("Listing updated.");
      } else {
        await adminApi.post("/marketplace_items", payload);
        setSuccess("Listing created.");
      }
      setOpen(false); load();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try { await adminApi.delete(`/marketplace_items/${id}`); setSuccess("Deleted."); load(); }
    catch(e) { setError(e.message); }
  };

  const toggle = (field, item) => async (e) => {
    e.stopPropagation();
    const val = field==="featured" ? !item.featured : field==="active" ? !item.active : !item.inStock;
    try { await adminApi.patch(`/marketplace_items/${item.id}`, { marketplace_item: { [field]: val } }); load(); }
    catch(e) { setError(e.message); }
  };

  const displayed = items.filter(i => tab===1 ? i.featured : tab===2 ? !i.active : true);

  const clientOpts = clients.map(c => ({
    id: c.id,
    label: c.institution_name ? `${c.institution_name} (${c.email})` : `${c.first_name} ${c.last_name} (${c.email})`,
  }));
  const selClient = clientOpts.find(o => o.id === form.seller_user_id) || null;

  const stats = [
    { label:"Total Listings", value: items.length,                        color: colors.grey[100] },
    { label:"Featured",       value: items.filter(i=>i.featured).length,  color: "#f0c040" },
    { label:"Active",         value: items.filter(i=>i.active).length,    color: colors.greenAccent[400] },
    { label:"Assigned",       value: items.filter(i=>i.sellerUserId).length, color: colors.blueAccent[400] },
  ];

  // Modal background
  const modalBg = "#1a2332";
  const modalCard = "#243044";
  const labelColor = "#b0b8c1";
  const textColor = "#ffffff";

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Marketplace Management</Typography>
          <Typography variant="h6" color={colors.grey[400]}>
            All listings from the public marketplace — manage, assign to clients, feature, and control visibility
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[700] }, fontSize: "0.95rem", px: 3 }}>
          Add Listing
        </Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {stats.map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="h3" color={s.color} fontWeight="bold">{s.value}</Typography>
                <Typography variant="caption" color={colors.grey[400]}>{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Card sx={{ backgroundColor: colors.primary[400], mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" placeholder="Search listings..."
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyPress={e => e.key === "Enter" && load()}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[400] }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select value={filterCat} onChange={e => setFilterCat(e.target.value)} label="Category">
                  <MenuItem value="All">All Categories</MenuItem>
                  {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Show</InputLabel>
                <Select value={filterFeat} onChange={e => setFilterFeat(e.target.value)} label="Show">
                  <MenuItem value="all">All Listings</MenuItem>
                  <MenuItem value="featured">Featured Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button fullWidth variant="outlined" onClick={load}
                sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[400] }}>
                Search
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2,
        "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
        "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
        "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
      }}>
        <Tab label={`All (${items.length})`} />
        <Tab label={`Featured (${items.filter(i => i.featured).length})`} />
        <Tab label={`Inactive (${items.filter(i => !i.active).length})`} />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>
      ) : (
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent sx={{ p: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: colors.primary[500] }}>
                  {["Item", "Category", "Seller", "Assigned To", "Price", "Status", "Views", "Actions"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[300], fontWeight: "bold", py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(item => (
                  <TableRow key={item.id} sx={{ "&:hover": { backgroundColor: colors.primary[500] }, cursor: "pointer" }}
                    onClick={() => setPreview(item)}>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {item.images?.[0] ? (
                          <Box sx={{ width: 40, height: 40, borderRadius: 1, overflow: "hidden", flexShrink: 0 }}>
                            <img src={item.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={e => { e.target.style.display = "none"; }} />
                          </Box>
                        ) : (
                          <Box sx={{ width: 40, height: 40, borderRadius: 1, backgroundColor: colors.primary[600],
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <StorefrontIcon sx={{ fontSize: 20, color: colors.grey[600] }} />
                          </Box>
                        )}
                        <Typography variant="body2" color={colors.grey[100]} noWrap sx={{ maxWidth: 140 }}>{item.title}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.category} size="small"
                        sx={{ backgroundColor: colors.primary[500], color: colors.grey[300], fontSize: "0.7rem" }} />
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[300], fontSize: "0.85rem" }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>{item.seller}</Typography>
                    </TableCell>
                    <TableCell>
                      {item.sellerUserName ? (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <PersonIcon sx={{ fontSize: 14, color: colors.blueAccent[400] }} />
                          <Typography variant="caption" color={colors.blueAccent[300]} noWrap>{item.sellerUserName}</Typography>
                        </Box>
                      ) : <Typography variant="caption" color={colors.grey[600]}>—</Typography>}
                    </TableCell>
                    <TableCell sx={{ color: colors.greenAccent[400], fontWeight: "bold", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                      {item.price ? `KES ${Number(item.price).toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        <Chip label={item.active ? "Active" : "Inactive"} size="small"
                          sx={{ backgroundColor: item.active ? colors.greenAccent[700] : colors.grey[700], color: "#fff", fontSize: "0.65rem" }} />
                        {item.featured && <Chip label="Featured" size="small" sx={{ backgroundColor: "#f0c040", color: "#000", fontSize: "0.65rem" }} />}
                        {!item.inStock && <Chip label="Out of Stock" size="small" sx={{ backgroundColor: "#b71c1c", color: "#fff", fontSize: "0.65rem" }} />}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[400], fontSize: "0.85rem" }}>{item.viewsCount || 0}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title={item.featured ? "Unfeature" : "Feature"}>
                          <IconButton size="small" onClick={toggle("featured", item)}
                            sx={{ color: item.featured ? "#f0c040" : colors.grey[500] }}>
                            {item.featured ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={item.active ? "Deactivate" : "Activate"}>
                          <IconButton size="small" onClick={toggle("active", item)}
                            sx={{ color: item.active ? colors.greenAccent[400] : colors.grey[600] }}>
                            {item.active ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={e => { e.stopPropagation(); openEdit(item); }}
                            sx={{ color: colors.blueAccent[400] }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                            sx={{ color: "#ef5350" }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {displayed.length === 0 && (
              <Box p={4} textAlign="center">
                <StorefrontIcon sx={{ fontSize: 48, color: colors.grey[600], mb: 1 }} />
                <Typography color={colors.grey[500]}>No listings found.</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview panel */}
      {preview && (
        <Dialog open onClose={() => setPreview(null)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
          <DialogTitle sx={{ p: 0, position: "relative" }}>
            {preview.images?.[0] && (
              <Box sx={{ height: 220, overflow: "hidden" }}>
                <img src={preview.images[0]} alt={preview.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { e.target.style.display = "none"; }} />
              </Box>
            )}
            <IconButton onClick={() => setPreview(null)} sx={{
              position: "absolute", top: 8, right: 8,
              backgroundColor: "rgba(0,0,0,0.5)", color: "#fff",
            }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Typography variant="h4" color={colors.grey[100]} fontWeight="bold" sx={{ flex: 1, mr: 1 }}>{preview.title}</Typography>
              {preview.featured && <Chip label="Featured" size="small" sx={{ backgroundColor: "#f0c040", color: "#000" }} />}
            </Box>
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              <Chip label={preview.category} size="small" sx={{ backgroundColor: colors.blueAccent[700], color: "#fff" }} />
              <Chip label={preview.active ? "Active" : "Inactive"} size="small"
                sx={{ backgroundColor: preview.active ? colors.greenAccent[700] : colors.grey[700], color: "#fff" }} />
              {!preview.inStock && <Chip label="Out of Stock" size="small" sx={{ backgroundColor: "#b71c1c", color: "#fff" }} />}
            </Box>
            <Typography color={colors.grey[300]} mb={2}>{preview.description}</Typography>
            <Typography variant="h4" color={colors.greenAccent[400]} fontWeight="bold" mb={1}>
              {preview.price ? `KES ${Number(preview.price).toLocaleString()}` : "Contact for price"}
            </Typography>
            {preview.rating > 0 && (
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Rating value={preview.rating} precision={0.5} readOnly size="small" />
                <Typography variant="caption" color={colors.grey[400]}>({preview.reviews} reviews)</Typography>
              </Box>
            )}
            <Divider sx={{ borderColor: colors.grey[700], my: 2 }} />
            <Typography variant="h6" color={colors.grey[200]} mb={1}>Seller</Typography>
            <Typography color={colors.grey[300]} mb={0.5} fontWeight="bold">{preview.seller}</Typography>
            {preview.location && (
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <LocationOnIcon sx={{ fontSize: 15, color: colors.grey[500] }} />
                <Typography variant="body2" color={colors.grey[400]}>{preview.location}</Typography>
              </Box>
            )}
            {preview.sellerContact?.phone && (
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <PhoneIcon sx={{ fontSize: 15, color: colors.blueAccent[400] }} />
                <Typography variant="body2" color={colors.grey[300]}>{preview.sellerContact.phone}</Typography>
              </Box>
            )}
            {preview.sellerContact?.email && (
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <EmailIcon sx={{ fontSize: 15, color: colors.blueAccent[400] }} />
                <Typography variant="body2" color={colors.grey[300]}>{preview.sellerContact.email}</Typography>
              </Box>
            )}
            {preview.sellerUserName && (
              <Box display="flex" alignItems="center" gap={1} mt={1} p={1.5}
                sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                <PersonIcon sx={{ fontSize: 16, color: colors.blueAccent[400] }} />
                <Typography variant="body2" color={colors.blueAccent[300]}>
                  Assigned to: <strong>{preview.sellerUserName}</strong>
                </Typography>
              </Box>
            )}
            {preview.specifications && Object.keys(preview.specifications).length > 0 && (
              <>
                <Divider sx={{ borderColor: colors.grey[700], my: 2 }} />
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Specifications</Typography>
                <Grid container spacing={1}>
                  {Object.entries(preview.specifications).map(([k, v]) => (
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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreview(null)} sx={{ color: colors.grey[400] }}>Close</Button>
            <Button variant="outlined" onClick={() => { setPreview(null); openEdit(preview); }}
              sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[400] }}>
              Edit Listing
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ── Create / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { backgroundColor: modalBg, backgroundImage: "none" } }}>

        <DialogTitle sx={{
          backgroundColor: "#0f1923", color: "#ffffff", fontSize: "1.3rem", fontWeight: 700,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #2d3748", py: 2,
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <StorefrontIcon sx={{ color: "#90caf9" }} />
            {editing ? "Edit Listing" : "Add New Listing"}
          </Box>
          <IconButton onClick={() => setOpen(false)} sx={{ color: "#8a9bb0" }}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ backgroundColor: modalBg, pt: 3, pb: 1 }}>
          <Grid container spacing={2.5}>

            {/* Title + Category */}
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Title *" value={form.title} onChange={set("title")}
                sx={inputSx} inputProps={{ style: { color: textColor, fontSize: "1rem" } }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth sx={inputSx}>
                <InputLabel sx={{ color: labelColor, fontSize: "0.95rem" }}>Category *</InputLabel>
                <Select value={form.category} onChange={set("category")} label="Category *"
                  sx={{ color: textColor, fontSize: "0.95rem",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#4a5568" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#90caf9" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#90caf9" },
                  }}>
                  {CATEGORIES.map(c => <MenuItem key={c} value={c} sx={{ fontSize: "0.9rem" }}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Description * (min 10 characters)"
                value={form.description} onChange={set("description")} sx={inputSx}
                inputProps={{ style: { color: textColor, fontSize: "0.95rem" } }} />
            </Grid>

            {/* Price / Seller / Location */}
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Price (KES)" type="number" value={form.price}
                onChange={set("price")} sx={inputSx}
                inputProps={{ style: { color: textColor, fontSize: "0.95rem" } }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Seller Name *" value={form.seller_name}
                onChange={set("seller_name")} sx={inputSx}
                inputProps={{ style: { color: textColor, fontSize: "0.95rem" } }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Location" value={form.location}
                onChange={set("location")} sx={inputSx}
                inputProps={{ style: { color: textColor, fontSize: "0.95rem" } }} />
            </Grid>

            {/* Phone / Email */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Seller Phone (+254...)" value={form.seller_phone}
                onChange={set("seller_phone")} sx={inputSx}
                inputProps={{ style: { color: textColor, fontSize: "0.95rem" } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Seller Email" value={form.seller_email}
                onChange={set("seller_email")} sx={inputSx}
                inputProps={{ style: { color: textColor, fontSize: "0.95rem" } }} />
            </Grid>

            {/* Client assignment */}
            <Grid item xs={12}>
              <Autocomplete options={clientOpts} value={selClient}
                onChange={(_, v) => setForm(f => ({ ...f, seller_user_id: v?.id || null }))}
                getOptionLabel={o => o.label} isOptionEqualToValue={(o, v) => o.id === v.id}
                PaperComponent={({ children }) => (
                  <Box sx={{ backgroundColor: "#1e2d3d", border: "1px solid #4a5568", borderRadius: 1 }}>{children}</Box>
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ color: textColor, fontSize: "0.9rem",
                    "&:hover": { backgroundColor: "#2d3f55" } }}>
                    <PersonIcon sx={{ fontSize: 16, mr: 1, color: "#90caf9" }} />{option.label}
                  </Box>
                )}
                renderInput={p => (
                  <TextField {...p} label="Assign to Client (optional)"
                    helperText="Listing will appear in this client's My Ads page"
                    sx={inputSx} inputProps={{ ...p.inputProps, style: { color: textColor, fontSize: "0.95rem" } }}
                    InputLabelProps={{ style: { color: labelColor } }} />
                )} />
            </Grid>

            {/* ── Images section ─────────────────────────────────────────────── */}
            <Grid item xs={12}>
              <Box sx={{ backgroundColor: modalCard, borderRadius: 2, p: 2.5, border: "1px solid #2d3748" }}>
                <Typography variant="h6" color="#ffffff" fontWeight={600} mb={2}>
                  Images ({form.images.length}/5)
                </Typography>

                {/* Existing images */}
                {form.images.length > 0 && (
                  <Grid container spacing={1} mb={2}>
                    {form.images.map((img, idx) => (
                      <Grid item xs={6} sm={4} md={3} key={idx}>
                        <Box sx={{ position: "relative", borderRadius: 1, overflow: "hidden",
                          border: "1px solid #4a5568", height: 90 }}>
                          <img src={img} alt={`img-${idx}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={e => { e.target.src = ""; e.target.style.display = "none"; }} />
                          <IconButton size="small" onClick={() => removeImage(idx)} sx={{
                            position: "absolute", top: 2, right: 2,
                            backgroundColor: "rgba(0,0,0,0.7)", color: "#ef5350",
                            "&:hover": { backgroundColor: "rgba(0,0,0,0.9)" }, p: 0.3,
                          }}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {form.images.length < 5 && (
                  <Box display="flex" flexDirection="column" gap={2}>
                    {/* Upload from computer */}
                    <Box>
                      <Typography variant="body2" color={labelColor} mb={1} fontWeight={500}>
                        Upload from your computer
                      </Typography>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple
                        style={{ display: "none" }} onChange={handleFileUpload} />
                      <Button variant="outlined" startIcon={<CloudUploadIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImg}
                        sx={{ borderColor: "#4a5568", color: "#b0b8c1", fontSize: "0.9rem",
                          "&:hover": { borderColor: "#90caf9", color: "#90caf9" } }}>
                        {uploadingImg ? "Processing..." : "Choose Files"}
                      </Button>
                      <Typography variant="caption" color="#6b7a8d" sx={{ ml: 1.5 }}>
                        JPG, PNG, WebP — up to {5 - form.images.length} more
                      </Typography>
                    </Box>

                    {/* Paste URL (works for Unsplash, Google Drive public links, etc.) */}
                    <Box>
                      <Typography variant="body2" color={labelColor} mb={1} fontWeight={500}>
                        Or paste an image URL (Unsplash, Google Drive, Dropbox, etc.)
                      </Typography>
                      <Box display="flex" gap={1}>
                        <TextField size="small" fullWidth placeholder="https://images.unsplash.com/..."
                          value={urlInput} onChange={e => setUrlInput(e.target.value)}
                          onKeyPress={e => e.key === "Enter" && addImageUrl()}
                          sx={{ ...inputSx, mb: 0 }}
                          inputProps={{ style: { color: textColor, fontSize: "0.9rem" } }} />
                        <Button variant="contained" startIcon={<LinkIcon />} onClick={addImageUrl}
                          sx={{ backgroundColor: "#2563eb", "&:hover": { backgroundColor: "#1d4ed8" },
                            whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                          Add URL
                        </Button>
                      </Box>
                      <Typography variant="caption" color="#6b7a8d" mt={0.5} display="block">
                        For Google Drive: share the file publicly and use the direct image link
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Tags */}
            <Grid item xs={12}>
              <TextField fullWidth label="Tags (comma-separated)" value={form.tags}
                onChange={set("tags")} helperText="e.g. water, tank, storage, irrigation"
                sx={inputSx} inputProps={{ style: { color: textColor, fontSize: "0.95rem" } }} />
            </Grid>

            {/* Toggles */}
            <Grid item xs={12}>
              <Box sx={{ backgroundColor: modalCard, borderRadius: 2, p: 2, border: "1px solid #2d3748" }}>
                <Typography variant="body2" color={labelColor} mb={1.5} fontWeight={500}>Listing Status</Typography>
                <Box display="flex" gap={4} flexWrap="wrap">
                  {[
                    { field: "featured", label: "Featured", color: "#f0c040" },
                    { field: "active",   label: "Active",   color: colors.greenAccent[400] },
                    { field: "in_stock", label: "In Stock", color: colors.blueAccent[400] },
                  ].map(({ field, label, color }) => (
                    <FormControlLabel key={field}
                      control={<Switch checked={form[field]} onChange={setChk(field)}
                        sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: color } }} />}
                      label={<Typography color="#d0d8e4" fontSize="0.95rem">{label}</Typography>}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

          </Grid>
        </DialogContent>

        <DialogActions sx={{ backgroundColor: "#0f1923", borderTop: "1px solid #2d3748", px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setOpen(false)}
            sx={{ color: "#8a9bb0", fontSize: "0.95rem", "&:hover": { color: "#ffffff" } }}>
            Cancel
          </Button>
          <Button variant="contained" disabled={saving} onClick={handleSave}
            sx={{ backgroundColor: "#2563eb", "&:hover": { backgroundColor: "#1d4ed8" },
              fontSize: "0.95rem", px: 3, fontWeight: 600 }}>
            {saving ? "Saving..." : editing ? "Update Listing" : "Create Listing"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarketplaceManagement;
