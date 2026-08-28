```python
# Let's review the user's specific requirements for Ver 14.0:
# 1. Faculty List & Audit Dashboard in Admin Panel (Tab 4): Display the complete list of authorized faculty members.
# 2. Table columns should show: Faculty Email, Login Count, Last Timestamp, and:
#    - A "Details" button to view the exact dates and timestamps of all logins.
#    - A "Reset Password" button to reset their password back to `faculty@123`.
# 3. Authorized Faculty List from earlier in the chat:
#    - chandrashekharbn@blr.amity.edu
#    - gopalr@blr.amity.edu
#    - krishnachalithakc@blr.amity.edu
#    - mbhan@blr.amity.edu
#    - mkirmani@blr.amity.edu
#    - pramamurthy@blr.amity.edu
#    - pchakraborty@blr.amity.edu
#    - skumar2@blr.amity.edu
#    - vramamoorthy@blr.amity.edu
#    - geethav@blr.amity.edu
#    - nkumar@blr.amity.edu
#    - ntressa@blr.amity.edu
#    - sspattu@blr.amity.edu
# 4. Make sure this renders correctly under Tab 4 in `admin-hidden.html` and is fully driven by `script.js` and `Code.gs`.

print("Designing Ver 14.0 Master Faculty Audit & Detail Log Architecture")


```

```text
Designing Ver 14.0 Master Faculty Audit & Detail Log Architecture


```

# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 14.0 (Faculty List, Audit Details & Reset Suite)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`) and Google Apps Script backend (`Code.gs`). We are adding the complete authorized **Faculty List** into Admin Tab 4 with columns for **Faculty Email, Login Count, Last Timestamp, a Details button (to check all login dates & timestamps), and a Reset Password button** (resetting credentials back to `faculty@123`), updating version tags to **Ver 14.0**, and creating `VERSION14.0.md`.

Please execute the following strict updates:

## 1. Global Versioning Update

* **File:** `index.html`, `admin-hidden.html`
* Change all version tags in the top left corners to `Ver 14.0`.



## 2. Updated Google Apps Script Backend (`Code.gs`)

* **File:** `Code.gs` (Google Apps Script)
* Ensure your backend tracks log history logs and returns the complete authorized faculty list:



```javascript
var AUTHORIZED_FACULTY = [
  "chandrashekharbn@blr.amity.edu", "gopalr@blr.amity.edu", "krishnachalithakc@blr.amity.edu",
  "mbhan@blr.amity.edu", "mkirmani@blr.amity.edu", "pramamurthy@blr.amity.edu",
  "pchakraborty@blr.amity.edu", "skumar2@blr.amity.edu", "vramamoorthy@blr.amity.edu",
  "geethav@blr.amity.edu", "nkumar@blr.amity.edu", "ntressa@blr.amity.edu", "sspattu@blr.amity.edu"
];

// Inside doPost(e) / doGet(e):
    if (action === 'getFacultyAudit') {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var auditSheet = ss.getSheetByName("FacultyAudit") || ss.insertSheet("FacultyAudit");
      
      var auditMap = {};
      if (auditSheet.getLastRow() > 1) {
        var aData = auditSheet.getDataRange().getValues();
        for (var i = 1; i < aData.length; i++) {
          var emailKey = String(aData[i][0]).toLowerCase();
          if (!auditMap[emailKey]) {
            auditMap[emailKey] = { timestamps: [], count: 0 };
          }
          auditMap[emailKey].timestamps.push(aData[i][1]);
          auditMap[emailKey].count += (parseInt(aData[i][2]) || 1);
        }
      }

      var list = [];
      AUTHORIZED_FACULTY.forEach(function(email) {
        var key = email.toLowerCase();
        var record = auditMap[key] || { timestamps: ["Never"], count: 0 };
        list.push({ 
          email: email, 
          timestamps: record.timestamps, 
          count: record.count,
          lastTimestamp: record.timestamps[record.timestamps.length - 1] || "Never"
        });
      });
      return jsonResponse(list);
    }

function logFacultyAudit(email) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var auditSheet = ss.getSheetByName("FacultyAudit") || ss.insertSheet("FacultyAudit");
  if (auditSheet.getLastRow() === 0) {
    auditSheet.appendRow(["Email", "Timestamp", "Count"]);
  }
  auditSheet.appendRow([email, new Date().toISOString(), 1]);
}

```

## 3. Master Faculty Audit & Details Frontend (`script.js`)

* **File:** `script.js`
* Add or replace the admin faculty audit table renderer to include the **Details** button, **Login Count**, and **Reset Password**:



