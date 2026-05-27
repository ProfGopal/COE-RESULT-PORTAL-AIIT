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
  showPage('landing');
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

  var cgpa = student.cgpa ? parseFloat(student.cgpa).toFixed(2) : '—';
  document.getElementById('dash-cgpa').textContent = cgpa;
  document.getElementById('dash-ce').textContent = student.totalCreditEarned || '—';

  var validCourses = (student.courses || []).filter(function (c) {
    return c && c.code && c.code !== 'nan' && c.code.trim() !== '';
  });
  document.getElementById('dash-nc').textContent = validCourses.length;

  // Build semester tabs
  var sems = [];
  var seen = {};
  validCourses.forEach(function (c) {
    if (c.semester && c.semester !== 'nan' && !seen[c.semester]) {
      sems.push(c.semester);
      seen[c.semester] = true;
    }
  });
  sems.sort();

  var tabsEl = document.getElementById('sem-tabs');
  tabsEl.innerHTML = '';

  function makeTab(label, courses, key) {
    var btn = document.createElement('button');
    btn.className = 'tab' + (key === 'all' ? ' active' : '');
    btn.textContent = label;
    btn.onclick = function () {
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
      btn.classList.add('active');
      renderCourses(courses, label);
    };
    return btn;
  }

  tabsEl.appendChild(makeTab('All Semesters', validCourses, 'all'));
  sems.forEach(function (s) {
    var label = SEM_MAP[s] || ('Sem ' + s);
    var filtered = validCourses.filter(function (c) { return c.semester === s; });
    tabsEl.appendChild(makeTab(label, filtered, s));
  });

  renderCourses(validCourses, 'All Semesters');
}

