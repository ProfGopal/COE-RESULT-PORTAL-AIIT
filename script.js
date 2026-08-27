/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 9.0 - Full Feature & Curriculum Suite)
 */

'use strict';

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";
const GAS_URL = scriptURL;

window.STUDENTS = [];
window.CURRICULUM_RULES = {};
window.SYSTEM_PROGRAMS = [];

function sanitize(str) {
  return String(str || '').replace(/[<>"'`;\\&\/]/g, '').trim().substring(0, 200);
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
window.esc = esc;

// --- 1. CLOUD BOOTLOADER ---
window.initializeCloudPortal = async function() {
    try {
        let stuRes = await fetch(scriptURL + "?action=load");
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
            window.SYSTEM_PROGRAMS = [{ batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }, { batch: "2024", program: "B.C.A" }];
        }

        let curRes = await fetch(scriptURL + "?action=getCurriculum");
        let curText = await curRes.text();
        if (curText && curText.trim().startsWith("{")) {
            let parsed = JSON.parse(curText);
            window.CURRICULUM_RULES = parsed.rules || parsed;
            if (parsed.courses) window.CUSTOM_COURSE_DICT = parsed.courses;
        }
    } catch (err) {
        console.warn("Cloud sync warning:", err);
    }

    if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
    if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
    if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
};

// --- 2. FACULTY DIRECTORY & FILTERS FIX ---
window.renderFacultyPortal = async function(email) {
    let facultyDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section');
    if (!facultyDash) return;

    facultyDash.style.position = 'relative';
    facultyDash.style.top = '0';
    facultyDash.style.left = '0';
    facultyDash.style.width = '100%';
    facultyDash.style.height = 'auto';
    facultyDash.style.minHeight = '100vh';
    facultyDash.style.background = '#f8fafc';
    document.body.style.overflow = 'auto';

    if (window.STUDENTS.length === 0) {
        await window.initializeCloudPortal();
    }
    window.facultyFilterAndSort();
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
    renderStudentTable(filtered);
};

window.facultyViewAll = async function() {
    if (window.STUDENTS.length === 0) await window.initializeCloudPortal();
    window.RENDERED_STUDENTS = window.STUDENTS;
    renderStudentTable(window.STUDENTS);
};

function renderStudentTable(students) {
    var tbody = document.getElementById('faculty-dir-tbody') || document.querySelector('#faculty-dash tbody') || document.querySelector('table tbody');
    var badge = document.querySelector('#faculty-dash .badge') || document.getElementById('faculty-dir-badge');
    
    if (badge) badge.textContent = `${students.length} students`;
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#64748b;">No matching student records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = students.map(s => {
        let activeBacklogs = window.getActiveBacklogs ? window.getActiveBacklogs(s.courses).length : 0;
        return `
        <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:12px; font-weight:bold;">${esc(s.sen)}</td>
            <td style="padding:12px;">${esc(s.name)}</td>
            <td style="padding:12px; font-weight:bold; color:#3b82f6;">${s.cgpa || 'N/A'}</td>
            <td style="padding:12px; font-weight:bold;">${s.totalCredits || '0'}</td>
            <td style="padding:12px;"><span style="padding:4px 8px; border-radius:4px; font-weight:bold; background:${activeBacklogs > 0 ? '#fee2e2' : '#dcfce3'}; color:${activeBacklogs > 0 ? '#dc2626' : '#16a34a'};">${activeBacklogs}</span></td>
            <td style="padding:12px;"><button style="background:#0ea5e9; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;" onclick="openFacultyStudentView('${esc(s.sen)}')">Details</button></td>
        </tr>`;
    }).join('');
}

window.getActiveBacklogs = function(courses) {
    let history = {};
    (courses || []).forEach(c => {
        if (!c.code || c.code === 'NAN') return;
        let code = String(c.code).toUpperCase().trim();
        if (!history[code]) history[code] = { passed: false, latest: c };
        let isFail = ['F', 'AB', 'DE', 'I', 'U'].includes(String(c.grade).toUpperCase().trim());
        if (!isFail) history[code].passed = true;
        else if (!history[code].passed) history[code].latest = c;
    });
    let backlogs = [];
    for (let code in history) {
        if (!history[code].passed) backlogs.push(history[code].latest);
    }
    return backlogs;
};

