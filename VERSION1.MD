# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 2.8 (Draft Mail Preview & Faculty Submission Audit Filters)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`). We are adding an interactive Draft Mail Preview modal before sending reminder emails, building an Admin Faculty Submission Audit & Status Filter panel (Completed, Pending, Overdue/Deadline Near), and setting version strictly to Ver 2.8.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `admin-hidden.html` & `index.html`
  * Change all version tags in the top left corners to `Ver 2.8`.

## 2. Admin Faculty Submission Audit & Status Filter Panel
* **File:** `admin-hidden.html` & `script.js`
  * Add the submission audit table with status filters (`All`, `✅ Completed`, `⏳ Pending`, `🚨 Overdue / Deadline Near`) in the Admin Panel:

    ```javascript
    window.renderAdminSubmissionAudit = function() {
        let container = document.getElementById('admin-submission-audit-container');
        if (!container) return;

        let assignments = [];
        let deadlines = {};
        let submissions = {};
        try {
            assignments = JSON.parse(localStorage.getItem('AIIT_FACULTY_ASSIGNMENTS')) || [];
            deadlines = JSON.parse(localStorage.getItem('AIIT_DEADLINES')) || {};
            submissions = JSON.parse(localStorage.getItem('AIIT_SUBMISSIONS')) || {};
        } catch(e){}

        let filterStatus = document.getElementById('audit-status-filter') ? document.getElementById('audit-status-filter').value : 'all';

        let rowsHTML = "";
        let now = new Date();

        assignments.forEach(a => {
            let courseKey = `${a.courseCode}_${a.batch}_${a.program}`;
            let subState = submissions[courseKey] || {};
            let prefix = (parseInt(a.caCount) === 3) ? 'pg' : 'ug';

            // Check tasks (CA1, CA2, Internal, etc.)
            let tasks = [
                { id: `${prefix}_ca1_qp`, name: 'CA 1 QP' },
                { id: `${prefix}_ca1_scrutiny`, name: 'CA 1 Scrutiny' },
                { id: `${prefix}_ca1_marks`, name: 'CA 1 Marks' },
                { id: `${prefix}_ca2_qp`, name: 'CA 2 QP' },
                { id: `${prefix}_ca2_scrutiny`, name: 'CA 2 Scrutiny' },
                { id: `${prefix}_ca2_marks`, name: 'CA 2 Marks' }
            ];
            if (parseInt(a.caCount) === 3) {
                tasks.push(
                    { id: `${prefix}_ca3_qp`, name: 'CA 3 QP' },
                    { id: `${prefix}_ca3_scrutiny`, name: 'CA 3 Scrutiny' },
                    { id: `${prefix}_ca3_marks`, name: 'CA 3 Marks' }
                );
            }
            tasks.push({ id: `${prefix}_internal_marks`, name: 'Internal Marks' });
            if (a.hasLab) tasks.push({ id: `${prefix}_lab_internal`, name: 'Lab Internal' });

            tasks.forEach(t => {
                let isSubmitted = subState[t.id] && subState[t.id].submitted;
                let deadlineStr = deadlines[t.id];
                let deadlineDate = deadlineStr ? new Date(deadlineStr) : null;
                
                let status = "⏳ Pending";
                let badgeColor = "#f59e0b";
                let badgeBg = "#fef3c7";

                if (isSubmitted) {
                    status = "✅ Completed";
                    badgeColor = "#16a34a";
                    badgeBg = "#dcfce3";
                } else if (deadlineDate && now > deadlineDate) {
                    status = "🚨 Overdue";
                    badgeColor = "#dc2626";
                    badgeBg = "#fee2e2";
                } else if (deadlineDate && (deadlineDate - now) < 48 * 3600 * 1000) {
                    status = "⚠️ Deadline Near";
                    badgeColor = "#d97706";
                    badgeBg = "#ffedd5";
                }

                // Filter matching
                if (filterStatus === 'completed' && !isSubmitted) return;
                if (filterStatus === 'pending' && isSubmitted) return;
                if (filterStatus === 'overdue' && status !== "🚨 Overdue" && status !== "⚠️ Deadline Near") return;

                rowsHTML += `
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:10px; font-weight:bold; color:#0f172a;">${esc(a.facultyEmail)}</td>
                    <td style="padding:10px;">${esc(a.courseCode)} - ${esc(a.courseName)}</td>
                    <td style="padding:10px; font-weight:bold;">${esc(t.name)}</td>
                    <td style="padding:10px; color:#475569;">${deadlineStr ? new Date(deadlineStr).toLocaleString() : 'No Deadline'}</td>
                    <td style="padding:10px;"><span style="background:${badgeBg}; color:${badgeColor}; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.85rem;">${status}</span></td>
                    <td style="padding:10px;"><button onclick="window.openDraftEmail('${esc(a.facultyEmail)}', '${esc(t.name)}', '${esc(a.courseCode)}', '${status}')" style="background:#8b5cf6; color:white; border:none; padding:5px 10px; border-radius:4px; font-weight:bold; cursor:pointer;">✉️ Draft Reminder</button></td>
                </tr>`;
            });
        });

        container.innerHTML = `
            <div style="background:white; border:1px solid #cbd5e1; border-radius:8px; padding:20px; margin-top:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin:0; color:#0f172a;">📋 Faculty Submission Audit & Status Filter</h3>
                    <select id="audit-status-filter" onchange="window.renderAdminSubmissionAudit()" style="padding:6px 12px; border:1px solid #cbd5e1; border-radius:6px; font-weight:bold;">
                        <option value="all" ${filterStatus==='all'?'selected':''}>All Submissions</option>
                        <option value="completed" ${filterStatus==='completed'?'selected':''}>✅ Completed Only</option>
                        <option value="pending" ${filterStatus==='pending'?'selected':''}>⏳ Pending Only</option>
                        <option value="overdue" ${filterStatus==='overdue'?'selected':''}>🚨 Overdue / Deadline Near</option>
                    </select>
                </div>
                <div style="max-height:400px; overflow-y:auto;">
                    <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                        <thead>
                            <tr style="background:#f8fafc; border-bottom:2px solid #cbd5e1; color:#334155;">
                                <th style="padding:10px;">Faculty Email</th>
                                <th style="padding:10px;">Course</th>
                                <th style="padding:10px;">Task</th>
                                <th style="padding:10px;">Deadline</th>
                                <th style="padding:10px;">Status</th>
                                <th style="padding:10px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHTML || `<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748b;">No records match the selected filter.</td></tr>`}</tbody>
                    </table>
                </div>
            </div>`;
    };
    ```

## 3. Interactive Draft Mail Preview & Sender Modal
* **File:** `script.js`
  * Add the Draft Mail generator modal so admins can review the exact email draft (including sender/recipient info) before sending:

    ```javascript
    window.openDraftEmail = function(facultyEmail, taskName, courseCode, status) {
        let modal = document.getElementById('draft-email-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'draft-email-modal';
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:99999;';
            document.body.appendChild(modal);
        }

        let senderEmail = "coe.aiit@blr.amity.edu"; // Institutional COE Sender ID
        let subject = `URGENT: Reminder for ${taskName} Submission - Course ${courseCode}`;
        let body = `Dear Faculty Member,\n\nThis is an official reminder from the Controller of Examinations (COE) office regarding your assigned course ${courseCode}.\n\nTask: ${taskName}\nCurrent Status: ${status}\n\nPlease complete and freeze your submission on the COE Portal before the deadline.\n\nWarm regards,\nController of Examinations (COE)\nAmity University Bengaluru`;

        modal.innerHTML = `
            <div style="background:white; width:90%; max-width:600px; border-radius:8px; padding:25px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                <h3 style="margin-top:0; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:10px;">✉️ Draft Mail Preview</h3>
                
                <div style="margin-bottom:12px;">
                    <label style="font-size:0.85rem; font-weight:bold; color:#475569;">From (Sender):</label>
                    <input type="text" value="${senderEmail}" readonly style="width:100%; padding:8px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; font-weight:bold; color:#334155;">
                </div>

                <div style="margin-bottom:12px;">
                    <label style="font-size:0.85rem; font-weight:bold; color:#475569;">To (Recipient):</label>
                    <input type="text" value="${facultyEmail}" readonly style="width:100%; padding:8px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; font-weight:bold; color:#334155;">
                </div>

                <div style="margin-bottom:12px;">
                    <label style="font-size:0.85rem; font-weight:bold; color:#475569;">Subject:</label>
                    <input type="text" id="draft-subject" value="${subject}" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:4px; font-weight:bold;">
                </div>

                <div style="margin-bottom:20px;">
                    <label style="font-size:0.85rem; font-weight:bold; color:#475569;">Message Body:</label>
                    <textarea id="draft-body" rows="6" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:4px; font-family:inherit;">${body}</textarea>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button onclick="document.getElementById('draft-email-modal').remove()" style="background:#cbd5e1; color:#334155; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">Cancel</button>
                    <button onclick="window.sendDraftEmailAction('${facultyEmail}')" style="background:#10b981; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">🚀 Send Email Now</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    };

    window.sendDraftEmailAction = function(recipient) {
        let subject = encodeURIComponent(document.getElementById('draft-subject').value);
        let body = encodeURIComponent(document.getElementById('draft-body').value);
        
        // Opens default mail client / webmail (Gmail composer) pre-filled with Sender & Recipient details
        window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
        
        document.getElementById('draft-email-modal').remove();
        alert("✅ Draft reviewed and dispatched to mail client!");
    };
    ```