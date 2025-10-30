#!/usr/bin/env python3
"""
PROJECT GRID 자동 생성 도구 V4.0
매뉴얼 V4.0 기준 21개 속성 자동 채우기
V4.0 개편: 6개 영역 (O/D/BI/BA/F/T)
"""

import json
import re
from datetime import datetime
from typing import List, Dict, Optional

class ProjectGridGenerator:
    """프로젝트 계획서에서 PROJECT GRID SQL/CSV 자동 생성"""

    def __init__(self):
        # V4.0: 6개 영역
        self.area_map = {
            'DevOps': 'O',
            'Database': 'D',
            'Backend Infrastructure': 'BI',
            'Backend APIs': 'BA',
            'Frontend': 'F',
            'Test': 'T'
        }

        # V4.0: 영역별 담당 Agent
        self.agent_map = {
            'O': 'devops-troubleshooter',
            'D': 'database-specialist',
            'BI': 'fullstack-developer',
            'BA': 'fullstack-developer',
            'F': 'fullstack-developer',
            'T': 'qa-specialist'
        }

        self.tasks = []
        self.phase_counter = {}

    def parse_project_plan(self, plan: Dict) -> List[Dict]:
        """
        프로젝트 계획서를 파싱하여 작업 목록 생성

        Args:
            plan: 프로젝트 계획 딕셔너리
                {
                    "project_name": "정치인 검색",
                    "tech_stack": {"frontend": "React", "backend": "FastAPI"},
                    "features": [
                        {"name": "회원가입", "area": "Frontend", "phase": 1},
                        ...
                    ]
                }

        Returns:
            작업 목록 (21개 속성 포함)
        """
        tasks = []

        for feature in plan.get('features', []):
            task = self._create_task_from_feature(feature, plan)
            tasks.append(task)

        # 의존성 자동 분석
        tasks = self._analyze_dependencies(tasks)

        return tasks

    def _create_task_from_feature(self, feature: Dict, plan: Dict) -> Dict:
        """기능에서 작업 생성 (21개 속성)"""

        phase = feature.get('phase', 1)
        area_name = feature.get('area', 'Frontend')
        area_code = self.area_map.get(area_name, 'F')

        # 작업 번호 생성
        key = f"P{phase}{area_code}"
        if key not in self.phase_counter:
            self.phase_counter[key] = 0
        self.phase_counter[key] += 1
        task_num = self.phase_counter[key]

        task_id = f"P{phase}{area_code}{task_num}"

        # 기술 스택에서 도구 추출
        tech_stack = plan.get('tech_stack', {})
        tools = self._extract_tools(area_name, tech_stack)

        # 21개 속성 생성
        task = {
            # 【그리드 좌표】(2개)
            'phase': phase,
            'area': area_code,

            # 【작업 기본 정보】(9개)
            'task_id': task_id,
            'task_name': feature.get('name', ''),
            'instruction_file': f'tasks/{task_id}.md',
            'assigned_agent': self.agent_map.get(area_code, 'fullstack-developer'),
            'tools': tools,
            'work_mode': 'AI-Only',
            'dependency_chain': feature.get('depends_on', '없음'),
            'progress': 0,
            'status': '대기',

            # 【작업 실행 기록】(4개)
            'generated_files': None,
            'generator': '-',
            'duration': '-',
            'modification_history': '-',

            # 【검증】(5개)
            'test_history': '대기',
            'build_result': '⏳ 대기',
            'dependency_propagation': '⏳ 대기',
            'blocker': '없음',
            'validation_result': '⏳ 대기',

            # 【기타 정보】(1개)
            'remarks': feature.get('remarks', '')
        }

        return task

    def _extract_tools(self, area: str, tech_stack: Dict) -> str:
        """영역별 기술 스택 추출"""
        tools = []

        if area == 'Frontend':
            if 'frontend' in tech_stack:
                tools.append(tech_stack['frontend'])
            if 'ui' in tech_stack:
                tools.append(tech_stack['ui'])
        elif area in ['Backend Infrastructure', 'Backend APIs']:
            if 'backend' in tech_stack:
                tools.append(tech_stack['backend'])
            if 'api' in tech_stack:
                tools.append(tech_stack['api'])
        elif area == 'Database':
            if 'database' in tech_stack:
                tools.append(tech_stack['database'])
        elif area == 'DevOps':
            if 'devops' in tech_stack:
                tools.append(tech_stack['devops'])
        elif area == 'Test':
            if 'test' in tech_stack:
                tools.append(tech_stack['test'])

        return '/'.join(tools) if tools else 'TBD'

    def _analyze_dependencies(self, tasks: List[Dict]) -> List[Dict]:
        """의존성 자동 분석 및 업데이트"""

        # 작업 ID로 인덱싱
        task_map = {t['task_id']: t for t in tasks}

        for task in tasks:
            deps = task['dependency_chain']

            if deps and deps != '없음':
                dep_ids = [d.strip() for d in deps.split(',')]

                # 의존성 전파 확인
                all_completed = all(
                    task_map.get(dep_id, {}).get('status', '대기') == '완료'
                    for dep_id in dep_ids
                )

                if all_completed:
                    task['dependency_propagation'] = '✅ 이행'
                else:
                    # 미완료된 작업 찾기
                    pending = [
                        dep_id for dep_id in dep_ids
                        if task_map.get(dep_id, {}).get('status', '대기') != '완료'
                    ]
                    task['dependency_propagation'] = f"❌ 불이행 - {', '.join(pending)}"
                    task['blocker'] = f"{', '.join(pending)} 완료 필요"

        return tasks

    def generate_sql(self, tasks: List[Dict], table_name: str = 'project_grid_tasks') -> str:
        """Supabase INSERT SQL 생성 (V4.0)"""

        sql_lines = [
            f"-- PROJECT GRID 자동 생성 SQL V4.0",
            f"-- 생성 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"-- 작업 수: {len(tasks)}개",
            f"-- 영역: O(DevOps), D(Database), BI(Backend Infrastructure), BA(Backend APIs), F(Frontend), T(Test)",
            f"",
            f"INSERT INTO {table_name} (",
            "    phase, area, task_id, task_name, instruction_file,",
            "    assigned_agent, tools, work_mode, dependency_chain,",
            "    progress, status, generated_files, generator, duration,",
            "    modification_history, test_history, build_result,",
            "    dependency_propagation, blocker, validation_result, remarks",
            ") VALUES"
        ]

        for i, task in enumerate(tasks):
            # 값 이스케이프
            values = (
                task['phase'],
                f"'{task['area']}'",
                f"'{task['task_id']}'",
                f"'{self._escape_sql(task['task_name'])}'",
                f"'{task['instruction_file']}'",
                f"'{task['assigned_agent']}'" if task['assigned_agent'] else 'NULL',
                f"'{task['tools']}'",
                f"'{task['work_mode']}'",
                f"'{task['dependency_chain']}'",
                task['progress'],
                f"'{task['status']}'",
                'NULL' if task['generated_files'] is None else f"'{task['generated_files']}'",
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

        return '\n'.join(sql_lines)

    def _escape_sql(self, text: str) -> str:
        """SQL 문자열 이스케이프"""
        if not text:
            return ''
        return text.replace("'", "''")

    def generate_csv(self, tasks: List[Dict]) -> str:
        """CSV 형식 생성"""
        import csv
        from io import StringIO

        output = StringIO()

        # 컬럼명 (21개 속성)
        fieldnames = [
            'phase', 'area', 'task_id', 'task_name', 'instruction_file',
            'assigned_agent', 'tools', 'work_mode', 'dependency_chain',
            'progress', 'status', 'generated_files', 'generator', 'duration',
            'modification_history', 'test_history', 'build_result',
            'dependency_propagation', 'blocker', 'validation_result', 'remarks'
        ]

        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(tasks)

        return output.getvalue()


def main():
    """테스트 예제 - V4.0 영역"""

    # 예제 프로젝트 계획서
    project_plan = {
        "project_name": "정치인 검색 웹사이트",
        "tech_stack": {
            "devops": "Next.js/Vercel/GitHub Actions",
            "database": "Supabase/PostgreSQL",
            "backend": "Next.js API Routes",
            "frontend": "React/TypeScript",
            "ui": "Tailwind CSS/Shadcn",
            "test": "Playwright/Vitest"
        },
        "features": [
            # Phase 1: 인증 시스템
            {
                "name": "프로젝트 초기화",
                "area": "DevOps",
                "phase": 1,
                "depends_on": "없음",
                "remarks": "Next.js 14 설정"
            },
            {
                "name": "인증 스키마",
                "area": "Database",
                "phase": 1,
                "depends_on": "P1O1",
                "remarks": "profiles, auth_tokens 테이블"
            },
            {
                "name": "Supabase 클라이언트",
                "area": "Backend Infrastructure",
                "phase": 1,
                "depends_on": "P1D1",
                "remarks": "SSR/CSR 클라이언트"
            },
            {
                "name": "회원가입 API",
                "area": "Backend APIs",
                "phase": 1,
                "depends_on": "P1BI1",
                "remarks": "Zod 스키마 검증"
            },
            {
                "name": "회원가입 페이지",
                "area": "Frontend",
                "phase": 1,
                "depends_on": "P1BA1",
                "remarks": "5개 필드 + 약관 모달"
            },
            {
                "name": "인증 E2E 테스트",
                "area": "Test",
                "phase": 1,
                "depends_on": "P1F1",
                "remarks": "회원가입/로그인 E2E"
            },

            # Phase 2: 정치인 시스템
            {
                "name": "정치인 테이블",
                "area": "Database",
                "phase": 2,
                "depends_on": "P1D1",
                "remarks": "정치인 정보 스키마"
            },
            {
                "name": "검색 API",
                "area": "Backend APIs",
                "phase": 2,
                "depends_on": "P2D1, P1BI1",
                "remarks": "전문 검색"
            },
            {
                "name": "정치인 목록 페이지",
                "area": "Frontend",
                "phase": 2,
                "depends_on": "P2BA1",
                "remarks": "무한 스크롤"
            },
            {
                "name": "검색 E2E 테스트",
                "area": "Test",
                "phase": 2,
                "depends_on": "P2F1",
                "remarks": "검색 시나리오"
            },
        ]
    }

    # GRID 생성
    generator = ProjectGridGenerator()
    tasks = generator.parse_project_plan(project_plan)

    # SQL 생성
    sql = generator.generate_sql(tasks)

    # 파일 저장
    output_dir = "C:/Development_PoliticianFinder/Developement_Real_PoliticianFinder/0-5_Development_ProjectGrid"
    sql_path = f"{output_dir}/generated_grid_v4.sql"

    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write(sql)

    print(f"[OK] PROJECT GRID V4.0 생성 완료!")
    print(f"[INFO] 작업 수: {len(tasks)}개")
    print(f"[FILE] SQL: {sql_path}")
    print(f"\n--- 생성된 작업 목록 ---")

    for task in tasks:
        deps = task['dependency_chain'] if task['dependency_chain'] != '없음' else '-'
        print(f"{task['task_id']}: {task['task_name']} (의존: {deps})")

    # CSV도 생성
    csv_output = generator.generate_csv(tasks)
    csv_path = f"{output_dir}/generated_grid_v4.csv"

    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        f.write(csv_output)

    print(f"\n[FILE] CSV: {csv_path}")

    # 영역별 통계
    area_stats = {}
    for task in tasks:
        area = task['area']
        if area not in area_stats:
            area_stats[area] = 0
        area_stats[area] += 1

    print(f"\n--- 영역별 통계 ---")
    area_names = {
        'O': 'DevOps',
        'D': 'Database',
        'BI': 'Backend Infrastructure',
        'BA': 'Backend APIs',
        'F': 'Frontend',
        'T': 'Test'
    }
    for area in ['O', 'D', 'BI', 'BA', 'F', 'T']:
        count = area_stats.get(area, 0)
        print(f"{area} ({area_names[area]}): {count}개")


if __name__ == "__main__":
    main()
