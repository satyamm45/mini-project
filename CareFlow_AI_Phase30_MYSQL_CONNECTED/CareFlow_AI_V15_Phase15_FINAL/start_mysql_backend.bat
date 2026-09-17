@echo off
cd /d "%~dp0"
where docker >nul 2>nul
if errorlevel 1 (
  echo Docker Desktop is required for the bundled MySQL setup.
  echo Alternatively configure backend\.env for an existing MySQL server.
  pause
  exit /b 1
)
docker compose up --build
