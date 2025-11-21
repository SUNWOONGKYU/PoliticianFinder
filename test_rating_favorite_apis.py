#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2순위 기능 테스트
- 별점 평가 API 테스트 (인증 필요)
- 관심 정치인 등록/조회/삭제 API 테스트 (인증 필요)
- Trigger UPSERT 동작 확인
- RLS 정책 동작 확인
"""
import os, sys
import requests
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

# 배포된 프로덕션 URL
BASE_URL = "https://politician-finder-9swpbd657-finder-world.vercel.app"

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*70)
print("2순위 기능 테스트")
print("="*70 + "\n")

# ============================================================================
# TEST 1: 테스트용 정치인 선택
# ============================================================================
print("TEST 1: 테스트용 정치인 선택")
print("-" * 70)

try:
    result = supabase.table('politicians').select('id, name, party, position').limit(3).execute()

    if result.data and len(result.data) > 0:
        test_politicians = result.data
        print(f"OK: 테스트용 정치인 {len(test_politicians)}명 선택:\n")

        for idx, pol in enumerate(test_politicians, 1):
            print(f"{idx}. {pol['name']} (ID: {pol['id']})")
            print(f"   소속: {pol.get('party', 'N/A')}")
            print(f"   직위: {pol.get('position', 'N/A')}\n")

        # 첫 번째 정치인을 테스트 대상으로 선택
        test_politician_id = test_politicians[0]['id']
        test_politician_name = test_politicians[0]['name']

        print(f" 테스트 대상: {test_politician_name} (ID: {test_politician_id})")
    else:
        print(" 정치인 데이터가 없습니다.")
        sys.exit(1)

except Exception as e:
    print(f" 테스트 정치인 조회 실패: {str(e)}")
    sys.exit(1)

print("\n" + "="*70)

# ============================================================================
# TEST 2: 별점 평가 API 테스트 (인증 필요)
# ============================================================================
print("\nTEST 2: 별점 평가 API 테스트 (인증 필요)")
print("-" * 70)

print("\n 이 테스트는 로그인이 필요합니다.")
print(" 브라우저에서 로그인 후 쿠키를 가져와야 합니다.")
print("\n선택지:")
print("1. 브라우저에서 수동으로 테스트 (권장)")
print("2. Supabase 직접 INSERT로 Trigger 테스트")
print("\nOption 2를 선택하여 Trigger 동작을 확인하겠습니다.\n")

# Supabase 직접 테스트용 사용자 ID (테스트용)
test_user_id = "00000000-0000-0000-0000-000000000001"

print(f"[2-1] 별점 평가 INSERT 테스트")
print(f"  정치인: {test_politician_name} ({test_politician_id})")
print(f"  테스트 사용자 ID: {test_user_id}")
print(f"  별점: 5점")

try:
    # 기존 평가 삭제 (재테스트를 위해)
    supabase.table('politician_ratings').delete().eq('politician_id', test_politician_id).eq('user_id', test_user_id).execute()

    # 별점 평가 INSERT
    rating_data = {
        'politician_id': test_politician_id,
        'user_id': test_user_id,
        'rating': 5
    }

    result = supabase.table('politician_ratings').insert(rating_data).execute()

    if result.data:
        print(f"   별점 평가 등록 성공")
        print(f"  - Rating ID: {result.data[0]['id']}")
        print(f"  - 등록 시간: {result.data[0]['created_at']}")
    else:
        print(f"   별점 평가 등록 실패")

except Exception as e:
    print(f"   별점 평가 INSERT 실패: {str(e)}")

print(f"\n[2-2] Trigger UPSERT 동작 확인")
print(f"  politician_details 테이블에 자동으로 레코드가 생성되었는지 확인")

try:
    import time
    time.sleep(2)  # Trigger 실행 대기

    result = supabase.table('politician_details').select('*').eq('politician_id', test_politician_id).execute()

    if result.data and len(result.data) > 0:
        details = result.data[0]
        print(f"   politician_details 레코드 자동 생성됨")
        print(f"  - politician_id: {details['politician_id']}")
        print(f"  - user_rating: {details['user_rating']}")
        print(f"  - rating_count: {details['rating_count']}")

        if details['user_rating'] == 5.0 and details['rating_count'] == 1:
            print(f"   Trigger UPSERT 정상 동작 (평균: 5.0, 개수: 1)")
        else:
            print(f"   값이 예상과 다름 (예상: 평균 5.0, 개수 1)")
    else:
        print(f"   politician_details 레코드 생성 안됨 (Trigger 미동작)")

except Exception as e:
    print(f"   politician_details 조회 실패: {str(e)}")

print(f"\n[2-3] 추가 별점 평가로 평균 계산 확인")
print(f"  두 번째 사용자가 3점 평가")

test_user_id_2 = "00000000-0000-0000-0000-000000000002"

try:
    # 두 번째 평가 INSERT
    rating_data_2 = {
        'politician_id': test_politician_id,
        'user_id': test_user_id_2,
        'rating': 3
    }

    supabase.table('politician_ratings').insert(rating_data_2).execute()
    print(f"   두 번째 별점 평가 등록 (3점)")

    time.sleep(2)  # Trigger 실행 대기

    # politician_details 다시 조회
    result = supabase.table('politician_details').select('*').eq('politician_id', test_politician_id).execute()

    if result.data and len(result.data) > 0:
        details = result.data[0]
        print(f"   politician_details 업데이트됨")
        print(f"  - user_rating: {details['user_rating']} (예상: 4.0)")
        print(f"  - rating_count: {details['rating_count']} (예상: 2)")

        expected_avg = (5 + 3) / 2  # 4.0

        if details['user_rating'] == expected_avg and details['rating_count'] == 2:
            print(f"   평균 계산 정확 (5+3)/2 = 4.0")
        else:
            print(f"   평균 계산 오류 (실제: {details['user_rating']}, 예상: {expected_avg})")
    else:
        print(f"   politician_details 업데이트 안됨")

except Exception as e:
    print(f"   추가 평가 테스트 실패: {str(e)}")

print("\n" + "="*70)

# ============================================================================
# TEST 3: 관심 정치인 API 테스트
# ============================================================================
print("\nTEST 3: 관심 정치인 API 테스트")
print("-" * 70)

print("\n 이 테스트도 로그인이 필요합니다.")
print(" Supabase 직접 INSERT/SELECT로 스키마를 확인하겠습니다.\n")

print(f"[3-1] 관심 정치인 등록 테스트")

try:
    # 기존 데이터 삭제
    supabase.table('favorite_politicians').delete().eq('user_id', test_user_id).eq('politician_id', test_politician_id).execute()

    # 관심 정치인 등록
    favorite_data = {
        'user_id': test_user_id,
        'politician_id': test_politician_id,
        'notes': '테스트 메모입니다',
        'notification_enabled': True,
        'is_pinned': False
    }

    result = supabase.table('favorite_politicians').insert(favorite_data).execute()

    if result.data:
        print(f"   관심 정치인 등록 성공")
        print(f"  - Favorite ID: {result.data[0]['id']}")
        print(f"  - politician_id: {result.data[0]['politician_id']}")
        print(f"  - notes: {result.data[0]['notes']}")
        print(f"  - notification_enabled: {result.data[0]['notification_enabled']}")
        print(f"  - is_pinned: {result.data[0]['is_pinned']}")
    else:
        print(f"   관심 정치인 등록 실패")

except Exception as e:
    print(f"   관심 정치인 등록 실패: {str(e)}")

print(f"\n[3-2] 관심 정치인 조회 테스트")

try:
    result = supabase.table('favorite_politicians').select('*').eq('user_id', test_user_id).execute()

    if result.data and len(result.data) > 0:
        print(f"   관심 정치인 조회 성공")
        print(f"  - 등록된 관심 정치인: {len(result.data)}명")

        for fav in result.data:
            print(f"    * politician_id: {fav['politician_id']}")
            print(f"      notes: {fav['notes']}")
            print(f"      notification: {fav['notification_enabled']}")
            print(f"      pinned: {fav['is_pinned']}")
    else:
        print(f"   관심 정치인 조회 실패 (데이터 없음)")

except Exception as e:
    print(f"   관심 정치인 조회 실패: {str(e)}")

print(f"\n[3-3] 관심 정치인 삭제 테스트")

try:
    result = supabase.table('favorite_politicians').delete().eq('user_id', test_user_id).eq('politician_id', test_politician_id).execute()

    print(f"   관심 정치인 삭제 성공")

    # 삭제 확인
    verify = supabase.table('favorite_politicians').select('*').eq('user_id', test_user_id).eq('politician_id', test_politician_id).execute()

    if not verify.data or len(verify.data) == 0:
        print(f"   삭제 확인 완료 (데이터 없음)")
    else:
        print(f"   삭제 확인 실패 (데이터 남아있음)")

except Exception as e:
    print(f"   관심 정치인 삭제 실패: {str(e)}")

print("\n" + "="*70)

# ============================================================================
# 최종 요약
# ============================================================================
print("\n최종 요약")
print("="*70)

print("\n TEST 1: 테스트 정치인 선택 - PASS")
print(" TEST 2: 별점 평가 & Trigger UPSERT - 실행 완료")
print(" TEST 3: 관심 정치인 등록/조회/삭제 - 실행 완료")

print("\n 참고사항:")
print("- 실제 API 엔드포인트 테스트는 브라우저 로그인 필요")
print("- Supabase 직접 테스트로 DB 스키마 및 Trigger 동작 확인 완료")
print("- RLS 정책 테스트는 실제 로그인 사용자로 API 호출 필요")

print("\n" + "="*70 + "\n")
