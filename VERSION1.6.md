# Release Notes — AIIT COE Result Portal (Ver 1.6)

## Master Blueprint: Admin Filters, Faculty Back Navigation & Curriculum Viewer Suite

### 1. Global Versioning Update
- Updated application version tags across `index.html` and `admin-hidden.html` to **Ver 1.6**.

### 2. Admin Filters & Export Suite (`script.js`)
- **`applyAdminFilters`**: Enhanced student filtering across search input (SEN / Name), year/batch dropdown, and program selection with accurate result counts (`#total-stu`).
- **Export Bar**: Injected persistent export tools on Admin Student Directory screens:
  - 📥 **Export Excel / CSV** (`window.exportAdminCSV`)
  - 📄 **Export PDF** (`window.exportAdminPDF`)

### 3. Faculty Portal Navigation & Student Detail Views (`script.js`)
- **`renderFacultyPortal`**: Updated Faculty Portal UI with clear tab navigation between **Student Results & Directory** and **Curriculum View**.
- **`facultyFilterAndSort`**: Dynamic client-side filtering by student SEN/Name, batch, and program.
- **`openFacultyStudentView`**: Injects an explicit **"← Back to Directory"** button (`#back-to-directory-btn`) into the student profile header allowing faculty members to seamlessly return to the directory without needing to log out.

### 4. Faculty Curriculum Viewer (`script.js`)
- **`switchFacultyTab('curriculum')`**: Provides a clean read-only view of all cloud-synced curriculum rules, category credit thresholds, subcategories, and course code mappings.
- **`exportCurriculumJSON`**: Offers a 📥 **Download Curriculum** option to export active curriculum rules to JSON format.
