# -*- coding: utf-8 -*-
"""
V40 데이터 전체 삭제 스크립트
- collected_data_v40
- ai_category_scores_v40
- ai_final_scores_v40
모든 레코드를 삭제합니다.
"""

import sys
import os

# UTF-8 출력 설정 (Windows)
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
from supabase import create_client

# .env 파일 로드
env_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..', '..', '.env'
)
env_path = os.path.normpath(env_path)
print(f"[INFO] .env 경로: {env_path}")
print(f"[INFO] .env 존재: {os.path.exists(env_path)}")

load_dotenv(env_path)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.")
    sys.exit(1)

print(f"[INFO] Supabase URL: {SUPABASE_URL[:30]}...")
print()

# Supabase 클라이언트 생성
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

TABLES = [
    'collected_data_v40',
    'ai_category_scores_v40',
    'ai_final_scores_v40',
]

DUMMY_UUID = '00000000-0000-0000-0000-000000000000'


def count_records(table_name):
    """테이블의 레코드 수를 반환"""
    try:
        result = supabase.table(table_name).select('id', count='exact').limit(0).execute()
        return result.count if result.count is not None else 0
    except Exception as e:
        print(f"  [WARNING] {table_name} 카운트 실패: {e}")
        return -1


def delete_all_records(table_name):
    """테이블의 모든 레코드를 삭제"""
    try:
        result = supabase.table(table_name).delete().neq('id', DUMMY_UUID).execute()
        deleted_count = len(result.data) if result.data else 0
        return deleted_count
    except Exception as e:
        print(f"  [ERROR] {table_name} 삭제 실패: {e}")
        return -1


def main():
    print("=" * 60)
    print("  V40 데이터 전체 삭제")
    print("=" * 60)
    print()

    # 1. 삭제 전 카운트
    print("[STEP 1] 삭제 전 레코드 수 확인")
    print("-" * 40)
    before_counts = {}
    for table in TABLES:
        count = count_records(table)
        before_counts[table] = count
        print(f"  {table}: {count} 건")
    print()

    total_before = sum(v for v in before_counts.values() if v >= 0)
    print(f"  전체 합계: {total_before} 건")
    print()

    if total_before == 0:
        print("[INFO] 삭제할 데이터가 없습니다. 모든 테이블이 이미 비어있습니다.")
        return

    # 2. 삭제 실행
    print("[STEP 2] 삭제 실행")
    print("-" * 40)
    deleted_counts = {}
    for table in TABLES:
        if before_counts[table] == 0:
            print(f"  {table}: 이미 비어있음 (스킵)")
            deleted_counts[table] = 0
            continue

        deleted = delete_all_records(table)
        deleted_counts[table] = deleted
        print(f"  {table}: {deleted} 건 삭제됨")
    print()

    # 3. 삭제 후 카운트
    print("[STEP 3] 삭제 후 레코드 수 확인")
    print("-" * 40)
    after_counts = {}
    for table in TABLES:
        count = count_records(table)
        after_counts[table] = count
        status = "OK" if count == 0 else "WARNING - 잔여 데이터 있음!"
        print(f"  {table}: {count} 건  [{status}]")
    print()

    # 4. 최종 요약
    print("=" * 60)
    print("  최종 요약")
    print("=" * 60)
    print()
    print(f"  {'테이블':<30} {'삭제 전':>8} {'삭제 후':>8} {'상태':>8}")
    print(f"  {'-'*30} {'-'*8} {'-'*8} {'-'*8}")
    all_clean = True
    for table in TABLES:
        before = before_counts.get(table, '?')
        after = after_counts.get(table, '?')
        status = "OK" if after == 0 else "FAIL"
        if after != 0:
            all_clean = False
        print(f"  {table:<30} {str(before):>8} {str(after):>8} {status:>8}")
    print()

    total_after = sum(v for v in after_counts.values() if v >= 0)
    if all_clean:
        print(f"  [SUCCESS] V40 데이터 전체 삭제 완료! ({total_before} -> {total_after})")
    else:
        print(f"  [WARNING] 일부 테이블에 잔여 데이터가 있습니다. 확인 필요!")
    print()


if __name__ == '__main__':
    main()
