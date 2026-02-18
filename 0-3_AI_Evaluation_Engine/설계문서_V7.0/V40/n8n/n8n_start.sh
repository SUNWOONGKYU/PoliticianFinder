#!/bin/bash
# =============================================================
# V40 n8n 시작 스크립트
# 용도: V40 .env 환경변수 로드 후 n8n 시작
# 사용법: bash n8n_start.sh
# =============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
V40_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$V40_DIR/.env"

# .env 파일 확인
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env 파일을 찾을 수 없습니다: $ENV_FILE"
  exit 1
fi

# .env 환경변수 로드
set -a
source "$ENV_FILE"
set +a

echo "V40 환경변수 로드 완료 ($ENV_FILE)"

# n8n 환경 설정
export N8N_PORT=5678
export GENERIC_TIMEZONE=Asia/Seoul
export N8N_USER_FOLDER="$SCRIPT_DIR/.n8n"

# V40 경로를 n8n에서 사용할 수 있도록 export
export V40_DIR="$V40_DIR"

echo "n8n 시작 중... (http://localhost:$N8N_PORT)"
echo "V40 경로: $V40_DIR"
echo "n8n 데이터: $N8N_USER_FOLDER"
echo "---"

n8n start
