/**
 * Collision Detection Utilities
 *
 * Axis-Aligned Bounding Box (AABB) collision checks for equipment items.
 * AABB format: { min: [x, y, z], max: [x, y, z] }
 */

/**
 * Compute the AABB for an equipment item based on its type, position, and dimensions.
 *
 * @param {object} item - Equipment item from project store
 * @returns {{ min: number[], max: number[] }}
 */
export function getAABB(item) {
  const [px, py, pz] = item.position || [0, 0, 0];
  const dims = item.dimensions || {};

  switch (item.type) {
    case 'column': {
      const r = (dims.diameter || 2) / 2;
      const h = dims.height || 20;
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
        max: [px + len / 2, py + saddleH + (dims.diameter || 2), pz + r],
      };
    }

    case 'sphericalTank': {
      const r = (dims.diameter || 10) / 2;
      const legH = dims.legHeight || 5;
      return {
        min: [px - r, py, pz - r],
        max: [px + r, py + legH + (dims.diameter || 10), pz + r],
      };
    }

    case 'sruFurnace': {
      const halfW = (dims.width || 6) / 2;
      const halfD = (dims.depth || 4) / 2;
      const h = dims.height || 8;
      const stackH = dims.stackHeight || 15;
      return {
        min: [px - halfW, py, pz - halfD],
        max: [px + halfW, py + h + stackH, pz + halfD],
      };
    }

    case 'airCooler': {
      const halfW = (dims.width || 8) / 2;
      const halfD = (dims.depth || 3) / 2;
      const h = dims.height || 4;
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
 * Check whether two AABBs overlap (intersect).
 *
 * @param {{ min: number[], max: number[] }} a
 * @param {{ min: number[], max: number[] }} b
 * @returns {boolean} true if boxes overlap
 */
export function checkAABBCollision(a, b) {
  return (
    a.min[0] <= b.max[0] && a.max[0] >= b.min[0] &&
    a.min[1] <= b.max[1] && a.max[1] >= b.min[1] &&
    a.min[2] <= b.max[2] && a.max[2] >= b.min[2]
  );
}

/**
 * Check whether a point lies inside an AABB.
 *
 * @param {number[] | { x: number, y: number, z: number }} point
 * @param {{ min: number[], max: number[] }} box
 * @returns {boolean} true if point is inside (or on boundary of) the box
 */
export function checkPointInAABB(point, box) {
  const px = Array.isArray(point) ? point[0] : point.x;
  const py = Array.isArray(point) ? point[1] : point.y;
  const pz = Array.isArray(point) ? point[2] : point.z;

  return (
    px >= box.min[0] && px <= box.max[0] &&
    py >= box.min[1] && py <= box.max[1] &&
    pz >= box.min[2] && pz <= box.max[2]
  );
}

/**
 * Find all colliding pairs among an array of equipment items.
 * Uses O(n²) pairwise AABB check.
 *
 * @param {Array<object>} items - Equipment items with id, position, dimensions, type
 * @returns {Array<[string, string]>} Array of colliding [id1, id2] pairs
 */
export function findCollisions(items) {
  const collisions = [];
  const n = items.length;

  // Pre-compute AABBs
  const boxes = items.map((item) => ({
    id: item.id,
    aabb: getAABB(item),
  }));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (checkAABBCollision(boxes[i].aabb, boxes[j].aabb)) {
        collisions.push([boxes[i].id, boxes[j].id]);
      }
    }
  }

  return collisions;
}
