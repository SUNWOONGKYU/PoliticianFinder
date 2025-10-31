#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase Gate를 PROJECT GRID JSON에 추가하는 스크립트
각 Phase의 마지막에 Phase Gate 작업을 삽입
"""

import json
from pathlib import Path

# 파일 경로
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
GRID_FILE = PROJECT_ROOT / "PROJECT_GRID" / "grid" / "generated_grid_full_v4_10agents_with_skills.json"

# Phase별 작업 수 (Phase Gate 삽입 전)
PHASE_TASK_COUNTS = {
    1: 20,
    2: 24,
    3: 32,
    4: 14,
    5: 12,
    6: 24,
    7: 18
}

def create_phase_gate(phase: int, task_count: int) -> dict:
    """Phase Gate 작업 생성"""
    return {
        "phase": phase,
        "area": "GATE",
        "task_id": f"GATE_P{phase}",
        "task_name": f"Phase {phase} 완료 검증",
        "instruction_file": "-",
        "assigned_agent": "-",
        "tools": "-",
        "work_mode": "Manual",
        "dependency_chain": f"Phase {phase} 모든 작업",
        "progress": 0,
        "status": "⏳ 대기 중",
        "generated_files": "-",
        "generator": "-",
        "duration": "-",
        "modification_history": "-",
        "test_history": f"Tasks:0/{task_count}완료, CR:0/{task_count}통과, Test:0/{task_count}통과",
        "build_result": "⏳ 대기",
        "dependency_propagation": "⏳ 대기",
        "blocker": f"Phase {phase} 작업 진행 필요",
        "validation_result": "⏳ 대기",
        "remarks": f"===PHASE GATE=== Phase {phase+1} 진입 조건: 모든 작업 완료, 모든 CR 통과, 모든 테스트 통과"
    }

def add_phase_gates():
    """Phase Gates를 JSON에 추가"""

    print("=" * 70)
    print("Phase Gate 추가 스크립트")
    print("=" * 70)

    # 1. JSON 파일 읽기
    print(f"\n1. JSON 파일 읽기: {GRID_FILE.name}")
    with open(GRID_FILE, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    print(f"   - 기존 작업 수: {len(tasks)}")

    # 2. Phase별로 그룹화 및 Phase Gate 삽입 위치 찾기
    print("\n2. Phase별 작업 수 확인")
    phase_groups = {}
    for i, task in enumerate(tasks):
        phase = task['phase']
        if phase not in phase_groups:
            phase_groups[phase] = []
        phase_groups[phase].append(i)

    for phase in sorted(phase_groups.keys()):
        indices = phase_groups[phase]
        print(f"   - Phase {phase}: {len(indices)}개 작업 (Index {indices[0]} ~ {indices[-1]})")

    # 3. Phase Gate 삽입 (역순으로 삽입하여 인덱스 유지)
    print("\n3. Phase Gate 삽입")
    new_tasks = tasks.copy()

    inserted_count = 0
    for phase in sorted(PHASE_TASK_COUNTS.keys(), reverse=True):
        if phase in phase_groups:
            last_index = phase_groups[phase][-1]
            task_count = PHASE_TASK_COUNTS[phase]

            # Phase Gate 생성
            phase_gate = create_phase_gate(phase, task_count)

            # 마지막 작업 다음에 삽입
            insert_position = last_index + 1 + inserted_count
            new_tasks.insert(insert_position, phase_gate)

            print(f"   - Phase {phase} Gate 삽입: GATE_P{phase} (위치: {insert_position})")
            inserted_count += 1

    print(f"\n   총 {inserted_count}개 Phase Gate 추가됨")
    print(f"   새로운 총 작업 수: {len(new_tasks)} (기존 {len(tasks)} + Gates {inserted_count})")

    # 4. 백업 생성
    backup_file = GRID_FILE.parent / f"{GRID_FILE.stem}_backup_before_gates.json"
    print(f"\n4. 백업 생성: {backup_file.name}")
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)

    # 5. 새 JSON 저장
    print(f"\n5. 업데이트된 JSON 저장: {GRID_FILE.name}")
    with open(GRID_FILE, 'w', encoding='utf-8') as f:
        json.dump(new_tasks, f, ensure_ascii=False, indent=2)

    # 6. 검증
    print("\n6. 검증")
    with open(GRID_FILE, 'r', encoding='utf-8') as f:
        verify_tasks = json.load(f)

    gate_count = sum(1 for t in verify_tasks if t.get('area') == 'GATE')
    print(f"   - 총 작업 수: {len(verify_tasks)}")
    print(f"   - Phase Gate 수: {gate_count}")

    print("\n" + "=" * 70)
    print("✅ Phase Gate 추가 완료!")
    print("=" * 70)

    # 7. Phase Gate 목록 출력
    print("\n추가된 Phase Gates:")
    for task in verify_tasks:
        if task.get('area') == 'GATE':
            print(f"   - {task['task_id']}: {task['task_name']}")
            print(f"     상태: {task['status']}")
            print(f"     검증: {task['test_history']}")
            print()

if __name__ == "__main__":
    add_phase_gates()
