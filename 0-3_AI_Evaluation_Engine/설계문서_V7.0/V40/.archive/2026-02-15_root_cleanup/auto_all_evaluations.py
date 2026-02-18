#!/usr/bin/env python3
"""
박주민 전체 평가 자동화 (1,000개 데이터 기준)
Grok → Gemini → (Claude 수동 안내) → 검증 → 점수 → 보고서
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
TARGET_PER_AI = 1000  # 실제 수집된 데이터 기준

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

def wait_for_ai(ai_name):
    """AI 평가 완료 대기"""
    print(f"\n{ai_name} 평가 완료 대기...")

    while True:
        count = get_ai_count(ai_name)
        progress = count / TARGET_PER_AI * 100

        if count >= TARGET_PER_AI:
            print(f"\n{ai_name} 완료: {count}/{TARGET_PER_AI}")
            return True

        print(f"  [{datetime.now().strftime('%H:%M:%S')}] {ai_name}: {count}/{TARGET_PER_AI} ({progress:.1f}%)", end='\r')
        time.sleep(30)

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

    result = subprocess.run(
        cmd,
        cwd=CORE_DIR,
        capture_output=True,
        text=True,
        encoding='utf-8',
        errors='replace'
    )

    return result.returncode == 0

def run_command(cmd, description, cwd=None):
    """일반 명령어 실행"""
    print(f"\n{'='*80}")
    print(f"{description}")
    print(f"{'='*80}")

    result = subprocess.run(
        cmd,
        cwd=cwd,
        capture_output=True,
        text=True,
        encoding='utf-8',
        errors='replace'
    )

    if result.stdout:
        print(result.stdout[:500])

    return result.returncode == 0

print("="*80)
print(f"박주민({POLITICIAN_ID}) 전체 평가 자동화")
print(f"시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)

# 현재 상태
chatgpt = get_ai_count('ChatGPT')
grok = get_ai_count('Grok')
claude = get_ai_count('Claude')
gemini = get_ai_count('Gemini')

print(f"\n현재 상태:")
print(f"  ChatGPT: {chatgpt}/{TARGET_PER_AI} {'[OK]' if chatgpt >= TARGET_PER_AI else ''}")
print(f"  Grok: {grok}/{TARGET_PER_AI} {'[OK]' if grok >= TARGET_PER_AI else ''}")
print(f"  Claude: {claude}/{TARGET_PER_AI} {'[OK]' if claude >= TARGET_PER_AI else ''}")
print(f"  Gemini: {gemini}/{TARGET_PER_AI} {'[OK]' if gemini >= TARGET_PER_AI else ''}")

# Grok 대기 (이미 실행 중)
if grok < TARGET_PER_AI:
    wait_for_ai('Grok')

# Gemini 실행
if gemini < TARGET_PER_AI:
    run_evaluation('Gemini')
    wait_for_ai('Gemini')

# Claude 안내 (수동)
if claude < TARGET_PER_AI:
    print("\n" + "="*80)
    print("[MANUAL] Claude 평가는 CLI Direct 방식으로 수동 실행 필요")
    print("="*80)
    print("\n다음 명령어를 새 터미널에서 실행하세요:")
    print(f"cd {CORE_DIR}")
    print(f"python evaluate_v40.py --politician_id {POLITICIAN_ID} --politician_name {POLITICIAN_NAME} --ai Claude")
    print("\n" + "="*80)

    wait_for_ai('Claude')

# 모든 평가 완료
total = chatgpt + grok + claude + gemini
print(f"\n{'='*80}")
print(f"모든 AI 평가 완료!")
print(f"  총 평가: {total}/{TARGET_PER_AI * 4}")
print(f"{'='*80}")

# 검증
print("\n[검증] 평가 결과 검증 중...")
run_command(
    ['python', 'validate_v40_fixed.py',
     '--politician_id', POLITICIAN_ID,
     '--politician_name', POLITICIAN_NAME,
     '--no-dry-run'],
    "검증 실행",
    cwd=CORE_DIR
)

# 점수 계산
print("\n[점수 계산] 점수 계산 중...")
run_command(
    ['python', 'calculate_v40_scores.py',
     '--politician_id', POLITICIAN_ID,
     '--politician_name', POLITICIAN_NAME],
    "점수 계산",
    cwd=CORE_DIR
)

# 보고서 생성
print("\n[보고서] 평가 보고서 생성 중...")
run_command(
    ['python', 'generate_report_v40.py',
     POLITICIAN_ID,
     POLITICIAN_NAME],
    "보고서 생성",
    cwd=CORE_DIR
)

# 완료
print("\n" + "="*80)
print("전체 파이프라인 완료!")
print(f"종료: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)

# 보고서 경로
report_path = V40_DIR / '보고서' / f'{POLITICIAN_NAME}_{datetime.now().strftime("%Y%m%d")}.md'
if report_path.exists():
    print(f"\n[OK] 보고서: {report_path}")
else:
    print(f"\n[WARNING] 보고서 미생성: {report_path}")
