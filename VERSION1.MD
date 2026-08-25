# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 2.4 (Bulletproof Universal Password Reset Handler)

You are updating a static GitHub Pages site (`script.js`). We are ensuring that whenever an admin clears a student password, attempting to sign in with *any* password or `pwd` automatically bypasses the old password check and forces the student password update prompt, updating version to Ver 2.4, and creating `VERSION2.4.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 2.4`.

## 2. Universal Password Reset Interceptor
* **File:** `script.js`
  * Update your student login handler so that cleared student records always intercept sign-in and force the new password creation modal:

    ```javascript
    window.verifyStudentLogin = function() {
        let senInput = document.getElementById('student-sen') || document.querySelector('input[placeholder*="SEN"], input[id*="sen"]');
        let passInput = document.getElementById('student-pass') || document.querySelector('input[type="password"]');
        
        let sen = senInput ? senInput.value.trim().toUpperCase() : "";
        let pass = passInput ? passInput.value : "";
        
        if (!sen) {
            showErr('student-err', 'Please enter SEN number.');
            return;
        }

        let students = window.STUDENTS || [];
        let student = students.find(s => String(s.sen).toUpperCase().trim() === sen);

        if (!student) {
            showErr('student-err', '❌ Student Enrollment Number (SEN) not found.');
            return;
        }

        // Check if admin cleared this password
        let clearedPasswords = [];
        try { clearedPasswords = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedPasswords.includes(sen);

        // ALWAYS force new password prompt if admin cleared it, or if it's first time, or if pass is 'pwd'
        if (isClearedByAdmin || !student.customPassword || pass === 'pwd' || pass === '') {
            let newPass = prompt("🔐 Password reset active for this SEN. Please enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            // Save new password
            student.customPassword = newPass;
            try {
                localStorage.setItem(`AIIT_STUDENT_PASS_${sen}`, newPass);
                // Clear from admin reset list
                clearedPasswords = clearedPasswords.filter(s => s !== sen);
                localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedPasswords));
            } catch(e){}

            alert("✅ Password successfully created! Logging you in...");
            window.loadStudentDashboard(student);
            return;
        }

        // Standard verification
        let savedPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`) || student.customPassword;
        if (pass !== savedPass) {
            showErr('student-err', '⚠ Incorrect password. (Tip: If password was cleared by admin, clear the password box or type "pwd").');
            return;
        }

        window.loadStudentDashboard(student);
    };
    ```

## 3. Create `VERSION2.4.md`
* Create a file named `VERSION2.4.md` in your project root containing the release notes for Ver 2.4.