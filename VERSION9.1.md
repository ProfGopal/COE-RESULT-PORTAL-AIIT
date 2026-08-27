# Release Notes: AIIT Version 9.1

* **Direct HTML Action Bindings:** Bound Faculty Login (`onclick="window.showFacultyLogin()"`), Student Sign-In (`onclick="window.studentLoginStep()"`), and Admin Login (`onclick="window.adminLogin()"`) directly to inline event attributes in HTML.
* **Bulletproof Login Engine:** Exposed global handlers `showFacultyLogin()`, `showStudentLoginUI()`, `studentLoginStep()`, and `adminLogin()` on `window` object to guarantee instant execution across all browsers.
