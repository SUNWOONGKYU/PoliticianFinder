#!/usr/bin/env python3
"""
V40 기존 데이터 삭제 스크립트
============================

잘못 수집된 데이터를 삭제합니다.
- 테이블은 삭제하지 않고 데이터만 삭제
- 박주민 politician_id: 8c5dcc89

사용법:
    python delete_old_data.py --politician-id 8c5dcc89 --confirm
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent

# .env 파일 로드
ENV_PATH = V40_DIR.parent / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase credentials not found")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def check_data_status(politician_id: str):
    """현재 데이터 상태 확인"""
    print(f"\n=== 현재 데이터 상태 확인 (politician_id: {politician_id}) ===\n")

    # 전체 개수
    result = supabase.table('collected_data_v40').select('*', count='exact').eq(
        'politician_id', politician_id
    ).execute()

    total_count = result.count
    print(f"총 데이터 개수: {total_count}개")

    if total_count == 0:
        print("삭제할 데이터가 없습니다.")
        return 0

    # Collector AI별
    gemini_count = len([d for d in result.data if d.get('collector_ai') == 'Gemini'])
    naver_count = len([d for d in result.data if d.get('collector_ai') == 'Naver'])
    print(f"\nCollector AI별:")
    print(f"  - Gemini: {gemini_count}개")
    print(f"  - Naver: {naver_count}개")

    # Data Type별
    official_count = len([d for d in result.data if d.get('data_type') == 'official'])
    public_count = len([d for d in result.data if d.get('data_type') == 'public'])
    print(f"\nData Type별:")
    print(f"  - OFFICIAL: {official_count}개")
    print(f"  - PUBLIC: {public_count}개")

    # Category별
    categories = {}
    for item in result.data:
        cat = item.get('category', 'unknown')
        categories[cat] = categories.get(cat, 0) + 1

    print(f"\nCategory별:")
    for cat, count in sorted(categories.items()):
        print(f"  - {cat}: {count}개")

    return total_count


def delete_data(politician_id: str):
    """데이터 삭제 (테이블은 유지)"""
    print(f"\n=== 데이터 삭제 시작 ===\n")

    try:
        result = supabase.table('collected_data_v40').delete().eq(
            'politician_id', politician_id
        ).execute()

        print(f"✅ 데이터 삭제 완료")
        return True

    except Exception as e:
        print(f"❌ 데이터 삭제 실패: {e}")
        return False


def main():
    import argparse

    parser = argparse.ArgumentParser(description='V40 기존 데이터 삭제')
    parser.add_argument('--politician-id', required=True, help='정치인 ID')
    parser.add_argument('--confirm', action='store_true', help='삭제 확인')

    args = parser.parse_args()

    # 1. 현재 상태 확인
    count = check_data_status(args.politician_id)

    if count == 0:
        sys.exit(0)

    # 2. 삭제 확인
    if not args.confirm:
        print(f"\n⚠️ 경고: {count}개의 데이터가 삭제됩니다.")
        print("삭제하려면 --confirm 플래그를 추가하세요:")
        print(f"  python delete_old_data.py --politician-id {args.politician_id} --confirm")
        sys.exit(1)

    # 3. 삭제 실행
    success = delete_data(args.politician_id)

    if success:
        # 4. 삭제 후 확인
        print("\n=== 삭제 후 확인 ===\n")
        check_data_status(args.politician_id)
        print("\n✅ 작업 완료")
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == '__main__':
    main()
