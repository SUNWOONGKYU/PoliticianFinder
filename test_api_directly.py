#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API를 직접 테스트
"""
from supabase import create_client
import os
from dotenv import load_dotenv
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
load_dotenv('1_Frontend/.env.local')

url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(url, key)

# API가 반환할 데이터 형식으로 조회
result = supabase.table('posts').select('*').limit(5).order('id', desc=True).execute()

print(f"Total posts fetched: {len(result.data)}")
for post in result.data:
    print(f"\nID: {post['id']}")
    print(f"Title: {post['title']}")
    print(f"Category: {post['category']}")
    print(f"Created at: {post['created_at']}")
    print(f"User ID: {post.get('user_id', 'N/A')}")
