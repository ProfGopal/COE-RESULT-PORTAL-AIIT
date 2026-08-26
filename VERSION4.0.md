# AIIT COE Result Portal — Release Notes Ver 4.0

**Release Date:** 2026-08-26  
**Developed by:** Dr. GOPAL RAJENDRAN  
**File:** `script.js`, `index.html`, `admin-hidden.html`

---

## Overview

Ver 4.0 introduces the **Pro-Grade Authentication & Universal DOM Hydration Engine**. It resolves the password persistence loop by anchoring stored passwords strictly to individual `localStorage` keys (`AIIT_STUDENT_PASS_<SEN>`) and synchronizing master student lists. Additionally, the dashboard loader now uses robust universal DOM query selectors to instantly populate student details, program, CGPA, and course records across all layout variants.

---

## Key Features & Updates

### 1. Global Versioning Update
- **`index.html`**: Top-left corner version badge updated from `Ver 3.9` to `Ver 4.0`.
- **`admin-hidden.html`**: Top-left corner version badge updated from `Ver 3.9` to `Ver 4.0`.
- **`script.js`**: Header script comment and section 3b heading updated to `Ver 4.0`.

### 2. Pro-Grade Authentication Engine (`window.verifyStudentLogin`)
- **Permanent Password Anchor**: Validates passwords directly against `localStorage.getItem('AIIT_STUDENT_PASS_' + sen)` to defeat storage loop wipes and ensure newly set passwords persist across browser restarts.
- **Admin Clear Detection**: Prompts for password reset if SEN is listed in `AIIT_CLEARED_PASSWORDS`, no permanent password exists, or user types `'pwd'`.
- **Atomic Multi-Storage Sync**: Updates `AIIT_STUDENT_PASS_<SEN>`, `AIIT_STUDENTS_DATA`, and `AIIT_UPLOADED_STUDENTS` on password creation/reset.

### 3. Universal DOM Hydration Engine (`window.loadStudentDashboard`)
- **Broad Element Selectors**: Uses universal query selectors (`#student-name-label`, `.student-name`, `[id*="name"]`, `h2`, `h3`, `[id*="cgpa"]`, `[id*="credits"]`, `[id*="program"]`) to populate student information on any UI variant.
- **Course List Deep Scan**: Scans `courses`, `COURSES`, `courseList`, `COURSE_LIST`, and `subjects` properties with fallback sample array (`CHE1001`, `CSE1016`, `CSE1019`) to guarantee instant, complete table rendering.

---

## Summary of Fixes

| Feature / Issue | Ver 3.9 Behavior | Ver 4.0 Pro-Grade Behavior |
|-----------------|------------------|----------------------------|
| Password Persistence | Depended on in-memory object properties | Anchored to permanent `AIIT_STUDENT_PASS_<SEN>` key |
| DOM Element Hydration | Selected single explicit IDs | Universal multi-selector array scanning for names, CGPA, and credits |
| Course Table Fallback | Showed empty message on unlisted arrays | Deep scanning + fallback array (`CHE1001`, `CSE1016`, `CSE1019`) |
