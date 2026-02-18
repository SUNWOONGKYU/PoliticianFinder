#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""현재 평가 진행 상황 즉시 확인"""

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

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

POLITICIAN_ID = 'f9e00370'
TARGET = 4000

print("="*80)
print(f"📊 김민석 평가 진행 상황 - {datetime.now().strftime('%H:%M:%S')}")
print("="*80)
print()

try:
    result = supabase.table('evaluations_v30')\
        .select('id, evaluator_ai, category', count='exact')\
        .eq('politician_id', POLITICIAN_ID)\
        .execute()

    total = result.count
    data = result.data

    progress = (total / TARGET * 100) if TARGET > 0 else 0

    print(f"✅ 총 평가: {total}/{TARGET}개 ({progress:.1f}%)")
    print()

    if total > 0:
        ai_counts = Counter([d['evaluator_ai'] for d in data])
        print("AI별 평가:")
        for ai in ["Claude", "ChatGPT", "Gemini", "Grok"]:
            count = ai_counts.get(ai, 0)
            pct = count / 1000 * 100 if count > 0 else 0
            status = "✅" if count >= 1000 else "🔄"
            print(f"  {status} {ai}: {count}/1,000개 ({pct:.1f}%)")
        print()

        cat_counts = Counter([d['category'] for d in data])
        print("카테고리별 평가:")
        categories = [
            "expertise", "leadership", "vision", "integrity", "ethics",
            "accountability", "transparency", "communication",
            "responsiveness", "publicinterest"
        ]
        for cat in categories:
            count = cat_counts.get(cat, 0)
            status = "✅" if count >= 400 else "🔄"
            print(f"  {status} {cat}: {count}/400개")
    else:
        print("아직 평가 시작 전입니다...")

    print()
    print("="*80)

except Exception as e:
    print(f"❌ 오류: {e}")
    print("="*80)
