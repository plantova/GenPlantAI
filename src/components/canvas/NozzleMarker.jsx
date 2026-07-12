/**
 * NozzleMarker — Torus ring at nozzle location, always visible.
 * `prominent` = true when parent equipment is selected (brighter, larger label).
 */
import React, { useState, useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getNozzleWorldPosition } from '../../utils/snapEngine.js';
import useProjectStore from '../../stores/useProjectStore.js';

export default function NozzleMarker({ equipment, nozzle, prominent = false }) {
  const [hovered, setHovered] = useState(false);
  const pipes = useProjectStore((s) => s.pipes);

  /* Connected? */
  const isConnected = useMemo(() =>
    pipes.some((p) =>
      (p.fromTag === equipment.tag && p.fromNozzle === nozzle.id) ||
      (p.toTag   === equipment.tag && p.toNozzle   === nozzle.id)
    ),
  [pipes, equipment.tag, nozzle.id]);

  /* World position relative to equipment group origin */
  const localPos = useMemo(() =>
    getNozzleWorldPosition(equipment, nozzle).map(
      (v, i) => v - (equipment.position?.[i] ?? 0)
    ),
  [equipment, nozzle]);

  const color         = isConnected ? '#ff9f43' : '#2ecc71';
  const opacity       = prominent ? 1.0 : 0.45;
  const ringScale     = prominent ? 1.0 : 0.7;

  return (
    <group position={localPos}>
      {/* Torus ring */}
      <mesh
        scale={[ringScale, ringScale, ringScale]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e)  => { e.stopPropagation(); setHovered(false); }}
      >
        <torusGeometry args={[0.28, 0.07, 8, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={hovered ? color : '#000'}
          emissiveIntensity={hovered ? 0.7 : (prominent ? 0.3 : 0.1)}
          transparent
          opacity={opacity}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Nozzle stub */}
      <mesh scale={[ringScale, ringScale, ringScale]}>
        <cylinderGeometry args={[0.12, 0.12, 0.35, 10]} />
        <meshStandardMaterial color={color} transparent opacity={opacity * 0.8} />
      </mesh>

      {/* Hover label (only in prominent/selected mode) */}
      {prominent && hovered && (
        <Html center distanceFactor={50} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(14,16,28,0.92)',
            color: '#e0e8ff',
            padding: '3px 9px',
            borderRadius: 4,
            fontSize: 11,
            fontFamily: 'Inter, monospace',
            border: `1px solid ${color}`,
            whiteSpace: 'nowrap',
          }}>
            <strong>{nozzle.id}</strong> — {nozzle.label}<br />
            <span style={{ fontSize: 9, color: '#8890aa' }}>
              {nozzle.size}" {nozzle.rating} {isConnected ? '● connected' : '○ free'}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
