/**
 * EquipmentMesh
 * - Renders equipment geometry (reactive to dimension changes)
 * - Shows nozzles ALWAYS (dimmer when not selected, brighter when selected)
 * - Wraps in TransformControls when move/rotate tool is active AND item is selected
 *   TransformControls steals pointer events → OrbitControls is disabled in CameraController
 */
import React, { useRef, useMemo, useState, useCallback } from 'react';
import { TransformControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { buildEquipmentGeometry } from '../../equipment/geometryBuilders.js';
import useUIStore from '../../stores/useUIStore.js';
import useProjectStore from '../../stores/useProjectStore.js';
import NozzleMarker from './NozzleMarker.jsx';

export default function EquipmentMesh({ data }) {
  const groupRef = useRef();
  const pivotRef = useRef();
  const [hovered, setHovered] = useState(false);

  const selectedIds     = useUIStore((s) => s.selectedIds);
  const activeTool      = useUIStore((s) => s.activeTool);
  const isSelected      = selectedIds.includes(data.id);
  const updateEquipment = useProjectStore((s) => s.updateEquipment);

  /* ── Geometry (rebuilds whenever dimensions change) ── */
  const childMeshes = useMemo(() => {
    const group = buildEquipmentGeometry(data.type, data.dimensions || {});
    const meshes = [];
    group.traverse((child) => {
      if (child.isMesh) {
        meshes.push({
          key:      child.uuid,   // uuid guarantees uniqueness (fixes brace-N-0 duplicate key bug)
          geometry: child.geometry,
          position: child.position.toArray(),
          rotation: [child.rotation.x, child.rotation.y, child.rotation.z],
          scale:    child.scale.toArray(),
        });
      }
    });
    return meshes;
  }, [data.type, data.dimensions]);

  /* ── Compute local center of bounding box for center-point rotation ── */
  const centerOffset = useMemo(() => {
    const box = new THREE.Box3();
    childMeshes.forEach((m) => {
      if (m.geometry) {
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        const childBox = m.geometry.boundingBox.clone();
        const matrix = new THREE.Matrix4().compose(
          new THREE.Vector3(...m.position),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(...m.rotation)),
          new THREE.Vector3(...m.scale)
        );
        childBox.applyMatrix4(matrix);
        box.union(childBox);
      }
    });
    if (box.isEmpty()) return new THREE.Vector3(0, (data.dimensions?.height || data.dimensions?.diameter || 4) / 2, 0);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return center;
  }, [childMeshes, data.dimensions]);

  const worldCenter = useMemo(() => {
    const pos = new THREE.Vector3(...(data.position ?? [0, 0, 0]));
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(data.rotation ?? [0, 0, 0])));
    return pos.add(centerOffset.clone().applyQuaternion(quat));
  }, [data.position, data.rotation, centerOffset]);

  /* ── Sync TransformControls position/rotation → store ── */
  const handleTransformChange = useCallback(() => {
    const g = groupRef.current;
    if (!g) return;
    updateEquipment(data.id, {
      position: [g.position.x, g.position.y, g.position.z],
      rotation: [g.rotation.x, g.rotation.y, g.rotation.z],
    });
  }, [data.id, updateEquipment]);

  const handleRotateChange = useCallback(() => {
    const p = pivotRef.current;
    if (!p) return;
    const newQuat = p.quaternion.clone();
    const newPos = p.position.clone().add(centerOffset.clone().negate().applyQuaternion(newQuat));
    updateEquipment(data.id, {
      position: [newPos.x, newPos.y, newPos.z],
      rotation: [p.rotation.x, p.rotation.y, p.rotation.z],
    });
  }, [data.id, centerOffset, updateEquipment]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (e.nativeEvent?.ctrlKey || e.nativeEvent?.metaKey) {
      useUIStore.getState().multiSelect(data.id);
    } else {
      useUIStore.getState().select(data.id);
    }
  }, [data.id]);

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback((e) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'default';
  }, []);

  const equipColor        = data.color || '#7a8a9a';
  const emissiveColor     = isSelected ? '#1a4080' : hovered ? '#1a2a3a' : '#000000';
  const emissiveIntensity = isSelected ? 0.45 : hovered ? 0.2 : 0;

  const meshGroup = (
    <group
      ref={groupRef}
      name={data.tag || data.id}
      position={data.position ?? [0, 0, 0]}
      rotation={data.rotation  ?? [0, 0, 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Equipment body meshes */}
      {childMeshes.map((m) => (
        <mesh key={m.key} geometry={m.geometry}
          position={m.position} rotation={m.rotation} scale={m.scale}
          castShadow receiveShadow>
          <meshStandardMaterial
            color={equipColor} metalness={0.3} roughness={0.6}
            emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
        </mesh>
      ))}

      {/* ── Tag label (always visible, rises above equipment) ── */}
      <Html
        position={[0, (data.dimensions?.height || data.dimensions?.diameter || 4) + 1.5, 0]}
        center
        distanceFactor={80}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: isSelected ? 'rgba(74,158,255,0.9)' : 'rgba(20,22,35,0.82)',
          color: isSelected ? '#fff' : '#c8d0e8',
          padding: '2px 7px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'Inter, monospace',
          border: isSelected ? '1px solid #4a9eff' : '1px solid #2a3040',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}>
          {data.tag}
        </div>
      </Html>

      {/* ── Nozzle markers — ALWAYS visible ── */}
      {data.nozzles?.map((nz) => (
        <NozzleMarker key={nz.id} equipment={data} nozzle={nz} prominent={isSelected} />
      ))}
    </group>
  );

  /* Wrap with TransformControls centered on bounding box center when using Rotate tool */
  if (isSelected && activeTool === 'rotate') {
    return (
      <TransformControls
        mode="rotate"
        rotationSnap={Math.PI / 12}   /* 15° snaps */
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
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            {childMeshes.map((m) => (
              <mesh key={m.key} geometry={m.geometry}
                position={m.position} rotation={m.rotation} scale={m.scale}
                castShadow receiveShadow>
                <meshStandardMaterial
                  color={equipColor} metalness={0.3} roughness={0.6}
                  emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
              </mesh>
            ))}

            <Html
              position={[0, (data.dimensions?.height || data.dimensions?.diameter || 4) + 1.5, 0]}
              center
              distanceFactor={80}
              style={{ pointerEvents: 'none' }}
            >
              <div style={{
                background: 'rgba(74,158,255,0.9)',
                color: '#fff',
                padding: '2px 7px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'Inter, monospace',
                border: '1px solid #4a9eff',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}>
                {data.tag}
              </div>
            </Html>

            {data.nozzles?.map((nz) => (
              <NozzleMarker key={nz.id} equipment={data} nozzle={nz} prominent={true} />
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
