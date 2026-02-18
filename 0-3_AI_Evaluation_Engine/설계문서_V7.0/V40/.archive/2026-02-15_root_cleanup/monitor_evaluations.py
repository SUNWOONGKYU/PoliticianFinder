#!/usr/bin/env python3
"""
9개 카테고리 재평가 진행 상황 모니터링
"""

import time
import subprocess
from pathlib import Path

tasks = {
    'expertise': 'b4771fe',
    'leadership': 'bccb2d8',
    'vision': 'bc12c6a',
    'integrity': 'b08f671',
    'ethics': 'b76d749',
    'accountability': 'b54839e',
    'transparency': 'b414a9b',
    'communication': 'bb77b99',
    'publicinterest': 'b2b7f9f'
}

output_dir = Path(r"C:\Users\home\AppData\Local\Temp\claude\C--Development-PoliticianFinder-com-Developement-Real-PoliticianFinder-0-3-AI-Evaluation-Engine------V7-0-V40\tasks")

print("\n" + "="*80)
print("박주민 Gemini 재평가 진행 상황")
print("="*80 + "\n")

while True:
    completed = 0
    running = 0

    for category, task_id in tasks.items():
        output_file = output_dir / f"{task_id}.output"

        if not output_file.exists():
            status = "❓ 대기"
        else:
            content = output_file.read_text(encoding='utf-8', errors='ignore')

            if "[OK] Evaluation successful!" in content:
                # 완료 - evaluations saved 추출
                for line in content.split('\n'):
                    if "Evaluations saved:" in line:
                        saved_info = line.split("Evaluations saved:")[-1].strip()
                        status = f"✅ 완료 ({saved_info})"
                        completed += 1
                        break
                else:
                    status = "✅ 완료"
                    completed += 1
            elif "[ERROR]" in content and "Evaluation failed" in content:
                status = "❌ 실패"
                completed += 1
            elif "[BATCH" in content:
                # 진행 중 - 마지막 배치 정보 추출
                batches = [line for line in content.split('\n') if '[BATCH' in line]
                if batches:
                    last_batch = batches[-1]
                    if "Processing" in last_batch:
                        batch_info = last_batch.split("[BATCH")[-1].split("]")[0].strip()
                        status = f"🔄 배치 {batch_info}"
                        running += 1
                    else:
                        status = "🔄 진행 중"
                        running += 1
                else:
                    status = "🔄 시작"
                    running += 1
            else:
                status = "🔄 시작"
                running += 1

        print(f"{category:15s}: {status}")

    print(f"\n진행 상황: 완료 {completed}/9, 실행 중 {running}/9")
    print("="*80)

    if completed == 9:
        print("\n✅ 모든 카테고리 재평가 완료!")
        break

    time.sleep(10)  # 10초마다 업데이트
    print("\n" + "="*80)
    print(f"업데이트: {time.strftime('%H:%M:%S')}")
    print("="*80 + "\n")
