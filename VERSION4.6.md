# AIIT COE Result Portal — Release Notes Ver 4.6

**Release Date:** 2026-08-27  
**Developed by:** Dr. GOPAL RAJENDRAN  
**File:** `script.js`, `index.html`, `admin-hidden.html`

---

## Overview

Ver 4.6 introduces the **HTML UI Cleaner & Absolute Reset Flag Engine**. This update completely purges any leftover "Forgot Password?" elements and recovery links from `index.html`, cleans student login hint text to `"Enter your SEN and password."`, and locks down the authentication state machine using an absolute reset flag (`AIIT_FORCE_RESET_<SEN>`).

---

## Key Features & Updates

### 1. Global Versioning & UI HTML Cleanup
- **`index.html`**:
  - Top-left corner version badge updated from `Ver 4.5` to `Ver 4.6`.
  - Deleted `<button onclick="requestOtpReset()">Forgot Password?</button>` and associated wrapper layout.
  - Simplified `student-login-hint` text to: `Enter your SEN and password.` (removing any mention of `pwd`).
- **`admin-hidden.html`**:
  - Top-left corner version badge updated from `Ver 4.5` to `Ver 4.6`.

### 2. Absolute Admin-Reset Flag Engine (`script.js`)
- **Explicit Flag Assignment**: `clearStudentPassword` sets `localStorage.setItem('AIIT_FORCE_RESET_' + sen, 'true')` upon admin password clear action.
- **Force-Reset Gating**: Password creation prompts open **only** when `AIIT_FORCE_RESET_<SEN>` is `'true'` or no permanent password key exists.
- **Flag Purge**: On password configuration completion, `localStorage.removeItem('AIIT_FORCE_RESET_' + sen)` removes the flag, guaranteeing reset prompts never reopen during normal logins.
- **Strict Normal Validation**: Subsequent logins evaluate strictly against permanent password key `AIIT_STUDENT_PASS_<SEN>`, returning `"⚠ Incorrect password."` on invalid entry.

---

## Summary of Fixes

| Element / Scenario | Ver 4.5 Behavior | Ver 4.6 Clean & Absolute Behavior |
|--------------------|------------------|-----------------------------------|
| Forgot Password UI | Present in DOM | Completely deleted from `index.html` |
| Student Login Subtext | Mentioned `pwd` | Updated to `"Enter your SEN and password."` |
| Admin Reset Key | `AIIT_ADMIN_RESET_<SEN>` | `AIIT_FORCE_RESET_<SEN>` |
