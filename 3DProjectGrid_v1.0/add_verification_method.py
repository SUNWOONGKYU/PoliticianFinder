#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
15DGC-AODM v3.0 업그레이드 스크립트
1. 중복된 "비고" 행 → 두번째는 "수정 이력"으로 변경
2. "검증 방법" 행 추가 (상태 다음, 테스트/검토 이전)
"""

import csv
import sys

def upgrade_to_v3(csv_file):
    """CSV 파일을 v3.0으로 업그레이드"""

    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        rows = list(reader)

    new_rows = []
    i = 0
    fixed_bigo_count = 0
    added_verification_count = 0

    while i < len(rows):
        row = rows[i]

        # 현재 행 추가
        new_rows.append(row)

        # "상태" 행 다음에 "검증 방법" 행 추가
        if len(row) > 1 and row[1] == '상태':
            # 다음 행이 "테스트/검토"인지 확인
            if i + 1 < len(rows) and rows[i + 1][1] == '테스트/검토':
                # "검증 방법" 행 생성
                verification_row = ['', '검증 방법']

                # 각 Phase에 대한 기본값 추가
                for j in range(2, len(row)):
                    if row[j] and row[j] not in ['대기', '-', '']:
                        verification_row.append('Build Test')
                    else:
                        verification_row.append('-')

                new_rows.append(verification_row)
                added_verification_count += 1

        # 첫 번째 "비고" 행을 찾으면
        if len(row) > 1 and row[1] == '비고':
            # 다음 행도 "비고"인지 확인
            if i + 1 < len(rows) and len(rows[i + 1]) > 1 and rows[i + 1][1] == '비고':
                # 두 번째 비고 행을 "수정 이력"으로 변경
                second_bigo_row = rows[i + 1]
                modified_row = ['', '수정 이력'] + second_bigo_row[2:]
                new_rows.append(modified_row)
                fixed_bigo_count += 1
                i += 2  # 두 행 모두 처리했으므로 2칸 건너뛰기
                continue

        i += 1

    # 새로운 CSV 파일 작성
    with open(csv_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(new_rows)

    print(f"[+] {csv_file} 업그레이드 완료!")
    print(f"    '검증 방법' 행 추가: {added_verification_count}개")
    print(f"    '비고' → '수정 이력' 변경: {fixed_bigo_count}개")
    print(f"    총 행 수: {len(new_rows)}행")

if __name__ == '__main__':
    csv_file = 'project_grid_v3.0_supabase.csv'
    upgrade_to_v3(csv_file)
