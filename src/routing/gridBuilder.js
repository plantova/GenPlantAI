/**
 * 3D Occupancy Grid Builder
 *
 * Voxelizes the scene into a Uint8Array grid for A* pathfinding.
 * Grid values: 0 = free, 1 = blocked (obstacle), 2 = corridor (pipe rack level)
 *
 * Coordinate convention: Y-up (elevation).
 */

/**
 * Compute axis-aligned bounding box for a single equipment item.
 * Returns { min: [x,y,z], max: [x,y,z] } in world coordinates.
 * @param {object} item - Equipment item from project store
 * @returns {{ min: number[], max: number[] }}
 */
function equipmentAABB(item) {
  const [px, py, pz] = item.position;
  const dims = item.dimensions;
  let halfW, halfD, h;

  switch (item.type) {
    case 'column': {
      const r = (dims.diameter || 2) / 2;
      h = dims.height || 20;
      return {
        min: [px - r, py, pz - r],
        max: [px + r, py + h, pz + r],
      };
    }
    case 'horizontalVessel': {
      const r = (dims.diameter || 2) / 2;
      const len = dims.length || 6;
      const saddleH = dims.saddleHeight || 1;
      return {
        min: [px - len / 2, py, pz - r],
        max: [px + len / 2, py + saddleH + dims.diameter, pz + r],
      };
    }
    case 'sphericalTank': {
      const r = (dims.diameter || 10) / 2;
      const legH = dims.legHeight || 5;
      return {
        min: [px - r, py, pz - r],
        max: [px + r, py + legH + dims.diameter, pz + r],
      };
    }
    case 'sruFurnace': {
      halfW = (dims.width || 6) / 2;
      halfD = (dims.depth || 4) / 2;
      h = dims.height || 8;
      const stackH = dims.stackHeight || 15;
      return {
        min: [px - halfW, py, pz - halfD],
        max: [px + halfW, py + h + stackH, pz + halfD],
      };
    }
    case 'airCooler': {
      halfW = (dims.width || 8) / 2;
      halfD = (dims.depth || 3) / 2;
      h = dims.height || 4;
      return {
        min: [px - halfW, py, pz - halfD],
        max: [px + halfW, py + h, pz + halfD],
      };
    }
    default: {
      // Generic 2m cube fallback
      return {
        min: [px - 1, py, pz - 1],
        max: [px + 1, py + 2, pz + 1],
      };
    }
  }
}

/**
 * Convert a world-space position to grid coordinates.
 * Coordinates are clamped to grid bounds.
 * @param {{ x: number, y: number, z: number } | number[]} worldPos
 * @param {{ width: number, height: number, depth: number, resolution: number, origin: { x: number, y: number, z: number } }} gridInfo
 * @returns {{ x: number, y: number, z: number }}
 */
export function worldToGrid(worldPos, gridInfo) {
  const wx = Array.isArray(worldPos) ? worldPos[0] : worldPos.x;
  const wy = Array.isArray(worldPos) ? worldPos[1] : worldPos.y;
  const wz = Array.isArray(worldPos) ? worldPos[2] : worldPos.z;
  const { resolution, origin, width, height, depth } = gridInfo;
  return {
    x: Math.max(0, Math.min(width - 1, Math.round((wx - origin.x) / resolution))),
    y: Math.max(0, Math.min(height - 1, Math.round((wy - origin.y) / resolution))),
    z: Math.max(0, Math.min(depth - 1, Math.round((wz - origin.z) / resolution))),
  };
}

/**
 * Convert grid coordinates to world-space position.
 * @param {{ x: number, y: number, z: number }} gridPos
 * @param {{ resolution: number, origin: { x: number, y: number, z: number } }} gridInfo
 * @returns {number[]} [x, y, z] in meters
 */
export function gridToWorld(gridPos, gridInfo) {
  const { resolution, origin } = gridInfo;
  return [
    origin.x + gridPos.x * resolution,
    origin.y + gridPos.y * resolution,
    origin.z + gridPos.z * resolution,
  ];
}

