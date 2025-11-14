#!/usr/bin/env python3
import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Testing API call (anon key - with RLS):")
try:
    response = supabase.table('posts').select('*', count='exact').execute()
    print(f"  Posts returned: {response.count}")
    print(f"  First 3 post IDs: {[p['id'] for p in response.data[:3]]}")

    # Check politician posts
    politician_posts = [p for p in response.data if p.get('politician_id')]
    member_posts = [p for p in response.data if not p.get('politician_id')]
    print(f"  Politician posts: {len(politician_posts)}")
    print(f"  Member posts: {len(member_posts)}")
except Exception as e:
    print(f"  Error: {e}")
