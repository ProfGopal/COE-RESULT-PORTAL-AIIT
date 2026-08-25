# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 2.0 (Curriculum Table View, All Programs Dropdown & Admin-Only Faculty Control)

You are updating a static GitHub Pages site (`script.js`, `index.html`, `admin-hidden.html`). We are transforming the faculty curriculum viewer into a clean table format, populating the dropdown with *all* available batches/programs, enforcing strict Admin-only control for faculty creation, updating versions to Ver 2.0, and creating `VERSION2.0.md`.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 2.0`.

## 2. Faculty Curriculum Table View (Read-Only) & All Programs Dropdown
* **File:** `script.js`
  * Replace `window.renderFacultyCurriculumViewer` with this table-based layout that loads all available batch/program keys:

    ```javascript
    window.renderFacultyCurriculumViewer = function(container) {
        let rules = {};
        try { rules = JSON.parse(localStorage.getItem('AIIT_CUSTOM_CURRICULUM')) || window.CURRICULUM_RULES || {}; } catch(e){}

        let keys = Object.keys(rules);
        if (keys.length === 0) keys = ["2024_MCA"]; // Fallback default

        let selectEl = document.getElementById('fac-curr-select');
        let selectedKey = selectEl ? selectEl.value : keys[0];
        if (!rules[selectedKey]) selectedKey = keys[0];

        let currentRules = rules[selectedKey] || [];
        let tableRowsHTML = "";

        currentRules.forEach(main => {
            let subs = main.subCategories || [];
            if (subs.length === 0) {
                tableRowsHTML += `
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:12px; font-weight:bold; color:#0f172a;">${esc(main.category)}</td>
                    <td style="padding:12px; color:#475569;">General / Core</td>
                    <td style="padding:12px; font-weight:bold; color:#2563eb;">${main.minCredits || 0} Cr</td>
                    <td style="padding:12px;">
                        ${(main.codes || []).map(c => `<span style="background:#f1f5f9; border:1px solid #cbd5e1; padding:3px 8px; border-radius:4px; margin:2px; display:inline-block; font-weight:bold; font-size:0.85rem; color:#1e293b;">${esc(c)}</span>`).join('')}
                    </td>
                </tr>`;
            } else {
                subs.forEach(sub => {
                    tableRowsHTML += `
                    <tr style="border-bottom:1px solid #e2e8f0;">
                        <td style="padding:12px; font-weight:bold; color:#0f172a;">${esc(main.category)}</td>
                        <td style="padding:12px; color:#475569;">${esc(sub.name)}</td>
                        <td style="padding:12px; font-weight:bold; color:#2563eb;">${sub.minCredits || 0} Cr</td>
                        <td style="padding:12px;">
                            ${(sub.codes || sub.items || []).map(item => {
                                let code = typeof item === 'string' ? item : (item.code || '');
                                return `<span style="background:#f1f5f9; border:1px solid #cbd5e1; padding:3px 8px; border-radius:4px; margin:2px; display:inline-block; font-weight:bold; font-size:0.85rem; color:#1e293b;">${esc(code)}</span>`;
                            }).join('')}
                        </td>
                    </tr>`;
                });
            }
        });

        container.innerHTML = `
            <div style="background:white; padding:25px; border-radius:8px; border:1px solid #cbd5e1; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:15px;">
                    <div>
                        <h3 style="margin:0; color:#0f172a;">📚 Official Curriculum Viewer (Read-Only)</h3>
                        <p style="margin:4px 0 0 0; font-size:0.85rem; color:#64748b;">Viewing institutional curriculum mappings and requirements.</p>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <label style="font-weight:bold; font-size:0.9rem; color:#334155;">Select Batch & Program:</label>
                        <select id="fac-curr-select" onchange="window.renderFacultyCurriculumTab()" style="padding:8px 14px; border:1px solid #cbd5e1; border-radius:6px; font-weight:bold; background:#f8fafc; color:#0f172a; cursor:pointer;">
                            ${keys.map(k => `<option value="${k}" ${selectedKey===k?'selected':''}>${k.replace('_', ' ')}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                        <thead>
                            <tr style="background:#f8fafc; border-bottom:2px solid #cbd5e1; color:#334155;">
                                <th style="padding:12px;">Category / Basket</th>
                                <th style="padding:12px;">Sub-Category</th>
                                <th style="padding:12px;">Min Credits</th>
                                <th style="padding:12px;">Assigned Courses</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHTML || `<tr><td colspan="4" style="text-align:center; padding:20px; color:#64748b;">No curriculum records available.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>`;
    };
    ```

## 3. Admin-Only Faculty Management Clarification
* **Note on Faculty Creation:** Adding a new faculty member can **only be performed by the Administrator** through the Admin Panel (under Course Assignments and credential management). Faculty accounts cannot self-register for security compliance.

## 4. Create `VERSION2.0.md`
* Create a file named `VERSION2.0.md` in your project root containing the release notes for Ver 2.0.