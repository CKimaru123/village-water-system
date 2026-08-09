/**
 * waterIntelligence.js
 * Pure functions that translate raw weather data into actionable
 * water-management advisories for a village water system.
 *
 * All functions are side-effect free — pass in weather data, get
 * back structured advisory objects ready to render in the UI.
 */

// ── Constants ──────────────────────────────────────────────────────────────
const ROOF_EFFICIENCY        = 0.80;  // 80 % runoff coefficient for corrugated iron
const LITRES_PER_MM_PER_M2   = 1.0;  // 1 mm rain = 1 L/m² before losses
const STANDARD_ROOF_M2       = 50;   // typical household roof area in m²
const TREE_WATER_NEED_LITRES = 20;   // litres per mature tree per day in heat

// ── 1. Rain Harvest Opportunity ────────────────────────────────────────────
/**
 * Given forecast precipitation (mm) over a period, estimate how many
 * litres a standard household roof can collect.
 *
 * @param {number} precipMm   - Total forecast precipitation in mm
 * @param {number} roofM2     - Roof area in m² (default 50)
 * @returns {{ litres, precipMm, roofM2, level, label, tip }}
 */
export const getRainHarvestOpportunity = (precipMm, roofM2 = STANDARD_ROOF_M2) => {
  const safe    = Math.max(0, parseFloat(precipMm) || 0);
  const litres  = Math.round(safe * LITRES_PER_MM_PER_M2 * roofM2 * ROOF_EFFICIENCY);

  let level, label, color, tip;

  if (safe === 0) {
    level = "none";   color = "#9e9e9e";
    label = "No rain forecast";
    tip   = "Ensure storage tanks are topped up from existing supply.";
  } else if (safe < 5) {
    level = "low";    color = "#ff9800";
    label = "Light rain — limited harvest";
    tip   = `Expect ~${litres} L from a ${roofM2} m² roof. Position catchment containers.`;
  } else if (safe < 20) {
    level = "moderate"; color = "#2196F3";
    label = "Moderate rain — good harvest";
    tip   = `Expect ~${litres} L. Open all gutters and ensure tank inlets are clear.`;
  } else if (safe < 50) {
    level = "high";   color = "#4CAF50";
    label = "Heavy rain — excellent harvest";
    tip   = `Expect ~${litres} L. Check overflow channels to prevent flooding around foundations.`;
  } else {
    level = "very_high"; color = "#9C27B0";
    label = "Very heavy rain — flood risk";
    tip   = `Expect ~${litres} L but monitor dam and borehole surroundings for overflow and contamination.`;
  }

  return { litres, precipMm: safe, roofM2, level, label, color, tip };
};

// ── 2. Irrigation Advisory ─────────────────────────────────────────────────
/**
 * Tell farmers whether to irrigate today or wait for rain.
 *
 * @param {number} rainProbPct   - Probability of rain today (0–100)
 * @param {number} precipMm      - Expected precipitation mm today
 * @param {number} tempC         - Current temperature °C
 * @param {number} humidityPct   - Current relative humidity %
 * @param {number} evapMm        - Evapotranspiration mm/day (from daily forecast)
 * @returns {{ action, urgency, color, label, tip }}
 */
export const getIrrigationAdvisory = (
  rainProbPct, precipMm, tempC, humidityPct, evapMm = 0
) => {
  const rainProb = parseFloat(rainProbPct) || 0;
  const precip   = parseFloat(precipMm)   || 0;
  const temp     = parseFloat(tempC)      || 20;
  const humidity = parseFloat(humidityPct)|| 60;
  const evap     = parseFloat(evapMm)     || 0;

  // High evapotranspiration + low humidity = crops losing water fast
  const stressScore = (temp > 30 ? 2 : temp > 25 ? 1 : 0)
                    + (humidity < 40 ? 2 : humidity < 60 ? 1 : 0)
                    + (evap > 6 ? 2 : evap > 4 ? 1 : 0);

  if (rainProb >= 70 && precip >= 5) {
    return {
      action:  "wait",
      urgency: "low",
      color:   "#4CAF50",
      label:   "Wait — rain coming",
      tip:     `Rain probability ${rainProb}%. Save water and let nature irrigate today.`,
    };
  }

  if (rainProb >= 40 && precip >= 2) {
    return {
      action:  "light",
      urgency: "low",
      color:   "#8BC34A",
      label:   "Light irrigation if needed",
      tip:     `Some rain likely (${rainProb}%). Apply light irrigation only to water-sensitive crops.`,
    };
  }

  if (stressScore >= 4) {
    return {
      action:  "urgent",
      urgency: "high",
      color:   "#f44336",
      label:   "Irrigate urgently",
      tip:     `High heat (${temp}°C) + low humidity (${humidity}%) + high evaporation (${evap} mm). Crops are water-stressed.`,
    };
  }

  if (stressScore >= 2) {
    return {
      action:  "irrigate",
      urgency: "medium",
      color:   "#FF9800",
      label:   "Irrigate today",
      tip:     `Moderate stress conditions. Morning or evening irrigation recommended to reduce evaporation loss.`,
    };
  }

  return {
    action:  "normal",
    urgency: "low",
    color:   "#2196F3",
    label:   "Normal irrigation schedule",
    tip:     "Conditions are moderate. Follow your regular irrigation schedule.",
  };
};

