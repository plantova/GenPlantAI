import React, { useState } from 'react';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import useUIStore from '../../stores/useUIStore.js';
import useProjectStore from '../../stores/useProjectStore.js';
import { EQUIPMENT_TYPES } from '../../equipment/library.js';

function TabButton({ active, onClick, children }) {
  return (
    <button className={`prop-tab ${active ? 'prop-tab--active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

function NumInput({ label, value, onChange, min, max, step = 0.1, id }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input id={id} type="number" className="input" value={value ?? ''} min={min} max={max} step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

export default function PropertyPanel({ inline = false }) {
  const selectedIds       = useUIStore((s) => s.selectedIds);
  const clearSelection    = useUIStore((s) => s.clearSelection);
  const equipment         = useProjectStore((s) => s.equipment);
  const structures        = useProjectStore((s) => s.structures);
  const pipes             = useProjectStore((s) => s.pipes);
  const updateEquipment   = useProjectStore((s) => s.updateEquipment);
  const updateStructure   = useProjectStore((s) => s.updateStructure);
  const updatePipe        = useProjectStore((s) => s.updatePipe);
  const removeEquipment   = useProjectStore((s) => s.removeEquipment);
  const removeStructure   = useProjectStore((s) => s.removeStructure);
  const removePipe        = useProjectStore((s) => s.removePipe);
  const [activeTab, setActiveTab] = useState('general');

  // When used as standalone dialog panel (not inline) guard on visibility
  if (!inline && selectedIds.length === 0) return null;

  const id   = selectedIds[0];
  const item = equipment.find((e) => e.id === id) || structures.find((s) => s.id === id) || pipes.find((p) => p.id === id);
  if (!item) return null;

  const isEquipment = !!equipment.find((e) => e.id === id);
  const isStructure = !!structures.find((s) => s.id === id);
  const isPipe      = !!pipes.find((p) => p.id === id);
  const update      = isEquipment ? (u) => updateEquipment(id, u) : isStructure ? (u) => updateStructure(id, u) : (u) => updatePipe(id, u);

  const handleDelete = () => {
    if (isEquipment) removeEquipment(id);
    else if (isStructure) removeStructure(id);
    else if (isPipe) removePipe(id);
    clearSelection();
  };

  const pos     = item.position || [0, 0, 0];
  const rot     = item.rotation || [0, 0, 0];
  const rotDeg  = ((rot[1] * 180) / Math.PI).toFixed(1);
  const dims    = item.dimensions || {};
  const typeInfo = isEquipment ? EQUIPMENT_TYPES[item.type] : null;
  const tabs    = isEquipment ? ['general', 'dims', 'nozzles'] : isStructure ? ['general', 'levels'] : ['general'];

  const content = (
    <>
      {/* Tag header */}
      <div className="prop-tag-row">
        <div>
          <div className="prop-type-label">{isEquipment ? item.type : isStructure ? 'Structure' : 'Pipe'}</div>
          <div className="prop-tag">{item.tag || item.lineNumber || id}</div>
        </div>
        {!inline && (
          <button className="btn btn-ghost btn-sm" onClick={clearSelection}><X size={14} /></button>
        )}
      </div>

      {/* Tabs */}
      <div className="prop-tabs">
        {tabs.map((t) => (
          <TabButton key={t} active={activeTab === t} onClick={() => setActiveTab(t)}>
            {t === 'dims' ? 'Dims' : t.charAt(0).toUpperCase() + t.slice(1)}
          </TabButton>
        ))}
      </div>

      <div className="prop-body">
        {/* GENERAL */}
        {activeTab === 'general' && (
          <div>
            <div className="form-group">
              <label className="form-label">Tag</label>
              <input className="input" value={item.tag || item.lineNumber || ''}
                onChange={(e) => update(isEquipment || isStructure ? { tag: e.target.value } : { lineNumber: e.target.value })} />
            </div>
            {!isPipe && (
              <>
                <div className="form-section-label">Position</div>
                <div className="form-row">
                  {['X','Y','Z'].map((ax, i) => (
                    <NumInput key={ax} id={`pos-${ax}`} label={ax} value={pos[i]} step={0.5}
                      onChange={(v) => { const p = [...pos]; p[i] = isNaN(v) ? 0 : v; update({ position: p }); }} />
                  ))}
                </div>
                <NumInput id="prop-rot" label="Rotation Y°" value={parseFloat(rotDeg)} step={15}
                  onChange={(v) => { const r = [...rot]; r[1] = (v * Math.PI) / 180; update({ rotation: r }); }} />
                <NumInput id="design-temp" label="Design Temp (°C)" value={item.designTemperature} step={5}
                  onChange={(v) => update({ designTemperature: v })} />
                <NumInput id="design-press" label="Design Press (barg)" value={item.designPressure} step={0.5}
                  onChange={(v) => update({ designPressure: v })} />
              </>
            )}
          </div>
        )}

        {/* DIMENSIONS */}
        {activeTab === 'dims' && isEquipment && typeInfo?.parameterSchema?.map((param) => (
          <NumInput key={param.key} id={`dim-${param.key}`} label={param.label} value={dims[param.key]}
            min={param.min} max={param.max} step={param.step}
            onChange={(v) => update({ dimensions: { ...dims, [param.key]: isNaN(v) ? dims[param.key] : v } })} />
        ))}

        {/* NOZZLES */}
        {activeTab === 'nozzles' && isEquipment && (
          <div>
            {(item.nozzles || []).map((nz, i) => (
              <div key={nz.id} className="nozzle-row">
                <div className="nozzle-badge">{nz.id}</div>
                <div className="nozzle-info">
                  <span className="nozzle-label">{nz.label}</span>
                  <span className="nozzle-detail">{nz.size}" · {nz.rating}</span>
                </div>
                <button className="btn btn-ghost btn-sm"
                  onClick={() => update({ nozzles: item.nozzles.filter((_, j) => j !== i) })}>
                  <Minus size={12} />
                </button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}
              onClick={() => update({ nozzles: [...(item.nozzles||[]), { id: `N${(item.nozzles?.length||0)+1}`, label: 'New Nozzle', size: 4, rating: '150#', position: 'side', angleOffset: 0, elevationOffset: 0.5 }] })}>
              <Plus size={12} /> Add Nozzle
            </button>
          </div>
        )}

        {/* LEVELS */}
        {activeTab === 'levels' && isStructure && (
          <div>
            {(item.levels||[]).map((lv, i) => (
              <div key={i} className="form-row" style={{ alignItems: 'center' }}>
                <div className="form-group" style={{ flex:1 }}>
                  <label className="form-label">L{i+1} Elev (m)</label>
                  <input className="input" type="number" step={0.5} value={lv.elevation}
                    onChange={(e) => { const lvs=[...item.levels]; lvs[i]={...lvs[i],elevation:parseFloat(e.target.value)||0}; update({levels:lvs}); }} />
                </div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop:16 }}
                  onClick={() => update({ levels: item.levels.filter((_,j)=>j!==i) })}>
                  <Minus size={12} />
                </button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" style={{ marginTop:6 }}
              onClick={() => update({ levels: [...(item.levels||[]), { elevation:((item.levels?.length||0)+1)*4 }] })}>
              <Plus size={12} /> Add Level
            </button>
          </div>
        )}
      </div>

      {/* Delete */}
      <div className="prop-footer">
        <button className="btn btn-danger btn-sm" onClick={handleDelete} style={{ width:'100%', justifyContent:'center' }}>
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </>
  );

  return content;
}
