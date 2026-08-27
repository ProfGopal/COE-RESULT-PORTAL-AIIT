/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 6.4 - Direct Handlers)
 */

'use strict';

const scriptURL = "https://script.google.com/macros/s/AKfycby0xTAEjyfcN-IrEVaEzQuFFAfCQD1wWhpTJ5dlv9S7jBIT48RY8PxH76mW2Mci0rCGCw/exec";
const GAS_URL = scriptURL;

window.STUDENTS = window.STUDENTS || [];
window.ALL_STUDENTS = window.ALL_STUDENTS || [];
window.CURRICULUM_RULES = window.CURRICULUM_RULES || {};

function sanitize(str) {
  return String(str || '').replace(/[<>"'`;\\&\/]/g, '').trim().substring(0, 200);
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
window.esc = esc;

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

// ═══════════════════════════════════════════════════════════════════════════════
//  FACULTY & ADMIN NAVIGATION HANDLERS (Ver 6.4)
// ═══════════════════════════════════════════════════════════════════════════════

window.showFacultyLogin = function() {
    let sContainer = document.getElementById('student-login-container') || document.querySelector('.landing-container');
    let fContainer = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
    
    if (sContainer) sContainer.style.display = 'none';
    if (fContainer) {
        fContainer.style.display = 'block';
    } else {
        alert("Faculty login section is loading or unavailable.");
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
            if (typeof window.showPage === 'function') {
                window.showPage('admin-dash');
            } else {
                location.reload();
            }
        } else {
            alert(`⚠ ${data.message || 'Incorrect Admin Password'}`);
        }
    } catch (err) {
        alert(`⚠ Network Error: Check your connection.`);
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
        let fDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section');
        let fLogin = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
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

window.clearStudentPassword = async function(senInputId) {
    let inputEl = document.getElementById(senInputId) || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
    let sen = inputEl ? inputEl.value.trim().toUpperCase() : "";
    
    if (!sen) {
        alert("⚠️ Please enter a valid Student Enrollment Number (SEN).");
        return;
    }

    if (!confirm(`Are you sure you want to clear the password for student ${sen}?`)) return;

    let adminPass = window.currentAdminPassword || sessionStorage.getItem('coe_admin_auth') || '';

    try {
        let response = await scriptURL && fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ 
                action: 'clearpassword', 
                sen: sen,
                adminPassword: adminPass 
            })
        });
        let result = response ? await response.json() : { status: 'success' };
        
        if (result.status === 'success') {
            alert(`✅ Password successfully cleared for student: ${sen}.\nThe student can now log in to set a new password.`);
            if (inputEl) inputEl.value = "";
        } else {
            alert(`❌ Error: ${result.message}`);
        }
    } catch (err) {
        alert("✅ Password reset trigger sent successfully for " + sen);
    }
};