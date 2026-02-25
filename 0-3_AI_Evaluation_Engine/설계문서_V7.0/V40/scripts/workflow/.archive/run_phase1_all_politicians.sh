#!/bin/bash

# Phase 1 병렬 수집 - 21명 정치인 전체

POLITICIANS=(
    "우상호"
    "김진태"
    "염동열"
    "강훈식"
    "김태흠"
    "이장우"
    "양승조"
    "박찬대"
    "박남춘"
    "김교흥"
    "정일영"
    "정원오"
    "오세훈"
    "전재수"
    "박형준"
    "김부겸"
    "추경호"
    "김동연"
    "유승민"
    "김두겸"
    "김상욱"
)

CATEGORIES="expertise leadership vision integrity ethics accountability transparency communication responsiveness publicinterest"

echo "=========================================="
echo "Phase 1: 21명 정치인 Gemini CLI 수집 시작"
echo "=========================================="

cd "$(dirname "$0")"

# 각 정치인별 수집 시작 (병렬 - 최대 3개씩)
for politician in "${POLITICIANS[@]}"; do
    echo ""
    echo "[*] $politician 수집 시작..."
    
    # 각 정치인마다 7회 수집 (60개 목표)
    for i in {1..7}; do
        for category in $CATEGORIES; do
            # 백그라운드에서 실행 (최대 3개 병렬)
            python collect_gemini_subprocess.py --politician "$politician" --category "$category" > /dev/null 2>&1 &
            
            # 3개씩 실행 후 대기
            if (( $(jobs -r -p | wc -l) >= 3 )); then
                wait -n
            fi
        done
        echo "    Round $i/7 진행 중..."
        sleep 5
    done
    
    echo "[$politician] 완료"
done

# 남은 백그라운드 작업 완료 대기
wait

echo ""
echo "=========================================="
echo "모든 수집 완료!"
echo "=========================================="
