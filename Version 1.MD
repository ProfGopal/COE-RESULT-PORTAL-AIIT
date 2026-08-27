```python
# Let's verify the exact requirements for Ver 10.0:
# 1. Admin Curriculum Table Editor: Display Course Code, Course Name, and Credits in the table columns, with full Edit and Remove options for each course.
# 2. Google Sheets Persistence: Ensure any change made in the Curriculum Manager (adding, editing, removing courses, renaming categories, editing credits) automatically saves directly to the Google Sheet backend (`CurriculumDB` tab) via `saveCurriculumToCloud()`, so it syncs instantly across any laptop, browser, or Incognito window.
# 3. Student Portal Degree Audit: Cross-verify student completed courses against these exact cloud curriculum baskets and display whether each basket (School Core, Program Core, Electives, etc.) is completed or pending in the student login dashboard.

print("Designing Ver 10.0 Master Cloud-Sync Curriculum & Degree Audit Architecture")


```

```text
Designing Ver 10.0 Master Cloud-Sync Curriculum & Degree Audit Architecture


```

# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 10.0 (100% Cloud-Synced Curriculum & Degree Audit Suite)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`) and Google Apps Script backend (`Code.gs`). We are upgrading the Admin Curriculum Table Editor to display **Course Code, Course Name, and Credits** with full **Edit and Remove** options, ensuring all changes persist automatically to the Google Sheet (`CurriculumDB` tab) for cross-device & Incognito sync, and fully empowering the student portal **Degree Audit** to cross-verify completed baskets, updating version tags to **Ver 10.0**, and creating `VERSION10.0.md`.

Please execute the following strict updates:

## 1. Global Versioning Update

* **File:** `index.html`, `admin-hidden.html`
* Change all version tags in the top left corners to `Ver 10.0`.



## 2. 100% Cloud-Synced Curriculum & Degree Audit Engine (`script.js`)

* **File:** `script.js`
* Replace your curriculum table editor, course info lookup, and degree audit functions with this complete master version:



```javascript
/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 10.0 - 100% Cloud-Synced Curriculum & Degree Audit)
 */

'use strict';

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";

window.STUDENTS = [];
window.CURRICULUM_RULES = {};
window.CUSTOM_COURSE_DICT = {};
window.SYSTEM_PROGRAMS = [];

function sanitize(str) {
  return String(str || '').replace(/[<>"'`;\\&\/]/g, '').trim().substring(0, 200);
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
window.esc = esc;

// --- 1. COURSE INFO HELPER (Resolves Name & Credits) ---
window.getCourseInfo = function(code) {
    if (!code) return { name: "Course Title", credits: 3 };
    let cleanCode = String(code).toUpperCase().trim();
    if (window.CUSTOM_COURSE_DICT && window.CUSTOM_COURSE_DICT[cleanCode]) {
        let item = window.CUSTOM_COURSE_DICT[cleanCode];
        return {
            name: item.name || cleanCode,
            credits: (item.credits !== undefined && !isNaN(item.credits)) ? parseFloat(item.credits) : 3
        };
    }
    return { name: cleanCode, credits: 3 };
};

// --- 2. CLOUD SYNC & BOOTLOADER ---
window.initializeCloudPortal = async function() {
    try {
        let [stuRes, curRes] = await Promise.all([
            fetch(scriptURL + "?action=load"),
            fetch(scriptURL + "?action=getCurriculum")
        ]);
        
        let stuData = await stuRes.json();
        window.STUDENTS = Array.isArray(stuData) ? stuData : (stuData.students || []);
        
        let progMap = new Map();
        window.STUDENTS.forEach(s => {
            if (s.batch && s.program) {
                progMap.set(`${s.batch}_${s.program}`, { batch: s.batch, program: s.program });
            }
        });
        window.SYSTEM_PROGRAMS = Array.from(progMap.values());
        if (window.SYSTEM_PROGRAMS.length === 0) {
            window.SYSTEM_PROGRAMS = [
                { batch: "2024", program: "MCA" }, 
                { batch: "2025", program: "MCA" }, 
                { batch: "2024", program: "B.C.A" }, 
                { batch: "2025", program: "B.C.A" }
            ];
        }

        let curText = await curRes.text();
        if (curText && curText.trim().startsWith("{")) {
            let parsed = JSON.parse(curText);
            window.CURRICULUM_RULES = parsed.rules || parsed;
            if (parsed.courses) window.CUSTOM_COURSE_DICT = parsed.courses;
        }
    } catch (err) {
        console.warn("Cloud sync warning:", err);
    }

    if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
    if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
};

