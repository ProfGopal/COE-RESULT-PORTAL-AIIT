# AIIT COE Result Portal — Release Notes

## Version 2.5
**Released:** 2026-08-25
**Developed by:** Dr. Gopal Rajendran, Amity Institute of Information Technology (AIIT)

---

## What's New in Ver 2.5

### Bulletproof Universal Student Login & Auto-Enrollment Recovery

**Feature:** The student login validator has been upgraded with an auto-recovery mechanism. If a student's record is not found in the in-memory `window.STUDENTS` array (e.g. after a page refresh or cold load), the system now:
1. Attempts to restore the student list from `AIIT_STUDENTS_DATA` in localStorage.
2. If still not found, synthesises a minimal placeholder student record and adds it to both `window.STUDENTS` and `AIIT_STUDENTS_DATA` — so the password reset flow is never blocked.

#### Key Changes vs Ver 2.4

| Behaviour | Ver 2.4 | Ver 2.5 |
|-----------|---------|---------|
| Student not in window.STUDENTS | Show error & stop | Auto-recover from localStorage |
| Student not in localStorage either | Show error & stop | Synthesise minimal record & continue |
| Saves updated student list on password set | No | Yes (AIIT_STUDENTS_DATA) |
| SEN-not-found error shown | Always | Only if all recovery paths fail (never) |
| Prompt message | "Password reset active for this SEN..." | "Enter your new permanent password..." |
| Success message | "Password successfully created!" | "Password saved successfully!" |

#### Auto-Recovery Flow

`
Student tries to login
       |
       v
window.STUDENTS has records? --No--> Try AIIT_STUDENTS_DATA in localStorage
       |                                        |
      Yes                           Found? --Yes--> Use restored list
       |                                        |
       v                                       No
Find SEN in list                               v
       |                         Synthesise: { sen, name, program, batch, cgpa, customPassword:"" }
      Not found --------------------------------------------> Push to window.STUDENTS + save to localStorage
       |
      Found
       |
       v
Apply password reset / verification logic (unchanged from Ver 2.4)
`

---

## Files Changed

| File | Change |
|------|--------|
| script.js | Upgraded verifyStudentLogin to Ver 2.5 with auto-enrollment recovery; updated intercept comment to Ver 2.5; updated version header to Ver 2.5 |
| index.html | Updated version badge from Ver 2.4 to Ver 2.5 |
| admin-hidden.html | Updated version badge from Ver 2.4 to Ver 2.5 |
| VERSION2.5.md | (this file) Created release notes |

---

*Previous version: Ver 2.4 — Universal Password Reset Interceptor*
*This version: Ver 2.5 — Bulletproof Universal Student Login & Auto-Enrollment Recovery*
