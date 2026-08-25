# AIIT COE Result Portal — Release Notes

## Version 2.3
**Released:** 2026-08-25
**Developed by:** Dr. Gopal Rajendran, Amity Institute of Information Technology (AIIT)

---

## What's New in Ver 2.3

### 🔐 Bulletproof Student Password Reset (`pwd` Prompt)

**Feature:** When an admin clears a student's password via the Admin Panel, the student is now **immediately and reliably** forced to create a new permanent password the next time they log in — even if they type `pwd` as a shortcut, or attempt to log in with any temporary/blank password.

#### How It Works

1. **Admin clears a student's password** via the Admin Panel.
   - The student's SEN is added to `AIIT_CLEARED_PASSWORDS` in `localStorage`.

2. **Student attempts to log in:**
   - If the student's SEN is in `AIIT_CLEARED_PASSWORDS`, **OR**
   - If the student types **`pwd`** as their password,
   -> The student is **immediately prompted** to enter a new permanent password (minimum 6 characters).

3. **New password is saved:**
   - Stored under `AIIT_STUDENT_PASS_{SEN}` in `localStorage`.
   - The student's SEN is removed from `AIIT_CLEARED_PASSWORDS`.
   - Student is logged in automatically.

4. **Normal login** continues to work as before for students who have already set their password.

#### Error Handling
- Password must be at least **6 characters** (enforced client-side).
- If password was reset by admin, the error message advises the student to type **`pwd`** to trigger the reset flow.

---

## Files Changed

| File | Change |
|------|--------|
| script.js | Added window.verifyStudentLogin (Ver 2.3 bulletproof reset function); hooked pwd/cleared-password intercept into studentLoginStep; updated version header to Ver 2.3 |
| index.html | Updated top-left version badge from Ver 2.1 to Ver 2.3 |
| admin-hidden.html | Updated top-left version badge from Ver 2.1 to Ver 2.3 |
| VERSION2.3.md | (this file) Created release notes |

---

## Notes for Admin

- The `AIIT_CLEARED_PASSWORDS` key in `localStorage` is the single source of truth for which students have had their passwords cleared.
- Once a student successfully sets a new password, their SEN is automatically removed from this list.
- The `pwd` keyword acts as a universal first-time/reset shortcut for students who receive verbal instruction from admin.

---

Previous version: Ver 2.1 — Cloud-Enforced Login Engine
This version: Ver 2.3 — Bulletproof Student Password Reset & pwd Prompt
