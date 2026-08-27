# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 9.4 (Master Cloud Synchronization & Full Table Curriculum Editor)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`) and Google Apps Script (`Code.gs`). We are fixing the batch and program tags renderer (`renderSystemPrograms`), making the curriculum editor fully display structured sub-categories and course code tables directly in the UI with live editing, resetting, and bulk Excel uploading, ensuring student directories load correctly, updating version tags to **Ver 9.4**, and creating `VERSION9.4.md`.

Please execute the following strict updates:

## 1. Global Versioning Update

* **File:** `index.html`, `admin-hidden.html`
* Change all version tags in the top left corners to `Ver 9.4`.



## 2. Master Curriculum Table & System Setup Engine (`script.js`)

* **File:** `script.js`
* Replace your entire `script.js` file with this fully integrated, high-speed master engine:
```javascript
/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 9.4 - Master Cloud Sync & Full Table Curriculum Editor)
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

// --- 1. LIGHTNING-FAST CLOUD BOOTLOADER ---
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
        window.SYSTEM_PROGRAMS = [
            { batch: "2024", program: "MCA" }, 
            { batch: "2025", program: "MCA" }, 
            { batch: "2024", program: "B.C.A" }, 
            { batch: "2025", program: "B.C.A" }
        ];
    }

    if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
    if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
    if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
};

// --- 2. SYSTEM PROGRAMS RENDERER (Batches & Programs) ---
window.renderSystemPrograms = function() {
    let sysProgs = window.SYSTEM_PROGRAMS.length > 0 ? window.SYSTEM_PROGRAMS : [
        { batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }, { batch: "2024", program: "B.C.A" }
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

    // Populate curriculum dropdown with ALL available batches & programs
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

// --- 3. MASTER CURRICULUM TABLE EDITOR (Fully Detailed & Editable) ---
window.loadCurriculumEditor = function() {
    const dropdown = document.getElementById('curriculum-edit-key') || document.querySelector('select[id*="curr"]');
    const container = document.getElementById('curriculum-gui-container') || document.querySelector('.curriculum-container') || document.getElementById('tab-curriculum');

    let sysProgs = window.SYSTEM_PROGRAMS.length > 0 ? window.SYSTEM_PROGRAMS : [{ batch: "2024", program: "MCA" }];

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
            { 
                category: "1. School Core", 
                minCredits: 10, 
                subCategories: [
                    { name: "General Courses", minCredits: 10, codes: ["ENG5001", "MAT5005"] }
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
                                <th style="padding:8px; text-align:right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(sub.codes || []).length > 0 ? (sub.codes || []).map((code, cIdx) => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:8px; font-weight:bold; color:#0f172a;">${esc(code)}</td>
                                <td style="padding:8px; text-align:right;"><button onclick="window.adminRemoveCourse('${selectedKey}',${mIdx}, ${sIdx},${cIdx})" style="background:#ef4444; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">Remove</button></td>
                            </tr>`).join('') : `<tr><td colspan="2" style="padding:10px; color:#64748b; text-align:center;">No courses in this sub-category yet.</td></tr>`}
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
        let txt = b.textContent.trim().toUpperCase();
        if (txt === 'LOAD CURRICULUM') {
            b.onclick = function(e) {
                e.preventDefault();
                window.triggerLoadCurriculum();
            };
        } else if (txt.includes('RESET TO DEFAULT')) {
            b.onclick = function(e) {
                e.preventDefault();
                window.resetCurriculumEditor();
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

window.resetCurriculumEditor = function() {
    if (confirm("Reset curriculum rules to defaults?")) {
        localStorage.removeItem('AIIT_CUSTOM_CURRICULUM');
        window.CURRICULUM_RULES = {};
        window.loadCurriculumEditor();
        alert("Curriculum reset successfully.");
    }
};

// --- 4. ADMIN STUDENT DIRECTORY (Enrolled Students Count Fix) ---
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

document.addEventListener('DOMContentLoaded', () => {
    window.initializeCloudPortal();
});

```





## 3. Create `VERSION9.4.md`

* Create a file named `VERSION9.4.md` in your project root containing the release notes for Ver 9.4.

```

```