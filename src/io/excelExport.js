import ExcelJS from 'exceljs';

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a6a' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFe0e0e8' }, size: 11 };
const BORDER = { style: 'thin', color: { argb: 'FF2a2a40' } };
const ALL_BORDERS = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Maps equipment type → dim key order
const DIM_MAP = {
  column:           ['diameter', 'height', 'wallThickness'],
  horizontalVessel: ['diameter', 'length', 'saddleHeight'],
  sphericalTank:    ['diameter', 'legCount', 'legHeight'],
  sruFurnace:       ['width', 'depth', 'height'],
  airCooler:        ['width', 'depth', 'height'],
};

/**
 * Export equipment list to styled .xlsx file
 * @param {Array} equipment  items from useProjectStore
 * @param {string} [filename]
 */
export async function exportEquipmentExcel(equipment, filename = 'equipment-layout.xlsx') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Plantova 3D';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Equipment');

  const headers = ['Tag', 'Type', 'X', 'Y', 'Z', 'Rotation', 'Dim1', 'Dim2', 'Dim3', 'Temperature', 'Pressure'];
  ws.columns = headers.map((h) => ({ header: h, key: h.toLowerCase(), width: 18 }));

  // Style header row
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = ALL_BORDERS;
  });
  headerRow.height = 22;

  // Add data
  equipment.forEach((eq) => {
    const dimKeys = DIM_MAP[eq.type] || [];
    const dims = eq.dimensions || {};
    const rotDeg = eq.rotation ? Math.round((eq.rotation[1] * 180) / Math.PI) : 0;

    const row = ws.addRow([
      eq.tag,
      eq.type,
      (eq.position?.[0] ?? 0).toFixed(2),
      (eq.position?.[1] ?? 0).toFixed(2),
      (eq.position?.[2] ?? 0).toFixed(2),
      rotDeg,
      dimKeys[0] ? (dims[dimKeys[0]] ?? '') : '',
      dimKeys[1] ? (dims[dimKeys[1]] ?? '') : '',
      dimKeys[2] ? (dims[dimKeys[2]] ?? '') : '',
      eq.designTemperature ?? '',
      eq.designPressure ?? '',
    ]);
    row.eachCell((cell) => { cell.border = ALL_BORDERS; });
  });

  // Auto-freeze header
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

export { downloadBlob };
