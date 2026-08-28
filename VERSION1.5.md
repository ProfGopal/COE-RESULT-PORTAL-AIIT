# Release Notes — AIIT COE Result Portal (Ver 1.5)

## Master Blueprint: COE Login Integration & Enterprise Audit Suite

### 1. Global Versioning Update
- Updated application version tags across `index.html` and `admin-hidden.html` to **Ver 1.5**.

### 2. COE Login Landing Integration (`index.html` & `script.js`)
- Added **COE Login** trigger button on `index.html` below the Faculty Login button.
- Dedicated COE credential input form for account **`coeaub@blr.amity.edu`**.
- Default password initial state `coe@123` with forced first-time password update prompt (`status: "first_time"`).
- Redirects verified COE account to `admin-hidden.html`.

### 3. Apps Script Database Engine (`backend.gs`)
- **`verifycoe`**: Validates COE login credentials against `COELogin` sheet in Google Sheets.
- **`setcoepassword`**: Updates permanent custom password for `coeaub@blr.amity.edu`.
- **`getCOEAudit`**: Aggregates timestamps and login count for the COE account from `COEAudit` sheet.
- **`logCOEAudit`**: Records ISO timestamps and login frequency counter for COE logins in `COEAudit`.

### 4. Admin Panel Dual Audit Suite (`script.js` & `admin-hidden.html`)
- **`renderAdminDualAudit`**: Injects two comprehensive management sections into Admin Tab 4 (`tab-faculty`):
  1. **🛡️ COE Login Audit & Security**: Shows COE login count, last active timestamp, and **Reset COE Password** trigger (resets back to `coe@123`).
  2. **📊 Authorized Faculty Directory & Login Audit**: Renders all 13 authorized faculty members, login frequency counts, timestamp history modal (**Details** button), and **Reset Password** triggers.
