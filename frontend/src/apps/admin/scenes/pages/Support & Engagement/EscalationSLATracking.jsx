import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,
  Chip, Button, IconButton, Tabs, Tab, Divider, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Snackbar, Tooltip, Avatar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorIcon from "@mui/icons-material/Error";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EscalateIcon from "@mui/icons-material/TrendingUp";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import { useNavigate } from "react-router-dom";
import adminApi from "../../../utils/api";

// SLA targets in hours by priority
const SLA_TARGETS = { urgent:2, high:8, normal:24, low:72 };

const MOCK_TICKETS = [
  { id:1, ticket_number:"TKT-001", subject:"No water supply for 3 days", category:"outage", priority:"urgent",
    status:"open", client_name:"Mary Wanjiku", created_at:"2025-05-20T08:00:00Z", updated_at:"2025-05-20T08:00:00Z",
    hours_open:14, sla_target:2, breached:true, escalated:false, description:"Complete water outage in Zone A since Monday." },
  { id:2, ticket_number:"TKT-002", subject:"Billing discrepancy on May invoice", category:"billing", priority:"normal",
    status:"in_progress", client_name:"John Kamau", created_at:"2025-05-19T10:00:00Z", updated_at:"2025-05-20T09:00:00Z",
    hours_open:23, sla_target:24, breached:false, escalated:false, description:"Charged KES 2,400 but expected KES 1,800." },
  { id:3, ticket_number:"TKT-003", subject:"Meter reading incorrect", category:"meter", priority:"high",
    status:"open", client_name:"Fatuma Ali", created_at:"2025-05-18T14:00:00Z", updated_at:"2025-05-18T14:00:00Z",
    hours_open:42, sla_target:8, breached:true, escalated:true, description:"Meter shows 45m³ but actual usage is ~12m³." },
  { id:4, ticket_number:"TKT-004", subject:"Pipe leak near Plot 22", category:"technical", priority:"urgent",
    status:"in_progress", client_name:"Peter Njoroge", created_at:"2025-05-20T06:00:00Z", updated_at:"2025-05-20T07:30:00Z",
    hours_open:6, sla_target:2, breached:true, escalated:false, description:"Visible pipe burst on main road near Plot 22." },
  { id:5, ticket_number:"TKT-005", subject:"Request for new connection", category:"connection", priority:"low",
    status:"resolved", client_name:"Grace Odhiambo", created_at:"2025-05-15T09:00:00Z", updated_at:"2025-05-17T11:00:00Z",
    hours_open:50, sla_target:72, breached:false, escalated:false, description:"New household connection request for Plot 45." },
  { id:6, ticket_number:"TKT-006", subject:"Water quality concern — brown water", category:"water_quality", priority:"high",
    status:"open", client_name:"Samuel Mwenda", created_at:"2025-05-19T16:00:00Z", updated_at:"2025-05-19T16:00:00Z",
    hours_open:18, sla_target:8, breached:true, escalated:false, description:"Water has brown discolouration since yesterday." },
];

const priorityColor = (p) => ({ urgent:"#e2726e", high:"#ff9800", normal:"#4cceac", low:"#868dfb" }[p] || "#666");
const statusColor = (s, colors) => ({ open:"#f0c040", in_progress:colors.blueAccent[400], resolved:colors.greenAccent[500], closed:colors.grey[500] }[s] || colors.grey[400]);

const slaStatus = (ticket) => {
  const pct = Math.min((ticket.hours_open / ticket.sla_target) * 100, 100);
  if (ticket.status === "resolved" || ticket.status === "closed") return { label:"Resolved", color:"#4cceac", pct:100 };
  if (ticket.breached) return { label:"Breached", color:"#e2726e", pct:100 };
  if (pct >= 80) return { label:"At Risk", color:"#ff9800", pct };
  return { label:"On Track", color:"#4cceac", pct };
};

