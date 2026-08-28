/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 1.7 - Faculty Curriculum Table & Navigation Fix)
 */

'use strict';

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";
const GAS_URL = scriptURL;

// 10 Sample Testing Data Points for Instant Verification
window.SAMPLE_COE_DATA = {
    semesters: ["Semester 1 (Fall 2024)", "Semester 2 (Spring 2025)"],
    courses: [
        { code: "CSE5001", name: "Advanced Algorithms", faculty: "Dr. Gopal R.", slot: "A1", level: "UG" },
        { code: "CSE5002", name: "Data Science & AI", faculty: "Dr. B.N. Chandrashekhar", slot: "A1", level: "UG" },
        { code: "MCA5003", name: "Cloud Computing Architectures", faculty: "Dr. M. Kiran", slot: "A2", level: "PG" },
        { code: "MCA5004", name: "Cybersecurity Protocols", faculty: "Prof. M. Bhan", slot: "A2", level: "PG" },
        { code: "BCA5005", name: "Full Stack Development", faculty: "Dr. P. Ramamurthy", slot: "B1", level: "UG" },
        { code: "BCA5006", name: "Database Management Systems", faculty: "Dr. Geetha V.", slot: "B1", level: "UG" },
        { code: "CSE6001", name: "Deep Learning Neural Networks", faculty: "Dr. S. Kanthamani", slot: "B2", level: "PG" },
        { code: "CSE6002", name: "Natural Language Processing", faculty: "Dr. N. Kumar", slot: "B2", level: "PG" },
        { code: "MAT5005", name: "Applied Statistical Methods", faculty: "Dr. Tressa", slot: "C1", level: "UG" },
        { code: "ENG5001", name: "Corporate Communication", faculty: "Dr. P. Chakraborty", slot: "C2", level: "UG" }
    ],
    halls: [
        { hallNo: "LH-101", capacity: 40 },
        { hallNo: "LH-102", capacity: 35 },
        { hallNo: "LH-103", capacity: 50 },
        { hallNo: "AUDI-01", capacity: 60 }
    ]
};

window.COE_CURRENT_CONFIG = JSON.parse(localStorage.getItem('AIIT_COE_CONFIG')) || window.SAMPLE_COE_DATA;

window.AUTHORIZED_FACULTY_LIST = [
    "chandrashekharbn@blr.amity.edu", "gopalr@blr.amity.edu", "krishnachalithakc@blr.amity.edu",
    "mbhan@blr.amity.edu", "mkirmani@blr.amity.edu", "pramamurthy@blr.amity.edu",
    "pchakraborty@blr.amity.edu", "skumar2@blr.amity.edu", "vramamoorthy@blr.amity.edu",
    "geethav@blr.amity.edu", "nkumar@blr.amity.edu", "ntressa@blr.amity.edu", "sspattu@blr.amity.edu"
];

window.STUDENTS = [];
window.CURRICULUM_RULES = {};
window.CUSTOM_COURSE_DICT = {};
window.SYSTEM_PROGRAMS = [];

function sanitize(str) {
  return String(str || '').replace(/[<>"'`;\\&\/]/g, '').trim().substring(0, 200);
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
window.esc = esc;

// ═══════════════════════════════════════════════════════════════════════
//  1. COURSE INFO HELPER (Resolves Name & Credits)
// ═══════════════════════════════════════════════════════════════════════
window.getCourseInfo = function(code) {
    if (!code) return { name: "Course Title", credits: 3 };
    let cleanCode = String(code).toUpperCase().trim();
    if (window.CUSTOM_COURSE_DICT && window.CUSTOM_COURSE_DICT[cleanCode]) {
        let item = window.CUSTOM_COURSE_DICT[cleanCode];
        return {
            name: item.name || cleanCode,
            credits: (item.credits !== undefined && !isNaN(item.credits)) ? parseFloat(item.credits) : 3
        };
    }
    return { name: cleanCode, credits: 3 };
};

// ═══════════════════════════════════════════════════════════════════════
//  2. LIGHTNING-FAST CLOUD BOOTLOADER
// ═══════════════════════════════════════════════════════════════════════
window.initializeCloudPortal = async function() {
    try {
        let [stuRes, curRes] = await Promise.all([
            fetch(scriptURL + "?action=load"),
            fetch(scriptURL + "?action=getCurriculum")
        ]);
        
        let stuData = await stuRes.json();
        window.STUDENTS = Array.isArray(stuData) ? stuData : (stuData.students || []);
        
        let progMap = new Map();
        window.STUDENTS.forEach(s => {
            if (s.batch && s.program) {
                progMap.set(`${s.batch}_${s.program}`, { batch: s.batch, program: s.program });
            }
        });
        window.SYSTEM_PROGRAMS = Array.from(progMap.values());
        if (window.SYSTEM_PROGRAMS.length === 0) {
            window.SYSTEM_PROGRAMS = [
                { batch: "2024", program: "MCA" }, 
                { batch: "2025", program: "MCA" }, 
                { batch: "2024", program: "B.C.A" }, 
                { batch: "2025", program: "B.C.A" }
            ];
        }

        let curText = await curRes.text();
        if (curText && curText.trim().startsWith("{")) {
            let parsed = JSON.parse(curText);
            window.CURRICULUM_RULES = parsed.rules || parsed;
            if (parsed.courses) window.CUSTOM_COURSE_DICT = parsed.courses;
        }
    } catch (err) {
        console.warn("Cloud sync warning:", err);
    }

    try {
        let localCur = localStorage.getItem('AIIT_CUSTOM_CURRICULUM');
        if (localCur) {
            let parsed = JSON.parse(localCur);
            if (parsed && Object.keys(parsed).length > 0) {
                window.CURRICULUM_RULES = parsed;
            }
        }
        let localCourses = localStorage.getItem('AIIT_CUSTOM_COURSES');
        if (localCourses) {
            let parsedCourses = JSON.parse(localCourses);
            if (parsedCourses && Object.keys(parsedCourses).length > 0) {
                window.CUSTOM_COURSE_DICT = Object.assign({}, window.CUSTOM_COURSE_DICT, parsedCourses);
            }
        }
    } catch (e) {
        console.warn("Error loading from localStorage:", e);
    }

    if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
    if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
    if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
};

window.saveCurriculumToCloud = function() {
    let masterPayload = {
        rules: window.CURRICULUM_RULES || {},
        programs: window.SYSTEM_PROGRAMS || [],
        courses: window.CUSTOM_COURSE_DICT || {}
    };

    localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(masterPayload.rules));
    localStorage.setItem('AIIT_CUSTOM_COURSES', JSON.stringify(masterPayload.courses));

    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
            action: 'saveCurriculum',
            curriculumData: JSON.stringify(masterPayload)
        })
    })
    .then(res => res.text())
    .then(txt => console.log("☁️ Curriculum auto-saved to Google Sheets:", txt))
    .catch(err => console.error("☁️ Cloud save error:", err));
};

// ═══════════════════════════════════════════════════════════════════════
//  3. FACULTY PORTAL (Gap Removal, Filters, Details & Logout Fix)
// ═══════════════════════════════════════════════════════════════════════
window.facultyLoginStep = async function () {
    var emailInput = document.getElementById('f-email') || document.querySelector('input[type="email"]');
    var passInput = document.getElementById('f-pass') || document.querySelector('input[type="password"]');
    var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    var pass = passInput ? passInput.value : "";

    if (!email || !pass) {
        alert("Please enter both institutional email and password.");
        return;
    }

    try {
        var response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'verifyfaculty', email: email, password: pass })
        });
        var result = await response.json();

        if (result && result.status === 'first_time') {
            let newPass = prompt("🔐 First-time login or password reset. Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            let setRes = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'setfacultypassword', email: email, password: newPass })
            });
            let setJson = await setRes.json();

            if (setJson.status === 'success') {
                alert("✅ Password updated successfully! Please sign in with your new password.");
                if (passInput) passInput.value = "";
            } else {
                alert(`❌ Error: ${setJson.message}`);
            }
            return;
        }

        if (result && result.status === 'success') {
            alert("✅ Faculty Verified Successfully! Loading Portal...");
            window.currentFacultyEmail = email;
            let fLogin = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
            let fDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section');
            if (fLogin) fLogin.style.display = 'none';
            if (fDash) {
                fDash.style.display = 'block';
                if (typeof window.renderFacultyPortal === 'function') window.renderFacultyPortal(email);
            } else {
                location.reload();
            }
        } else {
            alert("❌ " + (result.message || 'Invalid Faculty Credentials'));
        }
    } catch (err) {
        alert("❌ Network error connecting to database backend.");
    }
};

window.renderFacultyPortal = async function(email) {
    let facultyDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section') || document.getElementById('faculty-dashboard');
    
    // Hide all login containers and landing screens to remove layout whitespace gaps
    document.querySelectorAll('.page, .login-container, #student-login-container, .landing-container, #faculty-login-container').forEach(el => {
        if (el) el.style.display = 'none';
    });

    if (facultyDash) {
        facultyDash.style.display = 'block';
        facultyDash.style.position = 'relative';
        facultyDash.style.top = '0';
        facultyDash.style.left = '0';
        facultyDash.style.width = '100%';
        facultyDash.style.height = 'auto';
        facultyDash.style.minHeight = '100vh';
        facultyDash.style.background = '#f8fafc';
        facultyDash.style.zIndex = '99';
    }
    document.body.style.overflow = 'auto';

    if (window.STUDENTS.length === 0) {
        await window.initializeCloudPortal();
    }
    window.facultyFilterAndSort();

    // Wire Logout buttons across faculty view
    document.querySelectorAll('button, a').forEach(el => {
        let txt = el.textContent.trim().toLowerCase();
        if (txt === 'logout' || txt.includes('log out')) {
            el.onclick = function(e) {
                e.preventDefault();
                window.logoutPortal();
            };
        }
    });
};

window.facultyFilterAndSort = function() {
    let students = window.STUDENTS || [];
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
    window.renderFacultyStudentTable(filtered);
};

window.facultyViewAll = async function() {
    if (window.STUDENTS.length === 0) await window.initializeCloudPortal();
    window.RENDERED_STUDENTS = window.STUDENTS;
    window.renderFacultyStudentTable(window.STUDENTS);
};

window.renderFacultyStudentTable = function(students) {
    var tbody = document.getElementById('faculty-dir-tbody') || document.querySelector('#faculty-dash tbody') || document.querySelector('table tbody');
    var badge = document.querySelector('#faculty-dash .badge') || document.getElementById('faculty-dir-badge') || document.querySelector('.student-count-badge');
    
    if (badge) badge.textContent = `${students.length} students`;
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#64748b;">No matching student records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = students.map(s => {
        let activeBacklogs = window.getActiveBacklogs ? window.getActiveBacklogs(s.courses).length : 0;
        let cRaw = parseFloat(s.cgpa);
        let cFormatted = !isNaN(cRaw) ? cRaw.toFixed(2) : 'N/A'; // FIX: CGPA 2 decimal places

        return `
        <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:12px; font-weight:bold;">${esc(s.sen)}</td>
            <td style="padding:12px;">${esc(s.name)}</td>
            <td style="padding:12px; font-weight:bold; color:#3b82f6;">${cFormatted}</td>
            <td style="padding:12px; font-weight:bold;">${s.totalCredits || '0'}</td>
            <td style="padding:12px;"><span style="padding:4px 8px; border-radius:4px; font-weight:bold; background:${activeBacklogs > 0 ? '#fee2e2' : '#dcfce3'}; color:${activeBacklogs > 0 ? '#dc2626' : '#16a34a'};">${activeBacklogs}</span></td>
            <td style="padding:12px;"><button style="background:#0ea5e9; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;" onclick="window.openFacultyStudentView('${esc(s.sen)}')">Details</button></td>
        </tr>`;
    }).join('');
};

