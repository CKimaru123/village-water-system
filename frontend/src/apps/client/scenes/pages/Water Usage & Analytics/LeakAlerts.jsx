import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert,
  Chip, Button, Divider,
} from "@mui/material";
import { tokens } from "../../../theme";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";

const severityColor = (severity, colors) => {
  if (severity === "high") return colors.redAccent[400];
  if (severity === "medium") return colors.yellowAccent?.[400] || "#f0c040";
  return colors.blueAccent[400];
};

const LeakAlerts = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/client/leak_alerts")
      .then(res => setAlerts(res.data?.alerts || []))
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
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">Leak Alerts</Typography>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">Anomalies detected in your water usage</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!error && alerts.length === 0 && (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          No leak alerts detected. Your usage looks normal.
        </Alert>
      )}

      {alerts.map((alert, i) => (
        <Card key={i} sx={{ backgroundColor: colors.primary[400], mb: 2,
          borderLeft: `4px solid ${severityColor(alert.severity, colors)}` }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <ReportProblemIcon sx={{ color: severityColor(alert.severity, colors) }} />
                <Typography variant="h5" color={colors.grey[100]}>{alert.title || "Unusual Usage Detected"}</Typography>
              </Box>
              <Chip
                label={alert.severity?.toUpperCase() || "ALERT"}
                size="small"
                sx={{ backgroundColor: severityColor(alert.severity, colors), color: "#fff" }}
              />
            </Box>
            <Typography color={colors.grey[300]} mb={1}>{alert.description}</Typography>
            <Divider sx={{ borderColor: colors.grey[700], my: 1 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color={colors.grey[400]}>
                Detected: {alert.detected_at ? new Date(alert.detected_at).toLocaleString() : "—"}
              </Typography>
              {alert.status === "open" && (
                <Button size="small" variant="outlined"
                  sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
                  onClick={() => navigate("../report-issue", { state: { prefill: `Leak alert: ${alert.title}` } })}>
                  Report Issue
                </Button>
              )}
              {alert.status === "resolved" && (
                <Chip label="Resolved" size="small" icon={<CheckCircleIcon />}
                  sx={{ backgroundColor: colors.greenAccent[700], color: "#fff" }} />
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default LeakAlerts;
