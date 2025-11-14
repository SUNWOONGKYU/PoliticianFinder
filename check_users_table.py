#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Checking 'users' table...")
try:
    response = supabase.table('users').select('*', count='exact').limit(1).execute()
    print(f"'users' table exists: {response.count} rows")
except Exception as e:
    print(f"'users' table error: {e}")

print("\nChecking 'profiles' table...")
try:
    response = supabase.table('profiles').select('*', count='exact').limit(1).execute()
    print(f"'profiles' table exists: {response.count} rows")
except Exception as e:
    print(f"'profiles' table error: {e}")
