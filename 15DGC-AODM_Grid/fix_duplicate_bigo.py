#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Project Grid v3.0 수정 스크립트
중복된 '비고' 행 제거 및 '수정 이력' 행 추가
"""

import csv

def fix_project_grid(csv_file):
    """중복된 비고 제거 및 수정 이력 추가"""

    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        rows = list(reader)

    new_rows = []
    i = 0
    fixed_count = 0

    while i < len(rows):
        row = rows[i]

        # 현재 행 추가
        new_rows.append(row)

        # 첫 번째 "비고" 행을 찾으면
        if len(row) > 1 and row[1] == '비고':
            # 다음 행도 "비고"인지 확인
            if i + 1 < len(rows) and len(rows[i + 1]) > 1 and rows[i + 1][1] == '비고':
                # 두 번째 비고 행을 "수정 이력"으로 변경
                second_bigo_row = rows[i + 1]
                modified_row = ['', '수정 이력'] + second_bigo_row[2:]
                new_rows.append(modified_row)
                fixed_count += 1
                i += 2  # 두 행 모두 처리했으므로 2칸 건너뛰기
                continue

        i += 1

    # 새로운 CSV 파일 작성
    with open(csv_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(new_rows)

    print(f"[+] {csv_file} 수정 완료!")
    print(f"    수정된 작업 블록: {fixed_count}개")
    print(f"    총 행 수: {len(new_rows)}행")

if __name__ == '__main__':
    csv_file = 'project_grid_v3.0_supabase.csv'
    fix_project_grid(csv_file)
