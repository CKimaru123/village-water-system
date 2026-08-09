/**
 * WeatherWidget.jsx
 *
 * Two parts in one file:
 *   1. WeatherTicker  — slim auto-scrolling strip for the Topbar
 *   2. WeatherModal   — full Apple Weather-style modal on click
 *
 * Usage in Topbar:
 *   import WeatherWidget from "../../../../components/WeatherWidget";
 *   <WeatherWidget />
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Dialog, DialogContent, IconButton,
  Chip, Divider, CircularProgress, Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon          from "@mui/icons-material/Close";
import RefreshIcon        from "@mui/icons-material/Refresh";
import LocationOnIcon     from "@mui/icons-material/LocationOn";
import WaterDropIcon      from "@mui/icons-material/WaterDrop";
import AirIcon            from "@mui/icons-material/Air";
import WbSunnyIcon        from "@mui/icons-material/WbSunny";
import GrainIcon          from "@mui/icons-material/Grain";
import ThermostatIcon     from "@mui/icons-material/Thermostat";
import VisibilityIcon     from "@mui/icons-material/Visibility";
import CompressIcon       from "@mui/icons-material/Compress";
import AgricultureIcon    from "@mui/icons-material/Agriculture";
import PetsIcon           from "@mui/icons-material/Pets";
import WarningAmberIcon   from "@mui/icons-material/WarningAmber";
import useWeather         from "../hooks/useWeather";
import {
  buildTickerMessages,
  getRainHarvestOpportunity,
  getIrrigationAdvisory,
  getBoreholeRisk,
  getLivestockWaterDemand,
  getSurfaceWaterOutlook,
} from "../utils/waterIntelligence";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Glassmorphism card style */
const glassCard = (alpha = 0.15) => ({
  background:   `rgba(255,255,255,${alpha})`,
  backdropFilter: "blur(12px)",
  borderRadius: "16px",
  border:       "1px solid rgba(255,255,255,0.18)",
});

