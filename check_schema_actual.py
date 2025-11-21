#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*70)
print("테이블 조회")
print("="*70 + "\n")

print("1. politician_details")
print("-" * 70)
try:
    result = supabase.table('politician_details').select('*').limit(1).execute()
    if result.data:
        print("[OK] 데이터 있음")
        for k, v in result.data[0].items():
            print(f"  {k}: {type(v).__name__} = {v}")
    else:
        print("[OK] 데이터 없음")
except Exception as e:
    print(f"[FAIL] {str(e)}")

print("\n2. politician_ratings")
print("-" * 70)
try:
    result = supabase.table('politician_ratings').select('*').limit(1).execute()
    if result.data:
        print("[OK] 데이터 있음")
        for k, v in result.data[0].items():
            print(f"  {k}: {type(v).__name__} = {v}")
    else:
        print("[OK] 데이터 없음")
except Exception as e:
    print(f"[FAIL] {str(e)}")

print("\n" + "="*70 + "\n")
