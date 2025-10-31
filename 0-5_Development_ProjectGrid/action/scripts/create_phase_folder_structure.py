#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 기반 폴더 구조 자동 생성 스크립트
PROJECT GRID 매뉴얼 V4.0 Section 3.2 준수
"""

import json
import os
from pathlib import Path

# 파일 경로
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
GRID_FILE = SCRIPT_DIR.parent / "PROJECT_GRID" / "grid" / "generated_grid_full_v4_10agents_with_skills.json"

# Phase 이름 매핑
PHASE_NAMES = {
    1: "Phase_01_Foundation",
    2: "Phase_02_Core",
    3: "Phase_03_Enhancement",
    4: "Phase_04_Integration",
    5: "Phase_05_Optimization",
    6: "Phase_06_Advanced",
    7: "Phase_07_Deployment"
}

# Area 이름 매핑
AREA_NAMES = {
    "O": "DevOps",
    "D": "Database",
    "BI": "Backend_Infrastructure",
    "BA": "Backend_APIs",
    "F": "Frontend",
    "T": "Test"
}

def create_phase_structure():
    """Phase 기반 폴더 구조 생성"""

    print("=" * 70)
    print("Phase 기반 폴더 구조 생성")
    print("=" * 70)
    print(f"프로젝트 루트: {PROJECT_ROOT}")
    print()

    # 1. JSON 파일 읽기
    print("1. PROJECT GRID 데이터 로드")
    with open(GRID_FILE, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    print(f"   총 {len(tasks)}개 작업 로드됨")

    # Phase Gate 제외
    regular_tasks = [t for t in tasks if t.get('area') != 'GATE']
    gate_tasks = [t for t in tasks if t.get('area') == 'GATE']
    print(f"   - 일반 작업: {len(regular_tasks)}개")
    print(f"   - Phase Gates: {len(gate_tasks)}개")
    print()

    # 2. Phase별로 그룹화
    print("2. Phase별 그룹화")
    phase_groups = {}
    for task in regular_tasks:
        phase = task['phase']
        area = task['area']
        task_id = task['task_id']

        if phase not in phase_groups:
            phase_groups[phase] = {}
        if area not in phase_groups[phase]:
            phase_groups[phase][area] = []

        phase_groups[phase][area].append(task_id)

    for phase in sorted(phase_groups.keys()):
        print(f"   Phase {phase}: {sum(len(tasks) for tasks in phase_groups[phase].values())}개 작업")
    print()

    # 3. 폴더 생성
    print("3. 폴더 구조 생성")
    created_folders = []

    for phase, areas in phase_groups.items():
        phase_name = PHASE_NAMES[phase]
        phase_dir = PROJECT_ROOT / phase_name

        # Phase 폴더 생성
        if not phase_dir.exists():
            phase_dir.mkdir(parents=True, exist_ok=True)
            created_folders.append(str(phase_dir))
            print(f"   ✓ {phase_name}/")

        # Area 폴더 생성
        for area, task_ids in areas.items():
            area_name = AREA_NAMES[area]
            area_dir = phase_dir / area_name

            if not area_dir.exists():
                area_dir.mkdir(parents=True, exist_ok=True)
                created_folders.append(str(area_dir))
                print(f"     ✓ {phase_name}/{area_name}/")

            # TaskID 폴더 생성
            for task_id in task_ids:
                task_dir = area_dir / task_id

                if not task_dir.exists():
                    task_dir.mkdir(parents=True, exist_ok=True)
                    created_folders.append(str(task_dir))

                    # .gitkeep 파일 생성 (빈 폴더 유지용)
                    gitkeep_file = task_dir / ".gitkeep"
                    gitkeep_file.touch()

                    # README.md 생성
                    readme_file = task_dir / "README.md"
                    with open(readme_file, 'w', encoding='utf-8') as f:
                        task_info = next(t for t in regular_tasks if t['task_id'] == task_id)
                        f.write(f"# {task_id}\n\n")
                        f.write(f"## 업무\n{task_info['task_name']}\n\n")
                        f.write(f"## 담당 AI\n{task_info['assigned_agent']}\n\n")
                        f.write(f"## 작업지시서\n[{task_info['instruction_file']}](../../../{task_info['instruction_file']})\n\n")
                        f.write(f"## 사용도구\n{task_info['tools']}\n\n")
                        f.write(f"## 의존성\n{task_info['dependency_chain']}\n\n")
                        f.write(f"---\n")
                        f.write(f"이 폴더는 {task_id} 작업의 소스코드를 저장합니다.\n")
                        f.write(f"모든 파일명은 `{task_id}_` 접두사를 포함해야 합니다.\n")

    print()
    print(f"   총 {len(created_folders)}개 폴더 생성됨")
    print()

    # 4. 구조 요약
    print("4. 생성된 구조 요약")
    print()
    print("프로젝트루트/")
    for phase in sorted(phase_groups.keys()):
        phase_name = PHASE_NAMES[phase]
        print(f"├── {phase_name}/")

        areas_in_phase = sorted(phase_groups[phase].keys())
        for i, area in enumerate(areas_in_phase):
            area_name = AREA_NAMES[area]
            task_count = len(phase_groups[phase][area])

            is_last_area = (i == len(areas_in_phase) - 1)
            prefix = "└──" if is_last_area else "├──"

            print(f"│   {prefix} {area_name}/ ({task_count}개 Task 폴더)")
    print()

    # 5. .gitignore 업데이트
    gitignore_file = PROJECT_ROOT / ".gitignore"
    gitignore_content = """
# Phase 폴더 내 node_modules
Phase_*/*/node_modules/
Phase_*/*/.next/
Phase_*/*/.vercel/

# 빌드 결과물
Phase_*/*/build/
Phase_*/*/dist/
Phase_*/*/.cache/

# 환경 변수
Phase_*/*/.env
Phase_*/*/.env.local

# Python
Phase_*/*/__pycache__/
Phase_*/*/*.pyc

# 로그
Phase_*/*/*.log
"""

    if gitignore_file.exists():
        with open(gitignore_file, 'a', encoding='utf-8') as f:
            f.write(gitignore_content)
        print("5. .gitignore 업데이트 완료")
    print()

    print("=" * 70)
    print("✅ Phase 폴더 구조 생성 완료!")
    print("=" * 70)
    print()
    print("다음 단계:")
    print("1. 각 Task 폴더에 소스코드 파일 생성 시작")
    print("2. 파일명에 Task ID 포함 (예: P1O1_github_workflow.yml)")
    print("3. 모든 파일에 Task ID 헤더 주석 포함")
    print()

if __name__ == "__main__":
    create_phase_structure()
