#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""politician_details 테이블 현재 스키마 확인"""
import os, sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*70)
print("politician_details 테이블 스키마 확인")
print("="*70 + "\n")

try:
    result = supabase.table('politician_details').select('*').limit(1).execute()
    if result.data:
        print("[OK] 테이블 존재\n")
        print("현재 컬럼 목록:")
        print("-" * 70)
        for key in result.data[0].keys():
            print(f"  - {key}")
        print("")
        print("샘플 데이터:")
        print("-" * 70)
        print(result.data[0])
    else:
        print("[OK] 테이블 존재 (데이터 없음)")
except Exception as e:
    print(f"[FAIL] 오류: {str(e)}")

print("\n" + "="*70 + "\n")
