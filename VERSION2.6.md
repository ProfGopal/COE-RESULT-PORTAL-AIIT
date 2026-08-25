# AIIT COE Result Portal — Release Notes

## Version 2.6
**Released:** 2026-08-25
**Developed by:** Dr. Gopal Rajendran, Amity Institute of Information Technology (AIIT)

---

## What's New in Ver 2.6

### Student Dashboard Data Hydration & Master Record Recovery

This release introduces two major improvements:

#### 1. Strict Master-Record Login Validation (verifyStudentLogin)

- SEN is now validated against **actual uploaded master records** (`window.STUDENTS` or `AIIT_STUDENTS_DATA`).
- Ver 2.5 would synthesise a placeholder record if SEN was not found — **Ver 2.6 removes this** to prevent ghost accounts.
- SEN lookup now handles both `s.sen` and `s.SEN` field names (case-insensitive).
- If SEN is not in uploaded records, the student sees: *"SEN not found in uploaded student records. Please verify with Admin."*
- Emergency bypass: `faculty@123` password always grants access (admin use only).

#### 2. Full Dashboard Data Hydration (loadStudentDashboard — NEW)

A dedicated `window.loadStudentDashboard(student)` function is now registered globally. It:
- Sets `window.currentStudent` for global reference.
- Hides all other page sections and shows the student dashboard container.
- Populates **name**, **CGPA**, and **earned credits** from master record fields (supports both camelCase and uppercase field names).
- Renders the full **course results table** (code, title, type, credits, marks, grade, grade points, earned credits).
- Shows a friendly empty-state message if no courses are mapped.
- Calls `renderStudentDash(student)` if present for backward compatibility with the main dashboard renderer.

---

## Files Changed

| File | Change |
|------|--------|
| script.js | Replaced verifyStudentLogin with strict master-record validator (Ver 2.6); added new loadStudentDashboard with full data hydration; updated intercept comment and version header to Ver 2.6 |
| index.html | Updated version badge from Ver 2.5 to Ver 2.6 |
| admin-hidden.html | Updated version badge from Ver 2.5 to Ver 2.6 |
| VERSION2.6.md | (this file) Created release notes |

---

## Key Behaviour Changes vs Ver 2.5

| Behaviour | Ver 2.5 | Ver 2.6 |
|-----------|---------|---------|
| SEN not found | Synthesise placeholder record | Show error, stop |
| SEN field lookup | s.sen only | s.sen OR s.SEN |
| Dashboard population | Delegated to existing renderer | loadStudentDashboard hydrates name/CGPA/credits/courses |
| Emergency admin bypass | No | Yes (faculty@123) |
| Courses table rendered | No | Yes |

---

*Previous version: Ver 2.5 — Bulletproof Universal Student Login & Auto-Enrollment Recovery*
*This version: Ver 2.6 — Student Dashboard Data Hydration & Master Record Recovery*
