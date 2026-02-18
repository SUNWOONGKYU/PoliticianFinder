#!/usr/bin/env python3
"""
모든 politician 관련 테이블/뷰 확인
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
print("Politician 테이블/뷰 전체 확인")
print("="*60 + "\n")

# 확인할 테이블/뷰 이름들
possible_names = [
    'politicians',           # 기본
    'v40_politicians',       # V40용
    'politicians_v40',       # V40용 (다른 네이밍)
    'politician_details',    # 상세 정보
    'politician_details_v40' # V40 상세 정보
]

print("[1] Politicians 관련 테이블 확인")
print("-"*60)

found_tables = {}

for table_name in possible_names:
    try:
        result = supabase.table(table_name).select('*').limit(1).execute()

        # 레코드 수 확인
        count_result = supabase.table(table_name).select('id', count='exact').execute()
        count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)

        found_tables[table_name] = count
        print(f"[OK] {table_name}: {count} 레코드")

        # 컬럼 확인
        if result.data:
            columns = list(result.data[0].keys())
            print(f"     컬럼: {', '.join(columns[:10])}")
            if len(columns) > 10:
                print(f"           ... 외 {len(columns)-10}개")

    except Exception as e:
        error_msg = str(e)
        if 'PGRST205' in error_msg:
            found_tables[table_name] = None
            print(f"[INFO] {table_name}: 없음")
        else:
            print(f"[ERROR] {table_name}: {error_msg[:50]}")

print()

# 2. 각 테이블의 박주민 데이터 확인
print("[2] 박주민 데이터 확인")
print("-"*60)

for table_name, count in found_tables.items():
    if count is not None and count > 0:
        try:
            park = supabase.table(table_name).select('*').eq('name', '박주민').execute()

            if park.data:
                print(f"[OK] {table_name}에 박주민 등록됨")
                data = park.data[0]
                print(f"     ID: {data.get('id')}")
                print(f"     이름: {data.get('name')}")

                # 추가 필드 확인
                if 'party' in data:
                    print(f"     정당: {data.get('party')}")
                if 'position' in data:
                    print(f"     직책: {data.get('position')}")
            else:
                print(f"[INFO] {table_name}에 박주민 없음")
        except Exception as e:
            print(f"[ERROR] {table_name} 조회 실패: {e}")

print()

# 3. 요약
print("="*60)
print("요약")
print("="*60 + "\n")

existing = [name for name, count in found_tables.items() if count is not None]

print(f"발견된 테이블: {len(existing)}개")
for name in existing:
    count = found_tables[name]
    print(f"  - {name}: {count} 레코드")

print()

if len(existing) < 2:
    print("[WARNING] V40용 별도 politicians 테이블/뷰 없음")
    print("\n필요한 테이블:")
    print("  1. politicians (기본) - 있음" if 'politicians' in existing else "  1. politicians (기본) - 없음")
    print("  2. v40_politicians 또는 politicians_v40 - 없음")
    print("\n해결 방법:")
    print("  - V40용 테이블 생성 필요")
    print("  - 또는 VIEW 생성 필요")
elif len(existing) >= 2:
    print("[OK] 필요한 테이블 모두 존재")
    for name in existing:
        print(f"  ✓ {name}")

print()
