import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import useUIStore from '../../stores/useUIStore.js';
import useProjectStore from '../../stores/useProjectStore.js';

const DEFAULT_FORM = {
  tag: '',
  type: 'pipeRack',
  x: 0, y: 0, z: 0,
  levels: [{ elevation: 4, label: 'Level 1' }, { elevation: 8, label: 'Level 2' }],
  bayWidth: 6, bayLength: 6,
  baysX: 3, baysZ: 1,
  colW: 0.3, colD: 0.3,
  beamW: 0.3, beamH: 0.4,
};

export default function StructureDialog() {
  const open = useUIStore((s) => s.structureDialogOpen);
  const closeStructureDialog = useUIStore((s) => s.closeStructureDialog);
  const addNotification = useUIStore((s) => s.addNotification);
  const addStructure = useProjectStore((s) => s.addStructure);

  const [form, setForm] = useState(DEFAULT_FORM);

  if (!open) return null;

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const setNum = (key, e) => set(key, parseFloat(e.target.value) || 0);

  const addLevel = () =>
    set('levels', [...form.levels, { elevation: (form.levels.at(-1)?.elevation || 0) + 4, label: `Level ${form.levels.length + 1}` }]);

  const removeLevel = (i) =>
    set('levels', form.levels.filter((_, j) => j !== i));

  const updateLevel = (i, val) =>
    set('levels', form.levels.map((l, j) => j === i ? { ...l, elevation: parseFloat(val) || 0 } : l));

  const handleCreate = () => {
    addStructure({
      tag: form.tag || `STR-${Date.now().toString().slice(-4)}`,
      type: form.type,
      position: [form.x, form.y, form.z],
      rotation: [0, 0, 0],
      levels: form.levels,
      bayWidth: form.bayWidth,
      bayLength: form.bayLength,
      baysX: form.baysX,
      baysZ: form.baysZ,
      columnSize: { w: form.colW, d: form.colD },
      beamSize: { w: form.beamW, h: form.beamH },
    });
    addNotification('Structure added', 'success');
    closeStructureDialog();
    setForm(DEFAULT_FORM);
  };

  const inputCls = 'input';

  return (
    <div className="dialog-overlay" onClick={closeStructureDialog}>
      <div className="dialog" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <span className="dialog-title">Add Structure / Pipe Rack</span>
          <button className="btn btn-ghost btn-sm" onClick={closeStructureDialog}><X size={16} /></button>
        </div>

        <div className="dialog-body">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Tag</label>
              <input className={inputCls} value={form.tag} onChange={(e) => set('tag', e.target.value)} placeholder="STR-001" />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Type</label>
              <select className="select" value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="pipeRack">Pipe Rack</option>
                <option value="platform">Platform</option>
              </select>
            </div>
          </div>

          <div className="form-section-label">Position (m)</div>
          <div className="form-row">
            {['x', 'y', 'z'].map((ax) => (
              <div key={ax} className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{ax.toUpperCase()}</label>
                <input className={inputCls} type="number" step={0.5} value={form[ax]} onChange={(e) => setNum(ax, e)} />
              </div>
            ))}
          </div>

          <div className="form-section-label">Levels</div>
          {form.levels.map((level, i) => (
            <div key={i} className="form-row" style={{ alignItems: 'center' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Level {i + 1} Elev. (m)</label>
                <input className={inputCls} type="number" step={0.5} value={level.elevation} onChange={(e) => updateLevel(i, e.target.value)} />
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => removeLevel(i)} style={{ marginTop: 18 }}><Minus size={13} /></button>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={addLevel}><Plus size={13} /> Add Level</button>

          <div className="form-section-label" style={{ marginTop: 12 }}>Bay Layout</div>
          <div className="form-row">
            {[['bayWidth', 'Bay Width (m)'], ['bayLength', 'Bay Length (m)'], ['baysX', 'Bays X'], ['baysZ', 'Bays Z']].map(([k, l]) => (
              <div key={k} className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{l}</label>
                <input className={inputCls} type="number" step={k.startsWith('bays') ? 1 : 0.5} min={1} value={form[k]} onChange={(e) => setNum(k, e)} />
              </div>
            ))}
          </div>

          <div className="form-section-label">Section Sizes (m)</div>
          <div className="form-row">
            {[['colW', 'Col W'], ['colD', 'Col D'], ['beamW', 'Beam W'], ['beamH', 'Beam H']].map(([k, l]) => (
              <div key={k} className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{l}</label>
                <input className={inputCls} type="number" step={0.05} min={0.1} value={form[k]} onChange={(e) => setNum(k, e)} />
              </div>
            ))}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={closeStructureDialog}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>Create Structure</button>
        </div>
      </div>
    </div>
  );
}
