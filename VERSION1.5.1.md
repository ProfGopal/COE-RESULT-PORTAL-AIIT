# Release Notes — AIIT COE Result Portal (Ver 1.5.1)

## Master Blueprint: COE Configuration, Anti-Malpractice Seating & Backend Action Fix

### 1. Global Versioning Update
- Updated application version tags across `index.html` and `admin-hidden.html` to **Ver 1.5.1**.

### 2. Fixed Google Apps Script Backend (`backend.gs`)
- Updated `doPost(e)` action handler to resolve "Unknown POST action" errors.
- Handled `verifycoe`, `setcoepassword`, `getCOEAudit`, `saveCoeConfig`, and `getCoeConfig` actions cleanly in backend.

### 3. COE Examination & Seating Management Suite (`script.js`)
- **`SAMPLE_COE_DATA`**: Provided 10 sample testing data points (semesters, courses, exam halls & capacities) for instant offline verification and demonstration.
- **`showCoeDashboard`**: Built the interactive COE Examination Management Portal (Semester selection, UG/PG checkboxes, Exam Date, Slot A1-H2 selection, Start/End times, Exam Hall capacity checkboxes, scheduled course mapping).
- **`generateAntiMalpracticeSeating`**: Anti-malpractice round-robin alternating seating distribution algorithm across halls to prevent adjacent candidates having identical subjects.
- **`renderSeatingReport`**: Renders seating arrangement tables per hall with student SEN, name, course code, course title, and invigilator signature lines.
- **`exportCoeReport`**: Multi-format export engine for COE:
  - **Excel**: CSV format
  - **Word**: HTML formatted `.doc` table
  - **PDF**: jsPDF autoTable format

### 4. Admin COE Master Configuration (`script.js`)
- **`renderAdminCoeConfigTab`**: Added COE Configuration & Exam Master Management section inside Admin Tab 4 (`tab-faculty`) to add/remove halls, add/remove courses, edit slots, and sync master configuration to Google Sheets (`saveCoeConfigToCloud`).
