@echo off
setlocal
cd /d "%~dp0"
if not exist ".git" (
  echo [STOP] Place this BAT and UPLOAD_TO_REPO_ROOT in the repository root.
  pause
  exit /b 1
)
xcopy /E /I /Y "UPLOAD_TO_REPO_ROOT\*" "." >nul
python scripts\validate_overnight_patch.py
if errorlevel 1 (
  echo [FAILED] Validation failed.
  pause
  exit /b 1
)
echo.
echo [PASS] Overnight data patch applied.
echo Review changes in GitHub Desktop, then commit and push.
pause