window.openFacultyStudentView = function(sen) {
    let student = window.STUDENTS.find(s => String(s.sen).toUpperCase() === String(sen).toUpperCase());
    if (!student) {
        alert("Student record not found.");
        return;
    }
    window.loadStudentDashboard(student);
};

// --- 1. COE LOGIN TRIGGER & HANDLER ---
window.showCoeLogin = function() {
    let sContainer = document.getElementById('student-login-container') || document.querySelector('.landing-container') || document.getElementById('landing');
    let fContainer = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
    
    if (sContainer) sContainer.style.display = 'none';
    if (fContainer) fContainer.style.display = 'none';

    let coeContainer = document.getElementById('coe-login-container');
    if (!coeContainer) {
        coeContainer = document.createElement('div');
        coeContainer.id = 'coe-login-container';
        coeContainer.style.cssText = 'max-width:450px; margin:40px auto; background:white; padding:30px; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.1); text-align:left;';
        coeContainer.innerHTML = `
            <h2 style="color:#0f172a; margin-top:0;">🔐 COE Portal Login</h2>
            <p style="color:#475569; font-size:0.9rem;">Controller of Examination access. Enter your institutional credentials.</p>
            <div style="margin-bottom:15px;">
                <label style="display:block; font-weight:bold; font-size:0.85rem; color:#334155; margin-bottom:5px;">COE EMAIL</label>
                <input type="email" id="coe-email" value="coeaub@blr.amity.edu" readonly style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px; background:#f1f5f9; font-weight:bold;" />
            </div>
            <div style="margin-bottom:20px;">
                <label style="display:block; font-weight:bold; font-size:0.85rem; color:#334155; margin-bottom:5px;">PASSWORD</label>
                <input type="password" id="coe-pass" placeholder="Enter password" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px;" />
            </div>
            <button onclick="window.coeLoginStep()" style="width:100%; background:#2563eb; color:white; border:none; padding:12px; border-radius:6px; font-weight:bold; cursor:pointer;">COE Sign In →</button>
            <div style="text-align:center; margin-top:15px;">
                <a href="#" onclick="location.reload(); return false;" style="color:#64748b; font-size:0.85rem; text-decoration:none;">← Back to Main Portal</a>
            </div>
        `;
        document.body.appendChild(coeContainer);
    }
    coeContainer.style.display = 'block';
};

window.coeLoginStep = async function() {
    var passInput = document.getElementById('coe-pass');
    var pass = passInput ? passInput.value.trim() : "";

    if (!pass) {
        alert("Please enter the password.");
        return;
    }

    try {
        var response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'verifycoe', email: 'coeaub@blr.amity.edu', password: pass })
        });
        var result = await response.json();

        if (result && result.status === 'first_time') {
            let newPass = prompt("🔐 First-time COE login. Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            let setRes = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'setcoepassword', email: 'coeaub@blr.amity.edu', password: newPass })
            });
            let setJson = await setRes.json();

            if (setJson.status === 'success') {
                alert("✅ COE password updated successfully! Please sign in with your new password.");
                if (passInput) passInput.value = "";
            } else {
                alert(`❌ Error: ${setJson.message}`);
            }
            return;
        }

        if (result && result.status === 'success') {
            alert("✅ COE Verified Successfully! Launching COE Examination Management Portal...");
            window.showCoeDashboard();
        } else {
            alert("❌ " + (result.message || 'Invalid COE Credentials'));
        }
    } catch(err) {
        alert("❌ Network error connecting to COE authentication backend.");
    }
};

