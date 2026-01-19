# -*- coding: utf-8 -*-
"""
V26.0 수집을 위한 원본 테이블 초기화

⚠️ 주의: 이 스크립트는 원본 테이블의 데이터를 삭제합니다!
반드시 backup_v24_data.py를 먼저 실행하여 백업을 확인하세요!

사용법:
  python clear_for_v26.py --confirm
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

# 초기화 대상 테이블
TABLES_TO_CLEAR = [
    'collected_data',
    'ai_category_scores',
    'ai_final_scores',
    'ai_evaluations',
]

# 백업 테이블 매핑
BACKUP_TABLES = {
    'collected_data': 'collected_data_v24_backup',
    'ai_category_scores': 'ai_category_scores_v24_backup',
    'ai_final_scores': 'ai_final_scores_v24_backup',
    'ai_evaluations': 'ai_evaluations_v24_backup',
}


def get_table_count(table_name):
    """테이블 레코드 수 조회"""
    try:
        response = supabase.table(table_name).select('*', count='exact').execute()
        return response.count if response.count else 0
    except Exception:
        return -1


def verify_backup():
    """백업 검증"""
    print("="*60)
    print("🔍 백업 상태 확인")
    print("="*60)

    all_backed_up = True

    for original, backup in BACKUP_TABLES.items():
        original_count = get_table_count(original)
        backup_count = get_table_count(backup)

        if original_count > 0 and backup_count == 0:
            print(f"❌ {original}: {original_count:,}개 | 백업: 없음")
            all_backed_up = False
        elif original_count > 0 and backup_count < original_count:
            print(f"⚠️ {original}: {original_count:,}개 | 백업: {backup_count:,}개 (불완전)")
            all_backed_up = False
        else:
            print(f"✅ {original}: {original_count:,}개 | 백업: {backup_count:,}개")

    print("="*60)
    return all_backed_up


def clear_table(table_name):
    """테이블 데이터 삭제"""
    try:
        # 모든 레코드 삭제 (true 조건 사용)
        # Supabase에서는 delete()에 조건이 필요
        response = supabase.table(table_name).delete().neq('politician_id', 'IMPOSSIBLE_VALUE_12345').execute()
        return True
    except Exception as e:
        print(f"  ❌ 삭제 실패: {e}")
        return False


def clear_all_tables():
    """모든 테이블 초기화"""
    print("\n" + "="*60)
    print("🗑️ 테이블 초기화 시작")
    print("="*60)

    for table_name in TABLES_TO_CLEAR:
        count_before = get_table_count(table_name)
        print(f"\n{table_name}: {count_before:,}개 삭제 중...")

        if clear_table(table_name):
            count_after = get_table_count(table_name)
            print(f"  ✅ 완료: {count_before:,} → {count_after:,}개")
        else:
            print(f"  ❌ 실패")

    print("\n" + "="*60)
    print("📊 초기화 후 상태")
    print("="*60)

    for table_name in TABLES_TO_CLEAR:
        count = get_table_count(table_name)
        status = "✅ 비어있음" if count == 0 else f"⚠️ {count:,}개 남음"
        print(f"{table_name}: {status}")


def main():
    parser = argparse.ArgumentParser(description='V26.0 수집을 위한 테이블 초기화')
    parser.add_argument('--confirm', action='store_true', help='초기화 실행 확인')
    parser.add_argument('--force', action='store_true', help='백업 확인 없이 강제 실행')

    args = parser.parse_args()

    print("="*60)
    print("⚠️  V26.0 테이블 초기화")
    print("="*60)
    print(f"시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # 백업 확인
    backup_ok = verify_backup()

    if not backup_ok and not args.force:
        print("\n❌ 백업이 완료되지 않았습니다!")
        print("   먼저 python backup_v24_data.py를 실행하세요.")
        print("   또는 --force 옵션으로 강제 실행하세요.")
        return

    if not args.confirm:
        print("\n" + "="*60)
        print("⚠️  경고: 이 작업은 원본 테이블의 모든 데이터를 삭제합니다!")
        print("   실행하려면 --confirm 옵션을 추가하세요:")
        print("   python clear_for_v26.py --confirm")
        print("="*60)
        return

    # 최종 확인
    print("\n" + "="*60)
    print("🚨 최종 확인")
    print("="*60)
    print("다음 테이블의 모든 데이터가 삭제됩니다:")
    for table_name in TABLES_TO_CLEAR:
        count = get_table_count(table_name)
        print(f"  - {table_name}: {count:,}개")

    user_input = input("\n정말 삭제하시겠습니까? (yes/no): ")
    if user_input.lower() != 'yes':
        print("취소되었습니다.")
        return

    # 초기화 실행
    clear_all_tables()

    print("\n✅ V26.0 수집 준비 완료!")
    print("   이제 collect_v26_all.py를 실행할 수 있습니다.")


if __name__ == "__main__":
    main()
