import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress,
  Alert, Divider, Grid, Chip, Paper, Tooltip,
} from "@mui/material";
import { tokens } from "../../../theme";
import LanguageIcon from "@mui/icons-material/Language";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import NumbersIcon from "@mui/icons-material/Numbers";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useTranslation } from "react-i18next";
import api from "../../../utils/api";
import { setAppLanguage } from '../../../../../utils/i18nHelper';

const LANGUAGES = [
  { code: "en", label: "English",           native: "English",    flag: "🇬🇧", dir: "ltr" },
  { code: "sw", label: "Swahili",           native: "Kiswahili",  flag: "🇰🇪", dir: "ltr" },
  { code: "fr", label: "French",            native: "Français",   flag: "🇫🇷", dir: "ltr" },
  { code: "ar", label: "Arabic",            native: "العربية",    flag: "🇸🇦", dir: "rtl" },
  { code: "so", label: "Somali",            native: "Soomaali",   flag: "🇸🇴", dir: "ltr" },
  { code: "om", label: "Oromo",             native: "Afaan Oromoo", flag: "🇪🇹", dir: "ltr" },
];

const TIMEZONES = [
  { value: "Africa/Nairobi",   label: "Nairobi (EAT, UTC+3)",    offset: "+03:00" },
  { value: "Africa/Lagos",     label: "Lagos (WAT, UTC+1)",       offset: "+01:00" },
  { value: "Africa/Cairo",     label: "Cairo (EET, UTC+2)",       offset: "+02:00" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST, UTC+2)", offset: "+02:00" },
  { value: "UTC",              label: "UTC (UTC+0)",              offset: "+00:00" },
  { value: "Europe/London",    label: "London (GMT/BST)",         offset: "+00:00" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", example: () => formatExample("DD/MM/YYYY") },
  { value: "MM/DD/YYYY", example: () => formatExample("MM/DD/YYYY") },
  { value: "YYYY-MM-DD", example: () => formatExample("YYYY-MM-DD") },
  { value: "D MMM YYYY", example: () => formatExample("D MMM YYYY") },
];

const NUMBER_FORMATS = [
  { value: "en",    label: "1,234.56  (English)",  example: "1,234.56" },
  { value: "fr",    label: "1 234,56  (French)",   example: "1 234,56" },
  { value: "de",    label: "1.234,56  (German)",   example: "1.234,56" },
];

function formatExample(fmt) {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return fmt
    .replace("YYYY", yyyy).replace("MM", mm).replace("DD", dd)
    .replace("D", String(d.getDate())).replace("MMM", months[d.getMonth()]);
}

function currentTimeIn(tz) {
  try {
    return new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch { return "—"; }
}

const PREVIEW_SENTENCES = {
  en: "Water is life. Stay informed about your usage.",
  sw: "Maji ni uhai. Endelea kupata taarifa kuhusu matumizi yako.",
  fr: "L'eau c'est la vie. Restez informé de votre consommation.",
  ar: "الماء حياة. ابق على اطلاع باستهلاكك.",
  so: "Biyuhu waa nolosha. La soco isticmaalkaaga.",
  om: "Bishaan jireenya. Odeeffannoo fayyadama kee hordofi.",
};

const LanguageSettings = () => {
  const colors = tokens("dark");
  const { i18n } = useTranslation();

  const [settings, setSettings] = useState({
    language: i18n.language?.slice(0, 2) || "en",
    timezone: "Africa/Nairobi",
    date_format: "DD/MM/YYYY",
    number_format: "en",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [liveTime, setLiveTime] = useState(currentTimeIn(settings.timezone));

  // Load saved settings
  useEffect(() => {
    api.get("/client/language_settings")
      .then(res => {
        const s = res.data?.settings || {};
        setSettings(prev => ({ ...prev, ...s }));
      })
      .catch(() => {}) // non-fatal — use defaults
      .finally(() => setLoading(false));
  }, []);

  // Live clock for selected timezone
  useEffect(() => {
    setLiveTime(currentTimeIn(settings.timezone));
    const iv = setInterval(() => setLiveTime(currentTimeIn(settings.timezone)), 1000);
    return () => clearInterval(iv);
  }, [settings.timezone]);

  const set = (field) => (val) => setSettings(s => ({ ...s, [field]: val }));

  const handleSave = async () => {
    setSaving(true); setError(null); setSuccess(false);
    try {
      await api.patch("/client/language_settings", { settings });
      // Apply language change via centralized helper so all UI consumers stay in sync
      if (settings.language !== i18n.language?.slice(0, 2)) {
        await setAppLanguage(settings.language, { persistBackend: false });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress sx={{ color: colors.blueAccent[500] }} />
    </Box>
  );

  const selectedLang = LANGUAGES.find(l => l.code === settings.language) || LANGUAGES[0];
  const selectedTz   = TIMEZONES.find(t => t.value === settings.timezone) || TIMEZONES[0];

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">Language & Region</Typography>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">
        Customize your language, timezone, and regional formats
      </Typography>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Settings saved and applied.</Alert>}

      <Grid container spacing={3}>
        {/* ── Language selector ─────────────────────────────────────────── */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: colors.primary[400], border: `1px solid ${colors.primary[300]}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LanguageIcon sx={{ color: colors.blueAccent[400] }} />
                <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Display Language</Typography>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />

              <Grid container spacing={1.5}>
                {LANGUAGES.map(lang => (
                  <Grid item xs={6} sm={4} key={lang.code}>
                    <Paper
                      onClick={() => set("language")(lang.code)}
                      sx={{
                        p: 1.5, cursor: "pointer", textAlign: "center",
                        bgcolor: settings.language === lang.code ? colors.blueAccent[700] : colors.primary[500],
                        border: `2px solid ${settings.language === lang.code ? colors.blueAccent[400] : colors.primary[300]}`,
                        borderRadius: 2, transition: "all 0.2s ease",
                        "&:hover": { borderColor: colors.blueAccent[500], bgcolor: colors.primary[300] },
                        position: "relative",
                      }}
                    >
                      {settings.language === lang.code && (
                        <CheckCircleIcon sx={{ position: "absolute", top: 6, right: 6, fontSize: 16, color: colors.blueAccent[300] }} />
                      )}
                      <Typography fontSize={24} mb={0.5}>{lang.flag}</Typography>
                      <Typography variant="body2" color={colors.grey[100]} fontWeight={600}>{lang.native}</Typography>
                      <Typography variant="caption" color={colors.grey[400]}>{lang.label}</Typography>
                      {lang.dir === "rtl" && (
                        <Chip label="RTL" size="small" sx={{ mt: 0.5, height: 16, fontSize: "0.6rem", bgcolor: colors.grey[700], color: colors.grey[300] }} />
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Live preview */}
              <Box mt={2.5} p={1.5} sx={{ bgcolor: colors.primary[500], borderRadius: 1, border: `1px solid ${colors.primary[300]}` }}>
                <Typography variant="caption" color={colors.grey[500]} display="block" mb={0.5}>Preview in {selectedLang.label}:</Typography>
                <Typography color={colors.grey[200]} dir={selectedLang.dir} sx={{ fontStyle: "italic" }}>
                  {PREVIEW_SENTENCES[settings.language] || PREVIEW_SENTENCES.en}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Timezone + formats ────────────────────────────────────────── */}
        <Grid item xs={12} md={5}>
          {/* Timezone */}
          <Card sx={{ bgcolor: colors.primary[400], border: `1px solid ${colors.primary[300]}`, mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AccessTimeIcon sx={{ color: colors.blueAccent[400] }} />
                <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Timezone</Typography>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />
              <Grid container spacing={1}>
                {TIMEZONES.map(tz => (
                  <Grid item xs={12} key={tz.value}>
                    <Paper onClick={() => set("timezone")(tz.value)} sx={{
                      p: 1, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                      bgcolor: settings.timezone === tz.value ? colors.blueAccent[700] : colors.primary[500],
                      border: `1px solid ${settings.timezone === tz.value ? colors.blueAccent[400] : colors.primary[300]}`,
                      borderRadius: 1, transition: "all 0.15s ease",
                      "&:hover": { borderColor: colors.blueAccent[500] },
                    }}>
                      <Typography variant="body2" color={colors.grey[100]}>{tz.label}</Typography>
                      {settings.timezone === tz.value && (
                        <Chip label={liveTime} size="small" sx={{ bgcolor: colors.blueAccent[600], color: "#fff", fontSize: "0.65rem" }} />
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Date format */}
          <Card sx={{ bgcolor: colors.primary[400], border: `1px solid ${colors.primary[300]}`, mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CalendarTodayIcon sx={{ color: colors.blueAccent[400] }} />
                <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Date Format</Typography>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />
              <Grid container spacing={1}>
                {DATE_FORMATS.map(df => (
                  <Grid item xs={6} key={df.value}>
                    <Paper onClick={() => set("date_format")(df.value)} sx={{
                      p: 1, cursor: "pointer", textAlign: "center",
                      bgcolor: settings.date_format === df.value ? colors.blueAccent[700] : colors.primary[500],
                      border: `1px solid ${settings.date_format === df.value ? colors.blueAccent[400] : colors.primary[300]}`,
                      borderRadius: 1, transition: "all 0.15s ease",
                      "&:hover": { borderColor: colors.blueAccent[500] },
                    }}>
                      <Typography variant="caption" color={colors.grey[400]} display="block">{df.value}</Typography>
                      <Typography variant="body2" color={colors.grey[100]} fontWeight={600}>{df.example()}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Number format */}
          <Card sx={{ bgcolor: colors.primary[400], border: `1px solid ${colors.primary[300]}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <NumbersIcon sx={{ color: colors.blueAccent[400] }} />
                <Typography variant="h5" color={colors.grey[100]} fontWeight={600}>Number Format</Typography>
              </Box>
              <Divider sx={{ borderColor: colors.grey[700], mb: 2 }} />
              <Grid container spacing={1}>
                {NUMBER_FORMATS.map(nf => (
                  <Grid item xs={12} key={nf.value}>
                    <Paper onClick={() => set("number_format")(nf.value)} sx={{
                      p: 1, cursor: "pointer", display: "flex", justifyContent: "space-between",
                      bgcolor: settings.number_format === nf.value ? colors.blueAccent[700] : colors.primary[500],
                      border: `1px solid ${settings.number_format === nf.value ? colors.blueAccent[400] : colors.primary[300]}`,
                      borderRadius: 1, transition: "all 0.15s ease",
                      "&:hover": { borderColor: colors.blueAccent[500] },
                    }}>
                      <Typography variant="body2" color={colors.grey[100]}>{nf.label}</Typography>
                      {settings.number_format === nf.value && (
                        <CheckCircleIcon sx={{ fontSize: 16, color: colors.blueAccent[300] }} />
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button variant="contained" disabled={saving} onClick={handleSave}
          sx={{ bgcolor: colors.blueAccent[600], "&:hover": { bgcolor: colors.blueAccent[700] }, px: 4 }}>
          {saving ? "Saving…" : "Save & Apply"}
        </Button>
      </Box>
    </Box>
  );
};

export default LanguageSettings;
