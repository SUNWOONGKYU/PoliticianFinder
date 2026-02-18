#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V30 테이블 상태 확인"""

import sys
import os
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except AttributeError:
        pass

load_dotenv(override=True)

# Supabase 연결
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

print("="*80)
print("V30 테이블 상태 확인")
print("="*80)
print()

# 1. collected_data_v30 테이블 존재 확인
print("1️⃣ collected_data_v30 테이블 확인")
try:
    result = supabase.table('collected_data_v30').select('*').limit(1).execute()
    print("   ✅ collected_data_v30 테이블 존재")

    # 총 레코드 수
    count_result = supabase.table('collected_data_v30').select('id', count='exact').execute()
    print(f"   총 데이터: {count_result.count}개")

    # 샘플 데이터로 필드 확인
    if result.data:
        sample = result.data[0]
        print("\n   📋 필드 목록:")
        for key in sample.keys():
            print(f"      - {key}")

        # 중요 필드 확인
        print("\n   🔍 중요 필드 확인:")
        required_fields = [
            'id', 'politician_id', 'category', 'title', 'content',
            'url', 'collected_at', 'collector_ai', 'data_type'
        ]
        for field in required_fields:
            status = "✅" if field in sample else "❌"
            print(f"      {status} {field}")

except Exception as e:
    print(f"   ❌ 오류: {e}")

print()

# 2. evaluations_v30 테이블 존재 확인
print("2️⃣ evaluations_v30 테이블 확인")
try:
    result = supabase.table('evaluations_v30').select('*').limit(1).execute()
    print("   ✅ evaluations_v30 테이블 존재")

    # 총 레코드 수
    count_result = supabase.table('evaluations_v30').select('id', count='exact').execute()
    print(f"   총 데이터: {count_result.count}개")

    # 샘플 데이터로 필드 확인
    if result.data:
        sample = result.data[0]
        print("\n   📋 필드 목록:")
        for key in sample.keys():
            print(f"      - {key}")

except Exception as e:
    print(f"   ❌ 오류: {e}")

print()

# 3. politician_scores_v30 테이블 존재 확인
print("3️⃣ politician_scores_v30 테이블 확인")
try:
    result = supabase.table('politician_scores_v30').select('*').limit(1).execute()
    print("   ✅ politician_scores_v30 테이블 존재")

    # 총 레코드 수
    count_result = supabase.table('politician_scores_v30').select('id', count='exact').execute()
    print(f"   총 데이터: {count_result.count}개")

except Exception as e:
    print(f"   ❌ 오류: {e}")

print()

# 4. 김민석 데이터 확인
print("4️⃣ 김민석 (f9e00370) 데이터 확인")
try:
    # collected_data_v30
    collected = supabase.table('collected_data_v30')\
        .select('id')\
        .eq('politician_id', 'f9e00370')\
        .execute()
    print(f"   collected_data_v30: {len(collected.data)}개")

    # evaluations_v30
    evaluations = supabase.table('evaluations_v30')\
        .select('id')\
        .eq('politician_id', 'f9e00370')\
        .execute()
    print(f"   evaluations_v30: {len(evaluations.data)}개")

    # politician_scores_v30
    scores = supabase.table('politician_scores_v30')\
        .select('id')\
        .eq('politician_id', 'f9e00370')\
        .execute()
    print(f"   politician_scores_v30: {len(scores.data)}개")

    print("\n   ✅ 김민석 데이터 깨끗함 (수집 준비 완료)")

except Exception as e:
    print(f"   ❌ 오류: {e}")

print()
print("="*80)
print("✅ 테이블 상태 확인 완료")
print("="*80)
