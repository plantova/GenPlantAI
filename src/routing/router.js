import { findPath } from './astar.js';
import { buildOccupancyGrid, worldToGrid, gridToWorld } from './gridBuilder.js';
import { convertPathToSegments, calculateTotalLength, countElbows, normalizePipeSegments } from './elbowInserter.js';
import { checkFlexibility } from './flexibilityCheck.js';

/**
 * Route a pipe automatically using A* pathfinding.
 * @param {[number,number,number]} fromPos  world position of start
 * @param {[number,number,number]} toPos    world position of end
 * @param {Array} equipment  equipment items from store
 * @param {Array} structures structure items from store
 * @param {Object} pipeData  { nominalSize, schedule, material, designTemperature, designPressure }
 * @returns {{ success, segments, totalLength, elbowCount90, elbowCount45, flexibilityStatus, errors }}
 */
export function routePipe(fromPos, toPos, equipment, structures, pipeData) {
  const errors = [];

  try {
    // Build occupancy grid around the routing area
    const gridInfo = buildOccupancyGrid(equipment, structures, {
      resolution: 1.0,
      padding: 2.0,
      extraBounds: 30,
      startPos: fromPos,
      endPos: toPos,
    });

    const startGrid = worldToGrid(fromPos, gridInfo);
    const endGrid = worldToGrid(toPos, gridInfo);

    // Run A* pathfinding
    const rawPath = findPath(gridInfo, startGrid, endGrid, {
      bendPenalty: 2.0,
      elevationPenalty: 1.5,
      corridorBonus: 0.5,
      maxIterations: 200000,
    });

    if (!rawPath || rawPath.length === 0) {
      return {
        success: false,
        segments: [],
        totalLength: 0,
        elbowCount90: 0,
        elbowCount45: 0,
        flexibilityStatus: null,
        errors: ['No valid path found between the two points. Try repositioning equipment or adding pipe rack corridors.'],
      };
    }

    // Convert grid path → world segments with elbows
    const segments = convertPathToSegments(rawPath, pipeData.nominalSize, gridInfo);
    const totalLength = calculateTotalLength(segments);
    const elbowCount90 = countElbows(segments, 90);
    const elbowCount45 = countElbows(segments, 45);

    // Run flexibility check
    const flexibilityStatus = checkFlexibility(
      segments,
      pipeData.designTemperature || 20,
      20, // ambient
      pipeData.material || 'CS-A106B',
      pipeData.nominalSize || 6
    );

    return {
      success: true,
      segments,
      totalLength,
      elbowCount90,
      elbowCount45,
      flexibilityStatus,
      errors,
    };
  } catch (err) {
    return {
      success: false,
      segments: [],
      totalLength: 0,
      elbowCount90: 0,
      elbowCount45: 0,
      flexibilityStatus: null,
      errors: [`Routing error: ${err.message}`],
    };
  }
}

/**
 * Route a pipe manually through user-specified waypoints.
 * Automatically inserts orthogonal segments and elbows between each pair.
 * @param {Array<[number,number,number]>} waypoints  array of world positions
 * @param {Object} pipeData
 * @returns same format as routePipe
 */
export function routeManual(waypoints, pipeData) {
  if (!waypoints || waypoints.length < 2) {
    return {
      success: false,
      segments: [],
      totalLength: 0,
      elbowCount90: 0,
      elbowCount45: 0,
      flexibilityStatus: null,
      errors: ['At least 2 waypoints are required'],
    };
  }

  const rawSegments = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const orthogSegs = buildOrthogonalSegments(from, to, pipeData.nominalSize);
    rawSegments.push(...orthogSegs);
  }

  const segments = normalizePipeSegments(rawSegments, pipeData.nominalSize);

  const totalLength = calculateTotalLength(segments);
  const elbowCount90 = countElbows(segments, 90);
  const elbowCount45 = countElbows(segments, 45);

  const flexibilityStatus = checkFlexibility(
    segments,
    pipeData.designTemperature || 20,
    20,
    pipeData.material || 'CS-A106B',
    pipeData.nominalSize || 6
  );

  return {
    success: true,
    segments,
    totalLength,
    elbowCount90,
    elbowCount45,
    flexibilityStatus,
    errors: [],
  };
}

/**
 * Build orthogonal (Manhattan) path segments between two points.
 * Strategy: X first, then Y (elevation), then Z.
 */
function buildOrthogonalSegments(from, to, nominalSize) {
  const segments = [];
  const [x1, y1, z1] = from;
  const [x2, y2, z2] = to;

  const elbowRadius = 0.05 * (nominalSize || 6); // simplified radius

  let cur = [x1, y1, z1];

  // Go X
  if (Math.abs(x2 - x1) > 0.001) {
    const next = [x2, y1, z1];
    const length = Math.abs(x2 - x1);
    segments.push({ type: 'pipe', start: [...cur], end: [...next], length, direction: x2 > x1 ? 'x+' : 'x-' });

    // Elbow if there's more to go
    if (Math.abs(y2 - y1) > 0.001 || Math.abs(z2 - z1) > 0.001) {
      const nextDir = Math.abs(y2 - y1) > 0.001 ? (y2 > y1 ? 'y+' : 'y-') : (z2 > z1 ? 'z+' : 'z-');
      segments.push({ type: 'elbow', center: [...next], angle: 90, radius: elbowRadius, fromDir: x2 > x1 ? 'x+' : 'x-', toDir: nextDir });
    }
    cur = next;
  }

  // Go Y
  if (Math.abs(y2 - y1) > 0.001) {
    const next = [x2, y2, z1];
    const length = Math.abs(y2 - y1);
    segments.push({ type: 'pipe', start: [...cur], end: [...next], length, direction: y2 > y1 ? 'y+' : 'y-' });

    if (Math.abs(z2 - z1) > 0.001) {
      const nextDir = z2 > z1 ? 'z+' : 'z-';
      segments.push({ type: 'elbow', center: [...next], angle: 90, radius: elbowRadius, fromDir: y2 > y1 ? 'y+' : 'y-', toDir: nextDir });
    }
    cur = next;
  }

  // Go Z
  if (Math.abs(z2 - z1) > 0.001) {
    const next = [x2, y2, z2];
    const length = Math.abs(z2 - z1);
    segments.push({ type: 'pipe', start: [...cur], end: [...next], length, direction: z2 > z1 ? 'z+' : 'z-' });
    cur = next;
  }

  return segments;
}
