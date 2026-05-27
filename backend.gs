// ═══════════════════════════════════════════════════════════════════════════════
//  AIIT COE RESULT PORTAL — Google Apps Script Backend (backend.gs)
//  Author  : Dr. GOPAL RAJENDRAN
//  Project : profgopal.github.io/COE-RESULT-PORTAL-AIIT/
//
//  SHEET STRUCTURE (Google Sheet named "COE_PORTAL_DB")
//  ─────────────────────────────────────────────────────
//  Sheet 1 : "Students"
//    Col A  : SEN              (Student Enrollment Number — primary key)
//    Col B  : Name
//    Col C  : Program
//    Col D  : School
//    Col E  : CGPA
//    Col F  : Total Credits Earned
//    Col G  : Password Hash    (SHA-256 hex — NEVER overwritten by upsert)
//    Col H  : Courses JSON     (JSON string — array of course objects)
//    Col I  : Source           ("hardcoded" | "upload")
//    Col J  : Last Updated     (ISO timestamp)
//
//  COURSE OBJECT SHAPE (stored as JSON in Col H)
//  ──────────────────────────────────────────────
//  { semester, code, title, type, credits, marks, grade, gradePoints, creditEarned }
//
//  DEPLOYMENT
//  ──────────
//  1.  Open script.google.com → New Project → paste this file as Code.gs
//  2.  Deploy → New Deployment → Web App
//      · Execute as: Me
//      · Who has access: Anyone   ← required for JSONP/cross-device access
//  3.  Copy the deployment URL and paste it in the Admin Panel → GAS URL box
// ═══════════════════════════════════════════════════════════════════════════════

// ── CONFIG ────────────────────────────────────────────────────────────────────
var SPREADSHEET_NAME = 'COE_PORTAL_DB';
var SHEET_NAME       = 'Students';

// Column indices (1-based, matching the sheet layout described above)
var COL = {
  SEN          : 1,   // A
  NAME         : 2,   // B
  PROGRAM      : 3,   // C
  SCHOOL       : 4,   // D
  CGPA         : 5,   // E
  CREDITS      : 6,   // F
  PASSWORD     : 7,   // G  ← NEVER touched by upsert
  COURSES_JSON : 8,   // H
  SOURCE       : 9,   // I
  UPDATED      : 10   // J
};

// ── ENTRY POINTS ─────────────────────────────────────────────────────────────

/**
 * doGet  — handles all read-only requests from the frontend.
 *
 * Supported ?action= values:
 *   ping      → health-check → { status: 'pong' }
 *   login     → validate student credentials
 *   checksen  → check if a SEN exists and whether a password is set
 *   load      → return ALL student records (academic data only, no passwords)
 *
 * All responses are wrapped in a JSONP callback when ?callback= is present,
 * enabling cross-origin reads from the frontend without CORS headers.
 */
