@echo off
REM ========================================
REM Project Grid 자동 시작 등록 스크립트
REM Windows 작업 스케줄러에 등록
REM ========================================

REM 관리자 권한 확인
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ 오류: 관리자 권한이 필요합니다.
    echo.
    echo 이 배치 파일을 관리자로 실행해주세요.
    echo (마우스 우클릭 → 관리자로 실행)
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Project Grid 자동 시작 등록 중...
echo ========================================
echo.

REM 프로젝트 경로
set PROJECT_ROOT=C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder
set BATCH_FILE=%PROJECT_ROOT%\start_project_grid.bat

echo [1/3] 기존 작업 제거 중...
schtasks /delete /tn "ProjectGrid_AutoStart" /f >nul 2>&1

echo [2/3] 새 작업 등록 중...
REM 매일 부팅 시 실행 (지연 30초)
schtasks /create /tn "ProjectGrid_AutoStart" /tr "%BATCH_FILE%" /sc onstart /ru SYSTEM /f >nul 2>&1

if %errorlevel% equ 0 (
    echo.
    echo ✅ 성공!
    echo.
    echo 작업 등록 완료:
    echo - 작업명: ProjectGrid_AutoStart
    echo - 실행: 매번 부팅 시
    echo - 파일: %BATCH_FILE%
    echo.
    echo [3/3] 등록 상태 확인 중...
    schtasks /query /tn "ProjectGrid_AutoStart" /v /fo list
    echo.
    echo ========================================
    echo 다음 부팅 시 자동으로 Project Grid가 시작됩니다.
    echo ========================================
    echo.
) else (
    echo.
    echo ❌ 등록 실패!
    echo.
    echo 수동으로 등록하려면:
    echo 1. 작업 스케줄러 열기 (Win + R → taskschd.msc)
    echo 2. "작업 만들기" 클릭
    echo 3. 이름: ProjectGrid_AutoStart
    echo 4. "부팅할 때 트리거" 선택
    echo 5. 작업: %BATCH_FILE% 실행
    echo.
)

pause
