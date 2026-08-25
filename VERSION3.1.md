# AIIT COE Result Portal — Release Notes

## Version 3.1
**Released:** 2026-08-25
**Developed by:** Dr. Gopal Rajendran, Amity Institute of Information Technology (AIIT)

---

## What's New in Ver 3.1

### Student Data Hydration & Password Persistence Fix

This release synchronizes student record lookup across all storage pools and ensures student dashboard fields (marks, credits, CGPA, course table) hydrate reliably:

#### 1. Multi-Pool Student Lookup Priority
- erifyStudentLogin checks storage pools in order:
  1. localStorage.getItem('AIIT_STUDENTS_DATA')
  2. localStorage.getItem('AIIT_UPLOADED_STUDENTS')
  3. window.STUDENTS
- Guarantees recently uploaded Excel results in local storage take priority over initial window defaults.

#### 2. Password Persistence & Reset Workflow
- Permanent password key: AIIT_STUDENT_PASS_.
- Reset requested when SEN is in AIIT_CLEARED_PASSWORDS, permanent password missing, or user types pwd.
- Newly entered password is saved directly to local storage and student object.
- Removes SEN from AIIT_CLEARED_PASSWORDS upon successful reset.
- Input box auto-cleared (passInput.value = "") on password reset or bad attempt to avoid browser autofill loop.

#### 3. Complete Dashboard Hydration (loadStudentDashboard)
- Normalizes sen, 
ame, program, cgpa, earnedCredits.
- Handles JSON string parsing for courses / courseList.
- Fallback default courses ensure dashboard is never empty if records lack course arrays.
- All logout buttons dynamically set to **LOGOUT**.

---

## Files Changed

| File | Change |
|------|--------|
| script.js | Updated window.verifyStudentLogin and window.loadStudentDashboard with unified data hydration engine, multi-pool storage lookup, and password persistence fix; updated version headers to Ver 3.1 |
| index.html | Updated version badge from Ver 3.0 to Ver 3.1 |
| dmin-hidden.html | Updated version badge from Ver 3.0 to Ver 3.1 |
| VERSION3.1.md | *(this file)* Created release notes |

---

*Previous version: Ver 3.0 — Bulletproof Autofill Bypass & Password Reset Engine*  
*This version: Ver 3.1 — Student Data Hydration & Password Persistence Fix*
