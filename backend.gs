// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE APPS SCRIPT BACKEND TEMPLATE: AIIT Version 2.9
// Automated Reminders Engine (4 Days, 2 Days, and Deadline Day Alerts)
// Official COE SPOC: gopalr@blr.amity.edu
// Head of Institution CC: Chandrashekharbn@blr.amity.edu
// ═══════════════════════════════════════════════════════════════════════════════

function checkAndSendAutomatedReminders(submissionsPayload, deadlinesPayload, facultyAssignments) {
    var senderEmail = "gopalr@blr.amity.edu";
    var ccEmail = "Chandrashekharbn@blr.amity.edu";
    var now = new Date();

    if (!facultyAssignments || !Array.isArray(facultyAssignments)) return;

    facultyAssignments.forEach(function(a) {
        var courseKey = a.courseCode + "_" + a.batch + "_" + a.program;
        var subState = (submissionsPayload && submissionsPayload[courseKey]) ? submissionsPayload[courseKey] : {};
        var prefix = (parseInt(a.caCount) === 3) ? 'pg' : 'ug';

        var tasks = [
            { id: prefix + '_ca1_qp', name: 'CA 1 QP' },
            { id: prefix + '_ca1_scrutiny', name: 'CA 1 Scrutiny' },
            { id: prefix + '_ca1_marks', name: 'CA 1 Marks' },
            { id: prefix + '_ca2_qp', name: 'CA 2 QP' },
            { id: prefix + '_ca2_scrutiny', name: 'CA 2 Scrutiny' },
            { id: prefix + '_ca2_marks', name: 'CA 2 Marks' }
        ];

        if (parseInt(a.caCount) === 3) {
            tasks.push(
                { id: prefix + '_ca3_qp', name: 'CA 3 QP' },
                { id: prefix + '_ca3_scrutiny', name: 'CA 3 Scrutiny' },
                { id: prefix + '_ca3_marks', name: 'CA 3 Marks' }
            );
        }
        tasks.push({ id: prefix + '_internal_marks', name: 'Internal Marks' });
        if (a.hasLab) tasks.push({ id: prefix + '_lab_internal', name: 'Lab Internal' });

        tasks.forEach(function(t) {
            var isSubmitted = subState[t.id] && subState[t.id].submitted;
            if (isSubmitted) return;

            var deadlineStr = (deadlinesPayload && deadlinesPayload[t.id]) ? deadlinesPayload[t.id] : null;
            if (!deadlineStr) return;

            var deadlineDate = new Date(deadlineStr);
            var diffMs = deadlineDate.getTime() - now.getTime();
            var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            // Trigger email alert on 4 days remaining, 2 days remaining, or on Deadline Day / Overdue
            if (diffDays === 4 || diffDays === 2 || diffDays <= 0) {
                var subject = "URGENT: Reminder for " + t.name + " Submission - Course " + a.courseCode;
                var body = "Dear Faculty Member,\n\n" +
                           "This is an automated reminder from the Controller of Examinations (COE) office regarding your assigned course " + a.courseCode + ".\n\n" +
                           "Task: " + t.name + "\n" +
                           "Deadline: " + deadlineDate.toLocaleString() + "\n" +
                           "Days Remaining: " + (diffDays <= 0 ? "OVERDUE / TODAY IS DEADLINE DAY" : diffDays + " Days") + "\n\n" +
                           "Please complete and freeze your submission on the COE Portal as soon as possible.\n\n" +
                           "Warm regards,\n" +
                           "Dr. Gopal Rajendran\n" +
                           "COE Incharge - SPOC COE (AIIT)\n" +
                           "Amity University Bengaluru";

                try {
                    GmailApp.sendEmail(a.facultyEmail, subject, body, {
                        cc: ccEmail,
                        name: "Dr. Gopal Rajendran (COE Incharge)"
                    });
                    Logger.log("Automated reminder sent to " + a.facultyEmail + " for " + t.name);
                } catch(e) {
                    Logger.log("Error sending email: " + e.message);
                }
            }
        });
    });
}
