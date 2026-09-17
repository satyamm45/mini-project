# CareFlow AI — Real Database Connection

The backend supports a real MySQL 8 database. The included Docker Compose setup creates MySQL and the API together, so no manual MySQL installation is required if Docker Desktop is available.

## Option A — Bundled MySQL (recommended for the demo)

1. Install/start Docker Desktop.
2. Double-click `start_mysql_backend.bat`.
3. Wait for `careflow-backend` to report that Uvicorn is running.
4. Open `http://127.0.0.1:8000/`.
5. The API health endpoint is `http://127.0.0.1:8000/api/health`.

Database:
- Host: 127.0.0.1
- Port: 3306
- Database: careflow
- User: careflow_app
- Password: CareFlow_Local_2026!

These credentials are for the local bundled development/demo database only. Change them for any real deployment.

## Option B — Existing MySQL/XAMPP

Create a database named `careflow`, then copy `backend/.env.example` to `backend/.env` and set:

`CAREFLOW_DATABASE_URL=mysql+pymysql://USER:PASSWORD@127.0.0.1:3306/careflow`

The application creates its SQLAlchemy tables on startup. Do not commit `backend/.env`.

## Verify connection

After login, open `/api/db/info` or `/api/health`. `/api/health` should report `database: connected` and `/api/db/info` reports the active SQLAlchemy driver/backend without exposing the password.

## Existing prototype data

The first authenticated migration preserves the existing localStorage prototype data. The normalized high-value tables can then be populated through `/api/v1/...` APIs and the normalization migration endpoint.
