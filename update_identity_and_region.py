#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
출마 신분 및 출마지역 수정 스크립트
- 현직 2명 → 출마예정자로 변경 (오세훈, 정원오)
- 정원오 출마지역: "서울특별시 성동구" → "서울특별시"
"""

import os
import sys

# Windows 인코딩 문제 해결
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from supabase import create_client, Client

# Supabase 설정
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set")
    exit(1)

# Supabase 클라이언트 생성
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def update_identity_to_candidate(politician_id: str, name: str):
    """identity를 출마예정자로 변경"""
    try:
        # 현재 데이터 확인
        response = supabase.table("politicians").select("id, name, identity").eq("id", politician_id).execute()

        if not response.data:
            print(f"NOT FOUND: {name} (ID: {politician_id})")
            return False

        current = response.data[0]
        print(f"\nBefore - {name}:")
        print(f"   Identity: {current.get('identity', 'None')}")

        # identity 업데이트
        update_response = supabase.table("politicians").update({
            "identity": "출마예정자"
        }).eq("id", politician_id).execute()

        if update_response.data:
            print(f"SUCCESS: Updated to 출마예정자")
            return True
        else:
            print(f"FAILED")
            return False

    except Exception as e:
        print(f"ERROR: {e}")
        return False

def update_region(politician_id: str, name: str, new_region: str):
    """출마지역 수정"""
    try:
        # 현재 데이터 확인
        response = supabase.table("politicians").select("id, name, region, district").eq("id", politician_id).execute()

        if not response.data:
            print(f"NOT FOUND: {name} (ID: {politician_id})")
            return False

        current = response.data[0]
        print(f"\nBefore - {name}:")
        print(f"   Region: {current.get('region', 'None')}")
        print(f"   District: {current.get('district', 'None')}")

        # region 업데이트
        update_response = supabase.table("politicians").update({
            "region": new_region
        }).eq("id", politician_id).execute()

        if update_response.data:
            print(f"SUCCESS: Updated region to {new_region}")
            return True
        else:
            print(f"FAILED")
            return False

    except Exception as e:
        print(f"ERROR: {e}")
        return False

def check_identity_stats():
    """출마 신분별 통계 확인"""
    try:
        print("\n" + "=" * 60)
        print("Identity Statistics Check")
        print("=" * 60)

        response = supabase.table("politicians").select("identity").execute()

        from collections import Counter
        counter = Counter([p['identity'] for p in response.data])

        print(f"\nTotal politicians: {len(response.data)}")
        print("\nBy identity:")
        for identity, count in sorted(counter.items()):
            print(f"  {identity}: {count}")

    except Exception as e:
        print(f"ERROR: {e}")

def main():
    print("=" * 60)
    print("Update Identity and Region Script")
    print("=" * 60)

    # 1. 현재 상태 확인
    check_identity_stats()

    print("\n" + "=" * 60)
    print("Starting Updates")
    print("=" * 60)

    # 2. 오세훈 identity 변경
    success1 = update_identity_to_candidate(
        politician_id="62e7b453",
        name="오세훈"
    )

    # 3. 정원오 identity 변경 + region 변경
    success2 = update_identity_to_candidate(
        politician_id="17270f25",
        name="정원오"
    )

    success3 = update_region(
        politician_id="17270f25",
        name="정원오",
        new_region="서울특별시"
    )

    print("\n" + "=" * 60)
    print("Update Complete")
    print("=" * 60)

    if success1 and success2 and success3:
        print("SUCCESS: All updates completed!")
    else:
        print("WARNING: Some updates failed")

    # 4. 최종 확인
    check_identity_stats()

if __name__ == "__main__":
    main()
