# AIIT COE Result Portal — Version 2.1 Release Notes

**Release Date:** 2026-08-25
**Developed by:** Dr. Gopal Rajendran
**Project:** AIIT (Amity Institute of Information Technology) COE Result Portal

---

## What's New in Ver 2.1

### 1. Bulletproof Student Password Clearing (Local Fallback Handler)

The password clearing function has been completely rewritten as `window.clearStudentPassword` with a two-tier approach:

**Tier 1 — Cloud Backend:**
- Attempts to call the Google Apps Script backend with `action: 'clearstudentpassword'`.
- If successful, `success` flag is set immediately.

**Tier 2 — Local Storage Fallback (guaranteed):**
- Regardless of backend availability, the cleared SEN is stored in `AIIT_CLEARED_PASSWORDS` in localStorage.
- In-memory `window.STUDENTS` array is updated live (`customPassword` cleared, `passwordCleared` flagged to `true`).
- Ensures the admin action **never silently fails** due to backend action mapping issues or network timeouts.

**UX Improvements:**
- Button shows `Clearing...` spinner state while the operation runs.
- Shows `✅ Password successfully cleared for student: {SEN}` on success.
- Shows `❌ Failed to clear password. Please check connection.` only when both tiers fail.
- Input field is auto-cleared after a successful operation.
- `window.clearPassword` is preserved as a legacy alias pointing to the new function for backward compatibility.

---

### 2. Global Versioning Update

- Version tags updated to **Ver 2.1** across:
  - `index.html` (top-left header on the landing page)
  - `admin-hidden.html` (fixed top-left corner tag)

---

## Files Changed

| File | Change |
|------|--------|
| `index.html` | Version tag updated to `Ver 2.1` |
| `admin-hidden.html` | Version tag updated to `Ver 2.1`; button/input wired to `clearStudentPassword('reset-sen-input')` |
| `script.js` | `window.clearPassword` replaced with `window.clearStudentPassword` (local fallback + legacy alias retained) |
| `VERSION2.1.md` | This file — release notes created |

---

## Security & Reliability Notes

- Password clearing now works **offline** via localStorage, ensuring admin operations are never blocked by backend outages.
- The `AIIT_CLEARED_PASSWORDS` key in localStorage acts as a local audit trail of cleared accounts.
- Cloud sync still takes priority — local fallback only activates if the backend fails.

---

*Built on the AIIT COE Result Portal architecture. All data is cloud-enforced via Google Apps Script backend.*
