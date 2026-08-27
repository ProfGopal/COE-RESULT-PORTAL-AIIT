# AIIT COE Result Portal — Version 10.0 Release Notes

**Release Date:** 2026-08-27  
**Codename:** 100% Cloud-Synced Curriculum & Degree Audit Suite

---

## What's New

### 1. Global Versioning Update
- Version display in `index.html` and `admin-hidden.html` updated to **Ver 10.0**.

### 2. Course Info Lookup Engine (`getCourseInfo`)
- Resolves Course Title and Credit weight from `CUSTOM_COURSE_DICT` with clean fallback defaults (`Course Title`, `3 Cr`).

### 3. 100% Cloud-Synced Curriculum Engine (`saveCurriculumToCloud`)
- Automatically syncs curriculum rules, system program lists, and custom course dictionaries directly to Google Sheets (`CurriculumDB` tab) and `localStorage`.
- Cross-device, multi-laptop, and Incognito window support.

### 4. Admin Curriculum Table Editor (4 Columns with Live Editing)
- Renders columns: **Course Code**, **Course Name**, **Credits**, **Action**.
- Supports inline **Edit** button for each course row (`adminEditCourse`) to modify code, course title, and credit weight live.
- Supports inline **Remove** button (`adminRemoveCourse`) to remove course codes.
- Category & Sub-Category rename/edit actions automatically trigger cloud database sync (`saveCurriculumToCloud()`).

### 5. Student Portal Degree Audit Engine (`evaluateDegree`)
- Dynamically cross-verifies student completed/passed courses against cloud-synced curriculum rules per Batch & Program.
- Renders collapsible basket summary cards with live status indicators:
  - ✅ **Passed**: Green status badge for completed courses.
  - ⏳ **Pending**: Yellow status badge for uncompleted required courses.
  - ❌ **Unmet**: Red status indicator for zero-credit baskets.
- Displays credit progress per sub-category and main category.

---

## Files Updated
| File | Change |
|---|---|
| `index.html` | Version tag updated to `Ver 10.0` |
| `admin-hidden.html` | Version tag updated to `Ver 10.0` |
| `script.js` | Master Script Engine updated to `Ver 10.0` |
| `VERSION10.0.md` | Created release notes |
