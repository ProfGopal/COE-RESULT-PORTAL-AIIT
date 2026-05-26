# 🎓 Product Requirements Document (PRD): Lightweight, Real-Time Student Result Portal

## 📖 1. Description
The Student Result Portal is a lightweight, real-time web application built using a serverless Backend-as-a-Service (BaaS) model. It serves as an internal university utility where administrators upload master grading spreadsheets (Excel/CSV), and students securely log in to view their performance. 

This platform is completely **deterministic, calculation-free, and AI-free**. It does not perform any math, nor does it interpret column syntax via an LLM. Instead, it extracts the exact text values (Grades, Credits, CGPA, and Course Details) from the spreadsheet structure using standard JavaScript programmatic loops (SheetJS) and displays them filtered strictly by the logged-in student's Enrolment Number (SEN).

---

## ✨ 2. Features

### 👨‍🎓 Student Capabilities
* **On-Demand Registration:** A student cannot sign up unless an administrator has pre-loaded their Roll Number/SEN via a master sheet upload. On their first visit, if their SEN is found and `password_set` is false, they create their password.
* **Secure Authentication:** Single-point session entry via SEN + Password verification.
* **Real-Time Dashboard:** A responsive layout displaying the student's name, SEN, and their explicit **CGPA/Grades exactly as written in the master sheet**. Data is synced instantly; if an admin replaces an upload, the student’s view updates live without requiring a page refresh.
* **Ephemeral Session State:** Session tokens are held natively in `sessionStorage` to allow browser tabs to clear authentication state upon exit.

### 👨‍💻 Administrator Capabilities
* **Wide-Row File Ingestion:** A single drag-and-drop zone that pushes files directly to cloud object storage. The parser is built to traverse wide horizontal layouts (e.g., repeating course prefix headers like `1-Course Code`, `2-Course Code`) or traditional multi-row entries, extracting every valid structural course element seamlessly.
* ** प्रोग्रामेटिक Upsert Control:** Re-uploading a file or uploading corrections maps to historical entries via student identification tokens, safely updating rather than multiplying row metrics.
* **Atomic Batch Erasures:** Admins can review a chronological history of file uploads and click a single button to wipe out every course record linked exclusively to a single mistaken file batch.
* **Credential Resets & Hard Wipes:** A administrative table tracking registered users allows an admin to instantly reset a student's `password_set` state back to false. A global hard wipe button requires a typed keyword string to flush all tables for a clean academic period.

---

## 🛠️ 3. Tech Stack

| Component | Selected Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | **React (Vite) + TS** | Fast builds, lightweight components, type safety. |
| **Styling** | **Tailwind CSS** | Eliminates custom style code bloat; rapid design loops. |
| **Backend & DB** | **Convex Cloud** | Eliminates Express boilerplate, database setups, and complex local C++ build tool dependencies (`node-gyp`). Offers out-of-the-box WebSockets for live data sync. |
| **File Storage** | **Convex Storage** | Native binary object storage directly integrated into backend function flows. |
| **Data Parsing** | **SheetJS (`xlsx`)** | Runs isolated inside a server-side Convex Action. Linearly maps spreadsheet sheets/rows directly into JavaScript objects. |
| **Security** | **`bcryptjs`** | Secure computational hashing for database access layers. |

---

## 📁 4. Project Directory Blueprint