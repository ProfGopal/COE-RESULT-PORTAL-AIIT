/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Restored & Cloud-Enforced Ver 2.1)
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
//  1. CONSTANTS & SYSTEM CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";
const GAS_URL = scriptURL;

var LOCAL_STU_KEY = 'coe_students_v2';
var ADMIN_SESSION = 'coe_admin_auth';

window.STUDENTS = window.STUDENTS || [];
window.ALL_STUDENTS = window.ALL_STUDENTS || [];
window.CURRICULUM_RULES = window.CURRICULUM_RULES || {};

var SEM_MAP = {
  '1': 'Semester I', '2': 'Semester II', '3': 'Semester III', '4': 'Semester IV',
  '5': 'Semester V', '6': 'Semester VI', '7': 'Semester VII', '8': 'Semester VIII',
  'I': 'Semester I', 'II': 'Semester II', 'III': 'Semester III', 'IV': 'Semester IV',
  'V': 'Semester V', 'VI': 'Semester VI', 'VII': 'Semester VII', 'VIII': 'Semester VIII'
};

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
  "CSE3050": { name: "Programming Skills for Employment", credits: 1 },
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

window.CUSTOM_COURSE_DICT = JSON.parse(localStorage.getItem('AIIT_CUSTOM_COURSES')) || {};

window.fmtCgpa = function(val) {
    let n = parseFloat(val);
    if (isNaN(n) || n === 0) return "N/A";
    return n.toFixed(2);
};
window.formatCgpa = window.fmtCgpa;

window.getCourseInfo = function (code) {
    if (!code) return { name: "Course Title", credits: 3 };
    let cleanCode = String(code).toUpperCase().trim();
    
    if (window.CUSTOM_COURSE_DICT && window.CUSTOM_COURSE_DICT[cleanCode]) {
        let cr = window.CUSTOM_COURSE_DICT[cleanCode].credits;
        let n = window.CUSTOM_COURSE_DICT[cleanCode].name;
        return {
            name: (n && n !== "Course Title" && n !== "Pending DB Update") ? n : cleanCode,
            credits: (cr !== undefined && cr !== null && !isNaN(cr)) ? parseFloat(cr) : 3
        };
    }
    if (typeof COURSE_DICT !== 'undefined' && COURSE_DICT[cleanCode]) {
        let cr = COURSE_DICT[cleanCode].credits;
        return {
            name: COURSE_DICT[cleanCode].name,
            credits: (cr !== undefined && cr !== null && !isNaN(cr)) ? parseFloat(cr) : 3
        };
    }
    return { name: cleanCode, credits: 3 };
};

const BASE_CURRICULUM = {
  "2024_MCA": [
    { category: "1. School Core (Includes Languages & Soft Skills)", minCredits: 17, codes: ["CSE5129", "MAT5005", "ENG5004", "CSE6004", "CSE6005", "CSE6006", "FRE1001", "GER1001", "SPA1001", "SSK2002", "SSK3002", "ENG5001", "CSE3050"] },
    { category: "2. Program Core", minCredits: 29, codes: ["CSE5067", "CSE5002", "CSE5005", "CSE5004", "CSE5012", "CSE5011", "CSE5013", "CSE5017", "CSE5009", "CSE5010", "CSE5008", "CSE5006", "CSE5007", "MGT5101", "CSE6007", "CSE6008", "CSE6009"] },
    { category: "3. Discipline Electives", minCredits: 28, codes: ["CSE5029", "CSE5032", "CSE5033", "CSE5028", "CSE5039", "CSE5040", "CSE5041", "CSE5042", "CSE5043", "CSE5044", "CSE5045", "CSE5046", "CSE5047", "CSE5048", "MGT5007", "MAT5006", "CSE5052", "CSE5053", "CSE5034", "CSE5019", "CSE5024"] },
    { category: "4. Open Elective", minCredits: 6, codes: ["OPEN_ELECTIVE_CATCHALL"] }
  ]
};

try {
  const saved = localStorage.getItem('AIIT_CUSTOM_CURRICULUM');
  window.CURRICULUM_RULES = saved ? JSON.parse(saved) : BASE_CURRICULUM;
  if (typeof window.CURRICULUM_RULES !== 'object' || window.CURRICULUM_RULES === null) throw new Error("Corrupted format");
} catch (e) {
  console.warn("Curriculum load failed, reverting to base.", e);
  window.CURRICULUM_RULES = BASE_CURRICULUM;
}

let SYSTEM_PROGRAMS = JSON.parse(localStorage.getItem('AIIT_SYSTEM_PROGRAMS')) || [
  { batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }, { batch: "2024", program: "B.C.A" }
];

// ═══════════════════════════════════════════════════════════════════════════════
//  2. STATE & UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

var currentStudent = null;
var isNewUser = false;
var loginAttempts = {};
var MAX_ATTEMPTS = 5;
var LOCKOUT_MS = 15 * 60 * 1000;
var lightThemeTimer = null;
window.currentEditingKey = null;

async function hashPwd(str) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(function (b) {
    return b.toString(16).padStart(2, '0');
  }).join('');
}

function sanitize(str) {
  return String(str || '').replace(/[<>"'`;\\&\/]/g, '').trim().substring(0, 200);
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

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

function showErr(id, msg, inputIds) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'alert err';
  el.style.display = 'block';
  var okId = id.replace('err', 'ok');
  var okEl = document.getElementById(okId);
  if (okEl) okEl.style.display = 'none';

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

function gasPost(payload) {
  return fetch(scriptURL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  3. PAGE ROUTING & AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════════

window.showPage = function (id) {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  var target = document.getElementById(id);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
};

window.showStudentLogin = function () {
  resetStudentLoginUI();
  showPage('landing');
  showStudentLoginUI();
};

window.showStudentLoginUI = function () {
  var sContainer = document.getElementById('student-login-container');
  var fContainer = document.getElementById('faculty-login-container');
  if (sContainer) sContainer.style.display = 'flex';
  if (fContainer) fContainer.style.display = 'none';
  setTimeout(function () {
    var el = document.getElementById('s-sen');
    if (el) el.focus();
  }, 150);
};

window.showFacultyLogin = function () {
  var sContainer = document.getElementById('student-login-container');
  var fContainer = document.getElementById('faculty-login-container');
  if (sContainer) sContainer.style.display = 'none';
  if (fContainer) fContainer.style.display = 'block';
  var fPage = document.getElementById('faculty-login');
  if (fPage) showPage('faculty-login');
};

window.goAdmin = function () {
  window.location.href = 'admin-hidden.html';
};

window.logout = function () {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userRole');
  sessionStorage.clear();
  document.body.classList.remove('overlay-active');
  window.location.reload(true);
};

window.studentLogin = function (studentData) {
  document.body.classList.add('overlay-active');
  const dashboardContainer = document.getElementById('student-dash') || document.getElementById('student-dashboard');
  if (dashboardContainer) {
    dashboardContainer.classList.add('dashboard-fullscreen-overlay');
    dashboardContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
};

window.facultyLogin = function () {
  document.body.classList.add('overlay-active');
  const dashboardContainer = document.getElementById('faculty-dash') || document.getElementById('faculty-dashboard');
  if (dashboardContainer) {
    dashboardContainer.classList.add('dashboard-fullscreen-overlay');
    dashboardContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
};

function resetStudentLoginUI() {
  ['s-sen', 's-pass', 's-newpass', 's-confirmpass'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  hideAlerts('student');
  var pf = document.getElementById('s-pass-field');
  if (pf) pf.style.display = 'block';
  var nf = document.getElementById('s-newpass-fields');
  if (nf) nf.style.display = 'none';
  var btn = document.getElementById('s-login-btn');
  if (btn) { btn.textContent = '🎓 Sign In →'; btn.disabled = false; }
  isNewUser = false;
}

window.onSenInput = function () {
  hideAlerts('student');
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
  if (btn) { btn.textContent = '🎓 Sign In →'; btn.disabled = false; }
  isNewUser = false;
};

window.requestOtpReset = async function () {
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

  try {
    var response = await fetch(scriptURL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'forgotpassword', sen: sen })
    });
    var result = await response.json();

    if (result && result.status === 'success') {
      showOk('student-ok', '✓ ' + result.message);
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
};

window.otpResetStep = async function () {
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

  try {
    var response = await fetch(scriptURL, {
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
};

window.cancelOtpResetUI = function () {
  document.getElementById('s-login-title').textContent = 'Student Login';
  document.getElementById('s-pass-field').style.display = 'block';
  document.getElementById('s-newpass-fields').style.display = 'none';
  document.getElementById('s-otp-fields').style.display = 'none';
  document.getElementById('s-login-btn').style.display = 'block';
  document.getElementById('s-otp-buttons').style.display = 'none';

  ['s-otp', 's-otp-newpass', 's-otp-confirmpass'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  hideAlerts('student');
};

window.studentLoginStep = async function () {
    var rawSen = document.getElementById('s-sen').value;
    var sen = sanitize(rawSen).toUpperCase();
    hideAlerts('student');

    if (!sen) { showErr('student-err', 'Please enter your SEN number.', ['s-sen']); return; }

    var btn = document.getElementById('s-login-btn');
    if (btn) btn.disabled = true;

    // --- PHASE-SHIFT REVEAL FUNCTION ---
    const executePhaseShift = (studentObj) => {
        if (btn) btn.innerHTML = "✅ Access Granted";
        
        // 1. Digital Shredder: Destroy the Login UI entirely
        const loginBox = btn ? (btn.closest('.bg-white') || btn.closest('.shadow-lg')) : null;
        if (loginBox) loginBox.remove();
        
        const loginContainer = document.getElementById('student-login-container') || document.querySelector('.login-container');
        if (loginContainer) loginContainer.style.display = 'none';
        
        document.querySelectorAll('h1, h2, h3, p').forEach(textNode => {
            if (textNode.textContent.includes('Student Login') || textNode.textContent.includes('Enter your SEN')) {
                textNode.style.display = 'none';
            }
        });

        // 2. Unhide Dashboard
        const studentDash = document.getElementById('student-dash') || document.getElementById('student-dashboard') || document.getElementById('dashboard-section');
        if (studentDash) {
            studentDash.style.display = 'block';
            studentDash.classList.add('dashboard-fullscreen-overlay');
        }

        // 3. Render Data & Lock Background
        document.body.classList.add('overlay-active');
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        if (typeof renderStudentDash === 'function') {
            renderStudentDash(studentObj);
        }
    };

    try {
        // NEW USER: SET PASSWORD FLOW
        if (isNewUser) {
            var newpass = sanitize((document.getElementById('s-newpass') || {}).value || '');
            var confpass = sanitize((document.getElementById('s-confirmpass') || {}).value || '');

            if (!newpass) { showErr('student-err', 'Please enter a new password.', ['s-newpass']); return; }
            if (newpass.length < 6) { showErr('student-err', 'Password must be at least 6 characters.', ['s-newpass', 's-confirmpass']); return; }
            if (newpass !== confpass) { showErr('student-err', 'Passwords do not match.', ['s-newpass', 's-confirmpass']); return; }

            if (btn) { btn.disabled = true; btn.textContent = '⏳ Saving & Logging In...'; }

            // 1. Save Password
            await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'setpassword', sen: sen, newPassword: newpass })
            });

            // 2. Force Login & Phase Shift
            var alResp = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'login', sen: sen, password: newpass })
            });
            var alResult = await alResp.json();

            if (alResult && alResult.status === 'success' && alResult.student) {
                currentStudent = alResult.student;
                executePhaseShift(currentStudent);
            } else {
                showOk('student-ok', '✓ Password created! Please sign in with your new password.');
                resetStudentLoginUI();
                var senEl = document.getElementById('s-sen');
                if (senEl) senEl.value = sen;
            }
            return;
        }

        // NORMAL USER: LOGIN FLOW
        var passInput = (document.getElementById('s-pass') || {}).value || '';
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Signing in…'; }

        var response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'login',
                sen: sen,
                password: passInput.trim()
            })
        });
        var result = await response.json();

        if (result && result.status === 'success' && result.student) {
            currentStudent = result.student;
            executePhaseShift(currentStudent);
        } else if (result && result.status === 'error' && (result.code === 'FIRST_TIME' || (result.message && result.message.toLowerCase().includes('first')))) {
            isNewUser = true;
            var pf = document.getElementById('s-pass-field');
            var nf = document.getElementById('s-newpass-fields');
            if (pf) pf.style.display = 'none';
            if (nf) nf.style.display = 'block';
            if (btn) btn.textContent = 'Create Password & Login →';
            showOk('student-ok', result.message || 'First-time login detected. Please create your password below.');
        } else if (result && result.status === 'error') {
            showErr('student-err', '⚠ ' + (result.message || 'Login failed.'), ['s-pass']);
        } else {
            showErr('student-err', '⚠ Unexpected response from server.');
        }
    } catch (err) {
        console.error('Login error:', err);
        showErr('student-err', '✗ Could not reach the server. Check your connection.');
    } finally {
        if (btn && btn.innerHTML !== "✅ Access Granted") {
            btn.disabled = false;
            btn.textContent = isNewUser ? 'Create Password & Login →' : '🎓 Sign In →';
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  4. FACULTY FLOW & STUDENT DIRECTORY
// ═══════════════════════════════════════════════════════════════════════════════

window.facultyLoginStep = async function () {
    var emailInput = document.getElementById('f-email');
    var passInput = document.getElementById('f-pass');
    var email = emailInput ? emailInput.value.trim() : "";
    var pass = passInput ? passInput.value : "";
    hideAlerts('faculty');

    if (!email || !pass) {
        showErr('faculty-err', 'Please enter email and password.', ['f-email', 'f-pass']);
        return;
    }

    var btn = document.getElementById('f-login-btn');
    const originalBtnText = btn ? btn.innerHTML : "Faculty Sign In &rarr;";
    if (btn) { btn.innerHTML = "⏳ Authenticating..."; btn.disabled = true; }

    try {
        var response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'verifyfaculty', email: email, password: pass }) 
        });
        var result = await response.json();

        if (result && result.status === 'success') {
            if (btn) btn.innerHTML = "✅ Access Granted";
            
            // --- AGGRESSIVE DIGITAL SHREDDER ---
            // Completely remove the login form container from the DOM so it cannot show up at the bottom
            const loginWrapper = document.getElementById('faculty-login-container') || btn.closest('.bg-white') || btn.closest('form') || document.querySelector('.login-section');
            if (loginWrapper) {
                loginWrapper.style.display = 'none';
                loginWrapper.remove();
            }
            
            // Also hide any stray login headers or text nodes
            document.querySelectorAll('h1, h2, h3, p, div').forEach(node => {
                if (node.textContent && (node.textContent.includes('Faculty Login') || node.textContent.includes('Authorized AIIT faculty'))) {
                    node.style.display = 'none';
                }
            });

            // Show Faculty Dashboard
            const facultyDash = document.getElementById('faculty-dash') || document.getElementById('faculty-dashboard') || document.querySelector('.faculty-section');
            if (facultyDash) {
                facultyDash.style.display = 'block';
                facultyDash.classList.add('dashboard-fullscreen-overlay');
            }
            
            document.body.classList.add('overlay-active');
            window.scrollTo({ top: 0, behavior: 'instant' });

            var label = document.getElementById('faculty-email-label');
            if (label) label.textContent = email;
            
            window.facultyViewAll(); 
        } else {
            showErr('faculty-err', '⚠ ' + ((result && result.message) || 'Invalid credentials.'), ['f-pass']);
            if (btn) { btn.innerHTML = originalBtnText; btn.disabled = false; }
        }
    } catch (err) {
        showErr('faculty-err', '✗ Connection error: ' + err.message);
        if (btn) { btn.innerHTML = originalBtnText; btn.disabled = false; }
    }
};

