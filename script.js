/**
 * script.js — AIIT COE Result Portal
 * Shared frontend logic for index.html and admin-hidden.html
 *
 * Architecture:
 *  · Zero hardcoded student data in this file.
 *  · All reads  → GAS backend via JSONP (?callback=...)
 *  · All writes → GAS backend via no-cors POST (text/plain body)
 *  · Passwords  → SHA-256 hashed in-browser; hash stored on GAS backend.
 *  · Local cache → localStorage (same-device fallback, never trusted alone).
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

// IMPORTANT: Paste your active Google Apps Script Web App URL below.
// Go to: Apps Script → Deploy → Manage Deployments → copy the Web App URL.
// Leave no spaces inside the quotes. Re-deploy after every code change in GAS.
const GAS_URL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";
var LOCAL_STU_KEY = 'coe_students_v2';
var ADMIN_SESSION = 'coe_admin_auth';

var SEM_MAP = {
  '1': 'Semester I', '2': 'Semester II', '3': 'Semester III', '4': 'Semester IV',
  '5': 'Semester V', '6': 'Semester VI', '7': 'Semester VII', '8': 'Semester VIII',
  'I': 'Semester I', 'II': 'Semester II', 'III': 'Semester III', 'IV': 'Semester IV',
  'V': 'Semester V', 'VI': 'Semester VI', 'VII': 'Semester VII', 'VIII': 'Semester VIII'
};

// ── Curriculum Evaluation Engine — Hierarchical Degree Audit Rules (V18.0) ─────
/**
 * COURSE_DICT: Robust course info lookup by code, including credits.
 * Used to display names and credits in the Degree Audit UI.
 */
const COURSE_DICT = {
  "MGT5101": { name: "Digital Entrepreneurship", credits: 2 },
  "ENG5001": { name: "Basic English / Communication", credits: 1 },
  "CSE6007": { name: "MCA Project - 1", credits: 2 },
  "CSE6008": { name: "MCA Project - 2", credits: 2 },
  "CSE6009": { name: "MCA Project - 3", credits: 2 },
  "CSE5029": { name: "Advance Machine Learning", credits: 3 },
  "CSE5032": { name: "Digital Image Processing", credits: 3 },
  "CSE5129": { name: "Computer Science Fundamentals", credits: 0 },
  "MAT5005": { name: "Applied Statistical Methods", credits: 3 },
  "ENG5004": { name: "Technical Proficiency and Career Building", credits: 1 },
  "CSE6004": { name: "Research Paper", credits: 2 },
  "CSE6005": { name: "MCA Capstone Project", credits: 4 },
  "CSE6006": { name: "Corporateship", credits: 3 },
  "FRE1001": { name: "Basic French", credits: 1 },
  "GER1001": { name: "Basic German", credits: 1 },
  "SPA1001": { name: "Basic Spanish", credits: 2 },
  "SSK2002": { name: "Being Corporate ready", credits: 1 },
  "SSK3002": { name: "Programming Skills for Employment", credits: 1 },
  "CSE3050": { name: "Programming Skills for Employment", credits: 1 }, // ALIAS ADDED
  "CSE5028": { name: "Network System Administration and Security", credits: 3 },
  "CSE5039": { name: "Ethical Hacking Techniques", credits: 3 },
  "CSE5040": { name: "Intrusion Detection System", credits: 3 },
  "CSE5041": { name: "Penetration Testing & Forensics", credits: 3 },
  "CSE5042": { name: "Blockchain Technology and Applications", credits: 3 },
  "CSE5043": { name: "Malware Analysis", credits: 3 },
  "CSE5044": { name: "Vulnerability Analysis", credits: 3 },
  "CSE5045": { name: "Data Analytics using Python", credits: 3 },
  "CSE5046": { name: "Data Handling and Visualization", credits: 3 },
  "CSE5047": { name: "Analytics for Social Media", credits: 3 },
  "CSE5048": { name: "Data Analytics Using R", credits: 3 },
  "MGT5007": { name: "Business Analytics", credits: 3 },
  "MAT5006": { name: "Time Series Analysis", credits: 3 },
  "CSE5052": { name: "Data Center Operations and Management", credits: 3 },
  "CSE5053": { name: "Cloud Infrastructure, Services and APIs", credits: 3 },
  "CSE5034": { name: "DevOps Orchestration", credits: 3 },
  "CSE5006": { name: "Relational Database", credits: 3 },
  "CSE5007": { name: "Software Development Framework", credits: 3 },
  "CSE5008": { name: "Data Communications and Networks", credits: 3 },
  "CSE5019": { name: "Deep Learning Techniques", credits: 3 },
  "CSE5024": { name: "Advanced Software Testing", credits: 3 },
  "CSE5067": { name: "Advanced Data Structures and Algorithms", credits: 3 },
  "CSE5002": { name: "Algorithm Design for Computer Applications", credits: 3 },
  "CSE5005": { name: "Advanced Computer Architecture", credits: 3 },
  "CSE5004": { name: "Distributed Operating Systems", credits: 3 },
  "CSE5012": { name: "Problem Solving Using C and C++", credits: 2 },
  "CSE5011": { name: "Advanced Java Programming", credits: 2 },
  "CSE5013": { name: "C# and .NET Framework", credits: 2 },
  "CSE5017": { name: "Full Stack Development", credits: 2 },
  "CSE5009": { name: "Web Design and Development", credits: 3 },
  "CSE5010": { name: "Advanced Python", credits: 2 }
};

// Custom Dictionary Engine (V20.0) — persists admin edits to course names/credits
window.CUSTOM_COURSE_DICT = JSON.parse(localStorage.getItem('AIIT_CUSTOM_COURSES')) || {};

window.getCourseInfo = function(code) {
    // 1. Check Custom Dictionary First
    if (window.CUSTOM_COURSE_DICT && window.CUSTOM_COURSE_DICT[code]) {
        let cr = window.CUSTOM_COURSE_DICT[code].credits;
        return {
            name: window.CUSTOM_COURSE_DICT[code].name,
            credits: (cr !== undefined && cr !== null && !isNaN(cr)) ? parseFloat(cr) : 3
        };
    }
    // 2. Check Hardcoded Default Dictionary
    if (typeof COURSE_DICT !== 'undefined' && COURSE_DICT[code]) {
        let cr = COURSE_DICT[code].credits;
        return {
            name: COURSE_DICT[code].name,
            credits: (cr !== undefined && cr !== null && !isNaN(cr)) ? parseFloat(cr) : 3
        };
    }
    // 3. Absolute Fallback
    return { name: "Course Title", credits: 3 };
};

const BASE_CURRICULUM = {
  "2024_MCA": [
    { category: "1. School Core (Includes Languages & Soft Skills)", minCredits: 17, codes: ["CSE5129", "MAT5005", "ENG5004", "CSE6004", "CSE6005", "CSE6006", "FRE1001", "GER1001", "SPA1001", "SSK2002", "SSK3002", "ENG5001", "CSE3050"] },
    { category: "2. Program Core", minCredits: 29, codes: ["CSE5067", "CSE5002", "CSE5005", "CSE5004", "CSE5012", "CSE5011", "CSE5013", "CSE5017", "CSE5009", "CSE5010", "CSE5008", "CSE5006", "CSE5007", "MGT5101", "CSE6007", "CSE6008", "CSE6009"] },
    { category: "3. Discipline Electives", minCredits: 28, codes: ["CSE5029", "CSE5032", "CSE5033", "CSE5028", "CSE5039", "CSE5040", "CSE5041", "CSE5042", "CSE5043", "CSE5044", "CSE5045", "CSE5046", "CSE5047", "CSE5048", "MGT5007", "MAT5006", "CSE5052", "CSE5053", "CSE5034", "CSE5019", "CSE5024"] },
    { category: "4. Open Elective", minCredits: 6, codes: ["OPEN_ELECTIVE_CATCHALL"] } 
  ]
};

let CURRICULUM_RULES;
try {
  const saved = localStorage.getItem('AIIT_CUSTOM_CURRICULUM');
  CURRICULUM_RULES = saved ? JSON.parse(saved) : BASE_CURRICULUM;
  if (typeof CURRICULUM_RULES !== 'object' || CURRICULUM_RULES === null) throw new Error("Corrupted format");
} catch (e) {
  console.warn("Curriculum load failed, reverting to base.", e);
  CURRICULUM_RULES = BASE_CURRICULUM;
}

// ── Dynamic Program & Batch Manager (V1.0) ───────────────────────────────────
let SYSTEM_PROGRAMS = JSON.parse(localStorage.getItem('AIIT_SYSTEM_PROGRAMS')) || [
  { batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }, { batch: "2024", program: "B.C.A" }
];

window.addSystemProgram = function() {
  const b = document.getElementById('new-batch-input').value.trim();
  const p = document.getElementById('new-program-input').value.trim();
  if (!b || !p) return alert("Please enter both Batch and Program.");
  const exists = SYSTEM_PROGRAMS.some(x => x.batch === b && x.program === p);
  if (!exists) {
    SYSTEM_PROGRAMS.push({ batch: b, program: p });
    localStorage.setItem('AIIT_SYSTEM_PROGRAMS', JSON.stringify(SYSTEM_PROGRAMS));
    renderSystemPrograms();
    alert(`✅ Added ${b} ${p} to the system!`);
  }
};

window.removeSystemProgram = function(index) {
  if (confirm("Remove this program? It will no longer appear in dropdowns.")) {
    SYSTEM_PROGRAMS.splice(index, 1);
    localStorage.setItem('AIIT_SYSTEM_PROGRAMS', JSON.stringify(SYSTEM_PROGRAMS));
    renderSystemPrograms();
  }
};

window.renderSystemPrograms = function() {
  // 1. Render tags in the manager
  const container = document.getElementById('active-system-programs');
  if (container) {
    container.innerHTML = SYSTEM_PROGRAMS.map((p, i) => `<span style="background: #334155; padding: 5px 10px; border-radius: 4px; color: white;">${p.batch} ${p.program} <button onclick="removeSystemProgram(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer;">✖</button></span>`).join('');
  }
  // 2. Update Curriculum Manager Dropdown dynamically
  const currDropdown = document.getElementById('curriculum-edit-key');
  if (currDropdown) {
    currDropdown.innerHTML = SYSTEM_PROGRAMS.map(p => `<option value="${p.batch}_${p.program}">${p.batch} ${p.program}</option>`).join('');
  }
  // 3. Update File Upload Dropdowns (if they exist)
  document.querySelectorAll('.file-year-select').forEach(sel => {
    const uniqueBatches = [...new Set(SYSTEM_PROGRAMS.map(p => p.batch))];
    sel.innerHTML = `<option value="">-- Year --</option>` + uniqueBatches.map(b => `<option value="${b}">${b}</option>`).join('');
  });
  document.querySelectorAll('.file-program-select').forEach(sel => {
    const uniqueProgs = [...new Set(SYSTEM_PROGRAMS.map(p => p.program))];
    sel.innerHTML = `<option value="">-- Program --</option>` + uniqueProgs.map(p => `<option value="${p}">${p}</option>`).join('');
  });
};

// Auto-initialize on load
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById('active-system-programs')) renderSystemPrograms();
});

window.switchAdminTab = function(tabId, btnElement) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => tab.classList.remove('active'));
    // Remove active class from all buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show target tab and highlight button
    document.getElementById(tabId).classList.add('active');
    btnElement.classList.add('active');
};

window.clearEntireCurriculum = function() {
    const key = document.getElementById('curriculum-edit-key').value;
    if (confirm(`⚠️ WARNING: Are you absolutely sure you want to permanently delete the ENTIRE ${key} curriculum?`)) {
        CURRICULUM_RULES[key] = []; // Empty the array
        localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(CURRICULUM_RULES));
        loadCurriculumEditor();
        alert(`✅ Curriculum for ${key} has been completely cleared.`);
    }
};

// ── Bulk Curriculum Excel Uploader (V1.0) ──────────────────────────────────
window.handleBulkCurriculumUpload = function(event) {
  try {
    const file = event.target.files[0];
    if (!file) return; // User cancelled file selection

    const keyDropdown = document.getElementById('curriculum-edit-key');
    if(!keyDropdown || !keyDropdown.value) {
        alert("❌ ERROR: Please select a Batch & Program from the dropdown first so the system knows where to save this curriculum!");
        event.target.value = ''; 
        return;
    }
    window.currentEditingKey = keyDropdown.value;

    // Diagnostic Check: Is the SheetJS library actually loaded?
    if (typeof XLSX === 'undefined') {
        alert("❌ SYSTEM ERROR: The Excel reading library (SheetJS) is missing. Please check your internet connection or ensure the script tag is in your HTML <head>.");
        event.target.value = ''; 
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        
        if (rows.length === 0) {
            alert("❌ ERROR: The uploaded file appears to be empty or formatting is unreadable.");
            return;
        }

        let newRules = [];
        let mainMap = {};

        rows.forEach(row => {
          const mainCat = row['Main Category'];
          const mainCreds = parseFloat(row['Main Credits']) || 0;
          const subCat = row['Sub Category'] || "General Courses"; 
          const subCreds = parseFloat(row['Sub Credits']) || 0;
          const code = String(row['Course Code'] || "").trim().toUpperCase();
          const name = row['Course Name'] || "Uploaded Course";
          const rawCourseCred = parseFloat(row['Course Credits']);
          const courseCreds = isNaN(rawCourseCred) ? 3 : rawCourseCred;

          if (!mainCat) return;

          if (!mainMap[mainCat]) {
            mainMap[mainCat] = { category: mainCat, minCredits: mainCreds, subCategories: {} };
            newRules.push(mainMap[mainCat]);
          }
          if (!mainMap[mainCat].subCategories[subCat]) {
            mainMap[mainCat].subCategories[subCat] = { name: subCat, minCredits: subCreds, codes: [] };
          }
          if (code && code !== "UNDEFINED") {
            mainMap[mainCat].subCategories[subCat].codes.push(code);
            window.CUSTOM_COURSE_DICT[code] = { name: name, credits: courseCreds };
          }
        });
        
        newRules.forEach(rule => { rule.subCategories = Object.values(rule.subCategories); });

        CURRICULUM_RULES[window.currentEditingKey] = newRules;
        localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(CURRICULUM_RULES));
        localStorage.setItem('AIIT_CUSTOM_COURSES', JSON.stringify(CUSTOM_COURSE_DICT));
        
        alert(`✅ SUCCESS! Imported ${newRules.length} Main Categories for ${window.currentEditingKey}.`);
        loadCurriculumEditor(); // Force GUI refresh
        
      } catch (parseError) {
         console.error("Parse Error:", parseError);
         alert("❌ DATA ERROR: Failed to read the Excel data. " + parseError.message);
      } finally {
         event.target.value = ''; // Reset input to allow re-uploading the exact same file if needed
      }
    };
    
    reader.onerror = function() { alert("❌ NETWORK ERROR: Browser failed to read the file."); };
    reader.readAsArrayBuffer(file);
    
  } catch (err) {
    console.error("Critical Upload Error:", err);
    alert("❌ CRITICAL ERROR: " + err.message);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════════════════════
var currentStudent = null;
var isNewUser = false;
var loginAttempts = {};
var MAX_ATTEMPTS = 5;
var LOCKOUT_MS = 15 * 60 * 1000;
var lightThemeTimer = null;

// ═══════════════════════════════════════════════════════════════════════════════
//  GAS URL CONSTANT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * gasJsonp — cross-origin GET via <script> tag injection.
 * GAS must wrap its JSON response in the callback: callback({...})
 */
function gasJsonp(url, timeoutMs) {
  return new Promise(function (resolve, reject) {
    var cbName = '_gasCb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    var timer = setTimeout(function () {
      cleanup();
      reject(new Error('GAS timeout'));
    }, timeoutMs || 12000);

    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      var old = document.getElementById(cbName);
      if (old) old.remove();
    }

    window[cbName] = function (data) { cleanup(); resolve(data); };

    var script = document.createElement('script');
    script.id = cbName;
    script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cbName;
    script.onerror = function () { cleanup(); reject(new Error('Script load error')); };
    document.head.appendChild(script);
  });
}

/**
 * gasPost — fire-and-forget POST to GAS using no-cors.
 * We cannot read the response body, but GAS processes it.
 * For actions that need a response (setpassword), use gasJsonp with a GET form.
 * NOTE: For security-sensitive POSTs we encode action+data in the body.
 */
