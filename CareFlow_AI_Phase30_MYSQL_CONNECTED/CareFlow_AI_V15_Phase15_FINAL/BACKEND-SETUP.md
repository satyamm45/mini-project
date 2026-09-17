# CareFlow AI Backend — Phase 16 Backend Foundation

This release adds a Python FastAPI + SQLAlchemy backend while keeping the existing browser UI intact.

## 1. Install

Use Python 3.11+ (3.13 is also supported by the dependencies used here).

```bash
cd CareFlow_AI_V15_Phase15_FINAL
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r backend/requirements.txt
```

## 2. Run

```bash
uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
```

Then open:

`http://127.0.0.1:8000/`

The backend serves the same frontend and exposes `/api/*`.

## 3. Demo login

The existing CareFlow demo credentials remain valid. Example:

- Doctor: `doctor@careflow.com` / `password`
- Student: `student@careflow.com` / `password`
- Chairman: `chairman@careflow.com` / `password`

The backend now validates the credentials and issues an 8-hour JWT. The frontend stores only the short-lived session token in `sessionStorage`.

## 4. What is connected in this first backend stage

- Authentication: `/api/auth/login`
- Current-user session: `/api/me`
- Database bootstrap: `/api/bootstrap`
- Collection read/sync: `/api/collections/{collection}`
- Server-side prescription decision guard: `/api/prescriptions/{id}/decision`
- Server-side audit append: `/api/audit`
- Audit integrity verification: `/api/audit/verify`
- Frontend localStorage persistence is synchronized to the backend after authentication.

The data layer uses a generic JSON-record table intentionally for this migration stage. It avoids breaking the existing 25+ prototype modules. Production can later migrate high-value entities into normalized tables while keeping the API contract.

## 5. Database

Default development database: SQLite at `backend/careflow.db`.

For MySQL, set:

```text
CAREFLOW_DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST:3306/careflow
CAREFLOW_JWT_SECRET=<long-random-secret>
```

Never commit real secrets.

## 6. Important security boundary

The frontend is still a college prototype. Backend authorization is now present for authentication, collection access, audit and prescription decisions, but the next backend phase should move every sensitive CRUD operation behind explicit server-side permission policies rather than relying on frontend visibility.

## 7. Windows quick start

Double-click `start_backend.bat`. The first run creates `.venv`, installs dependencies, and starts the API on port 8000. If your machine has no internet on the first run, install the packages from a machine/package cache with `pip install -r backend/requirements.txt` first.

## 8. Migration behavior

On the first authenticated login, the frontend sends its existing local demo dataset to `/api/migrate` exactly once. After initialization, collection writes are restricted by backend role permissions. This preserves the current prototype data while establishing a server-backed source of truth.