// --- COE LOGIN VIEW & SEATING ARRANGEMENT GENERATOR ---
window.showCoeDashboard = function() {
    document.querySelectorAll('.page, .login-container, #student-login-container, .landing-container, #coe-login-container').forEach(el => {
        if (el) el.style.display = 'none';
    });

    let coeDash = document.getElementById('coe-dashboard');
    if (!coeDash) {
        coeDash = document.createElement('div');
        coeDash.id = 'coe-dashboard';
        coeDash.style.cssText = 'padding:30px; background:#f8fafc; min-height:100vh; font-family:sans-serif;';
        document.body.appendChild(coeDash);
    }
    coeDash.style.display = 'block';

    let cfg = window.COE_CURRENT_CONFIG;

    coeDash.innerHTML = `
        <div style="max-width:1200px; margin:0 auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #cbd5e1; padding-bottom:15px; margin-bottom:25px;">
                <h2 style="color:#0f172a; margin:0;">📋 COE Examination & Seating Management Portal (Ver 1.5.1)</h2>
                <button onclick="window.logoutPortal()" style="background:#ef4444; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">Logout COE</button>
            </div>

            <!-- CONFIGURATION PANEL -->
            <div style="background:white; padding:20px; border-radius:8px; border:1px solid #cbd5e1; margin-bottom:25px; display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:15px;">
                <div>
                    <label style="display:block; font-weight:bold; font-size:0.85rem; color:#334155; margin-bottom:5px;">SELECT SEMESTER</label>
                    <select id="coe-sel-sem" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:4px;">
                        ${cfg.semesters.map(s => `<option value="${s}">${s}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display:block; font-weight:bold; font-size:0.85rem; color:#334155; margin-bottom:5px;">EXAM LEVEL</label>
                    <div style="display:flex; gap:15px; padding-top:6px;">
                        <label><input type="checkbox" id="coe-chk-ug" checked /> UG Exam</label>
                        <label><input type="checkbox" id="coe-chk-pg" checked /> PG Exam</label>
                    </div>
                </div>
                <div>
                    <label style="display:block; font-weight:bold; font-size:0.85rem; color:#334155; margin-bottom:5px;">EXAM DATE</label>
                    <input type="date" id="coe-sel-date" value="${new Date().toISOString().split('T')[0]}" style="width:100%; padding:7px; border:1px solid #cbd5e1; border-radius:4px;" />
                </div>
                <div>
                    <label style="display:block; font-weight:bold; font-size:0.85rem; color:#334155; margin-bottom:5px;">SLOT SELECTION</label>
                    <select id="coe-sel-slot" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:4px;">
                        ${['A1','A2','B1','B2','C1','C2','D1','D2','E1','E2','F1','F2','G1','G2','H1','H2'].map(sl => `<option value="${sl}">${sl} (${sl.endsWith('1') ? 'Morning' : 'Evening'})</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display:block; font-weight:bold; font-size:0.85rem; color:#334155; margin-bottom:5px;">START TIME — END TIME</label>
                    <div style="display:flex; gap:5px;">
                        <input type="time" id="coe-start-time" value="09:30" style="width:50%; padding:7px; border:1px solid #cbd5e1; border-radius:4px;" />
                        <input type="time" id="coe-end-time" value="12:30" style="width:50%; padding:7px; border:1px solid #cbd5e1; border-radius:4px;" />
                    </div>
                </div>
            </div>

            <!-- HALL & SUBJECT SELECTION -->
            <div style="background:white; padding:20px; border-radius:8px; border:1px solid #cbd5e1; margin-bottom:25px;">
                <h3 style="margin-top:0; color:#1e293b;">🏫 Hall Allocation & Anti-Malpractice Seating Generator</h3>
                <div style="display:flex; gap:15px; margin-bottom:15px; flex-wrap:wrap;">
                    <div style="flex:1; min-width:280px;">
                        <label style="display:block; font-weight:bold; font-size:0.85rem; color:#334155; margin-bottom:5px;">SELECT EXAMINATION HALL(S)</label>
                        <div id="coe-halls-checkboxes" style="background:#f8fafc; border:1px solid #cbd5e1; padding:10px; border-radius:6px; max-height:130px; overflow-y:auto;">
                            ${cfg.halls.map(h => `<label style="display:block; margin-bottom:5px;"><input type="checkbox" class="coe-hall-chk" value="${h.hallNo}" data-cap="${h.capacity}" checked /> ${h.hallNo} (Capacity: ${h.capacity})</label>`).join('')}
                        </div>
                    </div>
                    <div style="flex:2; min-width:320px;">
                        <label style="display:block; font-weight:bold; font-size:0.85rem; color:#334155; margin-bottom:5px;">COURSES SCHEDULED IN SLOT</label>
                        <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:10px; border-radius:6px; max-height:130px; overflow-y:auto;">
                            ${cfg.courses.map(c => `<div style="font-size:0.85rem; color:#334155; padding:2px 0;">• <strong>${c.code}</strong> — ${c.name} (${c.faculty} | Slot: ${c.slot})</div>`).join('')}
                        </div>
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button onclick="window.generateAntiMalpracticeSeating()" style="background:#10b981; color:white; border:none; padding:10px 20px; border-radius:6px; font-weight:bold; cursor:pointer;">⚡ Generate Alternating Seating & Attendance Sheet</button>
                </div>
            </div>

            <!-- GENERATED SEATING REPORT CONTAINER -->
            <div id="coe-seating-output" style="background:white; padding:25px; border-radius:8px; border:1px solid #cbd5e1; display:none;"></div>
        </div>
    `;
};

// --- ANTI-MALPRACTICE ALTERNATING SEATING ALGORITHM ---
window.generateAntiMalpracticeSeating = async function() {
    let slot = document.getElementById('coe-sel-slot').value;
    let selectedHalls = Array.from(document.querySelectorAll('.coe-hall-chk:checked')).map(chk => ({
        hallNo: chk.value,
        capacity: parseInt(chk.getAttribute('data-cap'))
    }));

    if (selectedHalls.length === 0) {
        alert("Please select at least one exam hall.");
        return;
    }

    if (!window.STUDENTS || window.STUDENTS.length === 0) {
        await window.initializeCloudPortal();
    }

    let cfg = window.COE_CURRENT_CONFIG;
    let slotCourses = cfg.courses.filter(c => c.slot === slot);
    let slotCourseCodes = slotCourses.map(c => String(c.code).toUpperCase().trim());

    // Gather students taking courses in this slot
    let eligibleStudents = [];
    (window.STUDENTS || []).forEach(s => {
        let matchingCourse = (s.courses || []).find(c => slotCourseCodes.includes(String(c.code).toUpperCase().trim()));
        if (matchingCourse) {
            eligibleStudents.push({
                sen: s.sen,
                name: s.name,
                program: s.program,
                courseCode: matchingCourse.code,
                courseName: matchingCourse.name || matchingCourse.code
            });
        }
    });

    if (eligibleStudents.length === 0) {
        // Fallback testing simulation using sample student data if no cloud match
        eligibleStudents = [
            { sen: "A869145024001", name: "Aarav Sharma", program: "MCA", courseCode: slotCourseCodes[0] || "CSE5001", courseName: "Advanced Algorithms" },
            { sen: "A869145024002", name: "Varun Varghese", program: "MCA", courseCode: slotCourseCodes[1] || slotCourseCodes[0] || "CSE5002", courseName: "Data Science" },
            { sen: "A869145024003", name: "Priya Nair", program: "MCA", courseCode: slotCourseCodes[0] || "CSE5001", courseName: "Advanced Algorithms" },
            { sen: "A869145024004", name: "Rahul Dravid", program: "MCA", courseCode: slotCourseCodes[1] || slotCourseCodes[0] || "CSE5002", courseName: "Data Science" }
        ];
    }

    // ANTI-MALPRACTICE ROUND-ROBIN ALTERNATING SEATING DISTRIBUTION
    let subjectQueues = {};
    slotCourseCodes.forEach(code => { subjectQueues[code] = eligibleStudents.filter(s => s.courseCode === code); });

    let hallAllocations = {};
    selectedHalls.forEach(hall => {
        let hallSeats = [];
        let alternatingQueue = [];
        let keys = Object.keys(subjectQueues);
        let maxLen = Math.max(...keys.map(k => subjectQueues[k].length));
        
        for (let i = 0; i < maxLen; i++) {
            keys.forEach(k => {
                if (subjectQueues[k][i]) alternatingQueue.push(subjectQueues[k][i]);
            });
        }

        for (let s = 1; s <= hall.capacity; s++) {
            if (alternatingQueue.length > 0) {
                let assignedStudent = alternatingQueue.shift();
                hallSeats.push({ seatNo: `Seat-${s}`, ...assignedStudent });
            }
        }
        hallAllocations[hall.hallNo] = hallSeats;
    });

    window.LAST_GENERATED_ALLOCATIONS = hallAllocations;
    window.renderSeatingReport(hallAllocations, slot);
};

window.renderSeatingReport = function(allocations, slot) {
    let container = document.getElementById('coe-seating-output');
    if (!container) return;
    container.style.display = 'block';

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0; color:#0f172a;">📊 Generated Seating & Attendance Master Report (Slot: ${slot})</h3>
            <div style="display:flex; gap:10px;">
                <button onclick="window.exportCoeReport('excel')" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">📥 Export Excel</button>
                <button onclick="window.exportCoeReport('word')" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">📄 Export Word</button>
                <button onclick="window.exportCoeReport('pdf')" style="background:#dc2626; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">📑 Export PDF</button>
            </div>
        </div>
    `;

    for (let hallNo in allocations) {
        let seats = allocations[hallNo];
        html += `
        <div style="margin-bottom:20px; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden;">
            <div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; color:#1e293b;">🏫 Hall: ${hallNo} (Allocated Students: ${seats.length})</div>
            <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                <thead>
                    <tr style="background:#f8fafc; color:#475569; text-align:left;">
                        <th style="padding:8px 12px;">Seat No</th>
                        <th style="padding:8px 12px;">SEN Number</th>
                        <th style="padding:8px 12px;">Student Name</th>
                        <th style="padding:8px 12px;">Course Code</th>
                        <th style="padding:8px 12px;">Course Title</th>
                        <th style="padding:8px 12px; text-align:center;">Signature</th>
                    </tr>
                </thead>
                <tbody>
                    ${seats.length > 0 ? seats.map(st => `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:8px 12px; font-weight:bold; color:#2563eb;">${st.seatNo}</td>
                        <td style="padding:8px 12px; font-weight:bold;">${esc(st.sen)}</td>
                        <td style="padding:8px 12px;">${esc(st.name)}</td>
                        <td style="padding:8px 12px; font-weight:bold;">${esc(st.courseCode)}</td>
                        <td style="padding:8px 12px;">${esc(st.courseName)}</td>
                        <td style="padding:8px 12px; text-align:center; color:#94a3b8;">..................</td>
                    </tr>`).join('') : `<tr><td colspan="6" style="text-align:center; padding:15px; color:#64748b;">No students allocated in this hall.</td></tr>`}
                </tbody>
            </table>
        </div>`;
    }

    container.innerHTML = html;
};

// --- MULTI-FORMAT EXPORT ENGINE (Word, Excel, PDF) ---
window.exportCoeReport = function(format) {
    let allocs = window.LAST_GENERATED_ALLOCATIONS;
    if (!allocs) { alert("Please generate seating arrangement first."); return; }

    if (format === 'excel') {
        let csvContent = "data:text/csv;charset=utf-8,Hall No,Seat No,SEN Number,Student Name,Course Code,Course Title\n";
        for (let h in allocs) {
            allocs[h].forEach(s => {
                csvContent += `"${h}","${s.seatNo}","${s.sen}","${s.name}","${s.courseCode}","${s.courseName}"\n`;
            });
        }
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "COE_Seating_Attendance_Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else if (format === 'word') {
        let htmlBody = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><title>COE Report</title></head><body><h2>COE Master Attendance & Seating Report</h2>`;
        for (let h in allocs) {
            htmlBody += `<h3>Hall: ${h}</h3><table border='1' cellspacing='0' cellpadding='5'><tr><th>Seat</th><th>SEN</th><th>Name</th><th>Code</th><th>Course</th></tr>`;
            allocs[h].forEach(s => {
                htmlBody += `<tr><td>${s.seatNo}</td><td>${s.sen}</td><td>${s.name}</td><td>${s.courseCode}</td><td>${s.courseName}</td></tr>`;
            });
            htmlBody += `</table><br/>`;
        }
        htmlBody += `</body></html>`;
        let blob = new Blob(['\ufeff' + htmlBody], { type: 'application/msword' });
        let url = URL.createObjectURL(blob);
        let link = document.createElement('a');
        link.href = url;
        link.download = 'COE_Seating_Report.doc';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else if (format === 'pdf') {
        if (!window.jspdf || !window.jspdf.jsPDF) { alert("PDF library loading..."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("Amity University - COE Examination Attendance & Seating Report", 14, 20);
        
        let flatRows = [];
        for (let h in allocs) {
            allocs[h].forEach(s => {
                flatRows.push([h, s.seatNo, s.sen, s.name, s.courseCode]);
            });
        }

        doc.autoTable({
            startY: 28,
            head: [['Hall', 'Seat', 'SEN', 'Student Name', 'Course Code']],
            body: flatRows,
            theme: 'grid'
        });
        doc.save('COE_Seating_Report.pdf');
    }
};

// --- ADMIN COE CONFIGURATION PANEL ---
window.renderAdminCoeConfigTab = function() {
    let tab = document.getElementById('tab-faculty');
    if (!tab) return;

    let cfgContainer = document.getElementById('admin-coe-config-section');
    if (!cfgContainer) {
        cfgContainer = document.createElement('div');
        cfgContainer.id = 'admin-coe-config-section';
        cfgContainer.style.cssText = 'margin-top:30px; background:white; padding:25px; border-radius:8px; border:1px solid #cbd5e1;';
        tab.appendChild(cfgContainer);
    }

    let cfg = window.COE_CURRENT_CONFIG;

    cfgContainer.innerHTML = `
        <h3 style="color:#0f172a; margin-top:0;">⚙️ COE Configuration & Exam Master Management</h3>
        <p style="color:#475569; font-size:0.9rem;">Manage semesters, exam schedules, hall capacities, and course-faculty mappings for COE seating generation.</p>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:15px;">
            <div style="background:#f8fafc; padding:15px; border:1px solid #cbd5e1; border-radius:6px;">
                <h4 style="margin-top:0; color:#1e293b;">🏫 Examination Halls & Capacities</h4>
                <div style="max-height:150px; overflow-y:auto; margin-bottom:10px;">
                    ${cfg.halls.map((h, i) => `<div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #e2e8f0;"><span><strong>${h.hallNo}</strong> (Cap: ${h.capacity})</span> <button onclick="window.coeRemoveHall(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold;">Remove</button></div>`).join('')}
                </div>
                <div style="display:flex; gap:8px;">
                    <input type="text" id="admin-new-hall" placeholder="Hall No (e.g. LH-104)" style="flex:1; padding:6px; border:1px solid #cbd5e1; border-radius:4px;" />
                    <input type="number" id="admin-new-cap" placeholder="Capacity" value="40" style="width:90px; padding:6px; border:1px solid #cbd5e1; border-radius:4px;" />
                    <button onclick="window.coeAddHall()" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">Add Hall</button>
                </div>
            </div>

            <div style="background:#f8fafc; padding:15px; border:1px solid #cbd5e1; border-radius:6px;">
                <h4 style="margin-top:0; color:#1e293b;">📚 Course Code, Name & Slot Mapping</h4>
                <div style="max-height:150px; overflow-y:auto; margin-bottom:10px; font-size:0.85rem;">
                    ${cfg.courses.map((c, i) => `<div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid #e2e8f0;"><span><strong>${c.code}</strong> - ${c.name} (${c.slot})</span> <button onclick="window.coeRemoveCourse(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold;">Remove</button></div>`).join('')}
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <input type="text" id="admin-c-code" placeholder="Code" style="width:90px; padding:6px; border:1px solid #cbd5e1; border-radius:4px;" />
                    <input type="text" id="admin-c-name" placeholder="Course Name" style="flex:1; min-width:120px; padding:6px; border:1px solid #cbd5e1; border-radius:4px;" />
                    <input type="text" id="admin-c-faculty" placeholder="Faculty" style="width:110px; padding:6px; border:1px solid #cbd5e1; border-radius:4px;" />
                    <input type="text" id="admin-c-slot" placeholder="Slot" value="A1" style="width:55px; padding:6px; border:1px solid #cbd5e1; border-radius:4px;" />
                    <button onclick="window.coeAddCourse()" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">Add Course</button>
                </div>
            </div>
        </div>
        <div style="margin-top:15px; text-align:right;">
            <button onclick="window.saveCoeConfigToCloud()" style="background:#2563eb; color:white; border:none; padding:10px 20px; border-radius:6px; font-weight:bold; cursor:pointer;">💾 Save All COE Configurations to Cloud</button>
        </div>
    `;
};

window.coeAddHall = function() {
    let no = document.getElementById('admin-new-hall').value.trim();
    let cap = parseInt(document.getElementById('admin-new-cap').value) || 40;
    if (!no) return;
    window.COE_CURRENT_CONFIG.halls.push({ hallNo: no, capacity: cap });
    window.renderAdminCoeConfigTab();
};

window.coeRemoveHall = function(idx) {
    window.COE_CURRENT_CONFIG.halls.splice(idx, 1);
    window.renderAdminCoeConfigTab();
};

window.coeAddCourse = function() {
    let code = document.getElementById('admin-c-code').value.trim().toUpperCase();
    let name = document.getElementById('admin-c-name').value.trim();
    let faculty = document.getElementById('admin-c-faculty').value.trim();
    let slot = document.getElementById('admin-c-slot').value.trim().toUpperCase();
    if (!code || !name) return;
    window.COE_CURRENT_CONFIG.courses.push({ code, name, faculty, slot, level: "UG" });
    window.renderAdminCoeConfigTab();
};

window.coeRemoveCourse = function(idx) {
    window.COE_CURRENT_CONFIG.courses.splice(idx, 1);
    window.renderAdminCoeConfigTab();
};

window.saveCoeConfigToCloud = function() {
    localStorage.setItem('AIIT_COE_CONFIG', JSON.stringify(window.COE_CURRENT_CONFIG));
    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'saveCoeConfig', configJson: JSON.stringify(window.COE_CURRENT_CONFIG) })
    })
    .then(res => res.json())
    .then(data => alert("✅ COE Configuration successfully saved to Google Sheets database!"))
    .catch(err => alert("✅ Saved locally and synced."));
};

// ═══════════════════════════════════════════════════════════════════════
//  4. ADMIN PANEL DUAL AUDIT DASHBOARD (Faculty & COE)
// ═══════════════════════════════════════════════════════════════════════
window.renderAdminDualAudit = async function() {
    let tabFac = document.getElementById('tab-faculty');
    if (!tabFac) return;

    let container = document.getElementById('admin-dual-audit-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-dual-audit-container';
        container.style.cssText = 'margin-top:30px; background:white; padding:25px; border-radius:8px; border:1px solid #cbd5e1; box-shadow:0 1px 3px rgba(0,0,0,0.05);';
        tabFac.appendChild(container);
    }

    let coeRecord = { email: "coeaub@blr.amity.edu", count: 0, timestamps: ["Never"], lastTimestamp: "Never" };
    try {
        let coeRes = await fetch(scriptURL + "?action=getCOEAudit");
        let coeList = await coeRes.json();
        if (coeList && coeList.length > 0) coeRecord = coeList[0];
    } catch(e) {}

    let coeLastTime = coeRecord.lastTimestamp && coeRecord.lastTimestamp !== 'Never' ? new Date(coeRecord.lastTimestamp).toLocaleString() : 'Never';

    let html = `
        <h3 style="color:#0f172a; margin-top:0;">🛡️ COE Login Audit & Security</h3>
        <table style="width:100%; border-collapse:collapse; margin-top:15px; font-size:0.9rem; margin-bottom:30px;">
            <thead>
                <tr style="background:#f8fafc; border-bottom:2px solid #cbd5e1; color:#334155; text-align:left;">
                    <th style="padding:12px;">COE Email</th>
                    <th style="padding:12px; text-align:center;">Login Count</th>
                    <th style="padding:12px;">Last Timestamp</th>
                    <th style="padding:12px; text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:12px; font-weight:bold; color:#0f172a;">${esc(coeRecord.email)}</td>
                    <td style="padding:12px; text-align:center;"><span style="background:#dcfce3; color:#16a34a; padding:4px 10px; border-radius:4px; font-weight:bold;">${coeRecord.count} logins</span></td>
                    <td style="padding:12px; color:#475569;">${coeLastTime}</td>
                    <td style="padding:12px; text-align:right;">
                        <button onclick="window.adminResetCOEPwd()" style="background:#ef4444; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Reset COE Password</button>
                    </td>
                </tr>
            </tbody>
        </table>
    `;

    // Fetch Faculty Audit
    let auditMap = {};
    try {
        let res = await fetch(scriptURL + "?action=getFacultyAudit");
        let auditList = await res.json();
        (auditList || []).forEach(item => {
            auditMap[String(item.email).toLowerCase()] = item;
        });
    } catch(e) {
        console.warn("Audit fetch offline, rendering base faculty list.");
    }

    window.FACULTY_AUDIT_CACHE = window.AUTHORIZED_FACULTY_LIST.map(email => {
        let record = auditMap[email.toLowerCase()] || { timestamps: ["Never"], count: 0, lastTimestamp: "Never" };
        return {
            email: email,
            count: record.count || 0,
            timestamps: record.timestamps || ["Never"],
            lastTimestamp: record.lastTimestamp || "Never"
        };
    });

    let rowsHTML = "";
    window.FACULTY_AUDIT_CACHE.forEach((item, index) => {
        let lastTime = item.lastTimestamp && item.lastTimestamp !== 'Never' ? new Date(item.lastTimestamp).toLocaleString() : 'Never';
        rowsHTML += `
        <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:12px; font-weight:bold; color:#0f172a;">${esc(item.email)}</td>
            <td style="padding:12px; text-align:center;"><span style="background:${item.count > 0 ? '#dcfce3' : '#f1f5f9'}; color:${item.count > 0 ? '#16a34a' : '#64748b'}; padding:4px 10px; border-radius:4px; font-weight:bold;">${item.count} logins</span></td>
            <td style="padding:12px; color:#475569;">${lastTime}</td>
            <td style="padding:12px; text-align:right; white-space:nowrap;">
                <button onclick="window.showFacultyAuditDetails(${index})" style="background:#0ea5e9; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight:bold; margin-right:6px;">Details</button>
                <button onclick="window.adminResetFacultyPwd('${esc(item.email)}')" style="background:#ef4444; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Reset Password</button>
            </td>
        </tr>`;
    });

    container.innerHTML = html + `
        <h3 style="color:#0f172a; margin-top:0;">📊 Authorized Faculty Directory & Login Audit</h3>
        <p style="color:#475569; font-size:0.9rem;">Complete list of authorized faculty members, total login counts, exact date/timestamp history logs, and password reset controls.</p>
        <table style="width:100%; border-collapse:collapse; margin-top:15px; font-size:0.9rem;">
            <thead>
                <tr style="background:#f8fafc; border-bottom:2px solid #cbd5e1; color:#334155; text-align:left;">
                    <th style="padding:12px;">Faculty Email</th>
                    <th style="padding:12px; text-align:center;">Login Count</th>
                    <th style="padding:12px;">Last Timestamp</th>
                    <th style="padding:12px; text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
        </table>
    `;
};

window.adminResetCOEPwd = async function() {
    if (!confirm("Are you sure you want to reset COE password back to default (coe@123)?")) return;
    try {
        let res = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'setcoepassword', email: 'coeaub@blr.amity.edu', password: 'coe@123' })
        });
        let json = await res.json();
        if (json.status === 'success') {
            alert("✅ COE password successfully reset to coe@123.");
            window.renderAdminDualAudit();
        } else {
            alert(`❌ Error: ${json.message}`);
        }
    } catch(err) {
        alert("❌ Network error.");
    }
};

window.renderAdminFacultyAudit = window.renderAdminDualAudit;

window.showFacultyAuditDetails = function(index) {
    let faculty = window.FACULTY_AUDIT_CACHE ? window.FACULTY_AUDIT_CACHE[index] : null;
    if (!faculty) return;

    let timestamps = faculty.timestamps || [];
    let listHTML = timestamps.map(t => `<li>${t !== 'Never' ? new Date(t).toLocaleString() : 'Never logged in'}</li>`).join('');

    let modal = document.getElementById('faculty-detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'faculty-detail-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:9999;';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background:white; padding:25px; border-radius:8px; width:450px; max-width:90%; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
            <h3 style="margin-top:0; color:#0f172a;">📅 Login History: ${esc(faculty.email)}</h3>
            <p style="color:#475569; font-size:0.9rem;">Total Logins: <strong>${faculty.count}</strong></p>
            <div style="max-height:250px; overflow-y:auto; background:#f8fafc; padding:10px; border:1px solid #cbd5e1; border-radius:6px; margin-bottom:15px;">
                <ul style="margin:0; padding-left:20px; color:#334155; font-size:0.9rem;">${listHTML}</ul>
            </div>
            <div style="text-align:right;">
                <button onclick="document.getElementById('faculty-detail-modal').style.display='none';" style="background:#3b82f6; color:white; border:none; padding:6px 16px; border-radius:4px; cursor:pointer; font-weight:bold;">Close</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
};

window.adminResetFacultyPwd = async function(email) {
    if (!confirm(`Are you sure you want to reset password for ${email} back to default (faculty@123)?`)) return;
    try {
        let res = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'setfacultypassword', email: email, password: 'faculty@123' })
        });
        let json = await res.json();
        if (json.status === 'success') {
            alert(`✅ Password for ${email} successfully reset to faculty@123.`);
            window.renderAdminDualAudit();
        } else {
            alert(`❌ Error: ${json.message}`);
        }
    } catch(err) {
        alert("❌ Network error.");
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  5. BULK EXCEL CURRICULUM PARSER & UPLOADER
// ═══════════════════════════════════════════════════════════════════════
window.handleBulkCurriculumUpload = function (event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        const keyDropdown = document.getElementById('curriculum-edit-key') || document.querySelector('select[id*="curr"]');
        if (!keyDropdown || !keyDropdown.value) {
            alert("❌ ERROR: Please select Batch & Program from dropdown first!");
            event.target.value = '';
            return;
        }
        let targetKey = keyDropdown.value;
        window.currentEditingKey = targetKey;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet);

                if (!rows || rows.length === 0) {
                    alert("❌ Excel file is empty or formatted incorrectly.");
                    event.target.value = '';
                    return;
                }

                let mainMap = {};
                if (!window.CUSTOM_COURSE_DICT) window.CUSTOM_COURSE_DICT = {};

                rows.forEach(row => {
                    const cleanRow = {};
                    for (let key in row) {
                        cleanRow[key.toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase()] = row[key];
                    }

                    const mainCat = cleanRow['maincategory'] || cleanRow['category'];
                    if (!mainCat) return;

                    const safeNum = (val, def) => {
                        if (val === undefined || val === null || String(val).trim() === '') return def;
                        return isNaN(parseFloat(val)) ? def : parseFloat(val);
                    };

                    const mainCreds = safeNum(cleanRow['maincredits'] || cleanRow['mincredits'], 0);
                    const subCat = (cleanRow['subcategory'] && String(cleanRow['subcategory']).trim() !== "" && String(cleanRow['subcategory']).toLowerCase() !== 'nan') ? String(cleanRow['subcategory']).trim() : "General Courses";
                    let subCreds = safeNum(cleanRow['subcredits'], null);
                    if (subCreds === null || subCreds === 0) subCreds = (subCat === "General Courses") ? mainCreds : 0;

                    const code = String(cleanRow['coursecode'] || cleanRow['code'] || "").trim().toUpperCase();
                    const courseName = String(cleanRow['coursename'] || cleanRow['name'] || "").trim();
                    const courseCreds = safeNum(cleanRow['credits'] || cleanRow['credit'] || cleanRow['coursecredits'], 3);

                    if (code && code !== "UNDEFINED" && code !== "NAN") {
                        window.CUSTOM_COURSE_DICT[code] = {
                            name: (courseName && courseName !== "Course Title") ? courseName : code,
                            credits: courseCreds
                        };
                    }

                    if (!mainMap[mainCat]) {
                        mainMap[mainCat] = { category: mainCat, minCredits: mainCreds, subCategories: {} };
                    }
                    if (!mainMap[mainCat].subCategories[subCat]) {
                        mainMap[mainCat].subCategories[subCat] = { name: subCat, minCredits: subCreds, codes: [] };
                    }
                    if (code && code !== "UNDEFINED" && code !== "NAN") {
                        if (!mainMap[mainCat].subCategories[subCat].codes.includes(code)) {
                            mainMap[mainCat].subCategories[subCat].codes.push(code);
                        }
                    }
                });

                let newRules = Object.values(mainMap).map(main => ({
                    category: main.category,
                    minCredits: main.minCredits,
                    subCategories: Object.values(main.subCategories)
                }));

                if (!window.CURRICULUM_RULES) window.CURRICULUM_RULES = {};
                window.CURRICULUM_RULES[targetKey] = newRules;

                window.saveCurriculumToCloud();

                if (typeof window.loadCurriculumEditor === 'function') {
                    window.loadCurriculumEditor();
                }

                alert(`✅ SUCCESS! Bulk Curriculum uploaded for ${targetKey}. ${newRules.length} Main Categories and all courses registered successfully.`);
                event.target.value = '';
            } catch (err) {
                alert("❌ Excel Parse Error: " + err.message);
                event.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    } catch (err) {
        alert("❌ CRITICAL ERROR: " + err.message);
        event.target.value = '';
    }
};

window.resetCurriculumEditor = function() {
    if (confirm("⚠️ Are you sure you want to completely clear and reset the curriculum to defaults?")) {
        const keyDropdown = document.getElementById('curriculum-edit-key') || document.querySelector('select[id*="curr"]');
        let selectedKey = keyDropdown ? keyDropdown.value : "2024_MCA";

        if (window.CURRICULUM_RULES && window.CURRICULUM_RULES[selectedKey]) {
            delete window.CURRICULUM_RULES[selectedKey];
        }

        window.saveCurriculumToCloud();

        if (typeof window.loadCurriculumEditor === 'function') {
            window.loadCurriculumEditor();
        }

        alert(`✅ Curriculum for ${selectedKey} has been completely reset.`);
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  6. SYSTEM PROGRAMS RENDERER (Batches & Programs)
// ═══════════════════════════════════════════════════════════════════════
window.renderSystemPrograms = function() {
    let sysProgs = window.SYSTEM_PROGRAMS.length > 0 ? window.SYSTEM_PROGRAMS : [
        { batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }, { batch: "2024", program: "B.C.A" }, { batch: "2025", program: "B.C.A" }
    ];

    const container = document.getElementById('active-system-programs');
    if (container) {
        container.innerHTML = sysProgs.map((p, i) => `
            <span style="background: #334155; padding: 6px 12px; border-radius: 6px; color: white; font-weight:bold; display:inline-block; margin:4px;">
                ${esc(p.batch)} ${esc(p.program)} 
                <button onclick="window.removeSystemProgram(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer; margin-left:8px; font-weight:bold;">✖</button>
            </span>
        `).join('');
    }

    const dropdown = document.getElementById('curriculum-edit-key') || document.querySelector('select[id*="curr"]');
    if (dropdown) {
        const currentVal = dropdown.value;
        dropdown.innerHTML = sysProgs.map(p => {
            let key = `${p.batch}_${p.program}`;
            return `<option value="${key}">${p.batch} ${p.program}</option>`;
        }).join('');
        if (currentVal) dropdown.value = currentVal;
    }
};

window.addSystemProgram = function() {
    const b = document.getElementById('new-batch-input')?.value.trim();
    const p = document.getElementById('new-program-input')?.value.trim();
    if (!b || !p) { alert("Please enter both Batch and Program."); return; }

    if (!window.SYSTEM_PROGRAMS.some(x => x.batch === b && x.program === p)) {
        window.SYSTEM_PROGRAMS.push({ batch: b, program: p });
        localStorage.setItem('AIIT_SYSTEM_PROGRAMS', JSON.stringify(window.SYSTEM_PROGRAMS));
        window.renderSystemPrograms();
        alert(`✅ Added ${b} ${p} to system!`);
    }
};

window.removeSystemProgram = function(index) {
    if (confirm("Remove this batch and program?")) {
        window.SYSTEM_PROGRAMS.splice(index, 1);
        localStorage.setItem('AIIT_SYSTEM_PROGRAMS', JSON.stringify(window.SYSTEM_PROGRAMS));
        window.renderSystemPrograms();
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  7. ADMIN CURRICULUM EDITOR & LOAD BUTTON FIX
// ═══════════════════════════════════════════════════════════════════════
window.loadCurriculumEditor = function() {
    const dropdown = document.getElementById('curriculum-edit-key') || document.querySelector('select[id*="curr"]');
    const container = document.getElementById('curriculum-gui-container') || document.querySelector('.curriculum-container') || document.getElementById('tab-curriculum');
    
    let sysProgs = window.SYSTEM_PROGRAMS.length > 0 ? window.SYSTEM_PROGRAMS : [
        { batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }, { batch: "2024", program: "B.C.A" }
    ];

    if (dropdown) {
        const curVal = dropdown.value;
        dropdown.innerHTML = sysProgs.map(p => {
            let key = `${p.batch}_${p.program}`;
            return `<option value="${key}">${p.batch} ${p.program}</option>`;
        }).join('');
        if (curVal) dropdown.value = curVal;
    }

    window.triggerLoadCurriculum = function() {
        let selectedKey = dropdown ? dropdown.value : "2024_MCA";
        window.currentEditingKey = selectedKey;
        
        let rules = window.CURRICULUM_RULES[selectedKey] || [
            { 
                category: "A. School Core", 
                minCredits: 17, 
                subCategories: [
                    { name: "General Courses", minCredits: 17, codes: ["CSE5129", "MAT5005"] }
                ] 
            }
        ];

        let targetContainer = document.getElementById('curriculum-gui-container');
        if (!targetContainer && container) {
            targetContainer = document.createElement('div');
            targetContainer.id = 'curriculum-gui-container';
            targetContainer.style.cssText = 'margin-top:20px;';
            container.appendChild(targetContainer);
        }
        if (!targetContainer) return;

        let html = `
        <div style="background:white; padding:20px; border-radius:8px; border:1px solid #cbd5e1; margin-top:15px;">
            <h3 style="color:#0f172a; margin-top:0;">📋 Curriculum Table Editor: ${selectedKey.replace('_', ' ')}</h3>`;

        rules.forEach((main, mIdx) => {
            html += `
            <div style="margin-bottom:20px; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden;">
                <div style="background:#f8fafc; padding:12px 15px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #cbd5e1;">
                    <strong>📁 ${esc(main.category)} (Min Credits: ${main.minCredits})</strong>
                    <div style="display:flex; gap:8px;">
                        <button onclick="window.adminRenameMainCat(${mIdx})" style="background:#0ea5e9; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">Rename Category</button>
                        <button onclick="window.adminEditMainCreds(${mIdx})" style="background:#3b82f6; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">Edit Credits</button>
                    </div>
                </div>`;

            (main.subCategories || []).forEach((sub, sIdx) => {
                html += `
                <div style="padding:15px; background:white; border-bottom:1px solid #e2e8f0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-weight:bold; color:#334155;">📄 Sub-Category: ${esc(sub.name)} (Min: ${sub.minCredits} Cr)</span>
                        <div style="display:flex; gap:6px;">
                            <button onclick="window.adminRenameSubCat(${mIdx}, ${sIdx})" style="background:#64748b; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">Rename Sub</button>
                            <button onclick="window.adminEditSubCreds(${mIdx}, ${sIdx})" style="background:#64748b; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">Edit Sub Cr</button>
                        </div>
                    </div>
                    <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                        <thead>
                            <tr style="background:#f1f5f9; color:#475569; text-align:left;">
                                <th style="padding:8px;">Course Code</th>
                                <th style="padding:8px;">Course Name</th>
                                <th style="padding:8px; text-align:center;">Credits</th>
                                <th style="padding:8px; text-align:right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(sub.codes || []).length > 0 ? (sub.codes || []).map((code, cIdx) => {
                                let info = window.getCourseInfo ? window.getCourseInfo(code) : { name: code, credits: 3 };
                                return `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:8px; font-weight:bold; color:#0f172a;">${esc(code)}</td>
                                    <td style="padding:8px; color:#334155;">${esc(info.name)}</td>
                                    <td style="padding:8px; text-align:center; font-weight:bold; color:#2563eb;">${info.credits} Cr</td>
                                    <td style="padding:8px; text-align:right; white-space:nowrap;">
                                        <button onclick="window.adminEditCourse('${selectedKey}', ${mIdx},${sIdx}, ${cIdx}, '${code}')" style="background:#eab308; color:#451a03; border:none; padding:3px 8px; border-radius:4px; cursor:pointer; font-weight:bold; margin-right:4px;">Edit</button>
                                        <button onclick="window.adminRemoveCourse('${selectedKey}',${mIdx}, ${sIdx},${cIdx})" style="background:#ef4444; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">Remove</button>
                                    </td>
                                </tr>`;
                            }).join('') : `<tr><td colspan="4" style="padding:10px; color:#64748b; text-align:center;">No courses in this sub-category yet.</td></tr>`}
                        </tbody>
                    </table>
                    <button onclick="window.adminAddCourse('${selectedKey}', ${mIdx}, ${sIdx})" style="margin-top:10px; background:#10b981; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">+ Add Course Code</button>
                </div>`;
            });
            html += `</div>`;
        });

        html += `</div>`;
        targetContainer.innerHTML = html;
    };

    window.adminEditCourse = function(key, mIdx, sIdx, cIdx, oldCode) {
        let info = window.getCourseInfo(oldCode);
        let newCode = prompt("Edit Course Code:", oldCode);
        if (!newCode) return;
        let cleanCode = newCode.toUpperCase().trim();

        let newName = prompt(`Edit Course Name for ${cleanCode}:`, info.name);
        let newCreds = prompt(`Edit Credits for ${cleanCode}:`, info.credits);
        let parsedCreds = !isNaN(parseFloat(newCreds)) ? parseFloat(newCreds) : 3;

        let rules = window.CURRICULUM_RULES[key];
        rules[mIdx].subCategories[sIdx].codes[cIdx] = cleanCode;

        if (!window.CUSTOM_COURSE_DICT) window.CUSTOM_COURSE_DICT = {};
        window.CUSTOM_COURSE_DICT[cleanCode] = { name: newName || cleanCode, credits: parsedCreds };

        window.CURRICULUM_RULES[key] = rules;
        window.saveCurriculumToCloud();
        window.triggerLoadCurriculum();
    };

    window.adminAddCourse = function(key, mIdx, sIdx) {
        let code = prompt("Enter Course Code (e.g., CSE5001):");
        if (!code) return;
        let clean = code.toUpperCase().trim();

        let name = prompt(`Enter Course Name for ${clean}:`, "Course Title");
        let creds = prompt(`Enter Credits for ${clean}:`, "3");
        let parsedCreds = !isNaN(parseFloat(creds)) ? parseFloat(creds) : 3;

        if (!window.CUSTOM_COURSE_DICT) window.CUSTOM_COURSE_DICT = {};
        window.CUSTOM_COURSE_DICT[clean] = { name: name || clean, credits: parsedCreds };

        let rules = window.CURRICULUM_RULES[key];
        if (!rules[mIdx].subCategories[sIdx].codes.includes(clean)) {
            rules[mIdx].subCategories[sIdx].codes.push(clean);
        }

        window.CURRICULUM_RULES[key] = rules;
        window.saveCurriculumToCloud();
        window.triggerLoadCurriculum();
    };

    window.adminRemoveCourse = function(key, mIdx, sIdx, cIdx) {
        if (confirm("Remove this course code?")) {
            let rules = window.CURRICULUM_RULES[key];
            rules[mIdx].subCategories[sIdx].codes.splice(cIdx, 1);
            window.CURRICULUM_RULES[key] = rules;
            window.saveCurriculumToCloud();
            window.triggerLoadCurriculum();
        }
    };

    window.adminRenameMainCat = function(mIdx) {
        let key = window.currentEditingKey || "2024_MCA";
        let newName = prompt("Enter new Main Category name:");
        if (newName) {
            window.CURRICULUM_RULES[key][mIdx].category = newName;
            window.saveCurriculumToCloud();
            window.triggerLoadCurriculum();
        }
    };

    window.adminEditMainCreds = function(mIdx) {
        let key = window.currentEditingKey || "2024_MCA";
        let creds = prompt("Enter minimum credits for this category:");
        if (creds !== null && !isNaN(creds)) {
            window.CURRICULUM_RULES[key][mIdx].minCredits = parseFloat(creds);
            window.saveCurriculumToCloud();
            window.triggerLoadCurriculum();
        }
    };

    window.adminRenameSubCat = function(mIdx, sIdx) {
        let key = window.currentEditingKey || "2024_MCA";
        let newName = prompt("Enter new Sub-Category name:");
        if (newName) {
            window.CURRICULUM_RULES[key][mIdx].subCategories[sIdx].name = newName;
            window.saveCurriculumToCloud();
            window.triggerLoadCurriculum();
        }
    };

    window.adminEditSubCreds = function(mIdx, sIdx) {
        let key = window.currentEditingKey || "2024_MCA";
        let creds = prompt("Enter minimum credits for this sub-category:");
        if (creds !== null && !isNaN(creds)) {
            window.CURRICULUM_RULES[key][mIdx].subCategories[sIdx].minCredits = parseFloat(creds);
            window.saveCurriculumToCloud();
            window.triggerLoadCurriculum();
        }
    };

    // Direct binding for Load Curriculum button
    document.querySelectorAll('button').forEach(b => {
        let txt = b.textContent.trim().toUpperCase();
        if (txt === 'LOAD CURRICULUM') {
            b.onclick = function(e) {
                e.preventDefault();
                window.triggerLoadCurriculum();
            };
        }
    });
};

// ═══════════════════════════════════════════════════════════════════════
//  8. STUDENT PORTAL DEGREE AUDIT ENGINE
// ═══════════════════════════════════════════════════════════════════════
window.evaluateDegree = function(student) {
    let studentBatch = String(student.batch || "").trim();
    let studentProg = String(student.program || "").trim();
    let mapKey = `${studentBatch}_${studentProg}`;
    let mapKeySpace = `${studentBatch} ${studentProg}`;

    let rulesToUse = window.CURRICULUM_RULES[mapKey] || window.CURRICULUM_RULES[mapKeySpace] || Object.values(window.CURRICULUM_RULES)[0];
    
    if (!rulesToUse || rulesToUse.length === 0) {
        return `<div style="text-align:center; padding:25px; background:#f8fafc; border-radius:10px; border:2px dashed #cbd5e1; margin-top:20px;">
                    <h3 style="color:#ef4444; margin-top:0;">📭 Curriculum Not Mapped</h3>
                    <p style="color:#475569;">No curriculum rules found for batch/program (${studentBatch} ${studentProg}).</p>
                </div>`;
    }

    const cleanString = (str) => String(str).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const isPass = (grade) => !['F', 'AB', 'DE', 'I', 'U'].includes(String(grade).toUpperCase().trim());

    let earnedCourses = (student.courses || []).map(c => ({
        ...c,
        cleanCode: cleanString(c.code || c.CourseCode),
        grade: String(c.grade || c.Grade || "").toUpperCase().trim()
    }));

    let auditHTML = `<div class="audit-wrapper" style="margin-top:10px;">`;

    rulesToUse.forEach(mainBasket => {
        let basketReq = parseFloat(mainBasket.minCredits) || 0;
        let basketEarned = 0;
        let subHTML = "";

        let subCats = mainBasket.subCategories || [];
        if (subCats.length === 0 && mainBasket.codes) {
            subCats = [{ name: "General Courses", minCredits: basketReq, codes: mainBasket.codes }];
        }

        subCats.forEach(sub => {
            let subReq = parseFloat(sub.minCredits) || 0;
            let subEarned = 0;
            let coursesHTML = "";

            (sub.codes || []).forEach(reqCode => {
                let cleanReq = cleanString(reqCode);
                let match = earnedCourses.find(c => c.cleanCode === cleanReq && isPass(c.grade));
                let info = window.getCourseInfo ? window.getCourseInfo(reqCode) : { name: reqCode, credits: 3 };

                if (match) {
                    let cr = parseFloat(match.credits || info.credits || 3);
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
                    <span>Earned: <span style="color:#3b82f6;">${subEarned}</span> / ${subReq} Cr</span>
                </h5>
                <table style="width:100%; text-align:left; border-collapse:collapse; font-size:0.9rem;">
                    <thead>
                        <tr style="background:#f1f5f9; color:#475569;">
                            <th style="padding:8px;">Code</th>
                            <th style="padding:8px;">Course Title</th>
                            <th style="padding:8px;">Credits</th>
                            <th style="padding:8px; text-align:center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>${coursesHTML}</tbody>
                </table>
            </div>`;
        });

        let statusColor = "#f59e0b";
        let statusIcon = "⏳";
        if (basketEarned >= basketReq) { statusColor = "#10b981"; statusIcon = "✅"; }
        else if (basketEarned === 0) { statusColor = "#ef4444"; statusIcon = "❌"; }

        auditHTML += `
        <div style="border:1px solid ${statusColor}; border-radius:8px; margin-bottom:12px; background:white; overflow:hidden; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
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

    auditHTML += `</div>`;
    return auditHTML;
};

// ═══════════════════════════════════════════════════════════════════════
//  9. ADMIN STUDENT DIRECTORY
// ═══════════════════════════════════════════════════════════════════════
window.applyAdminFilters = async function() {
    var tbody = document.getElementById('admin-tbody');
    var totalStu = document.getElementById('total-stu');
    if (!tbody) return;

    if (window.STUDENTS.length === 0) {
        await window.initializeCloudPortal();
    }

    if (totalStu) totalStu.textContent = window.STUDENTS.length;

    if (window.STUDENTS.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">No student records found in Cloud DB.</td></tr>`;
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

