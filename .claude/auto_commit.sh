#!/bin/bash
# 5분마다 자동 커밋 스크립트
# 백그라운드 실행: bash .claude/auto_commit.sh &

cd "C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder"

while true; do
  # 변경사항 확인
  if [[ -n $(git status --porcelain) ]]; then
    # 모든 변경사항 스테이징
    git add -A

    # 현재 시간으로 커밋
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    git commit -m "auto: 자동 커밋 ${TIMESTAMP}

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

    echo "[${TIMESTAMP}] 자동 커밋 완료"
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 변경사항 없음"
  fi

  # 5분 대기
  sleep 300
done
