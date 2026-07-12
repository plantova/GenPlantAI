import React from 'react';
import useUIStore from '../../stores/useUIStore.js';
import useProjectStore from '../../stores/useProjectStore.js';

export default function StatusBar() {
  const cursorPosition = useUIStore((s) => s.cursorPosition);
  const cursorGridPosition = useUIStore((s) => s.cursorGridPosition);
  const activeTool = useUIStore((s) => s.activeTool);
  const snapToGrid = useUIStore((s) => s.snapToGrid);
  const viewMode = useUIStore((s) => s.viewMode);
  const zoomLevel = useUIStore((s) => s.zoomLevel);
  const equipment = useProjectStore((s) => s.equipment);
  const structures = useProjectStore((s) => s.structures);
  const pipes = useProjectStore((s) => s.pipes);

  const toolNames = {
    select: 'Select',
    place: 'Place',
    move: 'Move',
    rotate: 'Rotate',
    route: 'Route Pipe',
    measure: 'Measure',
  };

  const fmt = (v) => (typeof v === 'number' ? v.toFixed(1) : '0.0');

  return (
    <div className="statusbar">
      <span className="status-item">
        <span className="status-label">Cursor</span>
        X: {fmt(cursorPosition[0])} &nbsp;Y: {fmt(cursorPosition[1])} &nbsp;Z: {fmt(cursorPosition[2])}
      </span>
      <span className="status-divider" />
      <span className="status-item">
        <span className="status-label">Grid</span>
        ({fmt(cursorGridPosition[0])}, {fmt(cursorGridPosition[2])})
      </span>
      <span className="status-divider" />
      <span className="status-item">
        <span className="status-label">Tool</span>
        {toolNames[activeTool] || activeTool}
      </span>
      <span className="status-divider" />
      <span className="status-item">
        <span
          className="snap-dot"
          style={{ background: snapToGrid ? '#2ecc71' : '#e74c3c' }}
          title={snapToGrid ? 'Snap ON' : 'Snap OFF'}
        />
        Snap {snapToGrid ? 'ON' : 'OFF'}
      </span>
      <span className="status-divider" />
      <span className="status-item view-badge">{viewMode === '2d' ? '2D Plan' : '3D View'}</span>
      <span className="status-divider" />
      <span className="status-item">{Math.round(zoomLevel * 100)}%</span>
      <span className="status-divider" />
      <span className="status-item">
        {equipment.length + structures.length + pipes.length} objects
      </span>
      <span className="status-divider" />
      <span className="status-item units-label">meters</span>
    </div>
  );
}