function gasPost(payload) {
  return fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SHA-256 PASSWORD HASHING  (Web Crypto API)
// ═══════════════════════════════════════════════════════════════════════════════
async function hashPwd(str) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(function (b) {
    return b.toString(16).padStart(2, '0');
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════════════════
//  INPUT SANITISATION
// ═══════════════════════════════════════════════════════════════════════════════
function sanitize(str) {
  return String(str).replace(/[<>"'`;\\&\/]/g, '').trim().substring(0, 200);
}
function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ═══════════════════════════════════════════════════════════════════════════════
//  RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════════
function checkRateLimit(key) {
  var now = Date.now();
  if (!loginAttempts[key]) loginAttempts[key] = { count: 0, since: now };
  var rec = loginAttempts[key];
  if (now - rec.since > LOCKOUT_MS) { rec.count = 0; rec.since = now; }
  if (rec.count >= MAX_ATTEMPTS) {
    var wait = Math.ceil((LOCKOUT_MS - (now - rec.since)) / 60000);
    return 'Too many failed attempts. Try again in ' + wait + ' minute(s).';
  }
  return null;
}
function recordFailedAttempt(key) {
  if (!loginAttempts[key]) loginAttempts[key] = { count: 0, since: Date.now() };
  loginAttempts[key].count++;
}
function clearAttempts(key) { delete loginAttempts[key]; }

// ═══════════════════════════════════════════════════════════════════════════════
//  ALERT / UI HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function showErr(id, msg, inputIds) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'alert err';
  el.style.display = 'block';
  var okId = id.replace('err', 'ok');
  var okEl = document.getElementById(okId);
  if (okEl) okEl.style.display = 'none';

  // Light theme flash on error
  document.body.classList.add('light-theme');
  if (lightThemeTimer) clearTimeout(lightThemeTimer);
  lightThemeTimer = setTimeout(function () {
    document.body.classList.remove('light-theme');
  }, 4000);

  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  setTimeout(function () { el.classList.remove('shake'); }, 500);

  if (inputIds) {
    inputIds.forEach(function (iid) {
      var inp = document.getElementById(iid);
      if (!inp) return;
      inp.classList.add('input-error');
      setTimeout(function () { inp.classList.remove('input-error'); }, 2500);
    });
  }
}

function showOk(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'alert ok';
  el.style.display = 'block';
  var errEl = document.getElementById(id.replace('ok', 'err'));
  if (errEl) errEl.style.display = 'none';
}

function showInfo(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = msg;
  el.className = 'alert info';
  el.style.display = 'block';
}

function hideAlerts(prefix) {
  ['err', 'ok', 'info'].forEach(function (s) {
    var el = document.getElementById(prefix + '-' + s);
    if (el) el.style.display = 'none';
  });
}

function syncBar(msg, visible) {
  var el = document.getElementById('sync-bar');
  if (!el) return;
  if (!visible) { el.style.display = 'none'; return; }
  el.textContent = msg;
  el.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE ROUTING  (index.html)
// ═══════════════════════════════════════════════════════════════════════════════
function showPage(id) {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  var target = document.getElementById(id);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
}

function showStudentLogin() {
  resetStudentLoginUI();
  showPage('student-login');
  setTimeout(function () {
    var el = document.getElementById('s-sen');
    if (el) el.focus();
  }, 150);
}

function goAdmin() {
  window.location.href = 'admin-hidden.html';
}

function logout() {
  currentStudent = null;
  isNewUser = false;

  // Hide student dashboard page and remove display if overridden
  var dash = document.getElementById('student-dash');
  if (dash) {
    dash.classList.remove('active');
    dash.style.display = 'none';
  }

  // Show landing page
  var landing = document.getElementById('landing');
  if (landing) {
    landing.classList.add('active');
    landing.style.display = 'block';
  }

  // Ensure student login is shown (not faculty login container)
  showStudentLoginUI();

  // Clear the SEN/Password input fields and hide alerts
  resetStudentLoginUI();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDENT LOGIN FLOW
// ═══════════════════════════════════════════════════════════════════════════════
function resetStudentLoginUI() {
  var fields = ['s-sen', 's-pass', 's-newpass', 's-confirmpass'];
  fields.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  hideAlerts('student');
  var pf = document.getElementById('s-pass-field');
  if (pf) pf.style.display = 'block';
  var nf = document.getElementById('s-newpass-fields');
  if (nf) nf.style.display = 'none';
  var btn = document.getElementById('s-login-btn');
  if (btn) { btn.textContent = 'Sign In →'; btn.disabled = false; }
  isNewUser = false;
}

// Called on every SEN keystroke — clears stale alerts and resets
// the password-creation sub-form ONLY.  Must NOT clear the SEN field itself.
function onSenInput() {
  hideAlerts('student');
  // Reset password fields and button state (but leave s-sen value intact)
  var pf = document.getElementById('s-pass-field');
  if (pf) pf.style.display = 'block';
  var nf = document.getElementById('s-newpass-fields');
  if (nf) nf.style.display = 'none';
  var otf = document.getElementById('s-otp-fields');
  if (otf) otf.style.display = 'none';
  var otb = document.getElementById('s-otp-buttons');
  if (otb) otb.style.display = 'none';
  var sLoginTitle = document.getElementById('s-login-title');
  if (sLoginTitle) sLoginTitle.textContent = 'Student Login';
  var sLoginBtn = document.getElementById('s-login-btn');
  if (sLoginBtn) sLoginBtn.style.display = 'block';

  ['s-pass', 's-newpass', 's-confirmpass', 's-otp', 's-otp-newpass', 's-otp-confirmpass'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var btn = document.getElementById('s-login-btn');
  if (btn) { btn.textContent = 'Sign In →'; btn.disabled = false; }
  isNewUser = false;
}

/**
 * requestOtpReset — initiates the OTP recovery flow by calling backend.gs's forgotpassword action.
 */
async function requestOtpReset() {
  var rawSen = document.getElementById('s-sen').value;
  var sen = sanitize(rawSen).toUpperCase();
  hideAlerts('student');

  if (!sen) {
    showErr('student-err', 'Please enter your SEN number first.', ['s-sen']);
    return;
  }

  var btn = document.getElementById('s-login-btn');
  if (btn) btn.disabled = true;

  showOk('student-ok', '⏳ Sending OTP to your institutional email...');

  var gasUrl = GAS_URL;

  try {
    var response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'forgotpassword', sen: sen })
    });
    var result = await response.json();

    if (result && result.status === 'success') {
      showOk('student-ok', '✓ ' + result.message);
      // Toggle UI to OTP entry
      document.getElementById('s-login-title').textContent = 'Reset Password';
      document.getElementById('s-pass-field').style.display = 'none';
      document.getElementById('s-newpass-fields').style.display = 'none';
      document.getElementById('s-otp-fields').style.display = 'block';
      document.getElementById('s-login-btn').style.display = 'none';
      document.getElementById('s-otp-buttons').style.display = 'flex';
      setTimeout(function () {
        var otpEl = document.getElementById('s-otp');
        if (otpEl) otpEl.focus();
      }, 150);
    } else {
      showErr('student-err', '⚠ ' + ((result && result.error) || 'Failed to request password reset. Contact admin.'), ['s-sen']);
    }
  } catch (err) {
    showErr('student-err', '✗ Connection error: ' + err.message, ['s-sen']);
  } finally {
    if (btn) btn.disabled = false;
  }
}

/**
 * otpResetStep — verifies the OTP and sets the new password.
 */
async function otpResetStep() {
  var rawSen = document.getElementById('s-sen').value;
  var sen = sanitize(rawSen).toUpperCase();
  var otp = sanitize(document.getElementById('s-otp').value).trim();
  var newpass = sanitize(document.getElementById('s-otp-newpass').value);
  var confpass = sanitize(document.getElementById('s-otp-confirmpass').value);
  hideAlerts('student');

  if (!otp || otp.length !== 6) {
    showErr('student-err', 'Please enter a valid 6-digit OTP.', ['s-otp']);
    return;
  }
  if (!newpass || newpass.length < 6) {
    showErr('student-err', 'Password must be at least 6 characters.', ['s-otp-newpass', 's-otp-confirmpass']);
    return;
  }
  if (newpass !== confpass) {
    showErr('student-err', 'Passwords do not match.', ['s-otp-newpass', 's-otp-confirmpass']);
    return;
  }

  var submitBtn = document.getElementById('s-otp-submit-btn');
  if (submitBtn) submitBtn.disabled = true;
  showOk('student-ok', '⏳ Resetting password...');

  var hash = await hashPwd(newpass);
  var gasUrl = GAS_URL;

  try {
    var response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'resetpassword', sen: sen, otp: otp, hash: hash })
    });
    var result = await response.json();

    if (result && result.status === 'success') {
      showOk('student-ok', '✓ ' + result.message);
      setTimeout(function () {
        cancelOtpResetUI();
        hideAlerts('student');
        showOk('student-ok', '✓ Password reset successful. Please sign in.');
      }, 1500);
    } else {
      showErr('student-err', '⚠ ' + ((result && result.error) || 'Invalid OTP or reset failed. Try again.'), ['s-otp']);
    }
  } catch (err) {
    showErr('student-err', '✗ Connection error: ' + err.message, ['s-otp']);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

/**
 * cancelOtpResetUI — reverts the student login form to its standard state.
 */
function cancelOtpResetUI() {
  document.getElementById('s-login-title').textContent = 'Student Login';
  document.getElementById('s-pass-field').style.display = 'block';
  document.getElementById('s-newpass-fields').style.display = 'none';
  document.getElementById('s-otp-fields').style.display = 'none';
  document.getElementById('s-login-btn').style.display = 'block';
  document.getElementById('s-otp-buttons').style.display = 'none';

  // Clear OTP input values
  ['s-otp', 's-otp-newpass', 's-otp-confirmpass'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  hideAlerts('student');
}

/**
 * studentLoginStep — the unified login handler (V6.3).
 *
 * Flow:
 *  1. POST { action: 'login', sen, password } directly to GAS backend.
 *     Backend is the single source of truth — no local SEN lookup is done first.
 *  2. On success  → render student dashboard with the returned student object.
 *  3. On 'FIRST_TIME' or no-password signal → show password creation fields.
 *  4. On first-time password creation → POST { action: 'setpassword', sen, newPassword }
 *     directly to GAS, then auto-login with the new password.
 */
async function studentLoginStep() {
  var rawSen = document.getElementById('s-sen').value;
  var sen = sanitize(rawSen).toUpperCase();
  hideAlerts('student');

  if (!sen) { showErr('student-err', 'Please enter your SEN number.', ['s-sen']); return; }

  var limitMsg = checkRateLimit('stu_' + sen);
  if (limitMsg) { showErr('student-err', limitMsg, ['s-sen', 's-pass']); return; }

  var btn = document.getElementById('s-login-btn');
  if (btn) btn.disabled = true;

  try {
    // ── New User: Password Creation Flow ─────────────────────────────────────
    if (isNewUser) {
      var newpass = sanitize((document.getElementById('s-newpass') || {}).value || '');
      var confpass = sanitize((document.getElementById('s-confirmpass') || {}).value || '');

      if (!newpass) {
        showErr('student-err', 'Please enter a new password.', ['s-newpass']);
        return;
      }
      if (newpass.length < 6) {
        showErr('student-err', 'Password must be at least 6 characters.', ['s-newpass', 's-confirmpass']);
        return;
      }
      if (newpass !== confpass) {
        showErr('student-err', 'Passwords do not match. Please re-enter.', ['s-newpass', 's-confirmpass']);
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

      // POST setpassword directly to backend — no local array dependency
      try {
        var spResp = await fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'setpassword', sen: sen, newPassword: newpass })
        });
        var spResult = await spResp.json();
        if (spResult && spResult.status === 'error') {
          showErr('student-err', '⚠ ' + (spResult.message || 'Could not save password. Try again.'));
          return;
        }
      } catch (spErr) {
        // GAS may return opaque on some deploys; proceed to auto-login attempt
        console.warn('setpassword response unreadable (may still have succeeded):', spErr.message);
      }

      clearAttempts('stu_' + sen);

      // Auto-login with the new password
      try {
        var alResp = await fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'login', sen: sen, password: newpass })
        });
        var alResult = await alResp.json();

        if (alResult && alResult.status === 'success' && alResult.student) {
          currentStudent = alResult.student;
          renderStudentDash(currentStudent);
          showPage('student-dash');
          var loginSec = document.getElementById('loginSection');
          if (loginSec) loginSec.style.display = 'none';
          var dashEl = document.getElementById('student-dash');
          if (dashEl) dashEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Password saved but auto-login failed — ask user to re-sign-in
          showOk('student-ok', '✓ Password created! Please sign in with your new password.');
          resetStudentLoginUI();
          var senEl = document.getElementById('s-sen');
          if (senEl) senEl.value = sen;
        }
      } catch (alErr) {
        showOk('student-ok', '✓ Password created! Please sign in with your new password.');
        resetStudentLoginUI();
        var senEl2 = document.getElementById('s-sen');
        if (senEl2) senEl2.value = sen;
      }
      return;
    }

    // ── Returning / First-Click: POST login directly to backend ───────────────
    var passInput = (document.getElementById('s-pass') || {}).value || '';

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Signing in…'; }

    var response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'login',
        sen: (document.getElementById('s-sen').value || '').trim().toUpperCase(),
        password: passInput.trim()
      })
    });
    var result = await response.json();

    if (result && result.status === 'success' && result.student) {
      // ── Successful login ───────────────────────────────────────────────────
      clearAttempts('stu_' + sen);
      currentStudent = result.student;
      renderStudentDash(currentStudent);
      showPage('student-dash');
      var loginSec = document.getElementById('loginSection');
      if (loginSec) loginSec.style.display = 'none';
      var dashEl = document.getElementById('student-dash');
      if (dashEl) dashEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } else if (
      result && result.status === 'error' &&
      (result.code === 'FIRST_TIME' || (result.message && result.message.toLowerCase().includes('first')))
    ) {
      // ── First-time user: reveal password creation fields ───────────────────
      isNewUser = true;
      var pf = document.getElementById('s-pass-field');
      var nf = document.getElementById('s-newpass-fields');
      if (pf) pf.style.display = 'none';
      if (nf) nf.style.display = 'block';
      if (btn) btn.textContent = 'Create Password & Login →';
      showOk('student-ok', result.message || 'First-time login detected. Please create your password below.');
      setTimeout(function () {
        var np = document.getElementById('s-newpass');
        if (np) { np.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(function () { np.focus(); }, 150); }
      }, 100);

    } else if (result && result.status === 'error') {
      // ── Backend returned a specific error ─────────────────────────────────────
      // If the message tells the student to type 'pwd', show it as a clean info
      // notice so they can read the exact instruction without the ⚠ noise.
      var errMsg = result.message || 'Login failed. Please try again.';
      var isPwdHint = errMsg.toLowerCase().includes('pwd') || errMsg.toLowerCase().includes('first-time') || errMsg.toLowerCase().includes('first time');
      if (isPwdHint) {
        showOk('student-ok', '📋 ' + errMsg);
      } else {
        recordFailedAttempt('stu_' + sen);
        showErr('student-err', '⚠ ' + errMsg, ['s-pass']);
        var passEl = document.getElementById('s-pass');
        if (passEl) passEl.value = '';
      }

    } else {
      // ── Unexpected / malformed response ───────────────────────────────────
      recordFailedAttempt('stu_' + sen);
      showErr('student-err', '⚠ Unexpected response from server. Please try again.');
    }

  } catch (err) {
    console.error('Login error:', err);
    showErr('student-err', '✗ Could not reach the portal server. Check your connection and try again.');
  } finally {
    var b = document.getElementById('s-login-btn');
    if (b) {
      b.disabled = false;
      b.textContent = isNewUser ? 'Create Password & Login →' : 'Sign In →';
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDENT DASHBOARD RENDER
// ═══════════════════════════════════════════════════════════════════════════════
function renderStudentDash(student) {
  document.getElementById('dash-sen-label').textContent = student.sen;
  document.getElementById('dash-name').textContent = student.name;
  document.getElementById('dash-program').textContent = student.program || '';
  document.getElementById('dash-school').textContent = student.school ? ' · ' + student.school : '';
  document.getElementById('dash-avatar').textContent = (student.name || 'S').charAt(0);

  var cgpaVal = parseFloat(student.cgpa);
  var cgpa = (!isNaN(cgpaVal) && cgpaVal !== 0 && student.cgpa !== null && student.cgpa !== undefined) ? cgpaVal.toFixed(2) : "N/A";

  var creditsVal = parseFloat(student.totalCredits || student.totalCreditEarned);
  var credits = (!isNaN(creditsVal) && creditsVal !== 0 && (student.totalCredits || student.totalCreditEarned) !== null && (student.totalCredits || student.totalCreditEarned) !== undefined) ? String(creditsVal) : "N/A";

  document.getElementById('dash-cgpa').textContent = cgpa;
  document.getElementById('dash-ce').textContent = credits;

  var validCourses = (student.courses || []).filter(function (c) {
    return c && c.code && c.code !== 'nan' && c.code.trim() !== '';
  });
  document.getElementById('dash-nc').textContent = validCourses.length;

  // ── Smart Backlog Engine ──────────────────────────────────────────────────────
  // Groups courses by code to detect Active vs. Cleared backlogs
  var FAIL_GRADES = ['F', 'FAIL', 'AB'];
  var courseGroups = {};
  validCourses.forEach(function (c) {
    var key = String(c.code || '').trim().toUpperCase();
    if (!courseGroups[key]) courseGroups[key] = [];
    courseGroups[key].push(c);
  });

  var activeBacklogs = [];  // Failed, never passed
  var clearedBacklogs = [];  // Had fails but later passed

  Object.keys(courseGroups).forEach(function (code) {
    var attempts = courseGroups[code];
    var hasFail = attempts.some(function (c) { return FAIL_GRADES.includes(String(c.grade || '').toUpperCase().trim()); });
    var hasPass = attempts.some(function (c) { return !FAIL_GRADES.includes(String(c.grade || '').toUpperCase().trim()); });

    if (hasFail && !hasPass) {
      // Active Backlog — pick the latest failed attempt
      var latest = attempts.filter(function (c) { return FAIL_GRADES.includes(String(c.grade || '').toUpperCase().trim()); });
      activeBacklogs.push(latest[latest.length - 1]);
    } else if (hasFail && hasPass) {
      // Cleared Backlog — push the passed attempt(s)
      attempts.filter(function (c) { return !FAIL_GRADES.includes(String(c.grade || '').toUpperCase().trim()); })
        .forEach(function (c) { clearedBacklogs.push(c); });
    }
    // Standard (only passes) — no special handling needed
  });

  // Expose active backlogs globally for the Traffic-Light Degree Audit UI
  window.activeBacklogsGlobal = activeBacklogs;

  // ── Step A: Extract Unique Semesters (aggressive Unknown/null/undefined filter) ───
  const uniqueSems = [...new Set(student.courses.map(c => String(c.sem).trim()))]
    .filter(s => s && s !== '' && s.toLowerCase() !== 'unknown' && s.toLowerCase() !== 'undefined' && s.toLowerCase() !== 'null');

  // ── Step B: Render Tabs ───────────────────────────────────────────────────────
  var tabsEl = document.getElementById('sem-tabs');
  tabsEl.innerHTML = '';

  function makeTab(label, isAll, clickedSem, backlogType) {
    var btn = document.createElement('button');
    btn.className = 'tab' + (isAll ? ' active' : '');
    btn.textContent = label;
    btn.onclick = function () {
      document.querySelectorAll('#sem-tabs .tab').forEach(function (t) { t.classList.remove('active'); });
      btn.classList.add('active');

      // Hide audit-tab, show courses-tab
      var coursesTab = document.getElementById('sdash-courses-tab');
      var auditTab = document.getElementById('sdash-audit-tab');
      if (coursesTab) coursesTab.style.display = 'block';
      if (auditTab) auditTab.style.display = 'none';

      // Clear any backlog-mode info banner
      var infoBanner = document.getElementById('backlog-info-banner');
      if (infoBanner) infoBanner.remove();

      if (backlogType === 'active') {
        renderCourses(activeBacklogs, '🔴 Active Backlogs', 'all');
        var b = document.createElement('div');
        b.id = 'backlog-info-banner';
        b.style.cssText = 'background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);border-radius:8px;padding:0.75rem 1rem;color:#dc2626;font-size:0.88rem;font-weight:600;margin-bottom:0.75rem;';
        b.textContent = '⚠ These courses require re-examination.';
        var tblTitle = document.getElementById('tbl-title');
        if (tblTitle && tblTitle.parentNode) tblTitle.parentNode.insertBefore(b, tblTitle);
      } else if (backlogType === 'cleared') {
        renderCourses(clearedBacklogs, '🟢 Cleared Backlogs', 'all');
        var b = document.createElement('div');
        b.id = 'backlog-info-banner';
        b.style.cssText = 'background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.25);border-radius:8px;padding:0.75rem 1rem;color:#16a34a;font-size:0.88rem;font-weight:600;margin-bottom:0.75rem;';
        b.textContent = '✓ Historical backlogs successfully cleared.';
        var tblTitle = document.getElementById('tbl-title');
        if (tblTitle && tblTitle.parentNode) tblTitle.parentNode.insertBefore(b, tblTitle);
      } else if (isAll) {
        renderCourses(student.courses, 'All Semesters', 'all');
      } else {
        const filtered = student.courses.filter(c => c.sem === clickedSem);
        renderCourses(filtered, label, clickedSem);
      }
    };
    return btn;
  }

  // Tab 1: All Semesters
  tabsEl.appendChild(makeTab('All Semesters', true));
  // Tabs 2…n: Individual semesters
  uniqueSems.forEach(function (s) {
    var label = SEM_MAP[s] || s;
    tabsEl.appendChild(makeTab(label, false, s));
  });
  // Tab n+1: 🔴 Active Backlogs (only if any exist)
  if (activeBacklogs.length > 0) {
    tabsEl.appendChild(makeTab('🔴 Active Backlogs', false, null, 'active'));
  }
  // Tab n+2: 🟢 Cleared Backlogs (only if any exist)
  if (clearedBacklogs.length > 0) {
    tabsEl.appendChild(makeTab('🟢 Cleared Backlogs', false, null, 'cleared'));
  }

  // ── Degree Audit Tab Button (V14.0) ──────────────────────────────────────────
  var auditBtn = document.createElement('button');
  auditBtn.className = 'tab-btn tab';
  auditBtn.setAttribute('onclick', "showTab('audit-tab')");
  auditBtn.textContent = '🎓 Degree Audit';
  tabsEl.appendChild(auditBtn);

  // Populate Audit Tab Content
  var auditTabEl = document.getElementById('sdash-audit-tab');
  if (auditTabEl) {
    const ruleKey = `${student.batch}_${student.program}`;
    const rules = CURRICULUM_RULES[ruleKey];
    
    if (!rules || rules.length === 0) {
      let auditHTML = `
        <div style="padding: 40px 20px; text-align: center; background: var(--s2, #1e293b); border: 2px dashed #475569; border-radius: 8px; margin-top: 20px;">
          <h2 style="color: #94a3b8; margin-bottom: 10px;">📭 Curriculum Not Found</h2>
          <p style="color: #cbd5e1; font-size: 1.1em;">No curriculum has been mapped for <strong>${student.batch} ${student.program}</strong>.</p>
          <p style="color: #64748b; font-size: 0.9em; margin-top: 15px;">Administrators can resolve this by uploading the curriculum via the Admin Portal.</p>
        </div>
      `;
      auditTabEl.innerHTML = auditHTML;
    } else {
      var auditResult = evaluateDegree(student);
      // V2.0: Nested Hierarchical Degree Audit UI
      let auditHTML = `<h3>Curriculum Degree Audit</h3>`;
      auditResult.audit.forEach(main => {
        const mainEarned = main.earned || 0;
        const mainStatus = mainEarned >= main.minCredits ? "✅ Cleared" : `⚠️ Missing ${main.minCredits - mainEarned}`;
        const mainColor = mainEarned >= main.minCredits ? "#15803d" : "#b45309";

        if (auditResult.isHierarchical && Array.isArray(main.subCategories)) {
          auditHTML += `
            <details style="margin-bottom: 12px; background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 8px; padding: 10px;">
              <summary style="font-weight: bold; font-size: 1.1em; cursor: pointer; color: ${mainColor};">
                📁 ${main.category} | Required: ${main.minCredits} | Earned: ${mainEarned} | ${mainStatus}
              </summary>
              <div style="margin-top: 15px; padding-left: 15px; border-left: 3px solid #e2e8f0;">
          `;
          main.subCategories.forEach(sub => {
            const subEarned = sub.earned || 0;
            const hasBacklog = (sub.codes || []).some(code => window.activeBacklogsGlobal && window.activeBacklogsGlobal.some(b => b.code === code));
            let subBg, subBorder, subIcon;
            if (hasBacklog) { subBg = "#fef2f2"; subBorder = "#ef4444"; subIcon = "🚨 Backlog"; }
            else if (subEarned >= sub.minCredits) { subBg = "#f0fdf4"; subBorder = "#22c55e"; subIcon = "✅ Cleared"; }
            else { subBg = "#fffbeb"; subBorder = "#f59e0b"; subIcon = "⏳ Pending"; }

            let compRows = (sub.completedList || []).map(c => `<tr><td style="border:1px solid #ccc;padding:4px;">${esc(c.code)}</td><td style="border:1px solid #ccc;padding:4px;">${esc(c.title)}</td><td style="border:1px solid #ccc;padding:4px;">${esc(String(c.cred))}</td></tr>`).join('');
            let pendRows = (sub.pendingList || []).map(c => `<tr><td style="border:1px solid #ccc;padding:4px;">${esc(c.code)}</td><td style="border:1px solid #ccc;padding:4px;">${esc(c.title)}</td><td style="border:1px solid #ccc;padding:4px;">${esc(String(c.cred))}</td></tr>`).join('');

            auditHTML += `
              <details style="margin-bottom: 10px; background: ${subBg}; border: 1px solid ${subBorder}; padding: 10px; border-radius: 6px;">
                <summary style="font-weight: bold; cursor: pointer;">
                  📄 ${sub.name} (Min ${sub.minCredits}) — Earned: ${subEarned} [${subIcon}]
                </summary>
                <div style="margin-top: 10px;">
                  <div class="table-responsive"><table style="width:100%; border-collapse: collapse; font-size: 0.85em; margin-bottom: 10px; background: white;">
                    <thead style="background: rgba(22,163,74,0.15); color:#15803d;"><tr><th style="border:1px solid #ccc;padding:4px;">Code</th><th style="border:1px solid #ccc;padding:4px;">Completed</th><th style="border:1px solid #ccc;padding:4px;">Credits</th></tr></thead>
                    <tbody>${compRows || '<tr><td colspan="3" style="text-align:center;padding:4px;">None</td></tr>'}</tbody>
                  </table></div>
                  <div class="table-responsive"><table style="width:100%; border-collapse: collapse; font-size: 0.85em; background: white;">
                    <thead style="background: rgba(245,158,11,0.15); color:#b45309;"><tr><th style="border:1px solid #ccc;padding:4px;">Code</th><th style="border:1px solid #ccc;padding:4px;">Pending Options</th><th style="border:1px solid #ccc;padding:4px;">Credits</th></tr></thead>
                    <tbody>${pendRows || '<tr><td colspan="3" style="text-align:center;padding:4px;">Requirements met</td></tr>'}</tbody>
                  </table></div>
                </div>
              </details>
            `;
          });
          auditHTML += `</div></details>`;
        } else {
          // Legacy flat rendering (V1.0 format fallback)
          const hasBacklogInBucket = (main.codes || []).some(code => window.activeBacklogsGlobal && window.activeBacklogsGlobal.some(b => b.code === code));
          let boxStyle, titleColor, statusHTML, pendingBg, pendingTitle;
          if (hasBacklogInBucket) { boxStyle = "background:#fef2f2;border:2px solid #ef4444;"; titleColor = "#b91c1c"; statusHTML = "❌ Backlog Requires Clearance"; pendingTitle = "🚨 Active Backlogs"; pendingBg = "rgba(239,68,68,0.1)"; }
          else if (mainEarned >= main.minCredits) { boxStyle = "background:#f0fdf4;border:2px solid #22c55e;"; titleColor = "#15803d"; statusHTML = "✅ Cleared"; pendingTitle = "Remaining Options"; pendingBg = "rgba(22,163,74,0.05)"; }
          else { boxStyle = "background:#fffbeb;border:2px solid #f59e0b;"; titleColor = "#b45309"; statusHTML = `⚠️ Missing ${main.minCredits - mainEarned} Credits`; pendingTitle = "⏳ Pending Courses"; pendingBg = "rgba(245,158,11,0.1)"; }
          let completedRows = (main.completedList || []).map(c => `<tr><td style="border:1px solid #ccc;padding:6px;">${esc(c.code)}</td><td style="border:1px solid #ccc;padding:6px;">${esc(c.title)}</td><td style="border:1px solid #ccc;padding:6px;">${esc(String(c.cred))}</td></tr>`).join('');
          if (!completedRows) completedRows = `<tr><td colspan="3" style="border:1px solid #ccc;padding:6px;text-align:center;color:#666;">No courses completed yet</td></tr>`;
          let pendingRows = (main.pendingList || []).map(c => `<tr><td style="border:1px solid #ccc;padding:6px;">${esc(c.code)}</td><td style="border:1px solid #ccc;padding:6px;">${esc(c.title)}</td><td style="border:1px solid #ccc;padding:6px;">${esc(String(c.cred))}</td></tr>`).join('');
          if (!pendingRows) pendingRows = `<tr><td colspan="3" style="border:1px solid #ccc;padding:6px;text-align:center;color:#666;">All requirements met!</td></tr>`;
          auditHTML += `
            <details style="margin-bottom:10px;${boxStyle}padding:12px;border-radius:6px;">
              <summary style="font-weight:bold;cursor:pointer;list-style-position:inside;color:${titleColor};">${main.category} | Required:${main.minCredits} | Earned:${mainEarned} | ${statusHTML}</summary>
              <div style="margin-top:15px;padding-left:20px;font-size:0.9em;">
                <div class="table-responsive"><table style="border-collapse:collapse;width:100%;margin-bottom:15px;font-size:0.9em;"><thead style="background:rgba(22,163,74,0.15);color:#15803d;"><tr><th style="border:1px solid #ccc;padding:6px;">Code</th><th style="border:1px solid #ccc;padding:6px;">Completed</th><th style="border:1px solid #ccc;padding:6px;">Credits</th></tr></thead><tbody>${completedRows}</tbody></table></div>
                <div class="table-responsive"><table style="border-collapse:collapse;width:100%;margin-bottom:5px;font-size:0.9em;"><thead style="background:${pendingBg};color:${titleColor};"><tr><th style="border:1px solid #ccc;padding:6px;">Code</th><th style="border:1px solid #ccc;padding:6px;">${pendingTitle}</th><th style="border:1px solid #ccc;padding:6px;">Credits</th></tr></thead><tbody>${pendingRows}</tbody></table></div>
              </div>
            </details>
          `;
        }
      });
      auditTabEl.innerHTML = auditHTML;
    }
  }

  renderCourses(student.courses, 'All Semesters', 'all');
}

// ── Compute and render the Completed / Backlog summary banner ─────────────────
// Spec: Calculates dynamic semester-wise earned credits vs backlog credits.
// Works for both student and faculty dashboards (idPrefix = '' or 'faculty-').
function updateSummaryBanner(courses, semesterFilter, idPrefix) {
  idPrefix = idPrefix || '';
  var valid = (courses || []).filter(function (c) {
    return c && c.code && c.code !== 'nan' && c.code.trim() !== '';
  });

  var currentCourses;
  if (!semesterFilter || semesterFilter === 'all' || semesterFilter === 'All' || semesterFilter === 'All Semesters') {
    currentCourses = valid;
  } else {
    currentCourses = valid.filter(function (c) {
      return String(c.sem || c.semester || '').trim() === semesterFilter;
    });
  }

  // Calculation Logic per spec:
  var earned = currentCourses.filter(function (c) {
    var g = String(c.grade || '').toUpperCase().trim();
    return !['F', 'FAIL', 'AB'].includes(g);
  }).reduce(function (sum, c) {
    return sum + (parseFloat(c.credits) || 0);
  }, 0);

  var backlogs = currentCourses.filter(function (c) {
    var g = String(c.grade || '').toUpperCase().trim();
    return ['F', 'FAIL', 'AB'].includes(g);
  }).reduce(function (sum, c) {
    return sum + (parseFloat(c.credits) || 0);
  }, 0);

  // Locate the banner container (handles both ID conventions)
  var bannerEl = document.getElementById(idPrefix + 'sem-summary-banner') ||
    document.getElementById(idPrefix + 'sem-summary');

  if (bannerEl) {
    bannerEl.style.display = 'flex';
    bannerEl.style.gap = '0.75rem';
    bannerEl.style.padding = '0.5rem 0';
    bannerEl.style.background = 'transparent';
    bannerEl.style.border = 'none';

    bannerEl.innerHTML = [
      '<div class="summary-badge-btn earned" title="Total credits earned in selected semester(s)">',
      '<span>🎓 Credits Earned:</span>',
      '<strong>' + earned + '</strong>',
      '</div>',
      '<div class="summary-badge-btn backlog" title="Total backlog credits in selected semester(s)">',
      '<span>⚠️ Backlog Credits:</span>',
      '<strong>' + backlogs + '</strong>',
      '</div>'
    ].join('');
  }
}

// ── Render the Dedicated Backlog/F-Grade warning banner and table ───────────────
// Spec: Filters for 'F', 'FAIL', 'AB' and displays subjects details in a table.
function renderDedicatedBacklogBanner(courses, semesterFilter, idPrefix) {
  idPrefix = idPrefix || '';
  var backlogContainerId = idPrefix + 'dedicated-backlog-container';
  var backlogContainer = document.getElementById(backlogContainerId);

  // Find the summary banner element to insert after
  var bannerEl = document.getElementById(idPrefix + 'sem-summary-banner') ||
    document.getElementById(idPrefix + 'sem-summary');

  if (!backlogContainer) {
    backlogContainer = document.createElement('div');
    backlogContainer.id = backlogContainerId;
    backlogContainer.style.marginTop = '1rem';
    backlogContainer.style.marginBottom = '1rem';

    if (bannerEl) {
      bannerEl.parentNode.insertBefore(backlogContainer, bannerEl.nextSibling);
    }
  }

  var valid = (courses || []).filter(function (c) {
    return c && c.code && c.code !== 'nan' && c.code.trim() !== '';
  });

  var currentCourses;
  if (!semesterFilter || semesterFilter === 'all' || semesterFilter === 'All' || semesterFilter === 'All Semesters') {
    currentCourses = valid;
  } else {
    currentCourses = valid.filter(function (c) {
      return String(c.sem || c.semester || '').trim() === semesterFilter;
    });
  }

  const backlogs = currentCourses.filter(c => ['F', 'FAIL', 'AB'].includes(String(c.grade || '').toUpperCase().trim()));

  if (backlogs.length > 0) {
    var html = [
      '<div style="background:rgba(220,38,38,0.08); border:1px solid rgba(220,38,38,0.25); border-radius:8px; padding:1.2rem; color:#dc2626; font-family:var(--sans); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">',
      '<div style="display:flex; align-items:center; gap:0.6rem; font-weight:700; font-size:0.98rem; margin-bottom:0.6rem;">',
      '<span>⚠️ Dedicated Backlog Alert:</span>',
      '<span style="background:#dc2626; color:#ffffff; font-size:0.75rem; padding:0.2rem 0.65rem; border-radius:12px; font-family:var(--mono); font-weight:700;">' + backlogs.length + ' Subject' + (backlogs.length !== 1 ? 's' : '') + '</span>',
      '</div>',
      '<div style="font-size:0.85rem; color:var(--sub); margin-bottom:0.8rem;">The following course(s) require re-examination or registration:</div>',
      '<div style="overflow-x:auto;">',
      '<table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">',
      '<thead>',
      '<tr style="border-bottom:1px solid rgba(220,38,38,0.15); color:var(--text); font-weight:600;">',
      '<th style="padding:0.4rem 0.6rem; width:120px;">Course Code</th>',
      '<th style="padding:0.4rem 0.6rem;">Course Title</th>',
      '<th style="padding:0.4rem 0.6rem; width:80px; text-align:center;">Grade</th>',
      '</tr>',
      '</thead>',
      '<tbody>'
    ];
    backlogs.forEach(function (c) {
      html.push(
        '<tr style="border-bottom:1px solid rgba(220,38,38,0.06); color:var(--text);">',
        '<td style="padding:0.5rem 0.6rem; font-family:var(--mono); font-weight:600;">' + esc(c.code) + '</td>',
        '<td style="padding:0.5rem 0.6rem;">' + esc(c.title || '-') + '</td>',
        '<td style="padding:0.5rem 0.6rem; text-align:center;"><span class="grade g-F" style="padding:0.1rem 0.4rem; font-size:0.75rem;">' + esc(c.grade) + '</span></td>',
        '</tr>'
      );
    });
    html.push(
      '</tbody>',
      '</table>',
      '</div>',
      '</div>'
    );
    backlogContainer.innerHTML = html.join('');
    backlogContainer.style.display = 'block';
  } else {
    backlogContainer.innerHTML = '';
    backlogContainer.style.display = 'none';
  }
}


function renderCourses(courses, title, semesterFilter, idPrefix) {
  idPrefix = idPrefix || '';
  var valid = (courses || []).filter(function (c) {
    return c && c.code && c.code !== 'nan' && c.code.trim() !== '';
  });

  var filteredCourses;
  if (!semesterFilter || semesterFilter === 'all' || semesterFilter === 'All' || semesterFilter === 'All Semesters') {
    filteredCourses = valid;
  } else {
    filteredCourses = valid.filter(function (c) {
      return String(c.sem || c.semester || '').trim() === semesterFilter;
    });
  }

  document.getElementById(idPrefix + 'tbl-title').textContent = title;
  document.getElementById(idPrefix + 'tbl-badge').textContent = filteredCourses.length + ' course' + (filteredCourses.length !== 1 ? 's' : '');

  // Update the summary banner and dedicated backlog banner dynamically
  updateSummaryBanner(courses, semesterFilter, idPrefix);
  renderDedicatedBacklogBanner(courses, semesterFilter, idPrefix);

  var tbody = document.getElementById(idPrefix + 'courses-tbody');
  tbody.innerHTML = '';

  if (!filteredCourses.length) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.colSpan = 8; td.style.textAlign = 'center';
    td.style.padding = '2rem'; td.style.color = 'var(--muted)';
    td.textContent = 'No courses found for this selection.';
    tr.appendChild(td); tbody.appendChild(tr);
    return;
  }

  filteredCourses.forEach(function (c) {
    var grade = String(c.grade !== undefined && c.grade !== null && c.grade !== '' ? c.grade : '-').trim();
    var credits = String(c.credits !== undefined && c.credits !== null && c.credits !== '' ? c.credits : '-').trim();
    var gradePoints = String(c.gradePoints !== undefined && c.gradePoints !== null && c.gradePoints !== '' ? c.gradePoints : '-').trim();
    var creditEarned = String(c.creditEarned !== undefined && c.creditEarned !== null && c.creditEarned !== '' ? c.creditEarned : '-').trim();
    var marks = String(c.marks !== undefined && c.marks !== null && c.marks !== '' ? c.marks : '-').trim();

    var marksNum = parseFloat(marks);
    var marksDisplay = !isNaN(marksNum) ? marksNum.toFixed(1) : marks;
    var pct = !isNaN(marksNum) ? Math.min(100, Math.round(marksNum)) : 0;
    var gc = ['S', 'A', 'B', 'C', 'D', 'E', 'F'].includes(grade) ? 'g-' + grade : 'g-D';

    var marksCell = (marksDisplay !== '-' && marksDisplay !== '')
      ? '<div class="bar-wrap"><span class="bar-num">' + esc(marksDisplay) + '</span>' +
      '<div class="bar-bg"><div class="bar-fill" style="width:' + pct + '%"></div></div></div>'
      : '<span style="color:var(--muted);font-size:0.78rem;font-family:var(--mono)">-</span>';

    var row = document.createElement('tr');
    row.innerHTML = [
      '<td class="td-code">' + esc(c.code) + '</td>',
      '<td class="td-title">' + esc(c.title || '-') + '</td>',
      '<td><span class="type-chip">' + esc(c.type || '-') + '</span></td>',
      '<td style="font-family:var(--mono);font-size:0.8rem">' + esc(credits) + '</td>',
      '<td>' + marksCell + '</td>',
      '<td><span class="grade ' + esc(gc) + '">' + esc(grade) + '</span></td>',
      '<td style="font-family:var(--mono);font-size:0.8rem">' + esc(gradePoints) + '</td>',
      '<td style="font-family:var(--mono);font-size:0.8rem">' + esc(creditEarned) + '</td>'
    ].join('');
    tbody.appendChild(row);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FACULTY LOGIN / SEARCH
// ═══════════════════════════════════════════════════════════════════════════════
var FACULTY_SESSION = 'coe_faculty_auth';
var currentFacultyEmail = null;

/**
 * showFacultyLoginUI — shows the faculty login container inside the landing page
 * and hides the student login container. Mutually exclusive toggle.
 */
function showFacultyLoginUI() {
  var stu = document.getElementById('student-login-container');
  var fac = document.getElementById('faculty-login-container');
  if (stu) stu.style.display = 'none';
  if (fac) fac.style.display = 'block';
  var emailEl = document.getElementById('f-email');
  var errEl = document.getElementById('faculty-err');
  var okEl = document.getElementById('faculty-ok');
  if (errEl) errEl.style.display = 'none';
  if (okEl) okEl.style.display = 'none';
  if (emailEl) { emailEl.value = ''; setTimeout(function () { emailEl.focus(); }, 150); }
  var passEl = document.getElementById('f-pass');
  if (passEl) passEl.value = '';
}

/**
 * showStudentLoginUI — restores the student login container and hides the
 * faculty login container. Used by the "Back to Student Login" button.
 */
function showStudentLoginUI() {
  var stu = document.getElementById('student-login-container');
  var fac = document.getElementById('faculty-login-container');
  if (fac) fac.style.display = 'none';
  if (stu) stu.style.display = 'block';
}

function showFacultyLogin() {
  // If the inline landing-page containers exist, use them (mutually exclusive toggle)
  var facContainer = document.getElementById('faculty-login-container');
  if (facContainer) {
    showFacultyLoginUI();
    return;
  }
  // Fallback: show the standalone faculty-login page
  var emailEl = document.getElementById('f-email');
  var passEl = document.getElementById('f-pass');
  if (emailEl) emailEl.value = '';
  if (passEl) passEl.value = '';
  var errEl = document.getElementById('faculty-err');
  var okEl = document.getElementById('faculty-ok');
  if (errEl) errEl.style.display = 'none';
  if (okEl) okEl.style.display = 'none';
  showPage('faculty-login');
  setTimeout(function () { if (emailEl) emailEl.focus(); }, 150);
}

async function facultyLoginStep() {
  var emailRaw = (document.getElementById('f-email').value || '').trim().toLowerCase();
  var passRaw = (document.getElementById('f-pass').value || '').trim();
  var errEl = document.getElementById('faculty-err');
  var okEl = document.getElementById('faculty-ok');
  var btn = document.getElementById('f-login-btn');

  if (errEl) errEl.style.display = 'none';
  if (okEl) okEl.style.display = 'none';

  if (!emailRaw) {
    if (errEl) { errEl.textContent = 'Please enter your institutional email.'; errEl.className = 'alert err'; errEl.style.display = 'block'; }
    return;
  }
  if (!passRaw) {
    if (errEl) { errEl.textContent = 'Please enter your password.'; errEl.className = 'alert err'; errEl.style.display = 'block'; }
    return;
  }

  if (btn) btn.disabled = true;
  if (errEl) { errEl.textContent = '⏳ Authenticating with backend…'; errEl.className = 'alert info'; errEl.style.display = 'block'; }

  try {
    var response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'verifyfaculty', email: emailRaw, password: passRaw })
    });
    var data = await response.json();

    if (data && data.status === 'success') {
      currentFacultyEmail = emailRaw;
      sessionStorage.setItem(FACULTY_SESSION, emailRaw);
      if (errEl) errEl.style.display = 'none';
      var labelEl = document.getElementById('faculty-email-label');
      if (labelEl) labelEl.textContent = emailRaw;
      // Hide the inline faculty login container completely (removes empty space)
      var facContainer = document.getElementById('faculty-login-container');
      if (facContainer) facContainer.style.display = 'none';
      // Navigate to faculty dashboard
      showPage('faculty-dash');
      // Show the faculty dashboard container and smooth-scroll into view
      var dashContainer = document.getElementById('faculty-dashboard-container');
      if (dashContainer) {
        dashContainer.style.display = 'block';
        setTimeout(function () {
          dashContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);  // 150ms lets the DOM paint before scrolling
      }
      // Load all students for the analytics dashboard
      facultyLoadAllStudents();
    } else {
      if (errEl) {
        errEl.textContent = '⚠ ' + ((data && data.error) || 'Invalid faculty credentials. Please try again.');
        errEl.className = 'alert err';
        errEl.style.display = 'block';
      }
      document.getElementById('f-pass').value = '';
    }
  } catch (err) {
    if (errEl) {
      errEl.textContent = '✗ Connection error: ' + err.message;
      errEl.className = 'alert err';
      errEl.style.display = 'block';
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

function facultyLogout() {
  sessionStorage.removeItem(FACULTY_SESSION);
  currentFacultyEmail = null;
  window.students = [];
  // Return to landing and show the student login (not the faculty form)
  showPage('landing');
  showStudentLoginUI();
}

// ── Load all students into window.students (called on faculty login) ──────────
async function facultyLoadAllStudents() {
  var infoEl = document.getElementById('faculty-search-info');
  var errEl = document.getElementById('faculty-search-err');
  if (infoEl) { infoEl.innerHTML = '<span class="spinner"></span> Loading student directory…'; infoEl.style.display = 'block'; }
  if (errEl) errEl.style.display = 'none';

  try {
    // 1. Try live backend first via action=load JSONP (populates window.students with fresh data)
    var data = await gasJsonp(GAS_URL + '?action=load', 15000);
    var students = Array.isArray(data) ? data : (data && Array.isArray(data.students) ? data.students : []);

    if (students && students.length) {
      window.students = students;
      // Refresh local cache with latest backend data
      try { localStorage.setItem(LOCAL_STU_KEY, JSON.stringify(students)); } catch (e) { }
      if (infoEl) infoEl.style.display = 'none';
      populateFilterDropdowns(window.students);
      renderFacultyTable(window.students);
      return;
    }
  } catch (backendErr) {
    // Backend unreachable — fall through to localStorage cache
    console.warn('[facultyLoadAllStudents] Backend fetch failed, using local cache:', backendErr.message);
  }

  try {
    // 2. Fallback: use localStorage cache (same-device, possibly stale)
    var cached = localStorage.getItem(LOCAL_STU_KEY);
    var students = [];
    if (cached) {
      try { students = JSON.parse(cached); } catch (e) { students = []; }
    }
    window.students = students;
    if (infoEl) infoEl.style.display = 'none';
    populateFilterDropdowns(window.students);
    renderFacultyTable(window.students);
    if (students.length === 0) {
      if (errEl) { errEl.textContent = '⚠ No cached data found. Ensure the backend is reachable and data has been uploaded.'; errEl.style.display = 'block'; }
    }
  } catch (err) {
    if (infoEl) infoEl.style.display = 'none';
    if (errEl) { errEl.textContent = '✗ Could not load students: ' + err.message; errEl.style.display = 'block'; }
  }
}

// ── Render Faculty Directory Table ────────────────────────────────────────────
function renderFacultyTable(studentsArray) {
  var tbody = document.getElementById('faculty-dir-tbody');
  var badge = document.getElementById('faculty-dir-badge');
  if (!tbody) return;

  if (badge) badge.textContent = (studentsArray.length) + ' student' + (studentsArray.length !== 1 ? 's' : '');
  tbody.innerHTML = '';

  if (!studentsArray || !studentsArray.length) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="6" style="text-align:center;padding:2.5rem;color:var(--muted);">No students match the current filter.</td>';
    tbody.appendChild(tr);
    return;
  }

  studentsArray.forEach(function (student) {
    // Calculate backlogs on the fly
    var backlogCount = (student.courses || []).filter(function (c) {
      return ['F', 'FAIL', 'AB'].includes(String(c.grade || '').toUpperCase().trim());
    }).length;

    var cgpaVal = parseFloat(student.cgpa);
    var cgpaDisplay = (!isNaN(cgpaVal) && cgpaVal !== 0) ? cgpaVal.toFixed(2) : '—';
    var creditsDisplay = student.totalCreditEarned || student.totalCredits || '—';

    var backlogCell = backlogCount > 0
      ? '<span style="background:rgba(220,38,38,0.12);border:1px solid rgba(220,38,38,0.35);color:#dc2626;font-family:var(--mono);font-size:0.72rem;padding:0.15rem 0.55rem;border-radius:12px;font-weight:700;">' + backlogCount + '</span>'
      : '<span style="color:var(--green);font-family:var(--mono);font-size:0.8rem;">✓ Clear</span>';

    var tr = document.createElement('tr');
    tr.innerHTML = [
      '<td class="td-code">' + esc(student.sen) + '</td>',
      '<td style="font-weight:500">' + esc(student.name) + '</td>',
      '<td style="font-family:var(--mono);font-size:0.88rem;color:var(--gold)">' + esc(cgpaDisplay) + '</td>',
      '<td style="font-family:var(--mono);font-size:0.8rem;color:var(--green)">' + esc(String(creditsDisplay)) + '</td>',
      '<td>' + backlogCell + '</td>',
      '<td><button onclick="window.openFacultyStudentView(\'' + esc(student.sen) + '\')" ' +
      'style="font-family:var(--mono);font-size:0.7rem;padding:0.25rem 0.7rem;border-radius:5px;' +
      'border:1px solid var(--accent);background:rgba(2,132,199,0.07);color:var(--accent);cursor:pointer;' +
      'transition:all 0.15s;" onmouseover="this.style.background=\'var(--accent)\';this.style.color=\'#fff\'" ' +
      'onmouseout="this.style.background=\'rgba(2,132,199,0.07)\';this.style.color=\'var(--accent)\'">View Results →</button></td>'
    ].join('');
    tbody.appendChild(tr);

  });
}

// ── Populate Batch & Program Filter Dropdowns (V15.0 — aggressive trimming) ────
/**
 * populateFilterDropdowns — extracts unique batch and program values from
 * studentsArray, aggressively trims whitespace, sorts alphabetically, and
 * injects <option> tags into the #filter-batch and #filter-program <select>.
 */
function populateFilterDropdowns(studentsArray) {
  // V15.0: Use Set + aggressive trim to prevent whitespace duplicates
  const uniqueBatches  = [...new Set((studentsArray || []).map(s => String(s.batch   || '').trim()).filter(Boolean))]
    .filter(b => b !== 'Unknown Batch').sort();
  const uniquePrograms = [...new Set((studentsArray || []).map(s => String(s.program || '').trim()).filter(Boolean))]
    .filter(p => p !== 'Unknown Program').sort();

  var batchSel   = document.getElementById('filter-batch');
  var programSel = document.getElementById('filter-program');

  if (batchSel) {
    batchSel.innerHTML = '<option value="">All Batches</option>';
    uniqueBatches.forEach(function(b) {
      var opt = document.createElement('option');
      opt.value = b; opt.textContent = b;
      batchSel.appendChild(opt);
    });
  }

  if (programSel) {
    programSel.innerHTML = '<option value="">All Programs</option>';
    uniquePrograms.forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p; opt.textContent = p;
      programSel.appendChild(opt);
    });
  }

  // V16.0: Populate exact credit numbers dropdown
  const uniqueCredits = [...new Set((studentsArray || []).map(s => parseInt(s.totalCredits)).filter(c => !isNaN(c)))].sort((a, b) => a - b);
  const creditDropdown = document.getElementById('filter-credit-exact');
  if (creditDropdown) {
    creditDropdown.innerHTML = '<option value="">All Credits (Filter by Number)</option>';
    uniqueCredits.forEach(cr => {
      creditDropdown.innerHTML += `<option value="${cr}">${cr} Credits</option>`;
    });
  }
}

// ── Master Faculty Filter (V15.0 — trim-safe comparisons) ──────────────────────
/**
 * applyFilters — master filter function with hierarchical filtering (V15.0).
 * Hierarchy: Year/Batch + Program are applied FIRST to create a cohort subset,
 * then Search and Eligibility filters are applied strictly to that subset.
 * V15.0: Both sides of batch/program comparisons are trimmed to prevent whitespace bugs.
 */
function applyFilters() {
  var searchVal   = ((document.getElementById('faculty-search-input') || {}).value || '').trim().toLowerCase();
  var batchVal    = ((document.getElementById('filter-batch')         || {}).value || '').trim();
  var programVal  = ((document.getElementById('filter-program')       || {}).value || '').trim();
  var eligibility = ((document.getElementById('filter-eligibility')   || {}).value || 'all').trim();

  // Step 1: Apply Year/Program cohort filter FIRST — trim both sides (V15.0 fix)
  var cohort = (window.students || []).filter(function (s) {
    var matchBatch   = !batchVal   || String(s.batch   || '').trim() === batchVal;
    var matchProgram = !programVal || String(s.program || '').trim() === programVal;
    return matchBatch && matchProgram;
  });

  // Step 2: Apply search, eligibility, and other filters to the cohort
  var filtered = cohort.filter(function (s) {
    // Search filter
    if (searchVal) {
      var matchSearch = (s.sen  || '').toLowerCase().includes(searchVal) ||
                        (s.name || '').toLowerCase().includes(searchVal);
      if (!matchSearch) return false;
    }
    // Eligibility filter
    if (eligibility !== 'all') {
      var audit = evaluateDegree(s);
      if (eligibility === 'eligible'     && !audit.isEligible) return false;
      if (eligibility === 'not_eligible' &&  audit.isEligible) return false;
    }
    return true;
  });

  // Apply Exact Credit Filter (V16.0)
  const exactCreditDropdown = document.getElementById('filter-credit-exact');
  const exactCredit = exactCreditDropdown ? exactCreditDropdown.value : "";
  if (exactCredit !== "") {
    filtered = filtered.filter(s => parseInt(s.totalCredits) === parseInt(exactCredit));
  }

  // Apply Sorting (V16.0) — Clone array before sorting
  const sortCreditsDropdown = document.getElementById('sort-credits');
  const sortOrder = sortCreditsDropdown ? sortCreditsDropdown.value : "";
  if (sortOrder === "desc") {
    filtered = [...filtered].sort((a, b) => parseFloat(b.totalCredits) - parseFloat(a.totalCredits));
  } else if (sortOrder === "asc") {
    filtered = [...filtered].sort((a, b) => parseFloat(a.totalCredits) - parseFloat(b.totalCredits));
  }

  renderFacultyTable(filtered);
}

// ── Filter: View All ──────────────────────────────────────────────────────────
function facultyViewAll() {
  if (!window.students || !window.students.length) {
    facultyLoadAllStudents();
    return;
  }
  var searchEl = document.getElementById('faculty-search-input');
  if (searchEl) searchEl.value = '';
  var batchSel = document.getElementById('filter-batch');
  if (batchSel) batchSel.value = '';
  var programSel = document.getElementById('filter-program');
  if (programSel) programSel.value = '';
  var creditEl = document.getElementById('faculty-credit-input');
  if (creditEl) creditEl.value = '';
  renderFacultyTable(window.students);
}

// ── Filter: Search by SEN or Name ─────────────────────────────────────────────
function facultyFilterSearch() {
  // Delegates to the master applyFilters() so all filters stay in sync
  applyFilters();
}

// ── Filter: Has Backlogs ──────────────────────────────────────────────────────
function facultyFilterBacklogs() {
  var filtered = (window.students || []).filter(function (s) {
    return (s.courses || []).some(function (c) {
      return ['F', 'FAIL', 'AB'].includes(String(c.grade || '').toUpperCase().trim());
    });
  });
  var searchEl = document.getElementById('faculty-search-input');
  if (searchEl) searchEl.value = '';
  renderFacultyTable(filtered);
}

// ── Filter: Credits Below X ───────────────────────────────────────────────────
function facultyFilterCredits() {
  var creditEl = document.getElementById('faculty-credit-input');
  var target = parseInt(creditEl ? creditEl.value : '');
  if (isNaN(target)) {
    var errEl = document.getElementById('faculty-search-err');
    if (errEl) { errEl.textContent = 'Please enter a valid credit threshold number.'; errEl.style.display = 'block'; }
    return;
  }
  var errEl = document.getElementById('faculty-search-err');
  if (errEl) errEl.style.display = 'none';
  var searchEl = document.getElementById('faculty-search-input');
  if (searchEl) searchEl.value = '';
  var filtered = (window.students || []).filter(function (s) {
    return parseInt(s.totalCreditEarned || s.totalCredits || 0) < target;
  });
  renderFacultyTable(filtered);
}

// ── View Individual Student Detail ────────────────────────────────────────────
function facultyViewStudent(sen) {
  var student = (window.students || []).find(function (s) { return s.sen === sen; });
  if (!student) return;
  // Hide directory table, show detail view
  var dirView = document.getElementById('faculty-directory-view');
  var detailView = document.getElementById('faculty-student-detail-view');
  var ctrlPanel = document.getElementById('faculty-control-panel');
  if (dirView) dirView.style.display = 'none';
  if (ctrlPanel) ctrlPanel.style.display = 'none';
  if (detailView) detailView.style.display = 'block';
  // Render the student detail exactly as the student sees it
  renderFacultyStudentView(student);
}

// ── Back to Directory ─────────────────────────────────────────────────────────
function facultyBackToDirectory() {
  var dirView = document.getElementById('faculty-directory-view');
  var detailView = document.getElementById('faculty-student-detail-view');
  var ctrlPanel = document.getElementById('faculty-control-panel');
  if (detailView) detailView.style.display = 'none';
  if (dirView) dirView.style.display = 'block';
  if (ctrlPanel) ctrlPanel.style.display = 'flex';
}

// ── Global Faculty Student View Routing (V8.1 Core Fix) ──────────────────────
/**
 * openFacultyStudentView — globally scoped handler triggered by the inline
 * onclick on each "View Results" button in the faculty data table.
 * Hides the table wrapper and shows the injected student detail view.
 */
window.openFacultyStudentView = function (sen) {
  var student = (window.students || []).find(function (s) { return s.sen === sen; });
  if (!student) return;
  document.getElementById('faculty-table-wrapper').style.display = 'none';
  document.getElementById('faculty-student-detail-view').style.display = 'block';
  // Render the full student dashboard inside the faculty injected container
  renderStudentDashboard(student, 'faculty-injected-student-data');
};

/**
 * closeFacultyStudentView — globally scoped handler triggered by the
 * "← Back to Directory" button inside the faculty detail view.
 * Clears the injected content and restores the table wrapper.
 */
window.closeFacultyStudentView = function () {
  document.getElementById('faculty-student-detail-view').style.display = 'none';
  document.getElementById('faculty-table-wrapper').style.display = 'block';
  document.getElementById('faculty-injected-student-data').innerHTML = ''; // Clear memory
};

// ── Legacy single-SEN search (kept for backward compat if needed) ─────────────
async function facultySearchStudent() {
  var rawSen = (document.getElementById('faculty-sen-input') || {}).value || '';
  var sen = sanitize(rawSen).toUpperCase();
  if (!sen) return;
  var student = (window.students || []).find(function (s) { return s.sen === sen; });
  if (student) { facultyViewStudent(sen); return; }
  // Fallback server lookup
  var errEl = document.getElementById('faculty-search-err');
  var infoEl = document.getElementById('faculty-search-info');
  var email = sessionStorage.getItem(FACULTY_SESSION) || currentFacultyEmail || '';
  if (infoEl) { infoEl.innerHTML = '<span class="spinner"></span> Fetching student data…'; infoEl.style.display = 'block'; }
  if (errEl) errEl.style.display = 'none';
  try {
    var result = await gasJsonp(
      GAS_URL + '?action=facultylookup&facultyEmail=' + encodeURIComponent(email) + '&sen=' + encodeURIComponent(sen), 12000
    );
    if (infoEl) infoEl.style.display = 'none';
    if (!result || result.error) {
      if (errEl) { errEl.textContent = (result && result.error) ? result.error : 'Student not found.'; errEl.style.display = 'block'; }
    } else if (result.success && result.student) {
      // Inject into window.students for future use
      if (!window.students) window.students = [];
      var existing = window.students.findIndex(function (s) { return s.sen === result.student.sen; });
      if (existing === -1) window.students.push(result.student); else window.students[existing] = result.student;
      facultyViewStudent(result.student.sen);
    }
  } catch (err) {
    if (infoEl) infoEl.style.display = 'none';
    if (errEl) { errEl.textContent = '✗ Error: ' + err.message; errEl.style.display = 'block'; }
  }
}


/**
 * evaluateDegree — Hierarchical Curriculum Evaluation Engine (V17.0).
 *
 * Uses CURRICULUM_RULES with `category` property key.
 * Category 4 is a catch-all: any passed course not in categories 1-3 goes here.
 * V17.0: completedList and pendingList now contain rich objects: { code, title, cred }.
 *
 * @param  {object} student
 * @returns {{ isSupported, isEligible, audit, totalEarnedInBuckets }}
 */
function evaluateDegree(student) {
  const safeBatch = String(student.batch || "").trim();
  const safeProgram = String(student.program || "").trim();
  const exactKey = `${safeBatch}_${safeProgram}`;
  
  let rules = CURRICULUM_RULES[exactKey];
  
  // 1. UNIVERSAL FUZZY MATCHER (Strips dots, spaces, brackets for ALL programs)
  const fuzzyTarget = exactKey.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  if (!rules || rules.length === 0) {
      const matchedKey = Object.keys(CURRICULUM_RULES).find(k => 
          k.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === fuzzyTarget
      );
      if (matchedKey) {
          rules = CURRICULUM_RULES[matchedKey];
      }
  }

  // 2. UNIVERSAL DIAGNOSTIC CHECK
  let systemPrograms = [];
  try { systemPrograms = JSON.parse(localStorage.getItem('AIIT_SYSTEM_PROGRAMS')) || []; } catch(e){}
  
  // Check if the program exists in the Admin's setup, using the same fuzzy logic
  const isSystemKnown = systemPrograms.some(p => {
      const sysKey = `${p.batch}_${p.program}`.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return sysKey === fuzzyTarget;
  });

  // 3. Reject if empty
  if (!rules || rules.length === 0) {
      return { isSupported: false, safeBatch, safeProgram, isSystemKnown };
  }

  // Clone rules for this audit
  let audit = JSON.parse(JSON.stringify(rules));
  let totalEarnedOverall = 0;

  const passedCourses = (student.courses || []).filter(c =>
    c && c.code && !['F', 'FAIL', 'AB'].includes(String(c.grade || '').trim().toUpperCase())
  );

  // Deduplicate — keep one entry per course code
  const uniquePassed = [];
  const seenCodes = new Set();
  passedCourses.forEach(c => {
    const code = String(c.code || '').trim().toUpperCase();
    if (code && !seenCodes.has(code)) { uniquePassed.push(c); seenCodes.add(code); }
  });

  // Handle both flat (V1.0) and hierarchical (V2.0) rule formats
  const isHierarchical = audit.length > 0 && Array.isArray(audit[0].subCategories);

  if (isHierarchical) {
    // V2.0: Distribute passed courses into Sub-Categories
    uniquePassed.forEach(c => {
      const code = String(c.code || '').trim().toUpperCase();
      const cInfo = getCourseInfo(code);
      const creds = parseFloat(c.credits || c.creditEarned) || cInfo.credits;
      const cObj = { code: code, title: c.title || c.name || cInfo.name, cred: creds };

      let found = false;
      audit.forEach(main => {
        (main.subCategories || []).forEach(sub => {
          if ((sub.codes || []).some(sc => sc.toUpperCase() === code)) {
            if (!sub.completedList) sub.completedList = [];
            sub.completedList.push(cObj);
            sub.earned = (sub.earned || 0) + creds;
            found = true;
          }
        });
      });
      if (!found) totalEarnedOverall += creds; // Unmatched = open elective
    });

    // Roll up Sub-Category math to Main Category, and build Pending Lists
    let allMainBucketsMet = true;
    audit.forEach(main => {
      main.earned = 0;
      (main.subCategories || []).forEach(sub => {
        main.earned += (sub.earned || 0);
        totalEarnedOverall += (sub.earned || 0);

        // Build Pending list for this sub-category
        sub.pendingList = [];
        (sub.codes || []).forEach(code => {
          const isCompleted = sub.completedList && sub.completedList.some(comp => comp.code === code.toUpperCase());
          if (!isCompleted) {
            const pInfo = getCourseInfo(code);
            sub.pendingList.push({ code: code, title: pInfo.name, cred: pInfo.credits });
          }
        });
      });
      if (main.earned < main.minCredits) allMainBucketsMet = false;
    });

    const isEligible = allMainBucketsMet && (totalEarnedOverall >= 80);
    return { isSupported: true, audit, isEligible, totalEarnedOverall, isHierarchical: true };

  } else {
    // V1.0 flat format — legacy compatibility path
    const batchClean = String(student.batch || '').match(/(20\d{2})/) ? String(student.batch).match(/(20\d{2})/)[1] : String(student.batch || '').trim();
    const legacyRuleKey = `${batchClean}_${student.program}`;
    const legacyRules = CURRICULUM_RULES[legacyRuleKey];
    if (!legacyRules) return { isSupported: false, isEligible: false };

    let legacyAudit = legacyRules.map(r => ({
      category: r.category,
      minCredits: r.minCredits,
      codes: (r.codes || []).slice(),
      earned: 0,
      completedList: [],
      pendingList: []
    }));

    let totalEarnedInBuckets = 0;
    const FAIL_GRADES = ['F', 'FAIL', 'AB'];
    const passedCoursesFlat = (student.courses || []).filter(c =>
      c && c.code && !FAIL_GRADES.includes(String(c.grade || '').trim().toUpperCase())
    );
    const passedMapFlat = {};
    passedCoursesFlat.forEach(c => {
      const code = String(c.code || '').trim().toUpperCase();
      if (!code) return;
      const cr = parseFloat(c.credits || c.creditEarned || 0) || 0;
      if (!passedMapFlat[code] || cr > passedMapFlat[code].credits) {
        const cInfo = getCourseInfo(code);
        passedMapFlat[code] = { code, title: c.title || c.name || cInfo.name, credits: cr || cInfo.credits };
      }
    });

    const knownCodes = new Set();
    legacyAudit.slice(0, 3).forEach(cat => cat.codes.forEach(c => knownCodes.add(c.toUpperCase())));

    Object.values(passedMapFlat).forEach(pc => {
      const code = pc.code.toUpperCase();
      const cInfo = getCourseInfo(pc.code);
      const title = pc.title || cInfo.name;
      const cred = pc.credits || cInfo.credits;
      let catIndex = legacyAudit.findIndex((cat, i) => i < 3 && cat.codes.some(bc => bc.toUpperCase() === code));
      if (catIndex !== -1) {
        legacyAudit[catIndex].earned += pc.credits;
        totalEarnedInBuckets += pc.credits;
        legacyAudit[catIndex].completedList.push({ code: pc.code, title, cred });
      } else if (legacyAudit[3]) {
        const inCat4 = legacyAudit[3].codes.some(bc => bc.toUpperCase() === code);
        if (inCat4 || !knownCodes.has(code)) {
          legacyAudit[3].earned += pc.credits;
          totalEarnedInBuckets += pc.credits;
          legacyAudit[3].completedList.push({ code: pc.code, title, cred });
        }
      }
    });

    legacyAudit.slice(0, 3).forEach(cat => {
      cat.codes.forEach(code => {
        if (code === 'OPEN_ELECTIVE_CATCHALL') return;
        if (!cat.completedList.some(comp => comp.code === code)) {
          const pInfo = getCourseInfo(code);
          cat.pendingList.push({ code, title: pInfo.name, cred: pInfo.credits });
        }
      });
    });
    if (legacyAudit[3]) {
      legacyAudit[3].pendingList.push({ code: "OPEN_ELECTIVE", title: "Choose any eligible open elective", cred: "Var" });
    }

    const allCategoriesMet = legacyAudit.every(cat => cat.earned >= cat.minCredits);
    const isEligible = allCategoriesMet && (totalEarnedInBuckets >= 80);
    return { isSupported: true, audit: legacyAudit, isEligible, totalEarnedInBuckets, isHierarchical: false };
  }
}

window.showTab = function(tabId) {
  // Determine prefix based on visible container
  var pfx = 'sdash-';
  var adminDetail = document.getElementById('admin-student-detail-view');
  var facDetail = document.getElementById('faculty-student-detail-view');
  if (adminDetail && adminDetail.style.display !== 'none') {
    pfx = 'admin-';
  } else if (facDetail && facDetail.style.display !== 'none') {
    pfx = 'finj-';
  }
  
  var targetTab = document.getElementById(pfx + tabId);
  var otherTab = document.getElementById(pfx + 'courses-tab');
  
  if (targetTab && otherTab) {
    otherTab.style.display = 'none';
    targetTab.style.display = 'block';
  }
  
  // Update button active styling
  var tabsEl = document.getElementById(pfx + 'sem-tabs');
  if (tabsEl) {
    tabsEl.querySelectorAll('.tab, .tab-btn').forEach(function (t) { t.classList.remove('active'); });
    var activeBtn = Array.from(tabsEl.querySelectorAll('.tab, .tab-btn')).find(function (btn) {
      var oc = btn.getAttribute('onclick');
      return oc && oc.includes(tabId);
    });
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }
};

/**
 * renderStudentDashboard — Dynamic Rendering Engine (V8.1 Core Fix).
 *
 * Renders the full tabbed student profile UI (profile card, Smart Backlog tabs,
 * semester tabs, course table) into ANY target container element.
 *
 * @param {object} student         - The student data object.
 * @param {string} [targetContainerId] - ID of the container to render into.
 *   Defaults to 'student-dash-content' for the student login flow.
 *   Pass 'faculty-injected-student-data' to draw inside the faculty detail view
 *   without interfering with the student login DOM.
 */
window.showStudentTab = function(tabId, btnElement) {
    let pfx = 'sdash-';
    var adminDetail = document.getElementById('admin-student-detail-view');
    var facDetail = document.getElementById('faculty-student-detail-view');
    if (adminDetail && adminDetail.style.display !== 'none') {
        pfx = 'admin-';
    } else if (facDetail && facDetail.style.display !== 'none') {
        pfx = 'finj-';
    }
    
    // Hide all tab contents under this prefix
    const tabContainer = btnElement.parentNode.parentNode;
    if (tabContainer) {
        tabContainer.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
    }
    
    // Show the selected tab
    const targetTab = document.getElementById(pfx + tabId) || document.getElementById(tabId);
    if (targetTab) {
        targetTab.style.display = 'block';
    }
    
    // Update active styling on buttons
    btnElement.parentNode.querySelectorAll('.tab-btn, .tab').forEach(btn => {
        btn.classList.remove('active');
    });
    btnElement.classList.add('active');
};

function renderStudentDashboard(student, targetContainerId) {
  targetContainerId = targetContainerId || 'student-dash-content';
  var container = document.getElementById(targetContainerId);
  if (!container) return;

  var FAIL_GRADES = ['F', 'FAIL', 'AB'];
  var validCourses = (student.courses || []).filter(function (c) {
    return c && c.code && c.code !== 'nan' && c.code.trim() !== '';
  });

  var cgpaVal = parseFloat(student.cgpa);
  var cgpa = (!isNaN(cgpaVal) && cgpaVal !== 0) ? cgpaVal.toFixed(2) : 'N/A';
  var creditsVal = parseFloat(student.totalCredits || student.totalCreditEarned);
  var credits = (!isNaN(creditsVal) && creditsVal !== 0) ? String(creditsVal) : 'N/A';
  var initials = (student.name || 'S').charAt(0);

  var pfx = 'sdash-';
  if (targetContainerId === 'faculty-injected-student-data') pfx = 'finj-';
  else if (targetContainerId === 'admin-injected-student-data') pfx = 'admin-';

  var courseGroups = {};
  validCourses.forEach(function (c) {
    var key = String(c.code || '').trim().toUpperCase();
    if (!courseGroups[key]) courseGroups[key] = [];
    courseGroups[key].push(c);
  });

  var activeBacklogs = [];
  var clearedBacklogs = [];

  Object.keys(courseGroups).forEach(function (code) {
    var attempts = courseGroups[code];
    var hasFail = attempts.some(function (c) { return FAIL_GRADES.includes(String(c.grade || '').toUpperCase().trim()); });
    var hasPass = attempts.some(function (c) { return !FAIL_GRADES.includes(String(c.grade || '').toUpperCase().trim()); });
    if (hasFail && !hasPass) {
      var latest = attempts.filter(function (c) { return FAIL_GRADES.includes(String(c.grade || '').toUpperCase().trim()); });
      activeBacklogs.push(latest[latest.length - 1]);
    } else if (hasFail && hasPass) {
      attempts.filter(function (c) { return !FAIL_GRADES.includes(String(c.grade || '').toUpperCase().trim()); })
        .forEach(function (c) { clearedBacklogs.push(c); });
    }
  });

  const uniqueSems = [...new Set(student.courses.map(c => String(c.sem).trim()))]
    .filter(s => s && s !== '' && s.toLowerCase() !== 'unknown' && s.toLowerCase() !== 'undefined' && s.toLowerCase() !== 'null');

  let tabsNavHTML = `<button class="tab-btn tab active" onclick="showStudentTab('all-sem-tab', this)">All Semesters</button>`;
  uniqueSems.forEach(s => {
      tabsNavHTML += `<button class="tab-btn tab" onclick="showStudentTab('sem-${s}-tab', this)">${SEM_MAP[s] || s}</button>`;
  });
  if (activeBacklogs.length > 0) {
      tabsNavHTML += `<button class="tab-btn tab" onclick="showStudentTab('active-backlogs-tab', this)">🔴 Active Backlogs</button>`;
  }
  if (clearedBacklogs.length > 0) {
      tabsNavHTML += `<button class="tab-btn tab" onclick="showStudentTab('cleared-backlogs-tab', this)">🟢 Cleared Backlogs</button>`;
  }
  tabsNavHTML += `<button class="tab-btn tab" onclick="showStudentTab('audit-tab', this)" style="background:#3b82f6; color:white;">🎓 Degree Audit</button>`;

  // 1. Build All Semesters Table (OPTIMIZED via batching string)
  let allSemHTML = `<div class="table-responsive"><table style="width:100%; border-collapse:collapse;">
    <thead style="background:#1e293b; color:white;">
      <tr><th>Sem</th><th>Course Code</th><th>Course Title</th><th>Credits</th><th>Grade</th></tr>
    </thead>
    <tbody>`;
  
  const sortedCourses = [...student.courses].sort((a, b) => String(a.sem).localeCompare(String(b.sem)));
  sortedCourses.forEach(c => {
    const gradeColor = ['F', 'FAIL', 'AB'].includes(String(c.grade).toUpperCase()) ? 'color:#ef4444; font-weight:bold;' : 'color:#10b981;';
    allSemHTML += `<tr>
      <td style="padding:8px; border:1px solid #475569;">${c.sem}</td>
      <td style="padding:8px; border:1px solid #475569; font-weight:bold;">${c.code}</td>
      <td style="padding:8px; border:1px solid #475569;">${c.title || getCourseInfo(c.code).name}</td>
      <td style="padding:8px; border:1px solid #475569; text-align:center;">${c.credits || getCourseInfo(c.code).credits}</td>
      <td style="padding:8px; border:1px solid #475569; text-align:center; ${gradeColor}">${c.grade}</td>
    </tr>`;
  });
  allSemHTML += `</tbody></table></div>`;

  // 2. Build Semester Tables
  let semHTML = {};
  uniqueSems.forEach(s => {
      const semCourses = student.courses.filter(c => String(c.sem).trim() === s);
      let html = `
        <div class="card">
          <div class="card-head">
            <div class="card-title">${SEM_MAP[s] || s}</div>
            <div class="badge">${semCourses.length} course${semCourses.length !== 1 ? 's' : ''}</div>
          </div>
          <div class="tbl-wrap">
            <div class="table-responsive">
              <table style="width:100%; border-collapse:collapse;">
                <thead style="background:#1e293b; color:white;">
                  <tr><th>Course Code</th><th>Course Title</th><th>Credits</th><th>Grade</th></tr>
                </thead>
                <tbody>`;
      semCourses.forEach(c => {
          const gradeColor = ['F', 'FAIL', 'AB'].includes(String(c.grade).toUpperCase()) ? 'color:#ef4444; font-weight:bold;' : 'color:#10b981;';
          html += `<tr>
            <td style="padding:8px; border:1px solid #475569; font-weight:bold;">${c.code}</td>
            <td style="padding:8px; border:1px solid #475569;">${c.title || getCourseInfo(c.code).name}</td>
            <td style="padding:8px; border:1px solid #475569; text-align:center;">${c.credits || getCourseInfo(c.code).credits}</td>
            <td style="padding:8px; border:1px solid #475569; text-align:center; ${gradeColor}">${c.grade}</td>
          </tr>`;
      });
      html += `</tbody></table></div></div></div>`;
      semHTML[s] = html;
  });

  // 3. Build Backlogs Tables
  let activeBacklogsHTML = "";
  if (activeBacklogs.length > 0) {
      activeBacklogsHTML = `
        <div class="card">
          <div class="card-head">
            <div class="card-title">🔴 Active Backlogs</div>
            <div class="badge">${activeBacklogs.length} course${activeBacklogs.length !== 1 ? 's' : ''}</div>
          </div>
          <div style="background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);border-radius:8px;padding:0.75rem 1rem;color:#dc2626;font-size:0.88rem;font-weight:600;margin:10px;">⚠️ These courses require re-examination.</div>
          <div class="tbl-wrap">
            <div class="table-responsive">
              <table style="width:100%; border-collapse:collapse;">
                <thead style="background:#1e293b; color:white;">
                  <tr><th>Course Code</th><th>Course Title</th><th>Credits</th><th>Grade</th></tr>
                </thead>
                <tbody>`;
      activeBacklogs.forEach(c => {
          activeBacklogsHTML += `<tr>
            <td style="padding:8px; border:1px solid #475569; font-weight:bold;">${c.code}</td>
            <td style="padding:8px; border:1px solid #475569;">${c.title || getCourseInfo(c.code).name}</td>
            <td style="padding:8px; border:1px solid #475569; text-align:center;">${c.credits || getCourseInfo(c.code).credits}</td>
            <td style="padding:8px; border:1px solid #475569; text-align:center; color:#ef4444; font-weight:bold;">${c.grade}</td>
          </tr>`;
      });
      activeBacklogsHTML += `</tbody></table></div></div></div>`;
  }

  let clearedBacklogsHTML = "";
  if (clearedBacklogs.length > 0) {
      clearedBacklogsHTML = `
        <div class="card">
          <div class="card-head">
            <div class="card-title">🟢 Cleared Backlogs</div>
            <div class="badge">${clearedBacklogs.length} course${clearedBacklogs.length !== 1 ? 's' : ''}</div>
          </div>
          <div style="background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.25);border-radius:8px;padding:0.75rem 1rem;color:#16a34a;font-size:0.88rem;font-weight:600;margin:10px;">✓ Historical backlogs successfully cleared.</div>
          <div class="tbl-wrap">
            <div class="table-responsive">
              <table style="width:100%; border-collapse:collapse;">
                <thead style="background:#1e293b; color:white;">
                  <tr><th>Course Code</th><th>Course Title</th><th>Credits</th><th>Grade</th></tr>
                </thead>
                <tbody>`;
      clearedBacklogs.forEach(c => {
          clearedBacklogsHTML += `<tr>
            <td style="padding:8px; border:1px solid #475569; font-weight:bold;">${c.code}</td>
            <td style="padding:8px; border:1px solid #475569;">${c.title || getCourseInfo(c.code).name}</td>
            <td style="padding:8px; border:1px solid #475569; text-align:center;">${c.credits || getCourseInfo(c.code).credits}</td>
            <td style="padding:8px; border:1px solid #475569; text-align:center; color:#10b981;">${c.grade}</td>
          </tr>`;
      });
      clearedBacklogsHTML += `</tbody></table></div></div></div>`;
  }

  container.innerHTML = `
    <div class="profile-card">
      <div class="avatar">${esc(initials)}</div>
      <div style="flex:1;min-width:0">
        <div class="pinfo-name">${esc(student.name)}</div>
        <div class="pinfo-meta">
          <span>${esc(student.program || '')}</span>
          <span>${student.school ? ' · ' + esc(student.school) : ''}</span>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-chip"><div class="stat-val gold">${esc(cgpa)}</div><div class="stat-lbl">CGPA</div></div>
        <div class="stat-chip"><div class="stat-val green">${esc(credits)}</div><div class="stat-lbl">Credits Earned</div></div>
        <div class="stat-chip"><div class="stat-val blue">${validCourses.length}</div><div class="stat-lbl">Courses</div></div>
      </div>
    </div>
    <div class="sem-tabs" id="${pfx}sem-tabs">${tabsNavHTML}</div>
    <div class="sem-summary-banner" id="${pfx}sem-summary-banner"></div>
    
    <div id="${pfx}all-sem-tab" class="tab-content" style="display:block;"></div>
    <div id="${pfx}audit-tab" class="tab-content" style="display:none;"></div>
    ${uniqueSems.map(s => `<div id="${pfx}sem-${s}-tab" class="tab-content" style="display:none;"></div>`).join('')}
    ${activeBacklogs.length > 0 ? `<div id="${pfx}active-backlogs-tab" class="tab-content" style="display:none;"></div>` : ''}
    ${clearedBacklogs.length > 0 ? `<div id="${pfx}cleared-backlogs-tab" class="tab-content" style="display:none;"></div>` : ''}
  `;

  const allSemContainer = document.getElementById(pfx + 'all-sem-tab');
  if (allSemContainer) allSemContainer.innerHTML = allSemHTML;

  uniqueSems.forEach(s => {
      const semContainer = document.getElementById(pfx + `sem-${s}-tab`);
      if (semContainer) semContainer.innerHTML = semHTML[s];
  });

  if (activeBacklogs.length > 0) {
      const activeContainer = document.getElementById(pfx + 'active-backlogs-tab');
      if (activeContainer) activeContainer.innerHTML = activeBacklogsHTML;
  }
  if (clearedBacklogs.length > 0) {
      const clearedContainer = document.getElementById(pfx + 'cleared-backlogs-tab');
      if (clearedContainer) clearedContainer.innerHTML = clearedBacklogsHTML;
  }

  updateSummaryBanner(student.courses, 'all', pfx);
  renderDedicatedBacklogBanner(student.courses, 'all', pfx);

  // ── Build Expandable Degree Audit Tab Content ───────────────────────────────
  const auditContainer = document.getElementById(pfx + 'audit-tab');
  if (auditContainer) {
    const auditResult = evaluateDegree(student);
    
    if (!auditResult || !auditResult.isSupported || !auditResult.audit || auditResult.audit.length === 0) {
      const b = String(student.batch || "Unknown").trim();
      const p = String(student.program || "Unknown").trim();
      
      let messageTitle = "📭 Curriculum Not Mapped";
      let messageBody = `No curriculum rules found for <strong>${b} ${p}</strong>.`;
      let messageSub = "Administrators must add this to the System Setup and upload the curriculum.";
      
      if (auditResult && auditResult.isSystemKnown) {
          messageTitle = "📂 Curriculum is Empty";
          messageBody = `The program <strong>${b} ${p}</strong> exists in the system, but no subjects have been uploaded to it yet.`;
          messageSub = "Please go to the Admin Panel > Manage Curriculum, select this program, and click 'Bulk Upload Excel Curriculum'.";
      }

      auditContainer.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; background: var(--s2, #1e293b); border: 2px dashed #475569; border-radius: 8px; margin-top: 20px;">
          <h2 style="color: #94a3b8; margin-bottom: 10px;">${messageTitle}</h2>
          <p style="color: #cbd5e1; font-size: 1.1em;">${messageBody}</p>
          <p style="color: #64748b; font-size: 0.9em; margin-top: 15px;">${messageSub}</p>
        </div>`;
    } else {
      let auditHTML = `<h3>Curriculum Degree Audit</h3>`;
      auditResult.audit.forEach(main => {
        const mainEarned = main.earned || 0;
        const mainStatus = mainEarned >= main.minCredits ? "✅ Cleared" : `⚠️ Missing ${main.minCredits - mainEarned}`;
        const mainColor = mainEarned >= main.minCredits ? "#15803d" : "#b45309";

        if (auditResult.isHierarchical && Array.isArray(main.subCategories)) {
          auditHTML += `
            <details style="margin-bottom: 12px; background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 8px; padding: 10px;">
              <summary style="font-weight: bold; font-size: 1.1em; cursor: pointer; color: ${mainColor};">
                📁 ${main.category} | Required: ${main.minCredits} | Earned: ${mainEarned} | ${mainStatus}
              </summary>
              <div style="margin-top: 15px; padding-left: 15px; border-left: 3px solid #e2e8f0;">
          `;
          main.subCategories.forEach(sub => {
            const subEarned = sub.earned || 0;
            const hasBacklog = (sub.codes || []).some(code => window.activeBacklogsGlobal && window.activeBacklogsGlobal.some(b => b.code === code));
            let subBg, subBorder, subIcon;
            if (hasBacklog) { subBg = "#fef2f2"; subBorder = "#ef4444"; subIcon = "🚨 Backlog"; }
            else if (subEarned >= sub.minCredits) { subBg = "#f0fdf4"; subBorder = "#22c55e"; subIcon = "✅ Cleared"; }
            else { subBg = "#fffbeb"; subBorder = "#f59e0b"; subIcon = "⏳ Pending"; }

            let compRows = (sub.completedList || []).map(c => `<tr><td style="border:1px solid #ccc;padding:4px;">${esc(c.code)}</td><td style="border:1px solid #ccc;padding:4px;">${esc(c.title)}</td><td style="border:1px solid #ccc;padding:4px;">${esc(String(c.cred))}</td></tr>`).join('');
            let pendRows = (sub.pendingList || []).map(c => `<tr><td style="border:1px solid #ccc;padding:4px;">${esc(c.code)}</td><td style="border:1px solid #ccc;padding:4px;">${esc(c.title)}</td><td style="border:1px solid #ccc;padding:4px;">${esc(String(c.cred))}</td></tr>`).join('');

            auditHTML += `
              <details style="margin-bottom: 10px; background: ${subBg}; border: 1px solid ${subBorder}; padding: 10px; border-radius: 6px;">
                <summary style="font-weight: bold; cursor: pointer;">
                  📄 ${sub.name} (Min ${sub.minCredits}) — Earned: ${subEarned} [${subIcon}]
                </summary>
                <div style="margin-top: 10px;">
                  <div class="table-responsive"><table style="width:100%; border-collapse: collapse; font-size: 0.85em; margin-bottom: 10px; background: white;">
                    <thead style="background: rgba(22,163,74,0.15); color:#15803d;"><tr><th style="border:1px solid #ccc;padding:4px;">Code</th><th style="border:1px solid #ccc;padding:4px;">Completed</th><th style="border:1px solid #ccc;padding:4px;">Credits</th></tr></thead>
                    <tbody>${compRows || '<tr><td colspan="3" style="text-align:center;padding:4px;">None</td></tr>'}</tbody>
                  </table></div>
                  <div class="table-responsive"><table style="width:100%; border-collapse: collapse; font-size: 0.85em; background: white;">
                    <thead style="background: rgba(245,158,11,0.15); color:#b45309;"><tr><th style="border:1px solid #ccc;padding:4px;">Code</th><th style="border:1px solid #ccc;padding:4px;">Pending Options</th><th style="border:1px solid #ccc;padding:4px;">Credits</th></tr></thead>
                    <tbody>${pendRows || '<tr><td colspan="3" style="text-align:center;padding:4px;">Requirements met</td></tr>'}</tbody>
                  </table></div>
                </div>
              </details>
            `;
          });
          auditHTML += `</div></details>`;
        } else {
          // Legacy flat rendering (V1.0 format fallback)
          const hasBacklogInBucket = (main.codes || []).some(code => window.activeBacklogsGlobal && window.activeBacklogsGlobal.some(b => b.code === code));
          let boxStyle, titleColor, statusHTML, pendingBg, pendingTitle;
          if (hasBacklogInBucket) { boxStyle = "background:#fef2f2;border:2px solid #ef4444;"; titleColor = "#b91c1c"; statusHTML = "❌ Backlog Requires Clearance"; pendingTitle = "🚨 Active Backlogs"; pendingBg = "rgba(239,68,68,0.1)"; }
          else if (mainEarned >= main.minCredits) { boxStyle = "background:#f0fdf4;border:2px solid #22c55e;"; titleColor = "#15803d"; statusHTML = "✅ Cleared"; pendingTitle = "Remaining Options"; pendingBg = "rgba(22,163,74,0.05)"; }
          else { boxStyle = "background:#fffbeb;border:2px solid #f59e0b;"; titleColor = "#b45309"; statusHTML = `⚠️ Missing ${main.minCredits - mainEarned} Credits`; pendingTitle = "⏳ Pending Courses"; pendingBg = "rgba(245,158,11,0.1)"; }
          let completedRows = (main.completedList || []).map(c => `<tr><td style="border:1px solid #ccc;padding:6px;">${esc(c.code)}</td><td style="border:1px solid #ccc;padding:6px;">${esc(c.title)}</td><td style="border:1px solid #ccc;padding:6px;">${esc(String(c.cred))}</td></tr>`).join('');
          if (!completedRows) completedRows = `<tr><td colspan="3" style="border:1px solid #ccc;padding:6px;text-align:center;color:#666;">No courses completed yet</td></tr>`;
          let pendingRows = (main.pendingList || []).map(c => `<tr><td style="border:1px solid #ccc;padding:6px;">${esc(c.code)}</td><td style="border:1px solid #ccc;padding:6px;">${esc(c.title)}</td><td style="border:1px solid #ccc;padding:6px;">${esc(String(c.cred))}</td></tr>`).join('');
          if (!pendingRows) pendingRows = `<tr><td colspan="3" style="border:1px solid #ccc;padding:6px;text-align:center;color:#666;">All requirements met!</td></tr>`;
          auditHTML += `
            <details style="margin-bottom:10px;${boxStyle}padding:12px;border-radius:6px;">
              <summary style="font-weight:bold;cursor:pointer;list-style-position:inside;color:${titleColor};">${main.category} | Required:${main.minCredits} | Earned:${mainEarned} | ${statusHTML}</summary>
              <div style="margin-top:15px;padding-left:20px;font-size:0.9em;">
                <div class="table-responsive"><table style="border-collapse:collapse;width:100%;margin-bottom:15px;font-size:0.9em;"><thead style="background:rgba(22,163,74,0.15);color:#15803d;"><tr><th style="border:1px solid #ccc;padding:6px;">Code</th><th style="border:1px solid #ccc;padding:6px;">Completed</th><th style="border:1px solid #ccc;padding:6px;">Credits</th></tr></thead><tbody>${completedRows}</tbody></table></div>
                <div class="table-responsive"><table style="border-collapse:collapse;width:100%;margin-bottom:5px;font-size:0.9em;"><thead style="background:${pendingBg};color:${titleColor};"><tr><th style="border:1px solid #ccc;padding:6px;">Code</th><th style="border:1px solid #ccc;padding:6px;">${pendingTitle}</th><th style="border:1px solid #ccc;padding:6px;">Credits</th></tr></thead><tbody>${pendingRows}</tbody></table></div>
              </div>
            </details>
          `;
        }
      });
      auditContainer.innerHTML = auditHTML;
    }
  }
}

/**
 * renderFacultyStudentView — mirrors renderStudentDash but targets the faculty-prefixed DOM elements.
 * V8.0: Ensures 'Back to Directory' button is injected into the detail container + full Smart Backlog Engine.
 * V8.1: Kept for backward compat; primary path now uses renderStudentDashboard via openFacultyStudentView.
 */
function renderFacultyStudentView(student) {
  // ── Inject / refresh Back button at the top of detail view ────────────────
  var detailView = document.getElementById('faculty-student-detail-view');
  if (detailView) {
    var existingBack = document.getElementById('faculty-back-btn-injected');
    if (existingBack) existingBack.remove();
    var backBtn = document.createElement('button');
    backBtn.id = 'faculty-back-btn-injected';
    backBtn.textContent = '← Back to Directory';
    backBtn.style.cssText = [
      'display:inline-flex;align-items:center;gap:0.4rem;',
      'margin-bottom:1rem;padding:0.45rem 1rem;',
      'border:1px solid var(--accent);border-radius:6px;',
      'background:rgba(2,132,199,0.08);color:var(--accent);',
      'font-family:var(--mono);font-size:0.78rem;cursor:pointer;',
      'transition:all 0.15s;'
    ].join('');
    backBtn.onmouseover = function () { this.style.background = 'var(--accent)'; this.style.color = '#fff'; };
    backBtn.onmouseout = function () { this.style.background = 'rgba(2,132,199,0.08)'; this.style.color = 'var(--accent)'; };
    backBtn.onclick = facultyBackToDirectory;
    detailView.insertBefore(backBtn, detailView.firstChild);
  }
  document.getElementById('faculty-dash-avatar').textContent = (student.name || 'S').charAt(0);
  document.getElementById('faculty-dash-name').textContent = student.name;
  document.getElementById('faculty-dash-program').textContent = student.program || '';
  document.getElementById('faculty-dash-school').textContent = student.school ? ' · ' + student.school : '';

  var cgpaVal = parseFloat(student.cgpa);
  document.getElementById('faculty-dash-cgpa').textContent =
    (!isNaN(cgpaVal) && cgpaVal !== 0) ? cgpaVal.toFixed(2) : (student.cgpa || 'N/A');

  var creditsVal = parseFloat(student.totalCredits || student.totalCreditEarned);
  document.getElementById('faculty-dash-ce').textContent =
    (!isNaN(creditsVal) && creditsVal !== 0) ? String(creditsVal) : 'N/A';

  var validCourses = (student.courses || []).filter(function (c) {
    return c && c.code && c.code !== 'nan' && c.code.trim() !== '';
  });
  document.getElementById('faculty-dash-nc').textContent = validCourses.length;

  // ── Smart Backlog Engine ──────────────────────────────────────────────────────
  var FAIL_GRADES = ['F', 'FAIL', 'AB'];
  var courseGroups = {};
  validCourses.forEach(function (c) {
    var key = String(c.code || '').trim().toUpperCase();
    if (!courseGroups[key]) courseGroups[key] = [];
    courseGroups[key].push(c);
  });

  var activeBacklogs = [];
  var clearedBacklogs = [];

  Object.keys(courseGroups).forEach(function (code) {
    var attempts = courseGroups[code];
    var hasFail = attempts.some(function (c) { return FAIL_GRADES.includes(String(c.grade || '').toUpperCase().trim()); });
    var hasPass = attempts.some(function (c) { return !FAIL_GRADES.includes(String(c.grade || '').toUpperCase().trim()); });

    if (hasFail && !hasPass) {
      var latest = attempts.filter(function (c) { return FAIL_GRADES.includes(String(c.grade || '').toUpperCase().trim()); });
      activeBacklogs.push(latest[latest.length - 1]);
    } else if (hasFail && hasPass) {
      attempts.filter(function (c) { return !FAIL_GRADES.includes(String(c.grade || '').toUpperCase().trim()); })
        .forEach(function (c) { clearedBacklogs.push(c); });
    }
  });

  // ── Unique Semesters ──────────────────────────────────────────────────────────
  const uniqueSems = [...new Set(student.courses.map(c => String(c.sem).trim()))]
    .filter(s => s && s !== '' && s.toLowerCase() !== 'unknown' && s.toLowerCase() !== 'undefined' && s.toLowerCase() !== 'null');


  var tabsEl = document.getElementById('faculty-sem-tabs');
  tabsEl.innerHTML = '';

  function makeFacultyTab(label, isAll, clickedSem, backlogType) {
    var btn = document.createElement('button');
    btn.className = 'tab' + (isAll ? ' active' : '');
    btn.textContent = label;
    btn.onclick = function () {
      document.querySelectorAll('#faculty-sem-tabs .tab').forEach(function (t) { t.classList.remove('active'); });
      btn.classList.add('active');

      var infoBanner = document.getElementById('faculty-backlog-info-banner');
      if (infoBanner) infoBanner.remove();

      if (backlogType === 'active') {
        renderCourses(activeBacklogs, '🔴 Active Backlogs', 'all', 'faculty-');
        var b = document.createElement('div');
        b.id = 'faculty-backlog-info-banner';
        b.style.cssText = 'background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);border-radius:8px;padding:0.75rem 1rem;color:#dc2626;font-size:0.88rem;font-weight:600;margin-bottom:0.75rem;';
        b.textContent = '⚠ These courses require re-examination.';
        var tblTitle = document.getElementById('faculty-tbl-title');
        if (tblTitle && tblTitle.parentNode) tblTitle.parentNode.insertBefore(b, tblTitle);
      } else if (backlogType === 'cleared') {
        renderCourses(clearedBacklogs, '🟢 Cleared Backlogs', 'all', 'faculty-');
        var b = document.createElement('div');
        b.id = 'faculty-backlog-info-banner';
        b.style.cssText = 'background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.25);border-radius:8px;padding:0.75rem 1rem;color:#16a34a;font-size:0.88rem;font-weight:600;margin-bottom:0.75rem;';
        b.textContent = '✓ Historical backlogs successfully cleared.';
        var tblTitle = document.getElementById('faculty-tbl-title');
        if (tblTitle && tblTitle.parentNode) tblTitle.parentNode.insertBefore(b, tblTitle);
      } else if (isAll) {
        renderCourses(student.courses, 'All Semesters', 'all', 'faculty-');
      } else {
        var filtered = student.courses.filter(function (c) { return c.sem === clickedSem; });
        renderCourses(filtered, label, clickedSem, 'faculty-');
      }
    };
    return btn;
  }

  // Tab 1: All Semesters
  tabsEl.appendChild(makeFacultyTab('All Semesters', true));
  // Tabs 2…n: Individual semesters
  uniqueSems.forEach(function (s) {
    var label = SEM_MAP[s] || s;
    tabsEl.appendChild(makeFacultyTab(label, false, s));
  });
  // 🔴 Active Backlogs tab (conditional)
  if (activeBacklogs.length > 0) {
    tabsEl.appendChild(makeFacultyTab('🔴 Active Backlogs', false, null, 'active'));
  }
  // 🟢 Cleared Backlogs tab (conditional)
  if (clearedBacklogs.length > 0) {
    tabsEl.appendChild(makeFacultyTab('🟢 Cleared Backlogs', false, null, 'cleared'));
  }

  renderCourses(student.courses, 'All Semesters', 'all', 'faculty-');
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN LOGIN  (admin-hidden.html)
// ═══════════════════════════════════════════════════════════════════════════════
async function adminLogin() {
  var email = sanitize(document.getElementById('a-email').value).trim().toLowerCase();
  var pass = sanitize(document.getElementById('a-pass').value);
  var errEl = document.getElementById('admin-err');

  if (!email || email !== 'itsgopalmail@gmail.com') {
    if (errEl) {
      errEl.textContent = '⚠ Access denied. Invalid admin email.';
      errEl.className = 'alert err';
      errEl.style.display = 'block';
    }
    return;
  }

  var limitMsg = checkRateLimit('admin');
  if (limitMsg) {
    if (errEl) { errEl.textContent = limitMsg; errEl.style.display = 'block'; }
    return;
  }

  var loginBtn = document.getElementById('admin-login-btn');
  if (loginBtn) loginBtn.disabled = true;
  if (errEl) {
    errEl.textContent = '⏳ Authenticating with backend…';
    errEl.className = 'alert info';
    errEl.style.display = 'block';
  }

  var gasUrl = GAS_URL;

  try {
    var response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'verifyadmin', email: email, password: pass })
    });
    var data = await response.json();

    if (data && data.status === 'success') {
      clearAttempts('admin');
      sessionStorage.setItem(ADMIN_SESSION, pass); // Store raw password dynamically in session cache
      window.currentAdminPassword = pass;           // V14.0: global for instant wipes without re-prompting
      showPage('admin-dash');
      loadAdminData();
    } else {
      recordFailedAttempt('admin');
      if (errEl) {
        errEl.textContent = '⚠ ' + (data.error || 'Wrong admin credentials. Please try again.');
        errEl.className = 'alert err';
        errEl.style.display = 'block';
        errEl.classList.remove('shake');
        void errEl.offsetWidth;
        errEl.classList.add('shake');
      }
      document.getElementById('a-pass').value = '';
    }
  } catch (err) {
    if (errEl) {
      errEl.textContent = '✗ Connection error: ' + err.message;
      errEl.className = 'alert err';
    }
  } finally {
    if (loginBtn) loginBtn.disabled = false;
  }
}

function adminLogout() {
  sessionStorage.removeItem(ADMIN_SESSION);
  window.location.href = 'index.html';
}

// Guard: if this is admin-hidden.html and session is not set, stay on login page
(function guardAdmin() {
  if (document.getElementById('admin-login') && document.getElementById('admin-dash')) {
    if (!sessionStorage.getItem(ADMIN_SESSION)) {
      showPage('admin-login');
      setTimeout(function () {
        var p = document.getElementById('a-pass');
        if (p) p.focus();
      }, 150);
    } else {
      showPage('admin-dash');
      loadAdminData();
    }
  }
})();

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
var _allStudents = [];

async function loadAdminData() {
  var tbody = document.getElementById('admin-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted)"><span class="spinner"></span> Loading from backend…</td></tr>';

  var gasUrl = GAS_URL;

  try {
    var adminPassword = sessionStorage.getItem(ADMIN_SESSION) || '';
    var data = await gasJsonp(gasUrl + '?action=load&adminPassword=' + encodeURIComponent(adminPassword), 15000);
    if (!Array.isArray(data)) throw new Error('Unexpected response from backend.');
    _allStudents = data;
    populateFilterDropdowns(_allStudents);
    renderAdminTable(_allStudents);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--red)">✗ Failed to load: ' + esc(err.message) + '</td></tr>';
  }
}

function renderAdminTable(students) {
  var countEl = document.getElementById('total-stu');
  if (countEl) countEl.textContent = students.length;

  var tbody = document.getElementById('admin-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!students.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--muted)">No students found.</td></tr>';
    return;
  }

  students.forEach(function (s, i) {
    var courses = (s.courses || []).filter(function (c) {
      return c && c.code && c.code !== 'nan';
    });
    var tr = document.createElement('tr');
    tr.innerHTML = [
      '<td style="font-family:var(--mono);font-size:0.75rem;color:var(--muted)">' + (i + 1) + '</td>',
      '<td class="td-code">' + esc(s.sen) + '</td>',
      '<td style="font-weight:500">' + esc(s.name) + '</td>',
      '<td style="font-family:var(--mono);font-size:0.8rem">' + courses.length + '</td>',
      '<td style="font-family:var(--mono);font-size:0.88rem;color:var(--gold)">' + (s.cgpa ? parseFloat(s.cgpa).toFixed(2) : '\u2014') + '</td>',
      '<td style="font-family:var(--mono);font-size:0.8rem;color:var(--green)">' + esc(String(s.totalCreditEarned || '\u2014')) + '</td>',
      '<td>' +
      '<span style="font-size:0.75rem;font-family:var(--mono);color:var(--muted)">Managed on server</span>' +
      ' <button onclick="quickClearPwd(\'' + esc(s.sen) + '\')" ' +
      'style="margin-left:0.4rem;font-family:var(--mono);font-size:0.62rem;padding:0.2rem 0.5rem;' +
      'border-radius:4px;border:1px solid rgba(239,68,68,0.4);background:transparent;color:#f87171;cursor:pointer"' +
      ' title="Clear password">\u2715</button>' +
      '</td>',
      '<td><button onclick="openAdminStudentView(\'' + esc(s.sen) + '\')" ' +
      'style="font-family:var(--mono);font-size:0.72rem;padding:0.25rem 0.65rem;border-radius:5px;' +
      'border:1px solid rgba(2,132,199,0.35);background:rgba(2,132,199,0.07);color:var(--accent);cursor:pointer;"' +
      ' onmouseover="this.style.background=\'rgba(2,132,199,0.18)\'" onmouseout="this.style.background=\'rgba(2,132,199,0.07)\'">View Results \u2192</button></td>'
    ].join('');
    tbody.appendChild(tr);
  });
}

// ── Admin Student View (V13.0) ───────────────────────────────────────────────
window.openAdminStudentView = function (sen) {
  var student = (_allStudents || []).find(function (s) { return s.sen === sen; });
  if (!student) return;
  var tableWrapper = document.getElementById('admin-table-wrapper');
  var detailView   = document.getElementById('admin-student-detail-view');
  if (tableWrapper) tableWrapper.style.display = 'none';
  if (detailView)   detailView.style.display   = 'block';
  renderStudentDashboard(student, 'admin-injected-student-data');
};

window.closeAdminStudentView = function () {
  var tableWrapper = document.getElementById('admin-table-wrapper');
  var detailView   = document.getElementById('admin-student-detail-view');
  var injected     = document.getElementById('admin-injected-student-data');
  if (detailView)   detailView.style.display   = 'none';
  if (tableWrapper) tableWrapper.style.display = 'block';
  if (injected)     injected.innerHTML = ''; // free memory
};

function filterStudents(query) {
  var lq = query.toLowerCase();
  var filtered = _allStudents.filter(function (s) {
    return s.name.toLowerCase().includes(lq) || s.sen.toLowerCase().includes(lq);
  });
  renderAdminTable(filtered);
}

function applyAdminFilters() {
  var query = ((document.getElementById('stu-search') || {}).value || '').trim().toLowerCase();
  var batchVal = ((document.getElementById('filter-batch') || {}).value || '').trim();
  var programVal = ((document.getElementById('filter-program') || {}).value || '').trim();

  var filtered = (_allStudents || []).filter(function (s) {
    var matchSearch = !query ||
      (s.sen  || '').toLowerCase().includes(query) ||
      (s.name || '').toLowerCase().includes(query);
    var matchBatch   = !batchVal   || String(s.batch   || '').trim() === batchVal;
    var matchProgram = !programVal || String(s.program || '').trim() === programVal;
    return matchSearch && matchBatch && matchProgram;
  });

  // Apply Exact Credit Filter (V16.0)
  const exactCreditDropdown = document.getElementById('filter-credit-exact');
  const exactCredit = exactCreditDropdown ? exactCreditDropdown.value : "";
  if (exactCredit !== "") {
    filtered = filtered.filter(s => parseInt(s.totalCredits) === parseInt(exactCredit));
  }

  // Apply Sorting (V16.0) — Clone array before sorting
  const sortCreditsDropdown = document.getElementById('sort-credits');
  const sortOrder = sortCreditsDropdown ? sortCreditsDropdown.value : "";
  if (sortOrder === "desc") {
    filtered = [...filtered].sort((a, b) => parseFloat(b.totalCredits) - parseFloat(a.totalCredits));
  } else if (sortOrder === "asc") {
    filtered = [...filtered].sort((a, b) => parseFloat(a.totalCredits) - parseFloat(b.totalCredits));
  }

  renderAdminTable(filtered);
}

function quickClearPwd(sen) {
  document.getElementById('reset-sen-input').value = sen;
  clearPassword();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN — GAS CONNECTION TEST
// ═══════════════════════════════════════════════════════════════════════════════
async function testGasConnection() {
  var url = GAS_URL;
  var statusEl = document.getElementById('gas-status');
  var btn = document.getElementById('test-gas-btn');
  if (statusEl) statusEl.textContent = '⏳ Testing…';
  if (btn) btn.disabled = true;
  try {
    var data = await gasJsonp(url + '?action=ping', 10000);
    if (data && (data.status === 'pong' || data.status === 'ok')) {
      if (statusEl) statusEl.innerHTML = '✅ <span style="color:var(--green)">Connected! Students can log in from any device.</span>';
      loadAdminData();
    } else {
      if (statusEl) statusEl.innerHTML = '⚠ <span style="color:var(--orange)">Got a response but unexpected format. Redeploy backend.gs.</span>';
    }
  } catch (err) {
    if (statusEl) statusEl.innerHTML = '❌ <span style="color:var(--red)">Could not reach URL. Check the URL and that deployment access is set to "Anyone".</span>';
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN — CLEAR STUDENT PASSWORD
// ═══════════════════════════════════════════════════════════════════════════════
async function clearPassword() {
  var senRaw = document.getElementById('reset-sen-input').value;
  var sen = sanitize(senRaw).toUpperCase();
  var statusEl = document.getElementById('reset-status');
  var btn = document.getElementById('btn-reset-pwd');

  if (!sen) { if (statusEl) statusEl.textContent = '⚠ Please enter a SEN.'; return; }

  if (!confirm('Clear password for ' + sen + '? The student will be prompted to create a new one.')) return;

  if (btn) btn.disabled = true;
  if (statusEl) statusEl.textContent = '⏳ Clearing…';

  try {
    var adminPassword = sessionStorage.getItem(ADMIN_SESSION) || '';

    // Use readable POST (not no-cors) so we can confirm success/failure from backend
    var resp = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'clearpassword', sen: sen, adminPassword: adminPassword })
    });
    var result = await resp.json();

    if (result && result.status === 'success') {
      if (statusEl) statusEl.innerHTML =
        '<span style="color:var(--green)">✓ Password cleared for <strong>' + esc(sen) +
        '</strong>. Student will be prompted to create a new one on next login.</span>';
    } else {
      if (statusEl) statusEl.innerHTML =
        '<span style="color:var(--red)">⚠ ' +
        esc((result && result.message) || 'Backend did not confirm clear. Check admin password and try again.') +
        '</span>';
    }
    document.getElementById('reset-sen-input').value = '';
    setTimeout(loadAdminData, 1200);
  } catch (err) {
    // Fallback: if readable fetch fails (e.g. CORS), attempt blind post and assume success
    try {
      await gasPost({ action: 'clearpassword', sen: sen, adminPassword: sessionStorage.getItem(ADMIN_SESSION) || '' });
      if (statusEl) statusEl.textContent = '✓ Clear request sent for ' + sen + ' (response unreadable — check backend logs).';
      setTimeout(loadAdminData, 1500);
    } catch (e2) {
      if (statusEl) statusEl.textContent = '✗ Error: ' + err.message;
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN — EXCEL UPLOAD & PARSE (client-side via SheetJS)
// ═══════════════════════════════════════════════════════════════════════════════

function handleFileDrop(e) {
  e.preventDefault();
  var zone = document.getElementById('upload-zone');
  if (zone) zone.classList.remove('drag');
  var files = e.dataTransfer.files;
  if (files && files.length > 0) {
    handleFilesSelected(files);
  }
}

// V11.0: Store selected files globally for tagging
window.selectedUploadFiles = [];
window.selectedUploadTags = [];

function handleFilesSelected(files) {
  window.selectedUploadFiles = Array.from(files);
  var container = document.getElementById('file-tagging-container');
  if (!container) return;
  container.innerHTML = '';

  if (window.selectedUploadFiles.length === 0) {
    var btn = document.getElementById('btn-upload-process');
    if (btn) btn.style.display = 'none';
    return;
  }

  window.selectedUploadFiles.forEach(function (file, index) {
    var row = document.createElement('div');
    row.className = 'file-tag-row';
    row.setAttribute('data-index', index);
    row.style.cssText = 'padding: 10px; border: 1px solid var(--border); background: var(--s2); border-radius: 6px; margin-bottom: 5px;';
    row.innerHTML = [
      '<div style="font-weight: bold; margin-bottom: 5px;">📄 ' + esc(file.name) + '</div>',
      '<div style="display: flex; gap: 10px;">',
      '  <select class="file-year-select" required style="padding: 0.35rem 0.5rem; background: var(--s3); border: 1px solid var(--border); border-radius: 4px; color: var(--text); font-family: var(--mono); font-size: 0.8rem; cursor: pointer;">',
      '    <option value="">-- Year --</option>',
      '    <option value="2023">2023</option>',
      '    <option value="2024">2024</option>',
      '    <option value="2025">2025</option>',
      '    <option value="2026">2026</option>',
      '  </select>',
      '  <select class="file-program-select" required style="padding: 0.35rem 0.5rem; background: var(--s3); border: 1px solid var(--border); border-radius: 4px; color: var(--text); font-family: var(--mono); font-size: 0.8rem; cursor: pointer;">',
      '    <option value="">-- Program --</option>',
      '    <option value="B.C.A">B.C.A</option>',
      '    <option value="MCA">MCA</option>',
      '    <option value="MSc DS">MSc DS</option>',
      '    <option value="MSc CS">MSc CS</option>',
      '  </select>',
      '</div>'
    ].join('\n');
    container.appendChild(row);
  });

  var btn = document.getElementById('btn-upload-process');
  if (btn) btn.style.display = 'block';
}

async function triggerTaggedUpload() {
  if (!window.selectedUploadFiles || window.selectedUploadFiles.length === 0) {
    alert("No files selected.");
    return;
  }

  var container = document.getElementById('file-tagging-container');
  var rows = container.querySelectorAll('.file-tag-row');
  var allFilled = true;
  var tags = [];

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var idx = parseInt(row.getAttribute('data-index'), 10);
    var yearSelect = row.querySelector('.file-year-select');
    var programSelect = row.querySelector('.file-program-select');
    var yearVal = yearSelect ? yearSelect.value : '';
    var programVal = programSelect ? programSelect.value : '';

    if (!yearVal || !programVal) {
      allFilled = false;
      break;
    }

    tags[idx] = { batch: yearVal, program: programVal };
  }

  if (!allFilled) {
    alert("Please select Year and Program for all files before uploading!");
    return;
  }

  window.selectedUploadTags = tags;
  await handleFileUpload(window.selectedUploadFiles);
}

async function handleFileUpload(files) {
  if (!files || files.length === 0) return;
  var fileList = Array.from(files);
  var alertEl = document.getElementById('upload-alert');

  function setAlert(type, msg) {
    if (!alertEl) return;
    alertEl.className = 'alert ' + type;
    alertEl.innerHTML = msg;
    alertEl.style.display = 'block';
  }

  setAlert('info', '<span class="spinner"></span>Reading ' + fileList.length + ' Excel file(s)…');

  var consolidatedMap = {};
  var filesReadCount = 0;

  fileList.forEach(function (file, index) {
    // Capture synchronously before async FileReader call
    const fileBatch = document.querySelectorAll('.file-year-select')[index].value.trim();
    const fileProgram = document.querySelectorAll('.file-program-select')[index].value.trim();

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        var arrayBuffer = e.target.result;
        var studentsArray = parseExcelToStudents(arrayBuffer, function (msg) {
          setAlert('info', '<span class="spinner"></span>[' + (filesReadCount + 1) + '/' + fileList.length + '] ' + esc(file.name) + ': ' + msg);
        });

        studentsArray.forEach(function (s) {
          var sen = s.sen;
          if (!consolidatedMap[sen]) {
            consolidatedMap[sen] = {
              sen: sen,
              name: s.name,
              program: fileProgram,
              batch: fileBatch,
              school: s.school,
              cgpa: s.cgpa || 0,
              totalCredits: s.totalCredits || 0,
              totalCreditEarned: s.totalCreditEarned || 0,
              courses: []
            };
          }
          var target = consolidatedMap[sen];
          if (s.name) target.name = s.name;
          target.program = fileProgram;
          target.batch = fileBatch;
          if (s.school) target.school = s.school;

          var sCgpa = parseFloat(s.cgpa || 0);
          var targetCgpa = parseFloat(target.cgpa || 0);
          if (!isNaN(sCgpa) && sCgpa > targetCgpa) {
            target.cgpa = sCgpa;
          } else if (!targetCgpa && !isNaN(sCgpa) && sCgpa > 0) {
            target.cgpa = sCgpa;
          }

          var sCredits = parseInt(s.totalCredits || 0, 10);
          var targetCredits = parseInt(target.totalCredits || 0, 10);
          if (!isNaN(sCredits) && sCredits > targetCredits) {
            target.totalCredits = sCredits;
            target.totalCreditEarned = sCredits;
          }

          s.courses.forEach(function (c) {
            var semKey = String(c.semester || c.sem || '').trim();
            var codeKey = String(c.code || '').trim().toLowerCase();

            var isDuplicate = target.courses.some(function (existC) {
              var existSem = String(existC.semester || existC.sem || '').trim();
              var existCode = String(existC.code || '').trim().toLowerCase();
              return existCode === codeKey && existSem === semKey;
            });

            if (!isDuplicate) {
              target.courses.push(c);
            }
          });
        });
      } catch (err) {
        setAlert('err', '✗ Excel parse error: ' + err.message);
        return;
      }

      filesReadCount++;
      if (filesReadCount === fileList.length) {
        uploadConsolidated(consolidatedMap, setAlert);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function uploadConsolidated(consolidatedMap, setAlert) {
  var finalStudentsList = Object.values(consolidatedMap);

  if (finalStudentsList.length === 0) {
    setAlert('warn', '⚠ No student records detected. Check that column headers match.');
    return;
  }

  setAlert('info', '<span class="spinner"></span>Consolidated ' + finalStudentsList.length + ' students. Sending to backend…');

  // V14.0: Use stored global — no prompt
  var mainAdminPassword = window.currentAdminPassword || sessionStorage.getItem(ADMIN_SESSION) || '';
  if (!mainAdminPassword) {
    setAlert('err', '❌ Upload canceled: Session expired. Please reload and log in again.');
    return;
  }

  fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'upsert', adminPassword: mainAdminPassword, students: finalStudentsList })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
      if (data.status === 'success') {
          alert("✅ SUCCESS: " + data.message + " (" + finalStudentsList.length + " records saved).");
          
          var container = document.getElementById('file-tagging-container');
          if (container) container.innerHTML = '';
          var btnTag = document.getElementById('btn-upload-process');
          if (btnTag) btnTag.style.display = 'none';
          window.selectedUploadFiles = [];
          window.selectedUploadTags = [];
          
          window.location.reload();
      } else {
          alert("❌ UPLOAD FAILED: " + data.message); 
      }
  })
  .catch(function(err) {
      alert("❌ NETWORK ERROR: Could not reach the database.");
      console.error(err);
  });

  var fi = document.getElementById('excel-upload');
  if (fi) fi.value = '';
}

function parseExcelToStudents(arrayBuffer, progressCb) {
  if (!window.XLSX) throw new Error('SheetJS library not loaded.');
  if (progressCb) progressCb('Parsing workbook…');

  var wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: false, raw: false });

  // Get first sheet data ONLY per spec
  var firstSheetName = wb.SheetNames[0];
  var firstSheetRows = XLSX.utils.sheet_to_json(wb.Sheets[firstSheetName], { defval: '' });

  if (progressCb) progressCb('Mapping first sheet rows…');

  function collapseKey(k) { return String(k || '').toLowerCase().replace(/[\s\-]+/g, '').trim(); }
  function fuzzyFindKey(rowKeys, target) {
    var t1 = collapseKey(target);
    var found = rowKeys.find(function (k) { return collapseKey(k) === t1; });
    return found || rowKeys.find(function (k) { return collapseKey(k).includes(t1); }) || null;
  }
  function findNumberedField(rowKeys, idx, suffixes) {
    for (var s = 0; s < suffixes.length; s++) {
      var target = idx + suffixes[s].toLowerCase().replace(/[\s\-]+/g, '').trim();
      var f = rowKeys.find(function (k) { var ck = collapseKey(k); return ck === target || ck.includes(target); });
      if (f) return f;
    }
    return null;
  }

  var map = {};

  // Step A: Extract global details and courses strictly from firstSheetRows
  firstSheetRows.forEach(function (row) {
    var rowKeys = Object.keys(row);
    var kSen = fuzzyFindKey(rowKeys, 'sen') || fuzzyFindKey(rowKeys, 'rollno') || fuzzyFindKey(rowKeys, 'enrollment');
    var sen = kSen ? String(row[kSen] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim() : '';
    if (!sen || sen.length < 5) return;

    if (!map[sen]) {
      map[sen] = { sen: sen, name: '', program: '', school: '', cgpa: '', totalCredits: 0, totalCreditEarned: 0, courses: [] };
    }
    var s = map[sen];

    // Update student fields from this row
    if (!s.name) {
      var kName = fuzzyFindKey(rowKeys, 'name') || fuzzyFindKey(rowKeys, 'studentname');
      if (kName && row[kName]) s.name = String(row[kName]).trim();
    }
    if (!s.program) {
      var kProgram = fuzzyFindKey(rowKeys, 'program') || fuzzyFindKey(rowKeys, 'programme');
      if (kProgram && row[kProgram]) s.program = String(row[kProgram]).trim();
    }
    if (!s.school) {
      var kSchool = fuzzyFindKey(rowKeys, 'school') || fuzzyFindKey(rowKeys, 'institute');
      if (kSchool && row[kSchool]) s.school = String(row[kSchool]).trim();
    }

    // Step A.1: strict Non-Destructive CGPA check
    var rawCgpaVal = row['CGPA'] || row['C.G.P.A'];
    if (rawCgpaVal === undefined || rawCgpaVal === null || String(rawCgpaVal).trim() === '') {
      var kCgpaFuzzy = rowKeys.find(function (k) {
        var uk = k.toUpperCase();
        return uk.indexOf('CGPA') !== -1 || uk.indexOf('C.G.P.A') !== -1;
      });
      if (kCgpaFuzzy) {
        rawCgpaVal = row[kCgpaFuzzy];
      }
    }
    var extractedCgpa = parseFloat(rawCgpaVal || 0);
    if (!isNaN(extractedCgpa) && extractedCgpa > 0) {
      s.cgpa = extractedCgpa; // Never overwrite with 0 or NaN
    }

    // Step A.2: Extract Total Credits (Look for keys containing "Earned". Parse as integer.)
    rowKeys.forEach(function (k) {
      var lowerKey = k.toLowerCase();
      if (lowerKey.includes('earned')) {
        var extractedCredits = parseInt(row[k], 10);
        if (!isNaN(extractedCredits) && extractedCredits > s.totalCredits) {
          s.totalCredits = extractedCredits;
          s.totalCreditEarned = extractedCredits;
        }
      }
    });

    // Step A.3 (The Summary Row Trap): Detect if all Course Code columns are blank
    var hasAnyCourseCode = false;
    rowKeys.forEach(function (k) {
      var ck = collapseKey(k);
      if (ck.includes('coursecode') || ck.includes('subjectcode') || (/^\d+coursecode$/.test(ck)) || (/^\d+code$/.test(ck))) {
        var val = String(row[k] || '').trim();
        if (val && val.toLowerCase() !== 'nan') {
          hasAnyCourseCode = true;
        }
      }
    });

    var isSummaryRow = !hasAnyCourseCode;

    // IF Summary Row: Scan all keys for any key containing "Earned"
    if (isSummaryRow) {
      rowKeys.forEach(function (k) {
        var lowerKey = k.toLowerCase();
        if (lowerKey.includes('earned')) {
          var extractedCredits = parseInt(row[k], 10);
          if (!isNaN(extractedCredits) && extractedCredits > s.totalCredits) {
            s.totalCredits = extractedCredits;
            s.totalCreditEarned = extractedCredits;
          }
        }
      });
    }

    // Course Extraction from First Sheet Only
    if (!isSummaryRow) {
      var numberedCoursesFound = false;

      // Semester Extraction explicitly from Column F (often SEM or Semester)
      var rowSem = row['SEM'] || row['Semester'] || "Unknown";

      // Loop 1 to 20 for Horizontal slots
      for (var i = 1; i <= 20; i++) {
        var targetP1 = i + 'coursecode';
        var targetP2 = i + 'code';
        var targetP3 = i + 'subjectcode';

        var kCC = null;
        for (var j = 0; j < rowKeys.length; j++) {
          var ck = collapseKey(rowKeys[j]);
          if (ck === targetP1 || ck === targetP2 || ck === targetP3 || ck.includes(targetP1)) {
            kCC = rowKeys[j];
            break;
          }
        }

        if (kCC) {
          var rawCode = row[kCC] || '';
          var cleanCode = rawCode.toString().trim().toUpperCase();
          if (cleanCode && cleanCode !== 'NAN') {
            numberedCoursesFound = true;

            var kCT = findNumberedField(rowKeys, i, ['coursetitle', 'title', 'subject', 'coursename']);
            var kFG = findNumberedField(rowKeys, i, ['finalgrade', 'grade']);
            var kCr = findNumberedField(rowKeys, i, ['creditregistered', 'credit', 'credits']);
            var kGp = findNumberedField(rowKeys, i, ['totalcreditpoints', 'creditpoint', 'gradepoints', 'gp', 'points']);
            var kMk = findNumberedField(rowKeys, i, ['totalmarks', 'marks', 'score']);
            if (!kMk) {
              for (var mi = 0; mi < rowKeys.length; mi++) {
                if (collapseKey(rowKeys[mi]).includes(String(i) + 'marks') || collapseKey(rowKeys[mi]).includes(String(i) + 'totalmarks')) {
                  kMk = rowKeys[mi]; break;
                }
              }
            }
            var kCe = findNumberedField(rowKeys, i, ['creditearned']);
            var kTy = findNumberedField(rowKeys, i, ['type', 'coursetype']);

            var courseObj = {
              semester: rowSem,
              sem: rowSem,
              code: cleanCode,
              title: kCT ? String(row[kCT] || '').trim() : '',
              type: kTy ? String(row[kTy] || '').trim() : '',
              credits: kCr ? row[kCr] : '',
              marks: kMk ? row[kMk] : '',
              grade: kFG ? String(row[kFG] || '').trim() : '',
              gradePoints: kGp ? row[kGp] : '',
              creditEarned: kCe ? row[kCe] : ''
            };

            // Strict Deduplication: check if the Course Code already exists in this student's courses list
            const isDuplicate = s.courses.some(c => c.code === cleanCode);
            if (!isDuplicate) {
              s.courses.push(courseObj);
            }
          }
        }
      }

      // Single vertical column fallback
      if (!numberedCoursesFound) {
        var kCCVert = null;
        for (var j2 = 0; j2 < rowKeys.length; j2++) {
          var ck2 = collapseKey(rowKeys[j2]);
          if (ck2 === 'coursecode' || ck2 === 'subjectcode' || ck2 === 'code') {
            kCCVert = rowKeys[j2]; break;
          }
        }
        if (!kCCVert) {
          kCCVert = fuzzyFindKey(rowKeys, 'coursecode') || fuzzyFindKey(rowKeys, 'subjectcode') || fuzzyFindKey(rowKeys, 'code');
        }

        if (kCCVert) {
          var rawCode = row[kCCVert] || '';
          var cleanCode = rawCode.toString().trim().toUpperCase();
          if (cleanCode && cleanCode !== 'NAN') {
            var kCT = fuzzyFindKey(rowKeys, 'coursetitle') || fuzzyFindKey(rowKeys, 'title') || fuzzyFindKey(rowKeys, 'subject') || fuzzyFindKey(rowKeys, 'coursename');
            var kFG = fuzzyFindKey(rowKeys, 'finalgrade') || fuzzyFindKey(rowKeys, 'grade');
            var kCr = fuzzyFindKey(rowKeys, 'creditregistered') || fuzzyFindKey(rowKeys, 'credit') || fuzzyFindKey(rowKeys, 'credits');
            var kGp = fuzzyFindKey(rowKeys, 'totalcreditpoints') || fuzzyFindKey(rowKeys, 'creditpoint') || fuzzyFindKey(rowKeys, 'gradepoints') || fuzzyFindKey(rowKeys, 'gp') || fuzzyFindKey(rowKeys, 'points');
            var kMk = fuzzyFindKey(rowKeys, 'totalmarks') || fuzzyFindKey(rowKeys, 'marks') || fuzzyFindKey(rowKeys, 'score');
            if (!kMk) kMk = rowKeys.find(function (k) { return collapseKey(k).includes('marks'); }) || null;
            var kCe = fuzzyFindKey(rowKeys, 'creditearned');
            var kTy = fuzzyFindKey(rowKeys, 'type') || fuzzyFindKey(rowKeys, 'coursetype') || fuzzyFindKey(rowKeys, 'category');

            var courseObj = {
              semester: rowSem,
              sem: rowSem,
              code: cleanCode,
              title: kCT ? String(row[kCT] || '').trim() : '',
              type: kTy ? String(row[kTy] || '').trim() : '',
              credits: kCr ? row[kCr] : '',
              marks: kMk ? row[kMk] : '',
              grade: kFG ? String(row[kFG] || '').trim() : '',
              gradePoints: kGp ? row[kGp] : '',
              creditEarned: kCe ? row[kCe] : ''
            };

            // Strict Deduplication: check if the Course Code already exists in this student's courses list
            const isDuplicate = s.courses.some(c => c.code === cleanCode);
            if (!isDuplicate) {
              s.courses.push(courseObj);
            }
          }
        }
      }
    }
  });

  return Object.values(map);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN — CLEAR ALL RECORDS
// ═══════════════════════════════════════════════════════════════════════════════
async function clearAllRecords() {
  var statusEl = document.getElementById('clear-all-status');
  var btn = document.getElementById('btn-clear-all');

  // V14.0: Use stored session password — no prompt
  var adminPass = window.currentAdminPassword || sessionStorage.getItem(ADMIN_SESSION) || '';
  if (!adminPass) {
    alert('Session expired. Please reload and log in again.');
    return;
  }

  // Double-confirmation still retained for safety
  if (!confirm('⚠️ WARNING: This will permanently delete ALL student records from the database.\n\nPasswords will also be wiped. This cannot be undone.\n\nAre you sure you want to continue?')) return;
  if (!confirm('FINAL WARNING: Click OK to delete every student record now.')) return;

  if (btn) btn.disabled = true;
  if (statusEl) statusEl.textContent = '⏳ Sending delete request to backend…';

  var gasUrl = GAS_URL;

  try {
    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'clearall', adminPassword: adminPass })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.status === 'success') {
        window.students = [];
        localStorage.clear();
        sessionStorage.clear();
        alert(data.message || 'Database successfully wiped.');
        window.location.reload();
      } else {
        if (statusEl) statusEl.textContent = '✗ Error: ' + ((data && data.message) || 'Wipe request failed.');
        if (btn) btn.disabled = false;
      }
    })
    .catch(function (err) {
      if (statusEl) statusEl.textContent = '✗ Error: ' + err.message;
      if (btn) btn.disabled = false;
    });
  } catch (err) {
    if (statusEl) statusEl.textContent = '✗ Error: ' + err.message;
    if (btn) btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STARTUP — index.html
// ═══════════════════════════════════════════════════════════════════════════════
(function boot() {
  // Only run on index.html (landing page)
  if (!document.getElementById('landing')) return;

  resetStudentLoginUI();
  setTimeout(function () {
    var el = document.getElementById('s-sen');
    if (el) el.focus();
  }, 150);

  // Bind event listener to the new bottom logout button
  var btnLogoutBottom = document.getElementById('btn-logout-bottom');
  if (btnLogoutBottom) {
    btnLogoutBottom.addEventListener('click', function (e) {
      e.preventDefault();
      logout();
    });
  }

  var gasUrl = GAS_URL;
  var hint = document.getElementById('sync-hint');

  if (gasUrl) {
    if (hint) hint.textContent = '⏳ Connecting to portal backend…';
    gasJsonp(gasUrl + '?action=ping', 8000)
      .then(function (data) {
        if (data && (data.status === 'pong' || data.status === 'ok')) {
          if (hint) hint.textContent = '🟢 Portal is live and connected.';
        } else {
          if (hint) hint.textContent = '⚠ Backend responded but may be misconfigured.';
        }
      })
      .catch(function () {
        if (hint) hint.textContent = '🔴 Backend unreachable. Contact administrator.';
      });
  } else {
    if (hint) hint.textContent = '';
  }
})();

// Register event listener for V11.0 dynamic file tagging UI on input change
(function initUploadTagging() {
  var bindEvent = function () {
    var input = document.getElementById('excel-upload');
    if (input) {
      input.addEventListener('change', function (e) {
        handleFilesSelected(e.target.files);
      });
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvent);
  } else {
    bindEvent();
  }
})();

// ── Admin Curriculum Editor Logic (V20.1 — Self-Healing Table-Based Visual GUI Builder) ──────────────
window.currentEditingKey = "2024_MCA";

window.loadCurriculumEditor = function() {
  const keyDropdown = document.getElementById('curriculum-edit-key');
  const container = document.getElementById('curriculum-gui-container');
  if (!keyDropdown || !container) return; 
  
  window.currentEditingKey = keyDropdown.value;
  const rawRules = CURRICULUM_RULES[window.currentEditingKey] || [];
  const validRules = rawRules.filter(r => r && r.category); 

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
        <h3 style="color: #94a3b8;">Currently Editing: <span style="color:#38bdf8;">${window.currentEditingKey}</span></h3>
        <button onclick="clearEntireCurriculum()" style="background:#dc2626; color:white; padding: 10px 15px; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">⚠️ Clear Full Curriculum</button>
    </div>
  `;
  
  if (validRules.length === 0) {
      html += `<div style="padding:30px; background:var(--s2); color:#cbd5e1; text-align:center; border-radius:8px; border: 1px dashed #475569;">No curriculum data found for ${window.currentEditingKey}. Upload an Excel file or click 'Add New Bucket' to start.</div>`;
  } else {
      validRules.forEach((main, mIndex) => {
          html += `
          <div style="background: var(--s2, #1e293b); border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <div style="border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                  <div>
                      <h3 style="margin: 0; color: #38bdf8; font-size: 1.3em;">
                          📁 ${main.category} 
                          <button onclick="editMainName(${mIndex})" class="action-btn" style="background:#0ea5e9; margin-left:10px;">Rename</button>
                      </h3>
                      <div style="margin-top: 8px;">
                          <span style="color: #10b981; font-weight: bold; font-size: 0.95em;">Total Required: ${main.minCredits} Credits</span>
                          <button onclick="editMainCredits(${mIndex})" class="action-btn" style="background:#64748b; margin-left:10px;">Edit Credits</button>
                      </div>
                  </div>
                  <button onclick="deleteMainBucket('${window.currentEditingKey}', ${mIndex})" class="action-btn" style="background:#ef4444; padding:8px 12px;">🗑️ Delete Main Category</button>
              </div>
          `;

          // CRITICAL FIX: Force subCategories to be an array so loop doesn't fail
          const subs = Array.isArray(main.subCategories) ? main.subCategories : Object.values(main.subCategories || {});
          
          subs.forEach((sub, sIndex) => {
              html += `
              <div style="background: #0f172a; border: 1px solid #475569; border-radius: 6px; padding: 15px; margin-bottom: 15px; margin-left: 20px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                      <div>
                          <h4 style="margin: 0; color: #e2e8f0; font-size: 1.1em;">
                              📄 ${sub.name} 
                              <button onclick="editSubName(${mIndex}, ${sIndex})" class="action-btn" style="background:#0ea5e9; margin-left:8px;">Rename</button>
                          </h4>
                          <div style="margin-top: 5px;">
                            <span style="color:#94a3b8; font-size: 0.9em;">(Min ${sub.minCredits} Credits)</span>
                            <button onclick="editSubCredits(${mIndex}, ${sIndex})" class="action-btn" style="background:#64748b; margin-left:8px;">Edit Credits</button>
                          </div>
                      </div>
                      <button onclick="deleteSubCategory(${mIndex}, ${sIndex})" class="action-btn" style="background:transparent; color:#ef4444; border:1px solid #ef4444;">🗑️ Remove Sub</button>
                  </div>
                  
                  <div class="table-responsive">
                      <table style="width: 100%; border-collapse: collapse; font-size: 0.9em; background: #1e293b;">
                          <thead style="background: #334155;">
                              <tr>
                                  <th style="padding: 8px; border: 1px solid #475569; text-align:left; color:#cbd5e1;">Code</th>
                                  <th style="padding: 8px; border: 1px solid #475569; text-align:left; color:#cbd5e1;">Course Name</th>
                                  <th style="padding: 8px; border: 1px solid #475569; text-align:center; color:#cbd5e1;">Credits</th>
                                  <th style="padding: 8px; border: 1px solid #475569; text-align:center; color:#cbd5e1;">Actions</th>
                              </tr>
                          </thead>
                          <tbody>
              `;

              const codesList = sub.codes || [];
              if (codesList.length === 0) {
                  html += `<tr><td colspan="4" style="text-align:center; color:#64748b; padding: 10px;">No courses mapped</td></tr>`;
              } else {
                  codesList.forEach((code, cIndex) => {
                      const info = getCourseInfo(code);
                      html += `
                      <tr>
                          <td style="padding: 8px; border: 1px solid #475569; font-weight:bold; color:#f8fafc;">${code}</td>
                          <td style="padding: 8px; border: 1px solid #475569; color:#94a3b8;">${info.name}</td>
                          <td style="padding: 8px; border: 1px solid #475569; text-align:center; color:#38bdf8; font-weight:bold;">${info.credits}</td>
                          <td style="padding: 8px; border: 1px solid #475569; text-align:center;">
                              <button onclick="editCourseDetails('${code}')" class="action-btn" style="background:#ca8a04; margin-right:5px;">Edit</button>
                              <button onclick="removeCourseFromSub(${mIndex}, ${sIndex}, ${cIndex})" class="action-btn" style="background:#ef4444;">Remove</button>
                          </td>
                      </tr>`;
                  });
              }
              html += `</tbody></table></div>`;
              html += `<button onclick="addCourseToSub(${mIndex}, ${sIndex})" class="action-btn" style="margin-top: 12px; background: #2563eb; padding: 8px 12px;">➕ Add Course to ${sub.name}</button>`;
              html += `</div>`;
          });
          html += `<button onclick="addSubCategory(${mIndex})" class="action-btn" style="margin-left: 20px; background: #059669; padding: 10px 15px;">➕ Add Sub-Category</button>`;
          html += `</div>`;
      });
  }
  html += `<button onclick="addNewBucket()" style="background: #10b981; color: white; border: none; padding: 15px; border-radius: 6px; cursor: pointer; font-size: 1.1em; font-weight: bold; width:100%;">➕ Create New Main Category</button>`;
  container.innerHTML = html;
};

function autoSaveCurriculum() {
    localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(CURRICULUM_RULES));
    localStorage.setItem('AIIT_CUSTOM_COURSES', JSON.stringify(CUSTOM_COURSE_DICT));
    loadCurriculumEditor(); // Force refresh UI
}

// --- MAIN CATEGORY CONTROLLERS ---
window.addNewBucket = function() {
    const name = prompt("Enter Name for new Main Category:");
    if (name && name.trim() !== "") {
        if (!CURRICULUM_RULES[window.currentEditingKey]) {
            CURRICULUM_RULES[window.currentEditingKey] = [];
        }
        CURRICULUM_RULES[window.currentEditingKey].push({ category: name.trim(), minCredits: 0, subCategories: [] });
        autoSaveCurriculum();
    }
};
window.deleteMainBucket = function(key, index) {
    if (confirm("Are you sure you want to delete this entire Main Category and all of its nested Sub-Categories?")) {
        CURRICULUM_RULES[key].splice(index, 1);
        autoSaveCurriculum();
    }
};
window.editMainName = function(mIndex) {
    const rule = CURRICULUM_RULES[window.currentEditingKey][mIndex];
    const newName = prompt("Edit Main Category Name:", rule.category);
    if (newName && newName.trim() !== "") { rule.category = newName.trim(); autoSaveCurriculum(); }
};
window.editMainCredits = function(mIndex) {
    const rule = CURRICULUM_RULES[window.currentEditingKey][mIndex];
    const newCreds = prompt("Edit Main Category Required Credits:", rule.minCredits);
    if (newCreds !== null && !isNaN(newCreds)) { rule.minCredits = parseFloat(newCreds); autoSaveCurriculum(); }
};

// --- SUB CATEGORY CONTROLLERS ---
window.editSubName = function(mIndex, sIndex) {
    const sub = CURRICULUM_RULES[window.currentEditingKey][mIndex].subCategories[sIndex];
    const newName = prompt("Edit Sub-Category Name:", sub.name);
    if (newName && newName.trim() !== "") { sub.name = newName.trim(); autoSaveCurriculum(); }
};
window.editSubCredits = function(mIndex, sIndex) {
    const sub = CURRICULUM_RULES[window.currentEditingKey][mIndex].subCategories[sIndex];
    const newCreds = prompt("Edit Sub-Category Required Credits:", sub.minCredits);
    if (newCreds !== null && !isNaN(newCreds)) { sub.minCredits = parseFloat(newCreds); autoSaveCurriculum(); }
};
window.deleteSubCategory = function(mIndex, sIndex) {
    if (confirm("Delete this entire Sub-Category?")) {
        CURRICULUM_RULES[window.currentEditingKey][mIndex].subCategories.splice(sIndex, 1);
        autoSaveCurriculum();
    }
};
window.addSubCategory = function(mIndex) {
    const name = prompt("Enter Name for new Sub-Category:");
    if (name && name.trim() !== "") {
        CURRICULUM_RULES[window.currentEditingKey][mIndex].subCategories.push({ name: name.trim(), minCredits: 0, codes: [] });
        autoSaveCurriculum();
    }
};

// --- COURSE LEVEL CONTROLLERS ---
window.addCourseToSub = function(mIndex, sIndex) {
    const code = prompt("Enter the Course Code (e.g., CSE9001):");
    if (!code || code.trim() === "") return;
    const cleanCode = code.trim().toUpperCase();
    
    const name = prompt(`Enter Course Name for ${cleanCode}:`, "New Course");
    const credits = prompt(`Enter Credits for ${cleanCode}:`, "3");
    
    // STRICT ZERO CHECK
    const parsedCreds = parseFloat(credits);
    const finalCreds = isNaN(parsedCreds) ? 3 : parsedCreds;
    
    window.CUSTOM_COURSE_DICT[cleanCode] = { name: name || "Custom Course", credits: finalCreds };
    CURRICULUM_RULES[window.currentEditingKey][mIndex].subCategories[sIndex].codes.push(cleanCode);
    autoSaveCurriculum();
};
window.removeCourseFromSub = function(mIndex, sIndex, cIndex) {
    if (confirm("Remove this course from the sub-category?")) {
        CURRICULUM_RULES[window.currentEditingKey][mIndex].subCategories[sIndex].codes.splice(cIndex, 1);
        autoSaveCurriculum();
    }
};
window.editCourseDetails = function(code) {
    const currentInfo = getCourseInfo(code);
    const newName = prompt(`Edit Course Name for ${code}:`, currentInfo.name);
    if (newName === null) return;
    const newCreds = prompt(`Edit Credits for ${code}:`, currentInfo.credits);
    if (newCreds === null) return;
    
    // STRICT ZERO CHECK
    const parsedCreds = parseFloat(newCreds);
    const finalCreds = isNaN(parsedCreds) ? currentInfo.credits : parsedCreds;
    
    window.CUSTOM_COURSE_DICT[code] = { name: newName.trim(), credits: finalCreds };
    autoSaveCurriculum();
    alert(`✅ Updated ${code} to ${finalCreds} Credits!`);
};

window.saveCurriculumEditor = function() {
  localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(CURRICULUM_RULES));
  localStorage.setItem('AIIT_CUSTOM_COURSES', JSON.stringify(CUSTOM_COURSE_DICT));
  alert("✅ Curriculum Updated Successfully! The Degree Audit engine is now using these rules.");
};

window.resetCurriculumEditor = function() {
  if(confirm("Are you sure you want to delete all custom rules and reset to the factory defaults?")) {
    localStorage.removeItem('AIIT_CUSTOM_CURRICULUM');
    localStorage.removeItem('AIIT_CUSTOM_COURSES');
    CURRICULUM_RULES = BASE_CURRICULUM;
    CUSTOM_COURSE_DICT = {};
    loadCurriculumEditor();
    alert("♻️ Curriculum reset to defaults.");
  }
};

// Auto-load curriculum editor if element exists on the page
if (document.getElementById('curriculum-gui-container')) {
  window.loadCurriculumEditor();
}

