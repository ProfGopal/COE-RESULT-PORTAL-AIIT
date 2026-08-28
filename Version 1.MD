```python
# Let's analyze the user's requirements for Ver 1.7.2:
# 1. Admin Panel Filter Dropdowns: Looking at image_8a2898.jpg, the filter dropdowns ("All Years", "All Programs", "All Credits", "Sort Credits: Default") are rendering with limited options or getting cut off / not populated correctly because `renderSystemPrograms()` or admin filter setup isn't populating them dynamically from `window.SYSTEM_PROGRAMS` and `window.STUDENTS`.
# 2. Comprehensive Filtering Options for Admin & Faculty Logins:
#    - Year / Batch filter (All Years + dynamic years)
#    - Program filter (All Programs + dynamic programs)
#    - Backlogs / Has Backlogs filter (All Students, Has Backlogs / Failed Courses, Clean / No Backlogs)
#    - CGPA Range / Sorting (High to Low CGPA, Low to High CGPA)
#    - Credits Sorting & Filtering (Low to High Credits, High to Low Credits)
#    - Search box (SEN or Student Name)
# 3. Ensure both Admin and Faculty student directory tables share this exact robust filtering and sorting engine.

print("Designing Ver 1.7.2 Master Advanced Filtering & Sorting Suite")


```

```text
Designing Ver 1.7.2 Master Advanced Filtering & Sorting Suite


```

# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 1.7.2 (Advanced Student Filters & Sorting Suite)

You are updating a static GitHub Pages site (`script.js`). Looking at your screenshot (`image_8a2898.jpg`), the filter dropdowns ("All Years", "All Programs", "All Credits", "Sort Credits") were not fully populating or responding.

Here is the master repair. This builds a **comprehensive advanced filtering and sorting engine** for both the **Admin Panel** and **Faculty Portal** containing:

1. **Batch / Year Filter** (auto-populated from cloud records)
2. **Program Filter** (auto-populated from cloud records)
3. **Backlog Filter** (All Students, Has Backlogs Only, Zero Backlogs)
4. **Credit Sorting** (Low to High Credits, High to Low Credits)
5. **CGPA Sorting** (Highest CGPA first, Lowest CGPA first)
6. **Live Search** (by SEN or Name)

---

### 📋 Copy this entire block and paste it into Antigravity IDE (`script.js`):

