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
const GAS_URL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";
var LOCAL_STU_KEY = 'coe_students_v2';
var ADMIN_SESSION = 'coe_admin_auth';

var SEM_MAP = {
  '1': 'Semester I', '2': 'Semester II', '3': 'Semester III', '4': 'Semester IV',
  '5': 'Semester V', '6': 'Semester VI', '7': 'Semester VII', '8': 'Semester VIII',
  'I': 'Semester I', 'II': 'Semester II', 'III': 'Semester III', 'IV': 'Semester IV',
  'V': 'Semester V', 'VI': 'Semester VI', 'VII': 'Semester VII', 'VIII': 'Semester VIII'
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
  
  // Restore login section display
  var loginSec = document.getElementById('loginSection');
  if (loginSec) {
    loginSec.style.display = 'block';
  }
  
  // Show landing page
  var landing = document.getElementById('landing');
  if (landing) {
    landing.classList.add('active');
    landing.style.display = 'block';
  }
  
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
  ['s-pass', 's-newpass', 's-confirmpass'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var btn = document.getElementById('s-login-btn');
  if (btn) { btn.textContent = 'Sign In →'; btn.disabled = false; }
  isNewUser = false;
}

/**
 * studentLoginStep — the unified login handler.
 *
 * Flow:
 *  1. Validate SEN exists on backend (?action=checksen)
 *  2a. If no password set → show create-password fields
 *  2b. If password set    → verify hash via (?action=login)
 *  3. On first-time password creation → POST setpassword to backend
 */
async function studentLoginStep() {
  var rawSen = document.getElementById('s-sen').value;
  var sen = sanitize(rawSen).toUpperCase();
  hideAlerts('student');

  if (!sen) { showErr('student-err', 'Please enter your SEN number.', ['s-sen']); return; }

  var limitMsg = checkRateLimit('stu_' + sen);
  if (limitMsg) { showErr('student-err', limitMsg, ['s-sen', 's-pass']); return; }

  var gasUrl = GAS_URL;

  var btn = document.getElementById('s-login-btn');
  if (btn) btn.disabled = true;

  try {
    // ── Step 1: Check if SEN exists ──────────────────────────────────────────
    var checkData = await gasJsonp(gasUrl + '?action=checksen&sen=' + encodeURIComponent(sen));

    if (!checkData || !checkData.found) {
      recordFailedAttempt('stu_' + sen);
      showErr('student-err', 'SEN not found in records. Please check and try again.', ['s-sen']);
      return;
    }

    // ── Step 2a: No password — show creation form ─────────────────────────────
    if (!checkData.hasPassword) {
      isNewUser = true;
      var newpass = sanitize(document.getElementById('s-newpass') ? document.getElementById('s-newpass').value : '');
      var confpass = sanitize(document.getElementById('s-confirmpass') ? document.getElementById('s-confirmpass').value : '');

      if (!newpass) {
        // First click — reveal the creation fields
        var pf = document.getElementById('s-pass-field');
        var nf = document.getElementById('s-newpass-fields');
        if (pf) pf.style.display = 'none';
        if (nf) nf.style.display = 'block';
        if (btn) btn.textContent = 'Create Password & Login →';
        showOk('student-ok', 'First-time login detected. Please create your password below.');
        setTimeout(function () {
          var np = document.getElementById('s-newpass');
          if (np) { np.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(function () { np.focus(); }, 150); }
        }, 100);
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

      // Hash and store password on GAS backend
      if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
      var hash = await hashPwd(newpass);

      try {
        await gasPost({ action: 'setpassword', sen: sen, hash: hash });
      } catch (postErr) {
        console.warn('setpassword POST failed (no-cors, likely ok):', postErr.message);
      }

      clearAttempts('stu_' + sen);
      // Fetch full student data for dashboard
      var studentData = await gasJsonp(gasUrl + '?action=login&sen=' + encodeURIComponent(sen) + '&hash=' + encodeURIComponent(hash));
      if (studentData && studentData.success && studentData.student) {
        currentStudent = studentData.student;
        renderStudentDash(currentStudent);
        showPage('student-dash');
        var loginSec = document.getElementById('loginSection');
        if (loginSec) loginSec.style.display = 'none';
        var dashEl = document.getElementById('student-dash');
        if (dashEl) {
          dashEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        // setpassword may not be readable via no-cors; fall back gracefully
        showOk('student-ok', '✓ Password created! Please sign in again with your new password.');
        resetStudentLoginUI();
        var senEl = document.getElementById('s-sen');
        if (senEl) senEl.value = sen;
      }
      return;
    }

    // ── Step 2b: Password exists — verify ─────────────────────────────────────
    var passInput = sanitize(document.getElementById('s-pass').value);
    if (!passInput) {
      showErr('student-err', 'Please enter your password.', ['s-pass']);
      return;
    }

    var inputHash = await hashPwd(passInput);
    var loginResult = await gasJsonp(
      gasUrl + '?action=login&sen=' + encodeURIComponent(sen) + '&hash=' + encodeURIComponent(inputHash)
    );

    if (loginResult && loginResult.success && loginResult.student) {
      clearAttempts('stu_' + sen);
      currentStudent = loginResult.student;
      renderStudentDash(currentStudent);
      showPage('student-dash');
      var loginSec = document.getElementById('loginSection');
      if (loginSec) loginSec.style.display = 'none';
      var dashEl = document.getElementById('student-dash');
      if (dashEl) {
        dashEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (loginResult && loginResult.error === 'WRONG_PASSWORD') {
      recordFailedAttempt('stu_' + sen);
      showErr('student-err', '⚠ Wrong password. Please try again.', ['s-pass']);
      document.getElementById('s-pass').value = '';
    } else {
      recordFailedAttempt('stu_' + sen);
      var errMsg = (loginResult && loginResult.message) || 'Login failed. Please try again.';
      showErr('student-err', errMsg, ['s-pass']);
    }

  } catch (err) {
    console.error('Login error:', err);
    showErr('student-err', '⚠ Could not reach the portal server. Check your connection and try again.');
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

  // Step A (Extract Unique Tabs): Create an array of unique semesters from the student's data
  const uniqueSems = [...new Set(student.courses.map(c => c.sem).filter(Boolean))];

  // Step B (Render Tabs): Dynamically generate the HTML
  var tabsEl = document.getElementById('sem-tabs');
  tabsEl.innerHTML = '';

  function makeTab(label, isAll, clickedSem) {
    var btn = document.createElement('button');
    btn.className = 'tab' + (isAll ? ' active' : '');
    btn.textContent = label;
    btn.onclick = function () {
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
      btn.classList.add('active');
      if (isAll) {
        // When "All Semesters" is clicked, pass student.courses to the table rendering function
        renderCourses(student.courses, 'All Semesters', 'all');
      } else {
        // When a specific semester tab is clicked, filter the array
        const filtered = student.courses.filter(c => c.sem === clickedSem);
        renderCourses(filtered, label, clickedSem);
      }
    };
    return btn;
  }

  tabsEl.appendChild(makeTab('All Semesters', true));
  uniqueSems.forEach(function (s) {
    var label = SEM_MAP[s] || s;
    tabsEl.appendChild(makeTab(label, false, s));
  });

  renderCourses(student.courses, 'All Semesters', 'all');
}

function renderCourses(courses, title, semesterFilter) {
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

  document.getElementById('tbl-title').textContent = title;
  document.getElementById('tbl-badge').textContent = filteredCourses.length + ' course' + (filteredCourses.length !== 1 ? 's' : '');

  var tbody = document.getElementById('courses-tbody');
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
    var marksDisplay = !isNaN(marksNum) ? marksNum.toFixed(1) : '-';
    var pct = !isNaN(marksNum) ? Math.min(100, Math.round(marksNum)) : 0;
    var gc = ['S', 'A', 'B', 'C', 'D', 'E', 'F'].includes(grade) ? 'g-' + grade : 'g-D';

    var marksCell = (marksDisplay !== '-')
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
//  ADMIN LOGIN  (admin-hidden.html)
// ═══════════════════════════════════════════════════════════════════════════════
async function adminLogin() {
  var pass = sanitize(document.getElementById('a-pass').value);
  var errEl = document.getElementById('admin-err');

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
      body: JSON.stringify({ action: 'verifyadmin', password: pass })
    });
    var data = await response.json();

    if (data && data.status === 'success') {
      clearAttempts('admin');
      sessionStorage.setItem(ADMIN_SESSION, pass); // Store raw password dynamically in session cache
      showPage('admin-dash');
      loadAdminData();
    } else {
      recordFailedAttempt('admin');
      if (errEl) {
        errEl.textContent = '⚠ ' + (data.error || 'Wrong admin password. Please try again.');
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
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--muted)">No students found.</td></tr>';
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
      '<td style="font-family:var(--mono);font-size:0.88rem;color:var(--gold)">' + (s.cgpa ? parseFloat(s.cgpa).toFixed(2) : '—') + '</td>',
      '<td style="font-family:var(--mono);font-size:0.8rem;color:var(--green)">' + esc(String(s.totalCreditEarned || '—')) + '</td>',
      '<td>' +
      '<span style="font-size:0.75rem;font-family:var(--mono);color:var(--muted)">Managed on server</span>' +
      ' <button onclick="quickClearPwd(\'' + esc(s.sen) + '\')" ' +
      'style="margin-left:0.4rem;font-family:var(--mono);font-size:0.62rem;padding:0.2rem 0.5rem;' +
      'border-radius:4px;border:1px solid rgba(239,68,68,0.4);background:transparent;color:#f87171;cursor:pointer"' +
      ' title="Clear password">✕</button>' +
      '</td>'
    ].join('');
    tbody.appendChild(tr);
  });
}

function filterStudents(query) {
  var lq = query.toLowerCase();
  var filtered = _allStudents.filter(function (s) {
    return s.name.toLowerCase().includes(lq) || s.sen.toLowerCase().includes(lq);
  });
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
    await gasPost({ action: 'clearpassword', sen: sen, adminPassword: adminPassword });
    if (statusEl) statusEl.textContent = '✓ Password cleared for ' + sen + '. Student will be prompted on next login.';
    document.getElementById('reset-sen-input').value = '';
    setTimeout(loadAdminData, 1200);
  } catch (err) {
    if (statusEl) statusEl.textContent = '✗ Error: ' + err.message;
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
  if (files && files.length > 0) handleFileUpload(files);
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

  try {
    for (var f = 0; f < fileList.length; f++) {
      var file = fileList[f];
      setAlert('info', '<span class="spinner"></span>[' + (f + 1) + '/' + fileList.length + '] Reading ' + esc(file.name) + '…');

      var arrayBuffer = await file.arrayBuffer();
      
      var studentsArray = parseExcelToStudents(arrayBuffer, function (msg) {
        setAlert('info', '<span class="spinner"></span>[' + (f + 1) + '/' + fileList.length + '] ' + esc(file.name) + ': ' + msg);
      });

      studentsArray.forEach(function (s) {
        var sen = s.sen;
        if (!consolidatedMap[sen]) {
          consolidatedMap[sen] = {
            sen: sen,
            name: s.name,
            program: s.program,
            school: s.school,
            cgpa: s.cgpa || 0,
            totalCredits: s.totalCredits || 0,
            totalCreditEarned: s.totalCreditEarned || 0,
            courses: []
          };
        }
        var target = consolidatedMap[sen];
        if (s.name) target.name = s.name;
        if (s.program) target.program = s.program;
        if (s.school) target.school = s.school;
        if (s.cgpa) target.cgpa = s.cgpa;
        if (s.totalCredits > target.totalCredits) {
          target.totalCredits = s.totalCredits;
          target.totalCreditEarned = s.totalCredits;
        }

        s.courses.forEach(function (c) {
          var semKey = String(c.semester || c.sem || '').trim();
          var codeKey = String(c.code || '').trim().toLowerCase();
          
          var isDuplicate = target.courses.some(function (existC) {
            var existSem = String(existC.semester || existC.sem || '').trim();
            var existCode = String(existC.code || '').trim().toLowerCase();
            return existSem === semKey && existCode === codeKey;
          });

          if (!isDuplicate) {
            target.courses.push(c);
          }
        });
      });
    }
  } catch (err) {
    setAlert('err', '✗ Excel parse error: ' + err.message);
    return;
  }

  var finalStudentsList = Object.values(consolidatedMap);

  if (finalStudentsList.length === 0) {
    setAlert('warn', '⚠ No student records detected. Check that column headers match.');
    return;
  }

  setAlert('info', '<span class="spinner"></span>Consolidated ' + finalStudentsList.length + ' students. Sending to backend…');

  try {
    var adminPassword = sessionStorage.getItem(ADMIN_SESSION) || '';
    await gasPost({ action: 'upsert', students: finalStudentsList, adminPassword: adminPassword });
    setAlert('ok', '✓ Consolidated ' + finalStudentsList.length + ' student record(s) from ' + fileList.length + ' file(s) sent to the backend (upsert). Refresh to see updated data.');
    setTimeout(loadAdminData, 2000);
  } catch (postErr) {
    setAlert('warn', '⚠ Data sent (no-cors mode — cannot confirm receipt). Backend should have processed it. Refresh to verify.');
    setTimeout(loadAdminData, 3000);
  }

  var fi = document.getElementById('fileInput');
  if (fi) fi.value = '';
}

function parseExcelToStudents(arrayBuffer, progressCb) {
  if (!window.XLSX) throw new Error('SheetJS library not loaded.');
  if (progressCb) progressCb('Parsing workbook…');

  var wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: false, raw: false });

  // ── Collect all rows from every sheet ──────────────────────────────────────
  var allRows = [];
  wb.SheetNames.forEach(function (sheetName) {
    var ws = wb.Sheets[sheetName];
    var rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    rows.forEach(function (r) { r.__sheet = sheetName; allRows.push(r); });
  });
  if (!allRows.length) return [];
  if (progressCb) progressCb('Mapping ' + allRows.length + ' rows…');

  // Helper to collapse key spaces, hyphens, and uppercase characters
  function collapseKey(k) {
    return String(k || '').toLowerCase().replace(/[\s\-]+/g, '').trim();
  }

  // Helper to fuzzy match key collapsing spaces and hyphens
  function fuzzyFindKey(rowKeys, target) {
    var t1 = collapseKey(target);
    var found = rowKeys.find(function(k) {
      return collapseKey(k) === t1;
    });
    if (found) return found;
    found = rowKeys.find(function(k) {
      return collapseKey(k).includes(t1);
    });
    return found || null;
  }

  // Helper to find numbered fields in row keys (e.g. 1-Course Title, 1 Course Title)
  function findNumberedField(rowKeys, idx, suffixes) {
    for (var s = 0; s < suffixes.length; s++) {
      var target = idx + suffixes[s].toLowerCase().replace(/[\s\-]+/g, '').trim();
      for (var j = 0; j < rowKeys.length; j++) {
        var ck = rowKeys[j].toLowerCase().replace(/[\s\-]+/g, '').trim();
        if (ck === target || ck.includes(target)) {
          return rowKeys[j];
        }
      }
    }
    return null;
  }

  var map = {}; // { SEN → studentObject }

  allRows.forEach(function (row) {
    var rowKeys = Object.keys(row);
    
    // 1. Extract SEN
    var kSen = fuzzyFindKey(rowKeys, 'sen') || fuzzyFindKey(rowKeys, 'rollno') || fuzzyFindKey(rowKeys, 'enrollment') || fuzzyFindKey(rowKeys, 'enrollmentno');
    var sen = kSen ? String(row[kSen] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim() : '';
    if (!sen || sen.length < 5) return;

    // 2. Initialize student object with cgpa: 0 and totalCredits: 0
    if (!map[sen]) {
      var kName = fuzzyFindKey(rowKeys, 'name') || fuzzyFindKey(rowKeys, 'studentname');
      var kProgram = fuzzyFindKey(rowKeys, 'program') || fuzzyFindKey(rowKeys, 'programme');
      var kSchool = fuzzyFindKey(rowKeys, 'school') || fuzzyFindKey(rowKeys, 'institute');
      map[sen] = {
        sen: sen,
        name: kName ? String(row[kName] || '').trim() : '',
        program: kProgram ? String(row[kProgram] || '').trim() : '',
        school: kSchool ? String(row[kSchool] || '').trim() : '',
        cgpa: 0,
        totalCredits: 0,
        totalCreditEarned: 0,
        courses: []
      };
    }
    var s = map[sen];

    // Update blank student fields
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

    var kSem = fuzzyFindKey(rowKeys, 'sem') || fuzzyFindKey(rowKeys, 'semester');
    const rowSem = (kSem ? String(row[kSem] || '').trim() : '') || row['SEM'] || row['Semester'] || "Unknown";

    // Step A (Extract CGPA): Scan all keys for "CGPA" (case-insensitive)
    rowKeys.forEach(function (k) {
      if (/cgpa/i.test(k)) {
        var cgpaVal = parseFloat(row[k]);
        if (!isNaN(cgpaVal) && cgpaVal > 0) {
          s.cgpa = cgpaVal;
        }
      }
    });

    // Step B (Extract Total Credits - Explicit Columns): total AND (credit OR crdit) AND earned
    rowKeys.forEach(function (k) {
      var lowerKey = k.toLowerCase();
      if (lowerKey.includes('total') && (lowerKey.includes('credit') || lowerKey.includes('crdit')) && lowerKey.includes('earned')) {
        var credVal = parseFloat(row[k]);
        if (!isNaN(credVal) && credVal > s.totalCredits) {
          s.totalCredits = credVal;
          s.totalCreditEarned = credVal;
        }
      }
    });

    // Step C (The Summary Row Trap): Detect if all Course Code columns are blank
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

    // IF Summary Row: Scan all keys for any "Credit Earned" or "Crdit Earned"
    if (isSummaryRow) {
      rowKeys.forEach(function (k) {
        var lowerKey = k.toLowerCase();
        if (lowerKey.includes('credit earned') || lowerKey.includes('crdit earned') || lowerKey.includes('creditearned') || lowerKey.includes('crditearned')) {
          var credVal = parseFloat(row[k]);
          if (!isNaN(credVal) && credVal > s.totalCredits) {
            s.totalCredits = credVal;
            s.totalCreditEarned = credVal;
          }
        }
      });
    }

    // Step D: Hybrid Course Extractor (Horizontal & Vertical scanning)
    if (!isSummaryRow) {
      var numberedCoursesFound = false;

      // Loop 1 to 15 for Horizontal slots
      for (var i = 1; i <= 15; i++) {
        var targetP1 = i + 'coursecode';
        var targetP2 = i + 'code';
        var targetP3 = i + 'subjectcode';
        
        var kCC = null;
        for (var j = 0; j < rowKeys.length; j++) {
          var ck = rowKeys[j].toLowerCase().replace(/[\s\-]+/g, '').trim();
          if (ck === targetP1 || ck === targetP2 || ck === targetP3 || ck.includes(targetP1)) {
            kCC = rowKeys[j];
            break;
          }
        }

        if (kCC) {
          var rawCode = row[kCC] || '';
          const cleanCode = rawCode.toString().trim().toUpperCase();
          if (cleanCode && cleanCode !== 'NAN') {
            numberedCoursesFound = true;
            
            var kCT = findNumberedField(rowKeys, i, ['coursetitle', 'title', 'subject', 'coursename']);
            var kFG = findNumberedField(rowKeys, i, ['finalgrade', 'grade']);
            var kCr = findNumberedField(rowKeys, i, ['creditregistered', 'credit', 'credits']);
            var kGp = findNumberedField(rowKeys, i, ['totalcreditpoints', 'creditpoint', 'gradepoints', 'gp', 'points']);
            var kMk = findNumberedField(rowKeys, i, ['totalmarks', 'marks', 'score']);
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
            var exists = s.courses.some(function (c) { return c.code === courseObj.code; });
            if (!exists) {
              s.courses.push(courseObj);
            }
          }
        }
      }

      // If no numbered courses, scan for single vertical column
      if (!numberedCoursesFound) {
        var kCCVert = fuzzyFindKey(rowKeys, 'coursecode') || fuzzyFindKey(rowKeys, 'code') || fuzzyFindKey(rowKeys, 'subjectcode');
        if (kCCVert) {
          var rawCode = row[kCCVert] || '';
          const cleanCode = rawCode.toString().trim().toUpperCase();
          if (cleanCode && cleanCode !== 'NAN') {
            var kCT = fuzzyFindKey(rowKeys, 'coursetitle') || fuzzyFindKey(rowKeys, 'title') || fuzzyFindKey(rowKeys, 'subject') || fuzzyFindKey(rowKeys, 'coursename');
            var kFG = fuzzyFindKey(rowKeys, 'finalgrade') || fuzzyFindKey(rowKeys, 'grade');
            var kCr = fuzzyFindKey(rowKeys, 'creditregistered') || fuzzyFindKey(rowKeys, 'credit') || fuzzyFindKey(rowKeys, 'credits');
            var kGp = fuzzyFindKey(rowKeys, 'totalcreditpoints') || fuzzyFindKey(rowKeys, 'creditpoint') || fuzzyFindKey(rowKeys, 'gradepoints') || fuzzyFindKey(rowKeys, 'gp') || fuzzyFindKey(rowKeys, 'points');
            var kMk = fuzzyFindKey(rowKeys, 'totalmarks') || fuzzyFindKey(rowKeys, 'marks') || fuzzyFindKey(rowKeys, 'score');
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
            var exists = s.courses.some(function (c) { return c.code === courseObj.code; });
            if (!exists) {
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

  // Double-confirmation
  if (!confirm('⚠️ WARNING: This will permanently delete ALL student records from the database.\n\nPasswords will also be wiped. This cannot be undone.\n\nAre you sure you want to continue?')) return;
  if (!confirm('FINAL WARNING: Click OK to delete every student record now.')) return;

  if (btn) btn.disabled = true;
  if (statusEl) statusEl.textContent = '⏳ Sending delete request to backend…';

  var gasUrl = GAS_URL;

  try {
    var adminPassword = sessionStorage.getItem(ADMIN_SESSION) || '';
    await gasPost({ action: 'deleteall', adminPassword: adminPassword });

    // Aggressively wipe all local storage and session storage caches
    localStorage.clear();
    sessionStorage.clear();

    _allStudents = [];
    renderAdminTable([]);
    if (statusEl) statusEl.textContent = '✓ All records deleted. Database and local cache cleared.';
  } catch (err) {
    if (statusEl) statusEl.textContent = '✗ Error: ' + err.message;
  } finally {
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
