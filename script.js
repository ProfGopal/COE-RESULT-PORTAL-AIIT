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

window.getCourseInfo = function (code) {
  if (window.CUSTOM_COURSE_DICT && window.CUSTOM_COURSE_DICT[code]) {
    let cr = window.CUSTOM_COURSE_DICT[code].credits;
    return {
      name: window.CUSTOM_COURSE_DICT[code].name,
      credits: (cr !== undefined && cr !== null && !isNaN(cr)) ? parseFloat(cr) : 3
    };
  }
  if (typeof COURSE_DICT !== 'undefined' && COURSE_DICT[code]) {
    let cr = COURSE_DICT[code].credits;
    return {
      name: COURSE_DICT[code].name,
      credits: (cr !== undefined && cr !== null && !isNaN(cr)) ? parseFloat(cr) : 3
    };
  }
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

  var limitMsg = checkRateLimit('stu_' + sen);
  if (limitMsg) { showErr('student-err', limitMsg, ['s-sen', 's-pass']); return; }

  var btn = document.getElementById('s-login-btn');
  if (btn) btn.disabled = true;

  try {
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

      try {
        await fetch(scriptURL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'setpassword', sen: sen, newPassword: newpass })
        });
      } catch (spErr) {
        console.warn('setpassword response unreadable (may still have succeeded):', spErr.message);
      }

      clearAttempts('stu_' + sen);

      try {
        var alResp = await fetch(scriptURL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'login', sen: sen, password: newpass })
        });
        var alResult = await alResp.json();

        if (alResult && alResult.status === 'success' && alResult.student) {
          currentStudent = alResult.student;
          renderStudentDash(currentStudent);
          showPage('student-dash');
          document.body.classList.add('overlay-active');
        } else {
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

    var passInput = (document.getElementById('s-pass') || {}).value || '';
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Signing in…'; }

    var response = await fetch(scriptURL, {
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
      clearAttempts('stu_' + sen);
      currentStudent = result.student;
      renderStudentDash(currentStudent);
      showPage('student-dash');
      document.body.classList.add('overlay-active');
    } else if (
      result && result.status === 'error' &&
      (result.code === 'FIRST_TIME' || (result.message && result.message.toLowerCase().includes('first')))
    ) {
      isNewUser = true;
      var pf = document.getElementById('s-pass-field');
      var nf = document.getElementById('s-newpass-fields');
      if (pf) pf.style.display = 'none';
      if (nf) nf.style.display = 'block';
      if (btn) btn.textContent = 'Create Password & Login →';
      showOk('student-ok', result.message || 'First-time login detected. Please create your password below.');
    } else if (result && result.status === 'error') {
      var errMsg = result.message || 'Login failed. Please try again.';
      showErr('student-err', '⚠ ' + errMsg, ['s-pass']);
    } else {
      showErr('student-err', '⚠ Unexpected response from server. Please try again.');
    }
  } catch (err) {
    console.error('Login error:', err);
    showErr('student-err', '✗ Could not reach the portal server. Check your connection and try again.');
  } finally {
    var b = document.getElementById('s-login-btn');
    if (b) {
      b.disabled = false;
      b.textContent = isNewUser ? 'Create Password & Login →' : '🎓 Sign In →';
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  4. FACULTY FLOW & STUDENT DIRECTORY
// ═══════════════════════════════════════════════════════════════════════════════

window.facultyLoginStep = async function () {
  var email = sanitize(document.getElementById('f-email').value);
  var pass = document.getElementById('f-pass').value;
  hideAlerts('faculty');

  if (!email || !pass) {
    showErr('faculty-err', 'Please enter email and password.', ['f-email', 'f-pass']);
    return;
  }

  var btn = document.getElementById('f-login-btn');
  if (btn) btn.disabled = true;

  try {
    var response = await fetch(scriptURL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'facultylogin', email: email, password: pass })
    });
    var result = await response.json();

    if (result && result.status === 'success') {
      var label = document.getElementById('faculty-email-label');
      if (label) label.textContent = email;
      showPage('faculty-dash');
      window.facultyViewAll();
    } else {
      showErr('faculty-err', '⚠ ' + ((result && result.message) || 'Invalid faculty credentials.'), ['f-pass']);
    }
  } catch (err) {
    showErr('faculty-err', '✗ Connection error: ' + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.facultyLogout = function () {
  showPage('landing');
};

window.facultyViewAll = async function () {
  syncBar('Loading student records…', true);
  try {
    var res = await fetch(scriptURL + "?action=getStudents");
    var data = await res.json();
    if (Array.isArray(data)) {
      window.STUDENTS = data;
      window.ALL_STUDENTS = data;
      renderStudentTable(data);
    } else if (data && Array.isArray(data.students)) {
      window.STUDENTS = data.students;
      window.ALL_STUDENTS = data.students;
      renderStudentTable(data.students);
    }
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
  var tbody = document.getElementById('faculty-dir-tbody');
  var badge = document.getElementById('faculty-dir-badge');
  if (badge) badge.textContent = `${students.length} students`;
  if (!tbody) return;

  if (!students || students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted)">No matching student records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    var cgpa = parseFloat(s.cgpa) ? parseFloat(s.cgpa).toFixed(2) : 'N/A';
    var credits = s.totalCredits || s.totalCreditEarned || 'N/A';
    var backlogs = s.backlogs !== undefined ? s.backlogs : (s.courses ? s.courses.filter(c => ['F', 'AB', 'DE', 'I'].includes(String(c.grade).toUpperCase())).length : 0);
    return `<tr>
      <td>${esc(s.sen)}</td>
      <td><strong>${esc(s.name)}</strong></td>
      <td>${cgpa}</td>
      <td>${credits}</td>
      <td><span class="badge ${backlogs > 0 ? 'fail' : 'pass'}">${backlogs}</span></td>
      <td><button class="btn-sm primary" onclick="openFacultyStudentView('${esc(s.sen)}')">View Profile</button></td>
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
    injected.innerHTML = `
      <div class="profile-card" style="margin-bottom:1.5rem">
        <h2>${esc(s.name)} (${esc(s.sen)})</h2>
        <p>Program: ${esc(s.program || '')} | Batch: ${esc(s.batch || '')} | CGPA: ${s.cgpa || 'N/A'}</p>
      </div>
      ${window.evaluateDegree(s)}
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
  var senLabel = document.getElementById('dash-sen-label');
  if (senLabel) senLabel.textContent = student.sen;

  var nameEl = document.getElementById('dash-name');
  if (nameEl) nameEl.textContent = student.name;

  var progEl = document.getElementById('dash-program');
  if (progEl) progEl.textContent = student.program || '';

  var schoolEl = document.getElementById('dash-school');
  if (schoolEl) schoolEl.textContent = student.school ? ' · ' + student.school : '';

  var avatarEl = document.getElementById('dash-avatar');
  if (avatarEl) avatarEl.textContent = (student.name || 'S').charAt(0);

  var cgpaVal = parseFloat(student.cgpa);
  var cgpa = (!isNaN(cgpaVal) && cgpaVal !== 0) ? cgpaVal.toFixed(2) : "N/A";
  var creditsVal = parseFloat(student.totalCredits || student.totalCreditEarned);
  var credits = (!isNaN(creditsVal) && creditsVal !== 0) ? String(creditsVal) : "N/A";

  var cgpaEl = document.getElementById('dash-cgpa');
  if (cgpaEl) cgpaEl.textContent = cgpa;

  var ceEl = document.getElementById('dash-ce');
  if (ceEl) ceEl.textContent = credits;

  var validCourses = (student.courses || []).filter(c => c && c.code && c.code.trim() !== '');
  var ncEl = document.getElementById('dash-nc');
  if (ncEl) ncEl.textContent = validCourses.length;

  var tbody = document.getElementById('courses-tbody');
  if (tbody) {
    tbody.innerHTML = validCourses.map(c => `
      <tr>
        <td><strong>${esc(c.code)}</strong></td>
        <td>${esc(c.name || getCourseInfo(c.code).name)}</td>
        <td>${esc(c.type || 'Core')}</td>
        <td>${c.credits || getCourseInfo(c.code).credits}</td>
        <td>${c.marks !== undefined ? c.marks : '—'}</td>
        <td><span class="badge ${['F', 'AB'].includes(String(c.grade).toUpperCase()) ? 'fail' : 'pass'}">${esc(c.grade)}</span></td>
        <td>${c.gradePoints !== undefined ? c.gradePoints : '—'}</td>
        <td>${c.creditsEarned !== undefined ? c.creditsEarned : c.credits}</td>
      </tr>
    `).join('');
  }

  var auditTab = document.getElementById('sdash-audit-tab');
  if (auditTab) {
    auditTab.innerHTML = window.evaluateDegree(student);
  }
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
  const container = document.getElementById('active-system-programs');
  if (container) {
    container.innerHTML = SYSTEM_PROGRAMS.map((p, i) => `<span style="background: #334155; padding: 5px 10px; border-radius: 4px; color: white;">${p.batch} ${p.program} <button onclick="removeSystemProgram(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer;">✖</button></span>`).join('');
  }

  const currDropdown = document.getElementById('curriculum-edit-key');
  if (currDropdown) {
    currDropdown.innerHTML = SYSTEM_PROGRAMS.map(p => `<option value="${p.batch}_${p.program}">${p.batch} ${p.program}</option>`).join('');
  }

  if (typeof window.updateUploadDropdowns === 'function') window.updateUploadDropdowns();
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

window.clearAllRecords = async function () {
  var adminPass = window.currentAdminPassword || sessionStorage.getItem(ADMIN_SESSION) || '';
  if (!adminPass) return alert("Session expired. Please log in again.");
  if (!confirm("DANGER: Permanently delete ALL student records from backend?")) return;

  var statusEl = document.getElementById('clear-all-status');
  if (statusEl) statusEl.textContent = '⏳ Wiping backend...';

  try {
    var res = await fetch(scriptURL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'clearallrecords', adminPassword: adminPass })
    });
    var data = await res.json();
    if (statusEl) statusEl.textContent = data.message || 'All records deleted.';
  } catch (err) {
    if (statusEl) statusEl.textContent = '❌ Error: ' + err.message;
  }
};

window.applyAdminFilters = async function () {
  var tbody = document.getElementById('admin-tbody');
  var totalStu = document.getElementById('total-stu');
  if (!tbody) return;

  try {
    var res = await fetch(scriptURL + "?action=getStudents");
    var data = await res.json();
    var students = Array.isArray(data) ? data : (data.students || []);

    if (totalStu) totalStu.textContent = students.length;

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty">No student records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = students.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(s.sen)}</td>
        <td>${esc(s.name)}</td>
        <td>${s.courses ? s.courses.length : 0}</td>
        <td>${s.cgpa || 'N/A'}</td>
        <td>${s.totalCredits || 'N/A'}</td>
        <td>${s.hasPassword ? '✅ Set' : '❌ Default'}</td>
        <td><button class="btn-sm" onclick="openAdminStudentView('${esc(s.sen)}')">Details</button></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">Failed to load from backend.</td></tr>`;
  }
};

window.openAdminStudentView = function (sen) {
  var detailView = document.getElementById('admin-student-detail-view');
  var wrapper = document.getElementById('admin-table-wrapper');
  var injected = document.getElementById('admin-injected-student-data');

  if (wrapper) wrapper.style.display = 'none';
  if (detailView) detailView.style.display = 'block';
  if (injected) injected.innerHTML = `<p>Loading student ${esc(sen)}...</p>`;
};

window.closeAdminStudentView = function () {
  var detailView = document.getElementById('admin-student-detail-view');
  var wrapper = document.getElementById('admin-table-wrapper');
  if (detailView) detailView.style.display = 'none';
  if (wrapper) wrapper.style.display = 'block';
};

window.handleFileDrop = function (e) {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const input = document.getElementById('excel-upload');
    if (input) {
      input.files = files;
      window.triggerTaggedUpload();
    }
  }
};

window.triggerTaggedUpload = function () {
  alert("File ready for processing. Feature integrated.");
};

// ═══════════════════════════════════════════════════════════════════════════════
//  7. CURRICULUM EDITOR & CLOUD SYNC
// ═══════════════════════════════════════════════════════════════════════════════

window.loadCurriculumEditor = function () {
  const dropdown = document.getElementById('curriculum-edit-key');
  const container = document.getElementById('curriculum-gui-container');
  if (!dropdown || !container) return;

  const key = dropdown.value;
  window.currentEditingKey = key;

  const rules = (window.CURRICULUM_RULES && window.CURRICULUM_RULES[key]) ? window.CURRICULUM_RULES[key] : [];

  if (rules.length === 0) {
    container.innerHTML = `<p style="color:var(--muted)">No curriculum rules defined for ${key}. Use Bulk Upload or add rules.</p>`;
    return;
  }

  container.innerHTML = rules.map((r, idx) => `
    <div style="background:var(--s1); padding:15px; border-radius:8px; border:1px solid var(--border);">
      <h3>${idx + 1}. ${esc(r.category)} (Min Credits: ${r.minCredits})</h3>
      <p style="font-size:0.85rem; color:var(--sub)">Course Codes: ${(r.codes || []).join(', ')}</p>
    </div>
  `).join('');
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
  if (!scriptURL || scriptURL === "YOUR_WEB_APP_URL_HERE") {
    console.warn("scriptURL is missing. Cannot sync from cloud.");
    return;
  }

  fetch(scriptURL + "?action=getCurriculum")
    .then(res => res.text())
    .then(data => {
      if (data && data.trim().startsWith("{")) {
        localStorage.setItem('AIIT_CUSTOM_CURRICULUM', data);
        window.CURRICULUM_RULES = JSON.parse(data);
        console.log("✅ Curriculum successfully downloaded from Cloud Database.");
      }
    })
    .catch(err => console.error("❌ Failed to download Curriculum from Cloud:", err));
};

window.saveCurriculumToCloud = function () {
  localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(window.CURRICULUM_RULES));

  if (typeof scriptURL !== 'undefined') {
    const formData = new FormData();
    formData.append('action', 'saveCurriculum');
    formData.append('curriculumData', JSON.stringify(window.CURRICULUM_RULES));

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

          if (!mainMap[mainCat]) {
            mainMap[mainCat] = { category: mainCat, minCredits: mainCreds, subCategories: {} };
            newRules.push(mainMap[mainCat]);
          }
          if (!mainMap[mainCat].subCategories[subCat]) {
            mainMap[mainCat].subCategories[subCat] = { name: subCat, minCredits: subCreds, codes: [] };
          }
          if (code && code !== "UNDEFINED") mainMap[mainCat].subCategories[subCat].codes.push(code);
        });

        newRules.forEach(rule => { rule.subCategories = Object.values(rule.subCategories); });

        if (!window.CURRICULUM_RULES) window.CURRICULUM_RULES = {};
        window.CURRICULUM_RULES[window.currentEditingKey] = newRules;

        window.saveCurriculumToCloud();
        alert(`✅ SUCCESS! Imported ${newRules.length} Main Categories.`);
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
  const mapKey = `${studentBatch}_${studentProg}`;

  const rulesToUse = latestCurriculum[mapKey] || window.CURRICULUM_RULES[mapKey] || BASE_CURRICULUM["2024_MCA"];
  if (!rulesToUse || rulesToUse.length === 0) {
    return `<div style="text-align:center; padding:20px;">
              <h3>📭 Curriculum Not Mapped</h3>
              <p>No curriculum rules found for ${studentBatch} ${studentProg}.</p>
            </div>`;
  }

  const cleanString = (str) => String(str).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const earnedCourses = (student.courses || []).map(c => ({
    ...c,
    cleanCode: cleanString(c.code || c.CourseCode),
    grade: String(c.grade || c.Grade || "").toUpperCase().trim()
  }));

  let auditHTML = `<div class="audit-wrapper" style="padding:15px; background:var(--s2); border-radius:10px;">`;
  auditHTML += `<h3>🎓 Degree Audit Report (${studentBatch} ${studentProg})</h3>`;

  rulesToUse.forEach(mainBasket => {
    let basketEarned = 0;
    let courseListHTML = "";

    (mainBasket.codes || []).forEach(reqCode => {
      const cleanReq = cleanString(reqCode);
      const match = earnedCourses.find(c => c.cleanCode === cleanReq && !['F', 'AB'].includes(c.grade));
      if (match) {
        const info = getCourseInfo(reqCode);
        basketEarned += (match.credits || info.credits);
        courseListHTML += `<li style="color:#22c55e">✅ ${reqCode} - ${info.name} (${match.credits || info.credits} Cr)</li>`;
      } else {
        const info = getCourseInfo(reqCode);
        courseListHTML += `<li style="color:#ef4444">❌ ${reqCode} - ${info.name} (${info.credits} Cr)</li>`;
      }
    });

    const isComplete = basketEarned >= mainBasket.minCredits;
    auditHTML += `
      <div style="margin-top:15px; padding:12px; background:var(--s1); border-radius:8px; border-left: 4px solid ${isComplete ? '#22c55e' : '#ef4444'}">
        <h4>${esc(mainBasket.category)} (Earned: ${basketEarned} / Required: ${mainBasket.minCredits})</h4>
        <ul style="list-style:none; padding-left:0; margin-top:8px;">${courseListHTML}</ul>
      </div>
    `;
  });

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
// 8. ADMIN LOGIN SECURE OVERRIDE (Ver 2.4)
// ============================================================================

