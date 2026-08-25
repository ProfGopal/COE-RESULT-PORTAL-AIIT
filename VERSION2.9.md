# AIIT COE Result Portal — Release Notes

## Version 2.9
**Released:** 2026-08-25
**Developed by:** Dr. Gopal Rajendran, Amity Institute of Information Technology (AIIT)

---

## What's New in Ver 2.9

### Permanent Student Password Authentication Engine

This update permanently resolves student password storage and persistence across sessions and page reloads:

#### 1. Bulletproof Password Storage (AIIT_STUDENT_PASS_)
- When a student sets a new password (via admin reset, first-time login, or pwd shortcut), it is saved directly to local storage under AIIT_STUDENT_PASS_.
- Setting a new password automatically strips the student's SEN from AIIT_CLEARED_PASSWORDS.
- Subsequent sign-ins compare the entered password directly against AIIT_STUDENT_PASS_.

#### 2. Clean Password Reset & Shortcut Handler (erifyStudentLogin)
- Requires both SEN and password inputs ("Please enter both SEN and password.").
- Automatically triggers password reset prompt if:
  - SEN is present in AIIT_CLEARED_PASSWORDS (cleared by Admin).
  - No permanent password exists in local storage for that SEN yet.
  - User enters **pwd** as their password.
- Prompt enforces a minimum length of 6 characters before storing.
- Immediately logs the student into their dashboard post-reset.

#### 3. Error Feedback & Admin Bypass
- Incorrect password message explicitly instructs: *"⚠ Incorrect password. If your password was reset by the admin, please type "pwd"."*
- Emergency admin override password (aculty@123) is retained for troubleshooting support.

---

## Files Changed

| File | Change |
|------|--------|
| script.js | Updated window.verifyStudentLogin to validate and persist permanent passwords under AIIT_STUDENT_PASS_, clean AIIT_CLEARED_PASSWORDS, and handle pwd shortcut; updated version headers to Ver 2.9 |
| index.html | Updated version badge from Ver 2.8 to Ver 2.9 |
| dmin-hidden.html | Updated version badge from Ver 2.8 to Ver 2.9 |
| VERSION2.9.md | *(this file)* Created release notes |

---

*Previous version: Ver 2.8 — Universal Student Data Normalization & Hydration*  
*This version: Ver 2.9 — Permanent Student Password Persistence & Reset Fix*
