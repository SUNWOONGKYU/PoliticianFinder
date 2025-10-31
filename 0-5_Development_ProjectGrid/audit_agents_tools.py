#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
서브에이전트 및 사용도구 전수 감사 스크립트
"""

import json
from pathlib import Path
from collections import defaultdict

def audit_agents_and_tools():
    """144개 작업의 서브에이전트와 사용도구 분석"""

    script_dir = Path(__file__).parent
    json_file = script_dir / "generated_grid_full_v4.json"

    print("=" * 80)
    print("TASK AGENTS & TOOLS AUDIT")
    print("=" * 80)

    with open(json_file, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    print(f"\nTotal tasks: {len(tasks)}")

    # Area별로 그룹화
    by_area = defaultdict(list)
    for task in tasks:
        by_area[task['area']].append(task)

    print(f"\n" + "=" * 80)
    print("AREA-WISE DISTRIBUTION")
    print("=" * 80)

    for area in sorted(by_area.keys()):
        tasks_in_area = by_area[area]
        print(f"\n[{area}] - {len(tasks_in_area)} tasks")

        # 서브에이전트 분포
        agents = defaultdict(int)
        for task in tasks_in_area:
            agents[task['assigned_agent']] += 1

        print("  Assigned Agents:")
        for agent, count in sorted(agents.items()):
            print(f"    - {agent}: {count}")

        # 사용도구 분포 (상위 5개)
        tools = defaultdict(int)
        for task in tasks_in_area:
            tools[task['tools']] += 1

        print("  Tools (top 5):")
        for tool, count in sorted(tools.items(), key=lambda x: -x[1])[:5]:
            print(f"    - {tool}: {count}")

    # 전체 통계
    print(f"\n" + "=" * 80)
    print("OVERALL STATISTICS")
    print("=" * 80)

    all_agents = defaultdict(int)
    all_tools = defaultdict(int)

    for task in tasks:
        all_agents[task['assigned_agent']] += 1
        all_tools[task['tools']] += 1

    print("\nAll Assigned Agents:")
    for agent, count in sorted(all_agents.items(), key=lambda x: -x[1]):
        print(f"  - {agent}: {count} ({count*100//len(tasks)}%)")

    print("\nAll Tools (top 10):")
    for tool, count in sorted(all_tools.items(), key=lambda x: -x[1])[:10]:
        print(f"  - {tool}: {count}")

    # 문제 탐지
    print(f"\n" + "=" * 80)
    print("ISSUE DETECTION")
    print("=" * 80)

    issues = []

    # O (DevOps) 영역이 devops-troubleshooter가 아닌 경우
    for task in by_area.get('O', []):
        if task['assigned_agent'] != 'devops-troubleshooter':
            issues.append(f"[{task['task_id']}] O area should use devops-troubleshooter, but uses {task['assigned_agent']}")

    # D (Database) 영역이 database-specialist가 아닌 경우
    for task in by_area.get('D', []):
        if task['assigned_agent'] != 'database-specialist':
            issues.append(f"[{task['task_id']}] D area should use database-specialist, but uses {task['assigned_agent']}")

    # T (Test) 영역이 qa-specialist가 아닌 경우
    for task in by_area.get('T', []):
        if task['assigned_agent'] not in ['qa-specialist', 'fullstack-developer']:
            issues.append(f"[{task['task_id']}] T area should use qa-specialist or fullstack-developer, but uses {task['assigned_agent']}")

    # Tools에 "Next.js"만 있는 경우 (너무 단순)
    for task in tasks:
        if task['tools'].strip().lower() in ['next.js', 'nextjs', 'next']:
            issues.append(f"[{task['task_id']}] Tools too simple: '{task['tools']}'")

    if issues:
        print(f"\nFound {len(issues)} issues:")
        for i, issue in enumerate(issues[:20], 1):  # 처음 20개만 출력
            print(f"  {i}. {issue}")
        if len(issues) > 20:
            print(f"  ... and {len(issues) - 20} more")
    else:
        print("\nNo issues found!")

    print("\n" + "=" * 80)
    print("AUDIT COMPLETE")
    print("=" * 80)

    return len(issues) == 0

if __name__ == "__main__":
    success = audit_agents_and_tools()
    exit(0 if success else 1)
