#!/bin/bash
# V40 Phase 2-2: Targeted Recollection for 오준환 (37e39502)
# Only recollect categories below 50 items

V40_DIR="C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40"
POLITICIAN_ID="37e39502"
POLITICIAN_NAME="오준환"
LOG="$V40_DIR/n8n/recollection.log"

echo "=== 타겟 재수집 시작 ===" | tee "$LOG"
echo "시간: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG"

# Gemini recollection (deficient categories)
gemini_recollect() {
  cd "$V40_DIR/scripts/workflow"

  # communication: 33 -> need 17+ more (3 rounds)
  echo "[GEMINI] communication 재수집 (3 rounds)..." | tee -a "$LOG"
  for i in $(seq 1 3); do
    python collect_gemini_subprocess.py --politician "$POLITICIAN_NAME" --category communication >> "$LOG" 2>&1 || true
    sleep 3
  done

  # responsiveness: 34 -> need 16+ more (3 rounds)
  echo "[GEMINI] responsiveness 재수집 (3 rounds)..." | tee -a "$LOG"
  for i in $(seq 1 3); do
    python collect_gemini_subprocess.py --politician "$POLITICIAN_NAME" --category responsiveness >> "$LOG" 2>&1 || true
    sleep 3
  done

  # publicinterest: 30 -> need 20+ more (3 rounds)
  echo "[GEMINI] publicinterest 재수집 (3 rounds)..." | tee -a "$LOG"
  for i in $(seq 1 3); do
    python collect_gemini_subprocess.py --politician "$POLITICIAN_NAME" --category publicinterest >> "$LOG" 2>&1 || true
    sleep 3
  done

  # accountability: 44 -> need 6+ more (1 round)
  echo "[GEMINI] accountability 재수집 (1 round)..." | tee -a "$LOG"
  python collect_gemini_subprocess.py --politician "$POLITICIAN_NAME" --category accountability >> "$LOG" 2>&1 || true
  sleep 3

  # expertise: 46 -> need 4+ more (1 round)
  echo "[GEMINI] expertise 재수집 (1 round)..." | tee -a "$LOG"
  python collect_gemini_subprocess.py --politician "$POLITICIAN_NAME" --category expertise >> "$LOG" 2>&1 || true
  sleep 3

  # vision: 47 -> need 3+ more (1 round)
  echo "[GEMINI] vision 재수집 (1 round)..." | tee -a "$LOG"
  python collect_gemini_subprocess.py --politician "$POLITICIAN_NAME" --category vision >> "$LOG" 2>&1 || true

  echo "[GEMINI] 재수집 완료" | tee -a "$LOG"
}

# Naver recollection (deficient categories)
naver_recollect() {
  cd "$V40_DIR/scripts/workflow"

  # leadership: 20 -> need 30+ more
  echo "[NAVER] leadership 재수집..." | tee -a "$LOG"
  python collect_naver_v40_final.py --politician-id "$POLITICIAN_ID" --politician-name "$POLITICIAN_NAME" --category leadership >> "$LOG" 2>&1 || true

  # communication: 23 -> need 27+ more
  echo "[NAVER] communication 재수집..." | tee -a "$LOG"
  python collect_naver_v40_final.py --politician-id "$POLITICIAN_ID" --politician-name "$POLITICIAN_NAME" --category communication >> "$LOG" 2>&1 || true

  # accountability: 25 -> need 25+ more
  echo "[NAVER] accountability 재수집..." | tee -a "$LOG"
  python collect_naver_v40_final.py --politician-id "$POLITICIAN_ID" --politician-name "$POLITICIAN_NAME" --category accountability >> "$LOG" 2>&1 || true

  # transparency: 37 -> need 13+ more
  echo "[NAVER] transparency 재수집..." | tee -a "$LOG"
  python collect_naver_v40_final.py --politician-id "$POLITICIAN_ID" --politician-name "$POLITICIAN_NAME" --category transparency >> "$LOG" 2>&1 || true

  # vision: 47 -> need 3+ more
  echo "[NAVER] vision 재수집..." | tee -a "$LOG"
  python collect_naver_v40_final.py --politician-id "$POLITICIAN_ID" --politician-name "$POLITICIAN_NAME" --category vision >> "$LOG" 2>&1 || true

  echo "[NAVER] 재수집 완료" | tee -a "$LOG"
}

# Run both in parallel
gemini_recollect &
G_PID=$!
naver_recollect &
N_PID=$!

wait $G_PID
wait $N_PID

echo "" | tee -a "$LOG"
echo "=== 재수집 완료 ===" | tee -a "$LOG"
echo "완료 시간: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG"
