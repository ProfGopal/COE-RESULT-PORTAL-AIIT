# AIIT COE Result Portal — Release Notes Ver 4.1

**Release Date:** 2026-08-26  
**Developed by:** Dr. GOPAL RAJENDRAN  
**File:** `script.js`, `index.html`, `admin-hidden.html`

---

## Overview

Ver 4.1 introduces the **Strict One-Time Password Reset & Permanent Validation Engine**. Default reset credentials (`'pwd'`) are enforced to function strictly **only** when a student is explicitly listed in `AIIT_CLEARED_PASSWORDS` or has no permanent password set. Once a permanent password is generated, `'pwd'` is permanently revoked for that student, and all subsequent logins strictly require their custom password.

---

## Key Features & Updates

### 1. Global Versioning Update
- **`index.html`**: Top-left corner version badge updated from `Ver 4.0` to `Ver 4.1`.
- **`admin-hidden.html`**: Top-left corner version badge updated from `Ver 4.0` to `Ver 4.1`.
- **`script.js`**: Header script comment and section 3b heading updated to `Ver 4.1`.

### 2. Strict One-Time Reset & Permanent Login Engine (`window.verifyStudentLogin`)
- **Strict Conditional Reset**: Reset prompt is strictly gated behind `isClearedByAdmin || !permanentPass`. Typing `'pwd'` on a configured account outputs an explicit error: `"⚠ Password already configured. Please enter your active password (or contact Admin to reset)."`
- **Immediate Revocation**: Upon successful creation of a permanent password, the student is instantly filtered out of `AIIT_CLEARED_PASSWORDS`, revoking `'pwd'` access forever until an Admin explicitly resets them.
- **Strict Storage Validation**: Validates passwords strictly against `localStorage.getItem('AIIT_STUDENT_PASS_' + sen)`.

---

## Summary of Fixes

| Scenario | Ver 4.0 Behavior | Ver 4.1 Strict Behavior |
|----------|------------------|-------------------------|
| Student types `'pwd'` after set | Triggered reset prompt again | Rejects `'pwd'` with "Password already configured" error |
| Admin Cleared List Cleanup | Filtered on prompt complete | Filtered & saved atomically on password set |
| Regular Password Validation | Checked multiple fallbacks | Strictly checks against permanent stored password `AIIT_STUDENT_PASS_<SEN>` |