/** Map a weather code to a background gradient for the modal header */
const weatherGradient = (code) => {
  if (code === 0)   return "linear-gradient(135deg, #1e3a5f 0%, #2196F3 60%, #87ceeb 100%)";
  if (code <= 2)    return "linear-gradient(135deg, #1c3a5e 0%, #3a6186 60%, #89a0b8 100%)";
  if (code === 3)   return "linear-gradient(135deg, #2c2c2c 0%, #616161 100%)";
  if (code <= 49)   return "linear-gradient(135deg, #4a4a4a 0%, #7f7f7f 100%)";
  if (code <= 67)   return "linear-gradient(135deg, #1a237e 0%, #1565c0 60%, #0288d1 100%)";
  if (code <= 77)   return "linear-gradient(135deg, #263238 0%, #546e7a 100%)";
  if (code <= 82)   return "linear-gradient(135deg, #0d47a1 0%, #1976d2 60%, #4fc3f7 100%)";
  if (code <= 99)   return "linear-gradient(135deg, #1a0533 0%, #4a148c 60%, #880e4f 100%)";
  return "linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)";
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Single stat pill in the current-conditions strip */
const StatPill = ({ icon, label, value }) => (
  <Box sx={{
    ...glassCard(0.18),
    display: "flex", flexDirection: "column", alignItems: "center",
    px: 1.5, py: 1, minWidth: 72, gap: 0.3,
  }}>
    <Box sx={{ color: "rgba(255,255,255,0.7)", display: "flex" }}>{icon}</Box>
    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", lineHeight: 1 }}>{value}</Typography>
    <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</Typography>
  </Box>
);

/** One hour card in the horizontal hourly strip */
const HourCard = ({ hour, isNow }) => (
  <Box sx={{
    ...glassCard(isNow ? 0.30 : 0.12),
    display: "flex", flexDirection: "column", alignItems: "center",
    px: 1.5, py: 1.2, minWidth: 60, gap: 0.5,
    border: isNow ? "1.5px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
    flexShrink: 0,
  }}>
    <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem" }}>{isNow ? "Now" : hour.time}</Typography>
    <Typography sx={{ fontSize: "1.3rem", lineHeight: 1 }}>{hour.emoji}</Typography>
    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>{hour.temp}°</Typography>
    {hour.rainProb > 0 && (
      <Typography sx={{ color: "#90caf9", fontSize: "0.65rem" }}>{hour.rainProb}%</Typography>
    )}
  </Box>
);

/** One row in the 7-day forecast */
const DayRow = ({ day, isToday }) => (
  <Box sx={{
    display: "flex", alignItems: "center",
    py: 1.1, px: 1.5,
    borderRadius: "12px",
    background: isToday ? "rgba(255,255,255,0.12)" : "transparent",
    "&:hover": { background: "rgba(255,255,255,0.08)" },
    transition: "background 0.2s",
  }}>
    <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.88rem", width: 44, fontWeight: isToday ? 700 : 400 }}>
      {isToday ? "Today" : day.dayName}
    </Typography>
    <Typography sx={{ fontSize: "1.2rem", mx: 1.5 }}>{day.emoji}</Typography>
    {day.rainProb > 0 && (
      <Typography sx={{ color: "#90caf9", fontSize: "0.75rem", width: 38 }}>{day.rainProb}%</Typography>
    )}
    <Box sx={{ flex: 1 }} />
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem" }}>{day.tempMin}°</Typography>
      {/* Temperature range bar */}
      <Box sx={{
        width: 60, height: 4, borderRadius: 2,
        background: "rgba(255,255,255,0.15)",
        position: "relative", overflow: "hidden",
      }}>
        <Box sx={{
          position: "absolute", height: "100%", borderRadius: 2,
          background: "linear-gradient(90deg, #4fc3f7, #ff7043)",
          left: 0, right: 0,
        }} />
      </Box>
      <Typography sx={{ color: "#fff", fontSize: "0.88rem", fontWeight: 600, width: 28, textAlign: "right" }}>{day.tempMax}°</Typography>
    </Box>
  </Box>
);

/** Water intelligence advisory card */
const AdvisoryCard = ({ icon, title, label, tip, color, chip }) => (
  <Box sx={{
    ...glassCard(0.12),
    p: 1.5, display: "flex", flexDirection: "column", gap: 0.6,
  }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ color, display: "flex" }}>{icon}</Box>
      <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</Typography>
      <Box sx={{ flex: 1 }} />
      {chip && (
        <Chip label={chip} size="small" sx={{
          backgroundColor: color + "33", color, fontSize: "0.65rem", height: 18,
          border: `1px solid ${color}55`,
        }} />
      )}
    </Box>
    <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>{label}</Typography>
    <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", lineHeight: 1.4 }}>{tip}</Typography>
  </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
// WeatherModal
// ─────────────────────────────────────────────────────────────────────────────
const WeatherModal = ({ open, onClose }) => {
  const { weather, loading, error, refetch } = useWeather();

  if (!open) return null;

  const renderContent = () => {
    if (loading) return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 2 }}>
        <CircularProgress sx={{ color: "rgba(255,255,255,0.7)" }} />
        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>Fetching weather data…</Typography>
      </Box>
    );

    if (error || !weather) return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 2 }}>
        <WarningAmberIcon sx={{ color: "#ff9800", fontSize: 48 }} />
        <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>Weather data unavailable</Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>{error || "Check your connection"}</Typography>
      </Box>
    );

    const { current, hourly, daily } = weather;
    const today    = daily[0] || {};
    const weekPrecip = daily.map(d => d.precipSum || 0);
    const avgTemp    = daily.reduce((s, d) => s + ((d.tempMax + d.tempMin) / 2), 0) / (daily.length || 1);

    // Water intelligence
    const harvest   = getRainHarvestOpportunity(today.precipSum || 0);
    const irrig     = getIrrigationAdvisory(today.rainProb || 0, today.precipSum || 0, current.temp, current.humidity, today.evaporation || 0);
    const dryDays   = daily.filter(d => (d.precipSum || 0) < 1).length;
    const borehole  = getBoreholeRisk(dryDays, current.temp, today.precipSum || 0);
    const livestock = getLivestockWaterDemand(current.temp, current.humidity);
    const surface   = getSurfaceWaterOutlook(weekPrecip, avgTemp);

    return (
      <>
        {/* ── Hero: current conditions ───────────────────────── */}
        <Box sx={{ textAlign: "center", pt: 3, pb: 2, px: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.5 }}>
            <LocationOnIcon sx={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }} />
            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem" }}>{weather.location}</Typography>
          </Box>
          <Typography sx={{ fontSize: "5rem", lineHeight: 1, mb: 0.5 }}>{current.emoji}</Typography>
          <Typography sx={{ color: "#fff", fontSize: "4rem", fontWeight: 200, lineHeight: 1, letterSpacing: "-2px" }}>
            {current.temp}°<Typography component="span" sx={{ fontSize: "1.5rem", fontWeight: 300 }}>C</Typography>
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "1.1rem", mt: 0.5 }}>{current.label}</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", mt: 0.3 }}>
            Feels like {current.feelsLike}° · H:{today.tempMax}° L:{today.tempMin}°
          </Typography>
        </Box>

        {/* ── Stat pills row ─────────────────────────────────── */}
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", px: 2, pb: 1,
          "&::-webkit-scrollbar": { display: "none" } }}>
          <StatPill icon={<WaterDropIcon sx={{ fontSize: 16 }} />} label="Humidity"   value={`${current.humidity}%`} />
          <StatPill icon={<AirIcon sx={{ fontSize: 16 }} />}       label="Wind"       value={`${current.windSpeed} km/h`} />
          <StatPill icon={<WbSunnyIcon sx={{ fontSize: 16 }} />}   label="UV Index"   value={current.uvIndex ?? "—"} />
          <StatPill icon={<GrainIcon sx={{ fontSize: 16 }} />}     label="Rain"       value={`${current.precipitation} mm`} />
          <StatPill icon={<VisibilityIcon sx={{ fontSize: 16 }} />} label="Visibility" value={`${current.visibility} km`} />
          <StatPill icon={<CompressIcon sx={{ fontSize: 16 }} />}  label="Pressure"   value={`${current.pressure}`} />
          <StatPill icon={<ThermostatIcon sx={{ fontSize: 16 }} />} label="Feels like" value={`${current.feelsLike}°`} />
        </Box>

        {/* ── Sunrise / sunset ───────────────────────────────── */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 4, py: 1, px: 2 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem" }}>
            🌅 Sunrise {today.sunrise || "—"}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem" }}>
            🌇 Sunset {today.sunset || "—"}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mx: 2, my: 1 }} />

        {/* ── Hourly strip ───────────────────────────────────── */}
        <Box sx={{ px: 2, mb: 1 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", mb: 1 }}>
            Hourly forecast
          </Typography>
          <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1,
            "&::-webkit-scrollbar": { height: 3 },
            "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.2)", borderRadius: 2 },
          }}>
            {hourly.map((h, i) => <HourCard key={i} hour={h} isNow={i === 0} />)}
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mx: 2, my: 1 }} />

        {/* ── 7-day forecast ─────────────────────────────────── */}
        <Box sx={{ px: 2, mb: 1 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.5 }}>
            7-day forecast
          </Typography>
          {daily.map((day, i) => <DayRow key={day.date} day={day} isToday={i === 0} />)}
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mx: 2, my: 1.5 }} />

        {/* ── Water Intelligence panel ───────────────────────── */}
        <Box sx={{ px: 2, pb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <WaterDropIcon sx={{ color: "#4fc3f7", fontSize: 18 }} />
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Water Intelligence
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>

            <AdvisoryCard
              icon={<GrainIcon sx={{ fontSize: 18 }} />}
              title="Rain Harvest Opportunity"
              label={harvest.label}
              tip={harvest.tip}
              color={harvest.color}
              chip={`~${harvest.litres} L`}
            />

            <AdvisoryCard
              icon={<AgricultureIcon sx={{ fontSize: 18 }} />}
              title="Irrigation Advisory"
              label={irrig.label}
              tip={irrig.tip}
              color={irrig.color}
              chip={irrig.urgency}
            />

            <AdvisoryCard
              icon={<WaterDropIcon sx={{ fontSize: 18 }} />}
              title="Borehole / Groundwater Risk"
              label={borehole.label}
              tip={borehole.tip}
              color={borehole.color}
              chip={borehole.risk}
            />

            <AdvisoryCard
              icon={<PetsIcon sx={{ fontSize: 18 }} />}
              title="Livestock Water Demand"
              label={livestock.label}
              tip={livestock.tip}
              color={livestock.color}
              chip={`×${livestock.multiplier}`}
            />

            <AdvisoryCard
              icon={<WaterDropIcon sx={{ fontSize: 18 }} />}
              title="River / Dam Outlook (7 days)"
              label={surface.label}
              tip={surface.tip}
              color={surface.color}
              chip={`${surface.totalRainMm} mm`}
            />

          </Box>
        </Box>
      </>
    );
  };

  const bgGradient = weather
    ? weatherGradient(weather.current?.weatherCode ?? 0)
    : "linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          background:      bgGradient,
          borderRadius:    "28px",
          overflow:        "hidden",
          boxShadow:       "0 32px 80px rgba(0,0,0,0.6)",
          border:          "1px solid rgba(255,255,255,0.12)",
          maxHeight:       "90vh",
        },
      }}
      BackdropProps={{ sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.5)" } }}
    >
      {/* Close + Refresh toolbar */}
      <Box sx={{ position: "sticky", top: 0, zIndex: 10, display: "flex", justifyContent: "space-between", px: 1.5, pt: 1.5, background: "transparent" }}>
        <Tooltip title="Refresh">
          <IconButton onClick={() => { refetch(); }} size="small" sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { background: "rgba(255,255,255,0.1)" } }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <IconButton onClick={onClose} size="small" sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { background: "rgba(255,255,255,0.1)" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{
        p: 0, overflowY: "auto",
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.15)", borderRadius: 2 },
      }}>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// WeatherTicker  (the slim Topbar strip)