// ── 3. Borehole / Groundwater Risk ────────────────────────────────────────
/**
 * Estimate depletion risk based on consecutive dry days and temperature.
 *
 * @param {number} consecutiveDryDays  - Days since last rainfall
 * @param {number} avgTempC            - Average temperature over period
 * @param {number} totalPrecipMm       - Total precipitation in last 7 days
 * @returns {{ risk, color, label, tip }}
 */
export const getBoreholeRisk = (consecutiveDryDays, avgTempC, totalPrecipMm = 0) => {
  const dryDays = parseFloat(consecutiveDryDays) || 0;
  const temp    = parseFloat(avgTempC)           || 20;
  const precip  = parseFloat(totalPrecipMm)      || 0;

  const riskScore = (dryDays > 14 ? 3 : dryDays > 7 ? 2 : dryDays > 3 ? 1 : 0)
                  + (temp > 32 ? 2 : temp > 28 ? 1 : 0)
                  + (precip < 2 ? 1 : 0);

  if (riskScore >= 5) {
    return {
      risk:  "critical",
      color: "#f44336",
      label: "Critical — restrict non-essential use",
      tip:   `${dryDays} dry days, ${temp}°C avg. Implement Level 3 water rationing. Prioritise drinking water.`,
    };
  }
  if (riskScore >= 3) {
    return {
      risk:  "high",
      color: "#FF9800",
      label: "High depletion risk",
      tip:   `Dry spell ongoing (${dryDays} days). Monitor borehole yield daily. Reduce irrigation pumping by 30%.`,
    };
  }
  if (riskScore >= 1) {
    return {
      risk:  "medium",
      color: "#FFC107",
      label: "Moderate — monitor closely",
      tip:   "Conditions suggest moderate stress. Check water levels every 2 days.",
    };
  }
  return {
    risk:  "low",
    color: "#4CAF50",
    label: "Low risk — adequate recharge",
    tip:   precip > 10
      ? `Good rainfall (${precip} mm this week). Groundwater recharge conditions are favourable.`
      : "Normal conditions. Continue regular monitoring.",
  };
};

// ── 4. Livestock Water Demand ──────────────────────────────────────────────
/**
 * Estimate how much extra water livestock need based on heat stress.
 *
 * @param {number} tempC      - Current temperature °C
 * @param {number} humidity   - Relative humidity %
 * @returns {{ level, multiplier, color, label, tip }}
 */
export const getLivestockWaterDemand = (tempC, humidity) => {
  const temp = parseFloat(tempC)    || 20;
  const hum  = parseFloat(humidity) || 60;

  // Temperature Humidity Index (simplified THI)
  const thi = temp - (0.55 - 0.0055 * hum) * (temp - 14.5);

  let level, multiplier, color, label, tip;

  if (thi < 68) {
    level = "normal";     multiplier = 1.0; color = "#4CAF50";
    label = "Normal water demand";
    tip   = "Livestock water consumption is at normal levels.";
  } else if (thi < 72) {
    level = "mild";       multiplier = 1.2; color = "#8BC34A";
    label = "Mild heat stress — +20% water";
    tip   = `THI ${thi.toFixed(0)}. Ensure troughs are full. Livestock need ~20% more water today.`;
  } else if (thi < 78) {
    level = "moderate";   multiplier = 1.5; color = "#FF9800";
    label = "Moderate heat stress — +50% water";
    tip   = `THI ${thi.toFixed(0)}. Provide shade and increase water availability by 50%. Check cattle twice daily.`;
  } else if (thi < 84) {
    level = "severe";     multiplier = 2.0; color = "#f44336";
    label = "Severe heat stress — double water supply";
    tip   = `THI ${thi.toFixed(0)}. Emergency cooling required. Double water supply. Move animals to shade immediately.`;
  } else {
    level = "critical";   multiplier = 2.5; color = "#9C27B0";
    label = "Extreme heat — emergency livestock protocol";
    tip   = `THI ${thi.toFixed(0)}. Extreme danger. Activate emergency water reserves. Livestock mortality risk is high.`;
  }

  return { level, multiplier, thi: parseFloat(thi.toFixed(1)), color, label, tip };
};

// ── 5. River / Dam Outlook ────────────────────────────────────────────────
/**
 * Give a weekly outlook on surface water based on rain forecast totals.
 *
 * @param {number[]} dailyPrecipArr   - Array of 7 daily precipitation values (mm)
 * @param {number}   avgTempC         - Average temperature this week
 * @returns {{ outlook, color, label, tip, totalRainMm, rainDays }}
 */
