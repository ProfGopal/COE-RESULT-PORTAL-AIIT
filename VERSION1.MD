# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 5.2 (Direct Apps Script Cloud Integration for Passwords)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are connecting password clearing and student authentication directly to your Google Apps Script backend URL so database updates sync instantly to Google Sheets, updating version tags to **Ver 5.2**, and creating `VERSION5.2.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 5.2`.

## 2. Apps Script Cloud-Connected Engine (`script.js`)
* **File:** `script.js`
  * Replace your backend API URL constant, `clearStudentPassword`, and `verifyStudentLogin` functions with this cloud-synced version:

    ```javascript
    // REPLACE with your actual Google Apps Script Web App URL
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";

    window.clearStudentPassword = async function(senInputId) {
        let inputEl = document.getElementById(senInputId) || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
        let sen = inputEl ? inputEl.value.trim().toUpperCase() : "";
        
        if (!sen) {
            alert("⚠️ Please enter a valid Student Enrollment Number (SEN).");
            return;
        }

        if (!confirm(`Are you sure you want to clear the password for student ${sen} in the Cloud Database?`)) return;

        let adminPass = prompt("🔐 Enter Admin Password to confirm password clear:") || "";

        try {
            let response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'clearpassword',
                    sen: sen,
                    adminPassword: adminPass
                })
            });
            let result = await response.json();

            if (result.status === 'success') {
                alert(`✅ Cloud Database: Password successfully cleared for student ${sen}.`);
                if (inputEl) inputEl.value = "";
            } else {
                alert(`❌ Error: ${result.message}`);
            }
        } catch (err) {
            console.error("Cloud clear error:", err);
            alert("❌ Network error connecting to Google Sheet backend.");
        }
    };

    window.verifyStudentLogin = async function() {
        let senInput = document.getElementById('student-sen') || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
        let passInput = document.getElementById('student-pass') || document.querySelector('input[type="password"]');
        
        let sen = senInput ? senInput.value.trim().toUpperCase() : "";
        let pass = passInput ? passInput.value : "";
        
        if (!sen || !pass) {
            showErr('student-err', 'Please enter both SEN and password.');
            return;
        }

        try {
            // 1. Attempt login against Google Sheet Backend
            let response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'login',
                    sen: sen,
                    password: pass
                })
            });
            let result = await response.json();

            // 2. If Column G is empty (First-time user or cleared by admin)
            if (result.status === 'first_time' || result.message?.includes("First-time")) {
                let newPass = prompt("🔐 Enter your new permanent password (min 6 characters):");
                if (!newPass || newPass.length < 6) {
                    alert("❌ Password must be at least 6 characters.");
                    return;
                }

                let confirmPass = prompt("🔐 Confirm your new permanent password:");
                if (newPass !== confirmPass) {
                    alert("❌ Passwords do not match.");
                    return;
                }

                // Send new password to Apps Script to save in Column G
                let setRes = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'setpassword',
                        sen: sen,
                        newPassword: newPass
                    })
                });
                let setJson = await setRes.json();

                if (setJson.status === 'success') {
                    alert("✅ Password created successfully! Loading your dashboard...");
                    // Fetch student record details
                    window.loadStudentDashboardAfterCloudAuth(sen);
                } else {
                    alert(`❌ Error saving password: ${setJson.message}`);
                }
                return;
            }

            if (result.status === 'success') {
                window.loadStudentDashboard(result.student);
            } else {
                showErr('student-err', `⚠ ${result.message || 'Incorrect password.'}`);
                if (passInput) passInput.value = "";
            }
        } catch (err) {
            console.error("Login fetch error:", err);
            showErr('student-err', '⚠ Cloud connection error. Please check your network.');
        }
    };

    window.loadStudentDashboardAfterCloudAuth = async function(sen) {
        try {
            let res = await fetch(`${APPS_SCRIPT_URL}?action=load`);
            let students = await res.json();
            let student = students.find(s => String(s.sen).toUpperCase() === sen);
            if (student) {
                window.loadStudentDashboard(student);
            } else {
                window.location.reload();
            }
        } catch(e) {
            window.location.reload();
        }
    };
    ```

## 3. Create `VERSION5.2.md`
* Create a file named `VERSION5.2.md` in your project root containing the release notes for Ver 5.2.