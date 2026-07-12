/**
 * Geometry Builders — Pure Three.js functions that create equipment geometry groups.
 * Each builder returns a THREE.Group with named child meshes.
 * All measurements in meters. Group origin is at base center.
 */
import * as THREE from 'three';

const DEFAULT_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#7a8a9a',
  metalness: 0.3,
  roughness: 0.6,
});

/**
 * Column / Reactor
 * CylinderGeometry body + 2 halved SphereGeometry end caps
 * Bottom at Y=0
 */
export function buildColumn(dims) {
  const { diameter = 2, height = 20, wallThickness = 0.025 } = dims;
  const radius = diameter / 2;
  const group = new THREE.Group();
  group.name = 'column';

  // Body cylinder — centered vertically from radius (bottom cap joins) to height - radius (top cap joins)
  const bodyHeight = Math.max(height - diameter, 0.1);
  const bodyGeo = new THREE.CylinderGeometry(radius, radius, bodyHeight, 32);
  const body = new THREE.Mesh(bodyGeo, DEFAULT_MATERIAL.clone());
  body.name = 'body';
  body.position.y = radius + bodyHeight / 2;
  group.add(body);

  // Top hemispherical cap — upper half of sphere
  const capGeo = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const capTop = new THREE.Mesh(capGeo, DEFAULT_MATERIAL.clone());
  capTop.name = 'cap-top';
  capTop.position.y = radius + bodyHeight;
  group.add(capTop);

  // Bottom hemispherical cap — lower half of sphere (flipped)
  const capBottomGeo = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const capBottom = new THREE.Mesh(capBottomGeo, DEFAULT_MATERIAL.clone());
  capBottom.name = 'cap-bottom';
  capBottom.position.y = radius;
  group.add(capBottom);

  // Base skirt ring
  const skirtGeo = new THREE.CylinderGeometry(radius + 0.05, radius + 0.1, radius * 0.4, 32);
  const skirt = new THREE.Mesh(skirtGeo, DEFAULT_MATERIAL.clone());
  skirt.name = 'skirt';
  skirt.position.y = radius * 0.2;
  group.add(skirt);

  return group;
}

/**
 * Horizontal Vessel
 * CylinderGeometry rotated 90° (along Z axis) + 2 BoxGeometry saddles underneath
 * Vessel center at saddleHeight + radius
 */
export function buildHorizontalVessel(dims) {
  const { diameter = 2, length = 6, saddleWidth = 0.4, saddleHeight = 1 } = dims;
  const radius = diameter / 2;
  const group = new THREE.Group();
  group.name = 'horizontalVessel';

  // Body cylinder — rotated to lie along Z axis
  const bodyGeo = new THREE.CylinderGeometry(radius, radius, length, 32);
  const body = new THREE.Mesh(bodyGeo, DEFAULT_MATERIAL.clone());
  body.name = 'body';
  body.rotation.x = Math.PI / 2; // rotate so cylinder axis is along Z
  body.position.y = saddleHeight + radius;
  group.add(body);

  // End caps — hemispherical
  const capGeo = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);

  const capFront = new THREE.Mesh(capGeo, DEFAULT_MATERIAL.clone());
  capFront.name = 'cap-front';
  capFront.rotation.x = -Math.PI / 2; // point along +Z
  capFront.position.set(0, saddleHeight + radius, length / 2);
  group.add(capFront);

  const capBack = new THREE.Mesh(capGeo.clone(), DEFAULT_MATERIAL.clone());
  capBack.name = 'cap-back';
  capBack.rotation.x = Math.PI / 2; // point along -Z
  capBack.position.set(0, saddleHeight + radius, -length / 2);
  group.add(capBack);

  // Support saddles
  const saddleThickness = saddleWidth;
  const saddleDepth = diameter * 0.8;
  const saddleOffset = length * 0.3;

  for (let i = 0; i < 2; i++) {
    const saddleGeo = new THREE.BoxGeometry(saddleDepth, saddleHeight, saddleThickness);
    const saddle = new THREE.Mesh(saddleGeo, DEFAULT_MATERIAL.clone());
    saddle.name = `saddle-${i}`;
    saddle.position.set(0, saddleHeight / 2, i === 0 ? -saddleOffset : saddleOffset);
    group.add(saddle);

    // Saddle cradle — curved top piece (arc shape approximated with a thin torus segment)
    const cradleGeo = new THREE.TorusGeometry(radius, saddleWidth * 0.3, 8, 16, Math.PI);
    const cradle = new THREE.Mesh(cradleGeo, DEFAULT_MATERIAL.clone());
    cradle.name = `cradle-${i}`;
    cradle.rotation.y = Math.PI / 2;
    cradle.rotation.z = Math.PI;
    cradle.position.set(0, saddleHeight + radius, i === 0 ? -saddleOffset : saddleOffset);
    group.add(cradle);
  }

  return group;
}

