# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 3.4 (UG 3-CA Deadlines & Faculty Read-Only Curriculum Viewer)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`). We are correcting the UG deadline manager to render 3 CAs and PG to render 2 CAs, adding a read-only curriculum viewer with batch/program filters in the Faculty Portal, and setting version strictly to Ver 3.4.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `admin-hidden.html` & `index.html`
  * Change all version tags in the top left corners to `Ver 3.4`.

## 2. Correct Deadline Manager Sections (UG = 3 CAs, PG = 2 CAs)
* **File:** `script.js`
  * Ensure `renderAdminDeadlinesPanel` loops through 3 CAs for UG and 2 CAs for PG:

    ```javascript
    window.renderAdminDeadlinesPanel = function() {
        let container = document.getElementById('admin-deadlines-container');
        if (!container) return;

        let semesters = [];
        try { semesters = JSON.parse(localStorage.getItem('AIIT_SEMESTERS')) || ["Semester 1", "Semester 2"]; } catch(e){}
        let currentSem = document.getElementById('deadline-semester-select') ? document.getElementById('deadline-semester-select').value : semesters[0];

        let allDeadlines = {};
        try { allDeadlines = JSON.parse(localStorage.getItem('AIIT_SEMESTERS_DEADLINES')) || {}; } catch(e){}
        let deadlines = allDeadlines[currentSem] || {};

        let renderSection = (title, prefix, count) => {
            let html = `<div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:15px; margin-bottom:15px;">
                <h4 style="margin:0 0 10px 0; color:#1e293b;">📌 ${title} Deadlines (${currentSem})</h4>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">`;
            
            for(let i=1; i<=count; i++) {
                html += `
                <div>
                    <label style="font-size:0.85rem; font-weight:bold;">CA ${i} QP to COE:</label>
                    <input type="datetime-local" id="${prefix}_ca${i}_qp" value="${deadlines[`${prefix}_ca${i}_qp`] || ''}" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:4px;">
                </div>
                <div>
                    <label style="font-size:0.85rem; font-weight:bold;">CA ${i} Scrutiny Done:</label>
                    <input type="datetime-local" id="${prefix}_ca${i}_scrutiny" value="${deadlines[`${prefix}_ca${i}_scrutiny`] || ''}" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:4px;">
                </div>
                <div>
                    <label style="font-size:0.85rem; font-weight:bold;">CA ${i} Marks Submitted:</label>
                    <input type="datetime-local" id="${prefix}_ca${i}_marks" value="${deadlines[`${prefix}_ca${i}_marks`] || ''}" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:4px;">
                </div>`;
            }

            html += `
                <div>
                    <label style="font-size:0.85rem; font-weight:bold;">Internal Marks:</label>
                    <input type="datetime-local" id="${prefix}_internal_marks" value="${deadlines[`${prefix}_internal_marks`] || ''}" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:4px;">
                </div>
                <div>
                    <label style="font-size:0.85rem; font-weight:bold;">Lab Internal Marks:</label>
                    <input type="datetime-local" id="${prefix}_lab_internal" value="${deadlines[`${prefix}_lab_internal`] || ''}" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:4px;">
                </div>
            </div></div>`;
            return html;
        };

        container.innerHTML = `
            <div style="background:white; border:1px solid #cbd5e1; border-radius:8px; padding:20px; margin-top:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
                    <h3 style="margin:0; color:#0f172a;">⏰ Global Submission Deadline Manager</h3>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <label style="font-weight:bold; font-size:0.9rem;">Select Semester:</label>
                        <select id="deadline-semester-select" onchange="window.renderAdminDeadlinesPanel()" style="padding:6px 12px; border:1px solid #cbd5e1; border-radius:6px; font-weight:bold;">
                            ${semesters.map(s => `<option value="${s}" ${currentSem===s?'selected':''}>${s}</option>`).join('')}
                        </select>
                    </div>
                </div>
                ${renderSection('UG Programs (3 CAs)', 'ug', 3)}
                ${renderSection('PG Programs (2 CAs)', 'pg', 2)}
                <div style="text-align:right; margin-top:15px;">
                    <button onclick="window.saveSemesterDeadlines('${currentSem}')" style="background:#10b981; color:white; border:none; padding:10px 20px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:1rem;">💾 Save Deadlines for ${currentSem}</button>
                </div>
            </div>
        `;
    };
    ```

## 3. Faculty Read-Only Curriculum Viewer
* **File:** `script.js`
  * Add a read-only curriculum tab to the Faculty Portal with Batch and Program filters:

    ```javascript
    window.renderFacultyCurriculumViewer = function(container) {
        let rules = {};
        try { rules = JSON.parse(localStorage.getItem('AIIT_CUSTOM_CURRICULUM')) || window.CURRICULUM_RULES || {}; } catch(e){}

        let keys = Object.keys(rules);
        let selectedKey = document.getElementById('fac-curr-select') ? document.getElementById('fac-curr-select').value : keys[0];

        let currentRules = rules[selectedKey] || [];
        let rulesHTML = "";

        currentRules.forEach(main => {
            let subs = main.subCategories || [];
            let subHTML = "";
            subs.forEach(sub => {
                let codes = sub.codes || [];
                subHTML += `<div style="background:#f8fafc; padding:10px; border-radius:6px; margin-bottom:8px; border:1px solid #e2e8f0;">
                    <h5 style="margin:0 0 5px 0; color:#334155;">📄 ${esc(sub.name)} (Min Credits: ${sub.minCredits || 0})</h5>
                    <div style="font-size:0.85rem; color:#64748b;">Courses: ${codes.map(c => `<span style="background:white; border:1px solid #cbd5e1; padding:2px 6px; border-radius:4px; margin-right:4px; display:inline-block; font-weight:bold; color:#0f172a;">${esc(c)}</span>`).join('')}</div>
                </div>`;
            });

            rulesHTML += `<div style="background:white; border:1px solid #cbd5e1; border-radius:8px; padding:15px; margin-bottom:15px;">
                <h4 style="margin:0 0 10px 0; color:#0f172a;">📂 ${esc(main.category)} (Required: ${main.minCredits || 0} Credits)</h4>
                ${subHTML}
            </div>`;
        });

        container.innerHTML = `
            <div style="background:white; padding:20px; border-radius:8px; border:1px solid #cbd5e1;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
                    <h3 style="margin:0; color:#0f172a;">📚 Official Curriculum Viewer (Read-Only)</h3>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <label style="font-weight:bold; font-size:0.9rem;">Select Batch & Program:</label>
                        <select id="fac-curr-select" onchange="window.renderFacultyCurriculumTab()" style="padding:6px 12px; border:1px solid #cbd5e1; border-radius:6px; font-weight:bold;">
                            ${keys.map(k => `<option value="${k}" ${selectedKey===k?'selected':''}>${k}</option>`).join('')}
                        </select>
                    </div>
                </div>
                ${rulesHTML || `<p style="text-align:center; color:#64748b; padding:20px;">No curriculum rules mapped for this selection.</p>`}
            </div>`;
    };
    ```

## 4. Markdown Release Document (`VERSION3.4.md`)
* Create a file named `VERSION3.4.md` in your project root with the release notes for Ver 3.4.