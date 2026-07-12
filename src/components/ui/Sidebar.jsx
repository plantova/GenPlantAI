import React, { useState } from 'react';
import { Package, Search, ChevronDown, ChevronRight, Cylinder, Circle, Flame, Wind } from 'lucide-react';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_TYPES } from '../../equipment/library.js';
import useUIStore from '../../stores/useUIStore.js';

const CATEGORY_ICONS = {
  vessels: Cylinder,
  tanks: Circle,
  fired: Flame,
  heatExchange: Wind,
};

function formatDims(type) {
  const defaults = EQUIPMENT_TYPES[type]?.defaults || {};
  const entries = Object.entries(defaults).slice(0, 2);
  return entries.map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').split(' ').pop()}: ${v}m`).join(' · ');
}

export default function Sidebar() {
  const [openCategories, setOpenCategories] = useState(() => {
    const init = {};
    EQUIPMENT_CATEGORIES.forEach((c) => { init[c.id] = true; });
    return init;
  });
  const [search, setSearch] = useState('');

  const activeTool = useUIStore((s) => s.activeTool);
  const placementType = useUIStore((s) => s.placementType);
  const startPlacement = useUIStore((s) => s.startPlacement);
  const cancelPlacement = useUIStore((s) => s.cancelPlacement);

  const toggleCategory = (id) =>
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleEquipmentClick = (typeId) => {
    if (placementType === typeId) {
      cancelPlacement();
    } else {
      startPlacement(typeId);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Package size={16} className="sidebar-header-icon" />
        <span className="sidebar-title">Equipment Library</span>
      </div>
      <div className="sidebar-search">
        <Search size={13} className="search-icon" />
        <input
          id="equipment-search"
          type="text"
          placeholder="Search equipment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="sidebar-content">
        {EQUIPMENT_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || Package;
          const filteredTypes = cat.types.filter((typeId) => {
            if (!search) return true;
            const t = EQUIPMENT_TYPES[typeId];
            return t?.label.toLowerCase().includes(search.toLowerCase()) ||
              t?.description?.toLowerCase().includes(search.toLowerCase());
          });
          if (filteredTypes.length === 0) return null;

          return (
            <div key={cat.id} className="equipment-category">
              <button
                className="category-header"
                onClick={() => toggleCategory(cat.id)}
                id={`cat-${cat.id}`}
              >
                <Icon size={14} className="category-icon" />
                <span className="category-label">{cat.label}</span>
                {openCategories[cat.id]
                  ? <ChevronDown size={13} className="category-chevron" />
                  : <ChevronRight size={13} className="category-chevron" />}
              </button>

              {openCategories[cat.id] && (
                <div className="category-items">
                  {filteredTypes.map((typeId) => {
                    const t = EQUIPMENT_TYPES[typeId];
                    const isActive = placementType === typeId;
                    return (
                      <button
                        key={typeId}
                        id={`eq-card-${typeId}`}
                        className={`equipment-card ${isActive ? 'equipment-card--active' : ''}`}
                        onClick={() => handleEquipmentClick(typeId)}
                        title={`Click to place ${t.label}`}
                      >
                        <div className="eq-card-header">
                          <span className="eq-card-name">{t.label}</span>
                          {isActive && <span className="eq-placing-badge">Placing…</span>}
                        </div>
                        <p className="eq-card-desc">{t.description}</p>
                        <p className="eq-card-dims">{formatDims(typeId)}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
