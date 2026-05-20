/**
 * Google Apps Script — Clínica Blue Dashboard Integration
 * Deploy as Web App with "Anyone" access for use with the dashboard API.
 *
 * Sheet structure expected:
 * - Sheet "Cirurgias_2025": d, mes, p, c, cl, v
 * - Sheet "Cirurgias_2026": d, mes, p, c, cl, v
 * - Sheet "Consultas_2025": d, mes, p, tel, idade, canal, cidade
 * - Sheet "Consultas_2026": d, mes, p, tel, idade, canal, cidade
 * - Sheet "Pipeline": id, patientName, phone, procedure, value, stage, createdAt, updatedAt, notes
 */

const SHEET_NAMES = {
  cir25: 'Cirurgias_2025',
  cir26: 'Cirurgias_2026',
  cons25: 'Consultas_2025',
  cons26: 'Consultas_2026',
  pipeline: 'Pipeline',
};

function doGet(e) {
  const action = e.parameter.action || 'pull';

  if (action === 'pull') {
    return handlePull();
  }

  return ContentService.createTextOutput(
    JSON.stringify({ error: 'Unknown action' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: 'Invalid JSON' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const action = body.action || 'push';

  if (action === 'push') {
    return handlePush(body);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ error: 'Unknown action' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handlePull() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};

  Object.entries(SHEET_NAMES).forEach(([key, sheetName]) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      result[key] = [];
      return;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      result[key] = [];
      return;
    }

    const headers = data[0].map(h => String(h).trim());
    result[key] = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    }).filter(row => Object.values(row).some(v => v !== '' && v !== null && v !== undefined));
  });

  return ContentService.createTextOutput(
    JSON.stringify({ success: true, data: result, timestamp: new Date().toISOString() })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handlePush(body) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let rowsUpdated = 0;

  // Handle pipeline updates
  if (body.pipeline && Array.isArray(body.pipeline)) {
    const sheet = ss.getSheetByName(SHEET_NAMES.pipeline) ||
                  ss.insertSheet(SHEET_NAMES.pipeline);

    // Clear and rewrite
    sheet.clearContents();
    const headers = ['id', 'patientName', 'phone', 'procedure', 'value', 'stage', 'createdAt', 'updatedAt', 'notes'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    if (body.pipeline.length > 0) {
      const rows = body.pipeline.map(card => headers.map(h => card[h] || ''));
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      rowsUpdated += rows.length;
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({ success: true, rowsUpdated, timestamp: new Date().toISOString() })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Setup function — run once to create the sheets structure
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const schemasToCreate = [
    { name: SHEET_NAMES.cir25, headers: ['d', 'mes', 'p', 'c', 'cl', 'v', 'reg'] },
    { name: SHEET_NAMES.cir26, headers: ['d', 'mes', 'p', 'c', 'cl', 'v', 'reg'] },
    { name: SHEET_NAMES.cons25, headers: ['d', 'mes', 'p', 'tel', 'idade', 'canal', 'cidade', 'obs'] },
    { name: SHEET_NAMES.cons26, headers: ['d', 'mes', 'p', 'tel', 'idade', 'canal', 'cidade', 'obs'] },
    { name: SHEET_NAMES.pipeline, headers: ['id', 'patientName', 'phone', 'procedure', 'value', 'stage', 'createdAt', 'updatedAt', 'notes'] },
  ];

  schemasToCreate.forEach(({ name, headers }) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#1D1D1F')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold');
    }
  });

  Logger.log('Setup complete!');
}
