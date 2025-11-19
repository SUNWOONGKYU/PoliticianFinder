#!/usr/bin/env python3
"""
테스트 데이터 생성 스크립트
- 새로운 테스트 사용자 생성
- 게시글, 댓글, 문의 등 샘플 데이터 생성
"""
import os, sys
from supabase import create_client
import uuid
from datetime import datetime, timedelta
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 80)
print("Test Data Creation Script")
print("=" * 80)
print()

# Step 1: 기존 Mock 데이터 확인 및 삭제
print("Step 1: Checking for existing mock data...")
print()

# Check inquiries
inquiries = supabase.table('inquiries').select('*').execute()
print(f"Current inquiries: {len(inquiries.data)} records")

# Check posts
posts = supabase.table('posts').select('*').execute()
print(f"Current posts: {len(posts.data)} records")

# Check comments
comments = supabase.table('comments').select('*').execute()
print(f"Current comments: {len(comments.data)} records")

# Check users
users = supabase.table('users').select('user_id, email, role').execute()
print(f"Current users: {len(users.data)} records")
for user in users.data:
    print(f"  - {user['email']} (role: {user['role']})")

print()
print("=" * 80)
input("Press Enter to delete ALL existing data (except admin users)...")
print()

# Step 2: Mock 데이터 삭제
print("Step 2: Deleting mock data...")

# Delete inquiries (except those from admin)
admin_users = supabase.table('users').select('user_id').eq('role', 'admin').execute()
admin_ids = [u['user_id'] for u in admin_users.data]

inquiries_to_delete = [i for i in inquiries.data if not i.get('user_id') or i.get('user_id') not in admin_ids]
for inquiry in inquiries_to_delete:
    supabase.table('inquiries').delete().eq('id', inquiry['id']).execute()
    print(f"  Deleted inquiry: {inquiry['title']}")

# Delete comments
for comment in comments.data:
    supabase.table('comments').delete().eq('id', comment['id']).execute()
print(f"  Deleted {len(comments.data)} comments")

# Delete posts
for post in posts.data:
    supabase.table('posts').delete().eq('id', post['id']).execute()
print(f"  Deleted {len(posts.data)} posts")

# Delete non-admin users
users_to_delete = [u for u in users.data if u['role'] != 'admin']
for user in users_to_delete:
    supabase.table('users').delete().eq('user_id', user['user_id']).execute()
    print(f"  Deleted user: {user['email']}")

print()
print("=" * 80)
print("Step 3: Creating new test users...")
print()

# Create test users
test_users = [
    {
        'email': 'testuser1@example.com',
        'name': '김철수',
        'nickname': 'chulsoo',
        'role': 'user',
        'points': 100,
        'level': 2
    },
    {
        'email': 'testuser2@example.com',
        'name': '이영희',
        'nickname': 'younghee',
        'role': 'user',
        'points': 50,
        'level': 1
    },
    {
        'email': 'testuser3@example.com',
        'name': '박지민',
        'nickname': 'jimin',
        'role': 'user',
        'points': 200,
        'level': 3
    }
]

created_users = []
for user_data in test_users:
    user_id = str(uuid.uuid4())
    result = supabase.table('users').insert({
        'user_id': user_id,
        'email': user_data['email'],
        'name': user_data['name'],
        'nickname': user_data['nickname'],
        'role': user_data['role'],
        'points': user_data['points'],
        'level': user_data['level'],
        'is_banned': False,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }).execute()

    created_users.append({**user_data, 'user_id': user_id})
    print(f"Created user: {user_data['name']} ({user_data['email']})")

print()
print(f"Total {len(created_users)} test users created")
print()

print("=" * 80)
print("Test data creation completed!")
print("=" * 80)
print()
print("Created users:")
for user in created_users:
    print(f"  - {user['name']} ({user['email']}) - ID: {user['user_id']}")
