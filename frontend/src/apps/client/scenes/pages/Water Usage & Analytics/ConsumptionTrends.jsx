import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Typography, Card, CardContent, Grid, ToggleButton,
  ToggleButtonGroup, Chip, CircularProgress, Alert, Tooltip,
} from "@mui/material";
import { tokens } from "../../../theme";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import SensorsIcon from "@mui/icons-material/Sensors";
import api from "../../../utils/api";

const PERIODS = [
  { value: "hourly",      label: "Hourly" },
  { value: "daily",       label: "Daily" },
  { value: "weekly",      label: "Weekly" },
  { value: "monthly",     label: "Monthly" },
  { value: "quarterly",   label: "Quarterly" },
  { value: "semi_annual", label: "Semi-Annual" },
  { value: "annual",      label: "Annual" },
];

const StatCard = ({ label, value, sub, color, colors }) => (
  <Card sx={{ backgroundColor: colors.primary[400], height: "100%" }}>
    <CardContent sx={{ textAlign: "center", py: 2 }}>
      <Typography variant="h3" color={color} fontWeight="bold">{value}</Typography>
      <Typography variant="body2" color={colors.grey[300]}>{label}</Typography>
      {sub && <Typography variant="caption" color={colors.grey[500]}>{sub}</Typography>}
    </CardContent>
  </Card>
);

