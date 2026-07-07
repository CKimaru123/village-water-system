import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Grid,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { useNavigate } from "react-router-dom";
import adminApi from "../../../utils/api";

const MetricCard = ({ label, value, sub, color }) => {
  const colors = useTheme();
  return (
    <Card sx={{ backgroundColor: "#1e2a3a" }}>
      <CardContent>
        <Typography variant="h6" color="#aaa" mb={0.5}>{label}</Typography>
        <Typography variant="h3" fontWeight="bold" color={color || "#fff"}>{value ?? "—"}</Typography>
        {sub && <Typography variant="caption" color="#888">{sub}</Typography>}
      </CardContent>
    </Card>
  );
};

const TransparencyDashboards = () => {
  const colors = tokens(useTheme().palette.mode);
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.get("/admin/transparency/metrics")
      .then(res => setMetrics(res.data?.data?.metrics || res.data?.data || res.data?.metrics || {}))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress sx={{ color: colors.blueAccent[500] }} />
    </Box>
  );

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">Transparency Dashboard</Typography>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">Public accountability metrics</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {metrics && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard label="Total Revenue (KES)" value={metrics.total_revenue?.toLocaleString()} color={colors.greenAccent[400]} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard label="Active Connections" value={metrics.active_connections} color={colors.blueAccent[400]} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard label="Collection Rate" value={metrics.collection_rate ? `${metrics.collection_rate}%` : null} color={colors.greenAccent[300]} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard label="Open Tickets" value={metrics.open_tickets} color={colors.redAccent[400]} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard label="Water Quality Reports" value={metrics.water_quality_reports} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard label="Active Projects" value={metrics.active_projects} color={colors.blueAccent[300]} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard label="Grants Received (KES)" value={metrics.grants_received?.toLocaleString()} color={colors.greenAccent[400]} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard label="Avg Response Time" value={metrics.avg_ticket_response_hours ? `${metrics.avg_ticket_response_hours}h` : null} sub="ticket response" />
          </Grid>
        </Grid>
      )}

      {!metrics && !error && <Alert severity="info">No metrics available yet.</Alert>}
    </Box>
  );
};

export default TransparencyDashboards;
