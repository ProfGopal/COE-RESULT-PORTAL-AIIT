# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 4.7 (Self-Healing Global State & Bulletproof Reset Engine)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are establishing a self-healing database loader that guarantees student records are always present in memory across all pages, fixing the admin-clear reset prompt trigger, updating version tags to **Ver 4.7**, and creating `VERSION4.7.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 4.7`.

## 2. Self-Healing State Engine (`script.js`)
* **File:** `script.js`
  * Add this global database initializer and update `clearStudentPassword` and `verifyStudentLogin`:

    ```javascript
    // Self-healing global database loader
    window.loadMasterDatabase = function() {
        let master = [];
        try { master = JSON.parse(localStorage.getItem('AIIT_STUDENTS_DATA')) || []; } catch(e){}
        if (master.length === 0) {
            try { master = JSON.parse(localStorage.getItem('AIIT_UPLOADED_STUDENTS')) || []; } catch(e){}
        }
        if (master.length === 0 && window.STUDENTS) {
            master = window.STUDENTS;
        }
        window.STUDENTS = master;
        return master;
    };

    window.clearStudentPassword = async function(senInputId) {
        let inputEl = document.getElementById(senInputId) || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
        let sen = inputEl ? inputEl.value.trim().toUpperCase() : "";
        
        if (!sen) {
            alert("⚠️ Please enter a valid Student Enrollment Number (SEN).");
            return;
        }

        if (!confirm(`Are you sure you want to clear the password for student ${sen}?`)) return;

        try {
            localStorage.removeItem(`AIIT_STUDENT_PASS_${sen}`);
            localStorage.setItem(`AIIT_FORCE_RESET_${sen}`, 'true');

            let clearedList = [];
            try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
            if (!clearedList.includes(sen)) clearedList.push(sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            let master = window.loadMasterDatabase();
            master.forEach(s => {
                if (s && String(s.sen || s.SEN || s.enrollment || '').toUpperCase().trim() === sen) {
                    s.customPassword = "";
                    s.password = "";
                }
            });
            localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(master));
            localStorage.setItem('AIIT_UPLOADED_STUDENTS', JSON.stringify(master));
        } catch (err) {
            console.error("Clear error:", err);
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

        // Always use self-healing loader
        let masterStudents = window.loadMasterDatabase();

        let student = masterStudents.find(s => {
            if (!s) return false;
            let candidate = String(s.sen || s.SEN || s.enrollment || s.ENROLLMENT || s.id || '').toUpperCase().trim();
            return candidate === sen || candidate.includes(sen) || sen.includes(candidate);
        });

        if (!student) {
            showErr('student-err', '❌ SEN not found in active database. Please verify result upload.');
            return;
        }

        let forceResetFlag = localStorage.getItem(`AIIT_FORCE_RESET_${sen}`) === 'true';
        let permanentPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        // IF ADMIN CLEARED PASSWORD OR NO PASS EXISTS: Any input triggers prompt
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

            localStorage.setItem(`AIIT_STUDENT_PASS_${sen}`, newPass);
            student.customPassword = newPass;
            student.password = newPass;
            
            localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(masterStudents));
            localStorage.setItem('AIIT_UPLOADED_STUDENTS', JSON.stringify(masterStudents));

            // Clear reset flags permanently
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

        // NORMAL LOGIN VALIDATION
        if (pass !== permanentPass) {
            showErr('student-err', '⚠ Incorrect password.');
            if (passInput) passInput.value = "";
            return;
        }

        window.loadStudentDashboard(student);
    };
    ```

## 3. Create `VERSION4.7.md`
* Create a file named `VERSION4.7.md` in your project root containing the release notes for Ver 4.7.