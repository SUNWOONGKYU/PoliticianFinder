#!/usr/bin/env python3
"""
전체 사이트 기능 테스트
관리자 계정으로 모든 기능 직접 테스트
"""
import os, sys
import requests
import json
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

# Production URL
BASE_URL = "https://politician-finder-ou2d9ntid-finder-world.vercel.app"

# Test admin credentials
ADMIN_EMAIL = "wksun999@gmail.com"

print("=" * 100)
print("Comprehensive Site Testing")
print("=" * 100)
print(f"Base URL: {BASE_URL}")
print(f"Admin Email: {ADMIN_EMAIL}")
print(f"Test Time: {datetime.now()}")
print("=" * 100)
print()

test_results = []

def test_api(name, method, endpoint, data=None, headers=None, expected_status=200):
    """API 테스트 헬퍼"""
    url = f"{BASE_URL}{endpoint}"

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        elif method == "PATCH":
            response = requests.patch(url, json=data, headers=headers, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)

        success = response.status_code == expected_status
        result = {
            "name": name,
            "method": method,
            "endpoint": endpoint,
            "status": response.status_code,
            "expected": expected_status,
            "success": success,
            "response_size": len(response.text) if response.text else 0
        }

        test_results.append(result)

        status_icon = "✅" if success else "❌"
        print(f"{status_icon} [{method}] {name}")
        print(f"   Status: {response.status_code} (expected {expected_status})")
        print(f"   Response size: {len(response.text)} bytes")
        print()

        return response

    except Exception as e:
        result = {
            "name": name,
            "method": method,
            "endpoint": endpoint,
            "status": "ERROR",
            "expected": expected_status,
            "success": False,
            "error": str(e)[:100]
        }
        test_results.append(result)
        print(f"❌ [{method}] {name}")
        print(f"   Error: {str(e)[:100]}")
        print()
        return None

print("=" * 100)
print("1. Public Pages - 페이지 접근 테스트")
print("=" * 100)
print()

# Home page
test_api("홈페이지", "GET", "/")

# Politicians list
test_api("정치인 목록", "GET", "/politicians")

# Posts list
test_api("게시물 목록", "GET", "/posts")

# About page
test_api("소개 페이지", "GET", "/about")

print("=" * 100)
print("2. API Endpoints - Public APIs")
print("=" * 100)
print()

# Politicians API
test_api("정치인 목록 API", "GET", "/api/politicians")

# Posts API
test_api("게시물 목록 API", "GET", "/api/posts")

# Comments API (should fail without post_id)
test_api("댓글 API (파라미터 없음)", "GET", "/api/comments", expected_status=400)

print("=" * 100)
print("3. Admin Pages - 관리자 페이지 접근")
print("=" * 100)
print()

admin_pages = [
    "/admin",
    "/admin/dashboard",
    "/admin/users",
    "/admin/posts",
    "/admin/comments",
    "/admin/politicians",
    "/admin/inquiries",
    "/admin/settings"
]

for page in admin_pages:
    test_api(f"관리자 페이지: {page}", "GET", page)

print("=" * 100)
print("4. Admin APIs - 관리자 API")
print("=" * 100)
print()

# Admin Dashboard API
test_api("관리자 대시보드 API", "GET", "/api/admin/dashboard")

# Admin Users API
test_api("관리자 사용자 목록 API", "GET", "/api/admin/users")

# Admin Posts API
test_api("관리자 게시물 목록 API", "GET", "/api/admin/posts")

# Admin Inquiries API
test_api("관리자 문의 목록 API", "GET", "/api/admin/inquiries")

# Admin Audit Logs API
test_api("관리자 감사로그 API", "GET", "/api/admin/audit-logs")

print("=" * 100)
print("5. Search & Filter APIs")
print("=" * 100)
print()

# Search politicians
test_api("정치인 검색 API", "GET", "/api/politicians?search=김")

# Filter politicians by party
test_api("정치인 정당 필터 API", "GET", "/api/politicians?party=국민의힘")

# Search posts
test_api("게시물 검색 API", "GET", "/api/posts?search=정책")

print("=" * 100)
print("Test Summary")
print("=" * 100)
print()

total_tests = len(test_results)
passed_tests = sum(1 for r in test_results if r['success'])
failed_tests = total_tests - passed_tests

print(f"Total Tests: {total_tests}")
print(f"  ✅ Passed: {passed_tests}")
print(f"  ❌ Failed: {failed_tests}")
print(f"  Success Rate: {(passed_tests/total_tests*100):.1f}%")
print()

if failed_tests > 0:
    print("Failed Tests:")
    for r in test_results:
        if not r['success']:
            print(f"  - {r['name']}: {r.get('error', f'Status {r['status']}')} ")
    print()

print("=" * 100)
print("Detailed Results Saved")
print("=" * 100)

# Save detailed results to JSON
output_file = "site_test_results.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({
        "test_time": datetime.now().isoformat(),
        "base_url": BASE_URL,
        "summary": {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": f"{(passed_tests/total_tests*100):.1f}%"
        },
        "results": test_results
    }, f, indent=2, ensure_ascii=False)

print(f"Results saved to: {output_file}")
print()