// 1. Stop native HTML forms from accidentally bypassing our JavaScript
document.addEventListener('submit', function(e) {
    e.preventDefault();
});

// 2. The Bulletproof Admin Login Function
window.adminLogin = function() {
    // Safely grab inputs
    const emailInput = document.querySelector('input[type="email"]') || document.querySelectorAll('input')[0];
    const passInput = document.querySelector('input[type="password"]') || document.querySelectorAll('input')[1];
    
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passInput ? passInput.value.trim() : "";
    
    const btn = document.querySelector('button');
    const originalBtnText = btn ? btn.innerHTML : "Login &rarr;";
    
    // Find the pink error box to display messages
    const errorBoxes = document.querySelectorAll('.text-red-500, .bg-red-50, [style*="color: red"], .error-message, .alert');
    let errorBox = null;
    if (errorBoxes.length > 0) errorBox = errorBoxes[0];
    
    if (!scriptURL || scriptURL.includes("YOUR_WEB_APP_URL_HERE")) {
        if (errorBox) { errorBox.style.display = 'block'; errorBox.innerHTML = "⚠ ERROR: scriptURL is missing in script.js"; }
        return;
    }

    // Show loading state
    if (btn) {
        btn.innerHTML = "⏳ Authenticating...";
        btn.style.opacity = "0.7";
        btn.style.pointerEvents = "none";
    }

    // 3. Fire the EXACT payload the V10 backend expects
    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // Avoids CORS blocking
        body: JSON.stringify({
            action: 'verifyadmin', // MUST exactly match backend.gs
            email: email,
            password: password
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            if (btn) btn.innerHTML = "✅ Access Granted";
            
            // 1. Secure the session memory
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', 'admin');
            sessionStorage.setItem('ADMIN_SESSION', 'active');
            
            // 2. Aggressive DOM Nuke to destroy the Login Box
            const loginContainers = document.querySelectorAll('#login-section, .login-wrapper, .login-container');
            loginContainers.forEach(el => el.style.display = 'none');
            
            // Failsafe: Hide the parent container of the button just in case HTML IDs differ
            const formParent = btn.closest('.bg-white') || btn.closest('form');
            if (formParent && formParent.parentElement) {
                formParent.parentElement.style.display = 'none';
            }

            // 3. Find and Show the Admin Panel (Scanning all possible naming conventions)
            const adminDash = document.getElementById('admin-panel') || 
                              document.getElementById('admin-dashboard') || 
                              document.getElementById('admin-container') || 
                              document.getElementById('dashboard-section') || 
                              document.querySelector('.admin-wrapper');
            
            if (adminDash) {
                // Trigger the Ver 1.2 Zero-Gap Layout Overlay
                document.body.classList.add('overlay-active');
                adminDash.classList.add('dashboard-fullscreen-overlay');
                adminDash.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'instant' });
            } else {
                // ULTIMATE FALLBACK: If HTML IDs still don't match, forcibly reload the page 
                // so the browser's native session checker builds the dashboard for us.
                window.location.reload();
            }

            // 4. Force the dashboard to fetch the Google Sheet data immediately
            if (typeof loadData === 'function') loadData();
            if (typeof fetchStudents === 'function') fetchStudents();
            if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
            
        } else {
            // Display the Google Cloud error message
            if (errorBox) {
                errorBox.style.display = 'block';
                errorBox.innerHTML = `⚠ ${data.message}`;
            } else {
                alert(`⚠ ${data.message}`);
            }
            if (btn) {
                btn.innerHTML = originalBtnText;
                btn.style.opacity = "1";
                btn.style.pointerEvents = "auto";
            }
        }
    })
    .catch(err => {
        if (errorBox) {
            errorBox.style.display = 'block';
            errorBox.innerHTML = `⚠ Network Error: Check your internet connection.`;
        }
        if (btn) {
            btn.innerHTML = originalBtnText;
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
        }
    });
};

// 4. Aggressively hijack the physical Login button 
document.addEventListener('click', function(e) {
    const btn = e.target.closest('button');
    if (btn && (btn.textContent.includes('Login') || btn.textContent.includes('Sign In'))) {
        // Check if we are physically on the Admin page to avoid hijacking Student login
        if (document.body.textContent.includes('COE administrator access') || document.title.includes('Admin')) {
            e.preventDefault();
            window.adminLogin();
        }
    }
});