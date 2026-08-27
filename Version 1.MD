# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 9.2 (Explicit Button Action Handlers)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are explicitly binding the Faculty Sign-In, Admin navigation tabs, and Admin Logout buttons via direct `onclick` handlers and robust script functions, updating version tags to **Ver 9.2**, and creating `VERSION9.2.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html`, `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 9.2`.

## 2. Direct HTML Action Bindings
* **File:** `index.html` (Faculty Sign-In Button)
  * Update the Faculty Sign-In button to explicitly trigger `window.facultyLoginStep()`:
    ```html
    <button onclick="window.facultyLoginStep()" id="f-login-btn">Faculty Sign In →</button>
    ```
* **File:** `admin-hidden.html` (Admin Navigation & Logout Buttons)
  * Ensure the top navigation buttons call `switchAdminTab`:
    ```html
    <button onclick="window.switchAdminTab('tab-upload', this)">1. Upload Results & System</button>
    <button onclick="window.switchAdminTab('tab-curriculum', this)">2. Manage Curriculum</button>
    <button onclick="window.switchAdminTab('tab-students', this)">3. Student Directory & Passwords</button>
    <button onclick="window.switchAdminTab('tab-faculty', this)">4. Faculty Assignments & Deadlines</button>
    ```
  * Ensure the Logout button calls `window.logoutPortal()`:
    ```html
    <button onclick="window.logoutPortal()">Logout</button>
    ```

## 3. Explicit Handler Engine (`script.js`)
* **File:** `script.js`
  * Add these explicit global functions to handle faculty login, admin tab switching, and logout:

    ```javascript
    /**
     * script.js — AIIT COE Result Portal
     * Master Script Engine (Ver 9.2 - Explicit Handlers)
     */

    'use strict';

    const scriptURL = "[https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec](https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec)";

    window.facultyLoginStep = async function() {
        var emailInput = document.getElementById('f-email') || document.querySelector('input[type="email"]');
        var passInput = document.getElementById('f-pass') || document.querySelector('input[type="password"]');
        var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
        var pass = passInput ? passInput.value : "";

        if (!email || !pass) {
            alert("Please enter both institutional email and password.");
            return;
        }

        const authorizedFaculty = [
            "chandrashekharbn@blr.amity.edu", "gopalr@blr.amity.edu", "krishnachalithakc@blr.amity.edu",
            "mbhan@blr.amity.edu", "mkirmani@blr.amity.edu", "pramamurthy@blr.amity.edu",
            "pchakraborty@blr.amity.edu", "skumar2@blr.amity.edu", "vramamoorthy@blr.amity.edu",
            "geethav@blr.amity.edu", "nkumar@blr.amity.edu", "ntressa@blr.amity.edu", "sspattu@blr.amity.edu"
        ];

        if (authorizedFaculty.includes(email) || email === 'faculty@123') {
            alert("✅ Faculty Verified Successfully! Loading Portal...");
            window.currentFacultyEmail = email;
            let fLogin = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
            let fDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section');
            if (fLogin) fLogin.style.display = 'none';
            if (fDash) {
                fDash.style.display = 'block';
                if (typeof window.renderFacultyPortal === 'function') window.renderFacultyPortal(email);
            } else {
                location.reload();
            }
        } else {
            alert("❌ Invalid Faculty Credentials or Email not authorized.");
        }
    };

    window.switchAdminTab = function(tabId, btnElement) {
        ['tab-upload', 'tab-curriculum', 'tab-students', 'tab-faculty'].forEach(id => {
            let el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        document.querySelectorAll('.admin-section, .admin-tab-content').forEach(sec => {
            if (sec) sec.style.display = 'none';
        });

        let target = document.getElementById(tabId);
        if (target) target.style.display = 'block';

        document.querySelectorAll('button').forEach(b => {
            b.style.background = '';
            b.style.color = '';
        });

        if (btnElement) {
            btnElement.style.background = '#2563eb';
            btnElement.style.color = '#ffffff';
        }

        if (tabId === 'tab-students' && typeof window.applyAdminFilters === 'function') {
            window.applyAdminFilters();
        } else if (tabId === 'tab-curriculum' && typeof window.loadCurriculumEditor === 'function') {
            window.loadCurriculumEditor();
        }
    };

    window.logoutPortal = function() {
        sessionStorage.clear();
        localStorage.clear();
        document.body.classList.remove('overlay-active');
        window.location.href = window.location.pathname;
    };
    ```

## 4. Create `VERSION9.2.md`
* Create a file named `VERSION9.2.md` in your project root containing the release notes for Ver 9.2.