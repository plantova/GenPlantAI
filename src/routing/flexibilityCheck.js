/**
 * Simplified Pipe Flexibility Check
 *
 * Based on ASME B31.3 simplified flexibility criterion (L²/D ratio).
 * Calculates thermal expansion and checks if the longest straight run
 * requires expansion loops or flexibility analysis.
 */

import { getMaterial } from '../data/materialLibrary.js';
import { getOD } from '../data/pipeSpecs.js';

/**
 * Allowable L²/D thresholds by material family.
 * Simplified from ASME B31.3 empirical criterion:
 *   L² / D ≤ 208,000 × Sa / Ea
 * where Sa = allowable stress range, Ea = modulus of elasticity.
 * The ratio Sa/Ea is roughly constant for a material family at moderate temps.
 *
 * Values below are conservative approximations.
 */
const LD_THRESHOLDS = {
  'CS-A106B': 200000,      // Carbon steel — moderate temp
  'SS304-A312': 220000,    // SS304 — higher expansion but higher allowable
  'SS316-A312': 220000,    // SS316 — similar to 304
  'ALLOY-A335P11': 190000, // Alloy — high temp service, slightly lower
};

/** Default threshold when material not matched */
const DEFAULT_THRESHOLD = 200000;

/**
 * Run a simplified flexibility check on a set of pipe segments.
 *
 * @param {Array<object>} segments - Pipe and elbow segments from elbowInserter
 * @param {number} designTemp    - Design temperature (°C)
 * @param {number} ambientTemp   - Ambient / installation temperature (°C)
 * @param {string} materialId    - Material key (e.g. 'CS-A106B')
 * @param {number} pipeSize      - NPS in inches
 * @returns {{
 *   status: 'pass'|'warning'|'fail',
 *   messages: string[],
 *   maxStraightRun: number,
 *   thermalExpansion: number,
 *   ldRatio: number,
 *   threshold: number,
 * }}
 */
export function checkFlexibility(segments, designTemp, ambientTemp, materialId, pipeSize) {
  const messages = [];

  // ─── Material data ───
  const mat = getMaterial(materialId);
  if (!mat) {
    return {
      status: 'warning',
      messages: [`Material "${materialId}" not found in library. Flexibility not evaluated.`],
      maxStraightRun: 0,
      thermalExpansion: 0,
      ldRatio: 0,
      threshold: 0,
    };
  }

  // ─── Pipe OD ───
  const odMm = getOD(pipeSize);
  if (!odMm) {
    return {
      status: 'warning',
      messages: [`NPS ${pipeSize}" not found in pipe specs. Flexibility not evaluated.`],
      maxStraightRun: 0,
      thermalExpansion: 0,
      ldRatio: 0,
      threshold: 0,
    };
  }

  // ─── Temperature check ───
  const deltaT = designTemp - ambientTemp; // °C
  if (Math.abs(deltaT) < 1) {
    return {
      status: 'pass',
      messages: ['Temperature differential is negligible. No flexibility concern.'],
      maxStraightRun: 0,
      thermalExpansion: 0,
      ldRatio: 0,
      threshold: 0,
    };
  }

  // Check against material temperature limits
  if (designTemp > mat.maxTemp) {
    messages.push(
      `Design temp ${designTemp}°C exceeds material max ${mat.maxTemp}°C for ${mat.spec}.`
    );
  }
  if (designTemp < mat.minTemp) {
    messages.push(
      `Design temp ${designTemp}°C is below material min ${mat.minTemp}°C for ${mat.spec}.`
    );
  }

  // ─── Find longest straight pipe run ───
  let maxStraightRun = 0; // meters
  for (const seg of segments) {
    if (seg.type === 'pipe' && seg.length > maxStraightRun) {
      maxStraightRun = seg.length;
    }
  }

  if (maxStraightRun < 0.001) {
    return {
      status: 'pass',
      messages: ['No significant straight pipe runs found.'],
      maxStraightRun: 0,
      thermalExpansion: 0,
      ldRatio: 0,
      threshold: 0,
    };
  }

  // ─── Thermal expansion calculation ───
  // α = coefficient of thermal expansion (1/°C)
  const alpha = mat.expansion; // e.g. 11.7e-6 for CS
  const lengthMm = maxStraightRun * 1000; // convert m → mm
  const thermalExpansion = alpha * lengthMm * Math.abs(deltaT); // mm

  // ─── L²/D ratio check ───
  // L in mm, D (OD) in mm
  const ldRatio = (lengthMm * lengthMm) / odMm;
  const threshold = LD_THRESHOLDS[materialId] || DEFAULT_THRESHOLD;

  let status = 'pass';

  if (ldRatio > threshold) {
    status = 'fail';
    messages.push(
      `L²/D ratio ${Math.round(ldRatio).toLocaleString()} exceeds allowable ${threshold.toLocaleString()} for ${mat.spec}. ` +
      `Detailed flexibility analysis or expansion loop required.`
    );
  } else if (ldRatio > threshold * 0.8) {
    status = 'warning';
    messages.push(
      `L²/D ratio ${Math.round(ldRatio).toLocaleString()} is within 80% of allowable ${threshold.toLocaleString()}. ` +
      `Consider reviewing flexibility.`
    );
  } else {
    messages.push(
      `L²/D ratio ${Math.round(ldRatio).toLocaleString()} is within allowable ${threshold.toLocaleString()}.`
    );
  }

  // Additional thermal expansion info
  messages.push(
    `Longest straight run: ${maxStraightRun.toFixed(2)} m. ` +
    `Thermal expansion: ${thermalExpansion.toFixed(2)} mm (ΔT = ${deltaT}°C).`
  );

  if (thermalExpansion > 25) {
    if (status === 'pass') status = 'warning';
    messages.push(
      `Thermal expansion ${thermalExpansion.toFixed(1)} mm is significant. Consider expansion loops.`
    );
  }

  return {
    status,
    messages,
    maxStraightRun,
    thermalExpansion,
    ldRatio,
    threshold,
  };
}
