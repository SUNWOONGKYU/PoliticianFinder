#!/usr/bin/env python3
import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

print("Testing with ANON key (same as Next.js API uses):")
print("\n1. All posts:")
result = supabase.table('posts').select('id, user_id, politician_id, moderation_status', count='exact').execute()
print(f"   Total: {result.count}")

print("\n2. Posts with politician_id (NOT NULL):")
# Use filter to get non-null politician_id
all_posts = supabase.table('posts').select('id, user_id, politician_id, moderation_status', count='exact').execute()
politician_posts = [p for p in all_posts.data if p['politician_id'] is not None]
print(f"   Count: {len(politician_posts)}")
if politician_posts:
    print(f"   Sample (first 3):")
    for post in politician_posts[:3]:
        print(f"     - ID: {post['id'][:8]}..., user_id: {post['user_id'][:8] if post['user_id'] else 'NULL'}..., politician_id: {post['politician_id']}, status: {post['moderation_status']}")

print("\n3. Posts without politician_id (IS NULL):")
member_posts = [p for p in all_posts.data if p['politician_id'] is None]
print(f"   Count: {len(member_posts)}")
if member_posts:
    print(f"   Sample (first 3):")
    for post in member_posts[:3]:
        print(f"     - ID: {post['id'][:8]}..., user_id: {post['user_id'][:8] if post['user_id'] else 'NULL'}..., politician_id: {post['politician_id']}, status: {post['moderation_status']}")

print("\n4. Checking unique user_ids in politician posts:")
unique_users = set(post['user_id'] for post in politician_posts if post['user_id'])
print(f"   Unique user_ids: {len(unique_users)}")
print(f"   Sample user_ids: {list(unique_users)[:3]}")
