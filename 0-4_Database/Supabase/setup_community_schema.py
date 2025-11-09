#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
커뮤니티 스키마를 Supabase에 설정하는 스크립트
"""
import sys
from supabase import create_client

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

def execute_sql(sql):
    """SQL 실행"""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        # SQL을 직접 실행 (RPC 함수 사용)
        result = supabase.rpc('exec_sql', {'sql_query': sql}).execute()

        print(f"[OK] SQL 실행 성공")
        return True
    except Exception as e:
        print(f"[FAIL] SQL 실행 실패: {e}")
        return False

def main():
    """메인 함수"""
    print("=" * 80)
    print("커뮤니티 Mock 데이터 스키마 설정")
    print("=" * 80)

    # SQL 파일 읽기
    try:
        with open("006_community_mock_schema.sql", "r", encoding="utf-8") as f:
            sql = f.read()
        print("[OK] SQL 파일 로드 성공")
    except Exception as e:
        print(f"[FAIL] SQL 파일 로드 실패: {e}")
        return

    # SQL 실행
    if execute_sql(sql):
        print("[OK] 커뮤니티 스키마 설정 완료!")
    else:
        print("[FAIL] 커뮤니티 스키마 설정 실패")

if __name__ == "__main__":
    main()
