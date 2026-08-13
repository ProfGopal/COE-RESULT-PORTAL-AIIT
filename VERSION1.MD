# MASTER ARCHITECTURE BLUEPRINT: AIIT Version 3.0 (Microsoft Outlook Mailto & Complete Compliance Suite)

You are updating a static GitHub Pages site (`script.js`, `admin-hidden.html`). We are configuring the portal to seamlessly format and dispatch emails via Microsoft Outlook / default mail client using your official institutional sender (`gopalr@blr.amity.edu`) with CC to `Chandrashekharbn@blr.amity.edu`, full task filters, and the Faculty Performance Overview Matrix.

Please execute the following strict updates:

## 1. Global Versioning Update
* **File:** `admin-hidden.html` & `index.html`
  * Change all version tags in the top left corners to `Ver 3.0`.

## 2. Microsoft Outlook Compliant Official Mail Dispatcher
* **File:** `script.js`
  * Ensure the draft modal and dispatcher use your official Microsoft Office 365 address (`gopalr@blr.amity.edu`) and CC `Chandrashekharbn@blr.amity.edu`:

    ```javascript
    window.openDraftEmail = function(facultyEmail, taskName, courseCode, status) {
        let modal = document.getElementById('draft-email-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'draft-email-modal';
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:99999;';
            document.body.appendChild(modal);
        }

        let senderEmail = "gopalr@blr.amity.edu"; // Official Microsoft 365 COE SPOC Account
        let ccEmail = "Chandrashekharbn@blr.amity.edu"; // Head of Institution CC
        let subject = `URGENT: Reminder for ${taskName} Submission - Course ${courseCode}`;
        let body = `Dear Faculty Member,\n\nThis is an official reminder from the Controller of Examinations (COE) office regarding your assigned course ${courseCode}.\n\nTask: ${taskName}\nCurrent Status: ${status}\n\nPlease complete and freeze your submission on the COE Portal before the deadline.\n\nWarm regards,\nDr. Gopal Rajendran\nCOE Incharge - SPOC COE (AIIT)\nAmity University Bengaluru`;

        modal.innerHTML = `
            <div style="background:white; width:90%; max-width:650px; border-radius:8px; padding:25px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                <h3 style="margin-top:0; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:10px;">✉️ Microsoft Outlook Mail Dispatcher</h3>
                
                <div style="margin-bottom:10px;">
                    <label style="font-size:0.85rem; font-weight:bold; color:#475569;">From (Official MS 365 Account):</label>
                    <input type="text" value="${senderEmail}" readonly style="width:100%; padding:8px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; font-weight:bold; color:#0284c7;">
                </div>

                <div style="margin-bottom:10px;">
                    <label style="font-size:0.85rem; font-weight:bold; color:#475569;">CC (Head of Institution):</label>
                    <input type="text" value="${ccEmail}" readonly style="width:100%; padding:8px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; font-weight:bold; color:#334155;">
                </div>

                <div style="margin-bottom:10px;">
                    <label style="font-size:0.85rem; font-weight:bold; color:#475569;">To (Faculty Recipient):</label>
                    <input type="text" value="${facultyEmail}" readonly style="width:100%; padding:8px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; font-weight:bold; color:#334155;">
                </div>

                <div style="margin-bottom:10px;">
                    <label style="font-size:0.85rem; font-weight:bold; color:#475569;">Subject:</label>
                    <input type="text" id="draft-subject" value="${subject}" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:4px; font-weight:bold;">
                </div>

                <div style="margin-bottom:20px;">
                    <label style="font-size:0.85rem; font-weight:bold; color:#475569;">Message Body:</label>
                    <textarea id="draft-body" rows="6" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:4px; font-family:inherit;">${body}</textarea>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button onclick="document.getElementById('draft-email-modal').remove()" style="background:#cbd5e1; color:#334155; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">Cancel</button>
                    <button onclick="window.sendOutlookEmailAction('${facultyEmail}', '${ccEmail}')" style="background:#0284c7; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">🚀 Open Outlook & Send</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    };

    window.sendOutlookEmailAction = function(recipient, cc) {
        let subject = encodeURIComponent(document.getElementById('draft-subject').value);
        let body = encodeURIComponent(document.getElementById('draft-body').value);
        
        // Triggers Outlook desktop app / Outlook web (OWA) pre-filled with Sender & CC
        window.location.href = `mailto:${recipient}?cc=${cc}&subject=${subject}&body=${body}`;
        
        document.getElementById('draft-email-modal').remove();
        alert("✅ Opened Outlook with official sender context and CC!");
    };
    ```