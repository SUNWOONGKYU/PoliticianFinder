# -*- coding: utf-8 -*-
"""
V30 평가 데이터 삭제 스크립트

부분 완료된 평가 데이터를 삭제하여 재평가 준비
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

TABLE_EVALUATIONS = "evaluations_v30"

def clear_evaluations(politician_id):
    """특정 정치인의 V30 평가 데이터 삭제"""
    try:
        # 현재 데이터 개수 확인
        result = supabase.table(TABLE_EVALUATIONS).select('id', count='exact').eq(
            'politician_id', politician_id
        ).execute()

        count = result.count if result.count else 0
        print(f"\n삭제 대상: {count}개 평가 데이터")

        if count == 0:
            print("삭제할 데이터가 없습니다.")
            return

        # 삭제 확인
        confirm = input(f"\n정말 {count}개 데이터를 삭제하시겠습니까? (yes/no): ")
        if confirm.lower() != 'yes':
            print("삭제가 취소되었습니다.")
            return

        # 삭제 실행
        print("\n삭제 중...")
        supabase.table(TABLE_EVALUATIONS).delete().eq(
            'politician_id', politician_id
        ).execute()

        # 확인
        result_after = supabase.table(TABLE_EVALUATIONS).select('id', count='exact').eq(
            'politician_id', politician_id
        ).execute()

        count_after = result_after.count if result_after.count else 0

        print(f"\n✅ 삭제 완료!")
        print(f"   삭제 전: {count}개")
        print(f"   삭제 후: {count_after}개")

    except Exception as e:
        print(f"\n❌ 삭제 실패: {e}")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='V30 평가 데이터 삭제')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    args = parser.parse_args()

    clear_evaluations(args.politician_id)