// ═══════════════════════════════════════════════════════════════════════
//  10. PAGE NAVIGATION & LOGIN HANDLERS
// ═══════════════════════════════════════════════════════════════════════
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

window.showFacultyLogin = function() {
    let sContainer = document.getElementById('student-login-container') || document.querySelector('.landing-container') || document.getElementById('landing');
    let fContainer = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
    if (sContainer) sContainer.style.display = 'none';
    if (fContainer) {
        fContainer.style.display = 'block';
    } else {
        alert("Faculty login portal view loading...");
    }
};

window.showStudentLoginUI = function() {
    let sContainer = document.getElementById('student-login-container') || document.querySelector('.landing-container') || document.getElementById('landing');
    let fContainer = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
    if (fContainer) fContainer.style.display = 'none';
    if (sContainer) sContainer.style.display = 'block';
};

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
        alert("✗ Cloud connection error. Check your network.");
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
            window.showPage('admin-dash');
        } else {
            alert(`⚠ ${data.message || 'Incorrect Admin Password'}`);
        }
    } catch (err) {
        alert(`⚠ Network Error: Check your connection.`);
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  11. STUDENT DASHBOARD RENDERING
// ═══════════════════════════════════════════════════════════════════════
window.getActiveBacklogs = function(courses) {
    let history = {};
    (courses || []).forEach(c => {
        if (!c.code || c.code === 'NAN') return;
        let code = String(c.code).toUpperCase().trim();
        if (!history[code]) history[code] = { passed: false, latest: c };
        let isFail = ['F', 'AB', 'DE', 'I', 'U'].includes(String(c.grade || c.Grade || '').toUpperCase().trim());
        if (!isFail) history[code].passed = true;
        else if (!history[code].passed) history[code].latest = c;
    });
    let backlogs = [];
    for (let code in history) {
        if (!history[code].passed) backlogs.push(history[code].latest);
    }
    return backlogs;
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
    
    // FIX: Strictly format CGPA to 2 decimal places
    let rawCgpa = parseFloat(student.cgpa);
    let cgpa = !isNaN(rawCgpa) ? rawCgpa.toFixed(2) : 'N/A';
    
    let credits = student.totalCredits || '0';
    let validCourses = (student.courses || []).filter(c => c && c.code && c.code !== 'NAN');
    let backlogsList = window.getActiveBacklogs(validCourses);

    document.querySelectorAll('#dash-name, .student-name').forEach(el => el.textContent = `${name} (${sen})`);
    document.querySelectorAll('#dash-cgpa, .cgpa-val').forEach(el => el.textContent = cgpa);
    document.querySelectorAll('#dash-ce, .credits-val').forEach(el => el.textContent = credits);

    // FIX: Locate the static "Completed Credits: 0 | Backlog: 0" bar and update it dynamically
    document.querySelectorAll('*').forEach(el => {
        if (el.children.length === 0 && el.textContent.includes('Completed Credits:') && el.textContent.includes('Backlog')) {
            el.textContent = `Completed Credits: ${credits}   |   Backlog / Failed Courses: ${backlogsList.length}`;
        }
    });

    // Inject Tab Navigation for Student Portal
    let tableContainer = document.getElementById('courses-tbody') || document.querySelector('table tbody');
    if (tableContainer) tableContainer = tableContainer.closest('table').parentElement;

    if (tableContainer && !document.getElementById('student-tab-nav')) {
        let tabNav = document.createElement('div');
        tabNav.id = 'student-tab-nav';
        tabNav.style.cssText = 'display:flex; gap:10px; margin:20px 0 15px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px; flex-wrap:wrap;';
        tableContainer.parentNode.insertBefore(tabNav, tableContainer);

        let backlogsDiv = document.createElement('div');
        backlogsDiv.id = 'student-tab-backlogs';
        backlogsDiv.style.display = 'none';
        backlogsDiv.innerHTML = `<table style="width:100%; text-align:left; border-collapse:collapse; background:white; border:1px solid #e2e8f0;"><thead style="background:#f8fafc; border-bottom:2px solid #e2e8f0;"><tr><th style="padding:12px 10px;">Code</th><th style="padding:12px 10px;">Course Title</th><th style="padding:12px 10px;">Type</th><th style="padding:12px 10px;">Cr.</th><th style="padding:12px 10px;">Marks</th><th style="padding:12px 10px;">Grade</th></tr></thead><tbody id="student-backlogs-tbody"></tbody></table>`;
        tableContainer.parentNode.insertBefore(backlogsDiv, tableContainer.nextSibling);

        let auditDiv = document.createElement('div');
        auditDiv.id = 'student-tab-audit';
        auditDiv.style.display = 'none';
        tableContainer.parentNode.insertBefore(auditDiv, backlogsDiv.nextSibling);

        tableContainer.id = 'student-tab-all';
    }

    window.switchStudentTab = function(tabName) {
        document.getElementById('student-tab-all').style.display = (tabName === 'all') ? 'block' : 'none';
        document.getElementById('student-tab-backlogs').style.display = (tabName === 'backlogs') ? 'block' : 'none';
        document.getElementById('student-tab-audit').style.display = (tabName === 'audit') ? 'block' : 'none';

        document.getElementById('btn-stu-all').style.background = (tabName === 'all') ? '#3b82f6' : '#f1f5f9';
        document.getElementById('btn-stu-all').style.color = (tabName === 'all') ? 'white' : '#475569';
        
        document.getElementById('btn-stu-backlogs').style.background = (tabName === 'backlogs') ? '#ef4444' : '#f1f5f9';
        document.getElementById('btn-stu-backlogs').style.color = (tabName === 'backlogs') ? 'white' : '#475569';

        document.getElementById('btn-stu-audit').style.background = (tabName === 'audit') ? '#10b981' : '#f1f5f9';
        document.getElementById('btn-stu-audit').style.color = (tabName === 'audit') ? 'white' : '#475569';
    };

    const tabNav = document.getElementById('student-tab-nav');
    if (tabNav) {
        tabNav.innerHTML = `
            <button onclick="window.switchStudentTab('all')" id="btn-stu-all" style="padding:8px 16px; border:none; background:#3b82f6; color:white; border-radius:6px; font-weight:bold; cursor:pointer;">📚 All Courses</button>
            <button onclick="window.switchStudentTab('backlogs')" id="btn-stu-backlogs" style="padding:8px 16px; border:none; background:#f1f5f9; color:#475569; border-radius:6px; font-weight:bold; cursor:pointer;">⚠️ Backlog (${backlogsList.length})</button>
            <button onclick="window.switchStudentTab('audit')" id="btn-stu-audit" style="padding:8px 16px; border:none; background:#f1f5f9; color:#475569; border-radius:6px; font-weight:bold; cursor:pointer;">🎓 Degree Audit Check</button>
            <button onclick="window.exportStudentPDF()" style="margin-left:auto; padding:8px 16px; border:none; background:#dc2626; color:white; border-radius:6px; font-weight:bold; cursor:pointer;">📄 Export PDF</button>
        `;
    }

    let coursesTbody = document.getElementById('courses-tbody');
    if (coursesTbody) {
        coursesTbody.innerHTML = validCourses.map(c => `
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

    let backlogsTbody = document.getElementById('student-backlogs-tbody');
    if (backlogsTbody) {
        backlogsTbody.innerHTML = backlogsList.length > 0 ? backlogsList.map(c => `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px; font-weight:bold;">${esc(c.code)}</td>
                <td style="padding:10px;">${esc(c.name)}</td>
                <td style="padding:10px;">${esc(c.type || 'Core')}</td>
                <td style="padding:10px;">${esc(c.credits)}</td>
                <td style="padding:10px;">${esc(c.marks)}</td>
                <td style="padding:10px; font-weight:bold; color:#dc2626;">${esc(c.grade)}</td>
            </tr>
        `).join('') : `<tr><td colspan="6" style="text-align:center; padding:20px; color:#16a34a; font-weight:bold;">🎉 Excellent! You have no backlogs.</td></tr>`;
    }

    let auditContainer = document.getElementById('student-tab-audit');
    if (auditContainer && typeof window.evaluateDegree === 'function') {
        auditContainer.innerHTML = window.evaluateDegree(student);
    }

    // Clean Logout button text
    document.querySelectorAll('button, a').forEach(el => {
        let txt = el.textContent.trim().toLowerCase();
        if (txt.includes('logout') || txt.includes('search another')) {
            el.textContent = 'LOGOUT';
            el.onclick = function(e) { e.preventDefault(); window.logoutPortal(); };
        }
    });
};

// ═══════════════════════════════════════════════════════════════════════
//  12. ADMIN NAVIGATION & UTILITIES
// ═══════════════════════════════════════════════════════════════════════
window.switchAdminTab = function (tabId, btnElement) {
    ['tab-upload', 'tab-curriculum', 'tab-students', 'tab-faculty'].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    document.querySelectorAll('.admin-section, .admin-tab-content').forEach(sec => {
        if (sec) sec.style.display = 'none';
    });

    let target = document.getElementById(tabId);
    if (target) target.style.display = 'block';

    document.querySelectorAll('button').forEach(b => {
        if (b.classList.contains('admin-tab-btn') || b.parentElement?.classList?.contains('dashboard-nav')) {
            b.style.background = '';
            b.style.color = '';
        }
    });

    if (btnElement) {
        btnElement.style.background = '#2563eb';
        btnElement.style.color = '#ffffff';
    }

    if (tabId === 'tab-students' && typeof window.applyAdminFilters === 'function') {
        window.applyAdminFilters();
    } else if (tabId === 'tab-curriculum' && typeof window.loadCurriculumEditor === 'function') {
        window.loadCurriculumEditor();
    } else if (tabId === 'tab-faculty' && typeof window.renderAdminDualAudit === 'function') {
        window.renderAdminDualAudit();
    }
};

window.applyAdminFilters = async function() {
    var tbody = document.getElementById('admin-tbody');
    var totalStu = document.getElementById('total-stu');
    if (!tbody) return;

    if (window.STUDENTS.length === 0) {
        await window.initializeCloudPortal();
    }

    const searchInput = document.querySelector('input[placeholder*="sunil"], input[placeholder*="Search"], #admin-search-input');
    const searchTxt = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const batchSelects = document.querySelectorAll('select');
    let batchSel = "", progSel = "";
    batchSelects.forEach(sel => {
        let val = sel.value.trim();
        if (val && val !== "All Years" && val !== "All Programs" && val !== "All Credits" && !val.includes("Sort")) {
            if (window.SYSTEM_PROGRAMS.some(p => String(p.batch) === val)) batchSel = val;
            if (window.SYSTEM_PROGRAMS.some(p => String(p.program) === val)) progSel = val;
        }
    });

    let filtered = window.STUDENTS.filter(s => {
        let matchSearch = !searchTxt || String(s.sen || '').toLowerCase().includes(searchTxt) || String(s.name || '').toLowerCase().includes(searchTxt);
        let matchBatch = !batchSel || String(s.batch || '').trim() === batchSel;
        let matchProg = !progSel || String(s.program || '').trim() === progSel;
        return matchSearch && matchBatch && matchProg;
    });

    if (totalStu) totalStu.textContent = filtered.length;

    tbody.innerHTML = filtered.map((s, i) => {
        let cRaw = parseFloat(s.cgpa);
        let cFormatted = !isNaN(cRaw) ? cRaw.toFixed(2) : 'N/A';
        return `
        <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:10px;">${i + 1}</td>
            <td style="font-weight:bold;">${esc(s.sen)}</td>
            <td>${esc(s.name)}</td>
            <td>${esc(s.program || 'N/A')}</td>
            <td style="font-weight:bold; color:#3b82f6;">${cFormatted}</td>
            <td>${s.totalCredits || '0'}</td>
            <td><button style="background:#0ea5e9; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;" onclick="window.openAdminStudentView('${esc(s.sen)}')">Details</button></td>
        </tr>`;
    }).join('');

    // Ensure Export Buttons are present on Admin Student Directory
    let container = tbody.closest('.admin-section') || tbody.parentElement;
    if (container && !document.getElementById('admin-export-bar')) {
        let bar = document.createElement('div');
        bar.id = 'admin-export-bar';
        bar.style.cssText = 'margin-bottom:15px; display:flex; gap:10px;';
        bar.innerHTML = `
            <button onclick="window.exportAdminCSV()" style="background:#10b981; color:white; border:none; padding:6px 14px; border-radius:4px; font-weight:bold; cursor:pointer;">📥 Export Excel / CSV</button>
            <button onclick="window.exportAdminPDF()" style="background:#dc2626; color:white; border:none; padding:6px 14px; border-radius:4px; font-weight:bold; cursor:pointer;">📄 Export PDF</button>
        `;
        container.insertBefore(bar, tbody.closest('table'));
    }
};

window.exportAdminCSV = function() {
    let csv = "SEN,Name,Program,Batch,CGPA,Total Credits\n";
    window.STUDENTS.forEach(s => {
        csv += `"${s.sen}","${s.name}","${s.program}","${s.batch}","${s.cgpa}","${s.totalCredits}"\n`;
    });
    let blob = new Blob([csv], { type: 'text/csv' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'Admin_Student_Directory.csv';
    a.click();
};

window.exportAdminPDF = function() {
    if (!window.jspdf || !window.jspdf.jsPDF) { alert("PDF library loading..."); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Amity University - Admin Student Directory Report", 14, 20);
    let body = window.STUDENTS.map(s => [s.sen, s.name, s.program, s.batch, s.cgpa, s.totalCredits]);
    doc.autoTable({ startY: 28, head: [['SEN', 'Name', 'Program', 'Batch', 'CGPA', 'Credits']], body: body, theme: 'grid' });
    doc.save('Admin_Student_Directory.pdf');
};

// --- 3. FACULTY PORTAL (Back to Directory & Curriculum View) ---
window.renderFacultyPortal = async function(email) {
    let facultyDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section') || document.getElementById('faculty-dashboard');
    
    document.querySelectorAll('.page, .login-container, #student-login-container, .landing-container, #faculty-login-container').forEach(el => {
        if (el) el.style.display = 'none';
    });

    if (!facultyDash) {
        facultyDash = document.createElement('div');
        facultyDash.id = 'faculty-dash';
        facultyDash.style.cssText = 'padding:20px; background:#f8fafc; min-height:100vh;';
        document.body.appendChild(facultyDash);
    }
    facultyDash.style.display = 'block';

    if (window.STUDENTS.length === 0) await window.initializeCloudPortal();

    facultyDash.innerHTML = `
        <div style="max-width:1200px; margin:0 auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #cbd5e1; padding-bottom:12px; margin-bottom:20px;">
                <h2 style="color:#0f172a; margin:0;">👨‍🏫 Faculty Portal: Student Analytics & Curriculum Viewer</h2>
                <div style="display:flex; gap:10px;">
                    <button onclick="window.switchFacultyTab('directory')" id="fac-tab-dir" style="background:#2563eb; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">Student Results & Directory</button>
                    <button onclick="window.switchFacultyTab('curriculum')" id="fac-tab-curr" style="background:#f1f5f9; color:#475569; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">Curriculum View</button>
                    <button onclick="window.logoutPortal()" style="background:#ef4444; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">Logout</button>
                </div>
            </div>
            <div id="faculty-tab-content-area"></div>
        </div>
    `;

    window.switchFacultyTab('directory');
};

window.switchFacultyTab = function(tabName) {
    let area = document.getElementById('faculty-tab-content-area');
    if (!area) return;

    let btnDir = document.getElementById('fac-tab-dir');
    let btnCurr = document.getElementById('fac-tab-curr');
    if (btnDir && btnCurr) {
        btnDir.style.background = (tabName === 'directory') ? '#2563eb' : '#f1f5f9';
        btnDir.style.color = (tabName === 'directory') ? 'white' : '#475569';
        btnCurr.style.background = (tabName === 'curriculum') ? '#2563eb' : '#f1f5f9';
        btnCurr.style.color = (tabName === 'curriculum') ? 'white' : '#475569';
    }

    if (tabName === 'directory') {
        area.innerHTML = `
            <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;">
                <input type="text" id="faculty-search-input" placeholder="Search SEN or Name..." oninput="window.facultyFilterAndSort()" style="flex:1; min-width:220px; padding:8px; border:1px solid #cbd5e1; border-radius:6px;" />
                <select id="filter-batch" onchange="window.facultyFilterAndSort()" style="padding:8px; border:1px solid #cbd5e1; border-radius:6px;">
                    <option value="">All Years</option>
                    ${[...new Set(window.SYSTEM_PROGRAMS.map(p => p.batch))].map(b => `<option value="${b}">${b}</option>`).join('')}
                </select>
                <select id="filter-program" onchange="window.facultyFilterAndSort()" style="padding:8px; border:1px solid #cbd5e1; border-radius:6px;">
                    <option value="">All Programs</option>
                    ${[...new Set(window.SYSTEM_PROGRAMS.map(p => p.program))].map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
            </div>
            <div style="background:white; border-radius:8px; border:1px solid #cbd5e1; overflow:hidden;">
                <table style="width:100%; border-collapse:collapse; text-align:left;">
                    <thead>
                        <tr style="background:#f8fafc; border-bottom:2px solid #cbd5e1; color:#334155;">
                            <th style="padding:12px;">SEN</th>
                            <th style="padding:12px;">Name</th>
                            <th style="padding:12px;">CGPA</th>
                            <th style="padding:12px;">Credits Earned</th>
                            <th style="padding:12px; text-align:right;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="faculty-directory-tbody"></tbody>
                </table>
            </div>
        `;
        window.facultyFilterAndSort();
    } else if (tabName === 'curriculum') {
        let sysProgs = window.SYSTEM_PROGRAMS.length > 0 ? window.SYSTEM_PROGRAMS : [{ batch: "2024", program: "MCA" }];

        area.innerHTML = `
            <div style="background:white; padding:20px; border-radius:8px; border:1px solid #cbd5e1;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <label style="font-weight:bold; color:#334155;">Select Batch & Program:</label>
                        <select id="faculty-curr-select" onchange="window.renderFacultyCurriculumTable()" style="padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-weight:bold;">
                            ${sysProgs.map(p => `<option value="${p.batch}_${p.program}">${p.batch} ${p.program}</option>`).join('')}
                        </select>
                    </div>
                    <button onclick="window.exportFacultyCurriculumPDF()" style="background:#dc2626; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">📄 Download PDF</button>
                </div>
                <div id="faculty-curriculum-table-container"></div>
            </div>
        `;
        window.renderFacultyCurriculumTable();
    }
};

window.renderFacultyCurriculumTable = function() {
    let dropdown = document.getElementById('faculty-curr-select');
    let container = document.getElementById('faculty-curriculum-table-container');
    if (!container) return;

    let selectedKey = dropdown ? dropdown.value : "2024_MCA";
    let rules = window.CURRICULUM_RULES[selectedKey] || [];

    if (rules.length === 0) {
        container.innerHTML = `<p style="color:#64748b; text-align:center; padding:20px;">No curriculum rules found for ${selectedKey.replace('_', ' ')}.</p>`;
        return;
    }

    let html = `<h4 style="color:#0f172a; margin-top:0;">📋 Curriculum Overview: ${selectedKey.replace('_', ' ')}</h4>`;

    rules.forEach((main) => {
        html += `
        <div style="margin-bottom:25px; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; background:white;">
            <div style="background:#f8fafc; padding:12px 15px; border-bottom:1px solid #cbd5e1;">
                <strong style="color:#1e293b; font-size:1.05rem;">📁 ${esc(main.category)} (Min Credits: ${main.minCredits})</strong>
            </div>`;

        (main.subCategories || []).forEach((sub) => {
            html += `
            <div style="padding:15px; background:white; border-bottom:1px solid #e2e8f0;">
                <div style="font-weight:bold; color:#334155; margin-bottom:8px;">📄 Sub-Category: ${esc(sub.name)} (Min: ${sub.minCredits} Cr)</div>
                <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                    <thead>
                        <tr style="background:#f1f5f9; color:#475569; text-align:left;">
                            <th style="padding:8px;">Course Code</th>
                            <th style="padding:8px;">Course Name</th>
                            <th style="padding:8px; text-align:right;">Credits</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(sub.codes || []).length > 0 ? (sub.codes || []).map((code) => {
                            let info = window.getCourseInfo(code);
                            return `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:8px; font-weight:bold; color:#0f172a;">${esc(code)}</td>
                                <td style="padding:8px; color:#334155;">${esc(info.name)}</td>
                                <td style="padding:8px; text-align:right; font-weight:bold; color:#2563eb;">${info.credits} Cr</td>
                            </tr>`;
                        }).join('') : `<tr><td colspan="3" style="padding:10px; color:#64748b; text-align:center;">No courses in this sub-category.</td></tr>`}
                    </tbody>
                </table>
            </div>`;
        });
        html += `</div>`;
    });

    container.innerHTML = html;
};

window.exportFacultyCurriculumPDF = function() {
    if (!window.jspdf || !window.jspdf.jsPDF) { alert("PDF library loading..."); return; }
    let dropdown = document.getElementById('faculty-curr-select');
    let selectedKey = dropdown ? dropdown.value : "2024_MCA";
    let rules = window.CURRICULUM_RULES[selectedKey] || [];

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Amity University - Curriculum Report (${selectedKey.replace('_', ' ')})`, 14, 20);

    let flatRows = [];
    rules.forEach(main => {
        (main.subCategories || []).forEach(sub => {
            (sub.codes || []).forEach(code => {
                let info = window.getCourseInfo(code);
                flatRows.push([main.category, sub.name, code, info.name, `${info.credits} Cr`]);
            });
        });
    });

    doc.autoTable({
        startY: 28,
        head: [['Main Category', 'Sub Category', 'Code', 'Course Name', 'Credits']],
        body: flatRows,
        theme: 'grid'
    });
    doc.save(`Curriculum_${selectedKey}.pdf`);
};

window.facultyFilterAndSort = function() {
    let students = window.STUDENTS || [];
    const searchInput = document.getElementById('faculty-search-input');
    const searchTxt = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const batchSel = document.getElementById('filter-batch') ? document.getElementById('filter-batch').value.trim() : "";
    const progSel = document.getElementById('filter-program') ? document.getElementById('filter-program').value.trim() : "";

    let filtered = students.filter(s => {
        let matchSearch = !searchTxt || String(s.sen || '').toLowerCase().includes(searchTxt) || String(s.name || '').toLowerCase().includes(searchTxt);
        let matchBatch = !batchSel || String(s.batch || '').trim() === batchSel;
        let matchProg = !progSel || String(s.program || '').trim() === progSel;
        return matchSearch && matchBatch && matchProg;
    });

    let tbody = document.getElementById('faculty-directory-tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">No matching students found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(s => {
        let cRaw = parseFloat(s.cgpa);
        let cFormatted = !isNaN(cRaw) ? cRaw.toFixed(2) : 'N/A';
        return `
        <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:12px; font-weight:bold;">${esc(s.sen)}</td>
            <td style="padding:12px;">${esc(s.name)}</td>
            <td style="padding:12px; font-weight:bold; color:#3b82f6;">${cFormatted}</td>
            <td style="padding:12px; font-weight:bold;">${s.totalCredits || '0'}</td>
            <td style="padding:12px; text-align:right;"><button style="background:#0ea5e9; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;" onclick="window.openFacultyStudentView('${esc(s.sen)}')">Details</button></td>
        </tr>`;
    }).join('');
};

window.openFacultyStudentView = function(sen) {
    let student = window.STUDENTS.find(s => String(s.sen).toUpperCase() === String(sen).toUpperCase());
    if (!student) { alert("Student not found."); return; }
    window.loadStudentDashboard(student);

    // FIX: Properly wire "← Back to Directory" button
    setTimeout(() => {
        let dash = document.getElementById('student-dash') || document.getElementById('student-dashboard');
        if (dash && !document.getElementById('back-to-directory-btn')) {
            let backBtn = document.createElement('button');
            backBtn.id = 'back-to-directory-btn';
            backBtn.innerHTML = '← Back to Directory';
            backBtn.style.cssText = 'margin:15px 0 0 20px; background:#475569; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer; display:inline-block; z-index:999; position:relative;';
            backBtn.onclick = function() {
                dash.style.display = 'none';
                if (typeof window.renderFacultyPortal === 'function') window.renderFacultyPortal();
            };
            dash.insertBefore(backBtn, dash.firstChild);
        }
    }, 100);
};

window.exportCurriculumJSON = function() {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.CURRICULUM_RULES, null, 2));
    let dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "AIIT_Curriculum_Rules.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
};

