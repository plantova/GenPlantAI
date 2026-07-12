/**
 * SelectionOutline — Renders wireframe outlines around selected objects
 * Uses EdgesGeometry on a bounding box for clean wireframe effect with subtle opacity pulse
 */
import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useUIStore from '../../stores/useUIStore';
import useProjectStore from '../../stores/useProjectStore';

function OutlineBox({ item }) {
  const lineRef = useRef();
  const { invalidate } = useThree();

  // Calculate bounding box from item dimensions
  const { geometry, position } = useMemo(() => {
    let w = 2, h = 2, d = 2;
    const dims = item.dimensions || {};
    const pos = [...(item.position || [0, 0, 0])];

    switch (item.type) {
      case 'column': {
        const r = (dims.diameter || 2) / 2;
        w = dims.diameter || 2;
        h = dims.height || 20;
        d = dims.diameter || 2;
        pos[1] = (item.position?.[1] || 0) + h / 2;
        break;
      }
      case 'horizontalVessel': {
        w = dims.diameter || 2;
        h = (dims.saddleHeight || 1) + (dims.diameter || 2);
        d = (dims.length || 6) + (dims.diameter || 2);
        pos[1] = (item.position?.[1] || 0) + h / 2;
        break;
      }
      case 'sphericalTank': {
        const diam = dims.diameter || 10;
        w = diam;
        h = (dims.legHeight || 5) + diam;
        d = diam;
        pos[1] = (item.position?.[1] || 0) + h / 2;
        break;
      }
      case 'sruFurnace': {
        w = dims.width || 6;
        h = (dims.height || 8) + (dims.stackHeight || 15);
        d = dims.depth || 4;
        pos[1] = (item.position?.[1] || 0) + h / 2;
        break;
      }
      case 'airCooler': {
        w = dims.width || 8;
        h = (dims.height || 4) + 0.5;
        d = dims.depth || 3;
        pos[1] = (item.position?.[1] || 0) + h / 2;
        break;
      }
      default: {
        // For structures or unknown, use generic bounding
        if (item.baysX) {
          w = (item.baysX || 3) * (item.bayWidth || 6);
          d = (item.baysZ || 1) * (item.bayLength || 6);
          h = Math.max(...(item.levels || [{ elevation: 4 }]).map((l) => l.elevation), 4);
          pos[1] = (item.position?.[1] || 0) + h / 2;
        }
      }
    }

    // Add padding
    const padding = 0.3;
    const boxGeo = new THREE.BoxGeometry(w + padding, h + padding, d + padding);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);

    return { geometry: edgesGeo, position: pos };
  }, [item]);

  // Subtle opacity pulse
  useFrame((state) => {
    if (!lineRef.current) return;
    const t = state.clock.getElapsedTime();
    const opacity = 0.5 + Math.sin(t * 3) * 0.2;
    lineRef.current.material.opacity = opacity;
    invalidate();
  });

  return (
    <lineSegments
      ref={lineRef}
      geometry={geometry}
      position={position}
      rotation={item.rotation || [0, 0, 0]}
    >
      <lineBasicMaterial
        color="#4a9eff"
        transparent={true}
        opacity={0.7}
        linewidth={1}
        depthTest={true}
      />
    </lineSegments>
  );
}

export default function SelectionOutline() {
  const selectedIds = useUIStore((s) => s.selectedIds);
  const equipment = useProjectStore((s) => s.equipment);
  const structures = useProjectStore((s) => s.structures);

  // Find all selected items (equipment + structures)
  const selectedItems = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const items = [];
    for (const id of selectedIds) {
      const eq = equipment.find((e) => e.id === id);
      if (eq) {
        items.push(eq);
        continue;
      }
      const str = structures.find((s) => s.id === id);
      if (str) {
        items.push(str);
      }
    }
    return items;
  }, [selectedIds, equipment, structures]);

  if (selectedItems.length === 0) return null;

  return (
    <group name="selection-outlines">
      {selectedItems.map((item) => (
        <OutlineBox key={item.id} item={item} />
      ))}
    </group>
  );
}
