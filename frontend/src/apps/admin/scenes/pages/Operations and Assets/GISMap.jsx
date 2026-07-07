import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import adminApi from "../../../utils/api";
import RefreshIcon from "@mui/icons-material/Refresh";
import IconButton from "@mui/material/IconButton";

const mockMapData = {
  assets: [
    { id: 1, name: "Kiambu Main Pump", type: "Pump", status: "active", location: "Kiambu Station A", map_x: 28, map_y: 35 },
    { id: 2, name: "Ruiru Borehole #1", type: "Borehole", status: "active", location: "Ruiru North", map_x: 62, map_y: 22 },
    { id: 3, name: "Thika Treatment Plant", type: "Treatment Plant", status: "active", location: "Thika Industrial Zone", map_x: 75, map_y: 18 },
    { id: 4, name: "Kahawa Elevated Tank", type: "Tank", status: "active", location: "Kahawa West", map_x: 45, map_y: 55 },
    { id: 5, name: "Backup Pump Unit 2", type: "Pump", status: "active", location: "Kiambu Station B", map_x: 30, map_y: 42 },
  ],
  connections: [
    { id: 1, name: "Main Supply Line A", type: "Pipeline", status: "active", location: "Thika Road Corridor", map_x: 52, map_y: 30 },
    { id: 2, name: "Githurai Distribution Line", type: "Pipeline", status: "maintenance", location: "Githurai 44", map_x: 38, map_y: 48 },
    { id: 3, name: "Zone 3 Feeder Pipe", type: "Pipeline", status: "active", location: "Kahawa West", map_x: 48, map_y: 62 },
  ],
  incidents: [
    { id: 1, name: "Pipe Burst - Thika Rd", type: "pipe_burst", status: "in_progress", location: "Thika Road Km 12", map_x: 68, map_y: 28 },
    { id: 2, name: "Pump Failure - Kiambu", type: "pump_failure", status: "open", location: "Kiambu Station A", map_x: 26, map_y: 33 },
  ],
  valves: [
    { id: 1, name: "Valve JJ-V01", type: "Isolation Valve", status: "open", location: "Juja Junction", map_x: 58, map_y: 45 },
    { id: 2, name: "Valve KH-V02", type: "Gate Valve", status: "closed", location: "Kahawa North", map_x: 42, map_y: 38 },
    { id: 3, name: "Valve RU-V03", type: "Butterfly Valve", status: "open", location: "Ruiru South", map_x: 65, map_y: 55 },
    { id: 4, name: "Valve TH-V04", type: "Ball Valve", status: "partial", location: "Thika West", map_x: 72, map_y: 40 },
  ],
};

const layerColors = {
  assets: "#4cceac",
  connections: "#6870fa",
  incidents: "#e2726e",
  valves: "#f0c040",
};

const layerLabels = { assets: "Assets", connections: "Connections", incidents: "Incidents", valves: "Valves" };

