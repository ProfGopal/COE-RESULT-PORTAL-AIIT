/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 5.4 - Fully Restored Admin & Student Flows)
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

function sanitize(str) {
  return String(str || '').replace(/[<>"'`;\\&\/]/g, '').trim().substring(0, 200);
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
window.esc = esc;

function showErr(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'alert err';
  el.style.display = 'block';
}

function showOk(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'alert ok';
  el.style.display = 'block';
}

function hideAlerts(prefix) {
  ['err', 'ok', 'info'].forEach(function (s) {
    var el = document.getElementById(prefix + '-' + s);
    if (el) el.style.display = 'none';
  });
}

window.showPage = function (id) {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  var target = document.getElementById(id);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
};

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN TAB NAVIGATION FIX (Restores buttons functionality)
// ═══════════════════════════════════════════════════════════════════════════════

window.switchAdminTab = function (tabId, btnElement) {
  document.querySelectorAll('.admin-tab-content, .page-section, section[id^="tab-"]').forEach(tab => {
      if (tab) tab.style.display = 'none';
  });
  
  document.querySelectorAll('.admin-tab-btn, .nav-btn').forEach(btn => {
      if (btn) btn.classList.remove('active', 'bg-blue-600', 'text-white');
  });

  var target = document.getElementById(tabId);
  if (target) target.style.display = 'block';

  if (btnElement) {
      btnElement.classList.add('active');
  }

  // Trigger specific tab data loaders if needed
  if (tabId === 'tab-students' || tabId === 'student-directory') {
      if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
  }
};

// Automatic button click bindings for admin navigation
document.addEventListener('click', function(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    // Map top 4 admin tabs securely
    if (btn.textContent.includes('Upload Results') || btn.textContent.includes('1. Upload')) {
        e.preventDefault();
        window.switchAdminTab('tab-upload', btn);
    } else if (btn.textContent.includes('Manage Curriculum') || btn.textContent.includes('2. Manage')) {
        e.preventDefault();
        window.switchAdminTab('tab-curriculum', btn);
        if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
    } else if (btn.textContent.includes('Student Directory') || btn.textContent.includes('3. Student')) {
        e.preventDefault();
        window.switchAdminTab('tab-students', btn);
        if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
    } else if (btn.textContent.includes('Faculty Assignments') || btn.textContent.includes('4. Faculty')) {
        e.preventDefault();
        window.switchAdminTab('tab-faculty', btn);
    }
});
// ═══════════════════════════════════════════════════════════════════════════════
//  PRECISE ADMIN TAB SWITCHING ENGINE (Ver 5.5)
// ═══════════════════════════════════════════════════════════════════════════════

window.switchAdminTab = function (tabId, btnElement) {
    // Hide all sections in the admin dashboard
    document.querySelectorAll('.admin-section, .admin-tab-content, div[id^="tab-"], section[id^="tab-"]').forEach(sec => {
        if (sec) sec.style.display = 'none';
    });

    // Remove active styles from top navigation buttons
    document.querySelectorAll('.admin-tab-btn, .nav-btn, .dashboard-nav button').forEach(b => {
        if (b) {
            b.classList.remove('active', 'bg-blue-600', 'text-white');
            b.style.background = '';
            b.style.color = '';
        }
    });

    // Show the target section
    var target = document.getElementById(tabId) || document.querySelector('.' + tabId);
    if (target) {
        target.style.display = 'block';
    }

    // Highlight the clicked button
    if (btnElement) {
        btnElement.classList.add('active');
        btnElement.style.background = '#2563eb';
        btnElement.style.color = '#ffffff';
    }

    // Trigger specific loaders when switching tabs
    if (tabId === 'tab-students' || tabId === 'student-directory') {
        if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
    } else if (tabId === 'tab-curriculum' || tabId === 'manage-curriculum') {
        if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
    }
};

// Global click listener to safely intercept the 4 top admin buttons
document.addEventListener('click', function(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    let text = btn.textContent.trim();

    if (text.includes('1. Upload Results') || text.includes('Upload Results')) {
        e.preventDefault();
        window.switchAdminTab('tab-upload', btn);
    } else if (text.includes('2. Manage Curriculum') || text.includes('Manage Curriculum')) {
        e.preventDefault();
        window.switchAdminTab('tab-curriculum', btn);
    } else if (text.includes('3. Student Directory') || text.includes('Student Directory')) {
        e.preventDefault();
        window.switchAdminTab('tab-students', btn);
    } else if (text.includes('4. Faculty Assignments') || text.includes('Faculty Assignments')) {
        e.preventDefault();
        window.switchAdminTab('tab-faculty', btn);
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDENT LOGIN & CLOUD AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════════

window.studentLoginStep = async function () {
    var rawSen = document.getElementById('s-sen')?.value || document.getElementById('student-sen')?.value;
    var sen = sanitize(rawSen).toUpperCase();
    hideAlerts('student');

    if (!sen) { showErr('student-err', 'Please enter your SEN number.'); return; }

    var btn = document.getElementById('s-login-btn');
    if (btn) btn.disabled = true;

    try {
        var passInput = document.getElementById('s-pass')?.value || document.getElementById('student-pass')?.value || '';
        
        var response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'login', sen: sen, password: passInput.trim() })
        });
        var result = await response.json();

        if (result && result.status === 'success' && result.student) {
            window.loadStudentDashboard(result.student);
        } else if (result && (result.status === 'first_time' || (result.message && result.message.toLowerCase().includes('first')))) {
            let newPass = prompt("🔐 First-time login or password reset. Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                if (btn) btn.disabled = false;
                return;
            }

            let setRes = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'setpassword', sen: sen, newPassword: newPass })
            });
            let setJson = await setRes.json();

            if (setJson.status === 'success') {
                alert("✅ Password created successfully! Logging you in...");
                window.loadStudentDashboardAfterCloudAuth(sen);
            } else {
                alert(`❌ Error: ${setJson.message}`);
            }
        } else {
            showErr('student-err', '⚠ ' + (result.message || 'Incorrect password.'));
        }
    } catch (err) {
        console.error('Login error:', err);
        showErr('student-err', '✗ Cloud connection error. Check your internet.');
    } finally {
        if (btn) btn.disabled = false;
    }
};

