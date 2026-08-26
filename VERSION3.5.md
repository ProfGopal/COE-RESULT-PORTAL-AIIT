# AIIT COE Result Portal — Release Notes Ver 3.5

**Release Date:** 2026-08-26  
**Developed by:** Dr. GOPAL RAJENDRAN  
**File:** `script.js`, `index.html`, `admin-hidden.html`

---

## Overview

Ver 3.5 introduces a **Pro-Grade Password Persistence & Master Storage Sync Engine**. On password reset or update in the student portal, new permanent passwords are now immutably written to individual localStorage keys, master student record objects, `AIIT_STUDENTS_DATA`, `AIIT_UPLOADED_STUDENTS`, and the in-memory `window.STUDENTS` array simultaneously.

---

## Key Features & Updates

### 1. Global Versioning Update
- **`index.html`**: Top-left corner version badge updated from `Ver 3.4` to `Ver 3.5`.
- **`admin-hidden.html`**: Top-left corner version badge updated from `Ver 3.4` to `Ver 3.5`.
- **`script.js`**: Header script comment and function annotations updated to `Ver 3.5`.

### 2. Pro-Grade Student Authentication & Master Sync Engine (`script.js`)

#### `window.verifyStudentLogin()` (UPDATED — Ver 3.5)
- **Immutable Master Sync**: When a password reset is requested (via admin clear list, first-time login, or typing `pwd`), the new password is updated directly on the student object (`student.customPassword` and `student.password`) and stored at the exact index in `masterStudents`.
- **Atomic Multi-Storage Persistence**: Writes the new password to:
  - `localStorage.setItem('AIIT_STUDENT_PASS_' + sen, newPass)`
  - `localStorage.setItem('AIIT_STUDENTS_DATA', JSON.stringify(masterStudents))`
  - `localStorage.setItem('AIIT_UPLOADED_STUDENTS', JSON.stringify(masterStudents))`
  - `window.STUDENTS = masterStudents`
- **Flexible Password Verification**: Supports fallback checking across individual key, `student.customPassword`, and `student.password` fields to prevent login lockouts under any storage scenario.

---

## Summary of Fixes

| Feature / Issue | Ver 3.4 Behavior | Ver 3.5 Pro-Grade Behavior |
|-----------------|------------------|----------------------------|
| Master Array Storage | Saved array without updating index object | Immutably updates `masterStudents[studentIndex]` before stringifying |
| Multi-Key Storage Sync | Relied on helper wrapper | Writes atomically to `AIIT_STUDENTS_DATA`, `AIIT_UPLOADED_STUDENTS`, and `window.STUDENTS` |
| Password Fallback Validation | Checked `savedPass` single source | Compares `storedPass`, `student.customPassword`, and `student.password` |
| Reset Feedback | "Password saved successfully!" | "Password saved permanently!" |
