# AIIT COE Result Portal — Version 9.5 Release Notes

**Release Date:** 2026-08-27  
**Codename:** Master Curriculum & Bulk Excel Upload Engine

---

## What's New

### 1. Global Versioning Update
- Version display in `index.html` and `admin-hidden.html` updated to **Ver 9.5**.

### 2. Bulk Excel Curriculum Parser & Uploader
- `handleBulkCurriculumUpload(event)` parses institutional curriculum Excel files using SheetJS (XLSX).
- Parses columns: `Main Category`, `Main Credits`, `Sub Category`, `Sub Credits`, `Course Code`, `Course Name`, `Credits`.
- Auto-populates `CUSTOM_COURSE_DICT` with course titles and credit weights.
- Groups structure into `CURRICULUM_RULES` per selected Batch & Program target key.
- Persists data immediately to `localStorage` (`AIIT_CUSTOM_CURRICULUM`, `AIIT_CUSTOM_COURSES`) and pushes to Google Apps Script cloud database (`saveCurriculumToCloud()`).

### 3. Reset to Default Handler
- `resetCurriculumEditor()` provides a clean one-click reset for the active program key.
- Wipes local custom curriculum rules, triggers UI re-render, and syncs reset state to cloud database.

### 4. Explicit Button Wiring
- Automatic binding in `DOMContentLoaded` for:
  - "Bulk Upload Excel Curriculum" button -> triggers hidden `#bulk-curriculum-file-input`.
  - "Reset to Default" button -> triggers `resetCurriculumEditor()`.

---

## Files Updated
| File | Change |
|---|---|
| `index.html` | Version tag updated to `Ver 9.5` |
| `admin-hidden.html` | Version tag updated to `Ver 9.5` |
| `script.js` | Updated with Master Script Engine (Ver 9.5) |
| `VERSION9.5.md` | Created release notes |
