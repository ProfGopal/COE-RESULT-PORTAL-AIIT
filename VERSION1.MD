# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 3.6 (Absolute Autofill Bypass & Direct Login Override)

You are updating a static GitHub Pages site (`script.js`). We are implementing an absolute autofill bypass that clears stale password inputs, automatically detects cleared admin resets, forces new password creation seamlessly, updates version tags to **Ver 3.6**, and creates `VERSION3.6.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 3.6`.

## 2. Pro-Grade Autofill-Resilient Login Engine (`script.js`)
* **File:** `script.js`
  * Replace your student login verification function with this bulletproof version:

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

        // Load master students list
        let masterStudents = [];
        try { masterStudents = JSON.parse(localStorage.getItem('AIIT_STUDENTS_DATA')) || []; } catch(e){}
        if (masterStudents.length === 0) {
            try { masterStudents = JSON.parse(localStorage.getItem('AIIT_UPLOADED_STUDENTS')) || []; } catch(e){}
        }
        if (masterStudents.length === 0 && window.STUDENTS) {
            masterStudents = window.STUDENTS;
        }

        let studentIndex = masterStudents.findIndex(s => s && String(s.sen || s.SEN || s.enrollment || '').toUpperCase().trim() === sen);
        let student = studentIndex !== -1 ? masterStudents[studentIndex] : null;

        if (!student) {
            // Create fallback student record so login never fails on missing rows
            student = { sen: sen, name: "Student " + sen, program: "B.C.A", cgpa: "7.58", earnedCredits: "66", courses: [] };
            masterStudents.push(student);
        }

        // Check if admin cleared this student's password
        let clearedList = [];
        try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedList.includes(sen);

        let storedPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`) || student.customPassword || student.password;

        // FORCE RESET PROMPT IF CLEARED BY ADMIN, NO PASSWORD EXISTS, OR USER TYPED 'pwd' OR IF AUTOFILL INTERFERED
        if (isClearedByAdmin || !storedPass || pass === 'pwd' || pass.length > 20) {
            let newPass = prompt("🔐 Password reset active. Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                if (passInput) passInput.value = "";
                return;
            }

            // Save permanently
            student.customPassword = newPass;
            student.password = newPass;
            if (studentIndex !== -1) masterStudents[studentIndex] = student;
            else masterStudents.push(student);

            localStorage.setItem(`AIIT_STUDENT_PASS_${sen}`, newPass);
            try {
                localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(masterStudents));
                localStorage.setItem('AIIT_UPLOADED_STUDENTS', JSON.stringify(masterStudents));
                window.STUDENTS = masterStudents;
            } catch(e){}

            // Clear from admin reset list
            clearedList = clearedList.filter(s => s !== sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            if (passInput) passInput.value = "";

            alert("✅ Password successfully saved! Loading dashboard...");
            window.loadStudentDashboard(student);
            return;
        }

        // Standard validation
        if (pass !== storedPass && pass !== student.customPassword && pass !== student.password) {
            showErr('student-err', '⚠ Incorrect password. Clear password box and type "pwd".');
            if (passInput) passInput.value = ""; // Clear autofilled garbage
            return;
        }

        window.loadStudentDashboard(student);
    };

    // Auto-clear password box on SEN input change to defeat browser autofill cache
    document.addEventListener('DOMContentLoaded', () => {
        let senInput = document.getElementById('student-sen') || document.querySelector('input[placeholder*="SEN"], input[id*="sen"]');
        let passInput = document.getElementById('student-pass') || document.querySelector('input[type="password"]');
        if (senInput && passInput) {
            senInput.addEventListener('input', () => {
                passInput.value = ""; // Wipe stale autofill when SEN changes
            });
        }
    });
    ```

## 3. Create `VERSION3.6.md`
* Create a file named `VERSION3.6.md` in your project root containing the release notes for Ver 3.6.