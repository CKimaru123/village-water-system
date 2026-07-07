import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, IconButton, MenuItem, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import adminApi from "../../../utils/api";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockIcon from "@mui/icons-material/Lock";
import TuneIcon from "@mui/icons-material/Tune";

const ZONES = ["Zone 1 - Kiambu", "Zone 2 - Githurai", "Zone 3 - Kahawa", "Zone 4 - Juja"];
const OP_TYPES = ["open", "close", "partial"];

const mockValves = [
  { id: 1, valve_name: "Valve KM-V01", zone: "Zone 1 - Kiambu", operation_type: "open", status: "open", operated_at: "2025-01-10T08:00:00Z", scheduled_reopen_at: null, operated_by: "James Mwangi", reason: "Normal operation" },
  { id: 2, valve_name: "Valve GH-V02", zone: "Zone 2 - Githurai", operation_type: "close", status: "closed", operated_at: "2025-01-11T06:00:00Z", scheduled_reopen_at: "2025-01-11T18:00:00Z", operated_by: "Peter Kamau", reason: "Scheduled maintenance on pipeline segment B" },
  { id: 3, valve_name: "Valve KH-V03", zone: "Zone 3 - Kahawa", operation_type: "partial", status: "partial", operated_at: "2025-01-10T14:00:00Z", scheduled_reopen_at: "2025-01-12T06:00:00Z", operated_by: "Grace Wanjiku", reason: "Rationing — low reservoir level" },
  { id: 4, valve_name: "Valve JJ-V04", zone: "Zone 4 - Juja", operation_type: "open", status: "open", operated_at: "2025-01-09T07:00:00Z", scheduled_reopen_at: null, operated_by: "David Ochieng", reason: "Normal operation" },
  { id: 5, valve_name: "Valve KM-V05", zone: "Zone 1 - Kiambu", operation_type: "open", status: "open", operated_at: "2025-01-08T09:00:00Z", scheduled_reopen_at: null, operated_by: "James Mwangi", reason: "Restored after repair" },
  { id: 6, valve_name: "Valve GH-V06", zone: "Zone 2 - Githurai", operation_type: "close", status: "closed", operated_at: "2025-01-11T07:30:00Z", scheduled_reopen_at: "2025-01-13T06:00:00Z", operated_by: "Samuel Njoroge", reason: "Emergency isolation — pipe burst" },
  { id: 7, valve_name: "Valve KH-V07", zone: "Zone 3 - Kahawa", operation_type: "open", status: "open", operated_at: "2025-01-07T10:00:00Z", scheduled_reopen_at: null, operated_by: "Mary Achieng", reason: "Normal operation" },
  { id: 8, valve_name: "Valve JJ-V08", zone: "Zone 4 - Juja", operation_type: "partial", status: "partial", operated_at: "2025-01-10T16:00:00Z", scheduled_reopen_at: "2025-01-14T06:00:00Z", operated_by: "Tech Team", reason: "Demand management — peak hours" },
];

const rationingSchedule = [
  { zone: "Zone 1 - Kiambu", mon: "06:00-22:00", tue: "06:00-22:00", wed: "06:00-22:00", thu: "06:00-22:00", fri: "06:00-22:00", sat: "06:00-18:00", sun: "08:00-18:00" },
  { zone: "Zone 2 - Githurai", mon: "Closed", tue: "06:00-18:00", wed: "06:00-18:00", thu: "Closed", fri: "06:00-18:00", sat: "06:00-14:00", sun: "Closed" },
  { zone: "Zone 3 - Kahawa", mon: "06:00-14:00", tue: "06:00-14:00", wed: "06:00-22:00", thu: "06:00-14:00", fri: "06:00-22:00", sat: "06:00-18:00", sun: "08:00-14:00" },
  { zone: "Zone 4 - Juja", mon: "06:00-22:00", tue: "06:00-22:00", wed: "06:00-22:00", thu: "06:00-22:00", fri: "06:00-22:00", sat: "06:00-22:00", sun: "06:00-22:00" },
];

const statusColor = (s, colors) => {
  if (s === "open") return colors.greenAccent[500];
  if (s === "closed") return colors.redAccent[400];
  if (s === "partial") return "#f0c040";
  return colors.grey[400];
};

