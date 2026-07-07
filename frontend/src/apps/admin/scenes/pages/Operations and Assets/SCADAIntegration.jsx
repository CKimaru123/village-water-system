import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,
  Chip, IconButton, Tabs, Tab, Divider, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, LinearProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import SensorsIcon from "@mui/icons-material/Sensors";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import SpeedIcon from "@mui/icons-material/Speed";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import OpacityIcon from "@mui/icons-material/Opacity";
import SettingsIcon from "@mui/icons-material/Settings";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import TimelineIcon from "@mui/icons-material/Timeline";
import DashboardIcon from "@mui/icons-material/Dashboard";
import adminApi from "../../../utils/api";

const MOCK_SENSORS = [
  { id:"S001", name:"Kiambu Pump Flow", location:"Kiambu Station A", type:"flow", unit:"m³/hr", value:42.3, min:0, max:80, warning_low:10, warning_high:70, critical_high:78, status:"normal" },
  { id:"S002", name:"Ruiru Borehole Level", location:"Ruiru North", type:"level", unit:"m", value:18.7, min:0, max:30, warning_low:5, warning_high:28, critical_high:29.5, status:"normal" },
  { id:"S003", name:"Thika Plant Chlorine", location:"Thika Treatment Plant", type:"chemical", unit:"mg/L", value:0.8, min:0, max:2, warning_low:0.2, warning_high:1.5, critical_high:1.9, status:"normal" },
  { id:"S004", name:"Kahawa Tank Level", location:"Kahawa Elevated Tank", type:"level", unit:"%", value:73, min:0, max:100, warning_low:15, warning_high:95, critical_high:99, status:"normal" },
  { id:"S005", name:"Githurai Pressure", location:"Githurai 44", type:"pressure", unit:"bar", value:3.1, min:0, max:6, warning_low:1.0, warning_high:5.0, critical_high:5.8, status:"warning" },
  { id:"S006", name:"Zone B Pump Power", location:"Zone B Pump Station", type:"power", unit:"kW", value:12.4, min:0, max:20, warning_low:1, warning_high:18, critical_high:19.5, status:"normal" },
  { id:"S007", name:"Juja Pipeline Pressure", location:"Juja Road Corridor", type:"pressure", unit:"bar", value:5.7, min:0, max:6, warning_low:1.0, warning_high:5.0, critical_high:5.8, status:"critical" },
  { id:"S008", name:"Ruiru Turbidity", location:"Ruiru Treatment", type:"quality", unit:"NTU", value:1.2, min:0, max:10, warning_low:0, warning_high:4, critical_high:8, status:"normal" },
];

const MOCK_ALARMS = [
  { id:1, sensor:"Juja Pipeline Pressure", message:"Pressure exceeded critical threshold (5.7 bar > 5.8 bar)", severity:"critical", time:"2 min ago", acknowledged:false },
  { id:2, sensor:"Githurai Pressure", message:"Pressure above warning level (3.1 bar > 3.0 bar)", severity:"warning", time:"15 min ago", acknowledged:false },
  { id:3, sensor:"Ruiru Borehole Level", message:"Level approaching minimum threshold", severity:"info", time:"1 hr ago", acknowledged:true },
];

const genHistory = (base, max, n=24) =>
  Array.from({ length:n }, (_, i) => ({ x:`${String(i).padStart(2,"0")}:00`, y:parseFloat((base + (Math.random()-0.5)*max*0.12).toFixed(2)) }));

const HISTORY = Object.fromEntries(MOCK_SENSORS.map(s => [s.id, genHistory(s.value, s.max)]));

const sensorIcon = (type) => ({ flow:<WaterDropIcon />, level:<OpacityIcon />, pressure:<SpeedIcon />, chemical:<ThermostatIcon />, power:<ElectricBoltIcon />, quality:<WaterDropIcon /> }[type] || <SensorsIcon />);

const statusMeta = (s) => ({
  normal:   { color:"#4cceac", icon:<CheckCircleIcon sx={{ fontSize:16 }} />, label:"Normal" },
  warning:  { color:"#f0c040", icon:<WarningAmberIcon sx={{ fontSize:16 }} />, label:"Warning" },
  critical: { color:"#e2726e", icon:<ErrorIcon sx={{ fontSize:16 }} />, label:"Critical" },
}[s] || { color:"#666", icon:<SensorsIcon sx={{ fontSize:16 }} />, label:s || "Unknown" });

