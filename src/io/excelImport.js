import * as XLSX from 'xlsx';
import { EQUIPMENT_TYPES, getDefaultDimensions, getDefaultNozzles } from '../equipment/library.js';

const COLUMN_SCHEMA = ['Tag', 'Type', 'X', 'Y', 'Z', 'Rotation', 'Dim1', 'Dim2', 'Dim3'];

// Maps equipment type → [dim1Key, dim2Key, dim3Key]
const DIM_MAP = {
  column:           ['diameter', 'height', 'wallThickness'],
  horizontalVessel: ['diameter', 'length', 'saddleHeight'],
  sphericalTank:    ['diameter', 'legCount', 'legHeight'],
  sruFurnace:       ['width', 'depth', 'height'],
  airCooler:        ['width', 'depth', 'height'],
};

/**
 * Parse an equipment .xlsx file into equipment placement data.
 * @param {File} file
 * @returns {{ items: Array, errors: Array<{row,column,message}>, warnings: Array }}
 */
export async function parseEquipmentExcel(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const items = [];
  const errors = [];
  const warnings = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // 1-indexed + header

    // Tag
    const tag = String(row['Tag'] || '').trim();
    if (!tag) errors.push({ row: rowNum, column: 'Tag', message: 'Tag is required' });

    // Type
    const typeRaw = String(row['Type'] || '').trim().toLowerCase().replace(/[\s_-]/g, '');
    const typeMatch = Object.keys(EQUIPMENT_TYPES).find(
      (k) => k.toLowerCase() === typeRaw || EQUIPMENT_TYPES[k].label.toLowerCase().replace(/[\s_-]/g, '') === typeRaw
    );
    if (!typeMatch) {
      errors.push({ row: rowNum, column: 'Type', message: `Unknown equipment type "${row['Type']}". Valid: ${Object.keys(EQUIPMENT_TYPES).join(', ')}` });
    }

    // Coordinates
    const x = parseFloat(row['X']);
    const y = parseFloat(row['Y'] ?? 0);
    const z = parseFloat(row['Z']);
    if (isNaN(x)) errors.push({ row: rowNum, column: 'X', message: 'X must be a number' });
    if (isNaN(z)) errors.push({ row: rowNum, column: 'Z', message: 'Z must be a number' });

    const rotation = parseFloat(row['Rotation'] ?? 0) || 0;

    // Dimensions
    const d1 = parseFloat(row['Dim1']);
    const d2 = parseFloat(row['Dim2']);
    const d3 = parseFloat(row['Dim3']);

    if (tag && typeMatch && !isNaN(x) && !isNaN(z)) {
      const defaults = getDefaultDimensions(typeMatch);
      const dimKeys = DIM_MAP[typeMatch] || [];
      const dimensions = { ...defaults };
      if (!isNaN(d1) && dimKeys[0]) dimensions[dimKeys[0]] = d1;
      if (!isNaN(d2) && dimKeys[1]) dimensions[dimKeys[1]] = d2;
      if (!isNaN(d3) && dimKeys[2]) dimensions[dimKeys[2]] = d3;

      items.push({
        tag,
        type: typeMatch,
        position: [x, isNaN(y) ? 0 : y, z],
        rotation: [0, (rotation * Math.PI) / 180, 0],
        dimensions,
        nozzles: getDefaultNozzles(typeMatch),
      });
    }
  });

  return { items, errors, warnings };
}

/**
 * Get the expected column schema as a display string for the import dialog.
 */
export function getSchemaDescription() {
  return COLUMN_SCHEMA.map((col, i) => ({
    column: col,
    required: i < 5,
    description: [
      'Equipment tag number (e.g. V-101)',
      'Type: column | horizontalVessel | sphericalTank | sruFurnace | airCooler',
      'X coordinate (meters)',
      'Y elevation (meters, default 0)',
      'Z coordinate (meters)',
      'Rotation degrees around Y axis (default 0)',
      'Primary dimension (diameter / width)',
      'Secondary dimension (height / length / depth)',
      'Tertiary dimension (wallThickness / saddleHeight / legHeight)',
    ][i],
  }));
}
