@echo off
echo Adding Windows Firewall rule for FastAPI server (port 8000)...
echo.
echo This requires Administrator privileges.
echo.
netsh advfirewall firewall add rule name="FastAPI Server Port 8000" dir=in action=allow protocol=TCP localport=8000
echo.
if %ERRORLEVEL% EQU 0 (
    echo Firewall rule added successfully!
) else (
    echo Failed to add firewall rule. Please run this script as Administrator.
)
echo.
pause

