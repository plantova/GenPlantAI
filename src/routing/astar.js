/**
 * 3D A* Pathfinding Engine
 *
 * Grid values:
 *   0 = free space
 *   1 = blocked (obstacle)
 *   2 = corridor (pipe rack — receives cost bonus)
 *
 * Coordinate system follows Y-up convention (Y = elevation).
 */

// ─── 6-connected neighbor offsets: ±X, ±Y, ±Z ───
const NEIGHBORS = [
  { dx:  1, dy:  0, dz:  0, dir: 0 }, // +X
  { dx: -1, dy:  0, dz:  0, dir: 1 }, // -X
  { dx:  0, dy:  1, dz:  0, dir: 2 }, // +Y (up)
  { dx:  0, dy: -1, dz:  0, dir: 3 }, // -Y (down)
  { dx:  0, dy:  0, dz:  1, dir: 4 }, // +Z
  { dx:  0, dy:  0, dz: -1, dir: 5 }, // -Z
];

/**
 * Binary Min-Heap priority queue for A* open set.
 * Compares nodes by their f value (g + h).
 */
class BinaryMinHeap {
  constructor() {
    this._data = [];
    this._size = 0;
  }

  get size() {
    return this._size;
  }

  /**
   * Insert a node into the heap.
   * @param {{ f: number, index: number }} node
   */
  insert(node) {
    this._data[this._size] = node;
    this._size++;
    this._bubbleUp(this._size - 1);
  }

  /**
   * Extract the node with the smallest f value.
   * @returns {{ f: number, index: number } | null}
   */
  extractMin() {
    if (this._size === 0) return null;
    const min = this._data[0];
    this._size--;
    if (this._size > 0) {
      this._data[0] = this._data[this._size];
      this._sinkDown(0);
    }
    return min;
  }

  /** @private */
  _bubbleUp(i) {
    const data = this._data;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (data[i].f < data[parent].f) {
        const tmp = data[i];
        data[i] = data[parent];
        data[parent] = tmp;
        i = parent;
      } else {
        break;
      }
    }
  }

  /** @private */
  _sinkDown(i) {
    const data = this._data;
    const n = this._size;
    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < n && data[left].f < data[smallest].f) {
        smallest = left;
      }
      if (right < n && data[right].f < data[smallest].f) {
        smallest = right;
      }
      if (smallest !== i) {
        const tmp = data[i];
        data[i] = data[smallest];
        data[smallest] = tmp;
        i = smallest;
      } else {
        break;
      }
    }
  }
}

/**
 * Compute flat grid index from 3D coordinates.
 * Layout: x + y * width + z * width * height
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} width
 * @param {number} height
 * @returns {number}
 */
function gridIndex(x, y, z, width, height) {
  return x + y * width + z * width * height;
}

/**
 * Manhattan distance heuristic for 3D grid.
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @returns {number}
 */
function manhattan(x0, y0, z0, x1, y1, z1) {
  return Math.abs(x1 - x0) + Math.abs(y1 - y0) + Math.abs(z1 - z0);
}

/**
 * Find the shortest path on a 6-connected 3D occupancy grid using A*.
 *
 * @param {{ grid: Uint8Array, width: number, height: number, depth: number }} gridData
 * @param {{ x: number, y: number, z: number }} start - Grid coordinates
 * @param {{ x: number, y: number, z: number }} end   - Grid coordinates
 * @param {object} [options]
 * @param {number} [options.bendPenalty=2.0]      - Extra cost when direction changes
 * @param {number} [options.elevationPenalty=1.5]  - Multiplier for vertical (Y) movement
 * @param {number} [options.corridorBonus=0.5]     - Multiplier for cells marked as corridor
 * @param {number} [options.maxIterations=500000]  - Safety limit to prevent infinite loops
 * @returns {Array<{ x: number, y: number, z: number }> | null} Path from start to end, or null
 */
