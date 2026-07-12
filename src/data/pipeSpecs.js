/**
 * Pipe Specification Reference Data
 * All dimensions in mm unless otherwise noted.
 * NPS values are in inches (industry standard).
 */

/** All supported Nominal Pipe Sizes (inches) */
export const NPS_SIZES = [
  0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36,
];

/** All supported pipe schedules */
export const SCHEDULES = [
  '5S', '10S', '10', '20', '30', 'STD', '40', '60', '80', '100', '120', '140', '160', 'XXS',
];

/**
 * NPS (inches) → Outer Diameter (mm)
 * Per ASME B36.10M / B36.19M
 */
export const NPS_TO_OD_MAP = {
  0.5: 21.3,
  0.75: 26.7,
  1: 33.4,
  1.5: 48.3,
  2: 60.3,
  3: 88.9,
  4: 114.3,
  6: 168.3,
  8: 219.1,
  10: 273.1,
  12: 323.9,
  14: 355.6,
  16: 406.4,
  18: 457.2,
  20: 508.0,
  24: 609.6,
  30: 762.0,
  36: 914.4,
};

/**
 * NPS → Schedule → Wall Thickness (mm)
 * Common combinations per ASME B36.10M / B36.19M.
 * Not every NPS/schedule combo exists; missing entries return null from getWallThickness.
 */
export const NPS_TO_WALL_THICKNESS = {
  0.5: {
    '5S': 1.24, '10S': 1.65, '10': 1.65, 'STD': 2.77, '40': 2.77,
    '80': 3.73, '160': 4.75, 'XXS': 7.47,
  },
  0.75: {
    '5S': 1.24, '10S': 1.65, '10': 1.65, 'STD': 2.87, '40': 2.87,
    '80': 3.91, '160': 5.56, 'XXS': 7.82,
  },
  1: {
    '5S': 1.24, '10S': 1.65, '10': 1.65, 'STD': 3.38, '40': 3.38,
    '80': 4.55, '160': 6.35, 'XXS': 9.09,
  },
  1.5: {
    '5S': 1.65, '10S': 2.11, '10': 2.11, 'STD': 3.68, '40': 3.68,
    '80': 5.08, '160': 7.14, 'XXS': 10.16,
  },
  2: {
    '5S': 1.65, '10S': 2.11, '10': 2.11, 'STD': 3.91, '40': 3.91,
    '80': 5.54, '160': 8.74, 'XXS': 11.07,
  },
  3: {
    '5S': 1.65, '10S': 2.11, '10': 2.11, 'STD': 5.49, '40': 5.49,
    '80': 7.62, '160': 11.13, 'XXS': 15.24,
  },
  4: {
    '5S': 1.65, '10S': 2.11, '10': 2.11, '20': 3.05, '30': 3.96,
    'STD': 6.02, '40': 6.02, '60': 7.92, '80': 8.56,
    '100': 11.13, '120': 13.49, '140': 17.12, '160': 17.12, 'XXS': 17.12,
  },
  6: {
    '5S': 1.65, '10S': 2.77, '10': 2.77, '20': 3.40, '30': 4.78,
    'STD': 7.11, '40': 7.11, '60': 9.53, '80': 10.97,
    '100': 14.27, '120': 18.26, '140': 21.95, '160': 21.95, 'XXS': 21.95,
  },
  8: {
    '5S': 1.65, '10S': 2.77, '10': 2.77, '20': 6.35, '30': 7.04,
    'STD': 8.18, '40': 8.18, '60': 10.31, '80': 12.70,
    '100': 15.09, '120': 18.26, '140': 20.62, '160': 23.01, 'XXS': 22.23,
  },
  10: {
    '5S': 1.65, '10S': 3.40, '10': 3.40, '20': 6.35, '30': 7.80,
    'STD': 9.27, '40': 9.27, '60': 12.70, '80': 15.09,
    '100': 18.26, '120': 21.44, '140': 25.40, '160': 28.58, 'XXS': 25.40,
  },
  12: {
    '5S': 1.65, '10S': 3.96, '10': 3.96, '20': 6.35, '30': 8.38,
    'STD': 9.53, '40': 10.31, '60': 14.27, '80': 17.48,
    '100': 21.44, '120': 25.40, '140': 28.58, '160': 33.32, 'XXS': 25.40,
  },
  14: {
    '5S': 1.65, '10S': 3.96, '10': 3.96, '20': 7.92, '30': 9.53,
    'STD': 9.53, '40': 11.13, '60': 15.09, '80': 19.05,
    '100': 23.83, '120': 27.79, '140': 31.75, '160': 35.71, 'XXS': 25.40,
  },
  16: {
    '5S': 1.65, '10S': 3.96, '10': 3.96, '20': 7.92, '30': 9.53,
    'STD': 9.53, '40': 12.70, '60': 16.66, '80': 21.44,
    '100': 26.19, '120': 30.96, '140': 36.53, '160': 40.49, 'XXS': 25.40,
  },
  18: {
    '5S': 1.65, '10S': 3.96, '10': 3.96, '20': 7.92, '30': 11.13,
    'STD': 9.53, '40': 14.27, '60': 19.05, '80': 23.83,
    '100': 29.36, '120': 34.93, '140': 39.67, '160': 45.24, 'XXS': 25.40,
  },
  20: {
    '5S': 1.65, '10S': 3.96, '10': 3.96, '20': 9.53, '30': 12.70,
    'STD': 9.53, '40': 15.09, '60': 20.62, '80': 26.19,
    '100': 32.54, '120': 38.10, '140': 44.45, '160': 50.01, 'XXS': 25.40,
  },
  24: {
    '5S': 1.65, '10S': 3.96, '10': 3.96, '20': 9.53, '30': 14.27,
    'STD': 9.53, '40': 17.48, '60': 24.61, '80': 30.96,
    '100': 38.89, '120': 46.02, '140': 52.37, '160': 59.54, 'XXS': 25.40,
  },
  30: {
    '5S': 1.65, '10S': 3.96, '10': 3.96, '20': 12.70, '30': 15.88,
    'STD': 9.53, '40': 19.05, '60': 28.58, '80': 34.93,
    '100': 42.88, '120': 49.99, '140': 55.56, '160': 62.71, 'XXS': 25.40,
  },
  36: {
    '5S': 1.65, '10S': 3.96, '10': 3.96, '20': 12.70, '30': 15.88,
    'STD': 9.53, '40': 19.05, '60': 28.58, '80': 39.67,
    '100': 47.63, '120': 54.76, '140': 61.92, '160': 69.09, 'XXS': 25.40,
  },
};

