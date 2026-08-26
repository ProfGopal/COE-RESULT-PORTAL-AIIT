# AIIT COE Result Portal — Release Notes Ver 3.4

**Release Date:** 2026-08-26  
**Developed by:** Dr. GOPAL RAJENDRAN  
**File:** `script.js`, `index.html`, `admin-hidden.html`

---

## Overview

Ver 3.4 introduces a **Unified Master Storage Key** architecture and **SEN Normalization** engine to ensure absolute consistency between the Admin Portal and the Student Portal. All student record reads and writes are now routed through two global helper functions, eliminating data drift between the `AIIT_STUDENTS_DATA` and `AIIT_UPLOADED_STUDENTS` localStorage keys.

---

## Changes

### 1. Global Versioning Update
- **`index.html`**: Top-left corner version badge updated from `Ver 3.3` to `Ver 3.4`.
- **`admin-hidden.html`**: Top-left corner version badge updated from `Ver 3.3` to `Ver 3.4`.
- **`script.js`**: Header comment updated to `Ver 3.4`.

---

### 2. Unified Master Dataset & Student Login Engine (`script.js`)

#### `window.getGlobalStudentsMasterList()` (NEW)
- Reads the canonical student list from `AIIT_STUDENTS_DATA`.
- Falls back to `AIIT_UPLOADED_STUDENTS` if the primary key is empty.
- Falls back to the in-memory `window.STUDENTS` array as a last resort.
- Ensures all consumers (Student Login, Faculty Portal, Admin Panel) always read from the same source.

#### `window.saveGlobalStudentsMasterList(list)` (NEW)
- Writes the updated student list to both `AIIT_STUDENTS_DATA` and `AIIT_UPLOADED_STUDENTS` simultaneously.
- Syncs `window.STUDENTS` so in-memory consumers stay consistent without a page reload.
- Password reset flows in `verifyStudentLogin` now call this function to guarantee changes are persisted across all storage keys.

#### `window.verifyStudentLogin()` (UPDATED — Ver 3.3 to Ver 3.4)
- **Removed** the auto-hydration of fake fallback student records. Unknown SENs now receive a clear error.
- **Uses** `getGlobalStudentsMasterList()` for the student lookup, replacing the inline storage-loading block.
- **Uses** `saveGlobalStudentsMasterList()` on password reset, ensuring the new password is written to both storage keys atomically.
- SEN normalization (`toUpperCase().trim()`) applied consistently on both input and stored values.

#### `window.loadStudentDashboard(student)` (UPDATED — Ver 3.3 to Ver 3.4)
- **Removed** the fake fallback course injection (3 sample BCAC courses).
- The courses table now displays a "No course records available." empty-state row when no courses exist.
- Default fallback values aligned to B.C.A. program defaults (B.C.A, CGPA 7.58, Credits 66).
- Renders only real data from the student's master record.

---

## Bug Fixes

- Password reset in Student Portal did not persist to `AIIT_STUDENTS_DATA` if the student was loaded from `AIIT_UPLOADED_STUDENTS`. Fixed: `saveGlobalStudentsMasterList()` now writes to both keys atomically.
- SEN mismatch between Admin upload (mixed-case) and Student login (uppercase) caused login failures. Fixed: SEN normalized to `toUpperCase().trim()` on both read and compare paths.
- Unknown SENs silently created fake student records, bypassing actual database. Fixed: Auto-hydration removed; unknown SENs return an explicit error.
- Fake course rows appeared on dashboard when `courses` array was empty. Fixed: Replaced with a proper empty-state table row.

---

## Storage Keys Reference

| Key | Purpose |
|-----|---------|
| `AIIT_STUDENTS_DATA` | Master student list (canonical source of truth) |
| `AIIT_UPLOADED_STUDENTS` | Legacy upload key (kept in sync for backward compatibility) |
| `AIIT_STUDENT_PASS_<SEN>` | Per-student password backup |
| `AIIT_CLEARED_PASSWORDS` | Admin-cleared SENs requiring password reset |

---

## Backward Compatibility

- No breaking changes to the Admin Portal upload flow.
- Existing students in `AIIT_UPLOADED_STUDENTS` are automatically promoted to `AIIT_STUDENTS_DATA` on first read.
- All existing `verifyStudentLogin` callers and `studentLoginStep` interceptors are unaffected.
