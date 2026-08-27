# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 5.0 (Built-in Fallback Database & Zero-Failure Login Engine)

You are updating a static GitHub Pages site (`script.js`, `index.html`, `admin-hidden.html`). We are embedding a permanent built-in student fallback dataset inside `script.js` so student records and logins work instantly even in Incognito mode or new browsers without requiring re-uploads, updating version tags to **Ver 5.0**, and creating `VERSION5.0.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 5.0`.

## 2. Built-In Fallback Database & Secure Login Engine (`script.js`)
* **File:** `script.js`
  * Replace your entire data loader and login verification logic with this bulletproof version:

    ```javascript
    // Permanent Built-in Student Dataset (Works instantly in Incognito / New Devices)
    window.getDefaultStudentDatabase = function() {
        return [
            {
                sen: "A869145024002",
                name: "PAVAN KUMAR H G",
                program: "B.C.A",
                cgpa: "7.58",
                earnedCredits: "66",
                courses: [
                    { code: "CHE1001", title: "Environmental Studies", type: "T", credits: 3, marks: 58, grade: "P", gradePoints: "-", earnedCredits: 3 },
                    { code: "CSE1016", title: "Introduction to Information Technology", type: "ELT", credits: 3, marks: "-", grade: "B", gradePoints: "-", earnedCredits: 3 },
                    { code: "CSE1019", title: "Programming in C", type: "L", credits: 2, marks: 85, grade: "A", gradePoints: "-", earnedCredits: 2 }
                ]
            },
            {
                sen: "A86904824004",
                name: "PAVAN KUMAR H G",
                program: "B.C.A",
                cgpa: "7.58",
                earnedCredits: "66",
                courses: [
                    { code: "CHE1001", title: "Environmental Studies", type: "T", credits: 3, marks: 58, grade: "P", gradePoints: "-", earnedCredits: 3 },
                    { code: "CSE1016", title: "Introduction to Information Technology", type: "ELT", credits: 3, marks: "-", grade: "B", gradePoints: "-", earnedCredits: 3 },
                    { code: "CSE1019", title: "Programming in C", type: "L", credits: 2, marks: 85, grade: "A", gradePoints: "-", earnedCredits: 2 }
                ]
            }
        ];
    };

    window.loadMasterDatabase = function() {
        let master = [];
        try { master = JSON.parse(localStorage.getItem('AIIT_STUDENTS_DATA')) || []; } catch(e){}
        if (master.length === 0) {
            try { master = JSON.parse(localStorage.getItem('AIIT_UPLOADED_STUDENTS')) || []; } catch(e){}
        }
        if (master.length === 0) {
            master = window.getDefaultStudentDatabase();
            try { localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(master)); } catch(e){}
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

        let masterStudents = window.loadMasterDatabase();

        let student = masterStudents.find(s => {
            if (!s) return false;
            let candidate = String(s.sen || s.SEN || s.enrollment || s.ENROLLMENT || s.id || '').toUpperCase().trim();
            return candidate === sen || candidate.includes(sen) || sen.includes(candidate);
        });

        if (!student) {
            showErr('student-err', '❌ SEN not found in active database.');
            return;
        }

        let forceResetFlag = localStorage.getItem(`AIIT_FORCE_RESET_${sen}`) === 'true';
        let permanentPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        // IF ADMIN CLEARED PASSWORD OR NO PASS EXISTS: ANY password typed opens prompt
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

## 3. Create `VERSION5.0.md`
* Create a file named `VERSION5.0.md` in your project root containing the release notes for Ver 5.0.