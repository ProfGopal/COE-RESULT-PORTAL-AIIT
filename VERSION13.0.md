# Release Notes — AIIT COE Result Portal (Ver 13.0)

## Master Blueprint: True Database-Driven Faculty Authentication & Audit Suite

### 1. Global Versioning Update
- Updated application version tags in `index.html` and `admin-hidden.html` to **Ver 13.0**.

### 2. Apps Script Backend Integration (`backend.gs`)
- **`verifyfaculty`**: Live POST authentication against `FacultyPass` Google Sheet database table.
  - Automatically checks `AUTHORIZED_FACULTY` list.
  - Handles first-time login flow with default credential `faculty@123` or password reset states (`status: "first_time"`).
  - Logs logins to `FacultyAudit` sheet with ISO timestamp and login counter.
- **`setfacultypassword`**: Updates or creates faculty custom password entry in `FacultyPass`.
- **`getFacultyAudit`**: Compiles total login count, last active timestamp (or "Never"), and authorization list for all faculty members.

### 3. Database-Connected Frontend Engine (`script.js`)
- Updated `window.facultyLoginStep` to fetch directly from Apps Script backend with `action: 'verifyfaculty'`.
- Supports interactive password set prompt on first-time login / reset.
- Updated `window.renderAdminFacultyAudit` to render live audit dashboard with reset buttons for all faculty accounts.
- Added `window.adminResetFacultyPwd` to revert faculty passwords back to default (`faculty@123`).
