#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Testing API call with anon key (simulating frontend)...")
# This simulates what the frontend API route does
response = supabase.table('posts').select('*', count='exact').execute()
print(f"Posts accessible with anon key: {response.count}")
print(f"Posts returned: {len(response.data)}")

if response.count != 86:
    print(f"\nWARNING: RLS is blocking {86 - response.count} posts!")
    print("This means the frontend can only see the posts that pass RLS policies.")
