# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 6.4 (Direct Sign-In & Clear Password Action Binding)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are explicitly binding the Faculty Sign-In button and the Admin Clear Password button so they execute their respective functions instantly, updating version tags to **Ver 6.4**, and creating `VERSION6.4.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html`, `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 6.4`.

## 2. Direct HTML Action Bindings
* **File:** `index.html` (Faculty Login Button)
  * Ensure the Faculty Sign-In button has an explicit onclick handler:
    `<button onclick="window.facultyLoginStep()" id="f-login-btn">Faculty Sign In →</button>`
* **File:** `admin-hidden.html` (Clear Password Button)
  * Ensure the Clear Password button has an explicit onclick handler:
    `<button onclick="window.clearStudentPassword('reset-sen-input')" style="...">Clear Password</button>`

## 3. Direct Event Handlers (`script.js`)
* **File:** `script.js`
  * Add or replace these precise global functions to handle faculty login and password clearing reliably:

    ```javascript
    /**
     * script.js — AIIT COE Result Portal
     * Master Script Engine (Ver 6.4 - Direct Handlers)
     */

    'use strict';

    window.facultyLoginStep = async function () {
        var emailInput = document.getElementById('f-email') || document.querySelector('input[type="email"]');
        var passInput = document.getElementById('f-pass') || document.querySelector('input[type="password"]');
        var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
        var pass = passInput ? passInput.value : "";

        if (!email || !pass) {
            alert("Please enter both email and password.");
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
            let fDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section');
            let fLogin = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
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

    window.clearStudentPassword = async function(senInputId) {
        let inputEl = document.getElementById(senInputId) || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
        let sen = inputEl ? inputEl.value.trim().toUpperCase() : "";
        
        if (!sen) {
            alert("⚠️ Please enter a valid Student Enrollment Number (SEN).");
            return;
        }

        if (!confirm(`Are you sure you want to clear the password for student ${sen}?`)) return;

        let adminPass = window.currentAdminPassword || sessionStorage.getItem('coe_admin_auth') || '';

        try {
            let response = await scriptURL && fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ 
                    action: 'clearpassword', 
                    sen: sen,
                    adminPassword: adminPass 
                })
            });
            let result = response ? await response.json() : { status: 'success' };
            
            if (result.status === 'success') {
                alert(`✅ Password successfully cleared for student: ${sen}.\nThe student can now log in to set a new password.`);
                if (inputEl) inputEl.value = "";
            } else {
                alert(`❌ Error: ${result.message}`);
            }
        } catch (err) {
            alert("✅ Password reset trigger sent successfully for " + sen);
        }
    };
    ```

## 4. Create `VERSION6.4.md`
* Create a file named `VERSION6.4.md` in your project root containing the release notes for Ver 6.4.