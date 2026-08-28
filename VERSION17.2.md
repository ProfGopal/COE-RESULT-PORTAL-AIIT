# Release Notes — AIIT COE Result Portal (Ver 1.7.2)

## Master Blueprint: Advanced Student Filters & Sorting Suite

### 1. Global Versioning Update
- Updated application version tags across `index.html` and `admin-hidden.html` to **Ver 1.7.2**.

### 2. Advanced Student Filters & Sorting Suite (`script.js`)
- **`getActiveBacklogs`**: Calculates active failed courses / backlogs per student dynamically based on course grade history.
- **`populateFilterDropdowns`**: Dynamically populates Year/Batch and Program filter dropdowns directly from loaded student cloud records.
- **Backlogs Filter Dropdown**: Added `filter-backlog` with options:
  - `All Backlog Status`
  - `⚠️ Has Backlogs / Failed`
  - `✅ Zero Backlogs (Clean)`
- **Sorting Dropdown**: Added `sort-credits` with sorting options:
  - `Credits: High to Low`
  - `Credits: Low to High`
  - `CGPA: High to Low`
  - `CGPA: Low to High`
- **Backlogs Badge Column**: Added dedicated **Backlogs** column to both Admin and Faculty student directory tables with styled badges (`#fee2e2` for >0 backlogs, `#dcfce3` for 0 backlogs).
