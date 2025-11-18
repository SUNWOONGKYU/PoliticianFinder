#!/usr/bin/env python3
import os
import re

# Files to fix
files_to_fix = [
    "1_Frontend/src/app/api/admin/action-logs/route.ts",
    "1_Frontend/src/app/api/admin/action-logs/stats/route.ts",
    "1_Frontend/src/app/api/admin/audit-logs/route.ts",
    "1_Frontend/src/app/api/admin/dashboard/route.ts",
    "1_Frontend/src/app/api/admin/reports/route.ts",
]

base_dir = "C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder"

for file_path in files_to_fix:
    full_path = os.path.join(base_dir, file_path)

    if not os.path.exists(full_path):
        print(f"[SKIP] File not found: {file_path}")
        continue

    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Fix pattern: .eq('id', userId) when querying users table
    # Look for patterns like:
    # .from('users')
    # .select('role')
    # .eq('id', userId)

    # Replace .eq('id', userId) with .eq('user_id', userId) when context is users table
    content = re.sub(
        r"(\.from\('users'\)[^\n]*?)\.eq\('id',\s*userId\)",
        r"\1.eq('user_id', userId)",
        content
    )

    # Also handle adminId case
    content = re.sub(
        r"(\.from\('users'\)[^\n]*?)\.eq\('id',\s*adminId\)",
        r"\1.eq('user_id', adminId)",
        content
    )

    # Handle user_id variable case
    content = re.sub(
        r"(\.from\('users'\)[^\n]*?)\.eq\('id',\s*user_id\)",
        r"\1.eq('user_id', user_id)",
        content
    )

    if content != original_content:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[OK] Fixed: {file_path}")
    else:
        print(f"[SKIP] No changes needed: {file_path}")

print("\nDone!")
