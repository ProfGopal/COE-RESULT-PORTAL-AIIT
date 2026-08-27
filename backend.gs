// ═══════════════════════════════════════════════════════════════════════════════
//   AIIT COE RESULT PORTAL — Google Apps Script Backend (V10.2 Cloud Sync)
// ═══════════════════════════════════════════════════════════════════════════════

var SHEET_ID = "1_aJ5SVfkQEIEMMb8NyjU7mZWX9nWkGM2j9-ZZVrU2zQ";
var SHEET_NAME = "Students";
var SETTINGS_SHEET = "Settings";
var CURRICULUM_SHEET = "CurriculumDB";

var AUTHORIZED_FACULTY = [
  "Chandrashekharbn@blr.amity.edu", "gopalr@blr.amity.edu", "krishnachalithakc@blr.amity.edu",
  "mbhan@blr.amity.edu", "mkirmani@blr.amity.edu", "pramamurthy@blr.amity.edu",
  "pchakraborty@blr.amity.edu", "skumar2@blr.amity.edu", "vramamoorthy@blr.amity.edu",
  "geethav@blr.amity.edu", "nkumar@blr.amity.edu", "ntressa@blr.amity.edu",
  "rababladkar@blr.amity.edu", "sspattu@blr.amity.edu"
];

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch(parseErr) { data = {}; }
    }
    
    var action = data.action || (e.parameter ? e.parameter.action : "");

    if (action === 'saveCurriculum') {
      var rawCurriculum = data.curriculumData || (e.parameter ? e.parameter.curriculumData : "");
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var curSheet = ss.getSheetByName(CURRICULUM_SHEET) || ss.insertSheet(CURRICULUM_SHEET);
      curSheet.getRange("A1").setValue(rawCurriculum);
      return jsonResponse({status: "success", message: "Curriculum saved to Cloud Database successfully."});
    }

    if (action === 'verifyadmin' || action === 'adminlogin') {
      if (isAdminValid(data.password)) return jsonResponse({status: "success", message: "Admin verified"});
      return jsonResponse({status: "error", message: "Incorrect Admin Password"});
    }

    if (action === 'verifyfaculty') {
      var email = data.email ? data.email.trim() : "";
      var password = data.password ? data.password.trim() : "";
      var isAuthorized = AUTHORIZED_FACULTY.some(function(facEmail) { return facEmail.toLowerCase() === email.toLowerCase(); });
      if ((email === 'faculty@123' && password === 'faculty@123') || (isAuthorized && email === password)) {
        return jsonResponse({status: "success", message: "Faculty verified"});
      } else {
        return jsonResponse({status: "error", message: "Invalid Faculty Credentials"});
      }
    }

    if (action === 'login') {
      var sen = String(data.sen).trim().toUpperCase();
      var studentRow = getStudentRow(sen);
      if (!studentRow) return jsonResponse({status: "error", message: "SEN not found in records. Please check and try again."});
      
      var storedPass = String(studentRow[6] || "").trim(); // Column G
      var inputPass = String(data.password || "").trim();

      if (!storedPass) {
        return jsonResponse({status: "first_time", message: "First-time user. Please set your password."});
      }
      if (storedPass === inputPass) {
        return jsonResponse({status: "success", student: formatStudentObject(studentRow)});
      }
      return jsonResponse({status: "error", message: "Incorrect password."});
    }

    if (action === 'setpassword') {
      var sen = String(data.sen).trim().toUpperCase();
      var newPassword = String(data.newPassword).trim();
      var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
      var rows = sheet.getDataRange().getValues();
      var updated = false;
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim().toUpperCase() === sen) {
          sheet.getRange(i + 1, 7).setValue(newPassword); // Column G
          updated = true;
          break;
        }
      }
      if(updated) return jsonResponse({status: "success", message: "Password created successfully."});
      return jsonResponse({status: "error", message: "SEN not found."});
    }

    if (['upsert', 'clearall', 'clearpassword', 'clearstudentpassword', 'clearallpasswords'].indexOf(action) !== -1) {
      
      if (action === 'clearall') {
        var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getMaxColumns()).clearContent();
        return jsonResponse({status: "success", message: "All records cleared."});
      }
      
      if (action === 'clearpassword' || action === 'clearstudentpassword') {
        var sen = String(data.sen).trim().toUpperCase();
        var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        var rows = sheet.getDataRange().getValues();
        var found = false;
        for (var i = 1; i < rows.length; i++) {
          if (String(rows[i][0]).trim().toUpperCase() === sen) {
            sheet.getRange(i + 1, 7).clearContent(); // Clears Column G
            found = true;
            break;
          }
        }
        if(found) return jsonResponse({status: "success", message: "Password reset for " + sen});
        return jsonResponse({status: "error", message: "SEN not found."});
      }

      if (action === 'clearallpasswords') {
        var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) sheet.getRange(2, 7, lastRow - 1, 1).clearContent();
        return jsonResponse({status: "success", message: "ALL student passwords have been permanently reset."});
      }
      
      if (action === 'upsert') {
        handleUpsert(data.students);
        return jsonResponse({status: "success", message: "Data synchronized!"});
      }
    }
    return jsonResponse({status: "error", message: "Unknown POST action"});
  } catch (err) { return jsonResponse({status: "error", message: err.toString()}); }
}

