#!/usr/bin/env python3
"""
실제 V40 테이블 이름으로 확인
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
print("실제 V40 테이블 확인")
print("="*60 + "\n")

# 실제 테이블 이름들 (delete_all_v40_data.py 기준)
actual_tables = [
    'collected_data_v40',
    'ai_category_scores_v40',
    'ai_final_scores_v40'
]

print("[1] V40 테이블 존재 확인")
print("-"*60)

tables_found = {}

for table_name in actual_tables:
    try:
        result = supabase.table(table_name).select('id').limit(1).execute()

        # 레코드 수 확인
        count_result = supabase.table(table_name).select('id', count='exact').execute()
        count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)

        tables_found[table_name] = count
        print(f"[OK] {table_name}: {count:,} 레코드")
    except Exception as e:
        tables_found[table_name] = None
        error_msg = str(e)
        if 'PGRST205' in error_msg:
            print(f"[ERROR] {table_name}: 테이블 없음")
        else:
            print(f"[ERROR] {table_name}: {error_msg[:50]}")

print()

# 2. 조은희 데이터 확인
print("[2] 조은희 데이터 확인")
print("-"*60)

if tables_found.get('collected_data_v40'):
    try:
        # 조은희 데이터 검색
        joheunhee = supabase.table('collected_data_v40').select('*').ilike('politician_name', '%조은희%').limit(5).execute()

        if joheunhee.data:
            print(f"[OK] 조은희 데이터 발견: {len(joheunhee.data)}개 (샘플)")

            # 전체 개수
            count_result = supabase.table('collected_data_v40').select('id', count='exact').ilike('politician_name', '%조은희%').execute()
            total_count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)
            print(f"[OK] 조은희 전체 데이터: {total_count:,}개")

            # 샘플 출력
            print("\n샘플:")
            for item in joheunhee.data[:3]:
                print(f"  - {item.get('event_date', 'N/A')} | {item.get('category', 'N/A')} | {item.get('title', 'N/A')[:40]}")
        else:
            print("[WARNING] 조은희 데이터 없음")
    except Exception as e:
        print(f"[ERROR] 조회 실패: {e}")
else:
    print("[SKIP] collected_data_v40 테이블 없음")

print()

# 3. 네이버 데이터 확인
print("[3] 네이버 수집 데이터 확인")
print("-"*60)

if tables_found.get('collected_data_v40'):
    try:
        # data_type으로 검색
        naver = supabase.table('collected_data_v40').select('*').eq('data_type', 'naver').limit(5).execute()

        if naver.data:
            print(f"[OK] 네이버 데이터 발견: {len(naver.data)}개 (샘플)")

            # 전체 개수
            count_result = supabase.table('collected_data_v40').select('id', count='exact').eq('data_type', 'naver').execute()
            total_count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)
            print(f"[OK] 네이버 전체 데이터: {total_count:,}개")
        else:
            print("[WARNING] 네이버 데이터 없음")
    except Exception as e:
        print(f"[ERROR] 조회 실패: {e}")
else:
    print("[SKIP] collected_data_v40 테이블 없음")

print()

# 4. 최종 점수 확인
print("[4] 최종 점수 확인")
print("-"*60)

if tables_found.get('ai_final_scores_v40'):
    try:
        # 조은희 점수
        joheunhee_score = supabase.table('ai_final_scores_v40').select('*').ilike('politician_name', '%조은희%').execute()

        if joheunhee_score.data:
            print(f"[OK] 조은희 점수 데이터 발견")

            score_data = joheunhee_score.data[0]
            print(f"\n최종 점수: {score_data.get('total_score', 'N/A')}")
            print(f"계산 일시: {score_data.get('calculated_at', 'N/A')}")
        else:
            print("[WARNING] 조은희 점수 데이터 없음")
    except Exception as e:
        print(f"[ERROR] 조회 실패: {e}")
else:
    print("[SKIP] ai_final_scores_v40 테이블 없음")

print()

# 5. 요약
print("="*60)
print("복원 검증 요약")
print("="*60)

all_ok = all(v is not None and v > 0 for v in tables_found.values())

if all_ok:
    print("\n[SUCCESS] 복원 성공!")
    print("  - 실제 V40 테이블 모두 존재")
    print("  - 데이터 정상 확인")
else:
    tables_exist = any(v is not None for v in tables_found.values())
    if tables_exist:
        print("\n[PARTIAL] 일부 테이블 복원됨")
        for table, count in tables_found.items():
            if count is not None:
                print(f"  ✓ {table}: {count:,} 레코드")
    else:
        print("\n[ERROR] 복원 실패 - 테이블 없음")
        print("  - 더 이전 백업으로 시도 필요")

print()
