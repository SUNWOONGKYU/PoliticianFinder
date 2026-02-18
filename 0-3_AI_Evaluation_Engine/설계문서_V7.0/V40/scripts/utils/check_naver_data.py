#!/usr/bin/env python3
"""
박주민 네이버 수집 데이터 확인
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
ENV_PATH = SCRIPT_DIR.parent.parent / '.env'

# .env 파일 로드
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)

# Supabase 클라이언트
from supabase import create_client, Client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*60)
print("박주민 네이버 수집 데이터 확인")
print("="*60 + "\n")

# 1. collected_data_v40 전체 상태
print("[1] collected_data_v40 전체 상태")
print("-"*60)

try:
    count_result = supabase.table('collected_data_v40').select('id', count='exact').execute()
    total_count = count_result.count if hasattr(count_result, 'count') else 0

    print(f"총 레코드 수: {total_count}")

    if total_count > 0:
        print("\n데이터 있음 - 상세 확인 중...")
    else:
        print("\n[WARNING] 데이터 없음 (복원 안 됨)")
        print("\n종료...")
        sys.exit(0)

except Exception as e:
    print(f"[ERROR] 조회 실패: {e}")
    sys.exit(1)

print()

# 2. 박주민 데이터 확인
print("[2] 박주민 데이터 확인")
print("-"*60)

try:
    park = supabase.table('collected_data_v40').select('*').eq('politician_name', '박주민').execute()

    if park.data:
        count_result = supabase.table('collected_data_v40').select('id', count='exact').eq('politician_name', '박주민').execute()
        park_count = count_result.count if hasattr(count_result, 'count') else len(park.data)

        print(f"[OK] 박주민 데이터: {park_count}개")
    else:
        print("[WARNING] 박주민 데이터 없음")
        print("\n다른 이름으로 저장되었을 가능성 확인 중...")

        # politician_id로 재확인
        park_id = '8c5dcc89'
        park_by_id = supabase.table('collected_data_v40').select('*').eq('politician_id', park_id).execute()

        if park_by_id.data:
            count_result = supabase.table('collected_data_v40').select('id', count='exact').eq('politician_id', park_id).execute()
            park_count = count_result.count if hasattr(count_result, 'count') else len(park_by_id.data)

            print(f"[OK] 박주민 데이터 (ID로 검색): {park_count}개")
            park = park_by_id
        else:
            print("[ERROR] 박주민 데이터 전혀 없음")
            sys.exit(0)

except Exception as e:
    print(f"[ERROR] 조회 실패: {e}")
    sys.exit(1)

print()

# 3. 네이버 데이터 확인
print("[3] 네이버 수집 데이터 확인 (박주민)")
print("-"*60)

# data_type 필드로 확인
try:
    naver_data = supabase.table('collected_data_v40').select('*').eq('politician_name', '박주민').eq('data_type', 'naver').execute()

    if naver_data.data:
        count_result = supabase.table('collected_data_v40').select('id', count='exact').eq('politician_name', '박주민').eq('data_type', 'naver').execute()
        naver_count = count_result.count if hasattr(count_result, 'count') else len(naver_data.data)

        print(f"[OK] 박주민 네이버 데이터: {naver_count}개")

        # 샘플 출력
        print("\n샘플 (최대 5개):")
        for item in naver_data.data[:5]:
            print(f"  - {item.get('event_date', 'N/A')}")
            print(f"    제목: {item.get('title', 'N/A')[:50]}")
            print(f"    카테고리: {item.get('category', 'N/A')}")
            print(f"    data_type: {item.get('data_type', 'N/A')}")
            print()
    else:
        print("[INFO] 박주민 네이버 데이터 없음 (data_type='naver')")

        # source 필드로 재확인
        naver_source = supabase.table('collected_data_v40').select('*').eq('politician_name', '박주민').eq('source', 'naver').execute()

        if not naver_source.data:
            naver_source = supabase.table('collected_data_v40').select('*').eq('politician_name', '박주민').eq('source', 'naver_api').execute()

        if naver_source.data:
            count_result = supabase.table('collected_data_v40').select('id', count='exact').eq('politician_name', '박주민').ilike('source', '%naver%').execute()
            naver_count = count_result.count if hasattr(count_result, 'count') else len(naver_source.data)

            print(f"[OK] 박주민 네이버 데이터 (source 필드): {naver_count}개")
        else:
            print("[WARNING] 박주민 네이버 데이터 전혀 없음")

except Exception as e:
    print(f"[ERROR] 조회 실패: {e}")

print()

# 4. 박주민 데이터 상세 분석
print("[4] 박주민 데이터 상세 분석")
print("-"*60)

if park.data:
    # 카테고리별 분포
    print("카테고리별 분포:")
    categories = {}
    for item in park.data:
        cat = item.get('category', 'unknown')
        categories[cat] = categories.get(cat, 0) + 1

    for cat, count in sorted(categories.items()):
        print(f"  - {cat}: {count}개")

    print()

    # data_type 분포
    print("data_type 분포:")
    data_types = {}
    for item in park.data:
        dt = item.get('data_type', 'unknown')
        data_types[dt] = data_types.get(dt, 0) + 1

    for dt, count in sorted(data_types.items()):
        print(f"  - {dt}: {count}개")

    print()

    # source 분포
    print("source 분포:")
    sources = {}
    for item in park.data:
        src = item.get('source', 'unknown')
        sources[src] = sources.get(src, 0) + 1

    for src, count in sorted(sources.items()):
        print(f"  - {src}: {count}개")

print()

# 5. 요약
print("="*60)
print("요약")
print("="*60 + "\n")

if park.data:
    park_total = len(park.data)
    naver_in_park = sum(1 for item in park.data if 'naver' in str(item.get('data_type', '')).lower() or 'naver' in str(item.get('source', '')).lower())

    print(f"박주민 전체 데이터: {park_total}개")
    print(f"박주민 네이버 데이터: {naver_in_park}개")

    if naver_in_park > 0:
        print("\n[OK] 네이버 수집 데이터 복원됨!")
    else:
        print("\n[WARNING] 네이버 수집 데이터 없음")
        print("  - Gemini CLI 수집 데이터만 있을 가능성")
        print("  - 네이버 재수집 필요")
else:
    print("[ERROR] 박주민 데이터 없음")

print()
