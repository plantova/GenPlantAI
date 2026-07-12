/**
 * Snap Engine — Grid, angle, and nozzle snapping for placement and routing
 */

/**
 * Snap a position to the nearest grid point
 * @param {[number,number,number]} position
 * @param {number} gridSize — spacing in meters
 * @returns {[number,number,number]}
 */
export const snapToGrid = (position, gridSize = 10) => {
  return [
    Math.round(position[0] / gridSize) * gridSize,
    position[1], // Y (elevation) is not grid-snapped
    Math.round(position[2] / gridSize) * gridSize,
  ];
};

/**
 * Snap a rotation angle to the nearest increment
 * @param {number} angleDeg — angle in degrees
 * @param {number} snapDeg — snap increment in degrees (e.g., 15, 45, 90)
 * @returns {number}
 */
export const snapAngle = (angleDeg, snapDeg = 15) => {
  return Math.round(angleDeg / snapDeg) * snapDeg;
};

/**
 * Snap angle in radians
 */
export const snapAngleRad = (angleRad, snapDeg = 15) => {
  const deg = (angleRad * 180) / Math.PI;
  const snapped = snapAngle(deg, snapDeg);
  return (snapped * Math.PI) / 180;
};

/**
 * Find the nearest nozzle position within a search radius
 * @param {[number,number,number]} position — world position
 * @param {Array} equipment — list of equipment items with computed nozzle world positions
 * @param {number} radius — search radius in meters
 * @returns {{ equipmentId, nozzleId, position }|null}
 */
export const snapToNozzle = (position, equipment, radius = 2.0) => {
  let closest = null;
  let closestDist = radius;

  for (const eq of equipment) {
    if (!eq.nozzles) continue;
    for (const nozzle of eq.nozzles) {
      const nozzleWorldPos = getNozzleWorldPosition(eq, nozzle);
      const dist = distance3D(position, nozzleWorldPos);
      if (dist < closestDist) {
        closestDist = dist;
        closest = {
          equipmentId: eq.id,
          nozzleId: nozzle.id,
          position: nozzleWorldPos,
        };
      }
    }
  }

  return closest;
};

/**
 * Calculate the world position of a nozzle given equipment position and nozzle definition
 */
export const getNozzleWorldPosition = (equipment, nozzle) => {
  const [ex, ey, ez] = equipment.position;
  const dims = equipment.dimensions;
  const rotY = equipment.rotation?.[1] || 0;

  let localX = 0, localY = 0, localZ = 0;
  const elevFraction = nozzle.elevationOffset || 0.5;

  switch (equipment.type) {
    case 'column': {
      const r = (dims.diameter || 2) / 2;
      const h = dims.height || 20;
      if (nozzle.position === 'top') {
        localY = h;
      } else if (nozzle.position === 'bottom') {
        localY = 0;
      } else {
        const angle = ((nozzle.angleOffset || 0) * Math.PI) / 180;
        localX = Math.cos(angle + rotY) * r;
        localZ = Math.sin(angle + rotY) * r;
        localY = h * elevFraction;
      }
      break;
    }
    case 'horizontalVessel': {
      const r = (dims.diameter || 2) / 2;
      const len = dims.length || 6;
      const saddleH = dims.saddleHeight || 1;
      if (nozzle.position === 'top') {
        localY = saddleH + r;
        localZ = (len * elevFraction) - (len / 2);
      } else if (nozzle.position === 'bottom') {
        localY = saddleH - r;
        localZ = (len * elevFraction) - (len / 2);
      } else {
        const angle = ((nozzle.angleOffset || 0) * Math.PI) / 180;
        localX = Math.cos(angle + rotY) * r;
        localY = saddleH + Math.sin(angle + rotY) * r;
        localZ = (len * elevFraction) - (len / 2);
      }
      break;
    }
    case 'sphericalTank': {
      const r = (dims.diameter || 10) / 2;
      const legH = dims.legHeight || 5;
      if (nozzle.position === 'top') {
        localY = legH + r * 2;
      } else if (nozzle.position === 'bottom') {
        localY = legH;
      } else {
        const angle = ((nozzle.angleOffset || 0) * Math.PI) / 180;
        localX = Math.cos(angle + rotY) * r;
        localZ = Math.sin(angle + rotY) * r;
        localY = legH + r + (r * (elevFraction - 0.5));
      }
      break;
    }
    case 'sruFurnace': {
      const w = dims.width || 6;
      const d = dims.depth || 4;
      const h = dims.height || 8;
      if (nozzle.position === 'top') {
        localY = h;
      } else {
        const angle = ((nozzle.angleOffset || 0) * Math.PI) / 180;
        const isXFace = Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle));
        localX = isXFace ? Math.sign(Math.cos(angle)) * (w / 2) : Math.cos(angle) * (d / 2);
        localZ = isXFace ? Math.sin(angle) * (w / 2) : Math.sign(Math.sin(angle)) * (d / 2);
        localY = h * elevFraction;
      }
      break;
    }
    case 'airCooler': {
      const w = dims.width || 8;
      const d = dims.depth || 3;
      const h = dims.height || 4;
      const angle = ((nozzle.angleOffset || 0) * Math.PI) / 180;
      localX = Math.cos(angle + rotY) * (w / 2);
      localZ = Math.sin(angle + rotY) * (d / 2);
      localY = h * elevFraction;
      break;
    }
    default:
      localY = elevFraction;
  }

  return [ex + localX, ey + localY, ez + localZ];
};

/**
 * 3D Euclidean distance
 */
export const distance3D = (a, b) => {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 +
    (a[1] - b[1]) ** 2 +
    (a[2] - b[2]) ** 2
  );
};

/**
 * Apply all active snap modes to a position
 */
export const applySnap = (position, options = {}) => {
  const {
    gridEnabled = true,
    gridSize = 10,
    nozzleEnabled = true,
    equipment = [],
    nozzleRadius = 2.0,
  } = options;

  // Nozzle snap takes priority
  if (nozzleEnabled && equipment.length > 0) {
    const nozzleSnap = snapToNozzle(position, equipment, nozzleRadius);
    if (nozzleSnap) {
      return {
        position: nozzleSnap.position,
        snappedTo: 'nozzle',
        nozzleInfo: nozzleSnap,
      };
    }
  }

  // Grid snap
  if (gridEnabled) {
    return {
      position: snapToGrid(position, gridSize),
      snappedTo: 'grid',
      nozzleInfo: null,
    };
  }

  return {
    position,
    snappedTo: null,
    nozzleInfo: null,
  };
};
