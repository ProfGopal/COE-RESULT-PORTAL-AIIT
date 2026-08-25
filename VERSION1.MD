# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 2.3 (Bulletproof Student Password Reset & 'pwd' Prompt)

You are updating a static GitHub Pages site (`script.js`). We are ensuring that whenever an admin clears a student's password, typing **`pwd`** (or even leaving it blank/entering any temporary text) immediately forces the student login to prompt for a brand-new permanent password, updating version to Ver 2.3, and creating `VERSION2.3.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 2.3`.

## 2. Force New Password Prompt on Cleared Student Login
* **File:** `script.js`
  * Find your student login verification function (`verifyStudent` or login click handler) and update it with this bulletproof check:

    ```javascript
    window.verifyStudentLogin = function() {
        let senInput = document.getElementById('student-sen') || document.querySelector('input[placeholder*="SEN"], input[id*="sen"]');
        let passInput = document.getElementById('student-pass') || document.querySelector('input[type="password"]');
        
        let sen = senInput ? senInput.value.trim().toUpperCase() : "";
        let pass = passInput ? passInput.value : "";
        
        if (!sen || !pass) {
            showErr('student-err', 'Please enter both SEN and password.');
            return;
        }

        let students = window.STUDENTS || [];
        let student = students.find(s => String(s.sen).toUpperCase().trim() === sen);

        if (!student) {
            showErr('student-err', '❌ Student Enrollment Number (SEN) not found.');
            return;
        }

        // Check if password was cleared by Admin
        let clearedPasswords = [];
        try { clearedPasswords = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedPasswords.includes(sen);

        // If cleared by admin, allow 'pwd' or treat as first-time login
        if (isClearedByAdmin || !student.customPassword || pass === 'pwd') {
            let newPass = prompt("🔐 Password reset detected. Please enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            // Save new password
            student.customPassword = newPass;
            try {
                localStorage.setItem(`AIIT_STUDENT_PASS_${sen}`, newPass);
                // Remove from cleared list once reset
                clearedPasswords = clearedPasswords.filter(s => s !== sen);
                localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedPasswords));
            } catch(e){}

            alert("✅ Password successfully set! Logging you in...");
        } else {
            // Verify normal custom password
            let savedPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`) || student.customPassword;
            if (pass !== savedPass) {
                showErr('student-err', '⚠ Incorrect password. If your password was reset by the admin, please type "pwd".');
                return;
            }
        }

        // Proceed to Student Dashboard
        window.loadStudentDashboard(student);
    };
    ```

## 3. Create `VERSION2.3.md`
* Create a file named `VERSION2.3.md` in your project root containing the release notes for Ver 2.3.