window.facultyLogout = function () {
  showPage('landing');
};

window.facultyViewAll = async function () {
    syncBar('Loading student records from Cloud Database…', true);
    try {
        // FIX: Use the correct '?action=load' codeword to match the backend
        var res = await fetch(scriptURL + "?action=load");
        var data = await res.json();
        var students = Array.isArray(data) ? data : (data.students || []);
        
        window.STUDENTS = students;
        window.ALL_STUDENTS = students;
        
        // Auto-populate Faculty Dropdown Filters based on live cloud data
        const uniqueBatches = [...new Set(students.map(s => String(s.batch || '').trim()).filter(Boolean))];
        const uniqueProgs = [...new Set(students.map(s => String(s.program || '').trim()).filter(Boolean))];
        
        const facultyDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section');
        if (facultyDash) {
             const selects = facultyDash.querySelectorAll('select');
             if(selects.length >= 2) {
                 selects[0].innerHTML = `<option value="">All Years</option>` + uniqueBatches.map(b => `<option value="${b}">${b}</option>`).join('');
                 selects[1].innerHTML = `<option value="">All Programs</option>` + uniqueProgs.map(p => `<option value="${p}">${p}</option>`).join('');
             }
        }

        renderStudentTable(students);
    } catch (err) {
        console.error("Failed to load students:", err);
    } finally {
        syncBar('', false);
    }
};

window.facultyFilterBacklogs = function () {
  window.filterBacklogs();
};

window.facultyFilterCredits = function () {
  var inp = document.getElementById('faculty-credit-input');
  var maxCr = parseFloat(inp ? inp.value : 0);
  if (isNaN(maxCr) || maxCr <= 0) return window.facultyViewAll();

  var filtered = (window.ALL_STUDENTS || []).filter(s => {
    var cr = parseFloat(s.totalCredits || s.totalCreditEarned || 0);
    return cr < maxCr;
  });
  renderStudentTable(filtered);
};

window.applyFilters = function () {
  var searchInp = document.getElementById('faculty-search-input');
  var search = searchInp ? searchInp.value.toLowerCase().trim() : '';

  var batchSel = document.getElementById('filter-batch');
  var batch = batchSel ? batchSel.value : '';

  var progSel = document.getElementById('filter-program');
  var prog = progSel ? progSel.value : '';

  var eligibleSel = document.getElementById('filter-eligibility');
  var elig = eligibleSel ? eligibleSel.value : 'all';

  var filtered = (window.ALL_STUDENTS || []).filter(s => {
    var matchSearch = !search || String(s.sen || '').toLowerCase().includes(search) || String(s.name || '').toLowerCase().includes(search);
    var matchBatch = !batch || String(s.batch || '') === batch;
    var matchProg = !prog || String(s.program || '') === prog;
    var matchElig = true;
    if (elig === 'eligible') matchElig = (s.eligible === true || s.degreeEligible === true);
    if (elig === 'not_eligible') matchElig = (s.eligible === false || s.degreeEligible === false);
    return matchSearch && matchBatch && matchProg && matchElig;
  });

  renderStudentTable(filtered);
};

function renderStudentTable(students) {
    var tbody = document.getElementById('faculty-dir-tbody') || document.querySelector('#faculty-dash tbody');
    var badge = document.querySelector('#faculty-dash .badge') || document.getElementById('faculty-dir-badge');
    
    if (badge) badge.textContent = `${students.length} students`;
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#64748b;font-size:1.1rem;">No matching student records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = students.map(s => {
        var cgpa = window.formatCgpa(s.cgpa);
        var credits = s.totalCredits || s.totalCreditEarned || '0';
        
        // Smart Backlog calculation
        var validCourses = s.courses ? s.courses.filter(c => c && c.code && c.code !== 'NAN') : [];
        var backlogs = window.getActiveBacklogs ? window.getActiveBacklogs(validCourses).length : 0;
        
        return `
        <tr style="border-bottom:1px solid #e2e8f0; transition: background 0.2s;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
            <td style="padding:12px; font-weight:bold; color:#0f172a;">${esc(s.sen)}</td>
            <td style="padding:12px;">${esc(s.name)}</td>
            <td style="padding:12px; color:#3b82f6; font-weight:bold;">${cgpa}</td>
            <td style="padding:12px; font-weight:bold;">${credits}</td>
            <td style="padding:12px;"><span style="padding:4px 8px; border-radius:4px; font-weight:bold; background:${backlogs > 0 ? '#fee2e2' : '#dcfce3'}; color:${backlogs > 0 ? '#dc2626' : '#16a34a'};">${backlogs}</span></td>
            <td style="padding:12px;"><button style="background:#0ea5e9; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;" onclick="openFacultyStudentView('${esc(s.sen)}')">Details</button></td>
        </tr>`;
    }).join('');
}

