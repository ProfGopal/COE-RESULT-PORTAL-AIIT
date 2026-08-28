# Release Notes — AIIT COE Result Portal (Ver 1.7)

## Master Blueprint: Faculty Curriculum Table Viewer & Navigation Fix

### 1. Global Versioning Update
- Updated application version tags across `index.html` and `admin-hidden.html` to **Ver 1.7**.

### 2. Faculty Curriculum Table Viewer (`script.js`)
- Rebuilt the **Faculty Curriculum Viewer** (`switchFacultyTab('curriculum')`) to match the Admin Panel table structure.
- **Batch & Program Dropdown**: Added `#faculty-curr-select` allowing faculty members to dynamically toggle curriculum tables between program/batch rules (e.g. `2024 MCA`, `2025 MCA`, `2024 B.C.A`).
- **Structured Table Layout**: Renders Main Categories (with minimum required credits), Sub-Categories (with minimum credits), and clean tables showing `Course Code`, `Course Name` (resolved via `getCourseInfo`), and `Credits`.
- **📄 Download PDF Export**: Added `exportFacultyCurriculumPDF()` enabling faculty to export the selected batch curriculum to PDF format via jsPDF autoTable.

### 3. Student Profile Back Navigation Repair (`script.js`)
- **`openFacultyStudentView`**: Fixed the **"← Back to Directory"** button (`#back-to-directory-btn`) when viewing individual student profiles in the faculty portal.
- Clicking the back button properly hides the student dashboard and re-renders `renderFacultyPortal()` seamlessly without forcing a logout or breaking UI state.
