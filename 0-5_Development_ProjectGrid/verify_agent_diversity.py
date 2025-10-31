#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
서브 에이전트 다양성 검증 스크립트
144개 작업지시서의 에이전트 분포 확인
"""

import re
from pathlib import Path
from collections import Counter

def verify_agent_diversity():
    """모든 작업지시서의 에이전트 분포 확인"""

    script_dir = Path(__file__).parent
    tasks_dir = script_dir / "tasks"

    agents = []
    areas = []

    for task_file in sorted(tasks_dir.glob("*.md")):
        with open(task_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # 에이전트 추출
        agent_match = re.search(r'- \*\*서브 에이전트\*\*: (.+)', content)
        if agent_match:
            agents.append(agent_match.group(1))

        # Area 추출
        area_match = re.search(r'- \*\*Area\*\*: .+ \(([A-Z]+)\)', content)
        if area_match:
            areas.append(area_match.group(1))

    # 통계
    agent_counts = Counter(agents)
    area_counts = Counter(areas)

    print("=" * 80)
    print("Agent Diversity Verification Report")
    print("=" * 80)
    print(f"\nTotal files checked: {len(agents)}")

    print("\n[Agent Distribution]")
    for agent, count in agent_counts.most_common():
        percentage = count * 100 // len(agents)
        print(f"  {agent:30s}: {count:3d} tasks ({percentage:2d}%)")

    print("\n[Area Distribution]")
    for area, count in area_counts.most_common():
        percentage = count * 100 // len(areas)
        print(f"  {area:5s}: {count:3d} tasks ({percentage:2d}%)")

    # Area별 Agent 매핑 확인
    print("\n[Area-Agent Mapping]")
    area_agent_map = {}
    for task_file in sorted(tasks_dir.glob("*.md"))[:10]:  # 샘플 10개
        with open(task_file, 'r', encoding='utf-8') as f:
            content = f.read()

        task_id_match = re.search(r'- \*\*작업 ID\*\*: (P\d+[A-Z]+\d+)', content)
        agent_match = re.search(r'- \*\*서브 에이전트\*\*: (.+)', content)
        area_match = re.search(r'- \*\*Area\*\*: .+ \(([A-Z]+)\)', content)

        if task_id_match and agent_match and area_match:
            task_id = task_id_match.group(1)
            agent = agent_match.group(1)
            area = area_match.group(1)
            print(f"  {task_id}: {area} -> {agent}")

    # 다양성 체크
    print("\n[Diversity Check]")
    unique_agents = len(agent_counts)
    print(f"  Unique agents used: {unique_agents}")

    if unique_agents >= 6:
        print("  Status: PASS (Diverse agent distribution)")
    elif unique_agents >= 4:
        print("  Status: GOOD (Multiple specialized agents)")
    else:
        print("  Status: WARNING (Limited agent diversity)")

    # fullstack-developer 비율 체크
    fullstack_count = agent_counts.get('fullstack-developer', 0)
    fullstack_ratio = fullstack_count * 100 // len(agents)
    print(f"\n  fullstack-developer ratio: {fullstack_ratio}%")
    if fullstack_ratio > 50:
        print("    WARNING: Over 50% concentration")
    elif fullstack_ratio > 30:
        print("    CAUTION: Over 30% concentration")
    else:
        print("    GOOD: Well-distributed")

    print("\n" + "=" * 80)
    print("Verification complete!")
    print("=" * 80)

if __name__ == "__main__":
    verify_agent_diversity()
