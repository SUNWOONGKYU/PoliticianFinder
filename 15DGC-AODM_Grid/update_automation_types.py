#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 3, 4, 5 자동화 방식 업데이트 스크립트
13DGC-AODM v1.1 방법론 - 자동화 타입 분류
"""

import csv

# 입력/출력 파일
input_file = 'project_grid_v2.0_supabase.csv'
output_file = 'project_grid_v2.0_supabase.csv'

# 외부협력 작업 정의
external_ai_tasks = {
    'P4F2': '외부협력 (ChatGPT)',  # Lighthouse 90+ 최종 성능 측정
    'P4F3': '외부협력 (Gemini)',   # SEO 최적화 대량 키워드 분석
    'P5F2': '외부협력 (Gemini검토)',  # 사용자 가이드 Claude 작성 + Gemini 검토
}

# CSV 파일 읽기
rows = []
with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    rows = list(reader)

# Phase 3 (col 4), Phase 4 (col 5), Phase 5 (col 6) 업데이트
phase_cols = [4, 5, 6]  # Phase 3, 4, 5

update_count = 0

# 각 행을 순회하며 자동화방식 업데이트
for i, row in enumerate(rows):
    if len(row) <= 1:
        continue

    # 속성이 "자동화방식"인 행 찾기
    if len(row) > 1 and row[1] == '자동화방식':
        # 작업ID 행 찾기 (위쪽에서 찾기)
        task_id_row = None
        for offset in range(1, 15):
            if i >= offset and len(rows[i-offset]) > 1 and rows[i-offset][1] == '작업ID':
                task_id_row = rows[i-offset]
                break

        if task_id_row is None:
            continue

        # Phase 3, 4, 5 컬럼 업데이트
        for col_idx in phase_cols:
            if col_idx < len(row) and col_idx < len(task_id_row):
                task_id = task_id_row[col_idx]

                # 외부협력 작업인지 확인
                if task_id in external_ai_tasks:
                    old_val = row[col_idx]
                    new_val = external_ai_tasks[task_id]
                    row[col_idx] = new_val
                    update_count += 1
                    print(f"Line {i+1}, {task_id}: {old_val} → {new_val}")
                # AI-only로 설정 (빈 값이거나 다른 값인 경우)
                elif task_id and task_id.startswith('P') and row[col_idx] != 'AI-only':
                    old_val = row[col_idx]
                    row[col_idx] = 'AI-only'
                    if old_val:  # 기존 값이 있었던 경우만 출력
                        update_count += 1
                        print(f"Line {i+1}, {task_id}: {old_val} → AI-only")

# 결과 저장
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"\n✓ 업데이트 완료: {output_file}")
print(f"✓ 총 {update_count}개 자동화 방식이 업데이트되었습니다!")
print(f"\n📋 외부협력 작업:")
for task_id, method in external_ai_tasks.items():
    print(f"  - {task_id}: {method}")
