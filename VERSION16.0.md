# Release Notes — AIIT COE Result Portal (Ver 16.0)

## Master Blueprint: CGPA Precision & Dynamic Summary Bar Fix

### 1. Global Versioning Update
- Updated application version tags in `index.html` and `admin-hidden.html` to **Ver 16.0**.

### 2. CGPA 2-Decimal Precision Across All Dashboards (`script.js`)
- Enforced strict 2-decimal point formatting (`parseFloat(cgpa).toFixed(2)`) across all portals:
  - **Student Portal**: `loadStudentDashboard(student)`
  - **Faculty Directory**: `renderFacultyStudentTable(students)`
  - **Admin Directory**: `applyAdminFilters()`

### 3. Dynamic Summary Bar Repair (`script.js`)
- Implemented live DOM scanner in `loadStudentDashboard` that locates static text elements containing `"Completed Credits:"` and `"Backlog"`.
- Dynamically populates live student metrics:
  `Completed Credits: ${credits}   |   Backlog / Failed Courses: ${backlogsList.length}`
- Enabled `flex-wrap: wrap` on student tab navigation bar to prevent UI overflow on narrow screens.
