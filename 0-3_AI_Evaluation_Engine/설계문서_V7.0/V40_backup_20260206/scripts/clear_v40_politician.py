# -*- coding: utf-8 -*-
"""
V40 정치인 데이터 완전 삭제 스크립트

목적: 재수집 전 기존 데이터를 완전히 삭제
- evaluations_v40
- collected_data_v40
- ai_final_scores_v40

사용법:
    python clear_v40_politician.py --politician_id=f9e00370 --politician_name="김민석"
    python clear_v40_politician.py --politician_id=f9e00370 --politician_name="김민석" --confirm
"""

import os
import sys
import argparse
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)


def get_data_counts(politician_id):
    """현재 데이터 개수 확인"""
    counts = {}

    # collected_data_v40
    result = supabase.table('collected_data_v40')\
        .select('id', count='exact')\
        .eq('politician_id', politician_id)\
        .execute()
    counts['collected'] = result.count if result.count else 0

    # evaluations_v40
    result = supabase.table('evaluations_v40')\
        .select('id', count='exact')\
        .eq('politician_id', politician_id)\
        .execute()
    counts['evaluations'] = result.count if result.count else 0

    # ai_final_scores_v40
    result = supabase.table('ai_final_scores_v40')\
        .select('id', count='exact')\
        .eq('politician_id', politician_id)\
        .execute()
    counts['scores'] = result.count if result.count else 0

    return counts


def delete_politician_data(politician_id, politician_name):
    """정치인 데이터 완전 삭제"""
    print(f"\n{'='*60}")
    print(f"정치인 데이터 완전 삭제")
    print(f"{'='*60}\n")
    print(f"정치인: {politician_name} ({politician_id})\n")

    # 현재 데이터 확인
    print("[1단계] 현재 데이터 확인")
    counts = get_data_counts(politician_id)

    print(f"  - 수집 데이터: {counts['collected']}개")
    print(f"  - 평가 데이터: {counts['evaluations']}개")
    print(f"  - 점수 데이터: {counts['scores']}개\n")

    if counts['collected'] == 0 and counts['evaluations'] == 0 and counts['scores'] == 0:
        print("✅ 삭제할 데이터가 없습니다.\n")
        return

    # 삭제 실행
    print("[2단계] 데이터 삭제 중...\n")

    # 1. evaluations_v40 삭제
    if counts['evaluations'] > 0:
        print(f"  🗑️ 평가 데이터 삭제 중... ({counts['evaluations']}개)")
        try:
            supabase.table('evaluations_v40')\
                .delete()\
                .eq('politician_id', politician_id)\
                .execute()
            print(f"  ✅ 평가 데이터 삭제 완료\n")
        except Exception as e:
            print(f"  ⚠️ 평가 데이터 삭제 실패: {e}\n")

    # 2. collected_data_v40 삭제
    if counts['collected'] > 0:
        print(f"  🗑️ 수집 데이터 삭제 중... ({counts['collected']}개)")
        try:
            supabase.table('collected_data_v40')\
                .delete()\
                .eq('politician_id', politician_id)\
                .execute()
            print(f"  ✅ 수집 데이터 삭제 완료\n")
        except Exception as e:
            print(f"  ⚠️ 수집 데이터 삭제 실패: {e}\n")

    # 3. ai_final_scores_v40 삭제
    if counts['scores'] > 0:
        print(f"  🗑️ 점수 데이터 삭제 중... ({counts['scores']}개)")
        try:
            supabase.table('ai_final_scores_v40')\
                .delete()\
                .eq('politician_id', politician_id)\
                .execute()
            print(f"  ✅ 점수 데이터 삭제 완료\n")
        except Exception as e:
            print(f"  ⚠️ 점수 데이터 삭제 실패: {e}\n")

    # 삭제 확인
    print("[3단계] 삭제 확인")
    final_counts = get_data_counts(politician_id)

    print(f"  - 수집 데이터: {final_counts['collected']}개")
    print(f"  - 평가 데이터: {final_counts['evaluations']}개")
    print(f"  - 점수 데이터: {final_counts['scores']}개\n")

    if final_counts['collected'] == 0 and final_counts['evaluations'] == 0 and final_counts['scores'] == 0:
        print("✅ 모든 데이터 삭제 완료!\n")
    else:
        print("⚠️ 일부 데이터가 남아있습니다. 수동 확인이 필요합니다.\n")


def main():
    parser = argparse.ArgumentParser(description='V40 정치인 데이터 완전 삭제')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--confirm', action='store_true', help='확인 없이 바로 삭제')

    args = parser.parse_args()

    print(f"\n{'#'*60}")
    print(f"# V40 정치인 데이터 완전 삭제")
    print(f"# 정치인: {args.politician_name} ({args.politician_id})")
    print(f"{'#'*60}\n")

    # 현재 데이터 확인
    counts = get_data_counts(args.politician_id)
    total = counts['collected'] + counts['evaluations'] + counts['scores']

    if total == 0:
        print("✅ 삭제할 데이터가 없습니다.\n")
        return

    print(f"⚠️ 경고: 다음 데이터가 영구적으로 삭제됩니다!")
    print(f"{'='*60}\n")
    print(f"  - 수집 데이터: {counts['collected']}개")
    print(f"  - 평가 데이터: {counts['evaluations']}개")
    print(f"  - 점수 데이터: {counts['scores']}개")
    print(f"  - 총: {total}개\n")

    if not args.confirm:
        confirm = input("정말 삭제하시겠습니까? (yes 입력): ")
        if confirm.lower() != 'yes':
            print("\n삭제 취소됨\n")
            return

    # 삭제 실행
    delete_politician_data(args.politician_id, args.politician_name)


if __name__ == "__main__":
    main()