/**
 * Mark cells within an AABB as a given value on the grid.
 * @param {Uint8Array} grid
 * @param {{ min: number[], max: number[] }} aabb - World-space AABB
 * @param {number} value - Grid cell value (1=blocked, 2=corridor)
 * @param {number} padding - Extra meters to expand the AABB by
 * @param {object} gridInfo
 */
function markAABB(grid, aabb, value, padding, gridInfo) {
  const { width, height, depth, resolution, origin } = gridInfo;

  const minG = {
    x: Math.max(0, Math.floor((aabb.min[0] - padding - origin.x) / resolution)),
    y: Math.max(0, Math.floor((aabb.min[1] - padding - origin.y) / resolution)),
    z: Math.max(0, Math.floor((aabb.min[2] - padding - origin.z) / resolution)),
  };
  const maxG = {
    x: Math.min(width - 1, Math.ceil((aabb.max[0] + padding - origin.x) / resolution)),
    y: Math.min(height - 1, Math.ceil((aabb.max[1] + padding - origin.y) / resolution)),
    z: Math.min(depth - 1, Math.ceil((aabb.max[2] + padding - origin.z) / resolution)),
  };

  for (let z = minG.z; z <= maxG.z; z++) {
    for (let y = minG.y; y <= maxG.y; y++) {
      for (let x = minG.x; x <= maxG.x; x++) {
        const idx = x + y * width + z * width * height;
        // Don't downgrade a blocked cell to corridor
        if (value === 2 && grid[idx] === 1) continue;
        grid[idx] = value;
      }
    }
  }
}

/**
 * Build a 3D occupancy grid from scene equipment and structures.
 *
 * @param {Array<object>} equipment  - Array of equipment items from project store
 * @param {Array<object>} structures - Array of structural items from project store
 * @param {object} [options]
 * @param {number} [options.resolution=0.5]   - Grid cell size in meters
 * @param {number} [options.padding=2.0]      - Obstacle inflation in meters
 * @param {number} [options.extraBounds=20]   - Extra margin around scene bounds in meters
 * @param {{ x: number, y: number, z: number }} [options.startPos] - Start position to include in bounds
 * @param {{ x: number, y: number, z: number }} [options.endPos]   - End position to include in bounds
 * @returns {{ grid: Uint8Array, width: number, height: number, depth: number, resolution: number, origin: { x: number, y: number, z: number } }}
 */