const SensorGauge = ({ sensor, colors }) => {
  const pct = Math.min(((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100, 100);
  const meta = statusMeta(sensor.status);
  const wPct = ((sensor.warning_high - sensor.min) / (sensor.max - sensor.min)) * 100;
  const cPct = ((sensor.critical_high - sensor.min) / (sensor.max - sensor.min)) * 100;
  const ARC = 173;
  return (
    <Box textAlign="center">
      <svg width="140" height="90" viewBox="0 0 140 90">
        <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="#222" strokeWidth="12" strokeLinecap="round" />
        <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="#4cceac" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${(wPct/100)*ARC} ${ARC}`} opacity="0.35" />
        <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="#f0c040" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${((cPct-wPct)/100)*ARC} ${ARC}`} strokeDashoffset={`${-(wPct/100)*ARC}`} opacity="0.35" />
        <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="#e2726e" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${((100-cPct)/100)*ARC} ${ARC}`} strokeDashoffset={`${-(cPct/100)*ARC}`} opacity="0.35" />
        <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke={meta.color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${(pct/100)*ARC} ${ARC}`} />
        <text x="70" y="68" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">{sensor.value}</text>
        <text x="70" y="80" textAnchor="middle" fill="#888" fontSize="8">{sensor.unit}</text>
      </svg>
    </Box>
  );
};