function doGet(e) {
  var params   = e.parameter || {};
  var action   = (params.action   || '').toLowerCase().trim();
  var callback = (params.callback || '').replace(/[^a-zA-Z0-9_$]/g, ''); // sanitise callback name

  var result;

  try {
    switch (action) {

      // ── PING ──────────────────────────────────────────────────────────────
      case 'ping':
        result = { status: 'pong', timestamp: new Date().toISOString() };
        break;

      // ── LOGIN ─────────────────────────────────────────────────────────────
      // Query params: ?action=login&sen=...&hash=...
      // Returns student data on success, error object on failure.
      case 'login':
        result = handleLogin(params.sen, params.hash);
        break;

      // ── CHECK SEN ─────────────────────────────────────────────────────────
      // Query params: ?action=checksen&sen=...
      // Returns { found: bool, hasPassword: bool }
      case 'checksen':
        result = handleCheckSen(params.sen);
        break;

      // ── LOAD ALL STUDENTS (academic data only) ────────────────────────────
      // Used by the frontend to sync students across devices.
      case 'load':
        result = handleLoadStudents();
        break;

      default:
        result = { error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { error: 'Server error: ' + err.message };
    Logger.log('doGet error [' + action + ']: ' + err.message);
  }

  return buildResponse(result, callback);
}

/**
 * doPost  — handles all write requests from the frontend.
 *
 * The frontend sends JSON in the POST body as Content-Type: text/plain
 * (to avoid a CORS preflight).  Body shape: { action, ...params }
 *
 * Supported action values:
 *   setpassword   → store a new SHA-256 hash for a student (first-time login)
 *   upsert        → bulk insert/update student records (admin Excel upload)
 *   clearpassword → admin: wipe one student's password hash
 */
function doPost(e) {
  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (parseErr) {
    return buildResponse({ error: 'Invalid JSON payload.' }, '');
  }

  var action   = (payload.action || '').toLowerCase().trim();
  var result;

  try {
    switch (action) {

      // ── SET PASSWORD (first-time login) ───────────────────────────────────
      // Payload: { action:'setpassword', sen, hash }
      case 'setpassword':
        result = handleSetPassword(payload.sen, payload.hash);
        break;

      // ── UPSERT STUDENTS (admin bulk upload) ───────────────────────────────
      // Payload: { action:'upsert', students: [ { sen, name, … } ] }
      case 'upsert':
        result = handleUpsert(payload.students);
        break;

      // ── CLEAR PASSWORD (admin reset) ──────────────────────────────────────
      // Payload: { action:'clearpassword', sen, adminKey }
      case 'clearpassword':
        result = handleClearPassword(payload.sen, payload.adminKey);
        break;

      // Legacy alias used by older frontend versions
      case 'save':
        result = handleUpsert(payload.students);
        break;

      default:
        result = { error: 'Unknown POST action: ' + action };
    }
  } catch (err) {
    result = { error: 'Server error: ' + err.message };
    Logger.log('doPost error [' + action + ']: ' + err.message);
  }

  return buildResponse(result, '');
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HANDLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * handleLogin
 * ──────────────────────────────────────────────────────────────────────────────
 * Validates the student's SHA-256 password hash against the stored hash.
 *
 * @param {string} sen  – Student Enrollment Number (case-insensitive)
 * @param {string} hash – SHA-256 hex hash of the entered password
 * @returns {object}    – { success, student } | { error }
 */
function handleLogin(sen, hash) {
  sen = normaliseSen(sen);
  if (!sen)  return { error: 'SEN is required.' };
  if (!hash) return { error: 'Password hash is required.' };

  var sheet = getSheet();
  var row   = findRowBySen(sheet, sen);
  if (!row) return { error: 'SEN not found. Please check your enrollment number.' };

  var storedHash = sheet.getRange(row, COL.PASSWORD).getValue();

  if (!storedHash || storedHash === '') {
    // No password set yet — student must set one through the frontend flow
    return { error: 'NO_PASSWORD', message: 'No password set. Please create one.' };
  }

  if (storedHash !== hash) {
    return { error: 'WRONG_PASSWORD', message: 'Incorrect password.' };
  }

  // Successful login — return academic data (never return the hash)
  return { success: true, student: rowToStudentObject(sheet, row) };
}

/**
 * handleCheckSen
 * ──────────────────────────────────────────────────────────────────────────────
 * Checks if a SEN exists in the database and whether a password has been set.
 * Used by the frontend to decide whether to show the "create password" UI.
 *
 * @param {string} sen
 * @returns {{ found: boolean, hasPassword: boolean }}
 */
function handleCheckSen(sen) {
  sen = normaliseSen(sen);
  if (!sen) return { found: false, hasPassword: false };

  var sheet = getSheet();
  var row   = findRowBySen(sheet, sen);
  if (!row) return { found: false, hasPassword: false };

  var hash = sheet.getRange(row, COL.PASSWORD).getValue();
  return { found: true, hasPassword: !!hash && hash !== '' };
}

/**
 * handleSetPassword
 * ──────────────────────────────────────────────────────────────────────────────
 * Stores a SHA-256 hash for a student who is creating their password for the
 * first time.  Will NOT overwrite an existing hash (the admin must clear it
 * first via clearpassword).
 *
 * @param {string} sen
 * @param {string} hash – SHA-256 hex string produced by the frontend
 * @returns {{ success: boolean }} | { error: string }
 */
function handleSetPassword(sen, hash) {
  sen = normaliseSen(sen);
  if (!sen)  return { error: 'SEN is required.' };
  if (!hash) return { error: 'Password hash is required.' };
  // Basic SHA-256 hex format validation (64 hex chars)
  if (!/^[0-9a-f]{64}$/i.test(hash)) return { error: 'Invalid password hash format.' };

  var sheet = getSheet();
  var row   = findRowBySen(sheet, sen);
  if (!row) return { error: 'SEN not found.' };

  var existing = sheet.getRange(row, COL.PASSWORD).getValue();
  if (existing && existing !== '') {
    // Password already exists — reject silent overwrites
    return { error: 'PASSWORD_ALREADY_SET', message: 'A password already exists. Contact admin to reset.' };
  }

  sheet.getRange(row, COL.PASSWORD).setValue(hash);
  sheet.getRange(row, COL.UPDATED).setValue(new Date().toISOString());
  SpreadsheetApp.flush();
  Logger.log('Password set for SEN: ' + sen);
  return { success: true };
}

/**
 * handleClearPassword
 * ──────────────────────────────────────────────────────────────────────────────
 * Admin operation: wipes a student's password hash so they are forced to create
 * a new one on next login (the "pwd" flow described in the architecture).
 *
 * A lightweight server-side admin key is checked to prevent abuse.
 * The admin key is the SHA-256 of the admin password — the frontend sends this
 * in the payload so the raw password never travels over the network.
 *
 * @param {string} sen
 * @param {string} adminKey – SHA-256 hash of the admin password
 * @returns {{ success: boolean, sen: string }} | { error: string }
 */
function handleClearPassword(sen, adminKey) {
  // Admin key validation — change this to the SHA-256 of your admin password
  // SHA-256("Gopal@Amity") = pre-compute once and hard-code here.
  // You can get the hash by running hashPwd("Gopal@Amity") in your browser console.
  var ADMIN_HASH = PropertiesService.getScriptProperties().getProperty('ADMIN_HASH') || '';

  // Fallback: if ADMIN_HASH is not set in Script Properties, allow any non-empty key
  // (remove this fallback once you set the property in the GAS project)
  if (!ADMIN_HASH) {
    Logger.log('WARNING: ADMIN_HASH script property not set. Skipping admin key check.');
  } else if (adminKey !== ADMIN_HASH) {
    return { error: 'Unauthorized. Invalid admin key.' };
  }

  sen = normaliseSen(sen);
  if (!sen) return { error: 'SEN is required.' };

  var sheet = getSheet();
  var row   = findRowBySen(sheet, sen);
  if (!row) return { error: 'SEN not found.' };

  sheet.getRange(row, COL.PASSWORD).clearContent();
  sheet.getRange(row, COL.UPDATED).setValue(new Date().toISOString());
  SpreadsheetApp.flush();
  Logger.log('Password cleared for SEN: ' + sen);
  return { success: true, sen: sen };
}

/**
 * handleUpsert
 * ──────────────────────────────────────────────────────────────────────────────
 * Bulk insert-or-update.  Called after the admin uploads a new Excel file and
 * the frontend parses it into a JSON array of student objects.
 *
 * Rules (as per architecture):
 *   · If SEN exists  → overwrite ALL academic columns EXCEPT the Password column.
 *   · If SEN is new  → append a brand-new row (password column left blank).
 *
 * The function is idempotent — running it twice with the same data is safe.
 *
 * @param {Array} students – Array of student objects (see shape below)
 * @returns {{ success: boolean, inserted: number, updated: number, errors: string[] }}
 *
 * Expected student object shape (from frontend's parseExcelToStudents):
 * {
 *   sen             : "A869145024001",
 *   name            : "SAYYED MOHD ANAS",
 *   program         : "B.Tech CSE",
 *   school          : "AIIT",
 *   cgpa            : 8.64,
 *   totalCreditEarned: 71,
 *   courses         : [
 *     { semester, code, title, type, credits, marks, grade, gradePoints, creditEarned }
 *   ]
 * }
 */
function handleUpsert(students) {
  if (!students || !Array.isArray(students) || students.length === 0) {
    return { error: 'No student data provided.' };
  }

  var sheet     = getSheet();
  var senIndex  = buildSenIndex(sheet);    // { SEN → rowNumber }
  var timestamp = new Date().toISOString();

  var insertedCount = 0;
  var updatedCount  = 0;
  var errors        = [];

  students.forEach(function (student, idx) {
    try {
      var sen = normaliseSen(student.sen);
      if (!sen) { errors.push('Row ' + idx + ': missing SEN, skipped.'); return; }

      var name         = sanitiseText(student.name          || '');
      var program      = sanitiseText(student.program       || '');
      var school       = sanitiseText(student.school        || '');
      var cgpa         = toNumber(student.cgpa);
      var credits      = toNumber(student.totalCreditEarned);
      var coursesJson  = JSON.stringify(sanitiseCourses(student.courses || []));
      var source       = 'upload';

      if (senIndex[sen]) {
        // ── UPDATE existing row (skip PASSWORD column) ──────────────────────
        var row = senIndex[sen];
        sheet.getRange(row, COL.NAME         ).setValue(name);
        sheet.getRange(row, COL.PROGRAM      ).setValue(program);
        sheet.getRange(row, COL.SCHOOL       ).setValue(school);
        sheet.getRange(row, COL.CGPA         ).setValue(cgpa);
        sheet.getRange(row, COL.CREDITS      ).setValue(credits);
        // COL.PASSWORD is intentionally skipped
        sheet.getRange(row, COL.COURSES_JSON ).setValue(coursesJson);
        sheet.getRange(row, COL.SOURCE       ).setValue(source);
        sheet.getRange(row, COL.UPDATED      ).setValue(timestamp);
        updatedCount++;

      } else {
        // ── INSERT new row ──────────────────────────────────────────────────
        var lastRow  = sheet.getLastRow() + 1;
        var newRow   = [
          sen,         // A  SEN
          name,        // B  Name
          program,     // C  Program
          school,      // D  School
          cgpa,        // E  CGPA
          credits,     // F  Credits
          '',          // G  Password — intentionally blank for new students
          coursesJson, // H  Courses JSON
          source,      // I  Source
          timestamp    // J  Last Updated
        ];
        sheet.getRange(lastRow, 1, 1, newRow.length).setValues([newRow]);
        senIndex[sen] = lastRow;  // keep index fresh for duplicate SENs in same payload
        insertedCount++;
      }

    } catch (rowErr) {
      errors.push('SEN ' + (student.sen || idx) + ': ' + rowErr.message);
      Logger.log('Upsert error for ' + (student.sen || idx) + ': ' + rowErr.message);
    }
  });

  SpreadsheetApp.flush();
  Logger.log('Upsert complete — inserted: ' + insertedCount + ', updated: ' + updatedCount + ', errors: ' + errors.length);

  return {
    success  : true,
    inserted : insertedCount,
    updated  : updatedCount,
    total    : students.length,
    errors   : errors
  };
}

/**
 * handleLoadStudents
 * ──────────────────────────────────────────────────────────────────────────────
 * Returns ALL student records as an array of student objects (academic data
 * only — passwords are never returned).
 *
 * Called by the frontend's silentStudentSync() function to ensure student data
 * is available on every device (not just the admin's machine).
 */
function handleLoadStudents() {
  var sheet   = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];   // header row only

  var students = [];
  // Read all data in one API call for performance
  var data = sheet.getRange(2, 1, lastRow - 1, COL.UPDATED).getValues();

  data.forEach(function (row) {
    var sen = normaliseSen(String(row[COL.SEN - 1] || ''));
    if (!sen) return;

    var coursesJson = row[COL.COURSES_JSON - 1] || '[]';
    var courses;
    try { courses = JSON.parse(coursesJson); } catch (e) { courses = []; }

    students.push({
      sen              : sen,
      name             : String(row[COL.NAME    - 1] || ''),
      program          : String(row[COL.PROGRAM - 1] || ''),
      school           : String(row[COL.SCHOOL  - 1] || ''),
      cgpa             : toNumber(row[COL.CGPA    - 1]),
      totalCreditEarned: toNumber(row[COL.CREDITS - 1]),
      courses          : courses
      // NOTE: password (col G / COL.PASSWORD) is intentionally excluded
    });
  });

  return students;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HELPER UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * getSheet — opens (or creates) the Google Sheet and returns the Students sheet.
 * The spreadsheet is located by name; if it doesn't exist it is created in the
 * same Google Drive as the script.
 */
function getSheet() {
  var files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  var ss;

  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    // First run: create the spreadsheet with a header row
    ss = SpreadsheetApp.create(SPREADSHEET_NAME);
    Logger.log('Created new spreadsheet: ' + SPREADSHEET_NAME + ' (' + ss.getId() + ')');
  }

  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Write header row
    sheet.getRange(1, 1, 1, 10).setValues([[
      'SEN', 'Name', 'Program', 'School', 'CGPA',
      'Total Credits Earned', 'Password Hash', 'Courses JSON', 'Source', 'Last Updated'
    ]]);
    sheet.setFrozenRows(1);
    // Style header row
    sheet.getRange(1, 1, 1, 10)
      .setFontWeight('bold')
      .setBackground('#0d1626')
      .setFontColor('#94a3b8');
    // Auto-resize columns for readability
    sheet.autoResizeColumns(1, 10);
    Logger.log('Created Students sheet with header row.');
  }

  return sheet;
}

/**
 * buildSenIndex — scans column A and returns { SEN → rowNumber } map.
 * Reading all values in one shot is much faster than per-row API calls.
 */
function buildSenIndex(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};

  var senValues = sheet.getRange(2, COL.SEN, lastRow - 1, 1).getValues();
  var index = {};
  senValues.forEach(function (row, i) {
    var sen = normaliseSen(String(row[0] || ''));
    if (sen) index[sen] = i + 2;  // +2 because data starts at row 2
  });
  return index;
}

