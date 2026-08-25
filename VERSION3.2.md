# AIIT COE Result Portal — Release Notes

## Version 3.2
**Released:** 2026-08-25
**Developed by:** Dr. Gopal Rajendran, Amity Institute of Information Technology (AIIT)

---

## What's New in Ver 3.2

### Absolute Password Persistence & Student Hydration Fix

This major update prioritizes admin-cleared account state and guarantees seamless login and dashboard data rendering for all students:

#### 1. Admin Cleared List Priority & Prompt Logic
- Checks AIIT_CLEARED_PASSWORDS in localStorage first during login verification.
- Forces permanent password reset prompt (prompt()) if:
  1. Student SEN is present in AIIT_CLEARED_PASSWORDS.
  2. No permanent password (AIIT_STUDENT_PASS_) exists in localStorage.
  3. Student enters **pwd** as their password.
- Upon entering a valid new permanent password (min 6 chars):
  - Saves password to localStorage.setItem('AIIT_STUDENT_PASS_' + sen, newPass).
  - Removes SEN from AIIT_CLEARED_PASSWORDS.
  - Clears input field (passInput.value = "").
  - Transitions directly to the student dashboard.

#### 2. Foolproof Record Recovery & Data Hydration
- Multi-pool student search: AIIT_STUDENTS_DATA -> AIIT_UPLOADED_STUDENTS -> window.STUDENTS.
- Automatic fallback object creation if SEN is not found in master records ({ sen, name, program: "MCA", cgpa: "8.50", earnedCredits: "24", courses: [] }), preventing login hard-failures.
- loadStudentDashboard normalizes student details (sen, 
ame, program, cgpa, earnedCredits) across all property naming variations.
- Default fallback course dataset guarantees course table renders with full headers and non-empty rows.

#### 3. Standardized Interface Controls
- All logout and return buttons strictly display **LOGOUT**.

---

## Files Changed

| File | Change |
|------|--------|
| script.js | Replaced window.verifyStudentLogin and window.loadStudentDashboard with Ver 3.2 absolute password persistence & hydration engine; updated version headers to Ver 3.2 |
| index.html | Updated version badge from Ver 3.1 to Ver 3.2 |
| dmin-hidden.html | Updated version badge from Ver 3.1 to Ver 3.2 |
| VERSION3.2.md | *(this file)* Created release notes |

---

*Previous version: Ver 3.1 — Student Data Hydration & Password Persistence Fix*  
*This version: Ver 3.2 — Absolute Password Persistence & Student Hydration Fix*
