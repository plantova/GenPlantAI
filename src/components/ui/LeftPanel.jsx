import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Box, GitBranch, Layers, Cylinder, Circle, Flame, Wind, Package } from 'lucide-react';
import useProjectStore from '../../stores/useProjectStore.js';
import useUIStore from '../../stores/useUIStore.js';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_TYPES } from '../../equipment/library.js';
import PropertyPanel from './PropertyPanel.jsx';

// ─── Icon map for equipment types ───
const EQ_ICONS = {
  column:           Cylinder,
  horizontalVessel: Box,
  sphericalTank:    Circle,
  sruFurnace:       Flame,
  airCooler:        Wind,
};
const CAT_ICONS = {
  vessels:     Cylinder,
  tanks:       Circle,
  fired:       Flame,
  heatExchange: Wind,
};

// ─── Items Tree ─────────────────────────────────────────
function ItemsTree() {
  const equipment  = useProjectStore((s) => s.equipment);
  const structures = useProjectStore((s) => s.structures);
  const pipes      = useProjectStore((s) => s.pipes);
  const selectedIds = useUIStore((s) => s.selectedIds);
  const select     = useUIStore((s) => s.select);

  const allItems = [
    ...equipment .map((e) => ({ id: e.id, label: e.tag  || e.id,  typeLabel: e.type,  Icon: Box })),
    ...structures.map((s) => ({ id: s.id, label: s.tag  || s.id,  typeLabel: 'Rack',  Icon: Layers })),
    ...pipes     .map((p) => ({ id: p.id, label: p.lineNumber || p.id, typeLabel: 'Pipe', Icon: GitBranch })),
  ];

  return (
    <div className="items-tree">
      {allItems.length === 0
        ? <div className="tree-empty">No objects placed yet</div>
        : allItems.map((item) => (
          <div
            key={item.id}
            className={`tree-item ${selectedIds.includes(item.id) ? 'selected' : ''}`}
            onClick={() => select(item.id)}
          >
            <item.Icon size={12} />
            <span className="tree-item-tag">{item.label}</span>
            <span className="tree-item-type">{item.typeLabel}</span>
          </div>
        ))
      }
    </div>
  );
}

// ─── Equipment Library ───────────────────────────────────
function EquipmentLibrary() {
  const [search, setSearch] = useState('');
  const [openCats, setOpenCats] = useState(() => {
    const s = {};
    EQUIPMENT_CATEGORIES.forEach((c) => { s[c.id] = true; });
    return s;
  });
  const placementType = useUIStore((s) => s.placementType);
  const startPlacement = useUIStore((s) => s.startPlacement);
  const cancelPlacement = useUIStore((s) => s.cancelPlacement);

  const toggleCat = (id) => setOpenCats((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="eq-library">
      <div className="eq-library-search">
        <Search size={11} />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="eq-library-scroll">
        {EQUIPMENT_CATEGORIES.map((cat) => {
          const CatIcon = CAT_ICONS[cat.id] || Package;
          const types = cat.types.filter((tid) => {
            if (!search) return true;
            const t = EQUIPMENT_TYPES[tid];
            return t?.label.toLowerCase().includes(search.toLowerCase());
          });
          if (types.length === 0) return null;

          return (
            <div key={cat.id}>
              <button className="eq-category-header" onClick={() => toggleCat(cat.id)}>
                <CatIcon size={11} className="eq-category-icon" />
                <span style={{ flex: 1, textAlign: 'left' }}>{cat.label}</span>
                {openCats[cat.id] ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>

              {openCats[cat.id] && types.map((tid) => {
                const t = EQUIPMENT_TYPES[tid];
                const EqIcon = EQ_ICONS[tid] || Box;
                const isActive = placementType === tid;
                const dims = t?.defaults ? Object.entries(t.defaults).slice(0, 2).map(([k, v]) => `${v}m`).join('×') : '';

                return (
                  <button
                    key={tid}
                    className={`eq-card ${isActive ? 'active' : ''}`}
                    onClick={() => isActive ? cancelPlacement() : startPlacement(tid)}
                    title={t?.description}
                  >
                    <EqIcon size={13} className="eq-card-icon" />
                    <div className="eq-card-body">
                      <span className="eq-card-name">
                        {t?.label}
                        {isActive && <span className="eq-placing-badge">placing</span>}
                      </span>
                      <span className="eq-card-dim">{dims}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Left Panel ─────────────────────────────────────
export default function LeftPanel() {
  const selectedIds = useUIStore((s) => s.selectedIds);
  const hasSelection = selectedIds.length > 0;

  return (
    <>
      {/* ① Scene Items tree */}
      <div className="panel-section-header">
        <span>Items</span>
      </div>
      <ItemsTree />

      {/* ② Equipment Library */}
      <div className="panel-section-header" style={{ marginTop: 0 }}>
        <span>Equipment Library</span>
      </div>
      <EquipmentLibrary />

      {/* ③ Properties (only when something selected) */}
      {hasSelection && (
        <div className="properties-section">
          <div className="panel-section-header">
            <span>Properties</span>
          </div>
          <PropertyPanel inline />
        </div>
      )}
    </>
  );
}
