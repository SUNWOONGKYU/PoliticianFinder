# -*- coding: utf-8 -*-
"""
김민석 기존 데이터 삭제 및 정보 확인
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials not found in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def find_politician(name: str):
    """정치인 검색"""
    print(f"\n[1단계] '{name}' 검색 중...")

    response = supabase.table('politicians').select('*').eq('name', name).execute()

    if not response.data:
        print(f"  [FAIL] '{name}'을(를) 찾을 수 없습니다.")
        return None

    if len(response.data) > 1:
        print(f"  [WARN] '{name}' 동명이인 {len(response.data)}명 발견:")
        for i, p in enumerate(response.data, 1):
            print(f"    {i}. {p['name']} ({p['party']}, {p['title']}, {p['region']})")
        return response.data

    politician = response.data[0]
    print(f"  [OK] '{name}' 발견: {politician['id']}")
    return politician

def delete_existing_data(politician_id: str, politician_name: str):
    """기존 V30 데이터 삭제"""
    print(f"\n[2단계] '{politician_name}' 기존 데이터 삭제 중...")

    tables = [
        'collected_data_v30',
        'evaluations_v30',
        'ai_category_scores_v30',
        'ai_final_scores_v30'
    ]

    deleted_counts = {}

    for table in tables:
        try:
            # 기존 데이터 개수 확인
            count_response = supabase.table(table).select('id', count='exact').eq('politician_id', politician_id).execute()
            count = count_response.count if hasattr(count_response, 'count') else len(count_response.data)

            if count > 0:
                # 삭제
                supabase.table(table).delete().eq('politician_id', politician_id).execute()
                print(f"  [OK] {table}: {count}개 삭제")
                deleted_counts[table] = count
            else:
                print(f"  [SKIP] {table}: 데이터 없음")
                deleted_counts[table] = 0

        except Exception as e:
            print(f"  [ERROR] {table}: {e}")
            deleted_counts[table] = 'error'

    return deleted_counts

def display_politician_info(politician: dict):
    """정치인 정보 출력"""
    print(f"\n" + "="*80)
    print(f"Step 0: 정치인 정보 확인")
    print(f"="*80)

    print(f"\n[기본 정보]")
    print(f"  이름: {politician.get('name', 'N/A')}")
    print(f"  ID: {politician.get('id', 'N/A')}")
    print(f"  소속 정당: {politician.get('party', 'N/A')}")
    print(f"  출마 직종: {politician.get('title', 'N/A')}")
    print(f"  현재 직책: {politician.get('position', 'N/A')}")
    print(f"  출마 지역: {politician.get('region', 'N/A')}")
    print(f"  지역구: {politician.get('district', 'N/A') if politician.get('district') else 'N/A'}")
    print(f"  출마 신분: {politician.get('identity', 'N/A')}")
    print(f"  생년월일: {politician.get('birth_date', 'N/A')}")
    print(f"  나이: {politician.get('age', 'N/A')}세")

    print(f"\n[추가 정보]")
    print(f"  프로필 이미지: {'있음' if politician.get('profile_image_url') else '없음'}")
    print(f"  웹사이트: {'있음' if politician.get('website_url') else '없음'}")

    print(f"\n" + "="*80)

    # 필수 필드 검증
    required_fields = ['name', 'id', 'party', 'title', 'region', 'identity']
    missing_fields = [f for f in required_fields if not politician.get(f)]

    if missing_fields:
        print(f"\n[WARN] 필수 정보 누락: {', '.join(missing_fields)}")
        return False
    else:
        print(f"\n[OK] 모든 필수 정보 확인 완료")
        return True

def main():
    """메인 함수"""
    politician_name = "김민석"

    # 1. 정치인 검색
    result = find_politician(politician_name)

    if not result:
        print(f"\n[ERROR] '{politician_name}'을(를) 찾을 수 없습니다.")
        return

    # 동명이인 처리
    if isinstance(result, list):
        print(f"\n동명이인이 발견되었습니다. 첫 번째 인물을 사용합니다.")
        politician = result[0]
    else:
        politician = result

    politician_id = politician['id']

    # 2. 기존 데이터 삭제
    deleted_counts = delete_existing_data(politician_id, politician_name)

    print(f"\n[삭제 완료]")
    total_deleted = sum(v for v in deleted_counts.values() if isinstance(v, int))
    print(f"  총 {total_deleted}개 레코드 삭제")

    # 3. Step 0: 정치인 정보 확인
    is_valid = display_politician_info(politician)

    if is_valid:
        print(f"\n✅ Step 0 완료: '{politician_name}' 정보 확인 완료")
        print(f"\n다음 단계: Step 1 (데이터 수집 1,000개)")
        print(f"승인 후 진행하시겠습니까?")
    else:
        print(f"\n❌ Step 0 실패: 필수 정보 누락")
        print(f"DB에서 정치인 정보를 업데이트한 후 다시 시도하세요.")

if __name__ == "__main__":
    main()
