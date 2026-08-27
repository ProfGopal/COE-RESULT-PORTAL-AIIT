# VERSION 5.2 — Direct Apps Script Cloud Integration for Passwords

**Release Date:** 2026-08-27

---

## Changes

### 1. Global Versioning
- Updated version tags to **Ver 5.2** in `index.html` and `admin-hidden.html`.

### 2. Apps Script Backend URL
- **New constant** `APPS_SCRIPT_URL` added to `script.js`.
- Points to the deployed Google Apps Script Web App for cloud database sync.

### 3. Cloud-Connected Admin Reset (`clearStudentPassword`)
- **Completely replaced** local localStorage-based password clearing.
- Now sends a `clearpassword` action via `fetch()` POST to the Apps Script backend.
- Requires admin password confirmation (`prompt`) before clearing.
- Backend clears Column G in Google Sheets directly.
- Success/failure feedback via `result.status` from the cloud.

### 4. Cloud-Connected Login Engine (`verifyStudentLogin`)
- **Completely replaced** local localStorage-based login validation.
- Now an `async` function that authenticates against the Google Apps Script backend.
- Sends a `login` action with SEN and password via `fetch()` POST.
- **First-time / Cleared users** (`result.status === 'first_time'`):
  - Prompts for new password (min 6 chars) + confirmation.
  - Sends `setpassword` action to save in Column G of Google Sheets.
  - After success, calls `loadStudentDashboardAfterCloudAuth(sen)`.
- **Normal login**: Loads dashboard from `result.student` returned by the backend.
- **Network errors**: Displays cloud connection error message.

### 5. New Function: `loadStudentDashboardAfterCloudAuth`
- Fetches the full student list from Apps Script (`?action=load`).
- Finds the student by SEN and loads the dashboard.
- Falls back to page reload if student is not found or on error.

---

## Architecture Shift
This version marks the transition from **localStorage-only** password management to **Google Sheets cloud-backed** authentication. All password operations (set, clear, verify) now sync directly to the cloud backend.

## Files Modified
| File | Change |
|---|---|
| `index.html` | Version tag → Ver 5.2 |
| `admin-hidden.html` | Version tag → Ver 5.2 |
| `script.js` | Added `APPS_SCRIPT_URL`; replaced `clearStudentPassword` & `verifyStudentLogin` with cloud versions; added `loadStudentDashboardAfterCloudAuth` |
