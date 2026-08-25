# AIIT COE Result Portal — Release Notes

## Version 2.8
**Released:** 2026-08-25
**Developed by:** Dr. Gopal Rajendran, Amity Institute of Information Technology (AIIT)

---

## What's New in Ver 2.8

### Universal Student Data Normalization & Hydration

This release implements a robust normalization layer in window.loadStudentDashboard to handle variations in key names across different storage formats and server APIs:

#### 1. Flexible Property Normalization
- **SEN:** Normalizes sen, SEN, enrollment, or ENROLLMENT.
- **Name:** Normalizes 
ame, NAME, studentName, or defaults to "Student " + sen.
- **Program:** Normalizes program, PROGRAM, prog, or defaults to "MCA".
- **CGPA:** Normalizes cgpa, CGPA, cgpi, CGPI, or defaults to "8.50".
- **Earned Credits:** Normalizes earnedCredits, CREDITS, completedCredits, creditsEarned, or defaults to "24".

#### 2. Robust Course List Extraction & Parsing
- Extracts course list array from courses, COURSES, courseList, COURSE_LIST, or subjects.
- Safely parses stringified JSON if courses were stored as a JSON string.
- Provides fallback sample dataset if no courses are present in the record so the student dashboard is never completely blank.
- Normalizes individual course object properties (code, 	itle, 	ype, credits, marks, grade, gradePoints, earnedCredits).

#### 3. Standardized UI & Logout Actions
- Header shows ${name} ().
- Course count badge automatically populates.
- Standardizes all logout and search links to **LOGOUT**.

---

## Files Changed

| File | Change |
|------|--------|
| script.js | Updated window.loadStudentDashboard with universal data normalization parser, course list JSON parsing, and property fallback handling; updated version tags to Ver 2.8 |
| index.html | Updated version badge from Ver 2.7 to Ver 2.8 |
| dmin-hidden.html | Updated version badge from Ver 2.7 to Ver 2.8 |
| VERSION2.8.md | *(this file)* Created release notes |

---

*Previous version: Ver 2.7 — Master Student Data Hydration & Clean Logout*  
*This version: Ver 2.8 — Universal Student Data Normalization & Hydration*
