/**
 * CameraController
 * - 3D: PerspectiveCamera + OrbitControls (full rotate/pan/zoom)
 * - 2D: OrthographicCamera + custom PanZoom2DControls (true plan view looking straight down from y=800)
 *       Completely isolated from OrbitControls so spherical coordinate math (phi=90) never crushes camera.position.y to 0.
 *
 * When activeTool === 'move' | 'rotate': Controls are DISABLED so TransformControls grab pointer events.
 */
import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import useUIStore from '../../stores/useUIStore.js';

function PanZoom2DControls({ enabled = true, saved2D }) {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const lastMouse = useRef([0, 0]);

  useEffect(() => {
    if (!enabled || !camera.isOrthographicCamera) return;
    const domElement = gl.domElement;

    const onPointerDown = (e) => {
      // Allow pan on left click (0) or middle click (1)
      if (e.button === 0 || e.button === 1) {
        isDragging.current = true;
        lastMouse.current = [e.clientX, e.clientY];
        domElement.style.cursor = 'grabbing';
      }
    };

    const onPointerMove = (e) => {
      if (!isDragging.current || !camera.isOrthographicCamera) return;
      const dx = e.clientX - lastMouse.current[0];
      const dy = e.clientY - lastMouse.current[1];
      lastMouse.current = [e.clientX, e.clientY];

      // Convert screen pixels to world meters based on zoom factor
      const factor = 1 / (camera.zoom || 8);
      camera.position.x -= dx * factor;
      camera.position.z += dy * factor;
      saved2D.current.pos.copy(camera.position);
      camera.updateMatrixWorld();
    };

    const onPointerUp = () => {
      isDragging.current = false;
      domElement.style.cursor = 'default';
    };

    const onWheel = (e) => {
      if (!camera.isOrthographicCamera) return;
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      camera.zoom = Math.max(0.5, Math.min(250, camera.zoom * zoomFactor));
      saved2D.current.zoom = camera.zoom;
      camera.updateProjectionMatrix();
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('wheel', onWheel);
    };
  }, [enabled, camera, gl, saved2D]);

  return null;
}

export default function CameraController() {
  const viewMode   = useUIStore((s) => s.viewMode);
  const activeTool = useUIStore((s) => s.activeTool);
  const { camera } = useThree();
  const controlsRef = useRef();
  const prevMode = useRef(viewMode);
  const saved3D  = useRef({
    pos:    new THREE.Vector3(120, 90, 120),
    target: new THREE.Vector3(0,  0,  0),
  });
  const saved2D  = useRef({
    pos:    new THREE.Vector3(5, 800, 0),
    zoom:   8,
  });

  /* Switch camera behaviour when 2D/3D changes */
  useEffect(() => {
    if (viewMode === '2d') {
      const ctrl = controlsRef.current;
      if (prevMode.current === '3d' && ctrl) {
        saved3D.current.pos.copy(camera.position);
        saved3D.current.target.copy(ctrl.target);
        saved2D.current.pos.set(ctrl.target.x, 800, ctrl.target.z);
      }
      camera.position.set(saved2D.current.pos.x, 800, saved2D.current.pos.z);
      camera.up.set(0, 0, -1);
      camera.lookAt(saved2D.current.pos.x, 0, saved2D.current.pos.z);
      if (camera.isOrthographicCamera) {
        camera.zoom = saved2D.current.zoom;
        camera.updateProjectionMatrix();
      }
    } else {
      if (prevMode.current === '2d') {
        saved2D.current.pos.copy(camera.position);
        if (camera.isOrthographicCamera) {
          saved2D.current.zoom = camera.zoom;
        }
      }
      camera.up.set(0, 1, 0);
      camera.position.copy(saved3D.current.pos);
      const ctrl = controlsRef.current;
      if (ctrl) {
        ctrl.target.copy(saved3D.current.target);
        ctrl.object = camera;
        ctrl.update();
      }
    }
    prevMode.current = viewMode;
  }, [viewMode, camera]);

  /* Disable controls when using Move/Rotate tools so TransformControls work */
  const orbitEnabled = activeTool !== 'move' && activeTool !== 'rotate';
  const is2D = viewMode === '2d';

  return (
    <>
      {is2D ? (
        <>
          <OrthographicCamera
            makeDefault
            position={[saved2D.current.pos.x, 800, saved2D.current.pos.z]}
            up={[0, 0, -1]}
            zoom={saved2D.current.zoom}
            near={0.1}
            far={5000}
          />
          <PanZoom2DControls enabled={orbitEnabled} saved2D={saved2D} />
        </>
      ) : (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          camera={camera}
          enabled={orbitEnabled}
          enableRotate={true}
          enablePan={true}
          enableZoom={true}
          maxDistance={5000}
          minDistance={1}
          maxPolarAngle={Math.PI * 0.48}
          minPolarAngle={0}
          zoomSpeed={1.5}
          enableDamping={true}
          dampingFactor={0.07}
        />
      )}
    </>
  );
}
