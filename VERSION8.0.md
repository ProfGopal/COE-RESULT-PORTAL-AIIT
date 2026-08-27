# Release Notes: AIIT Version 8.0

* **100% Pure Cloud-Driven Engine:** Portal automatically fetches live student records, programs, batches, and curriculum rules from the Google Sheet backend (`?action=load` & `?action=getCurriculum`) on page initialization (`window.initializeCloudPortal()`).
* **Global Logout Action:** Added universal `window.logoutPortal()` to clear storage session data and reset portal view on logout button click.
