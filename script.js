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