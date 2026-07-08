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

// ── Curriculum Evaluation Engine — Degree Audit Rules (V10.0) ─────────────────
/**
 * CURRICULUM_RULES defines per-batch, per-program degree requirements.
 * Each entry is an array of buckets, where each bucket has:
 *   bucket      — human-readable category name
 *   minCredits  — minimum earned credits required to satisfy the bucket
 *   codes       — course codes that count toward this bucket
 */
const CURRICULUM_RULES = {
  '2024': {
    'MCA': [
      { bucket: 'A. School Core',    minCredits: 17, codes: ['CSE5129','MAT5005','ENG5004','CSE6004','CSE6005','CSE6006'] },
      { bucket: 'B. Foreign Languages', minCredits: 2,  codes: ['FRE1001','GER1001','SPA1001'] },
      { bucket: 'C. Soft Skills',    minCredits: 2,  codes: ['SSK2002','SSK3002'] },
      { bucket: 'D. Program Core',   minCredits: 29, codes: ['CSE5067','CSE5002','CSE5005','CSE5004','CSE5012','CSE5011','CSE5013','CSE5017','CSE5009','CSE5010'] },
      { bucket: 'E. Core Elective',  minCredits: 6,  codes: ['CSE5006','CSE5007','CSE5008','CSE5019','CSE5024','CSE5046'] },
      { bucket: 'G. AI & GenAI',     minCredits: 3,  codes: ['CSE5029','CSE5032','CSE5033'] }
    ]
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

  // ── Step A: Extract Unique Semesters ─────────────────────────────────────────
  const uniqueSems = [...new Set(student.courses.map(c => c.sem).filter(Boolean))];

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

// ── Populate Batch & Program Filter Dropdowns (V9.0) ────────────────────
/**
 * populateFilterDropdowns — extracts unique batch and program values from
 * studentsArray, sorts them alphabetically, and injects <option> tags into the
 * #filter-batch and #filter-program <select> elements.
 */
function populateFilterDropdowns(studentsArray) {
  var batches  = {};
  var programs = {};
  (studentsArray || []).forEach(function(s) {
    if (s.batch   && s.batch   !== 'Unknown Batch')   batches[s.batch]     = true;
    if (s.program && s.program !== 'Unknown Program') programs[s.program]  = true;
  });

  var batchSel   = document.getElementById('filter-batch');
  var programSel = document.getElementById('filter-program');

  if (batchSel) {
    batchSel.innerHTML = '<option value="">All Batches</option>';
    Object.keys(batches).sort().forEach(function(b) {
      var opt = document.createElement('option');
      opt.value = b; opt.textContent = b;
      batchSel.appendChild(opt);
    });
  }

  if (programSel) {
    programSel.innerHTML = '<option value="">All Programs</option>';
    Object.keys(programs).sort().forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p; opt.textContent = p;
      programSel.appendChild(opt);
    });
  }
}

// ── Master Faculty Filter (V10.0) ──────────────────────────────────────
/**
 * applyFilters — master filter function with hierarchical filtering (V10.0).
 * Hierarchy: Year/Batch + Program are applied FIRST to create a cohort subset,
 * then Search, Eligibility, and Credit filters are applied strictly to that subset.
 */
