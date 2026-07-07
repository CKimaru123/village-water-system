import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Card, CardContent, Typography, useTheme, Grid,
  Chip, Divider, List, ListItem, LinearProgress,
  Alert, IconButton, Skeleton, CircularProgress,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { tokens } from "../../theme";
import adminApi from "../../utils/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";

// Icons
import PeopleIcon from "@mui/icons-material/People";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SpeedIcon from "@mui/icons-material/Speed";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import MapIcon from "@mui/icons-material/Map";
import GavelIcon from "@mui/icons-material/Gavel";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import EngineeringIcon from "@mui/icons-material/Engineering";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import DocumentScannerIcon from "@mui/icons-material/DocumentScanner";

// helpers 
const fmt = (n) => `KES ${Number(n || 0).toLocaleString()}`;
const pct = (n) => `${Number(n || 0).toFixed(1)}%`;
const relTime = (ts) => {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const SkeletonCard = ({ height = 140 }) => (
  <Card sx={{ height, backgroundColor: "rgba(255,255,255,0.04)" }}>
    <CardContent>
      <Skeleton variant="text" width="50%" sx={{ mb: 1 }} />
      <Skeleton variant="text" width="70%" />
      <Skeleton variant="rectangular" height={50} sx={{ mt: 1, borderRadius: 1 }} />
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  // state
  const [crossSummary, setCrossSummary]   = useState(null);
  const [financeSummary, setFinance]       = useState(null);
  const [revenueTrend, setRevTrend]        = useState([]);
  const [recentPayments, setRecentPay]     = useState([]);
  const [meterProgress, setMeterProgress]  = useState(null);
  const [opsAlerts, setOpsAlerts]          = useState([]);
  const [aiSummary, setAiSummary]          = useState(null);
  const [supportSummary, setSupport]       = useState(null);
  const [projectsSummary, setProjects]     = useState(null);
  const [dunningPipeline, setDunning]      = useState(null);
  const [todaysTasks, setTodaysTasks]      = useState(null);

  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const safe = async (fn) => { try { return await fn(); } catch { return null; } };

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);

    const [dashR, crossR, finR, dunR, queueR] = await Promise.all([
      safe(() => adminApi.get("/admin/dashboard")),
      safe(() => adminApi.get("/admin/cross_dashboard/summary")),
      safe(() => adminApi.get("/admin/financial_reports")),
      safe(() => adminApi.get("/admin/dunning/overdue")),
      safe(() => adminApi.get("/admin/request_queue")),
    ]);

    // ── /admin/dashboard ──────────────────────────────────────────────────────
    const stats = dashR?.data?.stats || dashR?.stats || {};
    const activity = dashR?.data?.recent_activity || dashR?.recent_activity || {};

    setFinance({
      active_clients:   stats.active_clients,
      new_clients_mtd:  null,
      revenue_mtd:      stats.total_revenue,
      revenue_target:   null,
      unpaid_total:     stats.outstanding_balance,
      overdue_count:    stats.overdue_invoices,
      collection_rate:  null,   // populated below from financial_reports
      nrw_percent:      null,
    });

    // recent payments from dashboard activity
    const pays = activity.latest_payments || [];
    setRecentPay(pays.slice(0, 8).map(p => ({
      id: p.id,
      client_name: p.user,
      amount: p.amount,
      paid_at: p.date,
    })));

    // support summary from dashboard
    setSupport({
      open:              stats.open_tickets,
      in_progress:       0,
      resolved:          0,
      sla_breaches:      0,
      avg_resolution_hours: null,
      urgent_count:      0,
    });

    // today's tasks from queue counts
    const queueCounts = queueR?.data?.counts || queueR?.counts || {};
    setTodaysTasks({
      pending_approvals: queueCounts.status_requests || 0,
      pending_refunds:   queueCounts.refunds || 0,
      docs_pending:      queueCounts.documents || 0,
      invoices_pending:  stats.overdue_invoices || 0,
    });

    // ── /admin/cross_dashboard/summary ────────────────────────────────────────
    setCrossSummary(crossR?.data || crossR?.summary || crossR || {});

    // ── /admin/financial_reports ──────────────────────────────────────────────
    const finSummary = finR?.data?.summary || finR?.summary || {};
    const monthly    = finR?.data?.monthly_breakdown || finR?.monthly_breakdown || [];

    // patch collection_rate into finance state
    setFinance(prev => ({ ...prev, collection_rate: finSummary.collection_rate }));

    // revenue trend: monthly_breakdown has { month, collected }
    setRevTrend(monthly.map(m => ({ month: m.month, amount: m.collected, target: m.invoiced })));

    // ── /admin/dunning/overdue ────────────────────────────────────────────────
    const overdueInvoices = dunR?.data?.overdue_invoices || dunR?.overdue_invoices || [];
    const totalAtRisk     = dunR?.data?.total_overdue_amount || dunR?.total_overdue_amount || 0;

    // bucket invoices into dunning stages by days_overdue
    const bucket = (min, max) =>
      overdueInvoices.filter(i => i.days_overdue >= min && (max === null || i.days_overdue < max)).length;

    setDunning({
      grace_period:  bucket(1, 8),
      first_warning: bucket(8, 15),
      final_notice:  bucket(15, 31),
      disconnection: bucket(31, 61),
      legal_action:  bucket(61, null),
      written_off:   0,
      total_at_risk: totalAtRisk,
    });

    // ── /projects ─────────────────────────────────────────────────────────────
    const projR = await safe(() => adminApi.get("/projects"));
    const projList = projR?.data?.data?.projects || projR?.data?.projects || projR?.data || [];
    const MOCK_PROJECTS = [
      { id: 1, title: "Kijiji A Borehole Drilling", status: "ongoing",   completion_percentage: 65,  budget: 2800000 },
      { id: 2, title: "Solar Pump Installation",    status: "planning",  completion_percentage: 0,   budget: 1500000 },
      { id: 3, title: "Pipeline Extension",          status: "on_hold",  completion_percentage: 30,  budget: 980000  },
      { id: 4, title: "Treatment Plant Upgrade",    status: "completed", completion_percentage: 100, budget: 3200000 },
      { id: 5, title: "Storage Tank — Kijiji E",    status: "ongoing",   completion_percentage: 45,  budget: 1750000 },
    ];
    const projects = Array.isArray(projList) && projList.length > 0 ? projList : MOCK_PROJECTS;
    setProjects({
      list: projects,
      active:    projects.filter(p => p.status === "ongoing").length,
      completed: projects.filter(p => p.status === "completed").length,
      on_hold:   projects.filter(p => p.status === "on_hold").length,
      delayed:   projects.filter(p => p.status === "planning").length,
      budget_utilization: projects.length > 0
        ? Math.round(projects.reduce((s, p) => s + (p.completion_percentage || 0), 0) / projects.length)
        : 0,
    });

    // ── placeholders for endpoints not yet implemented ────────────────────────
    setMeterProgress(null);
    setOpsAlerts([]);
    setAiSummary(null);

    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // cross-dashboard alert badges 
  const badges = crossSummary ? [
    { label: "Pending Tickets",  value: crossSummary.pending_tickets,  path: "ticketing",    color: colors.blueAccent[400] },
    { label: "Overdue Invoices", value: crossSummary.overdue_invoices, path: "dunning",       color: colors.redAccent[400] },
    { label: "Pending Requests", value: crossSummary.pending_requests, path: "request-queue", color: "#f0c040" },
    { label: "SLA Breaches",     value: crossSummary.sla_breaches,     path: "sla-tracking",  color: colors.redAccent[300] },
    { label: "Pending Refunds",  value: crossSummary.pending_refunds,  path: "refunds",       color: colors.blueAccent[300] },
    { label: "Anomalies",        value: crossSummary.anomalies,        path: "ai-anomalies",  color: "#f0a040" },
  ].filter(b => (b.value ?? 0) > 0) : [];

  const cardBg = colors.primary[400];

  if (loading) return (
    <Box m="20px">
      <Skeleton variant="text" width={300} height={44} sx={{ mb: 3 }} />
      <Grid container spacing={2} mb={2}>
        {[1,2,3,4].map(i => <Grid item xs={6} md={3} key={i}><SkeletonCard height={100} /></Grid>)}
      </Grid>
      <Grid container spacing={2}>
        {[1,2,3,4,5,6].map(i => <Grid item xs={12} md={4} key={i}><SkeletonCard height={200} /></Grid>)}
      </Grid>
    </Box>
  );

  return (
    <Box m="20px">

      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Admin Dashboard</Typography>
          <Typography variant="h6" color={colors.grey[400]}>
            Water system operational overview
            {lastUpdated && (
              <Typography component="span" variant="caption" color={colors.grey[500]} ml={1}>
                Updated {relTime(lastUpdated)}
              </Typography>
            )}
          </Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <IconButton onClick={() => fetchAll(true)} disabled={refreshing}
            sx={{ color: colors.blueAccent[400] }} title="Refresh">
            <RefreshIcon />
          </IconButton>
          <Button component={Link} to="export-tools" size="small" startIcon={<DownloadIcon />}
            sx={{ backgroundColor: colors.blueAccent[700], color: colors.grey[100], fontWeight: 600 }}>
            Download Reports
          </Button>
        </Box>
      </Box>

      {/* ALERT BADGE STRIP */}
      {badges.length > 0 && (
        <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
          {badges.map((b, i) => (
            <Card key={i} onClick={() => navigate(b.path)}
              sx={{ backgroundColor: cardBg, cursor: "pointer", minWidth: 130,
                borderTop: `3px solid ${b.color}`,
                "&:hover": { backgroundColor: colors.primary[300] } }}>
              <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                <Typography variant="h3" fontWeight="bold" color={b.color}>{b.value ?? 0}</Typography>
                <Typography variant="caption" color={colors.grey[400]}>{b.label}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* ROW 1 KPI STAT STRIP */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ backgroundColor: cardBg, borderTop: `3px solid ${colors.greenAccent[500]}` }}>
            <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <PeopleIcon sx={{ fontSize: 16, color: colors.greenAccent[400] }} />
                <Typography variant="caption" color={colors.grey[400]}>Active Clients</Typography>
              </Box>
              <Typography variant="h4" color={colors.grey[100]} fontWeight="bold">
                {financeSummary?.active_clients ?? crossSummary?.total_clients ?? "Nil"}
              </Typography>
              <Typography variant="caption" color={colors.grey[100]}>
                Total Active Clients
              </Typography>
              {financeSummary?.new_clients_mtd != null && (
                <Typography variant="caption" color={colors.greenAccent[400]}>
                  +{financeSummary.new_clients_mtd} this month
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ backgroundColor: cardBg, borderTop: `3px solid ${colors.blueAccent[400]}` }}>
            <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <AttachMoneyIcon sx={{ fontSize: 16, color: colors.blueAccent[400] }} />
                <Typography variant="caption" color={colors.grey[400]}>Revenue MTD</Typography>
              </Box>
              <Typography variant="h4" color={colors.blueAccent[300]} fontWeight="bold">
                {financeSummary?.revenue_mtd != null ? fmt(financeSummary.revenue_mtd) : "â€”"}
              </Typography>
              <Typography variant="caption" color={colors.blueAccent[400]}>
                Monthly Revenue
              </Typography>
              {financeSummary?.revenue_target != null && (
                <Typography variant="caption" color={colors.grey[400]}>
                  Target: {fmt(financeSummary.revenue_target)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ backgroundColor: cardBg, borderTop: `3px solid ${colors.redAccent[400]}` }}>
            <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <ReceiptLongIcon sx={{ fontSize: 16, color: colors.redAccent[400] }} />
                <Typography variant="caption" color={colors.grey[400]}>Unpaid Invoices</Typography>
              </Box>
              <Typography variant="h4" color={colors.redAccent[300]} fontWeight="bold">
                {financeSummary?.unpaid_total != null ? fmt(financeSummary.unpaid_total) : "Nil”"}
              </Typography>
              {financeSummary?.overdue_count != null && (
                <Typography variant="caption" color={colors.redAccent[400]}>
                  {financeSummary.overdue_count} overdue
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ backgroundColor: cardBg, borderTop: `3px solid ${colors.greenAccent[400]}` }}>
            <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <TrendingUpIcon sx={{ fontSize: 16, color: colors.greenAccent[400] }} />
                <Typography variant="caption" color={colors.grey[400]}>Collection Rate</Typography>
              </Box>
              <Typography variant="h4" color={colors.greenAccent[400]} fontWeight="bold">
                {financeSummary?.collection_rate != null ? pct(financeSummary.collection_rate) : "â€”"}
              </Typography>
              <Typography variant="caption" color={colors.greenAccent[400]}>
                Collection Rate
              </Typography>
              {financeSummary?.nrw_percent != null && (
                <Typography variant="caption" color={colors.grey[400]}>
                  NRW: {pct(financeSummary.nrw_percent)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ROW 2 REVENUE TREND + RECENT TRANSACTIONS */}
      <Grid container spacing={2} mb={2}>

        {/* Revenue Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box>
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Revenue Collected</Typography>
                  {financeSummary?.revenue_mtd != null && (
                    <Typography variant="h3" color={colors.greenAccent[400]} fontWeight="bold">
                      {fmt(financeSummary.revenue_mtd)}
                      <Typography component="span" variant="caption" color={colors.grey[400]} ml={1}>MTD</Typography>
                    </Typography>
                  )}
                </Box>
                <Button component={Link} to="financial-reports" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>Full Report</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 1 }} />
              {revenueTrend.length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={220}>
                  <Typography color={colors.grey[500]}>No revenue trend data yet.</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={revenueTrend} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grey[700]} />
                    <XAxis dataKey="month" tick={{ fill: colors.grey[500], fontSize: 10 }} />
                    <YAxis tick={{ fill: colors.grey[500], fontSize: 10 }}
                      tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <ReTooltip
                      contentStyle={{ backgroundColor: colors.primary[500], border: "none", color: colors.grey[100] }}
                      formatter={v => [fmt(v), "Collected"]}
                    />
                    <Line type="monotone" dataKey="amount"
                      stroke={colors.greenAccent[400]} strokeWidth={2.5}
                      dot={{ fill: colors.greenAccent[400], r: 3 }} activeDot={{ r: 5 }} />
                    {revenueTrend[0]?.target != null && (
                      <Line type="monotone" dataKey="target"
                        stroke={colors.grey[600]} strokeDasharray="4 4" strokeWidth={1.5}
                        dot={false} name="Target" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Recent Payments</Typography>
                <Button component={Link} to="reconciliation" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>All</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 1 }} />
              {recentPayments.length === 0 ? (
                <Typography color={colors.grey[500]} variant="body2" mt={1}>No recent payments.</Typography>
              ) : (
                <Box sx={{ overflowY: "auto", flex: 1 }}>
                  {recentPayments.map((p, i) => (
                    <Box key={p.id || i}
                      display="flex" justifyContent="space-between" alignItems="center"
                      py={0.75} sx={{ borderBottom: `1px solid ${colors.grey[700]}` }}>
                      <Box minWidth={0} flex={1} mr={1}>
                        <Typography variant="body2" color={colors.grey[100]} noWrap>
                          {p.client_name || p.account_number || "Client"}
                        </Typography>
                        <Typography variant="caption" color={colors.grey[500]}>
                          {p.invoice_number || ""} Â· {relTime(p.paid_at || p.created_at)}
                        </Typography>
                      </Box>
                      <Box sx={{ backgroundColor: colors.greenAccent[700],
                        px: 1, py: 0.3, borderRadius: 1, flexShrink: 0 }}>
                        <Typography variant="caption" color="#fff" fontWeight={600}>
                          {fmt(p.amount)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ROW 3 METER PROGRESS + OPS ALERTS + AI ANOMALIES */}
      <Grid container spacing={2} mb={2}>

        {/* Meter Reading Cycle Progress */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <SpeedIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Meter Reading Cycle</Typography>
                </Box>
                <Button component={Link} to="meter-readings" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>Manage</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />

              {!meterProgress ? (
                <Typography color={colors.grey[500]} variant="body2">No cycle data available.</Typography>
              ) : (
                <>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color={colors.grey[300]}>
                      {meterProgress.readings_entered ?? 0} of {meterProgress.total_clients ?? 0} clients
                    </Typography>
                    <Typography variant="body2" color={colors.blueAccent[300]} fontWeight={600}>
                      {pct((meterProgress.readings_entered / Math.max(meterProgress.total_clients, 1)) * 100)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(((meterProgress.readings_entered ?? 0) / Math.max(meterProgress.total_clients ?? 1, 1)) * 100, 100)}
                    sx={{ height: 10, borderRadius: 5, mb: 2, backgroundColor: colors.grey[700],
                      "& .MuiLinearProgress-bar": { backgroundColor: colors.blueAccent[400] } }}
                  />
                  <Grid container spacing={1}>
                    {[
                      { label: "Pending",  value: meterProgress.pending,  color: "#f0c040" },
                      { label: "Smart",    value: meterProgress.automatic, color: colors.greenAccent[400] },
                      { label: "Manual",   value: meterProgress.manual,    color: colors.blueAccent[400] },
                      { label: "Estimated",value: meterProgress.estimated, color: colors.redAccent[400] },
                    ].map(s => (
                      <Grid item xs={6} key={s.label}>
                        <Box sx={{ backgroundColor: colors.primary[500], borderRadius: 1, padding: 8 }}>
                          <Typography variant="caption" color={colors.grey[400]}>{s.label}</Typography>
                          <Typography variant="h6" color={s.color} fontWeight={600}>{s.value ?? 0}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  {meterProgress.cycle_deadline && (
                    <Typography variant="caption" color={colors.grey[500]} display="block" mt={1}>
                      Cycle deadline: {new Date(meterProgress.cycle_deadline).toLocaleDateString()}
                    </Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Operational Alerts */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: cardBg, height: "100%",
            borderTop: opsAlerts.length > 0 ? `3px solid ${colors.redAccent[400]}` : "none" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <WarningAmberIcon sx={{ color: opsAlerts.length > 0 ? colors.redAccent[400] : colors.grey[500] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Operational Alerts</Typography>
                </Box>
                <Button component={Link} to="incidents" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>All</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 1 }} />

              {opsAlerts.length === 0 ? (
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 1 }}>
                  No active operational alerts.
                </Alert>
              ) : (
                <List disablePadding>
                  {opsAlerts.map((a, i) => {
                    const sc = a.severity === "critical" ? colors.redAccent[400] :
                      a.severity === "high" ? "#ff9800" :
                      a.severity === "medium" ? "#f0c040" : colors.blueAccent[400];
                    return (
                      <ListItem key={i} disableGutters
                        sx={{ borderBottom: i < opsAlerts.length - 1 ? `1px solid ${colors.grey[700]}` : "none", py: 0.75 }}>
                        <Box display="flex" gap={1} width="100%">
                          <Box sx={{ width: 3, borderRadius: 2, backgroundColor: sc, flexShrink: 0, alignSelf: "stretch" }} />
                          <Box flex={1} minWidth={0}>
                            <Typography variant="body2" color={colors.grey[100]} noWrap>{a.title || a.type}</Typography>
                            <Box display="flex" gap={0.5} mt={0.3} flexWrap="wrap">
                              <Chip size="small" label={a.severity?.toUpperCase() || "ALERT"}
                                sx={{ fontSize: "0.62rem", height: 16, backgroundColor: sc, color: "#fff" }} />
                              {a.category && (
                                <Typography variant="caption" color={colors.grey[500]}>{a.category}</Typography>
                              )}
                              <Typography variant="caption" color={colors.grey[500]}>{relTime(a.created_at)}</Typography>
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

        {/* AI Anomaly Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <PsychologyIcon sx={{ color: "#f0a040" }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>AI Anomaly Detection</Typography>
                </Box>
                <Button component={Link} to="ai-anomalies" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>Details</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />

              {!aiSummary ? (
                <Typography color={colors.grey[500]} variant="body2">No anomaly data available.</Typography>
              ) : (
                <>
                  <Box display="flex" alignItems="baseline" gap={1} mb={2}>
                    <Typography variant="h2" color="#f0a040" fontWeight="bold">
                      {aiSummary.total_anomalies ?? 0}
                    </Typography>
                    <Typography variant="body2" color={colors.grey[400]}>anomalies detected</Typography>
                  </Box>
                  <Grid container spacing={1}>
                    {[
                      { label: "Critical", value: aiSummary.critical, color: colors.redAccent[400] },
                      { label: "High",     value: aiSummary.high,     color: "#ff9800" },
                      { label: "Medium",   value: aiSummary.medium,   color: "#f0c040" },
                      { label: "Low",      value: aiSummary.low,      color: colors.greenAccent[400] },
                    ].map(s => (
                      <Grid item xs={6} key={s.label}>
                        <Box sx={{ backgroundColor: colors.primary[500], borderRadius: 1, padding: 8 }}>
                          <Typography variant="caption" color={colors.grey[400]}>{s.label}</Typography>
                          <Typography variant="h6" color={s.color} fontWeight={600}>{s.value ?? 0}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  {aiSummary.last_detected && (
                    <Typography variant="caption" color={colors.grey[500]} display="block" mt={1}>
                      Last detected: {relTime(aiSummary.last_detected)}
                    </Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ROW 4 SUPPORT + PROJECTS + GIS MAP */}
      <Grid container spacing={2} mb={2}>

        {/* Support Queue */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <SupportAgentIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Support Queue</Typography>
                </Box>
                <Button component={Link} to="ticketing" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>All Tickets</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />

              {!supportSummary ? (
                <Typography color={colors.grey[500]} variant="body2">No support data available.</Typography>
              ) : (
                <>
                  <Grid container spacing={1} mb={1.5}>
                    {[
                      { label: "Open",        value: supportSummary.open,        color: "#f0c040" },
                      { label: "In Progress",  value: supportSummary.in_progress, color: colors.blueAccent[400] },
                      { label: "Resolved",     value: supportSummary.resolved,    color: colors.greenAccent[400] },
                      { label: "Overdue SLA",  value: supportSummary.sla_breaches,color: colors.redAccent[400] },
                    ].map(s => (
                      <Grid item xs={6} key={s.label}>
                        <Box sx={{ backgroundColor: colors.primary[500], borderRadius: 1, padding: 8 }}>
                          <Typography variant="caption" color={colors.grey[400]}>{s.label}</Typography>
                          <Typography variant="h6" color={s.color} fontWeight={600}>{s.value ?? 0}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  {supportSummary.avg_resolution_hours != null && (
                    <Typography variant="body2" color={colors.grey[400]}>
                      Avg resolution:{" "}
                      <Typography component="span" color={colors.grey[100]} fontWeight={600}>
                        {supportSummary.avg_resolution_hours}h
                      </Typography>
                    </Typography>
                  )}
                  {supportSummary.urgent_count > 0 && (
                    <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                      {supportSummary.urgent_count} urgent ticket{supportSummary.urgent_count > 1 ? "s" : ""} need immediate attention
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Projects Overview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <AccountTreeIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Projects</Typography>
                </Box>
                <Button component={Link} to="project-tracker" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>All</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />

              {!projectsSummary ? (
                <Typography color={colors.grey[500]} variant="body2">No projects data available.</Typography>
              ) : (
                <>
                  <Grid container spacing={1} mb={1.5}>
                    {[
                      { label: "Active",    value: projectsSummary.active,    color: colors.blueAccent[400] },
                      { label: "Completed", value: projectsSummary.completed, color: colors.greenAccent[400] },
                      { label: "On Hold",   value: projectsSummary.on_hold,   color: "#f0c040" },
                      { label: "Delayed",   value: projectsSummary.delayed,   color: colors.redAccent[400] },
                    ].map(s => (
                      <Grid item xs={6} key={s.label}>
                        <Box sx={{ backgroundColor: colors.primary[500], borderRadius: 1, padding: 8 }}>
                          <Typography variant="caption" color={colors.grey[400]}>{s.label}</Typography>
                          <Typography variant="h6" color={s.color} fontWeight={600}>{s.value ?? 0}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  {projectsSummary.budget_utilization != null && (
                    <>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color={colors.grey[400]}>Budget Utilization</Typography>
                        <Typography variant="caption" color={colors.grey[300]} fontWeight={600}>
                          {pct(projectsSummary.budget_utilization)}
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={Math.min(projectsSummary.budget_utilization, 100)}
                        sx={{ height: 6, borderRadius: 3, backgroundColor: colors.grey[700],
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: projectsSummary.budget_utilization > 90
                              ? colors.redAccent[400] : colors.greenAccent[500]
                          }
                        }}
                      />
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Mini GIS / Coverage Map */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: cardBg, height: "100%" }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <MapIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Distribution Map</Typography>
                </Box>
                <Button component={Link} to="project-map" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>Full Map</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 1 }} />

              {/* Inline SVG schematic map from ProjectMap */}
              <Box flex={1} sx={{ position: "relative", backgroundColor: colors.primary[500],
                borderRadius: 1, overflow: "hidden", minHeight: 200, cursor: "pointer" }}
                onClick={() => navigate("project-map")}>
                <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
                  {[20,40,60,80].map(y => (
                    <line key={`h${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`}
                      stroke={colors.grey[800]} strokeWidth="1" strokeDasharray="4,4" />
                  ))}
                  {[20,40,60,80].map(x => (
                    <line key={`v${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%"
                      stroke={colors.grey[800]} strokeWidth="1" strokeDasharray="4,4" />
                  ))}
                  <path d="M 10% 50% Q 50% 30% 90% 50%" stroke={colors.grey[700]} strokeWidth="2" fill="none" />
                  <path d="M 50% 10% L 50% 90%" stroke={colors.grey[700]} strokeWidth="1.5" fill="none" strokeDasharray="6,3" />
                </svg>

                {/* Project markers from live data */}
                {(projectsSummary?.list || []).map((p, i) => {
                  const STATUS_COLORS_MAP = {
                    planning: "#868dfb", ongoing: "#4cceac", on_hold: "#f0c040",
                    completed: "#4caf50", cancelled: "#e2726e",
                  };
                  const mx = p.map_x || (15 + (i % 4) * 20);
                  const my = p.map_y || (20 + Math.floor(i / 4) * 30);
                  const mc = STATUS_COLORS_MAP[p.status] || "#666";
                  return (
                    <Box key={p.id} sx={{
                      position: "absolute", left: `${mx}%`, top: `${my}%`,
                      transform: "translate(-50%,-50%)", zIndex: 5,
                    }}>
                      <Box sx={{
                        width: 18, height: 18, borderRadius: "50%",
                        backgroundColor: mc,
                        border: `2px solid ${colors.primary[400]}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: p.status === "ongoing" ? `0 0 6px ${mc}` : "none",
                      }}>
                        <Typography sx={{ fontSize: "0.55rem", color: "#fff", fontWeight: "bold", lineHeight: 1 }}>
                          {p.id}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}

                <Box sx={{ position: "absolute", bottom: 6, left: 8 }}>
                  <Typography sx={{ fontSize: "0.65rem", color: colors.grey[600] }}>
                    Click to open full map
                  </Typography>
                </Box>
              </Box>

              {/* Legend */}
              <Box display="flex" gap={1.5} mt={1} flexWrap="wrap">
                {[["ongoing","#4cceac"],["completed","#4caf50"],["planning","#868dfb"],["on_hold","#f0c040"]].map(([s,c]) => (
                  <Box key={s} display="flex" alignItems="center" gap={0.5}>
                    <Box sx={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: c }} />
                    <Typography variant="caption" color={colors.grey[500]} sx={{ fontSize: "0.65rem" }}>
                      {s.replace("_"," ")}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TODAY'S TASKS + DUNNING PIPELINE */}
      <Grid container spacing={2} mb={2}>

        {/* Today's Tasks */}
        <Grid item xs={12} md={5}>
          <Card sx={{ backgroundColor: cardBg }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TaskAltIcon sx={{ color: colors.greenAccent[400] }} />
                <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Today's Tasks</Typography>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 1.5 }} />

              {[
                {
                  label: "Pending Approvals",
                  value: todaysTasks?.pending_approvals ?? crossSummary?.pending_requests ?? 0,
                  path: "request-queue",
                  icon: <AssignmentLateIcon sx={{ fontSize: 16, color: "#f0c040" }} />,
                  color: "#f0c040",
                },
                {
                  label: "Refunds Awaiting",
                  value: todaysTasks?.pending_refunds ?? crossSummary?.pending_refunds ?? 0,
                  path: "refunds",
                  icon: <MoneyOffIcon sx={{ fontSize: 16, color: colors.blueAccent[400] }} />,
                  color: colors.blueAccent[400],
                },
                {
                  label: "Docs to Verify",
                  value: todaysTasks?.docs_pending ?? 0,
                  path: "document-verification",
                  icon: <DocumentScannerIcon sx={{ fontSize: 16, color: colors.greenAccent[400] }} />,
                  color: colors.greenAccent[400],
                },
                {
                  label: "Invoices to Generate",
                  value: todaysTasks?.invoices_pending ?? 0,
                  path: "invoice-generation",
                  icon: <ReceiptLongIcon sx={{ fontSize: 16, color: colors.redAccent[300] }} />,
                  color: colors.redAccent[300],
                },
              ].map((task, i) => (
                <Box key={i}
                  display="flex" alignItems="center" justifyContent="space-between"
                  py={0.75} sx={{ borderBottom: i < 3 ? `1px solid ${colors.grey[700]}` : "none",
                    cursor: "pointer", "&:hover": { backgroundColor: colors.primary[500] },
                    borderRadius: 0.5, px: 0.5 }}
                  onClick={() => navigate(task.path)}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {task.icon}
                    <Typography variant="body2" color={colors.grey[200]}>{task.label}</Typography>
                  </Box>
                  <Chip size="small" label={task.value}
                    sx={{ backgroundColor: task.value > 0 ? `${task.color}33` : colors.grey[700],
                      color: task.value > 0 ? task.color : colors.grey[500],
                      border: `1px solid ${task.value > 0 ? task.color : colors.grey[700]}`,
                      fontWeight: 700, minWidth: 32 }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Dunning Pipeline */}
        <Grid item xs={12} md={7}>
          <Card sx={{ backgroundColor: cardBg }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <GavelIcon sx={{ color: colors.redAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Dunning Pipeline</Typography>
                </Box>
                <Button component={Link} to="dunning" size="small" endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.blueAccent[400], fontSize: "11px" }}>Manage</Button>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />

              {!dunningPipeline ? (
                <Typography color={colors.grey[500]} variant="body2">No dunning data available.</Typography>
              ) : (
                <Grid container spacing={1.5}>
                  {[
                    { label: "Grace Period",   value: dunningPipeline.grace_period,    color: colors.blueAccent[400],  desc: "7 days overdue" },
                    { label: "First Warning",  value: dunningPipeline.first_warning,   color: "#f0c040",               desc: "14 days overdue" },
                    { label: "Final Notice",   value: dunningPipeline.final_notice,    color: "#ff9800",               desc: "30 days overdue" },
                    { label: "Disconnection",  value: dunningPipeline.disconnection,   color: colors.redAccent[400],   desc: "60 days overdue" },
                    { label: "Legal Action",   value: dunningPipeline.legal_action,    color: colors.redAccent[600],   desc: "60+ days overdue" },
                    { label: "Written Off",    value: dunningPipeline.written_off,     color: colors.grey[600],        desc: "Uncollectable" },
                  ].map((stage, i) => (
                    <Grid item xs={6} sm={4} key={i}>
                      <Box sx={{ backgroundColor: colors.primary[500], borderRadius: 1, padding: 12,
                        borderLeft: `3px solid ${stage.color}` }}>
                        <Typography variant="caption" color={colors.grey[400]} display="block">{stage.label}</Typography>
                        <Typography variant="h4" color={stage.color} fontWeight="bold">{stage.value ?? 0}</Typography>
                        <Typography variant="caption" color={colors.grey[500]}>{stage.desc}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}

              {dunningPipeline?.total_at_risk != null && (
                <Box mt={2} display="flex" justifyContent="space-between" alignItems="center"
                  sx={{ backgroundColor: `${colors.redAccent[500]}22`, borderRadius: 1, px: 2, py: 1 }}>
                  <Typography variant="body2" color={colors.grey[300]}>Total at risk:</Typography>
                  <Typography variant="h5" color={colors.redAccent[300]} fontWeight="bold">
                    {fmt(dunningPipeline.total_at_risk)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

    </Box>
  );
};

export default Dashboard;


