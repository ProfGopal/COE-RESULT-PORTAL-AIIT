# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 2.7 (Faculty Navigation Switcher & UG/PG Deadline Sections)

You are updating a static GitHub Pages site (`script.js`, `index.html`, `admin-hidden.html`). We are adding a top navigation menu for faculty, updating course assignment dropdowns to UG (2 CAs) / PG (3 CAs), separating submission deadlines into dedicated UG and PG sections, and setting version strictly to Ver 2.7.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 2.7`.

## 2. Faculty Navigation Menu Switcher (Student Results vs Course-COE-Works)
* **File:** `script.js`
  * In your faculty portal initialization (`renderFacultyPortal` or dashboard wrapper), inject a top menu bar so faculty can toggle views seamlessly:

    ```javascript
    window.renderFacultyPortal = async function(email) {
        let facultyDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section');
        if (!facultyDash) return;

        // Ensure navigation menu header exists
        let navHeader = document.getElementById('faculty-nav-menu');
        if (!navHeader) {
            navHeader = document.createElement('div');
            navHeader.id = 'faculty-nav-menu';
            navHeader.style.cssText = 'display:flex; gap:15px; padding:15px 20px; background:white; border-bottom:1px solid #cbd5e1; align-items:center; margin-bottom:20px; box-shadow:0 1px 2px rgba(0,0,0,0.05);';
            navHeader.innerHTML = `
                <h3 style="margin:0; color:#0f172a; font-size:1.1rem; margin-right:auto;">🎓 Faculty Portal</h3>
                <button onclick="window.switchFacultyTab('analytics')" id="btn-tab-analytics" style="padding:8px 16px; background:#3b82f6; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">📊 Student Results & Analytics</button>
                <button onclick="window.switchFacultyTab('courseworks')" id="btn-tab-courseworks" style="padding:8px 16px; background:#e2e8f0; color:#334155; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">📚 Course-COE-Works & Submissions</button>
            `;
            facultyDash.prepend(navHeader);
        }

        // Create containers for both views if not present
        let analyticsView = document.getElementById('faculty-analytics-view');
        let courseworkView = document.getElementById('faculty-coursework-view');

        if (!analyticsView) {
            analyticsView = document.createElement('div');
            analyticsView.id = 'faculty-analytics-view';
            // Move existing directory table/filters inside analytics view
            const existingContent = Array.from(facultyDash.children).filter(el => el.id !== 'faculty-nav-menu' && el.id !== 'faculty-coursework-view' && el.id !== 'faculty-tasks-container');
            facultyDash.appendChild(analyticsView);
            existingContent.forEach(el => analyticsView.appendChild(el));
        }

        if (!courseworkView) {
            courseworkView = document.createElement('div');
            courseworkView.id = 'faculty-coursework-view';
            courseworkView.style.display = 'none';
            facultyDash.appendChild(courseworkView);
        }

        window.switchFacultyTab('analytics');
        window.renderFacultyCourseworkPanel(email, courseworkView);
    };

    window.switchFacultyTab = function(tab) {
        const analyticsView = document.getElementById('faculty-analytics-view');
        const courseworkView = document.getElementById('faculty-coursework-view');
        const btnAnalytics = document.getElementById('btn-tab-analytics');
        const btnCourseworks = document.getElementById('btn-tab-courseworks');

        if (tab === 'analytics') {
            if (analyticsView) analyticsView.style.display = 'block';
            if (courseworkView) courseworkView.style.display = 'none';
            if (btnAnalytics) { btnAnalytics.style.background = '#3b82f6'; btnAnalytics.style.color = 'white'; }
            if (btnCourseworks) { btnCourseworks.style.background = '#e2e8f0'; btnCourseworks.style.color = '#334155'; }
        } else {
            if (analyticsView) analyticsView.style.display = 'none';
            if (courseworkView) courseworkView.style.display = 'block';
            if (btnAnalytics) { btnAnalytics.style.background = '#e2e8f0'; btnAnalytics.style.color = '#334155'; }
            if (btnCourseworks) { btnCourseworks.style.background = '#3b82f6'; btnCourseworks.style.color = 'white'; }
        }
    };
    ```

## 3. Admin Course Assignment (UG - 2 CA vs PG - 3 CA)
* **File:** `admin-hidden.html` & `script.js`
  * Update the CA Count dropdown in the Admin Course Assignment form to feature **UG - 2 CA** and **PG - 3 CA**:
    ```html
    <select id="admin-ca-count-select" style="...">
        <option value="2">UG - 2 CA</option>
        <option value="3">PG - 3 CA</option>
    </select>
    ```

## 4. Dual Global Submission Deadline Manager (UG & PG Sections)
* **File:** `admin-hidden.html` & `script.js`
  * Separate the deadline manager into two distinct sections in the Admin Panel:

    ```javascript
    window.renderAdminDeadlinesPanel = function() {
        let deadlines = {};
        try { deadlines = JSON.parse(localStorage.getItem('AIIT_DEADLINES')) || {}; } catch(e){}

        const container = document.getElementById('admin-deadlines-container');
        if (!container) return;

        let renderSection = (title, prefix, count) => {
            let html = `<div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:15px; margin-bottom:15px;">
                <h4 style="margin:0 0 10px 0; color:#1e293b;">📌 ${title} Deadlines</h4>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">`;
            
            for(let i=1; i<=count; i++) {
                html += `
                <div>
                    <label style="font-size:0.85rem; font-weight:bold;">CA ${i} QP to COE:</label>
                    <input type="datetime-local" value="${deadlines[`${prefix}_ca${i}_qp`] || ''}" onchange="window.saveDeadline('${prefix}_ca${i}_qp', this.value)" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:4px;">
                </div>
                <div>
                    <label style="font-size:0.85rem; font-weight:bold;">CA ${i} Scrutiny Done:</label>
                    <input type="datetime-local" value="${deadlines[`${prefix}_ca${i}_scrutiny`] || ''}" onchange="window.saveDeadline('${prefix}_ca${i}_scrutiny', this.value)" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:4px;">
                </div>
                <div>
                    <label style="font-size:0.85rem; font-weight:bold;">CA ${i} Marks Submitted:</label>
                    <input type="datetime-local" value="${deadlines[`${prefix}_ca${i}_marks`] || ''}" onchange="window.saveDeadline('${prefix}_ca${i}_marks', this.value)" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:4px;">
                </div>`;
            }

            html += `
                <div>
                    <label style="font-size:0.85rem; font-weight:bold;">Internal Marks:</label>
                    <input type="datetime-local" value="${deadlines[`${prefix}_internal_marks`] || ''}" onchange="window.saveDeadline('${prefix}_internal_marks', this.value)" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:4px;">
                </div>
                <div>
                    <label style="font-size:0.85rem; font-weight:bold;">Lab Internal Marks:</label>
                    <input type="datetime-local" value="${deadlines[`${prefix}_lab_internal`] || ''}" onchange="window.saveDeadline('${prefix}_lab_internal', this.value)" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:4px;">
                </div>
            </div></div>`;
            return html;
        };

        container.innerHTML = `
            <h3 style="color:#0f172a; margin-bottom:15px;">⏰ Global Submission Deadline Manager</h3>
            ${renderSection('UG Programs (2 CAs)', 'ug', 2)}
            ${renderSection('PG Programs (3 CAs)', 'pg', 3)}
        `;
    };

    window.saveDeadline = function(key, val) {
        let deadlines = {};
        try { deadlines = JSON.parse(localStorage.getItem('AIIT_DEADLINES')) || {}; } catch(e){}
        deadlines[key] = val;
        localStorage.setItem('AIIT_DEADLINES', JSON.stringify(deadlines));
    };
    ```