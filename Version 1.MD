# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 9.1 (Direct Login Button Action Binding)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are explicitly binding the Student Sign-In, Faculty Login, and Admin Login buttons to their respective handlers, updating version tags to **Ver 9.1**, and creating `VERSION9.1.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html`, `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 9.1`.

## 2. Direct HTML Action Bindings
* **File:** `index.html`
  * Ensure the top-right **Faculty Login** button has an explicit onclick attribute:
    `<button onclick="window.showFacultyLogin()" class="...">FACULTY LOGIN</button>`
  * Ensure the Student **SIGN IN** button has an explicit onclick attribute or ID:
    `<button onclick="window.studentLoginStep()" id="s-login-btn" class="...">SIGN IN →</button>`
* **File:** `admin-hidden.html`
  * Ensure the Admin Login form or button triggers `window.adminLogin()` directly:
    `<button onclick="window.adminLogin()" class="...">Login →</button>`

## 3. Direct Login & Navigation Engine (`script.js`)
* **File:** `script.js`
  * Replace your login click bindings with these bulletproof global functions:

    ```javascript
    /**
     * script.js — AIIT COE Result Portal
     * Master Script Engine (Ver 9.1 - Direct Login Button Bindings)
     */

    'use strict';

    const scriptURL = "[https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec](https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec)";

    window.STUDENTS = [];
    window.CURRICULUM_RULES = {};
    window.SYSTEM_PROGRAMS = [];

    function sanitize(str) {
      return String(str || '').replace(/[<>"'`;\\&\/]/g, '').trim().substring(0, 200);
    }

    function esc(str) {
      if (str === null || str === undefined) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    window.esc = esc;

    // --- 1. CLOUD BOOTLOADER ---
    window.initializeCloudPortal = async function() {
        try {
            let stuRes = await fetch(scriptURL + "?action=load");
            let stuData = await stuRes.json();
            window.STUDENTS = Array.isArray(stuData) ? stuData : (stuData.students || []);
            
            let progMap = new Map();
            window.STUDENTS.forEach(s => {
                if (s.batch && s.program) {
                    progMap.set(`${s.batch}_${s.program}`, { batch: s.batch, program: s.program });
                }
            });
            window.SYSTEM_PROGRAMS = Array.from(progMap.values());
            if (window.SYSTEM_PROGRAMS.length === 0) {
                window.SYSTEM_PROGRAMS = [{ batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }, { batch: "2024", program: "B.C.A" }];
            }

            let curRes = await fetch(scriptURL + "?action=getCurriculum");
            let curText = await curRes.text();
            if (curText && curText.trim().startsWith("{")) {
                let parsed = JSON.parse(curText);
                window.CURRICULUM_RULES = parsed.rules || parsed;
                if (parsed.courses) window.CUSTOM_COURSE_DICT = parsed.courses;
            }
        } catch (err) {
            console.warn("Cloud sync warning:", err);
        }
    };

    // --- 2. EXPLICIT NAVIGATION & LOGIN HANDLERS ---
    window.showFacultyLogin = function() {
        let sContainer = document.getElementById('student-login-container') || document.querySelector('.landing-container') || document.getElementById('landing');
        let fContainer = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
        if (sContainer) sContainer.style.display = 'none';
        if (fContainer) {
            fContainer.style.display = 'block';
        } else {
            alert("Faculty login portal view loading...");
        }
    };

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
            alert("✗ Cloud connection error. Check your network.");
        }
    };

    window.adminLogin = async function() {
        const passInput = document.querySelector('input[type="password"]') || document.querySelectorAll('input')[1];
        const password = passInput ? passInput.value.trim() : "";

        if (!scriptURL || scriptURL.includes("YOUR_WEB_APP_URL_HERE")) {
            alert("⚠ ERROR: scriptURL is missing.");
            return;
        }

        try {
            const response = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'verifyadmin', password: password })
            });
            const data = await response.json();

            if (data.status === 'success') {
                window.currentAdminPassword = password;
                sessionStorage.setItem('coe_admin_auth', password);
                window.showPage('admin-dash');
            } else {
                alert(`⚠ ${data.message || 'Incorrect Admin Password'}`);
            }
        } catch (err) {
            alert(`⚠ Network Error: Check your connection.`);
        }
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

        // Clean Logout button text
        document.querySelectorAll('button, a').forEach(el => {
            let txt = el.textContent.trim().toLowerCase();
            if (txt.includes('logout') || txt.includes('search another')) {
                el.textContent = 'LOGOUT';
                el.onclick = function() { window.logoutPortal(); };
            }
        });
    };

    window.logoutPortal = function() {
        sessionStorage.clear();
        localStorage.clear();
        document.body.classList.remove('overlay-active');
        window.location.href = window.location.pathname;
    };

    document.addEventListener('DOMContentLoaded', () => {
        window.initializeCloudPortal();
    });
    ```

## 4. Create `VERSION9.1.md`
* Create a file named `VERSION9.1.md` in your project root containing the release notes for Ver 9.1.