#!/usr/bin/env python3
"""
최종 테이블 관계 검증
실제 FK 제약조건 기준:
- posts.user_id -> profiles.id (NOT users.user_id!)
- 나머지는 users.user_id 참조
"""
import os, sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 100)
print("FINAL Table Relationship Verification")
print("=" * 100)
print()

# 실제 FK 제약조건 기준 관계 정의
relationships = [
    # posts 관계 - IMPORTANT: posts.user_id -> profiles.id
    ("posts", "user_id", "profiles", "id", True, "Posts -> Profiles (author)"),
    ("posts", "politician_id", "politicians", "id", True, "Posts -> Politicians"),

    # comments 관계
    ("comments", "post_id", "posts", "id", False, "Comments -> Posts"),
    ("comments", "user_id", "users", "user_id", False, "Comments -> Users"),
    ("comments", "parent_comment_id", "comments", "id", True, "Comments -> Parent Comment"),

    # votes 관계
    ("votes", "user_id", "users", "user_id", False, "Votes -> Users"),
    ("votes", "post_id", "posts", "id", True, "Votes -> Posts"),
    ("votes", "comment_id", "comments", "id", True, "Votes -> Comments"),

    # shares 관계
    ("shares", "user_id", "users", "user_id", True, "Shares -> Users"),
    ("shares", "post_id", "posts", "id", True, "Shares -> Posts"),
    ("shares", "politician_id", "politicians", "id", True, "Shares -> Politicians"),

    # follows 관계
    ("follows", "follower_id", "users", "user_id", False, "Follows -> Follower"),
    ("follows", "following_id", "users", "user_id", False, "Follows -> Following"),

    # favorite_politicians 관계
    ("favorite_politicians", "user_id", "users", "user_id", False, "Favorite -> Users"),
    ("favorite_politicians", "politician_id", "politicians", "id", False, "Favorite -> Politicians"),

    # notifications 관계
    ("notifications", "user_id", "users", "user_id", False, "Notifications -> Users"),

    # inquiries 관계
    ("inquiries", "user_id", "users", "user_id", True, "Inquiries -> Users"),
    ("inquiries", "politician_id", "politicians", "id", True, "Inquiries -> Politicians"),
    ("inquiries", "admin_id", "users", "user_id", True, "Inquiries -> Admin"),

    # payments 관계
    ("payments", "user_id", "users", "user_id", False, "Payments -> Users"),

    # audit_logs 관계
    ("audit_logs", "admin_id", "users", "user_id", False, "Audit Logs -> Admin"),
]

total_checks = 0
passed_checks = 0
failed_checks = 0
warnings = 0

print("Starting final verification...")
print()

for child_table, child_fk, parent_table, parent_pk, nullable, description in relationships:
    total_checks += 1

    try:
        # 1. Get FK values
        child_result = supabase.table(child_table).select(child_fk).execute()

        if not child_result.data:
            print(f"[WARNING] {description}: {child_table} has no data")
            warnings += 1
            print()
            continue

        fk_values = [row[child_fk] for row in child_result.data if row.get(child_fk) is not None]

        if not fk_values:
            if nullable:
                print(f"[OK] {description}: All NULL (expected)")
                passed_checks += 1
            else:
                print(f"[WARNING] {description}: All NULL (unexpected)")
                warnings += 1
            print()
            continue

        # 2. Get parent PKs
        parent_result = supabase.table(parent_table).select(parent_pk).execute()

        if not parent_result.data:
            print(f"[FAIL] {description}: Parent {parent_table} has no data!")
            failed_checks += 1
            print()
            continue

        parent_pks = set([row[parent_pk] for row in parent_result.data if row.get(parent_pk)])

        # 3. Check orphaned records
        orphaned = [str(fk)[:40] for fk in set(fk_values) if fk not in parent_pks]

        if orphaned:
            print(f"[FAIL] {description}")
            print(f"  Child: {len(fk_values)} | Parent: {len(parent_pks)} | Orphaned: {len(orphaned)}")
            print(f"  Sample: {orphaned[:2]}")
            failed_checks += 1
        else:
            print(f"[PASS] {description}")
            print(f"  Child: {len(fk_values)} -> Parent: {len(parent_pks)} (all connected)")
            passed_checks += 1

    except Exception as e:
        print(f"[ERROR] {description}: {str(e)[:150]}")
        failed_checks += 1

    print()

# Summary
print("=" * 100)
print("SUMMARY")
print("=" * 100)
print()
print(f"Total: {total_checks}")
print(f"  [PASS] {passed_checks}")
print(f"  [FAIL] {failed_checks}")
print(f"  [WARNING] {warnings}")
print()

if failed_checks == 0:
    print("[SUCCESS] All table relationships are properly connected!")
    print("Database integrity verified!")
else:
    print(f"[ISSUE] {failed_checks} relationship(s) have problems")

print()
print("=" * 100)
