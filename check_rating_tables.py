#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""관심 정치인 및 별점 평가 테이블 확인"""
import os, sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*70)
print("관심 정치인 및 별점 평가 테이블 확인")
print("="*70 + "\n")

# 1. favorite_politicians 테이블 확인
print("1. favorite_politicians 테이블 확인")
print("-" * 70)
try:
    result = supabase.table('favorite_politicians').select('*').limit(1).execute()
    if result.data or hasattr(result, 'data'):
        print("[OK] 테이블 존재")
        if result.data:
            print("\n컬럼 목록:")
            for key in result.data[0].keys():
                print(f"  - {key}")
        else:
            print("(데이터 없음 - 빈 테이블)")
    else:
        print("[FAIL] 테이블 없음")
except Exception as e:
    print(f"[FAIL] 오류: {str(e)}")

print("\n")

# 2. politician_ratings 테이블 확인
print("2. politician_ratings 테이블 확인")
print("-" * 70)
try:
    result = supabase.table('politician_ratings').select('*').limit(1).execute()
    if result.data or hasattr(result, 'data'):
        print("[OK] 테이블 존재")
        if result.data:
            print("\n컬럼 목록:")
            for key in result.data[0].keys():
                print(f"  - {key}")
        else:
            print("(데이터 없음 - 빈 테이블)")
    else:
        print("[FAIL] 테이블 없음")
except Exception as e:
    print(f"[FAIL] 오류: {str(e)}")

print("\n")

# 3. politician_profiles 테이블 확인 (user_rating, rating_count 필드)
print("3. politician_profiles 테이블 (user_rating, rating_count 필드)")
print("-" * 70)
try:
    result = supabase.table('politician_profiles').select('*').limit(1).execute()
    if result.data:
        print("[OK] 테이블 존재")
        print("\n컬럼 목록:")
        for key in result.data[0].keys():
            print(f"  - {key}")
    else:
        print("[OK] 테이블 존재 (데이터 없음)")
except Exception as e:
    print(f"[FAIL] 오류: {str(e)}")

print("\n" + "="*70 + "\n")
