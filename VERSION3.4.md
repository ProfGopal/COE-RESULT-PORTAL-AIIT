# AIIT COE Result Portal — Release Notes Ver 3.4

**Release Date:** 2026-08-18
**Developed by:** Dr. GOPAL RAJENDRAN
**Repository:** GitHub Pages Static Site (`index.html`, `admin-hidden.html`, `script.js`)

---

## What's New in Ver 3.4

### 1. Global Version Bump
- Version tag updated to **Ver 3.4** in both `index.html` (student/faculty portal) and `admin-hidden.html` (COE Admin panel).

---

### 2. Corrected UG/PG CA Deadline Sections (Deadline Manager Fix)
- **File:** `script.js` — `renderAdminDeadlinesPanel`
- The Global Submission Deadline Manager now correctly renders:
  - **UG Programs -> 3 CAs** (CA 1, CA 2, CA 3 fields)
  - **PG Programs -> 2 CAs** (CA 1, CA 2 fields only)
- Fixes an earlier inversion where UG was shown with 2 CAs and PG with 3 CAs.

---

### 3. Faculty Read-Only Curriculum Viewer (New Feature)
- **File:** `script.js` — two new functions added:
  - `window.renderFacultyCurriculumTab()` — entry point called by the tab switch
  - `window.renderFacultyCurriculumViewer(container)` — renders the full read-only curriculum UI
- A new Curriculum Viewer tab is now available in the Faculty Portal navigation bar alongside:
  - Student Results & Analytics
  - Course-COE-Works & Submissions
- Features:
  - Dropdown to select Batch & Program (auto-populated from AIIT_CUSTOM_CURRICULUM / CURRICULUM_RULES)
  - Displays curriculum categories, sub-categories, minimum credits, and associated course codes
  - Fully read-only — faculty cannot edit curriculum rules
  - Graceful empty state message when no curriculum is mapped for a selection

---

### 4. switchFacultyTab Refactored
- Extended to handle three tabs: 'analytics', 'courseworks', 'curriculum'
- Unified reset logic: all views hidden and all buttons reset before activating the selected tab
- Curriculum tab auto-triggers renderFacultyCurriculumTab() on activation

---

## Bug Fixes
- Fixed CA count prefix mapping: caCount === 3 (UG) correctly maps to ug deadlines; caCount === 2 (PG) maps to pg deadlines throughout the audit matrix, faculty task list, and email scheduler.

---

## Files Modified

| File | Changes |
|------|---------|
| admin-hidden.html | Version -> Ver 3.4; CA count dropdown: UG=3 CAs, PG=2 CAs |
| index.html | Version -> Ver 3.4 |
| script.js | Deadline panel fix; new curriculum viewer functions; updated switchFacultyTab; CA prefix fixes |
| VERSION3.4.md | [NEW] This release notes document |