const GISMap = () => {
  const colors = tokens(useTheme().palette.mode);
  const [mapData, setMapData] = useState({ assets: [], connections: [], incidents: [], valves: [] });
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState("all");
  const [hoveredItem, setHoveredItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, item: null });

  const load = () => {
    setLoading(true);
    adminApi.get("/admin/gis/layers?type=assets")
      .then(res => {
        // Handle various response shapes; fall back to mock if not a valid object with arrays
        const d = res.data?.data || res.data;
        const isValid = d && typeof d === "object" && !Array.isArray(d) &&
          (Array.isArray(d.assets) || Array.isArray(d.connections) || Array.isArray(d.incidents) || Array.isArray(d.valves));
        setMapData(isValid ? {
          assets: Array.isArray(d.assets) ? d.assets : [],
          connections: Array.isArray(d.connections) ? d.connections : [],
          incidents: Array.isArray(d.incidents) ? d.incidents : [],
          valves: Array.isArray(d.valves) ? d.valves : [],
        } : mockMapData);
      })
      .catch(() => setMapData(mockMapData))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const allItems = [
    ...(Array.isArray(mapData.assets) ? mapData.assets : []).map(i => ({ ...i, layer: "assets" })),
    ...(Array.isArray(mapData.connections) ? mapData.connections : []).map(i => ({ ...i, layer: "connections" })),
    ...(Array.isArray(mapData.incidents) ? mapData.incidents : []).map(i => ({ ...i, layer: "incidents" })),
    ...(Array.isArray(mapData.valves) ? mapData.valves : []).map(i => ({ ...i, layer: "valves" })),
  ];

  const visibleItems = activeLayer === "all" ? allItems : allItems.filter(i => i.layer === activeLayer);
  const sideItems = activeLayer === "all" ? allItems : allItems.filter(i => i.layer === activeLayer);

  const kpis = [
    { label: "Total Assets on Map", value: (mapData.assets || []).length, color: layerColors.assets },
    { label: "Active Connections", value: (mapData.connections || []).filter(c => c.status === "active").length, color: layerColors.connections },
    { label: "Open Incidents", value: (mapData.incidents || []).filter(i => i.status === "open" || i.status === "in_progress").length, color: layerColors.incidents },
    { label: "Valves Open", value: (mapData.valves || []).filter(v => v.status === "open").length, color: layerColors.valves },
    { label: "Valves Closed", value: (mapData.valves || []).filter(v => v.status === "closed").length, color: colors.redAccent[400] },
  ];

  const getItemColor = (item) => {
    if (item.layer === "incidents") return layerColors.incidents;
    if (item.layer === "valves") {
      if (item.status === "open") return layerColors.valves;
      if (item.status === "closed") return colors.redAccent[400];
      return "#ff7043";
    }
    if (item.status === "active") return layerColors[item.layer] || colors.greenAccent[500];
    if (item.status === "maintenance") return "#f0c040";
    return colors.grey[500];
  };

  const isCritical = (item) => item.layer === "incidents" || item.status === "maintenance";

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">GIS Map</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Spatial overview of water system infrastructure</Typography>
        </Box>
        <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
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

      <Alert severity="info" sx={{ mb: 2 }}>Full GPS map requires coordinates. This schematic shows relative positions of infrastructure.</Alert>

      {/* Layer toggles */}
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        {["all", "assets", "connections", "incidents", "valves"].map(layer => (
          <Button key={layer} variant={activeLayer === layer ? "contained" : "outlined"} size="small"
            onClick={() => setActiveLayer(layer)}
            sx={{
              backgroundColor: activeLayer === layer ? (layer === "all" ? colors.blueAccent[700] : layerColors[layer] + "33") : "transparent",
              borderColor: layer === "all" ? colors.blueAccent[500] : layerColors[layer] || colors.blueAccent[500],
              color: layer === "all" ? colors.blueAccent[300] : layerColors[layer] || colors.blueAccent[300],
              fontWeight: activeLayer === layer ? "bold" : "normal",
            }}>
            {layer === "all" ? "All Layers" : layerLabels[layer]}
          </Button>
        ))}
      </Box>

      <Box display="flex" gap={2}>
        {/* Map */}
        <Box flex="1 1 60%" sx={{ position: "relative", height: 600, backgroundColor: colors.primary[400], borderRadius: 2, border: `1px solid ${colors.grey[700]}`, overflow: "hidden" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress sx={{ color: colors.blueAccent[500] }} />
            </Box>
          ) : (
            <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ cursor: "crosshair" }}>
              {/* Background grid */}
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(v => (
                <React.Fragment key={v}>
                  <line x1={v} y1="0" x2={v} y2="100" stroke={colors.grey[800]} strokeWidth="0.2" />
                  <line x1="0" y1={v} x2="100" y2={v} stroke={colors.grey[800]} strokeWidth="0.2" />
                </React.Fragment>
              ))}
              {/* Roads */}
              <path d="M 0 45 Q 25 42 50 45 Q 75 48 100 45" stroke={colors.grey[700]} strokeWidth="1.2" fill="none" />
              <path d="M 0 70 Q 30 68 60 70 Q 80 72 100 70" stroke={colors.grey[700]} strokeWidth="0.8" fill="none" />
              <path d="M 50 0 Q 48 25 50 50 Q 52 75 50 100" stroke={colors.grey[700]} strokeWidth="1.2" fill="none" />
              <path d="M 25 0 Q 24 30 25 60 Q 26 80 25 100" stroke={colors.grey[700]} strokeWidth="0.6" fill="none" />
              {/* Pipeline connections */}
              {(mapData.connections || []).map(c => (
                <line key={c.id} x1={c.map_x - 8} y1={c.map_y} x2={c.map_x + 8} y2={c.map_y}
                  stroke={c.status === "active" ? layerColors.connections : "#f0c040"} strokeWidth="1.5" strokeDasharray={c.status === "maintenance" ? "2,2" : "none"} opacity="0.7" />
              ))}
              {/* Map items */}
              {visibleItems.map((item, idx) => {
                const color = getItemColor(item);
                const critical = isCritical(item);
                return (
                  <g key={`${item.layer}-${item.id}-${idx}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedItem(item)}
                    onMouseEnter={() => setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}>
                    {critical && (
                      <circle cx={item.map_x} cy={item.map_y} r="7" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4">
                        <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle cx={item.map_x} cy={item.map_y} r="3.5" fill={color} opacity="0.9" />
                    <circle cx={item.map_x} cy={item.map_y} r="5" fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" />
                    {hoveredItem?.id === item.id && hoveredItem?.layer === item.layer && (
                      <g>
                        <rect x={item.map_x + 5} y={item.map_y - 8} width={item.name.length * 1.8 + 4} height="10" rx="1" fill="rgba(0,0,0,0.8)" />
                        <text x={item.map_x + 7} y={item.map_y - 1} fontSize="3.5" fill="#fff">{item.name}</text>
                      </g>
                    )}
                  </g>
                );
              })}
              {/* Zone labels */}
              {[["Zone 1", 15, 20], ["Zone 2", 40, 25], ["Zone 3", 65, 35], ["Zone 4", 80, 60]].map(([label, x, y]) => (
                <text key={label} x={x} y={y} fontSize="3" fill={colors.grey[600]} opacity="0.7">{label}</text>
              ))}
            </svg>
          )}
          {/* Legend */}
          <Box sx={{ position: "absolute", bottom: 12, left: 12, backgroundColor: "rgba(0,0,0,0.75)", p: 1.5, borderRadius: 1 }}>
            <Typography variant="caption" color={colors.grey[300]} fontWeight="bold" display="block" mb={0.5}>Legend</Typography>
            {Object.entries(layerColors).map(([layer, color]) => (
              <Box key={layer} display="flex" alignItems="center" gap={1} mb={0.3}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color }} />
                <Typography variant="caption" color={colors.grey[300]}>{layerLabels[layer]}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Side panel */}
        <Box flex="0 0 260px" sx={{ height: 600, overflowY: "auto", backgroundColor: colors.primary[400], borderRadius: 2, border: `1px solid ${colors.grey[700]}`, p: 1.5 }}>
          <Typography variant="h6" color={colors.grey[200]} fontWeight="bold" mb={1.5}>
            {activeLayer === "all" ? "All Items" : layerLabels[activeLayer]} ({sideItems.length})
          </Typography>
          {sideItems.map((item, idx) => (
            <Box key={`side-${item.layer}-${item.id}-${idx}`} onClick={() => setSelectedItem(item)}
              sx={{ p: 1, mb: 1, borderRadius: 1, cursor: "pointer", backgroundColor: colors.primary[500], "&:hover": { backgroundColor: colors.primary[600] }, borderLeft: `3px solid ${getItemColor(item)}` }}>
              <Typography variant="body2" color={colors.grey[100]} fontWeight="bold" noWrap>{item.name}</Typography>
              <Typography variant="caption" color={colors.grey[400]} display="block" noWrap>{item.location}</Typography>
              <Chip label={item.status} size="small" sx={{ mt: 0.3, height: 18, fontSize: "0.65rem", backgroundColor: getItemColor(item) + "33", color: getItemColor(item) }} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onClose={() => setSelectedItem(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        {selectedItem && (
          <>
            <DialogTitle sx={{ color: colors.grey[100] }}>
              {selectedItem.name}
              <Chip label={selectedItem.layer} size="small" sx={{ ml: 1.5, backgroundColor: layerColors[selectedItem.layer] + "33", color: layerColors[selectedItem.layer] }} />
            </DialogTitle>
            <DialogContent>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />
              {[
                ["Type", selectedItem.type],
                ["Status", selectedItem.status],
                ["Location", selectedItem.location],
                ["Layer", selectedItem.layer],
                ["Map Position", `X: ${selectedItem.map_x}%, Y: ${selectedItem.map_y}%`],
              ].map(([label, value]) => (
                <Box key={label} display="flex" gap={2} mb={1}>
                  <Typography variant="body2" color={colors.grey[400]} sx={{ minWidth: 120 }}>{label}:</Typography>
                  <Typography variant="body2" color={colors.grey[100]} sx={{ fontSize: "1rem !important" }}>{value || "—"}</Typography>
                </Box>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedItem(null)} sx={{ color: colors.grey[400] }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default GISMap;
