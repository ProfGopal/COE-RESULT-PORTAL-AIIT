# AIIT COE Result Portal — Release Notes

## Version 2.4
**Released:** 2026-08-25
**Developed by:** Dr. Gopal Rajendran, Amity Institute of Information Technology (AIIT)

---

## What's New in Ver 2.4

### Universal Password Reset Interceptor

**Feature:** When an admin clears a student password, the student is now blocked from signing in with *any* password until they set a new one. Ver 2.3 only intercepted on `pwd` or blank — Ver 2.4 intercepts on **every** login attempt if the student's SEN is in the cleared list.

#### Key Changes vs Ver 2.3

| Behaviour | Ver 2.3 | Ver 2.4 |
|-----------|---------|---------|
| Intercept on `pwd` | Yes | Yes |
| Intercept on blank password | No | Yes |
| Intercept on ANY password (if admin-cleared) | No | Yes |
| Prompt message | "Password reset detected..." | "Password reset active for this SEN..." |
| Error hint message | Type "pwd" | Clear password box or type "pwd" |
| Success message | "Password successfully set!" | "Password successfully created!" |

#### How It Works

1. Admin clears a student's password — SEN added to `AIIT_CLEARED_PASSWORDS` in localStorage.
2. Student tries to log in with **any** password:
   - The login handler checks `AIIT_CLEARED_PASSWORDS` first (before hitting the server).
   - If the SEN is in the cleared list, `verifyStudentLogin()` is called immediately.
3. Student is prompted for a new permanent password (min 6 characters).
4. New password is saved to `AIIT_STUDENT_PASS_{SEN}` and the SEN is removed from the cleared list.
5. Student is logged in automatically.

---

## Files Changed

| File | Change |
|------|--------|
| script.js | Updated verifyStudentLogin to Ver 2.4 universal interceptor; updated studentLoginStep interceptor to fire on empty password too; updated version header to Ver 2.4 |
| index.html | Updated version badge from Ver 2.3 to Ver 2.4 |
| admin-hidden.html | Updated version badge from Ver 2.3 to Ver 2.4 |
| VERSION2.4.md | (this file) Created release notes |

---

*Previous version: Ver 2.3 — Bulletproof Student Password Reset & pwd Prompt*
*This version: Ver 2.4 — Universal Password Reset Interceptor*
