# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 8.0 (100% Pure Cloud-Driven Engine)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`) and Google Apps Script backend (`Code.gs`). We are making the portal entirely cloud-reliant—automatically fetching student directories, batches, programs, and curriculum rules live from the Google Sheet on every page load—and restoring all logout actions, updating version tags to **Ver 8.0**, and creating `VERSION8.0.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html`, `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 8.0`.

## 2. Pure Cloud-Driven Frontend Engine (`script.js`)
* **File:** `script.js`
  * Replace your entire `script.js` with this pure cloud-synced version:

    ```javascript
    /**
     * script.js — AIIT COE Result Portal
     * Master Script Engine (Ver 8.0 - 100% Cloud-Driven Architecture)
     */

    'use strict';

    const scriptURL = "[https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec](https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec)";

    window.STUDENTS = [];
    window.CURRICULUM_RULES = {};
    window.SYSTEM_PROGRAMS = [];

    // --- 1. LIVE CLOUD BOOTLOADER (Fetches everything from Google Sheet) ---
    window.initializeCloudPortal = async function() {
        try {
            // A. Fetch Students & Batches/Programs
            let stuRes = await fetch(scriptURL + "?action=load");
            let stuData = await stuRes.json();
            window.STUDENTS = Array.isArray(stuData) ? stuData : (stuData.students || []);
            
            // Extract unique batches and programs directly from live student cloud records
            let progMap = new Map();
            window.STUDENTS.forEach(s => {
                if (s.batch && s.program) {
                    progMap.set(`${s.batch}_${s.program}`, { batch: s.batch, program: s.program });
                }
            });
            window.SYSTEM_PROGRAMS = Array.from(progMap.values());
            if (window.SYSTEM_PROGRAMS.length === 0) {
                window.SYSTEM_PROGRAMS = [{ batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }];
            }

            // B. Fetch Curriculum from CurriculumDB sheet
            let curRes = await fetch(scriptURL + "?action=getCurriculum");
            let curText = await curRes.text();
            if (curText && curText.trim().startsWith("{")) {
                let parsed = JSON.parse(curText);
                window.CURRICULUM_RULES = parsed.rules || parsed;
                if (parsed.courses) window.CUSTOM_COURSE_DICT = parsed.courses;
            }

            console.log("☁️ Pure Cloud Synchronization Successful:", {
                students: window.STUDENTS.length,
                programs: window.SYSTEM_PROGRAMS.length
            });
        } catch (err) {
            console.warn("☁️ Cloud sync warning, offline fallback active.", err);
        }

        // Refresh UI elements
        if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
        if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
        if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
    };

    // --- 2. GLOBAL LOGOUT HANDLER ---
    window.logoutPortal = function() {
        sessionStorage.clear();
        localStorage.clear();
        document.body.classList.remove('overlay-active');
        window.location.href = window.location.pathname;
    };

    document.addEventListener('click', function(e) {
        const btn = e.target.closest('button, a');
        if (!btn) return;
        let text = (btn.textContent || '').trim().toUpperCase();

        if (text === 'LOGOUT' || text.includes('LOG OUT')) {
            e.preventDefault();
            window.logoutPortal();
        } else if (text.includes('SIGN IN') || text.id === 's-login-btn') {
            e.preventDefault();
            window.studentLoginStep();
        }
    });

    // --- 3. SYSTEM PROGRAMS & DIRECTORY RENDERERS ---
    window.renderSystemPrograms = function () {
        const container = document.getElementById('active-system-programs');
        if (container) {
            container.innerHTML = window.SYSTEM_PROGRAMS.map((p, i) => `
                <span style="background: #334155; padding: 5px 10px; border-radius: 4px; color: white; font-weight:bold; display:inline-block; margin:3px;">
                    ${esc(p.batch)} ${esc(p.program)}
                </span>
            `).join('');
        }

        const uniqueBatches = [...new Set(window.SYSTEM_PROGRAMS.map(p => String(p.batch).trim()))];
        const uniqueProgs = [...new Set(window.SYSTEM_PROGRAMS.map(p => String(p.program).trim()))];

        const batchFilter = document.getElementById('filter-batch');
        if (batchFilter) batchFilter.innerHTML = `<option value="">All Years</option>` + uniqueBatches.map(b => `<option value="${b}">${b}</option>`).join('');

        const progFilter = document.getElementById('filter-program');
        if (progFilter) progFilter.innerHTML = `<option value="">All Programs</option>` + uniqueProgs.map(p => `<option value="${p}">${p}</option>`).join('');
    };

    window.applyAdminFilters = async function() {
        var tbody = document.getElementById('admin-tbody');
        var totalStu = document.getElementById('total-stu');
        if (!tbody) return;

        if (window.STUDENTS.length === 0) {
            await window.initializeCloudPortal();
        }

        if (totalStu) totalStu.textContent = window.STUDENTS.length;

        if (window.STUDENTS.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">No enrolled student records found in Cloud DB.</td></tr>`;
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

    // --- 4. STUDENT LOGIN ---
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
        let res = await fetch(scriptURL + "?action=load");
        let data = await res.json();
        let students = Array.isArray(data) ? data : (data.students || []);
        let student = students.find(s => String(s.sen).toUpperCase() === sen);
        if (student) window.loadStudentDashboard(student);
        else location.reload();
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

    document.addEventListener('DOMContentLoaded', () => {
        window.initializeCloudPortal();
    });
    ```

## 3. Create `VERSION8.0.md`
* Create a file named `VERSION8.0.md` in your project root containing the release notes for Ver 8.0.