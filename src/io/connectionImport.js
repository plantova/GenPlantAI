import * as XLSX from 'xlsx';

/**
 * Parse a pipe connection list file (.xlsx or .csv)
 * Schema: FromTag, FromNozzle, ToTag, ToNozzle, LineNumber, Size, Schedule, Material, DesignTemp, DesignPressure
 */
export async function parseConnectionList(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const connections = [];
  const errors = [];

  const required = ['FromTag', 'ToTag', 'LineNumber', 'Size'];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const rowErrors = [];

    required.forEach((col) => {
      if (!String(row[col] ?? '').trim()) {
        rowErrors.push({ row: rowNum, column: col, message: `${col} is required` });
      }
    });

    if (rowErrors.length === 0) {
      connections.push({
        fromTag: String(row['FromTag']).trim(),
        fromNozzle: String(row['FromNozzle'] ?? '').trim(),
        toTag: String(row['ToTag']).trim(),
        toNozzle: String(row['ToNozzle'] ?? '').trim(),
        lineNumber: String(row['LineNumber']).trim(),
        nominalSize: parseFloat(row['Size']) || 6,
        schedule: String(row['Schedule'] ?? 'STD').trim(),
        material: String(row['Material'] ?? 'CS-A106B').trim(),
        designTemperature: parseFloat(row['DesignTemp']) || 20,
        designPressure: parseFloat(row['DesignPressure']) || 0,
      });
    } else {
      errors.push(...rowErrors);
    }
  });

  return { connections, errors };
}
