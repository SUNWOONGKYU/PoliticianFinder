#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V30 테이블 생성 검증"""

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
print("V30 테이블 생성 검증")
print("="*80)
print()

# 확인할 테이블 목록
tables = [
    "collected_data_v30",
    "evaluations_v30",
    "ai_category_scores_v30",
    "ai_final_scores_v30",
    "grade_reference_v30"
]

success_count = 0
fail_count = 0

for idx, table_name in enumerate(tables, 1):
    print(f"{idx}️⃣ {table_name}")
    try:
        result = supabase.table(table_name).select('*').limit(1).execute()
        count_result = supabase.table(table_name).select('id', count='exact').execute()
        print(f"   ✅ 테이블 존재")
        print(f"   데이터: {count_result.count}개")
        success_count += 1
    except Exception as e:
        print(f"   ❌ 오류: {e}")
        fail_count += 1
    print()

print("="*80)
print("검증 결과")
print("="*80)
print(f"✅ 성공: {success_count}개")
print(f"❌ 실패: {fail_count}개")
print()

if fail_count == 0:
    print("🎉 모든 V30 테이블이 정상적으로 생성되었습니다!")
    print()
    print("✅ 수집 준비 완료!")
    print()
    print("김민석 수집 명령어:")
    print("python collect_v30.py --politician_id=f9e00370 --politician_name=\"김민석\"")
else:
    print("⚠️ 일부 테이블이 생성되지 않았습니다.")
    print("Supabase Dashboard에서 SQL을 다시 실행해주세요.")

print()
print("="*80)
