/**
 * Structural Steel Shape Data
 *
 * All dimensions in mm, weight in kg/m.
 */

/**
 * Common Wide Flange (W) Sections
 * Per AISC Steel Construction Manual
 */
export const W_SHAPES = [
  { name: 'W150x13', depth: 148, width: 100, webThickness: 4.3, flangeThickness: 4.9, weight: 13 },
  { name: 'W150x18', depth: 153, width: 102, webThickness: 5.8, flangeThickness: 7.1, weight: 18 },
  { name: 'W150x22', depth: 152, width: 152, webThickness: 5.8, flangeThickness: 6.6, weight: 22 },
  { name: 'W150x30', depth: 157, width: 153, webThickness: 6.6, flangeThickness: 9.3, weight: 30 },
  { name: 'W200x15', depth: 200, width: 100, webThickness: 4.3, flangeThickness: 5.2, weight: 15 },
  { name: 'W200x22', depth: 206, width: 102, webThickness: 6.2, flangeThickness: 8.0, weight: 22 },
  { name: 'W200x36', depth: 201, width: 165, webThickness: 6.2, flangeThickness: 10.2, weight: 36 },
  { name: 'W200x46', depth: 203, width: 203, webThickness: 7.2, flangeThickness: 11.0, weight: 46 },
  { name: 'W250x18', depth: 251, width: 101, webThickness: 4.8, flangeThickness: 5.3, weight: 18 },
  { name: 'W250x25', depth: 257, width: 102, webThickness: 6.1, flangeThickness: 8.4, weight: 25 },
  { name: 'W250x33', depth: 258, width: 146, webThickness: 6.1, flangeThickness: 9.1, weight: 33 },
  { name: 'W250x45', depth: 266, width: 148, webThickness: 7.6, flangeThickness: 13.0, weight: 45 },
  { name: 'W250x58', depth: 252, width: 203, webThickness: 8.0, flangeThickness: 13.5, weight: 58 },
  { name: 'W310x21', depth: 303, width: 101, webThickness: 5.1, flangeThickness: 5.7, weight: 21 },
  { name: 'W310x33', depth: 313, width: 102, webThickness: 6.6, flangeThickness: 10.8, weight: 33 },
  { name: 'W310x39', depth: 310, width: 165, webThickness: 5.8, flangeThickness: 9.7, weight: 39 },
  { name: 'W310x52', depth: 317, width: 167, webThickness: 7.6, flangeThickness: 13.2, weight: 52 },
  { name: 'W310x74', depth: 310, width: 205, webThickness: 9.4, flangeThickness: 16.3, weight: 74 },
  { name: 'W360x33', depth: 349, width: 127, webThickness: 5.8, flangeThickness: 8.5, weight: 33 },
  { name: 'W360x45', depth: 352, width: 171, webThickness: 6.9, flangeThickness: 9.8, weight: 45 },
  { name: 'W360x57', depth: 358, width: 172, webThickness: 7.9, flangeThickness: 13.1, weight: 57 },
  { name: 'W360x79', depth: 354, width: 205, webThickness: 9.4, flangeThickness: 16.8, weight: 79 },
  { name: 'W410x39', depth: 399, width: 140, webThickness: 6.4, flangeThickness: 8.8, weight: 39 },
  { name: 'W410x54', depth: 403, width: 177, webThickness: 7.5, flangeThickness: 10.9, weight: 54 },
  { name: 'W410x67', depth: 410, width: 179, webThickness: 8.8, flangeThickness: 14.4, weight: 67 },
  { name: 'W410x85', depth: 417, width: 181, webThickness: 10.9, flangeThickness: 18.2, weight: 85 },
  { name: 'W460x52', depth: 450, width: 152, webThickness: 7.6, flangeThickness: 10.8, weight: 52 },
  { name: 'W460x68', depth: 459, width: 154, webThickness: 9.1, flangeThickness: 15.4, weight: 68 },
  { name: 'W460x89', depth: 463, width: 192, webThickness: 10.5, flangeThickness: 17.7, weight: 89 },
  { name: 'W530x66', depth: 525, width: 165, webThickness: 8.9, flangeThickness: 11.4, weight: 66 },
  { name: 'W530x82', depth: 528, width: 209, webThickness: 9.5, flangeThickness: 13.3, weight: 82 },
  { name: 'W610x82', depth: 599, width: 178, webThickness: 10.0, flangeThickness: 12.8, weight: 82 },
  { name: 'W610x101', depth: 603, width: 228, webThickness: 10.5, flangeThickness: 14.9, weight: 101 },
];

/**
 * Common Hollow Structural Sections (HSS) — Square/Rectangular
 * Dimensions: depth × width × wall thickness, all mm; weight in kg/m
 */
