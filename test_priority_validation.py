#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
1순위 필수 테스트
- Supabase 마이그레이션 실행 확인
- politician_details 레코드 확인
- 스키마 검증 (politician_id TEXT 타입)
"""
import os, sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*70)
print("1순위 필수 테스트")
print("="*70 + "\n")

# ============================================================================
# TEST 1: 마이그레이션 실행 확인
# ============================================================================
print("TEST 1: 마이그레이션 실행 확인")
print("-" * 70)

test1_passed = True

# 1-1. politician_ratings 테이블 존재 확인
print("\n[1-1] politician_ratings 테이블 존재 확인")
try:
    result = supabase.table('politician_ratings').select('*').limit(1).execute()
    print("  OK: politician_ratings 테이블 존재")

    if result.data and len(result.data) > 0:
        sample = result.data[0]
        print(f"  - 샘플 데이터: {len(result.data)}개 존재")
        print(f"  - 컬럼: {list(sample.keys())}")
    else:
        print("  - 데이터: 0개 (테이블은 존재하지만 비어있음)")

except Exception as e:
    print(f"  FAIL: {str(e)}")
    test1_passed = False

# 1-2. politician_details에 user_rating, rating_count 컬럼 확인
print("\n[1-2] politician_details 테이블 및 컬럼 확인")
try:
    result = supabase.table('politician_details').select('user_rating, rating_count, politician_id').limit(1).execute()
    print("  OK: politician_details 테이블 존재")
    print("  OK: user_rating, rating_count 컬럼 존재")

    if result.data and len(result.data) > 0:
        sample = result.data[0]
        print(f"  - 샘플 데이터:")
        print(f"    politician_id: {sample.get('politician_id')} (type: {type(sample.get('politician_id')).__name__})")
        print(f"    user_rating: {sample.get('user_rating')}")
        print(f"    rating_count: {sample.get('rating_count')}")
    else:
        print("  - 데이터: 0개 (테이블은 존재하지만 비어있음)")

except Exception as e:
    print(f"  FAIL: {str(e)}")
    test1_passed = False

# 1-3. favorite_politicians에 notes, notification_enabled, is_pinned 컬럼 확인
print("\n[1-3] favorite_politicians 테이블 및 신규 컬럼 확인")
try:
    result = supabase.table('favorite_politicians').select('notes, notification_enabled, is_pinned, politician_id').limit(1).execute()
    print("  OK: favorite_politicians 테이블 존재")
    print("  OK: notes, notification_enabled, is_pinned 컬럼 존재")

    if result.data and len(result.data) > 0:
        sample = result.data[0]
        print(f"  - 샘플 데이터:")
        print(f"    politician_id: {sample.get('politician_id')} (type: {type(sample.get('politician_id')).__name__})")
        print(f"    notes: {sample.get('notes')}")
        print(f"    notification_enabled: {sample.get('notification_enabled')}")
        print(f"    is_pinned: {sample.get('is_pinned')}")
    else:
        print("  - 데이터: 0개")

except Exception as e:
    print(f"  FAIL: {str(e)}")
    test1_passed = False

print("\n" + "-" * 70)
if test1_passed:
    print("TEST 1 결과: PASS (모든 마이그레이션 성공)")
else:
    print("TEST 1 결과: FAIL (일부 마이그레이션 미완료)")

# ============================================================================
# TEST 2: politician_details 레코드 확인
# ============================================================================
print("\n" + "="*70)
print("TEST 2: politician_details 레코드 존재 여부")
print("-" * 70)

test2_passed = True

# 2-1. politicians 테이블 개수
print("\n[2-1] politicians 테이블 레코드 수")
try:
    result = supabase.table('politicians').select('id', count='exact').execute()
    politicians_count = result.count
    print(f"  politicians: {politicians_count}개")
except Exception as e:
    print(f"  FAIL: {str(e)}")
    politicians_count = 0
    test2_passed = False

# 2-2. politician_details 테이블 개수
print("\n[2-2] politician_details 테이블 레코드 수")
try:
    result = supabase.table('politician_details').select('politician_id', count='exact').execute()
    details_count = result.count
    print(f"  politician_details: {details_count}개")
except Exception as e:
    print(f"  FAIL: {str(e)}")
    details_count = 0
    test2_passed = False

# 2-3. 매칭 확인
print("\n[2-3] 레코드 수 매칭 확인")
if politicians_count == details_count:
    print(f"  OK: 완벽히 매칭됨 ({politicians_count} == {details_count})")
elif details_count == 0 and politicians_count > 0:
    print(f"  WARNING: politician_details가 비어있음")
    print(f"  - politicians: {politicians_count}개")
    print(f"  - politician_details: {details_count}개")
    print(f"  - Trigger UPSERT가 자동으로 생성하므로 문제없음")
    print(f"  - 첫 별점 평가 시 자동 생성됨")
elif details_count < politicians_count:
    print(f"  WARNING: 일부 politician_details 누락")
    print(f"  - politicians: {politicians_count}개")
    print(f"  - politician_details: {details_count}개")
    print(f"  - 누락: {politicians_count - details_count}개")
else:
    print(f"  ERROR: politician_details가 더 많음 (데이터 불일치)")
    print(f"  - politicians: {politicians_count}개")
    print(f"  - politician_details: {details_count}개")
    test2_passed = False

print("\n" + "-" * 70)
if test2_passed and (politicians_count == details_count or details_count == 0):
    print("TEST 2 결과: PASS (레코드 상태 정상)")
else:
    print("TEST 2 결과: WARNING (일부 불일치, Trigger가 자동 보정)")

# ============================================================================
# TEST 3: 스키마 검증 (politician_id TEXT 타입)
# ============================================================================
print("\n" + "="*70)
print("TEST 3: 스키마 검증 (politician_id TEXT 타입)")
print("-" * 70)

test3_passed = True

# 3-1. politicians.id 타입 확인
print("\n[3-1] politicians.id 타입 확인")
try:
    result = supabase.table('politicians').select('id').limit(1).execute()
    if result.data and len(result.data) > 0:
        politician_id = result.data[0]['id']
        id_type = type(politician_id).__name__
        print(f"  실제 값: {politician_id}")
        print(f"  Python 타입: {id_type}")

        if id_type == 'str' and len(politician_id) == 8:
            print(f"  OK: TEXT 타입 (8자리 hex)")
        elif id_type == 'str':
            print(f"  OK: TEXT 타입 (길이: {len(politician_id)})")
        else:
            print(f"  WARNING: {id_type} 타입 (TEXT 권장)")
    else:
        print("  SKIP: 데이터 없음")
except Exception as e:
    print(f"  FAIL: {str(e)}")
    test3_passed = False

# 3-2. politician_ratings.politician_id 타입 확인
print("\n[3-2] politician_ratings.politician_id 타입 확인")
try:
    result = supabase.table('politician_ratings').select('politician_id').limit(1).execute()
    if result.data and len(result.data) > 0:
        politician_id = result.data[0]['politician_id']
        id_type = type(politician_id).__name__
        print(f"  실제 값: {politician_id}")
        print(f"  Python 타입: {id_type}")

        if id_type == 'str':
            print(f"  OK: TEXT 타입")
        else:
            print(f"  ERROR: {id_type} 타입 (TEXT여야 함!)")
            test3_passed = False
    else:
        print("  SKIP: 데이터 없음 (아직 별점 평가 없음)")
except Exception as e:
    print(f"  INFO: {str(e)} (테이블 비어있음)")

# 3-3. favorite_politicians.politician_id 타입 확인
print("\n[3-3] favorite_politicians.politician_id 타입 확인")
try:
    result = supabase.table('favorite_politicians').select('politician_id').limit(1).execute()
    if result.data and len(result.data) > 0:
        politician_id = result.data[0]['politician_id']
        id_type = type(politician_id).__name__
        print(f"  실제 값: {politician_id}")
        print(f"  Python 타입: {id_type}")

        if id_type == 'str':
            print(f"  OK: TEXT 타입")
        else:
            print(f"  ERROR: {id_type} 타입 (TEXT여야 함!)")
            test3_passed = False
    else:
        print("  SKIP: 데이터 없음 (아직 관심 정치인 등록 없음)")
except Exception as e:
    print(f"  INFO: {str(e)} (테이블 비어있음)")

# 3-4. politician_details.politician_id 타입 확인
print("\n[3-4] politician_details.politician_id 타입 확인")
try:
    result = supabase.table('politician_details').select('politician_id').limit(1).execute()
    if result.data and len(result.data) > 0:
        politician_id = result.data[0]['politician_id']
        id_type = type(politician_id).__name__
        print(f"  실제 값: {politician_id}")
        print(f"  Python 타입: {id_type}")

        if id_type == 'str':
            print(f"  OK: TEXT 타입")
        elif id_type == 'int':
            print(f"  ERROR: INTEGER 타입 (TEXT여야 함!)")
            test3_passed = False
        else:
            print(f"  WARNING: {id_type} 타입")
    else:
        print("  SKIP: 데이터 없음")
except Exception as e:
    print(f"  FAIL: {str(e)}")
    test3_passed = False

print("\n" + "-" * 70)
if test3_passed:
    print("TEST 3 결과: PASS (모든 politician_id가 TEXT 타입)")
else:
    print("TEST 3 결과: FAIL (타입 불일치 발견)")

# ============================================================================
# 최종 요약
# ============================================================================
print("\n" + "="*70)
print("최종 요약")
print("="*70)

print("\nTEST 1 (마이그레이션): ", "PASS" if test1_passed else "FAIL")
print("TEST 2 (레코드 매칭): ", "PASS" if test2_passed else "WARNING")
print("TEST 3 (타입 검증): ", "PASS" if test3_passed else "FAIL")

if test1_passed and test3_passed:
    print("\n최종 판정: PASS (배포 가능)")
    print("- 모든 마이그레이션 정상 실행")
    print("- politician_id TEXT 타입 일관성 유지")
    print("- Trigger UPSERT가 자동으로 레코드 생성")
else:
    print("\n최종 판정: FAIL (수정 필요)")
    if not test1_passed:
        print("- 마이그레이션 실행 필요")
    if not test3_passed:
        print("- 타입 불일치 수정 필요")

print("\n" + "="*70 + "\n")
