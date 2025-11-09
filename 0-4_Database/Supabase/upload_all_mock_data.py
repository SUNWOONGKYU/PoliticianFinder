#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
모든 Mock 데이터를 Supabase에 업로드하는 통합 스크립트
"""
import os
import sys
import json
from supabase import create_client
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

# Supabase 자격증명
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

# Mock 데이터 파일 경로
USERS_DATA_PATH = "../../assets/users-data.json"
COMMUNITY_DATA_PATH = "../../assets/community-data.json"

# Mock user UUID (create_auth_mock_user.py로 생성한 실제 UUID)
MOCK_USER_UUID = "7f61567b-bbdf-427a-90a9-0ee060ef4595"

def load_json_file(file_path):
    """JSON 파일 로드"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"파일 로드 실패 ({file_path}): {e}")
        return None

def create_mock_user(supabase):
    """Mock 사용자 생성 (posts/comments의 foreign key 제약조건 충족용)"""
    print("\n" + "=" * 80)
    print("Mock 사용자 생성")
    print("=" * 80)

    try:
        # 먼저 auth.users에 Mock 사용자 등록 (Supabase Admin API 필요)
        # profiles 테이블은 auth.users를 참조하므로 먼저 auth.users에 등록해야 함
        # 하지만 이는 복잡하므로, 단순히 profiles 테이블에 직접 삽입 시도

        mock_profile = {
            "id": MOCK_USER_UUID,
            "email": "mock@politicianfinder.com",
            "name": "Mock User",
            "avatar_url": None,
            "role": "user",
            "is_email_verified": True,
        }

        # Upsert (이미 있으면 skip)
        result = supabase.table("profiles").upsert(mock_profile).execute()
        print(f"[OK] Mock 사용자 생성 완료 (ID: {MOCK_USER_UUID})")
        return True
    except Exception as e:
        print(f"[INFO] Mock 사용자 생성 시도: {e}")
        print("[INFO] 이미 존재하거나 auth.users와의 연동 문제일 수 있음")
        return False

def upload_users(supabase, users_data):
    """사용자 데이터 업로드 - SKIP (profiles 테이블은 auth.users와 연동되어 수동 생성 불가)"""
    print("\n" + "=" * 80)
    print("사용자 데이터 업로드 - SKIP")
    print("=" * 80)
    print("[INFO] profiles 테이블은 auth.users와 연동되어 있어 수동 생성 불가")
    print("[INFO] Mock 데이터의 author_id는 MOCK_USER_UUID로 통합 처리됩니다")
    return 0

def upload_posts(supabase, community_data):
    """게시글 데이터 업로드"""
    print("\n" + "=" * 80)
    print("게시글 데이터 업로드")
    print("=" * 80)

    posts = community_data.get("posts", [])
    if not posts:
        print("게시글 데이터가 없습니다.")
        return 0

    print(f"총 {len(posts)}개의 게시글 업로드 시작...")

    success_count = 0
    error_count = 0

    for post in posts:
        try:
            # Supabase posts 테이블 형식에 맞게 변환
            # 실제 스키마: id, user_id, politician_id, category, title, content, view_count, upvotes, downvotes, is_best, is_concept, created_at, updated_at, hot_score, is_hot, trending_rank
            # NOTE: user_id는 NOT NULL 제약조건이 있어 dummy UUID 사용
            transformed_post = {
                "id": post["id"],
                "title": post["title"],
                "content": post["content"],
                "category": post.get("category", "general"),
                "user_id": MOCK_USER_UUID,  # Dummy UUID (NOT NULL 제약조건)
                "politician_id": None,  # NULL 허용
                "upvotes": post.get("upvotes", 0),
                "downvotes": post.get("downvotes", 0),
                "view_count": post.get("views", 0),  # views -> view_count
                "is_hot": post.get("is_hot", False),
                "created_at": post.get("created_at", datetime.now().isoformat()),
                "updated_at": datetime.now().isoformat()
            }

            # Upsert
            response = supabase.table("posts").upsert(transformed_post).execute()
            success_count += 1

            if success_count % 10 == 0:
                print(f"진행: {success_count}/{len(posts)}개...")

        except Exception as e:
            error_count += 1
            print(f"오류 (ID: {post.get('id')}): {str(e)[:100]}")

    print(f"\n완료: 성공 {success_count}개, 실패 {error_count}개")
    return success_count

def upload_comments(supabase, community_data):
    """댓글 데이터 업로드"""
    print("\n" + "=" * 80)
    print("댓글 데이터 업로드")
    print("=" * 80)

    comments = community_data.get("comments", [])
    if not comments:
        print("댓글 데이터가 없습니다.")
        return 0

    print(f"총 {len(comments)}개의 댓글 업로드 시작...")

    success_count = 0
    error_count = 0

    for comment in comments:
        try:
            # Supabase comments 테이블 형식에 맞게 변환
            # 실제 스키마: id, post_id, user_id, content, parent_id, upvotes, downvotes, created_at, updated_at
            # NOTE: user_id는 NOT NULL 제약조건이 있어 dummy UUID 사용
            transformed_comment = {
                "id": comment["id"],
                "post_id": comment["post_id"],
                "content": comment["content"],
                "user_id": MOCK_USER_UUID,  # Dummy UUID (NOT NULL 제약조건)
                "upvotes": comment.get("upvotes", 0),
                "downvotes": comment.get("downvotes", 0),
                "parent_id": comment.get("parent_id"),
                "created_at": comment.get("created_at", datetime.now().isoformat()),
                "updated_at": datetime.now().isoformat()
            }

            # Upsert
            response = supabase.table("comments").upsert(transformed_comment).execute()
            success_count += 1

            if success_count % 20 == 0:
                print(f"진행: {success_count}/{len(comments)}개...")

        except Exception as e:
            error_count += 1
            print(f"오류 (ID: {comment.get('id')}): {str(e)[:100]}")

    print(f"\n완료: 성공 {success_count}개, 실패 {error_count}개")
    return success_count

def main():
    """메인 함수"""
    print("\n" + "=" * 80)
    print("모든 Mock 데이터를 Supabase에 업로드")
    print("=" * 80)
    print()

    # Supabase 클라이언트 생성
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("[OK] Supabase 연결 성공")
    except Exception as e:
        print(f"[FAIL] Supabase 연결 실패: {e}")
        return

    # Mock 사용자 생성 (foreign key 제약조건 충족용)
    create_mock_user(supabase)

    # 사용자 데이터 로드 및 업로드
    users_data = load_json_file(USERS_DATA_PATH)
    if users_data:
        upload_users(supabase, users_data)
    else:
        print("사용자 데이터 로드 실패")

    # 커뮤니티 데이터 로드
    community_data = load_json_file(COMMUNITY_DATA_PATH)
    if community_data:
        # 게시글 업로드
        upload_posts(supabase, community_data)
        # 댓글 업로드
        upload_comments(supabase, community_data)
    else:
        print("커뮤니티 데이터 로드 실패")

    print("\n" + "=" * 80)
    print("모든 작업 완료!")
    print("=" * 80)

if __name__ == "__main__":
    main()