```javascript
/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 14.0 - Faculty List, Details & Audit Suite)
 */

'use strict';

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";

window.renderAdminFacultyAudit = async function() {
    let container = document.getElementById('admin-faculty-audit-container');
    if (!container) {
        let tabFac = document.getElementById('tab-faculty');
        if (tabFac) {
            container = document.createElement('div');
            container.id = 'admin-faculty-audit-container';
            container.style.cssText = 'margin-top:25px; background:white; padding:20px; border-radius:8px; border:1px solid #cbd5e1;';
            tabFac.appendChild(container);
        }
    }
    if (!container) return;

    try {
        let res = await fetch(scriptURL + "?action=getFacultyAudit");
        let auditList = await res.json();

        window.FACULTY_AUDIT_CACHE = auditList;

        let rowsHTML = "";
        (auditList || []).forEach((item, index) => {
            let lastTime = item.lastTimestamp && item.lastTimestamp !== 'Never' ? new Date(item.lastTimestamp).toLocaleString() : 'Never';
            rowsHTML += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px; font-weight:bold; color:#0f172a;">${esc(item.email)}</td>
                <td style="padding:12px; text-align:center;"><span style="background:#dcfce3; color:#16a34a; padding:4px 10px; border-radius:4px; font-weight:bold;">${item.count} logins</span></td>
                <td style="padding:12px; color:#475569;">${lastTime}</td>
                <td style="padding:12px; text-align:right; white-space:nowrap;">
                    <button onclick="window.showFacultyAuditDetails(${index})" style="background:#0ea5e9; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight:bold; margin-right:6px;">Details</button>
                    <button onclick="window.adminResetFacultyPwd('${esc(item.email)}')" style="background:#ef4444; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Reset Password</button>
                </td>
            </tr>`;
        });

        container.innerHTML = `
            <h3 style="color:#0f172a; margin-top:0;">📊 Authorized Faculty Directory & Login Audit</h3>
            <p style="color:#475569; font-size:0.9rem;">Complete list of authorized faculty members with live login counts, date/timestamp logs, and password reset controls.</p>
            <table style="width:100%; border-collapse:collapse; margin-top:15px; font-size:0.9rem;">
                <thead>
                    <tr style="background:#f8fafc; border-bottom:2px solid #cbd5e1; color:#334155; text-align:left;">
                        <th style="padding:12px;">Faculty Email</th>
                        <th style="padding:12px; text-align:center;">Login Count</th>
                        <th style="padding:12px;">Last Timestamp</th>
                        <th style="padding:12px; text-align:right;">Actions</th>
                    </tr>
                </thead>
                <tbody>${rowsHTML || `<tr><td colspan="4" style="text-align:center; padding:20px; color:#64748b;">No faculty records found.</td></tr>`}</tbody>
            </table>
        `;
    } catch(e) {
        console.warn("Faculty audit load error:", e);
    }
};

window.showFacultyAuditDetails = function(index) {
    let faculty = window.FACULTY_AUDIT_CACHE ? window.FACULTY_AUDIT_CACHE[index] : null;
    if (!faculty) return;

    let timestamps = faculty.timestamps || [];
    let listHTML = timestamps.map((t, i) => `<li>${t !== 'Never' ? new Date(t).toLocaleString() : 'Never logged in'}</li>`).join('');

    let modal = document.getElementById('faculty-detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'faculty-detail-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:9999;';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background:white; padding:25px; border-radius:8px; width:450px; max-width:90%; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
            <h3 style="margin-top:0; color:#0f172a;">📅 Login History: ${esc(faculty.email)}</h3>
            <p style="color:#475569; font-size:0.9rem;">Total Logins: <strong>${faculty.count}</strong></p>
            <div style="max-height:250px; overflow-y:auto; background:#f8fafc; padding:10px; border:1px solid #cbd5e1; border-radius:6px; margin-bottom:15px;">
                <ul style="margin:0; padding-left:20px; color:#334155; font-size:0.9rem;">${listHTML}</ul>
            </div>
            <div style="text-align:right;">
                <button onclick="document.getElementById('faculty-detail-modal').style.display='none';" style="background:#3b82f6; color:white; border:none; padding:6px 16px; border-radius:4px; cursor:pointer; font-weight:bold;">Close</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
};

window.adminResetFacultyPwd = async function(email) {
    if (!confirm(`Are you sure you want to reset password for ${email} back to default (faculty@123)?`)) return;
    try {
        let res = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'setfacultypassword', email: email, password: 'faculty@123' })
        });
        let json = await res.json();
        if (json.status === 'success') {
            alert(`✅ Password for ${email} successfully reset to faculty@123.`);
            window.renderAdminFacultyAudit();
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
        window.renderAdminFacultyAudit();
    }
});

```

## 4. Create `VERSION14.0.md`

* Create a file named `VERSION14.0.md` in your project root containing the release notes for Ver 14.0.

```

```