// --- 3. STUDENT PORTAL TABS (Degree Audit & Backlogs) ---
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
    let validCourses = (student.courses || []).filter(c => c && c.code && c.code !== 'NAN');
    let activeBacklogs = window.getActiveBacklogs(validCourses);

    document.querySelectorAll('#dash-name, .student-name').forEach(el => el.textContent = `${name} (${sen})`);
    document.querySelectorAll('#dash-cgpa, .cgpa-val').forEach(el => el.textContent = cgpa);
    document.querySelectorAll('#dash-ce, .credits-val').forEach(el => el.textContent = credits);

    // Inject Tab Navigation for Student Portal (All Courses, Active Backlogs, Degree Audit)
    let tableContainer = document.getElementById('courses-tbody') || document.querySelector('table tbody');
    if (tableContainer) tableContainer = tableContainer.closest('table').parentElement;

    if (tableContainer && !document.getElementById('student-tab-nav')) {
        let tabNav = document.createElement('div');
        tabNav.id = 'student-tab-nav';
        tabNav.style.cssText = 'display:flex; gap:10px; margin:20px 0 15px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px;';
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
            <button onclick="window.switchStudentTab('backlogs')" id="btn-stu-backlogs" style="padding:8px 16px; border:none; background:#f1f5f9; color:#475569; border-radius:6px; font-weight:bold; cursor:pointer;">⚠️ Active Backlogs (${activeBacklogs.length})</button>
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
        backlogsTbody.innerHTML = activeBacklogs.length > 0 ? activeBacklogs.map(c => `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px; font-weight:bold;">${esc(c.code)}</td>
                <td style="padding:10px;">${esc(c.name)}</td>
                <td style="padding:10px;">${esc(c.type || 'Core')}</td>
                <td style="padding:10px;">${esc(c.credits)}</td>
                <td style="padding:10px;">${esc(c.marks)}</td>
                <td style="padding:10px; font-weight:bold; color:#dc2626;">${esc(c.grade)}</td>
            </tr>
        `).join('') : `<tr><td colspan="6" style="text-align:center; padding:20px; color:#16a34a; font-weight:bold;">🎉 Excellent! You have no active backlogs.</td></tr>`;
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
            el.onclick = function() { window.logoutPortal(); };
        }
    });
};

