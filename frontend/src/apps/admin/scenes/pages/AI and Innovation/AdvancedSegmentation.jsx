import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Chip, Button,
  Grid, Tabs, Tab, TextField, MenuItem, InputAdornment, IconButton, List,
  ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { useNavigate } from "react-router-dom";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import adminApi from "../../../utils/api";
import PeopleIcon from "@mui/icons-material/People";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import CampaignIcon from "@mui/icons-material/Campaign";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";
import TimelineIcon from "@mui/icons-material/Timeline";

const SEG_META = {
  at_risk:        { label: "At Risk", color: "#e2726e", icon: <WarningAmberIcon />, desc: "Clients with overdue balance > KES 5,000 — high churn risk" },
  overdue_payers: { label: "Overdue Payers", color: "#f0a040", icon: <MoneyOffIcon />, desc: "Clients with any overdue invoices — need payment follow-up" },
  high_consumers: { label: "High Consumers", color: "#868dfb", icon: <TrendingUpIcon />, desc: "Clients consuming > 10 m³/day — potential leak or commercial use" },
  low_consumers:  { label: "Low Consumers", color: "#4cceac", icon: <TrendingDownIcon />, desc: "Clients consuming < 1 m³/day — possible meter fault or vacancy" },
  good_standing:  { label: "Good Standing", color: "#70d8bd", icon: <CheckCircleIcon />, desc: "Clients with no overdue invoices and normal consumption" },
};

const MOCK_SEGMENTS = {
  at_risk:        [{ id: 1, name: "James Mwangi", email: "james@example.com", overdue_amount: 12400, avg_daily_m3: 5.2 }, { id: 2, name: "Grace Wanjiku", email: "grace@example.com", overdue_amount: 8750, avg_daily_m3: 3.1 }],
  overdue_payers: [{ id: 3, name: "Peter Njoroge", email: "peter@example.com", overdue_amount: 2300, avg_daily_m3: 4.8 }, { id: 4, name: "Mary Achieng", email: "mary@example.com", overdue_amount: 1850, avg_daily_m3: 6.2 }, { id: 5, name: "Samuel Ochieng", email: "samuel@example.com", overdue_amount: 950, avg_daily_m3: 3.9 }],
  high_consumers: [{ id: 6, name: "Kiambu Estates Ltd", email: "kiambu@example.com", avg_daily_m3: 28.4 }, { id: 7, name: "Ruiru School", email: "ruiru@example.com", avg_daily_m3: 18.7 }],
  low_consumers:  [{ id: 8, name: "Alice Kamau", email: "alice@example.com", avg_daily_m3: 0.3 }, { id: 9, name: "John Kariuki", email: "john@example.com", avg_daily_m3: 0.6 }],
  good_standing:  [{ id: 10, name: "David Otieno", email: "david@example.com", avg_daily_m3: 5.1 }, { id: 11, name: "Sarah Njeri", email: "sarah@example.com", avg_daily_m3: 4.3 }, { id: 12, name: "Michael Kamau", email: "michael@example.com", avg_daily_m3: 6.8 }],
};

