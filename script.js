/**
 * script.js — AIIT COE Result Portal
 * Master Script Engine (Ver 6.0 - Full Authorization & Dynamic Render Fix)
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
  document.querySelectorAll('.page, .admin-section, .admin-tab-content').forEach(function (p) { 
      p.classList.remove('active'); 
      p.style.display = 'none';
  });
  var target = document.getElementById(id);
  if (target) {
      target.classList.add('active');
      target.style.display = 'block';
  }
  window.scrollTo(0, 0);
};

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN TAB NAVIGATION (Ver 6.0)
// ═══════════════════════════════════════════════════════════════════════════════

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
    } else if (tabId === 'tab-curriculum' || tabId === 'manage-curriculum') {
        if (typeof window.loadCurriculumEditor === 'function') window.loadCurriculumEditor();
    } else if (tabId === 'tab-upload') {
        if (typeof window.renderSystemPrograms === 'function') window.renderSystemPrograms();
    }
};

document.addEventListener('click', function(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    let text = btn.textContent.trim();

    if (text.includes('1. Upload Results') || text.includes('Upload Results')) {
        e.preventDefault();
        window.switchAdminTab('tab-upload', btn);
    } else if (text.includes('2. Manage Curriculum') || text.includes('Manage Curriculum')) {
        e.preventDefault();
        window.switchAdminTab('tab-curriculum', btn);
    } else if (text.includes('3. Student Directory') || text.includes('Student Directory')) {
        e.preventDefault();
        window.switchAdminTab('tab-students', btn);
    } else if (text.includes('4. Faculty Assignments') || text.includes('4. Faculty')) {
        e.preventDefault();
        window.switchAdminTab('tab-faculty', btn);
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN PASSWORD CLEARING & SYSTEM PROGRAMS SYNC
// ═══════════════════════════════════════════════════════════════════════════════

window.clearStudentPassword = async function(senInputId) {
    let inputEl = document.getElementById(senInputId) || document.querySelector('input[placeholder*="SEN"], input[id*="sen"], input[type="text"]');
    let sen = inputEl ? inputEl.value.trim().toUpperCase() : "";
    
    if (!sen) { alert("⚠️ Please enter a valid SEN number."); return; }
    if (!confirm(`Are you sure you want to clear the password for student ${sen}?`)) return;

    let adminPass = window.currentAdminPassword || sessionStorage.getItem('coe_admin_auth') || '';

    try {
        let response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ 
                action: 'clearpassword', 
                sen: sen,
                adminPassword: adminPass 
            })
        });
        let result = await response.json();
        if (result.status === 'success') {
            alert(`✅ Password successfully cleared for student: ${sen}`);
            if (inputEl) inputEl.value = "";
        } else {
            alert(`❌ Error: ${result.message}`);
        }
    } catch (err) { alert("❌ Network error connecting to backend."); }
};

window.renderSystemPrograms = function () {
    let sysProgs = [];
    try { sysProgs = JSON.parse(localStorage.getItem('AIIT_SYSTEM_PROGRAMS')) || [
        { batch: "2024", program: "MCA" }, { batch: "2025", program: "MCA" }, { batch: "2024", program: "B.C.A" }
    ]; } catch(e){}

    const container = document.getElementById('active-system-programs');
    if (container) {
        container.innerHTML = sysProgs.map((p, i) => `
            <span style="background: #334155; padding: 5px 10px; border-radius: 4px; color: white; font-weight:bold; display:inline-block; margin:3px;">
                ${esc(p.batch)} ${esc(p.program)} 
                <button onclick="window.removeSystemProgram(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer; margin-left:5px;">✖</button>
            </span>
        `).join('');
    }
};

window.removeSystemProgram = function (index) {
    let sysProgs = [];
    try { sysProgs = JSON.parse(localStorage.getItem('AIIT_SYSTEM_PROGRAMS')) || []; } catch(e){}
    sysProgs.splice(index, 1);
    localStorage.setItem('AIIT_SYSTEM_PROGRAMS', JSON.stringify(sysProgs));
    window.renderSystemPrograms();
};

document.addEventListener('DOMContentLoaded', () => {
    window.renderSystemPrograms();
});