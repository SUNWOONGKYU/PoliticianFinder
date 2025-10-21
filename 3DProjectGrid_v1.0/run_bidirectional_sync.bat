@echo off
REM UTF-8 인코딩 설정
chcp 65001 >nul

REM 현재 디렉토리로 이동
cd /d "%~dp0"

REM 제목 설정
title 프로젝트 그리드 양방향 동기화 (CSV ↔ Excel)

echo.
echo ════════════════════════════════════════════════════════════════════
echo  🔄 프로젝트 그리드 양방향 동기화 시스템
echo ════════════════════════════════════════════════════════════════════
echo.
echo 기능:
echo   • CSV 변경 → Excel 자동 업데이트
echo   • Excel 변경 → CSV 자동 업데이트
echo   • 파일 감시 자동화
echo   • 수정 이력 기록
echo.
echo 사용법:
echo   1. 이 창을 열어둡니다
echo   2. CSV 또는 Excel 파일을 수정하고 저장합니다
echo   3. 자동으로 다른 파일이 업데이트됩니다
echo.
echo ⚠️  Ctrl+C를 누르면 종료됩니다.
echo ════════════════════════════════════════════════════════════════════
echo.

REM Python 실행
python3 bidirectional_sync.py

if errorlevel 1 (
    echo.
    echo ❌ 오류 발생! python3 명령이 없을 수 있습니다.
    echo 다음 명령을 시도해주세요:
    echo   python bidirectional_sync.py
    echo.
    pause
)
