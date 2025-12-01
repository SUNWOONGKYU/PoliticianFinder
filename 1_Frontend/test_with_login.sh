#!/bin/bash

BASE_URL="https://www.politicianfinder.ai.kr"
EMAIL="wksun999@gmail.com"
PASSWORD="na5215900"

echo "=== 1. 로그인 시도 ==="
echo ""

# 로그인 요청
LOGIN_RESPONSE=$(curl -s -c cookies.txt -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "로그인 응답:"
echo "$LOGIN_RESPONSE" | python -c "import sys, json; print(json.dumps(json.load(sys.stdin), ensure_ascii=False, indent=2))" 2>/dev/null || echo "$LOGIN_RESPONSE"

echo ""
echo "=== 2. 쿠키 확인 ==="
cat cookies.txt 2>/dev/null || echo "쿠키 파일 없음"

echo ""
echo ""
echo "=== 3. 로그인된 상태로 Admin API 테스트 ==="
echo ""

# Dashboard API
echo "📌 Dashboard API:"
curl -s -b cookies.txt "$BASE_URL/api/admin/dashboard" | python -c "import sys, json; data=json.load(sys.stdin); print('  Status:', 'success' in data and data['success'] and '✅ Success' or '❌ Failed'); print('  Response:', str(data)[:200])" 2>/dev/null

echo ""

# Users API
echo "📌 Users API:"
curl -s -b cookies.txt "$BASE_URL/api/admin/users?page=1&limit=3" | python -c "import sys, json; data=json.load(sys.stdin); print('  Status:', 'success' in data and data['success'] and '✅ Success' or 'data' in data and '✅ Success' or '❌ Failed'); print('  Users:', len(data.get('data', [])))" 2>/dev/null

echo ""

# Posts API
echo "📌 Posts API:"
curl -s -b cookies.txt "$BASE_URL/api/admin/posts?page=1&limit=3" | python -c "import sys, json; data=json.load(sys.stdin); print('  Status:', 'success' in data and data['success'] and '✅ Success' or '❌ Failed'); print('  Response:', str(data)[:200])" 2>/dev/null

echo ""

# Politicians API
echo "📌 Politicians API:"
curl -s -b cookies.txt "$BASE_URL/api/admin/politicians?page=1&limit=3" | python -c "import sys, json; data=json.load(sys.stdin); print('  Status:', 'success' in data and data['success'] and '✅ Success' or '❌ Failed'); print('  Response:', str(data)[:200])" 2>/dev/null

echo ""

# Inquiries API
echo "📌 Inquiries API:"
curl -s -b cookies.txt "$BASE_URL/api/admin/inquiries?page=1&limit=3" | python -c "import sys, json; data=json.load(sys.stdin); print('  Status:', 'success' in data and data['success'] and '✅ Success' or 'inquiries' in data and '✅ Success' or '❌ Failed'); print('  Response:', str(data)[:200])" 2>/dev/null

echo ""
echo ""
echo "=== 테스트 완료 ==="

# 쿠키 파일 삭제
rm -f cookies.txt
