# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 3.9 (Fuzzy SEN Lookup & Bulletproof Password Reset)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are fixing student lookup normalization so SEN checks are 100% robust, ensuring typing `pwd` or admin clearing immediately triggers password resets with zero "SEN not found" errors, updating version tags to **Ver 3.9**, and creating `VERSION3.9.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 3.9`.

## 2. Bulletproof SEN Lookup & Password Reset Engine (`script.js`)
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

        // 1. Gather all master student records from all possible storage pools
        let masterStudents = [];
        try { masterStudents = JSON.parse(localStorage.getItem('AIIT_STUDENTS_DATA')) || []; } catch(e){}
        if (masterStudents.length === 0) {
            try { masterStudents = JSON.parse(localStorage.getItem('AIIT_UPLOADED_STUDENTS')) || []; } catch(e){}
        }
        if (masterStudents.length === 0 && window.STUDENTS) {
            masterStudents = window.STUDENTS;
        }

        // Fuzzy search matching across SEN, enrollment, or ID fields
        let student = masterStudents.find(s => {
            if (!s) return false;
            let candidate = String(s.sen || s.SEN || s.enrollment || s.ENROLLMENT || s.id || '').toUpperCase().trim();
            return candidate === sen || candidate.includes(sen) || sen.includes(candidate);
        });

        // If still not found, create a robust fallback student profile so login NEVER fails with "SEN not found"
        if (!student) {
            student = {
                sen: sen,
                name: "Student " + sen,
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
            try {
                localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(masterStudents));
            } catch(e){}
        }

        // 2. Check admin cleared list or localStorage password key
        let clearedList = [];
        try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedList.includes(sen);

        let storedPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`) || student.customPassword || student.password;

        // 3. Force password reset prompt if cleared by admin, no password exists, or user typed 'pwd'
        if (isClearedByAdmin || !storedPass || pass === 'pwd') {
            let newPass = prompt("🔐 Password reset active. Please enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters long.");
                return;
            }

            // Save permanently
            localStorage.setItem(`AIIT_STUDENT_PASS_${sen}`, newPass);
            student.customPassword = newPass;
            student.password = newPass;
            
            try {
                localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(masterStudents));
                localStorage.setItem('AIIT_UPLOADED_STUDENTS', JSON.stringify(masterStudents));
            } catch(e){}

            // Remove from cleared list
            clearedList = clearedList.filter(s => s !== sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            if (passInput) passInput.value = "";

            alert("✅ Password saved successfully! Loading your dashboard...");
            window.loadStudentDashboard(student);
            return;
        }

        // 4. Validate password
        if (pass !== storedPass && pass !== student.customPassword && pass !== student.password) {
            showErr('student-err', '⚠ Incorrect password. If your password was reset by admin, type "pwd".');
            if (passInput) passInput.value = "";
            return;
        }

        window.loadStudentDashboard(student);
    };
    ```

## 3. Create `VERSION3.9.md`
* Create a file named `VERSION3.9.md` in your project root containing the release notes for Ver 3.9.