const KpiCard = ({ label, value, color, sub }) => (
  <Card sx={{ flex:"1 1 130px", minWidth:110, backgroundColor:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
    <CardContent sx={{ p:"12px 16px !important" }}>
      <Typography sx={{ fontSize:"1.6rem", fontWeight:"bold", color }}>{value}</Typography>
      <Typography sx={{ fontSize:"0.75rem", color:"#858585" }}>{label}</Typography>
      {sub && <Typography sx={{ fontSize:"0.7rem", color:"#666" }}>{sub}</Typography>}
    </CardContent>
  </Card>
);

const EscalationSLATracking = () => {
  const colors = tokens(useTheme().palette.mode);
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [resolveDialog, setResolveDialog] = useState({ open:false, ticket:null });
  const [resolveNote, setResolveNote] = useState("");
  const [snackbar, setSnackbar] = useState({ open:false, message:"", severity:"success" });

  const load = useCallback(() => {
    setLoading(true);
    // Try to load real tickets from admin API
    adminApi.get("/admin/tickets")
      .then(res => {
        const d = res.data?.tickets || res.data?.data?.tickets || res.data;
        if (Array.isArray(d) && d.length > 0) {
          // Enrich with SLA data
          const enriched = d.map(t => ({
            ...t,
            hours_open: Math.floor((Date.now() - new Date(t.created_at).getTime()) / 3600000),
            sla_target: SLA_TARGETS[t.priority] || 24,
            breached: Math.floor((Date.now() - new Date(t.created_at).getTime()) / 3600000) > (SLA_TARGETS[t.priority] || 24),
            client_name: t.user?.display_name || t.user?.email || "Client",
          }));
          setTickets(enriched);
        } else {
          setTickets(MOCK_TICKETS);
        }
      })
      .catch(() => setTickets(MOCK_TICKETS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEscalate = async (ticketId) => {
    try {
      await adminApi.post(`/admin/sla/tickets/${ticketId}/escalate`, {});
    } catch { /* local */ }
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, escalated:true } : t));
    setSnackbar({ open:true, message:"Ticket escalated to senior support.", severity:"success" });
  };

  const handleResolve = async () => {
    try {
      await adminApi.patch(`/admin/tickets/${resolveDialog.ticket.id}`, { ticket:{ status:"resolved", resolution_notes:resolveNote } });
    } catch { /* local */ }
    setTickets(prev => prev.map(t => t.id === resolveDialog.ticket.id ? { ...t, status:"resolved", breached:false } : t));
    setResolveDialog({ open:false, ticket:null });
    setResolveNote("");
    setSnackbar({ open:true, message:"Ticket marked as resolved.", severity:"success" });
  };

  const breached = tickets.filter(t => t.breached && t.status !== "resolved" && t.status !== "closed");
  const atRisk = tickets.filter(t => !t.breached && t.status !== "resolved" && t.status !== "closed" &&
    (t.hours_open / t.sla_target) >= 0.8);
  const onTrack = tickets.filter(t => !t.breached && t.status !== "resolved" && t.status !== "closed" &&
    (t.hours_open / t.sla_target) < 0.8);
  const resolved = tickets.filter(t => t.status === "resolved" || t.status === "closed");

  const kpis = [
    { label:"Total Tickets", value:tickets.length, color:colors.blueAccent[400] },
    { label:"SLA Breached", value:breached.length, color:"#e2726e", sub:`${tickets.length > 0 ? Math.round((breached.length/tickets.length)*100) : 0}% of total` },
    { label:"At Risk", value:atRisk.length, color:"#ff9800" },
    { label:"On Track", value:onTrack.length, color:"#4cceac" },
    { label:"Resolved", value:resolved.length, color:colors.greenAccent[400] },
    { label:"Escalated", value:tickets.filter(t => t.escalated).length, color:"#e2726e" },
  ];

  const trendData = [{
    id:"Breaches",
    color:"#e2726e",
    data:[{ x:"Mon",y:2 },{ x:"Tue",y:3 },{ x:"Wed",y:1 },{ x:"Thu",y:4 },{ x:"Fri",y:breached.length },{ x:"Sat",y:0 },{ x:"Sun",y:0 }],
  }];

  const categoryData = Object.entries(
    tickets.reduce((acc, t) => { acc[t.category||"other"] = (acc[t.category||"other"]||0)+1; return acc; }, {})
  ).map(([cat, count]) => ({ category:cat.replace(/_/g," "), count }));

  const pieData = [
    { id:"Breached", label:"Breached", value:breached.length, color:"#e2726e" },
    { id:"At Risk", label:"At Risk", value:atRisk.length, color:"#ff9800" },
    { id:"On Track", label:"On Track", value:onTrack.length, color:"#4cceac" },
    { id:"Resolved", label:"Resolved", value:resolved.length, color:"#4caf50" },
  ].filter(d => d.value > 0);

  const tabSx = {
    "& .MuiTab-root":{ fontSize:"0.95rem", color:colors.grey[400] },
    "& .Mui-selected":{ color:"#fff !important", backgroundColor:colors.blueAccent[700], borderRadius:"4px 4px 0 0" },
    "& .MuiTabs-indicator":{ backgroundColor:colors.blueAccent[400] },
  };

  const nivoTheme = {
    axis:{ ticks:{ text:{ fill:colors.grey[400] } }, legend:{ text:{ fill:colors.grey[400] } } },
    grid:{ line:{ stroke:colors.grey[700] } },
    tooltip:{ container:{ background:colors.primary[500], color:colors.grey[100] } },
  };

  const TicketRow = ({ ticket }) => {
    const sla = slaStatus(ticket);
    return (
      <Card sx={{ mb:2, backgroundColor:colors.primary[400],
        borderLeft:`4px solid ${ticket.breached && ticket.status !== "resolved" ? "#e2726e" : sla.color}` }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                <Typography sx={{ fontSize:"0.75rem", fontFamily:"monospace", color:colors.blueAccent[300] }}>
                  {ticket.ticket_number || `#${ticket.id}`}
                </Typography>
                <Chip label={ticket.priority?.toUpperCase()} size="small"
                  sx={{ backgroundColor:priorityColor(ticket.priority)+"33", color:priorityColor(ticket.priority), fontSize:"0.65rem", height:18 }} />
                <Chip label={ticket.status?.replace(/_/g," ").toUpperCase()} size="small"
                  sx={{ backgroundColor:statusColor(ticket.status, colors)+"33", color:statusColor(ticket.status, colors), fontSize:"0.65rem", height:18 }} />
                {ticket.escalated && <Chip label="ESCALATED" size="small" sx={{ backgroundColor:"#e2726e33", color:"#e2726e", fontSize:"0.65rem", height:18 }} />}
              </Box>
              <Typography sx={{ fontSize:"0.9rem", fontWeight:"bold", color:colors.grey[100] }}>{ticket.subject}</Typography>
              <Box display="flex" gap={2} mt={0.3} flexWrap="wrap">
                <Typography sx={{ fontSize:"0.75rem", color:colors.grey[400] }}>👤 {ticket.client_name}</Typography>
                <Typography sx={{ fontSize:"0.75rem", color:colors.grey[500] }}>
                  ⏱ {ticket.hours_open}h open · SLA target: {ticket.sla_target}h
                </Typography>
              </Box>
              <Box mt={1} mb={0.3}>
                <Box display="flex" justifyContent="space-between" mb={0.3}>
                  <Typography sx={{ fontSize:"0.7rem", color:colors.grey[500] }}>SLA Status: {sla.label}</Typography>
                  <Typography sx={{ fontSize:"0.7rem", color:sla.color }}>
                    {ticket.status === "resolved" ? "Resolved" : `${Math.min(Math.round((ticket.hours_open/ticket.sla_target)*100), 100)}%`}
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={sla.pct}
                  sx={{ height:5, borderRadius:3, backgroundColor:colors.grey[700],
                    "& .MuiLinearProgress-bar":{ backgroundColor:sla.color } }} />
              </Box>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap" alignItems="flex-start">
              <Button size="small" variant="outlined"
                onClick={() => navigate("../ticketing", { state:{ ticket_id:ticket.id } })}
                sx={{ borderColor:colors.blueAccent[500], color:colors.blueAccent[300], fontSize:"0.75rem" }}>
                View Ticket
              </Button>
              {ticket.status !== "resolved" && ticket.status !== "closed" && (
                <>
                  {!ticket.escalated && (
                    <Button size="small" variant="outlined" startIcon={<EscalateIcon />}
                      onClick={() => handleEscalate(ticket.id)}
                      sx={{ borderColor:"#e2726e", color:"#e2726e", fontSize:"0.75rem" }}>
                      Escalate
                    </Button>
                  )}
                  <Button size="small" variant="contained" startIcon={<CheckCircleIcon />}
                    onClick={() => { setResolveDialog({ open:true, ticket }); setResolveNote(""); }}
                    sx={{ backgroundColor:colors.greenAccent[700], fontSize:"0.75rem" }}>
                    Resolve
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Escalation & SLA Tracking</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Monitor ticket response times and SLA compliance</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color:colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="outlined" startIcon={<SupportAgentIcon />}
            onClick={() => navigate("../ticketing")}
            sx={{ borderColor:colors.blueAccent[500], color:colors.blueAccent[300] }}>
            All Tickets
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </Box>

      {breached.length > 0 && (
        <Alert severity="error" sx={{ mb:2 }} icon={<WarningAmberIcon />}>
          <strong>{breached.length} ticket{breached.length > 1 ? "s have" : " has"} breached SLA</strong> — immediate action required
        </Alert>
      )}
      {error && <Alert severity="warning" sx={{ mb:2 }}>API unavailable — showing sample data</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...tabSx, mb:2 }}>
        <Tab label="Breached" icon={<ErrorIcon />} iconPosition="start" />
        <Tab label="At Risk" icon={<WarningAmberIcon />} iconPosition="start" />
        <Tab label="All Tickets" icon={<SupportAgentIcon />} iconPosition="start" />
        <Tab label="Analytics" icon={<AssessmentIcon />} iconPosition="start" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color:colors.blueAccent[500] }} /></Box> : (
        <>
          {tab === 0 && (
            <Box>
              {breached.length === 0
                ? <Alert severity="success">No SLA breaches. All open tickets are within response time targets.</Alert>
                : breached.map(t => <TicketRow key={t.id} ticket={t} />)}
            </Box>
          )}

          {tab === 1 && (
            <Box>
              {atRisk.length === 0
                ? <Alert severity="info">No tickets currently at risk of breaching SLA.</Alert>
                : atRisk.map(t => <TicketRow key={t.id} ticket={t} />)}
            </Box>
          )}

          {tab === 2 && (
            <Box>
              {tickets.length === 0
                ? <Alert severity="info">No tickets found.</Alert>
                : tickets.map(t => <TicketRow key={t.id} ticket={t} />)}
            </Box>
          )}

          {tab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ backgroundColor:colors.primary[400], p:2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>SLA Compliance Overview</Typography>
                  <Box height={260}>
                    <ResponsivePie data={pieData} margin={{ top:20, right:60, bottom:40, left:60 }}
                      innerRadius={0.55} padAngle={2} cornerRadius={3}
                      colors={d => d.data.color}
                      arcLinkLabelsTextColor={colors.grey[300]} arcLabelsTextColor="#fff"
                      theme={nivoTheme}
                      legends={[{ anchor:"bottom", direction:"row", itemWidth:70, itemHeight:18, itemTextColor:colors.grey[400] }]} />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} md={8}>
                <Card sx={{ backgroundColor:colors.primary[400], p:2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>SLA Breach Trend (This Week)</Typography>
                  <Box height={260}>
                    <ResponsiveLine data={trendData}
                      margin={{ top:10, right:20, bottom:40, left:50 }}
                      xScale={{ type:"point" }} yScale={{ type:"linear", min:0, max:"auto" }}
                      curve="monotoneX" colors={["#e2726e"]}
                      pointSize={8} pointColor="#141b2d" pointBorderWidth={2} pointBorderColor={{ from:"serieColor" }}
                      enableArea areaOpacity={0.15} useMesh
                      axisBottom={{ tickSize:5 }} axisLeft={{ tickSize:5, legend:"Breaches", legendOffset:-40, legendPosition:"middle" }}
                      theme={nivoTheme} />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ backgroundColor:colors.primary[400], p:2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Tickets by Category</Typography>
                  <Box height={220}>
                    <ResponsiveBar data={categoryData} keys={["count"]} indexBy="category"
                      margin={{ top:10, right:20, bottom:60, left:50 }}
                      padding={0.3} colors={[colors.blueAccent[500]]}
                      axisBottom={{ tickRotation:-20, tickSize:5 }}
                      axisLeft={{ tickSize:5 }}
                      labelSkipWidth={12} labelTextColor="#fff"
                      theme={nivoTheme} />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ backgroundColor:colors.primary[400], p:2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>SLA Targets by Priority</Typography>
                  <Grid container spacing={2}>
                    {Object.entries(SLA_TARGETS).map(([priority, hours]) => {
                      const count = tickets.filter(t => t.priority === priority).length;
                      const breachedCount = tickets.filter(t => t.priority === priority && t.breached && t.status !== "resolved").length;
                      return (
                        <Grid item xs={6} sm={3} key={priority}>
                          <Box p={2} sx={{ backgroundColor:colors.primary[500], borderRadius:1,
                            borderLeft:`4px solid ${priorityColor(priority)}` }}>
                            <Typography sx={{ fontSize:"0.8rem", textTransform:"capitalize", color:priorityColor(priority), fontWeight:"bold" }}>{priority}</Typography>
                            <Typography sx={{ fontSize:"1.2rem", fontWeight:"bold", color:colors.grey[100] }}>{hours}h target</Typography>
                            <Typography sx={{ fontSize:"0.75rem", color:colors.grey[400] }}>{count} tickets · {breachedCount} breached</Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog.open} onClose={() => setResolveDialog({ open:false, ticket:null })} maxWidth="sm" fullWidth
        PaperProps={{ sx:{ backgroundColor:colors.primary[400] } }}>
        <DialogTitle sx={{ color:colors.grey[100], fontSize:"1.2rem !important" }}>
          Resolve Ticket — {resolveDialog.ticket?.ticket_number}
        </DialogTitle>
        <DialogContent sx={{ pt:2 }}>
          <Typography sx={{ fontSize:"0.9rem", color:colors.grey[300], mb:2 }}>
            {resolveDialog.ticket?.subject}
          </Typography>
          <TextField fullWidth multiline rows={4} label="Resolution Notes *"
            value={resolveNote} onChange={e => setResolveNote(e.target.value)}
            placeholder="Describe how the issue was resolved..."
            sx={{ "& .MuiInputBase-input":{ color:colors.grey[100] }, "& .MuiInputLabel-root":{ color:colors.grey[300] }, "& .MuiOutlinedInput-notchedOutline":{ borderColor:colors.grey[500] } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialog({ open:false, ticket:null })} sx={{ color:colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!resolveNote.trim()} onClick={handleResolve}
            sx={{ backgroundColor:colors.greenAccent[700] }}>Mark Resolved</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open:false }))}
        anchorOrigin={{ vertical:"bottom", horizontal:"center" }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({ ...s, open:false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default EscalationSLATracking;
