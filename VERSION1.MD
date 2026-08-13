# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 3.2 (Auto-Email Scheduler Dashboard & Controls)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`). We are upgrading the "Trigger Deadline Reminders" card in the Admin Panel to include visible Auto-Email scheduler options (4-day, 2-day, and deadline-day triggers), status indicators, and persistent toggle settings.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `admin-hidden.html` & `index.html`
  * Change all version tags in the top left corners to `Ver 3.2`.

## 2. Auto-Email Scheduler UI & Trigger Engine
* **File:** `script.js` & `admin-hidden.html`
  * Replace or update the Trigger Reminders card content to render the full Auto-Email Scheduler controls:

    ```javascript
    window.renderAutoEmailSchedulerCard = function() {
        let cardContainer = document.getElementById('trigger-reminders-card-content');
        if (!cardContainer) {
            // Find the card wrapper by its title
            const headers = document.querySelectorAll('h3, h4');
            headers.forEach(h => {
                if (h.textContent.includes('Trigger Deadline Reminders')) {
                    cardContainer = h.closest('div');
                }
            });
        }
        if (!cardContainer) return;

        let autoEmailConfig = {};
        try { autoEmailConfig = JSON.parse(localStorage.getItem('AIIT_AUTO_EMAIL_CONFIG')) || { enabled: true, daysBefore: [4, 2, 0] }; } catch(e){}

        cardContainer.innerHTML = `
            <h3 style="margin-top:0; color:#0f172a; display:flex; align-items:center; gap:8px;">
                <span>📧</span> Auto-Email Scheduler & Reminders
            </h3>
            <p style="color:#475569; font-size:0.9rem; margin-bottom:15px;">
                Automatically dispatch reminder alerts to faculty members before or on submission deadlines.
            </p>

            <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:12px; margin-bottom:15px;">
                <label style="display:flex; align-items:center; gap:8px; font-weight:bold; color:#1e293b; cursor:pointer; margin-bottom:8px;">
                    <input type="checkbox" id="auto-email-toggle" ${autoEmailConfig.enabled ? 'checked' : ''} onchange="window.saveAutoEmailConfig()"> 
                    Enable Background Auto-Email Dispatcher
                </label>
                <div style="font-size:0.85rem; color:#64748b; margin-left:22px;">
                    Active Triggers: <b>4 Days Before</b>, <b>2 Days Before</b>, & <b>Deadline Day (0 Days)</b>
                </div>
            </div>

            <div style="display:flex; gap:10px; align-items:center;">
                <button onclick="window.triggerAutomatedRemindersNow()" style="background:#8b5cf6; color:white; border:none; padding:10px 18px; border-radius:6px; font-weight:bold; cursor:pointer; flex:1;">
                    ⚡ Run Auto-Email Dispatcher Now
                </button>
            </div>
            <div id="auto-email-status-msg" style="margin-top:10px; font-size:0.85rem; color:#16a34a; font-weight:bold;"></div>
        `;
    };

    window.saveAutoEmailConfig = function() {
        let checkbox = document.getElementById('auto-email-toggle');
        let config = {
            enabled: checkbox ? checkbox.checked : true,
            daysBefore: [4, 2, 0]
        };
        localStorage.setItem('AIIT_AUTO_EMAIL_CONFIG', JSON.stringify(config));
        let msg = document.getElementById('auto-email-status-msg');
        if (msg) {
            msg.textContent = config.enabled ? "✅ Auto-Email Scheduler is Active." : "⏸️ Auto-Email Scheduler is Paused.";
            setTimeout(() => { msg.textContent = ""; }, 3000);
        }
    };

    window.triggerAutomatedRemindersNow = function() {
        let deadlines = {};
        try { deadlines = JSON.parse(localStorage.getItem('AIIT_SEMESTERS_DEADLINES')) || {}; } catch(e){}
        let assignments = [];
        try { assignments = JSON.parse(localStorage.getItem('AIIT_FACULTY_ASSIGNMENTS')) || []; } catch(e){}
        let submissions = {};
        try { submissions = JSON.parse(localStorage.getItem('AIIT_SUBMISSIONS')) || {}; } catch(e){}

        let now = new Date();
        let pendingAlertsCount = 0;
        let targetedEmails = new Set();

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

                // Check 4-day, 2-day, or deadline day triggers
                if ((diffDays <= 4 && diffDays > 3) || (diffDays <= 2 && diffDays > 1) || (diffDays <= 0 && diffDays >= -1)) {
                    pendingAlertsCount++;
                    targetedEmails.add(a.facultyEmail);
                }
            });
        });

        alert(`✅ Auto-Email Dispatcher Executed!\n- Found ${pendingAlertsCount} pending tasks matching 4-day / 2-day / deadline triggers.\n- Target Faculty Members: ${Array.from(targetedEmails).join(', ') || 'None'}\n\nOutlook Mail client will now open for official dispatch.`);
        
        if (targetedEmails.size > 0) {
            let firstEmail = Array.from(targetedEmails)[0];
            window.openDraftEmail(firstEmail, "Pending Deadlines Batch", "Multiple Courses", "Overdue / Deadline Near");
        }
    };
    ```

## 3. Auto-Initialize on Admin Load
* **File:** `script.js`
  * Ensure `window.renderAutoEmailSchedulerCard()` is called whenever the Admin Panel loads or tabs are switched.