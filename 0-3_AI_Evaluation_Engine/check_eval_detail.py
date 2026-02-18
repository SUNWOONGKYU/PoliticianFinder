#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""평가 상세 확인"""

import sys
import os
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

print("="*80)
print("평가 상세 확인")
print("="*80)
print()

# 전체 평가 개수
result = supabase.table('evaluations_v30')\
    .select('*', count='exact')\
    .eq('politician_id', POLITICIAN_ID)\
    .execute()

total = result.count
data = result.data

print(f"총 평가: {total}개")
print()

if total > 0:
    # AI별
    ai_counts = Counter([d['evaluator_ai'] for d in data])
    print("AI별:")
    for ai in ["Claude", "ChatGPT", "Gemini", "Grok"]:
        count = ai_counts.get(ai, 0)
        print(f"  {ai}: {count}개")
    print()

    # 카테고리별
    cat_counts = Counter([d['category'] for d in data])
    print("카테고리별:")
    categories = [
        "expertise", "leadership", "vision", "integrity", "ethics",
        "accountability", "transparency", "communication",
        "responsiveness", "publicinterest"
    ]
    for cat in categories:
        count = cat_counts.get(cat, 0)
        print(f"  {cat}: {count}개")
    print()

    # AI × 카테고리별 매트릭스
    print("AI × 카테고리 매트릭스:")
    print(f"{'카테고리':<15} {'Claude':>8} {'ChatGPT':>8} {'Gemini':>8} {'Grok':>8} {'합계':>8}")
    print("-" * 70)

    for cat in categories:
        cat_data = [d for d in data if d['category'] == cat]
        cat_ai_counts = Counter([d['evaluator_ai'] for d in cat_data])

        claude = cat_ai_counts.get('Claude', 0)
        chatgpt = cat_ai_counts.get('ChatGPT', 0)
        gemini = cat_ai_counts.get('Gemini', 0)
        grok = cat_ai_counts.get('Grok', 0)
        total_cat = claude + chatgpt + gemini + grok

        print(f"{cat:<15} {claude:>8} {chatgpt:>8} {gemini:>8} {grok:>8} {total_cat:>8}")

    print()

print("="*80)
