# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 2.5 (Bulletproof Universal Student Login & Auto-Enrollment Recovery)

You are updating a static GitHub Pages site (`script.js`). We are upgrading the student login validator so that if a student record isn't found in the temporary memory array, it auto-recovers the student profile from local storage or allows direct authentication and password resetting, updating version to Ver 2.5, and creating `VERSION2.5.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 2.5`.

## 2. Bulletproof Student Login & Auto-Recovery Handler
* **File:** `script.js`
  * Replace your student login verification function with this resilient version:

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

        // 1. Retrieve students from window or LocalStorage backup
        let students = window.STUDENTS || [];
        if (students.length === 0) {
            try { students = JSON.parse(localStorage.getItem('AIIT_STUDENTS_DATA')) || []; } catch(e){}
        }

        let student = students.find(s => String(s.sen).toUpperCase().trim() === sen);

        // 2. Auto-Recovery if student object is missing from memory array
        if (!student) {
            student = {
                sen: sen,
                name: "Student " + sen,
                program: "MCA",
                batch: "2024",
                cgpa: "0.00",
                customPassword: ""
            };
            students.push(student);
            window.STUDENTS = students;
            try { localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(students)); } catch(e){}
        }

        // Check if admin cleared password or first time
        let clearedPasswords = [];
        try { clearedPasswords = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedPasswords.includes(sen);

        if (isClearedByAdmin || !student.customPassword || pass === 'pwd' || pass === '') {
            let newPass = prompt("🔐 Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            student.customPassword = newPass;
            try {
                localStorage.setItem(`AIIT_STUDENT_PASS_${sen}`, newPass);
                clearedPasswords = clearedPasswords.filter(s => s !== sen);
                localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedPasswords));
                localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(students));
            } catch(e){}

            alert("✅ Password saved successfully! Logging you in...");
            window.loadStudentDashboard(student);
            return;
        }

        // Password check
        let savedPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`) || student.customPassword;
        if (pass !== savedPass) {
            showErr('student-err', '⚠ Incorrect password. (Type "pwd" if password was recently cleared).');
            return;
        }

        window.loadStudentDashboard(student);
    };
    ```

## 3. Create `VERSION2.5.md`
* Create a file named `VERSION2.5.md` in your project root containing the release notes for Ver 2.5.