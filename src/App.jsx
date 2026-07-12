import React, { useEffect, useCallback } from 'react';
import './App.css';
import SceneCanvas from './components/canvas/SceneCanvas.jsx';
import Toolbar from './components/ui/Toolbar.jsx';
import LeftPanel from './components/ui/LeftPanel.jsx';
import StatusBar from './components/ui/StatusBar.jsx';
import ExcelImportDialog from './components/ui/ExcelImportDialog.jsx';
import PipeRoutingDialog from './components/ui/PipeRoutingDialog.jsx';
import MTOExportDialog from './components/ui/MTOExportDialog.jsx';
import StructureDialog from './components/ui/StructureDialog.jsx';
import NotificationToast from './components/ui/NotificationToast.jsx';
import useUIStore from './stores/useUIStore.js';
import useProjectStore from './stores/useProjectStore.js';
import { setupAutoSave, saveToIndexedDB } from './io/projectIO.js';
import { ZoomIn, ZoomOut, Home, Maximize2 } from 'lucide-react';

export default function App() {
  const selectedIds = useUIStore((s) => s.selectedIds);
  const clearSelection = useUIStore((s) => s.clearSelection);
  const cancelPlacement = useUIStore((s) => s.cancelPlacement);
  const placementType = useUIStore((s) => s.placementType);
  const activeTool = useUIStore((s) => s.activeTool);
  const toggleGrid = useUIStore((s) => s.toggleGrid);
  const toggleSnap = useUIStore((s) => s.toggleSnap);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const addNotification = useUIStore((s) => s.addNotification);

  const removeEquipment = useProjectStore((s) => s.removeEquipment);
  const removeStructure = useProjectStore((s) => s.removeStructure);
  const removePipe = useProjectStore((s) => s.removePipe);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const getProjectData = useProjectStore((s) => s.getProjectData);
  const equipment = useProjectStore((s) => s.equipment);
  const structures = useProjectStore((s) => s.structures);
  const pipes = useProjectStore((s) => s.pipes);

  const handleKeyDown = useCallback((e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.key === 'Escape') { cancelPlacement(); clearSelection(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      selectedIds.forEach((id) => {
        if (equipment.find((eq) => eq.id === id)) removeEquipment(id);
        else if (structures.find((s) => s.id === id)) removeStructure(id);
        else if (pipes.find((p) => p.id === id)) removePipe(id);
      });
      if (selectedIds.length > 0) { clearSelection(); addNotification('Deleted', 'info', 1500); }
    } else if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
    else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); }
    else if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveToIndexedDB(getProjectData()).then(() => addNotification('Project saved', 'success', 2000));
    }
    else if (e.key === 'g' || e.key === 'G') toggleGrid();
    else if (e.key === '2') setViewMode('2d');
    else if (e.key === '3') setViewMode('3d');
  }, [selectedIds, equipment, structures, pipes, cancelPlacement, clearSelection,
      removeEquipment, removeStructure, removePipe, undo, redo,
      toggleGrid, toggleSnap, setViewMode, addNotification, getProjectData]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const cleanup = setupAutoSave(getProjectData, 60000);
    return cleanup;
  }, [getProjectData]);

  return (
    <div className="app">
      {/* Ribbon Toolbar — top */}
      <div className="app-toolbar">
        <Toolbar />
      </div>

      {/* Left Panel — Items + Equipment Library + Properties */}
      <div className="app-panel">
        <LeftPanel />
      </div>

      {/* Main 3D Canvas */}
      <div className="app-canvas">
        <SceneCanvas />

        {/* Placement hint overlay */}
        {activeTool === 'place' && placementType && (
          <div className="placement-indicator">
            <span>📍</span> Click on canvas to place · <strong>Esc</strong> to cancel
          </div>
        )}

        {/* Right-edge view controls (like Chili3D) */}
        <div className="view-controls">
          <button className="view-control-btn" title="Zoom In (+)" onClick={() => {}}>
            <ZoomIn size={14} />
          </button>
          <button className="view-control-btn" title="Zoom Out (-)" onClick={() => {}}>
            <ZoomOut size={14} />
          </button>
          <button className="view-control-btn" title="Fit to Screen (F)" onClick={() => {}}>
            <Maximize2 size={14} />
          </button>
          <button className="view-control-btn" title="Home View (H)" onClick={() => {}}>
            <Home size={14} />
          </button>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="app-statusbar">
        <StatusBar />
      </div>

      {/* Floating Dialogs */}
      <ExcelImportDialog />
      <PipeRoutingDialog />
      <MTOExportDialog />
      <StructureDialog />
      <NotificationToast />
    </div>
  );
}
