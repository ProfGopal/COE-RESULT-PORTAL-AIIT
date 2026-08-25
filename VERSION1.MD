# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 2.9 (Permanent Password Persistence & Reset Fix)

You are updating a static GitHub Pages site (`script.js`). We are permanently fixing student password storage and verification so that newly set passwords persist across page refreshes and never trigger false "Incorrect password" errors, updating version to Ver 2.9, and creating `VERSION2.9.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 2.9`.

## 2. Permanent Student Password Authentication Engine
* **File:** `script.js`
  * Replace your student login verification function with this clean, permanent persistence engine:

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

        // Fetch master students
        let students = window.STUDENTS || [];
        if (students.length === 0) {
            try { students = JSON.parse(localStorage.getItem('AIIT_STUDENTS_DATA')) || []; } catch(e){}
        }
        if (students.length === 0) {
            try { students = JSON.parse(localStorage.getItem('AIIT_UPLOADED_STUDENTS')) || []; } catch(e){}
        }

        let student = students.find(s => s && String(s.sen || s.SEN || s.enrollment || '').toUpperCase().trim() === sen);

        if (!student) {
            showErr('student-err', '❌ SEN not found in uploaded result records.');
            return;
        }

        // Check if admin recently cleared this student's password
        let clearedList = [];
        try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedList.includes(sen);

        // Check permanent stored password
        let permanentPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        // If cleared by admin, or no permanent password exists yet, or user typed 'pwd'
        if (isClearedByAdmin || !permanentPass || pass === 'pwd') {
            let newPass = prompt("🔐 Password reset required. Please enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters long.");
                return;
            }

            // Save permanently
            localStorage.setItem(`AIIT_STUDENT_PASS_${sen}`, newPass);
            student.customPassword = newPass;
            
            // Remove from cleared list so future logins use this permanent password
            clearedList = clearedList.filter(s => s !== sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            alert("✅ Password saved successfully! Logging you into your dashboard...");
            window.loadStudentDashboard(student);
            return;
        }

        // Validate against permanent stored password
        if (pass !== permanentPass) {
            showErr('student-err', '⚠ Incorrect password. If your password was reset by the admin, please type "pwd".');
            return;
        }

        window.loadStudentDashboard(student);
    };
    ```

## 3. Create `VERSION2.9.md`
* Create a file named `VERSION2.9.md` in your project root containing the release notes for Ver 2.9.