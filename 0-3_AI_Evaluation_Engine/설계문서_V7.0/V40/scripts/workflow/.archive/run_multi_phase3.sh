#!/bin/bash
# =============================================================================
# V40 Multi-Politician Phase 3: Sequential Evaluation (AI-parallel)
# =============================================================================
# Usage: ./run_multi_phase3.sh [politicians.json]
#
# Evaluates politicians SEQUENTIALLY (1 at a time) to respect API rate limits.
# Within each politician, 3 AIs run in PARALLEL (ChatGPT + Gemini + Grok).
# Claude evaluation is disabled (requires Claude Code direct evaluation).
#
# Default politicians defined below. Override by passing a JSON file.
# =============================================================================

set -euo pipefail

# Resolve V40 directory (this script is in V40/scripts/workflow/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V40_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$V40_DIR/.phase_status"
CATEGORIES="expertise leadership vision integrity ethics accountability transparency communication responsiveness publicinterest"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

mkdir -p "$LOG_DIR"

# ─── Load environment ───
if [ -f "$V40_DIR/.env" ]; then
  set -a
  source "$V40_DIR/.env"
  set +a
fi

# ─── Politicians list (edit here or pass JSON file) ───
DEFAULT_POLITICIANS=(
  "aef87dd2:김진태"
  "c1f5738d:우상호"
  "5a36db82:이동환"
  "c45565d7:이재준"
)

