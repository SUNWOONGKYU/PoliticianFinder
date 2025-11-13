#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
게시글 moderation_status 문제 해결 스크립트 (간단한 버전)
- HTTP 요청을 직접 사용하여 데이터베이스 상태 확인 및 업데이트
"""
import os
import sys
import json
import urllib.request
import urllib.error

# .env.local 파일에서 환경 변수 로드
env_path = '1_Frontend/.env.local'
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value.strip('"').strip("'")

# Supabase 연결 정보
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
anon_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Service Role Key를 사용하거나, 없으면 Anon Key 사용
api_key = service_key if service_key else anon_key

if not url or not api_key:
    print("❌ 오류: Supabase URL 또는 API Key가 .env.local 파일에 없습니다.")
    print("\n필요한 환경 변수:")
    print("  - NEXT_PUBLIC_SUPABASE_URL")
    print("  - NEXT_PUBLIC_SUPABASE_ANON_KEY 또는 SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

print("=" * 60)
print("게시글 Moderation Status 문제 해결 스크립트")
print("=" * 60)
print()

# Supabase REST API 호출 함수
def supabase_request(endpoint, method='GET', data=None):
    """Supabase REST API 요청"""
    full_url = f"{url}/rest/v1/{endpoint}"

    headers = {
        'apikey': api_key,
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }

    try:
        if method == 'GET':
            req = urllib.request.Request(full_url, headers=headers)
        elif method == 'PATCH':
            req = urllib.request.Request(
                full_url,
                data=json.dumps(data).encode('utf-8'),
                headers=headers,
                method='PATCH'
            )

        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"❌ HTTP 오류: {e.code}")
        print(f"오류 내용: {error_body}")
        return None
    except Exception as e:
        print(f"❌ 요청 오류: {str(e)}")
        return None

# Step 1: 현재 게시글 상태 확인
print("Step 1: 현재 게시글 상태 확인 중...")
print("-" * 60)

# 전체 게시글 조회
all_posts = supabase_request('posts?select=id,moderation_status')

if all_posts is None:
    print("❌ 게시글을 조회할 수 없습니다.")
    sys.exit(1)

total_count = len(all_posts)
print(f"📊 전체 게시글 수: {total_count}개")

# moderation_status별 게시글 수 계산
status_counts = {}
for post in all_posts:
    status = post.get('moderation_status', 'unknown')
    status_counts[status] = status_counts.get(status, 0) + 1

# 상태별 출력
statuses = ['pending', 'approved', 'rejected', 'flagged']
for status in statuses:
    count = status_counts.get(status, 0)
    if count > 0:
        emoji = "❌" if status == "pending" else "✅" if status == "approved" else "⚠️"
        print(f"{emoji} {status}: {count}개")

print()

# Step 2: pending 게시글이 있으면 업데이트
pending_count = status_counts.get('pending', 0)

if pending_count > 0:
    print("Step 2: pending 게시글을 approved로 업데이트 중...")
    print("-" * 60)
    print(f"⚠️  {pending_count}개의 pending 게시글을 approved로 변경합니다.")
    print()

    # 사용자 확인
    try:
        response = input("계속하시겠습니까? (y/n): ")
    except EOFError:
        # 자동 실행 모드 (입력이 없는 경우)
        response = 'y'

    if response.lower() == 'y':
        # pending 게시글 업데이트
        result = supabase_request(
            'posts?moderation_status=eq.pending',
            method='PATCH',
            data={'moderation_status': 'approved'}
        )

        if result is not None:
            print(f"✅ {pending_count}개의 게시글이 approved로 업데이트되었습니다!")
            print()

            # Step 3: 업데이트 후 상태 확인
            print("Step 3: 업데이트 후 상태 확인...")
            print("-" * 60)

            # 다시 조회
            all_posts_after = supabase_request('posts?select=id,moderation_status')
            if all_posts_after:
                status_counts_after = {}
                for post in all_posts_after:
                    status = post.get('moderation_status', 'unknown')
                    status_counts_after[status] = status_counts_after.get(status, 0) + 1

                for status in statuses:
                    count = status_counts_after.get(status, 0)
                    if count > 0:
                        emoji = "❌" if status == "pending" else "✅" if status == "approved" else "⚠️"
                        print(f"{emoji} {status}: {count}개")

            print()
            print("=" * 60)
            print("✅ 게시글 상태 업데이트가 완료되었습니다!")
            print("🔄 프론트엔드를 새로고침하면 게시글이 표시됩니다.")
            print("=" * 60)
        else:
            print("❌ 업데이트에 실패했습니다.")
    else:
        print("❌ 업데이트가 취소되었습니다.")
else:
    print("Step 2: pending 게시글 확인")
    print("-" * 60)
    print("✅ pending 상태의 게시글이 없습니다!")
    print()
    print("=" * 60)
    print("문제 진단:")
    print("=" * 60)
    print("1. 게시글이 프론트엔드에 표시되지 않는다면:")
    print("   - 브라우저 캐시를 삭제하고 새로고침해보세요 (Ctrl+Shift+R)")
    print("   - API 캐시가 만료될 때까지 30초 정도 기다려보세요")
    print()
    print("2. 여전히 표시되지 않는다면:")
    print("   - Supabase Dashboard에서 posts 테이블을 직접 확인해보세요")
    print("   - RLS (Row Level Security) 정책이 올바른지 확인해보세요")
    print("   - 브라우저 개발자도구(F12) Console에서 에러를 확인해보세요")
    print()
    print("3. 특정 사용자의 게시글만 안 보인다면:")
    print("   - user_id가 올바른지 확인해보세요")
    print("   - users 테이블에 해당 사용자가 존재하는지 확인해보세요")
    print("=" * 60)