/**
 * findRowBySen — returns the 1-based row number for a given SEN, or null.
 */
function findRowBySen(sheet, sen) {
  var index = buildSenIndex(sheet);
  return index[sen] || null;
}

/**
 * rowToStudentObject — reads a single row from the sheet and returns a student
 * object suitable for sending to the frontend (no password included).
 */
function rowToStudentObject(sheet, row) {
  var values      = sheet.getRange(row, 1, 1, COL.UPDATED).getValues()[0];
  var coursesJson = values[COL.COURSES_JSON - 1] || '[]';
  var courses;
  try { courses = JSON.parse(coursesJson); } catch (e) { courses = []; }

  return {
    sen              : String(values[COL.SEN     - 1] || ''),
    name             : String(values[COL.NAME    - 1] || ''),
    program          : String(values[COL.PROGRAM - 1] || ''),
    school           : String(values[COL.SCHOOL  - 1] || ''),
    cgpa             : toNumber(values[COL.CGPA    - 1]),
    totalCreditEarned: toNumber(values[COL.CREDITS - 1]),
    courses          : courses
    // password is intentionally excluded from every outgoing object
  };
}

/**
 * buildResponse — returns a ContentService TextOutput.
 * When a callback name is provided the JSON is wrapped in a JSONP function call
 * so the frontend's <script>-tag injection trick can read it cross-origin.
 */
