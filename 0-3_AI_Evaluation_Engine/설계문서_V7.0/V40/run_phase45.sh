#!/bin/bash
# Phase 4-5: Score Calculation & Report Generation

echo "=== Phase 4: Score Calculation ==="
python3 scripts/core/calculate_v40_scores.py --politician_id=c45565d7 --politician_name="이재준" 2>&1 | tail -10 &
python3 scripts/core/calculate_v40_scores.py --politician_id=1e43d6f1 --politician_name="명재성" 2>&1 | tail -10 &
wait

echo ""
echo "=== Phase 5: Report Generation ==="
python3 scripts/core/generate_report_v40.py --politician_id=c45565d7 --politician_name="이재준" --type=C 2>&1 | tail -5 &
python3 scripts/core/generate_report_v40.py --politician_id=1e43d6f1 --politician_name="명재성" --type=C 2>&1 | tail -5 &
wait

echo ""
echo "=== Phase 4-5 Complete ==="

