import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  Tabs, Tab, Switch, FormControlLabel, InputAdornment, Tooltip,
  Select, MenuItem, FormControl, InputLabel, Divider,
} from "@mui/material";
import { tokens } from "../../../theme";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ArticleIcon from "@mui/icons-material/Article";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ScienceIcon from "@mui/icons-material/Science";
import PublishIcon from "@mui/icons-material/Publish";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import adminApi from "../../../utils/api";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "faq", label: "FAQ" },
  { value: "water_quality", label: "Water Quality" },
  { value: "billing", label: "Billing" },
  { value: "connection", label: "Connection" },
  { value: "maintenance", label: "Maintenance" },
  { value: "safety", label: "Safety" },
];

const CATEGORY_COLORS = {
  general: "#4cceac", faq: "#a78bfa", water_quality: "#34d399",
  billing: "#6870fa", connection: "#4db6e4", maintenance: "#f0a500", safety: "#e05c5c",
};

const EMPTY_FORM = { title: "", content: "", excerpt: "", category: "general", tags: "", published: false };
const TAB_FILTERS = { 0: null, 1: "faq", 2: "water_quality" };

const KnowledgeBase = () => {
  const colors = tokens("dark");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewArticle, setPreviewArticle] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.get("/knowledge_base/articles/admin_all")
      .then(res => setArticles(res?.data?.articles || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = articles.filter(a => {
    const catFilter = TAB_FILTERS[tab];
    const matchCat = catFilter === null || a.category === catFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || a.title?.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q) || a.tags?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const openCreate = () => {
    const defaultCat = TAB_FILTERS[tab] || "general";
    setEditing(null);
    setForm({ ...EMPTY_FORM, category: defaultCat });
    setOpen(true);
  };

  const openEdit = async (article) => {
    // Fetch full article to ensure content is included
    let full = article;
    try {
      const res = await adminApi.get(`/knowledge_base/articles/${article.id}`);
      full = res?.data?.article || article;
    } catch { /* fall back to list object */ }
    setEditing(full);
    setForm({
      title: full.title || "", content: full.content || "", excerpt: full.excerpt || "",
      category: full.category || "general", tags: full.tags || "", published: full.published || false,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) { setError("Title and content are required."); return; }
    setSaving(true); setError(null);
    try {
      if (editing) {
        await adminApi.patch(`/knowledge_base/articles/${editing.id}`, { article: form });
        // Sync update to blog_posts if published and not an FAQ
        if (form.published && form.category !== "faq" && editing.blog_post_id) {
          try {
            await adminApi.patch(`/blog_posts/${editing.blog_post_id}`, {
              blog_post: {
                title: form.title,
                excerpt: form.excerpt || form.content.substring(0, 160),
                content: form.content,
                category: form.category,
                tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
                published: true,
              }
            });
          } catch { /* blog sync is best-effort */ }
        }
        setSuccess("Article updated successfully.");
      } else {
        const res = await adminApi.post("/knowledge_base/articles", { article: form });
        // Mirror published non-FAQ articles to blog_posts so they appear on /blogs and help-articles
        if (form.published && form.category !== "faq") {
          try {
            await adminApi.post("/blog_posts", {
              blog_post: {
                title: form.title,
                excerpt: form.excerpt || form.content.substring(0, 160),
                content: form.content,
                category: form.category,
                tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
                published: true,
                featured: false,
              }
            });
          } catch { /* blog sync is best-effort */ }
        }
        setSuccess("Article created successfully.");
      }
      setOpen(false); load();
    } catch (err) { setError(err.message || "Failed to save article."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try { await adminApi.delete(`/knowledge_base/articles/${id}`); setSuccess("Article deleted."); load(); }
    catch (err) { setError(err.message); }
  };

  const openPreview = async (article) => {
    let full = article;
    try {
      const res = await adminApi.get(`/knowledge_base/articles/${article.id}`);
      full = res?.data?.article || article;
    } catch { /* fall back to list object */ }
    setPreviewArticle(full);
    setPreviewOpen(true);
  };

  const togglePublish = async (article) => {
    try {
      await adminApi.patch(`/knowledge_base/articles/${article.id}`, { article: { published: !article.published } });
      // When publishing a non-FAQ article, mirror it to blog_posts
      if (!article.published && article.category !== "faq") {
        try {
          await adminApi.post("/blog_posts", {
            blog_post: {
              title: article.title,
              excerpt: article.excerpt || (article.content || "").substring(0, 160),
              content: article.content || "",
              category: article.category,
              tags: article.tags ? article.tags.split(",").map(t => t.trim()) : [],
              published: true,
              featured: false,
            }
          });
        } catch { /* best-effort */ }
      }
      setSuccess(`Article ${!article.published ? "published" : "unpublished"}.`); load();
    } catch (err) { setError(err.message); }
  };

  const set = (field) => (e) => setForm(v => ({ ...v, [field]: e.target.value }));

  const fieldSx = {
    mb: 2, "& label": { color: colors.grey[400] },
    "& .MuiOutlinedInput-root": {
      color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] },
      "&:hover fieldset": { borderColor: colors.blueAccent[500] },
      "&.Mui-focused fieldset": { borderColor: colors.blueAccent[400] },
    },
    "& .MuiSelect-icon": { color: colors.grey[400] },
  };

  const tabCounts = {
    0: articles.length,
    1: articles.filter(a => a.category === "faq").length,
    2: articles.filter(a => a.category === "water_quality").length,
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb="20px" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Knowledge Base</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Manage help articles, FAQs, and water quality reports</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[500] } }}>
          New Article
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {[
          { label: "Total Articles", value: articles.length, color: colors.blueAccent[400] },
          { label: "Published", value: articles.filter(a => a.published).length, color: colors.greenAccent[400] },
          { label: "Drafts", value: articles.filter(a => !a.published).length, color: colors.grey[400] },
          { label: "FAQs", value: tabCounts[1], color: "#a78bfa" },
          { label: "Water Quality", value: tabCounts[2], color: "#34d399" },
        ].map(stat => (
          <Card key={stat.label} sx={{ backgroundColor: colors.primary[400], minWidth: 120, flex: "1 1 120px" }}>
            <CardContent sx={{ p: "12px 16px !important" }}>
              <Typography variant="h4" color={stat.color} fontWeight="bold">{stat.value}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>{stat.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2,
        "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
        "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
        "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
      }}>
        <Tab icon={<ArticleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`All Articles (${tabCounts[0]})`} />
        <Tab icon={<HelpOutlineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`FAQs (${tabCounts[1]})`} />
        <Tab icon={<ScienceIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Water Quality (${tabCounts[2]})`} />
      </Tabs>

      <TextField placeholder="Search by title, tags, or excerpt..." value={search} onChange={e => setSearch(e.target.value)}
        size="small" sx={{ mb: 2, width: 360, ...fieldSx, mb: 2 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[400] }} /></InputAdornment> }} />

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>
      ) : (
        <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.grey[700]}` }}>
          <CardContent sx={{ p: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { borderBottom: `1px solid ${colors.grey[700]}` } }}>
                  {["Title", "Category", "Status", "Views", "Created", "Actions"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[300], fontWeight: 600, py: 1.5, px: 2 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: colors.grey[500] }}>
                    No articles found{search ? ` for "${search}"` : ""}.
                  </TableCell></TableRow>
                ) : filtered.map(a => (
                  <TableRow key={a.id} sx={{ "&:hover": { backgroundColor: colors.primary[300] }, "& td": { borderBottom: `1px solid ${colors.grey[800]}` } }}>
                    <TableCell sx={{ color: colors.grey[100], py: 1.5, px: 2, maxWidth: 280 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.title}
                      </Typography>
                      {a.excerpt && (
                        <Typography variant="caption" color={colors.grey[500]} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {a.excerpt.substring(0, 60)}...
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2 }}>
                      {a.category && (
                        <Chip label={a.category.replace("_", " ")} size="small" sx={{
                          backgroundColor: (CATEGORY_COLORS[a.category] || colors.grey[600]) + "22",
                          color: CATEGORY_COLORS[a.category] || colors.grey[300],
                          border: `1px solid ${(CATEGORY_COLORS[a.category] || colors.grey[600])}44`, fontSize: "0.7rem",
                        }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2 }}>
                      <Chip label={a.published ? "Published" : "Draft"} size="small" sx={{
                        backgroundColor: a.published ? colors.greenAccent[700] + "44" : colors.grey[700],
                        color: a.published ? colors.greenAccent[400] : colors.grey[400],
                        border: `1px solid ${a.published ? colors.greenAccent[700] : colors.grey[600]}`, fontSize: "0.7rem",
                      }} />
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[400], py: 1.5, px: 2 }}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <VisibilityOutlinedIcon sx={{ fontSize: 13 }} />{a.views_count || 0}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[400], py: 1.5, px: 2, whiteSpace: "nowrap" }}>
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2 }}>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title={a.published ? "Unpublish" : "Publish"}>
                          <IconButton size="small" onClick={() => togglePublish(a)}
                            sx={{ color: a.published ? colors.greenAccent[400] : colors.grey[500] }}>
                            {a.published ? <PublishIcon fontSize="small" /> : <UnpublishedIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Preview">
                          <IconButton size="small" onClick={() => openPreview(a)}
                            sx={{ color: colors.blueAccent[400] }}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(a)} sx={{ color: colors.blueAccent[400] }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(a.id, a.title)} sx={{ color: colors.redAccent[400] }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400], backgroundImage: "none" } }}>
        <DialogTitle sx={{ color: colors.grey[100], borderBottom: `1px solid ${colors.grey[700]}`, pb: 2, fontSize: "1.3rem" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <ArticleIcon sx={{ color: colors.blueAccent[400], fontSize: 28 }} />
            {editing ? "Edit Article" : "Create New Article"}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField fullWidth label="Title *" value={form.title} onChange={set("title")} sx={{
            ...fieldSx,
            "& .MuiInputBase-input": { fontSize: "1rem" },
            "& .MuiInputLabel-root": { fontSize: "1rem" },
          }} />
          <FormControl fullWidth sx={{
            ...fieldSx,
            "& .MuiInputBase-input": { fontSize: "1rem" },
            "& .MuiInputLabel-root": { fontSize: "1rem" },
          }}>
            <InputLabel sx={{ color: colors.grey[400], fontSize: "1rem" }}>Category *</InputLabel>
            <Select value={form.category} onChange={set("category")} label="Category *"
              sx={{ color: colors.grey[100], fontSize: "1rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
              MenuProps={{ PaperProps: { sx: { backgroundColor: colors.primary[300], "& .MuiMenuItem-root": { fontSize: "1rem" } } } }}>
              {CATEGORIES.map(c => (
                <MenuItem key={c.value} value={c.value} sx={{ color: colors.grey[100], fontSize: "1rem" }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: CATEGORY_COLORS[c.value] }} />
                    {c.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth label="Excerpt (short summary)" value={form.excerpt} onChange={set("excerpt")} sx={{
            ...fieldSx,
            "& .MuiInputBase-input": { fontSize: "1rem" },
            "& .MuiInputLabel-root": { fontSize: "1rem" },
          }}
            helperText="Shown in article cards. Auto-generated from content if left blank."
            FormHelperTextProps={{ sx: { color: colors.grey[600], fontSize: "0.85rem" } }} />
          <TextField fullWidth label="Tags (comma-separated)" value={form.tags} onChange={set("tags")} sx={{
            ...fieldSx,
            "& .MuiInputBase-input": { fontSize: "1rem" },
            "& .MuiInputLabel-root": { fontSize: "1rem" },
          }}
            placeholder="e.g. billing, payment, invoice" />
          <TextField fullWidth multiline rows={10} label="Content *" value={form.content} onChange={set("content")} sx={{
            ...fieldSx,
            "& .MuiInputBase-input": { fontSize: "1rem", lineHeight: 1.6 },
            "& .MuiInputLabel-root": { fontSize: "1rem" },
          }}
            placeholder="Write the full article content here..." />
          <FormControlLabel
            control={<Switch checked={form.published} onChange={e => setForm(v => ({ ...v, published: e.target.checked }))}
              sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: colors.greenAccent[400] },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: colors.greenAccent[700] } }} />}
            label={<Typography color={form.published ? colors.greenAccent[400] : colors.grey[400]} sx={{ fontSize: "1rem" }}>
              {form.published ? "Published — visible to clients" : "Draft — not visible to clients"}
            </Typography>} />
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${colors.grey[700]}`, px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleSave}
            sx={{ backgroundColor: colors.blueAccent[600], "&:hover": { backgroundColor: colors.blueAccent[500] } }}>
            {saving ? "Saving..." : editing ? "Update Article" : "Create Article"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { backgroundColor: colors.primary[400], backgroundImage: "none" } }}>
        {previewArticle && (
          <>
            <DialogTitle sx={{ color: colors.grey[100], borderBottom: `1px solid ${colors.grey[700]}`, pb: 2 }}>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>{previewArticle.title}</Typography>
                <Chip label={previewArticle.published ? "Published" : "Draft"} size="small"
                  sx={{ backgroundColor: previewArticle.published ? colors.greenAccent[700] : colors.grey[700],
                    color: previewArticle.published ? "#fff" : colors.grey[300] }} />
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                {previewArticle.category && (
                  <Chip label={previewArticle.category.replace("_", " ")} size="small"
                    sx={{ backgroundColor: CATEGORY_COLORS[previewArticle.category] + "33", color: CATEGORY_COLORS[previewArticle.category] }} />
                )}
                {previewArticle.tags && previewArticle.tags.split(",").map((t, i) => (
                  <Chip key={i} label={t.trim()} size="small" sx={{ backgroundColor: colors.grey[700], color: colors.grey[300] }} />
                ))}
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />
              <Typography color={colors.grey[200]} sx={{ whiteSpace: "pre-line", lineHeight: 1.85 }}>
                {previewArticle.content || "No content."}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ borderTop: `1px solid ${colors.grey[700]}`, px: 3, py: 2 }}>
              <Button onClick={() => setPreviewOpen(false)} sx={{ color: colors.grey[400] }}>Close</Button>
              <Button variant="outlined" onClick={() => { setPreviewOpen(false); openEdit(previewArticle); }}
                sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[400] }}>Edit Article</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default KnowledgeBase;
