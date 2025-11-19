#!/usr/bin/env python3
"""
고아 레코드 수정 - Posts 테이블
posts.user_id가 users.user_id에 존재하지 않는 레코드 수정
"""
import os, sys
from supabase import create_client
import random

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 100)
print("Fix Orphaned Posts Records")
print("=" * 100)
print()

# 1. Get all valid user_ids from users table
users_result = supabase.table('users').select('user_id').execute()
valid_user_ids = [u['user_id'] for u in users_result.data]

print(f"Valid user_ids in users table: {len(valid_user_ids)}")
print()

# 2. Get all posts
posts_result = supabase.table('posts').select('id, user_id, title').execute()
posts = posts_result.data

print(f"Total posts: {len(posts)}")
print()

# 3. Find orphaned posts
orphaned_posts = []
for post in posts:
    if post['user_id'] not in valid_user_ids:
        orphaned_posts.append(post)

print(f"Orphaned posts found: {len(orphaned_posts)}")
print()

if orphaned_posts:
    print("Orphaned posts details:")
    for post in orphaned_posts:
        print(f"  - Post ID: {post['id'][:20]}...")
        print(f"    Invalid user_id: {post['user_id'][:20]}...")
        print(f"    Title: {post['title'][:50]}")
        print()

    # 4. Fix orphaned posts by assigning them to random valid users
    print(f"Fixing {len(orphaned_posts)} orphaned posts...")
    print()

    fixed_count = 0
    for post in orphaned_posts:
        try:
            # Assign to random valid user
            new_user_id = random.choice(valid_user_ids)

            supabase.table('posts').update({
                'user_id': new_user_id
            }).eq('id', post['id']).execute()

            print(f"  Fixed: {post['title'][:40]} -> User: {new_user_id[:20]}...")
            fixed_count += 1
        except Exception as e:
            print(f"  Error fixing post {post['id'][:20]}: {str(e)[:100]}")

    print()
    print(f"Fixed {fixed_count}/{len(orphaned_posts)} orphaned posts")
else:
    print("[OK] No orphaned posts found!")

print()
print("=" * 100)
print("Verification")
print("=" * 100)
print()

# Verify again
posts_result = supabase.table('posts').select('id, user_id').execute()
posts = posts_result.data

orphaned_count = 0
for post in posts:
    if post['user_id'] not in valid_user_ids:
        orphaned_count += 1

if orphaned_count == 0:
    print("[SUCCESS] All posts now have valid user_id references!")
else:
    print(f"[WARNING] Still {orphaned_count} orphaned posts remaining")

print()
print("=" * 100)