```javascript
/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 1.7.2 - Advanced Student Filters & Sorting Suite)
 */

'use strict';

// --- 1. BACKLOG CHECKER HELPER ---
window.getActiveBacklogs = function(courses) {
    let history = {};
    (courses || []).forEach(c => {
        if (!c.code || c.code === 'NAN') return;
        let code = String(c.code).toUpperCase().trim();
        if (!history[code]) history[code] = { passed: false, latest: c };
        let isFail = ['F', 'AB', 'DE', 'I', 'U'].includes(String(c.grade || c.Grade || '').toUpperCase().trim());
        if (!isFail) history[code].passed = true;
        else if (!history[code].passed) history[code].latest = c;
    });
    let backlogs = [];
    for (let code in history) {
        if (!history[code].passed) backlogs.push(history[code].latest);
    }
    return backlogs;
};

// --- 2. POPULATE FILTER DROPDOWNS DYNAMICALLY ---
window.populateFilterDropdowns = function() {
    let batches = [...new Set((window.STUDENTS || []).map(s => String(s.batch || '').trim()))].filter(Boolean);
    let programs = [...new Set((window.STUDENTS || []).map(s => String(s.program || '').trim()))].filter(Boolean);

    if (batches.length === 0) batches = ["2024", "2025"];
    if (programs.length === 0) programs = ["MCA", "B.C.A"];

    // Update Admin & Faculty Batch dropdowns
    document.querySelectorAll('#filter-batch, select[id*="batch"], select[id*="Year"]').forEach(sel => {
        let current = sel.value;
        sel.innerHTML = `<option value="">All Years / Batches</option>` + batches.map(b => `<option value="${b}">${b}</option>`).join('');
        if (current) sel.value = current;
    });

    // Update Admin & Faculty Program dropdowns
    document.querySelectorAll('#filter-program, select[id*="program"], select[id*="Program"]').forEach(sel => {
        let current = sel.value;
        sel.innerHTML = `<option value="">All Programs</option>` + programs.map(p => `<option value="${p}">${p}</option>`).join('');
        if (current) sel.value = current;
    });
};

// --- 3. ROBUST ADMIN FILTER & SORT ENGINE ---
window.applyAdminFilters = async function() {
    var tbody = document.getElementById('admin-tbody');
    var totalStu = document.getElementById('total-stu');
    if (!tbody) return;

    if (window.STUDENTS.length === 0) {
        await window.initializeCloudPortal();
    }

    window.populateFilterDropdowns();

    const searchInput = document.querySelector('input[placeholder*="sunil"], input[placeholder*="Search"], #admin-search-input');
    const searchTxt = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const batchSel = document.getElementById('filter-batch') ? document.getElementById('filter-batch').value.trim() : "";
    const progSel = document.getElementById('filter-program') ? document.getElementById('filter-program').value.trim() : "";
    
    // Additional Advanced Filters
    const backlogSel = document.getElementById('filter-backlog') ? document.getElementById('filter-backlog').value.trim() : "";
    const sortSel = document.getElementById('sort-credits') ? document.getElementById('sort-credits').value.trim() : "";

    let filtered = window.STUDENTS.filter(s => {
        let matchSearch = !searchTxt || String(s.sen || '').toLowerCase().includes(searchTxt) || String(s.name || '').toLowerCase().includes(searchTxt);
        let matchBatch = !batchSel || String(s.batch || '').trim() === batchSel;
        let matchProg = !progSel || String(s.program || '').trim() === progSel;
        
        let backlogs = window.getActiveBacklogs(s.courses);
        let matchBacklog = true;
        if (backlogSel === 'has_backlog') matchBacklog = backlogs.length > 0;
        else if (backlogSel === 'no_backlog') matchBacklog = backlogs.length === 0;

        return matchSearch && matchBatch && matchProg && matchBacklog;
    });

    // Sorting
    if (sortSel === 'cred_low_high') {
        filtered.sort((a, b) => parseFloat(a.totalCredits || 0) - parseFloat(b.totalCredits || 0));
    } else if (sortSel === 'cred_high_low') {
        filtered.sort((a, b) => parseFloat(b.totalCredits || 0) - parseFloat(a.totalCredits || 0));
    } else if (sortSel === 'cgpa_high_low') {
        filtered.sort((a, b) => parseFloat(b.cgpa || 0) - parseFloat(a.cgpa || 0));
    } else if (sortSel === 'cgpa_low_high') {
        filtered.sort((a, b) => parseFloat(a.cgpa || 0) - parseFloat(b.cgpa || 0));
    }

    if (totalStu) totalStu.textContent = filtered.length;

    // Inject advanced filter bar if missing
    let searchContainer = searchInput ? searchInput.parentElement : tbody.closest('table').previousElementSibling;
    if (searchContainer && !document.getElementById('admin-advanced-filter-bar')) {
        let filterBar = document.createElement('div');
        filterBar.id = 'admin-advanced-filter-bar';
        filterBar.style.cssText = 'display:flex; gap:10px; margin:15px 0; flex-wrap:wrap; align-items:center;';
        filterBar.innerHTML = `
            <select id="filter-backlog" onchange="window.applyAdminFilters()" style="padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:white;">
                <option value="">All Backlog Status</option>
                <option value="has_backlog">⚠️ Has Backlogs / Failed</option>
                <option value="no_backlog">✅ Zero Backlogs (Clean)</option>
            </select>
            <select id="sort-credits" onchange="window.applyAdminFilters()" style="padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:white;">
                <option value="">Sort: Default</option>
                <option value="cred_high_low">Credits: High to Low</option>
                <option value="cred_low_high">Credits: Low to High</option>
                <option value="cgpa_high_low">CGPA: High to Low</option>
                <option value="cgpa_low_high">CGPA: Low to High</option>
            </select>
        `;
        searchContainer.appendChild(filterBar);
    }

    tbody.innerHTML = filtered.map((s, i) => {
        let cRaw = parseFloat(s.cgpa);
        let cFormatted = !isNaN(cRaw) ? cRaw.toFixed(2) : 'N/A';
        let backlogsCount = window.getActiveBacklogs(s.courses).length;

        return `
        <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:10px;">${i + 1}</td>
            <td style="font-weight:bold;">${esc(s.sen)}</td>
            <td>${esc(s.name)}</td>
            <td>${esc(s.program || 'N/A')}</td>
            <td style="font-weight:bold; color:#3b82f6;">${cFormatted}</td>
            <td>${s.totalCredits || '0'}</td>
            <td><span style="padding:3px 8px; border-radius:4px; font-weight:bold; background:${backlogsCount > 0 ? '#fee2e2' : '#dcfce3'}; color:${backlogsCount > 0 ? '#dc2626' : '#16a34a'};">${backlogsCount}</span></td>
            <td><button style="background:#0ea5e9; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;" onclick="window.openAdminStudentView('${esc(s.sen)}')">Details</button></td>
        </tr>`;
    }).join('');
};

// --- 4. ROBUST FACULTY FILTER & SORT ENGINE ---
window.switchFacultyTab = function(tabName) {
    let area = document.getElementById('faculty-tab-content-area');
    if (!area) return;

    let btnDir = document.getElementById('fac-tab-dir');
    let btnCurr = document.getElementById('fac-tab-curr');
    if (btnDir && btnCurr) {
        btnDir.style.background = (tabName === 'directory') ? '#2563eb' : '#f1f5f9';
        btnDir.style.color = (tabName === 'directory') ? 'white' : '#475569';
        btnCurr.style.background = (tabName === 'curriculum') ? '#2563eb' : '#f1f5f9';
        btnCurr.style.color = (tabName === 'curriculum') ? 'white' : '#475569';
    }

    if (tabName === 'directory') {
        let batches = [...new Set((window.STUDENTS || []).map(s => String(s.batch || '').trim()))].filter(Boolean);
        let programs = [...new Set((window.STUDENTS || []).map(s => String(s.program || '').trim()))].filter(Boolean);

        area.innerHTML = `
            <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;">
                <input type="text" id="faculty-search-input" placeholder="Search SEN or Name..." oninput="window.facultyFilterAndSort()" style="flex:1; min-width:200px; padding:8px; border:1px solid #cbd5e1; border-radius:6px;" />
                <select id="filter-batch" onchange="window.facultyFilterAndSort()" style="padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:white;">
                    <option value="">All Years / Batches</option>
                    ${batches.map(b => `<option value="${b}">${b}</option>`).join('')}
                </select>
                <select id="filter-program" onchange="window.facultyFilterAndSort()" style="padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:white;">
                    <option value="">All Programs</option>
                    ${programs.map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
                <select id="filter-backlog" onchange="window.facultyFilterAndSort()" style="padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:white;">
                    <option value="">All Backlog Status</option>
                    <option value="has_backlog">⚠️ Has Backlogs / Failed</option>
                    <option value="no_backlog">✅ Zero Backlogs (Clean)</option>
                </select>
                <select id="sort-credits" onchange="window.facultyFilterAndSort()" style="padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:white;">
                    <option value="">Sort: Default</option>
                    <option value="cred_high_low">Credits: High to Low</option>
                    <option value="cred_low_high">Credits: Low to High</option>
                    <option value="cgpa_high_low">CGPA: High to Low</option>
                    <option value="cgpa_low_high">CGPA: Low to High</option>
                </select>
            </div>
            <div style="background:white; border-radius:8px; border:1px solid #cbd5e1; overflow:hidden;">
                <table style="width:100%; border-collapse:collapse; text-align:left;">
                    <thead>
                        <tr style="background:#f8fafc; border-bottom:2px solid #cbd5e1; color:#334155;">
                            <th style="padding:12px;">SEN</th>
                            <th style="padding:12px;">Name</th>
                            <th style="padding:12px;">CGPA</th>
                            <th style="padding:12px;">Credits Earned</th>
                            <th style="padding:12px;">Backlogs</th>
                            <th style="padding:12px; text-align:right;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="faculty-directory-tbody"></tbody>
                </table>
            </div>
        `;
        window.facultyFilterAndSort();
    } else if (tabName === 'curriculum') {
        window.renderFacultyCurriculumTab(area);
    }
};

window.facultyFilterAndSort = function() {
    let students = window.STUDENTS || [];
    const searchInput = document.getElementById('faculty-search-input');
    const searchTxt = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const batchSel = document.getElementById('filter-batch') ? document.getElementById('filter-batch').value.trim() : "";
    const progSel = document.getElementById('filter-program') ? document.getElementById('filter-program').value.trim() : "";
    const backlogSel = document.getElementById('filter-backlog') ? document.getElementById('filter-backlog').value.trim() : "";
    const sortSel = document.getElementById('sort-credits') ? document.getElementById('sort-credits').value.trim() : "";

    let filtered = students.filter(s => {
        let matchSearch = !searchTxt || String(s.sen || '').toLowerCase().includes(searchTxt) || String(s.name || '').toLowerCase().includes(searchTxt);
        let matchBatch = !batchSel || String(s.batch || '').trim() === batchSel;
        let matchProg = !progSel || String(s.program || '').trim() === progSel;
        
        let backlogs = window.getActiveBacklogs(s.courses);
        let matchBacklog = true;
        if (backlogSel === 'has_backlog') matchBacklog = backlogs.length > 0;
        else if (backlogSel === 'no_backlog') matchBacklog = backlogs.length === 0;

        return matchSearch && matchBatch && matchProg && matchBacklog;
    });

    if (sortSel === 'cred_low_high') {
        filtered.sort((a, b) => parseFloat(a.totalCredits || 0) - parseFloat(b.totalCredits || 0));
    } else if (sortSel === 'cred_high_low') {
        filtered.sort((a, b) => parseFloat(b.totalCredits || 0) - parseFloat(a.totalCredits || 0));
    } else if (sortSel === 'cgpa_high_low') {
        filtered.sort((a, b) => parseFloat(b.cgpa || 0) - parseFloat(a.cgpa || 0));
    } else if (sortSel === 'cgpa_low_high') {
        filtered.sort((a, b) => parseFloat(a.cgpa || 0) - parseFloat(b.cgpa || 0));
    }

    let tbody = document.getElementById('faculty-directory-tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748b;">No matching students found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(s => {
        let cRaw = parseFloat(s.cgpa);
        let cFormatted = !isNaN(cRaw) ? cRaw.toFixed(2) : 'N/A';
        let backlogsCount = window.getActiveBacklogs(s.courses).length;

        return `
        <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:12px; font-weight:bold;">${esc(s.sen)}</td>
            <td style="padding:12px;">${esc(s.name)}</td>
            <td style="padding:12px; font-weight:bold; color:#3b82f6;">${cFormatted}</td>
            <td style="padding:12px; font-weight:bold;">${s.totalCredits || '0'}</td>
            <td style="padding:12px;"><span style="padding:3px 8px; border-radius:4px; font-weight:bold; background:${backlogsCount > 0 ? '#fee2e2' : '#dcfce3'}; color:${backlogsCount > 0 ? '#dc2626' : '#16a34a'};">${backlogsCount}</span></td>
            <td style="padding:12px; text-align:right;"><button style="background:#0ea5e9; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;" onclick="window.openFacultyStudentView('${esc(s.sen)}')">Details</button></td>
        </tr>`;
    }).join('');
};

```