#!/bin/bash
# Re-collect CRITICAL gap categories

echo "=== Re-collecting CRITICAL categories ==="
echo ""
echo "Starting re-collection for:"
echo "  1. responsiveness (needs 64 more items)"
echo "  2. integrity (needs 39 more items)"
echo "  3. ethics (needs 37 more items)"
echo ""

cd "$(dirname "$0")/../.."

# Naver re-collection for critical categories
echo "Starting Naver re-collection..."
python scripts/workflow/collect_naver_v40_final.py 박주민 responsiveness integrity ethics &
NAVER_PID=$!

# Wait 2 minutes to stagger starts
sleep 120

# Gemini re-collection for critical categories
echo "Starting Gemini re-collection..."
python scripts/workflow/collect_gemini_v40_final.py 박주민 responsiveness integrity ethics &
GEMINI_PID=$!

echo ""
echo "Naver PID: $NAVER_PID"
echo "Gemini PID: $GEMINI_PID"
echo ""
echo "Waiting for both to complete..."

wait $NAVER_PID
echo "Naver completed"

wait $GEMINI_PID
echo "Gemini completed"

echo ""
echo "=== Re-collection complete ==="
echo "Run 'python scripts/utils/analyze_collection_gaps.py' to verify"
