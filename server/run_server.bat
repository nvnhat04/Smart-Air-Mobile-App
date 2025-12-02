@echo off
REM Script để chạy TiTiler PM2.5 server

echo =========================================
echo TiTiler PM2.5 Server
echo =========================================
echo.

cd /d "%~dp0"

REM Kiểm tra Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python chua duoc cai dat hoac khong co trong PATH
    pause
    exit /b 1
)

REM Kiểm tra requirements
if not exist "requirements.txt" (
    echo Error: Khong tim thay requirements.txt
    pause
    exit /b 1
)

REM Cài đặt dependencies nếu cần
echo Kiem tra va cai dat dependencies...
python -m pip install -r requirements.txt -q

echo.
echo =========================================
echo Khoi dong server tai http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Health Check: http://localhost:8000/health
echo =========================================
echo.

REM Chạy server
python run.py

pause
