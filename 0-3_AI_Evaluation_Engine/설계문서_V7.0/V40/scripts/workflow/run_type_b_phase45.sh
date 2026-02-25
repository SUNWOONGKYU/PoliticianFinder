#!/bin/bash
# =============================================================================
# V40 Type B - Phase 4-5: Score Calculation + Report Generation
# =============================================================================
# Usage: ./run_type_b_phase45.sh <politician_id> <politician_name>
#
# Phase 4: Calculate category scores and final score (200-1000)
# Phase 5: Generate markdown report in 보고서/{name}_{date}.md
#
# Output: JSON result to stdout for n8n parsing
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V40_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$V40_DIR/.phase_status"
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
  echo '{"error":"Usage: ./run_type_b_phase45.sh <politician_id> <politician_name>"}' >&2
  exit 1
fi

ID="$1"
NAME="$2"
LOG_FILE="$LOG_DIR/${ID}_type_b_phase45_${TIMESTAMP}.log"

echo "=========================================" >&2
echo "V40 Type B - Phase 4-5: Scores & Report" >&2
echo "Politician: $NAME ($ID)" >&2
echo "Start: $(date '+%Y-%m-%d %H:%M:%S')" >&2
echo "=========================================" >&2

# ─── Phase 4: Calculate Scores ───
echo "[$NAME] Phase 4: Calculating scores..." | tee "$LOG_FILE" >&2
cd "$V40_DIR/scripts/core"

SCORE_OK=0
SCORE_OUTPUT=$(python calculate_v40_scores.py \
  --politician_id="$ID" \
  --politician_name="$NAME" 2>&1) && SCORE_OK=1 || true

echo "$SCORE_OUTPUT" >> "$LOG_FILE"

if [ $SCORE_OK -eq 1 ]; then
  echo "[$NAME] Phase 4: Score calculation complete" | tee -a "$LOG_FILE" >&2
else
  echo "[$NAME] Phase 4: Score calculation FAILED" | tee -a "$LOG_FILE" >&2
fi

# ─── Retrieve final score from DB ───
FINAL_SCORE=$(cd "$V40_DIR" && python -c "
import os
from supabase import create_client
from dotenv import load_dotenv
load_dotenv()
s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
r = s.table('ai_final_scores_v40').select('final_score').eq('politician_id', '$ID').execute()
if r.data:
    print(r.data[0]['final_score'])
else:
    print('null')
" 2>/dev/null || echo "null")

# ─── Phase 5: Generate Report ───
echo "[$NAME] Phase 5: Generating report..." | tee -a "$LOG_FILE" >&2
cd "$V40_DIR/scripts/core"

REPORT_OK=0
REPORT_OUTPUT=$(python generate_report_v40.py \
  --politician_id="$ID" \
  --politician_name="$NAME" 2>&1) && REPORT_OK=1 || true

echo "$REPORT_OUTPUT" >> "$LOG_FILE"

if [ $REPORT_OK -eq 1 ]; then
  echo "[$NAME] Phase 5: Report generated" | tee -a "$LOG_FILE" >&2
else
  echo "[$NAME] Phase 5: Report generation FAILED" | tee -a "$LOG_FILE" >&2
fi

# ─── Find report file ───
TODAY=$(date '+%Y%m%d')
REPORT_FILE="$V40_DIR/reports/${NAME}_${TODAY}.md"
REPORT_EXISTS="false"
if [ -f "$REPORT_FILE" ]; then
  REPORT_EXISTS="true"
fi

# ─── Output JSON result ───
cat <<EOF
{
  "id": "$ID",
  "name": "$NAME",
  "phase4": {
    "status": $([ $SCORE_OK -eq 1 ] && echo '"ok"' || echo '"fail"'),
    "final_score": $FINAL_SCORE
  },
  "phase5": {
    "status": $([ $REPORT_OK -eq 1 ] && echo '"ok"' || echo '"fail"'),
    "report_exists": $REPORT_EXISTS,
    "report_path": "reports/${NAME}_${TODAY}.md"
  }
}
EOF

echo "=========================================" >&2
echo "V40 Type B - Phase 4-5 Complete" >&2
echo "Final Score: $FINAL_SCORE" >&2
echo "Report: $REPORT_FILE" >&2
echo "End: $(date '+%Y-%m-%d %H:%M:%S')" >&2
echo "=========================================" >&2