export const getSurfaceWaterOutlook = (dailyPrecipArr = [], avgTempC = 25) => {
  const arr        = Array.isArray(dailyPrecipArr) ? dailyPrecipArr : [];
  const totalRain  = arr.reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const rainDays   = arr.filter(v => (parseFloat(v) || 0) >= 1).length;
  const temp       = parseFloat(avgTempC) || 25;
  const netBalance = totalRain - (temp * 0.4 * 7); // crude evaporation estimate

  let outlook, color, label, tip;

  if (netBalance > 30) {
    outlook = "surplus";  color = "#4CAF50";
    label   = "Surface water surplus";
    tip     = `${totalRain.toFixed(1)} mm over 7 days — rivers and dams are likely to rise. Check spillways and flood channels.`;
  } else if (netBalance > 10) {
    outlook = "stable";   color = "#2196F3";
    label   = "Stable surface water levels";
    tip     = `${rainDays} rain day${rainDays !== 1 ? "s" : ""} this week. Maintain normal abstraction rates.`;
  } else if (netBalance > -10) {
    outlook = "marginal"; color = "#FF9800";
    label   = "Marginal — monitor dam levels";
    tip     = `Low net water balance. Reduce non-essential pumping and monitor river flow daily.`;
  } else {
    outlook = "deficit";  color = "#f44336";
    label   = "Water deficit — conservation required";
    tip     = `Only ${totalRain.toFixed(1)} mm expected vs high evaporation (${temp}°C avg). Implement water conservation measures.`;
  }

  return { outlook, color, label, tip, totalRainMm: parseFloat(totalRain.toFixed(1)), rainDays };
};

// ── 6. Generate Ticker Messages ───────────────────────────────────────────
/**
 * Build the array of sliding ticker messages from the full weather object.
 * Returns an array of { emoji, text, color } objects.
 *
 * @param {object} weather  - Shaped weather object from useWeather hook
 * @returns {Array<{ emoji, text, color }>}
 */
export const buildTickerMessages = (weather) => {
  if (!weather) return [];

  const { current, daily, hourly } = weather;
  const today    = daily?.[0]  || {};
  const tomorrow = daily?.[1]  || {};
  const msgs     = [];

  // Current conditions
  msgs.push({
    emoji: current.emoji,
    text:  `${current.temp}°C · ${current.label} · Humidity ${current.humidity}%`,
    color: "#ffffff",
  });

  // Wind
  if (current.windSpeed > 20) {
    msgs.push({
      emoji: "💨",
      text:  `Strong winds: ${current.windSpeed} km/h ${current.windDir}`,
      color: "#90caf9",
    });
  } else {
    msgs.push({
      emoji: "🌬️",
      text:  `Wind: ${current.windSpeed} km/h ${current.windDir} · Pressure ${current.pressure} hPa`,
      color: "#b0bec5",
    });
  }

  // Rain harvest opportunity for today
  const harvest = getRainHarvestOpportunity(today.precipSum || 0);
  if ((today.precipSum || 0) > 0) {
    msgs.push({ emoji: "🪣", text: harvest.label + ` — ~${harvest.litres} L/roof`, color: harvest.color });
  }

  // Tomorrow rain forecast
  const tomorrowRain = tomorrow.precipSum || 0;
  const tomorrowProb = tomorrow.rainProb  || 0;
  if (tomorrowProb >= 50) {
    msgs.push({
      emoji: "🌧️",
      text:  `Tomorrow: ${tomorrowRain.toFixed(1)} mm rain (${tomorrowProb}% chance) — prepare harvesting`,
      color: "#4db6e4",
    });
  } else {
    msgs.push({
      emoji: tomorrow.emoji,
      text:  `Tomorrow: ${tomorrow.tempMax}°C / ${tomorrow.tempMin}°C · ${tomorrow.label}`,
      color: "#cfd8dc",
    });
  }

  // Irrigation advisory
  const irrig = getIrrigationAdvisory(
    today.rainProb || 0,
    today.precipSum || 0,
    current.temp,
    current.humidity,
    today.evaporation || 0
  );
  msgs.push({ emoji: "🌾", text: `Irrigation: ${irrig.label}`, color: irrig.color });

  // Livestock
  const livestock = getLivestockWaterDemand(current.temp, current.humidity);
  if (livestock.level !== "normal") {
    msgs.push({ emoji: "🐄", text: `Livestock: ${livestock.label}`, color: livestock.color });
  }

  // Weekly surface water outlook
  const weekPrecip = daily.map(d => d.precipSum || 0);
  const avgTemp    = daily.reduce((s, d) => s + ((d.tempMax + d.tempMin) / 2), 0) / (daily.length || 1);
  const surface    = getSurfaceWaterOutlook(weekPrecip, avgTemp);
  msgs.push({ emoji: "💧", text: `This week: ${surface.label}`, color: surface.color });

  // UV warning
  if ((today.uvMax || 0) >= 6) {
    msgs.push({
      emoji: "☀️",
      text:  `UV Index ${today.uvMax} — high solar exposure, protect water storage covers`,
      color: "#ffcc02",
    });
  }

  // Borehole risk (approx dry days from hourly rain data)
  const dryDays = daily.filter(d => (d.precipSum || 0) < 1).length;
  const borehole = getBoreholeRisk(dryDays, current.temp, today.precipSum || 0);
  if (borehole.risk !== "low") {
    msgs.push({ emoji: "⛏️", text: `Borehole: ${borehole.label}`, color: borehole.color });
  }

  return msgs;
};
