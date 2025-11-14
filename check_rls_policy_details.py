#!/usr/bin/env python3
import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
# Use SERVICE ROLE KEY to check RLS policies
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.EXtjOJMjk7vAWv4AvhIICv6AGFX7wnC5mRPV05HzQ5U"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("Checking RLS policies on 'posts' table...")
try:
    # Query pg_policies to see RLS policies
    result = supabase.rpc('exec_sql', {
        'query': """
        SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'posts'
        ORDER BY policyname;
        """
    }).execute()

    print("RLS Policies found:")
    for policy in result.data:
        print(f"\n  Policy: {policy['policyname']}")
        print(f"    Command: {policy['cmd']}")
        print(f"    Roles: {policy['roles']}")
        print(f"    USING: {policy['qual']}")
        print(f"    WITH CHECK: {policy['with_check']}")
except Exception as e:
    print(f"Error querying policies: {e}")
    print("\nTrying alternative method...")

# Let's check if there's a user_id filter issue
print("\n\nChecking posts with politician_id:")
result = supabase.table('posts').select('id, user_id, politician_id').not_('politician_id', 'is', None).limit(5).execute()
print(f"  Sample politician posts (first 5):")
for post in result.data[:5]:
    print(f"    ID: {post['id']}, user_id: {post['user_id']}, politician_id: {post['politician_id']}")

print("\n\nChecking posts without politician_id:")
result = supabase.table('posts').select('id, user_id, politician_id').is_('politician_id', None).limit(5).execute()
print(f"  Sample member posts (first 5):")
for post in result.data[:5]:
    print(f"    ID: {post['id']}, user_id: {post['user_id']}, politician_id: {post['politician_id']}")
