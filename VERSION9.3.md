# AIIT COE Result Portal — Version 9.3 Release Notes

**Release Date:** 2026-08-27  
**Codename:** Full Cloud Optimization & Action Binding

---

## What's New

### 1. Global Versioning Update
- All version tags in `index.html` and `admin-hidden.html` updated to **Ver 9.3**.

### 2. Lightning-Fast Cloud Bootloader
- **`initializeCloudPortal()`** now uses `Promise.all()` to fetch student data and curriculum rules **in parallel** instead of sequentially. This dramatically reduces initial load time.

### 3. Explicit Login & Sign-In Bindings
- **Student Sign-In** (`studentLoginStep`): Cloud-authenticated login with first-time password setup flow.
- **Faculty Sign-In** (`facultyLoginStep`): Authorized faculty email check with portal rendering on success.
- Both functions are explicitly bound via `window.` for reliable `onclick` handler resolution.

### 4. Admin Student Directory (Cloud-Populated)
- **New `window.applyAdminFilters()`**: Populates the admin student directory table (`admin-tbody`) directly from the Google Sheet backend. Renders student SEN, name, program, CGPA, credits, and a Details button for each enrolled student.
- Auto-fetches from cloud if local data is empty.

### 5. Curriculum Editor Enhancement
- Sub-categories now display a **"No courses in this sub-category yet"** empty state when a sub-category has no course codes, instead of rendering an empty table.
- Default sub-category name changed from "General" to "General Courses" for clarity.

### 6. Preserved Existing Functionality
- All existing critical functions retained: `showPage`, `showFacultyLogin`, `adminLogin`, `loadStudentDashboard`, `renderFacultyPortal`, `facultyFilterAndSort`, `switchAdminTab`, `exportStudentPDF`, `logoutPortal`, `getActiveBacklogs`.

---

## Files Changed
| File | Change |
|---|---|
| `index.html` | Version tag → Ver 9.3 |
| `admin-hidden.html` | Version tag → Ver 9.3 |
| `script.js` | Full replacement — V9.3 cloud-optimized engine with all new + preserved functions |
| `VERSION9.3.md` | Created (this file) |
