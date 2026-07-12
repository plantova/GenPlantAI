/**
 * GroundPlane — 1000m × 1000m ground surface + grid + axis labels.
 * NOTE: Placement clicks are handled by SceneCanvas at DOM level via
 *       a manual Raycaster — no onClick needed here.
 */
import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import useUIStore from '../../stores/useUIStore.js';

export default function GroundPlane() {
  const gridVisible = useUIStore((s) => s.gridVisible);
  const gridSpacing = useUIStore((s) => s.gridSpacing);
  const gridSize    = useUIStore((s) => s.gridSize) || 1000;

  const gridDivisions = useMemo(
    () => Math.max(1, Math.floor(gridSize / gridSpacing)),
    [gridSize, gridSpacing]
  );

  const axisLabels = useMemo(() => {
    const labels = [];
    const interval = 100;
    const half = gridSize / 2;
    for (let v = -half; v <= half; v += interval) {
      if (v === 0) continue;
      labels.push({ key: `x${v}`, text: `${v}`, position: [v, 0.1, -half - 5] });
      labels.push({ key: `z${v}`, text: `${v}`, position: [-half - 5, 0.1, v] });
    }
    return labels;
  }, [gridSize]);

  return (
    <group name="ground-plane">
      {/* Ground — purely visual, no event handlers */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial color="#9ca2a8" roughness={0.92} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>

      {/* Grid lines */}
      {gridVisible && (
        <gridHelper args={[gridSize, gridDivisions, '#606870', '#828a92']} position={[0, 0.01, 0]} />
      )}

      {/* Origin axes */}
      <group position={[0, 0.05, 0]}>
        <mesh position={[5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 10, 8]} />
          <meshStandardMaterial color="#ff3b30" emissive="#ff2211" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0, 5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 10, 8]} />
          <meshStandardMaterial color="#007aff" emissive="#0055dd" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 3, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 6, 8]} />
          <meshStandardMaterial color="#34c759" emissive="#22aa44" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Coordinate labels — only when close enough to matter */}
      {axisLabels.map((l) => (
        <Text key={l.key} position={l.position} fontSize={2} color="#485058"
          anchorX="center" anchorY="middle" rotation={[-Math.PI / 2, 0, 0]}>
          {l.text}
        </Text>
      ))}
      <Text position={[gridSize / 2 + 8, 0.1, 0]} fontSize={4} color="#ff3b30"
        anchorX="center" anchorY="middle" rotation={[-Math.PI / 2, 0, 0]}>X</Text>
      <Text position={[0, 0.1, gridSize / 2 + 8]} fontSize={4} color="#007aff"
        anchorX="center" anchorY="middle" rotation={[-Math.PI / 2, 0, 0]}>Z</Text>
    </group>
  );
}
