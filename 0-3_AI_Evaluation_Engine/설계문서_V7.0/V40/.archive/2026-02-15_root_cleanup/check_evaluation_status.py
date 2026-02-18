#!/usr/bin/env python3
"""
박주민 평가 현황 상세 확인
- 수집 데이터 개수 (카테고리별)
- 각 AI별 평가 개수 및 평가율
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
ENV_PATH = SCRIPT_DIR / '.env'

# .env 로드
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase credentials not found")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 박주민 ID
POLITICIAN_ID = '8c5dcc89'
POLITICIAN_NAME = '박주민'

CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

print(f"\n{'='*80}")
print(f"박주민 ({POLITICIAN_ID}) - 평가 현황 상세 보고")
print(f"{'='*80}\n")

# 1. 수집 데이터 개수 확인
print("=" * 80)
print("1. 수집 데이터 현황 (collected_data_v40)")
print("=" * 80)

total_collected = 0
collected_by_category = {}

for category in CATEGORIES:
    result = supabase.table('collected_data_v40').select(
        'id', count='exact'
    ).eq(
        'politician_id', POLITICIAN_ID
    ).eq(
        'category', category
    ).execute()

    count = result.count or 0
    collected_by_category[category] = count
    total_collected += count

    print(f"{category:20s}: {count:4d}개")

print(f"\n총 수집 데이터: {total_collected}개")

# 2. AI별 평가 개수 확인
print(f"\n{'='*80}")
print("2. AI별 평가 현황 (evaluations_v40)")
print("=" * 80)

AIS = ['Claude', 'ChatGPT', 'Gemini', 'Grok']

ai_totals = {}
ai_by_category = {ai: {} for ai in AIS}

for ai in AIS:
    print(f"\n[{ai}]")
    total_ai = 0

    for category in CATEGORIES:
        result = supabase.table('evaluations_v40').select(
            'id', count='exact'
        ).eq(
            'politician_id', POLITICIAN_ID
        ).eq(
            'category', category
        ).eq(
            'evaluator_ai', ai
        ).execute()

        count = result.count or 0
        ai_by_category[ai][category] = count
        total_ai += count

        collected = collected_by_category.get(category, 0)
        rate = (count / collected * 100) if collected > 0 else 0

        print(f"  {category:20s}: {count:4d}/{collected:4d} ({rate:5.1f}%)")

    ai_totals[ai] = total_ai
    overall_rate = (total_ai / total_collected * 100) if total_collected > 0 else 0
    print(f"  {'총계':20s}: {total_ai:4d}/{total_collected:4d} ({overall_rate:5.1f}%)")

# 3. 전체 요약
print(f"\n{'='*80}")
print("3. 전체 평가율 요약")
print("=" * 80)

for ai in AIS:
    total = ai_totals[ai]
    rate = (total / total_collected * 100) if total_collected > 0 else 0
    status = "✅" if rate >= 95 else "⚠️" if rate >= 90 else "❌"
    print(f"{status} {ai:10s}: {total:4d}/{total_collected:4d} = {rate:5.1f}%")

print(f"\n{'='*80}")
print("4. 카테고리별 상세 비교")
print("=" * 80)

print(f"\n{'Category':<20s} {'Collected':<10s} {'Claude':<10s} {'ChatGPT':<10s} {'Gemini':<10s} {'Grok':<10s}")
print("-" * 80)

for category in CATEGORIES:
    collected = collected_by_category[category]
    line = f"{category:<20s} {collected:<10d}"

    for ai in AIS:
        count = ai_by_category[ai].get(category, 0)
        rate = (count / collected * 100) if collected > 0 else 0
        line += f" {count:3d}({rate:4.1f}%) "

    print(line)

print("\n")