window.openFacultyStudentView = function (sen) {
  var s = (window.ALL_STUDENTS || []).find(x => x.sen === sen);
  if (!s) return;
  var detailView = document.getElementById('faculty-student-detail-view');
  var wrapper = document.getElementById('faculty-table-wrapper');
  var injected = document.getElementById('faculty-injected-student-data');

  if (wrapper) wrapper.style.display = 'none';
  if (detailView) detailView.style.display = 'block';

  if (injected) {
            // Calculate Active Backlogs
            let activeBacklogs = window.getActiveBacklogs(s.courses);
            
            // Global Tab Switcher for Admin/Faculty
            window.switchAdminTabUI = function(tabName) {
                document.getElementById('tab-admin-all').style.display = (tabName === 'admin-all') ? 'block' : 'none';
                document.getElementById('tab-admin-backlogs').style.display = (tabName === 'admin-backlogs') ? 'block' : 'none';
                document.getElementById('tab-admin-audit').style.display = (tabName === 'admin-audit') ? 'block' : 'none';

                document.getElementById('btn-admin-all').style.background = (tabName === 'admin-all') ? '#3b82f6' : '#f1f5f9';
                document.getElementById('btn-admin-all').style.color = (tabName === 'admin-all') ? 'white' : '#475569';
                
                document.getElementById('btn-admin-backlogs').style.background = (tabName === 'admin-backlogs') ? '#ef4444' : '#f1f5f9';
                document.getElementById('btn-admin-backlogs').style.color = (tabName === 'admin-backlogs') ? 'white' : '#475569';

                document.getElementById('btn-admin-audit').style.background = (tabName === 'admin-audit') ? '#10b981' : '#f1f5f9';
                document.getElementById('btn-admin-audit').style.color = (tabName === 'admin-audit') ? 'white' : '#475569';
            };

            injected.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h2 style="margin-top:0; color: #0f172a;">🎓 ${esc(s.name)} <span style="color:#64748b; font-size:1.1rem;">(${esc(s.sen)})</span></h2>
                    <div style="display:flex; flex-wrap:wrap; gap:15px; margin-top:10px;">
                        <span style="background:#f8fafc; padding:6px 12px; border-radius:6px; font-weight:bold; border:1px solid #cbd5e1;">Program: ${esc(s.program || 'N/A')}</span>
                        <span style="background:#f8fafc; padding:6px 12px; border-radius:6px; font-weight:bold; border:1px solid #cbd5e1;">Batch: ${esc(s.batch || 'N/A')}</span>
                        <span style="background:#ecfdf5; padding:6px 12px; border-radius:6px; font-weight:bold; color:#10b981; border:1px solid #a7f3d0;">CGPA: ${window.formatCgpa(s.cgpa)}</span>
                        <span style="background:#eff6ff; padding:6px 12px; border-radius:6px; font-weight:bold; color:#3b82f6; border:1px solid #bfdbfe;">Total Credits: ${s.totalCredits || '0'}</span>
                    </div>
                </div>

                <div style="display:flex; gap:10px; margin-bottom:15px; border-bottom:2px solid #e2e8f0; padding-bottom:10px; overflow-x:auto;">
                    <button onclick="window.switchAdminTabUI('admin-all')" id="btn-admin-all" style="padding:10px 20px; border:none; background:#3b82f6; color:white; border-radius:6px; font-weight:bold; cursor:pointer; font-size:1rem;">📚 All Courses</button>
                    <button onclick="window.switchAdminTabUI('admin-backlogs')" id="btn-admin-backlogs" style="padding:10px 20px; border:none; background:#f1f5f9; color:#475569; border-radius:6px; font-weight:bold; cursor:pointer; font-size:1rem;">⚠️ Active Backlogs (${activeBacklogs.length})</button>
                    <button onclick="window.switchAdminTabUI('admin-audit')" id="btn-admin-audit" style="padding:10px 20px; border:none; background:#f1f5f9; color:#475569; border-radius:6px; font-weight:bold; cursor:pointer; font-size:1rem;">🎓 Degree Audit Check</button>
                </div>

                <div id="tab-admin-all" style="display:block; overflow-x:auto;">
                    <table style="width:100%; text-align:left; border-collapse:collapse; background:white; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                        <thead style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
                            <tr><th style="padding:12px 10px;">Code</th><th style="padding:12px 10px;">Course Title</th><th style="padding:12px 10px;">Type</th><th style="padding:12px 10px;">Cr.</th><th style="padding:12px 10px;">Marks</th><th style="padding:12px 10px;">Grade</th><th style="padding:12px 10px;">Gr. Pts</th><th style="padding:12px 10px;">Cr. Earned</th></tr>
                        </thead>
                        <tbody>${window.generateCourseTableHTML(s.courses, "No course data available.")}</tbody>
                    </table>
                </div>

                <div id="tab-admin-backlogs" style="display:none; overflow-x:auto;">
                    <table style="width:100%; text-align:left; border-collapse:collapse; background:white; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                        <thead style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
                            <tr><th style="padding:12px 10px;">Code</th><th style="padding:12px 10px;">Course Title</th><th style="padding:12px 10px;">Type</th><th style="padding:12px 10px;">Cr.</th><th style="padding:12px 10px;">Marks</th><th style="padding:12px 10px;">Grade</th><th style="padding:12px 10px;">Gr. Pts</th><th style="padding:12px 10px;">Cr. Earned</th></tr>
                        </thead>
                        <tbody>${window.generateCourseTableHTML(activeBacklogs, "🎉 Excellent! The student has no active backlogs.")}</tbody>
                    </table>
                </div>

                <div id="tab-admin-audit" style="display:none;">
                    ${window.evaluateDegree(s)}
                </div>
            `;
  }
};

window.closeFacultyStudentView = function () {
  var detailView = document.getElementById('faculty-student-detail-view');
  var wrapper = document.getElementById('faculty-table-wrapper');
  if (detailView) detailView.style.display = 'none';
  if (wrapper) wrapper.style.display = 'block';
};

// ═══════════════════════════════════════════════════════════════════════════════
//  5. STUDENT DASHBOARD RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

function renderStudentDash(student) {
    // Safe extractions directly from DB
    const studentName = student.name || 'Unknown Student';
    const studentSen = student.sen || 'N/A';
    const studentProg = student.program || '';
    const studentSchool = student.school || 'AIIT';
    
    const cgpa = window.formatCgpa(student.cgpa);
    const finalCredits = parseFloat(student.totalCredits) || 0;
    
    let validCourses = [];
    if (student.courses && Array.isArray(student.courses)) {
        validCourses = student.courses.filter(c => c && c.code && c.code.trim() !== '' && c.code.trim() !== 'NAN');
    }

    // Calculate Active Backlogs
    let activeBacklogs = window.getActiveBacklogs(validCourses);

    // UI Updates for Badges
    const senLabel = document.getElementById('dash-sen-label');
    if (senLabel) senLabel.textContent = studentSen;

    const nameEl = document.getElementById('dash-name');
    if (nameEl) nameEl.textContent = studentName;

    const progEl = document.getElementById('dash-program');
    if (progEl) progEl.textContent = studentProg;

    const avatarEl = document.getElementById('dash-avatar');
    if (avatarEl) avatarEl.textContent = studentName.charAt(0).toUpperCase();

    const cgpaEl = document.getElementById('dash-cgpa');
    if (cgpaEl) cgpaEl.textContent = cgpa;

    const ceEl = document.getElementById('dash-ce');
    if (ceEl) ceEl.textContent = finalCredits;

    const ncEl = document.getElementById('dash-nc');
    if (ncEl) ncEl.textContent = validCourses.length;

    // FIX: Protected DOM Update. Ensures we only target the small ribbon box, not the entire page wrapper!
    document.querySelectorAll('div, p, span').forEach(el => {
        if (el.textContent && el.textContent.includes('Completed Credits:') && el.textContent.includes('Backlog') && el.textContent.length < 150) {
            el.innerHTML = `Completed Credits: <strong style="color:#0f172a; margin-right: 15px;">${finalCredits}</strong> | <span style="margin-left: 15px;">Active Backlog Courses: <strong style="color:#ef4444;">${activeBacklogs.length}</strong></span>`;
        }
    });

        // Inject Tab UI Structure
        let tableContainer = document.getElementById('courses-tbody');
        if (tableContainer) tableContainer = tableContainer.closest('table').parentElement;
        
        if (tableContainer && !document.getElementById('dash-tab-nav')) {
            let tabNav = document.createElement('div');
            tabNav.id = 'dash-tab-nav';
            tabNav.style.cssText = 'display:flex; gap:10px; margin-bottom:15px; border-bottom:2px solid #e2e8f0; padding-bottom:10px; overflow-x:auto;';
            tableContainer.parentNode.insertBefore(tabNav, tableContainer);

            let backlogsDiv = document.createElement('div');
            backlogsDiv.id = 'tab-content-backlogs';
            backlogsDiv.style.display = 'none';
            backlogsDiv.innerHTML = `<table style="width:100%; text-align:left; border-collapse:collapse; background:white; border:1px solid #e2e8f0;"><thead style="background:#f8fafc; border-bottom:2px solid #e2e8f0;"><tr><th style="padding:12px 10px;">Code</th><th style="padding:12px 10px;">Course Title</th><th style="padding:12px 10px;">Type</th><th style="padding:12px 10px;">Cr.</th><th style="padding:12px 10px;">Marks</th><th style="padding:12px 10px;">Grade</th><th style="padding:12px 10px;">Gr. Pts</th><th style="padding:12px 10px;">Cr. Earned</th></tr></thead><tbody id="backlogs-tbody"></tbody></table>`;
            tableContainer.parentNode.insertBefore(backlogsDiv, tableContainer.nextSibling);

            let auditDiv = document.createElement('div');
            auditDiv.id = 'tab-content-audit';
            auditDiv.style.display = 'none';
            tableContainer.parentNode.insertBefore(auditDiv, backlogsDiv.nextSibling);

            tableContainer.id = 'tab-content-all'; // Assign ID to original table wrapper
        }

        // Global Tab Switcher Logic
        window.switchDashTab = function(tabName) {
            document.getElementById('tab-content-all').style.display = (tabName === 'all') ? 'block' : 'none';
            document.getElementById('tab-content-backlogs').style.display = (tabName === 'backlogs') ? 'block' : 'none';
            document.getElementById('tab-content-audit').style.display = (tabName === 'audit') ? 'block' : 'none';

            document.getElementById('btn-tab-all').style.background = (tabName === 'all') ? '#3b82f6' : '#f1f5f9';
            document.getElementById('btn-tab-all').style.color = (tabName === 'all') ? 'white' : '#475569';
            
            document.getElementById('btn-tab-backlogs').style.background = (tabName === 'backlogs') ? '#ef4444' : '#f1f5f9';
            document.getElementById('btn-tab-backlogs').style.color = (tabName === 'backlogs') ? 'white' : '#475569';

            document.getElementById('btn-tab-audit').style.background = (tabName === 'audit') ? '#10b981' : '#f1f5f9';
            document.getElementById('btn-tab-audit').style.color = (tabName === 'audit') ? 'white' : '#475569';
        };

        // Render Buttons and Tables
        document.getElementById('dash-tab-nav').innerHTML = `
            <button onclick="window.switchDashTab('all')" id="btn-tab-all" style="padding:10px 20px; border:none; background:#3b82f6; color:white; border-radius:6px; font-weight:bold; cursor:pointer; font-size:1rem;">📚 All Courses</button>
            <button onclick="window.switchDashTab('backlogs')" id="btn-tab-backlogs" style="padding:10px 20px; border:none; background:#f1f5f9; color:#475569; border-radius:6px; font-weight:bold; cursor:pointer; font-size:1rem;">⚠️ Active Backlogs (${activeBacklogs.length})</button>
            <button onclick="window.switchDashTab('audit')" id="btn-tab-audit" style="padding:10px 20px; border:none; background:#f1f5f9; color:#475569; border-radius:6px; font-weight:bold; cursor:pointer; font-size:1rem;">🎓 Degree Audit Check</button>
        `;

        document.getElementById('courses-tbody').innerHTML = window.generateCourseTableHTML(validCourses);
        document.getElementById('backlogs-tbody').innerHTML = window.generateCourseTableHTML(activeBacklogs, "🎉 Excellent! You have no active backlogs.");
        document.getElementById('tab-content-audit').innerHTML = window.evaluateDegree(student);

        window.switchDashTab('all'); // Default selection
    }

// ═══════════════════════════════════════════════════════════════════════════════
//  6. ADMIN DASHBOARD & SYSTEM SETUP
// ═══════════════════════════════════════════════════════════════════════════════

window.adminLogin = async function () {
  var email = sanitize(document.getElementById('a-email').value);
  var pass = document.getElementById('a-pass').value;
  hideAlerts('admin');

  if (!email || !pass) {
    showErr('admin-err', 'Please enter admin email and password.', ['a-email', 'a-pass']);
    return;
  }

  var btn = document.getElementById('admin-login-btn');
  if (btn) btn.disabled = true;

  try {
    var response = await fetch(scriptURL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'adminlogin', email: email, password: pass })
    });
    var result = await response.json();

    if (result && result.status === 'success') {
      window.currentAdminPassword = pass;
      sessionStorage.setItem(ADMIN_SESSION, pass);
      showPage('admin-dash');
      if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
      if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
      window.applyAdminFilters();
    } else {
      showErr('admin-err', '⚠ ' + ((result && result.message) || 'Invalid admin credentials.'), ['a-pass']);
    }
  } catch (err) {
    showErr('admin-err', '✗ Connection error: ' + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.adminLogout = function () {
  sessionStorage.removeItem(ADMIN_SESSION);
  window.currentAdminPassword = null;
  showPage('admin-login');
};

window.switchAdminTab = function (tabId, btnElement) {
  document.querySelectorAll('.admin-tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  var target = document.getElementById(tabId);
  if (target) target.classList.add('active');
  if (btnElement) btnElement.classList.add('active');
};

window.addSystemProgram = function () {
  const b = document.getElementById('new-batch-input').value.trim();
  const p = document.getElementById('new-program-input').value.trim();
  if (!b || !p) return alert("Please enter both Batch and Program.");
  const exists = SYSTEM_PROGRAMS.some(x => x.batch === b && x.program === p);
  if (!exists) {
    SYSTEM_PROGRAMS.push({ batch: b, program: p });
    localStorage.setItem('AIIT_SYSTEM_PROGRAMS', JSON.stringify(SYSTEM_PROGRAMS));
    window.renderSystemPrograms();
    alert(`✅ Added ${b} ${p} to the system!`);
  }
};

window.removeSystemProgram = function (index) {
  if (confirm("Remove this program? It will no longer appear in dropdowns.")) {
    SYSTEM_PROGRAMS.splice(index, 1);
    localStorage.setItem('AIIT_SYSTEM_PROGRAMS', JSON.stringify(SYSTEM_PROGRAMS));
    window.renderSystemPrograms();
  }
};

window.renderSystemPrograms = function () {
    let sysProgs = [];
    try { sysProgs = JSON.parse(localStorage.getItem('AIIT_SYSTEM_PROGRAMS')) || []; } catch(e){}

    // 1. Render Admin Setup Tags
    const container = document.getElementById('active-system-programs');
    if (container) {
        container.innerHTML = sysProgs.map((p, i) => `<span style="background: #334155; padding: 5px 10px; border-radius: 4px; color: white; font-weight:bold;">${p.batch} ${p.program} <button onclick="removeSystemProgram(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer; margin-left:5px;">✖</button></span>`).join('');
    }

    const uniqueBatches = [...new Set(sysProgs.map(p => String(p.batch).trim()))];
    const uniqueProgs = [...new Set(sysProgs.map(p => String(p.program).trim()))];

    // 2. Sync Student Directory Filters EXACTLY
    const batchFilter = document.getElementById('filter-batch');
    if (batchFilter) batchFilter.innerHTML = `<option value="">All Years</option>` + uniqueBatches.map(b => `<option value="${b}">${b}</option>`).join('');

    const progFilter = document.getElementById('filter-program');
    if (progFilter) progFilter.innerHTML = `<option value="">All Programs</option>` + uniqueProgs.map(p => `<option value="${p}">${p}</option>`).join('');

    // 3. Sync Curriculum Editor Dropdown (Format: "Batch Program")
    const currDropdown = document.getElementById('curriculum-edit-key');
    if (currDropdown) {
        const currentVal = currDropdown.value;
        currDropdown.innerHTML = sysProgs.map(p => {
            const key = `${p.batch} ${p.program}`;
            return `<option value="${key}">${key}</option>`;
        }).join('');
        
        // Try to keep previous selection, otherwise default to first
        if (currentVal && sysProgs.some(p => `${p.batch} ${p.program}` === currentVal)) {
            currDropdown.value = currentVal;
        } else if (sysProgs.length > 0) {
            currDropdown.value = `${sysProgs[0].batch} ${sysProgs[0].program}`;
        }
    }
};

window.updateUploadDropdowns = function () {
  let systemPrograms = [];
  try { systemPrograms = JSON.parse(localStorage.getItem('AIIT_SYSTEM_PROGRAMS')) || []; } catch (e) { }

  const uniqueBatches = [...new Set(systemPrograms.map(p => String(p.batch).trim()))];
  const uniqueProgs = [...new Set(systemPrograms.map(p => String(p.program).trim()))];

  const batchOptions = `<option value="">-- Select Batch --</option>` + uniqueBatches.map(b => `<option value="${b}">${b}</option>`).join('');
  const progOptions = `<option value="">-- Select Program --</option>` + uniqueProgs.map(p => `<option value="${p}">${p}</option>`).join('');

  document.querySelectorAll('.file-year-select').forEach(sel => {
    const currentVal = sel.value;
    sel.innerHTML = batchOptions;
    if (uniqueBatches.includes(currentVal)) sel.value = currentVal;
  });

  document.querySelectorAll('.file-program-select').forEach(sel => {
    const currentVal = sel.value;
    sel.innerHTML = progOptions;
    if (uniqueProgs.includes(currentVal)) sel.value = currentVal;
  });
};

window.clearPassword = async function () {
  var senInput = document.getElementById('reset-sen-input');
  var sen = sanitize(senInput ? senInput.value : '').toUpperCase();
  var statusEl = document.getElementById('reset-status');
  if (!sen) return alert("Please enter a SEN number.");

  if (!confirm(`Are you sure you want to clear the password for ${sen}?`)) return;

  if (statusEl) statusEl.textContent = '⏳ Clearing password...';

  try {
    var res = await fetch(scriptURL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'resetstudentpassword', sen: sen })
    });
    var data = await res.json();
    if (statusEl) statusEl.textContent = data.message || 'Password cleared.';
  } catch (err) {
    if (statusEl) statusEl.textContent = '❌ Error: ' + err.message;
  }
};

window.applyAdminFilters = async function () {
    var tbody = document.getElementById('admin-tbody');
    var totalStu = document.getElementById('total-stu');
    if (!tbody) return;

    try {
        var res = await fetch(scriptURL + "?action=load");
        var data = await res.json();
        var students = Array.isArray(data) ? data : (data.students || []);

        const searchInput = document.querySelector('input[placeholder*="Search"]');
        const searchTxt = searchInput ? searchInput.value.toLowerCase().trim() : "";
        
        const batchFilter = document.getElementById('filter-batch');
        const batchSel = batchFilter ? batchFilter.value.trim() : "";
        
        const progFilter = document.getElementById('filter-program');
        const progSel = progFilter ? progFilter.value.trim() : "";

        const filtered = students.filter(s => {
            const matchSearch = !searchTxt || String(s.sen).toLowerCase().includes(searchTxt) || String(s.name).toLowerCase().includes(searchTxt);
            // THE FIX: Aggressively strip whitespace from both sides before comparing!
            const matchBatch = !batchSel || String(s.batch).trim() === batchSel;
            const matchProg = !progSel || String(s.program).trim() === progSel;
            return matchSearch && matchBatch && matchProg;
        });

        if (totalStu) totalStu.textContent = filtered.length;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty" style="text-align:center; padding:20px; color:#64748b;">No student records found matching these filters.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((s, i) => {
            let isPwdSet = (s.hasPassword === true || (s.password && String(s.password).trim() !== "undefined" && String(s.password).trim() !== ""));
            return `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px;">${i + 1}</td>
                <td style="font-weight:bold; color:#0f172a;">${esc(s.sen)}</td>
                <td>${esc(s.name)}</td>
                <td>${s.courses ? s.courses.length : 0}</td>
                <td style="font-weight:bold; color:#3b82f6;">${s.cgpa || 'N/A'}</td>
                <td>${s.totalCredits || 'N/A'}</td>
                <td>${isPwdSet ? '✅ Set' : '❌ Default'}</td>
                <td><button class="btn-sm" style="background:#0ea5e9; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;" onclick="openAdminStudentView('${esc(s.sen)}')">Details</button></td>
            </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty" style="text-align:center; color:#ef4444;">Failed to load data.</td></tr>`;
    }
};

