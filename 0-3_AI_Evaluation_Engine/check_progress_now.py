#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""현재 수집 진행 상황 즉시 확인"""

import sys
import os
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
from collections import Counter

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
TARGET_COUNT = 1000

print("="*80)
print(f"📊 김민석 수집 진행 상황 - {datetime.now().strftime('%H:%M:%S')}")
print("="*80)
print()

try:
    # collected_data_v30 확인
    result = supabase.table('collected_data_v30')\
        .select('id, collector_ai, category, data_type', count='exact')\
        .eq('politician_id', POLITICIAN_ID)\
        .execute()

    total_count = result.count
    data = result.data

    # 진행률
    progress = (total_count / TARGET_COUNT * 100) if TARGET_COUNT > 0 else 0

    print(f"✅ 총 수집: {total_count}/{TARGET_COUNT}개 ({progress:.1f}%)")
    print()

    if total_count > 0:
        # AI별 분포
        ai_counts = Counter([d['collector_ai'] for d in data])
        print("AI별 분포:")
        for ai, count in sorted(ai_counts.items(), key=lambda x: -x[1]):
            pct = count / total_count * 100
            print(f"  {ai}: {count}개 ({pct:.1f}%)")
        print()

        # data_type별 분포
        type_counts = Counter([d['data_type'] for d in data])
        print("data_type별 분포:")
        for dtype, count in sorted(type_counts.items()):
            pct = count / total_count * 100
            print(f"  {dtype}: {count}개 ({pct:.1f}%)")
        print()

        # 카테고리별 수집 현황
        cat_counts = Counter([d['category'] for d in data])
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
    else:
        print("아직 수집 시작 전입니다...")

    print()
    print("="*80)

except Exception as e:
    print(f"❌ 오류: {e}")
    print("="*80)
