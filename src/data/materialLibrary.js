/**
 * Material Specification Library
 *
 * Properties:
 *   name         — Human-readable name
 *   spec         — ASTM specification
 *   maxTemp      — Maximum service temperature (°C)
 *   minTemp      — Minimum service temperature (°C)
 *   density      — Material density (kg/m³)
 *   expansion    — Coefficient of thermal expansion (1/°C)
 */

export const PIPE_MATERIALS = {
  'CS-A106B': {
    name: 'Carbon Steel',
    spec: 'ASTM A106 Gr.B',
    maxTemp: 427,
    minTemp: -29,
    density: 7850,
    expansion: 11.7e-6,
  },
  'SS304-A312': {
    name: 'SS 304',
    spec: 'ASTM A312 TP304',
    maxTemp: 816,
    minTemp: -254,
    density: 7900,
    expansion: 17.3e-6,
  },
  'SS316-A312': {
    name: 'SS 316',
    spec: 'ASTM A312 TP316',
    maxTemp: 816,
    minTemp: -254,
    density: 7980,
    expansion: 15.9e-6,
  },
  'ALLOY-A335P11': {
    name: 'Alloy Steel',
    spec: 'ASTM A335 P11',
    maxTemp: 593,
    minTemp: -29,
    density: 7850,
    expansion: 12.3e-6,
  },
};

/**
 * Get a single material by its ID.
 * @param {string} materialId - Key in PIPE_MATERIALS (e.g. 'CS-A106B')
 * @returns {object|null} Material record or null
 */
export function getMaterial(materialId) {
  const mat = PIPE_MATERIALS[materialId];
  return mat ? { id: materialId, ...mat } : null;
}

/**
 * Get all materials as an array of { id, ...props }.
 * @returns {Array<object>}
 */
export function getAllMaterials() {
  return Object.entries(PIPE_MATERIALS).map(([id, props]) => ({
    id,
    ...props,
  }));
}

/**
 * Get material options formatted for dropdown selectors.
 * @returns {Array<{ value: string, label: string }>}
 */
export function getMaterialOptions() {
  return Object.entries(PIPE_MATERIALS).map(([id, props]) => ({
    value: id,
    label: `${props.name} (${props.spec})`,
  }));
}