window.saveCurriculumToCloud = function() {
    let masterPayload = {
        rules: window.CURRICULUM_RULES || {},
        programs: window.SYSTEM_PROGRAMS || [],
        courses: window.CUSTOM_COURSE_DICT || {}
    };

    localStorage.setItem('AIIT_CUSTOM_CURRICULUM', JSON.stringify(masterPayload.rules));
    localStorage.setItem('AIIT_CUSTOM_COURSES', JSON.stringify(masterPayload.courses));

    const formData = new FormData();
    formData.append('action', 'saveCurriculum');
    formData.append('curriculumData', JSON.stringify(masterPayload));

    fetch(scriptURL, { method: 'POST', body: formData })
        .then(res => res.text())
        .then(txt => console.log("☁️ Curriculum auto-saved to Google Sheets:", txt))
        .catch(err => console.error("☁️ Cloud save error:", err));
};

// --- 3. ADMIN CURRICULUM TABLE EDITOR (Code, Name, Credits, Edit, Remove) ---
window.loadCurriculumEditor = function() {
    const dropdown = document.getElementById('curriculum-edit-key') || document.querySelector('select[id*="curr"]');
    const container = document.getElementById('curriculum-gui-container') || document.querySelector('.curriculum-container') || document.getElementById('tab-curriculum');
    
    let sysProgs = window.SYSTEM_PROGRAMS.length > 0 ? window.SYSTEM_PROGRAMS : [{ batch: "2024", program: "MCA" }];

    if (dropdown && dropdown.options.length <= 1) {
        dropdown.innerHTML = sysProgs.map(p => {
            let key = `${p.batch}_${p.program}`;
            return `<option value="${key}">${p.batch} ${p.program}</option>`;
        }).join('');
    }

    window.triggerLoadCurriculum = function() {
        let selectedKey = dropdown ? dropdown.value : "2024_MCA";
        window.currentEditingKey = selectedKey;
        
        let rules = window.CURRICULUM_RULES[selectedKey] || [
            { 
                category: "A. School Core", 
                minCredits: 17, 
                subCategories: [
                    { name: "General Courses", minCredits: 17, codes: ["CSE5129", "MAT5005"] }
                ] 
            }
        ];

        let targetContainer = document.getElementById('curriculum-gui-container');
        if (!targetContainer && container) {
            targetContainer = document.createElement('div');
            targetContainer.id = 'curriculum-gui-container';
            targetContainer.style.cssText = 'margin-top:20px;';
            container.appendChild(targetContainer);
        }
        if (!targetContainer) return;

        let html = `
        <div style="background:white; padding:20px; border-radius:8px; border:1px solid #cbd5e1; margin-top:15px;">
            <h3 style="color:#0f172a; margin-top:0;">📋 Curriculum Table Editor: ${selectedKey.replace('_', ' ')}</h3>`;

        rules.forEach((main, mIdx) => {
            html += `
            <div style="margin-bottom:20px; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden;">
                <div style="background:#f8fafc; padding:12px 15px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #cbd5e1;">
                    <strong>📁 ${esc(main.category)} (Min Credits: ${main.minCredits})</strong>
                    <div style="display:flex; gap:8px;">
                        <button onclick="window.adminRenameMainCat(${mIdx})" style="background:#0ea5e9; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">Rename Category</button>
                        <button onclick="window.adminEditMainCreds(${mIdx})" style="background:#3b82f6; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">Edit Credits</button>
                    </div>
                </div>`;

            (main.subCategories || []).forEach((sub, sIdx) => {
                html += `
                <div style="padding:15px; background:white; border-bottom:1px solid #e2e8f0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-weight:bold; color:#334155;">📄 Sub-Category: ${esc(sub.name)} (Min: ${sub.minCredits} Cr)</span>
                        <div style="display:flex; gap:6px;">
                            <button onclick="window.adminRenameSubCat(${mIdx}, ${sIdx})" style="background:#64748b; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">Rename Sub</button>
                            <button onclick="window.adminEditSubCreds(${mIdx}, ${sIdx})" style="background:#64748b; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">Edit Sub Cr</button>
                        </div>
                    </div>
                    <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                        <thead>
                            <tr style="background:#f1f5f9; color:#475569; text-align:left;">
                                <th style="padding:8px;">Course Code</th>
                                <th style="padding:8px;">Course Name</th>
                                <th style="padding:8px; text-align:center;">Credits</th>
                                <th style="padding:8px; text-align:right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(sub.codes || []).length > 0 ? (sub.codes || []).map((code, cIdx) => {
                                let info = window.getCourseInfo(code);
                                return `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:8px; font-weight:bold; color:#0f172a;">${esc(code)}</td>
                                    <td style="padding:8px; color:#334155;">${esc(info.name)}</td>
                                    <td style="padding:8px; text-align:center; font-weight:bold; color:#2563eb;">${info.credits} Cr</td>
                                    <td style="padding:8px; text-align:right; white-space:nowrap;">
                                        <button onclick="window.adminEditCourse('${selectedKey}', ${mIdx},${sIdx}, ${cIdx}, '${code}')" style="background:#eab308; color:#451a03; border:none; padding:3px 8px; border-radius:4px; cursor:pointer; font-weight:bold; margin-right:4px;">Edit</button>
                                        <button onclick="window.adminRemoveCourse('${selectedKey}',${mIdx}, ${sIdx},${cIdx})" style="background:#ef4444; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">Remove</button>
                                    </td>
                                </tr>`;
                            }).join('') : `<tr><td colspan="4" style="padding:10px; color:#64748b; text-align:center;">No courses in this sub-category yet.</td></tr>`}
                        </tbody>
                    </table>
                    <button onclick="window.adminAddCourse('${selectedKey}', ${mIdx}, ${sIdx})" style="margin-top:10px; background:#10b981; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">+ Add Course Code</button>
                </div>`;
            });
            html += `</div>`;
        });

        html += `</div>`;
        targetContainer.innerHTML = html;
    };

    window.adminEditCourse = function(key, mIdx, sIdx, cIdx, oldCode) {
        let info = window.getCourseInfo(oldCode);
        let newCode = prompt("Edit Course Code:", oldCode);
        if (!newCode) return;
        let cleanCode = newCode.toUpperCase().trim();

        let newName = prompt(`Edit Course Name for ${cleanCode}:`, info.name);
        let newCreds = prompt(`Edit Credits for ${cleanCode}:`, info.credits);
        let parsedCreds = !isNaN(parseFloat(newCreds)) ? parseFloat(newCreds) : 3;

        let rules = window.CURRICULUM_RULES[key];
        rules[mIdx].subCategories[sIdx].codes[cIdx] = cleanCode;

        if (!window.CUSTOM_COURSE_DICT) window.CUSTOM_COURSE_DICT = {};
        window.CUSTOM_COURSE_DICT[cleanCode] = { name: newName || cleanCode, credits: parsedCreds };

        window.CURRICULUM_RULES = rules;
        window.saveCurriculumToCloud();
        window.triggerLoadCurriculum();
    };

    window.adminAddCourse = function(key, mIdx, sIdx) {
        let code = prompt("Enter Course Code (e.g., CSE5001):");
        if (!code) return;
        let clean = code.toUpperCase().trim();

        let name = prompt(`Enter Course Name for ${clean}:`, "Course Title");
        let creds = prompt(`Enter Credits for ${clean}:`, "3");
        let parsedCreds = !isNaN(parseFloat(creds)) ? parseFloat(creds) : 3;

        if (!window.CUSTOM_COURSE_DICT) window.CUSTOM_COURSE_DICT = {};
        window.CUSTOM_COURSE_DICT[clean] = { name: name || clean, credits: parsedCreds };

        let rules = window.CURRICULUM_RULES[key];
        if (!rules[mIdx].subCategories[sIdx].codes.includes(clean)) {
            rules[mIdx].subCategories[sIdx].codes.push(clean);
        }

        window.CURRICULUM_RULES = rules;
        window.saveCurriculumToCloud();
        window.triggerLoadCurriculum();
    };

    window.adminRemoveCourse = function(key, mIdx, sIdx, cIdx) {
        if (confirm("Remove this course code?")) {
            let rules = window.CURRICULUM_RULES[key];
            rules[mIdx].subCategories[sIdx].codes.splice(cIdx, 1);
            window.CURRICULUM_RULES = rules;
            window.saveCurriculumToCloud();
            window.triggerLoadCurriculum();
        }
    };

    window.adminRenameMainCat = function(mIdx) {
        let key = window.currentEditingKey || "2024_MCA";
        let newName = prompt("Enter new Main Category name:");
        if (newName) {
            window.CURRICULUM_RULES[key][mIdx].category = newName;
            window.saveCurriculumToCloud();
            window.triggerLoadCurriculum();
        }
    };

    window.adminEditMainCreds = function(mIdx) {
        let key = window.currentEditingKey || "2024_MCA";
        let creds = prompt("Enter minimum credits for this category:");
        if (creds !== null && !isNaN(creds)) {
            window.CURRICULUM_RULES[key][mIdx].minCredits = parseFloat(creds);
            window.saveCurriculumToCloud();
            window.triggerLoadCurriculum();
        }
    };

    window.adminRenameSubCat = function(mIdx, sIdx) {
        let key = window.currentEditingKey || "2024_MCA";
        let newName = prompt("Enter new Sub-Category name:");
        if (newName) {
            window.CURRICULUM_RULES[key][mIdx].subCategories[sIdx].name = newName;
            window.saveCurriculumToCloud();
            window.triggerLoadCurriculum();
        }
    };

    window.adminEditSubCreds = function(mIdx, sIdx) {
        let key = window.currentEditingKey || "2024_MCA";
        let creds = prompt("Enter minimum credits for this sub-category:");
        if (creds !== null && !isNaN(creds)) {
            window.CURRICULUM_RULES[key][mIdx].subCategories[sIdx].minCredits = parseFloat(creds);
            window.saveCurriculumToCloud();
            window.triggerLoadCurriculum();
        }
    };

    // --- 4. STUDENT PORTAL DEGREE AUDIT ENGINE (Cross-Verifies Baskets) ---
    window.evaluateDegree = function(student) {
        let studentBatch = String(student.batch || "").trim();
        let studentProg = String(student.program || "").trim();
        let mapKey = `${studentBatch}_${studentProg}`;
        let mapKeySpace = `${studentBatch} ${studentProg}`;

        let rulesToUse = window.CURRICULUM_RULES[mapKey] || window.CURRICULUM_RULES[mapKeySpace] || Object.values(window.CURRICULUM_RULES)[0];
        
        if (!rulesToUse || rulesToUse.length === 0) {
            return `<div style="text-align:center; padding:25px; background:#f8fafc; border-radius:10px; border:2px dashed #cbd5e1; margin-top:20px;">
                        <h3 style="color:#ef4444; margin-top:0;">📭 Curriculum Not Mapped</h3>
                        <p style="color:#475569;">No curriculum rules found for batch/program (${studentBatch} ${studentProg}).</p>
                    </div>`;
        }

        const cleanString = (str) => String(str).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const isPass = (grade) => !['F', 'AB', 'DE', 'I', 'U'].includes(String(grade).toUpperCase().trim());

        let earnedCourses = (student.courses || []).map(c => ({
            ...c,
            cleanCode: cleanString(c.code || c.CourseCode),
            grade: String(c.grade || c.Grade || "").toUpperCase().trim()
        }));

        let auditHTML = `<div class="audit-wrapper" style="margin-top:10px;">`;

        rulesToUse.forEach(mainBasket => {
            let basketReq = parseFloat(mainBasket.minCredits) || 0;
            let basketEarned = 0;
            let subHTML = "";

            let subCats = mainBasket.subCategories || [];
            if (subCats.length === 0 && mainBasket.codes) {
                subCats = [{ name: "General Courses", minCredits: basketReq, codes: mainBasket.codes }];
            }

            subCats.forEach(sub => {
                let subReq = parseFloat(sub.minCredits) || 0;
                let subEarned = 0;
                let coursesHTML = "";

                (sub.codes || []).forEach(reqCode => {
                    let cleanReq = cleanString(reqCode);
                    let match = earnedCourses.find(c => c.cleanCode === cleanReq && isPass(c.grade));
                    let info = window.getCourseInfo(reqCode);

                    if (match) {
                        let cr = parseFloat(match.credits || info.credits || 3);
                        subEarned += cr;
                        basketEarned += cr;
                        coursesHTML += `
                        <tr style="background:#ecfdf5;">
                            <td style="padding:8px; border-bottom:1px solid #d1fae5; color:#065f46; font-weight:bold;">${esc(reqCode)}</td>
                            <td style="padding:8px; border-bottom:1px solid #d1fae5; color:#065f46;">${esc(match.name || info.name)}</td>
                            <td style="padding:8px; border-bottom:1px solid #d1fae5; color:#065f46; font-weight:bold;">${cr} Cr</td>
                            <td style="padding:8px; border-bottom:1px solid #d1fae5; color:#065f46; text-align:center;">✅ Passed (${esc(match.grade)})</td>
                        </tr>`;
                    } else {
                        coursesHTML += `
                        <tr>
                            <td style="padding:8px; border-bottom:1px solid #f1f5f9; color:#64748b; font-weight:bold;">${esc(reqCode)}</td>
                            <td style="padding:8px; border-bottom:1px solid #f1f5f9; color:#64748b;">${esc(info.name)}</td>
                            <td style="padding:8px; border-bottom:1px solid #f1f5f9; color:#64748b; font-weight:bold;">${info.credits} Cr</td>
                            <td style="padding:8px; border-bottom:1px solid #f1f5f9; color:#f59e0b; text-align:center;">⏳ Pending</td>
                        </tr>`;
                    }
                });

                subHTML += `
                <div style="margin-top:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
                    <h5 style="margin:0 0 10px 0; color:#334155; display:flex; justify-content:space-between; font-size:1.05rem;">
                        <span>📄 ${esc(sub.name)}</span>
                        <span>Earned: <span style="color:#3b82f6;">${subEarned}</span> / ${subReq} Cr</span>
                    </h5>
                    <table style="width:100%; text-align:left; border-collapse:collapse; font-size:0.9rem;">
                        <thead>
                            <tr style="background:#f1f5f9; color:#475569;">
                                <th style="padding:8px;">Code</th>
                                <th style="padding:8px;">Course Title</th>
                                <th style="padding:8px;">Credits</th>
                                <th style="padding:8px; text-align:center;">Status</th>
                            </tr>
                        </thead>
                        <tbody>${coursesHTML}</tbody>
                    </table>
                </div>`;
            });

            let statusColor = "#f59e0b";
            let statusIcon = "⏳";
            if (basketEarned >= basketReq) { statusColor = "#10b981"; statusIcon = "✅"; }
            else if (basketEarned === 0) { statusColor = "#ef4444"; statusIcon = "❌"; }

            auditHTML += `
            <div style="border:1px solid ${statusColor}; border-radius:8px; margin-bottom:12px; background:white; overflow:hidden; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                <div onclick="const c = this.nextElementSibling; c.style.display = c.style.display === 'none' ? 'block' : 'none';" style="background:${statusColor}10; padding:15px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="margin:0; color:${statusColor}; display:flex; align-items:center; gap:10px;">
                        <span style="font-size:1.3rem;">${statusIcon}</span> ${esc(mainBasket.category)}
                    </h4>
                    <div style="font-weight:bold; color:${statusColor}; font-size:1.05rem;">
                        Earned: ${basketEarned} / ${basketReq} Cr <span style="margin-left:10px; font-size:0.8rem;">▼</span>
                    </div>
                </div>
                <div style="display:none; padding:15px; border-top:1px solid ${statusColor}40;">${subHTML}</div>
            </div>`;
        });

        auditHTML += `</div>`;
        return auditHTML;
    };

    document.addEventListener('DOMContentLoaded', () => {
        window.initializeCloudPortal();
        document.querySelectorAll('button').forEach(b => {
            let txt = b.textContent.trim().toUpperCase();
            if (txt === 'LOAD CURRICULUM') {
                b.onclick = function(e) {
                    e.preventDefault();
                    window.triggerLoadCurriculum();
                };
            }
        });
    });
    ```

## 3. Create `VERSION10.0.md`
* Create a file named `VERSION10.0.md` in your project root containing the release notes for Ver 10.0.

```