import { jsPDF } from 'jspdf';
import { getNozzleWorldPosition } from '../utils/snapEngine.js';
import { generateMTO } from './mtoExport.js';

// Helper to calculate rotated points of a rectangle
function getRotatedPoints(cx, cy, w, h, angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const halfW = w / 2;
  const halfH = h / 2;

  const localPoints = [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: halfW, y: halfH },
    { x: -halfW, y: halfH }
  ];

  return localPoints.map(p => ({
    x: cx + p.x * cos - p.y * sin,
    y: cy + p.x * sin + p.y * cos
  }));
}

// Helper to draw a closed polygon in jsPDF using lines
function drawPolygon(doc, pts, style = 'FD') {
  if (!pts || pts.length < 3) return;
  const startX = pts[0].x;
  const startY = pts[0].y;
  const lines = [];
  for (let i = 1; i < pts.length; i++) {
    lines.push([pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y]);
  }
  doc.lines(lines, startX, startY, [1, 1], style, true);
}

// Helper to draw a table on Page 2
function drawTable(doc, startX, startY, headers, rows, colWidths) {
  let curY = startY;
  const rowHeight = 6.5;
  
  // Header row
  doc.setFillColor(26, 58, 106); // Dark Navy Blue
  doc.rect(startX, curY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  
  let curX = startX;
  headers.forEach((h, idx) => {
    doc.text(h, curX + 2, curY + 4.5);
    curX += colWidths[idx];
  });
  
  curY += rowHeight;
  
  // Data rows
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 50);
  
  rows.forEach((row, rIdx) => {
    if (rIdx % 2 === 1) {
      doc.setFillColor(242, 246, 250); // Zebra striping
      doc.rect(startX, curY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
    }
    
    curX = startX;
    row.forEach((cell, cIdx) => {
      doc.text(String(cell), curX + 2, curY + 4.5);
      curX += colWidths[cIdx];
    });
    
    // Draw thin cell borders
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.15);
    doc.line(startX, curY + rowHeight, startX + colWidths.reduce((a, b) => a + b, 0), curY + rowHeight);
    
    curY += rowHeight;
  });

  // Table outline
  doc.setDrawColor(40, 40, 60);
  doc.setLineWidth(0.4);
  doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), curY - startY, 'S');

  return curY;
}

