#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PROJECT GRID JSON을 뷰어용 embedded_data_temp.js로 동기화
"""

import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
GRID_FILE = SCRIPT_DIR.parent / "PROJECT_GRID" / "grid" / "generated_grid_full_v4_10agents_with_skills.json"
VIEWER_DIR = SCRIPT_DIR.parent.parent.parent / "project-grid"
OUTPUT_FILE = VIEWER_DIR / "embedded_data_temp.js"

def sync_to_viewer():
    """PROJECT GRID JSON을 뷰어용 JS 파일로 변환"""

    print("="*70)
    print("PROJECT GRID -> 뷰어 동기화")
    print("="*70)
    print()

    # JSON 읽기
    print(f"읽기: {GRID_FILE}")
    with open(GRID_FILE, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    print(f"총 {len(tasks)}개 작업 로드됨")

    # JS 파일 생성
    print(f"쓰기: {OUTPUT_FILE}")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('const EMBEDDED_DATA = ')
        json.dump(tasks, f, ensure_ascii=False, indent=2)
        f.write(';')

    print()
    print("="*70)
    print("동기화 완료!")
    print("="*70)

    return len(tasks)

if __name__ == "__main__":
    count = sync_to_viewer()
    print(f"\n{count}개 작업이 뷰어에 동기화되었습니다.")
