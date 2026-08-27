# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 4.4 (Universal 'pwd' Force-Reset & Permanent Login Engine)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are fixing the student login authentication flow so that typing `pwd` universally and unconditionally forces the new password creation prompt, while regular incorrect passwords correctly show "Incorrect password". Version tags are updated to **Ver 4.4**, and `VERSION4.4.md` is created.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 4.4`.

## 2. Universal Force-Reset & Secure Login Engine (`script.js`)
* **File:** `script.js`
  * Replace your `verifyStudentLogin` function with this foolproof version:

    ```javascript
    window.verifyStudentLogin = function() {
        let senInput = document.getElementById('student-sen') || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
        let passInput = document.getElementById('student-pass') || document.querySelector('input[type="password"]');
        
        let sen = senInput ? senInput.value.trim().toUpperCase() : "";
        let pass = passInput ? passInput.value : "";
        
        if (!sen || !pass) {
            showErr('student-err', 'Please enter both SEN and password.');
            return;
        }

        // 1. Gather master students with zero failure risk
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
            student = {
                sen: sen,
                name: "PAVAN KUMAR H G",
                program: "B.C.A",
                cgpa: "7.58",
                earnedCredits: "66",
                courses: [
                    { code: "CHE1001", title: "Environmental Studies", type: "T", credits: 3, marks: 58, grade: "P", gradePoints: "-", earnedCredits: 3 },
                    { code: "CSE1016", title: "Introduction to Information Technology", type: "ELT", credits: 3, marks: "-", grade: "B", gradePoints: "-", earnedCredits: 3 },
                    { code: "CSE1019", title: "Programming in C", type: "L", credits: 2, marks: 85, grade: "A", gradePoints: "-", earnedCredits: 2 }
                ]
            };
            masterStudents.push(student);
            try { localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(masterStudents)); } catch(e){}
        }

        let permanentPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        // 2. UNIVERSAL FORCE-RESET: If user types 'pwd' OR if no permanent password exists yet, trigger prompt immediately!
        if (pass === 'pwd' || !permanentPass) {
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

            // Clear admin cleared list flag if present
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

        // 3. NORMAL LOGIN VALIDATION: If password is configured and user types something else, check it strictly
        if (pass !== permanentPass) {
            showErr('student-err', '⚠ Incorrect password.');
            if (passInput) passInput.value = "";
            return;
        }

        window.loadStudentDashboard(student);
    };
    ```

## 3. Create `VERSION4.4.md`
* Create a file named `VERSION4.4.md` in your project root containing the release notes for Ver 4.4.