# Release Notes — AIIT COE Result Portal (Ver 17.0)

## Master Blueprint: Faculty List, Audit Details & Tab 4 Integration

### 1. Global Versioning Update
- Updated application version tags in `index.html` and `admin-hidden.html` to **Ver 17.0**.

### 2. Admin Tab 4 Faculty Audit Integration (`script.js`)
- Added `window.AUTHORIZED_FACULTY_LIST` array containing all 13 institutional faculty accounts.
- **`switchAdminTab`**: Updated tab navigation logic to dynamically trigger `renderAdminFacultyAudit()` whenever Tab 4 (`tab-faculty`) is activated.
- **`renderAdminFacultyAudit`**: Prominently renders the **Authorized Faculty Directory & Login Audit** table inside Tab 4 with live login counters, last active timestamps, a **Details** button, and a **Reset Password** button.
- **`showFacultyAuditDetails`**: Renders a modal popup listing exact historical login dates and timestamps for the selected faculty member.
- **`adminResetFacultyPwd`**: Sends POST request to Google Apps Script backend to reset password back to `faculty@123`.
