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
print("Create User Profile in public.users from auth.users")
print("=" * 80)
print()

# Get user from auth.users
email = "wksun999@gmail.com"
print(f"Fetching auth user: {email}")

try:
    auth_users = supabase.auth.admin.list_users()
    target_auth_user = None

    for user in auth_users:
        if user.email == email:
            target_auth_user = user
            break

    if not target_auth_user:
        print(f"[ERROR] User {email} not found in auth.users")
        sys.exit(1)

    print(f"[OK] Found in auth.users:")
    print(f"  ID: {target_auth_user.id}")
    print(f"  Email: {target_auth_user.email}")
    print(f"  Provider: {target_auth_user.app_metadata.get('provider', 'N/A')}")
    print()

    # Check if already exists in public.users
    existing = supabase.table('users').select('*').eq('user_id', target_auth_user.id).execute()

    if existing.data:
        print(f"[INFO] User already exists in public.users")
        print(f"  Role: {existing.data[0].get('role')}")
        sys.exit(0)

    # Create profile in public.users
    print("Creating profile in public.users...")

    # Get metadata
    metadata = target_auth_user.user_metadata or {}
    name = metadata.get('full_name') or metadata.get('name') or email.split('@')[0]
    avatar_url = metadata.get('avatar_url') or metadata.get('picture')

    # Generate nickname from email
    nickname = email.split('@')[0]

    result = supabase.table('users').insert({
        'user_id': target_auth_user.id,
        'email': target_auth_user.email,
        'name': name,
        'nickname': nickname,
        'avatar_url': avatar_url,
        'role': 'user',
        'points': 0,
        'level': 1,
        'is_banned': False,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
    }).execute()

    if result.data:
        print("[OK] User profile created successfully!")
        print()
        print("Profile details:")
        print(f"  User ID: {target_auth_user.id}")
        print(f"  Email: {target_auth_user.email}")
        print(f"  Name: {name}")
        print(f"  Role: user")
        print()
        print("Next step: Run grant_admin_role.py to grant admin access")
    else:
        print("[ERROR] Failed to create user profile")
        sys.exit(1)

except Exception as e:
    print(f"[ERROR] {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
