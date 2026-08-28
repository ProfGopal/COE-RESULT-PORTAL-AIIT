# Release Notes — AIIT COE Result Portal (Ver 14.0)

## Master Blueprint: Faculty List, Audit Details & Reset Suite

### 1. Global Versioning Update
- Updated version tags in `index.html` and `admin-hidden.html` to **Ver 14.0**.

### 2. Google Apps Script Backend (`backend.gs`)
- Updated `AUTHORIZED_FACULTY` list with the explicit 13 institutional faculty accounts.
- **`getFacultyAudit`**: Aggregates all login timestamps into an array per faculty member and returns `email`, `timestamps`, total `count`, and `lastTimestamp`.
- **`logFacultyAudit`**: Appends each login event with timestamp and count into `FacultyAudit` sheet.

### 3. Admin Faculty Audit & History Frontend (`script.js`)
- **`renderAdminFacultyAudit`**: Displays complete list of 13 authorized faculty members under Admin Tab 4 (`tab-faculty`) with columns for Faculty Email, Login Count, Last Timestamp, and Action buttons (**Details** & **Reset Password**).
- **`showFacultyAuditDetails`**: Added interactive modal popup displaying the full list of dates and timestamps for every login recorded for a faculty member.
- **`adminResetFacultyPwd`**: Allows resetting any faculty member's password back to the default `faculty@123`.
