#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase Gate를 각 Phase의 정확한 마지막 위치에 삽입
"""

import json
from pathlib import Path

# 파일 경로
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
BACKUP_FILE = PROJECT_ROOT / "PROJECT_GRID" / "grid" / "generated_grid_full_v4_10agents_with_skills_backup_before_gates.json"
OUTPUT_FILE = PROJECT_ROOT / "PROJECT_GRID" / "grid" / "generated_grid_full_v4_10agents_with_skills.json"

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

def fix_phase_gates():
    """Phase Gates를 올바른 위치에 삽입"""

    print("=" * 70)
    print("Phase Gate 위치 수정 스크립트")
    print("=" * 70)

    # 1. 백업 파일 읽기
    print(f"\n1. 백업 파일 읽기: {BACKUP_FILE.name}")
    with open(BACKUP_FILE, 'r', encoding='utf-8') as f:
        original_tasks = json.load(f)

    print(f"   - 원본 작업 수: {len(original_tasks)}")

    # 2. Phase별로 작업 그룹화
    print("\n2. Phase별 작업 그룹화")
    phase_groups = {}
    for task in original_tasks:
        phase = task['phase']
        if phase not in phase_groups:
            phase_groups[phase] = []
        phase_groups[phase].append(task)

    for phase in sorted(phase_groups.keys()):
        print(f"   - Phase {phase}: {len(phase_groups[phase])}개 작업")

    # 3. Phase별로 Gate 추가하여 새 리스트 생성
    print("\n3. Phase별로 Gate 추가")
    new_tasks = []

    for phase in sorted(phase_groups.keys()):
        tasks_in_phase = phase_groups[phase]
        task_count = len(tasks_in_phase)

        # Phase 작업들 추가
        new_tasks.extend(tasks_in_phase)

        # Phase Gate 추가
        phase_gate = create_phase_gate(phase, task_count)
        new_tasks.append(phase_gate)

        print(f"   - Phase {phase}: {task_count}개 작업 + GATE_P{phase} 추가 (총 {len(new_tasks)})")

    print(f"\n   총 작업 수: {len(new_tasks)} (기존 {len(original_tasks)} + Gates {len(phase_groups)})")

    # 4. 저장
    print(f"\n4. 새 JSON 저장: {OUTPUT_FILE.name}")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(new_tasks, f, ensure_ascii=False, indent=2)

    # 5. 검증
    print("\n5. 검증")
    with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
        verify_tasks = json.load(f)

    print(f"   - 총 작업 수: {len(verify_tasks)}")
    print(f"   - Phase Gate 수: {sum(1 for t in verify_tasks if t.get('area') == 'GATE')}")

    # 각 Phase의 마지막 작업 확인
    print("\n6. 각 Phase 마지막 작업 확인")
    for phase in sorted(phase_groups.keys()):
        phase_tasks_indices = [i for i, t in enumerate(verify_tasks) if t['phase'] == phase]
        last_idx = phase_tasks_indices[-1]
        last_task = verify_tasks[last_idx]

        is_gate = "✓" if last_task['area'] == 'GATE' else "✗"
        print(f"   Phase {phase}: 마지막 작업 = {last_task['task_id']} ({last_task['area']}) {is_gate}")

    print("\n" + "=" * 70)
    print("완료!")
    print("=" * 70)

if __name__ == "__main__":
    fix_phase_gates()
