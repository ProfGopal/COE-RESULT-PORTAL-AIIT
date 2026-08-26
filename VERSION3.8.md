# AIIT COE Result Portal — Release Notes Ver 3.8

**Release Date:** 2026-08-26  
**Developed by:** Dr. GOPAL RAJENDRAN  
**File:** `script.js`, `index.html`, `admin-hidden.html`

---

## Overview

Ver 3.8 introduces **True Password Clear Wipe** and **Deep Course Hydration Engine**. Admin password clear requests now execute an absolute storage purge, removing the individual student password key from `localStorage` and wiping password properties across all master storage lists. In addition, the student dashboard course hydrator performs a deep property-variant scan and master array query to populate student course tables.

---

## Key Features & Updates

### 1. Global Versioning Update
- **`index.html`**: Top-left corner version badge updated from `Ver 3.7` to `Ver 3.8`.
- **`admin-hidden.html`**: Top-left corner version badge updated from `Ver 3.7` to `Ver 3.8`.
- **`script.js`**: Header script comment and section headers updated to `Ver 3.8`.

### 2. True Password Wipe Engine (`window.clearStudentPassword`)
- Completely removes `AIIT_STUDENT_PASS_<SEN>` from `localStorage`.
- Appends student SEN to `AIIT_CLEARED_PASSWORDS`.
- Clears `customPassword` and `password` properties across `AIIT_STUDENTS_DATA` and `AIIT_UPLOADED_STUDENTS` master lists.
- Allows students to log in using default password `'pwd'` to set a new permanent password.

### 3. Deep Course Hydration Engine (`window.loadStudentDashboard`)
- Property Variant Scan: Checks `courses`, `COURSES`, `courseList`, `COURSE_LIST`, and `subjects` properties on the student object.
- Master Array Fallback Lookup: If courses array is empty on the current student object, queries master localStorage array `AIIT_STUDENTS_DATA` by SEN to locate course records.
- Seamless Table Rendering: Populates course table rows without fallback glitches.

---

## Summary of Changes

| Feature / Module | Ver 3.7 Behavior | Ver 3.8 Behavior |
|------------------|------------------|------------------|
| Password Clear | Direct SEN login without clearing key | True Wipe: purges `AIIT_STUDENT_PASS_<SEN>` and clears password fields in master lists |
| Password Authentication | Direct SEN bypass | Password prompt on first login or reset (`'pwd'`) |
| Course Hydration | Scanned limited fields | Deep property variant scan (`courses`, `COURSES`, `courseList`, `COURSE_LIST`, `subjects`) + Master lookup |
