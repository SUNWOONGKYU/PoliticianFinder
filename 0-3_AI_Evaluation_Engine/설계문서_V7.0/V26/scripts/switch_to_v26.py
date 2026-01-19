# -*- coding: utf-8 -*-
"""
V26.0 테이블 교체 스크립트
- V26 검증 완료 후 프로덕션 테이블로 교체
- 기존 V24 데이터 백업 후 V26 데이터로 교체
"""

import os
import sys
import argparse
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv()

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 테이블 매핑
TABLES = {
    'collected_data': 'collected_data_v26',
    'ai_category_scores': 'ai_category_scores_v26',
    'ai_final_scores': 'ai_final_scores_v26',
    'ai_evaluations': 'ai_evaluations_v26',
}


def check_v26_status():
    """V26 테이블 상태 확인"""
    print("\n" + "="*60)
    print("📊 V26 테이블 상태 확인")
    print("="*60)

    status = {}

    for prod_table, v26_table in TABLES.items():
        try:
            # V26 테이블 카운트
            v26_response = supabase.table(v26_table).select('*', count='exact').limit(0).execute()
            v26_count = v26_response.count if v26_response.count else 0

            # 프로덕션 테이블 카운트
            prod_response = supabase.table(prod_table).select('*', count='exact').limit(0).execute()
            prod_count = prod_response.count if prod_response.count else 0

            status[v26_table] = {
                'v26_count': v26_count,
                'prod_count': prod_count
            }

            print(f"\n{v26_table}:")
            print(f"  V26 데이터: {v26_count}개")
            print(f"  프로덕션 데이터: {prod_count}개")

        except Exception as e:
            print(f"  ❌ 조회 실패: {e}")
            status[v26_table] = {'error': str(e)}

    return status


def validate_v26_data():
    """V26 데이터 유효성 검증"""
    print("\n" + "="*60)
    print("🔍 V26 데이터 유효성 검증")
    print("="*60)

    errors = []

    # 1. collected_data_v26 검증
    try:
        response = supabase.table('collected_data_v26').select(
            'ai_name, category_name',
            count='exact'
        ).execute()

        total = response.count if response.count else 0
        print(f"\n수집 데이터: {total}개")

        if total == 0:
            errors.append("collected_data_v26가 비어있습니다.")

        # AI별 분포 확인
        for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
            ai_response = supabase.table('collected_data_v26').select(
                'collected_data_id', count='exact'
            ).eq('ai_name', ai).execute()
            ai_count = ai_response.count if ai_response.count else 0
            print(f"  - {ai}: {ai_count}개")

    except Exception as e:
        errors.append(f"collected_data_v26 검증 실패: {e}")

    # 2. collection_version 확인
    try:
        response = supabase.table('collected_data_v26').select(
            'collection_version'
        ).limit(10).execute()

        versions = set(item.get('collection_version') for item in response.data)
        print(f"\n수집 버전: {versions}")

        if 'V26.0' not in versions:
            errors.append("V26.0 버전 데이터가 없습니다.")

    except Exception as e:
        errors.append(f"collection_version 검증 실패: {e}")

    # 결과
    if errors:
        print("\n❌ 검증 실패:")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print("\n✅ 검증 통과")
        return True


def backup_production_tables():
    """프로덕션 테이블 백업 (V24 → V24_backup_YYYYMMDD)"""
    print("\n" + "="*60)
    print("💾 프로덕션 테이블 백업")
    print("="*60)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    print("\n⚠️ 백업은 Supabase SQL Editor에서 직접 수행해야 합니다.")
    print("\n다음 SQL을 실행하세요:\n")

    sql_commands = []
    for prod_table in TABLES.keys():
        backup_table = f"{prod_table}_v24_backup_{timestamp}"
        sql = f"CREATE TABLE {backup_table} AS SELECT * FROM {prod_table};"
        sql_commands.append(sql)
        print(sql)

    print("\n" + "-"*60)
    return sql_commands


def generate_switch_sql():
    """테이블 교체 SQL 생성"""
    print("\n" + "="*60)
    print("🔄 테이블 교체 SQL 생성")
    print("="*60)

    print("\n⚠️ 교체는 Supabase SQL Editor에서 직접 수행해야 합니다.")
    print("\n다음 SQL을 순서대로 실행하세요:\n")

    print("-- Step 1: 기존 프로덕션 데이터 삭제")
    for prod_table in TABLES.keys():
        print(f"DELETE FROM {prod_table};")

    print("\n-- Step 2: V26 데이터를 프로덕션 테이블로 복사")
    for prod_table, v26_table in TABLES.items():
        print(f"INSERT INTO {prod_table} SELECT * FROM {v26_table};")

    print("\n-- Step 3: (선택) V26 테이블 삭제")
    for v26_table in TABLES.values():
        print(f"-- DROP TABLE {v26_table};")

    print("\n" + "-"*60)


def main():
    parser = argparse.ArgumentParser(description='V26.0 테이블 교체')
    parser.add_argument('--check', action='store_true', help='V26 상태 확인')
    parser.add_argument('--validate', action='store_true', help='V26 데이터 검증')
    parser.add_argument('--backup', action='store_true', help='백업 SQL 생성')
    parser.add_argument('--switch', action='store_true', help='교체 SQL 생성')
    parser.add_argument('--all', action='store_true', help='전체 과정 (확인→검증→SQL생성)')

    args = parser.parse_args()

    print("="*60)
    print("V26.0 테이블 교체 도구")
    print("="*60)

    if args.all or (not args.check and not args.validate and not args.backup and not args.switch):
        # 전체 과정
        check_v26_status()
        is_valid = validate_v26_data()

        if is_valid:
            backup_production_tables()
            generate_switch_sql()
        else:
            print("\n⚠️ 검증 실패로 인해 교체 SQL을 생성하지 않습니다.")
            print("먼저 V26 데이터 수집을 완료하세요.")
    else:
        if args.check:
            check_v26_status()
        if args.validate:
            validate_v26_data()
        if args.backup:
            backup_production_tables()
        if args.switch:
            generate_switch_sql()

    print("\n✅ 완료")


if __name__ == "__main__":
    main()