export const HSS_SHAPES = [
  { name: 'HSS76x76x3.2', depth: 76, width: 76, wallThickness: 3.2, weight: 6.87 },
  { name: 'HSS76x76x4.8', depth: 76, width: 76, wallThickness: 4.8, weight: 9.93 },
  { name: 'HSS76x76x6.4', depth: 76, width: 76, wallThickness: 6.4, weight: 12.7 },
  { name: 'HSS102x102x3.2', depth: 102, width: 102, wallThickness: 3.2, weight: 9.45 },
  { name: 'HSS102x102x4.8', depth: 102, width: 102, wallThickness: 4.8, weight: 13.8 },
  { name: 'HSS102x102x6.4', depth: 102, width: 102, wallThickness: 6.4, weight: 17.8 },
  { name: 'HSS102x102x8.0', depth: 102, width: 102, wallThickness: 8.0, weight: 21.4 },
  { name: 'HSS127x127x4.8', depth: 127, width: 127, wallThickness: 4.8, weight: 17.4 },
  { name: 'HSS127x127x6.4', depth: 127, width: 127, wallThickness: 6.4, weight: 22.7 },
  { name: 'HSS127x127x8.0', depth: 127, width: 127, wallThickness: 8.0, weight: 27.5 },
  { name: 'HSS127x127x9.5', depth: 127, width: 127, wallThickness: 9.5, weight: 31.8 },
  { name: 'HSS152x152x4.8', depth: 152, width: 152, wallThickness: 4.8, weight: 21.1 },
  { name: 'HSS152x152x6.4', depth: 152, width: 152, wallThickness: 6.4, weight: 27.6 },
  { name: 'HSS152x152x8.0', depth: 152, width: 152, wallThickness: 8.0, weight: 33.7 },
  { name: 'HSS152x152x9.5', depth: 152, width: 152, wallThickness: 9.5, weight: 39.3 },
  { name: 'HSS152x152x12.7', depth: 152, width: 152, wallThickness: 12.7, weight: 50.1 },
  { name: 'HSS203x203x4.8', depth: 203, width: 203, wallThickness: 4.8, weight: 28.3 },
  { name: 'HSS203x203x6.4', depth: 203, width: 203, wallThickness: 6.4, weight: 37.3 },
  { name: 'HSS203x203x8.0', depth: 203, width: 203, wallThickness: 8.0, weight: 45.8 },
  { name: 'HSS203x203x9.5', depth: 203, width: 203, wallThickness: 9.5, weight: 53.7 },
  { name: 'HSS203x203x12.7', depth: 203, width: 203, wallThickness: 12.7, weight: 69.5 },
  { name: 'HSS254x254x6.4', depth: 254, width: 254, wallThickness: 6.4, weight: 47.0 },
  { name: 'HSS254x254x8.0', depth: 254, width: 254, wallThickness: 8.0, weight: 58.0 },
  { name: 'HSS254x254x9.5', depth: 254, width: 254, wallThickness: 9.5, weight: 68.2 },
  { name: 'HSS254x254x12.7', depth: 254, width: 254, wallThickness: 12.7, weight: 88.8 },
  { name: 'HSS305x305x6.4', depth: 305, width: 305, wallThickness: 6.4, weight: 56.7 },
  { name: 'HSS305x305x8.0', depth: 305, width: 305, wallThickness: 8.0, weight: 70.1 },
  { name: 'HSS305x305x9.5', depth: 305, width: 305, wallThickness: 9.5, weight: 82.6 },
  { name: 'HSS305x305x12.7', depth: 305, width: 305, wallThickness: 12.7, weight: 108.0 },
  { name: 'HSS152x102x4.8', depth: 152, width: 102, wallThickness: 4.8, weight: 17.4 },
  { name: 'HSS152x102x6.4', depth: 152, width: 102, wallThickness: 6.4, weight: 22.7 },
  { name: 'HSS203x102x4.8', depth: 203, width: 102, wallThickness: 4.8, weight: 21.1 },
  { name: 'HSS203x102x6.4', depth: 203, width: 102, wallThickness: 6.4, weight: 27.6 },
  { name: 'HSS203x152x6.4', depth: 203, width: 152, wallThickness: 6.4, weight: 32.5 },
  { name: 'HSS254x152x6.4', depth: 254, width: 152, wallThickness: 6.4, weight: 37.3 },
];

/**
 * Get W-shape options for dropdown selectors.
 * @returns {Array<{ value: string, label: string }>}
 */
export function getWShapeOptions() {
  return W_SHAPES.map((s) => ({
    value: s.name,
    label: `${s.name} (${s.weight} kg/m)`,
  }));
}

/**
 * Get HSS options for dropdown selectors.
 * @returns {Array<{ value: string, label: string }>}
 */
export function getHSSOptions() {
  return HSS_SHAPES.map((s) => ({
    value: s.name,
    label: `${s.name} (${s.weight} kg/m)`,
  }));
}

/**
 * Find a W-shape by name.
 * @param {string} name
 * @returns {object|null}
 */
export function getWShape(name) {
  return W_SHAPES.find((s) => s.name === name) || null;
}

/**
 * Find an HSS shape by name.
 * @param {string} name
 * @returns {object|null}
 */
export function getHSSShape(name) {
  return HSS_SHAPES.find((s) => s.name === name) || null;
}
