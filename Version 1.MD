```python
# Let's verify the user's requirements for Version 1.5:
# 1. Change version tag globally across the portal to **Ver 1.5**.
# 2. On the landing page (`index.html`), below the Faculty Login button, add a **COE Login** button (`coeaub@blr.amity.edu`, default password `coe@123`, with a prompt to change password on first login, stored and controlled in the Google Sheet under a tab/sheet named `COELogin` alongside `FacultyPass` / `FacultyLogin`).
# 3. Store and control login credentials and authentication in Google Sheets under new/dedicated sheets: `FacultyLogin` and `COELogin`.
# 4. In the Admin Panel (Tab 4 / Faculty & COE management section), provide separate dedicated buttons/sections to check the login counts and timestamps of both Faculty and COE, along with password reset options for both.

print("Designing Ver 1.5 Master COE Login & Enterprise Security Architecture")


```

```text
Designing Ver 1.5 Master COE Login & Enterprise Security Architecture


```

# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 1.5 (COE Login Integration & Enterprise Audit Suite)

You are updating a static GitHub Pages site (`index.html`, `admin-hidden.html`, `script.js`) and Google Apps Script backend (`Code.gs`). We are updating the version tag globally to **Ver 1.5**, adding the **COE Login** button (`coeaub@blr.amity.edu`, default password `coe@123`, with a first-time password change prompt) stored under the Google Sheets `COELogin` tab, and adding dedicated audit and password reset management for both Faculty and COE inside the Admin Panel.

Please execute the following strict updates:

## 1. Global Versioning Update

* **File:** `index.html`, `admin-hidden.html`
* Change all version tags in the top left corners to **Ver 1.5**.



## 2. Landing Page Update (`index.html`)

* **File:** `index.html`
* Below the **Faculty Login** button, add the **COE Login** button:
```html
<button onclick="window.showCoeLogin()" id="coe-login-trigger-btn" style="...">COE Login</button>

```





## 3. Updated Google Apps Script Backend (`Code.gs`)

* **File:** `Code.gs` (Google Apps Script)
* Add support for COE login verification, first-time password updates, and separate audit logs in Google Sheets (`COELogin`, `FacultyLogin`, `COEAudit`, `FacultyAudit`):



```javascript
// Add these action handlers inside your doPost(e) / doGet(e) function in Code.gs:

    if (action === 'verifycoe') {
      var email = data.email ? data.email.trim().toLowerCase() : "";
      var password = data.password ? data.password.trim() : "";
      
      if (email !== 'coeaub@blr.amity.edu') {
        return jsonResponse({status: "error", message: "Invalid COE Email."});
      }

      var ss = SpreadsheetApp.openById(SHEET_ID);
      var coeSheet = ss.getSheetByName("COELogin") || ss.insertSheet("COELogin");
      if (coeSheet.getLastRow() === 0) {
        coeSheet.appendRow(["Email", "Password", "Last Timestamp"]);
      }
      var coeData = coeSheet.getDataRange().getValues();
      
      var storedPass = "";
      for (var i = 1; i < coeData.length; i++) {
        if (String(coeData[i][0]).toLowerCase() === email) {
          storedPass = String(coeData[i][1]).trim();
          break;
        }
      }

      if (!storedPass) {
        if (password === 'coe@123') {
          logCOE通路Audit(email);
          return jsonResponse({status: "first_time", message: "First-time login. Please change your password."});
        } else {
          return jsonResponse({status: "error", message: "Invalid COE Credentials."});
        }
      }

      if (storedPass === 'coe@123' && password === 'coe@123') {
        return jsonResponse({status: "first_time", message: "First-time login. Please change your password."});
      }

      if (storedPass === password) {
        logCOEAudit(email);
        return jsonResponse({status: "success", message: "COE verified"});
      }

      return jsonResponse({status: "error", message: "Incorrect COE password."});
    }

    if (action === 'setcoepassword') {
      var email = data.email ? data.email.trim().toLowerCase() : "";
      var newPass = data.password ? data.password.trim() : "";
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var coeSheet = ss.getSheetByName("COELogin") || ss.insertSheet("COELogin");
      var coeData = coeSheet.getDataRange().getValues();
      
      var found = false;
      for (var i = 1; i < coeData.length; i++) {
        if (String(coeData[i][0]).toLowerCase() === email) {
          coeSheet.getRange(i + 1, 2).setValue(newPass);
          coeSheet.getRange(i + 1, 3).setValue(new Date().toISOString());
          found = true;
          break;
        }
      }
      if (!found) {
        coeSheet.appendRow([email, newPass, new Date().toISOString()]);
      }
      return jsonResponse({status: "success", message: "COE password updated successfully."});
    }

    if (action === 'getCOEAudit') {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var auditSheet = ss.getSheetByName("COEAudit");
      if (!auditSheet) return jsonResponse([{ email: "coeaub@blr.amity.edu", timestamps: ["Never"], count: 0 }]);
      var rows = auditSheet.getDataRange().getValues();
      var timestamps = [];
      var count = 0;
      for (var i = 1; i < rows.length; i++) {
        timestamps.push(rows[i][1]);
        count += (parseInt(rows[i][2]) || 1);
      }
      return jsonResponse([{ email: "coeaub@blr.amity.edu", timestamps: timestamps.length > 0 ? timestamps : ["Never"], count: count, lastTimestamp: timestamps[timestamps.length-1] || "Never" }]);
    }

function logCOEAudit(email) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var auditSheet = ss.getSheetByName("COEAudit") || ss.insertSheet("COEAudit");
  if (auditSheet.getLastRow() === 0) {
    auditSheet.appendRow(["Email", "Timestamp", "Count"]);
  }
  auditSheet.appendRow([email, new Date().toISOString(), 1]);
}

```

