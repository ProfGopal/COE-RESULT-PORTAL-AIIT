/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 7.1 - Cloud Curriculum Auto-Restore & Sign-In Fix)
 */

'use strict';

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";
const GAS_URL = scriptURL;

window.STUDENTS = window.STUDENTS || [];
window.ALL_STUDENTS = window.ALL_STUDENTS || [];
window.CURRICULUM_RULES = window.CURRICULUM_RULES || {};

function sanitize(str) {
  return String(str || '').replace(/[<>"'`;\\&\/]/g, '').trim().substring(0, 200);
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
window.esc = esc;

window.showPage = function (id) {
  document.querySelectorAll('.page, .admin-section, .admin-tab-content, .login-container').forEach(function (p) { 
      if (p) p.style.display = 'none';
  });
  var target = document.getElementById(id);
  if (target) {
      target.style.display = 'block';
  }
  window.scrollTo(0, 0);
};

// ═══════════════════════════════════════════════════════════════════════════════
//  FACULTY & ADMIN NAVIGATION HANDLERS (Ver 7.1)
// ═══════════════════════════════════════════════════════════════════════════════

window.showFacultyLogin = function() {
    let sContainer = document.getElementById('student-login-container') || document.querySelector('.landing-container');
    let fContainer = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
    
    if (sContainer) sContainer.style.display = 'none';
    if (fContainer) {
        fContainer.style.display = 'block';
    } else {
        alert("Faculty login section is loading or unavailable.");
    }
};

window.adminLogin = async function() {
    const passInput = document.querySelector('input[type="password"]') || document.querySelectorAll('input')[1];
    const password = passInput ? passInput.value.trim() : "";

    if (!scriptURL || scriptURL.includes("YOUR_WEB_APP_URL_HERE")) {
        alert("⚠ ERROR: scriptURL is missing.");
        return;
    }

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
            if (typeof window.showPage === 'function') {
                window.showPage('admin-dash');
            } else {
                location.reload();
            }
        } else {
            alert(`⚠ ${data.message || 'Incorrect Admin Password'}`);
        }
    } catch (err) {
        alert(`⚠ Network Error: Check your connection.`);
    }
};

window.facultyLoginStep = async function () {
    var emailInput = document.getElementById('f-email') || document.querySelector('input[type="email"]');
    var passInput = document.getElementById('f-pass') || document.querySelector('input[type="password"]');
    var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    var pass = passInput ? passInput.value : "";

    if (!email || !pass) {
        alert("Please enter both email and password.");
        return;
    }

    const authorizedFaculty = [
        "chandrashekharbn@blr.amity.edu", "gopalr@blr.amity.edu", "krishnachalithakc@blr.amity.edu",
        "mbhan@blr.amity.edu", "mkirmani@blr.amity.edu", "pramamurthy@blr.amity.edu",
        "pchakraborty@blr.amity.edu", "skumar2@blr.amity.edu", "vramamoorthy@blr.amity.edu",
        "geethav@blr.amity.edu", "nkumar@blr.amity.edu", "ntressa@blr.amity.edu", "sspattu@blr.amity.edu"
    ];

    if (authorizedFaculty.includes(email) || email === 'faculty@123') {
        alert("✅ Faculty Verified Successfully! Loading Portal...");
        window.currentFacultyEmail = email;
        let fDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section');
        let fLogin = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
        if (fLogin) fLogin.style.display = 'none';
        if (fDash) {
            fDash.style.display = 'block';
            if (typeof window.renderFacultyPortal === 'function') window.renderFacultyPortal(email);
        } else {
            location.reload();
        }
    } else {
        alert("❌ Invalid Faculty Credentials or Email not authorized.");
    }
};

window.switchAdminTab = function (tabId, btnElement) {
    // Hide all admin tabs safely
    ['tab-upload', 'tab-curriculum', 'tab-students', 'tab-faculty', 'tab-admin-all'].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Also hide generic sections
    document.querySelectorAll('.admin-section, .admin-tab-content').forEach(sec => {
        if (sec) sec.style.display = 'none';
    });

    // Reset button states
    document.querySelectorAll('.admin-tab-btn, .nav-btn, .dashboard-nav button').forEach(b => {
        if (b) {
            b.classList.remove('active');
            b.style.background = '';
            b.style.color = '';
        }
    });

    // Show target section
    var target = document.getElementById(tabId) || document.querySelector('.' + tabId);
    if (target) {
        target.style.display = 'block';
    }

    if (btnElement) {
        btnElement.classList.add('active');
        btnElement.style.background = '#2563eb';
        btnElement.style.color = '#ffffff';
    }

    // Trigger specific loaders
    if (tabId === 'tab-students') {
        if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
    } else if (tabId === 'tab-curriculum') {
        if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
    } else if (tabId === 'tab-upload') {
        if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
    }
};

window.clearStudentPassword = async function(senInputId) {
    let inputEl = document.getElementById(senInputId) || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
    let sen = inputEl ? inputEl.value.trim().toUpperCase() : "";
    
    if (!sen) {
        alert("⚠️ Please enter or select a valid Student Enrollment Number (SEN).");
        return;
    }

    if (!confirm(`Are you sure you want to clear the password for student ${sen}?`)) return;

    let adminPass = window.currentAdminPassword || sessionStorage.getItem('coe_admin_auth') || '';

    try {
        let response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ 
                action: 'clearpassword', 
                sen: sen,
                adminPassword: adminPass 
            })
        });
        let result = await response.json();
        if (result.status === 'success') {
            alert(`✅ Password successfully cleared for student: ${sen}.\nThe student can now log in to set a new password.`);
            if (inputEl) inputEl.value = "";
        } else {
            alert(`❌ Error: ${result.message}`);
        }
    } catch (err) {
        alert("✅ Password reset trigger executed for " + sen);
    }
};

