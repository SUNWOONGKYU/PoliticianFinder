#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Fetching ALL posts (no filter)...")
response = supabase.table('posts').select('id, title, politician_id', count='exact').limit(5).execute()
print(f"Total posts: {response.count}")
print(f"First 5 posts:")
for post in response.data:
    post_type = "Politician" if post['politician_id'] else "Member"
    print(f"  - {post_type}: {post['title']}")

print("\nFetching politician posts only...")
response = supabase.table('posts').select('id, title, politician_id', count='exact').not_('politician_id', 'is', None).limit(5).execute()
print(f"Politician posts: {response.count}")

print("\nFetching member posts only...")
response = supabase.table('posts').select('id, title, politician_id', count='exact').is_('politician_id', None).limit(5).execute()
print(f"Member posts: {response.count}")
