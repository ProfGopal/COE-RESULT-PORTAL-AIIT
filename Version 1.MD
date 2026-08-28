```python
# Analyzing user requirements for Ver 1.6 / Ver 18.0:
# 1. Admin Panel Filter: Fix filtering and dropdown selection so filtering by batch, program, credits, and search works smoothly.
# 2. Admin Panel Export: Provide Export PDF and Export Excel buttons across all admin screens and individual student details views.
# 3. Faculty Portal Dropdown Filter: Fix filter dropdowns (years/programs) in faculty login.
# 4. Faculty Portal Navigation: Add a clear "← Back to Directory" button when viewing individual student profiles in the faculty portal instead of only having logout.
# 5. Faculty Portal Navigation & Curriculum View: In the faculty login, keep buttons for Student Results and Curriculum View. In Curriculum View, display all batch and programs updated in admin login in a read-only mode with download options.

print("Designing Ver 1.6 Comprehensive Admin Filters, Faculty Navigation & Curriculum View Suite")


```

```text
Designing Ver 1.6 Comprehensive Admin Filters, Faculty Navigation & Curriculum View Suite


```

# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 1.6 (Admin Filters, Faculty Back Navigation & Curriculum Viewer Suite)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are fixing the **Admin panel filters** (batch, program, and credits search), adding **Export PDF and Excel** buttons to all admin screens and individual student profile views, fixing the **Faculty portal filter dropdowns**, adding a **"← Back to Directory"** button on individual student views in the faculty portal, and implementing the **Faculty Curriculum Viewer** displaying all cloud-synced batches and programs in read-only mode with download options.

Please execute the following strict updates:

## 1. Global Versioning Update

* **File:** `index.html`, `admin-hidden.html`
* Change all version tags in the top left corners to **Ver 1.6**.



## 2. Complete Unified Frontend Engine (`script.js`)

* **File:** `script.js`
* Replace your filter handlers, student view navigation, export utilities, and faculty curriculum viewer with this complete version:



```javascript
/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 1.6 - Admin Filters, Faculty Navigation & Curriculum Viewer Suite)
 */

'use strict';

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";

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

    if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
    if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
    if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
};

// --- 2. ADMIN FILTERS & EXPORT UTILITIES ---
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
        let keys = Object.keys(window.CURRICULUM_RULES || {});
        if (keys.length === 0) keys = ["2024_MCA"];

        let html = `<div style="background:white; padding:20px; border-radius:8px; border:1px solid #cbd5e1;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; color:#0f172a;">📚 Official Curriculum Viewer (Read-Only)</h3>
                <button onclick="window.exportCurriculumJSON()" style="background:#10b981; color:white; border:none; padding:6px 14px; border-radius:6px; font-weight:bold; cursor:pointer;">📥 Download Curriculum</button>
            </div>`;

        keys.forEach(k => {
            html += `<div style="margin-bottom:20px; border:1px solid #cbd5e1; border-radius:6px; padding:15px; background:#f8fafc;">
                <h4 style="color:#2563eb; margin-top:0;">Program/Batch: ${k.replace('_', ' ')}</h4>`;
            (window.CURRICULUM_RULES[k] || []).forEach(main => {
                html += `<div style="margin-bottom:12px;"><strong style="color:#1e293b;">📁 ${esc(main.category)} (Min Credits: ${main.minCredits})</strong>`;
                (main.subCategories || []).forEach(sub => {
                    html += `<div style="margin-left:15px; color:#475569; font-size:0.9rem; margin-top:4px;">• <strong>${esc(sub.name)}</strong> (Min: ${sub.minCredits} Cr) — Courses: ${(sub.codes || []).join(', ')}</div>`;
                });
                html += `</div>`;
            });
            html += `</div>`;
        });
        html += `</div>`;
        area.innerHTML = html;
    }
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

    // Inject "← Back to Directory" button into student dashboard view
    setTimeout(() => {
        let dash = document.getElementById('student-dash') || document.getElementById('student-dashboard');
        if (dash && !document.getElementById('back-to-directory-btn')) {
            let topBar = dash.querySelector('div') || dash;
            let backBtn = document.createElement('button');
            backBtn.id = 'back-to-directory-btn';
            backBtn.innerHTML = '← Back to Directory';
            backBtn.style.cssText = 'margin-bottom:15px; background:#475569; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer; display:inline-block;';
            backBtn.onclick = function() {
                dash.style.display = 'none';
                if (typeof window.renderFacultyPortal === 'function') window.renderFacultyPortal();
            };
            topBar.insertBefore(backBtn, topBar.firstChild);
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

```

## 3. Create `VERSION1.6.md`

* Create a file named `VERSION1.6.md` in your project root containing the release notes for Ver 1.6.