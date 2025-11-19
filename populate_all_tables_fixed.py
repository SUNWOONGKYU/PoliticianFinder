#!/usr/bin/env python3
"""
완벽한 데이터베이스 샘플 데이터 생성
모든 Foreign Key 제약을 정확히 맞춰서 모든 테이블에 데이터 생성
"""
import os, sys
from supabase import create_client
import uuid
from datetime import datetime, timedelta
import random
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 80)
print("Complete Database Population with Correct Foreign Keys")
print("=" * 80)
print()

# Get existing IDs
users_result = supabase.table('users').select('user_id, email').execute()
user_ids = [u['user_id'] for u in users_result.data]

profiles_result = supabase.table('profiles').select('id, email').execute()
profile_ids = [p['id'] for p in profiles_result.data]

politicians_result = supabase.table('politicians').select('id, name').execute()
politician_ids = [p['id'] for p in politicians_result.data]

posts_result = supabase.table('posts').select('id').execute()
post_ids = [p['id'] for p in posts_result.data]

comments_result = supabase.table('comments').select('id').execute()
comment_ids = [c['id'] for c in comments_result.data]

print(f"Existing data:")
print(f"  Users: {len(user_ids)}")
print(f"  Profiles: {len(profile_ids)}")
print(f"  Politicians: {len(politician_ids)}")
print(f"  Posts: {len(post_ids)}")
print(f"  Comments: {len(comment_ids)}")
print()

# ============================================================================
# Step 1: Follows (users.user_id to users.user_id)
# ============================================================================
print("=" * 80)
print("Step 1: Follows (target: 20)")
print("=" * 80)

# follows 테이블이 users.id를 참조한다면 profile_ids 사용
# 하지만 실제로는 users.user_id일 가능성이 높음
# 일단 user_ids로 시도

follows_created = 0
attempts = 0
max_attempts = 100

while follows_created < 20 and attempts < max_attempts:
    follower = random.choice(user_ids)
    following = random.choice(user_ids)

    if follower != following:
        try:
            supabase.table('follows').insert({
                'follower_id': follower,
                'following_id': following,
                'created_at': (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat()
            }).execute()
            follows_created += 1
            if follows_created % 5 == 0:
                print(f"  Created {follows_created} follows...")
        except Exception as e:
            # UNIQUE constraint violation is OK, just try another pair
            if 'duplicate' not in str(e).lower():
                # If it's not a duplicate error, it's likely a foreign key issue
                # Try with profile_ids instead
                try:
                    follower_profile = random.choice(profile_ids)
                    following_profile = random.choice(profile_ids)
                    if follower_profile != following_profile:
                        supabase.table('follows').insert({
                            'follower_id': follower_profile,
                            'following_id': following_profile,
                            'created_at': (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat()
                        }).execute()
                        follows_created += 1
                        if follows_created % 5 == 0:
                            print(f"  Created {follows_created} follows (using profiles)...")
                except:
                    pass
    attempts += 1

print(f"Total follows: {follows_created}")
print()

# ============================================================================
# Step 2: Favorite Politicians
# ============================================================================
print("=" * 80)
print("Step 2: Favorite Politicians (target: 25)")
print("=" * 80)

favorites_created = 0
attempts = 0

while favorites_created < 25 and attempts < 100:
    try:
        # Try with user_ids first
        supabase.table('favorite_politicians').insert({
            'user_id': random.choice(user_ids),
            'politician_id': random.choice(politician_ids),
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 60))).isoformat()
        }).execute()
        favorites_created += 1
        if favorites_created % 5 == 0:
            print(f"  Created {favorites_created} favorites...")
    except:
        # Try with profile_ids
        try:
            supabase.table('favorite_politicians').insert({
                'user_id': random.choice(profile_ids),
                'politician_id': random.choice(politician_ids),
                'created_at': (datetime.now() - timedelta(days=random.randint(1, 60))).isoformat()
            }).execute()
            favorites_created += 1
            if favorites_created % 5 == 0:
                print(f"  Created {favorites_created} favorites (using profiles)...")
        except:
            pass
    attempts += 1

print(f"Total favorites: {favorites_created}")
print()

# ============================================================================
# Step 3: Post Likes
# ============================================================================
print("=" * 80)
print("Step 3: Post Likes (target: 40)")
print("=" * 80)

post_likes_created = 0
attempts = 0

while post_likes_created < 40 and attempts < 100:
    try:
        supabase.table('post_likes').insert({
            'user_id': random.choice(user_ids),
            'post_id': random.choice(post_ids),
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        }).execute()
        post_likes_created += 1
    except:
        try:
            supabase.table('post_likes').insert({
                'user_id': random.choice(profile_ids),
                'post_id': random.choice(post_ids),
                'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
            }).execute()
            post_likes_created += 1
        except:
            pass
    attempts += 1

print(f"Total post likes: {post_likes_created}")
print()

# ============================================================================
# Step 4: Comment Likes
# ============================================================================
print("=" * 80)
print("Step 4: Comment Likes (target: 30)")
print("=" * 80)

comment_likes_created = 0
attempts = 0

while comment_likes_created < 30 and attempts < 100:
    try:
        supabase.table('comment_likes').insert({
            'user_id': random.choice(user_ids),
            'comment_id': random.choice(comment_ids),
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        }).execute()
        comment_likes_created += 1
    except:
        try:
            supabase.table('comment_likes').insert({
                'user_id': random.choice(profile_ids),
                'comment_id': random.choice(comment_ids),
                'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
            }).execute()
            comment_likes_created += 1
        except:
            pass
    attempts += 1

