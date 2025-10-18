#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
P1F7 작업 블록 추가 스크립트
메인 페이지 UI 개선 및 커뮤니티 섹션 추가 작업
"""

import csv
from datetime import datetime

def add_p1f7_task(csv_file):
    """P1F7 작업 블록을 CSV에 추가"""

    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        rows = list(reader)

    # P1F6 블록 찾기 (P1F7을 그 다음에 추가)
    p1f6_index = None
    for i, row in enumerate(rows):
        if len(row) > 2 and row[1] == '작업ID' and 'P1F6' in row[2]:
            p1f6_index = i
            break

    if p1f6_index is None:
        print("[!] P1F6 작업 블록을 찾을 수 없습니다.")
        return

    # P1F6 블록의 끝 찾기 (수정 이력 행까지)
    insert_index = None
    for i in range(p1f6_index, len(rows)):
        if len(rows[i]) > 1 and rows[i][1] == '수정 이력':
            insert_index = i + 1
            break

    if insert_index is None:
        print("[!] P1F6 블록의 끝을 찾을 수 없습니다.")
        return

    # 현재 날짜
    today = datetime.now().strftime('%Y-%m-%d %H:%M')

    # P1F7 작업 블록 생성 (13개 속성)
    p1f7_block = [
        ['', '작업ID', 'P1F7', '', '', '', '', '', '', ''],
        ['', '업무', '메인 페이지 UI 개선 및 커뮤니티 섹션 추가', '', '', '', '', '', '', ''],
        ['', '작업지시서', 'tasks/P1F7.md', '', '', '', '', '', '', ''],
        ['', '담당AI', 'fullstack-developer', '', '', '', '', '', '', ''],
        ['', '진도', '100%', '', '', '', '', '', '', ''],
        ['', '상태', f'완료 ({today})', '', '', '', '', '', '', ''],
        ['', '검증 방법', 'Build Test', '-', '-', '-', '-', '-', '-', '-'],
        ['', '테스트/검토', '통과', '', '', '', '', '', '', ''],
        ['', '자동화방식', 'AI-only', '', '', '', '', '', '', ''],
        ['', '의존작업', 'P1F6', '', '', '', '', '', '', ''],
        ['', '블로커', '없음', '', '', '', '', '', '', ''],
        ['', '비고', '-', '-', '-', '-', '-', '-', '-', '-'],
        ['', '수정 이력', '메인 색상 파란색→보라색 변경, 커뮤니티 섹션(인기글/정치인글) 추가, 핵심 메시지 강조', '-', '-', '-', '-', '-', '-', '-']
    ]

    # P1F7 블록 삽입
    for row in reversed(p1f7_block):
        rows.insert(insert_index, row)

    # CSV 파일 저장
    with open(csv_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    print(f"[+] P1F7 작업 블록이 추가되었습니다 (라인 {insert_index})")
    print(f"    작업명: 메인 페이지 UI 개선 및 커뮤니티 섹션 추가")
    print(f"    진도: 100%")
    print(f"    상태: 완료 ({today})")
    print(f"    총 행 수: {len(rows)}행")

if __name__ == '__main__':
    csv_file = 'project_grid_v3.0_supabase.csv'
    add_p1f7_task(csv_file)
