#!/bin/bash
OUTPUT_FILE="C:\Users\home\AppData\Local\Temp\claude\C--Development-PoliticianFinder-com-Developement-Real-PoliticianFinder-0-3-AI-Evaluation-Engine\tasks\b66bbe0.output"

while true; do
  clear
  echo "=== V40 누락 평가 진행 상황 ==="
  echo "시간: $(date '+%H:%M:%S')"
  echo ""
  
  if [ -f "$OUTPUT_FILE" ]; then
    # 파일 크기 표시
    SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo "출력 파일 크기: $SIZE"
    echo ""
    
    # 마지막 20줄 표시
    echo "--- 최근 출력 ---"
    tail -20 "$OUTPUT_FILE" 2>/dev/null | iconv -f cp949 -t utf-8 2>/dev/null || tail -20 "$OUTPUT_FILE" 2>/dev/null
  else
    echo "아직 출력 없음"
  fi
  
  # 프로세스 확인
  if ps aux | grep -q "[f]ill_missing_evaluations_v40.py"; then
    echo ""
    echo "프로세스: 실행 중"
  else
    echo ""
    echo "프로세스: 완료 또는 종료"
    break
  fi
  
  sleep 30
done

echo ""
echo "=== 최종 결과 ==="
tail -50 "$OUTPUT_FILE" 2>/dev/null | iconv -f cp949 -t utf-8 2>/dev/null || tail -50 "$OUTPUT_FILE" 2>/dev/null
