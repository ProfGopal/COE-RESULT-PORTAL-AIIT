# Release Notes — AIIT COE Result Portal (Ver 15.0)

## Master Blueprint: Student Backlog Tab & Label Optimization

### 1. Global Versioning Update
- Updated application version tags in `index.html` and `admin-hidden.html` to **Ver 15.0**.

### 2. Student Backlog Extraction Engine (`script.js`)
- Added `window.getActiveBacklogs(courses)` algorithm:
  - Tracks course attempt history across all semesters.
  - Correctly flags failed grades (`F`, `AB`, `DE`, `I`, `U`).
  - Resolves retaken courses so only active, un-cleared backlogs are listed.
- Relabeled the student dashboard backlog tab button strictly to **`⚠️ Backlog (${count})`**.
- Updated empty state text to **`🎉 Excellent! You have no backlogs.`**.
- Preserved seamless tab navigation between **All Courses**, **Backlog**, and **Degree Audit Check**.