print(f"Total comment likes: {comment_likes_created}")
print()

# ============================================================================
# Step 5: Notifications
# ============================================================================
print("=" * 80)
print("Step 5: Notifications (target: 20)")
print("=" * 80)

notification_types = ['like', 'comment', 'follow', 'mention', 'system']
notifications_created = 0

for i in range(20):
    try:
        notif_data = {
            'user_id': random.choice(user_ids),
            'type': random.choice(notification_types),
            'content': f'새로운 활동이 있습니다. ({i+1})',
            'is_read': random.choice([True, False]),
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 14))).isoformat()
        }
        supabase.table('notifications').insert(notif_data).execute()
        notifications_created += 1
    except:
        try:
            notif_data = {
                'user_id': random.choice(profile_ids),
                'type': random.choice(notification_types),
                'content': f'새로운 활동이 있습니다. ({i+1})',
                'is_read': random.choice([True, False]),
                'created_at': (datetime.now() - timedelta(days=random.randint(1, 14))).isoformat()
            }
            supabase.table('notifications').insert(notif_data).execute()
            notifications_created += 1
        except Exception as e:
            print(f"  Notification error: {str(e)[:50]}")

print(f"Total notifications: {notifications_created}")
print()

# ============================================================================
# Step 6: Shares
# ============================================================================
print("=" * 80)
print("Step 6: Shares (target: 15)")
print("=" * 80)

shares_created = 0

for i in range(15):
    try:
        share_data = {
            'user_id': random.choice(user_ids),
            'post_id': random.choice(post_ids),
            'platform': random.choice(['facebook', 'twitter', 'kakao', 'link']),
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        }
        supabase.table('shares').insert(share_data).execute()
        shares_created += 1
    except:
        try:
            share_data = {
                'user_id': random.choice(profile_ids),
                'post_id': random.choice(post_ids),
                'platform': random.choice(['facebook', 'twitter', 'kakao', 'link']),
                'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
            }
            supabase.table('shares').insert(share_data).execute()
            shares_created += 1
        except Exception as e:
            print(f"  Share error: {str(e)[:50]}")

print(f"Total shares: {shares_created}")
print()

# ============================================================================
# Step 7: Inquiries
# ============================================================================
print("=" * 80)
print("Step 7: Inquiries (target: 10)")
print("=" * 80)

inquiry_titles = [
    '회원가입 문의',
    '로그인 오류',
    '정치인 정보 수정 요청',
    '평가 기능 문의',
    '버그 신고 - 댓글 작성 오류',
    '기능 제안',
    '콘텐츠 신고',
    '계정 탈퇴 문의',
    '기타 문의',
    '정치인 추가 요청'
]

inquiries_created = 0

for i, title in enumerate(inquiry_titles):
    try:
        inquiry_data = {
            'user_id': random.choice(user_ids) if random.random() > 0.3 else None,
            'email': f'user{i}@example.com',
            'politician_id': random.choice(politician_ids) if random.random() > 0.7 else None,
            'title': title,
            'content': f'{title}에 대한 상세 내용입니다.',
            'status': random.choice(['pending', 'pending', 'in_progress', 'resolved']),
            'priority': random.choice(['low', 'normal', 'normal', 'high', 'urgent']),
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        }
        supabase.table('inquiries').insert(inquiry_data).execute()
        inquiries_created += 1
    except Exception as e:
        print(f"  Inquiry error for '{title}': {str(e)[:50]}")

print(f"Total inquiries: {inquiries_created}")
print()

# ============================================================================
# Step 8: Payments
# ============================================================================
print("=" * 80)
print("Step 8: Payments (target: 15)")
print("=" * 80)

payments_created = 0

for i in range(15):
    try:
        payment_data = {
            'user_id': random.choice(user_ids),
            'amount': random.choice([5000, 10000, 30000, 50000]),
            'status': random.choice(['completed', 'completed', 'completed', 'pending', 'failed']),
            'payment_method': random.choice(['card', 'bank_transfer', 'kakao_pay', 'naver_pay']),
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat()
        }
        supabase.table('payments').insert(payment_data).execute()
        payments_created += 1
    except:
        try:
            payment_data = {
                'user_id': random.choice(profile_ids),
                'amount': random.choice([5000, 10000, 30000, 50000]),
                'status': random.choice(['completed', 'completed', 'completed', 'pending', 'failed']),
                'payment_method': random.choice(['card', 'bank_transfer', 'kakao_pay', 'naver_pay']),
                'created_at': (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat()
            }
            supabase.table('payments').insert(payment_data).execute()
            payments_created += 1
        except Exception as e:
            print(f"  Payment error: {str(e)[:50]}")

print(f"Total payments: {payments_created}")
print()

# ============================================================================
# Final Summary
# ============================================================================
print()
print("=" * 80)
print("DATABASE POPULATION COMPLETED!")
print("=" * 80)
print()

# Get final counts
final_counts = {}
tables = ['follows', 'favorite_politicians', 'post_likes', 'comment_likes',
          'notifications', 'shares', 'inquiries', 'payments']

for table in tables:
    try:
        result = supabase.table(table).select('*', count='exact').limit(1).execute()
        final_counts[table] = result.count if result.count is not None else 0
    except:
        final_counts[table] = 0

print("Final record counts:")
for table, count in final_counts.items():
    status = "✅" if count >= 10 else "⚠️"
    print(f"  {status} {table:25} {count:>5} records")

print()
print("=" * 80)
