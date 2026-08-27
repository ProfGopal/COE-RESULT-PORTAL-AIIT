```python
# Let's review the new requirements from the user:
# 1. Faculty default password is `faculty@123` which can only be used the first time.
# 2. Upon first login with `faculty@123`, it must prompt the faculty member to change their password, and subsequent logins require the new password (rejecting `faculty@123` after it's changed).
# 3. Admin dashboard needs an audit trail tracking:
#    - Which faculty logged in
#    - How many times they logged in (login counts)
#    - Timestamps of logins
#    - Password reset option for each faculty member (allowing admin to reset their password back to `faculty@123` or clear it).
# 4. Update the Google Apps Script backend (`Code.gs`) and frontend (`script.js`) to support these specific enterprise features securely.

print("Designing Ver 11.0 Enterprise Faculty Audit & Security Architecture")


```

```text
Designing Ver 11.0 Enterprise Faculty Audit & Security Architecture


```

# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 11.0 (Enterprise Faculty Audit & First-Time Password Security Suite)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`) and Google Apps Script backend (`Code.gs`). We are adding enterprise-grade security for faculty authentication: enforcing first-time change of the default password (`faculty@123`), building a live **Faculty Login Audit Dashboard** in the Admin panel tracking login frequency and timestamps, and adding an explicit admin **Faculty Password Reset** tool, updating version tags to **Ver 11.0**, and creating `VERSION11.0.md`.

Please execute the following strict updates:

## 1. Global Versioning Update

* **File:** `index.html`, `admin-hidden.html`
* Change all version tags in the top left corners to `Ver 11.0`.



## 2. Updated Google Apps Script Backend (`Code.gs`)

* **File:** `Code.gs` (Google Apps Script)
* Add support for faculty login verification, login audit logging, and admin faculty password resets. Ensure your script has a `FacultyAudit` sheet or handles storage safely:



```javascript
// Add these action handlers inside your doPost(e) function in Code.gs:

    if (action === 'verifyfaculty') {
      var email = data.email ? data.email.trim().toLowerCase() : "";
      var password = data.password ? data.password.trim() : "";
      
      var isAuthorized = AUTHORIZED_FACULTY.some(function(facEmail) { return facEmail.toLowerCase() === email; });
      if (!isAuthorized && email !== 'faculty@123') {
        return jsonResponse({status: "error", message: "Email not authorized."});
      }

      var ss = SpreadsheetApp.openById(SHEET_ID);
      var facSheet = ss.getSheetByName("FacultyPass") || ss.insertSheet("FacultyPass");
      var facData = facSheet.getDataRange().getValues();
      
      var storedPass = "";
      var rowIndex = -1;
      
      for (var i = 1; i < facData.length; i++) {
        if (String(facData[i][0]).toLowerCase() === email) {
          storedPass = String(facData[i][1]).trim();
          rowIndex = i + 1;
          break;
        }
      }

      // If no custom password exists, check default 'faculty@123'
      if (!storedPass) {
        if (password === 'faculty@123') {
          // First time login - prompt required on frontend
          logFacultyAudit(email);
          return jsonResponse({status: "first_time", message: "First-time login. Please change your password."});
        } else {
          return jsonResponse({status: "error", message: "Invalid credentials."});
        }
      }

      // If custom password exists, reject default 'faculty@123'
      if (storedPass === 'faculty@123' && password === 'faculty@123') {
        return jsonResponse({status: "first_time", message: "First-time login. Please change your password."});
      }

      if (storedPass === password) {
        logFacultyAudit(email);
        return jsonResponse({status: "success", message: "Faculty verified"});
      }

      return jsonResponse({status: "error", message: "Incorrect password."});
    }

    if (action === 'setfacultypassword') {
      var email = data.email ? data.email.trim().toLowerCase() : "";
      var newPass = data.password ? data.password.trim() : "";
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var facSheet = ss.getSheetByName("FacultyPass") || ss.insertSheet("FacultyPass");
      var facData = facSheet.getDataRange().getValues();
      
      var found = false;
      for (var i = 1; i < facData.length; i++) {
        if (String(facData[i][0]).toLowerCase() === email) {
          facSheet.getRange(i + 1, 2).setValue(newPass);
          found = true;
          break;
        }
      }
      if (!found) {
        facSheet.appendRow([email, newPass, new Date().toISOString()]);
      }
      return jsonResponse({status: "success", message: "Faculty password updated successfully."});
    }

    if (action === 'getFacultyAudit') {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var auditSheet = ss.getSheetByName("FacultyAudit");
      if (!auditSheet) return jsonResponse([]);
      var rows = auditSheet.getDataRange().getValues();
      var auditList = [];
      for (var i = 1; i < rows.length; i++) {
        auditList.push({ email: rows[i][0], timestamp: rows[i][1], count: rows[i][2] });
      }
      return jsonResponse(auditList);
    }

function logFacultyAudit(email) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var auditSheet = ss.getSheetByName("FacultyAudit") || ss.insertSheet("FacultyAudit");
  if (auditSheet.getLastRow() === 0) {
    auditSheet.appendRow(["Email", "Last Timestamp", "Login Count"]);
  }
  var data = auditSheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === email.toLowerCase()) {
      var currentCount = parseInt(data[i][2]) || 0;
      auditSheet.getRange(i + 1, 2).setValue(new Date().toISOString());
      auditSheet.getRange(i + 1, 3).setValue(currentCount + 1);
      found = true;
      break;
    }
  }
  if (!found) {
    auditSheet.appendRow([email, new Date().toISOString(), 1]);
  }
}

```

