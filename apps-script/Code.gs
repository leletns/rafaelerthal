/**
 * Google Apps Script — Clínica Blue Dashboard Integration
 * Deploy as Web App with "Anyone" access.
 *
 * Setup:
 *   1. Run setupSheets() once to create sheet structure.
 *   2. Set the access token via setToken() or directly in
 *      PropertiesService: Script Properties → DASHBOARD_TOKEN
 *   3. Deploy as Web App → Anyone can access.
 *
 * Sheet structure:
 *   Cirurgias_2025: d, mes, p, c, cl, v, reg
 *   Cirurgias_2026: d, mes, p, c, cl, v, reg
 *   Consultas_2025: d, mes, p, tel, idade, canal, cidade, obs
 *   Consultas_2026: d, mes, p, tel, idade, canal, cidade, obs
 *   Pipeline: id, patientName, phone, procedure, value, stage, createdAt, updatedAt, notes
 */

const SHEET_NAMES = {
  cir25: 'Cirurgias_2025',
  cir26: 'Cirurgias_2026',
  cons25: 'Consultas_2025',
  cons26: 'Consultas_2026',
  pipeline: 'Pipeline',
};

const TOKEN_PROP = 'DASHBOARD_TOKEN';

// -------------------------------------------------------
// Token validation
// -------------------------------------------------------
function getConfiguredToken() {
  return PropertiesService.getScriptProperties().getProperty(TOKEN_PROP) || '';
}

function validateToken(token) {
  const configured = getConfiguredToken();
  if (!configured) return true; // token not set → open (dev mode)
  return String(token || '') === configured;
}

function unauthorizedResponse() {
  return ContentService.createTextOutput(
    JSON.stringify({ error: 'Unauthorized' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------
// HTTP handlers
// -------------------------------------------------------
function doGet(e) {
  const token = e.parameter.token || '';
  if (!validateToken(token)) return unauthorizedResponse();

  const action = e.parameter.action || 'pull';

  if (action === 'pull') return handlePull();

  return ContentService.createTextOutput(
    JSON.stringify({ error: 'Unknown action' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch {
    return ContentService.createTextOutput(
      JSON.stringify({ error: 'Invalid JSON' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (!validateToken(body.token)) return unauthorizedResponse();

  const action = body.action || 'push';

  if (action === 'push') return handlePush(body);
  if (action === 'appendRow') return handleAppendRow(body);

  return ContentService.createTextOutput(
    JSON.stringify({ error: 'Unknown action' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------
// Pull: return all sheet data as JSON
// -------------------------------------------------------
function handlePull() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};

  Object.entries(SHEET_NAMES).forEach(([key, sheetName]) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) { result[key] = []; return; }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) { result[key] = []; return; }

    const headers = data[0].map(h => String(h).trim());
    result[key] = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    }).filter(row =>
      Object.values(row).some(v => v !== '' && v !== null && v !== undefined)
    );
  });

  return ContentService.createTextOutput(
    JSON.stringify({ success: true, data: result, timestamp: new Date().toISOString() })
  ).setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------
// Push: rewrite pipeline sheet; extend to other sheets
// -------------------------------------------------------
function handlePush(body) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let rowsUpdated = 0;

  // Pipeline (full rewrite)
  if (body.pipeline && Array.isArray(body.pipeline)) {
    const sheet = ss.getSheetByName(SHEET_NAMES.pipeline) ||
                  ss.insertSheet(SHEET_NAMES.pipeline);
    sheet.clearContents();
    const headers = ['id','patientName','phone','procedure','value','stage','createdAt','updatedAt','notes'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (body.pipeline.length > 0) {
      const rows = body.pipeline.map(card => headers.map(h => card[h] ?? ''));
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      rowsUpdated += rows.length;
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({ success: true, rowsUpdated, timestamp: new Date().toISOString() })
  ).setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------
// AppendRow: add a single row to any sheet
// -------------------------------------------------------
function handleAppendRow(body) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetKey = body.sheet;
  const rowData = body.row;

  const sheetName = SHEET_NAMES[sheetKey];
  if (!sheetName) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: 'Unknown sheet key: ' + sheetKey })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: 'Sheet not found: ' + sheetName })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const row = headers.map(h => rowData[h] ?? '');
  sheet.appendRow(row);

  return ContentService.createTextOutput(
    JSON.stringify({ success: true, timestamp: new Date().toISOString() })
  ).setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------
// Setup — run once to create sheet structure
// -------------------------------------------------------
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const schemas = [
    { name: SHEET_NAMES.cir25, headers: ['d','mes','p','c','cl','v','reg'] },
    { name: SHEET_NAMES.cir26, headers: ['d','mes','p','c','cl','v','reg'] },
    { name: SHEET_NAMES.cons25, headers: ['d','mes','p','tel','idade','canal','cidade','obs'] },
    { name: SHEET_NAMES.cons26, headers: ['d','mes','p','tel','idade','canal','cidade','obs'] },
    { name: SHEET_NAMES.pipeline, headers: ['id','patientName','phone','procedure','value','stage','createdAt','updatedAt','notes'] },
  ];

  schemas.forEach(({ name, headers }) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
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

// -------------------------------------------------------
// Token management — run from editor to set token
// -------------------------------------------------------
function setToken() {
  const token = 'CHANGE_ME'; // replace before running
  PropertiesService.getScriptProperties().setProperty(TOKEN_PROP, token);
  Logger.log('Token saved to Script Properties.');
}

function getToken() {
  Logger.log('Current token: ' + getConfiguredToken());
}