window.openAdminStudentView = async function (sen) {
    var detailView = document.getElementById('admin-student-detail-view');
    var wrapper = document.getElementById('admin-table-wrapper');
    var injected = document.getElementById('admin-injected-student-data');

    if (wrapper) wrapper.style.display = 'none';
    if (detailView) detailView.style.display = 'block';
    if (injected) injected.innerHTML = `<p style="padding:20px; font-weight:bold; color:#3b82f6;">⏳ Fetching records for ${esc(sen)} from Google Cloud Database...</p>`;

    try {
        var res = await fetch(scriptURL + "?action=load");
        var data = await res.json();
        var students = Array.isArray(data) ? data : (data.students || []);
        var s = students.find(x => String(x.sen).toUpperCase().trim() === String(sen).toUpperCase().trim());

        if (!s) {
            injected.innerHTML = `<p style="color:#ef4444; padding:20px; font-weight:bold;">❌ Error: Student SEN not found.</p>`;
            return;
        }

        // Calculate Active Backlogs
        let activeBacklogs = window.getActiveBacklogs(s.courses);
        
        // Global Tab Switcher for Admin/Faculty
        window.switchAdminTabUI = function(tabName) {
            document.getElementById('tab-admin-all').style.display = (tabName === 'admin-all') ? 'block' : 'none';
            document.getElementById('tab-admin-backlogs').style.display = (tabName === 'admin-backlogs') ? 'block' : 'none';
            document.getElementById('tab-admin-audit').style.display = (tabName === 'admin-audit') ? 'block' : 'none';

            document.getElementById('btn-admin-all').style.background = (tabName === 'admin-all') ? '#3b82f6' : '#f1f5f9';
            document.getElementById('btn-admin-all').style.color = (tabName === 'admin-all') ? 'white' : '#475569';
            
            document.getElementById('btn-admin-backlogs').style.background = (tabName === 'admin-backlogs') ? '#ef4444' : '#f1f5f9';
            document.getElementById('btn-admin-backlogs').style.color = (tabName === 'admin-backlogs') ? 'white' : '#475569';

            document.getElementById('btn-admin-audit').style.background = (tabName === 'admin-audit') ? '#10b981' : '#f1f5f9';
            document.getElementById('btn-admin-audit').style.color = (tabName === 'admin-audit') ? 'white' : '#475569';
        };

        injected.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h2 style="margin-top:0; color: #0f172a;">🎓 ${esc(s.name)} <span style="color:#64748b; font-size:1.1rem;">(${esc(s.sen)})</span></h2>
                <div style="display:flex; flex-wrap:wrap; gap:15px; margin-top:10px;">
                    <span style="background:#f8fafc; padding:6px 12px; border-radius:6px; font-weight:bold; border:1px solid #cbd5e1;">Program: ${esc(s.program || 'N/A')}</span>
                    <span style="background:#f8fafc; padding:6px 12px; border-radius:6px; font-weight:bold; border:1px solid #cbd5e1;">Batch: ${esc(s.batch || 'N/A')}</span>
                    <span style="background:#ecfdf5; padding:6px 12px; border-radius:6px; font-weight:bold; color:#10b981; border:1px solid #a7f3d0;">CGPA: ${s.cgpa || 'N/A'}</span>
                    <span style="background:#eff6ff; padding:6px 12px; border-radius:6px; font-weight:bold; color:#3b82f6; border:1px solid #bfdbfe;">Total Credits: ${s.totalCredits || '0'}</span>
                </div>
            </div>

            <div style="display:flex; gap:10px; margin-bottom:15px; border-bottom:2px solid #e2e8f0; padding-bottom:10px; overflow-x:auto;">
                <button onclick="window.switchAdminTabUI('admin-all')" id="btn-admin-all" style="padding:10px 20px; border:none; background:#3b82f6; color:white; border-radius:6px; font-weight:bold; cursor:pointer; font-size:1rem;">📚 All Courses</button>
                <button onclick="window.switchAdminTabUI('admin-backlogs')" id="btn-admin-backlogs" style="padding:10px 20px; border:none; background:#f1f5f9; color:#475569; border-radius:6px; font-weight:bold; cursor:pointer; font-size:1rem;">⚠️ Active Backlogs (${activeBacklogs.length})</button>
                <button onclick="window.switchAdminTabUI('admin-audit')" id="btn-admin-audit" style="padding:10px 20px; border:none; background:#f1f5f9; color:#475569; border-radius:6px; font-weight:bold; cursor:pointer; font-size:1rem;">🎓 Degree Audit Check</button>
            </div>

            <div id="tab-admin-all" style="display:block; overflow-x:auto;">
                <table style="width:100%; text-align:left; border-collapse:collapse; background:white; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <thead style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
                        <tr><th style="padding:12px 10px;">Code</th><th style="padding:12px 10px;">Course Title</th><th style="padding:12px 10px;">Type</th><th style="padding:12px 10px;">Cr.</th><th style="padding:12px 10px;">Marks</th><th style="padding:12px 10px;">Grade</th><th style="padding:12px 10px;">Gr. Pts</th><th style="padding:12px 10px;">Cr. Earned</th></tr>
                    </thead>
                    <tbody>${window.generateCourseTableHTML(s.courses, "No course data available.")}</tbody>
                </table>
            </div>

            <div id="tab-admin-backlogs" style="display:none; overflow-x:auto;">
                <table style="width:100%; text-align:left; border-collapse:collapse; background:white; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <thead style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
                        <tr><th style="padding:12px 10px;">Code</th><th style="padding:12px 10px;">Course Title</th><th style="padding:12px 10px;">Type</th><th style="padding:12px 10px;">Cr.</th><th style="padding:12px 10px;">Marks</th><th style="padding:12px 10px;">Grade</th><th style="padding:12px 10px;">Gr. Pts</th><th style="padding:12px 10px;">Cr. Earned</th></tr>
                    </thead>
                    <tbody>${window.generateCourseTableHTML(activeBacklogs, "🎉 Excellent! The student has no active backlogs.")}</tbody>
                </table>
            </div>

            <div id="tab-admin-audit" style="display:none;">
                ${window.evaluateDegree(s)}
            </div>
        `;
    } catch(e) {
        injected.innerHTML = `<p style="color:#ef4444; padding:20px;">❌ Failed to load Cloud Data.</p>`;
    }
};

window.closeAdminStudentView = function () {
    var detailView = document.getElementById('admin-student-detail-view');
    var wrapper = document.getElementById('admin-table-wrapper');
    var injected = document.getElementById('admin-injected-student-data');
    
    if (detailView) detailView.style.display = 'none';
    if (wrapper) wrapper.style.display = 'block';
    if (injected) injected.innerHTML = ''; // Clear memory
};

// ============================================================================
// FILE STAGING ENGINE & CLOUD UPLOADER (Ver 3.2)
// ============================================================================

window.stagedFiles = [];

window.handleFileDrop = function (e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        const input = document.getElementById('excel-upload');
        if (input) {
            input.files = files;
            window.triggerTaggedUpload();
        }
    }
};

window.triggerTaggedUpload = function () {
    const input = document.getElementById('excel-upload');
    if (!input || !input.files || input.files.length === 0) return;

    // Push selected files into the global staging array
    Array.from(input.files).forEach(file => {
        window.stagedFiles.push(file);
    });

    input.value = ""; // Clear input so the same file can be selected again if needed
    window.renderStagedFiles();
};

window.renderStagedFiles = function() {
    const container = document.getElementById('file-staging-area');
    const uploadBtn = document.getElementById('process-uploads-btn');
    if (!container) return;

    if (window.stagedFiles.length === 0) {
        container.innerHTML = "";
        if (uploadBtn) uploadBtn.style.display = 'none';
        return;
    }

    // Pull active batches/programs dynamically
    let systemPrograms = [];
    try { systemPrograms = JSON.parse(localStorage.getItem('AIIT_SYSTEM_PROGRAMS')) || []; } catch (e) { }
    
    const uniqueBatches = [...new Set(systemPrograms.map(p => String(p.batch).trim()))];
    const uniqueProgs = [...new Set(systemPrograms.map(p => String(p.program).trim()))];

    const batchOptions = `<option value="">-- Select Batch --</option>` + uniqueBatches.map(b => `<option value="${b}">${b}</option>`).join('');
    const progOptions = `<option value="">-- Select Program --</option>` + uniqueProgs.map(p => `<option value="${p}">${p}</option>`).join('');

    let html = '<div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">';
    
    // Generate a distinct UI row for every staged file
    window.stagedFiles.forEach((file, index) => {
        html += `
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px; background:white; padding:15px; border-radius:8px; border:1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="flex: 1; min-width: 200px; font-weight:bold; color:#0f172a;">📄 ${esc(file.name)}</div>
            <select id="stage-batch-${index}" style="padding:10px; border-radius:6px; border:1px solid #94a3b8; background:#f8fafc; font-weight:bold; color:#1e293b;">${batchOptions}</select>
            <select id="stage-prog-${index}" style="padding:10px; border-radius:6px; border:1px solid #94a3b8; background:#f8fafc; font-weight:bold; color:#1e293b;">${progOptions}</select>
            <button onclick="removeStagedFile(${index})" style="background:#ef4444; color:white; border:none; padding:10px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">✖</button>
        </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
    if (uploadBtn) uploadBtn.style.display = 'block';
};

window.removeStagedFile = function(index) {
    window.stagedFiles.splice(index, 1);
    window.renderStagedFiles();
};

window.uploadStagedFiles = function() {
    if (window.stagedFiles.length === 0) return;

    for (let i = 0; i < window.stagedFiles.length; i++) {
        const b = document.getElementById(`stage-batch-${i}`).value;
        const p = document.getElementById(`stage-prog-${i}`).value;
        if (!b || !p) {
            alert(`⚠️ Please select a Batch and Program for file #${i + 1} before uploading.`);
            return;
        }
    }

    const btn = document.getElementById('process-uploads-btn');
    if (btn) { btn.innerHTML = "⏳ Parsing Excel Data..."; btn.disabled = true; }

    let allParsedStudents = {};
    let filesProcessed = 0;

    window.stagedFiles.forEach((file, index) => {
        const uploadBatch = document.getElementById(`stage-batch-${index}`).value;
        const uploadProg = document.getElementById(`stage-prog-${index}`).value;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet);

                rows.forEach(row => {
                    const cleanRow = {};
                    for (let key in row) cleanRow[key.toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase()] = row[key];

                    const sen = String(cleanRow['sen'] || cleanRow['rollno'] || '').toUpperCase().trim();
                    if (!sen || sen === 'NAN' || sen === 'UNDEFINED') return;

                    if (!allParsedStudents[sen]) {
                        allParsedStudents[sen] = {
                            sen: sen,
                            name: cleanRow['name'] || cleanRow['studentname'] || "Unknown",
                            program: uploadProg,
                            batch: uploadBatch,
                            school: cleanRow['school'] || cleanRow['institute'] || "AIIT",
                            cgpa: 0,
                            totalCredits: 0,
                            courses: []
                        };
                    }

                    // --- THE FIX: STRICT MATCHING FOR SUMMARY ROWS ---
                    
                    let cgpaKey = Object.keys(cleanRow).find(k => k === 'cgpa' || k === 'finalcgpa');
                    if (cgpaKey) {
                        let cgpaVal = parseFloat(cleanRow[cgpaKey]);
                        if (!isNaN(cgpaVal) && cgpaVal > 0) allParsedStudents[sen].cgpa = cgpaVal;
                    }

                    // STRICT FIX: Only look for exactly "earned" or "totalcredits". 
                    // Prevents accidentally grabbing "1-Total Credit points" (which causes the 494/629 bug).
                    let credKey = Object.keys(cleanRow).find(k => k === '1creditearned' || k === 'creditearned' || k === 'totalcredits' || k === 'creditbalance');
                    if (credKey) {
                        let credVal = parseFloat(cleanRow[credKey]);
                        if (!isNaN(credVal) && credVal > 0) allParsedStudents[sen].totalCredits = credVal;
                    }

                    // --- EXTRACT COURSES ---
                    let courseCode = "";
                    let courseName = "";
                    let credits = 0;
                    let grade = "";
                    let marks = 0;
                    let type = "Core";

                    for (let key in cleanRow) {
                        if (key.includes('coursecode') || key === 'code') courseCode = String(cleanRow[key]).trim().toUpperCase();
                        else if (key.includes('coursetitle') || key.includes('coursename')) courseName = String(cleanRow[key]).trim();
                        else if (key === '1creditregistered' || key.includes('coursecredits') || key === 'credits') credits = parseFloat(cleanRow[key]);
                        else if (key.includes('finalgrade') || key === 'grade') grade = String(cleanRow[key]).toUpperCase().trim();
                        else if (key.includes('totalmarks') || key === 'marks') marks = parseFloat(cleanRow[key]);
                        else if (key.includes('coursetype') || key === 'type') type = String(cleanRow[key]).trim();
                    }

                    if (courseCode && courseCode !== "NAN" && courseCode !== "UNDEFINED" && courseCode !== "") {
                        allParsedStudents[sen].courses.push({
                            code: courseCode,
                            name: courseName,
                            credits: isNaN(credits) ? 3 : credits,
                            grade: grade,
                            type: type,
                            marks: isNaN(marks) ? 0 : marks
                        });
                    }
                });
            } catch (err) {
                console.error(`Error parsing ${file.name}:`, err);
            }

            filesProcessed++;

            if (filesProcessed === window.stagedFiles.length) {
                const payloadStudents = Object.values(allParsedStudents);

                if (payloadStudents.length === 0) {
                    alert("❌ No valid student records found.");
                    resetStagingUI();
                    return;
                }

                if (btn) btn.innerHTML = `☁️ Syncing ${payloadStudents.length} students to Cloud...`;
                const adminPass = window.currentAdminPassword || sessionStorage.getItem('coe_admin_auth') || '';

                fetch(scriptURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({ action: 'upsert', adminPassword: adminPass, students: payloadStudents })
                })
                .then(res => res.json())
                .then(result => {
                    if (result.status === 'success') {
                        alert(`✅ SUCCESS! ${window.stagedFiles.length} file(s) parsed and ${payloadStudents.length} student records synchronized.`);
                        window.stagedFiles = []; 
                        window.renderStagedFiles();
                        if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
                    } else {
                        alert(`❌ Cloud Upload Failed: ${result.message}`);
                    }
                })
                .catch(err => { alert(`❌ Network Error: ${err.message}`); })
                .finally(() => { resetStagingUI(); });
            }
        };
        reader.readAsArrayBuffer(file);
    });
};

