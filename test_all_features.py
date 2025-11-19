#!/usr/bin/env python3
"""
Complete site feature testing
"""
import os, sys
import requests
import json
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

BASE_URL = "https://politician-finder-p4ogc5z6q-finder-world.vercel.app"

print("=" * 100)
print("Site Feature Testing")
print("=" * 100)
print("Base URL:", BASE_URL)
print("=" * 100)
print()

test_results = []

def test(name, method, endpoint):
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            r = requests.get(url, timeout=10)
        elif method == "POST":
            r = requests.post(url, timeout=10)

        success = r.status_code in [200, 201, 302, 307, 308]
        status = "[PASS]" if success else "[FAIL]"

        print(f"{status} {method:6} {name:40} Status: {r.status_code}")

        test_results.append({
            "name": name,
            "method": method,
            "endpoint": endpoint,
            "status": r.status_code,
            "success": success
        })
        return r
    except Exception as e:
        print(f"[ERROR] {method:6} {name:40} Error: {str(e)[:50]}")
        test_results.append({
            "name": name,
            "method": method,
            "endpoint": endpoint,
            "status": "ERROR",
            "success": False,
            "error": str(e)[:100]
        })
        return None

print("=" * 100)
print("PUBLIC PAGES")
print("=" * 100)

test("Home Page", "GET", "/")
test("Politicians Page", "GET", "/politicians")
test("Posts Page", "GET", "/posts")
test("About Page", "GET", "/about")
print()

print("=" * 100)
print("PUBLIC APIs")
print("=" * 100)

test("Politicians API", "GET", "/api/politicians")
test("Politicians API (search)", "GET", "/api/politicians?search=kim")
test("Politicians API (party filter)", "GET", "/api/politicians?party=national")
test("Posts API", "GET", "/api/posts")
test("Posts API (search)", "GET", "/api/posts?search=policy")
print()

print("=" * 100)
print("ADMIN PAGES")
print("=" * 100)

test("Admin Dashboard", "GET", "/admin")
test("Admin Users", "GET", "/admin/users")
test("Admin Posts", "GET", "/admin/posts")
test("Admin Comments", "GET", "/admin/comments")
test("Admin Politicians", "GET", "/admin/politicians")
test("Admin Inquiries", "GET", "/admin/inquiries")
test("Admin Settings", "GET", "/admin/settings")
print()

print("=" * 100)
print("ADMIN APIs")
print("=" * 100)

test("Admin Dashboard API", "GET", "/api/admin/dashboard")
test("Admin Users API", "GET", "/api/admin/users")
test("Admin Posts API", "GET", "/api/admin/posts")
test("Admin Comments API", "GET", "/api/admin/comments")
test("Admin Politicians API", "GET", "/api/admin/politicians")
test("Admin Inquiries API", "GET", "/api/admin/inquiries")
test("Admin Audit Logs API", "GET", "/api/admin/audit-logs")
print()

print("=" * 100)
print("SUMMARY")
print("=" * 100)

total = len(test_results)
passed = sum(1 for r in test_results if r['success'])
failed = total - passed

print(f"Total Tests: {total}")
print(f"Passed: {passed}")
print(f"Failed: {failed}")
print(f"Success Rate: {(passed/total*100):.1f}%")
print()

if failed > 0:
    print("Failed Tests:")
    for r in test_results:
        if not r['success']:
            error_msg = r.get('error', f"Status {r.get('status', 'Unknown')}")
            print(f"  - {r['name']}: {error_msg}")
print()

# Save results
with open("test_results.json", 'w', encoding='utf-8') as f:
    json.dump({
        "test_time": datetime.now().isoformat(),
        "base_url": BASE_URL,
        "summary": {"total": total, "passed": passed, "failed": failed},
        "results": test_results
    }, f, indent=2, ensure_ascii=False)

print("Results saved to: test_results.json")
print("=" * 100)
