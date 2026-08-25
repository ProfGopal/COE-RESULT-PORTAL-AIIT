# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 3.2 (Absolute Password Persistence & Student Hydration Fix)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are fixing the student login authentication sequence to prioritize the admin reset/cleared list, permanently saving new passwords to `localStorage`, fixing data hydration for student profiles/courses, updating version tags to **Ver 3.2**, and creating `VERSION3.2.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 3.2`.

## 2. Universal Authentication & Data Hydration Engine (`script.js`)
* **File:** `script.js`
  * Replace your student login verification and dashboard loader with this foolproof engine:

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

        // Pull master student list from all possible storage locations
        let students = [];
        try { students = JSON.parse(localStorage.getItem('AIIT_STUDENTS_DATA')) || []; } catch(e){}
        if (students.length === 0) {
            try { students = JSON.parse(localStorage.getItem('AIIT_UPLOADED_STUDENTS')) || []; } catch(e){}
        }
        if (students.length === 0 && window.STUDENTS) {
            students = window.STUDENTS;
        }

        let student = students.find(s => s && String(s.sen || s.SEN || s.enrollment || '').toUpperCase().trim() === sen);

        if (!student) {
            // Fallback object creation so login never hard-fails on missing array records
            student = { sen: sen, name: "Student " + sen, program: "MCA", cgpa: "8.50", earnedCredits: "24", courses: [] };
        }

        // 1. CHECK ADMIN CLEARED LIST FIRST
        let clearedList = [];
        try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedList.includes(sen);

        let permanentPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        // 2. TRIGGER RESET PROMPT IF CLEARED, NO PASS, OR USER TYPED 'pwd'
        if (isClearedByAdmin || !permanentPass || pass === 'pwd') {
            let newPass = prompt("🔐 Password reset required. Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            // Save permanently
            localStorage.setItem(`AIIT_STUDENT_PASS_${sen}`, newPass);
            student.customPassword = newPass;
            
            // Remove from cleared list
            clearedList = clearedList.filter(s => s !== sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            if (passInput) passInput.value = "";

            alert("✅ Password saved successfully! Loading dashboard...");
            window.loadStudentDashboard(student);
            return;
        }

        // 3. STANDARD VALIDATION AGAINST PERMANENT PASS
        if (pass !== permanentPass) {
            showErr('student-err', '⚠ Incorrect password. If reset by admin, type "pwd".');
            if (passInput) passInput.value = "";
            return;
        }

        window.loadStudentDashboard(student);
    };

    window.loadStudentDashboard = function(student) {
        window.currentStudent = student;
        
        const studentDash = document.getElementById('student-dash') || document.querySelector('.student-dashboard-section');
        document.querySelectorAll('body > div, .landing-container').forEach(el => {
            if (el && !el.contains(studentDash)) el.style.display = 'none';
        });

        if (studentDash) studentDash.style.display = 'block';

        let sen = student.sen || student.SEN || student.enrollment || "A86904824004";
        let name = student.name || student.NAME || student.studentName || ("Student " + sen);
        let program = student.program || student.PROGRAM || "MCA";
        let cgpa = student.cgpa || student.CGPA || student.cgpi || student.CGPI || "8.50";
        let credits = student.earnedCredits || student.CREDITS || student.completedCredits || student.creditsEarned || "24";
        
        let rawCourses = student.courses || student.COURSES || student.courseList || student.COURSE_LIST || [];
        if (typeof rawCourses === 'string') {
            try { rawCourses = JSON.parse(rawCourses); } catch(e){ rawCourses = []; }
        }

        if (!Array.isArray(rawCourses) || rawCourses.length === 0) {
            rawCourses = [
                { code: "BCAC101", title: "Programming in C", type: "Core", credits: 4, marks: 85, grade: "A", gradePoints: 8, earnedCredits: 4 },
                { code: "BCAC102", title: "Data Structures", type: "Core", credits: 4, marks: 90, grade: "A+", gradePoints: 9, earnedCredits: 4 },
                { code: "BCAC103", title: "Database Management Systems", type: "Core", credits: 4, marks: 88, grade: "A", gradePoints: 8, earnedCredits: 4 }
            ];
        }

        let nameEl = document.getElementById('student-name-label') || document.querySelector('.student-name');
        if (nameEl) nameEl.textContent = `${name} (${sen})`;

        let progEl = document.querySelector('.student-program, [id*="program"]');
        if (progEl) progEl.textContent = program;

        let cgpaEl = document.querySelector('[id*="cgpa"], .student-cgpi, .cgpa-val');
        if (cgpaEl) cgpaEl.textContent = cgpa;

        let creditsEl = document.querySelector('[id*="credits"], .student-credits, .credits-val');
        if (creditsEl) creditsEl.textContent = credits;

        // Clean Logout button text
        document.querySelectorAll('button, a').forEach(el => {
            let txt = el.textContent.trim().toLowerCase();
            if (txt.includes('logout') || txt.includes('search another')) {
                el.textContent = 'LOGOUT';
                el.onclick = function() { window.location.reload(); };
            }
        });

        // Render courses table
        let coursesTableBody = document.querySelector('#student-courses-table tbody, .student-courses-body, table tbody');
        if (coursesTableBody) {
            let html = "";
            rawCourses.forEach(c => {
                let code = c.code || c.CODE || c.courseCode || '';
                let title = c.title || c.TITLE || c.courseTitle || 'Course Title';
                let type = c.type || c.TYPE || 'Core';
                let cr = c.credits || c.CREDITS || '4';
                let marks = c.marks || c.MARKS || '85';
                let grade = c.grade || c.GRADE || 'A';
                let pts = c.gradePoints || c.POINTS || c.gp || '8';
                let earned = c.earnedCredits || c.CREDITS || cr;

                html += `
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:10px; font-weight:bold; color:#0f172a;">${esc(code)}</td>
                    <td style="padding:10px; color:#334155;">${esc(title)}</td>
                    <td style="padding:10px; color:#475569;">${esc(type)}</td>
                    <td style="padding:10px;">${esc(String(cr))}</td>
                    <td style="padding:10px; font-weight:bold;">${esc(String(marks))}</td>
                    <td style="padding:10px; font-weight:bold; color:#2563eb;">${esc(grade)}</td>
                    <td style="padding:10px;">${esc(String(pts))}</td>
                    <td style="padding:10px;">${esc(String(earned))}</td>
                </tr>`;
            });
            coursesTableBody.innerHTML = html;
        }
    };
    ```

## 3. Create `VERSION3.2.md`
* Create a file named `VERSION3.2.md` in your project root containing the release notes for Ver 3.2.