function resetStagingUI() {
    const btn = document.getElementById('process-uploads-btn');
    if (btn) { btn.innerHTML = "🚀 Upload All Files to Cloud DB"; btn.disabled = false; }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  7. CURRICULUM EDITOR & CLOUD SYNC
// ═══════════════════════════════════════════════════════════════════════════════

window.loadCurriculumEditor = function () {
    const dropdown = document.getElementById('curriculum-edit-key');
    const container = document.getElementById('curriculum-gui-container');
    if (!dropdown || !container) return;

    const key = dropdown.value;
    window.currentEditingKey = key;

    // Ensure rule arrays exist safely
    if (!window.CURRICULUM_RULES) window.CURRICULUM_RULES = {};
    if (!window.CURRICULUM_RULES[key]) window.CURRICULUM_RULES[key] = [];
    
    const rules = window.CURRICULUM_RULES[key];

    if (rules.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 2rem; color: #64748b;">
                <p>No curriculum rules defined for ${key}.</p>
                <p>Use "Bulk Upload Excel Curriculum" or create a category below.</p>
            </div>
            <button onclick="createNewMainCategory()" style="width:100%; padding:15px; margin-top:20px; background:#10b981; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">➕ Create New Main Category</button>
        `;
        return;
    }

    let html = '';

    rules.forEach((mainCat, mainIndex) => {
        // Auto-upgrade legacy arrays to the new Sub-Category format
        let subCats = mainCat.subCategories || [];
        if (subCats.length === 0 && mainCat.codes && mainCat.codes.length > 0) {
            subCats = [{ name: "General Courses", minCredits: mainCat.minCredits, codes: mainCat.codes }];
            mainCat.subCategories = subCats; // Save the upgrade
        }

        // --- 1. MAIN CATEGORY CONTAINER ---
        html += `
        <div style="background:white; padding:20px; border-radius:8px; border:1px solid #93c5fd; margin-bottom:20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <h3 style="margin:0; color:#0ea5e9; font-size:1.4rem;">📁 ${esc(mainCat.category)}</h3>
                    <button onclick="renameMainCategory(${mainIndex})" style="background:#0ea5e9; color:white; border:none; border-radius:4px; padding:4px 10px; cursor:pointer; font-size:0.9rem; font-weight:bold;">Rename</button>
                </div>
                <button onclick="deleteMainCategory(${mainIndex})" style="background:#ef4444; color:white; border:none; border-radius:4px; padding:6px 12px; cursor:pointer; font-weight:bold;">🗑️ Delete Main Category</button>
            </div>
            
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                <span style="color:#10b981; font-weight:bold; font-size:1.1rem;">Total Required: ${mainCat.minCredits} Credits</span>
                <button onclick="editMainCredits(${mainIndex})" style="background:#64748b; color:white; border:none; border-radius:4px; padding:4px 10px; cursor:pointer; font-size:0.9rem; font-weight:bold;">Edit Credits</button>
            </div>
        `;

        // --- 2. SUB CATEGORIES LOOP ---
        subCats.forEach((sub, subIndex) => {
            html += `
            <div style="background:#0f172a; padding:15px; border-radius:8px; margin-bottom:15px; color:white; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #334155; padding-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <h4 style="margin:0; font-size:1.2rem; color:#f8fafc;">📄 ${esc(sub.name)}</h4>
                        <button onclick="renameSubCategory(${mainIndex}, ${subIndex})" style="background:#0ea5e9; color:white; border:none; border-radius:4px; padding:4px 10px; cursor:pointer; font-size:0.8rem; font-weight:bold;">Rename</button>
                    </div>
                    <button onclick="deleteSubCategory(${mainIndex}, ${subIndex})" style="background:transparent; border:1px solid #ef4444; color:#ef4444; border-radius:4px; padding:4px 10px; cursor:pointer; font-size:0.8rem;">🗑️ Remove Sub</button>
                </div>
                
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                    <span style="color:#94a3b8; font-size:1rem;">(Min ${sub.minCredits} Credits)</span>
                    <button onclick="editSubCredits(${mainIndex}, ${subIndex})" style="background:#475569; color:white; border:none; border-radius:4px; padding:4px 10px; cursor:pointer; font-size:0.8rem;">Edit Credits</button>
                </div>

                <div style="overflow-x:auto;">
                    <table style="width:100%; text-align:left; border-collapse:collapse; margin-bottom:15px; min-width: 500px;">
                        <thead>
                            <tr style="border-bottom:2px solid #334155; color:#94a3b8; font-size:0.8rem; text-transform:uppercase;">
                                <th style="padding:10px 5px;">CODE</th>
                                <th style="padding:10px 5px;">COURSE NAME</th>
                                <th style="padding:10px 5px; text-align:center;">CREDITS</th>
                                <th style="padding:10px 5px; text-align:right;">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            if (sub.codes && sub.codes.length > 0) {
                sub.codes.forEach((code, codeIndex) => {
                    const info = window.getCourseInfo(code);
                    html += `
                            <tr style="border-bottom:1px solid #1e293b; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#1e293b'" onmouseout="this.style.backgroundColor='transparent'">
                                <td style="padding:12px 5px; font-weight:bold; color:#f8fafc;">${esc(code)}</td>
                                <td style="padding:12px 5px; color:#cbd5e1;">${esc(info.name)}</td>
                                <td style="padding:12px 5px; color:#3b82f6; font-weight:bold; text-align:center;">${info.credits}</td>
                                <td style="padding:12px 5px; text-align:right; white-space: nowrap;">
                                    <button onclick="editCourseCode(${mainIndex}, ${subIndex}, ${codeIndex})" style="background:#eab308; color:#451a03; border:none; border-radius:4px; padding:4px 10px; cursor:pointer; font-size:0.8rem; margin-right:5px; font-weight:bold;">Edit</button>
                                    <button onclick="removeCourseCode(${mainIndex}, ${subIndex}, ${codeIndex})" style="background:#ef4444; color:white; border:none; border-radius:4px; padding:4px 10px; cursor:pointer; font-size:0.8rem; font-weight:bold;">Remove</button>
                                </td>
                            </tr>
                    `;
                });
            } else {
                 html += `<tr><td colspan="4" style="padding:20px 0; text-align:center; color:#64748b;">No courses added yet. Click below to add one.</td></tr>`;
            }

            html += `
                        </tbody>
                    </table>
                </div>
                <button onclick="addCourseToSub(${mainIndex}, ${subIndex})" style="background:#2563eb; color:white; border:none; border-radius:6px; padding:10px 15px; cursor:pointer; font-weight:bold;">➕ Add Course to ${esc(sub.name)}</button>
            </div>
            `;
        });

        html += `
            <button onclick="addSubCategory(${mainIndex})" style="background:#10b981; color:white; border:none; border-radius:6px; padding:10px 15px; cursor:pointer; font-weight:bold;">➕ Add Sub-Category</button>
        </div>
        `;
    });

    // Add the global "Create New Main Category" button at the absolute bottom
    html += `<button onclick="createNewMainCategory()" style="width:100%; padding:15px; margin-top:10px; background:#10b981; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:1.1rem; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);">➕ Create New Main Category</button>`;

    container.innerHTML = html;
};

// --- CURRICULUM UI HELPER FUNCTIONS ---

window.createNewMainCategory = function() {
    const name = prompt("Enter new Main Category name (e.g., '1. Core Courses'):");
    if(!name) return;
    window.CURRICULUM_RULES[window.currentEditingKey].push({ category: name, minCredits: 0, subCategories: [] });
    window.loadCurriculumEditor();
};

window.renameMainCategory = function(mIndex) {
    const cat = window.CURRICULUM_RULES[window.currentEditingKey][mIndex];
    const newName = prompt("Rename Main Category:", cat.category);
    if(newName) { cat.category = newName; window.loadCurriculumEditor(); }
};

