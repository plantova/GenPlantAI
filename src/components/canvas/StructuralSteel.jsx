/**
 * StructuralSteel — Renders pipe rack / structural steel frameworks
 * Columns at grid intersections, beams at each level along X and Z
 */
import React, { useMemo, useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import useUIStore from '../../stores/useUIStore';
import useProjectStore from '../../stores/useProjectStore';

export default function StructuralSteel({ data }) {
  const { invalidate } = useThree();
  const groupRef = useRef();
  const pivotRef = useRef();
  const selectedIds = useUIStore((s) => s.selectedIds);
  const activeTool = useUIStore((s) => s.activeTool);
  const isSelected = selectedIds.includes(data.id);
  const updateStructure = useProjectStore((s) => s.updateStructure);

  const {
    baysX = 3,
    baysZ = 1,
    bayWidth = 6,
    bayLength = 6,
    columnSize = { w: 0.3, d: 0.3 },
    beamSize = { w: 0.3, h: 0.4 },
    levels = [{ elevation: 4, label: 'Level 1' }],
    color = '#5a6a7a',
  } = data;

  // Get max elevation for column heights
  const maxElevation = useMemo(() => {
    return Math.max(...levels.map((l) => l.elevation), 4);
  }, [levels]);

  // Total dimensions
  const totalWidth = baysX * bayWidth;
  const totalLength = baysZ * bayLength;

  // Generate column positions — one at each grid intersection
  const columns = useMemo(() => {
    const cols = [];
    for (let ix = 0; ix <= baysX; ix++) {
      for (let iz = 0; iz <= baysZ; iz++) {
        cols.push({
          key: `col-${ix}-${iz}`,
          x: ix * bayWidth - totalWidth / 2,
          z: iz * bayLength - totalLength / 2,
        });
      }
    }
    return cols;
  }, [baysX, baysZ, bayWidth, bayLength, totalWidth, totalLength]);

  // Generate beams — along X and Z at each level
  const beams = useMemo(() => {
    const bms = [];
    for (const level of levels) {
      const elev = level.elevation;
      // Beams along X direction (for each Z row)
      for (let iz = 0; iz <= baysZ; iz++) {
        for (let ix = 0; ix < baysX; ix++) {
          const x1 = ix * bayWidth - totalWidth / 2;
          const x2 = (ix + 1) * bayWidth - totalWidth / 2;
          const z = iz * bayLength - totalLength / 2;
          bms.push({
            key: `beam-x-${elev}-${ix}-${iz}`,
            position: [(x1 + x2) / 2, elev, z],
            size: [bayWidth, beamSize.h, beamSize.w],
            direction: 'x',
            level: elev,
          });
        }
      }
      // Beams along Z direction (for each X row)
      for (let ix = 0; ix <= baysX; ix++) {
        for (let iz = 0; iz < baysZ; iz++) {
          const x = ix * bayWidth - totalWidth / 2;
          const z1 = iz * bayLength - totalLength / 2;
          const z2 = (iz + 1) * bayLength - totalLength / 2;
          bms.push({
            key: `beam-z-${elev}-${ix}-${iz}`,
            position: [x, elev, (z1 + z2) / 2],
            size: [beamSize.w, beamSize.h, bayLength],
            direction: 'z',
            level: elev,
          });
        }
      }
    }
    return bms;
  }, [levels, baysX, baysZ, bayWidth, bayLength, totalWidth, totalLength, beamSize]);

  // Bracing for lateral stability — diagonal on end bays
  const braces = useMemo(() => {
    const brs = [];
    if (levels.length < 1) return brs;

    // Add X-bracing on end bays at each level
    for (let li = 0; li < levels.length; li++) {
      const elev = levels[li].elevation;
      const prevElev = li > 0 ? levels[li - 1].elevation : 0;
      const levelH = elev - prevElev;
      const braceLength = Math.sqrt(bayWidth * bayWidth + levelH * levelH);

      // First and last X bay, first Z row
      for (const ix of [0, baysX - 1]) {
        const x = ix * bayWidth - totalWidth / 2 + bayWidth / 2;
        const z = -totalLength / 2;
        const angle = Math.atan2(levelH, bayWidth);
        brs.push({
          key: `brace-${elev}-${ix}`,
          position: [x, prevElev + levelH / 2, z],
          length: braceLength,
          rotation: [0, 0, angle],
          size: 0.08,
        });
      }
    }
    return brs;
  }, [levels, baysX, bayWidth, totalWidth, totalLength]);

  const centerOffset = useMemo(() => {
    return new THREE.Vector3(0, maxElevation / 2, 0);
  }, [maxElevation]);

  const worldCenter = useMemo(() => {
    const pos = new THREE.Vector3(...(data.position ?? [0, 0, 0]));
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(data.rotation ?? [0, 0, 0])));
    return pos.add(centerOffset.clone().applyQuaternion(quat));
  }, [data.position, data.rotation, centerOffset]);

  const handleTransformChange = useCallback(() => {
    const g = groupRef.current;
    if (!g) return;
    updateStructure(data.id, {
      position: [g.position.x, g.position.y, g.position.z],
      rotation: [g.rotation.x, g.rotation.y, g.rotation.z],
    });
  }, [data.id, updateStructure]);

  const handleRotateChange = useCallback(() => {
    const p = pivotRef.current;
    if (!p) return;
    const newQuat = p.quaternion.clone();
    const newPos = p.position.clone().add(centerOffset.clone().negate().applyQuaternion(newQuat));
    updateStructure(data.id, {
      position: [newPos.x, newPos.y, newPos.z],
      rotation: [p.rotation.x, p.rotation.y, p.rotation.z],
    });
  }, [data.id, centerOffset, updateStructure]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (e.nativeEvent?.ctrlKey || e.nativeEvent?.metaKey) {
      useUIStore.getState().multiSelect(data.id);
    } else {
      useUIStore.getState().select(data.id);
    }
    invalidate();
  }, [data.id, invalidate]);

  const emissiveColor = isSelected ? '#4a9eff' : '#000000';
  const emissiveIntensity = isSelected ? 0.25 : 0;

  const meshGroup = (
    <group
      ref={groupRef}
      name={data.tag}
      position={data.position ?? [0, 0, 0]}
      rotation={data.rotation ?? [0, 0, 0]}
      onClick={handleClick}
    >
      {/* Columns */}
      {columns.map((col) => (
        <mesh
          key={col.key}
          position={[col.x, maxElevation / 2, col.z]}
          castShadow
        >
          <boxGeometry args={[columnSize.w, maxElevation, columnSize.d]} />
          <meshStandardMaterial
            color={color}
            metalness={0.5}
            roughness={0.4}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}

      {/* Base plates */}
      {columns.map((col) => (
        <mesh
          key={`bp-${col.key}`}
          position={[col.x, 0.025, col.z]}
        >
          <boxGeometry args={[columnSize.w + 0.3, 0.05, columnSize.d + 0.3]} />
          <meshStandardMaterial
            color="#4a5a6a"
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Beams */}
      {beams.map((beam) => {
        // Slight color variation per level
        const levelFactor = beam.level / maxElevation;
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const variation = Math.floor(levelFactor * 20);
        const beamColor = `rgb(${Math.min(r + variation, 255)}, ${Math.min(g + variation, 255)}, ${Math.min(b + variation, 255)})`;

        return (
          <mesh
            key={beam.key}
            position={beam.position}
            castShadow
          >
            <boxGeometry args={beam.size} />
            <meshStandardMaterial
              color={beamColor}
              metalness={0.5}
              roughness={0.4}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        );
      })}

      {/* Bracing */}
      {braces.map((brace) => (
        <mesh
          key={brace.key}
          position={brace.position}
          rotation={brace.rotation}
        >
          <cylinderGeometry args={[brace.size, brace.size, brace.length, 6]} />
          <meshStandardMaterial
            color="#4a5a6a"
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );

  /* Wrap with TransformControls centered on bounding box center when using Rotate tool */
  if (isSelected && activeTool === 'rotate') {
    return (
      <TransformControls
        mode="rotate"
        rotationSnap={Math.PI / 12}
        size={0.8}
        space="local"
        onObjectChange={handleRotateChange}
      >
        <group
          ref={pivotRef}
          name={`${data.tag || data.id}-pivot`}
          position={worldCenter}
          rotation={data.rotation ?? [0, 0, 0]}
        >
          <group
            position={[-centerOffset.x, -centerOffset.y, -centerOffset.z]}
            onClick={handleClick}
          >
            {columns.map((col) => (
              <mesh
                key={col.key}
                position={[col.x, maxElevation / 2, col.z]}
                castShadow
              >
                <boxGeometry args={[columnSize.w, maxElevation, columnSize.d]} />
                <meshStandardMaterial
                  color={color}
                  metalness={0.5}
                  roughness={0.4}
                  emissive={emissiveColor}
                  emissiveIntensity={emissiveIntensity}
                />
              </mesh>
            ))}

            {columns.map((col) => (
              <mesh
                key={`bp-${col.key}`}
                position={[col.x, 0.025, col.z]}
              >
                <boxGeometry args={[columnSize.w + 0.3, 0.05, columnSize.d + 0.3]} />
                <meshStandardMaterial
                  color="#4a5a6a"
                  metalness={0.6}
                  roughness={0.3}
                />
              </mesh>
            ))}

            {beams.map((beam) => {
              const levelFactor = beam.level / maxElevation;
              const r = parseInt(color.slice(1, 3), 16);
              const g = parseInt(color.slice(3, 5), 16);
              const b = parseInt(color.slice(5, 7), 16);
              const variation = Math.floor(levelFactor * 20);
              const beamColor = `rgb(${Math.min(r + variation, 255)}, ${Math.min(g + variation, 255)}, ${Math.min(b + variation, 255)})`;

              return (
                <mesh
                  key={beam.key}
                  position={beam.position}
                  castShadow
                >
                  <boxGeometry args={beam.size} />
                  <meshStandardMaterial
                    color={beamColor}
                    metalness={0.5}
                    roughness={0.4}
                    emissive={emissiveColor}
                    emissiveIntensity={emissiveIntensity}
                  />
                </mesh>
              );
            })}

            {braces.map((brace) => (
              <mesh
                key={brace.key}
                position={brace.position}
                rotation={brace.rotation}
              >
                <cylinderGeometry args={[brace.size, brace.size, brace.length, 6]} />
                <meshStandardMaterial
                  color="#4a5a6a"
                  metalness={0.5}
                  roughness={0.5}
                />
              </mesh>
            ))}
          </group>
        </group>
      </TransformControls>
    );
  }

  /* Wrap with TransformControls when selected + move tool */
  if (isSelected && activeTool === 'move') {
    return (
      <TransformControls
        mode="translate"
        translationSnap={null}
        size={0.8}
        space="world"
        onObjectChange={handleTransformChange}
      >
        {meshGroup}
      </TransformControls>
    );
  }

  return meshGroup;
}