export function findPath(gridData, start, end, options = {}) {
  const {
    bendPenalty = 2.0,
    elevationPenalty = 1.5,
    corridorBonus = 0.5,
    maxIterations = 500000,
  } = options;

  const { grid, width, height, depth } = gridData;
  const totalCells = width * height * depth;

  // Validate start and end positions
  const startIdx = gridIndex(start.x, start.y, start.z, width, height);
  const endIdx = gridIndex(end.x, end.y, end.z, width, height);

  if (
    start.x < 0 || start.x >= width ||
    start.y < 0 || start.y >= height ||
    start.z < 0 || start.z >= depth
  ) {
    return null;
  }
  if (
    end.x < 0 || end.x >= width ||
    end.y < 0 || end.y >= height ||
    end.z < 0 || end.z >= depth
  ) {
    return null;
  }

  // Start or end blocked — clear them so routing can proceed
  // (equipment nozzle positions may overlap occupancy cells)
  const origStart = grid[startIdx];
  const origEnd = grid[endIdx];
  grid[startIdx] = 0;
  grid[endIdx] = 0;

  // Parallel arrays for g-scores, parent indices, and parent direction
  const gScore = new Float32Array(totalCells);
  gScore.fill(Infinity);
  gScore[startIdx] = 0;

  const parentIdx = new Int32Array(totalCells);
  parentIdx.fill(-1);

  // Direction that was used to reach each cell (-1 = none / start)
  const parentDir = new Int8Array(totalCells);
  parentDir.fill(-1);

  // Closed set
  const closed = new Uint8Array(totalCells);

  const open = new BinaryMinHeap();
  const h0 = manhattan(start.x, start.y, start.z, end.x, end.y, end.z);
  open.insert({ f: h0, index: startIdx });

  let iterations = 0;

  while (open.size > 0 && iterations < maxIterations) {
    iterations++;
    const current = open.extractMin();
    const ci = current.index;

    if (ci === endIdx) {
      // Reconstruct path
      const path = [];
      let idx = endIdx;
      while (idx !== -1) {
        const cz = Math.floor(idx / (width * height));
        const remainder = idx - cz * width * height;
        const cy = Math.floor(remainder / width);
        const cx = remainder % width;
        path.push({ x: cx, y: cy, z: cz });
        idx = parentIdx[idx];
      }
      // Restore original grid values
      grid[startIdx] = origStart;
      grid[endIdx] = origEnd;
      path.reverse();
      return path;
    }

    if (closed[ci]) continue;
    closed[ci] = 1;

    // Decompose current index to 3D coords
    const cz = Math.floor(ci / (width * height));
    const remainder = ci - cz * width * height;
    const cy = Math.floor(remainder / width);
    const cx = remainder % width;
    const currentDir = parentDir[ci];

    for (let n = 0; n < 6; n++) {
      const nb = NEIGHBORS[n];
      const nx = cx + nb.dx;
      const ny = cy + nb.dy;
      const nz = cz + nb.dz;

      // Bounds check
      if (nx < 0 || nx >= width || ny < 0 || ny >= height || nz < 0 || nz >= depth) continue;

      const ni = gridIndex(nx, ny, nz, width, height);

      // Skip blocked cells and already-closed cells
      if (grid[ni] === 1 || closed[ni]) continue;

      // ─── Movement cost calculation ───
      let cost = 1.0;

      // Bend penalty: direction change from parent
      if (currentDir !== -1 && nb.dir !== currentDir) {
        cost += bendPenalty;
      }

      // Elevation penalty: moving in Y direction
      if (nb.dy !== 0) {
        cost *= elevationPenalty;
      }

      // Corridor bonus: target cell is corridor
      if (grid[ni] === 2) {
        cost *= corridorBonus;
      }

      const tentativeG = gScore[ci] + cost;
      if (tentativeG < gScore[ni]) {
        gScore[ni] = tentativeG;
        parentIdx[ni] = ci;
        parentDir[ni] = nb.dir;
        const h = manhattan(nx, ny, nz, end.x, end.y, end.z);
        open.insert({ f: tentativeG + h, index: ni });
      }
    }
  }

  // Restore original grid values
  grid[startIdx] = origStart;
  grid[endIdx] = origEnd;

  // No path found
  return null;
}

export { BinaryMinHeap };
