# AIIT COE Result Portal — Release Notes Ver 4.3

**Release Date:** 2026-08-27  
**Developed by:** Dr. GOPAL RAJENDRAN  
**File:** `script.js`, `index.html`, `admin-hidden.html`

---

## Overview

Ver 4.3 introduces the **Universal Admin-Clear Trigger & Resilient Student Login Engine**. When an admin clears a student's password, entering **any password** on the login page instantly triggers the dual-step **New Password** and **Confirm Password** prompt modal. Once configured, the student is removed from the cleared list and subsequent logins validate strictly against the permanent stored password.

---

## Key Features & Updates

### 1. Global Versioning Update
- **`index.html`**: Top-left corner version badge updated from `Ver 4.2` to `Ver 4.3`.
- **`admin-hidden.html`**: Top-left corner version badge updated from `Ver 4.2` to `Ver 4.3`.
- **`script.js`**: Header script comment and section 3b heading updated to `Ver 4.3`.

### 2. Universal Admin-Clear Trigger (`window.verifyStudentLogin`)
- **Universal Trigger**: If student is in `AIIT_CLEARED_PASSWORDS` or has no permanent password set, entering **any password** immediately activates the password reset prompt (no need to type `'pwd'`).
- **Dual-Prompt Confirmation**: Asks for **New Password (min 6 chars)** followed immediately by **Confirm Password**. Validates matching inputs before saving.
- **Atomic Permanent Persistence**: Saves new password directly to `AIIT_STUDENT_PASS_<SEN>`, `AIIT_STUDENTS_DATA`, and `AIIT_UPLOADED_STUDENTS`.
- **Auto-Close Cleared List State**: Filters SEN out of `AIIT_CLEARED_PASSWORDS` upon successful configuration so the reset prompt closes permanently.

### 3. Normal Login Validation
- Standard incorrect passwords output: `"⚠ Incorrect password."`
- Valid passwords load student dashboard instantly.

---

## Summary of Fixes

| Scenario | Ver 4.2 Behavior | Ver 4.3 Universal Admin-Clear Behavior |
|----------|------------------|---------------------------------------|
| Password Clear Handoff | Required typing `'pwd'` | **Any** password entered triggers New & Confirm Password prompt |
| Confirmation Step | Single password prompt | Dual prompt: New Password + Confirm Password validation |
| Standard Password Error | Showed "Incorrect password" | Shows "Incorrect password" for active accounts |
