import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress,
  Alert, LinearProgress, Chip, Button,
} from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { tokens } from "../../../theme";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";

const UsageOverview = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/client/usage_overview")
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress sx={{ color: colors.blueAccent[500] }} />
    </Box>
  );

  if (error) return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="20px">Usage Overview</Typography>
      <Alert severity="error">{error}</Alert>
    </Box>
  );

  const stat = (label, value, unit, icon, color) => (
    <Card sx={{ backgroundColor: colors.primary[400] }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          {icon}
          <Typography variant="h6" color={colors.grey[300]}>{label}</Typography>
        </Box>
        <Typography variant="h3" color={color || colors.grey[100]} fontWeight="bold">
          {value} <Typography component="span" variant="h6" color={colors.grey[400]}>{unit}</Typography>
        </Typography>
      </CardContent>
    </Card>
  );

  const trend = data?.trend_vs_last_month;
  const trendUp = trend > 0;

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">Usage Overview</Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Typography variant="h6" color={colors.grey[400]}>Your water consumption summary</Typography>
        <Button variant="outlined" startIcon={<ShowChartIcon />}
          sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
          onClick={() => navigate("../consumption-trends")}>
          View Trends
        </Button>
      </Box>

      {data?.has_leak_alert && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}
          action={<Chip label="View Alerts" size="small" onClick={() => navigate("../leak-alerts")}
            sx={{ cursor: "pointer", backgroundColor: colors.redAccent[500], color: "#fff" }} />}>
          Possible leak detected. Check your leak alerts.
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          {stat("This Month", data?.current_month_m3 ?? "—", "m³",
            <WaterDropIcon sx={{ color: colors.blueAccent[400] }} />, colors.blueAccent[300])}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {stat("Last Month", data?.last_month_m3 ?? "—", "m³",
            <WaterDropIcon sx={{ color: colors.grey[400] }} />)}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {stat("Daily Average", data?.daily_average_m3 ?? "—", "m³/day",
            <WaterDropIcon sx={{ color: colors.greenAccent[400] }} />, colors.greenAccent[400])}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {trendUp
                  ? <TrendingUpIcon sx={{ color: colors.redAccent[400] }} />
                  : <TrendingDownIcon sx={{ color: colors.greenAccent[400] }} />}
                <Typography variant="h6" color={colors.grey[300]}>vs Last Month</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold"
                color={trendUp ? colors.redAccent[400] : colors.greenAccent[400]}>
                {trendUp ? "+" : ""}{trend ?? 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Monthly budget progress */}
      {data?.monthly_budget_m3 > 0 && (
        <Card sx={{ backgroundColor: colors.primary[400], mb: 3 }}>
          <CardContent>
            <Typography variant="h5" color={colors.grey[100]} mb={1}>Monthly Budget</Typography>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography color={colors.grey[300]}>Used: {data.current_month_m3} m³</Typography>
              <Typography color={colors.grey[300]}>Budget: {data.monthly_budget_m3} m³</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min((data.current_month_m3 / data.monthly_budget_m3) * 100, 100)}
              sx={{
                height: 10, borderRadius: 5,
                backgroundColor: colors.grey[700],
                "& .MuiLinearProgress-bar": {
                  backgroundColor: data.current_month_m3 > data.monthly_budget_m3
                    ? colors.redAccent[500] : colors.greenAccent[500],
                },
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Recent readings */}
      {data?.recent_readings?.length > 0 && (
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent>
            <Typography variant="h5" color={colors.grey[100]} mb={2}>Recent Meter Readings</Typography>
            {data.recent_readings.map((r, i) => (
              <Box key={i} display="flex" justifyContent="space-between" py={1}
                borderBottom={i < data.recent_readings.length - 1 ? `1px solid ${colors.grey[700]}` : "none"}>
                <Typography color={colors.grey[300]}>
                  {new Date(r.read_at).toLocaleDateString()}
                </Typography>
                <Typography color={colors.grey[100]} fontWeight="bold">{r.reading_value} m³</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default UsageOverview;
