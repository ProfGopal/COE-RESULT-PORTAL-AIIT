# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 1.7.1 (Faculty Curriculum Dropdown & Clean Table Viewer)

You are updating a static GitHub Pages site (`script.js`). Looking at your screenshot (`image_e89d2ff.jpg`), the faculty curriculum tab is currently rendering all programs stacked together as raw text bullets instead of a **clean table structure** with a **batch/program dropdown selector** (just like the admin panel).

Here is the master repair to ensure the faculty curriculum viewer displays **only the selected year/batch and program**, structured in a **clean table** with Main Category, Sub-Category, Course Code, Course Name, and Credits, with a PDF download option.

---

### 📋 Copy this entire block and paste it into Antigravity IDE (`script.js`):

```javascript
/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 1.7.1 - Faculty Curriculum Table & Dropdown Filter)
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

// --- 2. FACULTY CURRICULUM TAB VIEWER (Dropdown & Clean Table Structure) ---
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
            <div style="background:white; padding:25px; border-radius:8px; border:1px solid #cbd5e1; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:15px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <label style="font-weight:bold; color:#1e293b;">Select Batch & Program:</label>
                        <select id="faculty-curr-select" onchange="window.renderFacultyCurriculumTable()" style="padding:8px 14px; border:1px solid #cbd5e1; border-radius:6px; font-weight:bold; background:#f8fafc;">
                            ${sysProgs.map(p => `<option value="${p.batch}_${p.program}">${p.batch} ${p.program}</option>`).join('')}
                        </select>
                    </div>
                    <button onclick="window.exportFacultyCurriculumPDF()" style="background:#dc2626; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">📄 Download Curriculum PDF</button>
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
        container.innerHTML = `<p style="color:#64748b; text-align:center; padding:30px;">No curriculum rules found for ${selectedKey.replace('_', ' ')}.</p>`;
        return;
    }

    let html = `<h4 style="color:#0f172a; margin-top:0; margin-bottom:20px;">📋 Curriculum Table: <span style="color:#2563eb;">${selectedKey.replace('_', ' ')}</span></h4>`;

    rules.forEach((main) => {
        html += `
        <div style="margin-bottom:25px; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; background:white;">
            <div style="background:#f8fafc; padding:14px 18px; border-bottom:1px solid #cbd5e1; display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:#1e293b; font-size:1.1rem;">📁 ${esc(main.category)}</strong>
                <span style="background:#e0f2fe; color:#0369a1; padding:3px 10px; border-radius:4px; font-weight:bold; font-size:0.85rem;">Min Credits: ${main.minCredits}</span>
            </div>`;

        (main.subCategories || []).forEach((sub) => {
            html += `
            <div style="padding:15px; background:white; border-bottom:1px solid #e2e8f0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <span style="font-weight:bold; color:#334155; font-size:0.95rem;">📄 Sub-Category: ${esc(sub.name)}</span>
                    <span style="color:#64748b; font-size:0.85rem; font-weight:bold;">Min Credits: ${sub.minCredits} Cr</span>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                    <thead>
                        <tr style="background:#f1f5f9; color:#475569; text-align:left;">
                            <th style="padding:9px 12px; border-bottom:1px solid #cbd5e1;">Course Code</th>
                            <th style="padding:9px 12px; border-bottom:1px solid #cbd5e1;">Course Name</th>
                            <th style="padding:9px 12px; border-bottom:1px solid #cbd5e1; text-align:right;">Credits</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(sub.codes || []).length > 0 ? (sub.codes || []).map((code) => {
                            let info = window.getCourseInfo(code);
                            return `
                            <tr style="border-bottom:1px solid #f8fafc;">
                                <td style="padding:9px 12px; font-weight:bold; color:#0f172a;">${esc(code)}</td>
                                <td style="padding:9px 12px; color:#334155;">${esc(info.name)}</td>
                                <td style="padding:9px 12px; text-align:right; font-weight:bold; color:#2563eb;">${info.credits} Cr</td>
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

```