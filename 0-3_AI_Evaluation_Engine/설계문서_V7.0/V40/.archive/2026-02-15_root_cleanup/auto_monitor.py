#!/usr/bin/env python3
"""
박주민 평가 자동 모니터링
"""

import os
import sys
import time
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

POLITICIAN_ID = '8c5dcc89'

supabase: Client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

def get_progress():
    """현재 진행 상황 조회"""
    result = supabase.table('evaluations_v40').select('evaluator_ai').eq('politician_id', POLITICIAN_ID).execute()

    total = len(result.data)
    ai_counts = {}
    for item in result.data:
        ai = item['evaluator_ai']
        ai_counts[ai] = ai_counts.get(ai, 0) + 1

    return total, ai_counts

print("="*80)
print(f"박주민({POLITICIAN_ID}) 평가 자동 모니터링")
print("="*80)

prev_total = 0
start_time = time.time()

for i in range(240):  # 최대 240회 (2시간)
    total, ai_counts = get_progress()

    elapsed = int(time.time() - start_time)
    speed = (total - prev_total) / 30 if i > 0 else 0  # 평가/초

    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] ({elapsed}초 경과)")
    print(f"  전체: {total}/5100 ({total/51:.1f}%)")

    for ai in ['Claude', 'ChatGPT', 'Gemini', 'Grok']:
        count = ai_counts.get(ai, 0)
        status = "✓" if count >= 1275 else " "
        print(f"  [{status}] {ai:10s}: {count:4d}/1275 ({count/12.75:.1f}%)")

    if speed > 0:
        remaining = (5100 - total) / (speed * 60)  # 남은 시간 (분)
        print(f"  속도: {speed*60:.1f}개/분, 남은 시간: 약 {remaining:.0f}분")

    prev_total = total

    # 완료 확인
    if total >= 5100:
        print("\n" + "="*80)
        print("모든 AI 평가 완료!")
        print("="*80)
        break

    # 30초 대기
    time.sleep(30)

print("\n모니터링 종료")
