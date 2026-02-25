#!/usr/bin/env python3
"""
journalist_contacts 테이블 상태 확인
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# 환경 설정
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
V40_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
load_dotenv(os.path.join(V40_DIR, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 70)
print("기자 명단(journalist_contacts) 상태 확인")
print("=" * 70)

try:
    # 전체 기자 수
    print("\n[*] 전체 기자 수 조회 중...")
    result = supabase.table("journalist_contacts").select("*", count="exact").execute()
    total = len(result.data) if result.data else 0
    print(f"[OK] 전체: {total}명")

    # 지역 유형별 분류
    print("\n[>>] 지역 유형별 분류:")
    metro_result = supabase.table("journalist_contacts").select("*", count="exact").eq("region_type", "광역").execute()
    metro_count = len(metro_result.data) if metro_result.data else 0

    basic_result = supabase.table("journalist_contacts").select("*", count="exact").eq("region_type", "기초").execute()
    basic_count = len(basic_result.data) if basic_result.data else 0

    print(f"  - 광역: {metro_count}명")
    print(f"  - 기초: {basic_count}명")

    # 이메일 보유 현황
    print("\n[>>] 이메일 보유 현황:")
    all_data = supabase.table("journalist_contacts").select("email", count="exact").execute()
    with_email = sum(1 for record in all_data.data if record.get('email'))
    without_email = total - with_email

    print(f"  - 이메일 있음: {with_email}명 ({with_email*100//total if total > 0 else 0}%)")
    print(f"  - 이메일 없음: {without_email}명 ({without_email*100//total if total > 0 else 0}%)")

    # 지역별 상위 10개
    print("\n[>>] 지역별 기자 수 (상위 10개):")
    region_data = supabase.table("journalist_contacts").select("region, COUNT(*)", count="exact").execute()

    # 수동으로 카운트
    from collections import Counter
    region_counts = Counter()
    if result.data:
        for record in result.data:
            region = record.get('region', '미분류')
            region_counts[region] += 1

    for region, count in region_counts.most_common(10):
        print(f"  - {region}: {count}명")

    # 언론사 상위 10개
    print("\n[>>] 언론사 (상위 10개):")
    media_counts = Counter()
    if result.data:
        for record in result.data:
            media = record.get('media_outlet', '미분류')
            media_counts[media] += 1

    for media, count in media_counts.most_common(10):
        print(f"  - {media}: {count}명")

    # 샘플 데이터 출력
    print("\n[>>] 샘플 데이터 (처음 3명):")
    sample_result = supabase.table("journalist_contacts").select("*").limit(3).execute()
    for i, record in enumerate(sample_result.data, 1):
        print(f"\n  [{i}]")
        print(f"    지역유형: {record.get('region_type')}")
        print(f"    지역: {record.get('region')}")
        print(f"    언론사: {record.get('media_outlet')}")
        print(f"    이름: {record.get('journalist_name')}")
        print(f"    이메일: {record.get('email') or '없음'}")

except Exception as e:
    print(f"\n[NG] 오류: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
