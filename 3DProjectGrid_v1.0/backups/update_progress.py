#!/usr/bin/env python3
"""
CSV 파일에서 완료된 작업의 진도를 업데이트하는 스크립트
"""

import csv
import sys

# CSV 파일 경로
csv_file = r"G:\내 드라이브\Developement\PoliticianFinder\12D-GCDM_Grid\project_grid_v1.2_full_XY.csv"

# 완료된 작업 정보
# P1A1 (Claude API 연동 준비) = P1A2 (Claude 평가 API 구현)로 대체 완료
# P1B1 = 일부 완료 (FastAPI 구조는 이미 있었고, evaluation 라우터 추가)
# P1D11 = Alembic 초기화 완료

completed_tasks = {
    'P1A1': {
        '진도': '100%',
        '상태': '완료',
        '테스트/검토': '통과'
    },
    'P1B1': {
        '진도': '50%',
        '상태': '진행중',
        '테스트/검토': '일부완료'
    },
    'P1D11': {
        '진도': '100%',
        '상태': '완료',
        '테스트/검토': '통과'
    }
}

def update_csv():
    """CSV 파일 업데이트"""

    # CSV 읽기
    rows = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)

    # 작업ID 행 찾기
    for i, row in enumerate(rows):
        if len(row) > 1 and row[1] == '작업ID':
            # 작업ID 행 바로 밑에 진도, 상태, 테스트/검토 행이 있음
            work_ids = row[2:]  # P1A1, P2A1, ... 등

            # 진도 행 찾기
            if i + 5 < len(rows) and rows[i + 5][1] == '진도':
                progress_row = rows[i + 5]
                # 각 작업ID 확인
                for j, work_id in enumerate(work_ids, start=2):
                    if work_id in completed_tasks:
                        progress_row[j] = completed_tasks[work_id]['진도']
                        print(f"Updated {work_id} 진도: {progress_row[j]}")

            # 상태 행 찾기
            if i + 6 < len(rows) and rows[i + 6][1] == '상태':
                status_row = rows[i + 6]
                for j, work_id in enumerate(work_ids, start=2):
                    if work_id in completed_tasks:
                        status_row[j] = completed_tasks[work_id]['상태']
                        print(f"Updated {work_id} 상태: {status_row[j]}")

            # 테스트/검토 행 찾기
            if i + 7 < len(rows) and rows[i + 7][1] == '테스트/검토':
                test_row = rows[i + 7]
                for j, work_id in enumerate(work_ids, start=2):
                    if work_id in completed_tasks:
                        test_row[j] = completed_tasks[work_id]['테스트/검토']
                        print(f"Updated {work_id} 테스트/검토: {test_row[j]}")

    # CSV 쓰기
    output_file = csv_file.replace('.csv', '_updated.csv')
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    print(f"\n[OK] Updated CSV saved to: {output_file}")
    print(f"Replace original: copy \"{output_file}\" \"{csv_file}\"")

if __name__ == '__main__':
    update_csv()
