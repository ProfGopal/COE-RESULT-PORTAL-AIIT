# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 4.2 (Definitive Admin Clear & Reset Fix)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are ensuring that admin password clearing explicitly deletes the stored permanent password key from localStorage, and streamlining the student login validator to prioritize admin clear flags, updating version tags to **Ver 4.2**, and creating `VERSION4.2.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 4.2`.

## 2. Definitive Admin Clear & Student Login Engine (`script.js`)
* **File:** `script.js`
  * Replace your `clearStudentPassword` and `verifyStudentLogin` functions with this definitive version:

    ```javascript
    window.clearStudentPassword = async function(senInputId) {
        let inputEl = document.getElementById(senInputId) || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
        let sen = inputEl ? inputEl.value.trim().toUpperCase() : "";
        
        if (!sen) {
            alert("⚠️ Please enter a valid Student Enrollment Number (SEN).");
            return;
        }

        if (!confirm(`Are you sure you want to clear the password for student ${sen}?`)) return;

        // DEFINITIVE WIPE: Remove password key from localStorage and add to cleared list
        try {
            localStorage.removeItem(`AIIT_STUDENT_PASS_${sen}`);
            
            let clearedList = [];
            try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
            if (!clearedList.includes(sen)) clearedList.push(sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            // Also wipe custom password properties in student arrays
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
            console.error("Storage clear error:", err);
        }

        alert(`✅ Password successfully cleared for student: ${sen}.\nThe student can now log in using 'pwd' to set a new password.`);
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

        // 2. Check admin cleared list FIRST
        let clearedList = [];
        try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedList.includes(sen);

        // If cleared by admin, FORCE delete any lingering password key
        if (isClearedByAdmin) {
            localStorage.removeItem(`AIIT_STUDENT_PASS_${sen}`);
        }

        let permanentPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        // 3. TRIGGER RESET PROMPT IF CLEARED BY ADMIN OR NO PERMANENT PASSWORD EXISTS
        if (isClearedByAdmin || !permanentPass) {
            if (pass !== 'pwd') {
                showErr('student-err', '⚠ Password reset required by admin. Please type "pwd".');
                if (passInput) passInput.value = "";
                return;
            }

            let newPass = prompt("🔐 Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
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

            // Remove from cleared list so 'pwd' never works again until admin clears it
            clearedList = clearedList.filter(s => s !== sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            if (passInput) passInput.value = "";

            alert("✅ Password created successfully! Loading dashboard...");
            window.loadStudentDashboard(student);
            return;
        }

        // 4. BLOCK 'pwd' if password is already configured
        if (pass === 'pwd') {
            showErr('student-err', '⚠ Password already configured. Please enter your active password (or contact Admin to reset).');
            if (passInput) passInput.value = "";
            return;
        }

        // 5. VALIDATE AGAINST PERMANENT PASSWORD
        if (pass !== permanentPass) {
            showErr('student-err', '⚠ Incorrect password.');
            if (passInput) passInput.value = "";
            return;
        }

        window.loadStudentDashboard(student);
    };
    ```

## 3. Create `VERSION4.2.md`
* Create a file named `VERSION4.2.md` in your project root containing the release notes for Ver 4.2.