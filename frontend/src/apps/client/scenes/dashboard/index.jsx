import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Card, CardContent, Typography, useTheme, Grid,
  Chip, Divider, List, ListItem, ListItemText, LinearProgress,
  CircularProgress, Alert, IconButton, Skeleton,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { tokens } from "../../theme";
import { useAuth } from "../../../../hooks/useAuth";
import api from "../../utils/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

// Icons
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentIcon from "@mui/icons-material/Payment";
import SpeedIcon from "@mui/icons-material/Speed";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CampaignIcon from "@mui/icons-material/Campaign";
import EventIcon from "@mui/icons-material/Event";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Co2Icon from "@mui/icons-material/Co2";
import SensorsIcon from "@mui/icons-material/Sensors";
import PersonIcon from "@mui/icons-material/Person";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `KES ${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const relTime = (ts) => {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};
const CARBON_FACTOR = 0.298; // kg CO2 per m3

// ─── skeleton loader ──────────────────────────────────────────────────────────
const SkeletonCard = ({ height = 160 }) => (
  <Card sx={{ height, backgroundColor: "rgba(255,255,255,0.04)" }}>
    <CardContent>
      <Skeleton variant="text" width="50%" sx={{ mb: 1 }} />
      <Skeleton variant="text" width="70%" />
      <Skeleton variant="rectangular" height={60} sx={{ mt: 1, borderRadius: 1 }} />
    </CardContent>
  </Card>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bill, setBill]               = useState(null);
  const [usage, setUsage]             = useState(null);
  const [readings, setReadings]       = useState([]);
  const [tickets, setTickets]         = useState([]);
  const [leakAlerts, setLeakAlerts]   = useState([]);
  const [announcements, setAnn]       = useState([]);
  const [events, setEvents]           = useState([]);
  const [poll, setPoll]               = useState(null);
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // personalized greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName =
    user?.display_name ||
    user?.full_name ||
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    "there";

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);

    const safe = async (fn) => { try { return await fn(); } catch { return null; } };

    const [billR, usageR, readR, tickR, leakR, annR, evtR, pollR, planR] = await Promise.all([
      safe(() => api.get("/client/current_bill")),
      safe(() => api.get("/client/usage_overview")),
      safe(() => api.get("/client/meter_readings")),
      safe(() => api.get("/tickets")),
      safe(() => api.get("/client/leak_alerts")),
      safe(() => api.get("/announcements")),
      safe(() => api.get("/events")),
      safe(() => api.get("/polls?active=true")),
      safe(() => api.get("/payment_plans")),
    ]);

    if (billR)  setBill(billR?.data?.invoice || null);
    if (usageR) setUsage(usageR?.data || null);
    if (readR)  setReadings((readR?.data?.readings || []).slice(0, 3));
    if (tickR)  setTickets(tickR?.data?.tickets || []);
    if (leakR)  setLeakAlerts(leakR?.data?.alerts || []);
    if (annR)   setAnn((annR?.data?.announcements || []).slice(0, 3));
    if (evtR) {
      const arr = evtR?.data?.data?.events || evtR?.data?.events || [];
      setEvents(arr.filter(e => new Date(e.event_date) > new Date()).slice(0, 2));
    }
    if (pollR) {
      const arr = pollR?.data?.polls || pollR?.polls || [];
      setPoll(arr.find(p => !p.user_voted) || arr[0] || null);
    }
    if (planR) {
      setPaymentPlan((planR?.data?.payment_plans || []).find(p => p.status === "active") || null);
    }

    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // derived
  const openTickets  = tickets.filter(t => t.status !== "closed" && t.status !== "resolved");
  const activeLeaks  = leakAlerts.filter(a => a.status === "open");
  const isOverdue    = bill?.days_overdue > 0;
  const daysUntilDue = bill?.days_until_due ?? 0;
  const trendUp      = (usage?.trend_vs_last_month ?? 0) > 0;
  const co2Monthly   = usage?.current_month_m3 ? (usage.current_month_m3 * CARBON_FACTOR).toFixed(1) : null;
  const planPct      = paymentPlan
    ? Math.round((paymentPlan.installments_paid / paymentPlan.installments_count) * 100) : 0;

  // account status colour
  const isArrears    = isOverdue;
  const acctLabel    = isArrears ? "ARREARS" : "ACTIVE";
  const acctColor    = isArrears ? "#ff9800" : colors.greenAccent[600];

  // usage chart data – prefer monthly_trend, fallback to reading deltas
  const chartData = (usage?.monthly_trend || []).slice(-6);

  const cardBg = colors.primary[400];

  if (loading) return (
    <Box m="20px">
      <Skeleton variant="text" width={340} height={44} sx={{ mb: 3 }} />
      <Grid container spacing={2} mb={2}>
        {[1,2,3,4].map(i => <Grid item xs={6} md={3} key={i}><SkeletonCard height={100} /></Grid>)}
      </Grid>
      <Grid container spacing={2}>
        {[1,2,3,4,5,6].map(i => <Grid item xs={12} md={4} key={i}><SkeletonCard height={220} /></Grid>)}
      </Grid>
    </Box>
  );

  return (
    <Box m="20px">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">
            {greeting}, {displayName} 👋
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
            <Chip label={acctLabel} size="small"
              sx={{ backgroundColor: acctColor, color: "#fff", fontWeight: 700, fontSize: "0.7rem" }} />
            {activeLeaks.length > 0 && (
              <Chip icon={<WarningAmberIcon sx={{ fontSize: "14px !important" }} />}
                label={`${activeLeaks.length} Leak Alert${activeLeaks.length > 1 ? "s" : ""}`}
                size="small"
                sx={{ backgroundColor: colors.redAccent[500], color: "#fff", fontWeight: 600 }} />
            )}
            {lastUpdated && (
              <Typography variant="caption" color={colors.grey[500]}>
                Updated {relTime(lastUpdated)}
              </Typography>
            )}
          </Box>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <IconButton onClick={() => fetchAll(true)} disabled={refreshing}
            sx={{ color: colors.blueAccent[400] }} title="Refresh">
            <RefreshIcon />
          </IconButton>
          <Button component={Link} to="export-data" size="small" startIcon={<DownloadIcon />}
            sx={{ backgroundColor: colors.blueAccent[700], color: colors.grey[100], fontWeight: 600 }}>
            Export Data
          </Button>
        </Box>
      </Box>

      {/* ── QUICK ACTIONS ──────────────────────────────────────────────────── */}
      <Box display="flex" gap={1.5} mb={3} flexWrap="wrap">
        {[
          { label: "Pay Now",             to: "make-payment",         bg: colors.greenAccent[600], icon: <PaymentIcon sx={{ fontSize: 15 }} /> },
          { label: "Report Issue",        to: "report-issue",         bg: colors.redAccent[500],   icon: <ReportProblemIcon sx={{ fontSize: 15 }} /> },
          { label: "Download Statement",  to: "payment-history",      bg: colors.blueAccent[600],  icon: <DownloadIcon sx={{ fontSize: 15 }} /> },
          { label: "Meter History",       to: "meter-reading-history",bg: colors.primary[300],     icon: <SpeedIcon sx={{ fontSize: 15 }} /> },
        ].map(a => (
          <Button key={a.label} component={Link} to={a.to} size="small" startIcon={a.icon}
            sx={{ backgroundColor: a.bg, color: "#fff", fontWeight: 600, fontSize: "12px",
              "&:hover": { filter: "brightness(1.15)" } }}>
            {a.label}
          </Button>
        ))}
      </Box>

      {/* ── ROW 1 – STAT STRIP ─────────────────────────────────────────────── */}
      <Grid container spacing={2} mb={2}>
        {/* Outstanding Balance */}
        <Grid item xs={6} sm={3}>
          <Card sx={{ backgroundColor: cardBg,
            borderTop: `3px solid ${isOverdue ? colors.redAccent[400] : colors.greenAccent[500]}` }}>
            <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="caption" color={colors.grey[400]}>Outstanding Balance</Typography>
              <Typography variant="h4" color={isOverdue ? colors.redAccent[300] : colors.grey[100]}
                fontWeight="bold" mt={0.5}>
                {bill ? fmt(bill.total_amount) : "—"}
              </Typography>
              <Typography variant="caption" color={isOverdue ? colors.redAccent[400] : colors.grey[400]}>
                {bill ? (isOverdue ? `${bill.days_overdue}d overdue` : `Due in ${daysUntilDue}d`) : "No outstanding bill"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* This Month Usage */}
        <Grid item xs={6} sm={3}>
          <Card sx={{ backgroundColor: cardBg, borderTop: `3px solid ${colors.blueAccent[400]}` }}>
            <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="caption" color={colors.grey[400]}>This Month</Typography>
              <Typography variant="h4" color={colors.blueAccent[300]} fontWeight="bold" mt={0.5}>
                {usage?.current_month_m3 != null ? `${usage.current_month_m3} m³` : "—"}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                {trendUp
                  ? <TrendingUpIcon sx={{ fontSize: 13, color: colors.redAccent[400] }} />
                  : <TrendingDownIcon sx={{ fontSize: 13, color: colors.greenAccent[400] }} />}
                <Typography variant="caption" color={trendUp ? colors.redAccent[400] : colors.greenAccent[400]}>
                  {trendUp ? "+" : ""}{usage?.trend_vs_last_month ?? 0}% vs last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Latest Reading */}
        <Grid item xs={6} sm={3}>
          <Card sx={{ backgroundColor: cardBg, borderTop: `3px solid ${colors.grey[500]}` }}>
            <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="caption" color={colors.grey[400]}>Latest Reading</Typography>
              <Typography variant="h4" color={colors.grey[100]} fontWeight="bold" mt={0.5}>
                {readings[0] ? `${readings[0].reading_value} m³` : "—"}
              </Typography>
              <Typography variant="caption" color={colors.grey[400]}>
                {readings[0] ? fmtDate(readings[0].reading_date) : "No readings yet"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Open Tickets */}
        <Grid item xs={6} sm={3}>
          <Card sx={{ backgroundColor: cardBg,
            borderTop: `3px solid ${openTickets.length > 0 ? "#f0c040" : colors.greenAccent[600]}` }}>
            <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="caption" color={colors.grey[400]}>Open Tickets</Typography>
              <Typography variant="h4" fontWeight="bold" mt={0.5}
                color={openTickets.length > 0 ? "#f0c040" : colors.greenAccent[400]}>
                {openTickets.length}
              </Typography>
              <Typography variant="caption" color={colors.grey[400]}>
                {openTickets.length === 0 ? "All resolved" : `${openTickets.length} need attention`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── PAYMENT PLAN PROGRESS (if active) ──────────────────────────────── */}
      {paymentPlan && (
        <Card sx={{ backgroundColor: cardBg, mb: 2 }}>
          <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <PaymentIcon sx={{ color: colors.greenAccent[400], fontSize: 18 }} />
                <Typography variant="body2" color={colors.grey[100]} fontWeight={600}>
                  Active Payment Plan — {paymentPlan.invoice?.invoice_number}
                </Typography>
              </Box>
              <Button component={Link} to="payment-plans" size="small" endIcon={<ArrowForwardIcon />}
                sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>Manage</Button>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color={colors.grey[400]}>
                {paymentPlan.installments_paid}/{paymentPlan.installments_count} installments paid
              </Typography>
              <Typography variant="caption" color={colors.grey[400]}>
                {fmt(paymentPlan.remaining_amount)} remaining · next {fmtDate(paymentPlan.next_due_date)}
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={planPct}
              sx={{ height: 8, borderRadius: 4, backgroundColor: colors.grey[700],
                "& .MuiLinearProgress-bar": { backgroundColor: colors.greenAccent[500] } }} />
          </CardContent>
        </Card>
      )}

      {/* ── ROW 2 – CURRENT BILL + USAGE TREND ─────────────────────────────── */}
      <Grid container spacing={2} mb={2}>
        {/* Current Bill */}
        <Grid item xs={12} md={5}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ReceiptIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Current Bill</Typography>
                </Box>
                {bill && (
                  <Chip size="small"
                    label={isOverdue ? `Overdue ${bill.days_overdue}d` : bill.status?.toUpperCase()}
                    sx={{ backgroundColor: isOverdue ? colors.redAccent[500] : colors.blueAccent[600],
                      color: "#fff", fontSize: "0.68rem" }} />
                )}
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />

              {!bill ? (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  No outstanding bills — all up to date.
                </Alert>
              ) : (
                <>
                  <Typography variant="h2" fontWeight="bold" mb={0.5}
                    color={isOverdue ? colors.redAccent[300] : colors.greenAccent[400]}>
                    {fmt(bill.total_amount)}
                  </Typography>
                  <Typography variant="body2" color={colors.grey[400]} mb={0.5}>
                    {bill.invoice_number} · {bill.billing_period}
                  </Typography>
                  <Typography variant="body2" color={colors.grey[400]} mb={0.5}>
                    Due: {fmtDate(bill.due_date)}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5} mb={2}>
                    {bill.reading_source === "smart_meter"
                      ? <SensorsIcon sx={{ fontSize: 13, color: colors.greenAccent[400] }} />
                      : <PersonIcon sx={{ fontSize: 13, color: colors.blueAccent[400] }} />}
                    <Typography variant="caption" color={colors.grey[400]}>
                      {bill.reading_source_label || "Manual reading"}
                      {bill.consumption_m3 != null && ` · ${bill.consumption_m3} m³ consumed`}
                    </Typography>
                  </Box>
                  {bill.is_estimated && (
                    <Alert severity="warning" sx={{ mb: 2, py: 0.5 }}>Estimated bill — reading pending.</Alert>
                  )}
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button variant="contained" size="small" startIcon={<PaymentIcon />}
                      component={Link} to="make-payment"
                      sx={{ backgroundColor: colors.greenAccent[600], fontSize: "12px" }}>
                      Pay Now
                    </Button>
                    <Button variant="outlined" size="small" component={Link} to="current-bill"
                      sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400], fontSize: "12px" }}>
                      Full Bill
                    </Button>
                    <Button variant="text" size="small" component={Link} to="payment-plans"
                      sx={{ color: colors.grey[400], fontSize: "12px" }}>
                      Payment Plan
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Trend Chart */}
        <Grid item xs={12} md={7}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <WaterDropIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Water Usage Trend</Typography>
                </Box>
                <Button component={Link} to="consumption-trends" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>Full Analysis</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 1 }} />

              <Box display="flex" gap={3} mb={1} flexWrap="wrap">
                <Box>
                  <Typography variant="caption" color={colors.grey[400]}>This Month</Typography>
                  <Typography variant="h5" color={colors.blueAccent[300]} fontWeight={600}>
                    {usage?.current_month_m3 ?? "—"} m³
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color={colors.grey[400]}>6-mo Avg</Typography>
                  <Typography variant="h5" color={colors.grey[300]} fontWeight={600}>
                    {chartData.length > 0
                      ? (chartData.reduce((s, d) => s + (d.consumption_m3 || 0), 0) / chartData.length).toFixed(1)
                      : "—"} m³
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color={colors.grey[400]}>Daily Avg</Typography>
                  <Typography variant="h5" color={colors.grey[300]} fontWeight={600}>
                    {usage?.daily_average_m3 ?? "—"} m³/day
                  </Typography>
                </Box>
              </Box>

              {chartData.length === 0 ? (
                <Typography color={colors.grey[500]} variant="body2">No trend data yet.</Typography>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grey[700]} />
                    <XAxis dataKey="month" tick={{ fill: colors.grey[500], fontSize: 10 }} />
                    <YAxis tick={{ fill: colors.grey[500], fontSize: 10 }} unit="m³" />
                    <ReTooltip
                      contentStyle={{ backgroundColor: colors.primary[500], border: "none", color: colors.grey[100] }}
                      formatter={v => [`${v} m³`, "Consumption"]}
                    />
                    <ReferenceLine
                      y={chartData.reduce((s, d) => s + (d.consumption_m3 || 0), 0) / chartData.length}
                      stroke={colors.grey[500]} strokeDasharray="4 4"
                    />
                    <Line type="monotone" dataKey="consumption_m3"
                      stroke={colors.blueAccent[400]} strokeWidth={2.5}
                      dot={{ fill: colors.blueAccent[400], r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── ROW 3 – METER READINGS + TICKETS + LEAK ALERTS ─────────────────── */}
      <Grid container spacing={2} mb={2}>

        {/* Meter Reading History */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <SpeedIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Meter Readings</Typography>
                </Box>
                <Button component={Link} to="meter-reading-history" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>All</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 1 }} />

              {readings.length === 0 ? (
                <Typography color={colors.grey[500]} variant="body2" mt={1}>No readings yet.</Typography>
              ) : (
                <List dense sx={{ padding: 0 }}>
                  {readings.map((r, i) => (
                    <ListItem key={r.id || i} disableGutters
                      sx={{ borderBottom: i < readings.length - 1 ? `1px solid ${colors.grey[700]}` : "none", py: 0.75 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                        <Box>
                          <Typography variant="body2" color={colors.grey[100]} fontWeight={600}>
                            {Number(r.reading_value || 0).toFixed(2)} m³
                          </Typography>
                          <Typography variant="caption" color={colors.grey[400]}>
                            {fmtDate(r.reading_date)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {r.consumption != null && r.consumption > 0 && (
                            <Typography variant="caption" color={colors.blueAccent[300]}>
                              +{Number(r.consumption).toFixed(2)} m³
                            </Typography>
                          )}
                          {r.reading_type === "automatic"
                            ? <SensorsIcon sx={{ fontSize: 13, color: colors.greenAccent[400] }} />
                            : <PersonIcon sx={{ fontSize: 13, color: colors.blueAccent[400] }} />}
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Support Tickets */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <SupportAgentIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Support Tickets</Typography>
                </Box>
                <Button component={Link} to="track-tickets" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>All</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 1 }} />

              <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
                {["open","in_progress","resolved"].map(s => {
                  const cnt = tickets.filter(t => t.status === s).length;
                  const col = s === "open" ? "#f0c040" : s === "in_progress" ? colors.blueAccent[400] : colors.greenAccent[400];
                  return cnt > 0 ? (
                    <Chip key={s} size="small" label={`${cnt} ${s.replace("_"," ")}`}
                      sx={{ fontSize: "0.68rem", border: `1px solid ${col}`,
                        backgroundColor: `${col}22`, color: col }} />
                  ) : null;
                })}
                {tickets.length === 0 && <Typography variant="caption" color={colors.grey[500]}>No tickets</Typography>}
              </Box>

              {openTickets.length > 0 ? (
                <List dense sx={{ padding: 0 }}>
                  {openTickets.slice(0, 3).map((t, i) => (
                    <ListItem key={t.id} disableGutters
                      sx={{ borderBottom: i < Math.min(openTickets.length, 3) - 1 ? `1px solid ${colors.grey[700]}` : "none", py: 0.5 }}>
                      <Box width="100%">
                        <Typography variant="body2" color={colors.grey[100]} noWrap sx={{ maxWidth: 200 }}>
                          {t.subject}
                        </Typography>
                        <Box display="flex" gap={0.5} mt={0.3}>
                          <Chip size="small" label={t.priority}
                            sx={{ fontSize: "0.62rem", height: 15,
                              backgroundColor: t.priority === "urgent" ? colors.redAccent[600] :
                                t.priority === "high" ? "#ff980044" : colors.blueAccent[700],
                              color: "#fff" }} />
                          <Typography variant="caption" color={colors.grey[500]}>
                            {t.ticket_number || `#${t.id}`}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ py: 0.5 }}>No open tickets.</Alert>
              )}

              <Button component={Link} to="report-issue" variant="outlined" size="small" fullWidth
                sx={{ mt: 2, borderColor: colors.blueAccent[500], color: colors.blueAccent[400], fontSize: "12px" }}>
                + Report Issue
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Leak & Anomaly Alerts */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: cardBg, height: "100%",
            borderTop: activeLeaks.length > 0 ? `3px solid ${colors.redAccent[400]}` : "none" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <WarningAmberIcon sx={{ color: activeLeaks.length > 0 ? colors.redAccent[400] : colors.grey[500] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Leak Alerts</Typography>
                </Box>
                <Button component={Link} to="leak-alerts" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>All</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 1 }} />

              {activeLeaks.length === 0 ? (
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 1 }}>
                  No active alerts. Usage looks normal.
                </Alert>
              ) : (
                <List dense sx={{ padding: 0 }}>
                  {activeLeaks.slice(0, 3).map((a, i) => {
                    const sc = a.severity === "high" ? colors.redAccent[400] :
                      a.severity === "medium" ? "#f0c040" : colors.blueAccent[400];
                    return (
                      <ListItem key={i} disableGutters
                        sx={{ borderBottom: i < activeLeaks.slice(0, 3).length - 1 ? `1px solid ${colors.grey[700]}` : "none", py: 0.75 }}>
                        <Box display="flex" gap={1} alignItems="flex-start" width="100%">
                          <ReportProblemIcon sx={{ fontSize: 15, color: sc, mt: 0.3, flexShrink: 0 }} />
                          <Box>
                            <Typography variant="body2" color={colors.grey[100]}>
                              {a.title || "Unusual Usage Detected"}
                            </Typography>
                            <Box display="flex" gap={0.5} mt={0.3}>
                              <Chip size="small" label={a.severity?.toUpperCase() || "ALERT"}
                                sx={{ fontSize: "0.62rem", height: 15, backgroundColor: sc, color: "#fff" }} />
                              <Typography variant="caption" color={colors.grey[500]}>
                                {relTime(a.detected_at)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── ROW 4 – ANNOUNCEMENTS + EVENTS + POLL ──────────────────────────── */}
      <Grid container spacing={2} mb={2}>

        {/* Announcements */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CampaignIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Announcements</Typography>
                </Box>
                <Button component={Link} to="announcements" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>All</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 1 }} />

              {announcements.length === 0 ? (
                <Typography color={colors.grey[500]} variant="body2" mt={1}>No announcements.</Typography>
              ) : (
                <List dense sx={{ padding: 0 }}>
                  {announcements.map((a, i) => {
                    const pc = a.priority === "urgent" ? colors.redAccent[400] :
                      a.priority === "high" ? "#f0c040" : colors.blueAccent[400];
                    return (
                      <ListItem key={a.id || i} disableGutters
                        sx={{ borderBottom: i < announcements.length - 1 ? `1px solid ${colors.grey[700]}` : "none", py: 0.75 }}>
                        <Box display="flex" gap={1} width="100%">
                          <Box sx={{ width: 3, minHeight: 38, borderRadius: 2, backgroundColor: pc, flexShrink: 0 }} />
                          <Box flex={1} minWidth={0}>
                            <Typography variant="body2" color={colors.grey[100]} noWrap fontWeight={600}>
                              {a.title}
                            </Typography>
                            <Typography variant="caption" color={colors.grey[400]}
                              sx={{ display: "-webkit-box", WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {a.content}
                            </Typography>
                            <Typography variant="caption" color={colors.grey[500]} display="block">
                              {a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <EventIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Upcoming Events</Typography>
                </Box>
                <Button component={Link} to="events" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>All</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 1 }} />

              {events.length === 0 ? (
                <Typography color={colors.grey[500]} variant="body2" mt={1}>No upcoming events.</Typography>
              ) : (
                <List dense sx={{ padding: 0 }}>
                  {events.map((e, i) => {
                    const dDiff = Math.ceil((new Date(e.event_date) - new Date()) / 86400000);
                    const dLabel = dDiff === 0 ? "Today" : dDiff === 1 ? "Tomorrow" : `In ${dDiff}d`;
                    return (
                      <ListItem key={e.id || i} disableGutters
                        sx={{ borderBottom: i < events.length - 1 ? `1px solid ${colors.grey[700]}` : "none", py: 0.75 }}>
                        <Box display="flex" gap={1} width="100%">
                          <Box sx={{ minWidth: 38, textAlign: "center", backgroundColor: colors.blueAccent[700],
                            borderRadius: 1, px: 0.5, py: 0.5 }}>
                            <Typography variant="caption" color="#fff" display="block" lineHeight={1.1}>
                              {new Date(e.event_date).toLocaleDateString("en", { month: "short" })}
                            </Typography>
                            <Typography variant="h6" color="#fff" fontWeight={700} lineHeight={1.1}>
                              {new Date(e.event_date).getDate()}
                            </Typography>
                          </Box>
                          <Box flex={1} minWidth={0}>
                            <Typography variant="body2" color={colors.grey[100]} fontWeight={600} noWrap>
                              {e.title}
                            </Typography>
                            <Chip size="small" label={dLabel}
                              sx={{ fontSize: "0.62rem", height: 15,
                                backgroundColor: dDiff <= 1 ? colors.redAccent[700] : colors.greenAccent[700],
                                color: "#fff" }} />
                          </Box>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Active Poll */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <HowToVoteIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Community Poll</Typography>
                </Box>
                <Button component={Link} to="community-polls" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>All</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 1.5 }} />

              {!poll ? (
                <Typography color={colors.grey[500]} variant="body2">No active polls.</Typography>
              ) : (
                <Box flex={1} display="flex" flexDirection="column" justifyContent="space-between">
                  <Box>
                    <Typography variant="body1" color={colors.grey[100]} fontWeight={600} mb={1.5} sx={{ lineHeight: 1.4 }}>
                      {poll.title}
                    </Typography>
                    {poll.options?.slice(0, 3).map(opt => (
                      <Typography key={opt.id} variant="body2" color={colors.grey[400]} mb={0.5}
                        sx={{ pl: 1, borderLeft: `2px solid ${colors.grey[700]}` }}>
                        {opt.option_text}
                      </Typography>
                    ))}
                    {poll.options?.length > 3 && (
                      <Typography variant="caption" color={colors.grey[500]}>
                        +{poll.options.length - 3} more options
                      </Typography>
                    )}
                    {poll.closes_at && (
                      <Typography variant="caption" color={colors.grey[500]} display="block" mt={1}>
                        Closes {new Date(poll.closes_at).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                  <Button variant="contained" component={Link} to="community-polls" fullWidth
                    startIcon={<HowToVoteIcon />}
                    sx={{ mt: 2, backgroundColor: colors.blueAccent[600], fontSize: "12px" }}>
                    {poll.user_voted ? "View Results" : "Vote Now"}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── BOTTOM – CARBON FOOTPRINT SUMMARY ──────────────────────────────── */}
      {co2Monthly && (
        <Card sx={{ backgroundColor: cardBg, borderLeft: `4px solid ${colors.greenAccent[500]}` }}>
          <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Co2Icon sx={{ color: colors.greenAccent[400], fontSize: 28 }} />
                <Box>
                  <Typography variant="caption" color={colors.grey[400]}>
                    Estimated Carbon Footprint — This Month
                  </Typography>
                  <Typography variant="h5" color={colors.greenAccent[400]} fontWeight={600}>
                    {co2Monthly} kg CO₂{" "}
                    <Typography component="span" variant="caption" color={colors.grey[500]}>
                      ({usage?.current_month_m3} m³ × 0.298 kg/m³)
                    </Typography>
                  </Typography>
                </Box>
              </Box>
              <Button component={Link} to="carbon-footprint" size="small" variant="outlined"
                sx={{ color: colors.greenAccent[400], borderColor: colors.greenAccent[600], fontSize: "12px" }}>
                Full Carbon Report →
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

    </Box>
  );
};

export default Dashboard;
