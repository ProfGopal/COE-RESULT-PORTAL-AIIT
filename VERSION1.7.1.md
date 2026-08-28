# Release Notes — AIIT COE Result Portal (Ver 1.7.1)

## Master Blueprint: Faculty Curriculum Dropdown & Clean Table Viewer

### 1. Global Versioning Update
- Updated application version tags across `index.html` and `admin-hidden.html` to **Ver 1.7.1**.

### 2. Faculty Curriculum Dropdown & Structured Table View (`script.js`)
- **Single Batch Filter Dropdown**: Replaced all-stacked raw text views with an interactive `#faculty-curr-select` dropdown displaying program/batch selections (e.g., `2024 MCA`, `2025 MCA`).
- **Clean Table Formatting**: Renders Main Categories with badge credit requirements (`Min Credits: X`), Sub-Categories with credit requirements, and structured HTML tables with columns:
  - `Course Code`
  - `Course Name` (dynamically matched from course dictionary via `getCourseInfo`)
  - `Credits` (bold right-aligned)
- **📄 Download Curriculum PDF**: Added `exportFacultyCurriculumPDF()` for clean PDF exports formatted via jsPDF autoTable.

### 3. Navigation & Detail View Integration (`script.js`)
- Fixed student detail back navigation via `#back-to-directory-btn` returning smoothly to faculty directory view.
