# AIIT COE Result Portal — Version 12.0 Release Notes

**Release Date:** 2026-08-27  
**Codename:** Faculty Dashboard, Filter, Details & Curriculum Loader Repair

---

## What's New

### 1. Global Versioning Update
- Version display in `index.html` and `admin-hidden.html` updated to **Ver 12.0**.

### 2. Faculty Dashboard Whitespace Gap Removal
- Hides landing page elements (`.landing-container`, `#student-login-container`, `#faculty-login-container`) upon faculty login.
- Sets full viewport min-height (`min-height: 100vh`) and clean background styling to eliminate whitespace layout gaps.

### 3. Faculty Dashboard Filters & Table Rendering
- Fixed `facultyFilterAndSort()` and `facultyViewAll()` functions to correctly filter and display student records by SEN, student name, batch, and program.
- Wired student count badge to update dynamically on filtering.

### 4. Student Details Modal Trigger (`openFacultyStudentView`)
- `openFacultyStudentView(sen)` safely loads student data and renders the full student report view directly for faculty inspection without causing errors.

### 5. Admin Curriculum Manager Repair
- `loadCurriculumEditor()` populates the program selection dropdown with active system programs.
- Fixed `triggerLoadCurriculum()` execution on clicking **Load Curriculum** button.

### 6. Faculty Login Audit & Security Dashboard (Tab 4)
- Renders the authorized faculty directory and real-time login audit log in Tab 4 (`tab-faculty`) with one-click **Reset Password** controls.

---

## Files Updated
| File | Change |
|---|---|
| `index.html` | Version tag updated to `Ver 12.0` |
| `admin-hidden.html` | Version tag updated to `Ver 12.0` |
| `script.js` | Updated Master Script Engine to `Ver 12.0` with faculty dashboard repairs and curriculum loader fix |
| `VERSION12.0.md` | Created release notes |
