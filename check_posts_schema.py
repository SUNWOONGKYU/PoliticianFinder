#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
posts 테이블 스키마 확인
"""
from supabase import create_client
import os
from dotenv import load_dotenv
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv('1_Frontend/.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(url, key)

print("=== Checking posts table schema ===\n")

try:
    # Get one post to see actual columns
    result = supabase.table('posts').select('*').limit(1).execute()

    if result.data and len(result.data) > 0:
        post = result.data[0]
        print("Available columns in posts table:")
        for key in post.keys():
            print(f"  - {key}: {type(post[key]).__name__}")
    else:
        print("No posts found. Trying to insert a minimal post to discover schema...")
        # Try minimal insert
        try:
            test_result = supabase.table('posts').insert({
                "title": "Test",
                "content": "Test content"
            }).execute()
            print("Minimal insert succeeded!")
            if test_result.data:
                print("\nColumns returned:")
                for key in test_result.data[0].keys():
                    print(f"  - {key}")
        except Exception as e2:
            print(f"Insert failed: {str(e2)}")

except Exception as e:
    print(f"Error: {str(e)}")
