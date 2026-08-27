/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 10.0 - 100% Cloud-Synced Curriculum & Degree Audit)
 */

'use strict';

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";
const GAS_URL = scriptURL;

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

// ═══════════════════════════════════════════════════════════════════════
//  1. COURSE INFO HELPER (Resolves Name & Credits)
// ═══════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════
//  2. CLOUD SYNC & BOOTLOADER
// ═══════════════════════════════════════════════════════════════════════
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

    // Load from localStorage as secondary cache
    try {
        let localCur = localStorage.getItem('AIIT_CUSTOM_CURRICULUM');
        if (localCur) {
            let parsed = JSON.parse(localCur);
            if (parsed && Object.keys(parsed).length > 0) {
                window.CURRICULUM_RULES = parsed;
            }
        }
        let localCourses = localStorage.getItem('AIIT_CUSTOM_COURSES');
        if (localCourses) {
            let parsedCourses = JSON.parse(localCourses);
            if (parsedCourses && Object.keys(parsedCourses).length > 0) {
                window.CUSTOM_COURSE_DICT = Object.assign({}, window.CUSTOM_COURSE_DICT, parsedCourses);
            }
        }
    } catch (e) {
        console.warn("Error loading from localStorage:", e);
    }

    if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
    if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
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

    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
            action: 'saveCurriculum',
            curriculumData: JSON.stringify(masterPayload)
        })
    })
    .then(res => res.text())
    .then(txt => console.log("☁️ Curriculum auto-saved to Google Sheets:", txt))
    .catch(err => console.error("☁️ Cloud save error:", err));
};

// ═══════════════════════════════════════════════════════════════════════
//  3. BULK EXCEL CURRICULUM PARSER & UPLOADER
// ═══════════════════════════════════════════════════════════════════════
window.handleBulkCurriculumUpload = function (event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        const keyDropdown = document.getElementById('curriculum-edit-key') || document.querySelector('select[id*="curr"]');
        if (!keyDropdown || !keyDropdown.value) {
            alert("❌ ERROR: Please select Batch & Program from dropdown first!");
            event.target.value = '';
            return;
        }
        let targetKey = keyDropdown.value;
        window.currentEditingKey = targetKey;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet);

                if (!rows || rows.length === 0) {
                    alert("❌ Excel file is empty or formatted incorrectly.");
                    event.target.value = '';
                    return;
                }

                let mainMap = {};
                if (!window.CUSTOM_COURSE_DICT) window.CUSTOM_COURSE_DICT = {};

                rows.forEach(row => {
                    const cleanRow = {};
                    for (let key in row) {
                        cleanRow[key.toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase()] = row[key];
                    }

                    const mainCat = cleanRow['maincategory'] || cleanRow['category'];
                    if (!mainCat) return;

                    const safeNum = (val, def) => {
                        if (val === undefined || val === null || String(val).trim() === '') return def;
                        return isNaN(parseFloat(val)) ? def : parseFloat(val);
                    };

                    const mainCreds = safeNum(cleanRow['maincredits'] || cleanRow['mincredits'], 0);
                    const subCat = (cleanRow['subcategory'] && String(cleanRow['subcategory']).trim() !== "" && String(cleanRow['subcategory']).toLowerCase() !== 'nan') ? String(cleanRow['subcategory']).trim() : "General Courses";
                    let subCreds = safeNum(cleanRow['subcredits'], null);
                    if (subCreds === null || subCreds === 0) subCreds = (subCat === "General Courses") ? mainCreds : 0;

                    const code = String(cleanRow['coursecode'] || cleanRow['code'] || "").trim().toUpperCase();
                    const courseName = String(cleanRow['coursename'] || cleanRow['name'] || "").trim();
                    const courseCreds = safeNum(cleanRow['credits'] || cleanRow['credit'] || cleanRow['coursecredits'], 3);

                    if (code && code !== "UNDEFINED" && code !== "NAN") {
                        window.CUSTOM_COURSE_DICT[code] = {
                            name: (courseName && courseName !== "Course Title") ? courseName : code,
                            credits: courseCreds
                        };
                    }

                    if (!mainMap[mainCat]) {
                        mainMap[mainCat] = { category: mainCat, minCredits: mainCreds, subCategories: {} };
                    }
                    if (!mainMap[mainCat].subCategories[subCat]) {
                        mainMap[mainCat].subCategories[subCat] = { name: subCat, minCredits: subCreds, codes: [] };
                    }
                    if (code && code !== "UNDEFINED" && code !== "NAN") {
                        if (!mainMap[mainCat].subCategories[subCat].codes.includes(code)) {
                            mainMap[mainCat].subCategories[subCat].codes.push(code);
                        }
                    }
                });

                let newRules = Object.values(mainMap).map(main => ({
                    category: main.category,
                    minCredits: main.minCredits,
                    subCategories: Object.values(main.subCategories)
                }));

                if (!window.CURRICULUM_RULES) window.CURRICULUM_RULES = {};
                window.CURRICULUM_RULES[targetKey] = newRules;

                window.saveCurriculumToCloud();

                if (typeof window.loadCurriculumEditor === 'function') {
                    window.loadCurriculumEditor();
                }

                alert(`✅ SUCCESS! Bulk Curriculum uploaded for ${targetKey}. ${newRules.length} Main Categories and all courses registered successfully.`);
                event.target.value = '';
            } catch (err) {
                alert("❌ Excel Parse Error: " + err.message);
                event.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    } catch (err) {
        alert("❌ CRITICAL ERROR: " + err.message);
        event.target.value = '';
    }
};

