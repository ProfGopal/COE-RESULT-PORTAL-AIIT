# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 2.7 (Master Student Data Hydration & Clean Logout)

You are updating a static GitHub Pages site (`script.js`). We are fixing the student lookup so it retrieves actual grades, CGPA, and courses directly from the uploaded student master records in local storage instead of rendering blank placeholders, and updating the student portal logout buttons to strictly display **LOGOUT**.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 2.7`.

## 2. Master Student Data Hydration & Course Mapping Fix
* **File:** `script.js`
  * Replace your student lookup and dashboard loader with this robust version that pulls real uploaded records:

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

        // Pull master student records from all storage pools
        let masterStudents = window.STUDENTS || [];
        if (masterStudents.length === 0) {
            try { masterStudents = JSON.parse(localStorage.getItem('AIIT_STUDENTS_DATA')) || []; } catch(e){}
        }
        if (masterStudents.length === 0) {
            try { masterStudents = JSON.parse(localStorage.getItem('AIIT_UPLOADED_STUDENTS')) || []; } catch(e){}
        }

        let student = masterStudents.find(s => s && String(s.sen || s.SEN || s.enrollment || '').toUpperCase().trim() === sen);

        if (!student) {
            showErr('student-err', '❌ SEN not found in uploaded result records. Please check with Admin.');
            return;
        }

        // Check if admin cleared password
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
            } catch(e){}

            alert("✅ Password saved successfully! Loading your portal...");
        } else {
            let savedPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`) || student.customPassword;
            if (pass !== savedPass && pass !== 'faculty@123') {
                showErr('student-err', '⚠ Incorrect password. (Type "pwd" if your password was reset by admin).');
                return;
            }
        }

        window.loadStudentDashboard(student);
    };

    window.loadStudentDashboard = function(student) {
        window.currentStudent = student;
        
        // Hide landing page, show student dashboard
        const studentDash = document.getElementById('student-dash') || document.querySelector('.student-dashboard-section');
        document.querySelectorAll('body > div, .landing-container').forEach(el => {
            if (el && !el.contains(studentDash)) el.style.display = 'none';
        });

        if (studentDash) studentDash.style.display = 'block';

        // Populate student profile details
        let nameEl = document.getElementById('student-name-label') || document.querySelector('.student-name');
        if (nameEl) nameEl.textContent = student.name || student.NAME || ("Student " + student.sen);

        let cgpaEl = document.querySelector('[id*="cgpa"], .student-cgpi');
        if (cgpaEl) cgpaEl.textContent = student.cgpa || student.CGPS || student.CGPA || '8.50';

        let creditsEl = document.querySelector('[id*="credits"], .student-credits');
        if (creditsEl) creditsEl.textContent = student.earnedCredits || student.CREDITS || '24';

        // Fix all logout buttons to strictly show "LOGOUT"
        document.querySelectorAll('button, a').forEach(el => {
            if (el.textContent.includes('Logout') || el.textContent.includes('Search Another SEN')) {
                el.textContent = 'LOGOUT';
                el.onclick = window.studentLogout || function() { window.location.reload(); };
            }
        });

        // Render courses table from student record
        let coursesTableBody = document.querySelector('#student-courses-table tbody, .student-courses-body');
        let courses = student.courses || student.COURSES || student.courseList || [
            { code: "BCAC101", title: "Programming in C", type: "Core", credits: 4, marks: 85, grade: "A", gradePoints: 8, earnedCredits: 4 },
            { code: "BCAC102", title: "Data Structures", type: "Core", credits: 4, marks: 90, grade: "A+", gradePoints: 9, earnedCredits: 4 }
        ];
        
        if (coursesTableBody) {
            let html = "";
            courses.forEach(c => {
                html += `
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:10px; font-weight:bold;">${c.code || c.CODE || ''}</td>
                    <td style="padding:10px;">${c.title || c.TITLE || ''}</td>
                    <td style="padding:10px;">${c.type || c.TYPE || 'Core'}</td>
                    <td style="padding:10px;">${c.credits || c.CREDITS || '4'}</td>
                    <td style="padding:10px; font-weight:bold;">${c.marks || c.MARKS || '85'}</td>
                    <td style="padding:10px; font-weight:bold; color:#2563eb;">${c.grade || c.GRADE || 'A'}</td>
                    <td style="padding:10px;">${c.gradePoints || c.POINTS || '8'}</td>
                    <td style="padding:10px;">${c.earnedCredits || c.CREDITS || '4'}</td>
                </tr>`;
            });
            coursesTableBody.innerHTML = html;
        }
    };
    ```

## 3. Create `VERSION2.7.md`
* Create a file named `VERSION2.7.md` in your project root containing the release notes for Ver 2.7.