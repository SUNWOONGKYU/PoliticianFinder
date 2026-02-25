#!/bin/bash
# =============================================================================
# V40 Type B - Phase 3: AI Evaluation (single politician, 3 AIs parallel)
# =============================================================================
# Usage: ./run_type_b_phase3.sh <politician_id> <politician_name>
#
# Evaluates ONE politician with 3 AIs in parallel:
#   - ChatGPT (codex_eval_helper.py)
#   - Gemini (evaluate_gemini_subprocess.py)
#   - Grok (grok_eval_helper.py)
#
# Claude evaluation is NOT included (requires Claude Code direct / n8n Wait).
# After this script completes, run Claude evaluation manually, then resume n8n.
#
# Output: JSON result to stdout for n8n parsing
# =============================================================================

set -euo pipefail

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

# ─── Fix Korean encoding on Windows/MSYS ───
export PYTHONIOENCODING=utf-8

# ─── Parse arguments ───
if [ $# -lt 2 ]; then
  echo '{"error":"Usage: ./run_type_b_phase3.sh <politician_id> <politician_name>"}' >&2
  exit 1
fi

ID="$1"
NAME="$2"
LOG_FILE="$LOG_DIR/${ID}_type_b_phase3_${TIMESTAMP}.log"

echo "=========================================" >&2
echo "V40 Type B - Phase 3: Evaluation" >&2
echo "Politician: $NAME ($ID)" >&2
echo "AIs: ChatGPT + Gemini + Grok (parallel)" >&2
echo "Claude: EXCLUDED (manual via Claude Code)" >&2
echo "Start: $(date '+%Y-%m-%d %H:%M:%S')" >&2
echo "=========================================" >&2

# ─── AI evaluation functions ───

evaluate_chatgpt() {
  local log="$1"
  echo "  [ChatGPT] Starting..." >> "$log"
  cd "$V40_DIR/scripts/helpers"
  for cat in $CATEGORIES; do
    echo "    [ChatGPT] $cat" >> "$log"
    python codex_eval_helper.py \
      --politician_id="$ID" \
      --politician_name="$NAME" \
      --category="$cat" \
      --batch_size=25 >> "$log" 2>&1 || true
  done
  echo "  [ChatGPT] Done" >> "$log"
}

evaluate_gemini() {
  local log="$1"
  echo "  [Gemini] Starting..." >> "$log"
  cd "$V40_DIR/scripts/workflow"
  for cat in $CATEGORIES; do
    echo "    [Gemini] $cat" >> "$log"
    python evaluate_gemini_subprocess.py \
      --politician "$NAME" \
      --category "$cat" >> "$log" 2>&1 || true
  done
  echo "  [Gemini] Done" >> "$log"
}

evaluate_grok() {
  local log="$1"
  echo "  [Grok] Starting..." >> "$log"
  cd "$V40_DIR/scripts/helpers"
  for cat in $CATEGORIES; do
    echo "    [Grok] $cat" >> "$log"
    python grok_eval_helper.py \
      --politician_id="$ID" \
      --politician_name="$NAME" \
      --category="$cat" \
      --batch_size=25 >> "$log" 2>&1 || true
  done
  echo "  [Grok] Done" >> "$log"
}

# ─── Launch 3 AIs in parallel ───
echo "[$NAME] Launching 3 AIs..." | tee "$LOG_FILE" >&2

evaluate_chatgpt "$LOG_FILE" &
PID_CHATGPT=$!

evaluate_gemini "$LOG_FILE" &
PID_GEMINI=$!

evaluate_grok "$LOG_FILE" &
PID_GROK=$!

echo "  PIDs: ChatGPT=$PID_CHATGPT Gemini=$PID_GEMINI Grok=$PID_GROK" >&2

# ─── Wait for all 3 AIs ───
CHATGPT_OK=0; GEMINI_OK=0; GROK_OK=0
wait $PID_CHATGPT 2>/dev/null && CHATGPT_OK=1 || true
wait $PID_GEMINI 2>/dev/null && GEMINI_OK=1 || true
wait $PID_GROK 2>/dev/null && GROK_OK=1 || true

# ─── Count evaluations ───
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
    r = s.table('evaluations_v40').select('id').eq('politician_id', '$ID').range(offset, offset+999).execute()
    total += len(r.data)
    if len(r.data) < 1000: break
    offset += 1000
print(total)
" 2>/dev/null || echo "0")

# ─── Determine status ───
STATUS="pass"
if [ "$EVAL_COUNT" -lt 2000 ] 2>/dev/null; then
  STATUS="warning"
fi

echo "[$NAME] Evaluations: $EVAL_COUNT (3 AIs, Claude pending)" | tee -a "$LOG_FILE" >&2

# ─── Output JSON result ───
cat <<EOF
{
  "id": "$ID",
  "name": "$NAME",
  "eval_count": $EVAL_COUNT,
  "status": "$STATUS",
  "chatgpt": $([ $CHATGPT_OK -eq 1 ] && echo '"ok"' || echo '"fail"'),
  "gemini": $([ $GEMINI_OK -eq 1 ] && echo '"ok"' || echo '"fail"'),
  "grok": $([ $GROK_OK -eq 1 ] && echo '"ok"' || echo '"fail"'),
  "claude": "pending",
  "note": "Claude evaluation must be run manually via Claude Code, then resume n8n webhook"
}
EOF

echo "=========================================" >&2
echo "V40 Type B - Phase 3 Complete (3/4 AIs)" >&2
echo "End: $(date '+%Y-%m-%d %H:%M:%S')" >&2
echo "Next: Run Claude eval manually, then call n8n resume webhook" >&2
echo "=========================================" >&2
