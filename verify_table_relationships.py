#!/usr/bin/env python3
"""
테이블 간 관계(FK) 연결 구조 검증
- 모든 FK가 실제로 참조하는 레코드가 존재하는지 확인
- Orphaned records (고아 레코드) 탐지
- 관계 무결성 검증
"""
import os, sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 100)
print("테이블 관계 연결 구조 검증")
print("=" * 100)
print()

# 검증할 관계 정의
# (자식 테이블, 자식 FK 컬럼, 부모 테이블, 부모 PK 컬럼, 설명)
relationships = [
    # users 테이블 관련
    ("profiles", "user_id", "users", "user_id", "프로필 → 사용자"),

    # posts 테이블 관련
    ("posts", "author_id", "profiles", "id", "게시물 → 프로필 작성자"),
    ("posts", "politician_id", "politicians", "id", "게시물 → 정치인 (NULL 가능)"),

    # comments 테이블 관련
    ("comments", "post_id", "posts", "id", "댓글 → 게시물"),
    ("comments", "user_id", "users", "user_id", "댓글 → 사용자"),
    ("comments", "parent_id", "comments", "id", "댓글 → 부모댓글 (NULL 가능)"),

    # votes 테이블 관련
    ("votes", "user_id", "users", "user_id", "투표 → 사용자"),
    ("votes", "post_id", "posts", "id", "투표 → 게시물 (NULL 가능)"),
    ("votes", "comment_id", "comments", "id", "투표 → 댓글 (NULL 가능)"),

    # shares 테이블 관련
    ("shares", "user_id", "users", "user_id", "공유 → 사용자"),
    ("shares", "post_id", "posts", "id", "공유 → 게시물 (NULL 가능)"),
    ("shares", "politician_id", "politicians", "id", "공유 → 정치인 (NULL 가능)"),

    # follows 테이블 관련
    ("follows", "follower_id", "users", "user_id", "팔로우 → 팔로워"),
    ("follows", "following_id", "users", "user_id", "팔로우 → 팔로잉"),

    # favorite_politicians 테이블 관련
    ("favorite_politicians", "user_id", "users", "user_id", "관심정치인 → 사용자"),
    ("favorite_politicians", "politician_id", "politicians", "id", "관심정치인 → 정치인"),

    # notifications 테이블 관련
    ("notifications", "user_id", "users", "user_id", "알림 → 사용자"),
    ("notifications", "actor_id", "users", "user_id", "알림 → 행위자 (NULL 가능)"),
    ("notifications", "post_id", "posts", "id", "알림 → 게시물 (NULL 가능)"),
    ("notifications", "comment_id", "comments", "id", "알림 → 댓글 (NULL 가능)"),

    # inquiries 테이블 관련
    ("inquiries", "user_id", "users", "user_id", "문의 → 사용자 (NULL 가능 - 익명)"),
    ("inquiries", "politician_id", "politicians", "id", "문의 → 정치인 (NULL 가능)"),
    ("inquiries", "admin_id", "users", "user_id", "문의 → 관리자 (NULL 가능)"),

    # payments 테이블 관련
    ("payments", "user_id", "users", "user_id", "결제 → 사용자"),

    # audit_logs 테이블 관련
    ("audit_logs", "admin_id", "users", "user_id", "감사로그 → 관리자"),
]

total_checks = 0
passed_checks = 0
failed_checks = 0
warnings = 0

print("관계 무결성 검증 시작...")
print()

for child_table, child_fk, parent_table, parent_pk, description in relationships:
    total_checks += 1

    try:
        # 1. 자식 테이블에서 FK 값들 가져오기
        child_result = supabase.table(child_table).select(child_fk).execute()

        if not child_result.data:
            print(f"⚠️  [{description}] {child_table} 테이블에 데이터 없음")
            warnings += 1
            continue

        # NULL이 아닌 FK 값들만 추출
        fk_values = [row[child_fk] for row in child_result.data if row.get(child_fk) is not None]

        if not fk_values:
            if "(NULL 가능)" in description:
                print(f"✅ [{description}] 모든 레코드가 NULL (정상)")
                passed_checks += 1
            else:
                print(f"⚠️  [{description}] 모든 FK가 NULL (예상치 못함)")
                warnings += 1
            continue

        # 2. 부모 테이블에서 실제로 존재하는 PK 값들 가져오기
        parent_result = supabase.table(parent_table).select(parent_pk).execute()

        if not parent_result.data:
            print(f"❌ [{description}] {parent_table} 부모 테이블에 데이터 없음!")
            failed_checks += 1
            continue

        parent_pks = set([row[parent_pk] for row in parent_result.data if row.get(parent_pk) is not None])

        # 3. FK 값이 부모 테이블에 존재하는지 확인
        orphaned = []
        for fk_val in set(fk_values):
            if fk_val not in parent_pks:
                orphaned.append(fk_val)

        if orphaned:
            print(f"❌ [{description}]")
            print(f"   자식 레코드: {len(fk_values)}개")
            print(f"   부모 레코드: {len(parent_pks)}개")
            print(f"   고아 레코드: {len(orphaned)}개")
            print(f"   고아 FK 값 샘플: {orphaned[:3]}")
            failed_checks += 1
        else:
            print(f"✅ [{description}]")
            print(f"   자식 레코드: {len(fk_values)}개 → 부모 레코드: {len(parent_pks)}개 (모두 연결됨)")
            passed_checks += 1

    except Exception as e:
        print(f"❌ [{description}] 오류: {str(e)[:100]}")
        failed_checks += 1

    print()

# ============================================================================
# 최종 요약
# ============================================================================
print()
print("=" * 100)
print("검증 결과 요약")
print("=" * 100)
print()
print(f"총 검증 항목: {total_checks}개")
print(f"  ✅ 통과: {passed_checks}개")
print(f"  ❌ 실패: {failed_checks}개")
print(f"  ⚠️  경고: {warnings}개")
print()

if failed_checks == 0:
    print("🎉 모든 테이블 관계가 올바르게 연결되어 있습니다!")
else:
    print(f"⚠️  {failed_checks}개의 관계에서 문제가 발견되었습니다.")
    print("   → 고아 레코드를 수정하거나 FK 제약조건을 확인하세요.")

print()
print("=" * 100)
