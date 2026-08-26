# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 3.5 (Pro-Grade Password Persistence & Master Storage Sync)

You are updating a static GitHub Pages site (`script.js`). We are implementing a bulletproof master storage synchronization routine for student password resets so that new passwords are immutably written to localStorage and master records, updating version tags to **Ver 3.5**, and creating `VERSION3.5.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 3.5`.

## 2. Pro-Grade Student Authentication & Master Sync Engine (`script.js`)
* **File:** `script.js`
  * Replace your student login verification function with this clean, synchronized engine:

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

        // 1. Load master student records array
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
            showErr('student-err', '❌ SEN not found in active database. Please verify with Admin.');
            return;
        }

        // 2. Check admin cleared list
        let clearedList = [];
        try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedList.includes(sen);

        // Check password from individual key or student object property
        let storedPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`) || student.customPassword || student.password;

        // 3. Trigger reset if cleared by admin, no password exists, or user entered 'pwd'
        if (isClearedByAdmin || !storedPass || pass === 'pwd') {
            let newPass = prompt("🔐 Password reset required. Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            // Permanently update student record in master array
            student.customPassword = newPass;
            student.password = newPass;
            masterStudents[studentIndex] = student;

            // Save to individual storage AND master storage array immediately
            localStorage.setItem(`AIIT_STUDENT_PASS_${sen}`, newPass);
            try {
                localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(masterStudents));
                localStorage.setItem('AIIT_UPLOADED_STUDENTS', JSON.stringify(masterStudents));
                window.STUDENTS = masterStudents;
            } catch(e){}

            // Remove from cleared list
            clearedList = clearedList.filter(s => s !== sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            if (passInput) passInput.value = "";

            alert("✅ Password saved permanently! Loading dashboard...");
            window.loadStudentDashboard(student);
            return;
        }

        // 4. Standard validation against stored password (supporting both direct comparison and master object property)
        if (pass !== storedPass && pass !== student.customPassword && pass !== student.password) {
            showErr('student-err', '⚠ Incorrect password. If reset by admin, type "pwd".');
            if (passInput) passInput.value = "";
            return;
        }

        window.loadStudentDashboard(student);
    };
    ```

## 3. Create `VERSION3.5.md`
* Create a file named `VERSION3.5.md` in your project root containing the release notes for Ver 3.5.