function renderCourses(courses, title) {
  var valid = (courses || []).filter(function (c) {
    return c && c.code && c.code !== 'nan' && c.code.trim() !== '';
  });
  document.getElementById('tbl-title').textContent = title;
  document.getElementById('tbl-badge').textContent = valid.length + ' course' + (valid.length !== 1 ? 's' : '');

  var tbody = document.getElementById('courses-tbody');
  tbody.innerHTML = '';

  if (!valid.length) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.colSpan = 8; td.style.textAlign = 'center';
    td.style.padding = '2rem'; td.style.color = 'var(--muted)';
    td.textContent = 'No courses found for this selection.';
    tr.appendChild(td); tbody.appendChild(tr);
    return;
  }

  valid.forEach(function (c) {
    var grade = (c.grade || '—').trim();
    var marks = c.marks ? parseFloat(c.marks).toFixed(1) : '—';
    var pct = c.marks ? Math.min(100, Math.round(parseFloat(c.marks))) : 0;
    var gc = ['S', 'A', 'B', 'C', 'D', 'E', 'F'].includes(grade) ? 'g-' + grade : 'g-D';
    var row = document.createElement('tr');
    row.innerHTML = [
      '<td class="td-code">' + esc(c.code) + '</td>',
      '<td class="td-title">' + esc(c.title || '—') + '</td>',
      '<td><span class="type-chip">' + esc(c.type || '—') + '</span></td>',
      '<td style="font-family:var(--mono);font-size:0.8rem">' + esc(c.credits || '—') + '</td>',
      '<td><div class="bar-wrap"><span class="bar-num">' + esc(marks) + '</span>' +
      '<div class="bar-bg"><div class="bar-fill" style="width:' + pct + '%"></div></div></div></td>',
      '<td><span class="grade ' + esc(gc) + '">' + esc(grade) + '</span></td>',
      '<td style="font-family:var(--mono);font-size:0.8rem">' + esc(c.gradePoints || '—') + '</td>',
      '<td style="font-family:var(--mono);font-size:0.8rem">' + esc(c.creditEarned || '—') + '</td>'
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
  var file = e.dataTransfer.files[0];
  if (file) handleFileUpload(file);
}

async function handleFileUpload(file) {
  if (!file) return;
  var alertEl = document.getElementById('upload-alert');

  function setAlert(type, msg) {
    if (!alertEl) return;
    alertEl.className = 'alert ' + type;
    alertEl.innerHTML = msg;
    alertEl.style.display = 'block';
  }

  var gasUrl = GAS_URL;

  setAlert('info', '<span class="spinner"></span>Reading Excel file…');

  var arrayBuffer;
  try { arrayBuffer = await file.arrayBuffer(); } catch (e) {
    setAlert('err', '✗ Could not read file: ' + e.message); return;
  }

  var students;
  try {
    students = parseExcelToStudents(arrayBuffer, function (msg) {
      setAlert('info', '<span class="spinner"></span>' + msg);
    });
  } catch (parseErr) {
    setAlert('err', '✗ Excel parse error: ' + parseErr.message); return;
  }

  if (!students || students.length === 0) {
    setAlert('warn', '⚠ No student records detected. Check that column headers match: SEN, Name, Semester, Course Code, Course Title, Type, Credits, Marks, Grade, Grade Points.');
    return;
  }

  setAlert('info', '<span class="spinner"></span>Sending ' + students.length + ' students to backend…');

  try {
    var adminPassword = sessionStorage.getItem(ADMIN_SESSION) || '';
    await gasPost({ action: 'upsert', students: students, adminPassword: adminPassword });
    setAlert('ok', '✓ ' + students.length + ' students sent to the backend (upsert). The backend will insert new records and update existing ones while preserving passwords. Refresh to see updated data.');
    setTimeout(loadAdminData, 2000);
  } catch (postErr) {
    setAlert('warn', '⚠ Data sent (no-cors mode — cannot confirm receipt). Backend should have processed it. Refresh to verify.');
    setTimeout(loadAdminData, 3000);
  }

  var fi = document.getElementById('fileInput');
  if (fi) fi.value = '';
}

/**
 * parseExcelToStudents — STRICT MAPPING v3 (Horizontal Course Columns)
 *
 * Handles the AIIT Excel format where each row represents ONE STUDENT and
 * courses are stored horizontally:
 *   SEN | Name | SEM | CGPA | 1-Course Code | 1-Course Title | 1-Final Grade |
 *   1- Credit | 1- Credit Earned | 2-Course Code | 2-Course Title | ...
 *
 * Rules (per v3 blueprint):
 *   · Group by SEN (one row = one student in the horizontal format).
 *   · Loop i = 1..MAX_COURSES, extract `${i}-Course Code`, `${i}-Course Title`,
 *     `${i}-Final Grade`, `${i}- Credit`, `${i}- Credit Earned` per course.
 *   · Also supports the older vertical format (one row = one course) as fallback.
 *   · CGPA is read DIRECTLY from the 'CGPA' column — never calculated.
 *   · SEM column is read literally (e.g. "Fall Semester 2025-26").
 *   · NO mathematical operations are performed anywhere in this function.
 */
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

  // ── Exact-match key finder (case-insensitive, strips spaces & punctuation) ─
  var sampleKeys = Object.keys(allRows[0]);

  function exactKey(rawKeys, target) {
    var t = target.toLowerCase().replace(/\s+/g, ' ').trim();
    for (var k = 0; k < rawKeys.length; k++) {
      if (rawKeys[k].toLowerCase().replace(/\s+/g, ' ').trim() === t) return rawKeys[k];
    }
    // Fallback: normalised (no spaces/punct)
    var tn = t.replace(/[^a-z0-9]/g, '');
    for (var k2 = 0; k2 < rawKeys.length; k2++) {
      if (rawKeys[k2].toLowerCase().replace(/[^a-z0-9]/g, '') === tn) return rawKeys[k2];
    }
    return null;
  }

  // Flexible finder — tries a list of candidate names in order
  function findKey(rawKeys, candidates) {
    for (var i = 0; i < candidates.length; i++) {
      var found = exactKey(rawKeys, candidates[i]);
      if (found) return found;
    }
    // Last-resort: substring match
    var firstNorm = candidates[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    for (var j = 0; j < rawKeys.length; j++) {
      if (rawKeys[j].toLowerCase().replace(/[^a-z0-9]/g, '').includes(firstNorm)) return rawKeys[j];
    }
    return null;
  }

  // ── Detect whether format is HORIZONTAL or VERTICAL ───────────────────────
  // Horizontal: sheet has columns like '1-Course Code', '2-Course Code', etc.
  var isHorizontal = sampleKeys.some(function (k) {
    return /^1[- ]course\s*code/i.test(k.trim());
  });

  // ── Detect fixed column keys ───────────────────────────────────────────────
  var kSen = findKey(sampleKeys, ['SEN', 'Enrollment No', 'Enrollment', 'Student ID', 'Enrollment Number']);
  var kName = findKey(sampleKeys, ['Name', 'Student Name', 'Full Name']);
  var kSem = findKey(sampleKeys, ['SEM', 'Semester', 'Sem']);
  var kProgram = findKey(sampleKeys, ['Program', 'Programme', 'Branch', 'Course']);
  var kSchool = findKey(sampleKeys, ['School', 'College', 'Department', 'Dept']);

  // CGPA — strict name match first, then fallbacks
  var kCgpa = exactKey(sampleKeys, 'CGPA') ||
    findKey(sampleKeys, ['CGPA', 'Cumulative GPA', 'GPA']);

  // Total credits earned — look for '1- Credit Earned' aggregate or similar
  var kTotCred = findKey(sampleKeys, [
    'Total Credit Earned', 'Total Credits Earned', 'Total Credit',
    'Total Credits', 'Credits Earned', 'Credit Earned'
  ]);

  if (!kSen) throw new Error(
    'SEN / Enrollment column not found. Column headers detected: ' +
    sampleKeys.slice(0, 10).join(', ')
  );

  var map = {}; // { SEN → studentObject }

  if (isHorizontal) {
    // ════════════════════════════════════════════════════════════════════════
    //  HORIZONTAL FORMAT  (one row = one student, courses spread rightward)
    //  Column names: 1-Course Code, 1-Course Title, 1-Final Grade,
    //                1- Credit, 1- Credit Earned  (note space after dash)
    // ════════════════════════════════════════════════════════════════════════
    var MAX_COURSES = 15; // scan up to 15 course slots per row

    allRows.forEach(function (row) {
      var rowKeys = Object.keys(row);
      var sen = String(row[kSen] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
      if (!sen || sen.length < 5) return;

      var sem = kSem ? String(row[kSem] || '').trim() : '';
      var cgpa = kCgpa ? row[kCgpa] : '';
      // Try to update CGPA if the cell has a real value
      if (cgpa === '' || cgpa === null || cgpa === undefined) cgpa = '';

      if (!map[sen]) {
        map[sen] = {
          sen: sen,
          name: kName ? String(row[kName] || '').trim() : '',
          program: kProgram ? String(row[kProgram] || '').trim() : '',
          school: kSchool ? String(row[kSchool] || '').trim() : '',
          cgpa: cgpa,  // literal from sheet
          totalCreditEarned: kTotCred ? row[kTotCred] : '',
          courses: []
        };
      }

      var s = map[sen];
      // Update summary fields if we get a non-empty value on a later row
      if (kName && !s.name && row[kName]) s.name = String(row[kName]).trim();
      if (kProgram && !s.program && row[kProgram]) s.program = String(row[kProgram]).trim();
      if (kSchool && !s.school && row[kSchool]) s.school = String(row[kSchool]).trim();
      if (kCgpa && (s.cgpa === '' || s.cgpa === null) && row[kCgpa] !== '') {
        s.cgpa = row[kCgpa];
      }
      if (kTotCred && (s.totalCreditEarned === '' || s.totalCreditEarned === null) && row[kTotCred] !== '') {
        s.totalCreditEarned = row[kTotCred];
      }

      // Extract courses from horizontal columns: 1-Course Code … N-Course Code
      for (var i = 1; i <= MAX_COURSES; i++) {
        // Try both '1-Course Code' and '1- Course Code' (with space after dash)
        var prefix = i + '-';
        var prefixSp = i + '- ';

        // Course Code
        var kCC = exactKey(rowKeys, prefix + 'Course Code') ||
          exactKey(rowKeys, prefixSp + 'Course Code') ||
          exactKey(rowKeys, prefix + 'CourseCode');
        if (!kCC) break; // no more numbered slots

        var code = String(row[kCC] || '').trim();
        if (!code || code.toLowerCase() === 'nan') continue;

        // Course Title
        var kCT = exactKey(rowKeys, prefix + 'Course Title') ||
          exactKey(rowKeys, prefixSp + 'Course Title') ||
          exactKey(rowKeys, prefix + 'CourseTitle');

        // Final Grade
        var kFG = exactKey(rowKeys, prefix + 'Final Grade') ||
          exactKey(rowKeys, prefixSp + 'Final Grade') ||
          exactKey(rowKeys, prefix + 'Grade') ||
          exactKey(rowKeys, prefixSp + 'Grade');

        // Credits (allocated)
        var kCr = exactKey(rowKeys, prefix + 'Credit') ||
          exactKey(rowKeys, prefixSp + 'Credit') ||
          exactKey(rowKeys, prefix + 'Credits') ||
          exactKey(rowKeys, prefixSp + 'Credits');

        // Credit Earned
        var kCe = exactKey(rowKeys, prefix + 'Credit Earned') ||
          exactKey(rowKeys, prefixSp + 'Credit Earned') ||
          exactKey(rowKeys, prefix + 'CreditEarned');

        // Grade Points
        var kGp = exactKey(rowKeys, prefix + 'Grade Points') ||
          exactKey(rowKeys, prefixSp + 'Grade Points') ||
          exactKey(rowKeys, prefix + 'GradePoints');

        // Marks
        var kMk = exactKey(rowKeys, prefix + 'Marks') ||
          exactKey(rowKeys, prefixSp + 'Marks') ||
          exactKey(rowKeys, prefix + 'Score');

        // Course Type
        var kTy = exactKey(rowKeys, prefix + 'Type') ||
          exactKey(rowKeys, prefixSp + 'Type') ||
          exactKey(rowKeys, prefix + 'Course Type');

        s.courses.push({
          semester: sem,
          code: code,
          title: kCT ? String(row[kCT] || '').trim() : '',
          type: kTy ? String(row[kTy] || '').trim() : '',
          credits: kCr ? row[kCr] : '',   // literal from sheet
          marks: kMk ? row[kMk] : '',
          grade: kFG ? String(row[kFG] || '').trim() : '',
          gradePoints: kGp ? row[kGp] : '',
          creditEarned: kCe ? row[kCe] : ''
        });
      }
    });

  } else {
    // ════════════════════════════════════════════════════════════════════════
    //  VERTICAL FORMAT  (one row = one course)
    //  Column names: Course Code, Course Title, Grade, Credits, etc.
    // ════════════════════════════════════════════════════════════════════════
    var kCode = findKey(sampleKeys, ['Course Code', 'Code', 'Subject Code', 'CourseCode']);
    var kTitle = findKey(sampleKeys, ['Course Title', 'Title', 'Subject', 'Course Name']);
    var kType = findKey(sampleKeys, ['Type', 'Course Type', 'Category']);
    var kCred = findKey(sampleKeys, ['Credits', 'Credit', 'Credit Points']);
    var kMarks = findKey(sampleKeys, ['Marks', 'Score', 'Total Marks', 'Total']);
    var kGrade = findKey(sampleKeys, ['Grade', 'Final Grade']);
    var kGP = findKey(sampleKeys, ['Grade Points', 'GradePoints', 'GP', 'Points']);
    var kCE = findKey(sampleKeys, ['Credit Earned', 'Credits Earned', 'CreditEarned']);

    allRows.forEach(function (row) {
      var rowKeys = Object.keys(row);
      var sen = String(row[kSen] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
      if (!sen || sen.length < 5) return;

      var cgpa = kCgpa ? row[kCgpa] : '';
      var sem = kSem ? String(row[kSem] || '').trim() : '';

      if (!map[sen]) {
        map[sen] = {
          sen: sen,
          name: kName ? String(row[kName] || '').trim() : '',
          program: kProgram ? String(row[kProgram] || '').trim() : '',
          school: kSchool ? String(row[kSchool] || '').trim() : '',
          cgpa: cgpa,
          totalCreditEarned: kTotCred ? row[kTotCred] : '',
          courses: []
        };
      }

      var s = map[sen];
      if (kName && !s.name && row[kName]) s.name = String(row[kName]).trim();
      if (kProgram && !s.program && row[kProgram]) s.program = String(row[kProgram]).trim();
      if (kSchool && !s.school && row[kSchool]) s.school = String(row[kSchool]).trim();
      if (kCgpa && (s.cgpa === '' || s.cgpa === null) && row[kCgpa] !== '') s.cgpa = row[kCgpa];
      if (kTotCred && (s.totalCreditEarned === '' || s.totalCreditEarned === null) && row[kTotCred] !== '') {
        s.totalCreditEarned = row[kTotCred];
      }

      var code = kCode ? String(row[kCode] || '').trim() : '';
      if (!code || code.toLowerCase() === 'nan') return;

      s.courses.push({
        semester: sem,
        code: code,
        title: kTitle ? String(row[kTitle] || '').trim() : '',
        type: kType ? String(row[kType] || '').trim() : '',
        credits: kCred ? row[kCred] : '',
        marks: kMarks ? row[kMarks] : '',
        grade: kGrade ? String(row[kGrade] || '').trim() : '',
        gradePoints: kGP ? row[kGP] : '',
        creditEarned: kCE ? row[kCE] : ''
      });
    });
  }

  // Return students as-is — NO CALCULATIONS.
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
