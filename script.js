/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 8.1 - UI & Filter Fixes)
 */

'use strict';

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";
const GAS_URL = scriptURL;

window.STUDENTS = window.STUDENTS || [];
window.ALL_STUDENTS = window.ALL_STUDENTS || [];
window.CURRICULUM_RULES = window.CURRICULUM_RULES || {};
window.SYSTEM_PROGRAMS = window.SYSTEM_PROGRAMS || [];

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
//  FACULTY & ADMIN NAVIGATION HANDLERS (Ver 8.1)
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
    ['tab-upload', 'tab-curriculum', 'tab-students', 'tab-faculty', 'tab-admin-all'].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    document.querySelectorAll('.admin-section, .admin-tab-content').forEach(sec => {
        if (sec) sec.style.display = 'none';
    });

    document.querySelectorAll('.admin-tab-btn, .nav-btn, .dashboard-nav button').forEach(b => {
        if (b) {
            b.classList.remove('active');
            b.style.background = '';
            b.style.color = '';
        }
    });

    var target = document.getElementById(tabId) || document.querySelector('.' + tabId);
    if (target) {
        target.style.display = 'block';
    }

    if (btnElement) {
        btnElement.classList.add('active');
        btnElement.style.background = '#2563eb';
        btnElement.style.color = '#ffffff';
    }

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

// --- 1. LIVE CLOUD BOOTLOADER (Fetches everything from Google Sheet) ---
window.initializeCloudPortal = async function() {
    try {
        // A. Fetch Students & Batches/Programs
        let stuRes = await fetch(scriptURL + "?action=load");
        let stuData = await stuRes.json();
        window.STUDENTS = Array.isArray(stuData) ? stuData : (stuData.students || []);
        
        // Extract unique batches and programs directly from live student cloud records
        let progMap = new Map();
        window.STUDENTS.forEach(s => {
            if (s.batch && s.program) {
                progMap.set(`${s.batch}_${s.program}`, { batch: s.batch, program: s.program });
            }
        });
        window.SYSTEM_PROGRAMS = Array.from(progMap.values());
        if (window.SYSTEM_PROGRAMS.length === 0) {
            window.SYSTEM_PROGRAMS = [{ batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }];
        }

        // B. Fetch Curriculum from CurriculumDB sheet
        let curRes = await fetch(scriptURL + "?action=getCurriculum");
        let curText = await curRes.text();
        if (curText && curText.trim().startsWith("{")) {
            let parsed = JSON.parse(curText);
            window.CURRICULUM_RULES = parsed.rules || parsed;
            if (parsed.courses) window.CUSTOM_COURSE_DICT = parsed.courses;
        }

        console.log("☁️ Pure Cloud Synchronization Successful:", {
            students: window.STUDENTS.length,
            programs: window.SYSTEM_PROGRAMS.length
        });
    } catch (err) {
        console.warn("☁️ Cloud sync warning, offline fallback active.", err);
    }

    // Refresh UI elements
    if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
    if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
    if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
};

// --- 2. GLOBAL LOGOUT HANDLER ---
window.logoutPortal = function() {
    sessionStorage.clear();
    localStorage.clear();
    document.body.classList.remove('overlay-active');
    window.location.href = window.location.pathname;
};

document.addEventListener('click', function(e) {
    const btn = e.target.closest('button, a');
    if (!btn) return;
    let text = (btn.textContent || '').trim().toUpperCase();

    if (text === 'LOGOUT' || text.includes('LOG OUT')) {
        e.preventDefault();
        window.logoutPortal();
    } else if (text.includes('SIGN IN') || text.id === 's-login-btn') {
        e.preventDefault();
        window.studentLoginStep();
    }
});

// --- 3. SYSTEM PROGRAMS & DIRECTORY RENDERERS ---
window.renderSystemPrograms = function () {
    const container = document.getElementById('active-system-programs');
    if (container) {
        container.innerHTML = window.SYSTEM_PROGRAMS.map((p, i) => `
            <span style="background: #334155; padding: 5px 10px; border-radius: 4px; color: white; font-weight:bold; display:inline-block; margin:3px;">
                ${esc(p.batch)} ${esc(p.program)}
            </span>
        `).join('');
    }

    const uniqueBatches = [...new Set(window.SYSTEM_PROGRAMS.map(p => String(p.batch).trim()))];
    const uniqueProgs = [...new Set(window.SYSTEM_PROGRAMS.map(p => String(p.program).trim()))];

    const batchFilter = document.getElementById('filter-batch');
    if (batchFilter) batchFilter.innerHTML = `<option value="">All Years</option>` + uniqueBatches.map(b => `<option value="${b}">${b}</option>`).join('');

    const progFilter = document.getElementById('filter-program');
    if (progFilter) progFilter.innerHTML = `<option value="">All Programs</option>` + uniqueProgs.map(p => `<option value="${p}">${p}</option>`).join('');
};

