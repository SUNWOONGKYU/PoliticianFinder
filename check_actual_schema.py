#!/usr/bin/env python3
"""
실제 데이터베이스 스키마 확인
"""
import os, sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 100)
print("Actual Database Schema Check")
print("=" * 100)
print()

tables = ['users', 'profiles', 'posts', 'comments', 'votes', 'shares',
          'follows', 'favorite_politicians', 'notifications', 'inquiries',
          'payments', 'audit_logs']

for table in tables:
    try:
        result = supabase.table(table).select('*').limit(1).execute()

        if result.data:
            columns = list(result.data[0].keys())
            print(f"Table: {table}")
            print(f"  Columns: {columns}")
            print()
        else:
            print(f"Table: {table}")
            print(f"  No data to infer columns")
            print()
    except Exception as e:
        print(f"Table: {table}")
        print(f"  Error: {str(e)[:100]}")
        print()

print("=" * 100)