window.deleteMainCategory = function(mIndex) {
    if(confirm("Are you sure you want to delete this ENTIRE main category and all its subjects?")) {
        window.CURRICULUM_RULES[window.currentEditingKey].splice(mIndex, 1);
        window.loadCurriculumEditor();
    }
};

window.editMainCredits = function(mIndex) {
    const cat = window.CURRICULUM_RULES[window.currentEditingKey][mIndex];
    const creds = prompt("Enter total required credits for this category:", cat.minCredits);
    if(creds !== null && !isNaN(creds)) { cat.minCredits = parseFloat(creds); window.loadCurriculumEditor(); }
};

window.addSubCategory = function(mIndex) {
    const cat = window.CURRICULUM_RULES[window.currentEditingKey][mIndex];
    const name = prompt("Enter Sub-Category name (e.g., 'General Courses'):");
    if(name) {
        if(!cat.subCategories) cat.subCategories = [];
        cat.subCategories.push({ name: name, minCredits: 0, codes: [] });
        window.loadCurriculumEditor();
    }
};

window.renameSubCategory = function(mIndex, sIndex) {
    const sub = window.CURRICULUM_RULES[window.currentEditingKey][mIndex].subCategories[sIndex];
    const newName = prompt("Rename Sub-Category:", sub.name);
    if(newName) { sub.name = newName; window.loadCurriculumEditor(); }
};

window.deleteSubCategory = function(mIndex, sIndex) {
    if(confirm("Delete this sub-category and all its subjects?")) {
        window.CURRICULUM_RULES[window.currentEditingKey][mIndex].subCategories.splice(sIndex, 1);
        window.loadCurriculumEditor();
    }
};

window.editSubCredits = function(mIndex, sIndex) {
    const sub = window.CURRICULUM_RULES[window.currentEditingKey][mIndex].subCategories[sIndex];
    const creds = prompt("Enter min credits for this sub-category:", sub.minCredits);
    if(creds !== null && !isNaN(creds)) { sub.minCredits = parseFloat(creds); window.loadCurriculumEditor(); }
};

window.addCourseToSub = function(mIndex, sIndex) {
    const sub = window.CURRICULUM_RULES[window.currentEditingKey][mIndex].subCategories[sIndex];
    const code = prompt("1/3: Enter exact Course Code (e.g., 'MGT1001'):");
    
    if (code) {
        const cleanCode = code.toUpperCase().trim();
        const name = prompt(`2/3: Enter Course Name for ${cleanCode}:`, "New Course");
        const creds = prompt(`3/3: Enter Credits for ${cleanCode}:`, "3");
        
        let parsedCreds = 3;
        if (creds !== null && creds !== undefined && String(creds).trim() !== "") {
            parsedCreds = parseFloat(creds);
            if (isNaN(parsedCreds)) parsedCreds = 3;
        }

        sub.codes.push(cleanCode);
        
        // Save to Custom Dictionary so it renders correctly everywhere
        if (!window.CUSTOM_COURSE_DICT) window.CUSTOM_COURSE_DICT = {};
        window.CUSTOM_COURSE_DICT[cleanCode] = { name: name || "Unknown", credits: parsedCreds };
        localStorage.setItem('AIIT_CUSTOM_COURSES', JSON.stringify(window.CUSTOM_COURSE_DICT));
        
        window.loadCurriculumEditor();
    }
};

window.editCourseCode = function(mIndex, sIndex, cIndex) {
    const sub = window.CURRICULUM_RULES[window.currentEditingKey][mIndex].subCategories[sIndex];
    const oldCode = sub.codes[cIndex];
    const existingInfo = window.getCourseInfo(oldCode);
    
    const newCode = prompt("1/3: Edit Course Code:", oldCode);
    if (newCode) { 
        const cleanCode = newCode.toUpperCase().trim();
        sub.codes[cIndex] = cleanCode; 
        
        const newName = prompt(`2/3: Edit Course Name for ${cleanCode}:`, existingInfo.name);
        const newCreds = prompt(`3/3: Edit Credits for ${cleanCode}:`, existingInfo.credits);
        
        let parsedCreds = 3;
        if (newCreds !== null && newCreds !== undefined && String(newCreds).trim() !== "") {
            parsedCreds = parseFloat(newCreds);
            if (isNaN(parsedCreds)) parsedCreds = 3;
        }

        if (!window.CUSTOM_COURSE_DICT) window.CUSTOM_COURSE_DICT = {};
        window.CUSTOM_COURSE_DICT[cleanCode] = { name: newName || "Unknown", credits: parsedCreds };
        localStorage.setItem('AIIT_CUSTOM_COURSES', JSON.stringify(window.CUSTOM_COURSE_DICT));
        
        window.loadCurriculumEditor(); 
    }
};

window.removeCourseCode = function(mIndex, sIndex, cIndex) {
    if(confirm("Remove this course code from the basket?")) {
        window.CURRICULUM_RULES[window.currentEditingKey][mIndex].subCategories[sIndex].codes.splice(cIndex, 1);
        window.loadCurriculumEditor();
    }
};

window.resetCurriculumEditor = function () {
  if (confirm("Reset curriculum rules to defaults?")) {
    window.CURRICULUM_RULES = BASE_CURRICULUM;
    localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(BASE_CURRICULUM));
    window.loadCurriculumEditor();
    alert("Reverted to base curriculum.");
  }
};

window.clearEntireCurriculum = function () {
  const key = document.getElementById('curriculum-edit-key').value;
  if (confirm(`⚠️ WARNING: Permanently delete curriculum for ${key}?`)) {
    window.CURRICULUM_RULES[key] = [];
    localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(window.CURRICULUM_RULES));
    window.loadCurriculumEditor();
    alert(`Cleared curriculum for ${key}.`);
  }
};

window.syncCloudCurriculum = function () {
    if (!scriptURL || scriptURL === "YOUR_WEB_APP_URL_HERE") return;

    fetch(scriptURL + "?action=getCurriculum")
        .then(res => res.text())
        .then(data => {
            if (data && data.trim().startsWith("{")) {
                try {
                    const parsed = JSON.parse(data);
                    
                    // Check if it's the Universal Payload (V1.5) or Legacy data
                    if (parsed.rules) {
                        window.CURRICULUM_RULES = parsed.rules;
                        window.CUSTOM_COURSE_DICT = parsed.courses || {};
                        if (parsed.programs && parsed.programs.length > 0) {
                            localStorage.setItem('AIIT_SYSTEM_PROGRAMS', JSON.stringify(parsed.programs));
                        }
                    } else {
                        window.CURRICULUM_RULES = parsed; // Legacy Fallback
                    }
                    
                    // Push to fresh computer's local memory
                    localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(window.CURRICULUM_RULES));
                    localStorage.setItem('AIIT_CUSTOM_COURSES', JSON.stringify(window.CUSTOM_COURSE_DICT));
                    
                    // Automatically build the Admin UI so the user doesn't see a blank screen
                    if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
                    if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
                    if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
                    
                    console.log("✅ Universal Sync Complete: System is mirrored on this device.");
                } catch (e) { console.error("Universal Sync Parse error:", e); }
            }
        })
        .catch(err => console.error("❌ Sync Error:", err));
};

window.saveCurriculumToCloud = function () {
    let sysProgs = [];
    try { sysProgs = JSON.parse(localStorage.getItem('AIIT_SYSTEM_PROGRAMS')) || []; } catch(e){}

    const masterPayload = {
        rules: window.CURRICULUM_RULES || {},
        programs: sysProgs,
        courses: window.CUSTOM_COURSE_DICT || {}
    };

    localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(masterPayload.rules));
    localStorage.setItem('AIIT_CUSTOM_COURSES', JSON.stringify(masterPayload.courses));

    if (typeof scriptURL !== 'undefined' && scriptURL !== "YOUR_WEB_APP_URL_HERE") {
        const formData = new FormData();
        formData.append('action', 'saveCurriculum');
        formData.append('curriculumData', JSON.stringify(masterPayload));

        fetch(scriptURL, { method: 'POST', body: formData })
            .then(res => res.text())
            .then(txt => {
                console.log("☁️ Manual Cloud Sync:", txt);
                alert("✅ CLOUD SYNC COMPLETE: Curriculum Updated Successfully!");
            })
            .catch(err => {
                console.error("☁️ Cloud Error:", err);
                alert("❌ CLOUD SYNC FAILED: Saved only locally.");
            });
    } else {
        alert("⚠️ Curriculum Updated Locally, scriptURL is missing.");
    }
};