window.resetCurriculumEditor = function() {
    if (confirm("⚠️ Are you sure you want to completely clear and reset the curriculum to defaults?")) {
        const keyDropdown = document.getElementById('curriculum-edit-key') || document.querySelector('select[id*="curr"]');
        let selectedKey = keyDropdown ? keyDropdown.value : "2024_MCA";

        if (window.CURRICULUM_RULES && window.CURRICULUM_RULES[selectedKey]) {
            delete window.CURRICULUM_RULES[selectedKey];
        }

        window.saveCurriculumToCloud();

        if (typeof window.loadCurriculumEditor === 'function') {
            window.loadCurriculumEditor();
        }

        alert(`✅ Curriculum for ${selectedKey} has been completely reset.`);
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  4. SYSTEM PROGRAMS RENDERER (Batches & Programs)
// ═══════════════════════════════════════════════════════════════════════
window.renderSystemPrograms = function() {
    let sysProgs = window.SYSTEM_PROGRAMS.length > 0 ? window.SYSTEM_PROGRAMS : [
        { batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }, { batch: "2024", program: "B.C.A" }, { batch: "2025", program: "B.C.A" }
    ];

    const container = document.getElementById('active-system-programs');
    if (container) {
        container.innerHTML = sysProgs.map((p, i) => `
            <span style="background: #334155; padding: 6px 12px; border-radius: 6px; color: white; font-weight:bold; display:inline-block; margin:4px;">
                ${esc(p.batch)} ${esc(p.program)} 
                <button onclick="window.removeSystemProgram(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer; margin-left:8px; font-weight:bold;">✖</button>
            </span>
        `).join('');
    }

    const dropdown = document.getElementById('curriculum-edit-key') || document.querySelector('select[id*="curr"]');
    if (dropdown) {
        const currentVal = dropdown.value;
        dropdown.innerHTML = sysProgs.map(p => {
            let key = `${p.batch}_${p.program}`;
            return `<option value="${key}">${p.batch} ${p.program}</option>`;
        }).join('');
        if (currentVal) dropdown.value = currentVal;
    }
};

window.addSystemProgram = function() {
    const b = document.getElementById('new-batch-input')?.value.trim();
    const p = document.getElementById('new-program-input')?.value.trim();
    if (!b || !p) { alert("Please enter both Batch and Program."); return; }

    if (!window.SYSTEM_PROGRAMS.some(x => x.batch === b && x.program === p)) {
        window.SYSTEM_PROGRAMS.push({ batch: b, program: p });
        localStorage.setItem('AIIT_SYSTEM_PROGRAMS', JSON.stringify(window.SYSTEM_PROGRAMS));
        window.renderSystemPrograms();
        alert(`✅ Added ${b} ${p} to system!`);
    }
};

window.removeSystemProgram = function(index) {
    if (confirm("Remove this batch and program?")) {
        window.SYSTEM_PROGRAMS.splice(index, 1);
        localStorage.setItem('AIIT_SYSTEM_PROGRAMS', JSON.stringify(window.SYSTEM_PROGRAMS));
        window.renderSystemPrograms();
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  5. ADMIN CURRICULUM TABLE EDITOR (Code, Name, Credits, Edit, Remove)
// ═══════════════════════════════════════════════════════════════════════
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

        window.CURRICULUM_RULES[key] = rules;
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

        window.CURRICULUM_RULES[key] = rules;
        window.saveCurriculumToCloud();
        window.triggerLoadCurriculum();
    };

    window.adminRemoveCourse = function(key, mIdx, sIdx, cIdx) {
        if (confirm("Remove this course code?")) {
            let rules = window.CURRICULUM_RULES[key];
            rules[mIdx].subCategories[sIdx].codes.splice(cIdx, 1);
            window.CURRICULUM_RULES[key] = rules;
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
};

// ═══════════════════════════════════════════════════════════════════════
//  6. STUDENT PORTAL DEGREE AUDIT ENGINE (Cross-Verifies Baskets)
// ═══════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════
//  7. ADMIN STUDENT DIRECTORY (Enrolled Students Count Fix)
// ═══════════════════════════════════════════════════════════════════════
window.applyAdminFilters = async function() {
    var tbody = document.getElementById('admin-tbody');
    var totalStu = document.getElementById('total-stu');
    if (!tbody) return;

    if (window.STUDENTS.length === 0) {
        await window.initializeCloudPortal();
    }

    if (totalStu) totalStu.textContent = window.STUDENTS.length;

    if (window.STUDENTS.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">No student records found in Cloud DB.</td></tr>`;
        return;
    }

    tbody.innerHTML = window.STUDENTS.map((s, i) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:10px;">${i + 1}</td>
            <td style="font-weight:bold;">${esc(s.sen)}</td>
            <td>${esc(s.name)}</td>
            <td>${esc(s.program || 'N/A')}</td>
            <td style="font-weight:bold; color:#3b82f6;">${s.cgpa || 'N/A'}</td>
            <td>${s.totalCredits || '0'}</td>
            <td><button style="background:#0ea5e9; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;" onclick="window.openAdminStudentView('${esc(s.sen)}')">Details</button></td>
        </tr>
    `).join('');
};

// ═══════════════════════════════════════════════════════════════════════
//  8. PAGE NAVIGATION & LOGIN HANDLERS
// ═══════════════════════════════════════════════════════════════════════
window.showPage = function (id) {
  document.querySelectorAll('.page, .admin-section, .admin-tab-content, .login-container').forEach(function (p) { 
      if (p) p.style.display = 'none';
  });
  var target = document.getElementById(id);
  if (target) {
      target.style.display = 'block';
  }
  window.scrollTo(0, 0);
};

window.showFacultyLogin = function() {
    let sContainer = document.getElementById('student-login-container') || document.querySelector('.landing-container') || document.getElementById('landing');
    let fContainer = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
    if (sContainer) sContainer.style.display = 'none';
    if (fContainer) {
        fContainer.style.display = 'block';
    } else {
        alert("Faculty login portal view loading...");
    }
};

window.showStudentLoginUI = function() {
    let sContainer = document.getElementById('student-login-container') || document.querySelector('.landing-container') || document.getElementById('landing');
    let fContainer = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
    if (fContainer) fContainer.style.display = 'none';
    if (sContainer) sContainer.style.display = 'block';
};

window.studentLoginStep = async function () {
    var rawSen = document.getElementById('s-sen')?.value || document.getElementById('student-sen')?.value || document.querySelector('input[placeholder*="SEN"]')?.value;
    var sen = String(rawSen || '').toUpperCase().trim();
    var passInput = document.getElementById('s-pass')?.value || document.getElementById('student-pass')?.value || document.querySelector('input[type="password"]')?.value || '';

    if (!sen || !passInput) {
        alert("Please enter both SEN and password.");
        return;
    }

    try {
        var response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'login', sen: sen, password: passInput.trim() })
        });
        var result = await response.json();

        if (result && result.status === 'success' && result.student) {
            window.loadStudentDashboard(result.student);
        } else if (result && (result.status === 'first_time' || (result.message && result.message.toLowerCase().includes('first')))) {
            let newPass = prompt("🔐 First-time login. Enter new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            let setRes = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'setpassword', sen: sen, newPassword: newPass })
            });
            let setJson = await setRes.json();

            if (setJson.status === 'success') {
                alert("✅ Password created successfully! Logging in...");
                window.loadStudentDashboardAfterCloudAuth(sen);
            } else {
                alert(`❌ Error: ${setJson.message}`);
            }
        } else {
            alert("⚠ " + (result.message || 'Incorrect password.'));
        }
    } catch (err) {
        alert("✗ Cloud connection error. Check your network.");
    }
};

window.facultyLoginStep = async function () {
    var emailInput = document.getElementById('f-email') || document.querySelector('input[type="email"]');
    var passInput = document.getElementById('f-pass') || document.querySelector('input[type="password"]');
    var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    var pass = passInput ? passInput.value : "";

    if (!email || !pass) {
        alert("Please enter both email and password.");
        return;
    }

    const authorizedFaculty = [
        "chandrashekharbn@blr.amity.edu", "gopalr@blr.amity.edu", "krishnachalithakc@blr.amity.edu",
        "mbhan@blr.amity.edu", "mkirmani@blr.amity.edu", "pramamurthy@blr.amity.edu",
        "pchakraborty@blr.amity.edu", "skumar2@blr.amity.edu", "vramamoorthy@blr.amity.edu",
        "geethav@blr.amity.edu", "nkumar@blr.amity.edu", "ntressa@blr.amity.edu", "sspattu@blr.amity.edu"
    ];

    if (authorizedFaculty.includes(email) || email === 'faculty@123') {
        alert("✅ Faculty Verified Successfully! Loading Portal...");
        window.currentFacultyEmail = email;
        let fLogin = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
        let fDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section');
        if (fLogin) fLogin.style.display = 'none';
        if (fDash) {
            fDash.style.display = 'block';
            if (typeof window.renderFacultyPortal === 'function') window.renderFacultyPortal(email);
        } else {
            location.reload();
        }
    } else {
        alert("❌ Invalid Faculty Credentials or Email not authorized.");
    }
};

window.adminLogin = async function() {
    const passInput = document.querySelector('input[type="password"]') || document.querySelectorAll('input')[1];
    const password = passInput ? passInput.value.trim() : "";

    if (!scriptURL || scriptURL.includes("YOUR_WEB_APP_URL_HERE")) {
        alert("⚠ ERROR: scriptURL is missing.");
        return;
    }

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'verifyadmin', password: password })
        });
        const data = await response.json();

        if (data.status === 'success') {
            window.currentAdminPassword = password;
            sessionStorage.setItem('coe_admin_auth', password);
            window.showPage('admin-dash');
        } else {
            alert(`⚠ ${data.message || 'Incorrect Admin Password'}`);
        }
    } catch (err) {
        alert(`⚠ Network Error: Check your connection.`);
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  9. FACULTY PORTAL & STUDENT DASHBOARD RENDERING
// ═══════════════════════════════════════════════════════════════════════
window.renderFacultyPortal = async function(email) {
    let facultyDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section');
    if (!facultyDash) return;

    facultyDash.style.position = 'relative';
    facultyDash.style.top = '0';
    facultyDash.style.left = '0';
    facultyDash.style.width = '100%';
    facultyDash.style.height = 'auto';
    facultyDash.style.minHeight = '100vh';
    facultyDash.style.background = '#f8fafc';
    document.body.style.overflow = 'auto';

    if (window.STUDENTS.length === 0) {
        await window.initializeCloudPortal();
    }
    window.facultyFilterAndSort();
};

window.facultyFilterAndSort = function() {
    let students = window.STUDENTS || [];
    const searchInput = document.getElementById('faculty-search-input') || document.querySelector('input[placeholder*="Search"]');
    const searchTxt = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    const batchSel = document.getElementById('filter-batch') ? document.getElementById('filter-batch').value.trim() : "";
    const progSel = document.getElementById('filter-program') ? document.getElementById('filter-program').value.trim() : "";

    let filtered = students.filter(s => {
        const matchSearch = !searchTxt || String(s.sen || '').toLowerCase().includes(searchTxt) || String(s.name || '').toLowerCase().includes(searchTxt);
        const matchBatch = !batchSel || String(s.batch || '').trim() === batchSel;
        const matchProg = !progSel || String(s.program || '').trim() === progSel;
        return matchSearch && matchBatch && matchProg;
    });

    window.RENDERED_STUDENTS = filtered;
    renderStudentTable(filtered);
};

window.facultyViewAll = async function() {
    if (window.STUDENTS.length === 0) await window.initializeCloudPortal();
    window.RENDERED_STUDENTS = window.STUDENTS;
    renderStudentTable(window.STUDENTS);
};

function renderStudentTable(students) {
    var tbody = document.getElementById('faculty-dir-tbody') || document.querySelector('#faculty-dash tbody') || document.querySelector('table tbody');
    var badge = document.querySelector('#faculty-dash .badge') || document.getElementById('faculty-dir-badge');
    
    if (badge) badge.textContent = `${students.length} students`;
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#64748b;">No matching student records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = students.map(s => {
        let activeBacklogs = window.getActiveBacklogs ? window.getActiveBacklogs(s.courses).length : 0;
        return `
        <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:12px; font-weight:bold;">${esc(s.sen)}</td>
            <td style="padding:12px;">${esc(s.name)}</td>
            <td style="padding:12px; font-weight:bold; color:#3b82f6;">${s.cgpa || 'N/A'}</td>
            <td style="padding:12px; font-weight:bold;">${s.totalCredits || '0'}</td>
            <td style="padding:12px;"><span style="padding:4px 8px; border-radius:4px; font-weight:bold; background:${activeBacklogs > 0 ? '#fee2e2' : '#dcfce3'}; color:${activeBacklogs > 0 ? '#dc2626' : '#16a34a'};">${activeBacklogs}</span></td>
            <td style="padding:12px;"><button style="background:#0ea5e9; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;" onclick="openFacultyStudentView('${esc(s.sen)}')">Details</button></td>
        </tr>`;
    }).join('');
}

window.getActiveBacklogs = function(courses) {
    let history = {};
    (courses || []).forEach(c => {
        if (!c.code || c.code === 'NAN') return;
        let code = String(c.code).toUpperCase().trim();
        if (!history[code]) history[code] = { passed: false, latest: c };
        let isFail = ['F', 'AB', 'DE', 'I', 'U'].includes(String(c.grade).toUpperCase().trim());
        if (!isFail) history[code].passed = true;
        else if (!history[code].passed) history[code].latest = c;
    });
    let backlogs = [];
    for (let code in history) {
        if (!history[code].passed) backlogs.push(history[code].latest);
    }
    return backlogs;
};

window.loadStudentDashboard = function(student) {
    window.currentStudent = student;
    document.querySelectorAll('.page, .login-container, #student-login-container, .landing-container').forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    const dash = document.getElementById('student-dash') || document.getElementById('student-dashboard');
    if (dash) {
        dash.style.display = 'block';
        dash.classList.add('dashboard-fullscreen-overlay');
    }

    let name = student.name || 'Student';
    let sen = student.sen || '';
    let cgpa = student.cgpa || 'N/A';
    let credits = student.totalCredits || '0';
    let validCourses = (student.courses || []).filter(c => c && c.code && c.code !== 'NAN');
    let activeBacklogs = window.getActiveBacklogs(validCourses);

    document.querySelectorAll('#dash-name, .student-name').forEach(el => el.textContent = `${name} (${sen})`);
    document.querySelectorAll('#dash-cgpa, .cgpa-val').forEach(el => el.textContent = cgpa);
    document.querySelectorAll('#dash-ce, .credits-val').forEach(el => el.textContent = credits);

    let tableContainer = document.getElementById('courses-tbody') || document.querySelector('table tbody');
    if (tableContainer) tableContainer = tableContainer.closest('table').parentElement;

    if (tableContainer && !document.getElementById('student-tab-nav')) {
        let tabNav = document.createElement('div');
        tabNav.id = 'student-tab-nav';
        tabNav.style.cssText = 'display:flex; gap:10px; margin:20px 0 15px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px;';
        tableContainer.parentNode.insertBefore(tabNav, tableContainer);

        let backlogsDiv = document.createElement('div');
        backlogsDiv.id = 'student-tab-backlogs';
        backlogsDiv.style.display = 'none';
        backlogsDiv.innerHTML = `<table style="width:100%; text-align:left; border-collapse:collapse; background:white; border:1px solid #e2e8f0;"><thead style="background:#f8fafc; border-bottom:2px solid #e2e8f0;"><tr><th style="padding:12px 10px;">Code</th><th style="padding:12px 10px;">Course Title</th><th style="padding:12px 10px;">Type</th><th style="padding:12px 10px;">Cr.</th><th style="padding:12px 10px;">Marks</th><th style="padding:12px 10px;">Grade</th></tr></thead><tbody id="student-backlogs-tbody"></tbody></table>`;
        tableContainer.parentNode.insertBefore(backlogsDiv, tableContainer.nextSibling);

        let auditDiv = document.createElement('div');
        auditDiv.id = 'student-tab-audit';
        auditDiv.style.display = 'none';
        tableContainer.parentNode.insertBefore(auditDiv, backlogsDiv.nextSibling);

        tableContainer.id = 'student-tab-all';
    }

    window.switchStudentTab = function(tabName) {
        document.getElementById('student-tab-all').style.display = (tabName === 'all') ? 'block' : 'none';
        document.getElementById('student-tab-backlogs').style.display = (tabName === 'backlogs') ? 'block' : 'none';
        document.getElementById('student-tab-audit').style.display = (tabName === 'audit') ? 'block' : 'none';

        document.getElementById('btn-stu-all').style.background = (tabName === 'all') ? '#3b82f6' : '#f1f5f9';
        document.getElementById('btn-stu-all').style.color = (tabName === 'all') ? 'white' : '#475569';
        
        document.getElementById('btn-stu-backlogs').style.background = (tabName === 'backlogs') ? '#ef4444' : '#f1f5f9';
        document.getElementById('btn-stu-backlogs').style.color = (tabName === 'backlogs') ? 'white' : '#475569';

        document.getElementById('btn-stu-audit').style.background = (tabName === 'audit') ? '#10b981' : '#f1f5f9';
        document.getElementById('btn-stu-audit').style.color = (tabName === 'audit') ? 'white' : '#475569';
    };

    const tabNav = document.getElementById('student-tab-nav');
    if (tabNav) {
        tabNav.innerHTML = `
            <button onclick="window.switchStudentTab('all')" id="btn-stu-all" style="padding:8px 16px; border:none; background:#3b82f6; color:white; border-radius:6px; font-weight:bold; cursor:pointer;">📚 All Courses</button>
            <button onclick="window.switchStudentTab('backlogs')" id="btn-stu-backlogs" style="padding:8px 16px; border:none; background:#f1f5f9; color:#475569; border-radius:6px; font-weight:bold; cursor:pointer;">⚠️ Active Backlogs (${activeBacklogs.length})</button>
            <button onclick="window.switchStudentTab('audit')" id="btn-stu-audit" style="padding:8px 16px; border:none; background:#f1f5f9; color:#475569; border-radius:6px; font-weight:bold; cursor:pointer;">🎓 Degree Audit Check</button>
            <button onclick="window.exportStudentPDF()" style="margin-left:auto; padding:8px 16px; border:none; background:#dc2626; color:white; border-radius:6px; font-weight:bold; cursor:pointer;">📄 Export PDF</button>
        `;
    }

    let coursesTbody = document.getElementById('courses-tbody');
    if (coursesTbody) {
        coursesTbody.innerHTML = validCourses.map(c => `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px; font-weight:bold;">${esc(c.code)}</td>
                <td style="padding:10px;">${esc(c.name)}</td>
                <td style="padding:10px;">${esc(c.type || 'Core')}</td>
                <td style="padding:10px;">${esc(c.credits)}</td>
                <td style="padding:10px;">${esc(c.marks)}</td>
                <td style="padding:10px; font-weight:bold; color:#2563eb;">${esc(c.grade)}</td>
            </tr>
        `).join('');
    }

    let backlogsTbody = document.getElementById('student-backlogs-tbody');
    if (backlogsTbody) {
        backlogsTbody.innerHTML = activeBacklogs.length > 0 ? activeBacklogs.map(c => `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px; font-weight:bold;">${esc(c.code)}</td>
                <td style="padding:10px;">${esc(c.name)}</td>
                <td style="padding:10px;">${esc(c.type || 'Core')}</td>
                <td style="padding:10px;">${esc(c.credits)}</td>
                <td style="padding:10px;">${esc(c.marks)}</td>
                <td style="padding:10px; font-weight:bold; color:#dc2626;">${esc(c.grade)}</td>
            </tr>
        `).join('') : `<tr><td colspan="6" style="text-align:center; padding:20px; color:#16a34a; font-weight:bold;">🎉 Excellent! You have no active backlogs.</td></tr>`;
    }

    let auditContainer = document.getElementById('student-tab-audit');
    if (auditContainer && typeof window.evaluateDegree === 'function') {
        auditContainer.innerHTML = window.evaluateDegree(student);
    }

    document.querySelectorAll('button, a').forEach(el => {
        let txt = el.textContent.trim().toLowerCase();
        if (txt.includes('logout') || txt.includes('search another')) {
            el.textContent = 'LOGOUT';
            el.onclick = function() { window.logoutPortal(); };
        }
    });
};

// ═══════════════════════════════════════════════════════════════════════
//  10. ADMIN NAVIGATION & UTILITIES
// ═══════════════════════════════════════════════════════════════════════
window.switchAdminTab = function(tabId, btnElement) {
    ['tab-upload', 'tab-curriculum', 'tab-students', 'tab-faculty'].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    document.querySelectorAll('.admin-section, .admin-tab-content').forEach(sec => {
        if (sec) sec.style.display = 'none';
    });

    let target = document.getElementById(tabId);
    if (target) target.style.display = 'block';

    document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.classList.remove('active');
    });

    if (btnElement) {
        btnElement.classList.add('active');
    }

    if (tabId === 'tab-students' && typeof window.applyAdminFilters === 'function') {
        window.applyAdminFilters();
    } else if (tabId === 'tab-curriculum' && typeof window.loadCurriculumEditor === 'function') {
        window.loadCurriculumEditor();
    }
};

window.exportStudentPDF = function() {
    if (!window.jspdf || !window.jspdf.jsPDF) { alert("PDF library loading..."); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Amity University - Student Grade Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Student: ${window.currentStudent?.name || 'N/A'} (${window.currentStudent?.sen || 'N/A'})`, 14, 28);
    doc.text(`CGPA: ${window.currentStudent?.cgpa || 'N/A'} | Credits Earned: ${window.currentStudent?.totalCredits || '0'}`, 14, 34);

    let bodyData = (window.currentStudent?.courses || []).map(c => [c.code, c.name, c.type, c.credits, c.marks, c.grade]);
    doc.autoTable({
        startY: 40,
        head: [['Code', 'Course Title', 'Type', 'Cr.', 'Marks', 'Grade']],
        body: bodyData,
        theme: 'grid'
    });
    doc.save(`${window.currentStudent?.sen || 'Student'}_Report.pdf`);
};

window.logoutPortal = function() {
    sessionStorage.clear();
    localStorage.clear();
    document.body.classList.remove('overlay-active');
    window.location.href = window.location.pathname;
};

// ═══════════════════════════════════════════════════════════════════════
//  11. DOM LOAD INITIALIZATION & EXPLICIT BUTTON WIRING
// ═══════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    window.initializeCloudPortal();

    // Wire Bulk Upload File Input if not already present in DOM
    let fileInput = document.getElementById('bulk-curriculum-file-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'bulk-curriculum-file-input';
        fileInput.accept = '.xlsx, .xls, .csv';
        fileInput.style.display = 'none';
        fileInput.onchange = window.handleBulkCurriculumUpload;
        document.body.appendChild(fileInput);
    }

    document.querySelectorAll('button').forEach(b => {
        let txt = b.textContent.trim().toUpperCase();
        if (txt.includes('BULK UPLOAD EXCEL CURRICULUM') || txt.includes('BULK UPLOAD')) {
            b.onclick = function(e) {
                e.preventDefault();
                fileInput.click();
            };
        } else if (txt.includes('RESET TO DEFAULT')) {
            b.onclick = function(e) {
                e.preventDefault();
                window.resetCurriculumEditor();
            };
        }
    });
});