export function buildOccupancyGrid(equipment, structures, options = {}) {
  const {
    resolution = 0.5,
    padding = 2.0,
    extraBounds = 20,
    startPos,
    endPos,
  } = options;

  // ─── 1. Calculate scene bounds ───
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  const expandBounds = (min, max) => {
    if (min[0] < minX) minX = min[0];
    if (min[1] < minY) minY = min[1];
    if (min[2] < minZ) minZ = min[2];
    if (max[0] > maxX) maxX = max[0];
    if (max[1] > maxY) maxY = max[1];
    if (max[2] > maxZ) maxZ = max[2];
  };

  const equipAABBs = [];
  for (const eq of equipment) {
    const aabb = equipmentAABB(eq);
    equipAABBs.push({ item: eq, aabb });
    expandBounds(aabb.min, aabb.max);
  }

  // Include start/end positions in bounds
  if (startPos) {
    const sp = Array.isArray(startPos) ? startPos : [startPos.x, startPos.y, startPos.z];
    expandBounds(sp, sp);
  }
  if (endPos) {
    const ep = Array.isArray(endPos) ? endPos : [endPos.x, endPos.y, endPos.z];
    expandBounds(ep, ep);
  }

  // Include structures in bounds
  for (const str of structures) {
    const [sx, sy, sz] = str.position || [0, 0, 0];
    const baysX = str.baysX || 3;
    const baysZ = str.baysZ || 1;
    const bayW = str.bayWidth || 6;
    const bayL = str.bayLength || 6;
    const levels = str.levels || [{ elevation: 4 }];
    const maxElev = Math.max(...levels.map((l) => l.elevation || 4));

    expandBounds(
      [sx, sy, sz],
      [sx + baysX * bayW, sy + maxElev + 2, sz + baysZ * bayL]
    );
  }

  // Handle empty scene
  if (!isFinite(minX)) {
    minX = -50; minY = 0; minZ = -50;
    maxX = 50; maxY = 20; maxZ = 50;
  }

  // Add extra margin
  minX -= extraBounds;
  minY = Math.min(minY, 0) - 2; // Keep ground level accessible
  minZ -= extraBounds;
  maxX += extraBounds;
  maxY += extraBounds;
  maxZ += extraBounds;

  const origin = { x: minX, y: minY, z: minZ };
  const width = Math.ceil((maxX - minX) / resolution) + 1;
  const height = Math.ceil((maxY - minY) / resolution) + 1;
  const depth = Math.ceil((maxZ - minZ) / resolution) + 1;

  const totalCells = width * height * depth;
  const grid = new Uint8Array(totalCells);

  const gridInfo = { grid, width, height, depth, resolution, origin };

  // ─── 2. Mark equipment as blocked (1) ───
  for (const { aabb } of equipAABBs) {
    markAABB(grid, aabb, 1, padding, gridInfo);
  }

  // ─── 3. Mark structural steel ───
  for (const str of structures) {
    const [sx, sy, sz] = str.position || [0, 0, 0];
    const baysX = str.baysX || 3;
    const baysZ = str.baysZ || 1;
    const bayW = str.bayWidth || 6;
    const bayL = str.bayLength || 6;
    const colSize = str.columnSize || { w: 0.3, d: 0.3 };
    const beamSize = str.beamSize || { w: 0.3, h: 0.4 };
    const levels = str.levels || [{ elevation: 4 }];

    // Mark columns as blocked
    for (let ix = 0; ix <= baysX; ix++) {
      for (let iz = 0; iz <= baysZ; iz++) {
        const cx = sx + ix * bayW;
        const cz = sz + iz * bayL;
        const maxElev = Math.max(...levels.map((l) => l.elevation || 4));

        const colAABB = {
          min: [cx - colSize.w / 2, sy, cz - colSize.d / 2],
          max: [cx + colSize.w / 2, sy + maxElev, cz + colSize.d / 2],
        };
        markAABB(grid, colAABB, 1, 0.1, gridInfo);
      }
    }

    // Mark beams as blocked at each level
    for (const level of levels) {
      const elev = level.elevation || 4;

      // Beams along X direction
      for (let iz = 0; iz <= baysZ; iz++) {
        const bz = sz + iz * bayL;
        const beamAABB = {
          min: [sx, sy + elev - beamSize.h, bz - beamSize.w / 2],
          max: [sx + baysX * bayW, sy + elev, bz + beamSize.w / 2],
        };
        markAABB(grid, beamAABB, 1, 0.1, gridInfo);
      }

      // Beams along Z direction
      for (let ix = 0; ix <= baysX; ix++) {
        const bx = sx + ix * bayW;
        const beamAABB = {
          min: [bx - beamSize.w / 2, sy + elev - beamSize.h, sz],
          max: [bx + beamSize.w / 2, sy + elev, sz + baysZ * bayL],
        };
        markAABB(grid, beamAABB, 1, 0.1, gridInfo);
      }

      // Mark pipe rack corridor zone at this level
      // The corridor is the space ABOVE the beam at each level
      const corridorAABB = {
        min: [sx, sy + elev + 0.1, sz],
        max: [sx + baysX * bayW, sy + elev + 1.5, sz + baysZ * bayL],
      };
      markAABB(grid, corridorAABB, 2, 0, gridInfo);
    }
  }

  return gridInfo;
}
