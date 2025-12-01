#!/bin/bash

# 관리자 계정으로 모든 기능 테스트
BASE_URL="https://www.politicianfinder.ai.kr"

echo ""
echo "🔍 관리자 계정 종합 기능 테스트 시작"
echo ""
echo "================================================================================"

# 결과 저장 배열
declare -a results

# 테스트 결과 추가 함수
add_result() {
  results+=("$1|$2|$3|$4")
}

# API 테스트 함수
test_api() {
  local method=$1
  local endpoint=$2
  local desc=$3

  response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" -H "Content-Type: application/json" 2>&1)
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$status_code" -eq 200 ] || [ "$status_code" -eq 201 ]; then
    echo "true|$status_code|$body"
  else
    echo "false|$status_code|$body"
  fi
}

echo ""
echo "📌 1. 관리자 페이지 접근 테스트"

# 대시보드
result=$(test_api "GET" "/api/admin/dashboard" "대시보드 데이터")
IFS='|' read -r success status body <<< "$result"
if [ "$success" = "true" ]; then
  add_result "관리자 접근" "대시보드 데이터" "✅ 성공" "응답: $status"
  echo "  ✅ 대시보드 데이터: $status"
else
  add_result "관리자 접근" "대시보드 데이터" "❌ 실패" "Status: $status"
  echo "  ❌ 대시보드 데이터: $status"
fi

# 회원 관리
result=$(test_api "GET" "/api/admin/users?page=1&limit=10" "회원 관리")
IFS='|' read -r success status body <<< "$result"
if [ "$success" = "true" ]; then
  add_result "관리자 접근" "회원 관리" "✅ 성공" "응답: $status"
  echo "  ✅ 회원 관리: $status"
else
  add_result "관리자 접근" "회원 관리" "❌ 실패" "Status: $status"
  echo "  ❌ 회원 관리: $status"
fi

# 게시글 관리
result=$(test_api "GET" "/api/admin/posts?page=1&limit=10" "게시글 관리")
IFS='|' read -r success status body <<< "$result"
if [ "$success" = "true" ]; then
  add_result "관리자 접근" "게시글 관리" "✅ 성공" "응답: $status"
  echo "  ✅ 게시글 관리: $status"
else
  add_result "관리자 접근" "게시글 관리" "❌ 실패" "Status: $status"
  echo "  ❌ 게시글 관리: $status"
fi

# 정치인 관리 (admin API)
result=$(test_api "GET" "/api/admin/politicians?page=1&limit=10" "정치인 관리(Admin)")
IFS='|' read -r success status body <<< "$result"
if [ "$success" = "true" ]; then
  add_result "관리자 접근" "정치인 관리" "✅ 성공" "응답: $status"
  echo "  ✅ 정치인 관리: $status"
else
  add_result "관리자 접근" "정치인 관리" "❌ 실패" "Status: $status"
  echo "  ❌ 정치인 관리: $status"
fi

echo ""
echo "📌 2. 일반 API 접근 테스트"

# 정치인 목록 (공개 API)
result=$(test_api "GET" "/api/politicians?page=1&limit=10" "정치인 목록 조회")
IFS='|' read -r success status body <<< "$result"
if [ "$success" = "true" ]; then
  add_result "일반 기능" "정치인 목록 조회" "✅ 성공" "응답: $status"
  echo "  ✅ 정치인 목록 조회: $status"
else
  add_result "일반 기능" "정치인 목록 조회" "❌ 실패" "Status: $status"
  echo "  ❌ 정치인 목록 조회: $status"
fi

# 커뮤니티 게시글
result=$(test_api "GET" "/api/community/posts?page=1&limit=10" "커뮤니티 게시글")
IFS='|' read -r success status body <<< "$result"
if [ "$success" = "true" ]; then
  add_result "일반 기능" "커뮤니티 게시글 조회" "✅ 성공" "응답: $status"
  echo "  ✅ 커뮤니티 게시글 조회: $status"
else
  add_result "일반 기능" "커뮤니티 게시글 조회" "❌ 실패" "Status: $status"
  echo "  ❌ 커뮤니티 게시글 조회: $status"
fi

# 사이드바 통계
result=$(test_api "GET" "/api/statistics/sidebar" "사이드바 통계")
IFS='|' read -r success status body <<< "$result"
if [ "$success" = "true" ]; then
  add_result "통계" "사이드바 통계" "✅ 성공" "응답: $status"
  echo "  ✅ 사이드바 통계: $status"
else
  add_result "통계" "사이드바 통계" "❌ 실패" "Status: $status"
  echo "  ❌ 사이드바 통계: $status"
fi

# 공지사항
result=$(test_api "GET" "/api/notices" "공지사항")
IFS='|' read -r success status body <<< "$result"
if [ "$success" = "true" ]; then
  add_result "일반 기능" "공지사항 조회" "✅ 성공" "응답: $status"
  echo "  ✅ 공지사항 조회: $status"
else
  add_result "일반 기능" "공지사항 조회" "❌ 실패" "Status: $status"
  echo "  ❌ 공지사항 조회: $status"
fi

echo ""
echo "================================================================================"
echo ""
echo "📊 테스트 결과 종합"
echo ""

echo "| 번호 | 카테고리 | 기능명 | 테스트 결과 | 비고 |"
echo "|------|---------|--------|------------|------|"

index=1
for result in "${results[@]}"; do
  IFS='|' read -r category feature status note <<< "$result"
  printf "| %2d | %s | %s | %s | %s |\n" $index "$category" "$feature" "$status" "$note"
  ((index++))
done

# 성공/실패 통계
success_count=0
fail_count=0
for result in "${results[@]}"; do
  if [[ "$result" == *"✅"* ]]; then
    ((success_count++))
  else
    ((fail_count++))
  fi
done

total_count=${#results[@]}
success_rate=$(echo "scale=1; $success_count * 100 / $total_count" | bc)

echo ""
echo "================================================================================"
echo ""
echo "✅ 성공: ${success_count}개 / ❌ 실패: ${fail_count}개 / 전체: ${total_count}개"
echo ""
echo "성공률: ${success_rate}%"
echo ""
