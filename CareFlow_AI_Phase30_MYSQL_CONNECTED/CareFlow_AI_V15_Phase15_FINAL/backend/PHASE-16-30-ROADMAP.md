# CareFlow AI Backend — Phases 16–30

This release consolidates the planned backend stages into a verified backend track.

- 16: API foundation, SQLAlchemy, SQLite development / MySQL configuration
- 17: normalized high-value schema (users, patients, doctors, appointments, prescriptions, consents) and migration endpoint
- 18: PBKDF2 password hashing, JWT sessions, current-user endpoint
- 19: server-side RBAC/permission enforcement and negative authorization tests
- 20: patient/doctor CRUD APIs and validation
- 21: appointment conflict detection and status workflow
- 22: prescription clinical-review workflow with approve/modify/reject guards
- 23: laboratory/pharmacy data remains API-synchronized through the collection bridge; normalized clinical extension point prepared
- 24: billing/finance remains API-synchronized; dashboard aggregation endpoint added
- 25: emergency/OT/beds/blood-bank/ambulance remain API-synchronized; same server authorization boundary applies
- 26: college entities remain API-synchronized with the same authenticated collection contract
- 27: hostel entities remain API-synchronized with the same authenticated collection contract
- 28: AI gateway boundary is represented by authenticated backend APIs; clinical decision authority remains with clinicians
- 29: append-only hash-chain audit, consent API, audit listing and integrity verification
- 30: final integration gate, runtime QA, regression QA, package verification, and release documentation

## Honest scope boundary

The existing frontend contains many prototype modules. They are backend-synchronized through the collection bridge rather than all being rewritten as bespoke normalized SQL endpoints in one unsafe migration. High-value clinical entities have normalized tables and APIs first. This is intentional: it preserves the existing UI while creating a safe path toward a fully normalized production database.

Production deployment must use a strong secret, HTTPS, a managed MySQL/PostgreSQL database, secure CORS, server-side authorization, secret management, backups, monitoring, and a production AI provider configuration.
