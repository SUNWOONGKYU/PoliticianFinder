#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""수집 진행 상황 모니터링"""

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
TARGET_COUNT = 1000

print("="*80)
print(f"김민석 V30 수집 모니터링 시작")
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
        # collected_data_v30 확인
        result = supabase.table('collected_data_v30')\
            .select('id, collector_ai, category, data_type', count='exact')\
            .eq('politician_id', POLITICIAN_ID)\
            .execute()

        total_count = result.count
        data = result.data

        # AI별 분포
        from collections import Counter
        ai_counts = Counter([d['collector_ai'] for d in data])

        # 카테고리별 분포
        cat_counts = Counter([d['category'] for d in data])

        # data_type별 분포
        type_counts = Counter([d['data_type'] for d in data])

        # 진행률
        progress = (total_count / TARGET_COUNT * 100) if TARGET_COUNT > 0 else 0

        # 증가량
        increase = total_count - last_count

        print(f"총 수집: {total_count}/{TARGET_COUNT}개 ({progress:.1f}%)")
        if increase > 0:
            print(f"증가량: +{increase}개 (지난 체크 대비)")

        print()
        print("AI별 분포:")
        for ai, count in sorted(ai_counts.items(), key=lambda x: -x[1]):
            pct = count / total_count * 100 if total_count > 0 else 0
            print(f"  {ai}: {count}개 ({pct:.1f}%)")

        print()
        print("data_type별 분포:")
        for dtype, count in sorted(type_counts.items()):
            pct = count / total_count * 100 if total_count > 0 else 0
            print(f"  {dtype}: {count}개 ({pct:.1f}%)")

        print()
        print("카테고리별 수집 현황:")
        categories = [
            "expertise", "leadership", "vision", "integrity", "ethics",
            "accountability", "transparency", "communication",
            "responsiveness", "publicinterest"
        ]
        for cat in categories:
            count = cat_counts.get(cat, 0)
            status = "✅" if count >= 100 else "🔄"
            print(f"  {status} {cat}: {count}/100개")

        print()

        # 완료 체크
        if total_count >= TARGET_COUNT:
            print("="*80)
            print("🎉 수집 완료!")
            print("="*80)
            print(f"완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"총 수집: {total_count}개")
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
        print(f"마지막 수집: {last_count}개")
        break

    except Exception as e:
        print(f"❌ 오류: {e}")
        print("5분 후 재시도...")
        time.sleep(300)
