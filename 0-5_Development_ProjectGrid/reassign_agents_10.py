#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
10개 전문 에이전트로 재배정
작업 내용에 따라 더 세밀하게 배정
"""

import json
from pathlib import Path

class AgentReassigner:
    """10개 에이전트 재배정 시스템"""

    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.tasks_file = self.base_dir / "generated_grid_full_v4.json"
        self.output_file = self.base_dir / "generated_grid_full_v4_10agents.json"

    def load_tasks(self):
        """작업 로드"""
        with open(self.tasks_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def assign_agent_by_content(self, task: dict) -> str:
        """작업 내용에 따라 에이전트 배정"""
        task_id = task['task_id']
        task_name = task['task_name']
        area = task['area']

        # Area 기본 매핑
        if area == 'O':
            return 'devops-troubleshooter'

        if area == 'D':
            return 'database-developer'

        if area == 'BI':
            return 'backend-developer'

        # BA: API 영역 (세밀하게)
        if area == 'BA':
            # 보안 관련
            if '보안' in task_name or 'security' in task_name.lower():
                return 'security-specialist'
            # 성능 관련
            if '성능' in task_name or '최적화' in task_name or 'performance' in task_name.lower():
                return 'performance-optimizer'
            # 기본: API 설계
            return 'api-designer'

        # F: Frontend 영역 (세밀하게)
        if area == 'F':
            # UI/디자인 관련
            ui_keywords = ['레이아웃', '디자인', '컴포넌트', 'layout', 'design', 'component']
            if task_id in ['P1F1', 'P1F2']:  # 전역 레이아웃, 공통 컴포넌트
                return 'ui-designer'
            if any(keyword in task_name for keyword in ui_keywords):
                # 첫 5개 작업은 ui-designer
                phase_num = int(task_id[1])
                task_num = int(''.join([c for c in task_id if c.isdigit()])[1:])
                if phase_num == 1 or task_num <= 2:
                    return 'ui-designer'
            # 기본: 기능 구현
            return 'frontend-developer'

        # T: Test 영역 (세밀하게)
        if area == 'T':
            # 코드 리뷰/품질 관련
            review_keywords = ['품질', '리뷰', 'review', 'quality', '검증', 'validation']
            if any(keyword in task_name for keyword in review_keywords):
                return 'code-reviewer'
            # Phase별로 나누기
            phase_num = int(task_id[1])
            if phase_num >= 6:  # Phase 6-7은 코드 리뷰
                return 'code-reviewer'
            # 기본: E2E 테스트
            return 'test-engineer'

        return 'fullstack-developer'  # fallback

    def reassign_all_tasks(self):
        """모든 작업 재배정"""
        print("="*80)
        print("10개 전문 에이전트 재배정")
        print("="*80)

        tasks = self.load_tasks()
        print(f"\n[LOAD] {len(tasks)} tasks")

        # 통계
        agent_counts = {}

        # 재배정
        for task in tasks:
            new_agent = self.assign_agent_by_content(task)
            old_agent = task.get('assigned_agent', 'unknown')

            task['assigned_agent'] = new_agent

            # 통계
            agent_counts[new_agent] = agent_counts.get(new_agent, 0) + 1

            # 변경된 경우 출력
            if old_agent != new_agent:
                print(f"  [CHANGE] {task['task_id']}: {old_agent} → {new_agent}")

        # 통계 출력
        print(f"\n{'='*80}")
        print("에이전트 배정 통계")
        print(f"{'='*80}")

        for agent, count in sorted(agent_counts.items(), key=lambda x: -x[1]):
            percentage = count * 100 // len(tasks)
            print(f"  {agent:30s}: {count:3d} tasks ({percentage:2d}%)")

        print(f"\n총 사용 에이전트: {len(agent_counts)}개")

        # 저장
        with open(self.output_file, 'w', encoding='utf-8') as f:
            json.dump(tasks, f, ensure_ascii=False, indent=2)

        print(f"\n[SAVE] {self.output_file}")

        # SQL도 재생성
        self.generate_sql(tasks)

        print(f"\n{'='*80}")
        print("재배정 완료!")
        print(f"{'='*80}")

        return agent_counts

    def generate_sql(self, tasks):
        """SQL 재생성"""
        from datetime import datetime

        sql_lines = [
            f"-- PROJECT GRID 자동 생성 SQL V4.0 (10 Agents)",
            f"-- 생성 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"-- 작업 수: {len(tasks)}개",
            f"",
            f"-- 기존 데이터 삭제 (필요시 주석 해제)",
            f"-- DELETE FROM project_grid_tasks;",
            f"",
            f"INSERT INTO project_grid_tasks (",
            "    phase, area, task_id, task_name, instruction_file,",
            "    assigned_agent, tools, work_mode, dependency_chain,",
            "    progress, status, generated_files, generator, duration,",
            "    modification_history, test_history, build_result,",
            "    dependency_propagation, blocker, validation_result, remarks",
            ") VALUES"
        ]

        for i, task in enumerate(tasks):
            values = (
                task['phase'],
                f"'{task['area']}'",
                f"'{task['task_id']}'",
                f"'{self._escape_sql(task['task_name'])}'",
                f"'{task['instruction_file']}'",
                f"'{task['assigned_agent']}'",
                f"'{self._escape_sql(task['tools'])}'",
                f"'{task['work_mode']}'",
                f"'{self._escape_sql(task['dependency_chain'])}'",
                task['progress'],
                f"'{task['status']}'",
                f"'{self._escape_sql(task['generated_files'])}'",
                f"'{task['generator']}'",
                f"'{task['duration']}'",
                f"'{task['modification_history']}'",
                f"'{task['test_history']}'",
                f"'{task['build_result']}'",
                f"'{task['dependency_propagation']}'",
                f"'{task['blocker']}'",
                f"'{task['validation_result']}'",
                f"'{self._escape_sql(task['remarks'])}'"
            )

            comma = "," if i < len(tasks) - 1 else ";"
            sql_lines.append(f"({', '.join(map(str, values))}){comma}")

        sql_file = self.base_dir / "generated_grid_full_v4_10agents.sql"
        with open(sql_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sql_lines))

        print(f"[SAVE] {sql_file}")

    def _escape_sql(self, text: str) -> str:
        """SQL 이스케이프"""
        if not text:
            return ''
        return text.replace("'", "''").replace('\n', ' ')


def main():
    reassigner = AgentReassigner()
    agent_counts = reassigner.reassign_all_tasks()

    print(f"\n\n10개 전문 에이전트 활용:")
    print(f"  1. devops-troubleshooter")
    print(f"  2. database-developer")
    print(f"  3. backend-developer")
    print(f"  4. api-designer")
    print(f"  5. frontend-developer")
    print(f"  6. test-engineer")
    print(f"  7. ui-designer")
    print(f"  8. code-reviewer")
    print(f"  9. security-specialist")
    print(f" 10. performance-optimizer")


if __name__ == "__main__":
    main()
