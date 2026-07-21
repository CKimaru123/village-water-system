import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress,
  Alert, Chip, Table, TableHead, TableRow, TableCell, TableBody,
} from "@mui/material";
import { tokens } from "../../../theme";
import SpeedIcon from "@mui/icons-material/Speed";
import SensorsIcon from "@mui/icons-material/Sensors";
import PersonIcon from "@mui/icons-material/Person";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../../utils/api";

const MeterReadingHistory = () => {
  const colors = tokens("dark");
  const [readings, setReadings] = useState([]);
  const [trend, setTrend]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [liveReading, setLiveReading] = useState(null);
  const wsRef = useRef(null);

  const loadReadings = () => {
    api.get("/client/meter_readings")
      .then(res => {
        const payload = res?.data || {};
        setReadings(Array.isArray(payload?.readings) ? payload.readings : []);
        setTrend(Array.isArray(payload?.monthly_trend) ? payload.monthly_trend : []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReadings(); }, []);

  // WebSocket — push new reading to top of table immediately without full reload
  useEffect(() => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!token) return;
    try {
      // const ws = new WebSocket(`ws://localhost:3001/cable?token=${token}`);
      const cableBaseUrl = process.env.REACT_APP_CABLE_URL || 'ws://localhost:3001/cable';
      const ws = new WebSocket(`${cableBaseUrl}?token=${token}`);
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
            const r = data.reading;
            setLiveReading(r);
            // Prepend the new reading so it appears instantly
            setReadings(prev => {
              const exists = prev.find(x => x.id === r.id);
              if (exists) return prev;
              return [{
                id:            r.id,
                reading_date:  r.reading_date,
                reading_value: r.reading_value,
                consumption:   r.consumption,
                reading_type:  r.reading_type,
                source_label:  r.source_label,
                notes:         r.notes
              }, ...prev];
            });
          }
        } catch (_) {}
      };
      ws.onerror = () => {};
      return () => ws.close();
    } catch (_) {}
  }, []);

  const fmtDate = d => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  if (loading) return (
    <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress sx={{ color: colors.blueAccent[500] }} />
    </Box>
  );

  return (
    <Box m="20px">
      <Box display="flex" alignItems="center" gap={1} mb="20px" flexWrap="wrap" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={1}>
          <SpeedIcon sx={{ color: colors.blueAccent[400], fontSize: 32 }} />
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Meter Reading History</Typography>
        </Box>
        {liveReading && (
          <Chip
            icon={<FiberManualRecordIcon sx={{ color: "#0f0 !important", fontSize: "12px !important", animation: "pulse 1s infinite" }} />}
            label={`Live update: ${liveReading.reading_value} m³ (${liveReading.reading_type})`}
            size="small"
            sx={{ backgroundColor: colors.greenAccent[800], color: colors.grey[100] }}
          />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Monthly trend chart */}
      {trend.length > 0 && (
        <Card sx={{ backgroundColor: colors.primary[400], mb: 3 }}>
          <CardContent>
            <Typography variant="h5" color={colors.grey[100]} mb={2}>Monthly Consumption Trend (m³)</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grey[700]} />
                <XAxis dataKey="month" tick={{ fill: colors.grey[400], fontSize: 12 }} />
                <YAxis tick={{ fill: colors.grey[400], fontSize: 12 }} unit=" m³" />
                <Tooltip
                  contentStyle={{ backgroundColor: colors.primary[500], border: "none", color: colors.grey[100] }}
                  formatter={v => [`${v} m³`, "Consumption"]}
                />
                <Line type="monotone" dataKey="consumption_m3" stroke={colors.blueAccent[400]}
                  strokeWidth={2.5} dot={{ fill: colors.blueAccent[400] }} name="Consumption (m³)" />
              </LineChart>
            </ResponsiveContainer>
            <Typography variant="caption" color={colors.grey[500]}>
              Chart reflects actual readings recorded. Use Consumption Trends for hourly/daily breakdowns.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Readings table */}
      <Card sx={{ backgroundColor: colors.primary[400] }}>
        <CardContent>
          <Typography variant="h5" color={colors.grey[100]} mb={2}>All Readings (last 12 months)</Typography>
          {readings.length === 0 ? (
            <Alert severity="info">No meter readings found. Readings appear here when recorded by the admin or via smart meter.</Alert>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Date", "Reading (m³)", "Consumption (m³)", "Source", "Notes"].map(h => (
                      <TableCell key={h} sx={{ color: colors.grey[300], fontWeight: "bold", borderBottom: `1px solid ${colors.grey[700]}` }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {readings.map((r, i) => {
                    const isNew = liveReading?.id === r.id;
                    return (
                      <TableRow key={r.id || i}
                        sx={{ backgroundColor: isNew ? `${colors.greenAccent[900]}55` : "transparent",
                          transition: "background-color 1s" }}>
                        <TableCell sx={{ color: colors.grey[100], borderBottom: `1px solid ${colors.grey[800]}` }}>
                          {fmtDate(r.reading_date)}
                        </TableCell>
                        <TableCell sx={{ color: colors.grey[100], borderBottom: `1px solid ${colors.grey[800]}`, fontWeight: "bold" }}>
                          {Number(r.reading_value || 0).toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ color: r.consumption > 0 ? colors.blueAccent[300] : colors.grey[500],
                          borderBottom: `1px solid ${colors.grey[800]}` }}>
                          {r.consumption != null ? `${Number(r.consumption).toFixed(3)}` : "—"}
                        </TableCell>
                        <TableCell sx={{ borderBottom: `1px solid ${colors.grey[800]}` }}>
                          <Chip
                            icon={r.reading_type === "automatic" ? <SensorsIcon sx={{ fontSize: "14px !important" }} /> : <PersonIcon sx={{ fontSize: "14px !important" }} />}
                            label={r.source_label || (r.reading_type === "automatic" ? "Smart Meter" : "Manual")}
                            size="small"
                            sx={{
                              backgroundColor: r.reading_type === "automatic" ? colors.greenAccent[800] : colors.blueAccent[800],
                              color: colors.grey[100], fontSize: "0.68rem"
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: colors.grey[400], fontSize: "0.78rem", borderBottom: `1px solid ${colors.grey[800]}` }}>
                          {r.notes || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MeterReadingHistory;
