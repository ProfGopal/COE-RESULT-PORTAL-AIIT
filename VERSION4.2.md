# AIIT COE Result Portal — Release Notes Ver 4.2

**Release Date:** 2026-08-27  
**Developed by:** Dr. GOPAL RAJENDRAN  
**File:** `script.js`, `index.html`, `admin-hidden.html`

---

## Overview

Ver 4.2 introduces the **Definitive Admin Clear & Reset Fix Engine**. Admin password clearing explicitly removes stored permanent password keys (`AIIT_STUDENT_PASS_<SEN>`) from `localStorage` and purges password object properties across `AIIT_STUDENTS_DATA` and `AIIT_UPLOADED_STUDENTS`. In addition, student login verification now checks the admin clear list first and forcefully deletes any lingering password keys, guaranteeing that typing `'pwd'` immediately triggers the permanent password creation prompt.

---

## Key Features & Updates

### 1. Global Versioning Update
- **`index.html`**: Top-left corner version badge updated from `Ver 4.1` to `Ver 4.2`.
- **`admin-hidden.html`**: Top-left corner version badge updated from `Ver 4.1` to `Ver 4.2`.
- **`script.js`**: Header script comment and section 3b heading updated to `Ver 4.2`.

### 2. Definitive Admin Clear Engine (`window.clearStudentPassword`)
- **Explicit Storage Key Purge**: `localStorage.removeItem('AIIT_STUDENT_PASS_' + sen)` explicitly destroys the stored password key upon admin action.
- **Cleared List Enrollment**: Appends SEN to `AIIT_CLEARED_PASSWORDS`.
- **Master Object Property Wipe**: Sets `customPassword` and `password` properties to empty strings across `AIIT_STUDENTS_DATA` and `AIIT_UPLOADED_STUDENTS`.

### 3. Streamlined Student Reset & Authentication (`window.verifyStudentLogin`)
- **Admin Clear Precedence**: Checks `AIIT_CLEARED_PASSWORDS` first. If present, force-deletes any residual `AIIT_STUDENT_PASS_<SEN>` key prior to password checking.
- **Single-Use `'pwd'` Guarantee**: On reset prompt completion, the student SEN is removed from `AIIT_CLEARED_PASSWORDS` immediately.
- **Configured Account Lockout**: Block attempt to log in using `'pwd'` once a permanent password exists.

---

## Summary of Fixes

| Feature / Issue | Ver 4.1 Behavior | Ver 4.2 Definitive Fix |
|-----------------|------------------|------------------------|
| Admin Password Wipe | Added SEN to cleared list | Removes `AIIT_STUDENT_PASS_<SEN>` key + clears array properties + adds to cleared list |
| Clear Flag Check | Checked cleared list after password fetch | Checks cleared list first & force-deletes lingering storage keys |
| Reset Handoff | Required `'pwd'` when cleared | Requires `'pwd'` to set new permanent password |
