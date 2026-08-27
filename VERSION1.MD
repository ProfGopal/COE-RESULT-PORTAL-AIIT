# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 4.5 (Strict Admin-Flag State Machine & Clean Student Login)

You are updating a static GitHub Pages site (`script.js`, `index.html`, `admin-hidden.html`). We are fixing the student authentication lifecycle so that the password reset prompt opens **only** if the admin has explicitly cleared the password in the admin panel. Once configured, the reset flag is wiped, and subsequent logins strictly validate the password or show "Incorrect password". We also remove the "Forgot Password?" link and version up to **Ver 4.5**.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 4.5`.
  * Remove any "Forgot Password?" links or text elements from the student login form UI.

## 2. Strict State-Machine Authentication Engine (`script.js`)
* **File:** `script.js`
  * Replace your `clearStudentPassword` and `verifyStudentLogin` functions with this clean state-machine version:

    ```javascript
    window.clearStudentPassword = async function(senInputId) {
        let inputEl = document.getElementById(senInputId) || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
        let sen = inputEl ? inputEl.value.trim().toUpperCase() : "";
        
        if (!sen) {
            alert("⚠️ Please enter a valid Student Enrollment Number (SEN).");
            return;
        }

        if (!confirm(`Are you sure you want to clear the password for student ${sen}?`)) return;

        try {
            // 1. Remove permanent password key
            localStorage.removeItem(`AIIT_STUDENT_PASS_${sen}`);
            
            // 2. SET STRICT ADMIN RESET FLAG TO TRUE
            localStorage.setItem(`AIIT_ADMIN_RESET_${sen}`, "true");

            // 3. Update cleared list array
            let clearedList = [];
            try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
            if (!clearedList.includes(sen)) clearedList.push(sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            // Clear properties in data arrays
            ['AIIT_STUDENTS_DATA', 'AIIT_UPLOADED_STUDENTS'].forEach(key => {
                let list = JSON.parse(localStorage.getItem(key)) || [];
                list.forEach(s => {
                    if (s && String(s.sen || s.SEN || s.enrollment || '').toUpperCase().trim() === sen) {
                        s.customPassword = "";
                        s.password = "";
                    }
                });
                localStorage.setItem(key, JSON.stringify(list));
            });
        } catch (err) {
            console.error("Clear password error:", err);
        }

        alert(`✅ Password successfully cleared for student: ${sen}.\nThe student can now log in to set a new password.`);
        if (inputEl) inputEl.value = "";
    };

    window.verifyStudentLogin = function() {
        let senInput = document.getElementById('student-sen') || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
        let passInput = document.getElementById('student-pass') || document.querySelector('input[type="password"]');
        
        let sen = senInput ? senInput.value.trim().toUpperCase() : "";
        let pass = passInput ? passInput.value : "";
        
        if (!sen || !pass) {
            showErr('student-err', 'Please enter both SEN and password.');
            return;
        }

        // 1. Load master student list
        let masterStudents = [];
        try { masterStudents = JSON.parse(localStorage.getItem('AIIT_STUDENTS_DATA')) || []; } catch(e){}
        if (masterStudents.length === 0) {
            try { masterStudents = JSON.parse(localStorage.getItem('AIIT_UPLOADED_STUDENTS')) || []; } catch(e){}
        }
        if (masterStudents.length === 0 && window.STUDENTS) {
            masterStudents = window.STUDENTS;
        }

        let student = masterStudents.find(s => {
            if (!s) return false;
            let candidate = String(s.sen || s.SEN || s.enrollment || s.ENROLLMENT || s.id || '').toUpperCase().trim();
            return candidate === sen || candidate.includes(sen) || sen.includes(candidate);
        });

        if (!student) {
            showErr('student-err', '❌ SEN not found in active database.');
            return;
        }

        // 2. CHECK EXACT ADMIN RESET FLAG
        let adminResetFlag = localStorage.getItem(`AIIT_ADMIN_RESET_${sen}`) === "true";
        let permanentPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        // 3. IF ADMIN HAS CLEARED THE PASSWORD:
        if (adminResetFlag || !permanentPass) {
            let newPass = prompt("🔐 Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            let confirmPass = prompt("🔐 Confirm your new permanent password:");
            if (newPass !== confirmPass) {
                alert("❌ Passwords do not match. Please try logging in again.");
                return;
            }

            // Save new permanent password
            localStorage.setItem(`AIIT_STUDENT_PASS_${sen}`, newPass);
            student.customPassword = newPass;
            student.password = newPass;
            
            try {
                localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(masterStudents));
                localStorage.setItem('AIIT_UPLOADED_STUDENTS', JSON.stringify(masterStudents));
            } catch(e){}

            // WIPE ADMIN RESET FLAG SO IT NEVER OPENS AGAIN UNLESS ADMIN CLEARS IT
            localStorage.removeItem(`AIIT_ADMIN_RESET_${sen}`);
            try {
                let clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || [];
                clearedList = clearedList.filter(s => s !== sen);
                localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));
            } catch(e){}

            if (passInput) passInput.value = "";

            alert("✅ Password successfully configured! Loading dashboard...");
            window.loadStudentDashboard(student);
            return;
        }

        // 4. NORMAL LOGIN: If password is configured and admin did NOT clear it, strictly validate password
        if (pass !== permanentPass) {
            showErr('student-err', '⚠ Incorrect password.');
            if (passInput) passInput.value = "";
            return;
        }

        window.loadStudentDashboard(student);
    };
    ```

## 3. Create `VERSION4.5.md`
* Create a file named `VERSION4.5.md` in your project root containing the release notes for Ver 4.5.