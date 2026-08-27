# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 4.6 (HTML UI Cleaner & Absolute Reset Flag Engine)

You are updating a static GitHub Pages site (`script.js`, `index.html`, `admin-hidden.html`). We are completely removing the "Forgot Password?" element from `index.html`, ensuring clean UI text, and locking down the student login verification to use an explicit local storage reset flag (`AIIT_FORCE_RESET_<SEN>`), updating version tags to **Ver 4.6**, and creating `VERSION4.6.md`.

Please execute the following strict updates:

## 1. Global Versioning & UI HTML Cleanup
* **File:** `index.html`
  * Update the version tag in the top left corner to `Ver 4.6`.
  * Locate and **completely delete** any anchor tag or text containing `FORGOT PASSWORD?` or links pointing to password recovery.
  * Update the instruction text under "Student Login" to simply: `Enter your SEN and password.` (removing any mention of `pwd`).
* **File:** `admin-hidden.html`
  * Update version tags to `Ver 4.6`.

## 2. Absolute Admin-Reset Flag Engine (`script.js`)
* **File:** `script.js`
  * Replace your `clearStudentPassword` and `verifyStudentLogin` functions with this clean implementation:

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
            // 1. Remove old permanent password key
            localStorage.removeItem(`AIIT_STUDENT_PASS_${sen}`);
            
            // 2. SET ABSOLUTE FORCE-RESET FLAG
            localStorage.setItem(`AIIT_FORCE_RESET_${sen}`, 'true');

            // 3. Update cleared list array
            let clearedList = [];
            try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
            if (!clearedList.includes(sen)) clearedList.push(sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            // Clear custom password properties in local databases
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

        // 2. CHECK FORCE RESET FLAG SET BY ADMIN
        let forceResetFlag = localStorage.getItem(`AIIT_FORCE_RESET_${sen}`) === 'true';
        let permanentPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        // 3. IF ADMIN CLEARED THE PASSWORD (Flag is true OR no permanent password exists):
        if (forceResetFlag || !permanentPass) {
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

            // REMOVE FORCE RESET FLAG SO IT NEVER OPENS AGAIN UNLESS ADMIN CLEARS IT
            localStorage.removeItem(`AIIT_FORCE_RESET_${sen}`);
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

## 3. Create `VERSION4.6.md`
* Create a file named `VERSION4.6.md` in your project root containing the release notes for Ver 4.6.