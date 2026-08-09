/**
 * useWeather.js
 * Fetches weather data from Open-Meteo (free, no API key required).
 * Caches results in localStorage for 30 minutes to avoid hammering the API.
 * Auto-detects user location via browser geolocation, falling back to
 * hardcoded village coordinates.
 *
 * Default coordinates: Kirinyaga County, Kenya (adjust as needed)
 */

import { useState, useEffect, useRef } from "react";

const CACHE_KEY  = "weather_cache";
const CACHE_TTL  = 30 * 60 * 1000; // 30 minutes in ms

// ── Fallback coordinates (village location) ────────────────────────────────
const DEFAULT_LAT = -0.4167;
const DEFAULT_LON = 37.2833;
const DEFAULT_LOCATION_NAME = "Kirinyaga, Kenya";

// ── Open-Meteo endpoint builder ────────────────────────────────────────────
const buildUrl = (lat, lon) =>
  `https://api.open-meteo.com/v1/forecast?` +
  `latitude=${lat}&longitude=${lon}` +
  `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
  `precipitation,weather_code,wind_speed_10m,wind_direction_10m,` +
  `surface_pressure,visibility,uv_index` +
  `&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m` +
  `&daily=weather_code,temperature_2m_max,temperature_2m_min,` +
  `precipitation_sum,precipitation_probability_max,wind_speed_10m_max,` +
  `sunrise,sunset,uv_index_max,et0_fao_evapotranspiration` +
  `&timezone=Africa%2FNairobi` +
  `&forecast_days=7`;

// ── WMO weather code → human label + emoji ─────────────────────────────────
export const decodeWeatherCode = (code) => {
  if (code === 0)              return { label: "Clear Sky",           emoji: "☀️" };
  if (code <= 2)               return { label: "Partly Cloudy",       emoji: "⛅" };
  if (code === 3)              return { label: "Overcast",            emoji: "☁️" };
  if (code <= 49)              return { label: "Fog",                 emoji: "🌫️" };
  if (code <= 55)              return { label: "Drizzle",             emoji: "🌦️" };
  if (code <= 65)              return { label: "Rain",                emoji: "🌧️" };
  if (code <= 75)              return { label: "Snow",                emoji: "❄️" };
  if (code <= 82)              return { label: "Rain Showers",        emoji: "🌧️" };
  if (code <= 86)              return { label: "Snow Showers",        emoji: "🌨️" };
  if (code <= 99)              return { label: "Thunderstorm",        emoji: "⛈️" };
  return { label: "Unknown", emoji: "🌡️" };
};

// ── Wind direction degrees → compass ──────────────────────────────────────
export const windDirection = (deg) => {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
};

// ── Try reading a valid cache entry ───────────────────────────────────────
const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return data;
  } catch (_) { /* ignore */ }
  return null;
};

const writeCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch (_) { /* ignore quota errors */ }
};

// ── Main hook ──────────────────────────────────────────────────────────────
const useWeather = () => {
  const [weather, setWeather]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [locationName, setLocationName] = useState(DEFAULT_LOCATION_NAME);
  const intervalRef                     = useRef(null);

  const fetchWeather = async (lat, lon, locName) => {
    // Return cached data immediately if fresh
    const cached = readCache();
    if (cached) {
      setWeather(cached);
      setLoading(false);
      return;
    }

    try {
      const res  = await fetch(buildUrl(lat, lon));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // ── Shape the data for easy consumption ──────────────────────────
      const c = json.current;
      const shaped = {
        location: locName,
        lat, lon,
        current: {
          temp:           Math.round(c.temperature_2m),
          feelsLike:      Math.round(c.apparent_temperature),
          humidity:       c.relative_humidity_2m,
          precipitation:  c.precipitation,
          weatherCode:    c.weather_code,
          windSpeed:      Math.round(c.wind_speed_10m),
          windDir:        windDirection(c.wind_direction_10m),
          pressure:       Math.round(c.surface_pressure),
          visibility:     Math.round((c.visibility || 0) / 1000), // m → km
          uvIndex:        c.uv_index,
          ...decodeWeatherCode(c.weather_code),
        },
        // Next 24 hours (hourly[0..23])
        hourly: (json.hourly?.time || []).slice(0, 24).map((time, i) => ({
          time:        time.slice(11, 16),           // "HH:MM"
          temp:        Math.round(json.hourly.temperature_2m[i]),
          rainProb:    json.hourly.precipitation_probability[i],
          precip:      json.hourly.precipitation[i],
          windSpeed:   Math.round(json.hourly.wind_speed_10m[i]),
          weatherCode: json.hourly.weather_code[i],
          ...decodeWeatherCode(json.hourly.weather_code[i]),
        })),
        // 7-day daily forecast
        daily: (json.daily?.time || []).map((date, i) => ({
          date,
          dayName:     new Date(date).toLocaleDateString("en-KE", { weekday: "short" }),
          tempMax:     Math.round(json.daily.temperature_2m_max[i]),
          tempMin:     Math.round(json.daily.temperature_2m_min[i]),
          precipSum:   json.daily.precipitation_sum[i],
          rainProb:    json.daily.precipitation_probability_max[i],
          windMax:     Math.round(json.daily.wind_speed_10m_max[i]),
          uvMax:       json.daily.uv_index_max[i],
          sunrise:     (json.daily.sunrise[i] || "").slice(11, 16),
          sunset:      (json.daily.sunset[i]  || "").slice(11, 16),
          evaporation: json.daily.et0_fao_evapotranspiration?.[i] ?? 0,
          weatherCode: json.daily.weather_code[i],
          ...decodeWeatherCode(json.daily.weather_code[i]),
        })),
        fetchedAt: Date.now(),
      };

      writeCache(shaped);
      setWeather(shaped);
      setLocationName(locName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Reverse-geocode lat/lon → place name (Nominatim, free) ────────────
  const getLocationName = async (lat, lon) => {
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const json = await res.json();
      const a    = json.address || {};
      return (
        a.village || a.town || a.city || a.county ||
        a.state   || DEFAULT_LOCATION_NAME
      );
    } catch (_) {
      return DEFAULT_LOCATION_NAME;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Try browser geolocation first
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            if (cancelled) return;
            const { latitude: lat, longitude: lon } = pos.coords;
            const name = await getLocationName(lat, lon);
            if (!cancelled) fetchWeather(lat, lon, name);
          },
          () => {
            // Permission denied or unavailable — use village default
            if (!cancelled) fetchWeather(DEFAULT_LAT, DEFAULT_LON, DEFAULT_LOCATION_NAME);
          },
          { timeout: 5000 }
        );
      } else {
        fetchWeather(DEFAULT_LAT, DEFAULT_LON, DEFAULT_LOCATION_NAME);
      }
    };

    init();

    // Auto-refresh every 30 minutes
    intervalRef.current = setInterval(() => {
      localStorage.removeItem(CACHE_KEY); // bust cache
      init();
    }, CACHE_TTL);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { weather, loading, error, locationName, refetch: () => {
    localStorage.removeItem(CACHE_KEY);
    setLoading(true);
    setError(null);
  }};
};

export default useWeather;