window.handleBulkCurriculumUpload = function (event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        const keyDropdown = document.getElementById('curriculum-edit-key');
        if (!keyDropdown || !keyDropdown.value) {
            alert("❌ ERROR: Please select Batch & Program from dropdown first!");
            event.target.value = '';
            return;
        }
        window.currentEditingKey = keyDropdown.value;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet);

                let newRules = [];
                let mainMap = {};
                if (!window.CUSTOM_COURSE_DICT) window.CUSTOM_COURSE_DICT = {};

                rows.forEach(row => {
                    const cleanRow = {};
                    for (let key in row) cleanRow[key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()] = row[key];

                    const mainCat = cleanRow['maincategory'] || cleanRow['category'];
                    if (!mainCat) return;

                    const safeNum = (val, def) => {
                        if (val === undefined || val === null || String(val).trim() === '') return def;
                        return isNaN(parseFloat(val)) ? def : parseFloat(val);
                    };

                    const mainCreds = safeNum(cleanRow['maincredits'] || cleanRow['mincredits'], 0);
                    const subCat = (cleanRow['subcategory'] && String(cleanRow['subcategory']).trim() !== "") ? String(cleanRow['subcategory']).trim() : "General Courses";
                    let subCreds = safeNum(cleanRow['subcredits'], null);
                    if (subCreds === null) subCreds = (subCat === "General Courses") ? mainCreds : 0;

                    const code = String(cleanRow['coursecode'] || cleanRow['code'] || "").trim().toUpperCase();
                    const courseName = String(cleanRow['coursename'] || cleanRow['name'] || "").trim();
                    const courseCreds = safeNum(cleanRow['credits'] || cleanRow['credit'] || cleanRow['coursecredits'], 3);

                    if (code && code !== "UNDEFINED" && code !== "NAN") {
                        // Register into Master Custom Course Dictionary immediately
                        window.CUSTOM_COURSE_DICT[code] = {
                            name: (courseName && courseName !== "Course Title") ? courseName : code,
                            credits: courseCreds
                        };
                    }

                    if (!mainMap[mainCat]) {
                        mainMap[mainCat] = { category: mainCat, minCredits: mainCreds, subCategories: {} };
                        newRules.push(mainMap[mainCat]);
                    }
                    if (!mainMap[mainCat].subCategories[subCat]) {
                        mainMap[mainCat].subCategories[subCat] = { name: subCat, minCredits: subCreds, codes: [] };
                    }
                    if (code && code !== "UNDEFINED" && code !== "NAN") {
                        mainMap[mainCat].subCategories[subCat].codes.push(code);
                    }
                });

                newRules.forEach(rule => { rule.subCategories = Object.values(rule.subCategories); });

                if (!window.CURRICULUM_RULES) window.CURRICULUM_RULES = {};
                window.CURRICULUM_RULES[window.currentEditingKey] = newRules;

                // Save both rules and custom course names to LocalStorage & Cloud
                localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(window.CURRICULUM_RULES));
                localStorage.setItem('AIIT_CUSTOM_COURSES', JSON.stringify(window.CUSTOM_COURSE_DICT));

                window.loadCurriculumEditor();
                if (typeof window.saveCurriculumToCloud === 'function') {
                    window.saveCurriculumToCloud();
                }
                
                alert(`✅ SUCCESS! Imported ${newRules.length} Main Categories and registered all Course Titles into the Master Dictionary.`);
            } catch (err) { alert("❌ Excel Parse Error: " + err.message); }
        };
        reader.readAsArrayBuffer(file);
    } catch (err) { alert("❌ CRITICAL ERROR: " + err.message); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  8. FILTER & DEGREE AUDIT ENGINES
// ═══════════════════════════════════════════════════════════════════════════════

window.nuclearDropdownEnforcer = function () {
  let systemPrograms = [];
  try {
    const savedData = localStorage.getItem('AIIT_SYSTEM_PROGRAMS');
    systemPrograms = savedData ? JSON.parse(savedData) : [];
  } catch (e) {
    systemPrograms = [];
  }

  if (systemPrograms.length === 0) return;

  const uniqueBatches = [...new Set(systemPrograms.map(p => String(p.batch).trim()))];
  const uniqueProgs = [...new Set(systemPrograms.map(p => String(p.program).trim()))];

  const batchOptionsHTML = `<option value="">-- Select Batch --</option>` + uniqueBatches.map(b => `<option value="${b}">${b}</option>`).join('');
  const progOptionsHTML = `<option value="">-- Select Program --</option>` + uniqueProgs.map(p => `<option value="${p}">${p}</option>`).join('');

  document.querySelectorAll('select').forEach(sel => {
    if (sel.id === 'curriculum-edit-key') return;
    const textContent = sel.textContent.toUpperCase();

    if (textContent.includes('PROGRAM') || textContent.includes('MSC') || textContent.includes('MCA')) {
      if (sel.options.length !== (uniqueProgs.length + 1)) sel.innerHTML = progOptionsHTML;
    } else if (textContent.includes('BATCH') || textContent.includes('2024') || textContent.includes('2025')) {
      if (sel.options.length !== (uniqueBatches.length + 1)) sel.innerHTML = batchOptionsHTML;
    }
  });
};

window.filterBacklogs = function () {
  let activeBatch = "";
  let activeProgram = "";
  let searchText = "";

  const searchInput = document.querySelector('input[type="text"]');
  if (searchInput) searchText = searchInput.value.toLowerCase().trim();

  document.querySelectorAll('select').forEach(sel => {
    const selectedValue = sel.value.trim();
    const allOptionsText = sel.textContent.toUpperCase();

    if (selectedValue === "" || selectedValue.toLowerCase().includes("select") || selectedValue.toLowerCase().includes("all")) return;

    if (allOptionsText.includes('BATCH') || allOptionsText.includes('2024') || allOptionsText.includes('2025')) {
      activeBatch = selectedValue;
    }
    if (allOptionsText.includes('PROGRAM') || allOptionsText.includes('MSC') || allOptionsText.includes('MCA')) {
      activeProgram = selectedValue;
    }
  });

  const allStudents = window.STUDENTS || window.ALL_STUDENTS || [];

  const filteredStudents = allStudents.filter(student => {
    const sBatch = String(student.batch || "").trim();
    const sProg = String(student.program || "").trim();

    const passesBatch = (activeBatch === "") || (sBatch === activeBatch);
    const passesProgram = (activeProgram === "") || (sProg === activeProgram);
    const passesSearch = (searchText === "") ||
      String(student.sen || "").toLowerCase().includes(searchText) ||
      String(student.name || "").toLowerCase().includes(searchText);

    let hasBacklog = false;
    if (student.backlogs > 0) hasBacklog = true;
    if (student.courses && Array.isArray(student.courses)) {
      hasBacklog = hasBacklog || student.courses.some(c => {
        const grade = String(c.grade || c.Grade || "").toUpperCase().trim();
        return ['F', 'AB', 'DE', 'I', 'U'].includes(grade);
      });
    }

    return passesBatch && passesProgram && passesSearch && hasBacklog;
  });

  renderStudentTable(filteredStudents);
};

    // --- SMART BACKLOG ENGINE ---
    window.getActiveBacklogs = function(courses) {
        let courseHistory = {};
        (courses || []).forEach(c => {
            if(!c.code || c.code === 'NAN') return;
            let code = String(c.code).toUpperCase().trim();
            // Track the course. If it's passed at ANY point, it clears the backlog.
            if (!courseHistory[code]) courseHistory[code] = { passed: false, latest: c };
            let isFail = ['F', 'AB', 'DE', 'I', 'U'].includes(String(c.grade).toUpperCase().trim());
            if (!isFail) courseHistory[code].passed = true; 
            else if (!courseHistory[code].passed) courseHistory[code].latest = c; // keep the fail record if not passed yet
        });
        let activeBacklogs = [];
        for (let code in courseHistory) {
            if (!courseHistory[code].passed) activeBacklogs.push(courseHistory[code].latest);
        }
        return activeBacklogs;
    };

    // --- UNIVERSAL TABLE GENERATOR ---
    window.generateCourseTableHTML = function(courses, emptyMsg = "No course data available.") {
        if (!courses || courses.length === 0) {
            return `<tr><td colspan="8" style="text-align:center; padding:25px; color:#64748b; font-size:1.1rem;">${emptyMsg}</td></tr>`;
        }
        return courses.map(c => {
            const gradeStr = String(c.grade).toUpperCase().trim();
            const isFail = ['F', 'AB', 'DE', 'I', 'U'].includes(gradeStr);
            
            // THE FIX: If Excel gives 0 credits (due to F grade), forcefully extract the base credit from the DB.
            const baseCr = (parseFloat(c.credits) > 0) ? parseFloat(c.credits) : (window.getCourseInfo(c.code).credits || 0);
            const earnedCr = isFail ? 0 : baseCr;
            
            return `
            <tr style="border-bottom:1px solid #e2e8f0; transition: background 0.2s;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
                <td style="padding:12px 10px;"><strong>${esc(c.code)}</strong></td>
                <td style="padding:12px 10px;">${esc(c.name && c.name !== 'Course Title' ? c.name : window.getCourseInfo(c.code).name)}</td>
                <td style="padding:12px 10px;">${esc(c.type || 'Core')}</td>
                <td style="padding:12px 10px; font-weight:bold;">${baseCr}</td>
                <td style="padding:12px 10px;">${c.marks || '—'}</td>
                <td style="padding:12px 10px;"><span style="padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.85rem; background:${isFail ? '#fee2e2' : '#dcfce3'}; color:${isFail ? '#dc2626' : '#16a34a'};">${esc(c.grade)}</span></td>
                <td style="padding:12px 10px;">${c.gradePoints || '—'}</td>
                <td style="padding:12px 10px; font-weight:bold; color:#0f172a;">${earnedCr}</td>
            </tr>`;
        }).join('');
    };

window.evaluateDegree = function (student) {
    let latestCurriculum = {};
    try {
        const storedCurriculum = localStorage.getItem('AIIT_CUSTOM_CURRICULUM');
        if (storedCurriculum) {
            latestCurriculum = JSON.parse(storedCurriculum);
            window.CURRICULUM_RULES = latestCurriculum;
        }
    } catch (e) { }

    const studentBatch = String(student.batch || "").trim();
    const studentProg = String(student.program || "").trim();
    const mapKeySpace = `${studentBatch} ${studentProg}`;
    const mapKeyUnderscore = `${studentBatch}_${studentProg}`;

    const rulesToUse = latestCurriculum[mapKeySpace] || latestCurriculum[mapKeyUnderscore] || window.CURRICULUM_RULES[mapKeySpace] || window.CURRICULUM_RULES[mapKeyUnderscore];
    
    if (!rulesToUse || rulesToUse.length === 0) {
        return `<div style="text-align:center; padding:25px; background:#f8fafc; border-radius:10px; border:2px dashed #cbd5e1; margin-top:20px;">
                    <h3 style="color:#ef4444; margin-top:0;">📭 Curriculum Not Mapped</h3>
                    <p style="color:#475569; font-size:1.1rem;">No curriculum rules found for <b>${mapKeySpace}</b>.</p>
                </div>`;
    }

    const cleanString = (str) => String(str).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const isPass = (grade) => !['F', 'AB', 'DE', 'I', 'U'].includes(String(grade).toUpperCase().trim());
    
    let earnedCourses = (student.courses || []).map(c => ({
        ...c,
        cleanCode: cleanString(c.code || c.CourseCode),
        grade: String(c.grade || c.Grade || "").toUpperCase().trim()
    }));
    earnedCourses.sort((a, b) => (isPass(b.grade) ? 1 : 0) - (isPass(a.grade) ? 1 : 0));

    // Track all course codes required across all official baskets
    let officialRequiredCodes = new Set();
    rulesToUse.forEach(mainBasket => {
        let subCats = mainBasket.subCategories || [];
        if (subCats.length === 0 && mainBasket.codes) {
            subCats = [{ codes: mainBasket.codes }];
        }
        subCats.forEach(sub => {
            (sub.codes || []).forEach(cCode => officialRequiredCodes.add(cleanString(cCode)));
        });
    });

    // Track which official codes have been matched
    let matchedOfficialCodes = new Set();
    let auditHTML = `<div class="audit-wrapper" style="margin-top: 10px;">`;

    rulesToUse.forEach(mainBasket => {
        let basketReq = mainBasket.minCredits || 0;
        let basketEarned = 0;
        let subHTML = "";

        let subCats = mainBasket.subCategories || [];
        if (subCats.length === 0 && mainBasket.codes) {
            subCats = [{ name: "General Courses", minCredits: basketReq, codes: mainBasket.codes }];
        }

        subCats.forEach(sub => {
            let subReq = sub.minCredits || 0;
            let subEarned = 0;
            let coursesHTML = "";

            (sub.codes || []).forEach(reqCode => {
                const cleanReq = cleanString(reqCode);
                const match = earnedCourses.find(c => c.cleanCode === cleanReq && isPass(c.grade));
                const info = window.getCourseInfo(reqCode);

                if (match) {
                    matchedOfficialCodes.add(cleanReq);
                    let cr = parseFloat(match.credits || info.credits || 0);
                    subEarned += cr;
                    basketEarned += cr;
                    coursesHTML += `
                        <tr style="background:#ecfdf5;">
                            <td style="padding:8px; border-bottom:1px solid #d1fae5; color:#065f46; font-weight:bold;">${esc(reqCode)}</td>
                            <td style="padding:8px; border-bottom:1px solid #d1fae5; color:#065f46;">${esc(match.name || info.name)}</td>
                            <td style="padding:8px; border-bottom:1px solid #d1fae5; color:#065f46; font-weight:bold;">${cr} Cr</td>
                            <td style="padding:8px; border-bottom:1px solid #d1fae5; color:#065f46; text-align:center;">✅ Passed (${esc(match.grade)})</td>
                        </tr>`;
                } else {
                    coursesHTML += `
                        <tr>
                            <td style="padding:8px; border-bottom:1px solid #f1f5f9; color:#64748b; font-weight:bold;">${esc(reqCode)}</td>
                            <td style="padding:8px; border-bottom:1px solid #f1f5f9; color:#64748b;">${esc(info.name)}</td>
                            <td style="padding:8px; border-bottom:1px solid #f1f5f9; color:#64748b; font-weight:bold;">${info.credits} Cr</td>
                            <td style="padding:8px; border-bottom:1px solid #f1f5f9; color:#f59e0b; text-align:center;">⏳ Pending</td>
                        </tr>`;
                }
            });

            subHTML += `
                <div style="margin-top:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
                    <h5 style="margin:0 0 10px 0; color:#334155; display:flex; justify-content:space-between; font-size:1.05rem;">
                        <span>📄 ${esc(sub.name)}</span>
                        <span>Earned: <span style="color:#3b82f6;">${subEarned}</span> / ${subReq}</span>
                    </h5>
                    <table style="width:100%; text-align:left; border-collapse:collapse; font-size:0.9rem;">
                        <tbody>${coursesHTML}</tbody>
                    </table>
                </div>
            `;
        });

        let statusColor = "#f59e0b";
        let statusIcon = "⏳";
        if (basketEarned >= basketReq) { statusColor = "#10b981"; statusIcon = "✅"; }
        else if (basketEarned === 0) { statusColor = "#ef4444"; statusIcon = "❌"; }

        auditHTML += `
        <div style="border:1px solid ${statusColor}; border-radius:8px; margin-bottom:12px; background:white; overflow:hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <div onclick="const c = this.nextElementSibling; c.style.display = c.style.display === 'none' ? 'block' : 'none';" style="background:${statusColor}10; padding:15px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                <h4 style="margin:0; color:${statusColor}; display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.3rem;">${statusIcon}</span> ${esc(mainBasket.category)}
                </h4>
                <div style="font-weight:bold; color:${statusColor}; font-size:1.05rem;">
                    Earned: ${basketEarned} / ${basketReq} Cr <span style="margin-left:10px; font-size:0.8rem;">▼</span>
                </div>
            </div>
            <div style="display:none; padding:15px; border-top:1px solid ${statusColor}40;">${subHTML}</div>
        </div>`;
    });

    // --- AUTOMATIC EXTRA / UNMAPPED COURSES BASKET ---
    let extraCourses = earnedCourses.filter(c => isPass(c.grade) && !officialRequiredCodes.has(c.cleanCode));
    let extraCreditsEarned = extraCourses.reduce((sum, c) => sum + (parseFloat(c.credits) || 3), 0);

    let extraTableRows = extraCourses.length > 0 ? extraCourses.map(c => `
        <tr style="background:#eff6ff;">
            <td style="padding:8px; border-bottom:1px solid #bfdbfe; color:#1d4ed8; font-weight:bold;">${esc(c.code)}</td>
            <td style="padding:8px; border-bottom:1px solid #bfdbfe; color:#1d4ed8;">${esc(c.name)}</td>
            <td style="padding:8px; border-bottom:1px solid #bfdbfe; color:#1d4ed8; font-weight:bold;">${c.credits || 3} Cr</td>
            <td style="padding:8px; border-bottom:1px solid #bfdbfe; color:#1d4ed8; text-align:center;">✨ Extra Course Passed (${esc(c.grade)})</td>
        </tr>
    `).join('') : `<tr><td colspan="4" style="padding:10px; text-align:center; color:#64748b;">No extra unmapped courses completed.</td></tr>`;

    auditHTML += `
    <div style="border:1px solid #3b82f6; border-radius:8px; margin-bottom:12px; background:white; overflow:hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div onclick="const c = this.nextElementSibling; c.style.display = c.style.display === 'none' ? 'block' : 'none';" style="background:#3b82f610; padding:15px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0; color:#3b82f6; display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.3rem;">✨</span> ⭐ Extra / Unmapped Courses Basket
            </h4>
            <div style="font-weight:bold; color:#3b82f6; font-size:1.05rem;">
                Total Extra Credits: ${extraCreditsEarned} Cr <span style="margin-left:10px; font-size:0.8rem;">▼</span>
            </div>
        </div>
        <div style="display:none; padding:15px; border-top:1px solid #3b82f640;">
            <p style="margin-top:0; color:#475569; font-size:0.9rem;">These are successfully completed courses that fall outside your primary curriculum baskets.</p>
            <table style="width:100%; text-align:left; border-collapse:collapse; font-size:0.9rem;">
                <tbody>${extraTableRows}</tbody>
            </table>
        </div>
    </div>`;

    auditHTML += `</div>`;
    return auditHTML;
};

// ═══════════════════════════════════════════════════════════════════════════════
//  9. DOM INITIALIZATION & EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.syncCloudCurriculum === 'function') window.syncCloudCurriculum();
  if (document.getElementById('active-system-programs')) window.renderSystemPrograms();

  setTimeout(() => {
    document.querySelectorAll('button, .premium-btn').forEach(btn => {
      if (btn.textContent.includes('Has Backlogs') || btn.textContent.includes('Filter: Has Backlogs')) {
        btn.onclick = (e) => {
          e.preventDefault();
          window.filterBacklogs();
        };
      }
    });
  }, 500);
});

