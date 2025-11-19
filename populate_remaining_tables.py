#!/usr/bin/env python3
"""
남은 2개 테이블 데이터 생성 (comment_likes, shares)
- comment_likes: comments.id (UUID) 참조
- shares: target_type + target_id 패턴 사용
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
print("Populate Remaining Tables (comment_likes, shares)")
print("=" * 80)
print()

# Get existing IDs
users_result = supabase.table('users').select('user_id').execute()
user_ids = [u['user_id'] for u in users_result.data]

profiles_result = supabase.table('profiles').select('id').execute()
profile_ids = [p['id'] for p in profiles_result.data]

comments_result = supabase.table('comments').select('id').execute()
comment_ids = [c['id'] for c in comments_result.data]

posts_result = supabase.table('posts').select('id').execute()
post_ids = [p['id'] for p in posts_result.data]

politicians_result = supabase.table('politicians').select('id').execute()
politician_ids = [p['id'] for p in politicians_result.data]

print(f"Available resources:")
print(f"  Users: {len(user_ids)}")
print(f"  Profiles: {len(profile_ids)}")
print(f"  Comments: {len(comment_ids)}")
print(f"  Posts: {len(post_ids)}")
print(f"  Politicians: {len(politician_ids)}")
print()

# ============================================================================
# Step 1: Comment Likes (target: 30)
# ============================================================================
print("=" * 80)
print("Step 1: Comment Likes (target: 30)")
print("=" * 80)

comment_likes_created = 0
attempts = 0
max_attempts = 100

while comment_likes_created < 30 and attempts < max_attempts:
    try:
        # Try with user_ids first
        supabase.table('comment_likes').insert({
            'user_id': random.choice(user_ids),
            'comment_id': random.choice(comment_ids),
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        }).execute()
        comment_likes_created += 1
        if comment_likes_created % 5 == 0:
            print(f"  Created {comment_likes_created} comment likes...")
    except Exception as e:
        # Try with profile_ids
        try:
            supabase.table('comment_likes').insert({
                'user_id': random.choice(profile_ids),
                'comment_id': random.choice(comment_ids),
                'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
            }).execute()
            comment_likes_created += 1
            if comment_likes_created % 5 == 0:
                print(f"  Created {comment_likes_created} comment likes (using profiles)...")
        except Exception as e2:
            # Only print if it's not a duplicate error
            if 'duplicate' not in str(e2).lower() and attempts % 10 == 0:
                print(f"  Attempt {attempts}: {str(e2)[:80]}")
    attempts += 1

print(f"Total comment likes: {comment_likes_created}")
print()

# ============================================================================
# Step 2: Shares (target: 15)
# ============================================================================
print("=" * 80)
print("Step 2: Shares (target: 15)")
print("=" * 80)

shares_created = 0
platforms = ['facebook', 'twitter', 'kakao', 'link']

for i in range(15):
    try:
        # Random target type
        target_type = random.choice(['post', 'politician'])

        if target_type == 'post':
            target_id = random.choice(post_ids)
        else:
            target_id = random.choice(politician_ids)

        # Try with user_ids first
        share_data = {
            'user_id': random.choice(user_ids),
            'target_type': target_type,
            'target_id': target_id,
            'platform': random.choice(platforms),
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        }

        supabase.table('shares').insert(share_data).execute()
        shares_created += 1
        if shares_created % 5 == 0:
            print(f"  Created {shares_created} shares...")
    except Exception as e:
        # Try with profile_ids
        try:
            share_data = {
                'user_id': random.choice(profile_ids),
                'target_type': target_type,
                'target_id': target_id,
                'platform': random.choice(platforms),
                'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
            }
            supabase.table('shares').insert(share_data).execute()
            shares_created += 1
            if shares_created % 5 == 0:
                print(f"  Created {shares_created} shares (using profiles)...")
        except Exception as e2:
            print(f"  Share error: {str(e2)[:80]}")

print(f"Total shares: {shares_created}")
print()

# ============================================================================
# Final Summary
# ============================================================================
print()
print("=" * 80)
print("REMAINING TABLES POPULATION COMPLETED!")
print("=" * 80)
print()

# Get final counts for all tables
final_counts = {}
tables = ['users', 'profiles', 'politicians', 'posts', 'comments',
          'follows', 'favorite_politicians', 'post_likes', 'comment_likes',
          'notifications', 'shares', 'inquiries', 'payments']

for table in tables:
    try:
        result = supabase.table(table).select('*', count='exact').limit(1).execute()
        final_counts[table] = result.count if result.count is not None else 0
    except:
        final_counts[table] = 0

print("Final record counts for ALL tables:")
print()
for table, count in final_counts.items():
    status = "✅" if count >= 10 else ("⚠️" if count > 0 else "❌")
    print(f"  {status} {table:25} {count:>5} records")

print()
print("=" * 80)
print()

# Check if all tables have at least 10 records
all_tables_complete = all(count >= 10 for count in final_counts.values())

if all_tables_complete:
    print("🎉 SUCCESS! All tables have at least 10 records!")
else:
    print("⚠️  Some tables still have fewer than 10 records.")
    print("   Tables with < 10 records:")
    for table, count in final_counts.items():
        if count < 10:
            print(f"     - {table}: {count} records")

print()
