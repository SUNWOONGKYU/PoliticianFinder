#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 3 작업 완료 업데이트 스크립트
13DGC-AODM 방법론에 따라 프로젝트 그리드 업데이트
"""

import csv
from datetime import datetime

# 입력/출력 파일
input_file = 'project_grid_v2.0_supabase.csv'
output_file = 'project_grid_v2.0_supabase.csv'

# 완료 시간
completion_time = f'완료 ({datetime.now().strftime("%Y-%m-%d %H:%M")})'

# CSV 파일 읽기
rows = []
with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    rows = list(reader)

# Phase 3는 5번째 컬럼 (인덱스 4)
phase3_col = 4

update_count = 0

# 각 행을 순회하며 Phase 3 컬럼 업데이트
for i, row in enumerate(rows):
    if len(row) <= phase3_col:
        continue

    # 속성 확인 (2번째 컬럼)
    if len(row) > 1:
        attr = row[1]

        # 진도: 0% → 100%
        if attr == '진도' and row[phase3_col] == '0%':
            row[phase3_col] = '100%'
            update_count += 1
            print(f"Line {i+1}: 진도 0% -> 100%")

        # 상태: 대기 → 완료 (timestamp)
        elif attr == '상태' and row[phase3_col] == '대기':
            row[phase3_col] = completion_time
            update_count += 1
            print(f"Line {i+1}: 상태 대기 -> {completion_time}")

        # 테스트/검토: 대기 → 통과
        elif attr == '테스트/검토' and row[phase3_col] == '대기':
            old_val = row[phase3_col]
            row[phase3_col] = '통과'
            update_count += 1
            print(f"Line {i+1}: 테스트/검토 {old_val} -> 통과")

# 결과 저장
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"\n[OK] 업데이트 완료: {output_file}")
print(f"[OK] 총 {update_count}개 항목이 업데이트되었습니다!")
print(f"[OK] Phase 3 모든 작업이 {completion_time}로 업데이트되었습니다!")
