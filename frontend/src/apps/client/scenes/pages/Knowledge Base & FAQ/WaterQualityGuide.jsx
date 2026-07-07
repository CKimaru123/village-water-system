import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert,
  Chip, Divider, Grid, LinearProgress, Tooltip, IconButton,
} from "@mui/material";
import { tokens } from "../../../theme";
import ScienceIcon from "@mui/icons-material/Science";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../../utils/api";
import useRealTimeUpdates from "../../../../../hooks/useRealTimeUpdates";

// Static water quality parameters for visual display
const QUALITY_PARAMS = [
  { name: "pH Level", value: 7.2, min: 6.5, max: 8.5, unit: "", safe: true },
  { name: "Turbidity", value: 0.8, min: 0, max: 4, unit: "NTU", safe: true },
  { name: "Chlorine Residual", value: 0.5, min: 0.2, max: 1.0, unit: "mg/L", safe: true },
  { name: "Total Dissolved Solids", value: 320, min: 0, max: 500, unit: "mg/L", safe: true },
  { name: "Hardness", value: 180, min: 0, max: 300, unit: "mg/L", safe: true },
  { name: "Nitrates", value: 8, min: 0, max: 10, unit: "mg/L", safe: true },
];

const ParameterBar = ({ param, colors }) => {
  const pct = Math.min(100, ((param.value - param.min) / (param.max - param.min)) * 100);
  const barColor = param.safe ? colors.greenAccent[500] : colors.redAccent[500];

  return (
    <Box mb={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Box display="flex" alignItems="center" gap={0.5}>
          {param.safe
            ? <CheckCircleOutlineIcon sx={{ fontSize: 14, color: colors.greenAccent[500] }} />
            : <WarningAmberIcon sx={{ fontSize: 14, color: colors.redAccent[400] }} />}
          <Typography variant="body2" color={colors.grey[200]}>{param.name}</Typography>
        </Box>
        <Typography variant="body2" color={colors.grey[300]} fontWeight={600}>
          {param.value} {param.unit}
        </Typography>
      </Box>
      <Tooltip title={`Safe range: ${param.min}–${param.max} ${param.unit}`} placement="top">
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 6, borderRadius: 3,
            backgroundColor: colors.grey[700],
            "& .MuiLinearProgress-bar": { backgroundColor: barColor, borderRadius: 3 },
          }}
        />
      </Tooltip>
      <Typography variant="caption" color={colors.grey[600]}>
        Safe range: {param.min}–{param.max} {param.unit}
      </Typography>
    </Box>
  );
};

const WaterQualityGuide = () => {
  const colors = tokens("dark");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/water_quality_reports")
      .then(res => setReports(res?.data?.reports || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useRealTimeUpdates(null, null, null, {
    onNewNotification: useCallback((data) => {
      if (data?.notification?.category === "knowledge_base") load();
    }, [load]),
  });

  if (loading) return (
    <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress sx={{ color: colors.blueAccent[500] }} />
    </Box>
  );

  return (
    <Box m="20px">
      <Box mb="20px">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb="5px">
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">
            Water Quality Guide
          </Typography>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }} title="Refresh">
            <RefreshIcon />
          </IconButton>
        </Box>
        <Typography variant="h6" color={colors.grey[400]}>
          Current water quality parameters and safety reports
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      )}

      {!loading && <Grid container spacing={3}>
        {/* Live Parameters Panel */}
        <Grid item xs={12} md={5}>
          <Card sx={{
            backgroundColor: colors.primary[400],
            border: `1px solid ${colors.greenAccent[700]}`,
            height: "100%",
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <WaterDropIcon sx={{ color: colors.blueAccent[400] }} />
                <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>
                  Current Parameters
                </Typography>
                <Chip label="SAFE" size="small"
                  sx={{ ml: "auto", backgroundColor: colors.greenAccent[700], color: "#fff", fontWeight: 700 }} />
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />
              {QUALITY_PARAMS.map((p, i) => (
                <ParameterBar key={i} param={p} colors={colors} />
              ))}
              <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                <InfoOutlinedIcon sx={{ fontSize: 13, color: colors.grey[500] }} />
                <Typography variant="caption" color={colors.grey[500]}>
                  Parameters updated monthly. All values within WHO guidelines.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reports from backend */}
        <Grid item xs={12} md={7}>
          {reports.length === 0 ? (
            <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.grey[700]}` }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <ScienceIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>
                    Water Safety Information
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />
                <Typography color={colors.grey[300]} sx={{ lineHeight: 1.85 }}>
                  Our water undergoes rigorous testing and treatment to ensure it meets all national and international safety standards. We test for over 80 different parameters including bacteria, chemicals, and physical properties.
                </Typography>
                <Box mt={2} p={2} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                  <Typography variant="body2" color={colors.greenAccent[400]} fontWeight={600} mb={0.5}>
                    Our Commitment
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    We publish monthly water quality reports and notify customers immediately of any issues. Our treatment plant operates 24/7 with automated monitoring systems.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Box>
              {reports.map((report, i) => (
                <Card key={report.id || i} sx={{
                  backgroundColor: colors.primary[400], mb: 2,
                  border: `1px solid ${colors.grey[700]}`,
                  borderLeft: `4px solid ${colors.blueAccent[500]}`,
                }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
                      <ScienceIcon sx={{ color: colors.blueAccent[400], mt: 0.2 }} />
                      <Box flex={1}>
                        <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>
                          {report.title}
                        </Typography>
                        <Box display="flex" gap={1} mt={0.5} flexWrap="wrap" alignItems="center">
                          {report.tags && report.tags.split(",").map((tag, t) => (
                            <Chip key={t} label={tag.trim()} size="small"
                              sx={{ backgroundColor: colors.grey[700], color: colors.grey[300], fontSize: "0.65rem" }} />
                          ))}
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <AccessTimeIcon sx={{ fontSize: 12, color: colors.grey[500] }} />
                            <Typography variant="caption" color={colors.grey[500]}>
                              {report.created_at ? new Date(report.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    {report.content && (
                      <>
                        <Divider sx={{ borderColor: colors.grey[700], my: 1.5 }} />
                        <Typography color={colors.grey[300]} sx={{ lineHeight: 1.85, whiteSpace: "pre-line" }}>
                          {report.content}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Grid>
      </Grid>}
    </Box>
  );
};

export default WaterQualityGuide;