const SensorCard = ({ sensor, colors, onClick, isSelected }) => {
  const meta = statusMeta(sensor.status);
  const pct = Math.min(((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100, 100);
  return (
    <Card onClick={() => onClick(sensor)} sx={{
      backgroundColor:colors.primary[400], cursor:"pointer",
      border:`2px solid ${isSelected ? meta.color : meta.color + "33"}`,
      transition:"transform 0.15s, box-shadow 0.15s",
      "&:hover":{ transform:"translateY(-2px)", boxShadow:`0 4px 20px ${meta.color}44` },
    }}>
      <CardContent sx={{ p:"14px !important" }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ color:meta.color }}>{sensorIcon(sensor.type)}</Box>
            <Box>
              <Typography sx={{ fontSize:"0.85rem", fontWeight:"bold", color:colors.grey[100] }}>{sensor.name}</Typography>
              <Typography sx={{ fontSize:"0.7rem", color:colors.grey[500] }}>{sensor.location}</Typography>
            </Box>
          </Box>
          <Chip icon={meta.icon} label={meta.label} size="small"
            sx={{ backgroundColor:meta.color+"22", color:meta.color, fontSize:"0.7rem", border:`1px solid ${meta.color}44` }} />
        </Box>
        <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
          <Typography sx={{ fontSize:"1.8rem", fontWeight:"bold", color:meta.color, lineHeight:1 }}>{sensor.value}</Typography>
          <Typography sx={{ fontSize:"0.8rem", color:colors.grey[400] }}>{sensor.unit}</Typography>
        </Box>
        <LinearProgress variant="determinate" value={pct}
          sx={{ height:6, borderRadius:3, backgroundColor:colors.grey[700],
            "& .MuiLinearProgress-bar":{ backgroundColor:meta.color, borderRadius:3 } }} />
        <Box display="flex" justifyContent="space-between" mt={0.3}>
          <Typography sx={{ fontSize:"0.65rem", color:colors.grey[600] }}>{sensor.min}</Typography>
          <Typography sx={{ fontSize:"0.65rem", color:colors.grey[600] }}>{sensor.max} {sensor.unit}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const SCADAIntegration = () => {
  const colors = tokens(useTheme().palette.mode);
  const [sensors, setSensors] = useState(MOCK_SENSORS);
  const [alarms, setAlarms] = useState(MOCK_ALARMS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [liveMode, setLiveMode] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [thresholdDialog, setThresholdDialog] = useState({ open:false, sensor:null });
  const [thresholdForm, setThresholdForm] = useState({});
  const intervalRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.get("/admin/scada/readings")
      .then(res => {
        const d = res.data?.data?.readings || res.data?.readings;
        setSensors(Array.isArray(d) && d.length > 0 ? d : MOCK_SENSORS);
      })
      .catch(() => setSensors(MOCK_SENSORS))
      .finally(() => setLoading(false));
  }, []);

  const simulateLive = useCallback(() => {
    setSensors(prev => prev.map(s => {
      const drift = (Math.random() - 0.5) * s.max * 0.04;
      const nv = parseFloat(Math.max(s.min, Math.min(s.max, s.value + drift)).toFixed(2));
      const ns = nv >= s.critical_high ? "critical" : nv >= s.warning_high || nv <= s.warning_low ? "warning" : "normal";
      return { ...s, value:nv, status:ns };
    }));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (liveMode) { intervalRef.current = setInterval(simulateLive, 3000); }
    else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [liveMode, simulateLive]);

  const acknowledgeAlarm = (id) => setAlarms(prev => prev.map(a => a.id === id ? { ...a, acknowledged:true } : a));

  const filteredSensors = sensors.filter(s =>
    (filterType === "all" || s.type === filterType) &&
    (filterStatus === "all" || s.status === filterStatus)
  );

  const kpis = [
    { label:"Total Sensors", value:sensors.length, color:colors.blueAccent[400] },
    { label:"Normal", value:sensors.filter(s => s.status === "normal").length, color:"#4cceac" },
    { label:"Warning", value:sensors.filter(s => s.status === "warning").length, color:"#f0c040" },
    { label:"Critical", value:sensors.filter(s => s.status === "critical").length, color:"#e2726e" },
    { label:"Active Alarms", value:alarms.filter(a => !a.acknowledged).length, color:"#e2726e" },
  ];

  const sensorTypes = ["all", ...new Set(sensors.map(s => s.type))];

  const trendData = (selectedSensor ? [selectedSensor] : sensors.slice(0,3)).map(s => ({
    id: s.name.split(" ").slice(0,2).join(" "),
    color: statusMeta(s.status).color,
    data: HISTORY[s.id] || genHistory(s.value, s.max),
  }));

  const barData = sensors.map(s => ({ sensor:s.name.split(" ").slice(0,2).join(" "), value:s.value, color:statusMeta(s.status).color }));

  const tabSx = {
    "& .MuiTab-root":{ fontSize:"0.95rem", color:colors.grey[400] },
    "& .Mui-selected":{ color:"#fff !important", backgroundColor:colors.blueAccent[700], borderRadius:"4px 4px 0 0" },
    "& .MuiTabs-indicator":{ backgroundColor:colors.blueAccent[400] },
  };

  const fieldSx = {
    "& .MuiInputBase-input":{ color:colors.grey[100] },
    "& .MuiInputLabel-root":{ color:colors.grey[300] },
    "& .MuiOutlinedInput-notchedOutline":{ borderColor:colors.grey[600] },
  };

  const nivoTheme = {
    axis:{ ticks:{ text:{ fill:colors.grey[400] } }, legend:{ text:{ fill:colors.grey[400] } } },
    grid:{ line:{ stroke:colors.grey[700] } },
    tooltip:{ container:{ background:colors.primary[500], color:colors.grey[100] } },
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">SCADA Integration</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Real-time supervisory control and data acquisition</Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Chip label={liveMode ? "● LIVE" : "⏸ PAUSED"} size="small"
            sx={{ backgroundColor:liveMode ? "#4cceac22" : "#66666622", color:liveMode ? "#4cceac" : "#888",
              border:`1px solid ${liveMode ? "#4cceac55" : "#66666655"}`, fontWeight:"bold" }} />
          <IconButton onClick={() => setLiveMode(v => !v)} sx={{ color:liveMode ? "#4cceac" : colors.grey[500] }}>
            {liveMode ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          <IconButton onClick={load} sx={{ color:colors.blueAccent[400] }}><RefreshIcon /></IconButton>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {kpis.map(k => (
          <Card key={k.label} sx={{ flex:"1 1 120px", minWidth:100, backgroundColor:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p:"12px 16px !important" }}>
              <Typography sx={{ fontSize:"1.6rem", fontWeight:"bold", color:k.color }}>{k.value}</Typography>
              <Typography sx={{ fontSize:"0.75rem", color:"#858585" }}>{k.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {alarms.filter(a => !a.acknowledged).length > 0 && (
        <Alert severity="error" sx={{ mb:2 }} icon={<NotificationsActiveIcon />}>
          <strong>{alarms.filter(a => !a.acknowledged).length} active alarm{alarms.filter(a => !a.acknowledged).length > 1 ? "s" : ""}</strong> — click Alarms tab to review and acknowledge
        </Alert>
      )}
      {error && <Alert severity="warning" sx={{ mb:2 }} onClose={() => setError(null)}>API unavailable — showing simulated sensor data</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...tabSx, mb:2 }}>
        <Tab label="Live Dashboard" icon={<DashboardIcon />} iconPosition="start" />
        <Tab label="Trend Analysis" icon={<TimelineIcon />} iconPosition="start" />
        <Tab label="Alarms" icon={<NotificationsActiveIcon />} iconPosition="start" />
        <Tab label="Configuration" icon={<SettingsIcon />} iconPosition="start" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color:colors.blueAccent[500] }} /></Box> : (
        <>
          {tab === 0 && (
            <Box>
              <Box display="flex" gap={1} mb={2} flexWrap="wrap" alignItems="center">
                <Typography sx={{ fontSize:"0.85rem", color:colors.grey[400] }}>Type:</Typography>
                {sensorTypes.map(t => (
                  <Chip key={t} label={t === "all" ? "All" : t} size="small" clickable onClick={() => setFilterType(t)}
                    sx={{ backgroundColor:filterType===t ? colors.blueAccent[700] : colors.primary[400], color:filterType===t ? "#fff" : colors.grey[300], border:`1px solid ${filterType===t ? colors.blueAccent[500] : colors.grey[700]}` }} />
                ))}
                <Divider orientation="vertical" flexItem sx={{ borderColor:colors.grey[700], mx:0.5 }} />
                <Typography sx={{ fontSize:"0.85rem", color:colors.grey[400] }}>Status:</Typography>
                {["all","normal","warning","critical"].map(s => (
                  <Chip key={s} label={s === "all" ? "All" : s} size="small" clickable onClick={() => setFilterStatus(s)}
                    sx={{ backgroundColor:filterStatus===s ? (statusMeta(s).color||colors.blueAccent[700])+"33" : colors.primary[400],
                      color:filterStatus===s ? (statusMeta(s).color||"#fff") : colors.grey[300],
                      border:`1px solid ${filterStatus===s ? (statusMeta(s).color||colors.blueAccent[500])+"55" : colors.grey[700]}` }} />
                ))}
              </Box>

              <Grid container spacing={2}>
                {filteredSensors.map(s => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={s.id}>
                    <SensorCard sensor={s} colors={colors} onClick={setSelectedSensor} isSelected={selectedSensor?.id === s.id} />
                  </Grid>
                ))}
              </Grid>

              {selectedSensor && (
                <Card sx={{ mt:3, backgroundColor:colors.primary[400], border:`1px solid ${statusMeta(selectedSensor.status).color}55` }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">{selectedSensor.name}</Typography>
                        <Typography sx={{ fontSize:"0.85rem", color:colors.grey[400] }}>{selectedSensor.location} · ID: {selectedSensor.id}</Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Button size="small" variant="outlined" startIcon={<SettingsIcon />}
                          onClick={() => { setThresholdForm({ warning_low:selectedSensor.warning_low, warning_high:selectedSensor.warning_high, critical_high:selectedSensor.critical_high }); setThresholdDialog({ open:true, sensor:selectedSensor }); }}
                          sx={{ borderColor:colors.blueAccent[500], color:colors.blueAccent[300], fontSize:"0.8rem" }}>
                          Thresholds
                        </Button>
                        <IconButton size="small" onClick={() => setSelectedSensor(null)} sx={{ color:colors.grey[500] }}>✕</IconButton>
                      </Box>
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={4} sx={{ textAlign:"center" }}>
                        <SensorGauge sensor={selectedSensor} colors={colors} />
                        <Box display="flex" justifyContent="center" gap={3} mt={1}>
                          {[["Warning",selectedSensor.warning_high,"#f0c040"],["Critical",selectedSensor.critical_high,"#e2726e"]].map(([l,v,c]) => (
                            <Box key={l} textAlign="center">
                              <Typography sx={{ fontSize:"0.65rem", color:colors.grey[500] }}>{l}</Typography>
                              <Typography sx={{ fontSize:"0.85rem", fontWeight:"bold", color:c }}>{v} {selectedSensor.unit}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Typography sx={{ fontSize:"0.85rem", color:colors.grey[400], mb:1 }}>24-Hour Trend</Typography>
                        <Box height={180}>
                          <ResponsiveLine
                            data={[{ id:selectedSensor.name, color:statusMeta(selectedSensor.status).color, data:HISTORY[selectedSensor.id] || genHistory(selectedSensor.value, selectedSensor.max) }]}
                            margin={{ top:10, right:20, bottom:40, left:50 }}
                            xScale={{ type:"point" }} yScale={{ type:"linear", min:selectedSensor.min, max:selectedSensor.max }}
                            curve="monotoneX" colors={[statusMeta(selectedSensor.status).color]}
                            pointSize={4} pointColor="#141b2d" pointBorderWidth={1} pointBorderColor={{ from:"serieColor" }}
                            enableArea areaOpacity={0.1} useMesh
                            axisBottom={{ tickRotation:-30, tickSize:3 }}
                            axisLeft={{ tickSize:3, legend:selectedSensor.unit, legendOffset:-40, legendPosition:"middle" }}
                            theme={nivoTheme} />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {tab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ backgroundColor:colors.primary[400], p:2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Multi-Sensor 24-Hour Trend</Typography>
                  <Box height={350}>
                    <ResponsiveLine data={trendData} margin={{ top:20, right:120, bottom:50, left:60 }}
                      xScale={{ type:"point" }} yScale={{ type:"linear", min:"auto", max:"auto" }}
                      curve="monotoneX" colors={d => d.color}
                      pointSize={5} pointColor="#141b2d" pointBorderWidth={1} pointBorderColor={{ from:"serieColor" }}
                      useMesh enableSlices="x"
                      axisBottom={{ tickRotation:-30, tickSize:3, legend:"Hour", legendOffset:40, legendPosition:"middle" }}
                      axisLeft={{ tickSize:3, legend:"Value", legendOffset:-50, legendPosition:"middle" }}
                      legends={[{ anchor:"bottom-right", direction:"column", itemWidth:120, itemHeight:20, itemTextColor:colors.grey[300] }]}
                      theme={nivoTheme} />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ backgroundColor:colors.primary[400], p:2 }}>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Current Readings Comparison</Typography>
                  <Box height={280}>
                    <ResponsiveBar data={barData} keys={["value"]} indexBy="sensor"
                      margin={{ top:10, right:20, bottom:80, left:60 }}
                      padding={0.3} colors={d => d.data.color}
                      axisBottom={{ tickRotation:-30, tickSize:5 }}
                      axisLeft={{ tickSize:5 }}
                      labelSkipWidth={12} labelSkipHeight={12} labelTextColor="#fff"
                      theme={nivoTheme} />
                  </Box>
                </Card>
              </Grid>
            </Grid>
          )}

          {tab === 2 && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <NotificationsActiveIcon sx={{ color:"#e2726e" }} />
                <Typography variant="h5" color={colors.grey[100]}>Active Alarms & Notifications</Typography>
                <Chip label={`${alarms.filter(a => !a.acknowledged).length} unacknowledged`} size="small"
                  sx={{ backgroundColor:"#e2726e33", color:"#e2726e", border:"1px solid #e2726e55" }} />
              </Box>
              {alarms.map(a => (
                <Card key={a.id} sx={{ mb:2, backgroundColor:colors.primary[400],
                  borderLeft:`4px solid ${a.severity==="critical" ? "#e2726e" : a.severity==="warning" ? "#f0c040" : colors.blueAccent[400]}`,
                  opacity:a.acknowledged ? 0.6 : 1 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Chip label={a.severity.toUpperCase()} size="small"
                            sx={{ backgroundColor:a.severity==="critical" ? "#e2726e33" : a.severity==="warning" ? "#f0c04033" : colors.blueAccent[800],
                              color:a.severity==="critical" ? "#e2726e" : a.severity==="warning" ? "#f0c040" : colors.blueAccent[300], fontSize:"0.7rem" }} />
                          <Typography sx={{ fontSize:"0.9rem", fontWeight:"bold", color:colors.grey[100] }}>{a.sensor}</Typography>
                        </Box>
                        <Typography sx={{ fontSize:"0.85rem", color:colors.grey[300] }}>{a.message}</Typography>
                        <Typography sx={{ fontSize:"0.75rem", color:colors.grey[500], mt:0.3 }}>{a.time}</Typography>
                      </Box>
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip label={a.acknowledged ? "Acknowledged" : "Pending"} size="small"
                          sx={{ backgroundColor:a.acknowledged ? colors.greenAccent[800] : "#f0c04033", color:a.acknowledged ? colors.greenAccent[300] : "#f0c040" }} />
                        {!a.acknowledged && (
                          <Button size="small" variant="outlined" startIcon={<CheckCircleIcon />}
                            onClick={() => acknowledgeAlarm(a.id)}
                            sx={{ borderColor:colors.greenAccent[500], color:colors.greenAccent[400], fontSize:"0.8rem" }}>
                            Acknowledge
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {tab === 3 && (
            <Box>
              <Typography variant="h5" color={colors.grey[100]} mb={2}>Sensor Configuration & Thresholds</Typography>
              <Box sx={{ overflowX:"auto" }}>
                <Box component="table" sx={{ width:"100%", borderCollapse:"collapse" }}>
                  <Box component="thead">
                    <Box component="tr" sx={{ backgroundColor:colors.blueAccent[700] }}>
                      {["ID","Sensor Name","Type","Unit","Warn Low","Warn High","Critical High","Status","Actions"].map(h => (
                        <Box component="th" key={h} sx={{ p:"10px 12px", textAlign:"left", fontSize:"0.8rem", color:"#fff", fontWeight:"bold", borderBottom:`1px solid ${colors.grey[600]}` }}>{h}</Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {sensors.map((s, i) => {
                      const meta = statusMeta(s.status);
                      return (
                        <Box component="tr" key={s.id} sx={{ backgroundColor:i%2===0 ? colors.primary[400] : colors.primary[500] }}>
                          <Box component="td" sx={{ p:"8px 12px", fontSize:"0.8rem", color:colors.blueAccent[300], fontFamily:"monospace" }}>{s.id}</Box>
                          <Box component="td" sx={{ p:"8px 12px", fontSize:"0.85rem", fontWeight:"bold", color:colors.grey[100] }}>{s.name}</Box>
                          <Box component="td" sx={{ p:"8px 12px" }}><Chip label={s.type} size="small" sx={{ backgroundColor:colors.blueAccent[800], color:colors.blueAccent[200], fontSize:"0.7rem" }} /></Box>
                          <Box component="td" sx={{ p:"8px 12px", fontSize:"0.8rem", color:colors.grey[300] }}>{s.unit}</Box>
                          <Box component="td" sx={{ p:"8px 12px", fontSize:"0.8rem", color:"#f0c040" }}>{s.warning_low}</Box>
                          <Box component="td" sx={{ p:"8px 12px", fontSize:"0.8rem", color:"#f0c040" }}>{s.warning_high}</Box>
                          <Box component="td" sx={{ p:"8px 12px", fontSize:"0.8rem", color:"#e2726e" }}>{s.critical_high}</Box>
                          <Box component="td" sx={{ p:"8px 12px" }}><Chip icon={meta.icon} label={meta.label} size="small" sx={{ backgroundColor:meta.color+"22", color:meta.color, fontSize:"0.7rem" }} /></Box>
                          <Box component="td" sx={{ p:"8px 12px" }}>
                            <Button size="small" variant="outlined" startIcon={<SettingsIcon />}
                              onClick={() => { setThresholdForm({ warning_low:s.warning_low, warning_high:s.warning_high, critical_high:s.critical_high }); setThresholdDialog({ open:true, sensor:s }); }}
                              sx={{ borderColor:colors.blueAccent[600], color:colors.blueAccent[300], fontSize:"0.75rem" }}>Edit</Button>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </>
      )}

      <Dialog open={thresholdDialog.open} onClose={() => setThresholdDialog({ open:false, sensor:null })} maxWidth="sm" fullWidth PaperProps={{ sx:{ backgroundColor:colors.primary[400] } }}>
        <DialogTitle sx={{ color:colors.grey[100], fontSize:"1.2rem !important" }}>
          Configure Thresholds — {thresholdDialog.sensor?.name}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Alert severity="info" sx={{ fontSize:"0.85rem" }}>
              Sensor range: {thresholdDialog.sensor?.min} – {thresholdDialog.sensor?.max} {thresholdDialog.sensor?.unit}
            </Alert>
            {[["Warning Low","warning_low","#f0c040"],["Warning High","warning_high","#f0c040"],["Critical High","critical_high","#e2726e"]].map(([label,key,color]) => (
              <TextField key={key} label={label} type="number" value={thresholdForm[key] ?? ""}
                onChange={e => setThresholdForm(f => ({ ...f, [key]:parseFloat(e.target.value) }))}
                fullWidth sx={{ ...fieldSx, "& .MuiInputBase-input":{ color } }}
                InputProps={{ endAdornment:<Typography sx={{ color:colors.grey[500], fontSize:"0.85rem", mr:1 }}>{thresholdDialog.sensor?.unit}</Typography> }} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setThresholdDialog({ open:false, sensor:null })} sx={{ color:colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            setSensors(prev => prev.map(s => s.id === thresholdDialog.sensor?.id ? { ...s, ...thresholdForm } : s));
            setThresholdDialog({ open:false, sensor:null });
          }} sx={{ backgroundColor:colors.blueAccent[700] }}>Save Thresholds</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SCADAIntegration;
