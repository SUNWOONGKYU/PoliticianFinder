#!/usr/bin/env python3
"""
audit_logs 테이블 샘플 데이터 생성
Admin dashboard에서 사용하는 감사 로그
"""
import os, sys
from supabase import create_client
import random
from datetime import datetime, timedelta

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 80)
print("Populate audit_logs table")
print("=" * 80)
print()

# Get admin users
admin_users = supabase.table('users').select('user_id, email').eq('role', 'admin').execute()
admin_ids = [u['user_id'] for u in admin_users.data] if admin_users.data else []

if not admin_ids:
    print("No admin users found! Cannot create audit logs.")
    sys.exit(1)

print(f"Found {len(admin_ids)} admin users")
print()

# Get some target IDs for logs
users = supabase.table('users').select('user_id').limit(10).execute()
user_ids = [u['user_id'] for u in users.data]

posts = supabase.table('posts').select('id').limit(10).execute()
post_ids = [p['id'] for p in posts.data]

politicians = supabase.table('politicians').select('id').limit(10).execute()
politician_ids = [p['id'] for p in politicians.data]

# Audit log templates
action_types = [
    'user_banned',
    'user_unbanned',
    'post_moderated',
    'post_deleted',
    'comment_deleted',
    'politician_verified',
    'politician_updated',
    'inquiry_responded',
    'settings_changed',
    'user_role_changed'
]

target_types = ['user', 'post', 'comment', 'politician', 'inquiry', 'system']

# Create 20 audit logs
audit_logs_created = 0

for i in range(20):
    try:
        action = random.choice(action_types)
        target_type = random.choice(target_types)

        # Select appropriate target_id based on type
        if target_type == 'user':
            target_id = random.choice(user_ids)
        elif target_type == 'post':
            target_id = random.choice(post_ids)
        elif target_type == 'politician':
            target_id = random.choice(politician_ids)
        else:
            target_id = None

        log_data = {
            'admin_id': random.choice(admin_ids),
            'action_type': action,
            'target_type': target_type,
            'target_id': str(target_id) if target_id else None,
            'ip_address': f'192.168.{random.randint(1,255)}.{random.randint(1,255)}',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'metadata': {
                'action': action,
                'reason': 'Sample audit log',
                'details': f'Action performed on {target_type}'
            },
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        }

        supabase.table('audit_logs').insert(log_data).execute()
        audit_logs_created += 1

        if audit_logs_created % 5 == 0:
            print(f"  Created {audit_logs_created} audit logs...")
    except Exception as e:
        print(f"  Error: {str(e)[:100]}")

print(f"\nTotal audit logs created: {audit_logs_created}")

# Final count
result = supabase.table('audit_logs').select('*', count='exact').limit(1).execute()
total = result.count if result.count is not None else 0

print(f"Total audit_logs in database: {total}")
print()
print("=" * 80)
if total >= 10:
    print("[SUCCESS] audit_logs table has sufficient data!")
else:
    print(f"[WARNING] audit_logs only has {total} records")
print("=" * 80)
