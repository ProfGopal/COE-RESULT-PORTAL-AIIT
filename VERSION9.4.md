# AIIT COE Result Portal — Version 9.4 Release Notes

**Release Date:** 2026-08-27  
**Codename:** Master Cloud Synchronization & Full Table Curriculum Editor

---

## What's New

### 1. Global Versioning Update
- Version display in `index.html` and `admin-hidden.html` bumped to **Ver 9.4**.

### 2. System Programs Renderer (`renderSystemPrograms`)
- Added dynamic rendering of active Batches & Programs tags into `#active-system-programs` with individual removal (`✖`) handlers.
- Auto-populates the curriculum editor program selection dropdown (`#curriculum-edit-key`) with all available system batches & programs.
- Added `addSystemProgram()` and `removeSystemProgram(index)` with local storage persistence and UI sync.

### 3. Master Curriculum Table Editor
- Full visual UI table editor rendering main categories, sub-categories, minimum credit limits, and individual course code rows.
- Live actions supported directly in the browser:
  - Rename Main Category (`adminRenameMainCat`)
  - Edit Main Category Minimum Credits (`adminEditMainCreds`)
  - Rename Sub-Category (`adminRenameSubCat`)
  - Edit Sub-Category Minimum Credits (`adminEditSubCreds`)
  - Add Course Code (`adminAddCourse`)
  - Remove Course Code (`adminRemoveCourse`)
  - Reset Curriculum to Defaults (`resetCurriculumEditor`)

### 4. Admin Student Directory & Enrolled Count Fix
- `applyAdminFilters()` syncs total student count into `#total-stu` and renders student records from Cloud DB into `#admin-tbody`.

---

## Files Updated
| File | Change |
|---|---|
| `index.html` | Version tag updated to `Ver 9.4` |
| `admin-hidden.html` | Version tag updated to `Ver 9.4` |
| `script.js` | Updated with Master Script Engine (Ver 9.4) |
| `VERSION9.4.md` | Created release notes |
