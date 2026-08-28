```python
# Let's review the requirement for Version 15.0:
# 1. In the student portal, backlogs are not showing correctly or need proper extraction.
# 2. Rename the tab / label from "Active Backlog" / "Active Backlogs" strictly to "Backlog" / "Backlogs".
# 3. Ensure that when a student views their backlogs, all failed/backlog courses are properly populated and displayed under the "Backlog" tab.

print("Designing Ver 15.0 Student Backlog Tab & Label Optimization")


```

```text
Designing Ver 15.0 Student Backlog Tab & Label Optimization


```

# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 15.0 (Student Backlog Tab & Label Optimization)

You are updating a static GitHub Pages site (`script.js`). We are ensuring that student backlogs extract correctly from their course grade records, and updating all references and tab labels from "Active Backlog" / "Active Backlogs" strictly to **"Backlog"**, updating version tags to **Ver 15.0**, and creating `VERSION15.0.md`.

Please execute the following strict updates:

## 1. Global Versioning Update

* **File:** `index.html`, `admin-hidden.html`
* Change all version tags in the top left corners to `Ver 15.0`.



## 2. Student Backlog Extraction & Tab Label Engine (`script.js`)

* **File:** `script.js`
* Replace your student portal dashboard renderer with this version that strictly labels the tab **Backlog** and correctly lists all unresolved backlog courses:



