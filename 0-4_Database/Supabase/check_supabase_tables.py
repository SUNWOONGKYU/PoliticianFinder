#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase 테이블 목록 확인
"""
import os
import sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 일단 알려진 테이블들 확인해보기
    tables_to_check = [
        "politician_evaluation",
        "politician_evaluation_v8",
        "politician_evaluations",
        "evaluations",
        "politicians",
        "politician_posts"
    ]

    print("=" * 80)
    print("Supabase 테이블 확인")
    print("=" * 80)
    print()

    for table_name in tables_to_check:
        try:
            response = supabase.table(table_name).select("*").limit(1).execute()
            print(f"✓ {table_name}: 존재 (데이터 샘플 조회 가능)")
            if response.data:
                print(f"  첫 번째 레코드 컬럼: {list(response.data[0].keys())}")
        except Exception as e:
            print(f"✗ {table_name}: 존재하지 않음 ({str(e)[:50]}...)")

    print()

except Exception as e:
    print(f"오류: {e}")
