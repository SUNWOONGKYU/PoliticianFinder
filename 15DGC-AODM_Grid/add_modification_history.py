#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
15DGC-AODM v3.0 최종 업그레이드 스크립트
"비고" 행 다음에 "수정 이력" 행 추가
"""

import csv
import sys

def add_modification_history(csv_file):
    """비고 행 다음에 수정 이력 행 추가"""

    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        rows = list(reader)

    new_rows = []
    added_count = 0

    for i, row in enumerate(rows):
        # 현재 행 추가
        new_rows.append(row)

        # "비고" 행 다음에 "수정 이력" 행 추가
        if len(row) > 1 and row[1] == '비고':
            # 다음 행이 "수정 이력"이 아닌 경우에만 추가
            if i + 1 >= len(rows) or (len(rows[i + 1]) > 1 and rows[i + 1][1] != '수정 이력'):
                # "수정 이력" 행 생성 (비고와 같은 길이로)
                modification_history_row = ['', '수정 이력']

                # 나머지 컬럼은 '-'로 채움
                for j in range(2, len(row)):
                    modification_history_row.append('-')

                new_rows.append(modification_history_row)
                added_count += 1

    # 새로운 CSV 파일 작성
    with open(csv_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(new_rows)

    print(f"[+] {csv_file} 업그레이드 완료!")
    print(f"    '수정 이력' 행 추가: {added_count}개")
    print(f"    총 행 수: {len(new_rows)}행")

if __name__ == '__main__':
    csv_file = 'project_grid_v3.0_supabase.csv'
    add_modification_history(csv_file)
