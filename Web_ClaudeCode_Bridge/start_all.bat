@echo off
echo ╔══════════════════════════════════════════════╗
echo ║                                              ║
echo ║   🚀 Inbox System 전체 시작                  ║
echo ║                                              ║
echo ╚══════════════════════════════════════════════╝
echo.
echo 📬 Inbox Server 시작 중...
start "Inbox Server" cmd /k "cd /d %~dp0 && node inbox_server.js"
timeout /t 2 /nobreak > nul

echo 👁️  Inbox Watcher 시작 중...
start "Inbox Watcher" cmd /k "cd /d %~dp0 && node inbox_watcher.js"

echo.
echo ✅ 모든 시스템이 시작되었습니다!
echo.
echo 📌 실행 중인 창:
echo    1. Inbox Server (포트 3030)
echo    2. Inbox Watcher (파일 감시)
echo.
echo 종료하려면 각 창을 닫으세요.
echo.
pause
