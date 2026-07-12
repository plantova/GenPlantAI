/**
 * PipeMesh — Renders pipe segments (straight runs + elbows) in 3D
 */
import React, { useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { npsToOD } from '../../utils/units';
import useUIStore from '../../stores/useUIStore';
import { normalizePipeSegments } from '../../routing/elbowInserter';

/**
 * Create a pipe segment mesh between two points
 */
function PipeSegment({ start, end, radius, color, emissive, emissiveIntensity }) {
  const { position, rotation, length } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const dir = new THREE.Vector3().subVectors(e, s);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);

    // Calculate rotation to orient cylinder from start to end
    // CylinderGeometry is Y-aligned by default
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
    const euler = new THREE.Euler().setFromQuaternion(quat);

    return {
      position: mid.toArray(),
      rotation: [euler.x, euler.y, euler.z],
      length: len,
    };
  }, [start, end]);

  if (length < 0.001) return null;

  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial
        color={color}
        metalness={0.4}
        roughness={0.3}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

/**
 * Create an elbow segment using a TorusGeometry arc
 */
function ElbowSegment({ center, elbowRadius, pipeRadius, angle, fromDir, toDir, color, emissive, emissiveIntensity }) {
  const { position, rotation, arc } = useMemo(() => {
    const arcAngle = ((angle || 90) * Math.PI) / 180;
    const c = new THREE.Vector3(...(center || [0, 0, 0]));

    // Calculate rotation to orient the torus properly
    // We need the torus plane to contain both fromDir and toDir
    const from = new THREE.Vector3(...(fromDir || [1, 0, 0])).normalize();
    const to = new THREE.Vector3(...(toDir || [0, 0, 1])).normalize();

    // Normal to the plane containing both directions
    const normal = new THREE.Vector3().crossVectors(from, to).normalize();
    if (normal.lengthSq() < 0.001) {
      normal.set(0, 1, 0); // fallback for parallel directions
    }

    // Build rotation matrix
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      normal
    );

    // Additional rotation to align the torus start with fromDir
    const rotatedFrom = from.clone().applyQuaternion(quat.clone().invert());
    const startAngle = Math.atan2(rotatedFrom.z, rotatedFrom.x);

    const euler = new THREE.Euler().setFromQuaternion(quat);

    return {
      position: c.toArray(),
      rotation: [euler.x, euler.y + startAngle, euler.z],
      arc: arcAngle,
    };
  }, [center, angle, fromDir, toDir]);

  return (
    <mesh position={position} rotation={rotation} castShadow>
      <torusGeometry args={[elbowRadius || 0.3, pipeRadius, 12, 24, arc]} />
      <meshStandardMaterial
        color={color}
        metalness={0.4}
        roughness={0.3}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

export default function PipeMesh({ data }) {
  const { invalidate } = useThree();
  const selectedIds = useUIStore((s) => s.selectedIds);
  const isSelected = selectedIds.includes(data.id);

  const pipeRadius = useMemo(() => {
    return npsToOD(data.nominalSize) / 2;
  }, [data.nominalSize]);

  const pipeColor = data.color || '#4a9eff';
  const emissiveColor = isSelected ? '#4a9eff' : '#000000';
  const emissiveIntensity = isSelected ? 0.3 : 0;

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (e.nativeEvent?.ctrlKey || e.nativeEvent?.metaKey) {
      useUIStore.getState().multiSelect(data.id);
    } else {
      useUIStore.getState().select(data.id);
    }
    invalidate();
  }, [data.id, invalidate]);

  const normalizedSegments = useMemo(() => {
    return normalizePipeSegments(data.segments || [], data.nominalSize);
  }, [data.segments, data.nominalSize]);

  if (!normalizedSegments || normalizedSegments.length === 0) return null;

  return (
    <group name={data.lineNumber} onClick={handleClick}>
      {normalizedSegments.map((segment, index) => {
        if (segment.type === 'pipe') {
          return (
            <PipeSegment
              key={`pipe-${index}`}
              start={segment.start}
              end={segment.end}
              radius={pipeRadius}
              color={pipeColor}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
            />
          );
        }

        if (segment.type === 'elbow') {
          // Elbow bend radius is typically 1.5× the nominal diameter
          const elbowR = npsToOD(data.nominalSize) * 1.5;
          return (
            <ElbowSegment
              key={`elbow-${index}`}
              center={segment.center}
              elbowRadius={elbowR}
              pipeRadius={pipeRadius}
              angle={segment.angle || 90}
              fromDir={segment.fromDir}
              toDir={segment.toDir}
              color={pipeColor}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
            />
          );
        }

        return null;
      })}

      {/* Flanges at pipe ends — rendered as slightly larger discs at start/end */}
      {normalizedSegments.length > 0 && normalizedSegments[0].type === 'pipe' && (
        <mesh position={normalizedSegments[0].start} castShadow>
          <cylinderGeometry args={[pipeRadius * 1.6, pipeRadius * 1.6, pipeRadius * 0.5, 16]} />
          <meshStandardMaterial
            color="#666680"
            metalness={0.5}
            roughness={0.3}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
      {normalizedSegments.length > 0 && (() => {
        const lastSeg = normalizedSegments[normalizedSegments.length - 1];
        if (lastSeg.type === 'pipe') {
          return (
            <mesh position={lastSeg.end} castShadow>
              <cylinderGeometry args={[pipeRadius * 1.6, pipeRadius * 1.6, pipeRadius * 0.5, 16]} />
              <meshStandardMaterial
                color="#666680"
                metalness={0.5}
                roughness={0.3}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity}
              />
            </mesh>
          );
        }
        return null;
      })()}
    </group>
  );
}
