#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""별점 평가 마이그레이션 적용"""
import os, sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

print("\n" + "="*70)
print("별점 평가 마이그레이션 적용")
print("="*70 + "\n")

# Read migration SQL
migration_path = "0-4_Database/Supabase/migrations/023_add_rating_favorite_to_politician_details.sql"
with open(migration_path, 'r', encoding='utf-8') as f:
    sql = f.read()

print(f"마이그레이션 파일 읽기: {migration_path}")
print(f"SQL 크기: {len(sql)} bytes\n")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Supabase에 SQL 실행 중...")
print("-" * 70)

try:
    # Execute raw SQL using rpc
    result = supabase.rpc('exec_sql', {'sql_query': sql}).execute()
    print("[OK] 마이그레이션 성공")
except Exception as e:
    print(f"[INFO] RPC 방법 실패, 직접 실행 시도...")
    print(f"오류: {str(e)}\n")

    print("Supabase 대시보드에서 다음 SQL을 수동으로 실행하세요:")
    print("https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx/editor")
    print("-" * 70)
    print(sql)
    print("-" * 70)

print("\n" + "="*70 + "\n")