function doGet(e) {
  try {
    var action = e.parameter ? e.parameter.action : "";
    var callback = e.parameter ? e.parameter.callback : null;

    if (action === 'getCurriculum') {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var curSheet = ss.getSheetByName(CURRICULUM_SHEET);
      var rawData = curSheet ? curSheet.getRange("A1").getValue() : "{}";
      if (!rawData) rawData = "{}";
      return callback ? ContentService.createTextOutput(callback + '(' + rawData + ');').setMimeType(ContentService.MimeType.JAVASCRIPT) : ContentService.createTextOutput(rawData).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'ping') return jsonpResponse({status: "pong", message: "Backend is online!"}, callback);
    
    if (action === 'load') {
      var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
      if (!sheet) return jsonpResponse([], callback);
      var data = sheet.getDataRange().getValues();
      var students = [];
      for (var i = 1; i < data.length; i++) {
        var sen = String(data[i][0]).trim().toUpperCase();
        if (sen) {
          students.push({
            sen: sen, name: data[i][1], program: data[i][2], school: data[i][3],
            cgpa: data[i][4], totalCredits: data[i][5], courses: JSON.parse(data[i][7] || "[]"),
            batch: data[i][10] || ""
          });
        }
      }
      return jsonpResponse(students, callback);
    }
    return jsonpResponse({status: "error", message: "Unknown GET action"}, callback);
  } catch(err) { return jsonpResponse({status: "error", message: err.toString()}, callback); }
}

function handleUpsert(payloadStudents) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues(); 
  var senMap = {};
  
  for (var k = 0; k < data.length; k++) {
    while (data[k].length < 11) data[k].push("");
  }

  for (var i = 1; i < data.length; i++) {
    var sen = String(data[i][0]).trim().toUpperCase();
    if (sen) senMap[sen] = i;
  }
  
  var timestamp = new Date().toISOString();
  
  for (var j = 0; j < payloadStudents.length; j++) {
    var s = payloadStudents[j];
    var sen = String(s.sen).trim().toUpperCase();
    if (!sen) continue;
    var coursesStr = JSON.stringify(s.courses || []);
    if (senMap.hasOwnProperty(sen)) {
      var r = senMap[sen];
      data[r][1] = s.name || data[r][1]; data[r][2] = s.program || data[r][2];
      data[r][3] = s.school || data[r][3]; data[r][4] = s.cgpa || data[r][4];
      data[r][5] = s.totalCredits || data[r][5]; data[r][7] = coursesStr;
      data[r][8] = "upload"; data[r][9] = timestamp; data[r][10] = s.batch || data[r][10];
    } else {
      data.push([sen, s.name || "", s.program || "", s.school || "", s.cgpa || "N/A", s.totalCredits || "0", "", coursesStr, "upload", timestamp, s.batch || ""]);
      senMap[sen] = data.length - 1; 
    }
  }
  sheet.getRange(1, 1, data.length, 11).setValues(data);
}

function getStudentRow(sen) {
  var rows = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME).getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) { 
    if (String(rows[i][0]).trim().toUpperCase() === sen) return rows[i]; 
  }
  return null;
}
function formatStudentObject(row) { return { sen: row[0], name: row[1], program: row[2], school: row[3], cgpa: row[4], totalCredits: row[5], courses: JSON.parse(row[7] || "[]"), batch: row[10] || "" }; }
function isAdminValid(inputPassword) {
  var settingsSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SETTINGS_SHEET);
  if (!settingsSheet) return false;
  return String(inputPassword).trim() === String(settingsSheet.getRange("A1").getValue()).trim();
}
function jsonResponse(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function jsonpResponse(obj, callback) {
  var jsonString = JSON.stringify(obj);
  return callback ? ContentService.createTextOutput(callback + '(' + jsonString + ');').setMimeType(ContentService.MimeType.JAVASCRIPT) : ContentService.createTextOutput(jsonString).setMimeType(ContentService.MimeType.JSON);
}
function doOptions(e) { return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT).setHeaders({"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"}); }