# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 4.1 (Strict One-Time Password Reset & Permanent Validation)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are enforcing that `pwd` only functions if the student is explicitly on the admin cleared list. Once a permanent password is created, `pwd` is permanently disabled for that student, and subsequent logins validate strictly against permanent storage, updating version tags to **Ver 4.1**, and creating `VERSION4.1.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 4.1`.

## 2. Strict One-Time Reset & Permanent Login Engine (`script.js`)
* **File:** `script.js`
  * Replace your student login verification function with this precise version:

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

        // 1. Load master student list
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
            showErr('student-err', '❌ SEN not found in active database.');
            return;
        }

        // 2. Check admin cleared list
        let clearedList = [];
        try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedList.includes(sen);

        let permanentPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        // 3. STRICT RULE: 'pwd' or prompt ONLY works if admin explicitly cleared the password
        if (isClearedByAdmin || !permanentPass) {
            if (pass !== 'pwd' && !isClearedByAdmin) {
                showErr('student-err', '⚠ Password reset required by admin. Please type "pwd".');
                if (passInput) passInput.value = "";
                return;
            }

            let newPass = prompt("🔐 Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
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

            // REMOVE from cleared list immediately so 'pwd' NEVER works again for this student
            clearedList = clearedList.filter(s => s !== sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            if (passInput) passInput.value = "";

            alert("✅ Password created successfully! Loading dashboard...");
            window.loadStudentDashboard(student);
            return;
        }

        // 4. NORMAL LOGIN: If student tries to type 'pwd' after password is created, reject it!
        if (pass === 'pwd') {
            showErr('student-err', '⚠ Password already configured. Please enter your active password (or contact Admin to reset).');
            if (passInput) passInput.value = "";
            return;
        }

        // 5. Strictly validate against permanent stored password
        if (pass !== permanentPass) {
            showErr('student-err', '⚠ Incorrect password.');
            if (passInput) passInput.value = "";
            return;
        }

        window.loadStudentDashboard(student);
    };
    ```

## 3. Create `VERSION4.1.md`
* Create a file named `VERSION4.1.md` in your project root containing the release notes for Ver 4.1.