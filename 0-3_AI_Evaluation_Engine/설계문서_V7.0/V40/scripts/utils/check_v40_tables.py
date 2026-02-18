#!/usr/bin/env python3
"""
V40 테이블 존재 확인 스크립트
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
else:
    print(f"[ERROR] .env 파일을 찾을 수 없습니다: {ENV_PATH}")
    sys.exit(1)

# Supabase 클라이언트
try:
    from supabase import create_client, Client

    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[ERROR] SUPABASE_URL 또는 SUPABASE_SERVICE_KEY가 설정되지 않았습니다.")
        sys.exit(1)

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"[OK] Supabase 연결 성공\n")
except Exception as e:
    print(f"[ERROR] Supabase 연결 실패: {e}")
    sys.exit(1)


def check_table(table_name: str):
    """테이블 존재 및 데이터 확인"""
    print(f"{'='*60}")
    print(f"테이블: {table_name}")
    print(f"{'='*60}")

    try:
        # 테이블 존재 확인 (데이터 1개만 조회)
        result = supabase.table(table_name).select('*').limit(1).execute()

        print(f"[OK] 테이블 존재")

        # 전체 레코드 수 확인
        count_result = supabase.table(table_name).select('id', count='exact').execute()
        total_count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)

        print(f"[INFO] 총 레코드 수: {total_count}")

        # 샘플 데이터 출력
        if result.data:
            print(f"[INFO] 샘플 데이터:")
            sample = result.data[0]
            for key, value in sample.items():
                value_str = str(value)[:50] if value else 'NULL'
                print(f"  - {key}: {value_str}")

        print()
        return True

    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] 테이블 조회 실패: {error_msg}")

        if 'PGRST205' in error_msg or 'not found' in error_msg.lower():
            print(f"[ERROR] 테이블이 존재하지 않습니다!")

        print()
        return False


def check_collected_data_v40_detail():
    """collected_data_v40 상세 확인"""
    print(f"{'='*60}")
    print(f"collected_data_v40 상세 확인")
    print(f"{'='*60}")

    try:
        # 조은희 데이터 확인
        result = supabase.table('collected_data_v40').select('*').eq('politician_name', '조은희').limit(5).execute()

        if result.data:
            print(f"[OK] 조은희 데이터 발견: {len(result.data)}개")
            for event in result.data:
                print(f"  - {event.get('event_date')} | {event.get('category')} | {event.get('title', 'N/A')[:30]}")
        else:
            # politician_id로 다시 확인
            politicians = supabase.table('politicians').select('id, name').eq('name', '조은희').execute()
            if politicians.data:
                politician_id = politicians.data[0]['id']
                print(f"[INFO] 조은희 politician_id: {politician_id}")

                result = supabase.table('collected_data_v40').select('*').eq('politician_id', politician_id).limit(5).execute()
                if result.data:
                    print(f"[OK] 조은희 데이터 발견 (politician_id): {len(result.data)}개")
                    for event in result.data:
                        print(f"  - {event.get('event_date')} | {event.get('category')} | {event.get('title', 'N/A')[:30]}")
                else:
                    print(f"[WARNING] 조은희 데이터가 없습니다")

        print()

    except Exception as e:
        print(f"[ERROR] collected_data_v40 조회 실패: {e}")
        print()


def main():
    print("\n" + "="*60)
    print("V40 테이블 확인")
    print("="*60 + "\n")

    # V40 테이블 확인
    tables = ['collected_data_v40', 'evaluations_v40', 'scores_v40']

    results = {}
    for table in tables:
        results[table] = check_table(table)

    # collected_data_v40 상세 확인
    if results.get('collected_data_v40'):
        check_collected_data_v40_detail()

    # 요약
    print("="*60)
    print("요약")
    print("="*60)
    for table, exists in results.items():
        status = "[OK]" if exists else "[ERROR]"
        print(f"{status} {table}: {'존재' if exists else '없음'}")
    print()

    if all(results.values()):
        print("[SUCCESS] 모든 V40 테이블이 존재합니다!")
    else:
        print("[ERROR] 일부 V40 테이블이 존재하지 않습니다.")
        print("\n해결 방법:")
        print("  1. Supabase Dashboard -> SQL Editor")
        print("  2. V40/Database/create_v40_tables.sql 실행")


if __name__ == '__main__':
    main()