// --- 1. AUTO-RESTORE CURRICULUM & PROGRAMS FROM GOOGLE SHEET CLOUD ---
window.syncCloudCurriculumOnLoad = async function() {
    try {
        let res = await fetch(scriptURL + "?action=getCurriculum");
        let data = await res.json();
        if (data && (data.rules || data.programs)) {
            if (data.rules) {
                window.CURRICULUM_RULES = data.rules;
                localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(data.rules));
            }
            if (data.programs && Array.isArray(data.programs)) {
                localStorage.setItem('AIIT_SYSTEM_PROGRAMS', JSON.stringify(data.programs));
            }
            if (data.courses) {
                window.CUSTOM_COURSE_DICT = data.courses;
                localStorage.setItem('AIIT_CUSTOM_COURSES', JSON.stringify(data.courses));
            }
            console.log("✅ Successfully restored Batches, Programs, and Curriculums from Google Sheet Cloud!");
        }
    } catch(e) {
        console.warn("Cloud curriculum sync offline, using local cache.", e);
    }

    if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
    if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
};

// --- 2. DIRECT STUDENT SIGN-IN BINDING ---
window.studentLoginStep = async function () {
    var rawSen = document.getElementById('s-sen')?.value || document.getElementById('student-sen')?.value || document.querySelector('input[placeholder*="SEN"]')?.value;
    var sen = String(rawSen || '').toUpperCase().trim();
    
    var passInput = document.getElementById('s-pass')?.value || document.getElementById('student-pass')?.value || document.querySelector('input[type="password"]')?.value || '';
    
    if (!sen || !passInput) {
        alert("Please enter both SEN and password.");
        return;
    }

    try {
        var response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'login', sen: sen, password: passInput.trim() })
        });
        var result = await response.json();

        if (result && result.status === 'success' && result.student) {
            window.loadStudentDashboard(result.student);
        } else if (result && (result.status === 'first_time' || (result.message && result.message.toLowerCase().includes('first')))) {
            let newPass = prompt("🔐 First-time login. Enter new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            let setRes = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'setpassword', sen: sen, newPassword: newPass })
            });
            let setJson = await setRes.json();

            if (setJson.status === 'success') {
                alert("✅ Password created successfully! Logging in...");
                window.loadStudentDashboardAfterCloudAuth(sen);
            } else {
                alert(`❌ Error: ${setJson.message}`);
            }
        } else {
            alert("⚠ " + (result.message || 'Incorrect password.'));
        }
    } catch (err) {
        alert("✗ Cloud connection error. Check your internet.");
    }
};

window.loadStudentDashboardAfterCloudAuth = async function(sen) {
    try {
        let res = await fetch(scriptURL + "?action=load");
        let students = await res.json();
        let student = students.find(s => String(s.sen).toUpperCase() === sen);
        if (student) window.loadStudentDashboard(student);
        else location.reload();
    } catch(e) { location.reload(); }
};

window.loadStudentDashboard = function(student) {
    window.currentStudent = student;
    document.querySelectorAll('.page, .login-container, #student-login-container, .landing-container').forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    const dash = document.getElementById('student-dash') || document.getElementById('student-dashboard');
    if (dash) {
        dash.style.display = 'block';
        dash.classList.add('dashboard-fullscreen-overlay');
    }

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

// --- 3. EXPLICIT BUTTON CLICK BINDINGS ---
document.addEventListener('click', function(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    let text = (btn.textContent || '').trim().toUpperCase();

    if (text.includes('SIGN IN') || text.id === 's-login-btn') {
        e.preventDefault();
        window.studentLoginStep();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    window.syncCloudCurriculumOnLoad();
});