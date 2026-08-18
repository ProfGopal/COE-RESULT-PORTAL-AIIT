# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 3.3 (UG = 3 CAs & PG = 2 CAs Structuring)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`). We are reconfiguring undergraduate programs to use 3 CAs and postgraduate programs to use 2 CAs across the course assignments, deadline manager, faculty task lists, and audit matrix.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `admin-hidden.html` & `index.html`
  * Change all version tags in the top left corners to `Ver 3.3`.

## 2. Reconfigure CA Count Mappings (UG = 3 CAs, PG = 2 CAs)
* **File:** `script.js` & `admin-hidden.html`
  * Update the CA count dropdown and parsing logic so **UG = 3 CAs** and **PG = 2 CAs**:

    ```javascript
    // In Admin Course Assignment form HTML:
    // <select id="admin-ca-count-select">
    //     <option value="3">UG - 3 CAs</option>
    //     <option value="2">PG - 2 CAs</option>
    // </select>

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

## 3. Faculty Portal Task Rendering (UG = 3 CAs, PG = 2 CAs)
* **File:** `script.js`
  * Ensure the faculty coursework portal renders 3 CAs for UG courses and 2 CAs for PG courses correctly based on the assigned CA count.