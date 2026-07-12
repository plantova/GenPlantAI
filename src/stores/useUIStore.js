import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  // View mode
  viewMode: '3d', // '2d' | '3d'
  theme: 'dark',   // 'dark' | 'light'
  
  // Grid settings
  gridVisible: true,
  gridSpacing: 10, // meters
  gridSize: 1000, // meters (site size)
  snapToGrid: true,
  snapAngle: 15, // degrees

  // Active tool
  activeTool: 'select', // 'select' | 'place' | 'move' | 'rotate' | 'route' | 'measure'
  
  // Placement state
  placementType: null, // equipment type being placed
  placementPreview: null, // preview data for placement ghost

  // Selection
  selectedIds: [],
  hoveredId: null,

  // Cursor / pointer
  cursorPosition: [0, 0, 0],
  cursorGridPosition: [0, 0, 0],

  // Panel visibility
  sidebarOpen: true,
  propertyPanelOpen: false,

  // Dialog states
  excelImportOpen: false,
  pipeRoutingOpen: false,
  mtoExportOpen: false,
  structureDialogOpen: false,
  projectSettingsOpen: false,

  // Zoom / camera
  zoomLevel: 1,

  // Notifications
  notifications: [],

  // ─── View Actions ───
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleViewMode: () => set((s) => ({ viewMode: s.viewMode === '3d' ? '2d' : '3d' })),
  toggleTheme: () => {
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    });
  },

  // ─── Grid Actions ───
  setGridSpacing: (spacing) => set({ gridSpacing: spacing }),
  toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  setSnapAngle: (angle) => set({ snapAngle: angle }),

  // ─── Tool Actions ───
  setActiveTool: (tool) => {
    set({ 
      activeTool: tool,
      placementType: tool === 'select' ? null : get().placementType,
    });
  },

  startPlacement: (equipmentType) => {
    set({
      activeTool: 'place',
      placementType: equipmentType,
    });
  },

  cancelPlacement: () => {
    set({
      activeTool: 'select',
      placementType: null,
      placementPreview: null,
    });
  },

  // ─── Selection Actions ───
  select: (id) => {
    set({
      selectedIds: [id],
      propertyPanelOpen: true,
    });
  },

  multiSelect: (id) => {
    set((state) => {
      const ids = state.selectedIds.includes(id)
        ? state.selectedIds.filter((i) => i !== id)
        : [...state.selectedIds, id];
      return {
        selectedIds: ids,
        propertyPanelOpen: ids.length > 0,
      };
    });
  },

  clearSelection: () => {
    set({
      selectedIds: [],
      propertyPanelOpen: false,
    });
  },

  setHovered: (id) => set({ hoveredId: id }),

  // ─── Cursor Actions ───
  setCursorPosition: (pos) => set({ cursorPosition: pos }),
  setCursorGridPosition: (pos) => set({ cursorGridPosition: pos }),
  setZoomLevel: (level) => set({ zoomLevel: level }),

  // ─── Panel Actions ───
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setPropertyPanelOpen: (open) => set({ propertyPanelOpen: open }),

  // ─── Dialog Actions ───
  openExcelImport: () => set({ excelImportOpen: true }),
  closeExcelImport: () => set({ excelImportOpen: false }),
  openPipeRouting: () => set({ pipeRoutingOpen: true }),
  closePipeRouting: () => set({ pipeRoutingOpen: false }),
  openMTOExport: () => set({ mtoExportOpen: true }),
  closeMTOExport: () => set({ mtoExportOpen: false }),
  openStructureDialog: () => set({ structureDialogOpen: true }),
  closeStructureDialog: () => set({ structureDialogOpen: false }),
  openProjectSettings: () => set({ projectSettingsOpen: true }),
  closeProjectSettings: () => set({ projectSettingsOpen: false }),

  // ─── Notifications ───
  addNotification: (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }));
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));

export default useUIStore;
