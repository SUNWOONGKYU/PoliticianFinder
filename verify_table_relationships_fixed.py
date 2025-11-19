#!/usr/bin/env python3
"""
테이블 간 관계(FK) 연결 구조 검증 (실제 스키마 기준)
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
print("Table Relationship Verification (Actual Schema)")
print("=" * 100)
print()

# 검증할 관계 정의 (실제 스키마 기준)
# (자식 테이블, 자식 FK 컬럼, 부모 테이블, 부모 PK 컬럼, NULL 가능 여부, 설명)
relationships = [
    # posts 관계 - posts.user_id가 users.user_id를 참조하는지 profiles.id를 참조하는지 확인 필요
    # 먼저 users.user_id 기준으로 체크
    ("posts", "user_id", "users", "user_id", True, "Posts -> Users (작성자)"),
    ("posts", "politician_id", "politicians", "id", True, "Posts -> Politicians"),

    # comments 관계
    ("comments", "post_id", "posts", "id", False, "Comments -> Posts"),
    ("comments", "user_id", "users", "user_id", False, "Comments -> Users"),
    ("comments", "parent_comment_id", "comments", "id", True, "Comments -> Parent Comment"),

    # votes 관계
    ("votes", "user_id", "users", "user_id", False, "Votes -> Users"),
    ("votes", "post_id", "posts", "id", True, "Votes -> Posts (NULL if comment vote)"),
    ("votes", "comment_id", "comments", "id", True, "Votes -> Comments (NULL if post vote)"),

    # shares 관계
    ("shares", "user_id", "users", "user_id", True, "Shares -> Users"),
    ("shares", "post_id", "posts", "id", True, "Shares -> Posts"),
    ("shares", "politician_id", "politicians", "id", True, "Shares -> Politicians"),

    # follows 관계
    ("follows", "follower_id", "users", "user_id", False, "Follows -> Follower User"),
    ("follows", "following_id", "users", "user_id", False, "Follows -> Following User"),

    # favorite_politicians 관계
    ("favorite_politicians", "user_id", "users", "user_id", False, "Favorite Politicians -> Users"),
    ("favorite_politicians", "politician_id", "politicians", "id", False, "Favorite Politicians -> Politicians"),

    # notifications 관계 (실제 스키마에 actor_id, post_id, comment_id 없음)
    ("notifications", "user_id", "users", "user_id", False, "Notifications -> Users"),

    # inquiries 관계
    ("inquiries", "user_id", "users", "user_id", True, "Inquiries -> Users (anonymous allowed)"),
    ("inquiries", "politician_id", "politicians", "id", True, "Inquiries -> Politicians"),
    ("inquiries", "admin_id", "users", "user_id", True, "Inquiries -> Admin User"),

    # payments 관계
    ("payments", "user_id", "users", "user_id", False, "Payments -> Users"),

    # audit_logs 관계
    ("audit_logs", "admin_id", "users", "user_id", False, "Audit Logs -> Admin User"),
]

total_checks = 0
passed_checks = 0
failed_checks = 0
warnings = 0

print("Starting relationship integrity verification...")
print()

for child_table, child_fk, parent_table, parent_pk, nullable, description in relationships:
    total_checks += 1

    try:
        # 1. Get FK values from child table
        child_result = supabase.table(child_table).select(child_fk).execute()

        if not child_result.data:
            print(f"[WARNING] [{description}] {child_table} table has no data")
            warnings += 1
            print()
            continue

        # Extract non-NULL FK values
        fk_values = [row[child_fk] for row in child_result.data if row.get(child_fk) is not None]

        if not fk_values:
            if nullable:
                print(f"[OK] [{description}] All records have NULL FK (expected)")
                passed_checks += 1
            else:
                print(f"[WARNING] [{description}] All FK values are NULL (unexpected for non-nullable FK)")
                warnings += 1
            print()
            continue

        # 2. Get PK values from parent table
        parent_result = supabase.table(parent_table).select(parent_pk).execute()

        if not parent_result.data:
            print(f"[FAIL] [{description}] Parent table {parent_table} has no data!")
            failed_checks += 1
            print()
            continue

        parent_pks = set([row[parent_pk] for row in parent_result.data if row.get(parent_pk) is not None])

        # 3. Check if FK values exist in parent table
        orphaned = []
        for fk_val in set(fk_values):
            if fk_val not in parent_pks:
                orphaned.append(str(fk_val)[:50])  # Truncate for display

        if orphaned:
            print(f"[FAIL] [{description}]")
            print(f"  Child records: {len(fk_values)}")
            print(f"  Parent records: {len(parent_pks)}")
            print(f"  Orphaned records: {len(orphaned)}")
            print(f"  Sample orphaned FK values: {orphaned[:3]}")
            failed_checks += 1
        else:
            print(f"[PASS] [{description}]")
            print(f"  Child records: {len(fk_values)} -> Parent records: {len(parent_pks)} (all connected)")
            passed_checks += 1

    except Exception as e:
        error_msg = str(e)[:200]
        print(f"[ERROR] [{description}] {error_msg}")
        failed_checks += 1

    print()

# ============================================================================
# Summary
# ============================================================================
print()
print("=" * 100)
print("Verification Summary")
print("=" * 100)
print()
print(f"Total checks: {total_checks}")
print(f"  [PASS] Passed: {passed_checks}")
print(f"  [FAIL] Failed: {failed_checks}")
print(f"  [WARNING] Warnings: {warnings}")
print()

if failed_checks == 0:
    print("[SUCCESS] All table relationships are properly connected!")
else:
    print(f"[ISSUE] {failed_checks} relationship(s) have problems.")
    print("  -> Fix orphaned records or check FK constraints.")

print()
print("=" * 100)
