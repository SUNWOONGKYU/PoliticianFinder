#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V30 수집 진행 상황 모니터링
"""

import os
import sys
import time
from collections import defaultdict
from supabase import create_client, Client

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_collection_status(politician_id):
    """수집 진행 상황 조회"""
    response = supabase.table("collected_data_v30")\
        .select("category, collector_ai, sentiment, data_type")\
        .eq("politician_id", politician_id)\
        .execute()

    data = response.data
    total = len(data)

    # 카테고리별 집계
    categories = defaultdict(lambda: {'total': 0, 'ai': defaultdict(int)})

    for item in data:
        cat = item['category']
        ai = item['collector_ai']
        categories[cat]['total'] += 1
        categories[cat]['ai'][ai] += 1

    return total, categories

def main():
    politician_id = "d0a5d6e1"  # 조은희
    target_total = 1000
    target_per_category = 100

    print("=" * 80)
    print("V30 수집 진행 상황 모니터링")
    print("=" * 80)
    print(f"목표: {target_total}개 (카테고리당 {target_per_category}개)")
    print("-" * 80)

    prev_total = 0

    while True:
        total, categories = get_collection_status(politician_id)

        # 변화가 있을 때만 출력
        if total != prev_total:
            os.system('cls' if os.name == 'nt' else 'clear')

            print("=" * 80)
            print(f"V30 수집 진행 중 - 조은희")
            print("=" * 80)
            print(f"전체: {total}/{target_total}개 ({total/target_total*100:.1f}%)")
            print("-" * 80)

            # 카테고리별 상세
            cat_names = ['expertise', 'leadership', 'vision', 'integrity', 'ethics',
                        'consistency', 'crisis', 'communication', 'responsiveness', 'publicinterest']

            completed = 0
            for cat_name in cat_names:
                if cat_name in categories:
                    cat_data = categories[cat_name]
                    cat_total = cat_data['total']
                    g = cat_data['ai'].get('Gemini', 0)
                    p = cat_data['ai'].get('Perplexity', 0)
                    k = cat_data['ai'].get('Grok', 0)

                    status = "✅" if cat_total >= target_per_category else "⏳"
                    if cat_total >= target_per_category:
                        completed += 1

                    print(f"{status} {cat_name:16} {cat_total:3}/{target_per_category} (G:{g:2} P:{p:2} K:{k:2})")
                else:
                    print(f"⏳ {cat_name:16}   0/{target_per_category} (G: 0 P: 0 K: 0)")

            print("-" * 80)
            print(f"완료: {completed}/10 카테고리")
            print(f"마지막 업데이트: {time.strftime('%H:%M:%S')}")
            print("=" * 80)

            prev_total = total

            # 완료 체크
            if total >= target_total:
                print("\n🎉 수집 완료!")
                break

        time.sleep(5)  # 5초마다 확인

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n모니터링 중단됨")
