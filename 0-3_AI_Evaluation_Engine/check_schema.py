#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DB 스키마 확인
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.getenv('SUPABASE_URL')
key: str = os.getenv('SUPABASE_SERVICE_KEY')
supabase: Client = create_client(url, key)

print("Supabase 연결 성공\n")

# 정치인 테이블 확인
print("=== politicians 테이블 ===")
try:
    response = supabase.table('politicians').select('*').limit(1).execute()
    if response.data:
        print("컬럼:", list(response.data[0].keys()))
        print("샘플 데이터:", response.data[0])
    else:
        print("데이터 없음")
except Exception as e:
    print(f"오류: {e}")

# collected_data 테이블 확인
print("\n=== collected_data 테이블 ===")
try:
    response = supabase.table('collected_data').select('*').limit(1).execute()
    if response.data:
        print("컬럼:", list(response.data[0].keys()))
        print("샘플 데이터:", response.data[0])
    else:
        print("데이터 없음 - 빈 INSERT로 컬럼 확인 시도")
        # 빈 레코드로 컬럼명 확인 시도
        try:
            response = supabase.table('collected_data').insert({}).execute()
        except Exception as e2:
            print(f"빈 INSERT 오류 (예상됨): {e2}")
except Exception as e:
    print(f"오류: {e}")

# ai_item_scores 테이블 확인
print("\n=== ai_item_scores 테이블 ===")
try:
    response = supabase.table('ai_item_scores').select('*').limit(1).execute()
    if response.data:
        print("컬럼:", list(response.data[0].keys()))
    else:
        print("데이터 없음")
except Exception as e:
    print(f"오류: {e}")

# ai_category_scores 테이블 확인
print("\n=== ai_category_scores 테이블 ===")
try:
    response = supabase.table('ai_category_scores').select('*').limit(1).execute()
    if response.data:
        print("컬럼:", list(response.data[0].keys()))
    else:
        print("데이터 없음")
except Exception as e:
    print(f"오류: {e}")

print("\n완료")