function applyFilters() {
  var searchVal    = ((document.getElementById('faculty-search-input')  || {}).value || '').trim().toLowerCase();
  var batchVal     = ((document.getElementById('filter-batch')          || {}).value || '').trim();
  var programVal   = ((document.getElementById('filter-program')        || {}).value || '').trim();
  var eligibility  = ((document.getElementById('filter-eligibility')    || {}).value || 'all').trim();

  // Step 1: Apply Year/Program cohort filter FIRST
  var cohort = (window.students || []).filter(function (s) {
    var matchBatch   = !batchVal   || (s.batch   || '') === batchVal;
    var matchProgram = !programVal || (s.program || '') === programVal;
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
 * evaluateDegree — Curriculum Evaluation Engine (V10.0).
 *
 * Checks a student's passed course credits against CURRICULUM_RULES for their
 * batch year and program. Returns a rich audit object.
 *
 * @param  {object} student
 * @returns {{ isEligible: boolean, message: string, buckets: Array }}
 */
function evaluateDegree(student) {
  var batchKey   = String(student.batch   || '').match(/(20\d{2})/);  // e.g. "2024 Batch" → "2024"
  var batchYear  = batchKey ? batchKey[1] : String(student.batch || '').trim();
  var programKey = String(student.program || '').trim();

  var yearRules = CURRICULUM_RULES[batchYear];
  if (!yearRules) return { isEligible: false, message: 'Curriculum not mapped for batch: ' + (batchYear || 'Unknown'), buckets: [] };
  var rules = yearRules[programKey];
  if (!rules) return { isEligible: false, message: 'Curriculum not mapped for program: ' + (programKey || 'Unknown'), buckets: [] };

  var FAIL_GRADES = ['F', 'FAIL', 'AB'];

  // Build a map of passed course codes → credits earned
  var passedCredits = {};
  (student.courses || []).forEach(function (c) {
    var code  = String(c.code  || '').trim().toUpperCase();
    var grade = String(c.grade || '').trim().toUpperCase();
    if (!code || FAIL_GRADES.includes(grade)) return;
    var cr = parseFloat(c.credits || c.creditEarned || 0);
    if (isNaN(cr)) cr = 0;
    // Keep the highest earned credits per code (handles re-takes)
    if (!passedCredits[code] || cr > passedCredits[code]) passedCredits[code] = cr;
  });

  var allMet = true;
  var buckets = rules.map(function (rule) {
    var earned = 0;
    var passedCodes  = [];
    var missingCodes = [];
    rule.codes.forEach(function (code) {
      var cr = passedCredits[code.toUpperCase()];
      if (cr !== undefined) {
        earned += cr;
        passedCodes.push(code);
      } else {
        missingCodes.push(code);
      }
    });
    var met = earned >= rule.minCredits;
    if (!met) allMet = false;
    return {
      bucket:       rule.bucket,
      minCredits:   rule.minCredits,
      earned:       earned,
      met:          met,
      missingCodes: missingCodes
    };
  });

  return { isEligible: allMet, message: allMet ? 'Eligible for degree award.' : 'Not yet eligible.', buckets: buckets };
}

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
function renderStudentDashboard(student, targetContainerId) {
  targetContainerId = targetContainerId || 'student-dash-content';
  var container = document.getElementById(targetContainerId);
  if (!container) return;

  // ── Build the complete HTML structure for the student view ──────────────────
  var FAIL_GRADES = ['F', 'FAIL', 'AB'];
  var validCourses = (student.courses || []).filter(function (c) {
    return c && c.code && c.code !== 'nan' && c.code.trim() !== '';
  });

  var cgpaVal = parseFloat(student.cgpa);
  var cgpa = (!isNaN(cgpaVal) && cgpaVal !== 0) ? cgpaVal.toFixed(2) : 'N/A';
  var creditsVal = parseFloat(student.totalCredits || student.totalCreditEarned);
  var credits = (!isNaN(creditsVal) && creditsVal !== 0) ? String(creditsVal) : 'N/A';
  var initials = (student.name || 'S').charAt(0);

  // Generate unique prefix to avoid ID conflicts when rendering in faculty view
  var pfx = (targetContainerId === 'faculty-injected-student-data') ? 'finj-' : 'sdash-';

  container.innerHTML = [
    '<div class="profile-card">',
    '<div class="avatar">' + esc(initials) + '</div>',
    '<div style="flex:1;min-width:0">',
    '<div class="pinfo-name">' + esc(student.name) + '</div>',
    '<div class="pinfo-meta">',
    '<span>' + esc(student.program || '') + '</span>',
    '<span>' + (student.school ? ' · ' + esc(student.school) : '') + '</span>',
    '</div>',
    '</div>',
    '<div class="stat-row">',
    '<div class="stat-chip"><div class="stat-val gold">' + esc(cgpa) + '</div><div class="stat-lbl">CGPA</div></div>',
    '<div class="stat-chip"><div class="stat-val green">' + esc(credits) + '</div><div class="stat-lbl">Credits Earned</div></div>',
    '<div class="stat-chip"><div class="stat-val blue">' + validCourses.length + '</div><div class="stat-lbl">Courses</div></div>',
    '</div>',
    '</div>',
    '<div class="sem-tabs" id="' + pfx + 'sem-tabs"></div>',
    '<div class="sem-summary-banner" id="' + pfx + 'sem-summary-banner"></div>',
    '<div class="card">',
    '<div class="card-head">',
    '<div class="card-title" id="' + pfx + 'tbl-title">All Courses</div>',
    '<div class="badge" id="' + pfx + 'tbl-badge">—</div>',
    '</div>',
    '<div class="tbl-wrap"><table>',
    '<thead><tr>',
    '<th>Code</th><th>Course Title</th><th>Type</th><th>Cr.</th>',
    '<th>Marks /100</th><th>Grade</th><th>Gr. Pts</th><th>Cr. Earned</th>',
    '</tr></thead>',
    '<tbody id="' + pfx + 'courses-tbody"></tbody>',
    '</table></div>',
    '</div>'
  ].join('');

  // ── Smart Backlog Engine ────────────────────────────────────────────────────
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

  // ── Unique Semesters ────────────────────────────────────────────────────────
  var seen = {};
  var uniqueSems = [];
  (student.courses || []).forEach(function (c) {
    if (c.sem && !seen[c.sem]) { seen[c.sem] = true; uniqueSems.push(c.sem); }
  });

  // ── Render Tabs ─────────────────────────────────────────────────────────────
  var tabsEl = document.getElementById(pfx + 'sem-tabs');
  if (!tabsEl) return;
  tabsEl.innerHTML = '';

  function makeInjectedTab(label, isAll, clickedSem, backlogType) {
    var btn = document.createElement('button');
    btn.className = 'tab' + (isAll ? ' active' : '');
    btn.textContent = label;
    btn.onclick = function () {
      tabsEl.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
      btn.classList.add('active');
      var banner = document.getElementById(pfx + 'backlog-info-banner');
      if (banner) banner.remove();
      if (backlogType === 'active') {
        renderCourses(activeBacklogs, '\uD83D\uDD34 Active Backlogs', 'all', pfx);
        var b = document.createElement('div');
        b.id = pfx + 'backlog-info-banner';
        b.style.cssText = 'background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);border-radius:8px;padding:0.75rem 1rem;color:#dc2626;font-size:0.88rem;font-weight:600;margin-bottom:0.75rem;';
        b.textContent = '\u26A0 These courses require re-examination.';
        var tblTitle = document.getElementById(pfx + 'tbl-title');
        if (tblTitle && tblTitle.parentNode) tblTitle.parentNode.insertBefore(b, tblTitle);
      } else if (backlogType === 'cleared') {
        renderCourses(clearedBacklogs, '\uD83D\uDFE2 Cleared Backlogs', 'all', pfx);
        var b = document.createElement('div');
        b.id = pfx + 'backlog-info-banner';
        b.style.cssText = 'background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.25);border-radius:8px;padding:0.75rem 1rem;color:#16a34a;font-size:0.88rem;font-weight:600;margin-bottom:0.75rem;';
        b.textContent = '\u2713 Historical backlogs successfully cleared.';
        var tblTitle = document.getElementById(pfx + 'tbl-title');
        if (tblTitle && tblTitle.parentNode) tblTitle.parentNode.insertBefore(b, tblTitle);
      } else if (isAll) {
        renderCourses(student.courses, 'All Semesters', 'all', pfx);
      } else {
        var filtered = student.courses.filter(function (c) { return c.sem === clickedSem; });
        renderCourses(filtered, label, clickedSem, pfx);
      }
    };
    return btn;
  }

  tabsEl.appendChild(makeInjectedTab('All Semesters', true));
  uniqueSems.forEach(function (s) {
    tabsEl.appendChild(makeInjectedTab(SEM_MAP[s] || s, false, s));
  });
  if (activeBacklogs.length > 0) tabsEl.appendChild(makeInjectedTab('\uD83D\uDD34 Active Backlogs', false, null, 'active'));
  if (clearedBacklogs.length > 0) tabsEl.appendChild(makeInjectedTab('\uD83D\uDFE2 Cleared Backlogs', false, null, 'cleared'));

  // ── Degree Audit Tab (V10.0) ────────────────────────────────────────────────
  var auditBtn = document.createElement('button');
  auditBtn.className = 'tab';
  auditBtn.textContent = '\uD83C\uDF93 Degree Audit';
  auditBtn.onclick = function () {
    tabsEl.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
    auditBtn.classList.add('active');
    var banner = document.getElementById(pfx + 'backlog-info-banner');
    if (banner) banner.remove();

    var audit = evaluateDegree(student);
    var tblTitle = document.getElementById(pfx + 'tbl-title');
    var tblBadge = document.getElementById(pfx + 'tbl-badge');
    var tbody    = document.getElementById(pfx + 'courses-tbody');
    if (!tblTitle || !tbody) return;

    tblTitle.textContent = '\uD83C\uDF93 Degree Audit';
    if (tblBadge) {
      tblBadge.textContent = audit.isEligible ? '\u2705 Eligible' : '\u274C Not Eligible';
      tblBadge.style.background = audit.isEligible ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)';
      tblBadge.style.color = audit.isEligible ? '#16a34a' : '#dc2626';
    }

    if (!audit.buckets || !audit.buckets.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--muted);">' +
        esc(audit.message) + '</td></tr>';
      return;
    }

    // Re-render thead for the audit table
    var table = tbody.closest('table');
    if (table) {
      var thead = table.querySelector('thead tr');
      if (thead) thead.innerHTML = '<th>Bucket</th><th>Required Cr.</th><th>Earned Cr.</th><th>Status</th><th>Missing Courses</th>';
    }

    tbody.innerHTML = '';
    audit.buckets.forEach(function (b) {
      var tr = document.createElement('tr');
      var statusBadge = b.met
        ? '<span style="background:rgba(22,163,74,0.15);color:#16a34a;font-family:var(--mono);font-size:0.75rem;padding:0.2rem 0.6rem;border-radius:10px;font-weight:700;">\u2705 Completed</span>'
        : '<span style="background:rgba(220,38,38,0.12);color:#dc2626;font-family:var(--mono);font-size:0.75rem;padding:0.2rem 0.6rem;border-radius:10px;font-weight:700;">\u274C Missing ' + (b.minCredits - b.earned).toFixed(0) + ' Cr.</span>';
      var missingHtml = b.missingCodes.length
        ? b.missingCodes.map(function (c) {
            return '<code style="background:rgba(220,38,38,0.08);color:#f87171;font-size:0.72rem;padding:0.1rem 0.4rem;border-radius:4px;margin:0.1rem;display:inline-block;">' + esc(c) + '</code>';
          }).join(' ')
        : '<span style="color:var(--green);font-size:0.78rem;">\u2014 None</span>';
      tr.innerHTML = [
        '<td style="font-weight:600;font-size:0.85rem;">' + esc(b.bucket) + '</td>',
        '<td style="font-family:var(--mono);font-size:0.85rem;color:var(--gold);">' + b.minCredits + '</td>',
        '<td style="font-family:var(--mono);font-size:0.85rem;color:' + (b.met ? 'var(--green)' : '#f87171') + ';font-weight:700;">' + b.earned.toFixed(1) + '</td>',
        '<td>' + statusBadge + '</td>',
        '<td style="font-size:0.82rem;line-height:1.8;">' + missingHtml + '</td>'
      ].join('');
      tbody.appendChild(tr);
    });
  };
  tabsEl.appendChild(auditBtn);

  renderCourses(student.courses, 'All Semesters', 'all', pfx);
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
  var uniqueSems = [];
  var seen = {};
  (student.courses || []).forEach(function (c) {
    var s = c.sem;
    if (s && !seen[s]) { seen[s] = true; uniqueSems.push(s); }
  });

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

      // ── Inject Tags from UI Selectors (V10.0) ─────────────────────────────────
      // Reads Year and Program tags directly from the admin upload dropdowns.
      // These override any filename-based extraction, ensuring exact tagging.
      var yearEl    = document.getElementById('upload-year');
      var programEl = document.getElementById('upload-program');
      var yearVal   = yearEl    ? yearEl.value.trim()    : '';
      var progVal   = programEl ? programEl.value.trim() : '';

      if (!yearVal || !progVal) {
        setAlert('err', '\u26A0 Please select a Year/Batch and Program before uploading!');
        return;
      }

      var fileBatch   = yearVal;
      var fileProgram = progVal;


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
            program: fileProgram || s.program,
            batch: fileBatch || s.batch || '',
            school: s.school,
            cgpa: s.cgpa || 0,
            totalCredits: s.totalCredits || 0,
            totalCreditEarned: s.totalCreditEarned || 0,
            courses: []
          };
        }
        var target = consolidatedMap[sen];
        if (s.name) target.name = s.name;
        // Filename data takes priority; fall back to row data
        target.program = fileProgram || target.program || s.program;
        target.batch = fileBatch || target.batch || s.batch || '';
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

          // Composite key: Course Code + Semester (allows same course in different sems,
          // and retaken F-grade courses in the same sem to both appear)
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
