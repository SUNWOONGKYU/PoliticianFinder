#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mock 데이터를 위한 테이블을 Supabase에 생성하는 스크립트
"""
import sys
from supabase import create_client
from postgrest.exceptions import APIError

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

def main():
    """메인 함수"""
    print("=" * 80)
    print("Mock 데이터 테이블 확인 및 생성")
    print("=" * 80)

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("[OK] Supabase 연결 성공")
    except Exception as e:
        print(f"[FAIL] Supabase 연결 실패: {e}")
        return

    # 1. profiles 테이블 확인
    print("\n1. profiles 테이블 확인...")
    try:
        result = supabase.table("profiles").select("*").limit(1).execute()
        print(f"[OK] profiles 테이블 존재 (현재 {len(result.data)}건)")
    except Exception as e:
        print(f"[INFO] profiles 테이블 상태: {e}")

    # 2. posts 테이블 확인 및 생성
    print("\n2. posts 테이블 확인...")
    try:
        result = supabase.table("posts").select("*").limit(1).execute()
        print(f"[OK] posts 테이블 존재 (현재 {len(result.data)}건)")
    except Exception as e:
        print(f"[INFO] posts 테이블 없음. 수동으로 Supabase SQL Editor에서 생성 필요")
        print("SQL Editor에서 다음 SQL 실행:")
        print("""
CREATE TABLE IF NOT EXISTS public.posts (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    author_id VARCHAR(100),
    author_type VARCHAR(50) DEFAULT 'user',
    politician_id VARCHAR(100),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_hot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_all_posts ON public.posts FOR SELECT USING (true);
CREATE POLICY insert_posts ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY update_posts ON public.posts FOR UPDATE USING (true);
CREATE POLICY delete_posts ON public.posts FOR DELETE USING (true);
        """)

    # 3. comments 테이블 확인
    print("\n3. comments 테이블 확인...")
    try:
        result = supabase.table("comments").select("*").limit(1).execute()
        print(f"[OK] comments 테이블 존재 (현재 {len(result.data)}건)")
    except Exception as e:
        print(f"[INFO] comments 테이블 없음. 수동으로 Supabase SQL Editor에서 생성 필요")
        print("SQL Editor에서 다음 SQL 실행:")
        print("""
CREATE TABLE IF NOT EXISTS public.comments (
    id VARCHAR(50) PRIMARY KEY,
    post_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(100),
    author_type VARCHAR(50) DEFAULT 'user',
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    parent_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_all_comments ON public.comments FOR SELECT USING (true);
CREATE POLICY insert_comments ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY update_comments ON public.comments FOR UPDATE USING (true);
CREATE POLICY delete_comments ON public.comments FOR DELETE USING (true);
        """)

    print("\n" + "=" * 80)
    print("테이블 확인 완료")
    print("=" * 80)

if __name__ == "__main__":
    main()
