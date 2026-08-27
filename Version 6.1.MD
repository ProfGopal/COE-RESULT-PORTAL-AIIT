# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 6.2 (Native Routing & Unhindered Authentication Fix)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are fixing the click routing for the top-right **"ADMIN LOGIN"** and **"FACULTY LOGIN"** header buttons, restoring explicit form submission bindings, updating version tags to **Ver 6.2**, and creating `VERSION6.2.md`.

Please execute the following strict updates:

## 1. Global Versioning Update

* **File:** `index.html`, `admin-hidden.html`
* Change all version tags in the top left corners to `Ver 6.2`.



## 2. Unhindered Click Routing & Login Engine (`script.js`)

* **File:** `script.js`
* Replace your routing and login click handlers with this explicit version that guarantees header buttons and form submit buttons trigger their target functions without obstruction:



```javascript
/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 6.2 - Unhindered UI & Native Routing Fix)
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
//  EXPLICIT HEADER BUTTON ROUTING (Ver 6.2)
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('click', function(e) {
    const btn = e.target.closest('button, a');
    if (!btn) return;

    let text = (btn.textContent || '').trim().toUpperCase();

    // 1. Top Right Admin Login Button
    if (text === 'ADMIN LOGIN') {
        e.preventDefault();
        window.location.href = 'admin-hidden.html';
        return;
    }

    // 2. Top Right Faculty Login Button
    if (text === 'FACULTY LOGIN') {
        e.preventDefault();
        if (typeof window.showFacultyLogin === 'function') {
            window.showFacultyLogin();
        } else {
            let fContainer = document.getElementById('faculty-login-container') || document.getElementById('faculty-login');
            let sContainer = document.getElementById('student-login-container') || document.getElementById('landing');
            if (sContainer) sContainer.style.display = 'none';
            if (fContainer) fContainer.style.display = 'block';
        }
        return;
    }

    // 3. Admin Dashboard Tab Switcher
    if (text.includes('1. UPLOAD RESULTS') || text.includes('UPLOAD RESULTS')) {
        e.preventDefault();
        window.switchAdminTab('tab-upload', btn);
    } else if (text.includes('2. MANAGE CURRICULUM') || text.includes('MANAGE CURRICULUM')) {
        e.preventDefault();
        window.switchAdminTab('tab-curriculum', btn);
    } else if (text.includes('3. STUDENT DIRECTORY') || text.includes('STUDENT DIRECTORY')) {
        e.preventDefault();
        window.switchAdminTab('tab-students', btn);
    } else if (text.includes('4. FACULTY ASSIGNMENTS') || text.includes('FACULTY ASSIGNMENTS')) {
        e.preventDefault();
        window.switchAdminTab('tab-faculty', btn);
    }
});

window.switchAdminTab = function (tabId, btnElement) {
    document.querySelectorAll('.admin-section, .admin-tab-content, div[id^="tab-"], section[id^="tab-"]').forEach(sec => {
        if (sec) sec.style.display = 'none';
    });

    document.querySelectorAll('.admin-tab-btn, .nav-btn, .dashboard-nav button').forEach(b => {
        if (b) {
            b.classList.remove('active', 'bg-blue-600', 'text-white');
            b.style.background = '';
            b.style.color = '';
        }
    });

    var target = document.getElementById(tabId) || document.querySelector('.' + tabId);
    if (target) {
        target.style.display = 'block';
    }

    if (btnElement) {
        btnElement.classList.add('active');
        btnElement.style.background = '#2563eb';
        btnElement.style.color = '#ffffff';
    }

    if (tabId === 'tab-students' || tabId === 'student-directory') {
        if (typeof window.applyAdminFilters === 'function') window.applyAdminFilters();
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN LOGIN SUBMISSION (Ver 6.2)
// ═══════════════════════════════════════════════════════════════════════════════

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
            if (typeof applyAdminFilters === 'function') applyAdminFilters();
        } else {
            alert(`⚠ ${data.message || 'Incorrect Admin Password'}`);
        }
    } catch (err) {
        alert(`⚠ Network Error: Check your connection.`);
    }
};

```

## 3. Create `VERSION6.2.md`

* Create a file named `VERSION6.2.md` in your project root containing the following release notes:

```markdown
# Release Notes: AIIT Version 6.2

* **Header Routing Engine:** Explicitly mapped top-right "ADMIN LOGIN" and "FACULTY LOGIN" buttons to instantly open their respective portals.
* **Authentication Interceptor:** Restored seamless form submission for admin credentials and unblocked interactive elements across the dashboard.

```