```python
# Analyzing requirements for Ver 1.7 / Ver 19.0:
# 1. Faculty Portal Curriculum Viewer: Match the admin panel format exactly—displaying Main Category, Sub-Category, Course Code, Course Name, and Credits in a clean table structure (read-only for faculty).
# 2. Add a dropdown in the faculty curriculum viewer to select the year/batch and program (e.g., 2024 MCA), exactly like the admin panel.
# 3. Add a "Download PDF" option for the faculty curriculum view (using jsPDF and autoTable).
# 4. Fix the "← Back to Directory" button in the faculty portal student details view so it properly re-renders the directory table instead of failing.

print("Designing Ver 1.7 Master Faculty Curriculum Table Viewer & Navigation Repair")


```

```text
Designing Ver 1.7 Master Faculty Curriculum Table Viewer & Navigation Repair


```

# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 1.7 (Faculty Curriculum Table Viewer & Navigation Fix)

You are updating a static GitHub Pages site (`script.js`). We are rebuilding the **Faculty Curriculum Viewer** to match the admin table format (Main Category, Sub-Category, Course Code, Course Name, and Credits), adding a batch/program dropdown selector, adding a **"Download PDF"** export button, and fixing the **"← Back to Directory"** navigation handler when viewing individual student profiles in the faculty portal, updating version tags to **Ver 1.7**, and creating `VERSION17.1.md`.

Please execute the following strict updates:

## 1. Global Versioning Update

* **File:** `index.html`, `admin-hidden.html`
* Change all version tags in the top left corners to **Ver 1.7**.



## 2. Faculty Curriculum Table & Navigation Repair Engine (`script.js`)

* **File:** `script.js`
* Replace your faculty curriculum tab renderer, course lookup helper, and student profile back navigation with this polished version:



```javascript
/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 1.7 - Faculty Curriculum Table & Navigation Fix)
 */

'use strict';

// --- 1. COURSE INFO HELPER ---
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

// --- 2. FACULTY CURRICULUM TAB VIEWER (Matching Admin Table Format & Dropdown) ---
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
        let defaultKey = `${sysProgs[0].batch}_${sysProgs[0].program}`;

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

// --- 3. BACK TO DIRECTORY NAVIGATION FIX ---
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

```

## 3. Create `VERSION17.1.md`

* Create a file named `VERSION17.1.md` in your project root containing the release notes for Ver 1.7.