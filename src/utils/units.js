/**
 * Unit conversion utilities
 * Internal unit: meters
 */

export const MM_PER_M = 1000;
export const INCH_PER_M = 39.3701;
export const M_PER_INCH = 0.0254;
export const M_PER_FT = 0.3048;

export const toMM = (meters) => meters * MM_PER_M;
export const fromMM = (mm) => mm / MM_PER_M;
export const toInches = (meters) => meters * INCH_PER_M;
export const fromInches = (inches) => inches * M_PER_INCH;
export const toFeet = (meters) => meters / M_PER_FT;
export const fromFeet = (feet) => feet * M_PER_FT;

/** Convert NPS (inches) to outer diameter in meters */
export const npsToOD = (nps) => {
  const npsTable = {
    0.5: 0.02134, 0.75: 0.02667, 1: 0.03340, 1.5: 0.04826,
    2: 0.06033, 3: 0.08890, 4: 0.11430, 6: 0.16830,
    8: 0.21910, 10: 0.27310, 12: 0.32390, 14: 0.35560,
    16: 0.40640, 18: 0.45720, 20: 0.50800, 24: 0.60960,
    30: 0.76200, 36: 0.91440,
  };
  return npsTable[nps] || nps * M_PER_INCH;
};

/** Format a meter value for display */
export const formatMeters = (val, decimals = 2) => {
  return `${val.toFixed(decimals)} m`;
};

export const formatMM = (val, decimals = 0) => {
  return `${toMM(val).toFixed(decimals)} mm`;
};

/** Degrees ↔ Radians */
export const degToRad = (deg) => (deg * Math.PI) / 180;
export const radToDeg = (rad) => (rad * 180) / Math.PI;
