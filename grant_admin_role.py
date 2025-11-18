#!/usr/bin/env python3
import os, sys
from supabase import create_client
from datetime import datetime
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 80)
print("Grant Admin Role to Recent Google OAuth Users")
print("=" * 80)
print()

# Get all users sorted by creation date (most recent first)
print("Fetching recent users...")
result = supabase.table('users').select('*').order('created_at', desc=True).limit(20).execute()

if not result.data:
    print("No users found")
    sys.exit(1)

print(f"Found {len(result.data)} users")
print()
print("Recent users:")
print("-" * 80)

for idx, user in enumerate(result.data, 1):
    role_indicator = "[ADMIN]" if user.get('role') == 'admin' else "[USER]"
    print(f"{idx}. {role_indicator} {user.get('email')}")
    print(f"   User ID: {user.get('user_id')}")
    print(f"   Name: {user.get('name')}")
    print(f"   Created: {user.get('created_at')}")
    print()

print("=" * 80)
print()

# Check if there's a specific user email provided as argument
if len(sys.argv) > 1:
    target_email = sys.argv[1]
    print(f"Target email from argument: {target_email}")
else:
    # Default: grant admin to the most recently created user
    target_email = result.data[0].get('email')
    print(f"No email provided. Using most recent user: {target_email}")

print()

# Find user by email
user_result = supabase.table('users').select('*').eq('email', target_email).execute()

if not user_result.data:
    print(f"[ERROR] User with email '{target_email}' not found")
    sys.exit(1)

target_user = user_result.data[0]
user_id = target_user.get('user_id')
current_role = target_user.get('role')

print(f"User found:")
print(f"  User ID: {user_id}")
print(f"  Email: {target_email}")
print(f"  Name: {target_user.get('name')}")
print(f"  Current Role: {current_role}")
print()

if current_role == 'admin':
    print("[INFO] User already has admin role")
    sys.exit(0)

# Grant admin role
print("Granting admin role...")
update_result = supabase.table('users').update({
    'role': 'admin',
    'updated_at': datetime.now().isoformat()
}).eq('user_id', user_id).execute()

if update_result.data:
    print("[OK] Admin role granted successfully!")
    print()
    print("User can now access:")
    print("  - /admin (Admin Dashboard)")
    print("  - /api/admin/* (All admin APIs)")
    print()
    print("Please login with this Google account to access admin features")
else:
    print("[ERROR] Failed to grant admin role")
    sys.exit(1)
