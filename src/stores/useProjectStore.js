import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const useProjectStore = create((set, get) => ({
  // Project metadata
  projectName: 'Plantova 3D',
  projectId: uuidv4(),
  lastSaved: null,
  isDirty: false,

  // Equipment items placed in the scene
  equipment: [],

  // Structural steel (pipe racks, platforms)
  structures: [],

  // Routed pipe lines
  pipes: [],

  // Undo/redo history
  history: [],
  historyIndex: -1,
  maxHistory: 50,

  // ─── Project Actions ───
  setProjectName: (name) => set({ projectName: name, isDirty: true }),

  // ─── Equipment Actions ───
  addEquipment: (equipData) => {
    const item = {
      id: uuidv4(),
      tag: equipData.tag || `EQ-${String(get().equipment.length + 1).padStart(3, '0')}`,
      type: equipData.type,
      position: equipData.position || [0, 0, 0],
      rotation: equipData.rotation || [0, 0, 0],
      dimensions: { ...equipData.dimensions },
      nozzles: equipData.nozzles || [],
      designTemperature: equipData.designTemperature || 20,
      designPressure: equipData.designPressure || 0,
      color: equipData.color || '#7a8a9a',
      createdAt: Date.now(),
    };
    set((state) => ({
      equipment: [...state.equipment, item],
      isDirty: true,
    }));
    get()._pushHistory();
    return item.id;
  },

  updateEquipment: (id, updates) => {
    set((state) => ({
      equipment: state.equipment.map((eq) =>
        eq.id === id ? { ...eq, ...updates } : eq
      ),
      isDirty: true,
    }));
    get()._pushHistory();
  },

  removeEquipment: (id) => {
    set((state) => ({
      equipment: state.equipment.filter((eq) => eq.id !== id),
      isDirty: true,
    }));
    get()._pushHistory();
  },

  // ─── Structure Actions ───
  addStructure: (structData) => {
    const item = {
      id: uuidv4(),
      tag: structData.tag || `STR-${String(get().structures.length + 1).padStart(3, '0')}`,
      type: structData.type || 'pipeRack',
      position: structData.position || [0, 0, 0],
      rotation: structData.rotation || [0, 0, 0],
      levels: structData.levels || [{ elevation: 4, label: 'Level 1' }],
      bayWidth: structData.bayWidth || 6,
      bayLength: structData.bayLength || 6,
      baysX: structData.baysX || 3,
      baysZ: structData.baysZ || 1,
      columnSize: structData.columnSize || { w: 0.3, d: 0.3 },
      beamSize: structData.beamSize || { w: 0.3, h: 0.4 },
      color: structData.color || '#5a6a7a',
      createdAt: Date.now(),
    };
    set((state) => ({
      structures: [...state.structures, item],
      isDirty: true,
    }));
    get()._pushHistory();
    return item.id;
  },

  updateStructure: (id, updates) => {
    set((state) => ({
      structures: state.structures.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
      isDirty: true,
    }));
    get()._pushHistory();
  },

  removeStructure: (id) => {
    set((state) => ({
      structures: state.structures.filter((s) => s.id !== id),
      isDirty: true,
    }));
    get()._pushHistory();
  },

  // ─── Pipe Actions ───
  addPipe: (pipeData) => {
    const item = {
      id: uuidv4(),
      lineNumber: pipeData.lineNumber || `L-${String(get().pipes.length + 1).padStart(3, '0')}`,
      fromTag: pipeData.fromTag || '',
      fromNozzle: pipeData.fromNozzle || '',
      toTag: pipeData.toTag || '',
      toNozzle: pipeData.toNozzle || '',
      segments: pipeData.segments || [],
      nominalSize: pipeData.nominalSize || 6,
      schedule: pipeData.schedule || 'STD',
      material: pipeData.material || 'CS-A106B',
      designTemperature: pipeData.designTemperature || 20,
      designPressure: pipeData.designPressure || 0,
      insulationType: pipeData.insulationType || 'None',
      insulationThickness: pipeData.insulationThickness || 0,
      color: pipeData.color || '#4a9eff',
      flexibilityStatus: pipeData.flexibilityStatus || 'unchecked',
      createdAt: Date.now(),
    };
    set((state) => ({
      pipes: [...state.pipes, item],
      isDirty: true,
    }));
    get()._pushHistory();
    return item.id;
  },

  updatePipe: (id, updates) => {
    set((state) => ({
      pipes: state.pipes.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      isDirty: true,
    }));
    get()._pushHistory();
  },

  removePipe: (id) => {
    set((state) => ({
      pipes: state.pipes.filter((p) => p.id !== id),
      isDirty: true,
    }));
    get()._pushHistory();
  },

  // ─── Bulk Operations ───
  addEquipmentBatch: (items) => {
    const newEquipment = items.map((equipData, index) => ({
      id: uuidv4(),
      tag: equipData.tag || `EQ-${String(get().equipment.length + index + 1).padStart(3, '0')}`,
      type: equipData.type,
      position: equipData.position || [0, 0, 0],
      rotation: equipData.rotation || [0, 0, 0],
      dimensions: { ...equipData.dimensions },
      nozzles: equipData.nozzles || [],
      designTemperature: equipData.designTemperature || 20,
      designPressure: equipData.designPressure || 0,
      color: equipData.color || '#7a8a9a',
      createdAt: Date.now(),
    }));
    set((state) => ({
      equipment: [...state.equipment, ...newEquipment],
      isDirty: true,
    }));
    get()._pushHistory();
  },

  clearAll: () => {
    set({
      equipment: [],
      structures: [],
      pipes: [],
      isDirty: true,
    });
    get()._pushHistory();
  },

  // ─── Serialization ───
  getProjectData: () => {
    const state = get();
    return {
      projectName: state.projectName,
      projectId: state.projectId,
      equipment: state.equipment,
      structures: state.structures,
      pipes: state.pipes,
      exportedAt: new Date().toISOString(),
    };
  },

  loadProjectData: (data) => {
    set({
      projectName: data.projectName || 'Imported Project',
      projectId: data.projectId || uuidv4(),
      equipment: data.equipment || [],
      structures: data.structures || [],
      pipes: data.pipes || [],
      isDirty: false,
      lastSaved: Date.now(),
    });
  },

  // ─── History (simple snapshot-based undo/redo) ───
  _pushHistory: () => {
    const state = get();
    const snapshot = {
      equipment: JSON.parse(JSON.stringify(state.equipment)),
      structures: JSON.parse(JSON.stringify(state.structures)),
      pipes: JSON.parse(JSON.stringify(state.pipes)),
    };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(snapshot);
    if (newHistory.length > state.maxHistory) {
      newHistory.shift();
    }
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const snapshot = state.history[state.historyIndex - 1];
      set({
        equipment: snapshot.equipment,
        structures: snapshot.structures,
        pipes: snapshot.pipes,
        historyIndex: state.historyIndex - 1,
        isDirty: true,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const snapshot = state.history[state.historyIndex + 1];
      set({
        equipment: snapshot.equipment,
        structures: snapshot.structures,
        pipes: snapshot.pipes,
        historyIndex: state.historyIndex + 1,
        isDirty: true,
      });
    }
  },
}));

export default useProjectStore;
