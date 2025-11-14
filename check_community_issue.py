#!/usr/bin/env python3
import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Total posts:")
all_posts = supabase.table('posts').select('*', count='exact').execute()
print(f"  {all_posts.count}")

politician_count = 0
member_count = 0
for post in all_posts.data:
    if post.get('politician_id'):
        politician_count += 1
    else:
        member_count += 1

print(f"\nPolitician posts: {politician_count}")
print(f"Member posts: {member_count}")
print(f"Total: {politician_count + member_count}")

# Check moderation status
approved = sum(1 for p in all_posts.data if p.get('moderation_status') == 'approved')
print(f"\nApproved posts: {approved}")