/**
 * Spherical Tank
 * SphereGeometry + arrayed CylinderGeometry legs
 * Sphere center at legHeight + radius
 */
export function buildSphericalTank(dims) {
  const { diameter = 10, legCount = 8, legHeight = 5, legDiameter = 0.4 } = dims;
  const radius = diameter / 2;
  const group = new THREE.Group();
  group.name = 'sphericalTank';

  // Sphere body
  const sphereGeo = new THREE.SphereGeometry(radius, 32, 24);
  const sphere = new THREE.Mesh(sphereGeo, DEFAULT_MATERIAL.clone());
  sphere.name = 'body';
  sphere.position.y = legHeight + radius;
  group.add(sphere);

  // Equator ring (structural band)
  const ringGeo = new THREE.TorusGeometry(radius + 0.05, 0.08, 8, 48);
  const ring = new THREE.Mesh(ringGeo, DEFAULT_MATERIAL.clone());
  ring.name = 'equator-ring';
  ring.rotation.x = Math.PI / 2;
  ring.position.y = legHeight + radius;
  group.add(ring);

  // Support legs — arrayed evenly around the sphere
  const legRadius = legDiameter / 2;
  for (let i = 0; i < legCount; i++) {
    const angle = (i / legCount) * Math.PI * 2;
    const legX = Math.cos(angle) * (radius * 0.7);
    const legZ = Math.sin(angle) * (radius * 0.7);

    const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 8);
    const leg = new THREE.Mesh(legGeo, DEFAULT_MATERIAL.clone());
    leg.name = `leg-${i}`;
    leg.position.set(legX, legHeight / 2, legZ);
    group.add(leg);

    // Cross-brace from leg top to sphere
    const braceLen = legHeight * 0.6;
    const braceGeo = new THREE.CylinderGeometry(legRadius * 0.4, legRadius * 0.4, braceLen, 6);
    const brace = new THREE.Mesh(braceGeo, DEFAULT_MATERIAL.clone());
    brace.name = `brace-${i}`;
    const braceAngle = Math.atan2(legX, 0) || 0;
    brace.rotation.z = Math.PI / 4;
    brace.rotation.y = angle;
    brace.position.set(legX * 0.6, legHeight * 0.7, legZ * 0.6);
    group.add(brace);
  }

  return group;
}

/**
 * SRU / Box Furnace
 * BoxGeometry body + CylinderGeometry stack centered on top
 */
export function buildSRUFurnace(dims) {
  const { width = 6, depth = 4, height = 8, stackDiameter = 2, stackHeight = 15 } = dims;
  const group = new THREE.Group();
  group.name = 'sruFurnace';

  // Box body
  const bodyGeo = new THREE.BoxGeometry(width, height, depth);
  const body = new THREE.Mesh(bodyGeo, DEFAULT_MATERIAL.clone());
  body.name = 'body';
  body.position.y = height / 2;
  group.add(body);

  // Stack
  const stackRadius = stackDiameter / 2;
  const stackGeo = new THREE.CylinderGeometry(stackRadius, stackRadius, stackHeight, 24);
  const stack = new THREE.Mesh(stackGeo, DEFAULT_MATERIAL.clone());
  stack.name = 'stack';
  stack.position.y = height + stackHeight / 2;
  group.add(stack);

  // Stack cap — slight conical flare at top
  const capGeo = new THREE.CylinderGeometry(stackRadius * 1.2, stackRadius, 0.5, 24);
  const cap = new THREE.Mesh(capGeo, DEFAULT_MATERIAL.clone());
  cap.name = 'stack-cap';
  cap.position.y = height + stackHeight + 0.25;
  group.add(cap);

  // Base pad
  const padGeo = new THREE.BoxGeometry(width + 0.4, 0.3, depth + 0.4);
  const pad = new THREE.Mesh(padGeo, DEFAULT_MATERIAL.clone());
  pad.name = 'base-pad';
  pad.position.y = 0.15;
  group.add(pad);

  return group;
}

