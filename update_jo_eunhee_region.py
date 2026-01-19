#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
조은희 출마지역 수정 스크립트
- region: "인천" → "서울특별시"
"""

import os
from supabase import create_client, Client

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print("=" * 80)
    print("조은희 출마지역 수정")
    print("=" * 80)

    politician_id = "d0a5d6e1"  # 조은희

    # 현재 데이터 확인
    print("\n[Before] 현재 데이터:")
    response = supabase.table("politicians").select("*").eq("id", politician_id).execute()

    if not response.data:
        print(f"ERROR: 정치인을 찾을 수 없습니다 (ID: {politician_id})")
        return

    current = response.data[0]
    print(f"  이름: {current['name']}")
    print(f"  출마지역: {current.get('region', 'N/A')}")
    print(f"  현재직책: {current.get('position', 'N/A')}")

    # 수정 실행
    print("\n[Update] 수정 중...")
    update_response = supabase.table("politicians").update({
        "region": "서울특별시"
    }).eq("id", politician_id).execute()

    if update_response.data:
        print("  [OK] Update Complete")
    else:
        print("  [ERROR] Update Failed")
        return

    # 수정 후 확인
    print("\n[After] 수정 후 데이터:")
    verify_response = supabase.table("politicians").select("*").eq("id", politician_id).execute()

    if verify_response.data:
        updated = verify_response.data[0]
        print(f"  이름: {updated['name']}")
        print(f"  출마지역: {updated.get('region', 'N/A')}")
        print(f"  현재직책: {updated.get('position', 'N/A')}")

    print("\n" + "=" * 80)
    print("수정 완료")
    print("=" * 80)

if __name__ == "__main__":
    main()
