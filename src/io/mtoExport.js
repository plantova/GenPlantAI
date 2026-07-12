import ExcelJS from 'exceljs';
import { downloadBlob } from './excelExport.js';
import { normalizePipeSegments } from '../routing/elbowInserter.js';

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a6a' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFe0e0e8' }, size: 11 };
const BORDER = { style: 'thin', color: { argb: 'FF2a2a40' } };
const ALL_BORDERS = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };
const TOTAL_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0a2040' } };

/**
 * Generate MTO data structure from routed pipe lines
 * @param {Array} pipes  pipe items from store (must have segments array)
 * @returns {{ lines, grandTotal }}
 */
export function generateMTO(pipes) {
  const lines = [];

  for (const pipe of pipes) {
    if (!pipe.segments || pipe.segments.length === 0) continue;

    const normalizedSegments = normalizePipeSegments(pipe.segments, pipe.nominalSize);
    let totalLength = 0;
    let elbows90 = 0;
    let elbows45 = 0;
    const segmentDetails = [];

    normalizedSegments.forEach((seg, idx) => {
      if (seg.type === 'pipe') {
        totalLength += seg.length || 0;
        segmentDetails.push({
          segNo: idx + 1,
          type: 'Straight Pipe',
          start: seg.start ? seg.start.map((v) => v.toFixed(2)).join(', ') : '',
          end: seg.end ? seg.end.map((v) => v.toFixed(2)).join(', ') : '',
          length: seg.length ? seg.length.toFixed(3) : 0,
          angle: '-',
        });
      } else if (seg.type === 'elbow') {
        if (seg.angle === 45) elbows45++;
        else elbows90++;
        segmentDetails.push({
          segNo: idx + 1,
          type: `${seg.angle ?? 90}° Elbow`,
          start: seg.center ? seg.center.map((v) => v.toFixed(2)).join(', ') : '',
          end: '',
          length: 0,
          angle: `${seg.angle ?? 90}°`,
        });
      }
    });

    lines.push({
      lineNumber: pipe.lineNumber,
      nominalSize: pipe.nominalSize,
      schedule: pipe.schedule,
      material: pipe.material,
      totalLength: parseFloat(totalLength.toFixed(3)),
      elbows90,
      elbows45,
      designTemp: pipe.designTemperature,
      designPressure: pipe.designPressure,
      flexibilityStatus: pipe.flexibilityStatus,
      segments: segmentDetails,
    });
  }

  const grandTotal = {
    totalLength: lines.reduce((s, l) => s + l.totalLength, 0).toFixed(3),
    elbows90: lines.reduce((s, l) => s + l.elbows90, 0),
    elbows45: lines.reduce((s, l) => s + l.elbows45, 0),
  };

  return { lines, grandTotal };
}

/**
 * Export MTO as styled .xlsx with Summary + Detail sheets
 */
export async function exportMTOExcel(mtoData, filename = 'MTO-Plantova-3D.xlsx') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Plantova 3D';
  workbook.created = new Date();

  // ─── Summary Sheet ───
  const sumWs = workbook.addWorksheet('MTO Summary');
  const sumHeaders = ['Line Number', 'Size (NPS)', 'Schedule', 'Material', 'Total Length (m)', '90° Elbows', '45° Elbows', 'Design Temp (°C)', 'Design Press (barg)', 'Flexibility'];
  sumWs.columns = sumHeaders.map((h, i) => ({ header: h, key: String(i), width: i === 0 ? 16 : 15 }));

  const sumHeaderRow = sumWs.getRow(1);
  sumHeaderRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = ALL_BORDERS;
  });
  sumHeaderRow.height = 30;

  mtoData.lines.forEach((line) => {
    const row = sumWs.addRow([
      line.lineNumber, line.nominalSize + '"', line.schedule, line.material,
      line.totalLength, line.elbows90, line.elbows45,
      line.designTemp, line.designPressure, line.flexibilityStatus?.status ?? 'N/A',
    ]);
    row.eachCell((cell) => { cell.border = ALL_BORDERS; });
  });

  // Grand Total row
  const totalRow = sumWs.addRow(['GRAND TOTAL', '', '', '', mtoData.grandTotal.totalLength, mtoData.grandTotal.elbows90, mtoData.grandTotal.elbows45, '', '', '']);
  totalRow.font = { bold: true };
  totalRow.fill = TOTAL_FILL;
  totalRow.eachCell((cell) => { cell.border = ALL_BORDERS; cell.font = { bold: true, color: { argb: 'FFe0e0e8' } }; });

  sumWs.views = [{ state: 'frozen', ySplit: 1 }];

  // ─── Detail Sheet ───
  const detWs = workbook.addWorksheet('Segment Detail');
  const detHeaders = ['Line Number', 'Seg #', 'Type', 'Start (x,y,z)', 'End (x,y,z)', 'Length (m)', 'Angle'];
  detWs.columns = detHeaders.map((h, i) => ({ header: h, key: String(i), width: i <= 1 ? 14 : i >= 3 ? 22 : 16 }));

  const detHeaderRow = detWs.getRow(1);
  detHeaderRow.eachCell((cell) => {
    cell.fill = HEADER_FILL; cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = ALL_BORDERS;
  });
  detHeaderRow.height = 22;

  mtoData.lines.forEach((line) => {
    line.segments.forEach((seg) => {
      const row = detWs.addRow([line.lineNumber, seg.segNo, seg.type, seg.start, seg.end, seg.length || '', seg.angle]);
      row.eachCell((cell) => { cell.border = ALL_BORDERS; });
    });
  });

  detWs.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * Export MTO as CSV (summary only)
 */
export function exportMTOCsv(mtoData, filename = 'MTO-Plantova-3D.csv') {
  const header = 'Line Number,Size (NPS),Schedule,Material,Total Length (m),90° Elbows,45° Elbows,Design Temp,Design Press\n';
  const rows = mtoData.lines.map((l) =>
    `"${l.lineNumber}","${l.nominalSize}","${l.schedule}","${l.material}",${l.totalLength},${l.elbows90},${l.elbows45},${l.designTemp},${l.designPressure}`
  ).join('\n');
  const csv = header + rows;
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, filename);
}
