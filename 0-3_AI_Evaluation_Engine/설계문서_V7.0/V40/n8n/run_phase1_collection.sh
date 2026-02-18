#!/bin/bash
# V40 Phase 1: Data Collection for 오준환 (37e39502)
# Gemini CLI + Naver API 병렬 수집

set -e

V40_DIR="C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40"
POLITICIAN_ID="37e39502"
POLITICIAN_NAME="오준환"
LOG_FILE="$V40_DIR/n8n/phase1_collection.log"
CATEGORIES="expertise leadership vision integrity ethics accountability transparency communication responsiveness publicinterest"

echo "=========================================" | tee "$LOG_FILE"
echo "V40 Phase 1: 데이터 수집 시작" | tee -a "$LOG_FILE"
echo "정치인: $POLITICIAN_NAME ($POLITICIAN_ID)" | tee -a "$LOG_FILE"
echo "시작 시간: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
echo "=========================================" | tee -a "$LOG_FILE"

# Gemini Collection (background)
gemini_collect() {
  echo "[GEMINI] 수집 시작..." | tee -a "$LOG_FILE"
  cd "$V40_DIR/scripts/workflow"

  for cat in $CATEGORIES; do
    echo "[GEMINI] $cat 수집 중 (7 라운드)..." | tee -a "$LOG_FILE"
    for i in $(seq 1 7); do
      python collect_gemini_subprocess.py --politician "$POLITICIAN_NAME" --category "$cat" >> "$LOG_FILE" 2>&1 || true
      sleep 3
    done
    echo "[GEMINI] $cat 완료" | tee -a "$LOG_FILE"
  done

  echo "[GEMINI] === 전체 수집 완료 ===" | tee -a "$LOG_FILE"
}

# Naver Collection (background)
naver_collect() {
  echo "[NAVER] 수집 시작..." | tee -a "$LOG_FILE"
  cd "$V40_DIR/scripts/workflow"

  for cat in $CATEGORIES; do
    echo "[NAVER] $cat 수집 중..." | tee -a "$LOG_FILE"
    python collect_naver_v40_final.py \
      --politician-id "$POLITICIAN_ID" \
      --politician-name "$POLITICIAN_NAME" \
      --category "$cat" >> "$LOG_FILE" 2>&1 || true
    echo "[NAVER] $cat 완료" | tee -a "$LOG_FILE"
  done

  echo "[NAVER] === 전체 수집 완료 ===" | tee -a "$LOG_FILE"
}

# Run both in parallel
gemini_collect &
GEMINI_PID=$!

naver_collect &
NAVER_PID=$!

echo "Gemini PID: $GEMINI_PID, Naver PID: $NAVER_PID" | tee -a "$LOG_FILE"
echo "수집 진행 중... 로그 확인: tail -f $LOG_FILE" | tee -a "$LOG_FILE"

# Wait for both to complete
wait $GEMINI_PID
GEMINI_EXIT=$?
wait $NAVER_PID
NAVER_EXIT=$?

echo "" | tee -a "$LOG_FILE"
echo "=========================================" | tee -a "$LOG_FILE"
echo "Phase 1 수집 완료!" | tee -a "$LOG_FILE"
echo "Gemini exit: $GEMINI_EXIT, Naver exit: $NAVER_EXIT" | tee -a "$LOG_FILE"
echo "완료 시간: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
echo "=========================================" | tee -a "$LOG_FILE"

# Phase Gate 1: Check count
echo "" | tee -a "$LOG_FILE"
echo "=== Phase Gate 1: 수집 건수 확인 ===" | tee -a "$LOG_FILE"
cd "$V40_DIR"
python -c "
import os, json
from supabase import create_client
from dotenv import load_dotenv
load_dotenv('$V40_DIR/.env')
s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Pagination for accurate count
total = 0
offset = 0
while True:
    r = s.table('collected_data_v40').select('id').eq('politician_id', '$POLITICIAN_ID').range(offset, offset+999).execute()
    batch = len(r.data)
    total += batch
    if batch < 1000:
        break
    offset += 1000

# Per-AI count
for ai in ['Gemini', 'Naver']:
    cnt = 0
    off2 = 0
    while True:
        r2 = s.table('collected_data_v40').select('id').eq('politician_id', '$POLITICIAN_ID').eq('collector_ai', ai).range(off2, off2+999).execute()
        b = len(r2.data)
        cnt += b
        if b < 1000:
            break
        off2 += 1000
    print(f'{ai}: {cnt}개')

print(f'총 수집: {total}개')
if total >= 1000:
    print('✅ Phase Gate 1 PASSED')
else:
    print(f'⚠️ Phase Gate 1 FAILED: {total}/1000 (부족: {1000-total}개)')
" 2>&1 | tee -a "$LOG_FILE"
