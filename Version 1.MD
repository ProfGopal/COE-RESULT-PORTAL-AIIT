# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 7.1 (Cloud Curriculum Auto-Restoration & Student Sign-In Fix)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are ensuring that the admin panel automatically pulls batches, programs, and curriculum rules from the Google Sheet cloud database on load, and directly binding the student "SIGN IN" button, updating version tags to **Ver 7.1**, and creating `VERSION7.1.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html`, `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 7.1`.

## 2. Cloud Auto-Restoration & Sign-In Engine (`script.js`)
* **File:** `script.js`
  * Replace your initialization, student login trigger, and curriculum sync logic with this complete version:

    ```javascript
    /**
     * script.js — AIIT COE Result Portal
     * Master Script Engine (Ver 7.1 - Cloud Curriculum Auto-Restore & Sign-In Fix)
     */

    'use strict';

    const scriptURL = "[https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec](https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec)";

    // --- 1. AUTO-RESTORE CURRICULUM & PROGRAMS FROM GOOGLE SHEET CLOUD ---
    window.syncCloudCurriculumOnLoad = async function() {
        try {
            let res = await fetch(scriptURL + "?action=getCurriculum");
            let data = await res.json();
            if (data && (data.rules || data.programs)) {
                if (data.rules) {
                    window.CURRICULUM_RULES = data.rules;
                    localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(data.rules));
                }
                if (data.programs && Array.isArray(data.programs)) {
                    localStorage.setItem('AIIT_SYSTEM_PROGRAMS', JSON.stringify(data.programs));
                }
                if (data.courses) {
                    window.CUSTOM_COURSE_DICT = data.courses;
                    localStorage.setItem('AIIT_CUSTOM_COURSES', JSON.stringify(data.courses));
                }
                console.log("✅ Successfully restored Batches, Programs, and Curriculums from Google Sheet Cloud!");
            }
        } catch(e) {
            console.warn("Cloud curriculum sync offline, using local cache.", e);
        }

        if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
        if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
    };

    // --- 2. DIRECT STUDENT SIGN-IN BINDING ---
    window.studentLoginStep = async function () {
        var rawSen = document.getElementById('s-sen')?.value || document.getElementById('student-sen')?.value || document.querySelector('input[placeholder*="SEN"]')?.value;
        var sen = String(rawSen || '').toUpperCase().trim();
        
        var passInput = document.getElementById('s-pass')?.value || document.getElementById('student-pass')?.value || document.querySelector('input[type="password"]')?.value || '';
        
        if (!sen || !passInput) {
            alert("Please enter both SEN and password.");
            return;
        }

        try {
            var response = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'login', sen: sen, password: passInput.trim() })
            });
            var result = await response.json();

            if (result && result.status === 'success' && result.student) {
                window.loadStudentDashboard(result.student);
            } else if (result && (result.status === 'first_time' || (result.message && result.message.toLowerCase().includes('first')))) {
                let newPass = prompt("🔐 First-time login. Enter new permanent password (min 6 characters):");
                if (!newPass || newPass.length < 6) {
                    alert("❌ Password must be at least 6 characters.");
                    return;
                }

                let setRes = await fetch(scriptURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({ action: 'setpassword', sen: sen, newPassword: newPass })
                });
                let setJson = await setRes.json();

                if (setJson.status === 'success') {
                    alert("✅ Password created successfully! Logging in...");
                    window.loadStudentDashboardAfterCloudAuth(sen);
                } else {
                    alert(`❌ Error: ${setJson.message}`);
                }
            } else {
                alert("⚠ " + (result.message || 'Incorrect password.'));
            }
        } catch (err) {
            alert("✗ Cloud connection error. Check your internet.");
        }
    };

    window.loadStudentDashboardAfterCloudAuth = async function(sen) {
        try {
            let res = await fetch(scriptURL + "?action=load");
            let students = await res.json();
            let student = students.find(s => String(s.sen).toUpperCase() === sen);
            if (student) window.loadStudentDashboard(student);
            else location.reload();
        } catch(e) { location.reload(); }
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

        document.querySelectorAll('#dash-name, .student-name').forEach(el => el.textContent = `${name} (${sen})`);
        document.querySelectorAll('#dash-cgpa, .cgpa-val').forEach(el => el.textContent = cgpa);
        document.querySelectorAll('#dash-ce, .credits-val').forEach(el => el.textContent = credits);

        let tbody = document.getElementById('courses-tbody') || document.querySelector('table tbody');
        if (tbody && student.courses) {
            tbody.innerHTML = student.courses.map(c => `
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
    };

    // --- 3. EXPLICIT BUTTON CLICK BINDINGS ---
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        let text = (btn.textContent || '').trim().toUpperCase();

        if (text.includes('SIGN IN') || text.id === 's-login-btn') {
            e.preventDefault();
            window.studentLoginStep();
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        window.syncCloudCurriculumOnLoad();
    });
    ```

## 3. Create `VERSION7.1.md`
* Create a file named `VERSION7.1.md` in your project root containing the release notes for Ver 7.1.