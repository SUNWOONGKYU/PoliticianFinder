@echo off
REM ========================================
REM Project Grid 자동 시작 스크립트
REM 포트 8090, 9999 동시 시작
REM ========================================

setlocal enabledelayedexpansion

REM 프로젝트 루트 경로
set PROJECT_ROOT=C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder
set VIEWER_DIR=%PROJECT_ROOT%\0-5_Development_ProjectGrid\action\PROJECT_GRID

REM 윈도우 타이틀 설정
title Project Grid Auto-Start

echo.
echo ========================================
echo Project Grid 시작 중...
echo ========================================
echo.

REM 포트 확인 및 기존 프로세스 종료
echo [1/4] 기존 프로세스 확인 및 종료 중...
netstat -ano | findstr :8090 >nul
if !errorlevel! equ 0 (
    echo   - 포트 8090 프로세스 발견, 종료 중...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8090') do taskkill /pid %%a /f >nul 2>&1
    timeout /t 1 >nul
)

netstat -ano | findstr :9999 >nul
if !errorlevel! equ 0 (
    echo   - 포트 9999 프로세스 발견, 종료 중...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9999') do taskkill /pid %%a /f >nul 2>&1
    timeout /t 1 >nul
)

REM 포트 8090 시작 (프로젝트 루트에서)
echo.
echo [2/4] 포트 8090 시작 중 (HTTP 콘텐츠 서버)...
cd /d "%PROJECT_ROOT%"
start /b python http_server_8090.py >"%PROJECT_ROOT%\logs\server_8090.log" 2>&1
timeout /t 2 >nul

REM 포트 9999 시작 (뷰어 & 파일 매핑)
echo [3/4] 포트 9999 시작 중 (HTML 뷰어)...
cd /d "%VIEWER_DIR%"
start /b python -m http.server 9999 >"%PROJECT_ROOT%\logs\server_9999.log" 2>&1
timeout /t 2 >nul

REM 포트 확인
echo.
echo [4/4] 서버 상태 확인 중...
timeout /t 2 >nul

netstat -ano | findstr :8090 >nul
if !errorlevel! equ 0 (
    echo   ✅ 포트 8090: 정상 작동 중
) else (
    echo   ❌ 포트 8090: 실패
)

netstat -ano | findstr :9999 >nul
if !errorlevel! equ 0 (
    echo   ✅ 포트 9999: 정상 작동 중
) else (
    echo   ❌ 포트 9999: 실패
)

echo.
echo ========================================
echo 시작 완료!
echo.
echo 접속 주소:
echo http://localhost:9999/viewer/project_grid_최종통합뷰어_v4.html
echo.
echo 로그 파일 위치:
echo %PROJECT_ROOT%\logs\server_8090.log
echo %PROJECT_ROOT%\logs\server_9999.log
echo ========================================
echo.

REM 이 창 유지 (10초 후 자동 종료)
timeout /t 10 /nobreak

endlocal