const ConsumptionTrends = () => {
  const colors = tokens("dark");
  const [period, setPeriod]       = useState("monthly");
  const [trends, setTrends]       = useState([]);
  const [zones, setZones]         = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [liveReading, setLiveReading] = useState(null);
  const [error, setError]         = useState(null);
  const wsRef = useRef(null);

  const fetchTrends = useCallback((p) => {
    setLoading(true);
    setError(null);
    api.get(`/client/consumption_trends?period=${p}`)
      .then(res => {
        const payload = res?.data || res || {};
        setTrends(Array.isArray(payload.trends) ? payload.trends : []);
        setZones(Array.isArray(payload.zone_breakdown) ? payload.zone_breakdown : []);
        setStats(payload.stats || null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTrends(period); }, [period, fetchTrends]);

  // WebSocket — listen for new readings and refresh trends automatically
  useEffect(() => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!token) return;

    try {
      const cableBaseUrl = process.env.REACT_APP_CABLE_URL || 'ws://localhost:3001/cable';
      const ws = new WebSocket(`${cableBaseUrl}?token=${token}`);
      // const ws = new WebSocket(`ws://localhost:3001/cable?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ command: "subscribe", identifier: JSON.stringify({ channel: "MeterReadingsChannel" }) }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "ping" || msg.type === "welcome" || msg.type === "confirm_subscription") return;
          const data = msg.message;
          if (data?.event === "new_reading") {
            setLiveReading(data.reading);
            // Debounce: wait 2 s then refresh so we don't spam the API
            clearTimeout(ws._refreshTimer);
            ws._refreshTimer = setTimeout(() => fetchTrends(period), 2000);
          }
        } catch (_) {}
      };

      ws.onerror = () => {}; // silent — fallback to polling is fine
      return () => { clearTimeout(ws._refreshTimer); ws.close(); };
    } catch (_) {}
  }, [period, fetchTrends]);

  const tooltipStyle = {
    contentStyle: { backgroundColor: colors.primary[500], border: "none", borderRadius: 8, color: colors.grey[100] },
  };

  const xKey = "label";
  const fmt  = v => `${v} m³`;

  const avg  = stats?.average ?? 0;
  const maxP = stats?.max;
  const minP = stats?.min;
  const total = stats?.total ?? 0;

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <WaterDropIcon sx={{ color: colors.blueAccent[400], fontSize: 32 }} />
            <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Consumption Trends</Typography>
          </Box>
          <Typography variant="body2" color={colors.grey[400]} mt={0.5}>Real-time water usage patterns and analytics</Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          {liveReading && (
            <Chip icon={<SensorsIcon />} label={`Live: ${liveReading.reading_value} m³`}
              size="small" sx={{ backgroundColor: colors.greenAccent[700], color: "#fff", animation: "pulse 1.5s infinite" }} />
          )}
          <ToggleButtonGroup value={period} exclusive onChange={(_, v) => v && setPeriod(v)} size="small">
            {PERIODS.map(p => (
              <ToggleButton key={p.value} value={p.value}
                sx={{ color: colors.grey[300], fontSize: "0.75rem", py: 0.5, px: 1.5,
                  "&.Mui-selected": { backgroundColor: colors.blueAccent[700], color: "#fff" } }}>
                {p.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats row */}
      {!loading && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <StatCard label="Total Consumption" value={`${total} m³`} color={colors.blueAccent[400]} colors={colors} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Period Average" value={`${avg} m³`} color={colors.greenAccent[400]} colors={colors} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Peak Period" value={maxP ? `${maxP.consumption_m3} m³` : "—"}
              sub={maxP?.label} color={colors.redAccent[400]} colors={colors} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Lowest Period" value={minP ? `${minP.consumption_m3} m³` : "—"}
              sub={minP?.label} color={colors.greenAccent[600]} colors={colors} />
          </Grid>
        </Grid>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Main consumption chart */}
          <Grid item xs={12} md={8}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} mb={2}>
                  {PERIODS.find(p => p.value === period)?.label} Consumption (m³)
                </Typography>
                {trends.length === 0 ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                    <Typography color={colors.grey[400]}>No reading data available for this period.</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    {period === "monthly" || period === "semi_annual" || period === "annual" ? (
                      <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grey[700]} />
                        <XAxis dataKey={xKey} tick={{ fill: colors.grey[400], fontSize: 11 }} />
                        <YAxis tick={{ fill: colors.grey[400], fontSize: 11 }} tickFormatter={fmt} />
                        <RechartsTooltip {...tooltipStyle} formatter={v => [`${v} m³`, "Consumption"]} />
                        <Legend />
                        <Line type="monotone" dataKey="consumption_m3" stroke={colors.blueAccent[400]}
                          strokeWidth={2.5} dot={{ fill: colors.blueAccent[400], r: 4 }} name="Consumption (m³)" />
                      </LineChart>
                    ) : (
                      <BarChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grey[700]} />
                        <XAxis dataKey={xKey} tick={{ fill: colors.grey[400], fontSize: 11 }} />
                        <YAxis tick={{ fill: colors.grey[400], fontSize: 11 }} tickFormatter={fmt} />
                        <RechartsTooltip {...tooltipStyle} formatter={v => [`${v} m³`, "Consumption"]} />
                        <Bar dataKey="consumption_m3" fill={colors.blueAccent[500]} name="Consumption (m³)"
                          radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Zone breakdown pie */}
          <Grid item xs={12} md={4}>
            <Card sx={{ backgroundColor: colors.primary[400], height: "100%" }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} mb={2}>Usage Zone Breakdown</Typography>
                {zones.length === 0 ? (
                  <Typography color={colors.grey[500]} variant="body2">No zone data configured.</Typography>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={zones} cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                          paddingAngle={4} dataKey="value">
                          {zones.map((z, i) => <Cell key={i} fill={z.color} />)}
                        </Pie>
                        <RechartsTooltip {...tooltipStyle} formatter={v => [`${v}%`, "Share"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                      {zones.map((z, i) => (
                        <Chip key={i} label={`${z.name} ${z.value}%`} size="small"
                          sx={{ backgroundColor: z.color + "cc", color: "#fff", fontSize: "0.68rem" }} />
                      ))}
                    </Box>
                    <Typography variant="caption" color={colors.grey[500]} mt={1} display="block">
                      Zone distribution is estimated. Contact admin to configure per-zone sub-meters.
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Data table */}
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} mb={2}>Detailed Data</Typography>
                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Period", "Consumption (m³)", "Readings", "vs Previous"].map(h => (
                          <th key={h} style={{ color: colors.grey[300], textAlign: "left", padding: "8px 12px",
                            borderBottom: `1px solid ${colors.grey[700]}`, fontSize: "0.82rem" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trends.map((t, i) => {
                        const prev = trends[i - 1];
                        const diff = prev != null ? +(t.consumption_m3 - prev.consumption_m3).toFixed(3) : null;
                        return (
                          <tr key={i}>
                            <td style={{ color: colors.grey[100], padding: "8px 12px", borderBottom: `1px solid ${colors.grey[800]}` }}>{t.label}</td>
                            <td style={{ color: colors.grey[100], padding: "8px 12px", borderBottom: `1px solid ${colors.grey[800]}`, textAlign: "right" }}>{t.consumption_m3}</td>
                            <td style={{ color: colors.grey[400], padding: "8px 12px", borderBottom: `1px solid ${colors.grey[800]}`, textAlign: "right" }}>{t.readings_count ?? "—"}</td>
                            <td style={{
                              color: diff === null ? colors.grey[500] : diff > 0 ? colors.redAccent[400] : colors.greenAccent[400],
                              padding: "8px 12px", borderBottom: `1px solid ${colors.grey[800]}`, textAlign: "right"
                            }}>
                              {diff === null ? "—" : (
                                <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                                  {diff > 0 ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
                                  {diff > 0 ? "+" : ""}{diff} m³
                                </Box>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Insights card */}
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} mb={2}>💡 Insights</Typography>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {maxP && (
                    <Box>
                      <Typography variant="body2" color={colors.redAccent[400]}>Peak usage: {maxP.label}</Typography>
                      <Typography variant="body2" color={colors.grey[400]}>
                        Your highest consumption was {maxP.consumption_m3} m³. Check for leaks or unusual activity in that period.
                      </Typography>
                    </Box>
                  )}
                  {avg > 0 && (
                    <Box>
                      <Typography variant="body2" color={colors.blueAccent[400]}>📊 Usage pattern</Typography>
                      <Typography variant="body2" color={colors.grey[400]}>
                        Your {PERIODS.find(p => p.value === period)?.label.toLowerCase()} average is {avg} m³.
                        {avg > 15 ? " Consider water conservation measures." : " Good usage — keep it up."}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="body2" color={colors.greenAccent[400]}>💧 Saving tip</Typography>
                    <Typography variant="body2" color={colors.grey[400]}>
                      Fix leaking taps (can waste 15+ litres/day), use full loads for laundry, and consider rainwater harvesting.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ConsumptionTrends;