## 3. Enterprise Faculty Security & Audit Engine (`script.js`)

* **File:** `script.js`
* Add the bulletproof faculty login verification and admin audit renderer:



```javascript
/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 11.0 - Enterprise Faculty Security & Audit Suite)
 */

'use strict';

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";

window.facultyLoginStep = async function () {
    var emailInput = document.getElementById('f-email') || document.querySelector('input[type="email"]');
    var passInput = document.getElementById('f-pass') || document.querySelector('input[type="password"]');
    var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    var pass = passInput ? passInput.value : "";

    if (!email || !pass) {
        alert("Please enter both institutional email and password.");
        return;
    }

    try {
        var response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'verifyfaculty', email: email, password: pass })
        });
        var result = await response.json();

        if (result && result.status === 'first_time') {
            let newPass = prompt("🔐 First-time login using default password. Enter your new permanent password (min 6 characters):");
            if (!newPass || newPass.length < 6) {
                alert("❌ Password must be at least 6 characters.");
                return;
            }

            let setRes = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'setfacultypassword', email: email, password: newPass })
            });
            let setJson = await setRes.json();

            if (setJson.status === 'success') {
                alert("✅ Password updated successfully! Please sign in with your new password.");
                if (passInput) passInput.value = "";
            } else {
                alert(`❌ Error: ${setJson.message}`);
            }
            return;
        }

        if (result && result.status === 'success') {
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
            alert("❌ " + (result.message || 'Invalid Faculty Credentials or Email not authorized.'));
        }
    } catch (err) {
        alert("✗ Network error connecting to faculty authentication backend.");
    }
};

// --- ADMIN FACULTY AUDIT DASHBOARD RENDERER ---
window.renderAdminFacultyAudit = async function() {
    let container = document.getElementById('admin-faculty-audit-container');
    if (!container) {
        let tabFac = document.getElementById('tab-faculty');
        if (tabFac) {
            container = document.createElement('div');
            container.id = 'admin-faculty-audit-container';
            container.style.cssText = 'margin-top:20px; background:white; padding:20px; border-radius:8px; border:1px solid #cbd5e1;';
            tabFac.appendChild(container);
        }
    }
    if (!container) return;

    try {
        let res = await fetch(scriptURL + "?action=getFacultyAudit");
        let auditList = await res.json();

        let rowsHTML = "";
        (auditList || []).forEach(item => {
            rowsHTML += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px; font-weight:bold; color:#0f172a;">${esc(item.email)}</td>
                <td style="padding:10px; text-align:center;"><span style="background:#dcfce3; color:#16a34a; padding:4px 8px; border-radius:4px; font-weight:bold;">${item.count} logins</span></td>
                <td style="padding:10px; color:#475569;">${new Date(item.timestamp).toLocaleString()}</td>
                <td style="padding:10px; text-align:right;">
                    <button onclick="window.adminResetFacultyPwd('${esc(item.email)}')" style="background:#ef4444; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">Reset to Default</button>
                </td>
            </tr>`;
        });

        container.innerHTML = `
            <h3 style="color:#0f172a; margin-top:0;">📊 Faculty Login Audit & Security Dashboard</h3>
            <p style="color:#475569; font-size:0.9rem;">Tracks faculty login frequency, last active timestamps, and allows resetting passwords back to default (faculty@123).</p>
            <table style="width:100%; border-collapse:collapse; margin-top:15px; font-size:0.9rem;">
                <thead>
                    <tr style="background:#f8fafc; border-bottom:2px solid #cbd5e1; color:#334155; text-align:left;">
                        <th style="padding:10px;">Faculty Email</th>
                        <th style="padding:10px; text-align:center;">Login Count</th>
                        <th style="padding:10px;">Last Timestamp</th>
                        <th style="padding:10px; text-align:right;">Action</th>
                    </tr>
                </thead>
                <tbody>${rowsHTML || `<tr><td colspan="4" style="text-align:center; padding:20px; color:#64748b;">No faculty login audits recorded yet.</td></tr>`}</tbody>
            </table>
        `;
    } catch(e) {
        console.warn("Faculty audit load error:", e);
    }
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
    if (document.getElementById('tab-faculty')) {
        window.renderAdminFacultyAudit();
    }
});

```

## 4. Create `VERSION11.0.md`

* Create a file named `VERSION11.0.md` in your project root containing the release notes for Ver 11.0.

```

```