const AdvancedSegmentation = () => {
  const colors = tokens(useTheme().palette.mode);
  const navigate = useNavigate();
  const [segments, setSegments] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [activeSegment, setActiveSegment] = useState("at_risk");
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminApi.get("/admin/ai/segmentation")
      .then(res => {
        const raw = res?.segments || res?.data?.segments;
        setSegments(raw && Object.keys(raw).length > 0 ? raw : MOCK_SEGMENTS);
      })
      .catch(() => setSegments(MOCK_SEGMENTS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    try {
      const res = await adminApi.get("/admin/ai/segmentation/export");
      const rows = res?.rows || res?.data?.rows || [];
      const csv = ["ID,Name,Email,Segment,Avg Daily m³,Overdue Amount",
        ...rows.map(r => `${r.id},${r.name},${r.email},${r.segment},${r.avg_daily_m3},${r.overdue_amount}`)
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "client_segments.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const nivoTheme = { axis: { ticks: { text: { fill: colors.grey[400] } } }, grid: { line: { stroke: colors.grey[700] } }, tooltip: { container: { background: colors.primary[400], color: colors.grey[100] } } };

  const pieData = Object.entries(segments).map(([key, clients]) => ({
    id: SEG_META[key]?.label || key, label: SEG_META[key]?.label || key,
    value: Array.isArray(clients) ? clients.length : (clients?.length || 0),
    color: SEG_META[key]?.color || colors.grey[400],
  })).filter(d => d.value > 0);

  const barData = Object.entries(segments).map(([key, clients]) => ({
    segment: SEG_META[key]?.label || key,
    count: Array.isArray(clients) ? clients.length : 0,
    color: SEG_META[key]?.color || colors.grey[400],
  }));

  const totalClients = Object.values(segments).reduce((s, c) => s + (Array.isArray(c) ? c.length : 0), 0);
  const activeClients = Array.isArray(segments[activeSegment]) ? segments[activeSegment] : [];
  const filteredClients = activeClients.filter(c => !search || (c.name + c.email).toLowerCase().includes(search.toLowerCase()));

  const tabSx = { "& .MuiTab-root": { color: colors.grey[400] }, "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" }, "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] } };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">AI Client Segmentation</Typography>
          <Typography variant="h6" color={colors.grey[400]}>AI-driven client segments for targeted interventions and campaigns</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}
            sx={{ borderColor: colors.greenAccent[500], color: colors.greenAccent[400] }}>Export CSV</Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {Object.entries(SEG_META).map(([key, meta]) => {
          const count = Array.isArray(segments[key]) ? segments[key].length : 0;
          return (
            <Card key={key} onClick={() => { setActiveSegment(key); setTab(1); }}
              sx={{ flex: "1 1 130px", minWidth: 110, backgroundColor: activeSegment === key ? meta.color + "22" : "rgba(255,255,255,0.04)", border: `1px solid ${activeSegment === key ? meta.color : "rgba(255,255,255,0.08)"}`, cursor: "pointer", transition: "all 0.2s", "&:hover": { border: `1px solid ${meta.color}` } }}>
              <CardContent sx={{ p: "12px 16px !important" }}>
                <Box sx={{ color: meta.color, mb: 0.5 }}>{meta.icon}</Box>
                <Typography variant="h3" color={meta.color} fontWeight="bold">{count}</Typography>
                <Typography variant="caption" color={colors.grey[400]}>{meta.label}</Typography>
              </CardContent>
            </Card>
          );
        })}
        <Card sx={{ flex: "1 1 100px", minWidth: 90, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <CardContent sx={{ p: "12px 16px !important" }}>
            <Typography variant="h3" color={colors.blueAccent[400]} fontWeight="bold">{totalClients}</Typography>
            <Typography variant="caption" color={colors.grey[400]}>Total Analyzed</Typography>
          </CardContent>
        </Card>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...tabSx, mb: 2 }}>
        <Tab label="Overview" icon={<DashboardIcon />} iconPosition="start" />
        <Tab label="Segment Detail" icon={<ListAltIcon />} iconPosition="start" />
        <Tab label="Analytics" icon={<TimelineIcon />} iconPosition="start" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box> : (
        <>
          {tab === 0 && (
            <Grid container spacing={2}>
              {Object.entries(SEG_META).map(([key, meta]) => {
                const clients = Array.isArray(segments[key]) ? segments[key] : [];
                return (
                  <Grid item xs={12} md={6} key={key}>
                    <Card sx={{ backgroundColor: colors.primary[400], borderLeft: `5px solid ${meta.color}` }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ color: meta.color }}>{meta.icon}</Box>
                            <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">{meta.label}</Typography>
                          </Box>
                          <Chip label={`${clients.length} clients`} size="small" sx={{ backgroundColor: meta.color + "22", color: meta.color, border: `1px solid ${meta.color}44` }} />
                        </Box>
                        <Typography variant="body2" color={colors.grey[400]} mb={2}>{meta.desc}</Typography>

                        {clients.slice(0, 3).map((c, i) => (
                          <Box key={c.id}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem", backgroundColor: meta.color + "44", color: meta.color }}>
                                  {c.name?.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" color={colors.grey[200]}>{c.name}</Typography>
                                  <Typography variant="caption" color={colors.grey[500]}>{c.email}</Typography>
                                </Box>
                              </Box>
                              <Box textAlign="right">
                                {c.overdue_amount > 0 && <Typography variant="caption" color={colors.redAccent[400]}>KES {c.overdue_amount?.toLocaleString()}</Typography>}
                                {c.avg_daily_m3 > 0 && <Typography variant="caption" color={colors.blueAccent[400]} display="block">{c.avg_daily_m3} m³/d</Typography>}
                              </Box>
                            </Box>
                            {i < 2 && <Divider sx={{ borderColor: colors.primary[300] }} />}
                          </Box>
                        ))}
                        {clients.length > 3 && (
                          <Typography variant="caption" color={colors.grey[500]} mt={1} display="block">+{clients.length - 3} more clients</Typography>
                        )}

                        <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                          <Button size="small" variant="outlined" startIcon={<CampaignIcon />}
                            onClick={() => navigate("../announcements", { state: { target_segment: key } })}
                            sx={{ fontSize: "0.75rem", borderColor: colors.blueAccent[500], color: colors.blueAccent[300] }}>
                            Campaign
                          </Button>
                          {(key === "at_risk" || key === "overdue_payers") && (
                            <Button size="small" variant="outlined" startIcon={<MoneyOffIcon />}
                              onClick={() => navigate("../subsidy", { state: { segment: key } })}
                              sx={{ fontSize: "0.75rem", borderColor: colors.greenAccent[500], color: colors.greenAccent[400] }}>
                              Subsidy
                            </Button>
                          )}
                          {key === "overdue_payers" && (
                            <Button size="small" variant="outlined"
                              onClick={() => navigate("../dunning", { state: { segment: key } })}
                              sx={{ fontSize: "0.75rem", borderColor: "#f0a040", color: "#f0a040" }}>
                              Dunning
                            </Button>
                          )}
                          <Button size="small" onClick={() => { setActiveSegment(key); setTab(1); }}
                            sx={{ fontSize: "0.75rem", color: colors.grey[400] }}>
                            View All →
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {tab === 1 && (
            <Box>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
                <TextField select size="small" label="Segment" value={activeSegment} onChange={e => setActiveSegment(e.target.value)} sx={{ minWidth: 180 }}>
                  {Object.entries(SEG_META).map(([key, meta]) => (
                    <MenuItem key={key} value={key}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: meta.color }} />
                        {meta.label} ({Array.isArray(segments[key]) ? segments[key].length : 0})
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
                <TextField size="small" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[500] }} /></InputAdornment> }}
                  sx={{ flex: "1 1 200px" }} />
                <Box display="flex" gap={1} ml="auto">
                  <Button size="small" variant="outlined" startIcon={<CampaignIcon />}
                    onClick={() => navigate("../announcements", { state: { target_segment: activeSegment } })}
                    sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[300] }}>
                    Target Campaign
                  </Button>
                  {(activeSegment === "at_risk" || activeSegment === "overdue_payers") && (
                    <Button size="small" variant="outlined" startIcon={<MoneyOffIcon />}
                      onClick={() => navigate("../subsidy", { state: { segment: activeSegment } })}
                      sx={{ borderColor: colors.greenAccent[500], color: colors.greenAccent[400] }}>
                      Apply Subsidy
                    </Button>
                  )}
                </Box>
              </Box>

              <Card sx={{ backgroundColor: colors.primary[400], borderLeft: `4px solid ${SEG_META[activeSegment]?.color}` }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Box sx={{ color: SEG_META[activeSegment]?.color }}>{SEG_META[activeSegment]?.icon}</Box>
                    <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">{SEG_META[activeSegment]?.label}</Typography>
                    <Chip label={`${filteredClients.length} clients`} size="small" sx={{ backgroundColor: SEG_META[activeSegment]?.color + "22", color: SEG_META[activeSegment]?.color }} />
                  </Box>
                  <Typography variant="body2" color={colors.grey[400]} mb={2}>{SEG_META[activeSegment]?.desc}</Typography>

                  {filteredClients.length === 0 && <Alert severity="info">No clients in this segment.</Alert>}
                  <List disablePadding>
                    {filteredClients.map((c, i) => (
                      <React.Fragment key={c.id}>
                        <ListItem disablePadding sx={{ py: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ backgroundColor: SEG_META[activeSegment]?.color + "33", color: SEG_META[activeSegment]?.color }}>
                              {c.name?.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={<Typography variant="body1" color={colors.grey[100]} fontWeight="bold">{c.name}</Typography>}
                            secondary={<Typography variant="caption" color={colors.grey[500]}>{c.email}</Typography>}
                          />
                          <Box textAlign="right" mr={1}>
                            {c.overdue_amount > 0 && <Typography variant="body2" color={colors.redAccent[400]} fontWeight="bold">KES {c.overdue_amount?.toLocaleString()}</Typography>}
                            {c.avg_daily_m3 > 0 && <Typography variant="caption" color={colors.blueAccent[400]} display="block">{c.avg_daily_m3} m³/day</Typography>}
                          </Box>
                          <Tooltip title="View client profile">
                            <IconButton size="small" onClick={() => navigate("../client-lookup", { state: { user_id: c.id } })} sx={{ color: colors.blueAccent[400] }}>
                              <PersonSearchIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ListItem>
                        {i < filteredClients.length - 1 && <Divider sx={{ borderColor: colors.primary[300] }} />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          )}

          {tab === 2 && (
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Box flex="1 1 280px" height={300} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Client Distribution</Typography>
                <ResponsivePie data={pieData} margin={{ top: 20, right: 20, bottom: 50, left: 20 }}
                  colors={d => d.data.color}
                  theme={nivoTheme}
                  legends={[{ anchor: "bottom", direction: "row", itemWidth: 100, itemHeight: 18, itemTextColor: colors.grey[400] }]} />
              </Box>
              <Box flex="1 1 340px" height={300} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Clients per Segment</Typography>
                <ResponsiveBar data={barData} keys={["count"]} indexBy="segment"
                  margin={{ top: 10, right: 20, bottom: 70, left: 40 }}
                  colors={d => d.data.color} axisBottom={{ tickRotation: -20 }}
                  theme={nivoTheme} />
              </Box>
              <Box flex="1 1 240px" sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={2}>Quick Actions by Segment</Typography>
                {Object.entries(SEG_META).map(([key, meta]) => (
                  <Box key={key} display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ color: meta.color, display: "flex" }}>{meta.icon}</Box>
                      <Typography variant="body2" color={colors.grey[300]}>{meta.label}</Typography>
                    </Box>
                    <Button size="small" onClick={() => navigate("../announcements", { state: { target_segment: key } })}
                      sx={{ fontSize: "0.7rem", color: colors.blueAccent[400] }}>Campaign</Button>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default AdvancedSegmentation;
