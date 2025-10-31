#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
작업지시서 144개 서브 에이전트 업데이트
agent_mapping_config.json 기반
"""

import json
import re
from pathlib import Path
from agent_mapper import get_mapper

def update_instruction_files():
    """작업지시서 파일들 업데이트"""

    base_dir = Path(__file__).parent
    tasks_dir = base_dir / "tasks"
    tasks_file = base_dir / "generated_grid_full_v4_10agents.json"

    print("="*80)
    print("작업지시서 144개 서브 에이전트 업데이트")
    print("="*80)

    # 작업 정보 로드
    with open(tasks_file, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    print(f"\n[LOAD] {len(tasks)} tasks from JSON")

    mapper = get_mapper()
    updated_count = 0

    for task in tasks:
        task_id = task['task_id']
        new_agent = task['assigned_agent']

        # 작업지시서 파일
        instruction_file = tasks_dir / f"{task_id}.md"

        if not instruction_file.exists():
            print(f"  [SKIP] {task_id}: 파일 없음")
            continue

        # 파일 읽기
        with open(instruction_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # 서브 에이전트 필드 찾기 및 교체
        pattern = r'(- \*\*서브 에이전트\*\*: )(.+)'
        match = re.search(pattern, content)

        if match:
            old_agent = match.group(2)
            if old_agent != new_agent:
                # 교체
                new_content = re.sub(pattern, f'\\1{new_agent}', content)

                # 파일 저장
                with open(instruction_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)

                print(f"  [UPDATE] {task_id}: {old_agent} → {new_agent}")
                updated_count += 1
        else:
            print(f"  [ERROR] {task_id}: 서브 에이전트 필드 없음")

    print(f"\n{'='*80}")
    print(f"업데이트 완료!")
    print(f"{'='*80}")
    print(f"총 파일: {len(tasks)}개")
    print(f"업데이트: {updated_count}개")
    print(f"{'='*80}")

if __name__ == "__main__":
    update_instruction_files()
