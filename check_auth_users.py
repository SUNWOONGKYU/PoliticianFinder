#!/usr/bin/env python3
import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 80)
print("Checking Supabase Auth Users (Recent Gmail users)")
print("=" * 80)
print()

# List recent auth users via Admin API
try:
    auth_users = supabase.auth.admin.list_users()

    print(f"Total auth users: {len(auth_users)}")
    print()

    gmail_users = [u for u in auth_users if 'gmail' in (u.email or '').lower()]

    if gmail_users:
        print(f"Found {len(gmail_users)} Gmail users in auth.users:")
        print()
        for user in gmail_users:
            print(f"ID: {user.id}")
            print(f"Email: {user.email}")
            print(f"Provider: {user.app_metadata.get('provider', 'N/A')}")
            print(f"Created: {user.created_at}")
            print()

            # Check if exists in public.users table
            public_user = supabase.table('users').select('*').eq('user_id', user.id).execute()
            if public_user.data:
                print(f"  -> Found in public.users table:")
                print(f"     Role: {public_user.data[0].get('role')}")
            else:
                print(f"  -> NOT found in public.users table!")
                print(f"  -> Need to create entry")
            print()
    else:
        print("No Gmail users found in auth.users")
        print()
        print("Recent auth users (last 10):")
        for user in auth_users[:10]:
            print(f"  - {user.email} (Provider: {user.app_metadata.get('provider', 'N/A')})")

except Exception as e:
    print(f"Error: {str(e)}")
