# AIIT COE Result Portal — Release Notes

## Version 3.0
**Released:** 2026-08-25
**Developed by:** Dr. Gopal Rajendran, Amity Institute of Information Technology (AIIT)

---

## What's New in Ver 3.0

### Bulletproof Autofill Bypass & Password Reset Engine

This major release resolves browser autofill conflicts and ensures student password resets work smoothly without browser input loops:

#### 1. Autofill Bypass & Input Cleansing
- erifyStudentLogin now validates SEN independently (if (!sen)), allowing cleared password resets to trigger even when browser autofill fills or empties password fields unexpectedly.
- Automatically wipes the password input field (passInput.value = "") immediately after setting a new permanent password or after an incorrect password attempt.
- Eliminates infinite password re-trigger loops caused by browser password managers caching stale credentials.

#### 2. Password Reset Triggers
- Triggers new permanent password prompt (prompt()) under 3 scenarios:
  1. Student SEN is listed in AIIT_CLEARED_PASSWORDS (cleared by Admin).
  2. No permanent password (AIIT_STUDENT_PASS_) exists yet.
  3. Student enters **pwd** as their password.
- Prompt enforces a minimum length of 6 characters before storing.
- Automatically clears the student SEN from AIIT_CLEARED_PASSWORDS upon success.

#### 3. Guidance Tip & Admin Access
- Error tip explicitly advises: *"⚠ Incorrect password. (Tip: If password was reset by admin, clear the password box and type "pwd")."*
- Retains emergency admin override password (aculty@123).

---

## Files Changed

| File | Change |
|------|--------|
| script.js | Updated window.verifyStudentLogin with autofill input wiping, independent SEN check, and Ver 3.0 prompt logic; updated version headers to Ver 3.0 |
| index.html | Updated version badge from Ver 2.9 to Ver 3.0 |
| dmin-hidden.html | Updated version badge from Ver 2.9 to Ver 3.0 |
| VERSION3.0.md | *(this file)* Created release notes |

---

*Previous version: Ver 2.9 — Permanent Student Password Persistence & Reset Fix*  
*This version: Ver 3.0 — Bulletproof Autofill Bypass & Password Reset Engine*
