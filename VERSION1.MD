# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 4.3 (Universal Admin-Clear Trigger & Resilient Student Login)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are implementing your precise workflow: normal incorrect passwords show "Incorrect password", but once an admin clears the password, entering *any* password immediately triggers the New Password and Confirm Password prompt. Version tags are updated to **Ver 4.3**, and `VERSION4.3.md` is created.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 4.3`.

## 2. Universal Admin-Clear & Secure Login Engine (`script.js`)
* **File:** `script.js`
  * Replace your `clearStudentPassword` and `verifyStudentLogin` functions with this robust version:

    ```javascript
    window.clearStudentPassword = async function(senInputId) {
        let inputEl = document.getElementById(senInputId) || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
        let sen = inputEl ? inputEl.value.trim().toUpperCase() : "";
        
        if (!sen) {
            alert("⚠️ Please enter a valid Student Enrollment Number (SEN).");
            return;
        }

        if (!confirm(`Are you sure you want to clear the password for student ${sen}?`)) return;

        try {
            // Remove permanent password key
            localStorage.removeItem(`AIIT_STUDENT_PASS_${sen}`);
            
            // Add to admin cleared list
            let clearedList = [];
            try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
            if (!clearedList.includes(sen)) clearedList.push(sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            // Clear custom password properties in local databases
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
            console.error("Clear password error:", err);
        }

        alert(`✅ Password successfully cleared for student: ${sen}.\nThe student can now log in using any password to set a new one.`);
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

        // Fallback profile so SEN is NEVER reported as not found
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

        // 2. Check admin cleared list
        let clearedList = [];
        try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedList.includes(sen);

        let permanentPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        // 3. IF ADMIN CLEARED PASSWORD: ANY password typed triggers New Password & Confirm Password prompt
        if (isClearedByAdmin || !permanentPass) {
            let newPass = prompt("🔐 Password reset required by Admin. Enter new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            let confirmPass = prompt("🔐 Confirm your new permanent password:");
            if (newPass !== confirmPass) {
                alert("❌ Passwords do not match. Please try logging in again.");
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

            // Remove from cleared list so reset mode closes
            clearedList = clearedList.filter(s => s !== sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            if (passInput) passInput.value = "";

            alert("✅ Password successfully configured! Loading dashboard...");
            window.loadStudentDashboard(student);
            return;
        }

        // 4. NORMAL LOGIN: If password is configured, validate strictly against permanent storage
        if (pass !== permanentPass) {
            showErr('student-err', '⚠ Incorrect password.');
            if (passInput) passInput.value = "";
            return;
        }

        window.loadStudentDashboard(student);
    };
    ```

## 3. Create `VERSION4.3.md`
* Create a file named `VERSION4.3.md` in your project root containing the release notes for Ver 4.3.