// --- BULLETPROOF CLOUD SAVE HIJACKER ---
document.addEventListener('click', function (e) {
  // Target the closest button element
  const btn = e.target.closest('button');

  // Check if this is the Save Curriculum button
  if (btn && btn.textContent.includes('Save Curriculum Updates')) {
    e.preventDefault(); // Stop any default page refreshes

    // 1. Ensure local memory is updated first
    if (typeof window.CURRICULUM_RULES !== 'undefined') {
      localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(window.CURRICULUM_RULES));
    }

    const curriculumJSON = localStorage.getItem('AIIT_CUSTOM_CURRICULUM');

    // 2. Force the Cloud Push BEFORE showing the success alert
    if (curriculumJSON && typeof scriptURL !== 'undefined' && scriptURL !== "YOUR_WEB_APP_URL_HERE") {
      const originalText = btn.innerHTML;

      // Show loading state on the button
      btn.innerHTML = "⏳ Saving to Cloud...";
      btn.style.backgroundColor = "#eab308"; // Yellow warning color

      const formData = new FormData();
      formData.append('action', 'saveCurriculum');
      formData.append('curriculumData', curriculumJSON);

      fetch(scriptURL, { method: 'POST', body: formData })
        .then(res => res.text())
        .then(txt => {
          console.log("☁️ Manual Cloud Sync:", txt);

          // Show success state on the button
          btn.innerHTML = "✅ Saved to Cloud!";
          btn.style.backgroundColor = "#22c55e"; // Green success color

          // Wait half a second, then show the popup alert and reset the button
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = "";
            alert("✅ CLOUD SYNC COMPLETE: Curriculum Updated Successfully! The Degree Audit engine is now using these rules globally.");
          }, 500);
        })
        .catch(err => {
          console.error("☁️ Cloud Error:", err);
          btn.innerHTML = "❌ Sync Failed";
          btn.style.backgroundColor = "#ef4444";

          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = "";
            alert("❌ CLOUD SYNC FAILED: Your internet may have dropped. Changes only saved locally.");
          }, 500);
        });
    } else {
      alert("⚠️ Curriculum Updated Locally, but Cloud Sync failed. Ensure your scriptURL is correctly pasted at the top of script.js.");
    }
  }
});

// ============================================================================
// 8. ADMIN LOGIN NATIVE RESTORATION (Ver 2.8)
// ============================================================================

document.addEventListener('submit', function(e) { e.preventDefault(); });

window.adminLogin = async function() {
    const emailInput = document.querySelector('input[type="email"]') || document.querySelectorAll('input')[0];
    const passInput = document.querySelector('input[type="password"]') || document.querySelectorAll('input')[1];

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passInput ? passInput.value.trim() : "";

    const btn = document.querySelector('button');
    const originalBtnText = btn ? btn.innerHTML : "Login &rarr;";

    if (!scriptURL || scriptURL.includes("YOUR_WEB_APP_URL_HERE")) {
        alert("⚠ ERROR: scriptURL is missing in script.js");
        return;
    }

    if (btn) {
        btn.innerHTML = "⏳ Authenticating...";
        btn.style.pointerEvents = "none";
    }

    try {
        // 1. Send the exact payload the V10 Backend requires
        const response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'verifyadmin', 
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            if (btn) btn.innerHTML = "✅ Access Granted";

            // 2. Secure Native Session Memory (Crucial for admin functions)
            window.currentAdminPassword = password;
            sessionStorage.setItem('coe_admin_auth', password); // Matches your ADMIN_SESSION var
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', 'admin');

            // 3. TRIGGER NATIVE PAGE ROUTING
            if (typeof showPage === 'function') {
                showPage('admin-dash'); // This natively hides the login box!
            } 

            // 4. Force Zero-Gap Overlay
            const adminDash = document.getElementById('admin-dash');
            if (adminDash) {
                document.body.classList.add('overlay-active');
                adminDash.classList.add('dashboard-fullscreen-overlay');
                adminDash.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'instant' });
            }

            // 5. Initialize Native Dashboard Functions
            if (typeof renderSystemPrograms === 'function') renderSystemPrograms();
            if (typeof loadCurriculumEditor === 'function') loadCurriculumEditor();
            if (typeof applyAdminFilters === 'function') applyAdminFilters();

        } else {
            alert(`⚠ ${data.message}`);
            if (btn) {
                btn.innerHTML = originalBtnText;
                btn.style.pointerEvents = "auto";
            }
        }
    } catch (err) {
        alert(`⚠ Network Error: Check your internet connection.`);
        if (btn) {
            btn.innerHTML = originalBtnText;
            btn.style.pointerEvents = "auto";
        }
    }
};

// Aggressively hijack physical Login button on Admin page
document.addEventListener('click', function(e) {
    const btn = e.target.closest('button');
    if (btn && (btn.textContent.includes('Login') || btn.textContent.includes('Sign In') || btn.textContent.includes('Access'))) {
        if (document.body.textContent.includes('COE administrator access') || document.title.includes('Admin')) {
            e.preventDefault();
            window.adminLogin();
        }
    }
});

// ============================================================================
// 10. DANGER ZONE GLOBAL HIJACKER (Ver 3.8)
// ============================================================================

document.addEventListener('click', async function(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    // --- 1. CLEAR ALL RECORDS ---
    if (btn.textContent.includes('Clear All Records') || btn.innerText.includes('Clear All Records')) {
        e.preventDefault();
        
        var adminPass = window.currentAdminPassword || sessionStorage.getItem('coe_admin_auth') || '';
        if (!adminPass) { alert("Session expired. Please log in again."); return; }
        
        if (!confirm("⚠️ DANGER: Permanently delete ALL student records from the database? This cannot be undone.")) return;

        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Clearing Database...";
        btn.disabled = true;

        try {
            var res = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'clearall', adminPassword: adminPass })
            });
            var data = await res.json();
            
            if (data.status === 'success') {
                alert(`✅ ${data.message || 'All student records have been permanently deleted.'}`);
                if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
            } else {
                alert(`❌ Failed: ${data.message}`);
            }
        } catch (err) {
            alert('❌ Error: ' + err.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // --- 2. CLEAR ALL STUDENT PASSWORDS ---
    else if (btn.textContent.includes('Clear ALL Student Passwords')) {
        e.preventDefault();
        
        var adminPass = window.currentAdminPassword || sessionStorage.getItem('coe_admin_auth') || '';
        if (!adminPass) { alert("Session expired. Please log in again."); return; }
        
        if (!confirm("⚠️ DANGER: Reset passwords for EVERY single student in the system?")) return;

        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Resetting Passwords...";
        btn.disabled = true;

        try {
            var res = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'clearallpasswords', adminPassword: adminPass })
            });
            var data = await res.json();
            
            if (data.status === 'success') {
                alert(`✅ ${data.message}`);
                if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
            } else {
                alert(`❌ Failed: ${data.message}`);
            }
        } catch (err) { alert('❌ Error: ' + err.message); } 
        finally { btn.innerHTML = originalText; btn.disabled = false; }
    }

    // --- 3. CLEAR SINGLE STUDENT PASSWORD ---
    else if (btn.textContent.includes('Clear Password') && !btn.textContent.includes('ALL')) {
        e.preventDefault();
        
        // Find the input field next to the button
        const senInput = document.querySelector('input[placeholder*="SEN"]') || document.getElementById('reset-sen-input');
        const sen = senInput ? senInput.value.trim().toUpperCase() : '';
        
        if (!sen) { alert("⚠️ Please enter a valid SEN number first."); return; }
        if (!confirm(`Are you sure you want to clear the password for ${sen}?`)) return;

        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Clearing...";
        btn.disabled = true;

        try {
            var res = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'clearpassword', sen: sen })
            });
            var data = await res.json();
            
            if (data.status === 'success') {
                alert(`✅ Password reset successfully for ${sen}.`);
                if (senInput) senInput.value = '';
                if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
            } else {
                alert(`❌ Failed: ${data.message}`);
            }
        } catch (err) { alert('❌ Error: ' + err.message); } 
        finally { btn.innerHTML = originalText; btn.disabled = false; }
    }

    // --- UNIVERSAL CLOUD SAVE HIJACKER ---
    else if (btn.textContent.includes('Save Curriculum Updates')) {
        e.preventDefault(); 

        // 1. Bundle EVERYTHING into the Universal Payload
        let sysProgs = [];
        try { sysProgs = JSON.parse(localStorage.getItem('AIIT_SYSTEM_PROGRAMS')) || []; } catch(e){}

        const masterPayload = {
            rules: window.CURRICULUM_RULES || {},
            programs: sysProgs,
            courses: window.CUSTOM_COURSE_DICT || {}
        };

        // 2. Save locally
        localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(masterPayload.rules));
        localStorage.setItem('AIIT_CUSTOM_COURSES', JSON.stringify(masterPayload.courses));

        // 3. Blast to Cloud
        if (typeof scriptURL !== 'undefined' && scriptURL !== "YOUR_WEB_APP_URL_HERE") {
            const originalText = btn.innerHTML;
            btn.innerHTML = "⏳ Syncing Master Database...";
            btn.style.backgroundColor = "#eab308"; 

            const formData = new FormData();
            formData.append('action', 'saveCurriculum');
            formData.append('curriculumData', JSON.stringify(masterPayload));

            fetch(scriptURL, { method: 'POST', body: formData })
                .then(res => res.text())
                .then(txt => {
                    btn.innerHTML = "✅ Universal Sync Live!";
                    btn.style.backgroundColor = "#22c55e"; 
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.backgroundColor = "";
                        alert("✅ UNIVERSAL SYNC COMPLETE: Your Programs, Course Names, and Curriculum Rules are now synchronized to ALL computers globally.");
                    }, 500);
                })
                .catch(err => {
                    btn.innerHTML = "❌ Sync Failed";
                    btn.style.backgroundColor = "#ef4444";
                    setTimeout(() => { btn.innerHTML = originalText; btn.style.backgroundColor = ""; }, 1000);
                });
        }
    }
});

// ============================================================================
// 11. SECURE LOGOUT RESET SEQUENCE (Ver 2.1)
// ============================================================================

document.addEventListener('click', function(e) {
    const btn = e.target.closest('button') || e.target.closest('a');
    if (!btn) return;
    
    if (btn.textContent && btn.textContent.trim() === 'Logout') {
        e.preventDefault();
        
        // Clear session memory
        sessionStorage.clear();
        localStorage.removeItem('coe_student_session');
        
        // Hide all dashboards
        document.querySelectorAll('#faculty-dash, #student-dash, .dashboard-fullscreen-overlay').forEach(el => {
            if (el) el.style.display = 'none';
        });
        
        document.body.classList.remove('overlay-active');
        
        // Hard reload to clean state
        window.location.href = window.location.pathname;
    }
});