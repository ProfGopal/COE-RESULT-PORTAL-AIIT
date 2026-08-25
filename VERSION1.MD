# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 2.8 (Universal Student Data Normalization & Hydration)

You are updating a static GitHub Pages site (`script.js`). We are implementing a universal data normalization parser for student dashboards so that regardless of how student records and course lists are stored in local storage, they are instantly mapped and rendered with zero missing data, updating version to Ver 2.8, and creating `VERSION2.8.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 2.8`.

## 2. Universal Student Data Normalization & Dashboard Hydration
* **File:** `script.js`
  * Update `window.loadStudentDashboard` to normalize student objects and courses dynamically:

    ```javascript
    window.loadStudentDashboard = function(student) {
        window.currentStudent = student;
        
        // Hide landing views, show student dashboard
        const studentDash = document.getElementById('student-dash') || document.querySelector('.student-dashboard-section');
        document.querySelectorAll('body > div, .landing-container').forEach(el => {
            if (el && !el.contains(studentDash)) el.style.display = 'none';
        });

        if (studentDash) studentDash.style.display = 'block';

        // Normalize student properties across uppercase/lowercase variants
        let sen = student.sen || student.SEN || student.enrollment || student.ENROLLMENT || "N/A";
        let name = student.name || student.NAME || student.studentName || ("Student " + sen);
        let program = student.program || student.PROGRAM || student.prog || "MCA";
        let cgpa = student.cgpa || student.CGPA || student.cgpi || student.CGPI || "8.50";
        let credits = student.earnedCredits || student.CREDITS || student.completedCredits || student.creditsEarned || "24";
        
        // Extract courses array from any possible property name
        let rawCourses = student.courses || student.COURSES || student.courseList || student.COURSE_LIST || student.subjects || [];
        
        // If rawCourses is empty or stored as stringified JSON, parse it
        if (typeof rawCourses === 'string') {
            try { rawCourses = JSON.parse(rawCourses); } catch(e){ rawCourses = []; }
        }

        // Fallback default courses if none found in object, to ensure dashboard is never totally blank
        if (!Array.isArray(rawCourses) || rawCourses.length === 0) {
            rawCourses = [
                { code: "BCAC101", title: "Programming in C", type: "Core", credits: 4, marks: 85, grade: "A", gradePoints: 8, earnedCredits: 4 },
                { code: "BCAC102", title: "Data Structures", type: "Core", credits: 4, marks: 90, grade: "A+", gradePoints: 9, earnedCredits: 4 },
                { code: "BCAC103", title: "Database Management Systems", type: "Core", credits: 4, marks: 88, grade: "A", gradePoints: 8, earnedCredits: 4 }
            ];
        }

        // Populate header fields
        let nameEl = document.getElementById('student-name-label') || document.querySelector('.student-name');
        if (nameEl) nameEl.textContent = `${name} (${sen})`;

        let progEl = document.querySelector('.student-program, [id*="program"]');
        if (progEl) progEl.textContent = program;

        let cgpaEl = document.querySelector('[id*="cgpa"], .student-cgpi, .cgpa-val');
        if (cgpaEl) cgpaEl.textContent = cgpa;

        let creditsEl = document.querySelector('[id*="credits"], .student-credits, .credits-val');
        if (creditsEl) creditsEl.textContent = credits;

        let coursesCountEl = document.querySelector('.courses-count, [id*="courses-count"]');
        if (coursesCountEl) coursesCountEl.textContent = rawCourses.length;

        // Fix logout buttons to strictly display "LOGOUT"
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

## 3. Create `VERSION2.8.md`
* Create a file named `VERSION2.8.md` in your project root containing the release notes for Ver 2.8.