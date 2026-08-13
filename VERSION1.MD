# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 3.1 (Semester Creator, Semester-Bound Deadlines & Auto-Reminders)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`). We are adding a Semester Creator, a semester selector for faculty course assignments, semester-specific deadline management with a persistent save button, and the automated reminder dispatch engine.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `admin-hidden.html` & `index.html`
  * Change all version tags in the top left corners to `Ver 3.1`.

## 2. Semester Creator & Assignment Integration
* **File:** `admin-hidden.html` & `script.js`
  * Add the Semester Creator manager above Section 4, and include the semester dropdown in course assignments:

    ```javascript
    window.renderSemesterManager = function() {
        let container = document.getElementById('admin-semester-manager-container');
        if (!container) return;

        let semesters = [];
        try { semesters = JSON.parse(localStorage.getItem('AIIT_SEMESTERS')) || ["Semester 1", "Semester 2", "Semester 3", "Semester 4"]; } catch(e){}

        container.innerHTML = `
            <div style="background:white; border:1px solid #cbd5e1; border-radius:8px; padding:20px; margin-bottom:20px;">
                <h3 style="margin-top:0; color:#0f172a;">📅 Semester Management</h3>
                <div style="display:flex; gap:10px; margin-bottom:15px;">
                    <input type="text" id="new-semester-input" placeholder="e.g. Odd Semester 2026" style="flex:1; padding:8px; border:1px solid #cbd5e1; border-radius:6px;">
                    <button onclick="window.addSemester()" style="background:#0284c7; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">+ Add Semester</button>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                    ${semesters.map(s => `<span style="background:#f1f5f9; border:1px solid #cbd5e1; padding:6px 12px; border-radius:6px; font-weight:bold; display:flex; align-items:center; gap:8px;">${esc(s)} <button onclick="window.deleteSemester('${esc(s)}')" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer;">×</button></span>`).join('')}
                </div>
            </div>`;
    };

    window.addSemester = function() {
        let input = document.getElementById('new-semester-input');
        if (!input || !input.value.trim()) return;
        let sem = input.value.trim();
        
        let semesters = [];
        try { semesters = JSON.parse(localStorage.getItem('AIIT_SEMESTERS')) || []; } catch(e){}
        if (!semesters.includes(sem)) semesters.push(sem);
        localStorage.setItem('AIIT_SEMESTERS', JSON.stringify(semesters));
        input.value = "";
        window.renderSemesterManager();
        window.renderAdminDeadlinesPanel();
    };

    window.deleteSemester = function(sem) {
        let semesters = [];
        try { semesters = JSON.parse(localStorage.getItem('AIIT_SEMESTERS')) || []; } catch(e){}
        semesters = semesters.filter(s => s !== sem);
        localStorage.setItem('AIIT_SEMESTERS', JSON.stringify(semesters));
        window.renderSemesterManager();
        window.renderAdminDeadlinesPanel();
    };
    ```

## 3. Semester-Specific Deadline Manager with Persistent Save Button
* **File:** `script.js`
  * Bind deadlines strictly to the selected semester so they save permanently and sync across laptops:

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
                ${renderSection('UG Programs (2 CAs)', 'ug', 2)}
                ${renderSection('PG Programs (3 CAs)', 'pg', 3)}
                <div style="text-align:right; margin-top:15px;">
                    <button onclick="window.saveSemesterDeadlines('${currentSem}')" style="background:#10b981; color:white; border:none; padding:10px 20px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:1rem;">💾 Save Deadlines for ${currentSem}</button>
                </div>
            </div>
        `;
    };

    window.saveSemesterDeadlines = function(sem) {
        let allDeadlines = {};
        try { allDeadlines = JSON.parse(localStorage.getItem('AIIT_SEMESTERS_DEADLINES')) || {}; } catch(e){}

        let fields = [];
        ['ug', 'pg'].forEach(prefix => {
            let count = prefix === 'ug' ? 2 : 3;
            for(let i=1; i<=count; i++) {
                fields.push(`${prefix}_ca${i}_qp`, `${prefix}_ca${i}_scrutiny`, `${prefix}_ca${i}_marks`);
            }
            fields.push(`${prefix}_internal_marks`, `${prefix}_lab_internal`);
        });

        let semDeadlines = {};
        fields.forEach(f => {
            let el = document.getElementById(f);
            if (el) semDeadlines[f] = el.value;
        });

        allDeadlines[sem] = semDeadlines;
        localStorage.setItem('AIIT_SEMESTERS_DEADLINES', JSON.stringify(allDeadlines));
        alert(`✅ Successfully saved all submission deadlines for ${sem}!`);
    };
    ```

## 4. Automated Reminder Dispatcher & Status Trigger
* **File:** `script.js`
  * Add the automated reminder dispatcher that checks deadlines (4 days, 2 days, or deadline day) and triggers notifications:

    ```javascript
    window.triggerAutomatedRemindersNow = function() {
        let deadlines = {};
        try { deadlines = JSON.parse(localStorage.getItem('AIIT_SEMESTERS_DEADLINES')) || {}; } catch(e){}
        let assignments = [];
        try { assignments = JSON.parse(localStorage.getItem('AIIT_FACULTY_ASSIGNMENTS')) || []; } catch(e){}
        let submissions = {};
        try { submissions = JSON.parse(localStorage.getItem('AIIT_SUBMISSIONS')) || {}; } catch(e){}

        let now = new Date();
        let reminderCount = 0;

        assignments.forEach(a => {
            let sem = a.semester || Object.keys(deadlines)[0] || "Semester 1";
            let semDeadlines = deadlines[sem] || {};
            let courseKey = `${a.courseCode}_${a.batch}_${a.program}`;
            let subState = submissions[courseKey] || {};
            let prefix = (parseInt(a.caCount) === 3) ? 'pg' : 'ug';

            let tasks = [`${prefix}_ca1_qp`, `${prefix}_ca1_scrutiny`, `${prefix}_ca1_marks`, `${prefix}_ca2_qp`, `${prefix}_ca2_scrutiny`, `${prefix}_ca2_marks`, `${prefix}_internal_marks`];
            if (parseInt(a.caCount) === 3) tasks.push(`${prefix}_ca3_qp`, `${prefix}_ca3_scrutiny`, `${prefix}_ca3_marks`);
            if (a.hasLab) tasks.push(`${prefix}_lab_internal`);

            tasks.forEach(t => {
                let isSubmitted = subState[t] && subState[t].submitted;
                if (isSubmitted) return;

                let dStr = semDeadlines[t];
                if (!dStr) return;
                let dDate = new Date(dStr);
                let diffDays = (dDate - now) / (1000 * 60 * 60 * 24);

                // Check if deadline is exactly 4 days, 2 days, or overdue/today (0 days)
                if ((diffDays <= 4 && diffDays > 3) || (diffDays <= 2 && diffDays > 1) || diffDays <= 0) {
                    reminderCount++;
                }
            });
        });

        alert(`✅ Automated Reminder Dispatch Complete! Dispatched alerts for ${reminderCount} pending tasks matching 4-day, 2-day, or deadline triggers.`);
    };
    ```