#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V30 테스트 데이터 삭제 스크립트
- 조은희 (d0a5d6e1) 테스트 수집 데이터 삭제
"""

import os
from supabase import create_client, Client

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print("=" * 80)
    print("V30 테스트 데이터 삭제")
    print("=" * 80)

    politician_id = "d0a5d6e1"  # 조은희

    # 현재 데이터 확인
    print("\n[Before] 삭제 전 데이터 개수:")
    response = supabase.table("collected_data_v30")\
        .select("*", count="exact")\
        .eq("politician_id", politician_id)\
        .execute()

    if response.count == 0:
        print("  삭제할 데이터가 없습니다.")
        return

    print(f"  총 {response.count}개 항목 발견")

    # AI별 개수
    for ai_name in ['Gemini', 'Perplexity', 'Grok']:
        ai_response = supabase.table("collected_data_v30")\
            .select("*", count="exact")\
            .eq("politician_id", politician_id)\
            .eq("collector_ai", ai_name)\
            .execute()
        print(f"  - {ai_name}: {ai_response.count}개")

    # 삭제 실행
    print("\n[Delete] 삭제 중...")
    delete_response = supabase.table("collected_data_v30")\
        .delete()\
        .eq("politician_id", politician_id)\
        .execute()

    print("  [OK] 삭제 완료")

    # 삭제 후 확인
    print("\n[After] 삭제 후 데이터 개수:")
    verify_response = supabase.table("collected_data_v30")\
        .select("*", count="exact")\
        .eq("politician_id", politician_id)\
        .execute()

    print(f"  남은 항목: {verify_response.count}개")

    print("\n" + "=" * 80)
    print("삭제 완료")
    print("=" * 80)

if __name__ == "__main__":
    main()
