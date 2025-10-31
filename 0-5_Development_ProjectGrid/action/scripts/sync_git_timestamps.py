#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Git 커밋 시간을 PROJECT GRID에 자동으로 반영
"""

import json
import subprocess
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent
GRID_FILE = SCRIPT_DIR.parent / "PROJECT_GRID" / "grid" / "generated_grid_full_v4_10agents_with_skills.json"

def parse_task_range(commit_msg):
    """커밋 메시지에서 Task ID 범위 파싱
    예: [P1D2-P1D5] -> ['P1D2', 'P1D3', 'P1D4', 'P1D5']
        [P1F1-P1F5, P1T1-P1T2] -> ['P1F1', ..., 'P1F5', 'P1T1', 'P1T2']
    """
    import re

    # [P1D2-P1D5] 또는 [P1F1-P1F5, P1T1-P1T2] 패턴 찾기
    pattern = r'\[([^\]]+)\]'
    match = re.search(pattern, commit_msg)

    if not match:
        return []

    task_str = match.group(1)
    task_ids = []

    # 쉼표로 분리된 여러 범위 처리
    for part in task_str.split(','):
        part = part.strip()

        # 범위 형식: P1D2-P1D5
        if '-' in part and len(part.split('-')) == 2:
            start, end = part.split('-')
            start = start.strip()
            end = end.strip()

            # Phase와 Area 추출
            phase_area = start[:-1]  # P1D
            start_num = int(start[-1])  # 2
            end_num = int(end[-1])    # 5

            # 범위 내 모든 Task ID 생성
            for i in range(start_num, end_num + 1):
                task_ids.append(f"{phase_area}{i}")
        else:
            # 단일 Task ID
            task_ids.append(part)

    return task_ids

def get_git_commit_time(task_id):
    """Git 로그에서 Task ID의 첫 커밋 시간 찾기"""
    try:
        # 모든 커밋 가져오기 (Phase 1 관련)
        cmd = [
            'git', 'log',
            '--all',
            '--grep', 'P1',
            '--format=%ai|%an|%s',
            '--reverse'  # 가장 오래된 것부터
        ]

        result = subprocess.run(
            cmd,
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )

        if result.returncode == 0 and result.stdout.strip():
            lines = result.stdout.strip().split('\n')

            # 각 커밋에서 Task ID 범위 파싱하여 매칭
            for line in lines:
                parts = line.split('|')
                if len(parts) >= 3:
                    commit_time = parts[0]
                    author = parts[1]
                    message = parts[2]

                    # 이 커밋에 포함된 Task ID들
                    task_ids = parse_task_range(message)

                    # 찾는 Task ID가 이 커밋에 포함되어 있으면
                    if task_id in task_ids:
                        # 시간만 추출 (타임존 제거)
                        time_only = commit_time.rsplit(' ', 1)[0]

                        return {
                            'time': time_only,
                            'author': author,
                            'message': message
                        }

        return None
    except Exception as e:
        print(f"Error getting git time for {task_id}: {e}")
        return None

def sync_timestamps():
    """Git 커밋 시간을 PROJECT GRID에 동기화"""

    # JSON 읽기
    with open(GRID_FILE, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    updated_count = 0

    for task in tasks:
        task_id = task.get("task_id")

        # Phase Gate는 건너뛰기
        if task_id and task_id.startswith("GATE_"):
            continue

        # Git 커밋 정보 가져오기
        git_info = get_git_commit_time(task_id)

        if git_info:
            # modification_history 업데이트
            task["modification_history"] = f"{git_info['time']}: 초기 생성 (Git 커밋)"

            # generator가 '-'인 경우 Git author로 업데이트
            if task.get("generator") == "-":
                task["generator"] = git_info['author']

            updated_count += 1
            print(f"Updated {task_id}: {git_info['time']} by {git_info['author']}")

    # JSON 저장
    with open(GRID_FILE, 'w', encoding='utf-8') as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)

    print(f"\nTotal updated: {updated_count} tasks")
    return updated_count

if __name__ == "__main__":
    print("="*70)
    print("Git 커밋 시간을 PROJECT GRID에 동기화")
    print("="*70)
    print()

    count = sync_timestamps()

    print()
    print("="*70)
    print(f"완료! {count}개 작업의 타임스탬프 업데이트됨")
    print("="*70)
