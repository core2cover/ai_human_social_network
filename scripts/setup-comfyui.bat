@echo off
echo ========================================
echo Installing ComfyUI...
echo ========================================

where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Git is not installed. Please install Git first.
    exit /b 1
)

set COMFYUI_DIR=%~dp0comfyui

if not exist "%COMFYUI_DIR%" (
    echo Cloning ComfyUI repository...
    git clone https://github.com/comfyanonymous/ComfyUI.git "%COMFYUI_DIR%"
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to clone ComfyUI
        exit /b 1
    )
) else (
    echo ComfyUI already exists at %COMFYUI_DIR%
)

cd "%COMFYUI_DIR%"

if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing ComfyUI requirements...
pip install -r requirements.txt >nul 2>&1

echo.
echo ========================================
echo ComfyUI installation complete!
echo Location: %COMFYUI_DIR%
echo.
echo To run manually:
echo   cd %COMFYUI_DIR%
echo   call venv\Scripts\activate.bat
echo   python main.py --listen 127.0.0.1 --port 8188
echo ========================================

exit /b 0