# ─── Parse arguments ───
if [ $# -ge 1 ] && [ -f "$1" ]; then
  echo "Loading politicians from: $1"
  POLITICIANS=()
  while IFS= read -r line; do
    POLITICIANS+=("$line")
  done < <(python -c "
import json, sys
data = json.load(open(sys.argv[1], encoding='utf-8'))
for p in data:
    print(f\"{p['id']}:{p['name']}\")
" "$1")
else
  POLITICIANS=("${DEFAULT_POLITICIANS[@]}")
fi

echo "========================================="
echo "V40 Multi-Politician Phase 3: Sequential Evaluation"
echo "Start: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Politicians: ${#POLITICIANS[@]} (sequential)"
echo "AIs: ChatGPT + Gemini + Grok (parallel per politician)"
echo "Claude: DISABLED (requires Claude Code direct)"
echo "========================================="

# ─── AI evaluation functions ───

evaluate_chatgpt() {
  local id="$1" name="$2" log="$3"
  echo "  [ChatGPT] Starting for $name..." >> "$log"
  cd "$V40_DIR/scripts/helpers"
  for cat in $CATEGORIES; do
    echo "    [ChatGPT] $cat" >> "$log"
    python codex_eval_helper.py \
      --politician_id="$id" \
      --politician_name="$name" \
      --category="$cat" \
      --batch_size=25 >> "$log" 2>&1 || true
  done
  echo "  [ChatGPT] Done for $name" >> "$log"
}

evaluate_gemini() {
  local id="$1" name="$2" log="$3"
  echo "  [Gemini] Starting for $name..." >> "$log"
  cd "$V40_DIR/scripts/workflow"
  for cat in $CATEGORIES; do
    echo "    [Gemini] $cat" >> "$log"
    python evaluate_gemini_subprocess.py \
      --politician "$name" \
      --category "$cat" >> "$log" 2>&1 || true
  done
  echo "  [Gemini] Done for $name" >> "$log"
}

evaluate_grok() {
  local id="$1" name="$2" log="$3"
  echo "  [Grok] Starting for $name..." >> "$log"
  cd "$V40_DIR/scripts/helpers"
  for cat in $CATEGORIES; do
    echo "    [Grok] $cat" >> "$log"
    python grok_eval_helper.py \
      --politician_id="$id" \
      --politician_name="$name" \
      --category="$cat" \
      --batch_size=25 >> "$log" 2>&1 || true
  done
  echo "  [Grok] Done for $name" >> "$log"
}

# ─── Process each politician SEQUENTIALLY ───
TOTAL=${#POLITICIANS[@]}
CURRENT=0
EVAL_RESULTS=()

for entry in "${POLITICIANS[@]}"; do
  IFS=':' read -r id name <<< "$entry"
  CURRENT=$((CURRENT + 1))
  LOG_FILE="$LOG_DIR/${id}_phase3_${TIMESTAMP}.log"

  echo ""
  echo "=== [$CURRENT/$TOTAL] $name ($id) ==="
  echo "[$name ($id)] Phase 3 started at $(date '+%H:%M:%S')" | tee "$LOG_FILE"

  # Launch 3 AIs in parallel
  evaluate_chatgpt "$id" "$name" "$LOG_FILE" &
  PID_CHATGPT=$!

  evaluate_gemini "$id" "$name" "$LOG_FILE" &
  PID_GEMINI=$!

  evaluate_grok "$id" "$name" "$LOG_FILE" &
  PID_GROK=$!

  echo "  PIDs: ChatGPT=$PID_CHATGPT, Gemini=$PID_GEMINI, Grok=$PID_GROK"
  echo "  Log: $LOG_FILE"

  # Wait for all 3 AIs to complete
  CHATGPT_OK=0; GEMINI_OK=0; GROK_OK=0
  wait $PID_CHATGPT 2>/dev/null && CHATGPT_OK=1 || true
  wait $PID_GEMINI 2>/dev/null && GEMINI_OK=1 || true
  wait $PID_GROK 2>/dev/null && GROK_OK=1 || true

  echo "  Results: ChatGPT=$( [ $CHATGPT_OK -eq 1 ] && echo OK || echo FAIL ) Gemini=$( [ $GEMINI_OK -eq 1 ] && echo OK || echo FAIL ) Grok=$( [ $GROK_OK -eq 1 ] && echo OK || echo FAIL )"

  # Phase Gate 3: Evaluation count check
  echo "" >> "$LOG_FILE"
  echo "=== Phase Gate 3: Evaluation Count ===" | tee -a "$LOG_FILE"
  cd "$V40_DIR"
  EVAL_COUNT=$(python -c "
import os
from supabase import create_client
from dotenv import load_dotenv
load_dotenv()
s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

total = 0
offset = 0
while True:
    r = s.table('evaluations_v40').select('id').eq('politician_id', '$id').range(offset, offset+999).execute()
    total += len(r.data)
    if len(r.data) < 1000:
        break
    offset += 1000
print(total)
" 2>/dev/null || echo "0")

  echo "  Evaluations: $EVAL_COUNT" | tee -a "$LOG_FILE"
  if [ "$EVAL_COUNT" -ge 2000 ] 2>/dev/null; then
    echo "  Phase Gate 3: PASSED" | tee -a "$LOG_FILE"
    EVAL_RESULTS+=("PASS:$id:$name:$EVAL_COUNT")
  else
    echo "  Phase Gate 3: WARNING ($EVAL_COUNT/2000)" | tee -a "$LOG_FILE"
    EVAL_RESULTS+=("WARN:$id:$name:$EVAL_COUNT")
  fi

  echo "[$name ($id)] Phase 3 finished at $(date '+%H:%M:%S')" | tee -a "$LOG_FILE"
done

# ─── Phase 4 & 5: Scores and Reports ───
echo ""
echo "========================================="
echo "Phase 4-5: Scores & Reports"
echo "========================================="

for result in "${EVAL_RESULTS[@]}"; do
  IFS=':' read -r status id name count <<< "$result"

  if [ "$status" = "PASS" ] || [ "$status" = "WARN" ]; then
    echo "  [$name] Calculating scores..."
    cd "$V40_DIR/scripts/core"
    python calculate_v40_scores.py \
      --politician_id="$id" \
      --politician_name="$name" 2>&1 || echo "  WARNING: Score calculation failed for $name"

    echo "  [$name] Generating report..."
    python generate_report_v40.py "$id" "$name" 2>&1 || echo "  WARNING: Report generation failed for $name"
  fi
done

# ─── Final Summary ───
echo ""
echo "========================================="
echo "V40 Multi-Politician Pipeline Summary"
echo "End: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

for result in "${EVAL_RESULTS[@]}"; do
  IFS=':' read -r status id name count <<< "$result"
  if [ "$status" = "PASS" ]; then
    echo "  OK  $name ($id) - $count evaluations"
  else
    echo "  WARN $name ($id) - $count evaluations (< 2000)"
  fi
done

echo ""
echo "Reports: $V40_DIR/reports/"
echo "Logs: $LOG_DIR/*_phase3_${TIMESTAMP}.log"
echo "========================================="
