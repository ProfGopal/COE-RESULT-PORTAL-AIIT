# AIIT COE Result Portal — Version 11.0 Release Notes

**Release Date:** 2026-08-27  
**Codename:** Enterprise Faculty Audit & First-Time Password Security Suite

---

## What's New

### 1. Global Versioning Update
- Version display in `index.html` and `admin-hidden.html` updated to **Ver 11.0**.

### 2. First-Time Password Change Enforcement
- Faculty members authenticating with default password (`faculty@123`) are automatically prompted to set a permanent password (minimum 6 characters).
- Once changed, default `'faculty@123'` access is revoked for that email address.

### 3. Faculty Login Audit Trail (`FacultyAudit` Sheet)
- Every faculty sign-in is tracked in Google Sheets with:
  - Faculty Email
  - Last Login Timestamp
  - Cumulative Login Count
- Auto-increments login count on subsequent logins.

### 4. Admin Faculty Login Audit & Reset Dashboard (`renderAdminFacultyAudit`)
- Live audit dashboard added inside Admin Panel ("Faculty Assignments & Deadlines" tab).
- Displays total login counts and latest activity timestamps for all registered faculty members.
- Includes a **Reset Password** button per faculty member (`adminResetFacultyPwd`) to restore their password back to default (`faculty@123`) whenever requested.

---

## Files Updated
| File | Change |
|---|---|
| `index.html` | Version tag updated to `Ver 11.0` |
| `admin-hidden.html` | Version tag updated to `Ver 11.0` |
| `backend.gs` | Added `verifyfaculty`, `setfacultypassword`, `getFacultyAudit`, and `logFacultyAudit` handlers |
| `script.js` | Updated Master Script Engine to `Ver 11.0` with faculty auth & audit dashboard |
| `VERSION11.0.md` | Created release notes |