function buildResponse(data, callback) {
  var json = JSON.stringify(data);
  var output;

  if (callback) {
    output = ContentService.createTextOutput(callback + '(' + json + ')');
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    output = ContentService.createTextOutput(json);
    output.setMimeType(ContentService.MimeType.JSON);
  }

  return output;
}

// ── Input sanitisation helpers ────────────────────────────────────────────────

/** Normalise a SEN: uppercase, strip whitespace and common illegal chars. */
function normaliseSen(raw) {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 20);
}

/** Strip HTML/script-injection characters from free-text fields. */
function sanitiseText(str) {
  return String(str || '').replace(/[<>"'`;\\]/g, '').trim().substring(0, 500);
}

/** Convert a value to a finite number, returning 0 on failure. */
function toNumber(val) {
  var n = parseFloat(val);
  return isFinite(n) ? n : 0;
}

/**
 * sanitiseCourses — validates and cleans the courses array received from the
 * frontend.  Removes any courses that lack a course code.
 */
function sanitiseCourses(courses) {
  if (!Array.isArray(courses)) return [];

  return courses
    .filter(function (c) { return c && c.code && String(c.code).trim() !== '' && String(c.code).trim().toLowerCase() !== 'nan'; })
    .map(function (c) {
      return {
        semester    : sanitiseText(c.semester    || ''),
        code        : sanitiseText(c.code        || ''),
        title       : sanitiseText(c.title       || ''),
        type        : sanitiseText(c.type        || ''),
        credits     : toNumber(c.credits),
        marks       : toNumber(c.marks),
        grade       : sanitiseText(c.grade       || ''),
        gradePoints : toNumber(c.gradePoints),
        creditEarned: toNumber(c.creditEarned)
      };
    })
    .slice(0, 200);   // safety cap — no student should have >200 courses
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ONE-TIME SETUP UTILITY
//  Run this manually from the Apps Script IDE (Run → setupScriptProperties)
//  to store the admin password hash securely as a Script Property.
//
//  How to generate the hash:
//    1. Open the portal in a browser.
//    2. Open DevTools console.
//    3. Run:
//         crypto.subtle.digest('SHA-256', new TextEncoder().encode('Gopal@Amity'))
//           .then(b => console.log(Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')))
//    4. Copy the 64-character hex string.
//    5. Paste it in the function below and run it once.
// ═══════════════════════════════════════════════════════════════════════════════
function setupScriptProperties() {
  // ── REPLACE THE STRING BELOW WITH THE ACTUAL SHA-256 HASH OF 'Gopal@Amity' ──
  var ADMIN_PASSWORD_HASH = 'PASTE_SHA256_HASH_OF_Gopal@Amity_HERE';

  PropertiesService.getScriptProperties().setProperty('ADMIN_HASH', ADMIN_PASSWORD_HASH);
  Logger.log('✅ ADMIN_HASH stored in Script Properties. Remove this function after running.');
}
