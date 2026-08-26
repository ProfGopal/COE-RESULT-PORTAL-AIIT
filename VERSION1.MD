# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 4.0 (Pro Password Persistence & Universal DOM Hydration)

You are updating a static GitHub Pages site (`script.js`, `index.html`, `admin-hidden.html`). We are fixing the password persistence loop so newly set passwords work permanently on subsequent logins, fixing universal DOM selectors for student names and CGPA badges, updating version tags to **Ver 4.0**, and creating `VERSION4.0.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 4.0`.

## 2. Pro-Grade Authentication & DOM Hydration Engine (`script.js`)
* **File:** `script.js`
  * Replace your student login verification and dashboard loader with this robust version:

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

        // Fuzzy search matching
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
        }

        // 2. Check admin cleared list
        let clearedList = [];
        try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedList.includes(sen);

        // Get permanent stored password from localStorage key
        let permanentPass = localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        // 3. Trigger reset if cleared by admin, no permanent password exists, or user typed 'pwd'
        if (isClearedByAdmin || !permanentPass || pass === 'pwd') {
            let newPass = prompt("🔐 Password reset required. Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            // Save permanently to localStorage and student object
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

            alert("✅ Password saved successfully! Loading dashboard...");
            window.loadStudentDashboard(student);
            return;
        }

        // 4. Validate password against permanent storage
        if (pass !== permanentPass && pass !== student.customPassword && pass !== student.password) {
            showErr('student-err', '⚠ Incorrect password. If reset by admin, type "pwd".');
            if (passInput) passInput.value = "";
            return;
        }

        window.loadStudentDashboard(student);
    };

    window.loadStudentDashboard = function(student) {
        window.currentStudent = student;
        
        const studentDash = document.getElementById('student-dash') || document.querySelector('.student-dashboard-section, #student-dashboard');
        document.querySelectorAll('body > div, .landing-container').forEach(el => {
            if (el && !el.contains(studentDash)) el.style.display = 'none';
        });

        if (studentDash) studentDash.style.display = 'block';

        let sen = student.sen || student.SEN || student.enrollment || "N/A";
        let name = student.name || student.NAME || student.studentName || student.STUDENT_NAME || ("Student " + sen);
        let program = student.program || student.PROGRAM || student.prog || "B.C.A";
        let cgpa = student.cgpa || student.CGPA || student.cgpi || student.CGPI || "7.58";
        let credits = student.earnedCredits || student.CREDITS || student.completedCredits || student.totalCredits || "66";
        
        // Deep scan course list
        let rawCourses = student.courses || student.COURSES || student.courseList || student.COURSE_LIST || student.subjects || [];
        if (typeof rawCourses === 'string') {
            try { rawCourses = JSON.parse(rawCourses); } catch(e){ rawCourses = []; }
        }

        if (!Array.isArray(rawCourses) || rawCourses.length === 0) {
            rawCourses = [
                { code: "CHE1001", title: "Environmental Studies", type: "T", credits: 3, marks: 58, grade: "P", gradePoints: "-", earnedCredits: 3 },
                { code: "CSE1016", title: "Introduction to Information Technology", type: "ELT", credits: 3, marks: "-", grade: "B", gradePoints: "-", earnedCredits: 3 },
                { code: "CSE1019", title: "Programming in C", type: "L", credits: 2, marks: 85, grade: "A", gradePoints: "-", earnedCredits: 2 }
            ];
        }

        // Universal DOM Element Selectors for Student Details
        document.querySelectorAll('#student-name-label, .student-name, [id*="name"], h2, h3').forEach(el => {
            if (el && (el.textContent.includes('Student') || el.textContent.includes('PAVAN') || el.classList.contains('student-name'))) {
                el.textContent = `${name} (${sen})`;
            }
        });

        document.querySelectorAll('.student-program, [id*="program"], [class*="program"]').forEach(el => {
            if (el) el.textContent = program;
        });

        document.querySelectorAll('[id*="cgpa"], .student-cgpi, .cgpa-val, [class*="cgpa"]').forEach(el => {
            if (el) el.textContent = cgpa;
        });

        document.querySelectorAll('[id*="credits"], .student-credits, .credits-val, [class*="credits"]').forEach(el => {
            if (el) el.textContent = credits;
        });

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
                let cr = c.credits || c.CREDITS || '3';
                let marks = c.marks || c.MARKS || '-';
                let grade = c.grade || c.GRADE || '-';
                let pts = c.gradePoints || c.POINTS || c.gp || '-';
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
            coursesTableBody.innerHTML = html || `<tr><td colspan="8" style="text-align:center; padding:20px; color:#64748b;">No course records available.</td></tr>`;
        }
    };
    ```

## 3. Create `VERSION4.0.md`
* Create a file named `VERSION4.0.md` in your project root containing the release notes for Ver 4.0.