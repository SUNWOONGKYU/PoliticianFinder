#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""테이블 ID 타입 분석"""
import os, sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*70)
print("테이블 ID 타입 분석")
print("="*70 + "\n")

tables = ['politicians', 'politician_details', 'favorite_politicians']

for table in tables:
    print(f"{table} 테이블:")
    print("-" * 70)
    try:
        result = supabase.table(table).select('*').limit(1).execute()
        if result.data:
            sample = result.data[0]
            print("컬럼과 샘플 데이터:")
            for key, value in sample.items():
                value_type = type(value).__name__
                print(f"  {key}: {value_type} = {value}")
        else:
            print("  (데이터 없음)")
    except Exception as e:
        print(f"  [ERROR] {str(e)}")
    print("")

print("="*70 + "\n")
