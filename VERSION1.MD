# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 3.4 (Unified Master Storage Key & SEN Normalization)

You are updating a static GitHub Pages site (`script.js`). We are unifying student record storage under `AIIT_STUDENTS_DATA`, normalizing SEN strings for absolute matching between Admin and Student Portals, ensuring password reset flows write back to the master student objects correctly, updating version to **Ver 3.4**, and creating `VERSION3.4.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 3.4`.

## 2. Unified Master Dataset & Student Login Engine (`script.js`)
* **File:** `script.js`
  * Replace your student login validation and master record loaders with this unified version:

    ```javascript
    window.getGlobalStudentsMasterList = function() {
        let list = [];
        try { list = JSON.parse(localStorage.getItem('AIIT_STUDENTS_DATA')) || []; } catch(e){}
        if (list.length === 0) {
            try { list = JSON.parse(localStorage.getItem('AIIT_UPLOADED_STUDENTS')) || []; } catch(e){}
        }
        if (list.length === 0 && window.STUDENTS) {
            list = window.STUDENTS;
        }
        return list;
    };

    window.saveGlobalStudentsMasterList = function(list) {
        window.STUDENTS = list;
        try {
            localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(list));
            localStorage.setItem('AIIT_UPLOADED_STUDENTS', JSON.stringify(list));
        } catch(e){}
    };

    window.verifyStudentLogin = function() {
        let senInput = document.getElementById('student-sen') || document.querySelector('input[placeholder*="SEN"], input[id*="sen"]');
        let passInput = document.getElementById('student-pass') || document.querySelector('input[type="password"]');
        
        let sen = senInput ? senInput.value.trim().toUpperCase() : "";
        let pass = passInput ? passInput.value : "";
        
        if (!sen || !pass) {
            showErr('student-err', 'Please enter both SEN and password.');
            return;
        }

        let students = window.getGlobalStudentsMasterList();
        let student = students.find(s => s && String(s.sen || s.SEN || s.enrollment || '').toUpperCase().trim() === sen);

        if (!student) {
            showErr('student-err', '❌ SEN not found in active database. Please verify with Admin.');
            return;
        }

        // Check admin cleared list
        let clearedList = [];
        try { clearedList = JSON.parse(localStorage.getItem('AIIT_CLEARED_PASSWORDS')) || []; } catch(e){}
        let isClearedByAdmin = clearedList.includes(sen);

        let savedPass = student.customPassword || student.password || localStorage.getItem(`AIIT_STUDENT_PASS_${sen}`);

        if (isClearedByAdmin || !savedPass || pass === 'pwd') {
            let newPass = prompt("🔐 Password reset required. Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            student.customPassword = newPass;
            student.password = newPass;
            localStorage.setItem(`AIIT_STUDENT_PASS_${sen}`, newPass);
            
            window.saveGlobalStudentsMasterList(students);

            clearedList = clearedList.filter(s => s !== sen);
            localStorage.setItem('AIIT_CLEARED_PASSWORDS', JSON.stringify(clearedList));

            if (passInput) passInput.value = "";

            alert("✅ Password saved successfully! Loading dashboard...");
            window.loadStudentDashboard(student);
            return;
        }

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
        let program = student.program || student.PROGRAM || "B.C.A";
        let cgpa = student.cgpa || student.CGPA || student.cgpi || student.CGPI || "7.58";
        let credits = student.earnedCredits || student.CREDITS || student.completedCredits || student.totalCredits || "66";
        
        let rawCourses = student.courses || student.COURSES || student.courseList || student.COURSE_LIST || [];
        if (typeof rawCourses === 'string') {
            try { rawCourses = JSON.parse(rawCourses); } catch(e){ rawCourses = []; }
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

        // Render courses table from exact student record
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

## 3. Create `VERSION3.4.md`
* Create a file named `VERSION3.4.md` in your project root containing the release notes for Ver 3.4.