/**
 * Standard long-radius 90° elbow center-to-face distance (mm)
 * Per ASME B16.9
 * LR 90 radius = 1.5 × NPS (converted to mm)
 */
export const ELBOW_RADIUS_TABLE = {
  0.5: 38.1,
  0.75: 28.6,
  1: 38.1,
  1.5: 57.2,
  2: 76.2,
  3: 114.3,
  4: 152.4,
  6: 228.6,
  8: 304.8,
  10: 381.0,
  12: 457.2,
  14: 533.4,
  16: 609.6,
  18: 685.8,
  20: 762.0,
  24: 914.4,
  30: 1143.0,
  36: 1371.6,
};

/**
 * Get outer diameter (mm) for a given NPS.
 * @param {number} nps - Nominal pipe size in inches
 * @returns {number|null} Outer diameter in mm, or null if not found
 */
export function getOD(nps) {
  const od = NPS_TO_OD_MAP[nps];
  return od !== undefined ? od : null;
}

/**
 * Get wall thickness (mm) for a given NPS and schedule.
 * @param {number} nps - Nominal pipe size in inches
 * @param {string} schedule - Pipe schedule
 * @returns {number|null} Wall thickness in mm, or null if combination not found
 */
export function getWallThickness(nps, schedule) {
  const npsData = NPS_TO_WALL_THICKNESS[nps];
  if (!npsData) return null;
  const wt = npsData[schedule];
  return wt !== undefined ? wt : null;
}

/**
 * Get standard long-radius 90° elbow center-to-face distance (mm).
 * @param {number} nps - Nominal pipe size in inches
 * @returns {number|null} Elbow radius in mm, or null if not found
 */
export function getElbowRadius(nps) {
  const radius = ELBOW_RADIUS_TABLE[nps];
  return radius !== undefined ? radius : null;
}

/**
 * Get internal diameter (mm) for a given NPS and schedule.
 * ID = OD - 2 × wall thickness
 * @param {number} nps - Nominal pipe size in inches
 * @param {string} schedule - Pipe schedule
 * @returns {number|null} Internal diameter in mm, or null if data not available
 */
export function getInternalDiameter(nps, schedule) {
  const od = getOD(nps);
  const wt = getWallThickness(nps, schedule);
  if (od === null || wt === null) return null;
  return od - 2 * wt;
}
