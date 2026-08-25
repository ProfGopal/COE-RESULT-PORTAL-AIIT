# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 3.0 (Bulletproof Autofill Bypass & Password Reset Engine)

You are updating a static GitHub Pages site (`script.js`). We are overriding browser password autofill interference, adding explicit autocomplete blocking, forcing password reset prompts on cleared accounts or when `pwd` is entered, updating version to Ver 3.0, and creating `VERSION3.0.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 3.0`.

## 2. Bulletproof Student Login & Autofill Bypass Engine
* **File:** `script.js`
  * Replace your student login verification function with this clean, autofill-immune version:

    ```javascript
    window.verifyStudentLogin = function() {
        let senInput = document.getElementById('student-sen') || document.querySelector('input[placeholder*="SEN"], input[id*="sen"]');
        let passInput = document.getElementById('student-pass') || document.querySelector('input[type="password"]');
        
        let sen = senInput ? senInput.value.trim().toUpperCase() : "";
        let pass = passInput ? passInput.value : "";
        
        if (!sen) {
            showErr('student-err', 'Please enter Student Enrollment Number (SEN).');
            return;
        }

        // Fetch master students dataset
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

        // Check if admin cleared password
        let clearedList = [];
        try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedList.includes(sen);

        let permanentPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        // Force password reset if cleared by admin, or no permanent password exists, or user typed 'pwd'
        if (isClearedByAdmin || !permanentPass || pass === 'pwd') {
            let newPass = prompt("🔐 Password reset active. Please enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters long.");
                return;
            }

            // Save new password permanently
            localStorage.setItem(`AIIT_STUDENT_PASS_${sen}`, newPass);
            student.customPassword = newPass;
            
            // Clear from admin reset list
            clearedList = clearedList.filter(s => s !== sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            // Clear password input box to prevent autofill loops
            if (passInput) passInput.value = "";

            alert("✅ Password saved successfully! Loading your dashboard...");
            window.loadStudentDashboard(student);
            return;
        }

        // Validate password
        if (pass !== permanentPass) {
            showErr('student-err', '⚠ Incorrect password. (Tip: If password was reset by admin, clear the password box and type "pwd").');
            if (passInput) passInput.value = ""; // Auto-clear bad password box
            return;
        }

        window.loadStudentDashboard(student);
    };
    ```

## 3. Create `VERSION3.0.md`
* Create a file named `VERSION3.0.md` in your project root containing the release notes for Ver 3.0.