#!/usr/bin/env python3
"""
posts 테이블 존재 여부 확인
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('1_Frontend/.env.local')

# Supabase 클라이언트 생성
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Supabase URL 또는 Key가 없습니다")

supabase = create_client(url, key)

print("=== posts 테이블 확인 ===\n")

try:
    # posts 테이블 조회 시도
    result = supabase.table('posts').select('*').limit(5).execute()

    print(f"✅ posts 테이블이 존재합니다!")
    print(f"현재 게시글 수: {len(result.data)}개\n")

    if len(result.data) > 0:
        print("기존 게시글:")
        for post in result.data:
            print(f"  - {post.get('title', 'N/A')} ({post.get('category', 'N/A')})")
    else:
        print("게시글이 아직 없습니다. 프론트엔드에서 게시글을 작성하세요!")

except Exception as e:
    print(f"✗ posts 테이블이 없습니다: {str(e)}")
    print("\ncreate_posts_table.sql을 Supabase SQL Editor에서 실행해주세요!")
