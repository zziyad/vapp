/**
 * Minimal, dependency-free PDF generator for simple text/lines/rectangles.
 *
 * Notes:
 * - Supports Helvetica (built-in Type1).
 * - Enough for our VAPP print template (header + table + notes + signature lines).
 * - Not a full PDF implementation (no images).
 */

const A4 = { width: 595.28, height: 841.89 }; // points

function pdfEscapeText(str) {
  // NOTE: Our minimal PDF text writer does not support full Unicode.
  // Replace non-latin1 chars to avoid corrupted output.
  const sanitized = String(str ?? '').replace(/[^\x00-\xFF]/g, '?');
  return sanitized
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function toFixed(n) {
  return Number(n).toFixed(2);
}

function rgbFill(r, g, b) {
  // 0..255 -> 0..1
  return `${toFixed(r / 255)} ${toFixed(g / 255)} ${toFixed(b / 255)} rg`;
}

function rgbStroke(r, g, b) {
  return `${toFixed(r / 255)} ${toFixed(g / 255)} ${toFixed(b / 255)} RG`;
}

function drawText({ x, y, text, size = 12, align = 'left', width = null }) {
  const safe = pdfEscapeText(text);
  // Simple width estimate (Helvetica avg ~0.5em); good enough for centering header
  const estWidth = safe.length * size * 0.52;
  let tx = x;
  if (align === 'center' && width != null) tx = x + (width - estWidth) / 2;
  if (align === 'right' && width != null) tx = x + (width - estWidth);

  // PDF text uses bottom-left origin; we use bottom-left too in layout
  return [
    'BT',
    `/F1 ${toFixed(size)} Tf`,
    `${toFixed(tx)} ${toFixed(y)} Td`,
    `(${safe}) Tj`,
    'ET',
  ].join('\n');
}

function truncateToWidth(text, maxWidth, fontSize) {
  const s = String(text ?? '');
  if (!maxWidth || maxWidth <= 0) return s;
  const avgCharW = fontSize * 0.52;
  const maxChars = Math.max(0, Math.floor(maxWidth / avgCharW));
  if (s.length <= maxChars) return s;
  if (maxChars <= 1) return s.slice(0, 1);
  return s.slice(0, Math.max(0, maxChars - 1)) + '…';
}

function drawLine({ x1, y1, x2, y2, w = 1 }) {
  return [
    `${toFixed(w)} w`,
    `${toFixed(x1)} ${toFixed(y1)} m`,
    `${toFixed(x2)} ${toFixed(y2)} l`,
    'S',
  ].join('\n');
}

function drawRect({ x, y, w, h, fill = false }) {
  return [
    `${toFixed(x)} ${toFixed(y)} ${toFixed(w)} ${toFixed(h)} re`,
    fill ? 'f' : 'S',
  ].join('\n');
}

function buildPdf(objects) {
  // Build xref
  let out = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(out.length);
    out += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
  }
  const xrefOffset = out.length;
  out += `xref\n0 ${objects.length + 1}\n`;
  out += `0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    out += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return out;
}

/**
 * Create the VAPP template PDF as a byte string (latin1-friendly).
 *
 * @param {Object} opts
 * @param {string} opts.dateTime
 * @param {string} opts.sector
 * @param {string} opts.functionalArea
 * @param {Array<{vappType:string, serial:string, driver:string, plate:string, company:string}>} opts.rows
 */
export function createVappTemplatePdf({ dateTime, sector, functionalArea, rows }) {
  const page = A4;

  // Layout constants (points)
  const margin = 24;
  const contentW = page.width - margin * 2;
  const headerTopY = page.height - margin - 24;
  const headerLineGap = 18;

  // Table layout
  const tableX = margin + 40;
  const tableW = contentW - 80;
  const headerH = 28;
  const rowH = 26;
  const tableTopY = page.height - 250;

  const cols = [
    { key: '#', w: 32 },
    { key: 'type', w: 80 },
    { key: 'serial', w: 150 },
    { key: 'driver', w: 120 },
    { key: 'plate', w: 140 },
    { key: 'company', w: 100 },
  ];
  const scale = tableW / cols.reduce((s, c) => s + c.w, 0);
  cols.forEach((c) => (c.w *= scale));

  // Background + border
  const bg = [
    rgbStroke(0, 0, 0),
    `${toFixed(2)} w`,
    drawRect({ x: margin, y: margin, w: contentW, h: page.height - margin * 2, fill: false }),
  ].join('\n');

  // Light gray page fill (like template)
  const fillBg = [
    rgbFill(235, 235, 235),
    drawRect({ x: margin + 1, y: margin + 1, w: contentW - 2, h: page.height - margin * 2 - 2, fill: true }),
    rgbFill(0, 0, 0),
  ].join('\n');

  // Header centered
  const header = [
    drawText({ x: margin, y: headerTopY, width: contentW, align: 'center', size: 14, text: dateTime || 'Date time' }),
    drawText({ x: margin, y: headerTopY - headerLineGap, width: contentW, align: 'center', size: 14, text: sector || 'Sector' }),
    drawText({
      x: margin,
      y: headerTopY - headerLineGap * 2,
      width: contentW,
      align: 'center',
      size: 14,
      text: functionalArea || 'Functional Area',
    }),
  ].join('\n');

  // Table header row (teal with white text)
  const teal = { r: 12, g: 90, b: 115 };
  let x = tableX;
  const yHeader = tableTopY;
  const tableHeader = [
    rgbFill(teal.r, teal.g, teal.b),
    drawRect({ x: tableX, y: yHeader, w: tableW, h: headerH, fill: true }),
    rgbFill(255, 255, 255),
    // vertical separators
    rgbStroke(255, 255, 255),
    `${toFixed(1)} w`,
    (() => {
      let xx = tableX;
      return cols
        .slice(0, -1)
        .map((c) => {
          xx += c.w;
          return drawLine({ x1: xx, y1: yHeader, x2: xx, y2: yHeader + headerH, w: 1 });
        })
        .join('\n');
    })(),
    rgbFill(255, 255, 255),
    (() => {
      const labels = ['#', 'VAPP\ntype', 'Serial\nnumber', 'Driver Name', 'Vehicle License Plate', 'company'];
      let xx = tableX;
      const parts = [];
      for (let idx = 0; idx < cols.length; idx += 1) {
        const c = cols[idx];
        const label = labels[idx] ?? '';
        const lines = String(label).split('\n');
        // center-ish vertically in header
        const baseY = yHeader + headerH - 10;
        for (let li = 0; li < lines.length; li += 1) {
          const ln = truncateToWidth(lines[li], c.w - 12, 10);
          parts.push(
            drawText({
              x: xx + 6,
              y: baseY - li * 11,
              size: 10,
              text: ln,
            })
          );
        }
        xx += c.w;
      }
      return parts.join('\n');
    })(),
  ].join('\n');

  // Table rows (white lines, no fill)
  const bodyRows = (() => {
    const cmds = [];
    // Reset fill/stroke to black text, white borders
    cmds.push(rgbStroke(255, 255, 255));
    cmds.push(`${toFixed(1)} w`);
    rows.forEach((r, idx) => {
      const y = yHeader - (idx + 1) * rowH;
      // Row outer rect (white stroke)
      cmds.push(drawRect({ x: tableX, y, w: tableW, h: rowH, fill: false }));
      // Vertical separators
      let xx = tableX;
      cols.slice(0, -1).forEach((c) => {
        xx += c.w;
        cmds.push(drawLine({ x1: xx, y1: y, x2: xx, y2: y + rowH, w: 1 }));
      });
      // Row text (black)
      cmds.push(rgbFill(0, 0, 0));
      const rawCells = [
        String(idx + 1),
        r.vappType || '',
        r.serial || '',
        r.driver || '',
        r.plate || '',
        r.company || '',
      ];
      let tx = tableX;
      rawCells.forEach((val, ci) => {
        const maxW = cols[ci]?.w ? cols[ci].w - 12 : 120;
        // Don't truncate serial numbers (column index 2) - show full value
        const text = ci === 2 ? String(val || '') : truncateToWidth(val, maxW, 10);
        cmds.push(
          drawText({
            x: tx + 6,
            y: y + 8,
            size: 10,
            text,
          })
        );
        tx += cols[ci].w;
      });
      cmds.push(rgbStroke(255, 255, 255));
    });
    return cmds.join('\n');
  })();

  // Notes
  const notesY = margin + 140;
  const notes = [
    rgbFill(0, 0, 0),
    drawText({ x: margin + 28, y: notesY + 86, size: 10, text: "'Important notes:" }),
    drawText({ x: margin + 28, y: notesY + 66, size: 9, text: '-VAPP must be correctly displayed on the bottom right-hand Side of the windshield and' }),
    drawText({ x: margin + 28, y: notesY + 52, size: 9, text: 'be clearly visible from the outside of the vehicle at all times.' }),
    drawText({ x: margin + 28, y: notesY + 38, size: 9, text: '-This VAPP is non-transferable.' }),
    drawText({ x: margin + 28, y: notesY + 24, size: 9, text: '-By signing this form, the collector declares the further responsibility of the VAPP.' }),
    drawText({ x: margin + 28, y: notesY + 10, size: 9, text: '-VAPP holder must follow parking rules and regulations, roadway signage and' }),
    drawText({ x: margin + 28, y: notesY - 4, size: 9, text: 'instructions given by traffic marshals.' }),
    drawText({ x: margin + 28, y: notesY - 18, size: 9, text: '-Transport and security maintain the right to confiscate the VAPP if necessary.' }),
  ].join('\n');

  // Sign lines
  const signY = margin + 60;
  const sign = [
    rgbStroke(0, 0, 0),
    `${toFixed(1)} w`,
    drawText({ x: margin + 60, y: signY + 10, size: 10, text: 'Distributed by:' }),
    drawLine({ x1: margin + 140, y1: signY + 10, x2: margin + 220, y2: signY + 10, w: 1 }),
    drawText({ x: margin + 310, y: signY + 10, size: 10, text: 'Received by:' }),
    drawLine({ x1: margin + 385, y1: signY + 10, x2: margin + 500, y2: signY + 10, w: 1 }),
  ].join('\n');

  const contentStream = [fillBg, bg, header, tableHeader, bodyRows, notes, sign].join('\n');

  // PDF objects
  const objects = [
    { id: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' },
    { id: 2, body: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
    {
      id: 3,
      body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${toFixed(page.width)} ${toFixed(page.height)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    },
    { id: 4, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' },
    {
      id: 5,
      body: `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`,
    },
  ];

  const pdf = buildPdf(objects);
  return pdf;
}
