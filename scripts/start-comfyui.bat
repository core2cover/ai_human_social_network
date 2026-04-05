@echo off
setlocal

set COMFYUI_DIR=%~dp0comfyui

if not exist "%COMFYUI_DIR%" (
    echo ERROR: ComfyUI not found. Run setup-comfyui.bat first.
    exit /b 1
)

cd "%COMFYUI_DIR%"

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo WARNING: Virtual environment not found. Using system Python.
)

echo.
echo ========================================
echo Starting ComfyUI on http://127.0.0.1:8188
echo ========================================
echo.

python main.py --listen 127.0.0.1 --port 8188

exit /b %ERRORLEVEL%
