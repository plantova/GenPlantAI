import React, { useState } from 'react';
import {
  Hexagon, MousePointer2, Move3d, RotateCcw,
  LayoutGrid, Box, Grid3X3, Magnet,
  FileSpreadsheet, Download, GitBranch, Building2,
  Save, FolderOpen, FilePlus, ChevronDown,
  Undo2, Redo2, Ruler, Sun, Moon, Zap, Printer,
} from 'lucide-react';
import useUIStore from '../../stores/useUIStore.js';
import useProjectStore from '../../stores/useProjectStore.js';
import { exportEquipmentExcel } from '../../io/excelExport.js';
import { exportProjectFile, saveToIndexedDB } from '../../io/projectIO.js';
import { SAMPLE_LAYOUT, SAMPLE_STRUCTURE } from '../../equipment/sampleLayout.js';
import { exportPlotPlanPDF } from '../../io/pdfExport.js';

const GRID_SPACINGS = [5, 10, 25, 50];

export default function Toolbar() {
  const activeTool      = useUIStore((s) => s.activeTool);
  const viewMode        = useUIStore((s) => s.viewMode);
  const gridVisible     = useUIStore((s) => s.gridVisible);
  const gridSpacing     = useUIStore((s) => s.gridSpacing);
  const snapToGrid      = useUIStore((s) => s.snapToGrid);
  const theme           = useUIStore((s) => s.theme);
  const setActiveTool   = useUIStore((s) => s.setActiveTool);
  const toggleViewMode  = useUIStore((s) => s.toggleViewMode);
  const toggleGrid      = useUIStore((s) => s.toggleGrid);
  const setGridSpacing  = useUIStore((s) => s.setGridSpacing);
  const toggleSnap      = useUIStore((s) => s.toggleSnap);
  const toggleTheme     = useUIStore((s) => s.toggleTheme);
  const openExcelImport = useUIStore((s) => s.openExcelImport);
  const openMTOExport   = useUIStore((s) => s.openMTOExport);
  const openPipeRouting = useUIStore((s) => s.openPipeRouting);
  const openStructureDialog = useUIStore((s) => s.openStructureDialog);
  const addNotification = useUIStore((s) => s.addNotification);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const getProjectData  = useProjectStore((s) => s.getProjectData);
  const projectName     = useProjectStore((s) => s.projectName);
  const equipment       = useProjectStore((s) => s.equipment);
  const structures      = useProjectStore((s) => s.structures);
  const pipes           = useProjectStore((s) => s.pipes);
  const addEquipmentBatch = useProjectStore((s) => s.addEquipmentBatch);
  const addStructure    = useProjectStore((s) => s.addStructure);
  const clearAll        = useProjectStore((s) => s.clearAll);

  const [gridDrop, setGridDrop] = useState(false);

  const handleDemoLayout = () => {
    clearAll();
    addEquipmentBatch(SAMPLE_LAYOUT);
    addStructure(SAMPLE_STRUCTURE);
    addNotification('Demo CDU layout loaded — 10 equipment items placed', 'success', 3500);
  };

  /* Toolbar button (icon + label stacked) */
  const T = ({ tool, Icon, label, title }) => (
    <button id={`tool-${tool}`} className={`tbtn ${activeTool === tool ? 'active' : ''}`}
      onClick={() => setActiveTool(tool)} title={title || label}>
      <Icon size={15} /><span className="tbtn-label">{label}</span>
    </button>
  );

  const Btn = ({ id, Icon, label, onClick, active, title }) => (
    <button id={id} className={`tbtn ${active ? 'active' : ''}`} onClick={onClick} title={title || label}>
      <Icon size={15} />{label && <span className="tbtn-label">{label}</span>}
    </button>
  );

  return (
    <>
      {/* Logo */}
      <div className="toolbar-logo">
        <Hexagon size={18} className="logo-icon" />
        <span className="logo-text">Plantova <span className="logo-accent">3D</span></span>
      </div>
      <div className="toolbar-divider" />

      {/* Undo / Redo */}
      <div className="toolbar-group">
        <button className="tbtn-icon" onClick={undo} title="Undo (Ctrl+Z)"><Undo2 size={14} /></button>
        <button className="tbtn-icon" onClick={redo} title="Redo (Ctrl+Y)"><Redo2 size={14} /></button>
      </div>
      <div className="toolbar-divider" />

      {/* Select / Transform tools */}
      <div className="toolbar-group">
        <T tool="select"  Icon={MousePointer2} label="Select"  title="Select (Esc)" />
        <T tool="move"    Icon={Move3d}        label="Move"    title="Move item — drag gizmo arrows" />
        <T tool="rotate"  Icon={RotateCcw}     label="Rotate"  title="Rotate item — drag gizmo arcs" />
        <T tool="measure" Icon={Ruler}         label="Measure" title="Measure distance" />
      </div>
      <div className="toolbar-divider" />

      {/* 2D / 3D toggle */}
      <div className="view-toggle">
        <button id="view-2d" className={`tbtn ${viewMode === '2d' ? 'active' : ''}`}
          onClick={() => { if (viewMode !== '2d') toggleViewMode(); }} title="Plan View — top-down orthographic (2)">
          <LayoutGrid size={14} /><span className="tbtn-label">2D</span>
        </button>
        <button id="view-3d" className={`tbtn ${viewMode === '3d' ? 'active' : ''}`}
          onClick={() => { if (viewMode !== '3d') toggleViewMode(); }} title="3D Perspective View (3)">
          <Box size={14} /><span className="tbtn-label">3D</span>
        </button>
      </div>
      <div className="toolbar-divider" />

      {/* Grid / Snap */}
      <div className="toolbar-group">
        <Btn id="grid-toggle" Icon={Grid3X3} label="Grid" onClick={toggleGrid} active={gridVisible} title="Toggle Grid (G)" />
        <div className="dropdown-wrap">
          <button id="grid-spacing-btn" className="tbtn" onClick={() => setGridDrop((v) => !v)}
            title="Grid spacing" style={{ flexDirection: 'row', gap: 3 }}>
            <span style={{ fontSize: 11 }}>{gridSpacing}m</span><ChevronDown size={10} />
          </button>
          {gridDrop && (
            <div className="dropdown-menu">
              {GRID_SPACINGS.map((sp) => (
                <button key={sp} className={`dropdown-item ${gridSpacing === sp ? 'active' : ''}`}
                  onClick={() => { setGridSpacing(sp); setGridDrop(false); }}>{sp} m</button>
              ))}
            </div>
          )}
        </div>
        <Btn id="snap-toggle" Icon={Magnet} label="Snap" onClick={toggleSnap} active={snapToGrid} title="Toggle Grid Snap" />
      </div>
      <div className="toolbar-divider" />

      {/* Actions */}
      <div className="toolbar-group">
        <Btn id="route-pipes-btn"   Icon={GitBranch}  label="Route"     onClick={openPipeRouting}     title="Route Pipe Line" />
        <Btn id="add-structure-btn" Icon={Building2}   label="Structure" onClick={openStructureDialog} title="Add Pipe Rack" />
        <button id="demo-layout-btn" className="tbtn"
          style={{ background: 'rgba(46,204,113,0.12)', borderColor: '#2ecc71', color: '#2ecc71' }}
          onClick={handleDemoLayout} title="Load a pre-built CDU demo layout with 10 equipment items">
          <Zap size={15} /><span className="tbtn-label">Demo</span>
        </button>
      </div>
      <div className="toolbar-divider" />

      {/* Import / Export */}
      <div className="toolbar-group">
        <Btn id="import-excel-btn" Icon={FileSpreadsheet} label="Import" onClick={openExcelImport} title="Import Equipment from Excel" />
        <Btn id="export-mto-btn"   Icon={Download}         label="MTO"    onClick={openMTOExport}   title="Export Material Take-Off" />
        <Btn id="export-layout-btn" Icon={FilePlus}        label="Layout"
          onClick={() => { exportEquipmentExcel(equipment); addNotification('Layout exported', 'success', 2000); }}
          title="Export Equipment Layout to Excel" />
        <Btn id="export-pdf-btn"   Icon={Printer}          label="Plot Plan"
          onClick={() => { exportPlotPlanPDF(projectName, equipment, structures, pipes); addNotification('Plot Plan PDF generated', 'success', 2000); }}
          title="Export 2D PDF Plot Plan Drawing & Schedules" />
      </div>
      <div className="toolbar-divider" />

      {/* Project */}
      <div className="toolbar-group">
        <Btn id="save-btn" Icon={Save} label="Save"
          onClick={() => saveToIndexedDB(getProjectData()).then(() => addNotification('Saved', 'success', 2000))}
          title="Save (Ctrl+S)" />
        <Btn id="export-project-btn" Icon={FolderOpen} label="Export"
          onClick={() => { exportProjectFile(getProjectData()); addNotification('Exported', 'success', 2000); }}
          title="Export project JSON" />
      </div>
      <div className="toolbar-divider" />

      {/* Theme toggle */}
      <button className="tbtn-icon" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        style={{ marginLeft: 'auto' }}>
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </>
  );
}