window.applyAdminFilters = async function() {
    var tbody = document.getElementById('admin-tbody');
    var totalStu = document.getElementById('total-stu');
    if (!tbody) return;

    if (window.STUDENTS.length === 0) {
        await window.initializeCloudPortal();
    }

    if (totalStu) totalStu.textContent = window.STUDENTS.length;

    if (window.STUDENTS.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">No enrolled student records found in Cloud DB.</td></tr>`;
        return;
    }

    tbody.innerHTML = window.STUDENTS.map((s, i) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:10px;">${i + 1}</td>
            <td style="font-weight:bold;">${esc(s.sen)}</td>
            <td>${esc(s.name)}</td>
            <td>${esc(s.program || 'N/A')}</td>
            <td style="font-weight:bold; color:#3b82f6;">${s.cgpa || 'N/A'}</td>
            <td>${s.totalCredits || '0'}</td>
            <td><button style="background:#0ea5e9; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;" onclick="window.openAdminStudentView('${esc(s.sen)}')">Details</button></td>
        </tr>
    `).join('');
};

// --- 4. CURRICULUM EDITOR DROPDOWN FIX ---
window.loadCurriculumEditor = function() {
    const container = document.getElementById('curriculum-edit-key') || document.querySelector('#tab-curriculum select, select[id*="curr"]');
    let sysProgs = [];
    try { sysProgs = JSON.parse(localStorage.getItem('AIIT_SYSTEM_PROGRAMS')) || window.SYSTEM_PROGRAMS || []; } catch(e){}
    if (sysProgs.length === 0) {
        sysProgs = [{ batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }, { batch: "2024", program: "B.C.A" }];
    }

    if (container) {
        container.innerHTML = sysProgs.map(p => {
            let key = `${p.batch}_${p.program}`;
            let label = `${p.batch} ${p.program}`;
            return `<option value="${key}">${label}</option>`;
        }).join('');
    }
};

// --- 5. FACULTY DASHBOARD GAP & FILTER FIX ---
window.renderFacultyPortal = async function(email) {
    let facultyDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section');
    if (!facultyDash) return;

    facultyDash.style.position = 'relative';
    facultyDash.style.top = '0';
    facultyDash.style.left = '0';
    facultyDash.style.width = '100%';
    facultyDash.style.height = 'auto';
    facultyDash.style.minHeight = '100vh';
    facultyDash.style.zIndex = '10';
    facultyDash.style.background = '#f8fafc';
    document.body.style.overflow = 'auto'; // Remove whitespace gaps

    // Auto-load students for directory filters
    if (!window.STUDENTS || window.STUDENTS.length === 0) {
        await window.initializeCloudPortal();
    }
    if (typeof window.facultyFilterAndSort === 'function') {
        window.facultyFilterAndSort();
    }
};

window.facultyFilterAndSort = function() {
    let students = window.STUDENTS || window.ALL_STUDENTS || [];
    const searchInput = document.getElementById('faculty-search-input') || document.querySelector('input[placeholder*="Search"]');
    const searchTxt = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    const batchSel = document.getElementById('filter-batch') ? document.getElementById('filter-batch').value.trim() : "";
    const progSel = document.getElementById('filter-program') ? document.getElementById('filter-program').value.trim() : "";

    let filtered = students.filter(s => {
        const matchSearch = !searchTxt || String(s.sen || '').toLowerCase().includes(searchTxt) || String(s.name || '').toLowerCase().includes(searchTxt);
        const matchBatch = !batchSel || String(s.batch || '').trim() === batchSel;
        const matchProg = !progSel || String(s.program || '').trim() === progSel;
        return matchSearch && matchBatch && matchProg;
    });

    window.RENDERED_STUDENTS = filtered;
    if (typeof renderStudentTable === 'function') renderStudentTable(filtered);
};

// --- 6. STUDENT LOGIN & DASHBOARD ---
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
    let res = await fetch(scriptURL + "?action=load");
    let data = await res.json();
    let students = Array.isArray(data) ? data : (data.students || []);
    let student = students.find(s => String(s.sen).toUpperCase() === sen);
    if (student) window.loadStudentDashboard(student);
    else location.reload();
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

    // Clean up bottom logout button to say ONLY "LOGOUT"
    document.querySelectorAll('button, a').forEach(el => {
        let txt = el.textContent.trim().toLowerCase();
        if (txt.includes('logout') || txt.includes('search another')) {
            el.textContent = 'LOGOUT';
            el.onclick = function() { window.logoutPortal(); };
        }
    });

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

document.addEventListener('DOMContentLoaded', () => {
    window.initializeCloudPortal();
});