/**
 * Proctored Exam Portal - backend (Google Apps Script)
 * Bound to a Google Sheet. Creates two tabs automatically:
 *   "Log"   - every event (start, violation, terminated, snapshot, ...)
 *   "State" - one row per student+exam: warnings used and whether terminated.
 * To let a student retry: delete their row in "State" (or set terminated to FALSE).
 */
const SNAPSHOT_FOLDER = 'Exam Snapshots';   // Drive folder for webcam photos

function tab_(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(header); sh.setFrozenRows(1); }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Called by the portal before an exam starts: has this student already been terminated?
function doGet(e) {
  const key = (e.parameter && e.parameter.key) || '';
  if (!key) return json_({ ok: true });
  const st = tab_('State', ['key', 'studentId', 'examKey', 'count', 'terminated', 'updated']);
  const rows = st.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) return json_({ count: Number(rows[i][3]) || 0, terminated: rows[i][4] === true || rows[i][4] === 'TRUE' });
  }
  return json_({ count: 0, terminated: false });
}

// Called by the portal for every event.
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const d = JSON.parse(e.postData.contents);
    const key = 'proctor:' + String(d.studentId || '').trim().toLowerCase() + '|' + (d.examKey || '');
    let note = d.reason || d.kind || d.code || d.message || d.action || '';

    if (d.type === 'snapshot' && d.image) {
      const folders = DriveApp.getFoldersByName(SNAPSHOT_FOLDER);
      const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(SNAPSHOT_FOLDER);
      const blob = Utilities.newBlob(Utilities.base64Decode(d.image.split(',')[1]), 'image/jpeg',
                                     d.studentId + '_' + d.time.replace(/[:.]/g, '-') + '.jpg');
      note = folder.createFile(blob).getUrl();
    }

    tab_('Log', ['received', 'time', 'studentId', 'examKey', 'type', 'detail', 'count'])
      .appendRow([new Date(), d.time, d.studentId, d.examKey, d.type, note, d.count || '']);

    if (d.type === 'violation' || d.type === 'terminated') {
      const st = tab_('State', ['key', 'studentId', 'examKey', 'count', 'terminated', 'updated']);
      const rows = st.getDataRange().getValues();
      let row = -1;
      for (let i = 1; i < rows.length; i++) if (rows[i][0] === key) { row = i + 1; break; }
      const prevCount = row > 0 ? Number(st.getRange(row, 4).getValue()) || 0 : 0;
      const count = Math.max(prevCount, Number(d.count) || 0);
      const terminated = d.type === 'terminated' || (row > 0 && st.getRange(row, 5).getValue() === true);
      const vals = [key, d.studentId, d.examKey, count, terminated, new Date()];
      if (row > 0) st.getRange(row, 1, 1, 6).setValues([vals]); else st.appendRow(vals);
    }
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
