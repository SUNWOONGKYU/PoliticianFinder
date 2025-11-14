#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Checking posts table...")
response = supabase.table('posts').select('id, title, moderation_status', count='exact').execute()
print(f"Total posts in database: {response.count}")
print(f"Posts returned: {len(response.data)}")

# Check moderation status
if response.data:
    approved = sum(1 for p in response.data if p.get('moderation_status') == 'approved')
    pending = sum(1 for p in response.data if p.get('moderation_status') == 'pending')
    rejected = sum(1 for p in response.data if p.get('moderation_status') == 'rejected')
    none_status = sum(1 for p in response.data if p.get('moderation_status') is None)
    print(f"\nModeration status breakdown:")
    print(f"  Approved: {approved}")
    print(f"  Pending: {pending}")
    print(f"  Rejected: {rejected}")
    print(f"  None/Null: {none_status}")

print("\nChecking profiles/users table...")
profiles_response = supabase.table('profiles').select('id, email', count='exact').execute()
print(f"Total profiles: {profiles_response.count}")
