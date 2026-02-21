#!/bin/bash
# =============================================================================
# V40 Multi-Politician Phase 1: Parallel Collection
# =============================================================================
# Usage: ./run_multi_phase1.sh [politicians.json]
#
# Collects data for 2-4 politicians simultaneously using background processes.
# Each politician runs Gemini CLI + Naver API collection in parallel.
#
# Default politicians are defined below. Override by passing a JSON file:
#   [{"id":"aef87dd2","name":"김진태"}, {"id":"c1f5738d","name":"우상호"}]
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
# Format: "id:name" pairs
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
echo "V40 Multi-Politician Phase 1: Parallel Collection"
echo "Start: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Politicians: ${#POLITICIANS[@]}"
echo "========================================="

# ─── Collection function (per politician) ───
collect_politician() {
  local id="$1"
  local name="$2"
  local log_file="$LOG_DIR/${id}_phase1_${TIMESTAMP}.log"

  echo "[$name ($id)] Phase 1 started at $(date '+%H:%M:%S')" | tee "$log_file"

  # --- Gemini CLI collection (60+ per category, 7 rounds) ---
  echo "[$name] Gemini collection starting..." | tee -a "$log_file"
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
  echo "[$name] Gemini collection done" | tee -a "$log_file"

  # --- Naver API collection (60+ per category) ---
  echo "[$name] Naver collection starting..." | tee -a "$log_file"
  cd "$V40_DIR/scripts/workflow"

  for cat in $CATEGORIES; do
    echo "  [$name] Naver: $cat" >> "$log_file"
    python collect_naver_v40_final.py \
      --politician-id "$id" \
      --politician-name "$name" \
      --category "$cat" >> "$log_file" 2>&1 || true
  done
  echo "[$name] Naver collection done" | tee -a "$log_file"

  # --- Phase Gate 1: Count check ---
  echo "" >> "$log_file"
  echo "=== [$name] Phase Gate 1: Count Check ===" | tee -a "$log_file"
  cd "$V40_DIR"
  python -c "
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
    if len(r.data) < 1000:
        break
    offset += 1000

for ai in ['Gemini', 'Naver']:
    cnt = 0
    off = 0
    while True:
        r = s.table('collected_data_v40').select('id').eq('politician_id', '$id').eq('collector_ai', ai).range(off, off+999).execute()
        cnt += len(r.data)
        if len(r.data) < 1000:
            break
        off += 1000
    print(f'  {ai}: {cnt}')

print(f'  Total: {total}')
if total >= 1000:
    print('  Phase Gate 1: PASSED')
else:
    print(f'  Phase Gate 1: FAILED ({total}/1000)')
" 2>&1 | tee -a "$log_file"

  echo "[$name ($id)] Phase 1 finished at $(date '+%H:%M:%S')" | tee -a "$log_file"
}

# ─── Launch all politicians in parallel ───
PIDS=()
for entry in "${POLITICIANS[@]}"; do
  IFS=':' read -r id name <<< "$entry"
  echo "Launching: $name ($id)"
  collect_politician "$id" "$name" &
  PIDS+=($!)
done

echo ""
echo "All ${#POLITICIANS[@]} politicians collecting in parallel..."
echo "Log files: $LOG_DIR/*_phase1_${TIMESTAMP}.log"
echo ""

# ─── Wait for all to complete ───
FAILED=0
for i in "${!PIDS[@]}"; do
  if ! wait "${PIDS[$i]}" 2>/dev/null; then
    IFS=':' read -r id name <<< "${POLITICIANS[$i]}"
    echo "WARNING: $name ($id) collection had errors (check log)"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "========================================="
echo "V40 Multi-Politician Phase 1 Complete"
echo "End: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Success: $((${#POLITICIANS[@]} - FAILED))/${#POLITICIANS[@]}"
if [ $FAILED -gt 0 ]; then
  echo "Failed: $FAILED (check logs for details)"
fi
echo ""
echo "Next step: Phase 2 (Validate) + Phase 2-2 (Adjust)"
echo "  cd $V40_DIR/scripts/core"
echo "  python validate_v40_fixed.py --politician_id=ID --politician_name=NAME --no-dry-run"
echo "  python adjust_v40_data.py --politician_id=ID --politician_name=NAME --no-dry-run"
echo "========================================="
