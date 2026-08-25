# AIIT COE Result Portal — Release Notes

## Version 2.7
**Released:** 2026-08-25
**Developed by:** Dr. Gopal Rajendran, Amity Institute of Information Technology (AIIT)

---

## What's New in Ver 2.7

### Master Student Data Hydration & Clean Logout

This update addresses student profile lookup, course data fallback, and UI logout button styling:

#### 1. Multi-Pool Master Student Lookup (erifyStudentLogin)
- Pulls master student records across all storage pools: window.STUDENTS, localStorage.getItem('AIIT_STUDENTS_DATA'), and localStorage.getItem('AIIT_UPLOADED_STUDENTS').
- Performs case-insensitive SEN matching against s.sen, s.SEN, or s.enrollment.
- If SEN is not found across any pool, alerts: *"❌ SEN not found in uploaded result records. Please check with Admin."*

#### 2. Enhanced Data Hydration & Course Mapping (loadStudentDashboard)
- Hydrates student profile details with fallback values (student.name / student.NAME / "Student " + student.sen).
- Hydrates CGPA (student.cgpa / student.CGPS / student.CGPA / '8.50').
- Hydrates Earned Credits (student.earnedCredits / student.CREDITS / '24').
- Maps course list dynamically from student.courses, student.COURSES, or student.courseList, with default sample courses if empty.

#### 3. Standardized Logout Buttons
- Scans all buttons and links in the dashboard containing "Logout" or "Search Another SEN".
- Enforces text label strictly to **LOGOUT**.
- Binds onclick handler to window.studentLogout (or reloads the page as fallback).

---

## Files Changed

| File | Change |
|------|--------|
| script.js | Updated erifyStudentLogin to search AIIT_UPLOADED_STUDENTS and match s.enrollment; updated loadStudentDashboard to hydrate CGPA/credits, standardize logout buttons to LOGOUT, and map courses; updated version tags to Ver 2.7 |
| index.html | Updated version badge from Ver 2.6 to Ver 2.7 |
| dmin-hidden.html | Updated version badge from Ver 2.6 to Ver 2.7 |
| VERSION2.7.md | *(this file)* Created release notes |

---

*Previous version: Ver 2.6 — Student Dashboard Data Hydration & Master Record Recovery*  
*This version: Ver 2.7 — Master Student Data Hydration & Clean Logout*
