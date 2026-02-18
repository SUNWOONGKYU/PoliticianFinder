#!/usr/bin/env python3
"""
박주민 평가 전체 자동화
평가 (4개 AI) → 검증 → 점수 계산 → 보고서 생성
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

def get_ai_count(ai_name):
    """특정 AI의 평가 개수 조회"""
    result = supabase.table('evaluations_v40').select('id').eq('politician_id', POLITICIAN_ID).eq('evaluator_ai', ai_name).execute()
    return len(result.data)

def run_evaluation(ai_name):
    """평가 실행"""
    print(f"\n{'='*80}")
    print(f"{ai_name} 평가 시작")
    print(f"{'='*80}")

    cmd = [
        'python', 'evaluate_v40.py',
        '--politician_id', POLITICIAN_ID,
        '--politician_name', POLITICIAN_NAME,
        '--ai', ai_name
    ]

    print(f"명령어: {' '.join(cmd)}")
    print(f"작업 디렉토리: {CORE_DIR}")
    print("-" * 80)

    try:
        result = subprocess.run(
            cmd,
            cwd=CORE_DIR,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace'
        )

        if result.returncode == 0:
            print(f"{ai_name} 평가 완료")
            return True
        else:
            print(f"{ai_name} 평가 실패: {result.stderr[:200]}")
            return False

    except Exception as e:
        print(f"{ai_name} 평가 에러: {str(e)[:200]}")
        return False

def wait_for_completion(ai_name):
    """평가 완료 대기"""
    print(f"\n{ai_name} 평가 완료 대기 중...")

    while True:
        count = get_ai_count(ai_name)
        if count >= 1275:
            print(f"{ai_name} 완료: {count}/1275")
            return True

        print(f"  {ai_name}: {count}/1275 ({count/12.75:.1f}%)", end='\r')
        time.sleep(30)

def run_command(cmd, description, cwd=None):
    """일반 명령어 실행"""
    print(f"\n{'='*80}")
    print(f"{description}")
    print(f"{'='*80}")

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
            safe_output = result.stdout.encode('ascii', errors='replace').decode('ascii')
            print(safe_output[:1000])

        return result.returncode == 0

    except Exception as e:
        print(f"에러: {str(e)[:200]}")
        return False

print("="*80)
print(f"박주민({POLITICIAN_ID}) 전체 평가 파이프라인 자동 실행")
print(f"시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)

# 현재 상태 확인
chatgpt_count = get_ai_count('ChatGPT')
grok_count = get_ai_count('Grok')
claude_count = get_ai_count('Claude')
gemini_count = get_ai_count('Gemini')

print("\n현재 상태:")
print(f"  ChatGPT: {chatgpt_count}/1275")
print(f"  Grok: {grok_count}/1275")
print(f"  Claude: {claude_count}/1275")
print(f"  Gemini: {gemini_count}/1275")

# Step 1: ChatGPT (이미 진행 중이면 대기)
if chatgpt_count < 1275:
    if chatgpt_count == 0:
        run_evaluation('ChatGPT')
    wait_for_completion('ChatGPT')

# Step 2: Grok
if grok_count < 1275:
    run_evaluation('Grok')
    wait_for_completion('Grok')

# Step 3: Claude & Gemini (병렬 실행은 수동이므로 순차 실행)
if claude_count < 1275:
    print("\n" + "="*80)
    print("Claude 평가는 CLI Direct 방식으로 수동 실행이 필요합니다")
    print("다음 명령어를 별도 터미널에서 실행하세요:")
    print(f"cd {CORE_DIR}")
    print(f"python evaluate_v40.py --politician_id {POLITICIAN_ID} --politician_name {POLITICIAN_NAME} --ai Claude")
    print("="*80)
    wait_for_completion('Claude')

if gemini_count < 1275:
    run_evaluation('Gemini')
    wait_for_completion('Gemini')

# 모든 평가 완료 확인
print("\n" + "="*80)
print("모든 AI 평가 완료!")
print("="*80)

# Step 4: 검증
print("\nStep 4: 검증")
run_command(
    ['python', 'validate_v40_fixed.py',
     '--politician_id', POLITICIAN_ID,
     '--politician_name', POLITICIAN_NAME,
     '--no-dry-run'],
    "평가 결과 검증",
    cwd=CORE_DIR
)

# Step 5: 점수 계산
print("\nStep 5: 점수 계산")
run_command(
    ['python', 'calculate_v40_scores.py',
     '--politician_id', POLITICIAN_ID,
     '--politician_name', POLITICIAN_NAME],
    "점수 계산",
    cwd=CORE_DIR
)

# Step 6: 보고서 생성
print("\nStep 6: 보고서 생성")
run_command(
    ['python', 'generate_report_v40.py',
     POLITICIAN_ID,
     POLITICIAN_NAME],
    "평가 보고서 생성",
    cwd=CORE_DIR
)

# 완료
print("\n" + "="*80)
print("전체 파이프라인 완료!")
print(f"종료: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)

# 보고서 경로 출력
report_path = V40_DIR / '보고서' / f'{POLITICIAN_NAME}_{datetime.now().strftime("%Y%m%d")}.md'
if report_path.exists():
    print(f"\n생성된 보고서: {report_path}")
