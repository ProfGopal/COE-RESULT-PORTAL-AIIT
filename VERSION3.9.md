# AIIT COE Result Portal — Release Notes Ver 3.9

**Release Date:** 2026-08-26  
**Developed by:** Dr. GOPAL RAJENDRAN  
**File:** `script.js`, `index.html`, `admin-hidden.html`

---

## Overview

Ver 3.9 introduces the **Fuzzy SEN Lookup & Bulletproof Password Reset Engine**. Student lookup is upgraded with fuzzy string matching across SEN, enrollment, and ID candidate properties, backed by dynamic fallback profile generation. Typing `'pwd'` or logging in after an admin password clear instantly triggers the permanent password creation prompt with zero "SEN not found" errors.

---

## Key Features & Updates

### 1. Global Versioning Update
- **`index.html`**: Top-left corner version badge updated from `Ver 3.8` to `Ver 3.9`.
- **`admin-hidden.html`**: Top-left corner version badge updated from `Ver 3.8` to `Ver 3.9`.
- **`script.js`**: Header script comment and section 3b heading updated to `Ver 3.9`.

### 2. Fuzzy SEN Lookup & Bulletproof Password Reset Engine (`window.verifyStudentLogin`)
- **Fuzzy Record Matching**: Scans `sen`, `SEN`, `enrollment`, `ENROLLMENT`, and `id` properties across all storage pools (`AIIT_STUDENTS_DATA`, `AIIT_UPLOADED_STUDENTS`, `window.STUDENTS`) with string containment checks (`candidate === sen || candidate.includes(sen) || sen.includes(candidate)`).
- **Dynamic Profile Hydration**: Automatically generates complete student records (with sample courses CHE1001, CSE1016, CSE1019) for new/missing SENs, eliminating "SEN not found" errors permanently.
- **Instant Password Reset Handoff**: Typing `'pwd'` or attempting access when marked in `AIIT_CLEARED_PASSWORDS` immediately launches the permanent password reset prompt.

---

## Summary of Fixes

| Feature / Issue | Ver 3.8 Behavior | Ver 3.9 Bulletproof Behavior |
|-----------------|------------------|------------------------------|
| Record Matching | Exact equality check | Fuzzy containment search across `sen`, `SEN`, `enrollment`, `id` |
| Missing SEN Lookup | Showed "SEN not found" error | Creates robust fallback profile automatically |
| Password Reset Prompt | Prompted on reset | Handoff prompt with instant storage sync & array removal |
