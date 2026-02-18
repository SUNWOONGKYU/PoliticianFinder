#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""평가 진행 상황 모니터링"""

import sys
import os
import time
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except AttributeError:
        pass

load_dotenv(override=True)

# Supabase 연결
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

POLITICIAN_ID = 'f9e00370'
POLITICIAN_NAME = '김민석'
TARGET_COUNT = 4000  # 1,000개 × 4개 AI

print("="*80)
print(f"김민석 V30 평가 모니터링 시작")
print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)
print()

check_count = 0
last_count = 0

while True:
    check_count += 1
    current_time = datetime.now().strftime('%H:%M:%S')

    print(f"[{current_time}] 📊 {check_count}번째 체크")
    print("-" * 80)

    try:
        # evaluations_v30 확인
        result = supabase.table('evaluations_v30')\
            .select('id, evaluator_ai, category, rating', count='exact')\
            .eq('politician_id', POLITICIAN_ID)\
            .execute()

        total_count = result.count
        data = result.data

        # AI별 분포
        from collections import Counter
        ai_counts = Counter([d['evaluator_ai'] for d in data])

        # 카테고리별 분포
        cat_counts = Counter([d['category'] for d in data])

        # 진행률
        progress = (total_count / TARGET_COUNT * 100) if TARGET_COUNT > 0 else 0

        # 증가량
        increase = total_count - last_count

        print(f"총 평가: {total_count}/{TARGET_COUNT}개 ({progress:.1f}%)")
        if increase > 0:
            print(f"증가량: +{increase}개 (지난 체크 대비)")

        print()
        print("AI별 평가:")
        for ai in ["Claude", "ChatGPT", "Gemini", "Grok"]:
            count = ai_counts.get(ai, 0)
            target_per_ai = 1000
            pct = count / target_per_ai * 100 if target_per_ai > 0 else 0
            status = "✅" if count >= target_per_ai else "🔄"
            print(f"  {status} {ai}: {count}/{target_per_ai}개 ({pct:.1f}%)")

        print()
        print("카테고리별 평가 현황:")
        categories = [
            "expertise", "leadership", "vision", "integrity", "ethics",
            "accountability", "transparency", "communication",
            "responsiveness", "publicinterest"
        ]
        for cat in categories:
            count = cat_counts.get(cat, 0)
            target_per_cat = 400  # 100개 × 4 AI
            status = "✅" if count >= target_per_cat else "🔄"
            print(f"  {status} {cat}: {count}/{target_per_cat}개")

        print()

        # 완료 체크
        if total_count >= TARGET_COUNT:
            print("="*80)
            print("🎉 평가 완료!")
            print("="*80)
            print(f"완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"총 평가: {total_count}개")
            break

        last_count = total_count

        # 5분 대기
        print(f"다음 체크까지 5분 대기... (Ctrl+C로 중단 가능)")
        print("="*80)
        print()
        time.sleep(300)  # 5분 = 300초

    except KeyboardInterrupt:
        print()
        print("="*80)
        print("모니터링 중단")
        print("="*80)
        print(f"마지막 평가: {last_count}개")
        break

    except Exception as e:
        print(f"❌ 오류: {e}")
        print("5분 후 재시도...")
        time.sleep(300)
