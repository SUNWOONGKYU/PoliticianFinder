@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ================================================
echo 프로젝트 그리드 자동 동기화
echo ================================================
echo.
echo 1. CSV 업데이트 및 Excel 생성
echo 2. 자동 감시 모드 시작
echo.
set /p choice="선택하세요 (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo [1단계] CSV 파일 업데이트 중...
    python update_grid.py
    if errorlevel 1 (
        echo.
        echo ❌ CSV 업데이트 실패
        pause
        exit /b 1
    )

    echo.
    echo [2단계] Excel 파일 생성 중...
    python csv_to_excel.py
    if errorlevel 1 (
        echo.
        echo ❌ Excel 생성 실패
        pause
        exit /b 1
    )

    echo.
    echo ✅ 모든 작업 완료!
    pause
) else if "%choice%"=="2" (
    echo.
    echo 자동 감시 모드 시작...
    python auto_sync.py
) else (
    echo.
    echo 잘못된 선택입니다.
    pause
)
