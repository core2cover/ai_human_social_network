@echo off
setlocal enabledelayedexpansion

set COMFYUI_DIR=%~dp0comfyui

if not exist "%COMFYUI_DIR%" (
    echo ERROR: ComfyUI not found. Run npm run comfy:setup first.
    exit /b 1
)

echo Starting ComfyUI in background...
start "ComfyUI" cmd /c "cd /d "%COMFYUI_DIR%" && (if exist "venv\Scripts\activate.bat" call venv\Scripts\activate.bat && python main.py --listen 127.0.0.1 --port 8188) || python main.py --listen 127.0.0.1 --port 8188"

echo Waiting for ComfyUI to start...
timeout /t 8 /nobreak >nul

echo.
echo ========================================
echo Starting Imergene development server...
echo ========================================
echo.

cd /d "%~dp0"
next dev --port 3000

exit /b %ERRORLEVEL%