// --- 4. ADMIN CURRICULUM MANAGER (Table Structure, Rename & Edit Credits) ---
window.loadCurriculumEditor = function() {
    const dropdown = document.getElementById('curriculum-edit-key') || document.querySelector('select[id*="curr"]');
    const container = document.getElementById('curriculum-gui-container') || document.querySelector('.curriculum-container') || document.getElementById('tab-curriculum');
    
    let sysProgs = window.SYSTEM_PROGRAMS.length > 0 ? window.SYSTEM_PROGRAMS : [{ batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }];

    if (dropdown && dropdown.options.length <= 1) {
        dropdown.innerHTML = sysProgs.map(p => {
            let key = `${p.batch}_${p.program}`;
            return `<option value="${key}">${p.batch} ${p.program}</option>`;
        }).join('');
    }

    window.triggerLoadCurriculum = function() {
        let selectedKey = dropdown ? dropdown.value : "2024_MCA";
        window.currentEditingKey = selectedKey;
        
        let rules = window.CURRICULUM_RULES[selectedKey] || [
            { category: "1. School Core", minCredits: 10, subCategories: [{ name: "General", minCredits: 10, codes: ["ENG5001"] }] }
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
                                <th style="padding:8px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(sub.codes || []).map((code, cIdx) => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:8px; font-weight:bold; color:#0f172a;">${esc(code)}</td>
                                <td style="padding:8px;"><button onclick="window.adminRemoveCourse('${selectedKey}',${mIdx}, ${sIdx},${cIdx})" style="background:#ef4444; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">Remove</button></td>
                            </tr>`).join('')}
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

    document.querySelectorAll('button').forEach(b => {
        if (b.textContent.trim().toUpperCase() === 'LOAD CURRICULUM') {
            b.onclick = function(e) {
                e.preventDefault();
                window.triggerLoadCurriculum();
            };
        }
    });
};

window.adminRenameMainCat = function(mIdx) {
    let key = window.currentEditingKey || "2024_MCA";
    let newName = prompt("Enter new Main Category name:");
    if (newName) {
        window.CURRICULUM_RULES[key][mIdx].category = newName;
        localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(window.CURRICULUM_RULES));
        window.triggerLoadCurriculum();
    }
};

window.adminEditMainCreds = function(mIdx) {
    let key = window.currentEditingKey || "2024_MCA";
    let creds = prompt("Enter minimum credits for this category:");
    if (creds !== null && !isNaN(creds)) {
        window.CURRICULUM_RULES[key][mIdx].minCredits = parseFloat(creds);
        localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(window.CURRICULUM_RULES));
        window.triggerLoadCurriculum();
    }
};

window.adminRenameSubCat = function(mIdx, sIdx) {
    let key = window.currentEditingKey || "2024_MCA";
    let newName = prompt("Enter new Sub-Category name:");
    if (newName) {
        window.CURRICULUM_RULES[key][mIdx].subCategories[sIdx].name = newName;
        localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(window.CURRICULUM_RULES));
        window.triggerLoadCurriculum();
    }
};

window.adminEditSubCreds = function(mIdx, sIdx) {
    let key = window.currentEditingKey || "2024_MCA";
    let creds = prompt("Enter minimum credits for this sub-category:");
    if (creds !== null && !isNaN(creds)) {
        window.CURRICULUM_RULES[key][mIdx].subCategories[sIdx].minCredits = parseFloat(creds);
        localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(window.CURRICULUM_RULES));
        window.triggerLoadCurriculum();
    }
};

window.adminAddCourse = function(key, mIdx, sIdx) {
    let code = prompt("Enter Course Code (e.g., CSE5001):");
    if (code) {
        let clean = code.toUpperCase().trim();
        if (!window.CURRICULUM_RULES[key][mIdx].subCategories[sIdx].codes.includes(clean)) {
            window.CURRICULUM_RULES[key][mIdx].subCategories[sIdx].codes.push(clean);
            localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(window.CURRICULUM_RULES));
            window.triggerLoadCurriculum();
        }
    }
};

window.adminRemoveCourse = function(key, mIdx, sIdx, cIdx) {
    if (confirm("Remove this course code?")) {
        window.CURRICULUM_RULES[key][mIdx].subCategories[sIdx].codes.splice(cIdx, 1);
        localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(window.CURRICULUM_RULES));
        window.triggerLoadCurriculum();
    }
};

// --- 5. GLOBAL PDF EXPORT UTILITY ---
window.exportStudentPDF = function() {
    if (!window.jspdf || !window.jspdf.jsPDF) { alert("PDF library loading..."); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Amity University - Student Grade Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Student: ${window.currentStudent?.name || 'N/A'} (${window.currentStudent?.sen || 'N/A'})`, 14, 28);
    doc.text(`CGPA: ${window.currentStudent?.cgpa || 'N/A'} | Credits Earned: ${window.currentStudent?.totalCredits || '0'}`, 14, 34);

    let bodyData = (window.currentStudent?.courses || []).map(c => [c.code, c.name, c.type, c.credits, c.marks, c.grade]);
    doc.autoTable({
        startY: 40,
        head: [['Code', 'Course Title', 'Type', 'Cr.', 'Marks', 'Grade']],
        body: bodyData,
        theme: 'grid'
    });
    doc.save(`${window.currentStudent?.sen || 'Student'}_Report.pdf`);
};

window.logoutPortal = function() {
    sessionStorage.clear();
    localStorage.clear();
    document.body.classList.remove('overlay-active');
    window.location.href = window.location.pathname;
};

document.addEventListener('DOMContentLoaded', () => {
    window.initializeCloudPortal();
});