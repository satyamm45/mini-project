# CareFlow AI — Integrated Digital Healthcare, Medical College & Hospital Management System

**Tagline:** Connecting Healthcare, Education & Intelligent Care

## What this is
CareFlow AI is an academic, demo-ready browser prototype. It connects hospital administration, medical education and hostel administration with simulated AI clinical decision support, telemedicine workflow, reporting and tamper-evident audit logging. It is **not a production hospital information system** and must not be used for real clinical decisions.

## Run
1. Extract the project folder.
2. Easiest: double-click `index.html`.
3. Recommended: run `python -m http.server` inside the project folder, then open the displayed local address.

No external CDN is required. The project includes a local icon shim. Optional Gemini mode calls Google’s API only when deliberately configured; keep Local Demo mode for the college demonstration.

## Demo login credentials
All passwords are `password`.

| Role | Email | Password |
|---|---|---|
| Chairman | chairman@careflow.com | password |
| Hospital Administrator | admin@careflow.com | password |
| Medical Director | medicaldirector@careflow.com | password |
| College Administrator | college@careflow.com | password |
| Hostel Administrator | hostel@careflow.com | password |
| Dean / Principal | dean@careflow.com | password |
| HOD | hod@careflow.com | password |
| Doctor | doctor@careflow.com | password |
| Nurse | nurse@careflow.com | password |
| Receptionist | reception@careflow.com | password |
| Pharmacist | pharmacy@careflow.com | password |
| Lab Technician | lab@careflow.com | password |
| Student | student@careflow.com | password |
| Patient | patient@careflow.com | password |

## Tiering
**Tier 1**: login, Chairman live dashboard, departments/doctors/patients/appointments CRUD, schedules and leave-aware booking, AI support, doctor review, bilingual dashboard, RBAC and audit/hash-chain integrity. **Tier 2**: functional simplified pharmacy, laboratory, billing, hostel, telemedicine and college workflows. **Tier 3**: reachable concept-preview modules such as Blood Bank, Ambulance, Operations/OT, Second Opinion and advanced analytics.

## AI safety
AI is simulated decision support. It can suggest specialty, triage, investigations and a **draft** prescription, but it never creates an autonomous final prescription. Drafts route to a doctor review workflow with **Approve / Modify / Reject**. Red flags route to Emergency Alert rather than routine telemedicine. AI output carries a clinical-decision-support disclaimer.

## Consent
Registered-patient AI analysis requires active consent. Consent stores patient, purpose, expiry/status and timestamp/audit information. Without active consent, AI analysis is blocked.

## Audit / blockchain-style integrity
Significant create/update/delete/approve/reject actions append records containing `id`, `userId`, `role`, `action`, `entityType`, `entityId`, `timestamp`, `prevHash` and `hash`. SHA-256 is computed through the Web Crypto API and chained to the previous record. Verify Integrity recomputes the chain and detects manual tampering. This demonstrates cryptographic integrity using SHA-256 hash chaining. Production systems could extend this with a permissioned blockchain.

## Language
Login is always English. Selecting Hindi on login stores only the preference; Hindi becomes active after authentication on the dashboard. `CareFlow AI` and the official project name are never translated.

## Data
The prototype uses localStorage as a database-like data layer and seeds realistic demonstration records on first load. `data/seed-data.js` is the maintainable seed catalogue for migration/backend work.

## Reset
Clear this site's localStorage in browser developer tools and reload the project to restore the seed dataset.

## Assumptions Made
- localStorage is used because this is a zero-install academic prototype.
- Demo credentials are intentionally simple and are not production authentication.
- Clinical outputs are illustrative; qualified clinicians remain responsible for decisions.
- Production deployment should move authentication, authorization, consent enforcement, AI secrets, audit storage and patient records to a secure backend.
## Backend mode (Phase 16)

The project now includes a Python FastAPI + SQLAlchemy backend. See `BACKEND-SETUP.md` for setup. When served by the backend, login is validated server-side, the first login migrates the existing demo dataset, and subsequent data persistence synchronizes through authenticated API calls. SQLite is the zero-configuration development database; MySQL can be selected with `CAREFLOW_DATABASE_URL`.

