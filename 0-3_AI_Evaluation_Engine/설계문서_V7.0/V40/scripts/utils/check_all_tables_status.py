#!/usr/bin/env python3
"""
전체 테이블 상태 확인 (V40 + politicians)
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
print("전체 테이블 상태 확인")
print("="*60 + "\n")

# 1. politicians 테이블 확인
print("[1] politicians 테이블 확인 (필수)")
print("-"*60)

try:
    result = supabase.table('politicians').select('id, name').limit(5).execute()

    # 전체 개수
    count_result = supabase.table('politicians').select('id', count='exact').execute()
    total_count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)

    print(f"[OK] politicians 테이블 존재: {total_count} 명")

    if result.data:
        print("\n등록된 정치인 샘플:")
        for politician in result.data[:5]:
            print(f"  - {politician.get('name')} (ID: {politician.get('id')})")

    politicians_ok = True
except Exception as e:
    print(f"[ERROR] politicians 테이블 없음: {e}")
    politicians_ok = False

print()

# 2. V40 테이블 확인
print("[2] V40 테이블 확인")
print("-"*60)

v40_tables = {
    'collected_data_v40': '수집 데이터',
    'ai_category_scores_v40': '카테고리 점수',
    'ai_final_scores_v40': '최종 점수'
}

v40_status = {}

for table_name, description in v40_tables.items():
    try:
        count_result = supabase.table(table_name).select('id', count='exact').execute()
        count = count_result.count if hasattr(count_result, 'count') else 0

        v40_status[table_name] = count
        print(f"[OK] {table_name}: {count} 레코드 ({description})")
    except Exception as e:
        v40_status[table_name] = None
        print(f"[ERROR] {table_name}: 테이블 없음")

print()

# 3. 조은희 데이터 확인
print("[3] 조은희 데이터 확인")
print("-"*60)

if v40_status.get('collected_data_v40') is not None:
    try:
        joheunhee = supabase.table('collected_data_v40').select('*').ilike('politician_name', '%조은희%').limit(3).execute()

        if joheunhee.data:
            count_result = supabase.table('collected_data_v40').select('id', count='exact').ilike('politician_name', '%조은희%').execute()
            total = count_result.count if hasattr(count_result, 'count') else len(count_result.data)

            print(f"[OK] 조은희 데이터: {total}개")
            print("\n샘플:")
            for item in joheunhee.data:
                print(f"  - {item.get('event_date', 'N/A')} | {item.get('category', 'N/A')} | {item.get('title', 'N/A')[:40]}")
        else:
            print("[INFO] 조은희 데이터: 없음 (재수집 필요)")
    except Exception as e:
        print(f"[ERROR] 조회 실패: {e}")
else:
    print("[SKIP] collected_data_v40 테이블 없음")

print()

# 4. 박주민 확인
print("[4] 박주민 확인")
print("-"*60)

if politicians_ok:
    try:
        park = supabase.table('politicians').select('*').eq('name', '박주민').execute()

        if park.data:
            print(f"[OK] 박주민 등록됨")
            print(f"  ID: {park.data[0].get('id')}")
            print(f"  이름: {park.data[0].get('name')}")
        else:
            print("[INFO] 박주민 미등록 (등록 필요)")
    except Exception as e:
        print(f"[ERROR] 조회 실패: {e}")

print()

# 5. 요약
print("="*60)
print("시스템 상태 요약")
print("="*60 + "\n")

# politicians 테이블
if politicians_ok:
    print("[OK] politicians 테이블: 정상")
else:
    print("[CRITICAL] politicians 테이블: 없음 - 시스템 작동 불가!")

# V40 테이블들
all_v40_exist = all(v is not None for v in v40_status.values())
if all_v40_exist:
    total_records = sum(v for v in v40_status.values() if v is not None)
    print(f"[OK] V40 테이블: 모두 존재 (총 {total_records} 레코드)")
else:
    print("[ERROR] V40 테이블: 일부 누락")

print()

# 다음 단계
print("="*60)
print("다음 단계")
print("="*60 + "\n")

if politicians_ok and all_v40_exist:
    if sum(v40_status.values()) == 0:
        print("[ACTION] 데이터 수집 시작 가능")
        print("  1. 박주민 데이터 수집")
        print("  2. 조은희 재평가")
    else:
        print("[ACTION] 데이터 일부 복원됨")
        print("  1. 기존 데이터 활용")
        print("  2. 추가 수집 진행")
else:
    if not politicians_ok:
        print("[CRITICAL] politicians 테이블 복원 필요")
    if not all_v40_exist:
        print("[ERROR] V40 테이블 복원 필요")

print()
