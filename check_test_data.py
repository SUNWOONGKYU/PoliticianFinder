#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V30 테스트 데이터 확인 스크립트
"""

import os
from supabase import create_client, Client

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print("=" * 80)
    print("V30 테스트 데이터 확인")
    print("=" * 80)

    politician_id = "d0a5d6e1"  # 조은희

    # 전체 개수
    print("\n[전체 개수]")
    response = supabase.table("collected_data_v30")\
        .select("*", count="exact")\
        .eq("politician_id", politician_id)\
        .execute()

    total_count = response.count or 0
    print(f"  총 {total_count}개")

    if total_count == 0:
        print("\n데이터가 없습니다.")
        return

    # AI별 개수
    print("\n[AI별 개수]")
    for ai_name in ['Gemini', 'Perplexity', 'Grok']:
        ai_response = supabase.table("collected_data_v30")\
            .select("*", count="exact")\
            .eq("politician_id", politician_id)\
            .eq("collector_ai", ai_name)\
            .execute()
        print(f"  - {ai_name}: {ai_response.count}개")

    # sentiment별 개수
    print("\n[Sentiment별 개수]")
    for sentiment in ['negative', 'positive', 'neutral']:
        s_response = supabase.table("collected_data_v30")\
            .select("*", count="exact")\
            .eq("politician_id", politician_id)\
            .eq("sentiment", sentiment)\
            .execute()
        print(f"  - {sentiment}: {s_response.count}개")

    # 카테고리별 개수
    print("\n[카테고리별 개수]")
    categories = ['expertise', 'leadership', 'vision', 'integrity', 'ethics',
                  'consistency', 'crisis', 'communication', 'responsiveness', 'publicinterest']
    for cat in categories:
        cat_response = supabase.table("collected_data_v30")\
            .select("*", count="exact")\
            .eq("politician_id", politician_id)\
            .eq("category", cat)\
            .execute()
        if cat_response.count and cat_response.count > 0:
            print(f"  - {cat}: {cat_response.count}개")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
