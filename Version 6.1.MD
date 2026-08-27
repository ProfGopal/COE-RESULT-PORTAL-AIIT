# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 6.3 (Direct Button & Navigation Action Binding)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`, `index.html`). We are fixing the click routing for the top-right **"ADMIN LOGIN"** and **"FACULTY LOGIN"** buttons by directly binding their `onclick` attributes and event listeners, ensuring they never fail to open their respective login portals. Version tags are updated to **Ver 6.3**, and `VERSION6.3.md` is created.

Please execute the following strict updates:

## 1. Global Versioning Update

* **File:** `index.html`, `admin-hidden.html`
* Change all version tags in the top left corners to `Ver 6.3`.



## 2. Direct HTML Action Bindings (`index.html`)

* **File:** `index.html`
* Locate the top-right header buttons and add explicit `onclick` attributes so they work instantly without needing event delegation:
* Change the Admin Login button to: `<button onclick="window.location.href='admin-hidden.html'">ADMIN LOGIN</button>`
* Change the Faculty Login button to: `<button onclick="window.showFacultyLogin()">FACULTY LOGIN</button>`





## 3. Direct Routing & Login Engine (`script.js`)

* **File:** `script.js`
* Add the robust global handlers for faculty login, admin login, and direct button routing:



```javascript
/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 6.3 - Direct Button Action Binding)
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
//  FACULTY & ADMIN NAVIGATION HANDLERS (Ver 6.3)
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

```

## 4. Create `VERSION6.3.md`

* Create a file named `VERSION6.3.md` in your project root containing the following release notes:

```markdown
# Release Notes: AIIT Version 6.3

* **Direct Button Integration:** Bound `onclick` actions directly to top-level "ADMIN LOGIN" and "FACULTY LOGIN" header buttons, resolving unresponsive click states.
* **Streamlined Authentication:** Cleaned and optimized login execution endpoints for faculty and admin portals.

```