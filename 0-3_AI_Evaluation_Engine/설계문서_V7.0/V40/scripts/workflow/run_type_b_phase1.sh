#!/bin/bash
# =============================================================================
# V40 Type B - Phase 1: Parallel Collection (n8n + CLI)
# =============================================================================
# Usage:
#   ./run_type_b_phase1.sh politicians.json
#   echo '[{"id":"abc","name":"홍길동"}]' | ./run_type_b_phase1.sh --stdin
#
# Collects data for 2-4 politicians simultaneously using background processes.
# Each politician: Gemini CLI (7 rounds × 10 categories) + Naver API (10 categories)
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

# ─── Parse input: JSON file, --stdin, or inline argument ───
POLITICIANS=()

if [ $# -ge 1 ] && [ "$1" = "--stdin" ]; then
  JSON_INPUT=$(cat)
elif [ $# -ge 1 ] && [ -f "$1" ]; then
  JSON_INPUT=$(cat "$1")
elif [ $# -ge 1 ]; then
  JSON_INPUT="$1"
else
  echo '{"error":"No input. Usage: ./run_type_b_phase1.sh politicians.json"}' >&2
  exit 1
fi

while IFS= read -r line; do
  line="${line%$'\r'}"  # Strip Windows \r
  [ -n "$line" ] && POLITICIANS+=("$line")
done < <(echo "$JSON_INPUT" | python -c "
import json, sys
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')
data = json.load(sys.stdin)
for p in data:
    print(f\"{p['id']}:{p['name']}\")
")

if [ ${#POLITICIANS[@]} -eq 0 ]; then
  echo '{"error":"No politicians parsed from input"}' >&2
  exit 1
fi

echo "=========================================" >&2
echo "V40 Type B - Phase 1: Parallel Collection" >&2
echo "Start: $(date '+%Y-%m-%d %H:%M:%S')" >&2
echo "Politicians: ${#POLITICIANS[@]}" >&2
echo "=========================================" >&2

# ─── Collection function (per politician) ───
collect_politician() {
  local id="$1"
  local name="$2"
  local log_file="$LOG_DIR/${id}_type_b_phase1_${TIMESTAMP}.log"

  echo "[$name ($id)] Phase 1 started at $(date '+%H:%M:%S')" | tee "$log_file" >&2

  # --- Gemini CLI collection (60+ per category, 7 rounds) ---
  echo "[$name] Gemini collection starting..." >> "$log_file"
  cd "$V40_DIR/scripts/workflow"

  for cat in $CATEGORIES; do
    echo "  [$name] Gemini: $cat (7 rounds)" >> "$log_file"
    for i in $(seq 1 7); do
      python collect_gemini_subprocess.py \
        --politician "$name" \
        --category "$cat" >> "$log_file" 2>&1 || true
      sleep 3
    done
  done
  echo "[$name] Gemini collection done" >> "$log_file"

  # --- Naver API collection (60+ per category) ---
  echo "[$name] Naver collection starting..." >> "$log_file"
  cd "$V40_DIR/scripts/workflow"

  for cat in $CATEGORIES; do
    echo "  [$name] Naver: $cat" >> "$log_file"
    python collect_naver_v40_final.py \
      --politician-id "$id" \
      --politician-name "$name" \
      --category "$cat" >> "$log_file" 2>&1 || true
  done
  echo "[$name] Naver collection done" >> "$log_file"

  # --- Count check ---
  cd "$V40_DIR"
  local count
  count=$(python -c "
import os
from supabase import create_client
from dotenv import load_dotenv
load_dotenv()
s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
total = 0
offset = 0
while True:
    r = s.table('collected_data_v40').select('id').eq('politician_id', '$id').range(offset, offset+999).execute()
    total += len(r.data)
    if len(r.data) < 1000: break
    offset += 1000
print(total)
" 2>/dev/null || echo "0")

  echo "[$name ($id)] Phase 1 finished: $count items" | tee -a "$log_file" >&2

  # Write per-politician result
  local status="pass"
  if [ "$count" -lt 1000 ] 2>/dev/null; then
    status="fail"
  fi
  echo "{\"id\":\"$id\",\"name\":\"$name\",\"count\":$count,\"status\":\"$status\"}"
}

# ─── Launch all politicians in parallel ───
RESULT_DIR=$(mktemp -d)
PIDS=()

for entry in "${POLITICIANS[@]}"; do
  IFS=':' read -r id name <<< "$entry"
  echo "Launching: $name ($id)" >&2
  collect_politician "$id" "$name" > "$RESULT_DIR/$id.json" &
  PIDS+=($!)
done

echo "All ${#POLITICIANS[@]} politicians collecting in parallel..." >&2

# ─── Wait for all to complete ───
for pid in "${PIDS[@]}"; do
  wait "$pid" 2>/dev/null || true
done

# ─── Aggregate results as JSON array ───
echo -n "["
FIRST=1
for entry in "${POLITICIANS[@]}"; do
  IFS=':' read -r id name <<< "$entry"
  if [ $FIRST -eq 0 ]; then echo -n ","; fi
  FIRST=0
  if [ -f "$RESULT_DIR/$id.json" ]; then
    cat "$RESULT_DIR/$id.json"
  else
    echo -n "{\"id\":\"$id\",\"name\":\"$name\",\"count\":0,\"status\":\"error\"}"
  fi
done
echo "]"

# ─── Cleanup ───
rm -rf "$RESULT_DIR"

echo "=========================================" >&2
echo "V40 Type B - Phase 1 Complete" >&2
echo "End: $(date '+%Y-%m-%d %H:%M:%S')" >&2
echo "Logs: $LOG_DIR/*_type_b_phase1_${TIMESTAMP}.log" >&2
echo "=========================================" >&2
