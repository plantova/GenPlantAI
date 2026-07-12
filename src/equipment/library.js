/**
 * Equipment Library — Catalog of equipment types with default parameters
 */

export const EQUIPMENT_CATEGORIES = [
  {
    id: 'vessels',
    label: 'Vessels & Columns',
    icon: 'Cylinder',
    types: ['column', 'horizontalVessel'],
  },
  {
    id: 'tanks',
    label: 'Tanks',
    icon: 'Circle',
    types: ['sphericalTank'],
  },
  {
    id: 'fired',
    label: 'Fired Equipment',
    icon: 'Flame',
    types: ['sruFurnace'],
  },
  {
    id: 'heatExchange',
    label: 'Heat Exchange',
    icon: 'Wind',
    types: ['airCooler'],
  },
];

export const EQUIPMENT_TYPES = {
  column: {
    id: 'column',
    label: 'Column / Reactor',
    category: 'vessels',
    description: 'Vertical cylindrical vessel with hemispherical end caps',
    color: '#8899aa',
    defaults: {
      diameter: 2.0,
      height: 20.0,
      wallThickness: 0.025,
      topCapType: 'hemispherical',
      bottomCapType: 'hemispherical',
    },
    nozzleDefaults: [
      { id: 'N1', label: 'Top Inlet', size: 6, rating: '150#', position: 'top', angleOffset: 0, elevationOffset: 0 },
      { id: 'N2', label: 'Bottom Outlet', size: 8, rating: '150#', position: 'bottom', angleOffset: 0, elevationOffset: 0 },
      { id: 'N3', label: 'Side Feed', size: 4, rating: '300#', position: 'side', angleOffset: 0, elevationOffset: 0.7 },
      { id: 'N4', label: 'Side Draw', size: 4, rating: '300#', position: 'side', angleOffset: 180, elevationOffset: 0.3 },
    ],
    parameterSchema: [
      { key: 'diameter', label: 'Diameter (m)', min: 0.3, max: 12, step: 0.1 },
      { key: 'height', label: 'Height (m)', min: 1, max: 80, step: 0.5 },
      { key: 'wallThickness', label: 'Wall Thickness (m)', min: 0.005, max: 0.1, step: 0.005 },
    ],
  },

  horizontalVessel: {
    id: 'horizontalVessel',
    label: 'Horizontal Vessel',
    category: 'vessels',
    description: 'Horizontal cylindrical vessel on support saddles',
    color: '#7a9a8a',
    defaults: {
      diameter: 2.0,
      length: 6.0,
      wallThickness: 0.02,
      saddleWidth: 0.4,
      saddleHeight: 1.0,
    },
    nozzleDefaults: [
      { id: 'N1', label: 'Top Inlet', size: 6, rating: '150#', position: 'top', angleOffset: 0, elevationOffset: 0.5 },
      { id: 'N2', label: 'Bottom Outlet', size: 8, rating: '150#', position: 'bottom', angleOffset: 0, elevationOffset: 0.5 },
    ],
    parameterSchema: [
      { key: 'diameter', label: 'Diameter (m)', min: 0.3, max: 6, step: 0.1 },
      { key: 'length', label: 'Length (m)', min: 1, max: 30, step: 0.5 },
      { key: 'wallThickness', label: 'Wall Thickness (m)', min: 0.005, max: 0.1, step: 0.005 },
      { key: 'saddleWidth', label: 'Saddle Width (m)', min: 0.2, max: 1.5, step: 0.1 },
      { key: 'saddleHeight', label: 'Saddle Height (m)', min: 0.3, max: 3, step: 0.1 },
    ],
  },

  sphericalTank: {
    id: 'sphericalTank',
    label: 'Spherical Tank',
    category: 'tanks',
    description: 'Spherical pressure vessel on support legs',
    color: '#aa8877',
    defaults: {
      diameter: 10.0,
      wallThickness: 0.03,
      legCount: 8,
      legHeight: 5.0,
      legDiameter: 0.4,
    },
    nozzleDefaults: [
      { id: 'N1', label: 'Top Vent', size: 4, rating: '150#', position: 'top', angleOffset: 0, elevationOffset: 0 },
      { id: 'N2', label: 'Bottom Drain', size: 6, rating: '150#', position: 'bottom', angleOffset: 0, elevationOffset: 0 },
      { id: 'N3', label: 'Side Inlet', size: 8, rating: '300#', position: 'side', angleOffset: 0, elevationOffset: 0.5 },
      { id: 'N4', label: 'Side Outlet', size: 8, rating: '300#', position: 'side', angleOffset: 180, elevationOffset: 0.5 },
    ],
    parameterSchema: [
      { key: 'diameter', label: 'Diameter (m)', min: 2, max: 25, step: 0.5 },
      { key: 'legCount', label: 'Leg Count', min: 4, max: 16, step: 2 },
      { key: 'legHeight', label: 'Leg Height (m)', min: 2, max: 15, step: 0.5 },
      { key: 'legDiameter', label: 'Leg Diameter (m)', min: 0.2, max: 1.0, step: 0.05 },
    ],
  },

  sruFurnace: {
    id: 'sruFurnace',
    label: 'SRU / Box Furnace',
    category: 'fired',
    description: 'Rectangular box furnace with top stack',
    color: '#aa7766',
    defaults: {
      width: 6.0,
      depth: 4.0,
      height: 8.0,
      stackDiameter: 2.0,
      stackHeight: 15.0,
    },
    nozzleDefaults: [
      { id: 'N1', label: 'Inlet', size: 10, rating: '150#', position: 'side', angleOffset: 0, elevationOffset: 0.3 },
      { id: 'N2', label: 'Outlet', size: 12, rating: '150#', position: 'side', angleOffset: 180, elevationOffset: 0.7 },
    ],
    parameterSchema: [
      { key: 'width', label: 'Width (m)', min: 2, max: 20, step: 0.5 },
      { key: 'depth', label: 'Depth (m)', min: 2, max: 15, step: 0.5 },
      { key: 'height', label: 'Height (m)', min: 3, max: 25, step: 0.5 },
      { key: 'stackDiameter', label: 'Stack Diameter (m)', min: 0.5, max: 5, step: 0.25 },
      { key: 'stackHeight', label: 'Stack Height (m)', min: 5, max: 50, step: 1 },
    ],
  },

  airCooler: {
    id: 'airCooler',
    label: 'Air Cooler',
    category: 'heatExchange',
    description: 'Air-cooled heat exchanger with fans',
    color: '#6699aa',
    defaults: {
      width: 8.0,
      depth: 3.0,
      height: 4.0,
      fanCount: 4,
      fanDiameter: 2.5,
    },
    nozzleDefaults: [
      { id: 'N1', label: 'Inlet', size: 8, rating: '150#', position: 'side', angleOffset: 0, elevationOffset: 0.8 },
      { id: 'N2', label: 'Outlet', size: 8, rating: '150#', position: 'side', angleOffset: 180, elevationOffset: 0.2 },
    ],
    parameterSchema: [
      { key: 'width', label: 'Width (m)', min: 3, max: 20, step: 0.5 },
      { key: 'depth', label: 'Depth (m)', min: 1.5, max: 8, step: 0.5 },
      { key: 'height', label: 'Height (m)', min: 2, max: 10, step: 0.5 },
      { key: 'fanCount', label: 'Fan Count', min: 1, max: 8, step: 1 },
      { key: 'fanDiameter', label: 'Fan Diameter (m)', min: 1, max: 5, step: 0.25 },
    ],
  },
};

/** Get all equipment types as an array */
export const getEquipmentList = () => Object.values(EQUIPMENT_TYPES);

/** Get equipment type by id */
export const getEquipmentType = (typeId) => EQUIPMENT_TYPES[typeId];

/** Get default dimensions for an equipment type */
export const getDefaultDimensions = (typeId) => {
  const type = EQUIPMENT_TYPES[typeId];
  return type ? { ...type.defaults } : {};
};

/** Get default nozzles for an equipment type */
export const getDefaultNozzles = (typeId) => {
  const type = EQUIPMENT_TYPES[typeId];
  return type ? type.nozzleDefaults.map((n) => ({ ...n })) : [];
};
