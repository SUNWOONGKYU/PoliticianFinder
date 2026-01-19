#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V30 테스트 데이터 상세 분석
"""

import os
from collections import defaultdict
from supabase import create_client, Client

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print("=" * 80)
    print("V30 테스트 데이터 상세 분석")
    print("=" * 80)

    politician_id = "d0a5d6e1"  # 조은희

    # 전체 데이터 가져오기
    response = supabase.table("collected_data_v30")\
        .select("category, collector_ai, sentiment, data_type")\
        .eq("politician_id", politician_id)\
        .execute()

    data = response.data
    if not data:
        print("\n데이터가 없습니다.")
        return

    # 카테고리별 분석
    categories = defaultdict(lambda: {'total': 0, 'ai': defaultdict(int), 'sentiment': defaultdict(int)})

    for item in data:
        cat = item['category']
        ai = item['collector_ai']
        sent = item['sentiment']

        categories[cat]['total'] += 1
        categories[cat]['ai'][ai] += 1
        categories[cat]['sentiment'][sent] += 1

    # 출력
    print("\n[카테고리별 상세 분석]")
    print("-" * 80)

    for cat_name in sorted(categories.keys()):
        cat_data = categories[cat_name]
        total = cat_data['total']

        print(f"\n{cat_name}: {total}개")
        print(f"  AI: Gemini={cat_data['ai'].get('Gemini', 0)}, " +
              f"Perplexity={cat_data['ai'].get('Perplexity', 0)}, " +
              f"Grok={cat_data['ai'].get('Grok', 0)}")
        print(f"  Sentiment: negative={cat_data['sentiment'].get('negative', 0)}, " +
              f"positive={cat_data['sentiment'].get('positive', 0)}, " +
              f"neutral={cat_data['sentiment'].get('neutral', 0)}")

    # 테스트 기대치 비교
    print("\n" + "=" * 80)
    print("테스트 목표 (카테고리당 10개)")
    print("-" * 80)
    print("  AI 배분: Gemini 6, Perplexity 3, Grok 1")
    print("  Sentiment: negative 2, positive 2, neutral 6")
    print("\n실제 결과:")
    print(f"  총 {len(data)}개 수집됨")

    completed_categories = [cat for cat, stats in categories.items() if stats['total'] == 10]
    print(f"  완료된 카테고리: {len(completed_categories)}개")
    if completed_categories:
        print(f"    {', '.join(completed_categories)}")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
