#!/usr/bin/env python3
"""
Posts 고아 레코드 수정 - profiles.id 기준
posts.user_id는 profiles.id를 참조함 (users.user_id 아님!)
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
print("Fix Posts Orphaned Records - Match to profiles.id")
print("=" * 100)
print()

# 1. Get all valid profile IDs
profiles_result = supabase.table('profiles').select('id').execute()
valid_profile_ids = [p['id'] for p in profiles_result.data]

print(f"Valid profile IDs: {len(valid_profile_ids)}")
print()

# 2. Get all posts
posts_result = supabase.table('posts').select('id, user_id, title').execute()
posts = posts_result.data

print(f"Total posts: {len(posts)}")
print()

# 3. Find orphaned posts
orphaned_posts = []
for post in posts:
    if post['user_id'] not in valid_profile_ids:
        orphaned_posts.append(post)

print(f"Orphaned posts (user_id not in profiles.id): {len(orphaned_posts)}")
print()

if orphaned_posts:
    print("Fixing orphaned posts by assigning to random profiles...")
    print()

    fixed_count = 0
    for post in orphaned_posts:
        try:
            new_profile_id = random.choice(valid_profile_ids)

            supabase.table('posts').update({
                'user_id': new_profile_id
            }).eq('id', post['id']).execute()

            print(f"  Fixed post: {post['title'][:40]}")
            fixed_count += 1
        except Exception as e:
            print(f"  Error: {str(e)[:100]}")

    print()
    print(f"Fixed {fixed_count}/{len(orphaned_posts)} orphaned posts")
else:
    print("[OK] No orphaned posts!")

print()
print("=" * 100)
print("Verification")
print("=" * 100)
print()

# Verify
posts_result = supabase.table('posts').select('id, user_id').execute()
posts = posts_result.data

orphaned_count = 0
for post in posts:
    if post['user_id'] not in valid_profile_ids:
        orphaned_count += 1

if orphaned_count == 0:
    print("[SUCCESS] All posts.user_id now match profiles.id!")
else:
    print(f"[WARNING] Still {orphaned_count} orphaned posts")

print()
print("=" * 100)
