#!/bin/bash
# Naver API만 사용하여 수집 (Gemini 할당량 초과 대응)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V40_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ -f "$V40_DIR/.env" ]; then
  set -a
  source "$V40_DIR/.env"
  set +a
fi

export PYTHONIOENCODING=utf-8

CATEGORIES="expertise leadership vision integrity ethics accountability transparency communication responsiveness publicinterest"

# 정치인 목록
politicians=(
  "1e43d6f1:명재성"
  "c45565d7:이재준"
)

echo "========================================="
echo "Naver API 전용 수집 (Gemini 할당량 초과 대응)"
echo "========================================="

for entry in "${politicians[@]}"; do
  IFS=':' read -r id name <<< "$entry"
  echo ""
  echo "[$name ($id)] Naver 수집 시작..."
  
  for cat in $CATEGORIES; do
    echo "  [$name] $cat 수집 중..."
    cd "$V40_DIR/scripts/workflow"
    python collect_naver_v40_final.py \
      --politician-id "$id" \
      --politician-name "$name" \
      --category "$cat" 2>&1 | tail -3
  done
  
  echo "[$name ($id)] Naver 수집 완료"
done

echo ""
echo "========================================="
echo "완료!"
echo "========================================="
