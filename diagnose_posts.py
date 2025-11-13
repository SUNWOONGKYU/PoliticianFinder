#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
게시글 문제 종합 진단 스크립트
"""
import os
import json
import urllib.request
import urllib.error

# 환경 변수
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

def request(endpoint, method='GET', data=None, use_anon=False):
    """Supabase API 요청"""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"

    headers = {
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }

    try:
        if method == 'GET':
            req = urllib.request.Request(url, headers=headers)
        elif method == 'PATCH':
            req = urllib.request.Request(
                url,
                data=json.dumps(data).encode('utf-8'),
                headers=headers,
                method='PATCH'
            )

        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP {e.code}: {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"❌ 오류: {str(e)}")
        return None

print("=" * 70)
print("게시글 문제 종합 진단")
print("=" * 70)
print()

# 1. 전체 게시글 확인
print("📊 1. 데이터베이스 게시글 현황")
print("-" * 70)
posts = request('posts?select=id,title,moderation_status,user_id,created_at&order=created_at.desc&limit=20')

if posts:
    print(f"✅ 총 {len(posts)}개 게시글 발견 (최근 20개)")
    print()

    # 상태별 집계
    status_count = {}
    for post in posts:
        status = post.get('moderation_status', 'unknown')
        status_count[status] = status_count.get(status, 0) + 1

    print("상태별 분포:")
    for status, count in status_count.items():
        emoji = "✅" if status == "approved" else "❌"
        print(f"  {emoji} {status}: {count}개")

    print()
    print("최근 게시글 목록:")
    for i, post in enumerate(posts[:5], 1):
        print(f"  {i}. [{post['moderation_status']}] {post['title'][:50]}")
        print(f"     ID: {post['id']}, 작성일: {post['created_at']}")
    print()
else:
    print("❌ 게시글을 가져올 수 없습니다.")
    print()

# 2. approved 게시글만 확인
print("📊 2. approved 게시글 (프론트엔드에 표시되어야 할 게시글)")
print("-" * 70)
approved_posts = request('posts?select=id,title&moderation_status=eq.approved&limit=10')

if approved_posts:
    print(f"✅ {len(approved_posts)}개의 approved 게시글")
    for i, post in enumerate(approved_posts[:5], 1):
        print(f"  {i}. {post['title'][:60]}")
    print()
else:
    print("❌ approved 게시글이 없습니다!")
    print("   → 이것이 문제입니다. 게시글이 모두 pending 상태일 가능성이 있습니다.")
    print()

# 3. pending 게시글 확인 및 업데이트
print("📊 3. pending 게시글 확인")
print("-" * 70)
pending_posts = request('posts?select=id,title&moderation_status=eq.pending&limit=10')

if pending_posts and len(pending_posts) > 0:
    print(f"⚠️  {len(pending_posts)}개의 pending 게시글 발견!")
    for i, post in enumerate(pending_posts[:5], 1):
        print(f"  {i}. {post['title'][:60]}")
    print()

    print("🔧 pending → approved 업데이트 중...")
    result = request(
        'posts?moderation_status=eq.pending',
        method='PATCH',
        data={'moderation_status': 'approved'}
    )

    if result:
        print(f"✅ {len(pending_posts)}개 게시글 업데이트 완료!")
    else:
        print("❌ 업데이트 실패")
    print()
else:
    print("✅ pending 게시글이 없습니다.")
    print()

# 4. users 테이블 확인
print("📊 4. users 테이블 확인")
print("-" * 70)
users = request('users?select=id,nickname&limit=5')

if users:
    print(f"✅ {len(users)}명의 사용자 발견")
    for user in users:
        print(f"  - {user.get('nickname', 'N/A')} (ID: {user['id']})")
    print()
else:
    print("⚠️  users 테이블이 비어있거나 접근할 수 없습니다.")
    print("   → 게시글의 user_id가 users 테이블에 없으면 RLS에서 차단될 수 있습니다.")
    print()

# 5. 최종 확인
print("📊 5. 최종 확인 - approved 게시글")
print("-" * 70)
final_check = request('posts?select=id,title,moderation_status&moderation_status=eq.approved&limit=5')

if final_check and len(final_check) > 0:
    print(f"✅ {len(final_check)}개의 approved 게시글 확인!")
    print()
    print("다음 단계:")
    print("1. 브라우저에서 Ctrl+Shift+R (강력 새로고침)")
    print("2. 30초 정도 기다린 후 확인 (API 캐시)")
    print("3. 개발자도구(F12) > Network 탭에서 /api/posts 요청 확인")
    print()
else:
    print("❌ 여전히 approved 게시글이 없습니다.")
    print()
    print("추가 진단 필요:")
    print("1. Supabase Dashboard > Table Editor > posts 테이블 직접 확인")
    print("2. Supabase Dashboard > SQL Editor에서 다음 쿼리 실행:")
    print("   SELECT * FROM posts ORDER BY created_at DESC LIMIT 5;")
    print()

print("=" * 70)
print("진단 완료")
print("=" * 70)