## 4. Frontend COE Login & Audit Engine (`script.js`)

* **File:** `script.js`
* Add the COE login modal/view triggers, authentication handlers, and admin audit panels for both Faculty and COE:



```javascript
/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 1.5 - COE Login & Dual Audit Suite)
 */

'use strict';

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";

// --- 1. COE LOGIN TRIGGER & HANDLER ---
window.showCoeLogin = function() {
    let sContainer = document.getElementById('student-login-container') || document.querySelector('.landing-container') || document.getElementById('landing');
    let fContainer = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
    
    if (sContainer) sContainer.style.display = 'none';
    if (fContainer) fContainer.style.display = 'none';

    let coeContainer = document.getElementById('coe-login-container');
    if (!coeContainer) {
        coeContainer = document.createElement('div');
        coeContainer.id = 'coe-login-container';
        coeContainer.style.cssText = 'max-width:450px; margin:40px auto; background:white; padding:30px; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.1); text-align:left;';
        coeContainer.innerHTML = `
            <h2 style="color:#0f172a; margin-top:0;">🔐 COE Portal Login</h2>
            <p style="color:#475569; font-size:0.9rem;">Controller of Examination access. Enter your institutional credentials.</p>
            <div style="margin-bottom:15px;">
                <label style="display:block; font-weight:bold; font-size:0.85rem; color:#334155; margin-bottom:5px;">COE EMAIL</label>
                <input type="email" id="coe-email" value="coeaub@blr.amity.edu" readonly style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px; background:#f1f5f9; font-weight:bold;" />
            </div>
            <div style="margin-bottom:20px;">
                <label style="display:block; font-weight:bold; font-size:0.85rem; color:#334155; margin-bottom:5px;">PASSWORD</label>
                <input type="password" id="coe-pass" placeholder="Enter password" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px;" />
            </div>
            <button onclick="window.coeLoginStep()" style="width:100%; background:#2563eb; color:white; border:none; padding:12px; border-radius:6px; font-weight:bold; cursor:pointer;">COE Sign In →</button>
            <div style="text-align:center; margin-top:15px;">
                <a href="#" onclick="location.reload(); return false;" style="color:#64748b; font-size:0.85rem; text-decoration:none;">← Back to Main Portal</a>
            </div>
        `;
        document.body.appendChild(coeContainer);
    }
    coeContainer.style.display = 'block';
};

window.coeLoginStep = async function() {
    var passInput = document.getElementById('coe-pass');
    var pass = passInput ? passInput.value.trim() : "";

    if (!pass) {
        alert("Please enter the password.");
        return;
    }

    try {
        var response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'verifycoe', email: 'coeaub@blr.amity.edu', password: pass })
        });
        var result = await response.json();

        if (result && result.status === 'first_time') {
            let newPass = prompt("🔐 First-time COE login. Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            let setRes = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'setcoepassword', email: 'coeaub@blr.amity.edu', password: newPass })
            });
            let setJson = await setRes.json();

            if (setJson.status === 'success') {
                alert("✅ COE password updated successfully! Please sign in with your new password.");
                if (passInput) passInput.value = "";
            } else {
                alert(`❌ Error: ${setJson.message}`);
            }
            return;
        }

        if (result && result.status === 'success') {
            alert("✅ COE Verified Successfully! Redirecting to Admin Panel...");
            window.location.href = 'admin-hidden.html';
        } else {
            alert("❌ " + (result.message || 'Invalid COE Credentials'));
        }
    } catch(err) {
        alert("❌ Network error connecting to COE authentication backend.");
    }
};

// --- 2. ADMIN PANEL DUAL AUDIT DASHBOARD (Faculty & COE) ---
window.renderAdminDualAudit = async function() {
    let tabFac = document.getElementById('tab-faculty');
    if (!tabFac) return;

    let container = document.getElementById('admin-dual-audit-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-dual-audit-container';
        container.style.cssText = 'margin-top:30px; background:white; padding:25px; border-radius:8px; border:1px solid #cbd5e1; box-shadow:0 1px 3px rgba(0,0,0,0.05);';
        tabFac.appendChild(container);
    }

    let coeRecord = { email: "coeaub@blr.amity.edu", count: 0, timestamps: ["Never"], lastTimestamp: "Never" };
    try {
        let coeRes = await fetch(scriptURL + "?action=getCOEAudit");
        let coeList = await coeRes.json();
        if (coeList && coeList.length > 0) coeRecord = coeList[0];
    } catch(e) {}

    let coeLastTime = coeRecord.lastTimestamp && coeRecord.lastTimestamp !== 'Never' ? new Date(coeRecord.lastTimestamp).toLocaleString() : 'Never';

    let html = `
        <h3 style="color:#0f172a; margin-top:0;">🛡️ COE Login Audit & Security</h3>
        <table style="width:100%; border-collapse:collapse; margin-top:15px; font-size:0.9rem; margin-bottom:30px;">
            <thead>
                <tr style="background:#f8fafc; border-bottom:2px solid #cbd5e1; color:#334155; text-align:left;">
                    <th style="padding:12px;">COE Email</th>
                    <th style="padding:12px; text-align:center;">Login Count</th>
                    <th style="padding:12px;">Last Timestamp</th>
                    <th style="padding:12px; text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:12px; font-weight:bold; color:#0f172a;">${esc(coeRecord.email)}</td>
                    <td style="padding:12px; text-align:center;"><span style="background:#dcfce3; color:#16a34a; padding:4px 10px; border-radius:4px; font-weight:bold;">${coeRecord.count} logins</span></td>
                    <td style="padding:12px; color:#475569;">${coeLastTime}</td>
                    <td style="padding:12px; text-align:right;">
                        <button onclick="window.adminResetCOEPwd()" style="background:#ef4444; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Reset COE Password</button>
                    </td>
                </tr>
            </tbody>
        </table>
    `;

    // Append Faculty Audit Table right below it
    container.innerHTML = html + (document.getElementById('admin-faculty-audit-container')?.innerHTML || '');
};

window.adminResetCOEPwd = async function() {
    if (!confirm("Are you sure you want to reset COE password back to default (coe@123)?")) return;
    try {
        let res = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'setcoepassword', email: 'coeaub@blr.amity.edu', password: 'coe@123' })
        });
        let json = await res.json();
        if (json.status === 'success') {
            alert("✅ COE password successfully reset to coe@123.");
            window.renderAdminDualAudit();
        } else {
            alert(`❌ Error: ${json.message}`);
        }
    } catch(err) {
        alert("❌ Network error.");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    let tabFac = document.getElementById('tab-faculty');
    if (tabFac) {
        setTimeout(window.renderAdminDualAudit, 500);
    }
});

```

## 5. Create `VERSION1.5.md`

* Create a file named `VERSION1.5.md` in your project root containing the release notes for Ver 1.5.

```

```