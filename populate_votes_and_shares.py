#!/usr/bin/env python3
"""
votes와 shares 테이블 샘플 데이터 생성
- votes: 게시물 및 댓글에 대한 upvote/downvote
- shares: 게시물 및 정치인 공유
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
print("Populate votes and shares tables")
print("=" * 80)
print()

# Get existing IDs
users_result = supabase.table('users').select('user_id').execute()
user_ids = [u['user_id'] for u in users_result.data]

posts_result = supabase.table('posts').select('id').execute()
post_ids = [p['id'] for p in posts_result.data]

comments_result = supabase.table('comments').select('id').execute()
comment_ids = [c['id'] for c in comments_result.data]

politicians_result = supabase.table('politicians').select('id').execute()
politician_ids = [p['id'] for p in politicians_result.data]

print(f"Available resources:")
print(f"  Users: {len(user_ids)}")
print(f"  Posts: {len(post_ids)}")
print(f"  Comments: {len(comment_ids)}")
print(f"  Politicians: {len(politician_ids)}")
print()

# ============================================================================
# Step 1: Votes on Posts (target: 50)
# ============================================================================
print("=" * 80)
print("Step 1: Votes on Posts (target: 50)")
print("=" * 80)

post_votes_created = 0
attempts = 0
max_attempts = 150

while post_votes_created < 50 and attempts < max_attempts:
    try:
        vote_data = {
            'user_id': random.choice(user_ids),
            'post_id': random.choice(post_ids),
            'comment_id': None,
            'vote_type': random.choice(['upvote', 'downvote', 'like', 'dislike']),
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        }

        supabase.table('votes').insert(vote_data).execute()
        post_votes_created += 1

        if post_votes_created % 10 == 0:
            print(f"  Created {post_votes_created} post votes...")
    except Exception as e:
        # UNIQUE constraint violation is OK, just try another combination
        if 'duplicate' not in str(e).lower() and 'unique' not in str(e).lower():
            if attempts % 20 == 0:
                print(f"  Attempt {attempts}: {str(e)[:100]}")
    attempts += 1

print(f"Total post votes: {post_votes_created}")
print()

# ============================================================================
# Step 2: Votes on Comments (target: 30)
# ============================================================================
print("=" * 80)
print("Step 2: Votes on Comments (target: 30)")
print("=" * 80)

comment_votes_created = 0
attempts = 0

while comment_votes_created < 30 and attempts < max_attempts:
    try:
        vote_data = {
            'user_id': random.choice(user_ids),
            'post_id': None,
            'comment_id': random.choice(comment_ids),
            'vote_type': random.choice(['upvote', 'downvote', 'like', 'dislike']),
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        }

        supabase.table('votes').insert(vote_data).execute()
        comment_votes_created += 1

        if comment_votes_created % 10 == 0:
            print(f"  Created {comment_votes_created} comment votes...")
    except Exception as e:
        if 'duplicate' not in str(e).lower() and 'unique' not in str(e).lower():
            if attempts % 20 == 0:
                print(f"  Attempt {attempts}: {str(e)[:100]}")
    attempts += 1

print(f"Total comment votes: {comment_votes_created}")
print()

# ============================================================================
# Step 3: Shares (target: 20)
# ============================================================================
print("=" * 80)
print("Step 3: Shares (target: 20)")
print("=" * 80)

shares_created = 0
platforms = ['facebook', 'twitter', 'kakao', 'link']

for i in range(20):
    try:
        # 70% post shares, 30% politician shares
        if random.random() < 0.7:
            share_data = {
                'user_id': random.choice(user_ids),
                'post_id': random.choice(post_ids),
                'politician_id': None,
                'platform': random.choice(platforms),
                'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
            }
        else:
            share_data = {
                'user_id': random.choice(user_ids),
                'post_id': None,
                'politician_id': random.choice(politician_ids),
                'platform': random.choice(platforms),
                'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
            }

        supabase.table('shares').insert(share_data).execute()
        shares_created += 1

        if shares_created % 5 == 0:
            print(f"  Created {shares_created} shares...")
    except Exception as e:
        print(f"  Share error: {str(e)[:100]}")

print(f"Total shares: {shares_created}")
print()

# ============================================================================
# Final Summary
# ============================================================================
print()
print("=" * 80)
print("VOTES AND SHARES POPULATION COMPLETED!")
print("=" * 80)
print()

# Get final counts for all tables
final_counts = {}
tables = ['users', 'profiles', 'politicians', 'posts', 'comments',
          'follows', 'favorite_politicians', 'notifications', 'inquiries',
          'payments', 'votes', 'shares', 'reports', 'audit_logs']

for table in tables:
    try:
        result = supabase.table(table).select('*', count='exact').limit(1).execute()
        final_counts[table] = result.count if result.count is not None else 0
    except:
        final_counts[table] = 0

print("Final record counts for ALL tables:")
print()
for table, count in final_counts.items():
    if count >= 10:
        status = "[OK]"
    elif count > 0:
        status = "[LOW]"
    else:
        status = "[EMPTY]"
    print(f"  {status} {table:25} {count:>5} records")

print()
print("=" * 80)
print()

# Check if main tables have at least 10 records
main_tables = ['users', 'politicians', 'posts', 'comments', 'votes', 'shares']
all_complete = all(final_counts.get(t, 0) >= 10 for t in main_tables)

if all_complete:
    print("[SUCCESS] All main tables have at least 10 records!")
else:
    print("[WARNING] Some main tables have fewer than 10 records:")
    for table in main_tables:
        count = final_counts.get(table, 0)
        if count < 10:
            print(f"  - {table}: {count} records")

print()