// ─────────────────────────────────────────────────────────────────────────────
const WeatherTicker = ({ onOpen }) => {
  const { weather, loading } = useWeather();
  const [index, setIndex]     = useState(0);
  const [visible, setVisible] = useState(true);
  const messages              = weather ? buildTickerMessages(weather) : [];
  const tickerRef             = useRef(null);

  // Rotate messages every 4 seconds with a fade transition
  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % messages.length);
        setVisible(true);
      }, 350);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  if (loading) return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 1,
      px: 1.5, py: 0.5, borderRadius: "20px",
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.1)",
      minWidth: 120,
    }}>
      <CircularProgress size={12} sx={{ color: "rgba(255,255,255,0.4)" }} />
      <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>Weather…</Typography>
    </Box>
  );

  if (!weather || messages.length === 0) return null;

  const msg = messages[index];

  return (
    <Tooltip title="Click for full weather forecast & water advisories" arrow>
      <Box
        ref={tickerRef}
        onClick={onOpen}
        sx={{
          display:       "flex",
          alignItems:    "center",
          gap:           1,
          px:            1.8,
          py:            0.6,
          borderRadius:  "20px",
          background:    "rgba(255,255,255,0.07)",
          border:        "1px solid rgba(255,255,255,0.12)",
          cursor:        "pointer",
          maxWidth:      320,
          minWidth:      180,
          overflow:      "hidden",
          transition:    "background 0.2s, border-color 0.2s",
          "&:hover": {
            background:   "rgba(255,255,255,0.13)",
            borderColor:  "rgba(255,255,255,0.28)",
          },
          // Fade the text in/out
          "& .ticker-text": {
            opacity:    visible ? 1 : 0,
            transform:  visible ? "translateY(0)" : "translateY(4px)",
            transition: "opacity 0.35s ease, transform 0.35s ease",
          },
        }}
      >
        {/* Left: current temp always visible */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          <Typography sx={{ fontSize: "1rem", lineHeight: 1 }}>{weather.current.emoji}</Typography>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.82rem" }}>
            {weather.current.temp}°C
          </Typography>
        </Box>

        {/* Divider dot */}
        <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", flexShrink: 0 }}>·</Typography>

        {/* Rotating message */}
        <Box className="ticker-text" sx={{ display: "flex", alignItems: "center", gap: 0.5, overflow: "hidden", minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.82rem", lineHeight: 1, flexShrink: 0 }}>{msg.emoji}</Typography>
          <Typography sx={{
            color:        msg.color,
            fontSize:     "0.75rem",
            fontWeight:   500,
            whiteSpace:   "nowrap",
            overflow:     "hidden",
            textOverflow: "ellipsis",
          }}>
            {msg.text}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// WeatherWidget  (exported — combines ticker + modal)
// ─────────────────────────────────────────────────────────────────────────────
const WeatherWidget = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <WeatherTicker onOpen={() => setOpen(true)} />
      <WeatherModal  open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default WeatherWidget;