/**
 * Air Cooler
 * BoxGeometry body + arrayed flat CylinderGeometry fans on top
 */
export function buildAirCooler(dims) {
  const { width = 8, depth = 3, height = 4, fanCount = 4, fanDiameter = 2.5 } = dims;
  const group = new THREE.Group();
  group.name = 'airCooler';

  // Box body (header box / tube bundle)
  const bodyGeo = new THREE.BoxGeometry(width, height, depth);
  const body = new THREE.Mesh(bodyGeo, DEFAULT_MATERIAL.clone());
  body.name = 'body';
  body.position.y = height / 2;
  group.add(body);

  // Support legs (4 corners)
  const legH = height * 0.3;
  const legSize = 0.2;
  const positions = [
    [-(width / 2 - 0.3), 0, -(depth / 2 - 0.3)],
    [(width / 2 - 0.3), 0, -(depth / 2 - 0.3)],
    [-(width / 2 - 0.3), 0, (depth / 2 - 0.3)],
    [(width / 2 - 0.3), 0, (depth / 2 - 0.3)],
  ];
  positions.forEach((pos, idx) => {
    const legGeo = new THREE.BoxGeometry(legSize, legH, legSize);
    const leg = new THREE.Mesh(legGeo, DEFAULT_MATERIAL.clone());
    leg.name = `support-${idx}`;
    leg.position.set(pos[0], legH / 2, pos[2]);
    group.add(leg);
  });

  // Fan shrouds on top — flat cylinders arrayed along width
  const fanRadius = fanDiameter / 2;
  const fanSpacing = width / fanCount;
  const startX = -(width / 2) + fanSpacing / 2;

  for (let i = 0; i < fanCount; i++) {
    // Shroud ring
    const shroudGeo = new THREE.CylinderGeometry(fanRadius, fanRadius, 0.3, 24);
    const shroud = new THREE.Mesh(shroudGeo, DEFAULT_MATERIAL.clone());
    shroud.name = `fan-shroud-${i}`;
    shroud.position.set(startX + i * fanSpacing, height + 0.15, 0);
    group.add(shroud);

    // Fan disc (flat cylinder)
    const fanGeo = new THREE.CylinderGeometry(fanRadius * 0.9, fanRadius * 0.9, 0.05, 24);
    const fan = new THREE.Mesh(fanGeo, DEFAULT_MATERIAL.clone());
    fan.name = `fan-${i}`;
    fan.position.set(startX + i * fanSpacing, height + 0.15, 0);
    group.add(fan);

    // Fan hub
    const hubGeo = new THREE.CylinderGeometry(fanRadius * 0.15, fanRadius * 0.15, 0.4, 12);
    const hub = new THREE.Mesh(hubGeo, DEFAULT_MATERIAL.clone());
    hub.name = `fan-hub-${i}`;
    hub.position.set(startX + i * fanSpacing, height + 0.35, 0);
    group.add(hub);

    // Fan blades (4 per fan, as flat box geometry)
    for (let b = 0; b < 4; b++) {
      const bladeAngle = (b / 4) * Math.PI * 2;
      const bladeGeo = new THREE.BoxGeometry(fanRadius * 0.8, 0.02, fanRadius * 0.15);
      const blade = new THREE.Mesh(bladeGeo, DEFAULT_MATERIAL.clone());
      blade.name = `fan-blade-${i}-${b}`;
      const bx = Math.cos(bladeAngle) * fanRadius * 0.45;
      const bz = Math.sin(bladeAngle) * fanRadius * 0.45;
      blade.position.set(startX + i * fanSpacing + bx, height + 0.15, bz);
      blade.rotation.y = bladeAngle;
      group.add(blade);
    }
  }

  return group;
}

/**
 * Dispatcher — calls the correct builder by equipment type
 */
export function buildEquipmentGeometry(type, dims) {
  switch (type) {
    case 'column':
      return buildColumn(dims);
    case 'horizontalVessel':
      return buildHorizontalVessel(dims);
    case 'sphericalTank':
      return buildSphericalTank(dims);
    case 'sruFurnace':
      return buildSRUFurnace(dims);
    case 'airCooler':
      return buildAirCooler(dims);
    default:
      console.warn(`Unknown equipment type: ${type}, falling back to column`);
      return buildColumn(dims);
  }
}
