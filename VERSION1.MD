# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 3.3 (Password State Machine & Permanent Student Data Hydration)

You are updating a static GitHub Pages site (`script.js`). We are fixing the student password lifecycle state machine so that newly configured passwords are permanently saved to the master records array and local storage, ensuring subsequent logins never fail, and ensuring course data, CGPA, and credits hydrate correctly on the dashboard. Update version tags to **Ver 3.3** and create `VERSION3.3.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 3.3`.

## 2. Bulletproof State Machine Authentication & Data Hydration Engine (`script.js`)
* **File:** `script.js`
  * Replace your student login verification and dashboard loading functions with this robust version:

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

        // 1. Load master student list from local storage pools
        let masterStudents = [];
        try { masterStudents = JSON.parse(localStorage.getItem('AIIT_STUDENTS_DATA')) || []; } catch(e){}
        if (masterStudents.length === 0) {
            try { masterStudents = JSON.parse(localStorage.getItem('AIIT_UPLOADED_STUDENTS')) || []; } catch(e){}
        }
        if (masterStudents.length === 0 && window.STUDENTS) {
            masterStudents = window.STUDENTS;
        }

        let student = masterStudents.find(s => s && String(s.sen || s.SEN || s.enrollment || '').toUpperCase().trim() === sen);

        if (!student) {
            // Auto-hydrate fallback record if missing
            student = {
                sen: sen,
                name: "Student " + sen,
                program: "MCA",
                cgpa: "8.50",
                earnedCredits: "24",
                courses: [
                    { code: "BCAC101", title: "Programming in C", type: "Core", credits: 4, marks: 85, grade: "A", gradePoints: 8, earnedCredits: 4 },
                    { code: "BCAC102", title: "Data Structures", type: "Core", credits: 4, marks: 90, grade: "A+", gradePoints: 9, earnedCredits: 4 }
                ]
            };
            masterStudents.push(student);
        }

        // 2. Check admin cleared list
        let clearedList = [];
        try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedList.includes(sen);

        // Check password source: object property or localStorage backup
        let savedPass = student.customPassword || student.password || localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        // 3. Trigger reset prompt if cleared by admin, no password exists, or user typed 'pwd'
        if (isClearedByAdmin || !savedPass || pass === 'pwd') {
            let newPass = prompt("🔐 Password reset required. Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            // Permanently update student record properties
            student.customPassword = newPass;
            student.password = newPass;
            
            // Save to individual storage and master storage array
            localStorage.setItem(`AIIT_STUDENT_PASS_${sen}`, newPass);
            try {
                localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(masterStudents));
                localStorage.setItem('AIIT_UPLOADED_STUDENTS', JSON.stringify(masterStudents));
            } catch(e){}

            // Clear from admin reset list
            clearedList = clearedList.filter(s => s !== sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            if (passInput) passInput.value = "";

            alert("✅ Password saved successfully! Loading dashboard...");
            window.loadStudentDashboard(student);
            return;
        }

        // 4. Standard validation against saved password
        if (pass !== savedPass) {
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

        let sen = student.sen || student.SEN || student.enrollment || "N/A";
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

## 3. Create `VERSION3.3.md`
* Create a file named `VERSION3.3.md` in your project root containing the release notes for Ver 3.3.