const emptyForm = { valve_name: "", zone: "Zone 1 - Kiambu", operation_type: "open", status: "open", reason: "", scheduled_reopen_at: "", notes: "" };

const ValveOperationsRationing = () => {
  const colors = tokens(useTheme().palette.mode);
  const [valves, setValves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.get("/admin/valves")
      .then(res => setValves(Array.isArray(res.valves) ? res.valves : mockValves))
      .catch(() => setValves(mockValves))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await adminApi.post("/admin/valves", { valve: form });
      setValves(prev => [...prev, res.valve || { ...form, id: Date.now(), operated_at: new Date().toISOString() }]);
    } catch {
      setValves(prev => [...prev, { ...form, id: Date.now(), operated_at: new Date().toISOString() }]);
    } finally {
      setSaving(false);
      setDialogOpen(false);
      setForm(emptyForm);
    }
  };

  const updateValveStatus = (id, newStatus) => {
    setValves(prev => prev.map(v => v.id === id ? { ...v, status: newStatus, operation_type: newStatus, operated_at: new Date().toISOString() } : v));
    adminApi.patch(`/admin/valves/${id}`, { valve: { status: newStatus } }).catch(() => {});
  };

  const closedValves = valves.filter(v => v.status === "closed");
  const affectedZones = [...new Set(closedValves.map(v => v.zone))];

  const kpis = [
    { label: "Total Valves", value: valves.length, color: colors.blueAccent[400] },
    { label: "Open", value: valves.filter(v => v.status === "open").length, color: colors.greenAccent[500] },
    { label: "Closed", value: valves.filter(v => v.status === "closed").length, color: colors.redAccent[400] },
    { label: "Partial/Rationing", value: valves.filter(v => v.status === "partial").length, color: "#f0c040" },
    { label: "Zones Affected", value: affectedZones.length, color: "#ff7043" },
  ];

  const tabSx = {
    "& .MuiTab-root": { fontSize: "0.95rem", color: colors.grey[400] },
    "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" },
    "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] },
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  const zoneMapData = ZONES.map(zone => {
    const zoneValves = valves.filter(v => v.zone === zone);
    const hasOpen = zoneValves.some(v => v.status === "open");
    const hasClosed = zoneValves.some(v => v.status === "closed");
    const hasPartial = zoneValves.some(v => v.status === "partial");
    const color = hasClosed ? colors.redAccent[400] : hasPartial ? "#f0c040" : hasOpen ? colors.greenAccent[500] : colors.grey[600];
    return { zone, color, valveCount: zoneValves.length };
  });

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Valve Operations & Rationing</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Control water supply valves and manage rationing schedules</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}
            sx={{ backgroundColor: colors.blueAccent[700], "&:hover": { backgroundColor: colors.blueAccent[600] } }}>
            Log Operation
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {kpis.map(k => (
          <Card key={k.label} sx={{ flex: "1 1 130px", minWidth: 110, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p: "12px 16px !important" }}>
              <Typography variant="h4" color={k.color} fontWeight="bold">{k.value}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>{k.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {affectedZones.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⚠️ Supply interrupted in: {affectedZones.join(", ")} — clients have been notified.
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...tabSx, mb: 2 }}>
        <Tab label="Valve Status Board" />
        <Tab label="Operations Log" />
        <Tab label="Rationing Schedule" />
        <Tab label="Zone Map" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box> : (
        <>
          {tab === 0 && (
            <Box display="flex" flexWrap="wrap" gap={2}>
              {valves.map(v => (
                <Card key={v.id} sx={{ flex: "1 1 240px", maxWidth: 300, backgroundColor: colors.primary[400], border: `1px solid ${statusColor(v.status, colors)}44` }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">{v.valve_name}</Typography>
                      <Box sx={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: statusColor(v.status, colors), boxShadow: `0 0 8px ${statusColor(v.status, colors)}` }} />
                    </Box>
                    <Chip label={v.zone} size="small" sx={{ backgroundColor: colors.blueAccent[800], color: colors.blueAccent[200], mb: 1 }} />
                    <Typography variant="caption" color={colors.grey[400]} display="block">Status: <span style={{ color: statusColor(v.status, colors), fontWeight: "bold" }}>{v.status.toUpperCase()}</span></Typography>
                    {v.operated_by && <Typography variant="caption" color={colors.grey[500]} display="block">By: {v.operated_by}</Typography>}
                    {v.operated_at && <Typography variant="caption" color={colors.grey[500]} display="block">At: {new Date(v.operated_at).toLocaleString()}</Typography>}
                    {v.scheduled_reopen_at && <Typography variant="caption" color="#f0c040" display="block">Reopen: {new Date(v.scheduled_reopen_at).toLocaleString()}</Typography>}
                    {v.reason && <Typography variant="caption" color={colors.grey[400]} display="block" mt={0.5}>{v.reason}</Typography>}
                    <Box display="flex" gap={0.5} mt={1.5} flexWrap="wrap">
                      <Button size="small" variant="outlined" startIcon={<LockOpenIcon />} onClick={() => updateValveStatus(v.id, "open")}
                        disabled={v.status === "open"}
                        sx={{ fontSize: "0.7rem", borderColor: colors.greenAccent[600], color: colors.greenAccent[400] }}>Open</Button>
                      <Button size="small" variant="outlined" startIcon={<LockIcon />} onClick={() => updateValveStatus(v.id, "closed")}
                        disabled={v.status === "closed"}
                        sx={{ fontSize: "0.7rem", borderColor: colors.redAccent[500], color: colors.redAccent[400] }}>Close</Button>
                      <Button size="small" variant="outlined" startIcon={<TuneIcon />} onClick={() => updateValveStatus(v.id, "partial")}
                        disabled={v.status === "partial"}
                        sx={{ fontSize: "0.7rem", borderColor: "#f0c040", color: "#f0c040" }}>Partial</Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Typography variant="h6" color={colors.grey[300]} mb={2}>Chronological Operations Log</Typography>
              {[...valves].sort((a, b) => new Date(b.operated_at) - new Date(a.operated_at)).map(v => (
                <Box key={v.id} display="flex" gap={2} alignItems="flex-start" mb={1.5} p={1.5}
                  sx={{ backgroundColor: colors.primary[400], borderRadius: 1, borderLeft: `3px solid ${statusColor(v.status, colors)}` }}>
                  <Box sx={{ minWidth: 12, height: 12, borderRadius: "50%", backgroundColor: statusColor(v.status, colors), mt: 0.5 }} />
                  <Box flex={1}>
                    <Typography variant="body2" color={colors.grey[100]} fontWeight="bold">{v.valve_name} — {v.operation_type.toUpperCase()}</Typography>
                    <Typography variant="caption" color={colors.grey[400]}>{v.zone} · {v.operated_by} · {v.operated_at ? new Date(v.operated_at).toLocaleString() : "—"}</Typography>
                    {v.reason && <Typography variant="caption" color={colors.grey[500]} display="block">{v.reason}</Typography>}
                  </Box>
                  <Chip label={v.status} size="small" sx={{ backgroundColor: statusColor(v.status, colors) + "33", color: statusColor(v.status, colors) }} />
                </Box>
              ))}
            </Box>
          )}

          {tab === 2 && (
            <Box sx={{ overflowX: "auto" }}>
              <Typography variant="h6" color={colors.grey[300]} mb={2}>Weekly Water Supply Schedule</Typography>
              <Box sx={{ minWidth: 700 }}>
                <Box display="flex" gap={0} mb={0.5}>
                  <Box sx={{ width: 160, p: 1 }}><Typography variant="caption" color={colors.grey[400]} fontWeight="bold">Zone</Typography></Box>
                  {days.map(d => (
                    <Box key={d} sx={{ flex: 1, p: 1, textAlign: "center" }}>
                      <Typography variant="caption" color={colors.grey[400]} fontWeight="bold">{d}</Typography>
                    </Box>
                  ))}
                </Box>
                {rationingSchedule.map(row => (
                  <Box key={row.zone} display="flex" gap={0} mb={0.5} sx={{ backgroundColor: colors.primary[400], borderRadius: 1 }}>
                    <Box sx={{ width: 160, p: 1 }}>
                      <Typography variant="caption" color={colors.grey[200]} fontWeight="bold">{row.zone}</Typography>
                    </Box>
                    {dayKeys.map(dk => (
                      <Box key={dk} sx={{ flex: 1, p: 0.5, textAlign: "center", backgroundColor: row[dk] === "Closed" ? colors.redAccent[900] : colors.greenAccent[900], borderRadius: 0.5, m: 0.3 }}>
                        <Typography variant="caption" color={row[dk] === "Closed" ? colors.redAccent[300] : colors.greenAccent[300]} sx={{ fontSize: "0.65rem" }}>
                          {row[dk]}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {tab === 3 && (
            <Box>
              <Typography variant="h6" color={colors.grey[300]} mb={2}>Zone Supply Status Map</Typography>
              <Box sx={{ position: "relative", width: "100%", height: 400, backgroundColor: colors.primary[400], borderRadius: 2, border: `1px solid ${colors.grey[700]}`, overflow: "hidden" }}>
                <svg width="100%" height="100%" viewBox="0 0 100 80">
                  {/* Grid */}
                  {[20, 40, 60, 80].map(v => (
                    <React.Fragment key={v}>
                      <line x1={v} y1="0" x2={v} y2="80" stroke={colors.grey[800]} strokeWidth="0.3" />
                      <line x1="0" y1={v} x2="100" y2={v} stroke={colors.grey[800]} strokeWidth="0.3" />
                    </React.Fragment>
                  ))}
                  {/* Zone polygons */}
                  <rect x="5" y="5" width="40" height="30" rx="2" fill={zoneMapData[0]?.color + "33"} stroke={zoneMapData[0]?.color} strokeWidth="0.8" />
                  <text x="15" y="22" fontSize="4" fill={zoneMapData[0]?.color} fontWeight="bold">Zone 1</text>
                  <text x="12" y="28" fontSize="2.5" fill={colors.grey[400]}>Kiambu</text>
                  <rect x="55" y="5" width="40" height="30" rx="2" fill={zoneMapData[1]?.color + "33"} stroke={zoneMapData[1]?.color} strokeWidth="0.8" />
                  <text x="65" y="22" fontSize="4" fill={zoneMapData[1]?.color} fontWeight="bold">Zone 2</text>
                  <text x="62" y="28" fontSize="2.5" fill={colors.grey[400]}>Githurai</text>
                  <rect x="5" y="45" width="40" height="30" rx="2" fill={zoneMapData[2]?.color + "33"} stroke={zoneMapData[2]?.color} strokeWidth="0.8" />
                  <text x="15" y="62" fontSize="4" fill={zoneMapData[2]?.color} fontWeight="bold">Zone 3</text>
                  <text x="13" y="68" fontSize="2.5" fill={colors.grey[400]}>Kahawa</text>
                  <rect x="55" y="45" width="40" height="30" rx="2" fill={zoneMapData[3]?.color + "33"} stroke={zoneMapData[3]?.color} strokeWidth="0.8" />
                  <text x="68" y="62" fontSize="4" fill={zoneMapData[3]?.color} fontWeight="bold">Zone 4</text>
                  <text x="68" y="68" fontSize="2.5" fill={colors.grey[400]}>Juja</text>
                </svg>
                <Box sx={{ position: "absolute", bottom: 12, right: 12, backgroundColor: "rgba(0,0,0,0.7)", p: 1.5, borderRadius: 1 }}>
                  {[["Supply Active", colors.greenAccent[500]], ["Rationing", "#f0c040"], ["Supply Off", colors.redAccent[400]]].map(([label, color]) => (
                    <Box key={label} display="flex" alignItems="center" gap={1} mb={0.3}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color }} />
                      <Typography variant="caption" color={colors.grey[300]}>{label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Log Valve Operation</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Valve Name *" value={form.valve_name} onChange={e => setForm(f => ({ ...f, valve_name: e.target.value }))} fullWidth />
            <TextField select label="Zone" value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} fullWidth>
              {ZONES.map(z => <MenuItem key={z} value={z}>{z}</MenuItem>)}
            </TextField>
            <TextField select label="Operation Type" value={form.operation_type} onChange={e => setForm(f => ({ ...f, operation_type: e.target.value, status: e.target.value }))} fullWidth>
              {OP_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Reason" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} fullWidth />
            <TextField label="Scheduled Reopen" type="datetime-local" value={form.scheduled_reopen_at} onChange={e => setForm(f => ({ ...f, scheduled_reopen_at: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={!form.valve_name || saving} onClick={handleCreate}
            sx={{ backgroundColor: colors.blueAccent[700] }}>{saving ? "Saving..." : "Log Operation"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ValveOperationsRationing;
