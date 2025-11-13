#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
게시글 moderation_status 문제 해결 스크립트
- 데이터베이스 상태 확인
- pending 게시글을 approved로 업데이트
"""
from supabase import create_client
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv('1_Frontend/.env.local')

# Supabase 클라이언트 생성
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Supabase URL or Key is missing. Please check your .env.local file")

print("=" * 60)
print("게시글 Moderation Status 문제 해결 스크립트")
print("=" * 60)
print()

supabase = create_client(url, key)

# Step 1: 현재 게시글 상태 확인
print("Step 1: 현재 게시글 상태 확인 중...")
print("-" * 60)

try:
    # 전체 게시글 수 확인
    all_posts = supabase.table('posts').select('id', count='exact').execute()
    total_count = all_posts.count if hasattr(all_posts, 'count') else len(all_posts.data)
    print(f"📊 전체 게시글 수: {total_count}개")

    # moderation_status별 게시글 수 확인
    statuses = ['pending', 'approved', 'rejected', 'flagged']
    status_counts = {}

    for status in statuses:
        result = supabase.table('posts').select('id', count='exact').eq('moderation_status', status).execute()
        count = result.count if hasattr(result, 'count') else len(result.data)
        status_counts[status] = count

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
        response = input("계속하시겠습니까? (y/n): ")

        if response.lower() == 'y':
            # pending 게시글 업데이트
            update_result = supabase.table('posts').update({
                'moderation_status': 'approved'
            }).eq('moderation_status', 'pending').execute()

            print(f"✅ {pending_count}개의 게시글이 approved로 업데이트되었습니다!")
            print()

            # Step 3: 업데이트 후 상태 확인
            print("Step 3: 업데이트 후 상태 확인...")
            print("-" * 60)

            for status in statuses:
                result = supabase.table('posts').select('id', count='exact').eq('moderation_status', status).execute()
                count = result.count if hasattr(result, 'count') else len(result.data)

                if count > 0:
                    emoji = "❌" if status == "pending" else "✅" if status == "approved" else "⚠️"
                    print(f"{emoji} {status}: {count}개")

            print()
            print("=" * 60)
            print("✅ 게시글 상태 업데이트가 완료되었습니다!")
            print("🔄 프론트엔드를 새로고침하면 게시글이 표시됩니다.")
            print("=" * 60)
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
        print("=" * 60)

except Exception as e:
    print(f"❌ 오류 발생: {str(e)}")
    print()
    print("문제 해결 방법:")
    print("1. Supabase 연결 정보가 올바른지 확인하세요")
    print("2. SUPABASE_SERVICE_ROLE_KEY가 .env.local에 있는지 확인하세요")
    print("   (없다면 NEXT_PUBLIC_SUPABASE_ANON_KEY로 시도합니다)")
    print()
    raise
