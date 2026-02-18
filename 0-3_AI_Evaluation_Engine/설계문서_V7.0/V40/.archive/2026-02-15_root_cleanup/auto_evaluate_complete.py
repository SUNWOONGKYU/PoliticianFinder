#!/usr/bin/env python3
"""
박주민 완전 자동 평가 시스템
평가 → 검증 → 점수 계산 → 보고서 생성까지 자동 수행
"""

import os
import sys
import subprocess
import time
from pathlib import Path
from datetime import datetime

POLITICIAN_ID = '8c5dcc89'
POLITICIAN_NAME = '박주민'

print("="*80)
print(f"박주민({POLITICIAN_ID}) 완전 자동 평가 시작")
print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)

# 현재 디렉토리
V40_DIR = Path(__file__).parent
SCRIPTS_DIR = V40_DIR / 'scripts'
CORE_DIR = SCRIPTS_DIR / 'core'

def run_command(cmd, description, cwd=None):
    """명령어 실행"""
    print(f"\n[{description}]")
    print(f"명령어: {' '.join(cmd)}")
    print(f"작업 디렉토리: {cwd or os.getcwd()}")
    print("-" * 80)

    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace'
        )

        if result.stdout:
            print(result.stdout)

        if result.returncode != 0:
            print(f"⚠️ 경고: 명령어 실패 (exit code: {result.returncode})")
            if result.stderr:
                print(f"에러: {result.stderr}")
            return False

        return True

    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        return False

# Step 1: ChatGPT 평가
print("\n" + "="*80)
print("Step 1: ChatGPT 평가 (1,275개)")
print("="*80)

success = run_command(
    ['python', 'evaluate_v40.py',
     '--politician_id', POLITICIAN_ID,
     '--politician_name', POLITICIAN_NAME,
     '--ai', 'ChatGPT'],
    "ChatGPT 평가 실행",
    cwd=CORE_DIR
)

if not success:
    print("⚠️ ChatGPT 평가 실패, 계속 진행...")

# Step 2: Grok 평가
print("\n" + "="*80)
print("Step 2: Grok 평가 (1,275개)")
print("="*80)

success = run_command(
    ['python', 'evaluate_v40.py',
     '--politician_id', POLITICIAN_ID,
     '--politician_name', POLITICIAN_NAME,
     '--ai', 'Grok'],
    "Grok 평가 실행",
    cwd=CORE_DIR
)

if not success:
    print("⚠️ Grok 평가 실패, 계속 진행...")

# Step 3: 평가 결과 확인
print("\n" + "="*80)
print("Step 3: 평가 결과 확인")
print("="*80)

run_command(
    ['python', '../utils/check_v40_results.py',
     '--politician_id', POLITICIAN_ID],
    "평가 현황 확인",
    cwd=CORE_DIR
)

# Step 4: 점수 계산
print("\n" + "="*80)
print("Step 4: 점수 계산")
print("="*80)

success = run_command(
    ['python', 'calculate_v40_scores.py',
     '--politician_id', POLITICIAN_ID,
     '--politician_name', POLITICIAN_NAME],
    "점수 계산 실행",
    cwd=CORE_DIR
)

if not success:
    print("⚠️ 점수 계산 실패")

# Step 5: 보고서 생성
print("\n" + "="*80)
print("Step 5: 평가 보고서 생성")
print("="*80)

success = run_command(
    ['python', 'generate_report_v40.py',
     POLITICIAN_ID,
     POLITICIAN_NAME],
    "보고서 생성 실행",
    cwd=CORE_DIR
)

if not success:
    print("⚠️ 보고서 생성 실패")

# 완료
print("\n" + "="*80)
print("완료!")
print(f"종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)

print("\n📋 생성된 파일:")
report_path = V40_DIR / '보고서' / f'{POLITICIAN_NAME}_{datetime.now().strftime("%Y%m%d")}.md'
if report_path.exists():
    print(f"  ✅ {report_path}")
else:
    print(f"  ⚠️ 보고서 파일을 찾을 수 없습니다: {report_path}")

print("\n최종 결과 확인:")
run_command(
    ['python', '../utils/check_v40_results.py',
     '--politician_id', POLITICIAN_ID],
    "최종 평가 현황",
    cwd=CORE_DIR
)