```javascript
/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 15.0 - Student Backlog Tab & Label Optimization)
 */

'use strict';

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";

window.getActiveBacklogs = function(courses) {
    let history = {};
    (courses || []).forEach(c => {
        if (!c.code || c.code === 'NAN') return;
        let code = String(c.code).toUpperCase().trim();
        if (!history[code]) history[code] = { passed: false, latest: c };
        let isFail = ['F', 'AB', 'DE', 'I', 'U'].includes(String(c.grade || c.Grade || '').toUpperCase().trim());
        if (!isFail) history[code].passed = true;
        else if (!history[code].passed) history[code].latest = c;
    });
    let backlogs = [];
    for (let code in history) {
        if (!history[code].passed) backlogs.push(history[code].latest);
    }
    return backlogs;
};

window.loadStudentDashboard = function(student) {
    window.currentStudent = student;
    document.querySelectorAll('.page, .login-container, #student-login-container, .landing-container').forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    const dash = document.getElementById('student-dash') || document.getElementById('student-dashboard');
    if (dash) {
        dash.style.display = 'block';
        dash.classList.add('dashboard-fullscreen-overlay');
    }

    let name = student.name || 'Student';
    let sen = student.sen || '';
    let cgpa = student.cgpa || 'N/A';
    let credits = student.totalCredits || '0';
    let validCourses = (student.courses || []).filter(c => c && c.code && c.code !== 'NAN');
    let backlogsList = window.getActiveBacklogs(validCourses);

    document.querySelectorAll('#dash-name, .student-name').forEach(el => el.textContent = `${name} (${sen})`);
    document.querySelectorAll('#dash-cgpa, .cgpa-val').forEach(el => el.textContent = cgpa);
    document.querySelectorAll('#dash-ce, .credits-val').forEach(el => el.textContent = credits);

    // Inject Tab Navigation for Student Portal (All Courses, Backlog, Degree Audit)
    let tableContainer = document.getElementById('courses-tbody') || document.querySelector('table tbody');
    if (tableContainer) tableContainer = tableContainer.closest('table').parentElement;

    if (tableContainer && !document.getElementById('student-tab-nav')) {
        let tabNav = document.createElement('div');
        tabNav.id = 'student-tab-nav';
        tabNav.style.cssText = 'display:flex; gap:10px; margin:20px 0 15px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px;';
        tableContainer.parentNode.insertBefore(tabNav, tableContainer);

        let backlogsDiv = document.createElement('div');
        backlogsDiv.id = 'student-tab-backlogs';
        backlogsDiv.style.display = 'none';
        backlogsDiv.innerHTML = `<table style="width:100%; text-align:left; border-collapse:collapse; background:white; border:1px solid #e2e8f0;"><thead style="background:#f8fafc; border-bottom:2px solid #e2e8f0;"><tr><th style="padding:12px 10px;">Code</th><th style="padding:12px 10px;">Course Title</th><th style="padding:12px 10px;">Type</th><th style="padding:12px 10px;">Cr.</th><th style="padding:12px 10px;">Marks</th><th style="padding:12px 10px;">Grade</th></tr></thead><tbody id="student-backlogs-tbody"></tbody></table>`;
        tableContainer.parentNode.insertBefore(backlogsDiv, tableContainer.nextSibling);

        let auditDiv = document.createElement('div');
        auditDiv.id = 'student-tab-audit';
        auditDiv.style.display = 'none';
        tableContainer.parentNode.insertBefore(auditDiv, backlogsDiv.nextSibling);

        tableContainer.id = 'student-tab-all';
    }

    window.switchStudentTab = function(tabName) {
        document.getElementById('student-tab-all').style.display = (tabName === 'all') ? 'block' : 'none';
        document.getElementById('student-tab-backlogs').style.display = (tabName === 'backlogs') ? 'block' : 'none';
        document.getElementById('student-tab-audit').style.display = (tabName === 'audit') ? 'block' : 'none';

        document.getElementById('btn-stu-all').style.background = (tabName === 'all') ? '#3b82f6' : '#f1f5f9';
        document.getElementById('btn-stu-all').style.color = (tabName === 'all') ? 'white' : '#475569';
        
        document.getElementById('btn-stu-backlogs').style.background = (tabName === 'backlogs') ? '#ef4444' : '#f1f5f9';
        document.getElementById('btn-stu-backlogs').style.color = (tabName === 'backlogs') ? 'white' : '#475569';

        document.getElementById('btn-stu-audit').style.background = (tabName === 'audit') ? '#10b981' : '#f1f5f9';
        document.getElementById('btn-stu-audit').style.color = (tabName === 'audit') ? 'white' : '#475569';
    };

    const tabNav = document.getElementById('student-tab-nav');
    if (tabNav) {
        tabNav.innerHTML = `
            <button onclick="window.switchStudentTab('all')" id="btn-stu-all" style="padding:8px 16px; border:none; background:#3b82f6; color:white; border-radius:6px; font-weight:bold; cursor:pointer;">📚 All Courses</button>
            <button onclick="window.switchStudentTab('backlogs')" id="btn-stu-backlogs" style="padding:8px 16px; border:none; background:#f1f5f9; color:#475569; border-radius:6px; font-weight:bold; cursor:pointer;">⚠️ Backlog (${backlogsList.length})</button>
            <button onclick="window.switchStudentTab('audit')" id="btn-stu-audit" style="padding:8px 16px; border:none; background:#f1f5f9; color:#475569; border-radius:6px; font-weight:bold; cursor:pointer;">🎓 Degree Audit Check</button>
            <button onclick="window.exportStudentPDF()" style="margin-left:auto; padding:8px 16px; border:none; background:#dc2626; color:white; border-radius:6px; font-weight:bold; cursor:pointer;">📄 Export PDF</button>
        `;
    }

    let coursesTbody = document.getElementById('courses-tbody');
    if (coursesTbody) {
        coursesTbody.innerHTML = validCourses.map(c => `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px; font-weight:bold;">${esc(c.code)}</td>
                <td style="padding:10px;">${esc(c.name)}</td>
                <td style="padding:10px;">${esc(c.type || 'Core')}</td>
                <td style="padding:10px;">${esc(c.credits)}</td>
                <td style="padding:10px;">${esc(c.marks)}</td>
                <td style="padding:10px; font-weight:bold; color:#2563eb;">${esc(c.grade)}</td>
            </tr>
        `).join('');
    }

    let backlogsTbody = document.getElementById('student-backlogs-tbody');
    if (backlogsTbody) {
        backlogsTbody.innerHTML = backlogsList.length > 0 ? backlogsList.map(c => `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px; font-weight:bold;">${esc(c.code)}</td>
                <td style="padding:10px;">${esc(c.name)}</td>
                <td style="padding:10px;">${esc(c.type || 'Core')}</td>
                <td style="padding:10px;">${esc(c.credits)}</td>
                <td style="padding:10px;">${esc(c.marks)}</td>
                <td style="padding:10px; font-weight:bold; color:#dc2626;">${esc(c.grade)}</td>
            </tr>
        `).join('') : `<tr><td colspan="6" style="text-align:center; padding:20px; color:#16a34a; font-weight:bold;">🎉 Excellent! You have no backlogs.</td></tr>`;
    }

    let auditContainer = document.getElementById('student-tab-audit');
    if (auditContainer && typeof window.evaluateDegree === 'function') {
        auditContainer.innerHTML = window.evaluateDegree(student);
    }

    // Clean Logout button text
    document.querySelectorAll('button, a').forEach(el => {
        let txt = el.textContent.trim().toLowerCase();
        if (txt.includes('logout') || txt.includes('search another')) {
            el.textContent = 'LOGOUT';
            el.onclick = function() { window.logoutPortal(); };
        }
    });
};

```

## 3. Create `VERSION15.0.md`

* Create a file named `VERSION15.0.md` in your project root containing the release notes for Ver 15.0.