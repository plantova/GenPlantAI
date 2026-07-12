/**
 * SceneCanvas — Main 3D viewport.
 *
 * Key architecture decisions:
 *  1. frameloop="always" — smooth orbit/pan/zoom
 *  2. Placement clicks are handled at the DOM level via manual Raycaster
 *     against the Y=0 ground plane.  This bypasses OrbitControls event
 *     interception and is 100% reliable regardless of R3F version.
 *  3. CameraExposer exposes the R3F camera into a ref the parent can use.
 */
import React, { Suspense, useRef, useCallback, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useProjectStore from '../../stores/useProjectStore.js';
import useUIStore from '../../stores/useUIStore.js';
import GroundPlane from './GroundPlane.jsx';
import CameraController from './CameraController.jsx';
import EquipmentMesh from './EquipmentMesh.jsx';
import StructuralSteel from './StructuralSteel.jsx';
import PipeMesh from './PipeMesh.jsx';
import { getDefaultDimensions, getDefaultNozzles } from '../../equipment/library.js';
import { snapToGrid } from '../../utils/snapEngine.js';

/* ─── Expose R3F camera to a parent-owned ref ─────────────────── */
const GROUND_Y = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function CameraExposer({ cameraRef }) {
  const { camera } = useThree();
  useEffect(() => { cameraRef.current = camera; }, [camera, cameraRef]);
  return null;
}

/* ─── Cursor tracker inside the canvas ───────────────────────── */
function CursorTracker() {
  const { camera } = useThree();
  const setCursorPosition = useUIStore((s) => s.setCursorPosition);
  return null; // cursor pos is updated in parent via pointer move
}

/* ─── All scene content ──────────────────────────────────────── */
function SceneContents({ cameraRef }) {
  const equipment  = useProjectStore((s) => s.equipment);
  const structures = useProjectStore((s) => s.structures);
  const pipes      = useProjectStore((s) => s.pipes);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[200, 300, 200]} intensity={0.9} castShadow />
      <hemisphereLight args={['#b1e1ff', '#1a1a2a', 0.4]} />

      {/* Camera ref + controls */}
      <CameraExposer cameraRef={cameraRef} />
      <CameraController />

      {/* Ground plane (visual only — clicks handled at DOM level) */}
      <GroundPlane />

      {/* Scene objects */}
      {equipment.map((eq) => <EquipmentMesh  key={eq.id} data={eq} />)}
      {structures.map((s)  => <StructuralSteel key={s.id} data={s}  />)}
      {pipes.map((p)       => <PipeMesh        key={p.id} data={p}  />)}
    </>
  );
}

/* ─── Root canvas component ──────────────────────────────────── */
export default function SceneCanvas() {
  const containerRef = useRef();
  const cameraRef    = useRef();
  const raycaster    = useRef(new THREE.Raycaster());
  const ndc          = useRef(new THREE.Vector2());
  const hitPoint     = useRef(new THREE.Vector3());

  /* Resolve NDC coordinates from a pointer event */
  const getNDC = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    ndc.current.set(
      ((e.clientX - rect.left)  / rect.width)  * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    return ndc.current;
  }, []);

  /* ── Click handler: equipment placement ── */
  const handlePointerUp = useCallback((e) => {
    // left button only, must not be a drag
    if (e.button !== 0) return;

    const ui  = useUIStore.getState();
    const cam = cameraRef.current;
    if (!cam) return;
    if (ui.activeTool !== 'place' || !ui.placementType) return;

    const coords = getNDC(e);
    if (!coords) return;

    raycaster.current.setFromCamera(coords, cam);
    const hit = raycaster.current.ray.intersectPlane(GROUND_Y, hitPoint.current);
    if (!hit) return;

    let pos = [hitPoint.current.x, 0, hitPoint.current.z];
    if (ui.snapToGrid) pos = snapToGrid(pos, ui.gridSpacing);

    useProjectStore.getState().addEquipment({
      type:       ui.placementType,
      position:   pos,
      rotation:   [0, 0, 0],
      dimensions: getDefaultDimensions(ui.placementType),
      nozzles:    getDefaultNozzles(ui.placementType),
    });
    ui.cancelPlacement();
    ui.addNotification(`Placed ${ui.placementType}`, 'success', 2000);
  }, [getNDC]);

  /* ── Pointer move: cursor world position ── */
  const handlePointerMove = useCallback((e) => {
    const cam = cameraRef.current;
    if (!cam) return;

    const coords = getNDC(e);
    if (!coords) return;

    raycaster.current.setFromCamera(coords, cam);
    const hit = raycaster.current.ray.intersectPlane(GROUND_Y, hitPoint.current);
    if (hit) {
      useUIStore.getState().setCursorPosition([
        hitPoint.current.x, 0, hitPoint.current.z,
      ]);
    }
  }, [getNDC]);

  /* Cursor style when placing */
  const activeTool = useUIStore((s) => s.activeTool);
  const cursorStyle = activeTool === 'place' ? 'crosshair' : 'default';

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, cursor: cursorStyle }}
      onPointerUp={handlePointerMove && handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      <Canvas
        frameloop="always"
        camera={{ position: [120, 90, 120], fov: 55, near: 0.1, far: 5000 }}
        shadows={{ type: 2 }}   /* PCFShadowMap = 2, avoids PCFSoftShadowMap deprecation warning */
        gl={{ antialias: true, logarithmicDepthBuffer: true, alpha: true }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Suspense fallback={null}>
          <SceneContents cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
