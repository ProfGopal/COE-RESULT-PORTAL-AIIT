# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 2.6 (Bulletproof Faculty Login & Fullscreen Shield)

You are updating a static GitHub Pages site (`script.js`, `index.html`). We are adding a bulletproof local fallback authentication for all authorized Amity faculty emails, completely locking down the landing view into a fullscreen dashboard overlay upon login to prevent scrolling to old forms, and setting the version strictly to Ver 2.6.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `index.html` & `admin-hidden.html`
  * Change all version tags in the top left corners to `Ver 2.6`.

## 2. Bulletproof Faculty Authentication & Fullscreen Overlay Shield
* **File:** `script.js`
  * Replace your `window.facultyLoginStep` with this ultra-reliable version featuring built-in authorized email verification and absolute fullscreen overlay management:

    ```javascript
    window.facultyLoginStep = async function () {
        var emailInput = document.getElementById('f-email');
        var passInput = document.getElementById('f-pass');
        var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
        var pass = passInput ? passInput.value : "";
        hideAlerts('faculty');

        if (!email || !pass) {
            showErr('faculty-err', 'Please enter email and password.', ['f-email', 'f-pass']);
            return;
        }

        // Master list of authorized faculty emails
        const authorizedFaculty = [
            "chandrashekharbn@blr.amity.edu", "gopalr@blr.amity.edu", "krishnachalithakc@blr.amity.edu",
            "mbhan@blr.amity.edu", "mkirmani@blr.amity.edu", "pramamurthy@blr.amity.edu",
            "pchakraborty@blr.amity.edu", "skumar2@blr.amity.edu", "vramamoorthy@blr.amity.edu",
            "geethav@blr.amity.edu", "nkumar@blr.amity.edu", "ntressa@blr.amity.edu", "sspattu@blr.amity.edu"
        ];

        var btn = document.getElementById('f-login-btn');
        if (btn) { btn.innerHTML = "⏳ Authenticating..."; btn.disabled = true; }

        let loginSuccessful = false;

        // 1. Try Backend Verification first
        try {
            var response = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'verifyfaculty', email: email, password: pass }) 
            });
            var result = await response.json();
            if (result && result.status === 'success') {
                loginSuccessful = true;
            }
        } catch (e) {
            console.warn("Backend faculty auth offline, checking local rules...", e);
        }

        // 2. Local Fallback Verification (Guarantees smooth access for your faculty list)
        if (!loginSuccessful) {
            if (authorizedFaculty.includes(email)) {
                let savedCustomPass = localStorage.getItem(`AIIT_FAC_PASS_${email}`) || 'faculty@123';
                if (pass === savedCustomPass || pass === 'faculty@123') {
                    loginSuccessful = true;
                }
            }
        }

        if (loginSuccessful) {
            if (btn) btn.innerHTML = "✅ Access Granted";

            // Check if first-time password change is needed
            let savedCustomPass = localStorage.getItem(`AIIT_FAC_PASS_${email}`);
            if (!savedCustomPass && pass === 'faculty@123') {
                let newPass = prompt("🔐 First-time login detected. Please enter your new permanent password (min 6 chars):");
                if (!newPass || newPass.length < 6) {
                    alert("❌ Password must be at least 6 characters.");
                    if (btn) { btn.innerHTML = "Faculty Sign In →"; btn.disabled = false; }
                    return;
                }
                localStorage.setItem(`AIIT_FAC_PASS_${email}`, newPass);
                alert("✅ Password updated successfully! Please sign in with your new password.");
                if (btn) { btn.innerHTML = "Faculty Sign In →"; btn.disabled = false; }
                return;
            }
            
            // --- ABSOLUTE FULLSCREEN OVERLAY SHIELD ---
            // Hide the entire landing page wrapper / main container so no login box can ever be scrolled to
            document.querySelectorAll('body > div, .landing-container, #faculty-login-wrapper, .result-portal-container').forEach(el => {
                if (el && !el.contains(document.getElementById('faculty-dash'))) {
                    el.style.display = 'none';
                }
            });

            // Show Faculty Dashboard in full view
            const facultyDash = document.getElementById('faculty-dash') || document.querySelector('.faculty-section');
            if (facultyDash) {
                facultyDash.style.display = 'block';
                facultyDash.style.position = 'fixed';
                facultyDash.style.top = '0';
                facultyDash.style.left = '0';
                facultyDash.style.width = '100vw';
                facultyDash.style.height = '100vh';
                facultyDash.style.zIndex = '99999';
                facultyDash.style.overflowY = 'auto';
                facultyDash.style.background = '#f8fafc';
            }
            
            document.body.style.overflow = 'hidden'; // Lock background scrolling
            window.scrollTo({ top: 0, behavior: 'instant' });

            window.currentFacultyEmail = email;
            var label = document.getElementById('faculty-email-label');
            if (label) label.textContent = email;
            
            window.renderFacultyPortal(email);
        } else {
            showErr('faculty-err', '⚠ Invalid Faculty Credentials or Email not authorized.', ['f-pass']);
            if (btn) { btn.innerHTML = "Faculty Sign In →"; btn.disabled = false; }
        }
    };

    window.facultyLogout = function() {
        sessionStorage.clear();
        localStorage.removeItem('coe_student_session');
        document.body.style.overflow = 'auto';
        window.scrollTo({ top: 0, behavior: 'instant' });
        window.location.reload();
    };
    ```