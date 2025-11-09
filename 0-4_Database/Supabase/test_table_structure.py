#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase 테이블 구조 확인
"""
from supabase import create_client

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # profiles 테이블 샘플
    print("=== profiles 테이블 샘플 ===")
    try:
        result = supabase.table("profiles").select("*").limit(1).execute()
        if result.data:
            print(f"컬럼: {list(result.data[0].keys())}")
        else:
            print("데이터 없음")
    except Exception as e:
        print(f"에러: {e}")

    # posts 테이블 샘플
    print("\n=== posts 테이블 샘플 ===")
    try:
        result = supabase.table("posts").select("*").limit(1).execute()
        if result.data:
            print(f"컬럼: {list(result.data[0].keys())}")
            print(f"데이터: {result.data[0]}")
        else:
            print("데이터 없음")
    except Exception as e:
        print(f"에러: {e}")

    # comments 테이블 샘플
    print("\n=== comments 테이블 샘플 ===")
    try:
        result = supabase.table("comments").select("*").limit(1).execute()
        if result.data:
            print(f"컬럼: {list(result.data[0].keys())}")
            print(f"데이터: {result.data[0]}")
        else:
            print("데이터 없음")
    except Exception as e:
        print(f"에러: {e}")

if __name__ == "__main__":
    main()
