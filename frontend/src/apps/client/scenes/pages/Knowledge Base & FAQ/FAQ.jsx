import React, { useState, useEffect } from "react";
import {
  Box, Typography, CircularProgress, Alert,
  Accordion, AccordionSummary, AccordionDetails,
  TextField, InputAdornment, Chip, Divider, IconButton, Card, CardContent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { tokens } from "../../../theme";

const TOPIC_COLORS = {
  billing: "#6870fa", connection: "#4db6e4", maintenance: "#f0a500",
  safety: "#e05c5c", general: "#4cceac", water_quality: "#34d399",
};

const FAQ_TOPICS = [
  { value: "all", label: "All Topics" },
  { value: "billing", label: "Billing" },
  { value: "connection", label: "Connection" },
  { value: "maintenance", label: "Maintenance" },
  { value: "safety", label: "Safety" },
  { value: "general", label: "General" },
  { value: "water_quality", label: "Water Quality" },
];

const BASE_URL = "http://localhost:3001/api/v1";

const FAQ = () => {
  const colors = tokens("dark");
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("all");
  const [expanded, setExpanded] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    // Pull published knowledge base articles where category = "faq"
    fetch(`${BASE_URL}/knowledge_base/articles`, { headers })
      .then(r => r.json())
      .then(d => {
        const all = d?.data?.articles || d?.articles || [];
        setFaqs(all.filter(a => a.published && a.category === "faq"));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = faqs.filter(f => {
    const matchTopic =
      activeTopic === "all" ||
      f.tags?.toLowerCase().split(",").map(t => t.trim()).includes(activeTopic) ||
      f.category === activeTopic;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      f.title?.toLowerCase().includes(q) ||
      f.content?.toLowerCase().includes(q) ||
      f.excerpt?.toLowerCase().includes(q) ||
      f.tags?.toLowerCase().includes(q);
    return matchTopic && matchSearch;
  });

  const availableTopics = FAQ_TOPICS.filter(t => {
    if (t.value === "all") return true;
    return faqs.some(
      f =>
        f.tags?.toLowerCase().split(",").map(s => s.trim()).includes(t.value) ||
        f.category === t.value
    );
  });

  return (
    <Box m="20px" maxWidth="860px">
      <Box mb="20px">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb="5px">
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">
            Frequently Asked Questions
          </Typography>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }} title="Refresh">
            <RefreshIcon />
          </IconButton>
        </Box>
        <Typography variant="h6" color={colors.grey[400]}>
          Find quick answers to common questions about our water services
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      ) : (
        <>
          <Card sx={{ bgcolor: colors.primary[400], mb: 3, border: `1px solid ${colors.grey[700]}` }}>
            <CardContent sx={{ py: 1.5, px: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
              <InfoOutlinedIcon sx={{ color: colors.blueAccent[400], fontSize: 18 }} />
              <Typography variant="body2" color={colors.grey[300]}>
                <strong style={{ color: colors.blueAccent[300] }}>{faqs.length}</strong>{" "}
                FAQ{faqs.length !== 1 ? "s" : ""} published by the admin team
                {activeTopic !== "all" && filtered.length !== faqs.length && (
                  <> â€” showing <strong style={{ color: colors.blueAccent[300] }}>{filtered.length}</strong> in this topic</>
                )}
              </Typography>
            </CardContent>
          </Card>

          <TextField
            placeholder="Search questions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small" fullWidth
            sx={{
              mb: 2, maxWidth: 480,
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

          <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
            {availableTopics.map(t => (
              <Chip key={t.value} label={t.label} onClick={() => setActiveTopic(t.value)} sx={{
                cursor: "pointer",
                backgroundColor: activeTopic === t.value ? colors.blueAccent[600] : colors.primary[400],
                color: activeTopic === t.value ? "#fff" : colors.grey[300],
                border: `1px solid ${activeTopic === t.value ? colors.blueAccent[500] : colors.grey[700]}`,
                "&:hover": { backgroundColor: colors.blueAccent[700] },
              }} />
            ))}
          </Box>

          {faqs.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No FAQs have been published yet. The admin team will add them soon.
            </Alert>
          )}
          {faqs.length > 0 && filtered.length === 0 && (
            <Alert severity="info">
              No FAQs found{search ? ` for "${search}"` : ""} in this topic.
            </Alert>
          )}

          {filtered.map((faq, i) => (
            <Accordion
              key={faq.id || i}
              expanded={expanded === (faq.id || i)}
              onChange={(_, isExpanded) => setExpanded(isExpanded ? (faq.id || i) : false)}
              sx={{
                backgroundColor: colors.primary[400], mb: 1,
                border: `1px solid ${expanded === (faq.id || i) ? colors.blueAccent[600] : colors.grey[700]}`,
                borderRadius: "8px !important",
                "&:before": { display: "none" },
                "&.Mui-expanded": { margin: "0 0 8px 0" },
                transition: "border-color 0.2s ease",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: colors.blueAccent[400] }} />}
                sx={{ px: 2.5, py: 0.5 }}
              >
                <Box display="flex" alignItems="center" gap={1.5} width="100%">
                  <HelpOutlineIcon sx={{ color: colors.blueAccent[400], fontSize: 20, flexShrink: 0 }} />
                  <Typography color={colors.grey[100]} fontWeight={500} sx={{ lineHeight: 1.4, flex: 1 }}>
                    {faq.title}
                  </Typography>
                  {expanded !== (faq.id || i) && faq.tags && (
                    <Box display="flex" gap={0.5} flexShrink={0}>
                      {faq.tags.split(",").slice(0, 2).map((tag, t) => (
                        <Chip key={t} label={tag.trim()} size="small" sx={{
                          backgroundColor: (TOPIC_COLORS[tag.trim()] || colors.grey[700]) + "33",
                          color: TOPIC_COLORS[tag.trim()] || colors.grey[400],
                          fontSize: "0.6rem", height: 18,
                          border: `1px solid ${(TOPIC_COLORS[tag.trim()] || colors.grey[600]) + "55"}`,
                        }} />
                      ))}
                    </Box>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />
                {faq.excerpt && (
                  <Typography color={colors.blueAccent[300]} variant="body2" fontStyle="italic" mb={1.5}>
                    {faq.excerpt}
                  </Typography>
                )}
                <Typography color={colors.grey[300]} sx={{ lineHeight: 1.85, whiteSpace: "pre-line" }}>
                  {faq.content}
                </Typography>
                {faq.tags && (
                  <Box display="flex" gap={0.5} flexWrap="wrap" mt={2}>
                    {faq.tags.split(",").map((tag, t) => (
                      <Chip key={t} label={tag.trim()} size="small" sx={{
                        backgroundColor: (TOPIC_COLORS[tag.trim()] || colors.grey[700]) + "33",
                        color: TOPIC_COLORS[tag.trim()] || colors.grey[400],
                        fontSize: "0.65rem",
                        border: `1px solid ${(TOPIC_COLORS[tag.trim()] || colors.grey[600]) + "55"}`,
                      }} />
                    ))}
                  </Box>
                )}
                <Typography variant="caption" color={colors.grey[600]} display="block" mt={1.5}>
                  Published {faq.created_at ? new Date(faq.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </>
      )}
    </Box>
  );
};

export default FAQ;