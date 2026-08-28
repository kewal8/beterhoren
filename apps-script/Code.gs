/**
 * Beter Horen — lead capture endpoint
 *
 * Receives a JSON POST from the landing page form, appends one row to a
 * Google Sheet and stores the uploaded CV in a Drive folder. The Sheet
 * holds a link to the file, not the file itself.
 *
 * Setup: see apps-script/README.md
 */

const SHEET_ID = 'PASTE_YOUR_SHEET_ID';
const FOLDER_ID = 'PASTE_YOUR_DRIVE_FOLDER_ID';

const COLUMNS = [
  'Tijdstip',
  'Variant',
  'Naam',
  'E-mail',
  'Telefoon',
  'Woonplaats',
  'Motivatie',
  'Loondienst',
  'CV',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'Referrer',
  'Consent',
];

function doPost(e) {
  // Serialise concurrent submissions so two leads can't claim the same row.
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const data = JSON.parse(e.postData.contents);

    const cvUrl = data.cv ? saveCv(data) : '';
    const sheet = getSheet();

    sheet.appendRow([
      new Date(),
      data.variant || '',
      data.naam || '',
      data.email || '',
      data.tel || '',
      data.plaats || '',
      data.extra || '',
      data.loondienst ? 'Ja' : 'Nee',
      cvUrl,
      data.gclid || '',
      data.gbraid || '',
      data.wbraid || '',
      data.fbclid || '',
      data.utm_source || '',
      data.utm_medium || '',
      data.utm_campaign || '',
      data.utm_term || '',
      data.utm_content || '',
      data.referrer || '',
      data.consent || '',
    ]);

    return json({ ok: true, cv: cvUrl });
  } catch (err) {
    // Log and return 200 with ok:false — the page should still redirect the
    // applicant to the thank-you page rather than stranding them on an error.
    console.error(err);
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Decodes the base64 CV and writes it to the Drive folder.
 * Sharing is left untouched: the file stays private to the folder's
 * members. Do NOT make these links public — a CV is personal data.
 */
function saveCv(data) {
  const cv = data.cv;
  if (!cv.base64) return '';

  const blob = Utilities.newBlob(
    Utilities.base64Decode(cv.base64),
    cv.mimeType || 'application/octet-stream',
    buildFileName(data, cv.name)
  );

  return DriveApp.getFolderById(FOLDER_ID).createFile(blob).getUrl();
}

/** e.g. "2026-08-28 Jan Jansen - cv.pdf" — sorts chronologically in Drive. */
function buildFileName(data, originalName) {
  const stamp = Utilities.formatDate(new Date(), 'Europe/Amsterdam', 'yyyy-MM-dd');
  const naam = (data.naam || 'onbekend').replace(/[\\/:*?"<>|]/g, '').trim();
  return stamp + ' ' + naam + ' - ' + (originalName || 'cv');
}

function getSheet() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
