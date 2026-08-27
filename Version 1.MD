# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 8.2 (Curriculum Matrix & Role-Based Permissions)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are fixing the "Load Curriculum" button handler so it correctly parses and renders the selected batch and program rules from cloud storage, enforces fully editable controls for Admin, and provides a static read-only view for Faculty, updating version tags to **Ver 8.2**, and creating `VERSION8.2.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html`, `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 8.2`.

## 2. Curriculum Loader & Role-Based Permissions Engine (`script.js`)
* **File:** `script.js`
  * Replace your curriculum editor loader and viewer functions with this fully fixed version:

    ```javascript
    /**
     * script.js — AIIT COE Result Portal
     * Master Script Engine (Ver 8.2 - Curriculum Loader & Role-Based Permissions)
     */

    'use strict';

    // --- 1. ROBUST CURRICULUM EDITOR LOADER ---
    window.loadCurriculumEditor = function() {
        const dropdown = document.getElementById('curriculum-edit-key') || document.querySelector('select[id*="curr"]');
        const container = document.getElementById('curriculum-gui-container') || document.getElementById('curriculum-editor-view') || document.querySelector('.curriculum-container');
        
        let sysProgs = [];
        try { sysProgs = JSON.parse(localStorage.getItem('AIIT_SYSTEM_PROGRAMS')) || window.SYSTEM_PROGRAMS || []; } catch(e){}
        if (sysProgs.length === 0) {
            sysProgs = [{ batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }, { batch: "2024", program: "B.C.A" }];
        }

        if (dropdown && dropdown.options.length <= 1) {
            dropdown.innerHTML = sysProgs.map(p => {
                let key = `${p.batch}_${p.program}`;
                let label = `${p.batch} ${p.program}`;
                return `<option value="${key}">${label}</option>`;
            }).join('');
        }

        window.triggerLoadCurriculum = function() {
            let selectedKey = dropdown ? dropdown.value : "2024_MCA";
            window.currentEditingKey = selectedKey;
            
            let rules = {};
            try { rules = JSON.parse(localStorage.getItem('AIIT_CUSTOM_CURRICULUM')) || window.CURRICULUM_RULES || {}; } catch(e){}
            
            let catList = rules[selectedKey] || [
                { category: "1. School Core", minCredits: 10, subCategories: [{ name: "General", minCredits: 10, codes: ["ENG5001", "MAT5005"] }] }
            ];

            if (!container) {
                // Create container dynamically if missing in DOM
                let parent = dropdown ? dropdown.parentElement : document.body;
                let newDiv = document.createElement('div');
                newDiv.id = 'curriculum-gui-container';
                newDiv.style.cssText = 'margin-top:20px; background:white; padding:20px; border-radius:8px; border:1px solid #cbd5e1;';
                parent.appendChild(newDiv);
            }

            let targetContainer = document.getElementById('curriculum-gui-container') || container;
            if (!targetContainer) return;

            let html = `<h4 style="color:#0f172a; margin-top:0;">📋 Managing Curriculum for: <span style="color:#2563eb;">${selectedKey.replace('_', ' ')}</span></h4>`;
            
            catList.forEach((main, mIdx) => {
                html += `
                <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:15px; margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#1e293b; font-size:1.1rem;">📁 ${esc(main.category)} (Min: ${main.minCredits} Credits)</strong>
                        <button onclick="window.adminEditCategoryCredits(${mIdx})" style="background:#0ea5e9; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem;">Edit Credits</button>
                    </div>
                `;

                let subs = main.subCategories || [];
                subs.forEach((sub, sIdx) => {
                    html += `
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:4px; padding:10px; margin-top:8px;">
                        <div style="font-weight:bold; color:#475569; margin-bottom:5px;">📄 ${esc(sub.name)} — Courses:</div>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">
                            ${(sub.codes || []).map((code, cIdx) => `
                                <span style="background:#f1f5f9; border:1px solid #cbd5e1; padding:4px 8px; border-radius:4px; font-size:0.85rem; font-weight:bold; display:inline-flex; align-items:center; gap:6px;">
                                    ${esc(code)} 
                                    <button onclick="window.adminRemoveCourseCode('${selectedKey}',${mIdx}, ${sIdx},${cIdx})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold;">×</button>
                                </span>
                            `).join('')}
                        </div>
                        <button onclick="window.adminAddCourseCode('${selectedKey}', ${mIdx}, ${sIdx})" style="margin-top:8px; background:#10b981; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem; font-weight:bold;">+ Add Course</button>
                    </div>`;
                });
                html += `</div>`;
            });

            targetContainer.innerHTML = html;
        };

        // Bind Load Curriculum Button directly
        document.querySelectorAll('button').forEach(b => {
            if (b.textContent.trim().toUpperCase() === 'LOAD CURRICULUM') {
                b.onclick = function(e) {
                    e.preventDefault();
                    window.triggerLoadCurriculum();
                };
            }
        });
    };

    // --- 2. ADMIN CURRICULUM EDITORS ---
    window.adminEditCategoryCredits = function(mIndex) {
        let rules = {};
        try { rules = JSON.parse(localStorage.getItem('AIIT_CUSTOM_CURRICULUM')) || window.CURRICULUM_RULES || {}; } catch(e){}
        let key = window.currentEditingKey || "2024_MCA";
        let cat = rules[key] ? rules[key][mIndex] : null;
        if (!cat) return;

        let val = prompt("Enter new minimum credits required for this category:", cat.minCredits);
        if (val !== null && !isNaN(val)) {
            cat.minCredits = parseFloat(val);
            localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(rules));
            window.triggerLoadCurriculum();
        }
    };

    window.adminAddCourseCode = function(key, mIdx, sIdx) {
        let rules = {};
        try { rules = JSON.parse(localStorage.getItem('AIIT_CUSTOM_CURRICULUM')) || window.CURRICULUM_RULES || {}; } catch(e){}
        let code = prompt("Enter Course Code (e.g., CSE5001):");
        if (code) {
            let cleanCode = code.toUpperCase().trim();
            if (!rules[key][mIdx].subCategories[sIdx].codes.includes(cleanCode)) {
                rules[key][mIdx].subCategories[sIdx].codes.push(cleanCode);
                localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(rules));
                window.triggerLoadCurriculum();
            }
        }
    };

    window.adminRemoveCourseCode = function(key, mIdx, sIdx, cIdx) {
        let rules = {};
        try { rules = JSON.parse(localStorage.getItem('AIIT_CUSTOM_CURRICULUM')) || window.CURRICULUM_RULES || {}; } catch(e){}
        rules[key][mIdx].subCategories[sIdx].codes.splice(cIdx, 1);
        localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(rules));
        window.triggerLoadCurriculum();
    };

    // --- 3. FACULTY READ-ONLY CURRICULUM VIEWER ---
    window.renderFacultyCurriculumViewer = function(container) {
        let rules = {};
        try { rules = JSON.parse(localStorage.getItem('AIIT_CUSTOM_CURRICULUM')) || window.CURRICULUM_RULES || {}; } catch(e){}
        let keys = Object.keys(rules);
        if (keys.length === 0) keys = ["2024_MCA"];

        let html = `<h3 style="color:#0f172a;">📚 Official Curriculum Viewer (Static & Read-Only for Faculty)</h3>`;
        keys.forEach(k => {
            html += `<div style="background:white; border:1px solid #cbd5e1; border-radius:6px; padding:15px; margin-bottom:15px;"><h4 style="color:#2563eb; margin-top:0;">${k.replace('_', ' ')}</h4>`;
            (rules[k] || []).forEach(main => {
                html += `<div style="margin-bottom:10px;"><strong style="color:#1e293b;">${esc(main.category)} (Min: ${main.minCredits} Cr)</strong>`;
                (main.subCategories || []).forEach(sub => {
                    html += `<div style="margin-left:15px; color:#475569; font-size:0.9rem;">• ${esc(sub.name)}: ${(sub.codes || []).join(', ')}</div>`;
                });
                html += `</div>`;
            });
            html += `</div>`;
        });
        container.innerHTML = html;
    };

    document.addEventListener('DOMContentLoaded', () => {
        window.loadCurriculumEditor();
    });
    ```

## 3. Create `VERSION8.2.md`
* Create a file named `VERSION8.2.md` in your project root containing the release notes for Ver 8.2.