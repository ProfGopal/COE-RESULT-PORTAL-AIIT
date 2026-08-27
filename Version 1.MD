# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 8.1 (UI Layout & Faculty Filter Repair)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are fixing the curriculum editor dropdown population, removing layout white-space gaps in the faculty dashboard, enabling auto-loading for student directory filters, and streamlining the student portal logout button, updating version tags to **Ver 8.1**, and creating `VERSION8.1.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html`, `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 8.1`.

## 2. UI & Filter Repair Engine (`script.js`)
* **File:** `script.js`
  * Add or replace these precise modules to fix the curriculum dropdown, faculty gaps, student directory filters, and logout button:

    ```javascript
    /**
     * script.js — AIIT COE Result Portal
     * Master Script Engine (Ver 8.1 - UI & Filter Fixes)
     */

    'use strict';

    // --- 1. CURRICULUM EDITOR DROPDOWN FIX ---
    window.loadCurriculumEditor = function() {
        const container = document.getElementById('curriculum-edit-key') || document.querySelector('#tab-curriculum select, select[id*="curr"]');
        let sysProgs = [];
        try { sysProgs = JSON.parse(localStorage.getItem('AIIT_SYSTEM_PROGRAMS')) || window.SYSTEM_PROGRAMS || []; } catch(e){}
        if (sysProgs.length === 0) {
            sysProgs = [{ batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }, { batch: "2024", program: "B.C.A" }];
        }

        if (container) {
            container.innerHTML = sysProgs.map(p => {
                let key = `${p.batch}_${p.program}`;
                let label = `${p.batch} ${p.program}`;
                return `<option value="${key}">${label}</option>`;
            }).join('');
        }
    };

    // --- 2. FACULTY DASHBOARD GAP & FILTER FIX ---
    window.renderFacultyPortal = async function(email) {
        let facultyDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section');
        if (!facultyDash) return;

        facultyDash.style.position = 'relative';
        facultyDash.style.top = '0';
        facultyDash.style.left = '0';
        facultyDash.style.width = '100%';
        facultyDash.style.height = 'auto';
        facultyDash.style.minHeight = '100vh';
        facultyDash.style.zIndex = '10';
        facultyDash.style.background = '#f8fafc';
        document.body.style.overflow = 'auto'; // Remove whitespace gaps

        // Auto-load students for directory filters
        if (!window.STUDENTS || window.STUDENTS.length === 0) {
            await window.initializeCloudPortal();
        }
        if (typeof window.facultyFilterAndSort === 'function') {
            window.facultyFilterAndSort();
        }
    };

    window.facultyFilterAndSort = function() {
        let students = window.STUDENTS || window.ALL_STUDENTS || [];
        const searchInput = document.getElementById('faculty-search-input') || document.querySelector('input[placeholder*="Search"]');
        const searchTxt = searchInput ? searchInput.value.toLowerCase().trim() : "";
        
        const batchSel = document.getElementById('filter-batch') ? document.getElementById('filter-batch').value.trim() : "";
        const progSel = document.getElementById('filter-program') ? document.getElementById('filter-program').value.trim() : "";

        let filtered = students.filter(s => {
            const matchSearch = !searchTxt || String(s.sen || '').toLowerCase().includes(searchTxt) || String(s.name || '').toLowerCase().includes(searchTxt);
            const matchBatch = !batchSel || String(s.batch || '').trim() === batchSel;
            const matchProg = !progSel || String(s.program || '').trim() === progSel;
            return matchSearch && matchBatch && matchProg;
        });

        window.RENDERED_STUDENTS = filtered;
        renderStudentTable(filtered);
    };

    // --- 3. STUDENT PORTAL LOGOUT STREAMLINE ---
    window.loadStudentDashboard = function(student) {
        window.currentStudent = student;
        document.querySelectorAll('.page, .login-container, #student-login-container, .landing-container').forEach(el => {
            if (el) el.style.display = 'none';
        });
        
        const dash = document.getElementById('student-dash') || document.getElementById('student-dashboard');
        if (dash) {
            dash.style.display = 'block';
            dash.classList.add('dashboard-fullscreen-overlay');
        }

        let name = student.name || 'Student';
        let sen = student.sen || '';
        let cgpa = student.cgpa || 'N/A';
        let credits = student.totalCredits || '0';

        document.querySelectorAll('#dash-name, .student-name').forEach(el => el.textContent = `${name} (${sen})`);
        document.querySelectorAll('#dash-cgpa, .cgpa-val').forEach(el => el.textContent = cgpa);
        document.querySelectorAll('#dash-ce, .credits-val').forEach(el => el.textContent = credits);

        // Clean up bottom logout button to say ONLY "LOGOUT"
        document.querySelectorAll('button, a').forEach(el => {
            let txt = el.textContent.trim().toLowerCase();
            if (txt.includes('logout') || txt.includes('search another')) {
                el.textContent = 'LOGOUT';
                el.onclick = function() { window.logoutPortal(); };
            }
        });

        let tbody = document.getElementById('courses-tbody') || document.querySelector('table tbody');
        if (tbody && student.courses) {
            tbody.innerHTML = student.courses.map(c => `
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:10px; font-weight:bold;">${esc(c.code)}</td>
                    <td style="padding:10px;">${esc(c.name)}</td>
                    <td style="padding:10px;">${esc(c.type || 'Core')}</td>
                    <td style="padding:10px;">${esc(c.credits)}</td>
                    <td style="padding:10px;">${esc(c.marks)}</td>
                    <td style="padding:10px; font-weight:bold; color:#2563eb;">${esc(c.grade)}</td>
                </tr>
            `).join('');
        }
    };
    ```

## 3. Create `VERSION8.1.md`
* Create a file named `VERSION8.1.md` in your project root containing the release notes for Ver 8.1.