export function exportPlotPlanPDF(projectName, equipment = [], structures = [], pipes = []) {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4: 297mm x 210mm
  const dateStr = new Date().toLocaleDateString();

  // -------------------------------------------------------------
  // 1. CALCULATE BOUNDING BOX & SCALE FOR PAGE 1
  // -------------------------------------------------------------
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  // Equipment bounding box
  equipment.forEach(eq => {
    const [x, y, z] = eq.position || [0, 0, 0];
    const type = eq.type;
    const dims = eq.dimensions || {};
    let sizeX = 0;
    let sizeZ = 0;

    if (type === 'column' || type === 'sphericalTank') {
      const d = dims.diameter || 2;
      sizeX = d;
      sizeZ = d;
    } else if (type === 'horizontalVessel') {
      const d = dims.diameter || 2;
      const l = dims.length || 6;
      sizeX = d;
      sizeZ = l + d; // Total length includes hemispherical heads
    } else if (type === 'sruFurnace' || type === 'airCooler') {
      sizeX = dims.width || 6;
      sizeZ = dims.depth || 4;
    }

    const angle = eq.rotation ? eq.rotation[1] : 0;
    const pts = getRotatedPoints(x, z, sizeX, sizeZ, angle);
    pts.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minZ) minZ = p.y;
      if (p.y > maxZ) maxZ = p.y;
    });
  });

  // Structures bounding box
  structures.forEach(s => {
    const [x, y, z] = s.position || [0, 0, 0];
    const w = (s.baysX || 3) * (s.bayWidth || 6);
    const l = (s.baysZ || 1) * (s.bayLength || 6);
    const angle = s.rotation ? s.rotation[1] : 0;
    const pts = getRotatedPoints(x, z, w, l, angle);
    pts.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minZ) minZ = p.y;
      if (p.y > maxZ) maxZ = p.y;
    });
  });

  // Pipes bounding box
  pipes.forEach(p => {
    if (p.segments) {
      p.segments.forEach(seg => {
        if (seg.type === 'pipe') {
          const start = seg.start || [0, 0, 0];
          const end = seg.end || [0, 0, 0];
          [start, end].forEach(pt => {
            if (pt[0] < minX) minX = pt[0];
            if (pt[0] > maxX) maxX = pt[0];
            if (pt[2] < minZ) minZ = pt[2];
            if (pt[2] > maxZ) maxZ = pt[2];
          });
        } else if (seg.type === 'elbow') {
          const center = seg.center || [0, 0, 0];
          if (center[0] < minX) minX = center[0];
          if (center[0] > maxX) maxX = center[0];
          if (center[2] < minZ) minZ = center[2];
          if (center[2] > maxZ) maxZ = center[2];
        }
      });
    }
  });

  // If no items placed, establish a default grid
  const pad = 8; // meters of padding
  if (minX === Infinity) {
    minX = -40;
    maxX = 40;
    minZ = -30;
    maxZ = 30;
  } else {
    minX -= pad;
    maxX += pad;
    minZ -= pad;
    maxZ += pad;
  }

  const rangeX = maxX - minX;
  const rangeZ = maxZ - minZ;

  // Drawing area constraints: Left=15, Top=15, Width=267, Height=150
  const drawWidthMax = 267;
  const drawHeightMax = 148;

  // Scale factor (mm per meter)
  const scaleX = drawWidthMax / rangeX;
  const scaleZ = drawHeightMax / rangeZ;
  const scale = Math.min(scaleX, scaleZ);

  // Center drawing on paper
  const drawW = rangeX * scale;
  const drawH = rangeZ * scale;
  const offsetX = 15 + (drawWidthMax - drawW) / 2;
  const offsetY = 15 + (drawHeightMax - drawH) / 2;

  // -------------------------------------------------------------
  // PAGE 1: 2D PLOT PLAN
  // -------------------------------------------------------------

  // Outer border & Grid border
  doc.setDrawColor(40, 40, 60);
  doc.setLineWidth(0.6);
  doc.rect(10, 10, 277, 190, 'S'); // Outer border
  doc.rect(15, 15, 267, 150, 'S'); // Drawing border

  // Background Grid Lines
  let spacing = 10;
  if (rangeX <= 25) spacing = 5;
  else if (rangeX > 150) spacing = 25;

  const startGridX = Math.ceil(minX / spacing) * spacing;
  const endGridX = Math.floor(maxX / spacing) * spacing;
  const startGridZ = Math.ceil(minZ / spacing) * spacing;
  const endGridZ = Math.floor(maxZ / spacing) * spacing;

  doc.setDrawColor(205, 210, 220);
  doc.setLineWidth(0.12);
  doc.setLineDashPattern([1.5, 2.5], 0);

  for (let gx = startGridX; gx <= endGridX; gx += spacing) {
    const pdfX = offsetX + (gx - minX) * scale;
    doc.line(pdfX, 15, pdfX, 165);
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 130);
    doc.text(`X: ${gx}m`, pdfX, 13, { align: 'center' });
  }

  for (let gz = startGridZ; gz <= endGridZ; gz += spacing) {
    const pdfY = offsetY + (gz - minZ) * scale;
    doc.line(15, pdfY, 282, pdfY);
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 130);
    doc.text(`Z: ${gz}m`, 11, pdfY + 1);
  }
  doc.setLineDashPattern([], 0); // reset dash

  // North Arrow Indicator
  const northX = 272;
  const northY = 24;
  doc.setDrawColor(40, 40, 60);
  doc.setLineWidth(0.4);
  doc.line(northX, northY + 6, northX, northY - 6); // Vertical arrow line
  doc.line(northX, northY - 6, northX - 2.5, northY - 2.5); // left barb
  doc.line(northX, northY - 6, northX + 2.5, northY - 2.5); // right barb
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('N', northX, northY - 8, { align: 'center' });

  // 1. Draw Structures (Pipe Racks) - Drawn underneath pipes
  structures.forEach(s => {
    const [x, y, z] = s.position || [0, 0, 0];
    const w = (s.baysX || 3) * (s.bayWidth || 6);
    const l = (s.baysZ || 1) * (s.bayLength || 6);
    const angle = s.rotation ? s.rotation[1] : 0;

    const cx = offsetX + (x - minX) * scale;
    const cy = offsetY + (z - minZ) * scale;

    const pts = getRotatedPoints(cx, cy, w * scale, l * scale, angle);

    // Draw rack footprint shade
    doc.setFillColor(246, 247, 249);
    doc.setDrawColor(160, 165, 175);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([2, 2], 0);
    drawPolygon(doc, pts, 'FD');
    doc.setLineDashPattern([], 0);

    // Draw Columns as dark rectangles
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let ix = 0; ix <= (s.baysX || 3); ix++) {
      for (let iz = 0; iz <= (s.baysZ || 1); iz++) {
        const colX_loc = ix * (s.bayWidth || 6) - w / 2;
        const colZ_loc = iz * (s.bayLength || 6) - l / 2;

        const ccx = cx + (colX_loc * scale) * cos - (colZ_loc * scale) * sin;
        const ccy = cy + (colX_loc * scale) * sin + (colZ_loc * scale) * cos;

        doc.setFillColor(80, 85, 95);
        doc.rect(ccx - 0.75, ccy - 0.75, 1.5, 1.5, 'F');
      }
    }

    // Label structure tag in center
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 110, 120);
    doc.text(s.tag || s.id, cx, cy + 1, { align: 'center' });
  });

  // 2. Draw Equipment
  equipment.forEach(eq => {
    const [x, y, z] = eq.position || [0, 0, 0];
    const type = eq.type;
    const dims = eq.dimensions || {};
    const angle = eq.rotation ? eq.rotation[1] : 0;

    const cx = offsetX + (x - minX) * scale;
    const cy = offsetY + (z - minZ) * scale;

    doc.setLineWidth(0.35);

    if (type === 'column') {
      const r = (dims.diameter || 2) / 2 * scale;
      
      // Column Circle
      doc.setFillColor(230, 238, 245);
      doc.setDrawColor(70, 90, 110);
      doc.circle(cx, cy, r, 'FD');

      // Center crosshair
      doc.setLineWidth(0.12);
      doc.setDrawColor(140, 150, 160);
      doc.line(cx - r - 2, cy, cx + r + 2, cy);
      doc.line(cx, cy - r - 2, cx, cy + r + 2);

      // Label
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(50, 60, 75);
      doc.text(eq.tag, cx, cy + 2.5, { align: 'center' });

    } else if (type === 'sphericalTank') {
      const r = (dims.diameter || 10) / 2 * scale;
      
      // Sphere Circle
      doc.setFillColor(242, 235, 230);
      doc.setDrawColor(130, 90, 70);
      doc.circle(cx, cy, r, 'FD');

      // Equator structural ring (slightly dashed outer circle)
      doc.setLineWidth(0.15);
      doc.setLineDashPattern([2, 2], 0);
      doc.circle(cx, cy, r + 1, 'S');
      doc.setLineDashPattern([], 0);

      // Center crosshair
      doc.setLineWidth(0.12);
      doc.setDrawColor(160, 140, 130);
      doc.line(cx - r - 2, cy, cx + r + 2, cy);
      doc.line(cx, cy - r - 2, cx, cy + r + 2);

      // Label
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(80, 50, 30);
      doc.text(eq.tag, cx, cy + 2.5, { align: 'center' });

    } else if (type === 'horizontalVessel') {
      const w = dims.diameter || 2;
      const l = dims.length || 6;
      
      const wScale = w * scale;
      const lTotalScale = (l + w) * scale;
      const lBodyScale = l * scale;

      const pts = getRotatedPoints(cx, cy, wScale, lTotalScale, angle);

      // Rotated rectangular body
      doc.setFillColor(232, 245, 238);
      doc.setDrawColor(60, 110, 80);
      drawPolygon(doc, pts, 'FD');

      // Draw Tangent Lines (where caps meet cylinder body)
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const wHalf = wScale / 2;
      const lBodyHalf = lBodyScale / 2;

      doc.setLineWidth(0.18);
      
      // Top tangent line
      const tx1 = cx + (-wHalf) * cos - (-lBodyHalf) * sin;
      const ty1 = cy + (-wHalf) * sin + (-lBodyHalf) * cos;
      const tx2 = cx + (wHalf) * cos - (-lBodyHalf) * sin;
      const ty2 = cy + (wHalf) * sin + (-lBodyHalf) * cos;
      doc.line(tx1, ty1, tx2, ty2);

      // Bottom tangent line
      const tx3 = cx + (-wHalf) * cos - (lBodyHalf) * sin;
      const ty3 = cy + (-wHalf) * sin + (lBodyHalf) * cos;
      const tx4 = cx + (wHalf) * cos - (lBodyHalf) * sin;
      const ty4 = cy + (wHalf) * sin + (lBodyHalf) * cos;
      doc.line(tx3, ty3, tx4, ty4);

      // Label
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(40, 80, 50);
      doc.text(eq.tag, cx, cy + 2.5, { align: 'center' });

    } else if (type === 'sruFurnace') {
      const w = dims.width || 6;
      const d = dims.depth || 4;

      const pts = getRotatedPoints(cx, cy, w * scale, d * scale, angle);

      // Furnace body
      doc.setFillColor(248, 235, 235);
      doc.setDrawColor(120, 60, 60);
      drawPolygon(doc, pts, 'FD');

      // Stack circle (small circular stack in middle)
      const stackR = (dims.stackDiameter || 2) / 2 * scale;
      doc.setFillColor(235, 210, 210);
      doc.circle(cx, cy, stackR, 'FD');

      // Label
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(90, 40, 40);
      doc.text(eq.tag, cx, cy + 2.5, { align: 'center' });

    } else if (type === 'airCooler') {
      const w = dims.width || 8;
      const d = dims.depth || 3;
      const fanCount = dims.fanCount || 4;
      const fanD = dims.fanDiameter || 2.5;

      const pts = getRotatedPoints(cx, cy, w * scale, d * scale, angle);

      // Air cooler rectangular frame
      doc.setFillColor(235, 245, 248);
      doc.setDrawColor(54, 110, 120);
      drawPolygon(doc, pts, 'FD');

      // Draw cooling fans inside cooler
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const fanSpacing = w / fanCount;
      const startX = -w / 2 + fanSpacing / 2;

      doc.setLineWidth(0.12);
      doc.setFillColor(205, 225, 232);
      
      for (let i = 0; i < fanCount; i++) {
        const fx_loc = startX + i * fanSpacing;
        const fcx = cx + (fx_loc * scale) * cos;
        const fcy = cy + (fx_loc * scale) * sin;
        
        doc.circle(fcx, fcy, (fanD * scale) / 2, 'FD');
      }

      // Label
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 70, 80);
      doc.text(eq.tag, cx, cy + 2.5, { align: 'center' });
    }

    // 3. Draw Nozzles on Equipment
    if (eq.nozzles) {
      eq.nozzles.forEach(nozzle => {
        const wPos = getNozzleWorldPosition(eq, nozzle);
        const nPdfX = offsetX + (wPos[0] - minX) * scale;
        const nPdfY = offsetY + (wPos[2] - minZ) * scale;
        
        // Draw tiny red dot
        doc.setLineWidth(0.1);
        doc.setDrawColor(220, 50, 30);
        doc.setFillColor(255, 120, 100);
        doc.circle(nPdfX, nPdfY, 0.7, 'FD');
        
        // Write very small label next to it
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(160, 40, 20);
        
        // Offset nozzle text dynamically depending on offset to center
        const dx = nPdfX - cx;
        const dy = nPdfY - cy;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const ox = (dx / dist) * 1.5;
        const oy = (dy / dist) * 1.5;
        
        doc.text(nozzle.id, nPdfX + ox, nPdfY + oy + 0.6, { align: ox >= 0 ? 'left' : 'right' });
      });
    }
  });

  // 4. Draw Pipes
  pipes.forEach(p => {
    if (p.segments && p.segments.length > 0) {
      doc.setLineWidth(0.5);
      doc.setDrawColor(40, 110, 220); // Blue pipes

      p.segments.forEach(seg => {
        if (seg.type === 'pipe') {
          const start = seg.start || [0, 0, 0];
          const end = seg.end || [0, 0, 0];
          const px1 = offsetX + (start[0] - minX) * scale;
          const py1 = offsetY + (start[2] - minZ) * scale;
          const px2 = offsetX + (end[0] - minX) * scale;
          const py2 = offsetY + (end[2] - minZ) * scale;
          doc.line(px1, py1, px2, py2);
        } else if (seg.type === 'elbow') {
          const center = seg.center || [0, 0, 0];
          const ecx = offsetX + (center[0] - minX) * scale;
          const ecy = offsetY + (center[2] - minZ) * scale;
          doc.setFillColor(40, 110, 220);
          doc.circle(ecx, ecy, 0.35, 'F');
        }
      });

      // Find longest straight segment to annotate line number
      let maxLen = -1;
      let bestSegMid = null;
      p.segments.forEach(seg => {
        if (seg.type === 'pipe') {
          const l = seg.length || 0;
          if (l > maxLen) {
            maxLen = l;
            const s = seg.start;
            const e = seg.end;
            bestSegMid = [
              offsetX + ((s[0] + e[0]) / 2 - minX) * scale,
              offsetY + ((s[2] + e[2]) / 2 - minZ) * scale
            ];
          }
        }
      });

      if (bestSegMid) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(30, 80, 180);
        doc.text(p.lineNumber, bestSegMid[0], bestSegMid[1] - 1.2, { align: 'center' });
      }
    }
  });

  // 5. Title Block (Page 1)
  doc.setDrawColor(40, 40, 60);
  doc.setLineWidth(0.4);
  doc.rect(15, 172, 267, 23, 'S');

  // Title block grid lines
  doc.line(75, 172, 75, 195);
  doc.line(185, 172, 185, 195);
  doc.line(245, 172, 245, 195);

  // Column 1 contents
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(26, 58, 106);
  doc.text('PLANTOVA 3D', 20, 179);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(110, 110, 120);
  doc.text('REFINERY PLANT DESIGN ENGINE', 20, 183);
  doc.setFont('Helvetica', 'oblique');
  doc.text('1-Click Plot Plan Drawing', 20, 188);

  // Column 2 contents
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 65, 75);
  doc.text('PROJECT NAME:', 78, 177);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 40);
  doc.text(projectName || 'Plantova 3D', 78, 182);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(60, 65, 75);
  doc.text('DATE:', 78, 189);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(dateStr, 88, 189);

  // Column 3 contents
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(26, 58, 106);
  doc.text('2D PLOT PLAN & EQUIPMENT LAYOUT', 188, 181);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(110, 110, 120);
  doc.text('DOCUMENT NO: PF-PL-001-REV0', 188, 186);
  doc.text('COORDINATE SYSTEM: LOCAL SITE GRID (METERS)', 188, 191);

  // Column 4 contents
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(60, 65, 75);
  doc.text('SCALE:', 248, 177);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`1 : ${Math.round(1000 / scale)}`, 248, 182); // e.g. 1 : 125
  doc.setFont('Helvetica', 'bold');
  doc.text('SHEET:', 248, 189);
  doc.setFont('Helvetica', 'normal');
  doc.text('1 OF 2', 260, 189);


  // -------------------------------------------------------------
  // PAGE 2: SCHEDULES & MTO TABLES
  // -------------------------------------------------------------
  doc.addPage('a4', 'landscape');

  // Page 2 outer border
  doc.setDrawColor(40, 40, 60);
  doc.setLineWidth(0.6);
  doc.rect(10, 10, 277, 190, 'S');

  // Header Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(26, 58, 106);
  doc.text('EQUIPMENT SCHEDULE & MATERIAL TAKE-OFF SUMMARY', 15, 20);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 115);
  doc.text(`Project: ${projectName}  |  Date: ${dateStr}`, 15, 24);

  // 1. Build Equipment Schedule Table Rows
  const eqRows = equipment.map(eq => {
    let typeName = 'Column';
    const dims = eq.dimensions || {};
    let dimStr = '';
    
    if (eq.type === 'column') {
      typeName = 'Column / Reactor';
      dimStr = `Dia: ${dims.diameter}m, H: ${dims.height}m`;
    } else if (eq.type === 'horizontalVessel') {
      typeName = 'Horizontal Vessel';
      dimStr = `Dia: ${dims.diameter}m, L: ${dims.length}m`;
    } else if (eq.type === 'sphericalTank') {
      typeName = 'Spherical Tank';
      dimStr = `Dia: ${dims.diameter}m`;
    } else if (eq.type === 'sruFurnace') {
      typeName = 'SRU Box Furnace';
      dimStr = `W: ${dims.width}m, D: ${dims.depth}m, H: ${dims.height}m`;
    } else if (eq.type === 'airCooler') {
      typeName = 'Air Cooler';
      dimStr = `W: ${dims.width}m, D: ${dims.depth}m, H: ${dims.height}m`;
    }

    return [
      eq.tag,
      typeName,
      dimStr,
      `X: ${eq.position[0].toFixed(2)}, Z: ${eq.position[2].toFixed(2)}`,
      eq.designTemperature ? `${eq.designTemperature}°C` : '20°C',
      eq.designPressure ? `${eq.designPressure} barg` : '0 barg'
    ];
  });

  // Append structures to equipment table
  structures.forEach(s => {
    const w = (s.baysX || 3) * (s.bayWidth || 6);
    const l = (s.baysZ || 1) * (s.bayLength || 6);
    eqRows.push([
      s.tag,
      'Pipe Rack Structure',
      `Size: ${w}m x ${l}m (${s.baysX}x${s.baysZ} bays)`,
      `X: ${s.position[0].toFixed(2)}, Z: ${s.position[2].toFixed(2)}`,
      '-',
      '-'
    ]);
  });

  // Draw Equipment Schedule
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(26, 58, 106);
  doc.text('I. Equipment & Structures Layout Coordinates', 15, 33);

  const eqHeaders = ['Tag / Item', 'Item Type', 'Dimensions / Details', 'Center Position (Grid)', 'Design Temp', 'Design Press'];
  const eqColWidths = [30, 45, 60, 60, 25, 30]; // Sum = 250mm
  
  let currentY = drawTable(doc, 15, 36, eqHeaders, eqRows, eqColWidths);

  // 2. Build Pipe MTO Table
  const routedPipes = pipes.filter(p => p.segments && p.segments.length > 0);
  
  if (routedPipes.length > 0) {
    const mto = generateMTO(routedPipes);

    const pipeRows = mto.lines.map(line => [
      line.lineNumber,
      `${line.nominalSize}"`,
      line.material,
      line.totalLength.toFixed(2),
      line.elbows90,
      line.elbows45,
      line.flexibilityStatus?.status || 'N/A'
    ]);

    // Append grand total row
    pipeRows.push([
      'TOTAL MTO',
      '',
      '',
      mto.grandTotal.totalLength,
      mto.grandTotal.elbows90,
      mto.grandTotal.elbows45,
      ''
    ]);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(26, 58, 106);
    doc.text('II. Piping Material Take-Off (MTO) Summary', 15, currentY + 10);

    const pipeHeaders = ['Line Number', 'Nom. Size', 'Pipe Material', 'Total Length (m)', '90° Elbows', '45° Elbows', 'Flexibility'];
    const pipeColWidths = [45, 25, 45, 40, 35, 35, 25]; // Sum = 250mm

    drawTable(doc, 15, currentY + 13, pipeHeaders, pipeRows, pipeColWidths);
  } else {
    // If no routed pipes, display a note
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(26, 58, 106);
    doc.text('II. Piping Material Take-Off (MTO) Summary', 15, currentY + 10);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 120);
    doc.text('No routed pipe lines found in layout. Route lines using the routing tool to populate the piping MTO schedule.', 15, currentY + 15);
  }

  // Footer (Page 2)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 115);
  doc.text('Sheet 2 of 2  |  Plantova 3D - Refinery Plant Design', 15, 201);

  // -------------------------------------------------------------
  // SAVE / DOWNLOAD PDF
  // -------------------------------------------------------------
  const nameSafe = (projectName || 'project').replace(/[^a-z0-9_-]/gi, '_');
  doc.save(`${nameSafe}-2D-PlotPlan.pdf`);
}
