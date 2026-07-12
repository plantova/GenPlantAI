/**
 * Elbow Inserter
 *
 * Converts a raw A* grid path (array of {x,y,z} grid cells) into
 * engineering segments — straight pipe runs and elbows at direction changes.
 */

import { getElbowRadius } from '../data/pipeSpecs.js';
import { gridToWorld } from './gridBuilder.js';

/**
 * Direction labels for each axis movement.
 * @param {number} dx
 * @param {number} dy
 * @param {number} dz
 * @returns {string}
 */
function directionLabel(dx, dy, dz) {
  if (dx > 0) return 'x+';
  if (dx < 0) return 'x-';
  if (dy > 0) return 'y+';
  if (dy < 0) return 'y-';
  if (dz > 0) return 'z+';
  if (dz < 0) return 'z-';
  return 'none';
}

/**
 * Calculate the angle between two direction vectors (simple 90° detection).
 * On a 6-connected grid all turns are 90°.
 * @param {string} fromDir
 * @param {string} toDir
 * @returns {number} angle in degrees (always 90 for orthogonal turns)
 */
function angleBetween(fromDir, toDir) {
  if (fromDir === toDir) return 0;
  // Opposite directions shouldn't occur in a valid path, but treat as 180
  const axis1 = fromDir[0];
  const axis2 = toDir[0];
  if (axis1 === axis2) return 180;
  return 90;
}

/**
 * Euclidean distance between two [x,y,z] world points.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function dist3(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Convert a grid path from A* into pipe segments and elbows.
 *
 * @param {Array<{ x: number, y: number, z: number }>} gridPath - Ordered grid coordinates from A*
 * @param {number} pipeSize - NPS in inches (for elbow radius lookup)
 * @param {{ resolution: number, origin: { x: number, y: number, z: number } }} gridInfo
 * @returns {Array<object>} Array of segment objects:
 *   Pipe:  { type: 'pipe', start: [x,y,z], end: [x,y,z], length: number, direction: string }
 *   Elbow: { type: 'elbow', center: [x,y,z], angle: number, radius: number, fromDir: string, toDir: string }
 */
export function convertPathToSegments(gridPath, pipeSize, gridInfo) {
  if (!gridPath || gridPath.length < 2) return [];

  const elbowRadiusMm = getElbowRadius(pipeSize) || 152.4; // default 6" if not found
  const elbowRadiusM = elbowRadiusMm / 1000;

  // Convert all grid points to world coordinates
  const worldPoints = gridPath.map((gp) => gridToWorld(gp, gridInfo));

  // Walk the path and detect direction changes
  const segments = [];
  let runStart = worldPoints[0];
  let prevDir = directionLabel(
    gridPath[1].x - gridPath[0].x,
    gridPath[1].y - gridPath[0].y,
    gridPath[1].z - gridPath[0].z
  );

  for (let i = 2; i < gridPath.length; i++) {
    const dx = gridPath[i].x - gridPath[i - 1].x;
    const dy = gridPath[i].y - gridPath[i - 1].y;
    const dz = gridPath[i].z - gridPath[i - 1].z;
    const curDir = directionLabel(dx, dy, dz);

    if (curDir !== prevDir) {
      // End the current straight run at the direction-change point
      const turnPoint = worldPoints[i - 1];

      // Pipe segment before the turn
      const pipeLength = dist3(runStart, turnPoint);
      if (pipeLength > 1e-6) {
        segments.push({
          type: 'pipe',
          start: [...runStart],
          end: [...turnPoint],
          length: pipeLength,
          direction: prevDir,
        });
      }

      // Elbow at the turn
      const angle = angleBetween(prevDir, curDir);
      segments.push({
        type: 'elbow',
        center: [...turnPoint],
        angle,
        radius: elbowRadiusM,
        fromDir: prevDir,
        toDir: curDir,
      });

      // Start new run from the turn point
      runStart = turnPoint;
      prevDir = curDir;
    }
  }

  // Final straight segment
  const lastPoint = worldPoints[worldPoints.length - 1];
  const finalLength = dist3(runStart, lastPoint);
  if (finalLength > 1e-6) {
    segments.push({
      type: 'pipe',
      start: [...runStart],
      end: [...lastPoint],
      length: finalLength,
      direction: prevDir,
    });
  }

  return normalizePipeSegments(segments, pipeSize);
}

/**
 * Normalize and ensure every direction turn between pipe runs has exactly one elbow segment,
 * and merge consecutive collinear pipe segments.
 * @param {Array<object>} segments - Raw or existing segments array
 * @param {number} pipeSize - NPS in inches
 * @returns {Array<object>} Cleaned, exact segments with accurate elbows and lengths
 */
export function normalizePipeSegments(segments, pipeSize) {
  if (!segments || !Array.isArray(segments) || segments.length === 0) return [];

  const elbowRadiusMm = getElbowRadius(pipeSize) || 152.4;
  const elbowRadiusM = elbowRadiusMm / 1000;

  const result = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = { ...segments[i] };

    if (seg.type === 'pipe') {
      if (!seg.start || !seg.end) continue;
      const length = dist3(seg.start, seg.end);
      if (length < 1e-5) continue; // skip zero length pipes

      seg.length = length;
      if (!seg.direction || seg.direction === 'none') {
        const dx = seg.end[0] - seg.start[0];
        const dy = seg.end[1] - seg.start[1];
        const dz = seg.end[2] - seg.start[2];
        seg.direction = directionLabel(dx, dy, dz);
      }

      const prev = result.length > 0 ? result[result.length - 1] : null;

      if (prev && prev.type === 'pipe') {
        // Check if collinear and continuous
        if (prev.direction === seg.direction && dist3(prev.end, seg.start) < 0.1) {
          prev.end = [...seg.end];
          prev.length = dist3(prev.start, prev.end);
          continue;
        }

        // If direction changes and no elbow was present between them, insert one
        if (prev.direction !== seg.direction && dist3(prev.end, seg.start) < 0.5) {
          const angle = angleBetween(prev.direction, seg.direction);
          result.push({
            type: 'elbow',
            center: [...prev.end],
            angle: angle || 90,
            radius: elbowRadiusM,
            fromDir: prev.direction,
            toDir: seg.direction,
          });
        }
      }

      result.push(seg);
    } else if (seg.type === 'elbow') {
      const prev = result.length > 0 ? result[result.length - 1] : null;
      // Avoid duplicate elbows at the same center
      if (prev && prev.type === 'elbow' && seg.center && prev.center && dist3(prev.center, seg.center) < 0.1) {
        continue;
      }
      seg.angle = seg.angle || 90;
      seg.radius = seg.radius || elbowRadiusM;
      result.push(seg);
    }
  }

  return result;
}

/**
 * Sum the length of all pipe segments (excludes elbows).
 * @param {Array<object>} segments
 * @returns {number} Total length in meters
 */
export function calculateTotalLength(segments) {
  let total = 0;
  for (const seg of segments) {
    if (seg.type === 'pipe') {
      total += seg.length;
    }
  }
  return total;
}

/**
 * Count elbows in a segment array, optionally filtered by angle.
 * @param {Array<object>} segments
 * @param {number} [angleFilter] - If provided, only count elbows with this angle
 * @returns {number}
 */
export function countElbows(segments, angleFilter) {
  let count = 0;
  for (const seg of segments) {
    if (seg.type === 'elbow') {
      if (angleFilter === undefined || seg.angle === angleFilter) {
        count++;
      }
    }
  }
  return count;
}