window.loadStudentDashboardAfterCloudAuth = async function(sen) {
    try {
        let res = await fetch(scriptURL + "?action=load");
        let students = await res.json();
        let student = students.find(s => String(s.sen).toUpperCase() === sen);
        if (student) window.loadStudentDashboard(student);
        else window.location.reload();
    } catch(e) { window.location.reload(); }
};

window.loadStudentDashboard = function(student) {
    window.currentStudent = student;
    document.querySelectorAll('.page, .login-container, #student-login-container').forEach(el => el.style.display = 'none');
    
    const dash = document.getElementById('student-dash') || document.getElementById('student-dashboard');
    if (dash) dash.style.display = 'block';

    let name = student.name || 'Student';
    let sen = student.sen || '';
    let cgpa = student.cgpa || 'N/A';
    let credits = student.totalCredits || '0';

    document.querySelectorAll('#dash-name, .student-name').forEach(el => el.textContent = `${name} (${sen})`);
    document.querySelectorAll('#dash-cgpa, .cgpa-val').forEach(el => el.textContent = cgpa);
    document.querySelectorAll('#dash-ce, .credits-val').forEach(el => el.textContent = credits);

    let tbody = document.getElementById('courses-tbody') || document.querySelector('table tbody');
    if (tbody && student.courses) {
        tbody.innerHTML = student.courses.map(c => `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px; font-weight:bold;">${esc(c.code)}</td>
                <td style="padding:10px;">${esc(c.name)}</td>
                <td style="padding:10px;">${esc(c.type || 'Core')}</td>
                <td style="padding:10px;">${esc(c.credits)}</td>
                <td style="padding:10px;">${esc(c.marks)}</td>
                <td style="padding:10px; font-weight:bold; color:#2563eb;">${esc(c.grade)}</td>
            </tr>
        `).join('');
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN PASSWORD CLEARING & FILTERS
// ═══════════════════════════════════════════════════════════════════════════════

window.clearStudentPassword = async function(senInputId) {
    let inputEl = document.getElementById(senInputId) || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
    let sen = inputEl ? inputEl.value.trim().toUpperCase() : "";
    
    if (!sen) { alert("⚠️ Please enter a valid SEN number."); return; }
    if (!confirm(`Clear password for student ${sen}?`)) return;

    try {
        let response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'clearpassword', sen: sen })
        });
        let result = await response.json();
        if (result.status === 'success') {
            alert(`✅ Password successfully cleared for ${sen}. Column G is now empty.`);
            if (inputEl) inputEl.value = "";
        } else {
            alert(`❌ Error: ${result.message}`);
        }
    } catch (err) { alert("❌ Network error connecting to backend."); }
};

window.applyAdminFilters = async function() {
    var tbody = document.getElementById('admin-tbody');
    if (!tbody) return;

    try {
        var res = await fetch(scriptURL + "?action=load");
        var data = await res.json();
        var students = Array.isArray(data) ? data : (data.students || []);

        tbody.innerHTML = students.map((s, i) => `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px;">${i + 1}</td>
                <td style="font-weight:bold;">${esc(s.sen)}</td>
                <td>${esc(s.name)}</td>
                <td>${s.program || 'N/A'}</td>
                <td style="font-weight:bold; color:#3b82f6;">${s.cgpa || 'N/A'}</td>
                <td>${s.totalCredits || '0'}</td>
                <td><button style="background:#0ea5e9; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;" onclick="window.openAdminStudentView('${esc(s.sen)}')">Details</button></td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Failed to load student directory.</td></tr>`;
    }
};

document.addEventListener('click', function(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.textContent.includes('Clear Password') && !btn.textContent.includes('ALL')) {
        e.preventDefault();
        window.clearStudentPassword('reset-sen-input');
    }
});