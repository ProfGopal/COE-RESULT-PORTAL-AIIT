# AIIT COE Result Portal — Release Notes Ver 4.5

**Release Date:** 2026-08-27  
**Developed by:** Dr. GOPAL RAJENDRAN  
**File:** `script.js`, `index.html`, `admin-hidden.html`

---

## Overview

Ver 4.5 introduces the **Strict Admin-Flag State Machine & Clean Student Login Engine**. Under this version, password reset prompts open **only** when an Admin has explicitly cleared a student's password in the Admin Panel (`AIIT_ADMIN_RESET_<SEN> = "true"`). Upon successful creation of a new password, the reset flag is permanently removed. Subsequent logins strictly evaluate the custom password and display `"⚠ Incorrect password."` when invalid entries are provided.

---

## Key Features & Updates

### 1. Global Versioning Update
- **`index.html`**: Top-left corner version badge updated from `Ver 4.4` to `Ver 4.5`.
- **`admin-hidden.html`**: Top-left corner version badge updated from `Ver 4.4` to `Ver 4.5`.
- **`script.js`**: Header script comment and section 3b heading updated to `Ver 4.5`.

### 2. Strict State-Machine Authentication Engine (`window.verifyStudentLogin`)
- **Explicit Reset Flag**: `clearStudentPassword` sets `localStorage.setItem('AIIT_ADMIN_RESET_' + sen, 'true')` when clearing passwords.
- **Admin-Gated Prompt**: Reset prompt opens **only** if `AIIT_ADMIN_RESET_<SEN>` is `"true"` or no permanent password key exists.
- **Permanent Flag Removal**: On setting a new password, `localStorage.removeItem('AIIT_ADMIN_RESET_' + sen)` purges the flag, guaranteeing reset prompts never reappear during normal logins.
- **Strict Error Feedback**: Entering an invalid password for a configured account outputs `"⚠ Incorrect password."`.

---

## Summary of Fixes

| Scenario | Ver 4.4 Behavior | Ver 4.5 State-Machine Behavior |
|----------|------------------|--------------------------------|
| Password Clear Action | Removed storage key | Sets `AIIT_ADMIN_RESET_<SEN> = "true"` + removes storage key |
| Reset Trigger | Triggered unconditionally on `'pwd'` | Triggered **only** when admin reset flag is active |
| Normal Password Error | Evaluated storage key | Displays `"⚠ Incorrect password."` on mismatch |