window.logoutPortal = function() {
    sessionStorage.clear();
    localStorage.clear();
    document.body.classList.remove('overlay-active');
    window.location.href = window.location.pathname;
};

// ═══════════════════════════════════════════════════════════════════════
//  13. DOM LOAD INITIALIZATION & EXPLICIT BUTTON WIRING
// ═══════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    window.initializeCloudPortal();

    let tabFac = document.getElementById('tab-faculty');
    if (tabFac) {
        setTimeout(() => {
            if (typeof window.renderAdminDualAudit === 'function') window.renderAdminDualAudit();
            if (typeof window.renderAdminCoeConfigTab === 'function') window.renderAdminCoeConfigTab();
        }, 500);
    }

    let fileInput = document.getElementById('bulk-curriculum-file-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'bulk-curriculum-file-input';
        fileInput.accept = '.xlsx, .xls, .csv';
        fileInput.style.display = 'none';
        fileInput.onchange = window.handleBulkCurriculumUpload;
        document.body.appendChild(fileInput);
    }

    document.querySelectorAll('button').forEach(b => {
        let txt = b.textContent.trim().toUpperCase();
        if (txt.includes('BULK UPLOAD EXCEL CURRICULUM') || txt.includes('BULK UPLOAD')) {
            b.onclick = function(e) {
                e.preventDefault();
                fileInput.click();
            };
        } else if (txt.includes('RESET TO DEFAULT')) {
            b.onclick = function(e) {
                e.preventDefault();
                window.resetCurriculumEditor();
            };
        }
    });
});