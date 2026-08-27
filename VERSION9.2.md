# AIIT COE Result Portal — Version 9.2 Release Notes

**Release Date:** 2026-08-27  
**Codename:** Explicit Button Action Handlers

---

## What's New

### 1. Global Versioning Update
- All version tags in `index.html` and `admin-hidden.html` updated to **Ver 9.2**.

### 2. Direct HTML Action Bindings
- **Faculty Sign-In Button** (`index.html`): Now explicitly triggers `window.facultyLoginStep()` via inline `onclick`.
- **Admin Navigation Tabs** (`admin-hidden.html`): All 4 admin tab buttons now call `window.switchAdminTab(tabId, this)` directly via `onclick`.
- **Admin Logout Button** (`admin-hidden.html`): Now calls `window.logoutPortal()` for consistent session cleanup.

### 3. Explicit Handler Engine (`script.js`)
- Added `window.switchAdminTab(tabId, btnElement)` — robust admin tab switcher with:
  - Hides all tab content panels and removes active state from all tab buttons.
  - Shows the targeted tab and highlights the clicked button.
  - Auto-triggers `applyAdminFilters()` on Student Directory tab and `loadCurriculumEditor()` on Curriculum tab.
- `window.facultyLoginStep()` — faculty authentication with authorized email list check.
- `window.logoutPortal()` — clears session/local storage and redirects to landing page.

### 4. Admin Tab ID Standardization
- Renamed the first admin tab content div from `tab-results` to `tab-upload` for consistency with the navigation button handler targets.

---

## Files Changed
| File | Change |
|---|---|
| `index.html` | Version tag → Ver 9.2 |
| `admin-hidden.html` | Version tag → Ver 9.2, admin nav `onclick` handlers with `window.` prefix, tab ID rename, logout fix |
| `script.js` | Version comment → Ver 9.2, added `window.switchAdminTab` function |
| `VERSION9.2.md` | Created (this file) |
