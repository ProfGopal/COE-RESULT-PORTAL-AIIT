/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Cloud-Enforced Ver 5.3)
 */

'use strict';

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";
const GAS_URL = scriptURL;

var LOCAL_STU_KEY = 'coe_students_v2';
var ADMIN_SESSION = 'coe_admin_auth';

window.STUDENTS = window.STUDENTS || [];
window.ALL_STUDENTS = window.ALL_STUDENTS || [];
window.CURRICULUM_RULES = window.CURRICULUM_RULES || {};

var currentStudent = null;
var isNewUser = false;
var loginAttempts = {};
var MAX_ATTEMPTS = 5;
var LOCKOUT_MS = 15 * 60 * 1000;

function sanitize(str) {
  return String(str || '').replace(/[<>"'`;\\&\/]/g, '').trim().substring(0, 200);
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
window.esc = esc;

function showErr(id, msg, inputIds) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'alert err';
  el.style.display = 'block';
  var okEl = document.getElementById(id.replace('err', 'ok'));
  if (okEl) okEl.style.display = 'none';
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

window.showPage = function (id) {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  var target = document.getElementById(id);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
};

window.showStudentLogin = function () {
  resetStudentLoginUI();
  showPage('landing');
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
  isNewUser = false;
};

// --- STUDENT LOGIN & PASSWORD CREATION FLOW ---
window.studentLoginStep = async function () {
    var rawSen = document.getElementById('s-sen').value;
    var sen = sanitize(rawSen).toUpperCase();
    hideAlerts('student');

    if (!sen) { showErr('student-err', 'Please enter your SEN number.', ['s-sen']); return; }

    var btn = document.getElementById('s-login-btn');
    if (btn) btn.disabled = true;

    const executePhaseShift = (studentObj) => {
        if (btn) btn.innerHTML = "✅ Access Granted";
        const loginBox = btn ? (btn.closest('.bg-white') || btn.closest('.shadow-lg')) : null;
        if (loginBox) loginBox.remove();
        
        const loginContainer = document.getElementById('student-login-container') || document.querySelector('.login-container');
        if (loginContainer) loginContainer.style.display = 'none';

        const studentDash = document.getElementById('student-dash') || document.getElementById('student-dashboard');
        if (studentDash) {
            studentDash.style.display = 'block';
            studentDash.classList.add('dashboard-fullscreen-overlay');
        }

        document.body.classList.add('overlay-active');
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        if (typeof renderStudentDash === 'function') {
            renderStudentDash(studentObj);
        }
    };

    try {
        if (isNewUser) {
            var newpass = sanitize((document.getElementById('s-newpass') || {}).value || '');
            var confpass = sanitize((document.getElementById('s-confirmpass') || {}).value || '');

            if (!newpass) { showErr('student-err', 'Please enter a new password.', ['s-newpass']); return; }
            if (newpass.length < 6) { showErr('student-err', 'Password must be at least 6 characters.', ['s-newpass', 's-confirmpass']); return; }
            if (newpass !== confpass) { showErr('student-err', 'Passwords do not match.', ['s-newpass', 's-confirmpass']); return; }

            if (btn) { btn.disabled = true; btn.textContent = '⏳ Saving & Logging In...'; }

            await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'setpassword', sen: sen, newPassword: newpass })
            });

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

        var passInput = (document.getElementById('s-pass') || {}).value || '';
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Signing in…'; }

        var response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'login', sen: sen, password: passInput.trim() })
        });
        var result = await response.json();

        if (result && result.status === 'success' && result.student) {
            currentStudent = result.student;
            executePhaseShift(currentStudent);
        } else if (result && (result.status === 'first_time' || (result.message && result.message.toLowerCase().includes('first')))) {
            isNewUser = true;
            var pf = document.getElementById('s-pass-field');
            var nf = document.getElementById('s-newpass-fields');
            if (pf) pf.style.display = 'none';
            if (nf) nf.style.display = 'block';
            if (btn) btn.textContent = 'Create Password & Login →';
            showOk('student-ok', result.message || 'First-time login detected. Please create your password below.');
        } else if (result && result.status === 'error') {
            showErr('student-err', '⚠ ' + (result.message || 'Login failed.'), ['s-pass']);
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

// --- CLOUD-CONNECTED ADMIN PASSWORD CLEAR ---
window.clearStudentPassword = async function(senInputId) {
    let inputEl = document.getElementById(senInputId) || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
    let sen = inputEl ? inputEl.value.trim().toUpperCase() : "";
    
    if (!sen) {
        alert("⚠️ Please enter a valid Student Enrollment Number (SEN).");
        return;
    }

    if (!confirm(`Are you sure you want to clear the password for student ${sen} in the Cloud Database?`)) return;

    let btn = event ? event.target : null;
    if (btn) { btn.innerHTML = "⏳ Clearing..."; btn.disabled = true; }

    try {
        let response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'clearpassword', sen: sen })
        });
        let result = await response.json();

        if (result && result.status === 'success') {
            alert(`✅ Cloud Database: Password successfully cleared for student ${sen}.\nColumn G is now cleared. The student can now log in to set a new password.`);
            if (inputEl) inputEl.value = "";
        } else {
            alert(`❌ Error: ${result.message}`);
        }
    } catch (err) {
        console.error("Cloud clear error:", err);
        alert("❌ Network error connecting to Google Sheet backend.");
    } finally {
        if (btn) { btn.innerHTML = "✓ Cleared"; btn.disabled = false; }
    }
};

window.clearPassword = function() { return window.clearStudentParameter || window.clearStudentPassword('reset-sen-input'); };

// --- ADMIN LOGIN ---
window.adminLogin = async function() {
    const emailInput = document.querySelector('input[type="email"]') || document.querySelectorAll('input')[0];
    const passInput = document.querySelector('input[type="password"]') || document.querySelectorAll('input')[1];

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passInput ? passInput.value.trim() : "";
    const btn = document.querySelector('button');

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'verifyadmin', password: password })
        });
        const data = await response.json();

        if (data.status === 'success') {
            window.currentAdminPassword = password;
            sessionStorage.setItem('coe_admin_auth', password);
            showPage('admin-dash');
            if (typeof applyAdminFilters === 'function') applyAdminFilters();
        } else {
            alert(`⚠ ${data.message}`);
        }
    } catch (err) {
        alert(`⚠ Network Error: Check your connection.`);
    }
};

document.addEventListener('click', function(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    // Direct binding for single student password clear button in admin-hidden.html
    if (btn.textContent.includes('Clear Password') && !btn.textContent.includes('ALL')) {
        e.preventDefault();
        window.clearStudentPassword('reset-sen-input');
    }
});