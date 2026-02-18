#!/usr/bin/env python3
"""
평가 완료 후 자동 파이프라인 실행
검증 → 점수 계산 → 보고서 생성
"""

import os
import sys
import subprocess
import time
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

POLITICIAN_ID = '8c5dcc89'
POLITICIAN_NAME = '박주민'

V40_DIR = Path(__file__).parent
SCRIPTS_DIR = V40_DIR / 'scripts'
CORE_DIR = SCRIPTS_DIR / 'core'

supabase: Client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

def check_completion():
    """모든 AI 평가 완료 확인"""
    result = supabase.table('evaluations_v40').select('evaluator_ai').eq('politician_id', POLITICIAN_ID).execute()

    ai_counts = {}
    for item in result.data:
        ai = item['evaluator_ai']
        ai_counts[ai] = ai_counts.get(ai, 0) + 1

    total = len(result.data)
    all_complete = (
        ai_counts.get('Claude', 0) >= 1275 and
        ai_counts.get('ChatGPT', 0) >= 1275 and
        ai_counts.get('Gemini', 0) >= 1275 and
        ai_counts.get('Grok', 0) >= 1275
    )

    return total, ai_counts, all_complete

def run_command(cmd, description, cwd=None):
    """명령어 실행"""
    print(f"\n{'='*80}")
    print(f"{description}")
    print(f"{'='*80}")
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
            # ASCII 안전 출력
            safe_output = result.stdout.encode('ascii', errors='replace').decode('ascii')
            print(safe_output)

        if result.returncode != 0:
            print(f"경고: 명령어 실패 (exit code: {result.returncode})")
            if result.stderr:
                safe_error = result.stderr.encode('ascii', errors='replace').decode('ascii')
                print(f"에러: {safe_error}")
            return False

        return True

    except Exception as e:
        print(f"에러 발생: {str(e).encode('ascii', errors='replace').decode('ascii')}")
        return False

# 평가 완료 대기
print("="*80)
print(f"박주민({POLITICIAN_ID}) 평가 완료 대기 중...")
print("="*80)

while True:
    total, ai_counts, all_complete = check_completion()

    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 현재 진행 상황:")
    print(f"  전체: {total}/5100 ({total/51:.1f}%)")
    for ai in ['Claude', 'ChatGPT', 'Gemini', 'Grok']:
        count = ai_counts.get(ai, 0)
        status = "완료" if count >= 1275 else f"{count}/1275"
        print(f"  {ai}: {status}")

    if all_complete:
        print("\n" + "="*80)
        print("모든 AI 평가 완료!")
        print("="*80)
        break

    print("\n30초 후 재확인...")
    time.sleep(30)

# Step 1: 검증
print("\n" + "="*80)
print("Step 1: 평가 결과 검증")
print("="*80)

success = run_command(
    ['python', 'validate_v40_fixed.py',
     '--politician_id', POLITICIAN_ID,
     '--politician_name', POLITICIAN_NAME,
     '--no-dry-run'],
    "검증 실행 (무효 데이터 삭제)",
    cwd=CORE_DIR
)

if not success:
    print("경고: 검증 실패, 계속 진행...")

# Step 2: 점수 계산
print("\n" + "="*80)
print("Step 2: 점수 계산")
print("="*80)

success = run_command(
    ['python', 'calculate_v40_scores.py',
     '--politician_id', POLITICIAN_ID,
     '--politician_name', POLITICIAN_NAME],
    "점수 계산 실행",
    cwd=CORE_DIR
)

if not success:
    print("경고: 점수 계산 실패")

# Step 3: 보고서 생성
print("\n" + "="*80)
print("Step 3: 평가 보고서 생성")
print("="*80)

success = run_command(
    ['python', 'generate_report_v40.py',
     POLITICIAN_ID,
     POLITICIAN_NAME],
    "보고서 생성 실행",
    cwd=CORE_DIR
)

if not success:
    print("경고: 보고서 생성 실패")

# 완료
print("\n" + "="*80)
print("전체 파이프라인 완료!")
print(f"종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)

# 보고서 확인
report_path = V40_DIR / '보고서' / f'{POLITICIAN_NAME}_{datetime.now().strftime("%Y%m%d")}.md'
if report_path.exists():
    print(f"\n생성된 보고서: {report_path}")
else:
    print(f"\n경고: 보고서 파일을 찾을 수 없습니다: {report_path}")

# 최종 결과
print("\n" + "="*80)
print("최종 평가 결과")
print("="*80)

run_command(
    ['python', '../utils/check_v40_results.py',
     '--politician_id', POLITICIAN_ID],
    "최종 평가 현황 확인",
    cwd=CORE_DIR
)
