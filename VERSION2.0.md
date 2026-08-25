# AIIT COE Result Portal — Version 2.0 Release Notes

**Release Date:** 2026-08-25
**Developed by:** Dr. Gopal Rajendran
**Project:** AIIT (Amity Institute of Information Technology) COE Result Portal

---

## ✨ What's New in Ver 2.0

### 1. Curriculum Table View (Faculty — Read-Only)
- The Faculty Curriculum Viewer has been completely redesigned from a card/accordion layout to a **clean, structured table format**.
- Columns: **Category / Basket**, **Sub-Category**, **Min Credits**, **Assigned Courses**.
- Courses are displayed as styled pill-badges for quick scanning.
- Table is horizontally scrollable on smaller screens (overflow-x: auto).

### 2. All Programs Dropdown
- The batch/program dropdown in the Faculty Curriculum Viewer now **populates dynamically** with **all available keys** from the stored curriculum data (AIIT_CUSTOM_CURRICULUM in localStorage, merged with window.CURRICULUM_RULES).
- Fallback default to 2024_MCA when no curriculum data is available, preventing blank/broken states.
- Dropdown key labels now display with a space instead of underscore for readability (e.g., 2024 MCA instead of 2024_MCA).

### 3. Admin-Only Faculty Management (Security Clarification)
- Faculty accounts **cannot self-register**. Adding or managing faculty members is strictly reserved for the **Administrator** via the Admin Panel (Course Assignments & Credential Management sections).
- This enforces institutional security compliance and prevents unauthorized account creation.

### 4. Global Versioning Update
- All version tags updated to **Ver 2.0** across:
  - index.html (top-left header on the landing page)
  - dmin-hidden.html (fixed top-left corner tag)

---

## 🔧 Files Changed

| File | Change |
|------|--------|
| index.html | Version tag updated to `Ver 2.0` |
| dmin-hidden.html | Version tag updated to `Ver 2.0` |
| script.js | `renderFacultyCurriculumViewer` replaced with table-based layout; all-programs dropdown logic added |
| `VERSION2.0.md` | This file — release notes created |

---

## 🔒 Security Notes

- Faculty creation is **Admin-only**. There is no self-registration flow for faculty.
- Curriculum viewer is **read-only** for faculty users — no edit controls are exposed.

---

*Built on the AIIT COE Result Portal architecture. All data is cloud-enforced via Google Apps Script backend.*
