# AIIT COE Result Portal — Release Notes Ver 4.4

**Release Date:** 2026-08-27  
**Developed by:** Dr. GOPAL RAJENDRAN  
**File:** `script.js`, `index.html`, `admin-hidden.html`

---

## Overview

Ver 4.4 introduces the **Universal 'pwd' Force-Reset & Permanent Login Engine**. Typing `'pwd'` in the password field unconditionally triggers the **New Password** and **Confirm Password** prompt modal, enabling seamless password creation/resets under any scenario. Regular incorrect passwords output `"⚠ Incorrect password."` and validate strictly against permanent storage `AIIT_STUDENT_PASS_<SEN>`.

---

## Key Features & Updates

### 1. Global Versioning Update
- **`index.html`**: Top-left corner version badge updated from `Ver 4.3` to `Ver 4.4`.
- **`admin-hidden.html`**: Top-left corner version badge updated from `Ver 4.3` to `Ver 4.4`.
- **`script.js`**: Header script comment and function annotations updated to `Ver 4.4`.

### 2. Universal Force-Reset Engine (`window.verifyStudentLogin`)
- **Unconditional `'pwd'` Trigger**: Typing `'pwd'` in the password field immediately launches the prompt modal to configure a new permanent password.
- **First-Time Reset Protection**: If no permanent password key `AIIT_STUDENT_PASS_<SEN>` exists yet for a SEN, any password entry triggers the password setup flow.
- **Dual Password Modal**: Prompts for **New Password** and **Confirm Password**, verifying string match before saving.
- **Permanent Multi-Key Storage**: Atomically saves the new password across `AIIT_STUDENT_PASS_<SEN>`, `AIIT_STUDENTS_DATA`, and `AIIT_UPLOADED_STUDENTS`, and removes the SEN from `AIIT_CLEARED_PASSWORDS`.

### 3. Normal Login Validation
- Once configured, entering any password other than `'pwd'` evaluates directly against `localStorage.getItem('AIIT_STUDENT_PASS_' + sen)`.
- Outputs `"⚠ Incorrect password."` on mismatch.

---

## Summary of Fixes

| Scenario | Ver 4.3 Behavior | Ver 4.4 Universal Force-Reset Behavior |
|----------|------------------|---------------------------------------|
| Typing `'pwd'` | Triggered only if in cleared list | **Unconditionally** triggers New & Confirm Password reset modal |
| First-time Login | Triggered if cleared | Automatically triggers password setup if no permanent password exists |
| Password Matching | Dual-prompt modal | Dual-prompt modal + atomic storage across all keys |
